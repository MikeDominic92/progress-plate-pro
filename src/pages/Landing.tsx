import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Flame, Zap, Clock, Activity, Dumbbell, X, Play, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CircularProgress } from '@/components/CircularProgress';
import { ResetSessionButton } from '@/components/ResetSessionButton';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import { useProgression } from '@/hooks/useProgression';
import { useWeightTracker } from '@/hooks/useWeightTracker';
import { WeightTracker } from '@/components/WeightTracker';
import { WorkoutCalendar } from '@/components/WorkoutCalendar';
import { format, differenceInCalendarDays } from 'date-fns';
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
  workout_data: any;
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
  const { completedSessionCount, allPRs } = useProgression(username);
  const weight = useWeightTracker(username);


  useEffect(() => {
    if (username.trim()) {
      fetchInProgressSession();
      fetchCompletedDays();
    }
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
  const progressPct = Math.round((totalCompletedDays / 90) * 100);
  const nextWorkoutDay: WorkoutDay | undefined = workoutPlan[totalCompletedDays];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(340_82%_66%/0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(0_100%_75%/0.1),transparent_50%)]" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 pb-20">
        <div className="w-full max-w-sm">
          <div className="relative bg-card/20 backdrop-blur-glass rounded-2xl border border-white/20 shadow-2xl p-4 sm:p-6 transition-all duration-500 hover:bg-card/30 active:bg-card/30 hover:border-primary/30 active:border-primary/30">

            {/* Title */}
            <div className="text-center mb-6 relative">
              <div className="absolute -top-2 -right-2 pointer-events-none">
                <SonnyAngelDetailed variant="bunny" size={48} />
              </div>
              <h1 className="text-3xl font-extrabold mb-1 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
                KaraBaeFit
              </h1>
              <p className="text-xs text-muted-foreground/60">
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
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 relative">
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
                <span className="text-white/40 text-xs">PRs</span>
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-sm animate-slide-in"
                style={{ animationDelay: '0.3s' }}
                title={bestStreak > currentStreak ? `Best streak: ${bestStreak} days` : undefined}
              >
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-white/80 font-medium">{currentStreak}</span>
                <span className="text-white/40 text-xs">streak</span>
                {bestStreak > currentStreak && (
                  <span className="text-white/30 text-xs ml-0.5">(best: {bestStreak})</span>
                )}
              </div>
            </div>

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
              />
            </div>

            {/* Weight Display */}
            <div className="mb-4 flex flex-col items-center gap-0.5">
              <span className="text-2xl font-extrabold text-green-400">
                {weight.latestWeight ? `${weight.latestWeight}` : '--'}
                <span className="text-sm font-semibold text-green-400/60 ml-1">lb</span>
              </span>
              {weight.latestWeight && weight.latestWeight > 120 ? (
                <span className="text-sm font-semibold text-yellow-400">
                  {(weight.latestWeight - 120).toFixed(1)} lb to go
                </span>
              ) : weight.latestWeight ? (
                <span className="text-sm font-semibold text-green-400">Goal reached!</span>
              ) : null}
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

      <BottomNav />
    </div>
  );
};

export default Landing;
