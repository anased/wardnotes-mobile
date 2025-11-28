// src/components/auth/GoogleLoginButton.tsx
import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  View,
} from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../contexts/AuthContext';

// Finish authentication when the browser closes
WebBrowser.maybeCompleteAuthSession();

export default function GoogleLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithOAuth } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);

      // Create redirect URI for Expo
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'wardnotes',
        path: 'auth/callback',
      });

      console.log('OAuth Redirect URI:', redirectUri);

      // Get OAuth URL from Supabase
      const { url } = supabase.auth.signInWithOAuth('google', redirectUri);

      console.log('Opening OAuth URL:', url);

      // Open OAuth flow in browser using WebBrowser (modern approach)
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);

      console.log('OAuth result:', result);

      if (result.type === 'success') {
        // Extract tokens from URL fragment (implicit flow)
        const { url: resultUrl } = result;

        // Parse the URL fragment (after #) which contains the tokens
        const hashIndex = resultUrl.indexOf('#');
        if (hashIndex === -1) {
          throw new Error('No tokens received in redirect URL');
        }

        const fragment = resultUrl.substring(hashIndex + 1);
        const params = new URLSearchParams(fragment);

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const expiresAt = params.get('expires_at');

        console.log('Received tokens from OAuth:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          expiresAt,
        });

        if (!accessToken) {
          throw new Error('No access token received');
        }

        // Create session object from tokens
        const session = {
          access_token: accessToken,
          refresh_token: refreshToken || '',
          expires_at: expiresAt ? parseInt(expiresAt) : undefined,
          user: {} as any, // Will be populated by AuthContext
        };

        console.log('Storing session...');

        // Store session using AuthContext
        await signInWithOAuth(session);

        console.log('Google sign-in successful');
      } else if (result.type === 'cancel') {
        console.log('User cancelled OAuth flow');
      } else {
        throw new Error('OAuth flow failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert(
        'Sign In Failed',
        error instanceof Error ? error.message : 'Failed to sign in with Google. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, isLoading && styles.buttonDisabled]}
      onPress={handleGoogleLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#1f2937" />
      ) : (
        <View style={styles.buttonContent}>
          <Text style={styles.icon}>G</Text>
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: 12,
  },
  buttonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
});
