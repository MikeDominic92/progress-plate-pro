import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SessionSummary {
  id: string;
  session_date: string;
  current_phase: string;
  warmup_completed: boolean;
  cardio_completed: boolean;
  cardio_time: string | null;
  cardio_calories: string | null;
  workout_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  duration: number; // minutes
  exerciseCount: number;
  totalVolume: number;
  setCount: number;
}

interface AggregateStats {
  totalSessions: number;
  avgDuration: number;
  weeklyAvg: number;
  totalVolume: number;
  totalSets: number;
}

interface UseAdminSessionHistoryReturn {
  sessions: SessionSummary[];
  stats: AggregateStats;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useAdminSessionHistory(username = 'Kara'): UseAdminSessionHistoryReturn {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [stats, setStats] = useState<AggregateStats>({
    totalSessions: 0,
    avgDuration: 0,
    weeklyAvg: 0,
    totalVolume: 0,
    totalSets: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      // Fetch all completed sessions
      const { data: rawSessions, error: sessErr } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('username', username)
        .eq('current_phase', 'completed')
        .order('session_date', { ascending: false });

      if (sessErr) {
        console.error('Session history fetch error:', sessErr);
        return;
      }

      if (!rawSessions || rawSessions.length === 0) {
        setSessions([]);
        setStats({ totalSessions: 0, avgDuration: 0, weeklyAvg: 0, totalVolume: 0, totalSets: 0 });
        return;
      }

      // Fetch set_completed events scoped to returned sessions only
      const sessionIds = rawSessions.map(s => s.id);
      const { data: setEvents } = sessionIds.length > 0
        ? await supabase
            .from('session_analytics')
            .select('session_id, exercise_name, weight, reps')
            .in('session_id', sessionIds)
            .eq('event_type', 'set_completed')
        : { data: [] };

      // Group set events by session_id
      const eventsBySession: Record<string, { exercise_name: string | null; weight: number | null; reps: number | null }[]> = {};
      if (setEvents) {
        for (const ev of setEvents) {
          const sid = ev.session_id || '_none';
          if (!eventsBySession[sid]) eventsBySession[sid] = [];
          eventsBySession[sid].push(ev);
        }
      }

      // Build enriched session summaries
      const enriched: SessionSummary[] = rawSessions.map(s => {
        const duration = Math.round(
          (new Date(s.updated_at).getTime() - new Date(s.created_at).getTime()) / 60_000
        );

        const sessionEvents = eventsBySession[s.id] || [];
        const exercises = new Set(sessionEvents.map(e => e.exercise_name).filter(Boolean));
        const totalVolume = sessionEvents.reduce(
          (sum, e) => sum + (e.weight || 0) * (e.reps || 0),
          0
        );

        // Also count exercises from workout_data if no analytics
        const wdExercises = s.workout_data?.logs ? Object.keys(s.workout_data.logs).length : 0;

        return {
          id: s.id,
          session_date: s.session_date,
          current_phase: s.current_phase,
          warmup_completed: s.warmup_completed ?? false,
          cardio_completed: s.cardio_completed ?? false,
          cardio_time: s.cardio_time,
          cardio_calories: s.cardio_calories,
          workout_data: s.workout_data,
          created_at: s.created_at,
          updated_at: s.updated_at,
          duration,
          exerciseCount: exercises.size || wdExercises,
          totalVolume,
          setCount: sessionEvents.length,
        };
      });

      setSessions(enriched);

      // Compute aggregate stats
      const totalSessions = enriched.length;
      const avgDuration = totalSessions > 0
        ? Math.round(enriched.reduce((s, sess) => s + sess.duration, 0) / totalSessions)
        : 0;
      const totalVolume = enriched.reduce((s, sess) => s + sess.totalVolume, 0);
      const totalSets = enriched.reduce((s, sess) => s + sess.setCount, 0);

      // Weekly average: sessions per week over the span of training
      const dates = enriched.map(s => new Date(s.session_date).getTime());
      const earliest = Math.min(...dates);
      const latest = Math.max(...dates);
      const weeks = Math.max(1, (latest - earliest) / (7 * 24 * 60 * 60 * 1000));
      const weeklyAvg = Math.round((totalSessions / weeks) * 10) / 10;

      setStats({ totalSessions, avgDuration, weeklyAvg, totalVolume, totalSets });
    } catch (err) {
      console.error('useAdminSessionHistory error:', err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { sessions, stats, loading, refresh: fetchHistory };
}
