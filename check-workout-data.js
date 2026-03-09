import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yidrdfhiouaeybmrjwnd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZHJkZmhpb3VhZXlibXJqd25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDk0MzYsImV4cCI6MjA4NzYyNTQzNn0.nPkMPcaVOJNvyoFCRw0Wp6hz8UFRwRWgkcoBQQHX4Do';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWorkoutData() {
  console.log('Checking exercise_index table for workout data...\n');

  const { data, error } = await supabase
    .from('exercise_index')
    .select('name, tier, category, exercise_data')
    .eq('category', 'workout')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  console.log(`Found ${data?.length || 0} workout exercises in database:\n`);

  if (data && data.length > 0) {
    data.forEach((exercise, index) => {
      console.log(`${index + 1}. ${exercise.name} (${exercise.tier})`);
      console.log(`   exercise_data:`, exercise.exercise_data ? 'Present' : 'NULL');
      if (exercise.exercise_data) {
        const sets = exercise.exercise_data.sets || [];
        console.log(`   Sets: ${sets.length}`);
      }
      console.log('');
    });
  } else {
    console.log('NO WORKOUT EXERCISES FOUND IN DATABASE!');
    console.log('The app will use fallback data (only Machine/Barbell Hip Thrust)');
  }
}

checkWorkoutData();
