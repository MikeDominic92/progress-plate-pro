import { supabase } from '@/integrations/supabase/client';

export const deleteAllData = async () => {
  // Verify the current user is an admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (roleData?.role !== 'admin') {
    throw new Error('Unauthorized: admin role required');
  }

  try {
    const { error: sessionsError } = await supabase
      .from('workout_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (sessionsError) throw sessionsError;

    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (profilesError) throw profilesError;

    const { error: analyticsError } = await supabase
      .from('session_analytics')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (analyticsError) throw analyticsError;
  } catch (error) {
    console.error('Error deleting all data:', error);
    throw error;
  }
};
