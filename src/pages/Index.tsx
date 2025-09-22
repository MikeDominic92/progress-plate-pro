import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { Button } from '@/components/ui/button';
import Landing from "./Landing";
import { Toaster } from "@/components/ui/toaster";

interface WorkoutSession {
  id: string;
  username: string;
  session_date: string;
  current_phase: string;
  cardio_completed: boolean;
  cardio_time?: string;
  cardio_calories?: string;
  warmup_completed: boolean;
  warmup_exercises_completed: boolean;
  warmup_mood?: string;
  warmup_watched_videos: string[];
  workout_data: any;
  updated_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { username } = useAuthenticatedUser();

  const handleStartWorkout = (existingSession?: WorkoutSession) => {
    if (!username) return;
    
    // Clear any old localStorage data
    try {
      localStorage.removeItem('username');
      if (!existingSession) {
        // Force a brand new session when starting fresh from Landing
        localStorage.setItem('forceNewSession', '1');
      }
    } catch (e) {
      console.warn('Unable to persist flags:', e);
    }

    // If there's an existing session, navigate to the appropriate phase
    if (existingSession) {
      switch (existingSession.current_phase) {
        case 'cardio':
          navigate('/cardio');
          break;
        case 'warmup':
          navigate('/warmup');
          break;
        case 'main':
          navigate('/workout');
          break;
        case 'completed':
          navigate('/post-workout');
          break;
        default:
          navigate('/cardio');
          break;
      }
    } else {
      // New session starts with cardio
      navigate('/cardio');
    }
  };

  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="absolute top-4 right-4 z-50">
        <Button 
          onClick={signOut}
          variant="outline"
          size="sm"
          className="bg-black/50 border-white/20 text-white hover:bg-white/10"
        >
          Sign Out
        </Button>
      </div>
      <Landing username={username} onStartWorkout={handleStartWorkout} />
      <Toaster />
    </>
  );
};

export default Index;
