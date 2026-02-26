import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Shape of a single set as consumed by ExercisePage.
 */
export interface WorkoutSet {
  id: number;
  type: string;
  instructions: string;
  weight: string;
  reps: string;
  confirmed?: boolean;
}

/**
 * Shape of a substitute exercise block.
 */
export interface SubstituteExercise {
  name: string;
  tier: string;
  videoUrl: string;
  sets: WorkoutSet[];
}

/**
 * Shape of a single exercise entry as expected by ExercisePage.
 */
export interface WorkoutExercise {
  name: string;
  tier: string;
  videoUrl: string;
  sets: WorkoutSet[];
  substitute?: SubstituteExercise;
}

/**
 * The exercise_data JSONB column is expected to contain this shape when
 * populated from the admin dashboard. If the column is null or malformed
 * the exercise will be skipped (and the hardcoded fallback kicks in if
 * no valid exercises are returned at all).
 */
interface ExerciseDataPayload {
  sets: Array<{
    id: number;
    type: string;
    instructions: string;
  }>;
  substitute?: {
    name: string;
    tier: string;
    videoUrl: string;
    sets: Array<{
      id: number;
      type: string;
      instructions: string;
    }>;
  };
}

// ---------------------------------------------------------------------------
// Hardcoded fallback -- identical to the original initialWorkoutData from
// ExercisePage so behaviour is preserved when the DB table is empty.
// ---------------------------------------------------------------------------
const FALLBACK_WORKOUT_DATA: WorkoutExercise[] = [
  {
    name: 'Machine/Barbell Hip Thrust',
    tier: 'Great - A Tier',
    videoUrl: 'https://www.youtube.com/shorts/-1cAnwFNBLg',
    sets: [
      { id: 0, type: 'Warm Up Set', instructions: '15-20 reps (light weight, perfect form)', weight: '', reps: '' },
      { id: 1, type: 'Medium/Primer Set', instructions: '10-12 reps @ 3-4 RIR', weight: '', reps: '' },
      { id: 2, type: 'Heavy/Top Set', instructions: '8-10 reps @ 1 RIR', weight: '', reps: '' },
      { id: 3, type: 'Failure/Back-Off Set', instructions: 'AMRAP @ 0 RIR (drop weight 25-30%)', weight: '', reps: '' },
    ],
    substitute: {
      name: 'Single Leg Dumbbell Hip Thrust',
      tier: 'Substitute',
      videoUrl: 'https://www.youtube.com/shorts/KSeceTJh9m0',
      sets: [
        { id: 4, type: 'Warm Up Set', instructions: '15-20 reps per leg (light weight)', weight: '', reps: '' },
        { id: 5, type: 'Medium/Primer Set', instructions: '10-12 reps per leg @ 3-4 RIR', weight: '', reps: '' },
        { id: 6, type: 'Heavy/Top Set', instructions: '8-10 reps per leg @ 1 RIR', weight: '', reps: '' },
        { id: 7, type: 'Failure/Back-Off Set', instructions: 'AMRAP per leg @ 0 RIR (bodyweight or light)', weight: '', reps: '' },
      ],
    },
  },
  {
    name: 'Walking Lunge',
    tier: 'Best of the Best - S+ Tier',
    videoUrl: 'https://www.youtube.com/shorts/BhUpWmlKcJ8?feature=share',
    sets: [
      { id: 8, type: 'Warm Up Set', instructions: '15-20 reps (light weight, perfect form)', weight: '', reps: '' },
      { id: 9, type: 'Medium/Primer Set', instructions: '12 reps per leg @ 3-4 RIR', weight: '', reps: '' },
      { id: 10, type: 'Heavy/Top Set', instructions: '10 reps per leg @ 1 RIR', weight: '', reps: '' },
      { id: 11, type: 'Failure/Back-Off Set', instructions: 'AMRAP per leg (medium dumbbells)', weight: '', reps: '' },
    ],
  },
  {
    name: 'Romanian Deadlift (RDL)',
    tier: 'Great - A Tier',
    videoUrl: 'https://www.youtube.com/watch?v=5rIqP63yWFg',
    sets: [
      { id: 12, type: 'Warm Up Set', instructions: '15-20 reps (light weight, perfect form)', weight: '', reps: '' },
      { id: 13, type: 'Medium/Primer Set', instructions: '12 reps @ 3-4 RIR', weight: '', reps: '' },
      { id: 14, type: 'Heavy/Top Set', instructions: '8-10 reps @ 1 RIR', weight: '', reps: '' },
      { id: 15, type: 'Failure/Back-Off Set', instructions: 'AMRAP @ 0 RIR (drop weight 25%)', weight: '', reps: '' },
    ],
  },
  {
    name: 'Machine Hip Abduction',
    tier: 'Great - S Tier',
    videoUrl: 'https://www.youtube.com/shorts/S_FGYHNHJ_c',
    sets: [
      { id: 16, type: 'Warm Up Set', instructions: '15-20 reps (light weight, perfect form)', weight: '', reps: '' },
      { id: 17, type: 'Medium/Primer Set', instructions: '15 reps @ 3-4 RIR (lean forward)', weight: '', reps: '' },
      { id: 18, type: 'Heavy/Top Set', instructions: '12-15 reps @ 1 RIR', weight: '', reps: '' },
      { id: 19, type: 'Failure/Back-Off Set', instructions: 'AMRAP @ 0 RIR', weight: '', reps: '' },
    ],
  },
  {
    name: 'Step-Ups',
    tier: 'Great - A Tier',
    videoUrl: 'https://www.youtube.com/shorts/sejk5iTrcRE',
    sets: [
      { id: 20, type: 'Warm Up Set', instructions: '15-20 reps (light weight, perfect form)', weight: '', reps: '' },
      { id: 21, type: 'Medium/Primer Set', instructions: '12 reps per leg @ 3-4 RIR (light/bodyweight)', weight: '', reps: '' },
      { id: 22, type: 'Heavy/Top Set', instructions: '10-12 reps per leg @ 1 RIR', weight: '', reps: '' },
      { id: 23, type: 'Failure/Back-Off Set', instructions: 'AMRAP per leg (bodyweight only)', weight: '', reps: '' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Transform a row from exercise_index into the WorkoutExercise shape.
// Returns null if the row lacks a valid exercise_data payload.
// ---------------------------------------------------------------------------
function rowToWorkoutExercise(
  row: {
    name: string;
    tier: string | null;
    video_url: string;
    exercise_data: unknown;
  },
  idOffset: number,
): WorkoutExercise | null {
  const payload = row.exercise_data as ExerciseDataPayload | null;

  // If exercise_data is missing or has no sets array we cannot build the
  // expected shape, so skip this row.
  if (!payload || !Array.isArray(payload.sets) || payload.sets.length === 0) {
    return null;
  }

  const buildSets = (
    rawSets: Array<{ id?: number; type: string; instructions: string }>,
    offset: number,
  ): WorkoutSet[] =>
    rawSets.map((s, i) => ({
      id: s.id ?? offset + i,
      type: s.type,
      instructions: s.instructions,
      weight: '',
      reps: '',
    }));

  const sets = buildSets(payload.sets, idOffset);

  const exercise: WorkoutExercise = {
    name: row.name,
    tier: row.tier || '',
    videoUrl: row.video_url,
    sets,
  };

  if (payload.substitute) {
    const subSets = buildSets(
      payload.substitute.sets,
      idOffset + sets.length,
    );
    exercise.substitute = {
      name: payload.substitute.name,
      tier: payload.substitute.tier || '',
      videoUrl: payload.substitute.videoUrl || '',
      sets: subSets,
    };
  }

  return exercise;
}

// ---------------------------------------------------------------------------
// Fetch workout-category exercises from exercise_index and convert them.
// ---------------------------------------------------------------------------
async function fetchWorkoutProgram(): Promise<WorkoutExercise[]> {
  const { data, error } = await supabase
    .from('exercise_index')
    .select('name, tier, video_url, exercise_data')
    .eq('category', 'workout')
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to fetch exercise program from Supabase:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  let idCounter = 0;
  const exercises: WorkoutExercise[] = [];

  for (const row of data) {
    const ex = rowToWorkoutExercise(row, idCounter);
    if (ex) {
      // Advance the id counter past the sets we just created so ids stay unique.
      idCounter += ex.sets.length + (ex.substitute?.sets.length || 0);
      exercises.push(ex);
    }
  }

  return exercises;
}

// ---------------------------------------------------------------------------
// Public hook
// ---------------------------------------------------------------------------

export interface UseExerciseProgramResult {
  /** The exercise list in the format ExercisePage expects. */
  exercises: WorkoutExercise[];
  /** True while the initial fetch is in progress. */
  isLoading: boolean;
  /** True if the hook is using the hardcoded fallback data. */
  isFallback: boolean;
  /** Any error from the fetch (null when using fallback). */
  error: Error | null;
}

/**
 * Fetches the workout exercise program from the exercise_index Supabase
 * table. Falls back to the original hardcoded exercise list when:
 *   * The table has no workout-category rows with valid exercise_data
 *   * The fetch request fails
 *
 * Results are cached via React Query with a 5 minute stale time so
 * navigating between exercises does not trigger repeated network requests.
 */
export function useExerciseProgram(): UseExerciseProgramResult {
  const {
    data: fetched,
    isLoading,
    error,
  } = useQuery<WorkoutExercise[], Error>({
    queryKey: ['exerciseProgram'],
    queryFn: fetchWorkoutProgram,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // keep in cache 10 minutes
    retry: 1,
  });

  // Determine whether we should use the fetched data or fall back.
  const useFallback =
    isLoading ||               // still loading, show fallback immediately
    !!error ||                 // fetch failed
    !fetched ||                // null / undefined
    fetched.length === 0;      // table had no usable rows

  return {
    exercises: useFallback ? FALLBACK_WORKOUT_DATA : fetched,
    isLoading,
    isFallback: useFallback && !isLoading,
    error: error ?? null,
  };
}
