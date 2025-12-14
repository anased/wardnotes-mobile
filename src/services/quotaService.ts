// API service for quota tracking
// Fetches quota data from the web app's API endpoint

import { supabase } from './supabase/client';
import type { QuotaState } from '../types/quota';

// Configuration
const WEB_APP_URL = 'https://wardnotes.vercel.app';
// const WEB_APP_URL = 'http://localhost:3000'; // For local development

/**
 * Gets the authorization token from Supabase session
 */
async function getAuthToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error('You must be logged in to access quota');
  }

  return session.access_token;
}

/**
 * Fetches current quota state from the backend
 *
 * @returns QuotaState object with usage data, or null if unavailable
 *
 * This function fails open - if the quota fetch fails for any reason
 * (network error, server error, etc.), it returns null. The calling code
 * should handle null by failing open (allowing feature usage).
 * Backend enforcement is the authoritative check.
 */
export async function getUserQuota(): Promise<QuotaState | null> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${WEB_APP_URL}/api/user/quota`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - user session may have expired
        console.error('Quota fetch failed: Unauthorized');
        return null;
      }

      // Other errors (500, 503, etc.) - log but don't throw
      console.error(`Quota fetch failed with status ${response.status}`);
      return null;
    }

    const data: QuotaState = await response.json();
    return data;
  } catch (error) {
    // Network errors, parsing errors, etc.
    console.error('Error fetching quota:', error);
    return null; // Fail open
  }
}
