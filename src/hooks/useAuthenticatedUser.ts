import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  username: string;
  display_name?: string;
}

export const useAuthenticatedUser = () => {
  const { user, session } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // First try to get username from JWT token
      const jwtUsername = session?.user?.user_metadata?.username;
      
      if (jwtUsername) {
        setUserProfile({ username: jwtUsername });
        return;
      }

      // Fallback: check user_roles table
      const { data, error } = await supabase
        .from('user_roles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        setUserProfile({ username: data.username });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    userProfile,
    username: userProfile?.username || null,
    loading,
  };
};