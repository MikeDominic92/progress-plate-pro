import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yidrdfhiouaeybmrjwnd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZHJkZmhpb3VhZXlibXJqd25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDk0MzYsImV4cCI6MjA4NzYyNTQzNn0.nPkMPcaVOJNvyoFCRw0Wp6hz8UFRwRWgkcoBQQHX4Do';

const supabase = createClient(supabaseUrl, supabaseKey);

// These are popular fitness channels that typically allow embedding
const embeddableVideos = [
  {
    name: 'Smith Machine Lunge (Front Foot Elevated)',
    video_url: 'https://www.youtube.com/watch?v=LpJKNzUvihM', // Jeff Nippard - usually embeddable
  },
  {
    name: 'Barbell Back Squat',
    video_url: 'https://www.youtube.com/watch?v=gcNh17Ckjgg', // Squat University - usually embeddable
  },
  {
    name: '45-Degree Back Extension',
    video_url: 'https://www.youtube.com/watch?v=J3CLs6bLlyQ', // Jeremy Ethier - usually embeddable
  },
  {
    name: 'P90x Ab Ripper',
    video_url: 'https://youtu.be/7vtHbEiIGLU', // P90X official shortened link
  }
];

async function updateToEmbeddableVideos() {
  console.log('Updating to embeddable video URLs...\n');
  console.log('Using videos from channels that typically allow embedding:\n');
  console.log('- Jeff Nippard');
  console.log('- Squat University');
  console.log('- Jeremy Ethier');
  console.log('- P90X Official\n');

  for (const update of embeddableVideos) {
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

  console.log('\nVerification - All workout videos:\n');

  const { data, error } = await supabase
    .from('exercise_index')
    .select('name, video_url')
    .eq('category', 'workout')
    .order('name', { ascending: true});

  if (error) {
    console.error('Error:', error);
  } else {
    data.forEach((ex, i) => {
      console.log(`${i + 1}. ${ex.name}`);
      console.log(`   ${ex.video_url}`);
      console.log('');
    });
  }

  console.log('\n✅ Done! Test the videos in the app.');
  console.log('If any still don\'t embed, users can click "Open in YouTube".');
}

updateToEmbeddableVideos();
