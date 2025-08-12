import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase/client';
import { Alert, Linking } from 'react-native';

export function useSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const query = supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id);
        
      const { data, error } = await query.single();

      if (data) {
        setSubscription(data);
        setIsPremium(
          data.subscription_status === 'active' && 
          data.subscription_plan === 'premium'
        );
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const redirectToCheckout = async () => {
    try {
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Call your web app's API to create checkout session
      const response = await fetch('https://your-web-app.com/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ isYearly: false }),
      });

      const { url } = await response.json();
      
      // Open checkout URL in browser
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Failed to start checkout process');
    }
  };

  return {
    subscription,
    isPremium,
    loading,
    redirectToCheckout,
    fetchSubscription,
  };
}