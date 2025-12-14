// src/hooks/useQuota.ts
// Custom hook for managing quota state and checking feature availability
// Mirrors the web app's useQuota hook

import { useState, useEffect, useRef } from 'react';
import { getUserQuota } from '../services/quotaService';
import { useSubscription } from './useSubscription';
import type { QuotaFeatureType, QuotaState } from '../types/quota';

export interface UseQuotaReturn {
  quota: QuotaState | null;
  loading: boolean;
  error: Error | null;
  refreshQuota: () => Promise<void>;
  canUseFeature: (featureType: QuotaFeatureType) => boolean;
  getRemainingUses: (featureType: QuotaFeatureType) => number | null;
}

/**
 * Custom hook for managing quota state and checking feature availability
 *
 * Fetches quota data from the API on mount and provides helper functions
 * for checking if features can be used based on remaining quota.
 *
 * Premium users are automatically allowed all features (unlimited quota).
 */
export function useQuota(): UseQuotaReturn {
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isRefreshing = useRef(false);
  const { isPremium } = useSubscription();

  // Fetch quota data from API
  const fetchQuota = async () => {
    try {
      setLoading(true);
      setError(null);

      // Premium users have unlimited quota, skip fetch
      if (isPremium) {
        setQuota(null);
        return;
      }

      // Fetch quota from API
      const data = await getUserQuota();
      setQuota(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching quota:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      // Fail open - don't block user if quota fetch fails
      // Set quota to null to allow helper functions to return permissive defaults
    } finally {
      setLoading(false);
    }
  };

  // Fetch quota on mount and when isPremium changes
  useEffect(() => {
    fetchQuota();
  }, [isPremium]);

  // Refresh quota function (can be called after actions)
  const refreshQuota = async () => {
    if (isRefreshing.current) {
      return; // Prevent concurrent refreshes
    }

    isRefreshing.current = true;
    try {
      await fetchQuota();
    } finally {
      isRefreshing.current = false;
    }
  };

  /**
   * Check if a feature can be used based on remaining quota
   *
   * @param featureType - The feature to check
   * @returns true if feature can be used, false otherwise
   *
   * Premium users always return true (unlimited).
   * If quota data is unavailable, fails open and returns true.
   */
  const canUseFeature = (featureType: QuotaFeatureType): boolean => {
    // Premium users have unlimited access
    if (isPremium) {
      return true;
    }

    // If quota is null or loading, fail open (allow usage)
    if (!quota) {
      return true;
    }

    const feature = quota[featureType];

    // If unlimited (limit is null), allow
    if (feature.isUnlimited) {
      return true;
    }

    // Check if remaining quota is available
    return (feature.remaining ?? 0) > 0;
  };

  /**
   * Get remaining uses for a specific feature
   *
   * @param featureType - The feature to check
   * @returns Number of remaining uses, or null if unlimited/unavailable
   *
   * Premium users return null (unlimited).
   * If quota data is unavailable, returns null.
   */
  const getRemainingUses = (featureType: QuotaFeatureType): number | null => {
    // Premium users have unlimited access
    if (isPremium) {
      return null;
    }

    // If quota is null or loading, return null
    if (!quota) {
      return null;
    }

    const feature = quota[featureType];

    // If unlimited, return null
    if (feature.isUnlimited) {
      return null;
    }

    return feature.remaining;
  };

  return {
    quota,
    loading,
    error,
    refreshQuota,
    canUseFeature,
    getRemainingUses,
  };
}
