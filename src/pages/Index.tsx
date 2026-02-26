import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { username } = useAuthenticatedUser();

  const handleStartWorkout = (existingSession?: WorkoutSession) => {
    if (!username) return;

    try {
      localStorage.removeItem('username');
      if (!existingSession) {
        localStorage.setItem('forceNewSession', '1');
      }
    } catch (e) {
      console.warn('Unable to persist flags:', e);
    }

    if (existingSession) {
      switch (existingSession.current_phase) {
        case 'cardio':
          navigate('/cardio');
          break;
        case 'warmup':
          navigate('/warmup');
          break;
        case 'main':
          navigate('/exercise/0');
          break;
        case 'completed':
          navigate('/post-workout');
          break;
        default:
          navigate('/cardio');
          break;
      }
    } else {
      navigate('/cardio');
    }
  };

  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Kara's workout...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Landing username={username} onStartWorkout={handleStartWorkout} />
      <Toaster />
    </>
  );
};

export default Index;
