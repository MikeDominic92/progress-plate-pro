import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { fetchWithTimeout, TimeoutError } from '@/lib/fetchWithTimeout';
import { retryWithBackoff } from '@/lib/retryWithBackoff';
import { supabaseRetry } from '@/lib/supabaseRetry';

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
  photoUrl?: string;
}

export interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Kara: 5'0", 20yo, 134 lbs, goal 120 lbs, active 3x/week
// BMR ~1,300 * 1.55 TDEE ~2,015 - 1,000 deficit = ~1,015, floored at 1,200
// Target: 2 lb/week loss
export const DAILY_TARGETS: DailyTargets = {
  calories: 1200,
  protein: 120,
  carbs: 90,
  fat: 40,
};

const STORAGE_PREFIX = 'nutrition_log_';
const GEMINI_PROXY = '/.netlify/functions/gemini-proxy';
const MAX_IMAGE_DIM = 1024;
const JPEG_QUALITY = 0.8;

/** Compress an image file to max 1024px and JPEG 80% quality. Returns base64 (no data: prefix). */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_IMAGE_DIM || height > MAX_IMAGE_DIM) {
        const scale = MAX_IMAGE_DIM / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1]);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

function getStorageKey(date: string) {
  return `${STORAGE_PREFIX}${date}`;
}

/** Strip photoBase64 from meals before saving to Supabase (saves bandwidth/storage). Keep photoUrl. */
function mealsForCloud(meals: MealEntry[]): MealEntry[] {
  return meals.map(({ photoBase64: _photoBase64, ...rest }) => rest);
}

