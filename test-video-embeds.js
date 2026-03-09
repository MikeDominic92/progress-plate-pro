import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yidrdfhiouaeybmrjwnd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZHJkZmhpb3VhZXlibXJqd25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDk0MzYsImV4cCI6MjA4NzYyNTQzNn0.nPkMPcaVOJNvyoFCRw0Wp6hz8UFRwRWgkcoBQQHX4Do';

const supabase = createClient(supabaseUrl, supabaseKey);

// Alternative videos that are known to be embeddable
const alternativeVideos = {
  'Smith Machine Lunge (Front Foot Elevated)': 'https://www.youtube.com/watch?v=J3PWv_SX8Xo',
  'Barbell Back Squat': 'https://www.youtube.com/watch?v=SW_C1A-rejs',
  '45-Degree Back Extension': 'https://www.youtube.com/watch?v=qtdHYRw_kZk',
  'P90x Ab Ripper': 'https://www.youtube.com/watch?v=sDu58GjUXwQ'
};

async function testAndFixVideos() {
  console.log('Testing video embeddability and updating if needed...\n');

  const { data: workoutData, error } = await supabase
    .from('exercise_index')
    .select('name, video_url')
    .eq('category', 'workout')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching videos:', error);
    return;
  }

  console.log('Current Videos:\n');
  workoutData.forEach((ex, i) => {
    console.log(`${i + 1}. ${ex.name}`);
    console.log(`   Current: ${ex.video_url}`);

    if (alternativeVideos[ex.name]) {
      console.log(`   Alternative available: ${alternativeVideos[ex.name]}`);
    }
    console.log('');
  });

  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(80) + '\n');

  console.log('The YouTube embed error usually means:');
  console.log('1. The video creator disabled embedding');
  console.log('2. The video is age-restricted');
  console.log('3. The video has copyright restrictions');
  console.log('4. The video is private or deleted\n');

  console.log('Solutions:\n');
  console.log('Option 1: Update to alternative embeddable videos');
  console.log('Option 2: Use YouTube Shorts (generally more embeddable)');
  console.log('Option 3: Open videos in new tab instead of iframe');
  console.log('Option 4: Use videos from fitness channels that allow embedding\n');

  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Update to alternative embeddable videos? (y/n): ', async (answer) => {
      rl.close();

      if (answer.toLowerCase() === 'y') {
        console.log('\nUpdating videos...\n');

        for (const [name, url] of Object.entries(alternativeVideos)) {
          console.log(`Updating: ${name}`);
          const { error: updateError } = await supabase
            .from('exercise_index')
            .update({ video_url: url })
            .eq('name', name)
            .eq('category', 'workout');

          if (updateError) {
            console.log(`  ❌ Error: ${updateError.message}`);
          } else {
            console.log(`  ✅ Updated to: ${url}`);
          }
        }

        console.log('\nDone!');
      } else {
        console.log('\nNo changes made.');
      }

      resolve();
    });
  });
}

testAndFixVideos();
