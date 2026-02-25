import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Home, Dumbbell, Flame } from 'lucide-react';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useProgression } from '@/hooks/useProgression';
import { ExerciseProgressChart } from '@/components/ExerciseProgressChart';
import { supabase } from '@/integrations/supabase/client';

export default function PostWorkoutPage() {
  const navigate = useNavigate();
  const { username } = useAuthenticatedUser();
  const { currentSession, initializeSession, resetSession } = useWorkoutStorage(username || '');
  const { allPRs, getWeightTrend } = useProgression(username || '');

  useEffect(() => {
    if (username) initializeSession();
  }, [username, initializeSession]);

  useEffect(() => {
    if (currentSession?.id && currentSession.current_phase !== 'completed') {
      switch (currentSession.current_phase) {
        case 'cardio': navigate('/cardio'); break;
        case 'warmup': navigate('/warmup'); break;
        case 'main': navigate('/exercise/0'); break;
        default: navigate('/'); break;
      }
    }
  }, [currentSession, navigate]);

  const sessionSummary = useMemo(() => {
    if (!currentSession?.workout_data?.logs) return null;
    const logs = currentSession.workout_data.logs;
    if (!Array.isArray(logs)) return null;

    let totalVolume = 0;
    const exercises: { name: string; heaviestWeight: number; totalReps: number; sets: number }[] = [];

    for (const exercise of logs) {
      if (!exercise?.sets) continue;
      const setsToCheck = exercise.sets.some((s: any) => s.confirmed) ? exercise.sets : exercise.substitute?.sets || [];
      const name = setsToCheck === exercise.sets ? exercise.name : exercise.substitute?.name || exercise.name;

      let heaviestWeight = 0;
      let totalReps = 0;
      let completedSets = 0;

      for (const set of setsToCheck) {
        if (!set.confirmed) continue;
        const w = parseFloat(set.weight) || 0;
        const r = parseInt(set.reps) || 0;
        totalVolume += w * r;
        heaviestWeight = Math.max(heaviestWeight, w);
        totalReps += r;
        completedSets++;
      }

      if (completedSets > 0) {
        exercises.push({ name, heaviestWeight, totalReps, sets: completedSets });
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const todayPRs = allPRs.filter(pr => pr.date === today);

    return { totalVolume, exercises, todayPRs };
  }, [currentSession, allPRs]);

  const headerMessage = useMemo(() => {
    if (!sessionSummary) return 'Solid consistency!';
    const prCount = sessionSummary.todayPRs.length;
    if (prCount >= 3) return `${prCount} PRs! Absolutely crushing it!`;
    if (prCount > 0) return `${prCount} PR${prCount > 1 ? 's' : ''} today! Great work!`;
    return 'Solid consistency! Keep showing up!';
  }, [sessionSummary]);

  // Collect exercise names that have chart data
  const exerciseCharts = useMemo(() => {
    if (!sessionSummary) return [];
    return sessionSummary.exercises
      .map(ex => ({
        name: ex.name,
        data: getWeightTrend(ex.name, 'Heavy/Top Set'),
      }))
      .filter(c => c.data.length >= 2);
  }, [sessionSummary, getWeightTrend]);

  const handleDone = async () => {
    localStorage.removeItem('jackyWorkoutLog');
    localStorage.removeItem('jackyCardioData');
    localStorage.removeItem('jackyWarmupData');
    localStorage.setItem('forceNewSession', '1');

    if (currentSession) {
      try {
        await supabase
          .from('workout_sessions')
          .update({ current_phase: 'completed', updated_at: new Date().toISOString() })
          .eq('id', currentSession.id);
      } catch (error) {
        console.error('Error marking session as completed:', error);
      }
    }

    resetSession();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(340_82%_66%/0.1),transparent_50%)]" />

      <div className="container mx-auto px-4 py-8 max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary/20 backdrop-blur-glass rounded-full text-primary-foreground font-medium text-sm mb-4 border border-primary/30">
            <Trophy className="h-4 w-4" />
            Workout Complete!
          </div>
          <h1 className="text-3xl font-extrabold bg-gradient-hero bg-clip-text text-transparent mb-2 tracking-tight">
            {headerMessage}
          </h1>
        </div>

        {/* Session Summary */}
        {sessionSummary && (
          <Card className="bg-black/50 backdrop-blur-glass border-white/10 shadow-lg mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Dumbbell className="h-5 w-5 text-primary" />
                Session Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-primary" />
                  <span className="text-white/80 text-sm">Total Volume</span>
                </div>
                <span className="text-primary font-bold text-lg">
                  {sessionSummary.totalVolume.toLocaleString()} lb
                </span>
              </div>

              <div className="space-y-2">
                {sessionSummary.exercises.map((ex, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-sm">
                    <span className="text-white/70 truncate flex-1 mr-2">{ex.name}</span>
                    <div className="flex items-center gap-3 text-white/60 flex-shrink-0">
                      <span className="font-medium text-white">{ex.heaviestWeight} lb</span>
                      <span>{ex.totalReps} reps</span>
                      <span>{ex.sets} sets</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* PRs Hit Today */}
        {sessionSummary && sessionSummary.todayPRs.length > 0 && (
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 shadow-lg mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-primary flex items-center gap-2 text-base">
                <Trophy className="h-5 w-5" />
                Personal Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sessionSummary.todayPRs.map((pr, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-black/30 rounded-lg text-sm">
                    <Trophy className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <span className="text-white font-medium">{pr.exerciseName}</span>
                    <span className="text-white/60">
                      {pr.prType === 'weight' && `${pr.value} lb (+${Math.round(pr.value - pr.previousValue)} lb)`}
                      {pr.prType === 'reps' && `${pr.value} reps (+${pr.value - pr.previousValue})`}
                      {pr.prType === 'estimated_1rm' && `e1RM: ${pr.value} lb`}
                      {pr.prType === 'volume' && `${pr.value} lb volume`}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Charts */}
        {exerciseCharts.length > 0 && (
          <div className="space-y-4 mb-6">
            {exerciseCharts.map((chart) => (
              <ExerciseProgressChart
                key={chart.name}
                data={chart.data}
                exerciseName={chart.name}
                compact
              />
            ))}
          </div>
        )}

        {/* Done Button */}
        <Button
          onClick={handleDone}
          className="w-full h-14 text-lg font-bold bg-gradient-primary hover:shadow-glow rounded-xl"
          size="lg"
        >
          <Home className="h-5 w-5 mr-2" />
          Done
        </Button>
      </div>
    </div>
  );
}
