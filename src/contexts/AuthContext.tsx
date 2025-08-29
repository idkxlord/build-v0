import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient, Session, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Sales Rep';
  orgId: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, role: string, orgId: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock user for development when Supabase is not available
  const mockUser: AuthUser = {
    id: 'e8a1d4a6-6e0c-4b5b-b684-1ba87d09a1c2',
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'Manager',
    orgId: 'org-1'
  };

  useEffect(() => {
    if (!supabase) {
      // Use mock user when Supabase is not available
      setUser(mockUser);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      if (!supabase) {
        setUser(mockUser);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, org_id')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to mock user
        setUser(mockUser);
      } else if (data) {
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as 'Admin' | 'Manager' | 'Sales Rep',
          orgId: data.org_id
        });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUser(mockUser);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      if (!supabase) {
        // Mock sign in for development
        setUser(mockUser);
        return {};
      }

      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        await fetchUserProfile(data.user.id);
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred during sign in' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    role: string, 
    orgId: string
  ): Promise<{ error?: string }> => {
    try {
      if (!supabase) {
        // Mock sign up for development
        const newUser = { ...mockUser, email, name, role: role as any, orgId };
        setUser(newUser);
        return {};
      }

      setLoading(true);
      
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        // Create user profile in our users table
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            name,
            email,
            role,
            org_id: orgId
          }]);

        if (profileError) {
          return { error: 'Failed to create user profile' };
        }

        await fetchUserProfile(data.user.id);
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred during sign up' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      if (!supabase) {
        setUser(null);
        return;
      }

      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>): Promise<{ error?: string }> => {
    try {
      if (!user) {
        return { error: 'No user logged in' };
      }

      if (!supabase) {
        // Mock update for development
        setUser({ ...user, ...updates });
        return {};
      }

      const { error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          email: updates.email
        })
        .eq('id', user.id);

      if (error) {
        return { error: error.message };
      }

      setUser({ ...user, ...updates });
      return {};
    } catch (error) {
      return { error: 'Failed to update profile' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};