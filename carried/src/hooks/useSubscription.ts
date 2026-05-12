/**
 * useSubscription Hook
 * Carried - Motions carry, memory too
 *
 * Listens to user's subscription status from Stripe/Firebase Extension
 * The "Run Payments with Stripe" extension creates:
 *   customers/{userId}/subscriptions/{subscriptionId}
 */

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './useAuth';
import type {
  UserSubscriptionState,
  StripeSubscription,
  PlanTier,
} from '../types/subscription';
import { TIER_FEATURES, PRICING } from '../types/subscription';

const DEFAULT_STATE: UserSubscriptionState = {
  isLoading: true,
  tier: 'free',
  status: null,
  subscription: null,
  canAccessAI: false,
  expiresAt: null,
};

export function useSubscription(): UserSubscriptionState {
  const { user } = useAuth();
  const [state, setState] = useState<UserSubscriptionState>(DEFAULT_STATE);

  useEffect(() => {
    if (!user) {
      setState({
        ...DEFAULT_STATE,
        isLoading: false,
      });
      return;
    }

    console.log('CARRIED_DEBUG: Checking subscription for user:', user.uid);

    let unsubscribeStripe: (() => void) | null = null;
    let cancelled = false;

    // First check if user has freeProAccess (comped users, admins, testers)
    const checkAndSetup = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.freeProAccess === true) {
            console.log('CARRIED_DEBUG: User has freeProAccess - granting Pro tier');
            if (!cancelled) {
              setState({
                isLoading: false,
                tier: 'pro',
                status: 'active',
                subscription: null,
                canAccessAI: true,
                expiresAt: null, // Never expires for free access
              });
            }
            return; // Skip Stripe check
          }
        }
      } catch (error) {
        console.error('CARRIED_DEBUG: Error checking freeProAccess:', error);
      }

      if (cancelled) return;

      // No free access, check Stripe subscriptions
      const subscriptionsRef = collection(db, 'customers', user.uid, 'subscriptions');
      const activeQuery = query(
        subscriptionsRef,
        where('status', 'in', ['active', 'trialing']),
        orderBy('created', 'desc'),
        limit(1)
      );

      unsubscribeStripe = onSnapshot(
        activeQuery,
        (snapshot) => {
          if (cancelled) return;

          if (snapshot.empty) {
            console.log('CARRIED_DEBUG: No active subscription found - free tier');
            setState({
              isLoading: false,
              tier: 'free',
              status: null,
              subscription: null,
              canAccessAI: false,
              expiresAt: null,
            });
            return;
          }

          // Get the most recent active subscription
          const subDoc = snapshot.docs[0];
          const data = subDoc.data() as StripeSubscription;

          console.log('CARRIED_DEBUG: Active subscription found:', {
            id: subDoc.id,
            status: data.status,
            product: data.items?.[0]?.price?.product?.name,
          });

          // Determine tier from product metadata or name
          const productName = data.items?.[0]?.price?.product?.name?.toLowerCase() || '';
          const productMetadata = data.items?.[0]?.price?.product?.metadata;
          const tier: PlanTier = productMetadata?.tier ||
            (productName.includes('pro') ? 'pro' : 'free');

          const canAccessAI = tier === 'pro' &&
            (data.status === 'active' || data.status === 'trialing');

          // Handle Firestore Timestamps (they have toDate method) or regular dates
          const toDateSafe = (val: any): Date => {
            if (!val) return new Date();
            if (typeof val.toDate === 'function') return val.toDate();
            if (val instanceof Date) return val;
            return new Date(val);
          };

          setState({
            isLoading: false,
            tier,
            status: data.status,
            subscription: {
              ...data,
              id: subDoc.id,
              created: toDateSafe(data.created),
              current_period_start: toDateSafe(data.current_period_start),
              current_period_end: toDateSafe(data.current_period_end),
            } as StripeSubscription,
            canAccessAI,
            expiresAt: toDateSafe(data.current_period_end),
          });
        },
        (error) => {
          console.error('CARRIED_DEBUG: Subscription listener error:', error);
          if (!cancelled) {
            setState({
              ...DEFAULT_STATE,
              isLoading: false,
            });
          }
        }
      );
    };

    checkAndSetup();

    return () => {
      cancelled = true;
      if (unsubscribeStripe) unsubscribeStripe();
    };
  }, [user]);

  return state;
}

/**
 * Check if a specific feature is available for the current tier
 */
export function useFeatureAccess(feature: keyof typeof TIER_FEATURES['pro']): boolean {
  const { tier } = useSubscription();
  const features = TIER_FEATURES[tier];
  return features[feature] as boolean;
}

// Re-export for convenience
export { TIER_FEATURES, PRICING };
