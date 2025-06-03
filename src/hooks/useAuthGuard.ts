// src/hooks/useAuthGuard.ts
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to protect screens that require authentication
 * Automatically redirects to auth screen if user is not logged in
 */
export const useAuthGuard = () => {
  const { user, loading } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (!loading && !user) {
      // Reset navigation stack and navigate to auth
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' as never }],
      });
    }
  }, [user, loading, navigation]);

  return { user, loading, isAuthenticated: !!user };
};

/**
 * Hook for screens that should redirect authenticated users away
 * (like auth screens)
 */
export const useGuestGuard = () => {
  const { user, loading } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (!loading && user) {
      // Reset navigation stack and navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' as never }],
      });
    }
  }, [user, loading, navigation]);

  return { user, loading, isGuest: !user };
};