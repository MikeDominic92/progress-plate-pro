import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Activity, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ResetSessionButton } from '@/components/ResetSessionButton';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';

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
  onStartWorkout: (username: string, continueSession?: WorkoutSession) => void;
}

const Landing = ({ onStartWorkout }: LandingProps) => {
  const [username, setUsername] = useState('JackyBaebae');
  const [savedSessions, setSavedSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { clearSession } = useWorkoutStorage(username);

  useEffect(() => {
    if (username.trim()) {
      fetchSavedSessions();
    }
  }, [username]);

  const fetchSavedSessions = async () => {
    if (!username.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('username', username.trim())
        .order('updated_at', { ascending: false })
        .limit(1); // Only get the most recent session

      if (error) throw error;
      
      // Only show the session if it's not 100% complete
      const recentSession = data?.[0];
      if (recentSession) {
        const progress = calculateProgress(recentSession);
        if (progress < 100) {
          setSavedSessions([recentSession]);
        } else {
          setSavedSessions([]); // Don't show completed sessions
        }
      } else {
        setSavedSessions([]);
      }
    } catch (error) {
      console.error('Error fetching saved sessions:', error);
      setSavedSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (session: WorkoutSession) => {
    let completed = 0;
    let total = 3; // cardio, warmup, main workout

    if (session.cardio_completed) completed++;
    if (session.warmup_completed) completed++;
    
    // Check main workout progress
    if (session.workout_data && typeof session.workout_data === 'object') {
      const workoutData = session.workout_data;
      if (workoutData.logs && Object.keys(workoutData.logs).length > 0) {
        // If there are workout logs, consider it partially or fully completed
        const totalExercises = 11; // Based on the original workout structure
        const completedExercises = Object.keys(workoutData.logs).length;
        if (completedExercises >= totalExercises) {
          completed++; // Fully completed main workout
        } else if (completedExercises > 0) {
          completed += completedExercises / totalExercises; // Partial completion
        }
      }
    }

    return Math.round((completed / total) * 100);
  };

  const getPhaseDisplay = (phase: string) => {
    switch (phase) {
      case 'cardio': return 'Pre-Workout Cardio';
      case 'warmup': return 'Warmup';
      case 'main': return 'Main Workout';
      default: return phase;
    }
  };

  const handleBegin = () => {
    onStartWorkout(username.trim());
  };

  const handleContinue = (session: WorkoutSession) => {
    onStartWorkout(username.trim(), session);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated liquid glass background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(24_95%_53%/0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(24_95%_53%/0.1),transparent_50%)]" />
      
      {/* Floating glass orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-tl from-primary/15 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-primary/10 to-transparent rounded-full blur-lg animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg">
          {/* Main glass card */}
          <div className="relative group">
            {/* Glass card with enhanced liquid effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-card/40 to-card/20 backdrop-blur-[20px] rounded-2xl border border-white/10 shadow-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl" />
            
            {/* Inner content */}
            <div className="relative bg-card/20 backdrop-blur-glass rounded-2xl border border-white/20 shadow-2xl p-8 transition-all duration-500 hover:bg-card/30 hover:border-primary/30 hover:shadow-glow">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="relative">
                  <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                    Big Booty Builder Program
                  </h1>
                  <h2 className="text-2xl font-semibold mb-3 text-primary">
                    40 Day Challenge
                  </h2>
                  <div className="absolute inset-0 text-4xl font-bold blur-sm bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 bg-clip-text text-transparent">
                    Big Booty Builder Program
                  </div>
                </div>
                <p className="text-muted-foreground/80 text-lg mb-2">
                  Transform your physique with precision tracking
                </p>
                <p className="text-sm text-muted-foreground/60">
                  This App was made by DaBaebae
                </p>
              </div>

              {/* Username input - centered */}
              <div className="space-y-3 mb-6 text-center">
                <label htmlFor="username" className="text-sm font-medium text-foreground/90 block">
                  Username
                </label>
                <div className="relative max-w-xs mx-auto">
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="bg-card/30 backdrop-blur-sm border-white/20 text-foreground placeholder:text-muted-foreground/60 rounded-xl h-12 transition-all duration-300 focus:border-primary/50 focus:bg-card/40 focus:shadow-glow text-center"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100 pointer-events-none" />
                </div>
              </div>

              {/* Begin button - centered */}
              <div className="mb-8 flex justify-center">
                <Button 
                  onClick={handleBegin}
                  className="w-full max-w-xs h-12 bg-gradient-to-r from-primary via-primary-glow to-primary hover:from-primary/90 hover:via-primary-glow/90 hover:to-primary/90 text-primary-foreground font-semibold rounded-xl transition-all duration-300 hover:shadow-glow hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed border border-primary/20"
                  disabled={!username.trim() || loading}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Begin New Workout</span>
                    <div className="w-2 h-2 bg-primary-foreground/30 rounded-full animate-pulse" />
                  </div>
                </Button>
              </div>

              {/* Saved sessions */}
              {savedSessions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-foreground/90">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Continue Previous Sessions</h3>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent" />
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/20">
                    {savedSessions.map((session) => {
                      const progress = calculateProgress(session);
                      return (
                        <div key={session.id} className="group relative">
                          {/* Glass session card */}
                          <div className="relative bg-card/20 backdrop-blur-sm border border-white/10 rounded-xl p-4 transition-all duration-300 hover:bg-card/30 hover:border-primary/30 hover:shadow-lg">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2 flex-1">
                                {/* Date and time */}
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="flex items-center gap-2 text-muted-foreground/80">
                                    <Calendar className="h-4 w-4" />
                                    <span>{format(new Date(session.session_date), 'MMM dd, yyyy')}</span>
                                  </div>
                                  <div className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
                                  <span className="text-xs text-muted-foreground/60">
                                    {format(new Date(session.updated_at), 'HH:mm')}
                                  </span>
                                </div>
                                
                                {/* Phase and progress */}
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium text-foreground/90">
                                      {getPhaseDisplay(session.current_phase)}
                                    </span>
                                  </div>
                                  <Badge 
                                    variant="secondary" 
                                    className="bg-primary/10 text-primary border-primary/20 text-xs font-medium px-2 py-1"
                                  >
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    {progress}% Complete
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Continue button */}
                              <Button
                                onClick={() => handleContinue(session)}
                                variant="outline"
                                size="sm"
                                className="bg-card/40 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 hover:shadow-md"
                              >
                                Continue
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="text-center text-muted-foreground/70 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span>Loading saved sessions...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Reset Session Button */}
        <ResetSessionButton onClearSession={clearSession} />
      </div>
    </div>
  );
};

export default Landing;