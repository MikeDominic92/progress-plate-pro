import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yidrdfhiouaeybmrjwnd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZHJkZmhpb3VhZXlibXJqd25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDk0MzYsImV4cCI6MjA4NzYyNTQzNn0.nPkMPcaVOJNvyoFCRw0Wp6hz8UFRwRWgkcoBQQHX4Do';

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditVideos() {
  console.log('='.repeat(80));
  console.log('VIDEO AUDIT - Progress Plate Pro');
  console.log('='.repeat(80));
  console.log('\n');

  // Check workout exercises
  console.log('1. WORKOUT EXERCISES (category: workout)');
  console.log('-'.repeat(80));

  const { data: workoutData, error: workoutError } = await supabase
    .from('exercise_index')
    .select('name, video_url, tier, exercise_data')
    .eq('category', 'workout')
    .order('name', { ascending: true });

  if (workoutError) {
    console.error('Error fetching workout exercises:', workoutError);
  } else {
    workoutData.forEach((ex, i) => {
      console.log(`\n${i + 1}. ${ex.name} (${ex.tier})`);
      console.log(`   Video URL: ${ex.video_url || 'MISSING'}`);

      // Check if substitute has video
      if (ex.exercise_data?.substitute) {
        console.log(`   Substitute: ${ex.exercise_data.substitute.name}`);
        console.log(`   Substitute Video: ${ex.exercise_data.substitute.videoUrl || 'MISSING'}`);
      }

      // Validate URL
      if (!ex.video_url) {
        console.log('   ❌ WARNING: No video URL!');
      } else if (ex.video_url.includes('example')) {
        console.log('   ❌ WARNING: Placeholder/example URL detected!');
      } else if (ex.video_url.includes('youtube.com') || ex.video_url.includes('youtu.be')) {
        console.log('   ✅ YouTube URL');
      } else {
        console.log('   ⚠️  Non-YouTube URL');
      }
    });
  }

  // Check warmup exercises
  console.log('\n\n2. WARMUP EXERCISES (category: warmup)');
  console.log('-'.repeat(80));

  const { data: warmupData, error: warmupError } = await supabase
    .from('exercise_index')
    .select('name, video_url, tier')
    .eq('category', 'warmup')
    .order('name', { ascending: true });

  if (warmupError) {
    console.error('Error fetching warmup exercises:', warmupError);
  } else if (!warmupData || warmupData.length === 0) {
    console.log('⚠️  No warmup exercises found in database');
  } else {
    warmupData.forEach((ex, i) => {
      console.log(`\n${i + 1}. ${ex.name}`);
      console.log(`   Video URL: ${ex.video_url || 'MISSING'}`);

      if (!ex.video_url) {
        console.log('   ❌ WARNING: No video URL!');
      } else if (ex.video_url.includes('example')) {
        console.log('   ❌ WARNING: Placeholder/example URL detected!');
      } else if (ex.video_url.includes('youtube.com') || ex.video_url.includes('youtu.be')) {
        console.log('   ✅ YouTube URL');
      }
    });
  }

  // Check cardio exercises
  console.log('\n\n3. CARDIO EXERCISES (category: cardio)');
  console.log('-'.repeat(80));

  const { data: cardioData, error: cardioError } = await supabase
    .from('exercise_index')
    .select('name, video_url, tier')
    .eq('category', 'cardio')
    .order('name', { ascending: true });

  if (cardioError) {
    console.error('Error fetching cardio exercises:', cardioError);
  } else if (!cardioData || cardioData.length === 0) {
    console.log('⚠️  No cardio exercises found in database');
  } else {
    cardioData.forEach((ex, i) => {
      console.log(`\n${i + 1}. ${ex.name}`);
      console.log(`   Video URL: ${ex.video_url || 'MISSING'}`);

      if (!ex.video_url) {
        console.log('   ❌ WARNING: No video URL!');
      } else if (ex.video_url.includes('example')) {
        console.log('   ❌ WARNING: Placeholder/example URL detected!');
      } else if (ex.video_url.includes('youtube.com') || ex.video_url.includes('youtu.be')) {
        console.log('   ✅ YouTube URL');
      }
    });
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Workout Exercises: ${workoutData?.length || 0}`);
  console.log(`Warmup Exercises: ${warmupData?.length || 0}`);
  console.log(`Cardio Exercises: ${cardioData?.length || 0}`);

  const workoutMissing = workoutData?.filter(ex => !ex.video_url || ex.video_url.includes('example')).length || 0;
  const warmupMissing = warmupData?.filter(ex => !ex.video_url || ex.video_url.includes('example')).length || 0;
  const cardioMissing = cardioData?.filter(ex => !ex.video_url || ex.video_url.includes('example')).length || 0;

  const totalMissing = workoutMissing + warmupMissing + cardioMissing;

  console.log(`\nMissing/Placeholder Videos: ${totalMissing}`);
  if (totalMissing > 0) {
    console.log('  ❌ Action required: Update placeholder video URLs');
  } else {
    console.log('  ✅ All exercises have video URLs');
  }
  console.log('\n');
}

auditVideos();
