import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FitnessInput } from '@/components/ui/fitness-input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Weight, Repeat, Play, Target, Timer, TrendingUp, Clock, Trophy, Zap, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { CircularProgress } from '@/components/CircularProgress';
import { ExerciseTimer } from '@/components/ExerciseTimer';
import { RestTimerSelector } from '@/components/RestTimerSelector';
import { SessionTimer } from '@/components/SessionTimer';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import { useToast } from '@/hooks/use-toast';

interface ExercisePageProps {
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

export default function ExercisePage({ username }: ExercisePageProps) {
  const navigate = useNavigate();
  const { exerciseIndex } = useParams();
  const { toast } = useToast();
  const { currentSession, updateSession, initializeSession, manualSave } = useWorkoutStorage(username);
  
  const currentExerciseIndex = parseInt(exerciseIndex || '0');
  
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentExerciseStartTime, setCurrentExerciseStartTime] = useState<number | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [isExerciseTimerPaused, setIsExerciseTimerPaused] = useState(false);
  const [currentSetInProgress, setCurrentSetInProgress] = useState<{exerciseIndex: number, setIndex: number} | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Ref for debouncing session updates
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Prevent overwriting local typing with session re-hydration
  const hasHydratedFromSession = useRef(false);
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

      // Load workout data if available (hydrate once to avoid focus loss while typing)
      if (currentSession.workout_data && currentSession.workout_data.logs) {
        const logs = currentSession.workout_data.logs;
        // Ensure logs is an array before setting state
        if (Array.isArray(logs)) {
          if (!hasHydratedFromSession.current) {
            setWorkoutLog(logs);
            hasHydratedFromSession.current = true;
          }
        } else {
          console.warn('Workout logs is not an array, using initial data');
          if (!hasHydratedFromSession.current) {
            setWorkoutLog(initialWorkoutData);
            hasHydratedFromSession.current = true;
          }
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

  const handleLogChange = (setIndex: number, field: string, value: string, exerciseType = 'main') => {
    const updatedLog = JSON.parse(JSON.stringify(workoutLog));
    if (exerciseType === 'substitute') {
      updatedLog[currentExerciseIndex].substitute.sets[setIndex][field] = value;
    } else {
      updatedLog[currentExerciseIndex].sets[setIndex][field] = value;
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

  const handleIndividualSetComplete = (setIndex: number) => {
    const updatedLog = JSON.parse(JSON.stringify(workoutLog));
    updatedLog[currentExerciseIndex].sets[setIndex].confirmed = true;
    setWorkoutLog(updatedLog);
    
    setCurrentSetInProgress({exerciseIndex: currentExerciseIndex, setIndex: setIndex});
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
    
    const currentExercise = updatedLog[currentExerciseIndex];
    const allSetsCompleted = currentExercise.sets.every((set: any) => set.confirmed);
    
    if (allSetsCompleted) {
      console.log(`All sets completed for exercise ${currentExerciseIndex + 1}!`);
      // Auto-navigate to next exercise after completing all sets
      setTimeout(() => {
        if (currentExerciseIndex < workoutLog.length - 1) {
          navigate(`/exercise/${currentExerciseIndex + 1}`);
        } else {
          // All exercises completed, navigate to post-workout
          navigate('/post-workout');
        }
      }, 2000);
    }
  };

  const handleRestComplete = () => {
    setShowRestTimer(false);
    setIsExerciseTimerPaused(false);
    setCurrentSetInProgress(null);
  };

  const currentExercise = workoutLog[currentExerciseIndex];
  
  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Exercise Not Found</h1>
          <Button onClick={() => navigate('/workout')}>
            Back to Workout
          </Button>
        </Card>
      </div>
    );
  }

  // Calculate overall progress - with safety checks
  const totalSets = workoutLog.reduce((acc: number, exercise: any) => {
    return acc + (exercise?.sets?.length || 0);
  }, 0);
    
  const completedSets = workoutLog.reduce((acc: number, exercise: any) => {
    if (!exercise?.sets) return acc;
    return acc + exercise.sets.filter((set: any) => set.confirmed).length;
  }, 0);
  const overallProgress = (completedSets / totalSets) * 100;

  const SetLog = ({ set, onLogChange, onSetComplete, isCurrentSet, canInteract }: { 
    set: any, 
    onLogChange: (field: string, value: string) => void, 
    onSetComplete?: () => void, 
    isCurrentSet?: boolean,
    canInteract?: boolean
  }) => {
    // Local input state to prevent focus loss while typing
    const [weightInput, setWeightInput] = useState<string>(set.weight ?? '');
    const [repsInput, setRepsInput] = useState<string>(set.reps ?? '');
    const [isWeightFocused, setIsWeightFocused] = useState(false);
    const [isRepsFocused, setIsRepsFocused] = useState(false);

    // Keep local state in sync with external updates when not focused
    useEffect(() => {
      if (!isWeightFocused) setWeightInput(set.weight ?? '');
    }, [set.weight, isWeightFocused]);

    useEffect(() => {
      if (!isRepsFocused) setRepsInput(set.reps ?? '');
    }, [set.reps, isRepsFocused]);

    const isWarmUp = set.type === 'Warm Up Set';
    const isCompleteLocal = Boolean(weightInput && repsInput);
    const isConfirmed = set.confirmed;
    const isDisabled = !canInteract && !isCurrentSet;
    
    return (
      <Card className={`transition-all duration-300 backdrop-blur-glass border-white/10 ${
        isWarmUp ? 'bg-primary/10 border-primary/30 shadow-glass' : 'bg-card/60 shadow-md'
      } ${
        isConfirmed ? 'ring-1 ring-success/50 bg-success/5' : 
        isCompleteLocal && isCurrentSet ? 'ring-1 ring-warning/50 bg-warning/5' : 
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
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={weightInput}
              onFocus={() => setIsWeightFocused(true)}
              onBlur={() => setIsWeightFocused(false)}
              onChange={(e) => {
                // Allow digits and one decimal point
                let v = e.target.value.replace(/[^0-9.]/g, '');
                const firstDot = v.indexOf('.');
                if (firstDot !== -1) {
                  v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
                }
                setWeightInput(v);
                if (!isConfirmed && !isDisabled) {
                  onLogChange('weight', v);
                }
              }}
              variant={weightInput ? 'success' : 'default'}
              disabled={isConfirmed || isDisabled}
            />
            <FitnessInput
              label="Reps"
              icon={<Repeat className="h-4 w-4" />}
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={repsInput}
              onFocus={() => setIsRepsFocused(true)}
              onBlur={() => setIsRepsFocused(false)}
              onChange={(e) => {
                // Digits only
                const v = e.target.value.replace(/[^0-9]/g, '');
                setRepsInput(v);
                if (!isConfirmed && !isDisabled) {
                  onLogChange('reps', v);
                }
              }}
              variant={repsInput ? 'success' : 'default'}
              disabled={isConfirmed || isDisabled}
            />
          </div>
          
          {!isConfirmed && isCompleteLocal && isCurrentSet && onSetComplete && (
            <Button 
              onClick={onSetComplete}
              className="w-full"
              variant="default"
            >
              Complete Set
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-4 max-w-4xl space-y-6">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => currentExerciseIndex > 0 ? navigate(`/exercise/${currentExerciseIndex - 1}`) : navigate('/workout')}
            disabled={currentExerciseIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold">Exercise {currentExerciseIndex + 1} of {workoutLog.length}</h1>
            <p className="text-muted-foreground">{currentExercise.name}</p>
          </div>
          
          <Button 
            variant="outline"
            onClick={() => currentExerciseIndex < workoutLog.length - 1 ? navigate(`/exercise/${currentExerciseIndex + 1}`) : navigate('/post-workout')}
          >
            {currentExerciseIndex < workoutLog.length - 1 ? 'Next' : 'Finish'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Progress Bar */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{completedSets}/{totalSets} sets</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </Card>

        {/* Session Timer */}
        <SessionTimer 
          startTime={sessionStartTime}
          onMotivationalMessage={handleMotivationalMessage}
        />

        {/* Exercise Content */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-foreground">
                  {currentExercise.name}
                </CardTitle>
                <Badge variant={getTierBadgeVariant(currentExercise.tier)} className="w-fit">
                  {currentExercise.tier}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(currentExercise.videoUrl, '_blank')}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Watch Demo
                </Button>
                {!currentExerciseStartTime && (
                  <Button onClick={handleExerciseStart} size="sm">
                    <Timer className="h-4 w-4 mr-2" />
                    Start Exercise
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Exercise Timer */}
            {currentExerciseStartTime && (
              <ExerciseTimer 
                duration={45}
                onComplete={handleExerciseComplete}
                onStart={handleExerciseStart}
                onSetComplete={() => {}}
                isActive={!!currentExerciseStartTime}
                isPaused={isExerciseTimerPaused}
                exerciseType="main"
              />
            )}

            {/* Rest Timer */}
            {showRestTimer && currentSetInProgress && (
              <div className="mb-6">
                <RestTimerSelector 
                  onComplete={handleRestComplete}
                  onClose={() => setShowRestTimer(false)}
                  isVisible={showRestTimer}
                />
              </div>
            )}

            {/* Main Exercise Sets */}
            <Tabs defaultValue="main" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="main">Main Exercise</TabsTrigger>
                <TabsTrigger value="substitute">Substitute</TabsTrigger>
              </TabsList>
              
              <TabsContent value="main" className="space-y-4 mt-6">
                {currentExercise.sets.map((set: any, setIndex: number) => {
                  const allPreviousSetsCompleted = currentExercise.sets
                    .slice(0, setIndex)
                    .every((s: any) => s.confirmed);
                  
                  const isCurrentSet = allPreviousSetsCompleted && !set.confirmed;
                  const canInteract = allPreviousSetsCompleted;
                  
                  return (
                    <SetLog
                      key={set.id}
                      set={set}
                      onLogChange={(field, value) => handleLogChange(setIndex, field, value)}
                      onSetComplete={() => handleIndividualSetComplete(setIndex)}
                      isCurrentSet={isCurrentSet}
                      canInteract={canInteract}
                    />
                  );
                })}
              </TabsContent>
              
              {currentExercise.substitute && (
                <TabsContent value="substitute" className="space-y-4 mt-6">
                  <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold text-foreground mb-2">{currentExercise.substitute.name}</h3>
                    <Badge variant={getTierBadgeVariant(currentExercise.substitute.tier)} className="mb-2">
                      {currentExercise.substitute.tier}
                    </Badge>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(currentExercise.substitute.videoUrl, '_blank')}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Watch Demo
                      </Button>
                    </div>
                  </div>
                  
                  {currentExercise.substitute.sets.map((set: any, setIndex: number) => (
                    <SetLog
                      key={set.id}
                      set={set}
                      onLogChange={(field, value) => handleLogChange(setIndex, field, value, 'substitute')}
                      onSetComplete={() => {
                        const updatedLog = JSON.parse(JSON.stringify(workoutLog));
                        updatedLog[currentExerciseIndex].substitute.sets[setIndex].confirmed = true;
                        setWorkoutLog(updatedLog);
                        updateSession({
                          workout_data: { logs: updatedLog, timers: {} }
                        });
                      }}
                      isCurrentSet={true}
                      canInteract={true}
                    />
                  ))}
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
