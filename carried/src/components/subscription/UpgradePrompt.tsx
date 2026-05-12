/**
 * Upgrade Prompt Component
 * Carried - Motions carry, memory too
 *
 * Prompts free users to upgrade to Pro for AI features
 */

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { PRICING } from '../../types/subscription';

interface UpgradePromptProps {
  feature?: 'aiNarrative' | 'semanticSearch' | 'exportReports';
  inline?: boolean;
}

const FEATURE_NAMES = {
  aiNarrative: 'AI Narrative Summaries',
  semanticSearch: 'Semantic Search',
  exportReports: 'Export Reports',
};

export function UpgradePrompt({ feature, inline = false }: UpgradePromptProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (interval: 'month' | 'year') => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Create a checkout session
      // The Firebase Extension listens to this collection and creates a Stripe checkout
      const checkoutSessionRef = collection(
        db,
        'customers',
        user.uid,
        'checkout_sessions'
      );

      const docRef = await addDoc(checkoutSessionRef, {
        // Price ID from Stripe - you'll replace these with your actual price IDs
        price: interval === 'month'
          ? import.meta.env.VITE_STRIPE_PRICE_MONTHLY
          : import.meta.env.VITE_STRIPE_PRICE_YEARLY,
        success_url: window.location.origin + '/settings?upgraded=true',
        cancel_url: window.location.href,
        allow_promotion_codes: true,
      });

      console.log('CARRIED_DEBUG: Checkout session created:', docRef.id);

      // The extension will update this doc with a URL - we need to listen for it
      // For now, redirect after a short delay (the extension typically responds quickly)
      // In production, you'd listen to the doc for the URL field

      // Simplified: The extension adds a `url` field - poll for it
      const checkForUrl = async () => {
        const { getDoc } = await import('firebase/firestore');
        const doc = await getDoc(docRef);
        const data = doc.data();

        if (data?.url) {
          window.location.href = data.url;
        } else if (data?.error) {
          console.error('CARRIED_DEBUG: Checkout error:', data.error);
          setIsLoading(false);
          alert('Unable to start checkout. Please try again.');
        } else {
          // Keep polling
          setTimeout(checkForUrl, 500);
        }
      };

      checkForUrl();
    } catch (error) {
      console.error('CARRIED_DEBUG: Failed to create checkout session:', error);
      setIsLoading(false);
      alert('Unable to start checkout. Please try again.');
    }
  };

  if (inline) {
    return (
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">✨</div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-white">
              {feature ? FEATURE_NAMES[feature] : 'AI Features'} require Pro
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upgrade to unlock AI-powered insights
            </p>
          </div>
          <button
            onClick={() => handleUpgrade('month')}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Loading...' : 'Upgrade'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">✨</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Upgrade to Pro
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {feature
            ? `${FEATURE_NAMES[feature]} is a Pro feature`
            : 'Unlock AI-powered meeting intelligence'}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
          <span className="text-green-500">✓</span>
          <span>AI Narrative Summaries</span>
        </div>
        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
          <span className="text-green-500">✓</span>
          <span>Semantic Search across all meetings</span>
        </div>
        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
          <span className="text-green-500">✓</span>
          <span>Export reports and analytics</span>
        </div>
        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
          <span className="text-green-500">✓</span>
          <span>Unlimited groups and meetings</span>
        </div>
        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
          <span className="text-green-500">✓</span>
          <span>Priority support</span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => handleUpgrade('month')}
          disabled={isLoading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {isLoading ? 'Loading...' : `$${PRICING.pro.monthly}/month`}
        </button>
        <button
          onClick={() => handleUpgrade('year')}
          disabled={isLoading}
          className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors font-medium"
        >
          {isLoading ? 'Loading...' : `$${PRICING.pro.yearly}/year (Save 17%)`}
        </button>
      </div>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
        Cancel anytime. 7-day free trial included.
      </p>
    </div>
  );
}

/**
 * Simple badge showing current plan
 */
export function PlanBadge({ tier }: { tier: 'free' | 'pro' }) {
  if (tier === 'pro') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        PRO
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
      FREE
    </span>
  );
}
