import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, Flame, Zap, Clock, Activity, Dumbbell, X, Play, Trash2, Scale, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CircularProgress } from '@/components/CircularProgress';
import { ResetSessionButton } from '@/components/ResetSessionButton';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import { useProgression } from '@/hooks/useProgression';
import { useWeightTracker } from '@/hooks/useWeightTracker';
import { useSettings } from '@/hooks/useSettings';
import { useBadges } from '@/hooks/useBadges';
import { BadgeCelebration } from '@/components/BadgeCelebration';
import { BadgeGallery } from '@/components/BadgeGallery';
import { Award } from 'lucide-react';
import ExplainTerm from '@/components/ExplainTerm';
import { WorkoutCalendar } from '@/components/WorkoutCalendar';
import { format, differenceInCalendarDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { workoutPlan } from '@/data/workoutPlan';
import type { WorkoutDay } from '@/data/workoutPlan';
import SonnyAngelDetailed from '@/components/characters/SonnyAngelDetailed';
import BottomNav from '@/components/BottomNav';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface WorkoutSession {
  id: string;
  username: string;
  session_date: string;
  current_phase: string;
  cardio_completed: boolean;
  warmup_completed: boolean;
  workout_data: Record<string, unknown>;
  updated_at: string;
}

interface LandingProps {
  username: string;
  onStartWorkout: (existingSession?: WorkoutSession) => void;
}

const Landing = ({ username, onStartWorkout }: LandingProps) => {
  const [inProgressSession, setInProgressSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [showStartCard, setShowStartCard] = useState(true);
  const [totalCompletedDays, setTotalCompletedDays] = useState(0);
  const [completedDayDates, setCompletedDayDates] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { clearSession, deleteSessionByDate } = useWorkoutStorage(username);
  const [deletingDate, setDeletingDate] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);
  const [selectedCalDate, setSelectedCalDate] = useState<Date | null>(null);
  const { completedSessionCount, allPRs, recentSessions, totalVolumeAllTime } = useProgression(username);
  const badges = useBadges(username);
  const [showBadgeGallery, setShowBadgeGallery] = useState(false);
  const navigate = useNavigate();

  // Secret admin access: tap title 5 times
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTitleTap = useCallback(() => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      navigate('/admin');
      return;
    }
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 1500);
  }, [navigate]);
  const weight = useWeightTracker(username);
  const { settings, formatWeight } = useSettings(username);
  const weightUnit = settings.weight_unit;
  const { toast } = useToast();

  useEffect(() => {
    if (username.trim()) {
      fetchInProgressSession();
      fetchCompletedDays();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch functions are stable but not memoized; adding them would cause infinite re-fetches
  }, [username]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const fetchCompletedDays = async () => {
    if (!username.trim()) return;
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('session_date')
        .eq('username', username.trim())
        .eq('current_phase', 'completed')
        .order('session_date', { ascending: true });

      if (error) throw error;
      const uniqueDays = [...new Set(data?.map(s => s.session_date) || [])];
      setTotalCompletedDays(uniqueDays.length);
      setCompletedDayDates(uniqueDays);
    } catch {
      setTotalCompletedDays(0);
      setCompletedDayDates([]);
    }
  };

  const fetchInProgressSession = async () => {
    if (!username.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('username', username.trim())
        .neq('current_phase', 'completed')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      setInProgressSession(data?.[0] || null);
    } catch {
      setInProgressSession(null);
    } finally {
      setLoading(false);
    }
  };

  const getPhaseDisplay = (phase: string) => {
    switch (phase) {
      case 'cardio': return 'Cardio';
      case 'warmup': return 'Warmup';
      case 'main': return 'Main Workout';
      default: return phase;
    }
  };

  // Streak calculation: iterate sorted dates, count consecutive days
  const { currentStreak, bestStreak } = (() => {
    if (completedDayDates.length === 0) return { currentStreak: 0, bestStreak: 0 };

    const today = new Date(format(new Date(), 'yyyy-MM-dd') + 'T00:00:00');
    let maxRun = 1;
    let runLength = 1;

    // Walk through sorted dates tracking consecutive runs
    for (let i = 1; i < completedDayDates.length; i++) {
      const prev = new Date(completedDayDates[i - 1] + 'T00:00:00');
      const curr = new Date(completedDayDates[i] + 'T00:00:00');
      const diff = differenceInCalendarDays(curr, prev);

      if (diff === 1) {
        runLength++;
      } else if (diff > 1) {
        runLength = 1;
      }
      // diff === 0 means duplicate date, skip without resetting

      if (runLength > maxRun) maxRun = runLength;
    }

    // The last run in the loop is the most recent consecutive run.
    // Check if it touches today or yesterday to qualify as "current".
    const lastDate = new Date(completedDayDates[completedDayDates.length - 1] + 'T00:00:00');
    const daysSinceLast = differenceInCalendarDays(today, lastDate);
    const current = daysSinceLast <= 1 ? runLength : 0;

    return { currentStreak: current, bestStreak: maxRun };
  })();
  // Check for new badge unlocks
  useEffect(() => {
    if (badges.loading) return;
    const dailyVolumes = recentSessions.map(s => s.totalVolume);
    badges.checkAndUnlock({
      prCount: allPRs.length,
      bestStreak,
      currentStreak,
      sessionCount: completedSessionCount,
      dailyVolumes,
      totalVolumeAllTime,
      nutritionStreak: 0,
      macroAccuracy: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- badges, currentStreak, and recentSessions are intentionally omitted to avoid infinite re-render loops
  }, [completedSessionCount, allPRs.length, bestStreak, totalVolumeAllTime, badges.loading]);

  const progressPct = Math.round((totalCompletedDays / 90) * 100);
  const thisWeekCount = (() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    return completedDayDates.filter(d =>
      isWithinInterval(new Date(d + 'T00:00:00'), { start: weekStart, end: weekEnd })
    ).length;
  })();
  const nextWorkoutDay: WorkoutDay | undefined = workoutPlan[totalCompletedDays];

  const logDate = selectedCalDate ? format(selectedCalDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  const logDateLabel = selectedCalDate ? format(selectedCalDate, 'M/d') : 'Today';

  const handleLogWeight = async () => {
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) return;
    setSavingWeight(true);
    try {
      await weight.logWeight(logDate, val);
      setWeightInput('');
      setSelectedCalDate(null);
      toast({ title: "Weight logged", description: `${formatWeight(val)} recorded for ${logDateLabel}` });
    } catch (err) {
      console.error('Weight log error:', err);
      toast({ title: "Failed to log weight", description: "Please try again.", variant: "destructive" });
    } finally {
      setSavingWeight(false);
    }
  };

  const handleSetGoal = async () => {
    const val = parseFloat(goalInput);
    if (isNaN(val) || val <= 0) return;
    setSavingWeight(true);
    try {
      await weight.updateGoalWeight(val);
      setGoalInput('');
      setEditingGoal(false);
      toast({ title: "Goal updated", description: `Goal set to ${formatWeight(val)}` });
    } catch (err) {
      console.error('Goal save error:', err);
      toast({ title: "Failed to save goal", description: "Please try again.", variant: "destructive" });
    } finally {
      setSavingWeight(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(340_82%_66%/0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(0_100%_75%/0.1),transparent_50%)]" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 pb-20">
        <div className="w-full max-w-sm md:max-w-md lg:max-w-lg">
          <div className="relative bg-card/20 backdrop-blur-glass rounded-2xl border border-white/20 shadow-2xl p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-500 hover:bg-card/30 active:bg-card/30 hover:border-primary/30 active:border-primary/30">

            {/* Title */}
            <div className="text-center mb-6 relative">
              <div className="absolute -top-2 -right-2 pointer-events-none">
                <SonnyAngelDetailed variant="bunny" size={48} />
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <h1
                  onClick={handleTitleTap}
                  className="text-3xl font-extrabold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight cursor-default select-none"
                >
                  KaraBaeFit
                </h1>
                <span className="text-[10px] text-white/20 font-light">
                  v1.1.2 • 3/9/26
                </span>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Made with love by Mikey for his Baby Kara
              </p>
            </div>

            {/* Progress Ring */}
            <div className="flex flex-col items-center mb-6 relative">
              <CircularProgress percentage={progressPct} size={100} strokeWidth={10} />
              <p className="text-sm text-muted-foreground mt-2">
                Day {totalCompletedDays + 1} of 90
              </p>
              {completedDayDates.length > 0 && (
                <button
                  onClick={() => setDeletingDate(completedDayDates[completedDayDates.length - 1])}
                  className="mt-1.5 flex items-center gap-1 text-[0.65rem] text-white/25 hover:text-red-400/60 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove last workout
                </button>
              )}
              <div className="absolute -bottom-2 -left-4 pointer-events-none">
                <SonnyAngelDetailed variant="flower" size={40} />
              </div>
            </div>

            {/* Today's Workout Summary */}
            {nextWorkoutDay && (() => {
              const parseSetCount = (sets?: string): number => {
                if (!sets) return 0;
                if (sets.includes('|')) return sets.split('|').length;
                const match = sets.match(/(\d+)\s*warm-up.*?\+\s*(\d+)\s*working/i);
                if (match) return parseInt(match[1]) + parseInt(match[2]);
                return 4;
              };
              const totalSets = nextWorkoutDay.exercises.reduce((sum, ex) => sum + parseSetCount(ex.sets), 0);
              const approxMin = Math.round(totalSets * 3 + 10);
              return (
                <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Dumbbell className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-white/90">Today's Workout</span>
                    <Badge variant="outline" className={`ml-auto text-[0.6rem] px-1.5 py-0 ${
                      nextWorkoutDay.type === 'high-intensity'
                        ? 'text-accent border-accent/50 bg-accent/10'
                        : 'text-primary border-primary/50 bg-primary/10'
                    }`}>
                      {nextWorkoutDay.type === 'high-intensity' ? 'High Intensity' : 'Technique & Cardio'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mb-2 text-[0.65rem] text-white/40">
                    <span>{totalSets} sets</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      ~{approxMin} min
                    </span>
                  </div>
                  <div className="space-y-1.5 mb-2">
                    {nextWorkoutDay.exercises.map((ex) => {
                      const setCount = parseSetCount(ex.sets);
                      return (
                        <div key={ex.name} className="flex items-center justify-between text-xs">
                          <span className="text-white/70 truncate mr-2">{ex.name}</span>
                          <span className="text-white/30 flex-shrink-0 text-[0.6rem]">
                            {setCount > 0 ? `${setCount} sets` : 'Follow along'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[0.6rem] text-muted-foreground/40">{nextWorkoutDay.cardio}</p>
                </div>
              );
            })()}

            {/* Start Workout Card */}
            {showStartCard && nextWorkoutDay && (
              <div className="mb-4 relative">
                <button
                  onClick={() => setShowStartCard(false)}
                  className="absolute -top-1.5 -right-1.5 z-10 p-1 rounded-full bg-white/10 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/20 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onStartWorkout()}
                  className="w-full p-3.5 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 hover:border-primary/50 hover:from-primary/30 hover:to-primary/30 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                      <Play className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-bold text-primary block">
                        Start Day {totalCompletedDays + 1} Workout
                      </span>
                      <span className="text-[0.6rem] text-primary/50">
                        {nextWorkoutDay.type === 'high-intensity' ? 'High Intensity Strength' : 'Technique & Cardio'}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* In-progress session resume */}
            {inProgressSession && (
              <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="text-foreground/90 font-medium">
                        {getPhaseDisplay(inProgressSession.current_phase)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/60">
                      {format(new Date(inProgressSession.updated_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => onStartWorkout(inProgressSession)}
                      size="sm"
                      className="bg-gradient-primary hover:shadow-glow"
                    >
                      Resume
                    </Button>
                    <button
                      onClick={async () => {
                        if (inProgressSession?.session_date) {
                          await deleteSessionByDate(inProgressSession.session_date);
                        }
                        setInProgressSession(null);
                      }}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6" />

            {/* Stat Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:gap-4 mb-1 relative">
              <div className="absolute -top-1 -right-2 pointer-events-none">
                <SonnyAngelDetailed variant="strawberry" size={36} />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-sm animate-slide-in" style={{ animationDelay: '0.1s' }}>
                <Flame className="h-3.5 w-3.5 text-accent" />
                <span className="text-white/80 font-medium">{completedSessionCount}</span>
                <span className="text-white/40 text-xs">sessions</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-sm animate-slide-in" style={{ animationDelay: '0.2s' }}>
                <Trophy className="h-3.5 w-3.5 text-yellow-300" />
                <span className="text-white/80 font-medium">{allPRs.length}</span>
                <ExplainTerm term="PRs"><span className="text-white/40 text-xs">PRs</span></ExplainTerm>
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-sm animate-slide-in"
                style={{ animationDelay: '0.3s' }}
                title={bestStreak > currentStreak ? `Best streak: ${bestStreak} days` : undefined}
              >
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-white/80 font-medium">{currentStreak}</span>
                <ExplainTerm term="Streak"><span className="text-white/40 text-xs">streak</span></ExplainTerm>
                {bestStreak > currentStreak && (
                  <span className="text-white/30 text-xs ml-0.5">(best: {bestStreak})</span>
                )}
              </div>
              <button
                onClick={() => setShowBadgeGallery(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-sm animate-slide-in hover:bg-primary/10 transition-colors"
                style={{ animationDelay: '0.4s' }}
              >
                <Award className="h-3.5 w-3.5 text-yellow-400" />
                <span className="text-white/80 font-medium">{badges.unlockedIds.length}</span>
                <span className="text-white/40 text-xs">badges</span>
              </button>
            </div>
            <p className="text-center text-xs text-white/30 mt-1 mb-4">This week: {thisWeekCount} workout{thisWeekCount !== 1 ? 's' : ''}</p>

            {/* Date/Time Display */}
            <div className="text-center mb-4">
              <p className="text-base sm:text-lg font-semibold text-white/90">
                {format(currentTime, 'EEEE, MMMM d')}
              </p>
              <p className="text-xs text-white/40">
                {format(currentTime, 'h:mm a')}
              </p>
            </div>

            {/* Workout Calendar */}
            <div className="mb-4">
              <WorkoutCalendar
                workoutDates={completedDayDates.map(d => new Date(d + 'T00:00:00'))}
                weightLogDates={[...weight.weightDatesSet].map(d => new Date(d + 'T00:00:00'))}
                completedDayDates={completedDayDates}
                weightLogs={weight.weightLogs}
                goalWeight={weight.goalWeight}
                selectedDate={selectedCalDate}
                onSelectDate={setSelectedCalDate}
                weightUnit={weightUnit}
              />
            </div>

            {/* Weight Log + Goal Input */}
            <div className="mb-4 space-y-2 w-full">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary flex-shrink-0" />
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={`Weight for ${logDateLabel} (${weightUnit})`}
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogWeight()}
                  aria-label="Log weight in pounds"
                  className="flex-1 min-w-0 rounded-lg border border-white/10 bg-white/[0.03] text-white placeholder:text-white/25 px-3 py-2 text-sm transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none hover:border-white/20"
                />
                <Button
                  onClick={handleLogWeight}
                  disabled={savingWeight || !weightInput}
                  size="sm"
                  className="bg-gradient-primary hover:shadow-glow active:bg-primary/20 text-xs px-4 h-9"
                >
                  {savingWeight ? '...' : 'Log'}
                </Button>
              </div>

              {/* Goal weight row */}
              {!editingGoal && (
                <button
                  onClick={() => { setEditingGoal(true); setGoalInput(weight.goalWeight ? String(weight.goalWeight) : ''); }}
                  className="flex items-center gap-2 w-full text-left px-1 py-1 rounded-md hover:bg-white/5 transition-colors"
                >
                  <Target className="h-3.5 w-3.5 text-yellow-400/70 flex-shrink-0" />
                  {weight.goalWeight ? (
                    <span className="text-xs text-white/40">Goal: <span className="text-yellow-400 font-medium">{formatWeight(weight.goalWeight!)}</span> <span className="text-white/20 ml-1">tap to edit</span></span>
                  ) : (
                    <span className="text-xs text-primary/60">Set a goal weight</span>
                  )}
                </button>
              )}
              {editingGoal && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-yellow-400/70 flex-shrink-0" />
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder={`Goal weight (${weightUnit})`}
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSetGoal()}
                    aria-label="Set goal weight in pounds"
                    className="flex-1 min-w-0 rounded-lg border border-yellow-400/20 bg-white/[0.03] text-white placeholder:text-white/25 px-3 py-2 text-sm transition-all duration-200 focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/10 focus:outline-none"
                    autoFocus
                  />
                  <Button
                    onClick={handleSetGoal}
                    disabled={savingWeight || !goalInput}
                    size="sm"
                    variant="ghost"
                    className="text-xs px-3 h-9 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => setEditingGoal(false)}
                    size="sm"
                    variant="ghost"
                    className="text-xs px-2 h-9 text-white/30 hover:text-white/50"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Loading state */}
            {loading && (
              <div className="text-center text-muted-foreground/70 py-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reset Session Button - Admin only */}
        {username.toLowerCase() === 'admin' && (
          <ResetSessionButton onClearSession={clearSession} />
        )}
      </div>

      <AlertDialog open={deletingDate !== null} onOpenChange={(open) => { if (!open) setDeletingDate(null); }}>
        <AlertDialogContent className="max-w-xs rounded-xl border-white/10 bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white/90">Remove this workout?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the completed workout for {deletingDate}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/60">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (deletingDate) {
                  const success = await deleteSessionByDate(deletingDate);
                  if (success) {
                    setCompletedDayDates(prev => prev.filter(d => d !== deletingDate));
                    setTotalCompletedDays(prev => prev - 1);
                  }
                }
                setDeletingDate(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {badges.newlyUnlocked.length > 0 && (
        <BadgeCelebration badgeIds={badges.newlyUnlocked} onClose={badges.dismissCelebration} />
      )}

      <BadgeGallery
        unlockedIds={badges.unlockedIds}
        open={showBadgeGallery}
        onOpenChange={setShowBadgeGallery}
      />

      <BottomNav />
    </div>
  );
};

export default Landing;
