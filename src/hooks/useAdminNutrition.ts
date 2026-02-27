import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DAILY_TARGETS } from '@/hooks/useNutritionTracker';
import type { MealEntry } from '@/hooks/useNutritionTracker';

export interface DailyNutrition {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
}

interface UseAdminNutritionReturn {
  dailyLogs: DailyNutrition[];
  daysLogged: number;
  daysOnTarget: number;
  avgCalories: number;
  avgProtein: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useAdminNutrition(username = 'Kara'): UseAdminNutritionReturn {
  const [dailyLogs, setDailyLogs] = useState<DailyNutrition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNutrition = useCallback(async () => {
    try {
      // Resolve Kara's user_id via user_roles table
      const { data: roleData, error: roleErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('username', username)
        .maybeSingle();

      if (roleErr || !roleData?.user_id) {
        // Fallback: try to find via auth user if this is the logged-in admin
        console.warn('Could not resolve user_id for', username, roleErr);
        setDailyLogs([]);
        return;
      }

      const userId = roleData.user_id;

      // Fetch last 30 days of nutrition logs
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];

      const { data: logs, error: logErr } = await supabase
        .from('nutrition_logs')
        .select('log_date, meals')
        .eq('user_id', userId)
        .gte('log_date', startDate)
        .order('log_date', { ascending: true });

      if (logErr) {
        console.error('Nutrition fetch error:', logErr);
        return;
      }

      if (!logs || logs.length === 0) {
        setDailyLogs([]);
        return;
      }

      // Process each day's meals into totals
      const processed: DailyNutrition[] = logs.map(log => {
        const meals = (log.meals as MealEntry[]) || [];
        const totals = meals.reduce(
          (acc, meal) => ({
            calories: acc.calories + (meal.totals?.calories || 0),
            protein: acc.protein + (meal.totals?.protein || 0),
            carbs: acc.carbs + (meal.totals?.carbs || 0),
            fat: acc.fat + (meal.totals?.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        return {
          date: log.log_date,
          calories: Math.round(totals.calories),
          protein: Math.round(totals.protein),
          carbs: Math.round(totals.carbs),
          fat: Math.round(totals.fat),
          mealCount: meals.length,
        };
      });

      setDailyLogs(processed);
    } catch (err) {
      console.error('useAdminNutrition error:', err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchNutrition();
  }, [fetchNutrition]);

  // Derived stats
  const daysLogged = dailyLogs.length;

  const daysOnTarget = dailyLogs.filter(
    d => d.protein >= DAILY_TARGETS.protein && d.calories <= DAILY_TARGETS.calories + 150
  ).length;

  const avgCalories = daysLogged > 0
    ? Math.round(dailyLogs.reduce((s, d) => s + d.calories, 0) / daysLogged)
    : 0;

  const avgProtein = daysLogged > 0
    ? Math.round(dailyLogs.reduce((s, d) => s + d.protein, 0) / daysLogged)
    : 0;

  return {
    dailyLogs,
    daysLogged,
    daysOnTarget,
    avgCalories,
    avgProtein,
    loading,
    refresh: fetchNutrition,
  };
}
