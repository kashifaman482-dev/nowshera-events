import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isLoading: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, role: UserRole, fullName?: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setSimulatedRole: (role: UserRole | null) => void;
  simulatedRole: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [simulatedRole, setSimulatedRole] = useState<UserRole | null>(null);

  const fetchProfile = useCallback(async (userId: string, currentUser?: User | null) => {
    try {
      setProfileError(null);
      // Read role from profiles table directly
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Could not read profile from table:', error.message);
        setProfileError(error.message);
        // Fallback to user metadata if profile table query hits policy issue
        const metaRole = (currentUser?.user_metadata?.role as UserRole) || 'attendee';
        setProfile({
          id: userId,
          email: currentUser?.email || '',
          role: metaRole,
          full_name: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0],
        });
        return;
      }

      if (data) {
        setProfile({
          id: data.id,
          email: data.email || currentUser?.email,
          role: (data.role as UserRole) || 'attendee',
          full_name: data.full_name || currentUser?.user_metadata?.full_name,
          created_at: data.created_at,
        });
      } else {
        // No row in profiles yet, construct from user data
        const fallbackRole = (currentUser?.user_metadata?.role as UserRole) || 'attendee';
        const fallbackProfile: UserProfile = {
          id: userId,
          email: currentUser?.email || '',
          role: fallbackRole,
          full_name: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0],
        };
        setProfile(fallbackProfile);

        // Try to insert profile row if possible
        try {
          await supabase.from('profiles').insert([
            {
              id: userId,
              email: currentUser?.email,
              role: fallbackRole,
              full_name: fallbackProfile.full_name,
            },
          ]);
        } catch {
          // Silent ignore if RLS restricts insert
        }
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setProfileError(err?.message || 'Error loading profile');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(data.session);
          setUser(data.session?.user || null);
          if (data.session?.user) {
            await fetchProfile(data.session.user.id, data.session.user);
          }
        }
      } catch (err) {
        console.error('Failed to get session:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        setUser(newSession?.user || null);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id, newSession.user);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setIsLoading(false);
        return { error: error.message };
      }

      if (data.user) {
        await fetchProfile(data.user.id, data.user);
      }

      setIsLoading(false);
      return {};
    } catch (err: any) {
      setIsLoading(false);
      return { error: err?.message || 'Sign in failed' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    role: UserRole = 'attendee',
    fullName: string = ''
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role,
            full_name: fullName.trim() || email.split('@')[0],
          },
        },
      });

      if (error) {
        setIsLoading(false);
        return { error: error.message };
      }

      if (data.user) {
        // Attempt to insert profile record if user row is accessible
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            role,
            full_name: fullName.trim() || email.split('@')[0],
          });
        } catch {
          // Handled by triggers or RLS
        }

        if (data.session) {
          await fetchProfile(data.user.id, data.user);
          setIsLoading(false);
          return { message: 'Account created and signed in successfully!' };
        } else {
          setIsLoading(false);
          return {
            message:
              'Account created! Please check your email inbox to confirm your address, or sign in if confirmation is not required.',
          };
        }
      }

      setIsLoading(false);
      return { message: 'Sign up successful.' };
    } catch (err: any) {
      setIsLoading(false);
      return { error: err?.message || 'Sign up failed' };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setSimulatedRole(null);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user);
    }
  };

  // The actual role is determined from profiles table, with simulation override if explicitly toggled for testing
  const effectiveRole: UserRole = simulatedRole || profile?.role || (user?.user_metadata?.role as UserRole) || 'attendee';
  const isAdmin = effectiveRole === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role: effectiveRole,
        isAdmin,
        isLoading,
        profileError,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        setSimulatedRole,
        simulatedRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
