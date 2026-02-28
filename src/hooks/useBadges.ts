import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { BADGE_DEFINITIONS, type BadgeStats } from '@/data/badgeDefinitions';

export function useBadges(username: string) {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBadges = useCallback(async () => {
    if (!username.trim()) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('username', username.trim())
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const prefs = (data?.preferences as Record<string, unknown>) || {};
      const stored = prefs.unlocked_badges as string[] | undefined;
      if (stored && Array.isArray(stored)) {
        setUnlockedIds(stored);
      }
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const checkAndUnlock = useCallback(async (stats: BadgeStats) => {
    if (!username.trim() || loading) return;

    const newBadges: string[] = [];
    for (const badge of BADGE_DEFINITIONS) {
      if (!unlockedIds.includes(badge.id) && badge.checkFn(stats)) {
        newBadges.push(badge.id);
      }
    }

    if (newBadges.length === 0) return;

    const allUnlocked = [...unlockedIds, ...newBadges];
    setUnlockedIds(allUnlocked);
    setNewlyUnlocked(newBadges);

    // Persist to preferences
    const { data: existing } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('username', username.trim())
      .single();

    const currentPrefs = (existing?.preferences as Record<string, unknown>) || {};
    const updatedPrefs = {
      ...currentPrefs,
      unlocked_badges: allUnlocked,
    };

    await supabase
      .from('profiles')
      .update({ preferences: updatedPrefs as unknown as Json })
      .eq('username', username.trim());
  }, [username, unlockedIds, loading]);

  const dismissCelebration = useCallback(() => {
    setNewlyUnlocked([]);
  }, []);

  return { unlockedIds, newlyUnlocked, checkAndUnlock, dismissCelebration, loading };
}
