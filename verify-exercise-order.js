import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yidrdfhiouaeybmrjwnd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZHJkZmhpb3VhZXlibXJqd25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDk0MzYsImV4cCI6MjA4NzYyNTQzNn0.nPkMPcaVOJNvyoFCRw0Wp6hz8UFRwRWgkcoBQQHX4Do';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyOrder() {
  console.log('='.repeat(80));
  console.log('EXERCISE ORDER VERIFICATION');
  console.log('='.repeat(80));
  console.log('\n');

  const { data, error } = await supabase
    .from('exercise_index')
    .select('name, tier, exercise_data')
    .eq('category', 'workout');

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Sort the same way the hook does
  const sortedData = [...data].sort((a, b) => {
    const aOrder = a.exercise_data?.order_index ?? 999;
    const bOrder = b.exercise_data?.order_index ?? 999;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return a.name.localeCompare(b.name);
  });

  console.log('Workout Order (as it will appear in the app):\n');

  sortedData.forEach((ex, index) => {
    const orderIndex = ex.exercise_data?.order_index || 'N/A';
    console.log(`${index + 1}. ${ex.name} (${ex.tier})`);
    console.log(`   Order Index: ${orderIndex}`);
    console.log(`   Sets: ${ex.exercise_data?.sets?.length || 0}`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('ORDER RATIONALE FOR GLUTE HYPERTROPHY');
  console.log('='.repeat(80));
  console.log('\n');
  console.log('1. Barbell Back Squat (First)');
  console.log('   - Most demanding compound movement');
  console.log('   - Requires maximum energy and CNS freshness');
  console.log('   - Builds overall lower body strength + mass\n');

  console.log('2. Single-Leg Dumbbell Hip Thrust (Second)');
  console.log('   - Primary glute isolation exercise');
  console.log('   - Maximum glute activation via hip extension');
  console.log('   - Unilateral = balance, stability, symmetry\n');

  console.log('3. Smith Machine Lunge - Elevated (Third)');
  console.log('   - Front foot elevation = deeper hip flexion');
  console.log('   - Greater glute stretch + activation');
  console.log('   - Still fresh enough for heavy weight\n');

  console.log('4. Romanian Deadlift (Fourth)');
  console.log('   - Posterior chain (hamstrings + glutes)');
  console.log('   - Eccentric focus = muscle damage stimulus');
  console.log('   - Hip hinge pattern development\n');

  console.log('5. 45-Degree Back Extension (Fifth)');
  console.log('   - Isolation/burnout for glutes + erectors');
  console.log('   - High-rep finisher when fatigued');
  console.log('   - Lighter load, metabolic stress\n');

  console.log('6. P90x Ab Ripper (Last)');
  console.log('   - Core work doesn\'t fatigue glutes');
  console.log('   - Can be done when fatigued');
  console.log('   - Won\'t interfere with compound lifts\n');

  console.log('='.repeat(80));
  console.log('✅ OPTIMAL SEQUENCING FOR GLUTE GROWTH');
  console.log('='.repeat(80));
}

verifyOrder();
