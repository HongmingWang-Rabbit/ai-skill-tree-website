import Stripe from 'stripe';
import { BILLING_CONFIG, type SubscriptionTier } from './constants';

// Lazy-initialize Stripe to avoid build-time errors when env var is not available
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

// Proxy-based export that lazy-initializes Stripe on first property access
// This prevents build-time errors when STRIPE_SECRET_KEY is not in the environment
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

/**
 * Get subscription tier from Stripe price ID
 */
export function getTierFromPriceId(priceId: string): SubscriptionTier {
  const { stripePrices } = BILLING_CONFIG;

  // Log for debugging price ID matching issues
  if (!stripePrices.proMonthly && !stripePrices.proYearly && !stripePrices.premiumMonthly && !stripePrices.premiumYearly) {
    console.error('Stripe price IDs not configured in environment variables');
  }

  if (priceId === stripePrices.proMonthly || priceId === stripePrices.proYearly) {
    return 'pro';
  }
  if (priceId === stripePrices.premiumMonthly || priceId === stripePrices.premiumYearly) {
    return 'premium';
  }

  // Log unknown price ID to help debug mismatches
  console.warn(`Unknown price ID: ${priceId}. Expected one of: proMonthly=${stripePrices.proMonthly}, proYearly=${stripePrices.proYearly}, premiumMonthly=${stripePrices.premiumMonthly}, premiumYearly=${stripePrices.premiumYearly}`);
  return 'free';
}

/**
 * Get credit amount from credit pack price ID
 */
export function getCreditsFromPriceId(priceId: string): number {
  const { stripePrices, creditPacks } = BILLING_CONFIG;

  if (priceId === stripePrices.credits500) return creditPacks.pack500;
  if (priceId === stripePrices.credits2000) return creditPacks.pack2000;
  if (priceId === stripePrices.credits5000) return creditPacks.pack5000;
  return 0;
}

/**
 * Check if a price ID is for a subscription (not a one-time purchase)
 */
export function isSubscriptionPriceId(priceId: string): boolean {
  const { stripePrices } = BILLING_CONFIG;
  return (
    priceId === stripePrices.proMonthly ||
    priceId === stripePrices.proYearly ||
    priceId === stripePrices.premiumMonthly ||
    priceId === stripePrices.premiumYearly
  );
}

/**
 * Check if a price ID is for a credit pack purchase
 */
export function isCreditPackPriceId(priceId: string): boolean {
  const { stripePrices } = BILLING_CONFIG;
  return (
    priceId === stripePrices.credits500 ||
    priceId === stripePrices.credits2000 ||
    priceId === stripePrices.credits5000
  );
}
