/**
 * Subscription Types
 * Carried - Motions carry, memory too
 *
 * Types for Stripe subscription management via Firebase Extension
 */

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid';

export type PlanTier = 'free' | 'pro';

export interface StripeSubscription {
  id: string;
  status: SubscriptionStatus;
  created: Date;
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  canceled_at?: Date;
  ended_at?: Date;
  price: {
    id: string;
    product: string;
  };
  items: {
    price: {
      id: string;
      product: {
        id: string;
        name: string;
        metadata: {
          tier?: PlanTier;
        };
      };
    };
  }[];
}

export interface UserSubscriptionState {
  isLoading: boolean;
  tier: PlanTier;
  status: SubscriptionStatus | null;
  subscription: StripeSubscription | null;
  canAccessAI: boolean;
  expiresAt: Date | null;
}

/**
 * Features gated by subscription tier
 */
export const TIER_FEATURES = {
  free: {
    maxGroups: 2,
    maxMeetingsPerGroup: 10,
    aiNarrative: false,
    semanticSearch: false,
    exportReports: false,
    prioritySupport: false,
  },
  pro: {
    maxGroups: 999,
    maxMeetingsPerGroup: 999,
    aiNarrative: true,
    semanticSearch: true,
    exportReports: true,
    prioritySupport: true,
  },
} as const;

/**
 * Pricing (for display - actual prices in Stripe)
 */
export const PRICING = {
  pro: {
    monthly: 9.99,
    yearly: 99.99, // ~17% discount
  },
} as const;
