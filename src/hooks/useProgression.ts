import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  SetRecord,
  ProgressionSuggestion,
  PersonalRecord,
  PlateauStatus,
  WeightTrendPoint,
  computeSuggestion,
  detectPRs,
  detectPlateau,
  buildWeightTrend,
} from '@/utils/progressionEngine';

interface SessionSummary {
  date: string;
  sets: SetRecord[];
}

interface UseProgressionReturn {
  getSuggestion: (exerciseName: string, setType: string, setNumber: number) => ProgressionSuggestion;
  checkForPR: (exerciseName: string, setType: string, weight: number, reps: number) => PersonalRecord[];
  getLastSession: (exerciseName: string) => SessionSummary | null;
  getWeightTrend: (exerciseName: string, setType: string) => WeightTrendPoint[];
  getPlateauStatus: (exerciseName: string) => PlateauStatus;
  savePersonalRecords: (prs: PersonalRecord[]) => Promise<void>;
  refreshHistory: () => Promise<void>;
  completedSessionCount: number;
  allHistory: Record<string, SetRecord[]>;
  recentSessions: { date: string; totalVolume: number; prCount: number; rpe?: number | null }[];
  allPRs: PersonalRecord[];
  totalVolumeAllTime: number;
  loading: boolean;
}

export function useProgression(username: string): UseProgressionReturn {
  const [allHistory, setAllHistory] = useState<Record<string, SetRecord[]>>({});
  const [completedSessionCount, setCompletedSessionCount] = useState(0);
  const [allPRs, setAllPRs] = useState<PersonalRecord[]>([]);
  const [recentSessions, setRecentSessions] = useState<{ date: string; totalVolume: number; prCount: number; rpe?: number | null }[]>([]);
  const [totalVolumeAllTime, setTotalVolumeAllTime] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!username) return;

    try {
      // Fetch set_completed events for this user (last 90 days, max 500)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const { data: setEvents, error } = await supabase
        .from('session_analytics')
        .select('exercise_name, weight, reps, set_number, timestamp, session_id, event_data')
        .eq('username', username)
        .eq('event_type', 'set_completed')
        .gte('timestamp', ninetyDaysAgo.toISOString())
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching progression history:', error);
        return;
      }

      // Group by exercise name
      const grouped: Record<string, SetRecord[]> = {};
      if (setEvents) {
        for (const event of setEvents) {
          const name = event.exercise_name || '';
          if (!name) continue;

          if (!grouped[name]) grouped[name] = [];

          const setType = event.event_data?.setType || event.event_data?.set_type || 'Heavy/Top Set';
          grouped[name].push({
            date: event.timestamp ? new Date(event.timestamp).toISOString().split('T')[0] : '',
            weight: event.weight || 0,
            reps: event.reps || 0,
            setNumber: event.set_number || 0,
            setType,
            sessionId: event.session_id || undefined,
          });
        }
      }

      setAllHistory(grouped);

      // Compute total volume across all time
      let totalVol = 0;
      for (const records of Object.values(grouped)) {
        for (const r of records) {
          totalVol += r.weight * r.reps;
        }
      }
      setTotalVolumeAllTime(totalVol);

      // Count completed sessions
      const { data: sessions, error: sessError } = await supabase
        .from('workout_sessions')
        .select('id, session_date, workout_data')
        .eq('username', username)
        .eq('current_phase', 'completed');

      if (!sessError && sessions) {
        setCompletedSessionCount(sessions.length);

        // Build recent sessions summary
        const sessionDates = [...new Set(sessions.map(s => s.session_date))].sort().reverse().slice(0, 5);
        const recent = sessionDates.map(date => {
          let totalVolume = 0;
          for (const records of Object.values(grouped)) {
            for (const r of records) {
              if (r.date === date) {
                totalVolume += r.weight * r.reps;
              }
            }
          }
          const session = sessions.find(s => s.session_date === date);
          const wd = session?.workout_data as Record<string, unknown> | null;
          const rpe = (wd?.rpe as number) ?? null;
          return { date, totalVolume, prCount: 0, rpe };
        });
        setRecentSessions(recent);
      }

      // Fetch stored PRs from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('personal_records')
        .eq('username', username)
        .single();

      if (profile?.personal_records && Array.isArray(profile.personal_records)) {
        setAllPRs(profile.personal_records as PersonalRecord[]);
        // Update PR counts in recent sessions
        const prs = profile.personal_records as PersonalRecord[];
        setRecentSessions(prev => prev.map(s => ({
          ...s,
          prCount: prs.filter(pr => pr.date === s.date).length,
        })));
      }
    } catch (err) {
      console.error('useProgression fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getSuggestion = useCallback((
    exerciseName: string,
    setType: string,
    _setNumber: number
  ): ProgressionSuggestion => {
    const exerciseHistory = allHistory[exerciseName] || [];
    // Filter to matching set type
    const filteredHistory = exerciseHistory.filter(h => h.setType === setType);
    return computeSuggestion(exerciseName, setType, filteredHistory, completedSessionCount);
  }, [allHistory, completedSessionCount]);

  const checkForPR = useCallback((
    exerciseName: string,
    setType: string,
    weight: number,
    reps: number
  ): PersonalRecord[] => {
    const exerciseHistory = allHistory[exerciseName] || [];
    const filteredHistory = exerciseHistory.filter(h => h.setType === setType);
    const today = new Date().toISOString().split('T')[0];
    return detectPRs(exerciseName, setType, weight, reps, filteredHistory, today);
  }, [allHistory]);

  const getLastSession = useCallback((exerciseName: string): SessionSummary | null => {
    const exerciseHistory = allHistory[exerciseName] || [];
    if (exerciseHistory.length === 0) return null;

    const sorted = [...exerciseHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastDate = sorted[0].date;
    const lastSets = sorted.filter(h => h.date === lastDate);

    return { date: lastDate, sets: lastSets };
  }, [allHistory]);

  const getWeightTrend = useCallback((
    exerciseName: string,
    setType: string
  ): WeightTrendPoint[] => {
    const exerciseHistory = allHistory[exerciseName] || [];
    const filtered = exerciseHistory.filter(h => h.setType === setType);
    return buildWeightTrend(filtered);
  }, [allHistory]);

  const getPlateauStatus = useCallback((exerciseName: string): PlateauStatus => {
    const exerciseHistory = allHistory[exerciseName] || [];
    return detectPlateau(exerciseName, exerciseHistory);
  }, [allHistory]);

  const savePersonalRecords = useCallback(async (newPRs: PersonalRecord[]) => {
    if (!username || newPRs.length === 0) return;

    try {
      // Merge with existing PRs (keep best per exercise+setType+prType)
      const merged = [...allPRs];
      for (const pr of newPRs) {
        const existingIdx = merged.findIndex(
          e => e.exerciseName === pr.exerciseName && e.setType === pr.setType && e.prType === pr.prType
        );
        if (existingIdx >= 0) {
          if (pr.value > merged[existingIdx].value) {
            merged[existingIdx] = pr;
          }
        } else {
          merged.push(pr);
        }
      }

      await supabase
        .from('profiles')
        .update({ personal_records: merged as unknown as Record<string, unknown>[] })
        .eq('username', username);

      setAllPRs(merged);
    } catch (err) {
      console.error('Failed to save PRs:', err);
    }
  }, [username, allPRs]);

  const refreshHistory = useCallback(async () => {
    await fetchHistory();
  }, [fetchHistory]);

  return {
    getSuggestion,
    checkForPR,
    getLastSession,
    getWeightTrend,
    getPlateauStatus,
    savePersonalRecords,
    refreshHistory,
    completedSessionCount,
    allHistory,
    recentSessions,
    allPRs,
    totalVolumeAllTime,
    loading,
  };
}
