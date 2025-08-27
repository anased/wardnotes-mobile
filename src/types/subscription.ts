// src/types/subscription.ts
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' | 'free';
export type SubscriptionPlan = 'free' | 'premium';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}