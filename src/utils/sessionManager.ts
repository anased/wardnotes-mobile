// src/utils/sessionManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase/client';

export interface StoredSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: {
    id: string;
    email: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
    email_confirmed_at?: string;
  };
}

const SESSION_KEY = 'supabase.auth.token';

export const sessionManager = {
  // Store session
  async storeSession(session: StoredSession): Promise<void> {
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
      // Update supabase client headers
      supabase.updateHeaders(session.access_token);
    } catch (error) {
      console.error('Error storing session:', error);
    }
  },

  // Get stored session
  async getStoredSession(): Promise<StoredSession | null> {
    try {
      const sessionString = await AsyncStorage.getItem(SESSION_KEY);
      if (!sessionString) return null;
      
      return JSON.parse(sessionString);
    } catch (error) {
      console.error('Error getting stored session:', error);
      return null;
    }
  },

  // Check if session is expired
  isSessionExpired(session: StoredSession): boolean {
    if (!session.expires_at) return false;
    
    // Add a 30-second buffer to account for network delays
    const bufferTime = 30;
    const currentTime = Math.floor(Date.now() / 1000);
    
    return session.expires_at <= (currentTime + bufferTime);
  },

  // Refresh session using refresh token
  async refreshSession(session: StoredSession): Promise<StoredSession | null> {
    if (!session.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${supabase.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey,
        },
        body: JSON.stringify({
          refresh_token: session.refresh_token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error_description || 'Failed to refresh session');
      }

      const newSession: StoredSession = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || session.refresh_token,
        expires_at: data.expires_at,
        user: data.user || session.user,
      };

      await this.storeSession(newSession);
      return newSession;
    } catch (error) {
      console.error('Error refreshing session:', error);
      await this.clearSession();
      throw error;
    }
  },

  // Clear stored session
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      supabase.updateHeaders(null);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  },

  // Validate and refresh session if needed
  async validateSession(): Promise<StoredSession | null> {
    const session = await this.getStoredSession();
    
    if (!session) {
      return null;
    }

    // If session is not expired, return it
    if (!this.isSessionExpired(session)) {
      supabase.updateHeaders(session.access_token);
      return session;
    }

    // Try to refresh the session
    try {
      return await this.refreshSession(session);
    } catch (error) {
      console.error('Failed to refresh expired session:', error);
      return null;
    }
  },
};