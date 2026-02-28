import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseRetry } from '@/lib/supabaseRetry';

interface AnalyticsEvent {
  sessionId?: string;
  username: string;
  eventType: 'set_completed' | 'rest_started' | 'rest_completed' | 'exercise_started' | 'exercise_completed' | 'phase_started' | 'phase_completed' | 'cardio_completed' | 'warmup_completed';
  eventData?: Record<string, any>;
  durationSeconds?: number;
  exerciseName?: string;
  setNumber?: number;
  weight?: number;
  reps?: number;
}

export const useAnalytics = () => {
  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    try {
      const { error } = await supabaseRetry(
        () => supabase
          .from('session_analytics')
          .insert({
            session_id: event.sessionId,
            username: event.username,
            event_type: event.eventType,
            event_data: event.eventData || {},
            duration_seconds: event.durationSeconds,
            exercise_name: event.exerciseName,
            set_number: event.setNumber,
            weight: event.weight,
            reps: event.reps
          }),
        { maxRetries: 1 },
      );

      if (error) {
        console.error('Analytics tracking error:', error);
      }
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }, []);

  const trackSetCompleted = useCallback(async (
    sessionId: string,
    username: string,
    exerciseName: string,
    setNumber: number,
    weight: number,
    reps: number,
    restDuration?: number,
    setType?: string
  ) => {
    await trackEvent({
      sessionId,
      username,
      eventType: 'set_completed',
      exerciseName,
      setNumber,
      weight,
      reps,
      eventData: { restDuration, setType }
    });
  }, [trackEvent]);

  const trackRestTimer = useCallback(async (
    sessionId: string,
    username: string,
    exerciseName: string,
    setNumber: number,
    eventType: 'rest_started' | 'rest_completed',
    durationSeconds?: number
  ) => {
    await trackEvent({
      sessionId,
      username,
      eventType,
      exerciseName,
      setNumber,
      durationSeconds,
      eventData: { restDuration: durationSeconds }
    });
  }, [trackEvent]);

  const trackPhaseCompletion = useCallback(async (
    sessionId: string,
    username: string,
    phase: string,
    durationSeconds: number,
    additionalData?: Record<string, any>
  ) => {
    await trackEvent({
      sessionId,
      username,
      eventType: 'phase_completed',
      durationSeconds,
      eventData: { phase, ...additionalData }
    });
  }, [trackEvent]);

  const trackExerciseCompletion = useCallback(async (
    sessionId: string,
    username: string,
    exerciseName: string,
    totalSets: number,
    averageWeight: number,
    totalReps: number,
    durationSeconds: number
  ) => {
    await trackEvent({
      sessionId,
      username,
      eventType: 'exercise_completed',
      exerciseName,
      durationSeconds,
      eventData: {
        totalSets,
        averageWeight,
        totalReps
      }
    });
  }, [trackEvent]);

  const trackPR = useCallback(async (
    sessionId: string,
    username: string,
    exerciseName: string,
    prType: string,
    value: number,
    previousValue: number
  ) => {
    await trackEvent({
      sessionId,
      username,
      eventType: 'set_completed',
      exerciseName,
      eventData: {
        pr_detected: true,
        pr_type: prType,
        pr_value: value,
        pr_previous_value: previousValue
      }
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackSetCompleted,
    trackRestTimer,
    trackPhaseCompletion,
    trackExerciseCompletion,
    trackPR
  };
};