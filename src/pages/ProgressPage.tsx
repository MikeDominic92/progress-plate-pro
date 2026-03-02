import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useProgression } from '@/hooks/useProgression';
import { useWeightTracker } from '@/hooks/useWeightTracker';
import { useSettings } from '@/hooks/useSettings';
import { useWeeklyProgress } from '@/hooks/useWeeklyProgress';
import { supabase } from '@/integrations/supabase/client';
import { differenceInCalendarDays, format } from 'date-fns';
import { WeeklyVolumeChart } from '@/components/progress/WeeklyVolumeChart';
import { MacroAdherenceCard } from '@/components/progress/MacroAdherenceCard';
import { BodyWeightSparkline } from '@/components/progress/BodyWeightSparkline';
import { WeekStatsRow } from '@/components/progress/WeekStatsRow';
import { UserConsistencyHeatmap } from '@/components/progress/UserConsistencyHeatmap';
import BottomNav from '@/components/BottomNav';

export default function ProgressPage() {
  const { username } = useAuthenticatedUser();
  const { allPRs } = useProgression(username);
  const { weightLogs } = useWeightTracker(username);
  const { settings } = useSettings(username);

  const [completedDayDates, setCompletedDayDates] = useState<string[]>([]);

  useEffect(() => {
    if (!username.trim()) return;
    (async () => {
      const { data } = await supabase
        .from('workout_sessions')
        .select('session_date')
        .eq('username', username.trim())
        .eq('current_phase', 'completed')
        .order('session_date', { ascending: true });
      const dates = [...new Set(data?.map(s => s.session_date) || [])];
      setCompletedDayDates(dates);
    })();
  }, [username]);

  // Streak calculation
  const { currentStreak } = (() => {
    if (completedDayDates.length === 0) return { currentStreak: 0 };
    const today = new Date(format(new Date(), 'yyyy-MM-dd') + 'T00:00:00');
    let runLength = 1;
    for (let i = 1; i < completedDayDates.length; i++) {
      const prev = new Date(completedDayDates[i - 1] + 'T00:00:00');
      const curr = new Date(completedDayDates[i] + 'T00:00:00');
      const diff = differenceInCalendarDays(curr, prev);
      if (diff === 1) runLength++;
      else if (diff > 1) runLength = 1;
    }
    const lastDate = new Date(completedDayDates[completedDayDates.length - 1] + 'T00:00:00');
    const daysSinceLast = differenceInCalendarDays(today, lastDate);
    return { currentStreak: daysSinceLast <= 1 ? runLength : 0 };
  })();

  const weeklyProgress = useWeeklyProgress(
    username,
    completedDayDates,
    allPRs,
    currentStreak,
    weightLogs,
    settings.daily_targets,
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(340_82%_66%/0.1),transparent_50%)]" />

      <div className="relative z-10 container mx-auto p-3 sm:p-4 max-w-lg space-y-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-extrabold text-white">Progress</h1>
        </div>

        {weeklyProgress.loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Week Stats */}
            <WeekStatsRow
              sessionsThisWeek={weeklyProgress.sessionsThisWeek}
              prsThisWeek={weeklyProgress.prsThisWeek}
              currentStreak={weeklyProgress.currentStreak}
            />

            {/* Weekly Volume Chart */}
            <WeeklyVolumeChart data={weeklyProgress.weeklyVolumes} />

            {/* Macro Adherence */}
            <MacroAdherenceCard
              pct={weeklyProgress.macroAdherencePct}
              days={weeklyProgress.macroAdherenceDays}
            />

            {/* Body Weight Sparkline */}
            <BodyWeightSparkline
              data={weeklyProgress.recentWeights}
              weightUnit={settings.weight_unit}
            />

            {/* Consistency Heatmap */}
            <UserConsistencyHeatmap weeks={weeklyProgress.heatmapWeeks} />
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
