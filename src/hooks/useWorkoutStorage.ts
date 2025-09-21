import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkoutData {
  [key: string]: any;
  logs: Record<string, any>;
  timers: Record<string, any>;
}

interface WorkoutSession {
  id?: string;
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
  workout_data: WorkoutData;
}

export const useWorkoutStorage = (username: string) => {
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Initialize or load session
  const initializeSession = useCallback(async (existingSession?: WorkoutSession) => {
    if (existingSession) {
      const session: WorkoutSession = {
        id: existingSession.id,
        username: existingSession.username,
        session_date: existingSession.session_date,
        current_phase: existingSession.current_phase,
        cardio_completed: existingSession.cardio_completed,
        cardio_time: existingSession.cardio_time,
        cardio_calories: existingSession.cardio_calories,
        warmup_completed: existingSession.warmup_completed,
        warmup_exercises_completed: existingSession.warmup_exercises_completed,
        warmup_mood: existingSession.warmup_mood,
        warmup_watched_videos: existingSession.warmup_watched_videos || [],
        workout_data: (existingSession.workout_data as WorkoutData) || { logs: {}, timers: {} }
      };
      setCurrentSession(session);
      return;
    }

    // Check if there's already a session for today
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('username', username)
        .eq('session_date', today)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      // If there's an existing session for today, use it
      if (data && data.length > 0) {
        const existingSession = data[0];
        // Cast the database response to our WorkoutSession type
        const session: WorkoutSession = {
          id: existingSession.id,
          username: existingSession.username,
          session_date: existingSession.session_date,
          current_phase: existingSession.current_phase,
          cardio_completed: existingSession.cardio_completed,
          cardio_time: existingSession.cardio_time,
          cardio_calories: existingSession.cardio_calories,
          warmup_completed: existingSession.warmup_completed,
          warmup_exercises_completed: existingSession.warmup_exercises_completed,
          warmup_mood: existingSession.warmup_mood,
          warmup_watched_videos: existingSession.warmup_watched_videos || [],
          workout_data: (existingSession.workout_data as WorkoutData) || { logs: {}, timers: {} }
        };
        setCurrentSession(session);
        return;
      }
    } catch (error) {
      console.error('Error checking for existing session:', error);
    }

    // Create new session only if no existing session for today
    const newSession: WorkoutSession = {
      username,
      session_date: today,
      current_phase: 'cardio',
      cardio_completed: false,
      warmup_completed: false,
      warmup_exercises_completed: false,
      warmup_watched_videos: [],
      workout_data: { logs: {}, timers: {} }
    };

    setCurrentSession(newSession);
    await saveSession(newSession);
  }, [username]);

  // Save session to database
  const saveSession = async (session: WorkoutSession) => {
    if (!session) return;

    setSaving(true);
    try {
      const sessionData = {
        username: session.username,
        session_date: session.session_date,
        current_phase: session.current_phase,
        cardio_completed: session.cardio_completed,
        cardio_time: session.cardio_time,
        cardio_calories: session.cardio_calories,
        warmup_completed: session.warmup_completed,
        warmup_exercises_completed: session.warmup_exercises_completed,
        warmup_mood: session.warmup_mood,
        warmup_watched_videos: session.warmup_watched_videos,
        workout_data: session.workout_data
      };

      if (session.id) {
        // Update existing session
        const { error } = await supabase
          .from('workout_sessions')
          .update(sessionData)
          .eq('id', session.id);

        if (error) throw error;
      } else {
        // Insert new session
        const { data, error } = await supabase
          .from('workout_sessions')
          .insert(sessionData)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setCurrentSession(prev => prev ? { ...prev, id: data.id } : null);
        }
      }

      // Auto-save notification (subtle)
      console.log('Workout progress saved');
    } catch (error) {
      console.error('Error saving session:', error);
      toast({
        title: "Save Error",
        description: "Failed to save workout progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Update session data with useCallback to prevent infinite loops
  const updateSession = useCallback(async (updates: Partial<WorkoutSession>) => {
    if (!currentSession) return;

    const updatedSession = { ...currentSession, ...updates };
    setCurrentSession(updatedSession);
    await saveSession(updatedSession);
  }, [currentSession]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!currentSession) return;

    const interval = setInterval(() => {
      saveSession(currentSession);
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [currentSession]);

  return {
    currentSession,
    saving,
    initializeSession,
    updateSession,
    saveSession: () => currentSession && saveSession(currentSession)
  };
};