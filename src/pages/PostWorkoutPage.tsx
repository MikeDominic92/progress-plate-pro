import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Home, Dumbbell, Flame, Download, AlertTriangle, Play, ChevronDown, ChevronUp, Timer } from 'lucide-react';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useProgression } from '@/hooks/useProgression';
import { ExerciseProgressChart } from '@/components/ExerciseProgressChart';
import { VideoPlayer } from '@/components/VideoPlayer';
import { supabase } from '@/integrations/supabase/client';
import { downloadWorkoutCsv } from '@/utils/exportWorkoutCsv';
import { useToast } from '@/hooks/use-toast';
import SonnyAngelDetailed from '@/components/characters/SonnyAngelDetailed';
import BottomNav from '@/components/BottomNav';

export default function PostWorkoutPage() {
  const navigate = useNavigate();
  const { username } = useAuthenticatedUser();
  const { currentSession, initializeSession, resetSession } = useWorkoutStorage(username || '');
  const { allPRs, getWeightTrend, getPlateauStatus, recentSessions } = useProgression(username || '');
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [abRipperOpen, setAbRipperOpen] = useState(true);
  const [cardioOpen, setCardioOpen] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);

  const handleDownloadData = async () => {
    if (!username) return;
    setDownloading(true);
    try {
      await downloadWorkoutCsv(username);
      toast({
        title: 'Download Started',
        description: 'Your workout history CSV is downloading.',
      });
    } catch (err: any) {
      console.error('CSV export failed:', err);
      toast({
        title: 'Export Failed',
        description: err?.message || 'Could not export workout data.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (username) initializeSession();
  }, [username, initializeSession]);

  // Post-workout page is always accessible (Ab Ripper X, cooldown cardio, etc.)

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

    // Find previous session volume (skip today's entry)
    const previousSession = recentSessions.find(s => s.date !== today && s.totalVolume > 0);
    const previousVolume = previousSession?.totalVolume || null;

    let volumeDelta: number | null = null;
    let volumeDeltaPct: number | null = null;
    if (previousVolume && totalVolume > 0) {
      volumeDelta = totalVolume - previousVolume;
      volumeDeltaPct = Math.round((volumeDelta / previousVolume) * 100);
    }

    return { totalVolume, exercises, todayPRs, previousVolume, volumeDelta, volumeDeltaPct };
  }, [currentSession, allPRs, recentSessions]);

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

  // Compute plateau warnings for exercises in this session
  const plateauWarnings = useMemo(() => {
    if (!sessionSummary) return [];
    return sessionSummary.exercises
      .map(ex => ({ name: ex.name, status: getPlateauStatus(ex.name) }))
      .filter(p => p.status.isPlateaued);
  }, [sessionSummary, getPlateauStatus]);

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

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 pb-20 max-w-sm md:max-w-lg lg:max-w-3xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary/20 backdrop-blur-glass rounded-full text-primary-foreground font-medium text-sm mb-4 border border-primary/30">
            <Trophy className="h-4 w-4" />
            Workout Complete!
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-hero bg-clip-text text-transparent mb-2 tracking-tight">
              {headerMessage}
            </h1>
            <div className="pointer-events-none">
              <SonnyAngelDetailed variant="bear" size={48} />
            </div>
          </div>
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
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-primary" />
                    <span className="text-white/80 text-sm">Total Volume</span>
                  </div>
                  <span className="text-primary font-bold text-lg">
                    {sessionSummary.totalVolume.toLocaleString()} lb
                  </span>
                </div>
                {sessionSummary.volumeDelta !== null && sessionSummary.volumeDeltaPct !== null && (
                  <div className="flex items-center justify-end mt-1">
                    <span className={`text-xs font-medium ${
                      sessionSummary.volumeDeltaPct > 2 ? 'text-green-400' :
                      sessionSummary.volumeDeltaPct < -2 ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {sessionSummary.volumeDelta > 0 ? '+' : ''}{sessionSummary.volumeDelta.toLocaleString()} lb ({sessionSummary.volumeDeltaPct > 0 ? '+' : ''}{sessionSummary.volumeDeltaPct}%) vs last
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2 md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:space-y-0">
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

        {/* Ab Ripper X */}
        <Card className="bg-black/50 backdrop-blur-glass border-white/10 shadow-lg mb-6">
          <button
            onClick={() => setAbRipperOpen(!abRipperOpen)}
            className="w-full flex items-center justify-between p-4 active:bg-white/5 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-accent" />
              <span className="text-white font-semibold text-base">P90X Ab Ripper X</span>
              <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent/80">12 moves</span>
            </div>
            {abRipperOpen ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
          </button>
          {abRipperOpen && (
            <CardContent className="pt-0 space-y-3">
              <button
                onClick={() => setSelectedVideo({ url: 'https://vimeo.com/892893307', title: 'P90X Ab Ripper X - Follow Along' })}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 border border-accent/30 hover:border-accent/50 hover:from-accent/30 hover:to-accent/30 active:scale-95 transition-all duration-200 group"
              >
                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-accent/20 group-hover:bg-accent/30 transition-colors">
                  <Play className="h-5 w-5 fill-accent text-accent" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold text-accent block">Follow Along Video</span>
                  <span className="text-[0.6rem] text-accent/60">Full Ab Ripper X workout (~16 min)</span>
                </div>
              </button>

              <div className="space-y-1">
                {[
                  { name: 'In and Out', reps: '25 reps', desc: 'Sit, extend legs out, pull knees back to chest' },
                  { name: 'Bicycle', reps: '25 reps', desc: 'Recumbent pedaling motion forward' },
                  { name: 'Reverse Bicycle', reps: '25 reps', desc: 'Pedaling motion in reverse' },
                  { name: 'Crunchy Frog', reps: '25 reps', desc: 'Pull knees in with arms wrapped, extend out' },
                  { name: 'Wide-Leg Sit-Up', reps: '12/side', desc: 'Legs wide, reach to opposite foot' },
                  { name: 'Fifer Scissor', reps: '24 reps', desc: 'Alternate lifting legs toward ceiling' },
                  { name: 'Hip Rock \'n Raise', reps: '25 reps', desc: 'Butterfly legs, lift hips to ceiling' },
                  { name: 'Pulse-Up (Heels to Heaven)', reps: '25 reps', desc: 'Legs vertical, pulse hips up' },
                  { name: 'V-Up / Roll-Up Combo', reps: '25 reps', desc: 'Full sit-up then V-up balance' },
                  { name: 'Oblique V-Up', reps: '25/side', desc: 'Side-lying, lift torso + legs together' },
                  { name: 'Leg Climb', reps: '12/leg', desc: 'Climb hand-over-hand up raised leg' },
                  { name: 'Mason Twist', reps: '40 reps', desc: 'Seated twist, touch floor each side' },
                ].map((ex, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-[0.6rem] text-white/20 w-4 text-right flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-white/80 font-medium">{ex.name}</span>
                      <span className="text-[0.6rem] text-white/30 ml-1.5">{ex.desc}</span>
                    </div>
                    <span className="text-[0.6rem] text-accent/70 font-medium flex-shrink-0">{ex.reps}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Cooldown Cardio - 10 Min Stairmaster */}
        <Card className="bg-black/50 backdrop-blur-glass border-white/10 shadow-lg mb-6">
          <button
            onClick={() => setCardioOpen(!cardioOpen)}
            className="w-full flex items-center justify-between p-4 active:bg-white/5 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-green-400" />
              <span className="text-white font-semibold text-base">Cooldown Cardio</span>
              <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400/80">10 min</span>
            </div>
            {cardioOpen ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
          </button>
          {cardioOpen && (
            <CardContent className="pt-0 space-y-3">
              <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-green-400">Stairmaster</span>
                </div>
                <p className="text-xs text-white/50">10 minutes at moderate pace. Focus on controlled steps, upright posture, and steady breathing. Great for glute activation cooldown.</p>
              </div>
              <div className="space-y-1">
                {[
                  { min: '0-2', label: 'Easy Warm-Up', detail: 'Level 4-5, light pace to get moving' },
                  { min: '2-4', label: 'Steady Climb', detail: 'Level 6-7, find your rhythm' },
                  { min: '4-7', label: 'Moderate Push', detail: 'Level 7-8, skip a step every 5th step' },
                  { min: '7-9', label: 'Steady Pace', detail: 'Level 6-7, consistent steps' },
                  { min: '9-10', label: 'Cool Down', detail: 'Level 4, slow controlled steps' },
                ].map((seg, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-[0.6rem] text-green-400/60 font-mono w-8 flex-shrink-0">{seg.min}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-white/80 font-medium">{seg.label}</span>
                      <span className="text-[0.6rem] text-white/30 ml-1.5">{seg.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

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
                    <span className="text-white font-medium truncate flex-shrink min-w-0">{pr.exerciseName}</span>
                    <span className="text-white/60 flex-shrink-0">
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

        {/* Plateau Warnings */}
        {plateauWarnings.length > 0 && (
          <Card className="bg-yellow-500/10 border-yellow-500/30 shadow-lg mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-yellow-400 flex items-center gap-2 text-base">
                <AlertTriangle className="h-5 w-5" />
                Plateau Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {plateauWarnings.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 bg-black/30 rounded-lg text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-white font-medium">{p.name}</span>
                      <p className="text-white/60 text-xs mt-0.5">{p.status.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Charts */}
        {exerciseCharts.length > 0 && (
          <div className="space-y-4 md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:space-y-0 mb-6">
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

        {/* Download My Data */}
        <Button
          variant="outline"
          onClick={handleDownloadData}
          disabled={downloading}
          className="w-full mb-4 h-11 border-white/10 bg-white/5 hover:bg-white/10 active:bg-white/15 active:scale-95 text-white/80 hover:text-white active:text-white backdrop-blur-sm"
        >
          <Download className="h-4 w-4 mr-2" />
          {downloading ? 'Exporting...' : 'Download My Data'}
        </Button>

        {/* Done Button */}
        <div className="relative">
          <div className="absolute -top-2 -right-2 pointer-events-none">
            <SonnyAngelDetailed variant="koala" size={40} />
          </div>
          <Button
            onClick={handleDone}
            className="w-full h-14 text-lg font-bold bg-gradient-primary hover:shadow-glow active:shadow-glow active:scale-[0.98] rounded-xl transition-transform"
            size="lg"
          >
            <Home className="h-5 w-5 mr-2" />
            Done
          </Button>
        </div>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          videoUrl={selectedVideo.url}
          title={selectedVideo.title}
        />
      )}

      <BottomNav />
    </div>
  );
}
