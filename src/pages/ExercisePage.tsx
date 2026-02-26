import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, ArrowLeft, ArrowRight } from 'lucide-react';
import { ExerciseTimer } from '@/components/ExerciseTimer';
import { RestTimerModal } from '@/components/RestTimerModal';
import { PRCelebration } from '@/components/PRCelebration';
import { SetLog } from '@/components/SetLog';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useProgression } from '@/hooks/useProgression';
import { useToast } from '@/hooks/use-toast';
import type { PersonalRecord } from '@/utils/progressionEngine';
import SonnyAngelDetailed from '@/components/characters/SonnyAngelDetailed';

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

export default function ExercisePage() {
  const navigate = useNavigate();
  const { exerciseIndex } = useParams<{ exerciseIndex: string }>();
  const { username } = useAuthenticatedUser();
  const { trackSetCompleted, trackRestTimer, trackExerciseCompletion, trackPR } = useAnalytics();
  const { currentSession, updateSession, initializeSession, manualSave } = useWorkoutStorage(username || '');
  const { toast } = useToast();
  const { getSuggestion, checkForPR, savePersonalRecords, refreshHistory, getLastSession } = useProgression(username || '');

  const currentExerciseIndex = parseInt(exerciseIndex || '0');

  // State -- trimmed from 31 hooks to ~15
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [isExerciseTimerPaused, setIsExerciseTimerPaused] = useState(false);
  const [exerciseStartTime, setExerciseStartTime] = useState<number | null>(null);
  const [useSubstitute, setUseSubstitute] = useState(false);
  const [currentSetInProgress, setCurrentSetInProgress] = useState<{
    exerciseIndex: number;
    setIndex: number;
    isSubstitute?: boolean;
    exerciseName?: string;
    setType?: string;
  } | null>(null);
  const [prCelebration, setPrCelebration] = useState<PersonalRecord[]>([]);
  const [showPRModal, setShowPRModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);

  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasHydratedFromSession = useRef(false);

  const [workoutLog, setWorkoutLog] = useState(() => {
    try {
      if (currentSession?.workout_data?.logs) {
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

  // Listen for manual save events
  useEffect(() => {
    const handleSaveWorkout = () => { manualSave(); };
    window.addEventListener('saveWorkout', handleSaveWorkout);
    return () => window.removeEventListener('saveWorkout', handleSaveWorkout);
  }, [manualSave]);

  // Auto-start exercise timer on mount / exercise change
  useEffect(() => {
    setExerciseStartTime(Date.now());
    setIsExerciseTimerPaused(false);
    setUseSubstitute(false);
  }, [currentExerciseIndex]);

  // Session hydration and redirect guards
  useEffect(() => {
    if (currentSession) {
      const checkRedirect = setTimeout(() => {
        if (!currentSession.cardio_completed) { navigate('/cardio'); return; }
        if (!currentSession.warmup_completed) { navigate('/warmup'); return; }
        if (currentSession.current_phase === 'completed') { navigate('/post-workout'); return; }
      }, 100);

      if (currentSession.workout_data?.logs) {
        const logs = currentSession.workout_data.logs;
        if (Array.isArray(logs) && !hasHydratedFromSession.current) {
          setWorkoutLog(logs);
          hasHydratedFromSession.current = true;
        }
      }

      return () => clearTimeout(checkRedirect);
    }
  }, [currentSession, navigate]);

  // Detect if substitute was already in use (data present)
  useEffect(() => {
    const exercise = workoutLog[currentExerciseIndex];
    if (exercise?.substitute?.sets?.some((s: any) => s.weight || s.reps || s.confirmed)) {
      setUseSubstitute(true);
    }
  }, [currentExerciseIndex, workoutLog]);

  const handleLogChange = (setIndex: number, field: string, value: string) => {
    const updatedLog = JSON.parse(JSON.stringify(workoutLog));
    const exercise = updatedLog[currentExerciseIndex];
    if (useSubstitute && exercise.substitute) {
      exercise.substitute.sets[setIndex][field] = value;
    } else {
      exercise.sets[setIndex][field] = value;
    }
    setWorkoutLog(updatedLog);

    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      updateSession({ workout_data: { logs: updatedLog, timers: {} } });
      manualSave({ workout_data: { logs: updatedLog, timers: {} } });
    }, 1000);
  };

  const handleSetComplete = async (setIndex: number) => {
    const updatedLog = JSON.parse(JSON.stringify(workoutLog));
    const exercise = updatedLog[currentExerciseIndex];
    const isSubstitute = useSubstitute && !!exercise.substitute;

    let setData, exerciseName;
    if (isSubstitute) {
      exercise.substitute.sets[setIndex].confirmed = true;
      setData = exercise.substitute.sets[setIndex];
      exerciseName = exercise.substitute.name;
    } else {
      exercise.sets[setIndex].confirmed = true;
      setData = exercise.sets[setIndex];
      exerciseName = exercise.name;
    }

    // Analytics
    if (currentSession?.id && exerciseName) {
      const weight = parseFloat(setData.weight) || 0;
      const reps = parseInt(setData.reps) || 0;

      await trackSetCompleted(
        currentSession.id, username, exerciseName,
        setIndex + 1, weight, reps, undefined, setData.type
      );

      if (weight > 0 && reps > 0) {
        const prs = checkForPR(exerciseName, setData.type, weight, reps);
        if (prs.length > 0) {
          setPrCelebration(prs);
          setShowPRModal(true);
          await savePersonalRecords(prs);
          for (const pr of prs) {
            await trackPR(currentSession.id, username, exerciseName, pr.prType, pr.value, pr.previousValue);
          }
          toast({ title: "NEW PR!", description: `${exerciseName}: ${weight} lb x ${reps} reps`, duration: 5000 });
        }
      }
      refreshHistory();
    }

    setWorkoutLog(updatedLog);

    // Show rest timer
    setCurrentSetInProgress({
      exerciseIndex: currentExerciseIndex,
      setIndex,
      isSubstitute,
      exerciseName,
      setType: setData.type,
    });
    setIsExerciseTimerPaused(true);
    setShowRestTimer(true);

    // Save immediately
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateSession({ workout_data: { logs: updatedLog, timers: {} } });
    manualSave({ workout_data: { logs: updatedLog, timers: {} } });

    // Check if all sets for this exercise are done
    const setsToCheck = isSubstitute ? exercise.substitute.sets : exercise.sets;
    const allSetsCompleted = setsToCheck.every((s: any) => s.confirmed);

    if (allSetsCompleted) {
      // Track exercise completion
      if (currentSession?.id && exerciseName) {
        const totalReps = setsToCheck.reduce((sum: number, s: any) => sum + (parseInt(s.reps) || 0), 0);
        const avgWeight = setsToCheck.reduce((sum: number, s: any) => sum + (parseFloat(s.weight) || 0), 0) / setsToCheck.length;
        await trackExerciseCompletion(currentSession.id, username, exerciseName, setsToCheck.length, avgWeight, totalReps, 0);
      }

      // Check overall completion
      const totalCompletedSets = updatedLog.reduce((acc: number, ex: any) => {
        if (!ex?.sets) return acc;
        const mainCompleted = ex.sets.filter((s: any) => s.confirmed).length;
        const subCompleted = ex.substitute?.sets?.filter((s: any) => s.confirmed).length || 0;
        return acc + Math.max(mainCompleted, subCompleted);
      }, 0);
      const totalSets = updatedLog.reduce((acc: number, ex: any) => acc + (ex?.sets?.length || 0), 0);

      if (totalCompletedSets >= totalSets) {
        updateSession({ current_phase: 'completed' });
        try { await manualSave({ current_phase: 'completed' }); } catch {}
        navigate('/post-workout', { replace: true });
      } else {
        // Auto-advance to next exercise after a short delay
        setTimeout(() => {
          if (currentExerciseIndex < updatedLog.length - 1) {
            navigate(`/exercise/${currentExerciseIndex + 1}`, { replace: true });
          }
        }, 2000);
      }
    }
  };

  const handleRestComplete = () => {
    setShowRestTimer(false);
    setIsExerciseTimerPaused(false);
    setCurrentSetInProgress(null);
  };

  const handleRestStarted = async (duration: number) => {
    if (!currentSession?.id || !currentSetInProgress?.exerciseName) return;
    await trackRestTimer(currentSession.id, username, currentSetInProgress.exerciseName, currentSetInProgress.setIndex + 1, 'rest_started', duration);
  };

  const handleRestCompleted = async (actualDuration: number) => {
    if (!currentSession?.id || !currentSetInProgress?.exerciseName) return;
    await trackRestTimer(currentSession.id, username, currentSetInProgress.exerciseName, currentSetInProgress.setIndex + 1, 'rest_completed', actualDuration);
    setShowRestTimer(false);
    setIsExerciseTimerPaused(false);
    setCurrentSetInProgress(null);
  };

  const currentExercise = workoutLog[currentExerciseIndex];

  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Exercise Not Found</h1>
          <Button onClick={() => navigate('/')}>Back Home</Button>
        </Card>
      </div>
    );
  }

  // Which sets to render
  const activeSets = useSubstitute && currentExercise.substitute
    ? currentExercise.substitute.sets
    : currentExercise.sets;
  const activeExerciseName = useSubstitute && currentExercise.substitute
    ? currentExercise.substitute.name
    : currentExercise.name;

  // Progress
  const completedSets = workoutLog.reduce((acc: number, ex: any) => {
    if (!ex?.sets) return acc;
    const mainDone = ex.sets.filter((s: any) => s.confirmed).length;
    const subDone = ex.substitute?.sets?.filter((s: any) => s.confirmed).length || 0;
    return acc + Math.max(mainDone, subDone);
  }, 0);
  const totalSets = workoutLog.reduce((acc: number, ex: any) => acc + (ex?.sets?.length || 0), 0);
  const progressPct = Math.round((completedSets / totalSets) * 100);

  // Can switch to substitute only if no main sets have data, and vice versa
  const hasMainData = currentExercise.sets.some((s: any) => s.weight || s.reps || s.confirmed);
  const hasSubData = currentExercise.substitute?.sets?.some((s: any) => s.weight || s.reps || s.confirmed);
  const canSwitch = currentExercise.substitute && !hasMainData && !hasSubData;

  const openVideo = (url: string, title: string) => {
    setSelectedVideo({ url, title });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-2 sm:p-4 md:p-6 max-w-lg md:max-w-2xl lg:max-w-3xl space-y-3">
        {/* Header: name + nav + progress */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => currentExerciseIndex > 0 ? navigate(`/exercise/${currentExerciseIndex - 1}`) : navigate('/')}
            className="flex-shrink-0 h-11 w-11 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <h1 className="text-lg md:text-xl lg:text-2xl font-extrabold truncate">{activeExerciseName}</h1>
                <div className="pointer-events-none opacity-85 flex-shrink-0">
                  <SonnyAngelDetailed variant="lion" size={32} />
                </div>
              </div>
              <span className="text-sm text-muted-foreground flex-shrink-0 ml-2">
                {currentExerciseIndex + 1} of {workoutLog.length}
              </span>
            </div>
            {/* Inline progress bar */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-black border border-primary rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{completedSets}/{totalSets}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Video demo button */}
            <Button
              variant="outline"
              size="sm"
              className="h-11 px-3 gap-1.5 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/60"
              onClick={() => openVideo(
                useSubstitute && currentExercise.substitute
                  ? currentExercise.substitute.videoUrl
                  : currentExercise.videoUrl,
                activeExerciseName
              )}
            >
              <Play className="h-4 w-4 fill-primary" />
              <span className="text-xs font-semibold hidden sm:inline">Form</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => currentExerciseIndex < workoutLog.length - 1
                ? navigate(`/exercise/${currentExerciseIndex + 1}`)
                : navigate('/post-workout')}
              className="flex-shrink-0 h-11 w-11 p-0"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Substitute toggle */}
        {currentExercise.substitute && (
          <div className="text-center">
            {canSwitch ? (
              <button
                onClick={() => setUseSubstitute(!useSubstitute)}
                className="text-sm text-primary/80 hover:text-primary underline underline-offset-2"
              >
                {useSubstitute ? `Switch to ${currentExercise.name}` : `Switch to ${currentExercise.substitute.name}`}
              </button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Using {useSubstitute ? currentExercise.substitute.name : currentExercise.name}
              </p>
            )}
          </div>
        )}

        {/* Exercise Timer */}
        <ExerciseTimer
          key={currentExerciseIndex}
          duration={20}
          onComplete={() => setExerciseStartTime(null)}
          onStart={() => setExerciseStartTime(Date.now())}
          onSetComplete={() => {}}
          isActive={!!exerciseStartTime}
          isPaused={isExerciseTimerPaused}
          exerciseType="main"
        />

        {/* Sets */}
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {(() => {
            const lastSession = getLastSession(activeExerciseName);
            const firstIncompleteIdx = activeSets.findIndex((s: any) => !s.confirmed);
            return activeSets.map((set: any, idx: number) => {
              const suggestion = getSuggestion(activeExerciseName, set.type, idx);
              // Match last session data by setType
              const lastSetForType = lastSession?.sets.find(s => s.setType === set.type);
              const lastSet = lastSetForType ? { weight: lastSetForType.weight, reps: lastSetForType.reps } : undefined;
              return (
                <SetLog
                  key={set.id}
                  set={set}
                  onLogChange={(field, value) => handleLogChange(idx, field, value)}
                  onSetComplete={() => handleSetComplete(idx)}
                  suggestion={suggestion}
                  disabled={set.confirmed}
                  lastSet={lastSet}
                  autoFocus={idx === firstIncompleteIdx}
                />
              );
            });
          })()}
        </div>
      </div>

      {/* PR Celebration Modal */}
      {showPRModal && prCelebration.length > 0 && (
        <PRCelebration
          prs={prCelebration}
          onClose={() => { setShowPRModal(false); setPrCelebration([]); }}
        />
      )}

      {/* Rest Timer Modal */}
      {showRestTimer && currentSetInProgress && (
        <RestTimerModal
          isOpen={showRestTimer}
          onComplete={() => handleRestCompleted(0)}
          onClose={() => setShowRestTimer(false)}
          setDetails={{
            exerciseName: currentSetInProgress.exerciseName || currentExercise.name,
            setType: currentSetInProgress.setType || 'Set',
            setNumber: currentSetInProgress.setIndex + 1,
          }}
          onRestStarted={handleRestStarted}
          onRestCompleted={handleRestCompleted}
        />
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          videoUrl={selectedVideo.url}
          title={selectedVideo.title}
        />
      )}
    </div>
  );
}
