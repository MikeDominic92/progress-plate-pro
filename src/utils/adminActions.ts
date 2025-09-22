import { supabase } from '@/integrations/supabase/client';

export const deleteAllData = async () => {
  try {
    // Delete all workout sessions
    const { error: sessionsError } = await supabase
      .from('workout_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (sessionsError) throw sessionsError;

    // Delete all profiles
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (profilesError) throw profilesError;

    // Delete all analytics
    const { error: analyticsError } = await supabase
      .from('session_analytics')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (analyticsError) throw analyticsError;

    console.log('All data deleted successfully');
  } catch (error) {
    console.error('Error deleting all data:', error);
    throw error;
  }
};