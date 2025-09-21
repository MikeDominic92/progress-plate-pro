import React, { useState, useEffect } from 'react';
import { FitnessInput } from '@/components/ui/fitness-input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Weight, Repeat, Play, Target, Timer, TrendingUp } from 'lucide-react';

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
    <Card className={`transition-all duration-300 ${isWarmUp ? 'bg-primary/5 border-primary/20' : 'bg-card/50'} ${isComplete ? 'ring-1 ring-success/30' : ''}`}>
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
  const hasSubstitute = !!exercise.substitute;
  const activeExercise = activeTab === 'main' ? exercise : exercise.substitute;
  
  // Calculate completion percentage
  const completedSets = activeExercise.sets.filter((set: any) => set.weight && set.reps).length;
  const totalSets = activeExercise.sets.length;
  const completionPercentage = (completedSets / totalSets) * 100;

  return (
    <Card className="bg-gradient-card border-border/50 shadow-lg hover:shadow-glow transition-all duration-300 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl font-bold text-foreground">
              {activeExercise.name}
            </CardTitle>
            <Badge variant={getTierBadgeVariant(activeExercise.tier) as any} className="w-fit">
              {activeExercise.tier}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>{completedSets}/{totalSets} sets completed</span>
            </div>
          </div>
          <Button 
            asChild
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            <a href={activeExercise.videoUrl} target="_blank" rel="noopener noreferrer">
              <Play className="h-4 w-4 mr-2" />
              Watch
            </a>
          </Button>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-primary transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasSubstitute && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger value="main">Main Exercise</TabsTrigger>
              <TabsTrigger value="substitute">Substitute</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="space-y-3">
          {activeExercise.sets.map((set: any, setIndex: number) => (
            <SetLog 
              key={`${activeTab}-${set.id}`} 
              set={set} 
              onLogChange={(field, value) => onLogChange(exIndex, setIndex, field, value, activeTab)} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const WorkoutIntro = () => (
  <Card className="bg-gradient-card border-primary/20 shadow-lg">
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
  <Card className="bg-gradient-secondary border-accent/20 shadow-lg">
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
  <Card className="bg-gradient-secondary border-accent/20 shadow-lg">
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary rounded-full text-primary-foreground font-medium text-sm mb-4">
            <Target className="h-4 w-4" />
            Week 1, Day 1
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
            The Perfect Glute Workout
          </h1>
          <p className="text-muted-foreground text-lg">
            Focus: Foundation & Strength
          </p>
          
          {/* Overall progress */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="text-primary font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="h-full bg-gradient-primary rounded-full transition-all duration-700 ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <WorkoutIntro />
          <WorkoutWarmup />
          
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Main Workout</h2>
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

        {/* Footer */}
        <footer className="text-center mt-12 py-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Disclaimer: Always consult with a healthcare professional before making any fitness changes.
          </p>
        </footer>
      </div>
    </div>
  );
}