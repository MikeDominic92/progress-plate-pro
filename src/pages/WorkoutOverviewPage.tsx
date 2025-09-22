import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Target, Timer, CheckCircle2, ArrowRight } from 'lucide-react';
import { SessionTimer } from '@/components/SessionTimer';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';

interface WorkoutOverviewPageProps {
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

export default function WorkoutOverviewPage({ username }: WorkoutOverviewPageProps) {
  const navigate = useNavigate();
  const { currentSession, updateSession, initializeSession, manualSave } = useWorkoutStorage(username);
  
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [workoutLog, setWorkoutLog] = useState(() => {
    try {
      if (currentSession && currentSession.workout_data && currentSession.workout_data.logs) {
        const logs = currentSession.workout_data.logs;
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
      // Check if user should be on this page
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

      }, 100);

      // Load workout data if available
      if (currentSession.workout_data && currentSession.workout_data.logs) {
        const logs = currentSession.workout_data.logs;
        if (Array.isArray(logs)) {
          setWorkoutLog(logs);
        }
      }

      return () => clearTimeout(checkRedirect);
    }
  }, [currentSession, navigate]);

  // Calculate progress for each exercise
  const getExerciseProgress = (exercise: any) => {
    const totalSets = exercise?.sets?.length || 0;
    const mainCompleted = exercise?.sets?.filter((set: any) => set.confirmed).length || 0;
    const subCompleted = exercise?.substitute?.sets ? exercise.substitute.sets.filter((set: any) => set.confirmed).length : 0;
    const completed = Math.max(mainCompleted, subCompleted);
    return totalSets > 0 ? (completed / totalSets) * 100 : 0;
  };

  // Calculate overall progress
  const totalSets = workoutLog.reduce((acc: number, exercise: any) => {
    return acc + (exercise?.sets?.length || 0);
  }, 0);
    
  const completedSets = workoutLog.reduce((acc: number, exercise: any) => {
    if (!exercise?.sets) return acc;
    const mainCompleted = exercise.sets.filter((set: any) => set.confirmed).length;
    const subCompleted = exercise.substitute?.sets ? exercise.substitute.sets.filter((set: any) => set.confirmed).length : 0;
    return acc + Math.max(mainCompleted, subCompleted);
  }, 0);
  const overallProgress = (completedSets / totalSets) * 100;

  // Auto-navigate to post-workout when everything is completed
  useEffect(() => {
    let t: any;
    if (
      completedSets >= totalSets &&
      totalSets > 0 &&
      currentSession?.current_phase !== 'completed'
    ) {
      console.log('🎉 Workout completed! Auto-navigating to post-workout...');
      updateSession({ current_phase: 'completed' });
      (async () => {
        try {
          await manualSave({ current_phase: 'completed' });
        } catch (e) {
          console.error('Failed to persist completion before navigate', e);
        }
        t = setTimeout(() => {
          navigate('/post-workout', { replace: true });
        }, 500);
      })();
    }
    return () => { if (t) clearTimeout(t); };
  }, [completedSets, totalSets, currentSession?.current_phase, navigate, updateSession, manualSave]);

  // Find next incomplete exercise (treat substitutes as valid)
  const nextIncompleteExercise = workoutLog.findIndex((exercise: any) => {
    return getExerciseProgress(exercise) < 100;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-4 max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Workout Overview</h1>
          <p className="text-muted-foreground">Track your progress through each exercise</p>
        </div>

        {/* Session Timer */}
        <SessionTimer 
          startTime={sessionStartTime}
          onMotivationalMessage={(message) => console.log(message)}
        />

        {/* Overall Progress */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Overall Progress</h2>
            <span className="text-sm text-muted-foreground">{completedSets}/{totalSets} sets completed</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <p className="text-center mt-2 text-sm text-muted-foreground">
            {Math.round(overallProgress)}% Complete
          </p>
        </Card>

        {/* Quick Actions */}
        <div className="flex gap-4">
          <Button 
            onClick={() => {
              if (completedSets >= totalSets && totalSets > 0) {
                navigate('/post-workout');
              } else {
                navigate(`/exercise/${nextIncompleteExercise !== -1 ? nextIncompleteExercise : 0}`);
              }
            }}
            className="flex-1"
            size="lg"
          >
            {completedSets >= totalSets && totalSets > 0 ? 'Continue to Post-Workout' : (nextIncompleteExercise !== -1 ? 'Continue Workout' : 'Start First Exercise')}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Exercise List */}
        <div className="space-y-4">
          {workoutLog.map((exercise: any, index: number) => {
            const progress = getExerciseProgress(exercise);
            const isCompleted = progress === 100;
            const isNext = index === nextIncompleteExercise;
            
            return (
              <Card 
                key={index} 
                className={`transition-all duration-300 cursor-pointer hover:shadow-lg ${
                  isCompleted ? 'bg-success/5 border-success/30' : 
                  isNext ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : ''
                }`}
                onClick={() => navigate(`/exercise/${index}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{exercise.name}</h3>
                        {isCompleted && <CheckCircle2 className="h-5 w-5 text-success" />}
                        {isNext && !isCompleted && (
                          <Badge variant="outline" className="text-primary border-primary/50 bg-primary/10">
                            Next
                          </Badge>
                        )}
                      </div>
                      
                      <Badge variant={getTierBadgeVariant(exercise.tier)} className="w-fit">
                        {exercise.tier}
                      </Badge>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {Math.max(
                              exercise.sets.filter((set: any) => set.confirmed).length,
                              exercise.substitute?.sets ? exercise.substitute.sets.filter((set: any) => set.confirmed).length : 0
                            )}/{exercise.sets.length} sets completed
                          </span>
                          <span className="font-medium">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(exercise.videoUrl, '_blank');
                        }}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant={isNext ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/exercise/${index}`);
                        }}
                      >
                        <Target className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}