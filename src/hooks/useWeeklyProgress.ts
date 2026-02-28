import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfWeek, getISOWeek } from 'date-fns';
import type { DailyTargets, MealEntry } from '@/hooks/useNutritionTracker';
import { DAILY_TARGETS } from '@/hooks/useNutritionTracker';

interface WeeklyVolume {
  weekLabel: string;
  totalVolume: number;
}

interface WeightPoint {
  date: string;
  weight: number;
}

interface HeatmapDay {
  date: string;
  hasSession: boolean;
  isToday: boolean;
}

export interface WeeklyProgressData {
  weeklyVolumes: WeeklyVolume[];
  macroAdherencePct: number;
  macroAdherenceDays: { date: string; hit: boolean }[];
  recentWeights: WeightPoint[];
  sessionsThisWeek: number;
  prsThisWeek: number;
  currentStreak: number;
  heatmapWeeks: HeatmapDay[][];
  loading: boolean;
}

export function useWeeklyProgress(
  username: string,
  completedDayDates: string[],
  allPRs: { date: string }[],
  currentStreak: number,
  weightLogs: WeightPoint[],
  targets?: DailyTargets,
): WeeklyProgressData {
  const [weeklyVolumes, setWeeklyVolumes] = useState<WeeklyVolume[]>([]);
  const [macroAdherencePct, setMacroAdherencePct] = useState(0);
  const [macroAdherenceDays, setMacroAdherenceDays] = useState<{ date: string; hit: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  const effectiveTargets = targets || DAILY_TARGETS;

  const fetchData = useCallback(async () => {
    if (!username.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch session analytics for weekly volumes (last 28 days)
      const fourWeeksAgo = subDays(new Date(), 28);
      const { data: setEvents } = await supabase
        .from('session_analytics')
        .select('weight, reps, timestamp')
        .eq('username', username)
        .eq('event_type', 'set_completed')
        .gte('timestamp', fourWeeksAgo.toISOString());

      // Group by ISO week
      const weekMap = new Map<string, number>();
      if (setEvents) {
        for (const ev of setEvents) {
          if (!ev.timestamp) continue;
          const d = new Date(ev.timestamp);
          const weekStart = startOfWeek(d, { weekStartsOn: 1 });
          const weekLabel = `W${getISOWeek(d)} (${format(weekStart, 'M/d')})`;
          const vol = (ev.weight || 0) * (ev.reps || 0);
          weekMap.set(weekLabel, (weekMap.get(weekLabel) || 0) + vol);
        }
      }

      const volumes = Array.from(weekMap.entries())
        .map(([weekLabel, totalVolume]) => ({ weekLabel, totalVolume }))
        .sort((a, b) => a.weekLabel.localeCompare(b.weekLabel))
        .slice(-4);

      setWeeklyVolumes(volumes);

      // Fetch 7 days of nutrition logs for macro adherence
      const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
      const { data: nutritionLogs } = await supabase
        .from('nutrition_logs')
        .select('log_date, meals')
        .eq('user_id', user.id)
        .gte('log_date', sevenDaysAgo);

      const adherenceDays: { date: string; hit: boolean }[] = [];
      let hitCount = 0;
      const t = effectiveTargets;

      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const dayLog = nutritionLogs?.find(l => l.log_date === date);
        let hit = false;

        if (dayLog?.meals && Array.isArray(dayLog.meals)) {
          const meals = dayLog.meals as MealEntry[];
          const totals = meals.reduce(
            (acc, m) => ({
              calories: acc.calories + (m.totals?.calories || 0),
              protein: acc.protein + (m.totals?.protein || 0),
              carbs: acc.carbs + (m.totals?.carbs || 0),
              fat: acc.fat + (m.totals?.fat || 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          );

          const within10 = (consumed: number, target: number) =>
            target > 0 && Math.abs(consumed - target) / target <= 0.1;

          hit = within10(totals.calories, t.calories)
            && within10(totals.protein, t.protein)
            && within10(totals.carbs, t.carbs)
            && within10(totals.fat, t.fat);
        }

        if (hit) hitCount++;
        adherenceDays.push({ date, hit });
      }

      setMacroAdherenceDays(adherenceDays);
      setMacroAdherencePct(Math.round((hitCount / 7) * 100));
    } catch (err) {
      console.error('useWeeklyProgress error:', err);
    } finally {
      setLoading(false);
    }
  }, [username, effectiveTargets]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sessions this week
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const sessionsThisWeek = completedDayDates.filter(d => new Date(d + 'T00:00:00') >= weekStart).length;

  // PRs this week
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const prsThisWeek = allPRs.filter(pr => pr.date >= weekStartStr).length;

  // Recent weights (last 14 days)
  const fourteenDaysAgo = format(subDays(now, 14), 'yyyy-MM-dd');
  const recentWeights = weightLogs
    .filter(w => w.date >= fourteenDaysAgo)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Heatmap (7 weeks, 49 days)
  const sessionDateSet = new Set(completedDayDates);
  const heatmapDays: HeatmapDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 48; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    heatmapDays.push({
      date: dateStr,
      hasSession: sessionDateSet.has(dateStr),
      isToday: i === 0,
    });
  }

  const heatmapWeeks: HeatmapDay[][] = [];
  for (let i = 0; i < heatmapDays.length; i += 7) {
    heatmapWeeks.push(heatmapDays.slice(i, i + 7));
  }

  return {
    weeklyVolumes,
    macroAdherencePct,
    macroAdherenceDays,
    recentWeights,
    sessionsThisWeek,
    prsThisWeek,
    currentStreak,
    heatmapWeeks,
    loading,
  };
}
