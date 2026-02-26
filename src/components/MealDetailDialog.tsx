import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { MealEntry } from '@/hooks/useNutritionTracker';

interface MealDetailDialogProps {
  meal: MealEntry | null;
  mealIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MealDetailDialog({ meal, mealIndex, open, onOpenChange }: MealDetailDialogProps) {
  if (!meal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl bg-background/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden">
        {meal.photoBase64 && (
          <img
            src={`data:image/jpeg;base64,${meal.photoBase64}`}
            alt="Food"
            className="w-full h-48 object-cover"
          />
        )}

        <div className="p-5 space-y-4">
          <DialogHeader className="space-y-1">
            <DialogDescription className="text-xs text-white/40">{meal.time}</DialogDescription>
            <DialogTitle className="text-base font-bold text-white">Meal {mealIndex + 1}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {meal.items.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{item.name}</p>
                  <p className="text-[0.65rem] text-white/30">{item.portion}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-medium text-white/70">{Math.round(item.calories)} cal</p>
                  <p className="text-[0.6rem] text-white/30">
                    {Math.round(item.protein)}P / {Math.round(item.carbs)}C / {Math.round(item.fat)}F
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="text-xs font-semibold text-white/50">Total</span>
            <div className="flex gap-3 text-xs font-medium">
              <span className="text-white/70">{Math.round(meal.totals.calories)} cal</span>
              <span className="text-blue-400/80">{Math.round(meal.totals.protein)}g P</span>
              <span className="text-yellow-400/80">{Math.round(meal.totals.carbs)}g C</span>
              <span className="text-purple-400/80">{Math.round(meal.totals.fat)}g F</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
