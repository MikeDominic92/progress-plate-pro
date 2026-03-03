import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Utensils, Trash2, X, Check } from 'lucide-react';
import type { MealEntry, FoodItem } from '@/hooks/useNutritionTracker';

interface MealTimelineProps {
  meals: MealEntry[];
  editingMealId: string | null;
  editingItems: FoodItem[];
  onStartEditing: (mealId: string, items: FoodItem[]) => void;
  onSaveEditing: () => void;
  onCancelEditing: () => void;
  onUpdateEditingItem: (index: number, field: keyof FoodItem, value: string) => void;
  onRemoveEditingItem: (index: number) => void;
  onRemoveMeal: (id: string) => void;
  onOpenDetail: (mealId: string) => void;
}

function parseTimeToMinutes(time: string): number {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'AM' && hours === 12) hours = 0;
  if (period === 'PM' && hours !== 12) hours += 12;
  return hours * 60 + minutes;
}

function formatHourLabel(hour: number): string {
  if (hour === 0 || hour === 24) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function getHourMarkers(meals: MealEntry[]): number[] {
  if (meals.length === 0) return [];
  const keyHours = [6, 9, 12, 15, 18, 21];
  const times = meals.map(m => parseTimeToMinutes(m.time));
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const startHour = Math.floor(minTime / 60);
  const endHour = Math.ceil(maxTime / 60);
  return keyHours.filter(h => h >= startHour && h <= endHour);
}

const RAIL_LEFT = '2.5rem';
// Entry divs sit inside 3.5rem padding; offset by -3.5rem so nodes align with the rail
const NODE_LEFT = 'calc(-1rem - 7px)';
const DOT_LEFT  = 'calc(-1rem - 5px)';
const TICK_LEFT = 'calc(-1rem - 3px)';
const CONN_LEFT = 'calc(-1rem + 7px)';

export default function MealTimeline({
  meals,
  editingMealId,
  editingItems,
  onStartEditing,
  onSaveEditing,
  onCancelEditing,
  onUpdateEditingItem,
  onRemoveEditingItem,
  onRemoveMeal,
  onOpenDetail,
}: MealTimelineProps) {
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);

  const handleTap = useCallback((meal: MealEntry) => {
    const now = Date.now();
    const last = lastTapRef.current;

    if (last && last.id === meal.id && now - last.time < 350) {
      lastTapRef.current = null;
      onOpenDetail(meal.id);
    } else {
      lastTapRef.current = { id: meal.id, time: now };
      setTimeout(() => {
        if (lastTapRef.current && lastTapRef.current.id === meal.id && lastTapRef.current.time === now) {
          lastTapRef.current = null;
          onStartEditing(meal.id, meal.items);
        }
      }, 350);
    }
  }, [onStartEditing, onOpenDetail]);

  const hourMarkers = getHourMarkers(meals);

  type TimelineEntry =
    | { type: 'hour'; hour: number; minutes: number }
    | { type: 'meal'; meal: MealEntry; index: number; minutes: number };

  const entries: TimelineEntry[] = [];

  hourMarkers.forEach(h => {
    entries.push({ type: 'hour', hour: h, minutes: h * 60 });
  });

  meals.forEach((meal, i) => {
    entries.push({ type: 'meal', meal, index: i, minutes: parseTimeToMinutes(meal.time) });
  });

  entries.sort((a, b) => a.minutes - b.minutes);

  return (
    <div className="relative" style={{ paddingLeft: '3.5rem' }}>
      {/* Vertical rail */}
      <div className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: RAIL_LEFT }} />

      {entries.map((entry) => {
        if (entry.type === 'hour') {
          return (
            <div key={`h-${entry.hour}`} className="relative flex items-center h-6 mb-1">
              <span
                className="absolute text-[0.65rem] text-white/20 whitespace-nowrap text-right"
                style={{ right: 'calc(100% + 1.5rem)', width: '3rem' }}
              >
                {formatHourLabel(entry.hour)}
              </span>
              <div className="absolute w-1.5 h-px bg-white/15" style={{ left: TICK_LEFT }} />
            </div>
          );
        }

        const { meal, index } = entry;
        const isEditing = editingMealId === meal.id;

        return (
          <div key={meal.id} className="relative flex items-start mb-3 group">
            {/* Time label left of rail */}
            <span
              className="absolute text-[0.65rem] text-white/30 whitespace-nowrap text-right pt-2.5"
              style={{ right: 'calc(100% + 1.5rem)', width: '3.5rem' }}
            >
              {meal.time}
            </span>

            {/* Node on rail */}
            <div
              className="absolute top-2 w-3.5 h-3.5 rounded-full bg-primary/80 border-2 border-primary/40 flex items-center justify-center z-10"
              style={{ left: NODE_LEFT }}
            >
              <Utensils className="h-2 w-2 text-white/90" />
            </div>

            {/* Connector line */}
            <div
              className="absolute top-[0.6rem] h-px bg-white/10"
              style={{ left: CONN_LEFT, width: '0.5rem' }}
            />

            {/* Ghost bubble */}
            <div className="flex-1 ml-1">
              {isEditing ? (
                <div className="bg-white/5 border border-primary/20 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-primary/80">Editing meal</span>
                    <div className="flex items-center gap-1">
                      <button aria-label="Cancel editing" onClick={onCancelEditing} className="p-2 text-white/30 hover:text-white/60">
                        <X className="h-4 w-4" />
                      </button>
                      <button aria-label="Save changes" onClick={onSaveEditing} className="p-2 text-green-400/70 hover:text-green-400">
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {editingItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_auto] gap-1 items-start">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        <input
                          value={item.name}
                          onChange={e => onUpdateEditingItem(idx, 'name', e.target.value)}
                          placeholder="Food name"
                          className="col-span-2 px-2 py-1 rounded bg-black/50 border border-white/10 text-xs text-white placeholder:text-white/20 outline-none focus:border-primary/40"
                        />
                        <input
                          value={item.portion}
                          onChange={e => onUpdateEditingItem(idx, 'portion', e.target.value)}
                          placeholder="Portion size"
                          className="col-span-2 px-2 py-1 rounded bg-black/50 border border-white/10 text-xs text-white placeholder:text-white/20 outline-none focus:border-primary/40"
                        />
                        <input
                          value={item.calories || ''}
                          onChange={e => onUpdateEditingItem(idx, 'calories', e.target.value)}
                          placeholder="Calories (kcal)"
                          inputMode="numeric"
                          className="px-2 py-1 rounded bg-black/50 border border-white/10 text-xs text-white placeholder:text-white/20 outline-none focus:border-primary/40"
                        />
                        <input
                          value={item.protein || ''}
                          onChange={e => onUpdateEditingItem(idx, 'protein', e.target.value)}
                          placeholder="Protein (g)"
                          inputMode="numeric"
                          className="px-2 py-1 rounded bg-black/50 border border-white/10 text-xs text-white placeholder:text-white/20 outline-none focus:border-primary/40"
                        />
                        <input
                          value={item.carbs || ''}
                          onChange={e => onUpdateEditingItem(idx, 'carbs', e.target.value)}
                          placeholder="Carbs (g)"
                          inputMode="numeric"
                          className="px-2 py-1 rounded bg-black/50 border border-white/10 text-xs text-white placeholder:text-white/20 outline-none focus:border-primary/40"
                        />
                        <input
                          value={item.fat || ''}
                          onChange={e => onUpdateEditingItem(idx, 'fat', e.target.value)}
                          placeholder="Fat (g)"
                          inputMode="numeric"
                          className="px-2 py-1 rounded bg-black/50 border border-white/10 text-xs text-white placeholder:text-white/20 outline-none focus:border-primary/40"
                        />
                      </div>
                      <button
                        aria-label="Remove item"
                        onClick={() => onRemoveEditingItem(idx)}
                        className="p-1 mt-1 text-white/20 hover:text-red-400 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={onSaveEditing} className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700">
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onCancelEditing} className="flex-1 h-8 text-xs text-white/50">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="bg-white/5 border border-white/10 rounded-xl p-3 cursor-pointer hover:bg-white/[0.07] hover:border-white/15 transition-colors relative"
                  onClick={() => handleTap(meal)}
                >
                  <button
                    aria-label="Delete meal"
                    onClick={(e) => { e.stopPropagation(); setDeletingMealId(meal.id); }}
                    className="absolute top-2 right-2 p-1 text-white/15 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-white/60">Meal {index + 1}</span>
                    <span className="text-[0.65rem] text-white/25">--</span>
                    <span className="text-xs font-medium text-white/50">{Math.round(meal.totals.calories)} cal</span>
                  </div>

                  <p className="text-[0.7rem] text-white/40 line-clamp-2 mb-1.5" title={meal.items.map(item => item.name).join(', ')}>
                    {meal.items.map(item => item.name).join(', ')}
                  </p>

                  <div className="flex gap-3 text-[0.65rem] text-white/25">
                    <span>{Math.round(meal.totals.protein)}g P</span>
                    <span>{Math.round(meal.totals.carbs)}g C</span>
                    <span>{Math.round(meal.totals.fat)}g F</span>
                  </div>

                  {/* Photo display */}
                  {(meal.photoUrl || meal.photoBase64) && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
                      <img
                        src={meal.photoUrl || `data:image/jpeg;base64,${meal.photoBase64}`}
                        alt="Meal photo"
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Current time "Now" dot */}
      {meals.length > 0 && (
        <div className="relative flex items-center h-8">
          <span
            className="absolute text-[0.65rem] text-primary/40 whitespace-nowrap text-right"
            style={{ right: 'calc(100% + 1.5rem)', width: '3rem' }}
          >
            Now
          </span>
          <div
            className="absolute w-2.5 h-2.5 rounded-full bg-primary/60 animate-pulse z-10"
            style={{ left: DOT_LEFT }}
          />
        </div>
      )}

      <AlertDialog open={deletingMealId !== null} onOpenChange={(open) => { if (!open) setDeletingMealId(null); }}>
        <AlertDialogContent className="max-w-xs rounded-xl border-white/10 bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white/90">Delete this meal?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/60">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => { if (deletingMealId) onRemoveMeal(deletingMealId); setDeletingMealId(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
