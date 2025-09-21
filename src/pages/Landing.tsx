import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Activity, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
  const [username, setUsername] = useState('JackyLove');
  const [savedSessions, setSavedSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
        .limit(5);

      if (error) throw error;
      setSavedSessions(data || []);
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
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="bg-gradient-card/80 backdrop-blur-glass border-accent/30 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Fitness Tracker
            </CardTitle>
            <p className="text-muted-foreground">Track your workouts and progress</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-foreground">
                Username
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="bg-card/50 border-border/50"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleBegin}
                className="flex-1 bg-gradient-primary hover:bg-primary/90 text-primary-foreground"
                disabled={!username.trim() || loading}
              >
                Begin New Workout
              </Button>
            </div>

            {savedSessions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Continue Previous Sessions
                </h3>
                <div className="space-y-3">
                  {savedSessions.map((session) => {
                    const progress = calculateProgress(session);
                    return (
                      <Card key={session.id} className="bg-card/50 border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(session.session_date), 'MMM dd, yyyy')}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Last saved: {format(new Date(session.updated_at), 'HH:mm')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-accent" />
                                <span className="text-sm font-medium text-foreground">
                                  {getPhaseDisplay(session.current_phase)}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  {progress}% Complete
                                </Badge>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleContinue(session)}
                              variant="outline"
                              size="sm"
                              className="hover:bg-accent/10 hover:border-accent/30"
                            >
                              Continue
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center text-muted-foreground">
                Loading saved sessions...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Landing;