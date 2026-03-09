import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yidrdfhiouaeybmrjwnd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZHJkZmhpb3VhZXlibXJqd25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDk0MzYsImV4cCI6MjA4NzYyNTQzNn0.nPkMPcaVOJNvyoFCRw0Wp6hz8UFRwRWgkcoBQQHX4Do';

const supabase = createClient(supabaseUrl, supabaseKey);

const workoutExercises = [
  {
    name: 'Smith Machine Lunge (Front Foot Elevated)',
    tier: 'S+ Tier',
    category: 'workout',
    video_url: 'https://www.youtube.com/shorts/example1',
    exercise_data: {
      sets: [
        { id: 0, type: 'Warm Up Set', instructions: '15-20 reps per leg (light weight, perfect form)' },
        { id: 1, type: 'Medium/Primer Set', instructions: '12 reps per leg @ 3-4 RIR' },
        { id: 2, type: 'Heavy/Top Set', instructions: '10 reps per leg @ 1 RIR' },
        { id: 3, type: 'Failure/Back-Off Set', instructions: 'AMRAP per leg @ 0 RIR (bodyweight)' },
      ]
    }
  },
  {
    name: 'Barbell Back Squat',
    tier: 'S+ Tier',
    category: 'workout',
    video_url: 'https://www.youtube.com/watch?v=example2',
    exercise_data: {
      sets: [
        { id: 4, type: 'Warm Up Set', instructions: '15-20 reps (light weight, perfect form)' },
        { id: 5, type: 'Medium/Primer Set', instructions: '10-12 reps @ 3-4 RIR' },
        { id: 6, type: 'Heavy/Top Set', instructions: '8-10 reps @ 1 RIR' },
        { id: 7, type: 'Failure/Back-Off Set', instructions: 'AMRAP @ 0 RIR (drop weight 25-30%)' },
      ]
    }
  },
  {
    name: 'Romanian Deadlift (RDL)',
    tier: 'A Tier',
    category: 'workout',
    video_url: 'https://www.youtube.com/watch?v=5rIqP63yWFg',
    exercise_data: {
      sets: [
        { id: 8, type: 'Warm Up Set', instructions: '15-20 reps (light weight, perfect form)' },
        { id: 9, type: 'Medium/Primer Set', instructions: '12 reps @ 3-4 RIR' },
        { id: 10, type: 'Heavy/Top Set', instructions: '8-10 reps @ 1 RIR' },
        { id: 11, type: 'Failure/Back-Off Set', instructions: 'AMRAP @ 0 RIR (drop weight 25%)' },
      ]
    }
  },
  {
    name: 'Single-Leg Dumbbell Hip Thrust',
    tier: 'A Tier',
    category: 'workout',
    video_url: 'https://www.youtube.com/shorts/KSeceTJh9m0',
    exercise_data: {
      sets: [
        { id: 12, type: 'Warm Up Set', instructions: '15-20 reps per leg (light weight)' },
        { id: 13, type: 'Medium/Primer Set', instructions: '10-12 reps per leg @ 3-4 RIR' },
        { id: 14, type: 'Heavy/Top Set', instructions: '8-10 reps per leg @ 1 RIR' },
        { id: 15, type: 'Failure/Back-Off Set', instructions: 'AMRAP per leg @ 0 RIR (bodyweight or light)' },
      ]
    }
  },
  {
    name: '45-Degree Back Extension',
    tier: 'A Tier',
    category: 'workout',
    video_url: 'https://www.youtube.com/shorts/example5',
    exercise_data: {
      sets: [
        { id: 16, type: 'Warm Up Set', instructions: '15-20 reps (bodyweight, perfect form)' },
        { id: 17, type: 'Medium/Primer Set', instructions: '12-15 reps @ 3-4 RIR' },
        { id: 18, type: 'Failure/Back-Off Set', instructions: 'AMRAP @ 0 RIR' },
      ]
    }
  },
  {
    name: 'P90x Ab Ripper',
    tier: 'Core',
    category: 'workout',
    video_url: 'https://www.youtube.com/watch?v=example6',
    exercise_data: {
      sets: [
        { id: 19, type: 'Complete Set', instructions: 'Complete full Ab Ripper routine' },
      ]
    }
  }
];

async function populateWorkoutData() {
  console.log('Populating exercise_index with 6-exercise workout program...\n');

  // First, clear any existing workout exercises
  const { error: deleteError } = await supabase
    .from('exercise_index')
    .delete()
    .eq('category', 'workout');

  if (deleteError) {
    console.error('Error clearing existing data:', deleteError.message);
  } else {
    console.log('Cleared existing workout exercises\n');
  }

  for (const exercise of workoutExercises) {
    console.log(`Inserting: ${exercise.name}...`);

    const { data, error } = await supabase
      .from('exercise_index')
      .insert(exercise);

    if (error) {
      console.error(`  ERROR: ${error.message}`);
    } else {
      console.log(`  SUCCESS`);
    }
  }

  console.log('\nDone! Verifying...\n');

  const { data: verify, error: verifyError } = await supabase
    .from('exercise_index')
    .select('name, category')
    .eq('category', 'workout')
    .order('name');

  if (verifyError) {
    console.error('Verification error:', verifyError);
  } else {
    console.log(`Total workout exercises in database: ${verify?.length || 0}`);
    verify?.forEach((ex, i) => {
      console.log(`  ${i + 1}. ${ex.name}`);
    });
  }
}

populateWorkoutData();
