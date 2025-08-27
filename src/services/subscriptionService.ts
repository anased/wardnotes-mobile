// src/services/subscriptionService.ts
import { supabase } from './supabase/rest-client';
import { Subscription } from '../types/subscription';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

const API_BASE_URL = 'https://wardnotes.vercel.app/api';

export class SubscriptionService {
  // Get user's subscription from database
  async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      const result = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (result.error) {
        // If no subscription exists, return null (user will get free subscription)
        if (result.error.message?.includes('No rows found')) {
          return null;
        }
        throw new Error(result.error.message || 'Failed to fetch subscription');
      }

      return result.data as Subscription;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  }

  // Create a default free subscription for new users
  async createDefaultSubscription(userId: string): Promise<Subscription> {
    try {
      const result = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          subscription_status: 'free',
          subscription_plan: 'free',
        })
        .select()
        .single();

      if (result.error) {
        throw new Error(result.error.message || 'Failed to create subscription');
      }

      return result.data as Subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Redirect to Stripe checkout (opens web browser)
  async redirectToCheckout(isYearly: boolean = false): Promise<void> {
    try {
      const session = await AsyncStorage.getItem('supabase.auth.token');
      if (!session) {
        throw new Error('You must be logged in to upgrade');
      }

      const parsedSession = JSON.parse(session);
      const token = parsedSession.access_token;

      const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isYearly }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Open Stripe checkout in the device's web browser
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        throw new Error('Unable to open checkout page');
      }
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      throw error;
    }
  }

  // Redirect to customer billing portal (opens web browser)
  async manageBilling(): Promise<void> {
    try {
      const session = await AsyncStorage.getItem('supabase.auth.token');
      if (!session) {
        throw new Error('You must be logged in to manage billing');
      }

      const parsedSession = JSON.parse(session);
      const token = parsedSession.access_token;

      const response = await fetch(`${API_BASE_URL}/create-customer-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create customer portal session');
      }

      const { url } = await response.json();

      // Open customer portal in the device's web browser
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        throw new Error('Unable to open billing portal');
      }
    } catch (error) {
      console.error('Error managing billing:', error);
      throw error;
    }
  }

  // Sync subscription status with Stripe
  async syncWithStripe(): Promise<{ subscription: Subscription | null; updated: boolean }> {
    try {
      const session = await AsyncStorage.getItem('supabase.auth.token');
      if (!session) {
        throw new Error('You must be logged in to sync subscription');
      }

      const parsedSession = JSON.parse(session);
      const token = parsedSession.access_token;

      const response = await fetch(`${API_BASE_URL}/sync-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync subscription');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error syncing with Stripe:', error);
      throw error;
    }
  }
}

export const subscriptionService = new SubscriptionService();