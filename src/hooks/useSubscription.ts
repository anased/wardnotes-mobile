// src/hooks/useSubscription.ts
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionService } from '../services/subscriptionService';
import { Subscription } from '../types/subscription';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isRefreshing = useRef(false);

  // Computed property to check if the user has premium access
  const isPremium = subscription?.subscription_status === 'active' && 
                   subscription?.subscription_plan === 'premium';

  // Fetch subscription when user changes
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try to get existing subscription
        let userSubscription = await subscriptionService.getSubscription(user.id);

        // If no subscription exists, create a default free one
        if (!userSubscription) {
          try {
            userSubscription = await subscriptionService.createDefaultSubscription(user.id);
          } catch (createError) {
            console.error('Error creating default subscription:', createError);
            // Fall back to a client-side subscription object
            userSubscription = {
              id: '0',
              user_id: user.id,
              stripe_customer_id: null,
              stripe_subscription_id: null,
              subscription_status: 'free',
              subscription_plan: 'free',
              valid_until: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
        }

        setSubscription(userSubscription);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err as Error);
        
        // Set a fallback subscription to prevent UI errors
        if (user) {
          setSubscription({
            id: '0',
            user_id: user.id,
            stripe_customer_id: null,
            stripe_subscription_id: null,
            subscription_status: 'free',
            subscription_plan: 'free',
            valid_until: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  // Function to redirect to Stripe Checkout
  const redirectToCheckout = async (isYearly: boolean = false) => {
    try {
      setError(null);
      await subscriptionService.redirectToCheckout(isYearly);
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  // Function to redirect to the customer portal
  const manageBilling = async () => {
    try {
      setError(null);
      await subscriptionService.manageBilling();
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  // Function to manually refresh subscription data
  const refreshSubscription = async () => {
    if (isRefreshing.current || !user) {
      return;
    }

    try {
      isRefreshing.current = true;
      setLoading(true);
      setError(null);

      const userSubscription = await subscriptionService.getSubscription(user.id);
      
      if (userSubscription) {
        setSubscription(userSubscription);
      } else {
        // If no subscription found, create default
        const defaultSubscription = await subscriptionService.createDefaultSubscription(user.id);
        setSubscription(defaultSubscription);
      }
    } catch (err) {
      console.error('Error refreshing subscription:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
      isRefreshing.current = false;
    }
  };

  // Function to sync subscription status with Stripe
  const syncWithStripe = async () => {
    try {
      setError(null);
      const result = await subscriptionService.syncWithStripe();
      
      if (result.subscription) {
        setSubscription(result.subscription);
      }
      
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  return {
    subscription,
    isPremium,
    loading,
    error,
    redirectToCheckout,
    manageBilling,
    refreshSubscription,
    syncWithStripe
  };
}