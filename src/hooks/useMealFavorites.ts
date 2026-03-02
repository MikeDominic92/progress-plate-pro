import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { FoodItem } from '@/hooks/useNutritionTracker';
import { supabaseRetry } from '@/lib/supabaseRetry';

export interface MealFavorite {
  id: string;
  name: string;
  items: FoodItem[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  createdAt: string;
}

const MAX_FAVORITES = 20;

export function useMealFavorites(username: string) {
  const [favorites, setFavorites] = useState<MealFavorite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!username.trim()) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('username', username.trim())
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const prefs = (data?.preferences as Record<string, unknown>) || {};
      const stored = prefs.meal_favorites as MealFavorite[] | undefined;
      if (stored && Array.isArray(stored)) {
        setFavorites(stored);
      }
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const writeFavorites = async (updated: MealFavorite[]) => {
    if (!username.trim()) return;

    const { data: existing } = await supabaseRetry(
      () => supabase
        .from('profiles')
        .select('preferences')
        .eq('username', username.trim())
        .single(),
      { maxRetries: 2 },
    );

    const currentPrefs = (existing?.preferences as Record<string, unknown>) || {};
    const updatedPrefs = {
      ...currentPrefs,
      meal_favorites: updated,
    };

    await supabaseRetry(
      () => supabase
        .from('profiles')
        .update({ preferences: updatedPrefs as unknown as Json })
        .eq('username', username.trim()),
      { maxRetries: 2 },
    );
  };

  const addFavorite = useCallback(async (meal: { items: FoodItem[]; totals: { calories: number; protein: number; carbs: number; fat: number } }) => {
    const name = meal.items.map(i => i.name).join(', ');
    const fav: MealFavorite = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.length > 60 ? name.slice(0, 57) + '...' : name,
      items: meal.items,
      totals: meal.totals,
      createdAt: new Date().toISOString(),
    };

    const updated = [fav, ...favorites].slice(0, MAX_FAVORITES);
    setFavorites(updated);
    await writeFavorites(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- writeFavorites is not memoized; adding it would cause infinite re-renders
  }, [favorites, username]);

  const removeFavorite = useCallback(async (id: string) => {
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    await writeFavorites(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- writeFavorites is not memoized; adding it would cause infinite re-renders
  }, [favorites, username]);

  const isFavorited = useCallback((meal: { items: FoodItem[] }): boolean => {
    const mealNames = meal.items.map(i => i.name).sort().join(',');
    return favorites.some(f => f.items.map(i => i.name).sort().join(',') === mealNames);
  }, [favorites]);

  return { favorites, addFavorite, removeFavorite, isFavorited, loading };
}
