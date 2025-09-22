import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check admin status and username when user changes
        if (session?.user) {
          setTimeout(() => {
            checkAdminStatus(session.user.id);
            fetchUsername(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setUsername(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          checkAdminStatus(session.user.id);
          fetchUsername(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking admin status:', error);
        return;
      }

      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchUsername = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('username')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching username:', error);
        return;
      }

      setUsername(data?.username || null);
    } catch (error) {
      console.error('Error fetching username:', error);
      setUsername(null);
    }
  };

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
    } else {
      // Clear localStorage
      localStorage.removeItem('username');
      localStorage.removeItem('forceNewSession');
    }
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