import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Timer, CheckCircle2, Play, SkipForward } from 'lucide-react';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import SonnyAngelDetailed from '@/components/characters/SonnyAngelDetailed';
import BottomNav from '@/components/BottomNav';

const warmupExercises = [
  {
    category: 'Dynamic Stretches',
    exercises: [
      { name: 'Leg Swings', videoUrl: 'https://www.youtube.com/watch?v=4uegiLFV6l0&t=3s' },
    ],
  },
  {
    category: 'Mobility Drills',
    exercises: [
      { name: 'Deep Lunge (pushing knee outwards)', videoUrl: 'https://www.youtube.com/watch?v=yWuqjSFz2vc&t=3s' },
      { name: '90/90', videoUrl: 'https://www.youtube.com/watch?v=4uegiLFV6l0&t=9s' },
      { name: 'Frog', videoUrl: 'https://www.youtube.com/watch?v=yWuqjSFz2vc&t=6s' },
      { name: 'Single Leg Groin Stretch', videoUrl: 'https://www.youtube.com/watch?v=yWuqjSFz2vc&t=9s' },
    ],
  },
  {
    category: 'Activation Exercises',
    exercises: [
      { name: 'Deep Squat (pushing knees outwards)', videoUrl: 'https://www.youtube.com/watch?v=yWuqjSFz2vc&t=12s' },
      { name: 'Deep Squat w/ Knee Taps', videoUrl: 'https://www.youtube.com/watch?v=yWuqjSFz2vc&t=15s' },
      { name: 'Cossack Squat', videoUrl: 'https://www.youtube.com/watch?v=4uegiLFV6l0&t=4s' },
      { name: 'Cossack Squat w/ Internal Rotation', videoUrl: 'https://www.youtube.com/watch?v=yWuqjSFz2vc&t=19s' },
      { name: 'ATG Split Squat', videoUrl: 'https://www.youtube.com/watch?v=4uegiLFV6l0&t=6s' },
    ],
  },
];

const totalExercises = warmupExercises.reduce((acc, cat) => acc + cat.exercises.length, 0);

export default function WarmupPage() {
  const navigate = useNavigate();
  const { username } = useAuthenticatedUser();
  const { currentSession, updateSession, initializeSession, manualSave } = useWorkoutStorage(username || '');

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (username) initializeSession();
  }, [username, initializeSession]);

  useEffect(() => {
    if (currentSession) {
      if (!currentSession.cardio_completed) {
        navigate('/cardio');
        return;
      }
      if (currentSession.warmup_completed) {
        navigate('/exercise/0');
        return;
      }
      // Restore checked state from watched videos
      if (currentSession.warmup_watched_videos?.length) {
        setChecked(new Set(currentSession.warmup_watched_videos));
      }
    }
  }, [currentSession, navigate]);

  const toggleCheck = (key: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openVideo = (url: string, title: string) => {
    setSelectedVideo({ url, title });
  };

  const handleComplete = async () => {
    const updates = {
      current_phase: 'main' as const,
      warmup_completed: true,
      warmup_exercises_completed: true,
      warmup_mood: 'good',
      warmup_watched_videos: Array.from(checked),
    };
    updateSession(updates);
    try { await manualSave(updates); } catch { /* save may fail silently */ }
    navigate('/exercise/0', { replace: true });
  };

  const handleSkip = async () => {
    if (!window.confirm('Skip warmup exercises?')) return;
    const updates = {
      current_phase: 'main' as const,
      warmup_completed: true,
      warmup_exercises_completed: false,
      warmup_mood: 'good',
      warmup_watched_videos: Array.from(checked),
    };
    updateSession(updates);
    try { await manualSave(updates); } catch { /* save may fail silently */ }
    navigate('/exercise/0', { replace: true });
  };

  const checkedCount = checked.size;
  const threshold = Math.ceil(totalExercises / 2);
  const isReady = checkedCount >= threshold;
  const remaining = threshold - checkedCount;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(340_82%_66%/0.1),transparent_50%)]" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 sm:py-6 pb-20 max-w-sm md:max-w-lg lg:max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-hero bg-clip-text text-transparent mb-2">
              Warm-up
            </h1>
            <div className="pointer-events-none opacity-85">
              <SonnyAngelDetailed variant="cat" size={40} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            2 sets of 10-20 reps per side/movement
          </p>
        </div>

        {/* Checklist */}
        <Card className="bg-black border-primary/10 shadow-lg mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-accent flex items-center gap-2 text-base">
              <Timer className="h-5 w-5" />
              Warmup Checklist
              <span className="text-xs text-muted-foreground ml-auto">{checkedCount}/{totalExercises}</span>
              <div className="pointer-events-none opacity-85">
                <SonnyAngelDetailed variant="monkey" size={36} />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {warmupExercises.map((category, catIdx) => (
              <div key={catIdx} className="space-y-2">
                <h4 className="font-semibold text-foreground text-sm">{category.category}</h4>
                <div className="space-y-1.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
                  {category.exercises.map((exercise, exIdx) => {
                    const key = `${catIdx}-${exIdx}`;
                    const isChecked = checked.has(key);
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-3 p-2 sm:p-2.5 md:p-3 rounded-lg bg-card/50 border border-border/50 hover:bg-card/70 transition-colors"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleCheck(key)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <span className={`text-sm flex-1 ${isChecked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {exercise.name}
                        </span>
                        <button
                          onClick={() => openVideo(exercise.videoUrl, exercise.name)}
                          className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-md text-xs font-semibold bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 hover:border-primary/50 active:bg-primary/35 active:border-primary/60 active:scale-95 transition-all"
                        >
                          <Play className="h-3.5 w-3.5 fill-primary" />
                          Watch
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          {!isReady && remaining > 0 && (
            <p className="text-sm text-primary/70 text-center">
              Check {remaining} more to continue
            </p>
          )}
          {isReady && (
            <Button
              onClick={handleComplete}
              className="w-full h-12 sm:h-14 bg-gradient-primary hover:shadow-glow active:shadow-none active:scale-[0.98] font-bold transition-all"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              All Done - Start Workout
            </Button>
          )}
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full h-11 sm:h-12 text-muted-foreground hover:text-foreground active:text-foreground active:bg-muted/30 active:scale-[0.98] transition-all"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Skip Warmup
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
