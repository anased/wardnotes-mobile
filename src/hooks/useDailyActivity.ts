// src/hooks/useDailyActivity.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  getCurrentStreak,
  getWeeklyActivity,
  getMonthlyActivity,
  DailyActivity 
} from '../services/supabase/client';

export function useDailyActivity() {
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [weeklyActivity, setWeeklyActivity] = useState<DailyActivity[]>([]);
  const [monthlyActivity, setMonthlyActivity] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all activity data
  const fetchActivityData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [streak, weekly, monthly] = await Promise.all([
        getCurrentStreak(),
        getWeeklyActivity(),
        getMonthlyActivity()
      ]);

      setCurrentStreak(streak);
      setWeeklyActivity(weekly);
      setMonthlyActivity(monthly);
    } catch (err) {
      console.error('Error fetching activity data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update daily activity (called when a note is created)
  const recordActivity = useCallback(async () => {
    try {
      await fetchActivityData();
    } catch (err) {
      console.error('Error recording daily activity:', err);
      setError(err as Error);
    }
  }, [fetchActivityData]);

  // Refresh activity data
  const refreshActivity = useCallback(async () => {
    await fetchActivityData();
  }, [fetchActivityData]);

  // Load data on mount
  useEffect(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  return {
    currentStreak,
    weeklyActivity,
    monthlyActivity,
    loading,
    error,
    recordActivity,
    refreshActivity,
  };
}