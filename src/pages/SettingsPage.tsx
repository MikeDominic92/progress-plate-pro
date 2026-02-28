import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, Download } from 'lucide-react';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ExplainTerm from '@/components/ExplainTerm';
import BottomNav from '@/components/BottomNav';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { username } = useAuthenticatedUser();
  const { settings, updateSettings, loading } = useSettings(username);
  const { toast } = useToast();

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  // Initialize inputs from settings once loaded
  const [initialized, setInitialized] = useState(false);
  if (!initialized && !loading) {
    setCalories(String(settings.daily_targets.calories));
    setProtein(String(settings.daily_targets.protein));
    setCarbs(String(settings.daily_targets.carbs));
    setFat(String(settings.daily_targets.fat));
    setInitialized(true);
  }

  const handleTargetBlur = (field: 'calories' | 'protein' | 'carbs' | 'fat', value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;
    updateSettings({
      daily_targets: { ...settings.daily_targets, [field]: Math.round(num) },
    });
  };

  const handleUnitToggle = () => {
    updateSettings({ weight_unit: settings.weight_unit === 'lb' ? 'kg' : 'lb' });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  const handleExport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [nutritionRes, sessionsRes, profileRes] = await Promise.all([
        supabase.from('nutrition_logs').select('*').eq('user_id', user.id),
        supabase.from('workout_sessions').select('*').eq('username', username),
        supabase.from('profiles').select('*').eq('username', username).single(),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        username,
        profile: profileRes.data,
        nutrition_logs: nutritionRes.data,
        workout_sessions: sessionsRes.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `progress-plate-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Export complete', description: 'Your data has been downloaded.' });
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(340_82%_66%/0.1),transparent_50%)]" />

      <div className="relative z-10 container mx-auto p-3 sm:p-4 max-w-lg space-y-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-extrabold text-white">Settings</h1>
        </div>

        {/* Nutrition Targets */}
        <Card className="bg-black/50 backdrop-blur-glass border-white/10">
          <CardContent className="p-4 space-y-3">
            <span className="text-sm font-semibold text-white/80">Daily Nutrition Targets</span>
            <p className="text-[0.65rem] text-white/30">Based on <ExplainTerm term="TDEE"><span className="underline decoration-dotted decoration-white/20">TDEE</span></ExplainTerm> ~2,015, <ExplainTerm term="Deficit"><span className="underline decoration-dotted decoration-white/20">deficit</span></ExplainTerm> for ~2 lb/week loss</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Calories (kcal)', value: calories, set: setCalories, field: 'calories' as const },
                { label: 'Protein (g)', value: protein, set: setProtein, field: 'protein' as const },
                { label: 'Carbs (g)', value: carbs, set: setCarbs, field: 'carbs' as const },
                { label: 'Fat (g)', value: fat, set: setFat, field: 'fat' as const },
              ].map(({ label, value, set, field }) => (
                <div key={field} className="space-y-1">
                  <label className="text-[0.65rem] text-white/40">{label}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={value}
                    onChange={e => set(e.target.value)}
                    onBlur={() => handleTargetBlur(field, value)}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] text-white px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Units */}
        <Card className="bg-black/50 backdrop-blur-glass border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-white/80">Weight Unit</span>
                <p className="text-[0.65rem] text-white/30">Display weights in lb or kg</p>
              </div>
              <button
                onClick={handleUnitToggle}
                className={`relative w-16 h-8 rounded-full border transition-colors ${
                  settings.weight_unit === 'kg'
                    ? 'bg-primary/20 border-primary/40'
                    : 'bg-white/10 border-white/20'
                }`}
              >
                <span
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                    settings.weight_unit === 'kg' ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
                <span className="absolute inset-0 flex items-center justify-between px-2 text-[0.6rem] font-bold text-white/60">
                  <span>lb</span>
                  <span>kg</span>
                </span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="bg-black/50 backdrop-blur-glass border-white/10">
          <CardContent className="p-4 space-y-3">
            <span className="text-sm font-semibold text-white/80">Account</span>
            <div className="flex gap-2">
              <Button
                onClick={handleExport}
                variant="outline"
                className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 text-white/80"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="flex-1 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
