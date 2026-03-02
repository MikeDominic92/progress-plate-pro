import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface CsvRow {
  date: string;
  exercise: string;
  set: number;
  weight: string;
  reps: string;
  setType: string;
}

interface WorkoutSet {
  confirmed?: boolean;
  weight?: string;
  reps?: string;
  type?: string;
}

interface WorkoutExercise {
  name?: string;
  sets?: WorkoutSet[];
  substitute?: {
    name?: string;
    sets?: WorkoutSet[];
  };
}

interface SessionWorkoutData {
  logs?: WorkoutExercise[];
}

/**
 * Queries all completed workout_sessions for the given user,
 * parses the workout_data JSON column, and returns a CSV string.
 */
export async function buildWorkoutCsv(username: string): Promise<string> {
  const { data: sessions, error } = await supabase
    .from('workout_sessions')
    .select('session_date, workout_data')
    .eq('username', username)
    .eq('current_phase', 'completed')
    .order('session_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch workout sessions: ${error.message}`);
  }

  if (!sessions || sessions.length === 0) {
    throw new Error('No completed workout sessions found.');
  }

  const rows: CsvRow[] = [];

  for (const session of sessions) {
    const workoutData = session.workout_data as SessionWorkoutData;
    if (!workoutData?.logs || !Array.isArray(workoutData.logs)) continue;

    for (const exercise of workoutData.logs) {
      if (!exercise) continue;

      // Determine which sets were actually used: main or substitute.
      // If any substitute set is confirmed, use the substitute; otherwise use main sets.
      const hasConfirmedSubstitute = exercise.substitute?.sets?.some(
        (s: WorkoutSet) => s.confirmed
      );
      const activeSets = hasConfirmedSubstitute
        ? exercise.substitute.sets
        : exercise.sets;
      const exerciseName = hasConfirmedSubstitute
        ? exercise.substitute?.name || exercise.name
        : exercise.name;

      if (!Array.isArray(activeSets)) continue;

      let setNumber = 0;
      for (const set of activeSets) {
        if (!set.confirmed) continue;
        setNumber++;

        rows.push({
          date: session.session_date,
          exercise: exerciseName,
          set: setNumber,
          weight: set.weight || '0',
          reps: set.reps || '0',
          setType: set.type || 'Unknown',
        });
      }
    }
  }

  if (rows.length === 0) {
    throw new Error('No confirmed sets found in workout history.');
  }

  const header = 'Date,Exercise,Set,Weight (lb),Reps,Set Type';
  const csvLines = rows.map(
    (r) =>
      `${r.date},"${r.exercise.replace(/"/g, '""')}",${r.set},${r.weight},${r.reps},"${r.setType.replace(/"/g, '""')}"`
  );

  return [header, ...csvLines].join('\n');
}

/**
 * Builds a CSV from all completed sessions and triggers a browser download.
 */
export async function downloadWorkoutCsv(username: string): Promise<void> {
  const csvContent = await buildWorkoutCsv(username);

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workout-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
