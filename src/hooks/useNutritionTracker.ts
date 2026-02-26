import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealEntry {
  id: string;
  time: string;
  items: FoodItem[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  photoBase64?: string;
}

export interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Kara: 5'0", 20yo, 134 lbs, goal 120 lbs, active 3x/week
// BMR ~1,300 * 1.55 TDEE ~2,015 - 500 deficit = ~1,500
export const DAILY_TARGETS: DailyTargets = {
  calories: 1500,
  protein: 120,
  carbs: 145,
  fat: 50,
};

const STORAGE_PREFIX = 'nutrition_log_';
const GEMINI_PROXY = '/.netlify/functions/gemini-proxy';

function getStorageKey(date: string) {
  return `${STORAGE_PREFIX}${date}`;
}

/** Strip photoBase64 from meals before saving to Supabase (saves bandwidth/storage). */
function mealsForCloud(meals: MealEntry[]): MealEntry[] {
  return meals.map(({ photoBase64, ...rest }) => rest);
}

export function useNutritionTracker() {
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncVersion = useRef(0);

  // Load meals: try Supabase first, fall back to localStorage
  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 1. Try localStorage immediately for fast paint
      try {
        const stored = localStorage.getItem(getStorageKey(selectedDate));
        if (stored && !cancelled) {
          setMeals(JSON.parse(stored));
        }
      } catch { /* ignore */ }

      // 2. Then fetch from Supabase (source of truth)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data, error: fetchErr } = await supabase
          .from('nutrition_logs')
          .select('meals')
          .eq('user_id', user.id)
          .eq('log_date', selectedDate)
          .maybeSingle();

        if (fetchErr) {
          console.error('Supabase load error:', fetchErr);
          return;
        }

        if (data?.meals && !cancelled) {
          const cloudMeals = data.meals as MealEntry[];
          setMeals(cloudMeals);
          // Update localStorage to match cloud
          localStorage.setItem(getStorageKey(selectedDate), JSON.stringify(cloudMeals));
        }
      } catch (err) {
        console.error('Cloud sync load failed:', err);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [selectedDate]);

  // Save meals to localStorage + Supabase
  const saveMeals = useCallback((updated: MealEntry[]) => {
    setMeals(updated);
    setSyncError(null);
    localStorage.setItem(getStorageKey(selectedDate), JSON.stringify(updated));

    // Async cloud sync with version guard to discard stale writes
    const version = ++syncVersion.current;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        if (syncVersion.current !== version) return; // stale

        await supabase
          .from('nutrition_logs')
          .upsert(
            {
              user_id: user.id,
              log_date: selectedDate,
              meals: mealsForCloud(updated),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,log_date' }
          );
      } catch (err) {
        console.error('Cloud sync save failed:', err);
        if (syncVersion.current === version) {
          setSyncError('Cloud sync failed. Changes saved locally.');
        }
      }
    })();
  }, [selectedDate]);

  // Compute daily totals
  const dailyTotals = useMemo(() => meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totals.calories,
      protein: acc.protein + meal.totals.protein,
      carbs: acc.carbs + meal.totals.carbs,
      fat: acc.fat + meal.totals.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ), [meals]);

  // Analyze food photo via Gemini Vision API
  const analyzePhoto = useCallback(async (file: File): Promise<{
    items: FoodItem[];
    totals: { calories: number; protein: number; carbs: number; fat: number };
  } | null> => {
    setAnalyzing(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const response = await fetch(GEMINI_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: file.type || 'image/jpeg',
                    data: base64,
                  },
                },
                {
                  text: `Analyze this food photo. Identify each food item and estimate the nutritional content.

Return ONLY valid JSON in this exact format, no markdown, no code fences, just raw JSON:
{
  "items": [
    {
      "name": "food item name",
      "portion": "estimated portion size",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0
    }
  ],
  "totals": {
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0
  }
}

All macros in grams, calories in kcal. Be realistic with portion sizes based on what you see. If you cannot identify the food, make your best estimate.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Gemini API error (${response.status})`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse nutrition data from AI response');
      }

      const nutrition = JSON.parse(jsonMatch[0]);

      if (!nutrition.items || !nutrition.totals) {
        throw new Error('Invalid nutrition data format');
      }

      return nutrition as {
        items: FoodItem[];
        totals: { calories: number; protein: number; carbs: number; fat: number };
      };
    } catch (err: any) {
      setError(err.message || 'Failed to analyze food');
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, []);

  // Add a meal entry
  const addMeal = useCallback((items: FoodItem[], totals: { calories: number; protein: number; carbs: number; fat: number }, photoBase64?: string) => {
    const entry: MealEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      time: format(new Date(), 'h:mm a'),
      items,
      totals,
      photoBase64,
    };
    saveMeals([...meals, entry]);
    return entry;
  }, [meals, saveMeals]);

  // Add a single manual food item
  const addManualItem = useCallback((item: FoodItem) => {
    const entry: MealEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      time: format(new Date(), 'h:mm a'),
      items: [item],
      totals: {
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      },
    };
    saveMeals([...meals, entry]);
    return entry;
  }, [meals, saveMeals]);

  // Remove a meal entry
  const removeMeal = useCallback((id: string) => {
    saveMeals(meals.filter(m => m.id !== id));
  }, [meals, saveMeals]);

  // Update a meal entry (edit items, recalculate totals)
  const updateMeal = useCallback((id: string, items: FoodItem[]) => {
    const totals = items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    saveMeals(meals.map(m => m.id === id ? { ...m, items, totals } : m));
  }, [meals, saveMeals]);

  // Analyze a text description of food via Gemini API
  const analyzeDescription = useCallback(async (text: string): Promise<{
    items: FoodItem[];
    totals: { calories: number; protein: number; carbs: number; fat: number };
  } | null> => {
    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(GEMINI_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Estimate the nutritional content for these foods: ${text}

Return ONLY valid JSON in this exact format, no markdown, no code fences, just raw JSON:
{
  "items": [
    {
      "name": "food item name",
      "portion": "estimated portion size",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0
    }
  ],
  "totals": {
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0
  }
}

All macros in grams, calories in kcal. Be realistic with typical portion sizes. If a quantity is specified use that, otherwise assume a standard serving.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Gemini API error (${response.status})`);
      }

      const data = await response.json();
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse nutrition data from AI response');
      }

      const nutrition = JSON.parse(jsonMatch[0]);

      if (!nutrition.items || !nutrition.totals) {
        throw new Error('Invalid nutrition data format');
      }

      return nutrition as {
        items: FoodItem[];
        totals: { calories: number; protein: number; carbs: number; fat: number };
      };
    } catch (err: any) {
      setError(err.message || 'Failed to analyze food description');
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, []);

  return {
    selectedDate,
    setSelectedDate,
    meals,
    dailyTotals,
    targets: DAILY_TARGETS,
    analyzing,
    error,
    syncError,
    analyzePhoto,
    analyzeDescription,
    addMeal,
    addManualItem,
    removeMeal,
    updateMeal,
  };
}
