import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FitnessInput } from '@/components/ui/fitness-input';
import { Timer, Play, CheckCircle2, Target } from 'lucide-react';
import { SessionTimer } from '@/components/SessionTimer';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import { useToast } from '@/hooks/use-toast';

interface CardioPageProps {
  username: string;
}

export default function CardioPage({ username }: CardioPageProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentSession, updateSession, initializeSession, manualSave } = useWorkoutStorage(username);
  
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [cardioData, setCardioData] = useState({
    time: '',
    calories: '',
    completed: false
  });

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  useEffect(() => {
    if (currentSession) {
      // Only update state if values are different to prevent loops
      const sessionCardioData = {
        time: currentSession.cardio_time || '',
        calories: currentSession.cardio_calories || '',
        completed: currentSession.cardio_completed || false
      };
      
      // Check if current state is different from session state
      if (sessionCardioData.time !== cardioData.time || 
          sessionCardioData.calories !== cardioData.calories || 
          sessionCardioData.completed !== cardioData.completed) {
        setCardioData(sessionCardioData);
      }
      
      // If cardio is already completed, redirect to warmup
      if (currentSession.cardio_completed && !cardioData.completed) {
        navigate('/warmup');
      }
    }
  }, [currentSession]); // Removed navigate and cardioData from dependencies to prevent loops

  const handleMotivationalMessage = (message: string) => {
    toast({
      title: "Training Update",
      description: message,
      duration: 5000,
    });
  };

  const handleStartSession = () => {
    setSessionStartTime(Date.now());
  };

  const handleComplete = async () => {
    if (cardioData.time && cardioData.calories) {
      const updatedData = { ...cardioData, completed: true };
      setCardioData(updatedData);
      
      const updates = {
        current_phase: 'warmup' as const,
        cardio_completed: true,
        cardio_time: cardioData.time,
        cardio_calories: cardioData.calories
      };

      // Update local session state immediately
      updateSession(updates);

      // Persist to Supabase before navigating to avoid redirect bounce
      try {
        await manualSave(updates);
      } catch (e) {
        console.error('Failed to save cardio completion, navigating anyway', e);
      }

      navigate('/warmup', { replace: true });
    }
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
      
      <div className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-primary/20 backdrop-blur-glass rounded-full text-primary-foreground font-medium text-sm mb-6 border border-primary/30">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <Target className="h-4 w-4" />
            Phase 1: Pre-Workout Cardio
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-hero bg-clip-text text-transparent mb-4 tracking-tight">
            Cardio Warm-Up
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            10 minutes of cardio to prepare your body for the workout
          </p>
        </div>

        {/* Cardio Tracking Card */}
        <Card className="bg-black border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-accent flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Stair Master Cardio
              {cardioData.completed && <CheckCircle2 className="h-5 w-5 text-success" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-xs text-muted-foreground mb-2">Watch [00:00:00 - 00:00:02] for proper form</div>
            
            <Button 
              onClick={() => {
                if (!sessionStartTime) {
                  handleStartSession();
                }
                openVideoSafely("https://www.youtube.com/watch?v=4uegiLFV6l0&t=0s");
              }}
              className="w-full bg-gradient-primary hover:shadow-glow mb-4"
            >
              <Play className="h-4 w-4 mr-2" />
              Watch Stairmaster Demo [00:00-00:02]
            </Button>
            
            <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
              <h4 className="font-semibold text-foreground mb-2">Instructions</h4>
              <p className="text-sm text-muted-foreground mb-2">
                10 minutes at an easy pace. Focus on long steps to fully stretch the glutes.
              </p>
              <p className="text-xs text-muted-foreground">Make sure to maintain good posture and take full range steps</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FitnessInput
                label="Time (minutes)"
                icon={<Timer className="h-4 w-4" />}
                type="number"
                placeholder="10"
                value={cardioData.time}
                onChange={(e) => {
                  const newData = { ...cardioData, time: e.target.value };
                  setCardioData(newData);
                  // Debounced update to session
                  setTimeout(() => {
                    updateSession({
                      cardio_time: e.target.value
                    });
                  }, 500);
                }}
                variant={cardioData.time ? 'success' : 'default'}
                disabled={cardioData.completed}
              />
              <FitnessInput
                label="Calories Burned"
                icon={<Target className="h-4 w-4" />}
                type="number"
                placeholder="0"
                value={cardioData.calories}
                onChange={(e) => {
                  const newData = { ...cardioData, calories: e.target.value };
                  setCardioData(newData);
                  // Debounced update to session
                  setTimeout(() => {
                    updateSession({
                      cardio_calories: e.target.value
                    });
                  }, 500);
                }}
                variant={cardioData.calories ? 'success' : 'default'}
                disabled={cardioData.completed}
              />
            </div>
            
            {cardioData.time && cardioData.calories && !cardioData.completed && (
              <Button 
                onClick={handleComplete}
                className="w-full bg-gradient-primary hover:shadow-glow"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete Cardio & Continue to Warm-up
              </Button>
            )}
            
            {cardioData.completed && (
              <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
                <div className="flex items-center justify-center gap-2 text-success font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Cardio Complete! {cardioData.time} mins, {cardioData.calories} calories
                </div>
                <p className="text-sm text-muted-foreground mt-2">Redirecting to warm-up phase...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}