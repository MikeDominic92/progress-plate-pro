import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, ChevronLeft, ChevronRight, Download, ImagePlus, Search, Utensils, X } from 'lucide-react';
import { addDays, subDays, isToday, format as fnsFormat, parseISO } from 'date-fns';
import { useNutritionTracker } from '@/hooks/useNutritionTracker';
import { useSettings } from '@/hooks/useSettings';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import type { FoodItem } from '@/hooks/useNutritionTracker';
import SonnyAngelDetailed from '@/components/characters/SonnyAngelDetailed';
import BottomNav from '@/components/BottomNav';
import MealTimeline from '@/components/MealTimeline';
import MealDetailDialog from '@/components/MealDetailDialog';
import FavoritesSection from '@/components/FavoritesSection';
import { useMealFavorites } from '@/hooks/useMealFavorites';
import ExplainTerm from '@/components/ExplainTerm';

function MacroRing({ label, current, target, color, unit }: {
  label: string; current: number; target: number; color: string; unit: string;
}) {
  const pct = Math.min((current / target) * 100, 100);
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const over = current > target;

  return (
    <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
      <div className="relative w-16 h-16 sm:w-20 sm:h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 76 76">
          <circle cx="38" cy="38" r={radius} fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="6" />
          <circle
            cx="38" cy="38" r={radius} fill="none"
            stroke={over ? '#ef4444' : color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-sm font-bold ${over ? 'text-red-400' : 'text-white/90'}`}>{Math.round(current)}</span>
          <span className="text-[0.65rem] text-white/30">{unit}</span>
        </div>
      </div>
      <span className="text-[0.65rem] text-white/40 truncate max-w-full">{label}</span>
      <span className="text-[0.65rem] text-white/20 truncate max-w-full">{target}{unit} goal</span>
    </div>
  );
}

export default function NutritionPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { username } = useAuthenticatedUser();
  const { settings } = useSettings(username);
  const {
    selectedDate, setSelectedDate,
    meals, dailyTotals, targets, analyzing, error, syncError,
    analyzePhoto, analyzeDescription, addMeal, addManualItem, removeMeal, updateMeal,
    retrySave,
  } = useNutritionTracker(settings.daily_targets);

  const mealFavs = useMealFavorites(username);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Text description state
  const [showDescription, setShowDescription] = useState(false);
  const [descriptionText, setDescriptionText] = useState('');

  // Manual macro entry form
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', portion: '', calories: '', protein: '', carbs: '', fat: '' });

  // Editable meal state
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editingItems, setEditingItems] = useState<FoodItem[]>([]);

  // Detail dialog state
  const [detailMealId, setDetailMealId] = useState<string | null>(null);

  // Dismissible error states
  const [dismissedError, setDismissedError] = useState(false);
  const [dismissedSyncError, setDismissedSyncError] = useState(false);

  // Reset dismissed state when the error message itself changes
  useEffect(() => { setDismissedError(false); }, [error]);
  useEffect(() => { setDismissedSyncError(false); }, [syncError]);

  // Auto-trigger camera when navigating with ?camera=true
  useEffect(() => {
    if (searchParams.get('camera') === 'true') {
      setSearchParams({}, { replace: true });
      const timer = setTimeout(() => {
        cameraInputRef.current?.click();
      }, 150);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount intentionally; searchParams and setSearchParams are stable router refs
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await analyzePhoto(file);
    if (result) {
      addMeal(result.items, result.totals, result.photoBase64);
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDescriptionLookup = async () => {
    if (!descriptionText.trim() || analyzing) return;
    const result = await analyzeDescription(descriptionText.trim());
    if (result) {
      addMeal(result.items, result.totals);
      setDescriptionText('');
      setShowDescription(false);
    }
  };

  const handleManualSubmit = () => {
    const item: FoodItem = {
      name: manualForm.name || 'Food',
      portion: manualForm.portion || '1 serving',
      calories: parseFloat(manualForm.calories) || 0,
      protein: parseFloat(manualForm.protein) || 0,
      carbs: parseFloat(manualForm.carbs) || 0,
      fat: parseFloat(manualForm.fat) || 0,
    };
    addManualItem(item);
    setManualForm({ name: '', portion: '', calories: '', protein: '', carbs: '', fat: '' });
    setShowManual(false);
  };

  const startEditing = (mealId: string, items: FoodItem[]) => {
    setEditingMealId(mealId);
    setEditingItems(items.map(item => ({ ...item })));
  };

  const saveEditing = () => {
    if (!editingMealId) return;
    updateMeal(editingMealId, editingItems);
    setEditingMealId(null);
    setEditingItems([]);
  };

  const cancelEditing = () => {
    setEditingMealId(null);
    setEditingItems([]);
  };

  const updateEditingItem = (index: number, field: keyof FoodItem, value: string) => {
    setEditingItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      if (field === 'name' || field === 'portion') {
        return { ...item, [field]: value };
      }
      return { ...item, [field]: parseFloat(value) || 0 };
    }));
  };

  const removeEditingItem = (index: number) => {
    setEditingItems(prev => prev.filter((_, i) => i !== index));
  };

  // CSV export handler
  const handleExportCsv = () => {
    const rows: string[] = ['Meal,Time,Items,Calories,Protein,Carbs,Fat'];
    meals.forEach((meal, idx) => {
      const itemNames = meal.items.map(i => i.name).join('; ');
      const escapedItems = `"${itemNames.replace(/"/g, '""')}"`;
      rows.push(
        `Meal ${idx + 1},${meal.time},${escapedItems},${Math.round(meal.totals.calories)},${Math.round(meal.totals.protein)},${Math.round(meal.totals.carbs)},${Math.round(meal.totals.fat)}`
      );
    });
    // Add totals row
    rows.push(
      `Total,,All meals,${Math.round(dailyTotals.calories)},${Math.round(dailyTotals.protein)},${Math.round(dailyTotals.carbs)},${Math.round(dailyTotals.fat)}`
    );
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutrition-${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const remaining = {
    calories: Math.max(0, targets.calories - dailyTotals.calories),
    protein: Math.max(0, targets.protein - dailyTotals.protein),
    carbs: Math.max(0, targets.carbs - dailyTotals.carbs),
    fat: Math.max(0, targets.fat - dailyTotals.fat),
  };

  const parsedDate = parseISO(selectedDate);
  const isTodaySelected = isToday(parsedDate);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(340_82%_66%/0.1),transparent_50%)]" />

      <div className="relative z-10 container mx-auto p-3 sm:p-4 max-w-lg space-y-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white">Nutrition</h1>
              <SonnyAngelDetailed variant="strawberry" size={28} />
            </div>
            <p className="text-[0.65rem] text-white/30">Track meals, hit your macros</p>
          </div>
        </div>

        {/* Date Picker */}
        <div className="flex items-center justify-between px-1">
          <button
            aria-label="Previous day"
            onClick={() => setSelectedDate(fnsFormat(subDays(parsedDate, 1), 'yyyy-MM-dd'))}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-white/60" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white/80">
              {isTodaySelected ? 'Today' : fnsFormat(parsedDate, 'EEE, MMM d')}
            </span>
            <button
              aria-label="Export CSV"
              onClick={handleExportCsv}
              disabled={meals.length === 0}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Export daily nutrition as CSV"
            >
              <Download className="h-3.5 w-3.5 text-white/50" />
            </button>
          </div>
          <button
            aria-label="Next day"
            onClick={() => setSelectedDate(fnsFormat(addDays(parsedDate, 1), 'yyyy-MM-dd'))}
            disabled={isTodaySelected}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4 text-white/60" />
          </button>
        </div>

        {/* Daily Macro Rings */}
        <Card className="bg-black/50 backdrop-blur-glass border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <ExplainTerm term="Macros"><span className="text-sm font-semibold text-white/80">{isTodaySelected ? "Today's" : fnsFormat(parsedDate, 'MMM d')} Macros</span></ExplainTerm>
              <span className="text-xs text-white/30">{remaining.calories > 0 ? `${Math.round(remaining.calories)} cal left` : 'Goal reached!'}</span>
            </div>
            <div className="flex items-center justify-around">
              <MacroRing label="Calories" current={dailyTotals.calories} target={targets.calories} color="hsl(340, 82%, 66%)" unit="cal" />
              <MacroRing label="Protein" current={dailyTotals.protein} target={targets.protein} color="#60a5fa" unit="g" />
              <MacroRing label="Carbs" current={dailyTotals.carbs} target={targets.carbs} color="#fbbf24" unit="g" />
              <MacroRing label="Fat" current={dailyTotals.fat} target={targets.fat} color="#a78bfa" unit="g" />
            </div>
          </CardContent>
        </Card>

        {/* Favorites Quick-Log */}
        <FavoritesSection
          favorites={mealFavs.favorites}
          onQuickLog={(fav) => addMeal(fav.items, fav.totals)}
          onRemove={(id) => mealFavs.removeFavorite(id)}
          loading={mealFavs.loading}
        />

        {/* Camera + Gallery + Description Buttons */}
        <div className="flex gap-2">
          <button
            aria-label="Take food photo"
            onClick={() => cameraInputRef.current?.click()}
            disabled={analyzing}
            className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 hover:border-primary/50 hover:from-primary/30 hover:to-primary/30 transition-all duration-200 group disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm font-semibold text-primary">Analyzing...</span>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold text-primary block">Snap Food</span>
                  <span className="text-[0.65rem] text-primary/50">AI analyzes calories</span>
                </div>
              </>
            )}
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            aria-label="Upload food photo"
            onClick={() => galleryInputRef.current?.click()}
            disabled={analyzing}
            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <ImagePlus className="h-5 w-5 text-white/60" />
            <span className="text-xs font-medium text-white/60">Upload</span>
          </button>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            aria-label="Describe food"
            onClick={() => { setShowDescription(!showDescription); setShowManual(false); }}
            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <Search className="h-5 w-5 text-white/60" />
            <span className="text-xs font-medium text-white/60">Describe</span>
          </button>
        </div>

        {/* Error */}
        {error && !dismissedError && (
          <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
            <span>{error}</span>
            <button
              aria-label="Dismiss error"
              onClick={() => setDismissedError(true)}
              className="ml-2 p-1 text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Sync error */}
        {syncError && !dismissedSyncError && (
          <div className="flex items-center justify-between p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-[0.65rem] text-yellow-400/80">
            <span>{syncError}</span>
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <button
                onClick={() => retrySave()}
                className="px-2 py-0.5 rounded-md bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-[0.65rem] font-medium transition-colors"
              >
                Retry
              </button>
              <button
                aria-label="Dismiss sync error"
                onClick={() => setDismissedSyncError(true)}
                className="p-1 text-yellow-400/60 hover:text-yellow-400 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Text Description Input */}
        {showDescription && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white/80">Describe Your Meal</span>
                <button aria-label="Close description" onClick={() => setShowDescription(false)} className="p-1 text-white/30 hover:text-white/60">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={descriptionText}
                onChange={e => setDescriptionText(e.target.value)}
                placeholder="Describe what you ate (e.g. 2 chicken thighs, 1 cup rice, 1 cup broccoli)"
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-primary/40 outline-none resize-none"
              />
              <Button
                onClick={handleDescriptionLookup}
                className="w-full"
                disabled={!descriptionText.trim() || analyzing}
              >
                {analyzing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span>Look Up</span>
                  </div>
                )}
              </Button>
              <button
                onClick={() => { setShowManual(true); setShowDescription(false); }}
                className="w-full text-center text-[0.65rem] text-white/30 hover:text-white/50 transition-colors"
              >
                Enter macros manually
              </button>
            </CardContent>
          </Card>
        )}

        {/* Manual Entry Form */}
        {showManual && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white/80">Add Food</span>
                <button aria-label="Close manual entry" onClick={() => setShowManual(false)} className="p-1 text-white/30 hover:text-white/60">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  aria-label="Food name"
                  placeholder="Food name"
                  value={manualForm.name}
                  onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))}
                  className="col-span-2 px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-primary/40 outline-none"
                />
                <input
                  aria-label="Portion size"
                  placeholder="Portion (e.g. 1 cup)"
                  value={manualForm.portion}
                  onChange={e => setManualForm(f => ({ ...f, portion: e.target.value }))}
                  className="col-span-2 px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-primary/40 outline-none"
                />
                <input
                  aria-label="Calories"
                  placeholder="Calories (kcal)"
                  inputMode="numeric"
                  value={manualForm.calories}
                  onChange={e => setManualForm(f => ({ ...f, calories: e.target.value.replace(/[^0-9.]/g, '') }))}
                  className="px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-primary/40 outline-none"
                />
                <input
                  aria-label="Protein in grams"
                  placeholder="Protein (g)"
                  inputMode="numeric"
                  value={manualForm.protein}
                  onChange={e => setManualForm(f => ({ ...f, protein: e.target.value.replace(/[^0-9.]/g, '') }))}
                  className="px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-primary/40 outline-none"
                />
                <input
                  aria-label="Carbs in grams"
                  placeholder="Carbs (g)"
                  inputMode="numeric"
                  value={manualForm.carbs}
                  onChange={e => setManualForm(f => ({ ...f, carbs: e.target.value.replace(/[^0-9.]/g, '') }))}
                  className="px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-primary/40 outline-none"
                />
                <input
                  aria-label="Fat in grams"
                  placeholder="Fat (g)"
                  inputMode="numeric"
                  value={manualForm.fat}
                  onChange={e => setManualForm(f => ({ ...f, fat: e.target.value.replace(/[^0-9.]/g, '') }))}
                  className="px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-primary/40 outline-none"
                />
              </div>
              <Button onClick={handleManualSubmit} className="w-full" disabled={!manualForm.name && !manualForm.calories}>
                Add Food
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Daily Meal Log */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Utensils className="h-4 w-4 text-white/30" />
            <span className="text-sm font-semibold text-white/60">{isTodaySelected ? "Today's" : fnsFormat(parsedDate, 'MMM d')} Log</span>
            <Badge variant="outline" className="text-[0.65rem] px-1.5 py-0 text-white/30 border-white/10">
              {meals.length} {meals.length === 1 ? 'meal' : 'meals'}
            </Badge>
          </div>

          {meals.length === 0 ? (
            <div className="text-center py-8 text-white/20 text-sm">
              No meals logged yet. Snap a photo or describe what you ate.
            </div>
          ) : (
            <MealTimeline
              meals={meals}
              editingMealId={editingMealId}
              editingItems={editingItems}
              onStartEditing={startEditing}
              onSaveEditing={saveEditing}
              onCancelEditing={cancelEditing}
              onUpdateEditingItem={updateEditingItem}
              onRemoveEditingItem={removeEditingItem}
              onRemoveMeal={removeMeal}
              onOpenDetail={(id) => setDetailMealId(id)}
            />
          )}
        </div>

        {/* Meal Detail Dialog */}
        <MealDetailDialog
          meal={meals.find(m => m.id === detailMealId) ?? null}
          mealIndex={meals.findIndex(m => m.id === detailMealId)}
          open={detailMealId !== null}
          onOpenChange={(open) => { if (!open) setDetailMealId(null); }}
          onSaveAsFavorite={(meal) => mealFavs.addFavorite(meal)}
          isFavorited={detailMealId ? mealFavs.isFavorited(meals.find(m => m.id === detailMealId) ?? { items: [] }) : false}
        />

        {/* Daily Summary Bar */}
        {meals.length > 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50 font-medium">Daily Total</span>
                <div className="flex gap-3">
                  <span className={dailyTotals.calories > targets.calories ? 'text-red-400 font-medium' : 'text-white/60'}>
                    {Math.round(dailyTotals.calories)} cal
                  </span>
                  <span className={dailyTotals.protein >= targets.protein ? 'text-blue-400' : 'text-white/40'}>
                    {Math.round(dailyTotals.protein)}g P
                  </span>
                  <span className={dailyTotals.carbs > targets.carbs ? 'text-red-400' : 'text-white/40'}>
                    {Math.round(dailyTotals.carbs)}g C
                  </span>
                  <span className={dailyTotals.fat > targets.fat ? 'text-red-400' : 'text-white/40'}>
                    {Math.round(dailyTotals.fat)}g F
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[0.65rem] text-white/25 space-y-1">
          <p>Daily targets: {targets.calories} cal | {targets.protein}g protein | {targets.carbs}g carbs | {targets.fat}g fat</p>
          <p>Based on: 5'0", 20yo, 134 lbs, goal 120 lbs, 3x/week lifting, ~2 lb/week loss</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
