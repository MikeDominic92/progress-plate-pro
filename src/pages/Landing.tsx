import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, Flame, Zap, Clock, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CircularProgress } from '@/components/CircularProgress';
import { ResetSessionButton } from '@/components/ResetSessionButton';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import { useProgression } from '@/hooks/useProgression';
import { format } from 'date-fns';
import SonnyAngelDetailed from '@/components/characters/SonnyAngelDetailed';

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
  const [totalCompletedDays, setTotalCompletedDays] = useState(0);
  const { clearSession } = useWorkoutStorage(username);
  const { completedSessionCount, allPRs } = useProgression(username);
  const navigate = useNavigate();

  useEffect(() => {
    if (username.trim()) {
      fetchInProgressSession();
      fetchCompletedDays();
    }
  }, [username]);

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
    } catch {
      setTotalCompletedDays(0);
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

  // Best streak calculation (simple: consecutive days)
  const bestStreak = Math.min(totalCompletedDays, 90);
  const progressPct = Math.round((totalCompletedDays / 90) * 100);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(340_82%_66%/0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(0_100%_75%/0.1),transparent_50%)]" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-sm">
          <div className="relative bg-card/20 backdrop-blur-glass rounded-2xl border border-white/20 shadow-2xl p-6 transition-all duration-500 hover:bg-card/30 hover:border-primary/30">

            {/* Title */}
            <div className="text-center mb-6 relative">
              <div className="absolute -top-2 -right-2 pointer-events-none">
                <SonnyAngelDetailed variant="bunny" size={48} />
              </div>
              <h1 className="text-3xl font-extrabold mb-1 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
                Big Booty Builder
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
              <div className="absolute -bottom-2 -left-4 pointer-events-none">
                <SonnyAngelDetailed variant="flower" size={40} />
              </div>
            </div>

            {/* Stat Pills */}
            <div className="flex items-center justify-center gap-3 mb-6 relative">
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
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-sm animate-slide-in" style={{ animationDelay: '0.3s' }}>
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-white/80 font-medium">{bestStreak}</span>
                <span className="text-white/40 text-xs">streak</span>
              </div>
            </div>

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
                  <Button
                    onClick={() => onStartWorkout(inProgressSession)}
                    size="sm"
                    className="bg-gradient-primary hover:shadow-glow"
                  >
                    Resume
                  </Button>
                </div>
              </div>
            )}

            {/* Main action */}
            <Button
              onClick={() => onStartWorkout()}
              className="w-full h-14 text-lg font-bold bg-gradient-primary hover:shadow-glow rounded-xl transition-all duration-300 hover:scale-[1.02]"
            >
              {inProgressSession ? 'Start New Workout' : 'Start Workout'}
            </Button>

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
    </div>
  );
};

export default Landing;
