import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  email?: string;
  calendar_visibility: 'public' | 'private';
  is_admin: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    let subscription: any;
    try {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      });
      subscription = sub;
    } catch (error) {
      console.error('Error setting up auth listener:', error);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (username: string, email: string, password: string) => {
    console.log('[AUTH] Starting sign up for:', email);

    // Check if username already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingProfile) {
      throw new Error('Username already taken');
    }

    // Create user with email and password
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        },
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      console.error('[AUTH] Sign up error:', error);
      throw new Error(error.message || 'Failed to create account');
    }

    if (!data.user) {
      throw new Error('No user returned from sign up');
    }

    console.log('[AUTH] User created:', data.user.id);
    console.log('[AUTH] Email confirmation required?', !data.session);

    // Create profile immediately
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username,
          email,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          calendar_visibility: 'public',
          is_admin: false
        });

      if (profileError) {
        console.error('[AUTH] Profile creation error:', profileError);
        throw new Error('Failed to create profile: ' + profileError.message);
      }

      console.log('[AUTH] Profile created successfully');

      // Only load profile if user is confirmed (no email confirmation required)
      if (data.session) {
        await loadProfile(data.user.id);
        console.log('[AUTH] User signed in automatically');
      } else {
        console.log('[AUTH] Email confirmation required - user must confirm email before signing in');
        // Clear any existing session
        setUser(null);
        setProfile(null);
        setSession(null);
        throw new Error('Please check your email to confirm your account before signing in');
      }
    } catch (profileError: any) {
      // If profile creation fails, log the error but don't try to delete user
      // (we can't use admin API from client side)
      console.error('[AUTH] Profile creation failed:', profileError);
      throw profileError;
    }
  };

  const signIn = async (identifier: string, password: string) => {
    // Try email first
    let result = await supabase.auth.signInWithPassword({
      email: identifier,
      password
    });

    // If email fails, try username lookup
    if (result.error) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', identifier)
        .single();

      if (profileData?.email) {
        result = await supabase.auth.signInWithPassword({
          email: profileData.email,
          password
        });
      }
    }

    if (result.error) throw result.error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) throw error;
    await loadProfile(user.id);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
