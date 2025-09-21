import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FitnessInput } from '@/components/ui/fitness-input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Weight, Repeat, Play, Target, Timer, TrendingUp, Clock, Trophy, Zap, CheckCircle2 } from 'lucide-react';
import { CircularProgress } from '@/components/CircularProgress';
import { ExerciseTimer } from '@/components/ExerciseTimer';
import { RestTimerSelector } from '@/components/RestTimerSelector';
import { SessionTimer } from '@/components/SessionTimer';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import { useToast } from '@/hooks/use-toast';

interface WorkoutPageProps {
  username: string;
}

const initialWorkoutData = [
  { 
    name: 'Machine/Barbell Hip Thrust', 
    tier: 'Great - A Tier', 
    videoUrl: 'https://www.youtube.com/shorts/-1cAnwFNBLg',
    sets: [
      { id: 0, type: 'Warm Up Set', instructions: '15-20 reps (light weight, perfect form)', weight: '', reps: '' },
      { id: 1, type: 'Medium/Primer Set', instructions: '10-12 reps @ 3-4 RIR', weight: '', reps: '' },
      { id: 2, type: 'Heavy/Top Set', instructions: '8-10 reps @ 1 RIR', weight: '', reps: '' },
      { id: 3, type: 'Failure/Back-Off Set', instructions: 'AMRAP @ 0 RIR (drop weight 25-30%)', weight: '', reps: '' },
    ],
    substitute: {
      name: 'Single Leg Dumbbell Hip Thrust',
      tier: 'Substitute',
      videoUrl: 'https://www.youtube.com/shorts/KSeceTJh9m0',
      sets: [
        { id: 4, type: 'Warm Up Set', instructions: '15-20 reps per leg (light weight)', weight: '', reps: '' },
        { id: 5, type: 'Medium/Primer Set', instructions: '10-12 reps per leg @ 3-4 RIR', weight: '', reps: '' },
        { id: 6, type: 'Heavy/Top Set', instructions: '8-10 reps per leg @ 1 RIR', weight: '', reps: '' },
        { id: 7, type: 'Failure/Back-Off Set', instructions: 'AMRAP per leg @ 0 RIR (bodyweight or light)', weight: '', reps: '' },
      ]
    }
  },
  { 
    name: 'Walking Lunge', 
    tier: 'Best of the Best - S+ Tier',
    videoUrl: 'https://www.youtube.com/shorts/BhUpWmlKcJ8?feature=share',
    sets: [
      { id: 8, type: 'Warm Up Set', instructions: '15-20 reps (light weight, perfect form)', weight: '', reps: '' },
      { id: 9, type: 'Medium/Primer Set', instructions: '12 reps per leg @ 3-4 RIR', weight: '', reps: '' },
      { id: 10, type: 'Heavy/Top Set', instructions: '10 reps per leg @ 1 RIR', weight: '', reps: '' },
      { id: 11, type: 'Failure/Back-Off Set', instructions: 'AMRAP per leg (medium dumbbells)', weight: '', reps: '' },
    ]
  },
  {
    name: 'Romanian Deadlift (RDL)', 
    tier: 'Great - A Tier',
    videoUrl: 'https://www.youtube.com/watch?v=5rIqP63yWFg',
    sets: [
      { id: 12, type: 'Warm Up Set', instructions: '15-20 reps (light weight, perfect form)', weight: '', reps: '' },
      { id: 13, type: 'Medium/Primer Set', instructions: '12 reps @ 3-4 RIR', weight: '', reps: '' },
      { id: 14, type: 'Heavy/Top Set', instructions: '8-10 reps @ 1 RIR', weight: '', reps: '' },
      { id: 15, type: 'Failure/Back-Off Set', instructions: 'AMRAP @ 0 RIR (drop weight 25%)', weight: '', reps: '' },
    ]
  },
  {
    name: 'Machine Hip Abduction', 
    tier: 'Great - S Tier',
    videoUrl: 'https://www.youtube.com/shorts/S_FGYHNHJ_c',
    sets: [
      { id: 16, type: 'Warm Up Set', instructions: '15-20 reps (light weight, perfect form)', weight: '', reps: '' },
      { id: 17, type: 'Medium/Primer Set', instructions: '15 reps @ 3-4 RIR (lean forward)', weight: '', reps: '' },
      { id: 18, type: 'Heavy/Top Set', instructions: '12-15 reps @ 1 RIR', weight: '', reps: '' },
      { id: 19, type: 'Failure/Back-Off Set', instructions: 'AMRAP @ 0 RIR', weight: '', reps: '' },
    ]
  },
  {
    name: 'Step-Ups', 
    tier: 'Great - A Tier',
    videoUrl: 'https://www.youtube.com/shorts/sejk5iTrcRE',
    sets: [
      { id: 20, type: 'Warm Up Set', instructions: '15-20 reps (light weight, perfect form)', weight: '', reps: '' },
      { id: 21, type: 'Medium/Primer Set', instructions: '12 reps per leg @ 3-4 RIR (light/bodyweight)', weight: '', reps: '' },
      { id: 22, type: 'Heavy/Top Set', instructions: '10-12 reps per leg @ 1 RIR', weight: '', reps: '' },
      { id: 23, type: 'Failure/Back-Off Set', instructions: 'AMRAP per leg (bodyweight only)', weight: '', reps: '' },
    ]
  },
];