/** Upload a meal photo to Supabase Storage. Returns public URL or null on failure. */
async function uploadMealPhoto(
  base64: string,
  userId: string,
  date: string,
  mealId: string
): Promise<string | null> {
  try {
    const byteChars = atob(base64);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteArray[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    if (blob.size > 10 * 1024 * 1024) {
      console.error('Photo too large after compression:', blob.size);
      return null;
    }

    const path = `${userId}/${date}/${mealId}.jpg`;

    const { error } = await supabase.storage
      .from('meal-photos')
      .upload(path, blob, { contentType: 'image/jpeg', upsert: true });

    if (error) {
      console.error('Photo upload failed:', error);
      return null;
    }

    const { data } = supabase.storage.from('meal-photos').getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error('Photo upload failed:', err);
    return null;
  }
}

export function useNutritionTracker(customTargets?: DailyTargets) {
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncVersion = useRef(0);
  const loadVersion = useRef(0);

  // Load meals: try Supabase first, fall back to localStorage
  useEffect(() => {
    const currentLoad = ++loadVersion.current;

    async function load() {
      // 1. Try localStorage immediately for fast paint
      try {
        const stored = localStorage.getItem(getStorageKey(selectedDate));
        if (stored && loadVersion.current === currentLoad) {
          setMeals(JSON.parse(stored));
        }
      } catch { /* ignore */ }

      // 2. Then fetch from Supabase (source of truth)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || loadVersion.current !== currentLoad) return;

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

        if (data?.meals && loadVersion.current === currentLoad) {
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

        const { error: upsertErr } = await supabaseRetry(
          () => supabase
            .from('nutrition_logs')
            .upsert(
              {
                user_id: user.id,
                log_date: selectedDate,
                meals: mealsForCloud(updated),
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,log_date' }
            ),
          { maxRetries: 2 },
        );
        if (upsertErr && syncVersion.current === version) {
          setSyncError('Cloud sync failed. Changes saved locally.');
        }
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
    photoBase64?: string;
  } | null> => {
    setAnalyzing(true);
    setError(null);

    try {
      const base64 = await compressImage(file);

      const requestBody = JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
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
            maxOutputTokens: 8192,
          },
        });

      const data = await retryWithBackoff(
        async () => {
          const res = await fetchWithTimeout(GEMINI_PROXY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody,
            timeoutMs: 30_000,
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const msg = errData?.error?.message || `Gemini API error (${res.status})`;
            // Mark transient server errors as retryable
            const err = new Error(msg);
            (err as Error & { status?: number }).status = res.status;
            throw err;
          }

          return res.json();
        },
        {
          maxRetries: 2,
          shouldRetry: (err) => {
            if (err instanceof TimeoutError) return false;
            const status = (err as Error & { status?: number }).status;
            // Retry on gateway errors (502, 503, 504) but not on client errors
            return status === 502 || status === 503 || status === 504 || !status;
          },
        },
      );
      // Thinking models may return multiple parts; grab the last text part
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const text = [...parts].reverse().find((p: unknown) => {
        const part = p as { text?: string; thoughtSignature?: boolean };
        return part.text && !part.thoughtSignature;
      })?.text
        || parts[parts.length - 1]?.text || '';

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse nutrition data from AI response');
      }

      const nutrition = JSON.parse(jsonMatch[0]);

      if (!nutrition.items || !nutrition.totals) {
        throw new Error('Invalid nutrition data format');
      }

      return {
        items: nutrition.items,
        totals: nutrition.totals,
        photoBase64: base64,
      } as {
        items: FoodItem[];
        totals: { calories: number; protein: number; carbs: number; fat: number };
        photoBase64?: string;
      };
    } catch (err: unknown) {
      if (err instanceof TimeoutError) {
        setError('Analysis is taking too long. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to analyze food');
      }
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
    const updated = [...meals, entry];
    saveMeals(updated);

    // Async: upload photo to Supabase Storage, then update entry with photoUrl
    if (photoBase64) {
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const url = await uploadMealPhoto(photoBase64, user.id, selectedDate, entry.id);
          if (!url) return;

          // Update the entry in current state with photoUrl
          setMeals(prev => {
            const withUrl = prev.map(m =>
              m.id === entry.id ? { ...m, photoUrl: url } : m
            );
            // Persist to localStorage
            localStorage.setItem(getStorageKey(selectedDate), JSON.stringify(withUrl));
            // Sync to cloud (strip base64, keep photoUrl)
            const version = ++syncVersion.current;
            (async () => {
              try {
                const { data: { user: u } } = await supabase.auth.getUser();
                if (!u || syncVersion.current !== version) return;
                await supabaseRetry(
                  () => supabase
                    .from('nutrition_logs')
                    .upsert(
                      {
                        user_id: u.id,
                        log_date: selectedDate,
                        meals: mealsForCloud(withUrl),
                        updated_at: new Date().toISOString(),
                      },
                      { onConflict: 'user_id,log_date' }
                    ),
                  { maxRetries: 2 },
                );
              } catch (err) {
                console.error('Cloud sync after photo upload failed:', err);
              }
            })();
            return withUrl;
          });
        } catch (err) {
          console.error('Photo upload flow failed:', err);
        }
      })();
    }

    return entry;
  }, [meals, saveMeals, selectedDate]);

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
      const descRequestBody = JSON.stringify({
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
            maxOutputTokens: 8192,
          },
        });

      const data = await retryWithBackoff(
        async () => {
          const res = await fetchWithTimeout(GEMINI_PROXY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: descRequestBody,
            timeoutMs: 30_000,
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const msg = errData?.error?.message || `Gemini API error (${res.status})`;
            const err = new Error(msg);
            (err as Error & { status?: number }).status = res.status;
            throw err;
          }

          return res.json();
        },
        {
          maxRetries: 2,
          shouldRetry: (err) => {
            if (err instanceof TimeoutError) return false;
            const status = (err as Error & { status?: number }).status;
            return status === 502 || status === 503 || status === 504 || !status;
          },
        },
      );
      // Thinking models may return multiple parts; grab the last text part
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const responseText = [...parts].reverse().find((p: unknown) => {
        const part = p as { text?: string; thoughtSignature?: boolean };
        return part.text && !part.thoughtSignature;
      })?.text
        || parts[parts.length - 1]?.text || '';

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
    } catch (err: unknown) {
      if (err instanceof TimeoutError) {
        setError('Analysis is taking too long. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to analyze food description');
      }
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, []);

  // Retry the last save if cloud sync failed
  const retrySave = useCallback(() => {
    setSyncError(null);

    const version = ++syncVersion.current;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        if (syncVersion.current !== version) return; // stale

        const { error: retryErr } = await supabaseRetry(
          () => supabase
            .from('nutrition_logs')
            .upsert(
              {
                user_id: user.id,
                log_date: selectedDate,
                meals: mealsForCloud(meals),
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,log_date' }
            ),
          { maxRetries: 2 },
        );
        if (retryErr) throw retryErr;
      } catch (err) {
        console.error('Cloud sync retry failed:', err);
        if (syncVersion.current === version) {
          setSyncError('Cloud sync failed. Changes saved locally.');
        }
      }
    })();
  }, [selectedDate, meals]);


  return {
    selectedDate,
    setSelectedDate,
    meals,
    dailyTotals,
    targets: customTargets || DAILY_TARGETS,
    analyzing,
    error,
    syncError,
    analyzePhoto,
    analyzeDescription,
    addMeal,
    addManualItem,
    removeMeal,
    updateMeal,
    retrySave,
  };
}
