import { initStripe } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';

const publishableKey = Constants.expoConfig?.extra?.stripePublishableKey || 'your-stripe-key';

export const initializeStripe = async () => {
  await initStripe({
    publishableKey,
    merchantIdentifier: 'com.wardnotes.mobile', // Required for Apple Pay
  });
};