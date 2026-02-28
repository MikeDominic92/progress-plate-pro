import { useState, useMemo } from 'react';
import { format, parseISO, addDays, subDays, isToday, isFuture } from 'date-fns';
import { ChevronLeft, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import MealDetailDialog from '@/components/MealDetailDialog';
import { DAILY_TARGETS } from '@/hooks/useNutritionTracker';
import type { MealEntry } from '@/hooks/useNutritionTracker';
import type { DailyNutrition } from '@/hooks/useAdminNutrition';

interface NutritionTabProps {
  dailyMeals: Record<string, MealEntry[]>;
  dailyLogs: DailyNutrition[];
}

export function NutritionTab({ dailyMeals, dailyLogs }: NutritionTabProps) {
  // Default to most recent logged day, or today
  const [selectedDate, setSelectedDate] = useState(() => {
    if (dailyLogs.length > 0) {
      return dailyLogs[dailyLogs.length - 1].date;
    }
    return format(new Date(), 'yyyy-MM-dd');
  });

  const [detailMeal, setDetailMeal] = useState<MealEntry | null>(null);
  const [detailIndex, setDetailIndex] = useState(0);

  const parsedDate = parseISO(selectedDate);
  const isTodaySelected = isToday(parsedDate);

  const meals = dailyMeals[selectedDate] || [];

  // Find the matching DailyNutrition entry for the macro summary
  const dayLog = useMemo(
    () => dailyLogs.find(d => d.date === selectedDate),
    [dailyLogs, selectedDate]
  );

  const totals = dayLog || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const goBack = () => setSelectedDate(format(subDays(parsedDate, 1), 'yyyy-MM-dd'));
  const goForward = () => {
    const next = addDays(parsedDate, 1);
    if (!isFuture(next) || isToday(next)) {
      setSelectedDate(format(next, 'yyyy-MM-dd'));
    }
  };

  const canGoForward = !isTodaySelected;

  return (
    <div className="space-y-4">
      {/* Date nav bar */}
      <div className="flex items-center justify-between px-1">
        <button
          aria-label="Previous day"
          onClick={goBack}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-white/60" />
        </button>
        <span className="text-sm font-semibold text-white/80">
          {isTodaySelected ? 'Today' : format(parsedDate, 'EEE, MMM d')}
        </span>
        <button
          aria-label="Next day"
          onClick={goForward}
          disabled={!canGoForward}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5 text-white/60" />
        </button>
      </div>

      {/* Macro summary card */}
      <Card className="bg-black/50 border-white/10">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <MacroStat label="Calories" value={totals.calories} target={DAILY_TARGETS.calories} unit="cal" />
            <MacroStat label="Protein" value={totals.protein} target={DAILY_TARGETS.protein} unit="g" />
            <MacroStat label="Carbs" value={totals.carbs} target={DAILY_TARGETS.carbs} unit="g" />
            <MacroStat label="Fat" value={totals.fat} target={DAILY_TARGETS.fat} unit="g" />
          </div>
        </CardContent>
      </Card>

      {/* Meal cards or empty state */}
      {meals.length === 0 ? (
        <Card className="bg-black/50 border-white/10">
          <CardContent className="py-12 text-center">
            <UtensilsCrossed className="h-10 w-10 text-white/15 mx-auto mb-3" />
            <p className="text-sm text-white/30">No meals logged</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {meals.map((meal, i) => (
            <button
              key={meal.id || i}
              onClick={() => { setDetailMeal(meal); setDetailIndex(i); }}
              className="w-full text-left"
            >
              <Card className="bg-black/50 border-white/10 hover:border-white/20 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  {meal.photoUrl ? (
                    <img
                      src={meal.photoUrl}
                      alt="Meal"
                      className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <UtensilsCrossed className="h-5 w-5 text-white/20" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/40">{meal.time}</p>
                    <p className="text-sm text-white/70 truncate">
                      {meal.items.map(it => it.name).join(', ')}
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-medium text-white/70">
                      {Math.round(meal.totals.calories)} cal
                    </p>
                    <p className="text-[0.65rem] text-white/30">
                      {Math.round(meal.totals.protein)}P / {Math.round(meal.totals.carbs)}C / {Math.round(meal.totals.fat)}F
                    </p>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {/* Meal detail dialog (reused) */}
      <MealDetailDialog
        meal={detailMeal}
        mealIndex={detailIndex}
        open={detailMeal !== null}
        onOpenChange={(open) => { if (!open) setDetailMeal(null); }}
      />
    </div>
  );
}

function MacroStat({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const ratio = target > 0 ? value / target : 0;
  // For calories: over target is bad (red). For macros: under is amber, near/over is green.
  const isCalories = label === 'Calories';
  const color =
    isCalories
      ? ratio <= 1.1 ? 'text-green-400' : 'text-red-400'
      : ratio >= 0.8 ? 'text-green-400' : ratio >= 0.5 ? 'text-amber-400' : 'text-white/50';

  return (
    <div>
      <p className="text-xs text-white/40">{label}</p>
      <p className={`text-lg font-bold ${color}`}>
        {Math.round(value)}
        <span className="text-[0.65rem] font-normal text-white/30 ml-0.5">{unit}</span>
      </p>
      <p className="text-[0.65rem] text-white/25">/ {target}{unit}</p>
    </div>
  );
}
