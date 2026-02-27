import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LiveSession {
  id: string;
  username: string;
  session_date: string;
  current_phase: string;
  warmup_completed: boolean;
  cardio_completed: boolean;
  cardio_time: string | null;
  cardio_calories: string | null;
  workout_data: any;
  created_at: string;
  updated_at: string;
}

interface LiveEvent {
  id: string;
  event_type: string;
  event_data: any;
  timestamp: string;
  exercise_name: string | null;
  set_number: number | null;
  weight: number | null;
  reps: number | null;
  duration_seconds: number | null;
}

interface UseAdminLiveSessionReturn {
  activeSession: LiveSession | null;
  liveEvents: LiveEvent[];
  currentExercise: string | null;
  currentPhase: string | null;
  sessionDuration: number;
  exerciseCount: number;
  setsCompleted: number;
  loading: boolean;
  lastPolled: Date | null;
  refresh: () => Promise<void>;
}

const POLL_INTERVAL = 12_000;

export function useAdminLiveSession(username = 'Kara'): UseAdminLiveSessionReturn {
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastPolled, setLastPolled] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLiveData = useCallback(async () => {
    try {
      // Fetch active (non-completed) session for this user
      const { data: sessions, error: sessErr } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('username', username)
        .neq('current_phase', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessErr) {
        console.error('Live session fetch error:', sessErr);
        return;
      }

      const session = sessions?.[0] ?? null;
      setActiveSession(session);

      // If there's an active session, fetch its recent analytics events
      if (session) {
        const { data: events, error: evErr } = await supabase
          .from('session_analytics')
          .select('id, event_type, event_data, timestamp, exercise_name, set_number, weight, reps, duration_seconds')
          .eq('username', username)
          .eq('session_id', session.id)
          .order('timestamp', { ascending: false })
          .limit(50);

        if (!evErr && events) {
          setLiveEvents(events);
        }
      } else {
        setLiveEvents([]);
      }

      setLastPolled(new Date());
    } catch (err) {
      console.error('useAdminLiveSession error:', err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  // Initial fetch + polling
  useEffect(() => {
    fetchLiveData();
    intervalRef.current = setInterval(fetchLiveData, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchLiveData]);

  // Derived state
  const currentExercise = liveEvents.length > 0
    ? liveEvents.find(e => e.exercise_name)?.exercise_name ?? null
    : null;

  const currentPhase = activeSession?.current_phase ?? null;

  const sessionDuration = activeSession
    ? Math.round((Date.now() - new Date(activeSession.created_at).getTime()) / 60_000)
    : 0;

  const setsCompleted = liveEvents.filter(e => e.event_type === 'set_completed').length;

  const exerciseCount = new Set(
    liveEvents
      .filter(e => e.event_type === 'set_completed' && e.exercise_name)
      .map(e => e.exercise_name)
  ).size;

  return {
    activeSession,
    liveEvents,
    currentExercise,
    currentPhase,
    sessionDuration,
    exerciseCount,
    setsCompleted,
    loading,
    lastPolled,
    refresh: fetchLiveData,
  };
}
