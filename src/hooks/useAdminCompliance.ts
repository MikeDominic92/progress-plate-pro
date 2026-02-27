import { useMemo } from 'react';
import type { PlateauStatus } from '@/utils/progressionEngine';
import { DAILY_TARGETS } from '@/hooks/useNutritionTracker';
import type { DailyNutrition } from '@/hooks/useAdminNutrition';

interface ComplianceInput {
  /** Completed sessions from useAdminSessionHistory */
  sessions: { session_date: string }[];
  /** All exercise history from useProgression */
  allHistory: Record<string, import('@/utils/progressionEngine').SetRecord[]>;
  /** getPlateauStatus from useProgression */
  getPlateauStatus: (name: string) => PlateauStatus;
  /** Daily nutrition logs from useAdminNutrition */
  dailyLogs: DailyNutrition[];
  /** Weight logs from useWeightTracker */
  weightLogs: { date: string; weight: number }[];
  /** Goal weight from useWeightTracker */
  goalWeight: number | null;
}

export interface ComplianceFlag {
  category: 'consistency' | 'nutrition' | 'progression' | 'weight';
  message: string;
  severity: 'warning' | 'danger';
}

export interface ComplianceResult {
  overallScore: number;
  isOnTrack: boolean;
  consistencyScore: number;
  nutritionScore: number;
  progressionScore: number;
  weightScore: number;
  flags: ComplianceFlag[];
  weeklySessionCount: number;
  currentStreak: number;
}

const TARGET_SESSIONS_PER_WEEK = 3;

export function useAdminCompliance(input: ComplianceInput): ComplianceResult {
  return useMemo(() => {
    const { sessions, allHistory, getPlateauStatus, dailyLogs, weightLogs, goalWeight } = input;
    const flags: ComplianceFlag[] = [];

    // --- Consistency (30%) ---
    // Sessions this calendar week (Mon-Sun)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const sessionsThisWeek = sessions.filter(s => s.session_date >= weekStartStr).length;
    const consistencyScore = Math.min(100, Math.round((sessionsThisWeek / TARGET_SESSIONS_PER_WEEK) * 100));

    if (sessionsThisWeek < TARGET_SESSIONS_PER_WEEK) {
      const remaining = TARGET_SESSIONS_PER_WEEK - sessionsThisWeek;
      flags.push({
        category: 'consistency',
        message: `${remaining} more session${remaining > 1 ? 's' : ''} needed this week`,
        severity: sessionsThisWeek === 0 ? 'danger' : 'warning',
      });
    }

    // Streak calculation
    let currentStreak = 0;
    const sortedDates = [...new Set(sessions.map(s => s.session_date))].sort().reverse();
    if (sortedDates.length > 0) {
      // Group sessions by week and count consecutive weeks with >= 1 session
      const weekBuckets = new Map<string, number>();
      for (const d of sortedDates) {
        const dt = new Date(d);
        const weekNum = getISOWeekKey(dt);
        weekBuckets.set(weekNum, (weekBuckets.get(weekNum) || 0) + 1);
      }
      const currentWeekKey = getISOWeekKey(now);
      const weekKeys = [...weekBuckets.keys()].sort().reverse();
      for (const wk of weekKeys) {
        if (wk === currentWeekKey || currentStreak > 0) {
          if (weekBuckets.get(wk)! > 0) {
            currentStreak++;
          } else {
            break;
          }
        } else {
          // Check if it's the previous week
          break;
        }
      }
    }

    // --- Nutrition (30%) ---
    // Days with protein >= 120g AND calories <= 1650 / days logged (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const recentNutrition = dailyLogs.filter(d => d.date >= sevenDaysAgoStr);
    const nutritionDaysLogged = recentNutrition.length;

    const nutritionDaysOnTarget = recentNutrition.filter(
      d => d.protein >= DAILY_TARGETS.protein && d.calories <= DAILY_TARGETS.calories + 150
    ).length;

    const nutritionScore = nutritionDaysLogged > 0
      ? Math.round((nutritionDaysOnTarget / nutritionDaysLogged) * 100)
      : 0;

    if (nutritionDaysLogged === 0) {
      flags.push({
        category: 'nutrition',
        message: 'No nutrition data logged in the past 7 days',
        severity: 'danger',
      });
    } else {
      const lowProteinDays = recentNutrition.filter(d => d.protein < DAILY_TARGETS.protein).length;
      if (lowProteinDays >= 3) {
        flags.push({
          category: 'nutrition',
          message: `Protein low ${lowProteinDays} of ${nutritionDaysLogged} days`,
          severity: lowProteinDays >= 5 ? 'danger' : 'warning',
        });
      }
      const highCalDays = recentNutrition.filter(d => d.calories > DAILY_TARGETS.calories + 150).length;
      if (highCalDays >= 3) {
        flags.push({
          category: 'nutrition',
          message: `Calories over target ${highCalDays} of ${nutritionDaysLogged} days`,
          severity: 'warning',
        });
      }
    }

    // --- Progression (30%) ---
    // Exercises without plateau / total tracked exercises
    const trackedExercises = Object.keys(allHistory).filter(
      name => allHistory[name].length >= 3
    );
    const plateauedExercises = trackedExercises.filter(
      name => getPlateauStatus(name).isPlateaued
    );
    const nonPlateaued = trackedExercises.length - plateauedExercises.length;
    const progressionScore = trackedExercises.length > 0
      ? Math.round((nonPlateaued / trackedExercises.length) * 100)
      : 100; // No data = assume ok

    for (const name of plateauedExercises) {
      flags.push({
        category: 'progression',
        message: `Plateau on ${name}`,
        severity: 'warning',
      });
    }

    // --- Body Weight (10%) ---
    // Trending toward goal weight
    let weightScore = 50; // neutral default
    if (weightLogs.length >= 2 && goalWeight != null) {
      const sorted = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date));
      const latest = sorted[sorted.length - 1].weight;
      const previous = sorted[Math.max(0, sorted.length - 4)].weight; // ~1 week ago
      const startWeight = sorted[0].weight;

      const needsToLose = startWeight > goalWeight;
      const delta = latest - previous;

      if (needsToLose) {
        // Want weight going down
        if (delta < 0) weightScore = 100;
        else if (delta === 0) weightScore = 50;
        else weightScore = 20;
      } else {
        // Want weight going up
        if (delta > 0) weightScore = 100;
        else if (delta === 0) weightScore = 50;
        else weightScore = 20;
      }

      if (weightScore <= 20) {
        flags.push({
          category: 'weight',
          message: needsToLose
            ? `Weight trending up (+${delta.toFixed(1)} lb) instead of toward goal`
            : `Weight trending down (${delta.toFixed(1)} lb) instead of toward goal`,
          severity: 'warning',
        });
      }
    }

    // --- Composite Score ---
    const overallScore = Math.round(
      consistencyScore * 0.3 +
      nutritionScore * 0.3 +
      progressionScore * 0.3 +
      weightScore * 0.1
    );

    const isOnTrack = overallScore >= 70;

    return {
      overallScore,
      isOnTrack,
      consistencyScore,
      nutritionScore,
      progressionScore,
      weightScore,
      flags,
      weeklySessionCount: sessionsThisWeek,
      currentStreak,
    };
  }, [input]);
}

/** Returns "YYYY-WW" ISO week key for grouping */
function getISOWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
  );
  return `${d.getFullYear()}-${String(weekNum).padStart(2, '0')}`;
}
