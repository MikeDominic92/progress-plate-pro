import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface UserSettings {
  daily_targets: { calories: number; protein: number; carbs: number; fat: number };
  weight_unit: 'lb' | 'kg';
}

export const DEFAULT_SETTINGS: UserSettings = {
  daily_targets: { calories: 1200, protein: 120, carbs: 90, fat: 40 },
  weight_unit: 'lb',
};

const LB_TO_KG = 0.453592;

export function useSettings(username: string) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!username.trim()) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('username', username.trim())
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const prefs = (data?.preferences as Record<string, unknown>) || {};
      const stored = prefs.settings as UserSettings | undefined;
      if (stored) {
        setSettings({
          daily_targets: stored.daily_targets || DEFAULT_SETTINGS.daily_targets,
          weight_unit: stored.weight_unit || DEFAULT_SETTINGS.weight_unit,
        });
      }
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (partial: Partial<UserSettings>) => {
    if (!username.trim()) return;

    const updated = { ...settings, ...partial };
    setSettings(updated);

    const { data: existing } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('username', username.trim())
      .single();

    const currentPrefs = (existing?.preferences as Record<string, unknown>) || {};
    const updatedPrefs = {
      ...currentPrefs,
      settings: updated,
    };

    await supabase
      .from('profiles')
      .update({ preferences: updatedPrefs as unknown as Json })
      .eq('username', username.trim());
  }, [username, settings]);

  const formatWeight = useCallback((lbValue: number): string => {
    if (settings.weight_unit === 'kg') {
      return `${(lbValue * LB_TO_KG).toFixed(1)} kg`;
    }
    return `${lbValue} lb`;
  }, [settings.weight_unit]);

  return { settings, updateSettings, loading, formatWeight };
}
