import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WeightLog {
  date: string;
  weight: number;
}

interface WeightTracking {
  goal_weight: number | null;
  weight_logs: WeightLog[];
}

export function useWeightTracker(username: string) {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeightData = useCallback(async () => {
    if (!username.trim()) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('username', username.trim())
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const prefs = (data?.preferences as Record<string, unknown>) || {};
      const wt = (prefs.weight_tracking as WeightTracking) || { goal_weight: null, weight_logs: [] };
      setWeightLogs(wt.weight_logs || []);
      setGoalWeight(wt.goal_weight ?? null);
    } catch {
      setWeightLogs([]);
      setGoalWeight(null);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchWeightData();
  }, [fetchWeightData]);

  const writeWeightData = async (logs: WeightLog[], goal: number | null) => {
    if (!username.trim()) return;

    const { data: existing } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('username', username.trim())
      .single();

    const currentPrefs = (existing?.preferences as Record<string, unknown>) || {};
    const updatedPrefs = {
      ...currentPrefs,
      weight_tracking: { goal_weight: goal, weight_logs: logs },
    };

    const { error } = await supabase
      .from('profiles')
      .update({ preferences: updatedPrefs as unknown as import('@/integrations/supabase/types').Json })
      .eq('username', username.trim());

    if (error) throw error;
  };

  const logWeight = async (date: string, weight: number) => {
    const updated = [...weightLogs.filter(l => l.date !== date), { date, weight }]
      .sort((a, b) => a.date.localeCompare(b.date));
    await writeWeightData(updated, goalWeight);
    setWeightLogs(updated);
  };

  const updateGoalWeight = async (goal: number | null) => {
    await writeWeightData(weightLogs, goal);
    setGoalWeight(goal);
  };

  const deleteWeightLog = async (date: string) => {
    const updated = weightLogs.filter(l => l.date !== date);
    await writeWeightData(updated, goalWeight);
    setWeightLogs(updated);
  };

  const latestWeight = weightLogs.length > 0
    ? weightLogs[weightLogs.length - 1].weight
    : null;

  const weightDelta = weightLogs.length >= 2
    ? weightLogs[weightLogs.length - 1].weight - weightLogs[weightLogs.length - 2].weight
    : null;

  const weightDatesSet = new Set(weightLogs.map(l => l.date));

  return {
    weightLogs,
    goalWeight,
    latestWeight,
    weightDelta,
    weightDatesSet,
    loading,
    logWeight,
    updateGoalWeight,
    deleteWeightLog,
  };
}
