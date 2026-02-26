import { useAuth } from '@/contexts/AuthContext';

const DEFAULT_USERNAME = 'Kara';

export const useAuthenticatedUser = () => {
  const { user, username } = useAuth();

  return {
    user,
    userProfile: { username: username || DEFAULT_USERNAME },
    username: username || DEFAULT_USERNAME,
    loading: false,
  };
};
