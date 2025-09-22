import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Activity, TrendingUp, BookOpen, Lock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ResetSessionButton } from '@/components/ResetSessionButton';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import { workoutPlan, WorkoutDay } from '@/data/workoutPlan';

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
  const [totalCompletedDays, setTotalCompletedDays] = useState(0);
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const { toast } = useToast();
  const { clearSession } = useWorkoutStorage(username);
  const navigate = useNavigate();

  useEffect(() => {
    if (username.trim()) {
      fetchSavedSessions();
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
      
      // Get unique completed days
      const uniqueDays = [...new Set(data?.map(session => session.session_date) || [])];
      setTotalCompletedDays(uniqueDays.length);
      setCompletedDays(uniqueDays);
    } catch (error) {
      console.error('Error fetching completed days:', error);
      setTotalCompletedDays(0);
      setCompletedDays([]);
    }
  };

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
    const trimmedUsername = username.trim();
    
    // Check if user is admin
    if (trimmedUsername.toLowerCase() === 'admin') {
      navigate('/admin-dashboard');
      return;
    }
    
    onStartWorkout(trimmedUsername);
  };

  const handleDaySelect = (day: WorkoutDay) => {
    const trimmedUsername = username.trim();
    
    // Check if user is admin
    if (trimmedUsername.toLowerCase() === 'admin') {
      navigate('/admin-dashboard');
      return;
    }

    // Check if day is unlocked
    if (!isDayUnlocked(day.day)) {
      toast({
        title: "Day Locked",
        description: `Complete Day ${day.day - 1} first to unlock this day.`,
        variant: "destructive"
      });
      return;
    }

    onStartWorkout(trimmedUsername);
  };

  const isDayUnlocked = (dayNumber: number): boolean => {
    // Day 1 is always unlocked
    if (dayNumber === 1) return true;
    
    // Check if previous day is completed
    return completedDays.length >= dayNumber - 1;
  };

  const isDayCompleted = (dayNumber: number): boolean => {
    return completedDays.length >= dayNumber;
  };

  const handleContinue = (session: WorkoutSession) => {
    onStartWorkout(username.trim(), session);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated liquid glass background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(24_95%_53%/0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(24_95%_53%/0.1),transparent_50%)]" />
      
      {/* Floating glass orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-tl from-primary/15 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-primary/10 to-transparent rounded-full blur-lg animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-2 sm:p-4">
        <div className="w-full max-w-lg">
          {/* Main glass card */}
          <div className="relative group">
            {/* Glass card with enhanced liquid effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-card/40 to-card/20 backdrop-blur-[20px] rounded-2xl border border-white/10 shadow-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl" />
            
            {/* Inner content */}
            <div className="relative bg-card/20 backdrop-blur-glass rounded-2xl border border-white/20 shadow-2xl p-4 sm:p-8 transition-all duration-500 hover:bg-card/30 hover:border-primary/30 hover:shadow-glow">
              {/* Header */}
              <div className="text-center mb-6 sm:mb-8">
                <div className="relative">
                  <h1 className="text-2xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
                    Big Booty Builder Program
                  </h1>
                  <h2 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-3 text-primary">
                    {totalCompletedDays > 0 ? `Day ${totalCompletedDays + 1} of 40 Challenge` : '40 Day Challenge'}
                  </h2>
                  <div className="absolute inset-0 text-2xl sm:text-4xl font-bold blur-sm bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 bg-clip-text text-transparent">
                    Big Booty Builder Program
                  </div>
                </div>
                <p className="text-base sm:text-lg text-muted-foreground/80 mb-1 sm:mb-2">
                  Transform your physique with precision tracking
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground/60">
                  This App was made by DaBaebae
                </p>
              </div>

              {/* Username input - centered */}
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-center">
                <label htmlFor="username" className="text-xs sm:text-sm font-medium text-white block">
                  Username
                </label>
                <div className="relative max-w-xs mx-auto">
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="bg-black border-orange-400/50 text-white placeholder:text-gray-400 rounded-xl h-10 sm:h-12 transition-all duration-300 focus:border-orange-500 focus:bg-black focus:shadow-glow text-center text-sm sm:text-base"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100 pointer-events-none" />
                </div>
              </div>

              {/* Exercise Index Navigation */}
              <div className="mb-6 sm:mb-8 flex justify-center">
                <Button 
                  onClick={() => navigate('/exercise-index')}
                  variant="outline"
                  className="w-full max-w-xs h-10 sm:h-12 bg-black/50 border-orange-400/50 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500 font-medium rounded-xl transition-all duration-300 hover:shadow-glow hover:scale-[1.02] text-sm sm:text-base"
                >
                  <div className="flex items-center justify-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Exercise Index</span>
                  </div>
                </Button>
              </div>

              {/* Challenge Overview */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">40-Day Challenge Progress</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/20">
                  {workoutPlan.slice(0, 9).map((day) => {
                    const isUnlocked = isDayUnlocked(day.day);
                    const isCompleted = isDayCompleted(day.day);
                    
                    return (
                      <Card 
                        key={day.day} 
                        className={`cursor-pointer transition-all duration-200 ${
                          isUnlocked 
                            ? 'hover:shadow-lg hover:scale-105 border-primary/20 bg-card/20 backdrop-blur-sm' 
                            : 'opacity-50 cursor-not-allowed bg-card/10'
                        } ${isCompleted ? 'bg-primary/5 border-primary/40' : ''}`}
                        onClick={() => handleDaySelect(day)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm text-white">Day {day.day}</CardTitle>
                            <div className="flex items-center space-x-1">
                              {isCompleted && <CheckCircle className="h-4 w-4 text-primary" />}
                              {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                            </div>
                          </div>
                          <CardDescription className="text-xs">
                            {day.date} • {day.type === 'high-intensity' ? 'High Intensity' : 'Technique & Cardio'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">{day.exercises.length} exercises</p>
                            <div className="flex flex-wrap gap-1">
                              {day.exercises.slice(0, 2).map((exercise, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs px-1 py-0">
                                  {exercise.tier}
                                </Badge>
                              ))}
                              {day.exercises.length > 2 && (
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  +{day.exercises.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Saved sessions */}
              {savedSessions.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-white">
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
        
        {/* Reset Session Button - Only show for Admin */}
        {username.toLowerCase() === 'admin' && (
          <ResetSessionButton onClearSession={clearSession} />
        )}
      </div>
    </div>
  );
};

export default Landing;