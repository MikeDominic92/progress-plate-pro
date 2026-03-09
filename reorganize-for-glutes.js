import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yidrdfhiouaeybmrjwnd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZHJkZmhpb3VhZXlibXJqd25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDk0MzYsImV4cCI6MjA4NzYyNTQzNn0.nPkMPcaVOJNvyoFCRw0Wp6hz8UFRwRWgkcoBQQHX4Do';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('='.repeat(80));
console.log('WORKOUT REORGANIZATION FOR OPTIMAL GLUTE HYPERTROPHY');
console.log('='.repeat(80));
console.log('\n');

console.log('Scientific Exercise Sequencing Principles:');
console.log('1. Compound movements first (most demanding, require full energy)');
console.log('2. Primary glute builders (hip extension dominant)');
console.log('3. Secondary compound (squat/lunge patterns)');
console.log('4. Posterior chain accessory (hamstrings/glutes)');
console.log('5. Isolation/burnout movements');
console.log('6. Core work last\n');

console.log('OPTIMAL ORDER FOR GLUTE GROWTH:\n');

const optimalOrder = [
  {
    order: 1,
    name: 'Barbell Back Squat',
    rationale: 'Compound king - requires most energy, builds overall lower body mass including glutes'
  },
  {
    order: 2,
    name: 'Single-Leg Dumbbell Hip Thrust',
    rationale: 'Primary glute builder - unilateral hip extension, maximum glute activation, do while fresh'
  },
  {
    order: 3,
    name: 'Smith Machine Lunge (Front Foot Elevated)',
    rationale: 'Glute-dominant lunge variation - elevation increases hip flexion = more glute stretch/activation'
  },
  {
    order: 4,
    name: 'Romanian Deadlift (RDL)',
    rationale: 'Posterior chain builder - eccentric hamstring/glute work, hip hinge pattern'
  },
  {
    order: 5,
    name: '45-Degree Back Extension',
    rationale: 'Isolation/burnout - targets glutes/hamstrings when fatigued, lighter load, high rep finisher'
  },
  {
    order: 6,
    name: 'P90x Ab Ripper',
    rationale: 'Core work last - doesn\'t interfere with compound lifts, can be done fatigued'
  }
];

console.log('Exercise Order:');
optimalOrder.forEach((ex) => {
  console.log(`${ex.order}. ${ex.name}`);
  console.log(`   → ${ex.rationale}\n`);
});

console.log('='.repeat(80));
console.log('UPDATING DATABASE...\n');

async function updateExerciseOrder() {
  for (const ex of optimalOrder) {
    console.log(`Setting order ${ex.order} for: ${ex.name}`);

    // We'll use the 'tier' field creatively to store order, or add it to exercise_data
    const { data: currentData, error: fetchError } = await supabase
      .from('exercise_index')
      .select('exercise_data')
      .eq('name', ex.name)
      .eq('category', 'workout')
      .single();

    if (fetchError) {
      console.log(`  ❌ Error fetching: ${fetchError.message}`);
      continue;
    }

    const updatedExerciseData = {
      ...currentData.exercise_data,
      order_index: ex.order
    };

    const { error: updateError } = await supabase
      .from('exercise_index')
      .update({ exercise_data: updatedExerciseData })
      .eq('name', ex.name)
      .eq('category', 'workout');

    if (updateError) {
      console.log(`  ❌ Error updating: ${updateError.message}`);
    } else {
      console.log(`  ✅ Updated successfully`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION\n');

  const { data: allExercises, error } = await supabase
    .from('exercise_index')
    .select('name, exercise_data')
    .eq('category', 'workout');

  if (error) {
    console.error('Error fetching exercises:', error);
    return;
  }

  const sorted = allExercises
    .map(ex => ({
      name: ex.name,
      order: ex.exercise_data?.order_index || 999
    }))
    .sort((a, b) => a.order - b.order);

  console.log('Updated Exercise Order:');
  sorted.forEach((ex) => {
    console.log(`${ex.order}. ${ex.name}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('NEXT STEP: Update useExerciseProgram.ts to sort by order_index');
  console.log('='.repeat(80));
}

updateExerciseOrder();
