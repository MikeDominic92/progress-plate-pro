import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Star } from 'lucide-react';
import type { MealEntry } from '@/hooks/useNutritionTracker';

interface MealDetailDialogProps {
  meal: MealEntry | null;
  mealIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveAsFavorite?: (meal: MealEntry) => void;
  isFavorited?: boolean;
}

export default function MealDetailDialog({ meal, mealIndex, open, onOpenChange, onSaveAsFavorite, isFavorited }: MealDetailDialogProps) {
  if (!meal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-sm rounded-2xl bg-background/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden">
        {(meal.photoUrl || meal.photoBase64) && (
          <img
            src={meal.photoUrl || `data:image/jpeg;base64,${meal.photoBase64}`}
            alt="Food"
            className="w-full h-36 sm:h-48 object-cover"
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

          {onSaveAsFavorite && (
            <button
              onClick={() => onSaveAsFavorite(meal)}
              disabled={isFavorited}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors text-sm font-medium ${
                isFavorited
                  ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400/60 cursor-default'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              <Star className={`h-4 w-4 ${isFavorited ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              {isFavorited ? 'Saved to Favorites' : 'Save as Favorite'}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
