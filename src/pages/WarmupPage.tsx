import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Timer, CheckCircle2, Play, SkipForward } from 'lucide-react';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';

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

  const openVideo = (url: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
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
    try { await manualSave(updates); } catch {}
    navigate('/exercise/0', { replace: true });
  };

  const handleSkip = async () => {
    const updates = {
      current_phase: 'main' as const,
      warmup_completed: true,
      warmup_exercises_completed: false,
      warmup_mood: 'good',
      warmup_watched_videos: Array.from(checked),
    };
    updateSession(updates);
    try { await manualSave(updates); } catch {}
    navigate('/exercise/0', { replace: true });
  };

  const checkedCount = checked.size;
  const isReady = checkedCount >= Math.ceil(totalExercises / 2);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(340_82%_66%/0.1),transparent_50%)]" />

      <div className="container mx-auto px-4 py-6 max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold bg-gradient-hero bg-clip-text text-transparent mb-2">
            Warm-up
          </h1>
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
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {warmupExercises.map((category, catIdx) => (
              <div key={catIdx} className="space-y-2">
                <h4 className="font-semibold text-foreground text-sm">{category.category}</h4>
                <div className="space-y-1.5">
                  {category.exercises.map((exercise, exIdx) => {
                    const key = `${catIdx}-${exIdx}`;
                    const isChecked = checked.has(key);
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-card/50 border border-border/50 hover:bg-card/70 transition-colors"
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
                          onClick={() => openVideo(exercise.videoUrl)}
                          className="text-xs text-primary/70 hover:text-primary flex items-center gap-1"
                        >
                          <Play className="h-3 w-3" />
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
          {isReady && (
            <Button
              onClick={handleComplete}
              className="w-full h-14 bg-gradient-primary hover:shadow-glow font-bold"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              All Done - Start Workout
            </Button>
          )}
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Skip Warmup
          </Button>
        </div>
      </div>
    </div>
  );
}
