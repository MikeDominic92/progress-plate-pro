import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { supabaseRetry } from '@/lib/supabaseRetry';

const DEFAULT_USERNAME = 'Kara';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (username: string, password: string) => Promise<{ error: any }>;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  username: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const { toast } = useToast();
  const initialSessionResolved = useRef(false);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabaseRetry(
        () => supabase
          .from('user_roles')
          .select('role, username')
          .eq('user_id', userId)
          .maybeSingle(),
        { maxRetries: 1 },
      );

      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }

      setIsAdmin(data?.role === 'admin');
      setUsername(data?.username || null);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setIsAdmin(false);
      setUsername(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        initialSessionResolved.current = true;
        setSession(session);
        setUser(session?.user ?? null);

        // Fetch role and username when user changes
        if (session?.user) {
          fetchUserRole(session.user.id);
        } else {
          setIsAdmin(false);
          setUsername(null);
        }

        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (initialSessionResolved.current) {
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-authenticate as Kara - no login screen needed
  useEffect(() => {
    if (!loading && !session) {
      const autoSignIn = async () => {
        const email = `${DEFAULT_USERNAME.toLowerCase()}@temp.local`;
        const password = import.meta.env.VITE_AUTO_AUTH_PASSWORD;

        // Try to sign in first
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // If sign-in fails, create the account
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { username: DEFAULT_USERNAME }
            }
          });

          if (signUpError) {
            console.error('Auto-auth failed:', signUpError);
            setLoading(false);
            return;
          }

          // Create user role entry
          if (data.user) {
            await supabase.from('user_roles').upsert({
              user_id: data.user.id,
              username: DEFAULT_USERNAME,
              role: 'user'
            }, { onConflict: 'user_id' });
          }
        }
      };

      autoSignIn();
    }
  }, [loading, session]);

  const signUp = async (username: string, password: string) => {
    // Create a temporary email using username
    const tempEmail = `${username.toLowerCase()}@temp.local`;
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email: tempEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: username
        }
      }
    });

    if (error) {
      return { error };
    }

    // Create user role entry
    if (data.user) {
      try {
        await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            username: username,
            role: 'user'
          });
      } catch (roleError) {
        console.error('Error creating user role:', roleError);
      }
    }

    return { error: null };
  };

  const signIn = async (username: string, password: string) => {
    // Convert username to temp email for sign in
    const tempEmail = `${username.toLowerCase()}@temp.local`;

    const { error } = await supabase.auth.signInWithPassword({
      email: tempEmail,
      password,
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Error signing out. Please try again.",
        variant: "destructive",
      });
    }

    // Always clear state and localStorage on sign out
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setUsername(null);
    localStorage.removeItem('username');
    localStorage.removeItem('forceNewSession');
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin,
    username,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