const getTierBadgeVariant = (tier: string) => {
  if (tier.includes('S+')) return 'default';
  if (tier.includes('S ')) return 'secondary';
  if (tier.includes('A')) return 'outline';
  return 'destructive';
};

export default function WorkoutPage({ username }: WorkoutPageProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentSession, updateSession, initializeSession, manualSave } = useWorkoutStorage(username);
  
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentExerciseStartTime, setCurrentExerciseStartTime] = useState<number | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [isExerciseTimerPaused, setIsExerciseTimerPaused] = useState(false);
  const [currentSetInProgress, setCurrentSetInProgress] = useState<{exerciseIndex: number, setIndex: number} | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Ref for debouncing session updates
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [workoutLog, setWorkoutLog] = useState(() => {
    // Always ensure we return an array, never undefined/null
    try {
      if (currentSession && currentSession.workout_data && currentSession.workout_data.logs) {
        const logs = currentSession.workout_data.logs;
        // Ensure logs is an array
        return Array.isArray(logs) ? logs : initialWorkoutData;
      }
    } catch (error) {
      console.error('Error loading workout logs:', error);
    }
    return initialWorkoutData;
  });

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  useEffect(() => {
    if (currentSession) {
      // Check if user should be on this page - but don't redirect immediately
      const checkRedirect = setTimeout(() => {
        if (!currentSession.cardio_completed) {
          navigate('/cardio');
          return;
        }
        
        if (!currentSession.warmup_completed) {
          navigate('/warmup');
          return;
        }

        if (currentSession.current_phase === 'completed') {
          navigate('/post-workout');
          return;
        }
      }, 100); // Small delay to prevent race conditions

      // Load workout data if available
      if (currentSession.workout_data && currentSession.workout_data.logs) {
        const logs = currentSession.workout_data.logs;
        // Ensure logs is an array before setting state
        if (Array.isArray(logs)) {
          setWorkoutLog(logs);
        } else {
          console.warn('Workout logs is not an array, using initial data');
          setWorkoutLog(initialWorkoutData);
        }
      }

      return () => clearTimeout(checkRedirect);
    }
  }, [currentSession, navigate]);

  const handleMotivationalMessage = (message: string) => {
    toast({
      title: "Training Update",
      description: message,
      duration: 5000,
    });
  };

  const handleExerciseStart = () => {
    console.log("🔥 handleExerciseStart called - setting currentExerciseStartTime");
    setCurrentExerciseStartTime(Date.now());
    setIsExerciseTimerPaused(false);
  };

  const handleExerciseComplete = () => {
    setCurrentExerciseStartTime(null);
  };

  const handleLogChange = (exerciseIndex: number, setIndex: number, field: string, value: string, exerciseType = 'main') => {
    const updatedLog = JSON.parse(JSON.stringify(workoutLog));
    if (exerciseType === 'substitute') {
      updatedLog[exerciseIndex].substitute.sets[setIndex][field] = value;
    } else {
      updatedLog[exerciseIndex].sets[setIndex][field] = value;
    }
    setWorkoutLog(updatedLog);
    
    // Debounced update to session - don't update immediately to prevent focus loss
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      updateSession({
        workout_data: { logs: updatedLog, timers: {} }
      });
    }, 1000); // Increased delay to prevent frequent updates while typing
  };

  const handleIndividualSetComplete = (exIndex: number, setIndex: number) => {
    const updatedLog = JSON.parse(JSON.stringify(workoutLog));
    updatedLog[exIndex].sets[setIndex].confirmed = true;
    setWorkoutLog(updatedLog);
    
    setCurrentSetInProgress({exerciseIndex: exIndex, setIndex: setIndex});
    setIsExerciseTimerPaused(true);
    setShowRestTimer(true);
    
    // Clear any pending session updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Immediate update for set completion
    updateSession({
      workout_data: { logs: updatedLog, timers: {} }
    });
    
    const currentExercise = updatedLog[exIndex];
    const allSetsCompleted = currentExercise.sets.every((set: any) => set.confirmed);
    
    if (allSetsCompleted) {
      console.log(`All sets completed for exercise ${exIndex + 1}!`);
    }
  };

  const handleRestComplete = () => {
    setShowRestTimer(false);
    setIsExerciseTimerPaused(false);
    setCurrentSetInProgress(null);
    
    const currentExercise = workoutLog[activeExerciseIndex];
    const allSetsCompleted = currentExercise.sets.every((set: any) => set.confirmed);
    
    if (allSetsCompleted && activeExerciseIndex < workoutLog.length - 1) {
      setActiveExerciseIndex(prev => prev + 1);
    }
  };

  // Calculate overall progress - with safety checks
  const totalSets = Array.isArray(workoutLog) ? 
    workoutLog.reduce((acc: number, exercise: any) => {
      return acc + (exercise?.sets?.length || 0);
    }, 0) : 0;
    
  const completedSets = Array.isArray(workoutLog) ? 
    workoutLog.reduce((acc: number, exercise: any) => {
      if (!exercise?.sets) return acc;
      return acc + exercise.sets.filter((set: any) => set.confirmed).length;
    }, 0) : 0;
  const overallProgress = (completedSets / totalSets) * 100;

  // Check for workout completion
  useEffect(() => {
    if (overallProgress === 100 && !showCelebration) {
      const completeWorkout = async () => {
        setShowCelebration(true);
        
        const updates = {
          current_phase: 'completed' as const
        };

        // Update local session state immediately
        updateSession(updates);

        // Persist to Supabase before navigating
        try {
          await manualSave(updates);
        } catch (e) {
          console.error('Failed to save workout completion, navigating anyway', e);
        }

        setTimeout(() => {
          navigate('/post-workout', { replace: true });
        }, 3000);
      };

      completeWorkout();
    }
  }, [overallProgress, showCelebration, navigate, updateSession, manualSave]);

  const SetLog = ({ set, onLogChange, onSetComplete, isCurrentSet, canInteract }: { 
    set: any, 
    onLogChange: (field: string, value: string) => void, 
    onSetComplete?: () => void, 
    isCurrentSet?: boolean,
    canInteract?: boolean
  }) => {
    const isWarmUp = set.type === 'Warm Up Set';
    const isComplete = set.weight && set.reps;
    const isConfirmed = set.confirmed;
    const isDisabled = !canInteract && !isCurrentSet;
    
    return (
      <Card className={`transition-all duration-300 backdrop-blur-glass border-white/10 ${
        isWarmUp ? 'bg-primary/10 border-primary/30 shadow-glass' : 'bg-card/60 shadow-md'
      } ${
        isConfirmed ? 'ring-1 ring-success/50 bg-success/5' : 
        isComplete && isCurrentSet ? 'ring-1 ring-warning/50 bg-warning/5' : 
        isDisabled ? 'opacity-50' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">{set.type}</h4>
              <p className="text-sm text-muted-foreground">{set.instructions}</p>
              {isCurrentSet && !isConfirmed && (
                <Badge variant="outline" className="text-primary border-primary/50 bg-primary/10">
                  Current Set
                </Badge>
              )}
            </div>
            {isConfirmed && (
              <Badge variant="outline" className="text-success border-success/50 bg-success/10">
                ✓ Set Complete
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <FitnessInput
              label="Weight"
              icon={<Weight className="h-4 w-4" />}
              type="number"
              placeholder="0"
              value={set.weight}
              onChange={(e) => {
                // Direct state update without immediate session save
                onLogChange('weight', e.target.value);
              }}
              variant={set.weight ? 'success' : 'default'}
              disabled={isConfirmed || isDisabled}
            />
            <FitnessInput
              label="Reps"
              icon={<Repeat className="h-4 w-4" />}
              type="number"
              placeholder="0"
              value={set.reps}
              onChange={(e) => {
                // Direct state update without immediate session save
                onLogChange('reps', e.target.value);
              }}
              variant={set.reps ? 'success' : 'default'}
              disabled={isConfirmed || isDisabled}
            />
          </div>

          {isComplete && !isConfirmed && isCurrentSet && onSetComplete && (
            <Button 
              onClick={onSetComplete}
              className="w-full bg-gradient-primary hover:shadow-glow"
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Set Complete?
            </Button>
          )}
          
          {isDisabled && !isConfirmed && (
            <div className="text-center text-sm text-muted-foreground">
              Complete current set to unlock
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const ExerciseCard = ({ exercise, exIndex, onLogChange, isActive, isLocked, isCompleted, onStartTimer, isTimerActive, onSetComplete, currentSetInProgress, activeExerciseIndex }: { exercise: any, exIndex: number, onLogChange: any, isActive: boolean, isLocked: boolean, isCompleted: boolean, onStartTimer: () => void, isTimerActive: boolean, onSetComplete?: (exIndex: number, setIndex: number) => void, currentSetInProgress?: {exerciseIndex: number, setIndex: number} | null, activeExerciseIndex: number }) => {
    const [activeTab, setActiveTab] = useState('main');
    const hasSubstitute = !!exercise.substitute;
    const activeExercise = activeTab === 'main' ? exercise : exercise.substitute;
    
    const completedSets = activeExercise.sets.filter((set: any) => set.weight && set.reps).length;
    const totalSets = activeExercise.sets.length;
    const completionPercentage = (completedSets / totalSets) * 100;

    return (
      <Card className={`transition-all duration-500 overflow-hidden group ${
        isActive 
          ? 'bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-glass border-primary shadow-lg shadow-primary/20 scale-[1.02]' 
          : isCompleted 
            ? 'bg-gradient-card/60 backdrop-blur-glass border-success/30 shadow-md opacity-90' 
            : isLocked 
              ? 'bg-card/30 backdrop-blur-glass border-white/5 shadow-sm opacity-50 cursor-not-allowed'
              : 'bg-gradient-card/80 backdrop-blur-glass border-white/10 shadow-lg hover:shadow-glow hover:scale-[1.01]'
      }`}>
        <CardHeader className="pb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CardTitle className={`text-xl font-bold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                  {activeExercise.name}
                </CardTitle>
                {isCompleted && (
                  <div className="animate-bounce">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                )}
                {isActive && (
                  <Badge className="bg-primary text-primary-foreground animate-pulse">
                    Active
                  </Badge>
                )}
                {isLocked && (
                  <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
                    Locked
                  </Badge>
                )}
              </div>
              <Badge variant={getTierBadgeVariant(activeExercise.tier) as any} className="w-fit font-medium">
                {activeExercise.tier}
              </Badge>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>{completedSets}/{totalSets} sets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>{Math.round(completionPercentage)}% done</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                disabled={isLocked}
                onClick={() => {
                  if (!isLocked) {
                    if (!isTimerActive) {
                      onStartTimer();
                    }
                    const timerEl = document.getElementById('main-exercise-timer');
                    try {
                      timerEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } catch {}

                    const link = document.createElement('a');
                    link.href = activeExercise.videoUrl;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                className={`transition-all duration-300 group ${
                  isLocked ? 'opacity-50 cursor-not-allowed' : 'bg-gradient-primary hover:shadow-glow'
                }`}
              >
                <Play className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Watch
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1">
              <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-primary transition-all duration-1000 ease-out rounded-full relative"
                  style={{ width: `${completionPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
            <CircularProgress 
              percentage={completionPercentage} 
              size={50} 
              strokeWidth={6}
              showText={false}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {hasSubstitute && !isLocked && (
            <>
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary font-medium mb-2">💡 Alternative Exercise Available</p>
                <p className="text-xs text-muted-foreground">You can switch to a substitute exercise if needed. Both options target the same muscle groups effectively.</p>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 bg-muted/30 backdrop-blur-sm">
                  <TabsTrigger value="main" className="data-[state=active]:bg-primary/20">Main Exercise</TabsTrigger>
                  <TabsTrigger value="substitute" className="data-[state=active]:bg-primary/20">Substitute</TabsTrigger>
                </TabsList>
              </Tabs>
            </>
          )}

          <div className="space-y-4">
            {activeExercise.sets.map((set: any, setIndex: number) => {
              let isCurrentSet = false;
              let canInteract = false;

              if (exIndex === activeExerciseIndex && !isLocked) {
                if (currentSetInProgress) {
                  isCurrentSet = currentSetInProgress.exerciseIndex === exIndex && currentSetInProgress.setIndex === setIndex;
                  canInteract = false;
                } else {
                  const firstIncompleteIndex = activeExercise.sets.findIndex((s: any) => !s.confirmed);
                  isCurrentSet = setIndex === firstIncompleteIndex;
                  canInteract = isCurrentSet;
                }
              }
              
              return (
                <div key={`${activeTab}-${set.id}`} className={isLocked ? 'pointer-events-none opacity-50' : ''}>
                  <SetLog 
                    set={set} 
                    onLogChange={isLocked || !canInteract ? () => {} : (field, value) => handleLogChange(exIndex, setIndex, field, value, activeTab)}
                    onSetComplete={isLocked || !canInteract ? undefined : () => onSetComplete && onSetComplete(exIndex, setIndex)}
                    isCurrentSet={isCurrentSet}
                    canInteract={canInteract}
                  />
                </div>
              );
            })}
          </div>

          {isCompleted && (
            <div className="text-center p-4 bg-gradient-to-r from-success/20 to-success/10 rounded-lg border border-success/30 animate-slide-in">
              <div className="flex items-center justify-center gap-2 text-success font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                Exercise Complete! Great job! 🎉
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(24_95%_53%/0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(24_95%_53%/0.05),transparent_50%)]" />
      
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <Card className="bg-gradient-card/95 backdrop-blur-glass border-primary/30 shadow-2xl max-w-md mx-4">
            <CardContent className="p-8 text-center space-y-4">
              <div className="text-6xl animate-bounce">🎉</div>
              <h2 className="text-2xl font-bold text-foreground">Workout Complete!</h2>
              <p className="text-muted-foreground">Amazing work! You've completed all exercises.</p>
              <Button 
                onClick={() => setShowCelebration(false)}
                className="bg-gradient-primary hover:shadow-glow"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <SessionTimer 
        startTime={sessionStartTime} 
        onMotivationalMessage={handleMotivationalMessage}
      />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-primary/20 backdrop-blur-glass rounded-full text-primary-foreground font-medium text-sm mb-6 border border-primary/30">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <Target className="h-4 w-4" />
            Phase 3: Main Workout
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-hero bg-clip-text text-transparent mb-4 tracking-tight">
            Main Workout
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Focus on form and progressive overload
          </p>
          
          {/* Enhanced overall progress */}
          <div className="max-w-lg mx-auto space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Overall Progress</span>
              <span className="text-primary font-bold text-lg">{Math.round(overallProgress)}%</span>
            </div>
            <div className="relative">
              <div className="w-full bg-muted/50 rounded-full h-4 overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-primary rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${overallProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="absolute -top-2 right-0 transform translate-x-1/2">
                <CircularProgress 
                  percentage={overallProgress} 
                  size={60} 
                  strokeWidth={8}
                  showText={false}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedSets} sets completed</span>
              <span>{totalSets - completedSets} remaining</span>
            </div>
          </div>
        </div>

        {/* Exercise Timer */}
        <div id="main-exercise-timer">
          <ExerciseTimer
            duration={20}
            onComplete={handleExerciseComplete}
            onStart={handleExerciseStart}
            onSetComplete={() => {}}
            isActive={currentExerciseStartTime !== null}
            isPaused={isExerciseTimerPaused}
            exerciseType="main"
          />
        </div>
        
        {/* Exercises */}
        <div className="space-y-8">
          {Array.isArray(workoutLog) && workoutLog.map((exercise: any, index: number) => {
            if (!exercise?.sets) {
              console.warn(`Exercise at index ${index} missing sets data`);
              return null;
            }
            
            const exerciseCompletedSets = exercise.sets.filter((set: any) => set.confirmed).length;
            const exerciseTotalSets = exercise.sets.length;
            const isCompleted = exerciseCompletedSets === exerciseTotalSets;
            const isActive = index === activeExerciseIndex;
            const isLocked = index > activeExerciseIndex || isCompleted;

            return (
              <ExerciseCard 
                key={index} 
                exercise={exercise} 
                exIndex={index} 
                onLogChange={handleLogChange}
                isActive={isActive}
                isLocked={isLocked}
                isCompleted={isCompleted}
                onStartTimer={handleExerciseStart}
                isTimerActive={currentExerciseStartTime !== null}
                onSetComplete={handleIndividualSetComplete}
                currentSetInProgress={currentSetInProgress}
                activeExerciseIndex={activeExerciseIndex}
              />
            );
          })}
        </div>
        
        <RestTimerSelector
          isVisible={showRestTimer}
          onComplete={handleRestComplete}
          onClose={() => {
            setShowRestTimer(false);
            setIsExerciseTimerPaused(false);
            setCurrentSetInProgress(null);
          }}
        />
      </div>
    </div>
  );
}