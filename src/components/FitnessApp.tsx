import React, { useState, useEffect } from 'react';
import { FitnessInput } from '@/components/ui/fitness-input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Weight, Repeat, Play, Target, Timer, TrendingUp, Clock, Trophy, Zap, CheckCircle2 } from 'lucide-react';
import { CircularProgress } from './CircularProgress';
import { RestTimer } from './RestTimer';
import { useToast } from '@/hooks/use-toast';

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
    videoUrl: 'http://www.youtube.com/watch?v=5rIqP63yWFg',
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

const ExerciseCard = ({ exercise, exIndex, onLogChange }: { exercise: any, exIndex: number, onLogChange: any }) => {
  const [activeTab, setActiveTab] = useState('main');
  const [showRestTimer, setShowRestTimer] = useState(false);
  const hasSubstitute = !!exercise.substitute;
  const activeExercise = activeTab === 'main' ? exercise : exercise.substitute;
  
  // Calculate completion percentage
  const completedSets = activeExercise.sets.filter((set: any) => set.weight && set.reps).length;
  const totalSets = activeExercise.sets.length;
  const completionPercentage = (completedSets / totalSets) * 100;
  const isFullyComplete = completionPercentage === 100;

  return (
    <>
      <Card className="bg-gradient-card/80 backdrop-blur-glass border-white/10 shadow-lg hover:shadow-glow transition-all duration-500 overflow-hidden group hover:scale-[1.01]">
        <CardHeader className="pb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl font-bold text-foreground">
                  {activeExercise.name}
                </CardTitle>
                {isFullyComplete && (
                  <div className="animate-bounce">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
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
                asChild
                className="bg-gradient-primary hover:shadow-glow transition-all duration-300 group"
              >
                <a href={activeExercise.videoUrl} target="_blank" rel="noopener noreferrer">
                  <Play className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  Watch
                </a>
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => setShowRestTimer(true)}
                className="bg-white/5 hover:bg-white/10 border-white/20"
              >
                <Clock className="h-4 w-4 mr-2" />
                Rest
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
          {hasSubstitute && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-muted/30 backdrop-blur-sm">
                <TabsTrigger value="main" className="data-[state=active]:bg-primary/20">Main Exercise</TabsTrigger>
                <TabsTrigger value="substitute" className="data-[state=active]:bg-primary/20">Substitute</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <div className="space-y-4">
            {activeExercise.sets.map((set: any, setIndex: number) => (
              <SetLog 
                key={`${activeTab}-${set.id}`} 
                set={set} 
                onLogChange={(field, value) => onLogChange(exIndex, setIndex, field, value, activeTab)} 
              />
            ))}
          </div>

          {isFullyComplete && (
            <div className="text-center p-4 bg-gradient-primary/10 rounded-lg border border-primary/20 animate-slide-in">
              <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                <Trophy className="h-5 w-5" />
                Exercise Complete! Great job! 🎉
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {showRestTimer && (
        <RestTimer onClose={() => setShowRestTimer(false)} />
      )}
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

export default function FitnessApp() {
  const [workoutLog, setWorkoutLog] = useState(() => {
    try {
      const savedLog = localStorage.getItem('jackyWorkoutLog');
      return savedLog ? JSON.parse(savedLog) : initialWorkoutData;
    } catch (error) {
      console.error("Could not parse workout log from localStorage", error);
      return initialWorkoutData;
    }
  });

  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    localStorage.setItem('jackyWorkoutLog', JSON.stringify(workoutLog));
  }, [workoutLog]);

  const handleLogChange = (exerciseIndex: number, setIndex: number, field: string, value: string, exerciseType = 'main') => {
    const updatedLog = JSON.parse(JSON.stringify(workoutLog));
    if (exerciseType === 'substitute') {
      updatedLog[exerciseIndex].substitute.sets[setIndex][field] = value;
    } else {
      updatedLog[exerciseIndex].sets[setIndex][field] = value;
    }
    setWorkoutLog(updatedLog);
  };

  // Calculate overall progress
  const totalSets = workoutLog.reduce((acc: number, exercise: any) => acc + exercise.sets.length, 0);
  const completedSets = workoutLog.reduce((acc: number, exercise: any) => {
    return acc + exercise.sets.filter((set: any) => set.weight && set.reps).length;
  }, 0);
  const overallProgress = (completedSets / totalSets) * 100;
  
  // Check for workout completion
  useEffect(() => {
    if (overallProgress === 100 && !showCelebration) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    }
  }, [overallProgress, showCelebration]);

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
          <WorkoutWarmup />
          
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2">Main Workout</h2>
              <p className="text-muted-foreground">Focus on form and progressive overload</p>
            </div>
            {workoutLog.map((exercise: any, exIndex: number) => (
              <ExerciseCard 
                key={exercise.name} 
                exercise={exercise} 
                exIndex={exIndex} 
                onLogChange={handleLogChange} 
              />
            ))}
          </div>
          
          <PostWorkout />
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
      </div>
    </div>
  );
}