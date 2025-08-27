// src/screens/settings/SubscriptionScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../../hooks/useSubscription';
import { useNavigation } from '@react-navigation/native';

interface PlanOption {
  type: 'monthly' | 'annual';
  title: string;
  price: string;
  period: string;
  description: string;
  savings?: string;
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    type: 'monthly',
    title: 'Monthly Plan',
    price: '$9.99',
    period: '/month',
    description: 'Billed monthly. Cancel anytime.',
  },
  {
    type: 'annual',
    title: 'Annual Plan',
    price: '$99.99',
    period: '/year',
    description: 'Billed annually. Best value for serious students.',
    savings: 'Save 17%',
  },
];

const PREMIUM_FEATURES = [
  'AI-powered flashcard generation for spaced repetition learning',
  'AI note improvement for better structure and clarity',
  'Priority support and early access to new features',
];

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const { subscription, isPremium, loading, error, redirectToCheckout, manageBilling, refreshSubscription, syncWithStripe } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async () => {
    try {
      setIsProcessing(true);
      await redirectToCheckout(selectedPlan === 'annual');
    } catch (error) {
      Alert.alert('Error', 'Failed to start checkout process. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setIsProcessing(true);
      await manageBilling();
    } catch (error) {
      Alert.alert('Error', 'Failed to open billing portal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefreshSubscription = async () => {
    try {
      setIsProcessing(true);
      await refreshSubscription();
      Alert.alert('Success', 'Subscription status refreshed!');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh subscription status.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncWithStripe = async () => {
    try {
      setIsProcessing(true);
      const result = await syncWithStripe();
      if (result.updated) {
        Alert.alert('Success', 'Subscription synced and updated!');
      } else {
        Alert.alert('Info', 'Subscription is already up to date');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sync with Stripe.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderFeatureItem = (feature: string, index: number) => (
    <View key={index} style={styles.featureItem}>
      <Ionicons name="checkmark-circle" size={20} color="#0ea5e9" />
      <Text style={styles.featureText}>{feature}</Text>
    </View>
  );

  const renderPlanOption = (plan: PlanOption) => (
    <TouchableOpacity
      key={plan.type}
      style={[
        styles.planCard,
        selectedPlan === plan.type && styles.selectedPlanCard,
      ]}
      onPress={() => setSelectedPlan(plan.type)}
    >
      <View style={styles.planHeader}>
        <View style={styles.radioButton}>
          {selectedPlan === plan.type && <View style={styles.radioSelected} />}
        </View>
        <View style={styles.planTitleContainer}>
          <Text style={styles.planTitle}>{plan.title}</Text>
          {plan.savings && (
            <View style={styles.savingsTag}>
              <Text style={styles.savingsText}>{plan.savings}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.price}>{plan.price}</Text>
        <Text style={styles.period}>{plan.period}</Text>
      </View>

      <Text style={styles.planDescription}>{plan.description}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading subscription...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Plan Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Plan</Text>
          <View style={styles.currentPlanCard}>
            <View style={styles.planStatusContainer}>
              <View style={styles.planIcon}>
                <Ionicons 
                  name={isPremium ? "shield-checkmark" : "shield-outline"} 
                  size={24} 
                  color="#0ea5e9" 
                />
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.currentPlanTitle}>
                  {isPremium ? 'Premium Plan' : 'Free Plan'}
                </Text>
                <Text style={styles.currentPlanDescription}>
                  {isPremium 
                    ? 'You have access to all premium features'
                    : 'Basic access with limited features'
                  }
                </Text>
                {subscription?.valid_until && isPremium && (
                  <Text style={styles.renewalDate}>
                    Renews on {new Date(subscription.valid_until).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Premium Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isPremium ? 'Your Premium Features' : 'Upgrade to Premium'}
          </Text>
          <View style={styles.featuresCard}>
            <Text style={styles.featuresDescription}>
              {isPremium 
                ? "You're currently on the Premium plan, which includes:"
                : "Upgrade to Premium to unlock powerful features:"
              }
            </Text>
            {PREMIUM_FEATURES.map(renderFeatureItem)}
          </View>
        </View>

        {/* Plan Selection or Billing Management */}
        {isPremium ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manage Your Subscription</Text>
            <View style={styles.billingButtons}>
              <TouchableOpacity
                style={styles.billingButton}
                onPress={handleManageBilling}
                disabled={isProcessing}
              >
                <Text style={styles.billingButtonText}>Manage Billing</Text>
                {isProcessing && <ActivityIndicator size="small" color="#0ea5e9" style={styles.buttonSpinner} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.billingButton, styles.secondaryButton]}
                onPress={handleSyncWithStripe}
                disabled={isProcessing}
              >
                <Text style={[styles.billingButtonText, styles.secondaryButtonText]}>Sync with Stripe</Text>
                {isProcessing && <ActivityIndicator size="small" color="#6b7280" style={styles.buttonSpinner} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.billingButton, styles.secondaryButton]}
                onPress={handleRefreshSubscription}
                disabled={isProcessing}
              >
                <Text style={[styles.billingButtonText, styles.secondaryButtonText]}>Refresh Status</Text>
                {isProcessing && <ActivityIndicator size="small" color="#6b7280" style={styles.buttonSpinner} />}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Plan Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Your Plan</Text>
              {PLAN_OPTIONS.map(renderPlanOption)}
            </View>

            {/* Upgrade Button */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.upgradeButton, isProcessing && styles.disabledButton]}
                onPress={handleUpgrade}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.upgradeDisclaimer}>
                Secure payment processing with Stripe. Cancel anytime.
              </Text>
            </View>
          </>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error.message}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  currentPlanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  planStatusContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planInfo: {
    flex: 1,
  },
  currentPlanTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  currentPlanDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  renewalDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  featuresCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featuresDescription: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedPlanCard: {
    borderColor: '#0ea5e9',
    backgroundColor: '#eff6ff',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0ea5e9',
  },
  planTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  savingsTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  period: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  billingButtons: {
    gap: 12,
  },
  billingButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  billingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#374151',
  },
  buttonSpinner: {
    marginLeft: 8,
  },
  upgradeButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  upgradeDisclaimer: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorContainer: {
    margin: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
});