import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer, Play, CheckCircle2, Target } from 'lucide-react';
import { ExerciseTimer } from '@/components/ExerciseTimer';
import { SessionTimer } from '@/components/SessionTimer';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useToast } from '@/hooks/use-toast';

export default function WarmupPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { username } = useAuthenticatedUser();
  const { currentSession, updateSession, initializeSession, manualSave } = useWorkoutStorage(username || '');
  
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentExerciseStartTime, setCurrentExerciseStartTime] = useState<number | null>(null);
  const [warmupData, setWarmupData] = useState({
    mood: '',
    exercisesCompleted: false,
    completed: false,
    watchedVideos: [] as string[]
  });
  const [selectedVideo, setSelectedVideo] = useState<{url: string, title: string, timeSegment?: string} | null>(null);

  useEffect(() => {
    if (username) {
      initializeSession();
    }
  }, [username, initializeSession]);

  const moodOptions = [
    { value: 'perfect', label: 'Perfect 💯', score: '100', color: 'text-success' },
    { value: 'great', label: 'Great 😄', score: '90', color: 'text-success' },
    { value: 'good', label: 'Good 😊', score: '80', color: 'text-primary' },
    { value: 'okay', label: 'Okay 😐', score: '70', color: 'text-accent' },
    { value: 'feeling-off', label: 'Feeling Off/Weak 😕', score: '60', color: 'text-warning' },
    { value: 'fatigued', label: 'Fatigued 😰', score: '50', color: 'text-destructive' }
  ];

  const warmupExercises = [
    {
      category: "Dynamic Stretches",
      exercises: [
        { name: "Leg Swings", videoUrl: "https://www.youtube.com/watch?v=4uegiLFV6l0&t=3s", timeSegment: "[00:00:03 - 00:00:04]" }
      ]
    },
    {
      category: "Mobility Drills", 
      exercises: [
        { name: "Deep Lunge (pushing knee outwards)", videoUrl: "https://www.youtube.com/watch?v=yWuqjSFz2vc&t=3s", timeSegment: "[00:00:03 - 00:00:05]" },
        { name: "90/90", videoUrl: "https://www.youtube.com/watch?v=4uegiLFV6l0&t=9s", timeSegment: "[00:00:09 - 00:00:11]" },
        { name: "Frog", videoUrl: "https://www.youtube.com/watch?v=yWuqjSFz2vc&t=6s", timeSegment: "[00:00:06 - 00:00:08]" },
        { name: "Single Leg Groin Stretch", videoUrl: "https://www.youtube.com/watch?v=yWuqjSFz2vc&t=9s", timeSegment: "[00:00:09 - 00:00:11]" }
      ]
    },
    {
      category: "Activation Exercises",
      exercises: [
        { name: "Deep Squat (pushing knees outwards)", videoUrl: "https://www.youtube.com/watch?v=yWuqjSFz2vc&t=12s", timeSegment: "[00:00:12 - 00:00:14]" },
        { name: "Deep Squat w/ Knee Taps", videoUrl: "https://www.youtube.com/watch?v=yWuqjSFz2vc&t=15s", timeSegment: "[00:00:15 - 00:00:17]" },
        { name: "Cossack Squat", videoUrl: "https://www.youtube.com/watch?v=4uegiLFV6l0&t=4s", timeSegment: "[00:00:04 - 00:00:06]" },
        { name: "Cossack Squat w/ Internal Rotation", videoUrl: "https://www.youtube.com/watch?v=yWuqjSFz2vc&t=19s", timeSegment: "[00:00:19 - 00:00:22]" },
        { name: "ATG Split Squat", videoUrl: "https://www.youtube.com/watch?v=4uegiLFV6l0&t=6s", timeSegment: "[00:00:06 - 00:00:08]" }
      ]
    }
  ];

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  useEffect(() => {
    if (currentSession) {
      // Check if user should be on this page - but don't redirect immediately
      // Give some time for session to update after navigation
      const checkRedirect = setTimeout(() => {
        if (!currentSession.cardio_completed) {
          navigate('/cardio');
          return;
        }
        
        if (currentSession.warmup_completed) {
          navigate('/workout');
          return;
        }
      }, 100); // Small delay to prevent race conditions

      // Load warmup data
      setWarmupData({
        mood: currentSession.warmup_mood || '',
        exercisesCompleted: currentSession.warmup_exercises_completed || false,
        completed: currentSession.warmup_completed || false,
        watchedVideos: currentSession.warmup_watched_videos || []
      });

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
    setCurrentExerciseStartTime(Date.now());
  };

  const handleExerciseComplete = () => {
    setCurrentExerciseStartTime(null);
  };

  const areAllVideosWatched = () => {
    const totalVideos = warmupExercises.reduce((acc, category) => acc + category.exercises.length, 0);
    const watchedVideos = warmupData.watchedVideos || [];
    return watchedVideos.length >= totalVideos;
  };

  const handleVideoWatched = (categoryIndex: number, exerciseIndex: number) => {
    const videoKey = `${categoryIndex}-${exerciseIndex}`;
    const watchedVideos = warmupData.watchedVideos || [];
    if (!watchedVideos.includes(videoKey)) {
      const updatedWarmupData = { 
        ...warmupData, 
        watchedVideos: [...watchedVideos, videoKey]
      };
      setWarmupData(updatedWarmupData);
      
      // Start warmup timer automatically when first video is clicked
      if (watchedVideos.length === 0 && !currentExerciseStartTime) {
        handleExerciseStart();
      }
    }
  };

  const isVideoWatched = (categoryIndex: number, exerciseIndex: number) => {
    const videoKey = `${categoryIndex}-${exerciseIndex}`;
    return (warmupData.watchedVideos || []).includes(videoKey);
  };

  const isExerciseUnlocked = (categoryIndex: number, exerciseIndex: number) => {
    if (categoryIndex === 0 && exerciseIndex === 0) return true;
    
    let flatIndex = 0;
    for (let catIdx = 0; catIdx < warmupExercises.length; catIdx++) {
      for (let exIdx = 0; exIdx < warmupExercises[catIdx].exercises.length; exIdx++) {
        if (catIdx === categoryIndex && exIdx === exerciseIndex) {
          const prevFlatIndex = flatIndex - 1;
          if (prevFlatIndex < 0) return true;
          
          let currentFlatIndex = 0;
          for (let prevCatIdx = 0; prevCatIdx < warmupExercises.length; prevCatIdx++) {
            for (let prevExIdx = 0; prevExIdx < warmupExercises[prevCatIdx].exercises.length; prevExIdx++) {
              if (currentFlatIndex === prevFlatIndex) {
                return isVideoWatched(prevCatIdx, prevExIdx);
              }
              currentFlatIndex++;
            }
          }
        }
        flatIndex++;
      }
    }
    return false;
  };

  const openVideoSafely = (videoUrl: string) => {
    try {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error opening video:', error);
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleComplete = async () => {
    if (warmupData.mood && (warmupData.exercisesCompleted || areAllVideosWatched())) {
      const updatedData = { ...warmupData, completed: true };
      setWarmupData(updatedData);
      
      const updates = {
        current_phase: 'main' as const,
        warmup_completed: true,
        warmup_exercises_completed: true,
        warmup_mood: warmupData.mood,
        warmup_watched_videos: warmupData.watchedVideos
      };

      // Update local session state immediately
      updateSession(updates);

      // Persist to Supabase before navigating to avoid redirect bounce
      try {
        await manualSave(updates);
      } catch (e) {
        console.error('Failed to save warmup completion, navigating anyway', e);
      }

      navigate('/workout', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(24_95%_53%/0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(24_95%_53%/0.05),transparent_50%)]" />
      
      <SessionTimer 
        startTime={sessionStartTime} 
        onMotivationalMessage={handleMotivationalMessage}
      />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-primary/20 backdrop-blur-glass rounded-full text-primary-foreground font-medium text-sm mb-6 border border-primary/30">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <Target className="h-4 w-4" />
            Phase 2: Comprehensive Warm-up
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-hero bg-clip-text text-transparent mb-4 tracking-tight">
            Warm-up Protocol
          </h1>
        </div>

        {/* Exercise Timer */}
        {warmupData.mood && (
          <div id="warmup-timer">
            <ExerciseTimer
              duration={25}
              onComplete={handleExerciseComplete}
              onStart={handleExerciseStart}
              onSetComplete={() => {}}
              isActive={currentExerciseStartTime !== null}
              isPaused={false}
              exerciseType="warmup"
            />
          </div>
        )}

        {/* Warmup Content */}
        <Card className="bg-black border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-accent flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Comprehensive Leg Day Warm-up
              {warmupData.completed && <CheckCircle2 className="h-5 w-5 text-success" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mood Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">How are you feeling today?</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  {moodOptions.slice(0, 3).map((option) => (
                    <Button
                      key={option.value}
                      variant={warmupData.mood === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setWarmupData({ ...warmupData, mood: option.value });
                        // Save immediately after mood selection
                        setTimeout(() => manualSave(), 100);
                      }}
                      className={`w-full justify-between h-auto py-3 px-3 ${option.color} ${
                        warmupData.mood === option.value 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-white/5 hover:bg-white/10 border-white/20'
                      }`}
                      disabled={warmupData.completed}
                    >
                      <span className="text-xs leading-tight flex-1 text-left truncate pr-2">{option.label}</span>
                      <span className="font-bold text-sm">{option.score}</span>
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  {moodOptions.slice(3, 6).map((option) => (
                    <Button
                      key={option.value}
                      variant={warmupData.mood === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setWarmupData({ ...warmupData, mood: option.value });
                        // Save immediately after mood selection
                        setTimeout(() => manualSave(), 100);
                      }}
                      className={`w-full justify-between h-auto py-3 px-3 ${option.color} ${
                        warmupData.mood === option.value 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-white/5 hover:bg-white/10 border-white/20'
                      }`}
                      disabled={warmupData.completed}
                    >
                      <span className="text-xs leading-tight flex-1 text-left truncate pr-2">{option.label}</span>
                      <span className="font-bold text-sm">{option.score}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Warmup Exercises */}
            {warmupData.mood && !warmupData.completed && (
              <>
                {warmupExercises.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="space-y-3">
                    <h4 className="font-semibold text-foreground">{category.category}</h4>
                    <p className="text-xs text-muted-foreground">2 sets of 10-20 reps per side/movement</p>
                    <div className="space-y-2">
                      {category.exercises.map((exercise, exerciseIndex) => {
                        const isWatched = isVideoWatched(categoryIndex, exerciseIndex);
                        const isUnlocked = isExerciseUnlocked(categoryIndex, exerciseIndex);
                        const isLocked = !isUnlocked;
                        
                        return (
                          <div key={exerciseIndex} className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                            isLocked 
                              ? 'bg-card/20 border-border/30 opacity-60' 
                              : 'bg-card/50 border-border/50 hover:bg-card/70'
                          }`}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-medium ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                                  {exercise.name}
                                </p>
                                {isWatched && (
                                  <div className="flex items-center gap-1 text-xs text-success">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Completed</span>
                                  </div>
                                )}
                                {isLocked && !isWatched && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <div className="w-3 h-3 rounded-full border border-muted-foreground/40 flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full" />
                                    </div>
                                    <span>Locked</span>
                                  </div>
                                )}
                              </div>
                              <p className={`text-xs ${isLocked && !isWatched ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                                Watch {exercise.timeSegment}
                              </p>
                            </div>
                            <Button
                              onClick={() => {
                                if (isUnlocked) {
                                  setSelectedVideo({
                                    url: exercise.videoUrl,
                                    title: exercise.name,
                                    timeSegment: exercise.timeSegment
                                  });
                                }
                              }}
                              variant={isWatched ? "default" : "outline"}
                              size="sm"
                              disabled={isLocked}
                              className={`flex items-center gap-1 transition-all duration-300 ${
                                isLocked
                                  ? 'opacity-40 cursor-not-allowed'
                                  : isWatched 
                                    ? 'bg-success hover:bg-success/80 text-success-foreground border-success' 
                                    : 'hover:bg-primary/10 hover:border-primary/30'
                              }`}
                            >
                              <Play className="h-3 w-3" />
                              {isLocked ? 'Locked' : isWatched ? 'Watched' : 'Watch'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {(warmupData.exercisesCompleted || areAllVideosWatched()) && (
                  <div className="space-y-4">
                    {areAllVideosWatched() && (
                      <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
                        <div className="flex items-center justify-center gap-2 text-success font-medium text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          All warmup videos watched! Ready to complete.
                        </div>
                      </div>
                    )}
                    <Button 
                      onClick={handleComplete}
                      className="w-full bg-gradient-primary hover:shadow-glow"
                    >
                      Complete Warm-up & Continue to Main Workout
                    </Button>
                  </div>
                )}
              </>
            )}
            
            {warmupData.completed && (
              <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
                <div className="flex items-center justify-center gap-2 text-success font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Comprehensive Warm-up Complete! Feeling {warmupData.mood.replace('-', ' ')}
                </div>
                <p className="text-sm text-muted-foreground mt-2">Redirecting to main workout...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          videoUrl={selectedVideo.url}
          title={selectedVideo.title}
          timeSegment={selectedVideo.timeSegment}
          onPlay={() => {
            // Handle video play - find the video index and mark as watched
            const categoryIndex = warmupExercises.findIndex(category => 
              category.exercises.some(ex => ex.name === selectedVideo.title)
            );
            const exerciseIndex = warmupExercises[categoryIndex]?.exercises.findIndex(
              ex => ex.name === selectedVideo.title
            );
            
            if (categoryIndex !== -1 && exerciseIndex !== -1) {
              handleVideoWatched(categoryIndex, exerciseIndex);
              // Save immediately after watching video
              manualSave();
            }
            
            // Close the video player
            setSelectedVideo(null);
          }}
        />
      )}
    </div>
  );
}