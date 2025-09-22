import { useAuth } from '@/contexts/AuthContext';

export const useAuthenticatedUser = () => {
  const { user, username } = useAuth();

  return {
    user,
    userProfile: username ? { username } : null,
    username,
    loading: false,
  };
};