import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, ImagePlus, Search, Utensils, X } from 'lucide-react';
import { useNutritionTracker, DAILY_TARGETS } from '@/hooks/useNutritionTracker';
import type { FoodItem } from '@/hooks/useNutritionTracker';
import SonnyAngelDetailed from '@/components/characters/SonnyAngelDetailed';
import BottomNav from '@/components/BottomNav';
import MealTimeline from '@/components/MealTimeline';
import MealDetailDialog from '@/components/MealDetailDialog';

function MacroRing({ label, current, target, color, unit }: {
  label: string; current: number; target: number; color: string; unit: string;
}) {
  const pct = Math.min((current / target) * 100, 100);
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const over = current > target;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-[76px] h-[76px]">
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
      <span className="text-[0.65rem] text-white/40">{label}</span>
      <span className="text-[0.65rem] text-white/20">{target}{unit} goal</span>
    </div>
  );
}

export default function NutritionPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    meals, dailyTotals, targets, analyzing, error, syncError,
    analyzePhoto, analyzeDescription, addMeal, addManualItem, removeMeal, updateMeal,
  } = useNutritionTracker();

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

  // Auto-trigger camera when navigating with ?camera=true
  useEffect(() => {
    if (searchParams.get('camera') === 'true') {
      setSearchParams({}, { replace: true });
      const timer = setTimeout(() => {
        cameraInputRef.current?.click();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await analyzePhoto(file);
    if (result) {
      // Read base64 and auto-save
      const thumbReader = new FileReader();
      thumbReader.onload = () => {
        const base64 = (thumbReader.result as string).split(',')[1];
        addMeal(result.items, result.totals, base64);
      };
      thumbReader.readAsDataURL(file);
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

  const remaining = {
    calories: Math.max(0, targets.calories - dailyTotals.calories),
    protein: Math.max(0, targets.protein - dailyTotals.protein),
    carbs: Math.max(0, targets.carbs - dailyTotals.carbs),
    fat: Math.max(0, targets.fat - dailyTotals.fat),
  };

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

        {/* Daily Macro Rings */}
        <Card className="bg-black/50 backdrop-blur-glass border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white/80">Today's Macros</span>
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
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Sync error */}
        {syncError && (
          <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-[0.65rem] text-yellow-400/80">
            {syncError}
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
              <div className="grid grid-cols-2 gap-2">
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
                  placeholder="Calories"
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
            <span className="text-sm font-semibold text-white/60">Today's Log</span>
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
          <p>Daily targets: {DAILY_TARGETS.calories} cal | {DAILY_TARGETS.protein}g protein | {DAILY_TARGETS.carbs}g carbs | {DAILY_TARGETS.fat}g fat</p>
          <p>Based on: 5'0", 20yo, 134 lbs, goal 120 lbs, 3x/week lifting, ~1 lb/week loss</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
