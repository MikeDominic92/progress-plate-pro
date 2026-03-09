import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yidrdfhiouaeybmrjwnd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZHJkZmhpb3VhZXlibXJqd25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDk0MzYsImV4cCI6MjA4NzYyNTQzNn0.nPkMPcaVOJNvyoFCRw0Wp6hz8UFRwRWgkcoBQQHX4Do';

const supabase = createClient(supabaseUrl, supabaseKey);

const videoUpdates = [
  {
    name: 'Smith Machine Lunge (Front Foot Elevated)',
    video_url: 'https://www.youtube.com/shorts/tBpGCSH0xT8',
  },
  {
    name: 'Barbell Back Squat',
    video_url: 'https://www.youtube.com/watch?v=ultWZbUMPL8',
  },
  {
    name: '45-Degree Back Extension',
    video_url: 'https://www.youtube.com/watch?v=ph3pddpKzzw',
  },
  {
    name: 'P90x Ab Ripper',
    video_url: 'https://www.youtube.com/watch?v=sWjTnBmCHTY',
  }
];

async function fixVideoUrls() {
  console.log('Updating placeholder video URLs with real form tutorials...\n');

  for (const update of videoUpdates) {
    console.log(`Updating: ${update.name}`);
    console.log(`  New URL: ${update.video_url}`);

    const { error } = await supabase
      .from('exercise_index')
      .update({ video_url: update.video_url })
      .eq('name', update.name)
      .eq('category', 'workout');

    if (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
    } else {
      console.log(`  ✅ Updated successfully`);
    }
    console.log('');
  }

  console.log('Verification - Checking all workout videos:\n');

  const { data, error } = await supabase
    .from('exercise_index')
    .select('name, video_url')
    .eq('category', 'workout')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error:', error);
  } else {
    data.forEach((ex, i) => {
      const hasPlaceholder = ex.video_url.includes('example');
      console.log(`${i + 1}. ${ex.name}`);
      console.log(`   ${ex.video_url}`);
      console.log(`   ${hasPlaceholder ? '❌ Still has placeholder' : '✅ Real video URL'}`);
      console.log('');
    });
  }
}

fixVideoUrls();
