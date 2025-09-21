import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const handleStartWorkout = (username: string, existingSession?: WorkoutSession) => {
    // Persist chosen username for the rest of the app
    try {
      localStorage.setItem('username', username);
      if (!existingSession) {
        // Force a brand new session when starting fresh from Landing
        localStorage.setItem('forceNewSession', '1');
      }
    } catch (e) {
      console.warn('Unable to persist username/flags:', e);
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

  return (
    <>
      <Landing onStartWorkout={handleStartWorkout} />
      <Toaster />
    </>
  );
};

export default Index;
