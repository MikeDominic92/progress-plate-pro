import React, { useState, useEffect } from 'react';
import { FitnessInput } from '@/components/ui/fitness-input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Weight, Repeat, Play, Target, Timer, TrendingUp, Clock, Trophy, Zap, CheckCircle2, ArrowLeft } from 'lucide-react';
import { CircularProgress } from './CircularProgress';
import { RestTimer } from './RestTimer';
import { SessionTimer } from './SessionTimer';
import { ExerciseTimer } from './ExerciseTimer';
import { RestTimerSelector } from './RestTimerSelector';
import { useToast } from '@/hooks/use-toast';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';

// --- Data Structure for the Workout ---
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

const SetLog = ({ set, onLogChange }: { set: any, onLogChange: (field: string, value: string) => void }) => {
  const isWarmUp = set.type === 'Warm Up Set';
  const isComplete = set.weight && set.reps;
  
  return (
    <Card className={`transition-all duration-300 backdrop-blur-glass border-white/10 ${isWarmUp ? 'bg-primary/10 border-primary/30 shadow-glass' : 'bg-card/60 shadow-md'} ${isComplete ? 'ring-1 ring-success/50 bg-success/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-1">
            <h4 className="font-semibold text-foreground">{set.type}</h4>
            <p className="text-sm text-muted-foreground">{set.instructions}</p>
          </div>
          {isComplete && (
            <Badge variant="outline" className="text-success border-success/50 bg-success/10">
              Complete
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <FitnessInput
            label="Weight"
            icon={<Weight className="h-4 w-4" />}
            type="number"
            placeholder="0"
            value={set.weight}
            onChange={(e) => onLogChange('weight', e.target.value)}
            variant={set.weight ? 'success' : 'default'}
          />
          <FitnessInput
            label="Reps"
            icon={<Repeat className="h-4 w-4" />}
            type="number"
            placeholder="0"
            value={set.reps}
            onChange={(e) => onLogChange('reps', e.target.value)}
            variant={set.reps ? 'success' : 'default'}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const ExerciseCard = ({ exercise, exIndex, onLogChange, isActive, isLocked, isCompleted, onStartTimer, isTimerActive }: { exercise: any, exIndex: number, onLogChange: any, isActive: boolean, isLocked: boolean, isCompleted: boolean, onStartTimer: () => void, isTimerActive: boolean }) => {
  const [activeTab, setActiveTab] = useState('main');
  const hasSubstitute = !!exercise.substitute;
  const activeExercise = activeTab === 'main' ? exercise : exercise.substitute;
  
  // Calculate completion percentage
  const completedSets = activeExercise.sets.filter((set: any) => set.weight && set.reps).length;
  const totalSets = activeExercise.sets.length;
  const completionPercentage = (completedSets / totalSets) * 100;
  const isFullyComplete = completionPercentage === 100;

  return (
    <>
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
                    // Start main workout timer if not already active
                    if (!isTimerActive) {
                      onStartTimer();
                    }
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
              <Button 
                size="sm"
                variant="outline"
                disabled={isLocked}
                onClick={() => !isLocked && console.log('Rest button clicked')}
                className={`${
                  isLocked 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'bg-white/5 hover:bg-white/10 border-white/20'
                }`}
              >
                <Clock className="h-4 w-4 mr-2" />
                Manual Rest
              </Button>
            </div>
          </div>
          
          {/* Enhanced Progress Display */}
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
            {activeExercise.sets.map((set: any, setIndex: number) => (
              <div key={`${activeTab}-${set.id}`} className={isLocked ? 'pointer-events-none opacity-50' : ''}>
                <SetLog 
                  set={set} 
                  onLogChange={isLocked ? () => {} : (field, value) => onLogChange(exIndex, setIndex, field, value, activeTab)} 
                />
              </div>
            ))}
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
    </>
  );
};

const WorkoutIntro = () => (
  <Card className="bg-gradient-card/80 backdrop-blur-glass border-primary/30 shadow-lg shadow-glass">
    <CardHeader>
      <CardTitle className="text-center text-primary">
        <Target className="h-6 w-6 mx-auto mb-2" />
        Workout Philosophy & Intensity Protocol
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 text-sm text-muted-foreground">
      <p className="text-foreground">This workout is designed to build a strong foundation for your glutes. We measure intensity using a method called <strong>Reps in Reserve (RIR)</strong>.</p>
      
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground">Key Terms:</h4>
        <div className="grid gap-3">
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <strong className="text-primary">Reps in Reserve (RIR):</strong> Number of reps you have "left in the tank" when finishing a set.
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <strong className="text-accent">AMRAP:</strong> As Many Reps As Possible - perform until technical failure.
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <strong className="text-warning">Technical Failure:</strong> Can't perform another rep with perfect form.
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const CardioTracking = ({ cardioData, setCardioData, onStartSession, sessionStartTime, manualSave }: { cardioData: any, setCardioData: any, onStartSession: () => void, sessionStartTime: number | null, manualSave?: any }) => {
  const handleComplete = () => {
    if (cardioData.time && cardioData.calories) {
      setCardioData({ ...cardioData, completed: true });
      // Save immediately when completing cardio
      if (manualSave) {
        manualSave({
          cardio_completed: true,
          cardio_time: cardioData.time,
          cardio_calories: cardioData.calories
        });
      }
    }
  };

  const handleTimeChange = (e: any) => {
    const newCardioData = { ...cardioData, time: e.target.value };
    setCardioData(newCardioData);
    // Debounced save for input changes
    if (manualSave) {
      setTimeout(() => {
        manualSave({
          cardio_time: e.target.value
        });
      }, 500);
    }
  };

  const handleCaloriesChange = (e: any) => {
    const newCardioData = { ...cardioData, calories: e.target.value };
    setCardioData(newCardioData);
    // Debounced save for input changes
    if (manualSave) {
      setTimeout(() => {
        manualSave({
          cardio_calories: e.target.value
        });
      }, 500);
    }
  };

  return (
    <Card className="bg-gradient-secondary/80 backdrop-blur-glass border-accent/30 shadow-lg shadow-glass">
      <CardHeader>
        <CardTitle className="text-accent flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Pre-Workout Cardio
          {cardioData.completed && <CheckCircle2 className="h-5 w-5 text-success" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
          <h4 className="font-semibold text-foreground mb-2">Stair Master - 10 minutes</h4>
          <p className="text-muted-foreground mb-3">Easy pace, focus on long steps to fully stretch the glutes.</p>
          <div className="text-xs text-muted-foreground mb-2">Watch [00:00:00 - 00:00:02] for proper form</div>
          <Button
            onClick={() => {
              // Start session timer when cardio video is clicked
              if (!sessionStartTime) {
                onStartSession();
              }
              const link = document.createElement('a');
              link.href = "https://www.youtube.com/watch?v=4uegiLFV6l0&t=0s";
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Watch Stairmaster Demo [00:00-00:02]
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FitnessInput
            label="Time (minutes)"
            icon={<Clock className="h-4 w-4" />}
            type="number"
            placeholder="10"
            value={cardioData.time}
            onChange={handleTimeChange}
            variant={cardioData.time ? 'success' : 'default'}
          />
          <FitnessInput
            label="Calories Burned"
            icon={<Zap className="h-4 w-4" />}
            type="number"
            placeholder="0"
            value={cardioData.calories}
            onChange={handleCaloriesChange}
            variant={cardioData.calories ? 'success' : 'default'}
          />
        </div>
        
        {!cardioData.completed && (
          <Button 
            onClick={handleComplete}
            disabled={!cardioData.time || !cardioData.calories}
            className="w-full bg-gradient-primary hover:shadow-glow"
          >
            Complete Cardio
          </Button>
        )}
        
        {cardioData.completed && (
          <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-center justify-center gap-2 text-success font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Cardio Complete! {cardioData.time} mins, {cardioData.calories} calories
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const WarmupTracking = ({ warmupData, setWarmupData, onStartTimer, isTimerActive, manualSave }: { warmupData: any, setWarmupData: any, onStartTimer: () => void, isTimerActive: boolean, manualSave?: any }) => {
  const moodOptions = [
    // Left side - higher scores
    { value: 'perfect', label: 'Perfect 💯', score: '100', color: 'text-success' },
    { value: 'great', label: 'Great 😄', score: '90', color: 'text-success' },
    { value: 'good', label: 'Good 😊', score: '80', color: 'text-primary' },
    // Right side - lower scores  
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
    },
    {
      category: "Specific Warm-up Sets",
      exercises: [
        { name: "Warmup sets before working sets", videoUrl: "https://www.youtube.com/watch?v=4uegiLFV6l0&t=13s", timeSegment: "[00:00:13 - 00:00:15]" }
      ]
    }
  ];

  const handleComplete = () => {
    if (warmupData.mood && warmupData.exercisesCompleted) {
      setWarmupData({ 
        ...warmupData, 
        completed: true 
      });
    }
  };

  const handleExerciseComplete = () => {
    setWarmupData({ 
      ...warmupData, 
      exercisesCompleted: true 
    });
  };

  // Check if all videos have been watched
  const areAllVideosWatched = () => {
    const totalVideos = warmupExercises.reduce((acc, category) => acc + category.exercises.length, 0);
    const watchedVideos = warmupData.watchedVideos || [];
    return watchedVideos.length >= totalVideos;
  };

  // Auto-complete exercises when all videos are watched
  const checkAutoComplete = () => {
    if (areAllVideosWatched() && !warmupData.exercisesCompleted) {
      setWarmupData({ 
        ...warmupData, 
        exercisesCompleted: true 
      });
    }
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
      if (watchedVideos.length === 0 && !isTimerActive) {
        onStartTimer();
      }
      
      // Check for auto-completion after state update
      setTimeout(checkAutoComplete, 100);
    }
  };

  const openVideoSafely = (videoUrl: string) => {
    try {
      // Create a temporary link element to ensure proper opening
      const link = document.createElement('a');
      link.href = videoUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error opening video:', error);
      // Fallback to window.open
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const isVideoWatched = (categoryIndex: number, exerciseIndex: number) => {
    const videoKey = `${categoryIndex}-${exerciseIndex}`;
    return (warmupData.watchedVideos || []).includes(videoKey);
  };

  // Check if an exercise is unlocked (can be watched)
  const isExerciseUnlocked = (categoryIndex: number, exerciseIndex: number) => {
    // First exercise is always unlocked
    if (categoryIndex === 0 && exerciseIndex === 0) {
      return true;
    }

    // Get all exercises in a flat array to determine order
    let flatIndex = 0;
    for (let catIdx = 0; catIdx < warmupExercises.length; catIdx++) {
      for (let exIdx = 0; exIdx < warmupExercises[catIdx].exercises.length; exIdx++) {
        if (catIdx === categoryIndex && exIdx === exerciseIndex) {
          // This exercise is unlocked if the previous one is watched
          const prevFlatIndex = flatIndex - 1;
          if (prevFlatIndex < 0) return true; // First exercise
          
          // Find the previous exercise's category and index
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

  return (
    <Card className="bg-gradient-secondary/80 backdrop-blur-glass border-accent/30 shadow-lg shadow-glass">
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
            {/* Left column - higher scores */}
            <div className="space-y-2">
              {moodOptions.slice(0, 3).map((option) => (
                <Button
                  key={option.value}
                  variant={warmupData.mood === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setWarmupData({ ...warmupData, mood: option.value });
                    // Save mood selection immediately
                    if (manualSave) {
                      manualSave({
                        warmup_mood: option.value
                      });
                    }
                  }}
                  className={`w-full justify-between h-auto py-3 px-3 ${option.color} ${
                    warmupData.mood === option.value 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-white/5 hover:bg-white/10 border-white/20'
                  }`}
                >
                  <span className="text-xs leading-tight flex-1 text-left truncate pr-2">{option.label}</span>
                  <span className="font-bold text-sm">{option.score}</span>
                </Button>
              ))}
            </div>
            {/* Right column - lower scores */}
            <div className="space-y-2">
              {moodOptions.slice(3, 6).map((option) => (
                <Button
                  key={option.value}
                  variant={warmupData.mood === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setWarmupData({ ...warmupData, mood: option.value });
                    // Save mood selection immediately
                    if (manualSave) {
                      manualSave({
                        warmup_mood: option.value
                      });
                    }
                  }}
                  className={`w-full justify-between h-auto py-3 px-3 ${option.color} ${
                    warmupData.mood === option.value 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-white/5 hover:bg-white/10 border-white/20'
                  }`}
                >
                  <span className="text-xs leading-tight flex-1 text-left truncate pr-2">{option.label}</span>
                  <span className="font-bold text-sm">{option.score}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Show warm-up routine only after mood is selected */}
        {warmupData.mood && (
          <>
            {/* Warm-up Exercise Categories */}
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
                                handleVideoWatched(categoryIndex, exerciseIndex);
                                openVideoSafely(exercise.videoUrl);
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

            {/* Specific Warm-up Sets */}
            <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
              <h4 className="font-semibold text-foreground mb-2">Specific Warm-up Sets</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Perform lighter weight sets of your main exercises to progressively load your muscles
              </p>
              <p className="text-xs text-muted-foreground">Shows concept of doing lighter sets before main working sets</p>
            </div>

            {/* Exercise Completion Button */}
            {!warmupData.exercisesCompleted && !areAllVideosWatched() && (
              <Button 
                onClick={handleExerciseComplete}
                className="w-full bg-gradient-primary hover:shadow-glow"
              >
                Mark All Exercises Complete
              </Button>
            )}

            {/* Auto-show complete button when all videos watched OR manually marked complete */}
            {(warmupData.exercisesCompleted || areAllVideosWatched()) && !warmupData.completed && (
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const WorkoutWarmup = () => (
  <Card className="bg-gradient-secondary/80 backdrop-blur-glass border-accent/30 shadow-lg shadow-glass">
    <CardHeader>
      <CardTitle className="text-accent flex items-center gap-2">
        <Timer className="h-5 w-5" />
        Pre-Workout Warm-Up
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">Cardio (10 minutes)</h4>
          <p className="text-muted-foreground">Stair Master: 10 minutes at an easy pace. Focus on long steps to fully stretch the glutes.</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">Activation</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Glute Bridges: 2 sets of 15 reps</li>
            <li>• Banded Side Steps: 2 sets of 20 reps each way</li>
          </ul>
        </div>
      </div>
    </CardContent>
  </Card>
);

const PostWorkout = () => (
  <Card className="bg-gradient-secondary/80 backdrop-blur-glass border-accent/30 shadow-lg shadow-glass">
    <CardHeader>
      <CardTitle className="text-accent flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Post-Workout Protocol
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">Cardio (10 minutes)</h4>
          <p className="text-muted-foreground">Treadmill: 10 minutes incline walk. Set incline to 8 and pace between 2.5-3.0 mph.</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">Nutrition & Core</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Protein shake & post-workout meal</li>
            <li>• No core workout today</li>
          </ul>
        </div>
      </div>
    </CardContent>
  </Card>
);

interface FitnessAppProps {
  username: string;
  continueSession?: any;
  onBackToLanding: () => void;
}

export default function FitnessApp({ username, continueSession, onBackToLanding }: FitnessAppProps) {
  // Initialize state based on whether this is a new session or continuing
  const [workoutLog, setWorkoutLog] = useState(() => {
    // If continuing a session, load from that session's data
    if (continueSession && continueSession.workout_data && continueSession.workout_data.logs) {
      return continueSession.workout_data.logs;
    }
    
    // For new sessions, always start fresh (don't load from localStorage)
    if (!continueSession) {
      return initialWorkoutData;
    }

    // Fallback - try localStorage, but default to initial data
    try {
      const savedLog = localStorage.getItem('jackyWorkoutLog');
      return savedLog ? JSON.parse(savedLog) : initialWorkoutData;
    } catch (error) {
      console.error("Could not parse workout log from localStorage", error);
      return initialWorkoutData;
    }
  });
  
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentExerciseStartTime, setCurrentExerciseStartTime] = useState<number | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [exerciseTimerCompleted, setExerciseTimerCompleted] = useState(false);
  const [isExerciseTimerPaused, setIsExerciseTimerPaused] = useState(false);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Initialize cardio data based on continue session or fresh start
  const [cardioData, setCardioData] = useState(() => {
    if (continueSession) {
      return {
        time: continueSession.cardio_time || '',
        calories: continueSession.cardio_calories || '',
        completed: continueSession.cardio_completed || false
      };
    }
    return { time: '', calories: '', completed: false };
  });
  
  // Initialize warmup data based on continue session or fresh start
  const [warmupData, setWarmupData] = useState(() => {
    if (continueSession) {
      return {
        mood: continueSession.warmup_mood || '',
        exercisesCompleted: continueSession.warmup_exercises_completed || false,
        completed: continueSession.warmup_completed || false,
        watchedVideos: continueSession.warmup_watched_videos || []
      };
    }
    return {
      mood: '',
      exercisesCompleted: false,
      completed: false,
      watchedVideos: [] as string[]
    };
  });
  
  // Initialize current phase based on continue session or fresh start
  const [currentPhase, setCurrentPhase] = useState(() => {
    return continueSession ? continueSession.current_phase : 'cardio';
  });
  
  const { toast } = useToast();
  
  // Integrate workout storage - SINGLE hook call
  const { currentSession, updateSession, initializeSession, saving, manualSave } = useWorkoutStorage(username);

  // Initialize session on mount and clear localStorage for new sessions
  useEffect(() => {
    // If starting a new session (no continueSession), clear old localStorage data
    if (!continueSession) {
      localStorage.removeItem('jackyWorkoutLog');
      localStorage.removeItem('jackyCardioData');
      localStorage.removeItem('jackyWarmupData');
    }
    
    initializeSession(continueSession);
  }, [username, continueSession, initializeSession]);

  // Debug: Log when continue session is being used
  useEffect(() => {
    if (continueSession) {
      console.log('Continue session detected:', {
        phase: continueSession.current_phase,
        cardio: continueSession.cardio_completed,
        warmup: continueSession.warmup_completed,
        mood: continueSession.warmup_mood,
        watchedVideos: continueSession.warmup_watched_videos?.length || 0
      });
    }
  }, [continueSession]);

  useEffect(() => {
    localStorage.setItem('jackyWorkoutLog', JSON.stringify(workoutLog));
    localStorage.setItem('jackyCardioData', JSON.stringify(cardioData));
    localStorage.setItem('jackyWarmupData', JSON.stringify(warmupData));
  }, [workoutLog, cardioData, warmupData]);

  // Update session state (without auto-saving)
  useEffect(() => {
    if (currentSession && updateSession) {
      updateSession({
        current_phase: currentPhase,
        cardio_completed: cardioData.completed,
        cardio_time: cardioData.time,
        cardio_calories: cardioData.calories,
        warmup_completed: warmupData.completed,
        warmup_exercises_completed: warmupData.exercisesCompleted,
        warmup_mood: warmupData.mood,
        warmup_watched_videos: warmupData.watchedVideos,
        workout_data: { logs: workoutLog, timers: {} }
      });
    }
  }, [currentPhase, cardioData.completed, cardioData.time, cardioData.calories, 
      warmupData.completed, warmupData.exercisesCompleted, warmupData.mood, 
      warmupData.watchedVideos, workoutLog, currentSession, updateSession]);

  const handleLogChange = (exerciseIndex: number, setIndex: number, field: string, value: string, exerciseType = 'main') => {
    const updatedLog = JSON.parse(JSON.stringify(workoutLog));
    if (exerciseType === 'substitute') {
      updatedLog[exerciseIndex].substitute.sets[setIndex][field] = value;
    } else {
      updatedLog[exerciseIndex].sets[setIndex][field] = value;
    }
    setWorkoutLog(updatedLog);
    
    // Save when user finishes inputting (debounced save after input)
    if (manualSave) {
      setTimeout(() => {
        manualSave({
          workout_data: { logs: updatedLog, timers: {} }
        });
      }, 500);
    }
  };

  // Calculate overall progress
  const totalSets = workoutLog.reduce((acc: number, exercise: any) => acc + exercise.sets.length, 0);
  const completedSets = workoutLog.reduce((acc: number, exercise: any) => {
    return acc + exercise.sets.filter((set: any) => set.weight && set.reps).length;
  }, 0);
  const overallProgress = (completedSets / totalSets) * 100;
  
  // Handle set completion and timer pausing
  const handleSetComplete = (exIndex: number, setIndex: number, field: string, value: string, activeTab: string = 'main') => {
    handleLogChange(exIndex, setIndex, field, value, activeTab);
    
    // Check if both weight and reps are filled for this set
    const exercise = workoutLog[exIndex];
    const targetSets = activeTab === 'main' ? exercise.sets : exercise.substitute?.sets;
    const currentSet = targetSets[setIndex];
    
    if (currentSet.weight && currentSet.reps) {
      // Set is complete, pause the exercise timer
      setIsExerciseTimerPaused(true);
      setCurrentSetIndex(setIndex);
      
      toast({
        title: "Set Complete!",
        description: "Timer paused. Select your rest time to continue.",
        duration: 3000,
      });
    }
  };

  const handleExerciseSetComplete = () => {
    setShowRestTimer(true);
  };

  // Timer management
  const handleMotivationalMessage = (message: string) => {
    toast({
      title: "Training Update",
      description: message,
      duration: 5000,
    });
  };

  const handleCardioComplete = () => {
    setSessionStartTime(Date.now());
    // Will trigger warmup phase
  };

  const handleSessionStart = () => {
    setSessionStartTime(Date.now());
  };

  const handleExerciseStart = () => {
    setCurrentExerciseStartTime(Date.now());
    setIsExerciseTimerPaused(false);
  };

  const handleExerciseComplete = () => {
    setExerciseTimerCompleted(true);
    setCurrentExerciseStartTime(null);
  };

  const handleRestComplete = () => {
    setShowRestTimer(false);
    setIsExerciseTimerPaused(false); // Resume exercise timer
    setExerciseTimerCompleted(false);
    
    // Check if we should advance to next exercise
    const currentExercise = workoutLog[activeExerciseIndex];
    const completedSets = currentExercise.sets.filter((set: any) => set.weight && set.reps).length;
    const totalSets = currentExercise.sets.length;
    
    if (completedSets === totalSets && activeExerciseIndex < workoutLog.length - 1) {
      setActiveExerciseIndex(activeExerciseIndex + 1);
      setCurrentSetIndex(0);
    }
  };

  // Check if current exercise is complete and advance to next
  useEffect(() => {
    // Auto-progress through phases
    if (currentPhase === 'cardio' && cardioData.completed) {
      handleCardioComplete();
      setTimeout(() => setCurrentPhase('warmup'), 1000);
    } else if (currentPhase === 'warmup' && warmupData.completed) {
      setTimeout(() => setCurrentPhase('main'), 1000);
    } else if (currentPhase === 'main' && activeExerciseIndex < workoutLog.length) {
      const currentExercise = workoutLog[activeExerciseIndex];
      const currentCompletedSets = currentExercise.sets.filter((set: any) => set.weight && set.reps).length;
      const currentTotalSets = currentExercise.sets.length;
      
      if (currentCompletedSets === currentTotalSets && activeExerciseIndex < workoutLog.length - 1) {
        // Auto-advance to next exercise after a short delay
        setTimeout(() => {
          setActiveExerciseIndex(activeExerciseIndex + 1);
        }, 1000);
      }
    }
  }, [currentPhase, cardioData.completed, warmupData.completed, workoutLog, activeExerciseIndex]);
  
  // Check for workout completion
  useEffect(() => {
    if (overallProgress === 100 && !showCelebration && currentPhase === 'main') {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    }
  }, [overallProgress, showCelebration, currentPhase]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(24_95%_53%/0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(24_95%_53%/0.05),transparent_50%)]" />
      
      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          onClick={onBackToLanding}
          variant="outline"
          size="sm"
          className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Landing
        </Button>
      </div>
      
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
      
      {/* Saving indicator */}
      {saving && (
        <div className="fixed top-4 right-4 z-50 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span>Saving progress...</span>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-primary/20 backdrop-blur-glass rounded-full text-primary-foreground font-medium text-sm mb-6 border border-primary/30">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <Target className="h-4 w-4" />
            Week 1, Day 1 - Foundation
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-hero bg-clip-text text-transparent mb-4 tracking-tight">
            Fitness Pro
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            The Ultimate Glute Workout Journal
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

        {/* Content */}
        <div className="space-y-8">
          <WorkoutIntro />
          
          {/* Cardio Phase */}
          {(currentPhase === 'cardio' || cardioData.completed) && (
              <CardioTracking 
                cardioData={cardioData} 
                setCardioData={setCardioData} 
                onStartSession={handleSessionStart}
                sessionStartTime={sessionStartTime}
                manualSave={manualSave}
              />
          )}
          
          {/* Warmup Phase */}
          {(currentPhase === 'warmup' || warmupData.completed) && cardioData.completed && (
            <>
              {/* Only show timer after mood is selected */}
              {warmupData.mood && (
                <ExerciseTimer
                  duration={25} // 25 minutes for comprehensive warm-up
                  onComplete={handleExerciseComplete}
                  onStart={handleExerciseStart}
                  onSetComplete={handleExerciseSetComplete}
                  isActive={currentPhase === 'warmup' && !warmupData.completed && !!warmupData.mood}
                  isPaused={false}
                  exerciseType="warmup"
                />
              )}
              <WarmupTracking 
                warmupData={warmupData} 
                setWarmupData={setWarmupData} 
                onStartTimer={handleExerciseStart}
                isTimerActive={currentExerciseStartTime !== null}
                manualSave={manualSave}
              />
            </>
          )}
          
          {/* Main Workout Phase */}
          {currentPhase === 'main' && warmupData.completed && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground mb-2">Main Workout</h2>
                <p className="text-muted-foreground">Focus on form and progressive overload</p>
              </div>
              {currentPhase === 'main' && (
              <ExerciseTimer
                duration={20} // 20 minutes for main exercises (countdown)
                onComplete={handleExerciseComplete}
                onStart={handleExerciseStart}
                onSetComplete={handleExerciseSetComplete}
                isActive={currentExerciseStartTime !== null}
                isPaused={isExerciseTimerPaused}
                exerciseType="main"
              />
              )}
              
              {workoutLog.map((exercise: any, index: number) => {
                const exerciseCompletedSets = exercise.sets.filter((set: any) => set.weight && set.reps).length;
                const exerciseTotalSets = exercise.sets.length;
                const isCompleted = exerciseCompletedSets === exerciseTotalSets;
                const isActive = index === activeExerciseIndex;
                const isLocked = index > activeExerciseIndex;

                return (
                  <ExerciseCard 
                    key={index} 
                    exercise={exercise} 
                    exIndex={index} 
                    onLogChange={handleSetComplete}
                    isActive={isActive}
                    isLocked={isLocked}
                    isCompleted={isCompleted}
                    onStartTimer={handleExerciseStart}
                    isTimerActive={currentExerciseStartTime !== null}
                  />
                );
              })}
            </div>
          )}
          
          {/* Post Workout */}
          {currentPhase === 'main' && overallProgress === 100 && (
            <PostWorkout />
          )}
        </div>

        {/* Enhanced Footer */}
        <footer className="text-center mt-16 py-8 border-t border-border/50">
          <div className="space-y-2">
            <p className="text-foreground font-medium">Keep pushing your limits! 💪</p>
            <p className="text-xs text-muted-foreground">
              Always consult with a healthcare professional before making any fitness changes.
            </p>
          </div>
        </footer>
        
        <RestTimerSelector
          isVisible={showRestTimer}
          onComplete={handleRestComplete}
          onClose={() => setShowRestTimer(false)}
        />
      </div>
    </div>
  );
}