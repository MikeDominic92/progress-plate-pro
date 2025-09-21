import { useState } from 'react';
import FitnessApp from "@/components/FitnessApp";
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
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [continueSession, setContinueSession] = useState<WorkoutSession | null>(null);

  const handleStartWorkout = (username: string, existingSession?: WorkoutSession) => {
    setCurrentUsername(username);
    setContinueSession(existingSession || null);
  };

  const handleBackToLanding = () => {
    setCurrentUsername(null);
    setContinueSession(null);
  };

  if (!currentUsername) {
    return (
      <>
        <Landing onStartWorkout={handleStartWorkout} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <FitnessApp 
        username={currentUsername}
        continueSession={continueSession}
        onBackToLanding={handleBackToLanding}
      />
      <Toaster />
    </>
  );
};

export default Index;
