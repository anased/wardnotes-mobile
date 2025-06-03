// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../services/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  email_confirmed_at?: string;
}

interface Session {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: User;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; session: Session | null }>;
  signUp: (email: string, password: string) => Promise<{ user: User | null; session: Session | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app start
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Try to get session from AsyncStorage first (for offline persistence)
      const storedSession = await AsyncStorage.getItem('supabase.auth.token');
      
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        
        // Check if session is still valid
        if (parsedSession.expires_at && parsedSession.expires_at > Date.now() / 1000) {
          setSession(parsedSession);
          setUser(parsedSession.user);
          
          // Update supabase client headers
          updateSupabaseHeaders(parsedSession.access_token);
        } else {
          // Session expired, try to refresh
          await refreshStoredSession(parsedSession);
        }
      }
      
      // Also check with Supabase directly
      const { data, error } = await supabase.auth.getSession();
      
      if (!error && data.session) {
        await updateAuthState(data.session);
      } else if (!storedSession) {
        // No valid session found anywhere
        await clearAuthState();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      await clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  const refreshStoredSession = async (oldSession: Session) => {
    try {
      if (!oldSession.refresh_token) {
        await clearAuthState();
        return;
      }

      const response = await fetch(`${supabase.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey,
        },
        body: JSON.stringify({
          refresh_token: oldSession.refresh_token,
        }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        const newSession: Session = {
          access_token: data.access_token,
          refresh_token: data.refresh_token || oldSession.refresh_token,
          expires_at: data.expires_at,
          user: data.user || oldSession.user,
        };

        await updateAuthState(newSession);
      } else {
        await clearAuthState();
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      await clearAuthState();
    }
  };

  const updateAuthState = async (newSession: Session) => {
    setSession(newSession);
    setUser(newSession.user);
    
    // Store session in AsyncStorage
    await AsyncStorage.setItem('supabase.auth.token', JSON.stringify(newSession));
    
    // Update supabase client headers
    updateSupabaseHeaders(newSession.access_token);
  };

  const clearAuthState = async () => {
    setSession(null);
    setUser(null);
    
    // Clear stored session
    await AsyncStorage.removeItem('supabase.auth.token');
    
    // Reset supabase client headers
    updateSupabaseHeaders(null);
  };

  const updateSupabaseHeaders = (token: string | null) => {
    if (token) {
      // Update the headers in your custom supabase client
      // This depends on your implementation in client.ts
      (supabase as any).headers = {
        ...(supabase as any).headers,
        'Authorization': `Bearer ${token}`,
      };
    } else {
      // Reset to anonymous key
      (supabase as any).headers = {
        ...(supabase as any).headers,
        'Authorization': `Bearer ${(supabase as any).key}`,
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        await updateAuthState(data.session);
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Check if user already exists
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        throw new Error('This email is already in use. Please use a different email or try signing in.');
      }

      // For sign up, we might not get a session immediately if email confirmation is required
      if (data.session) {
        await updateAuthState(data.session);
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear local state
      await clearAuthState();
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if the API call fails, clear local state
      await clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    if (session) {
      await refreshStoredSession(session);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};