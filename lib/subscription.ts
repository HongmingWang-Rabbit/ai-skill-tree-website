import Stripe from 'stripe';
import { db, subscriptions, users, userCareerGraphs } from './db';
import { eq, count } from 'drizzle-orm';
import { BILLING_CONFIG, type SubscriptionTier } from './constants';
import { stripe, getTierFromPriceId } from './stripe';
import { addCredits } from './credits';

export interface UserSubscriptionInfo {
  tier: SubscriptionTier;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  limits: {
    maxMaps: number;
    currentMaps: number;
    canCreateMap: boolean;
    hasWatermark: boolean;
  };
}

/**
 * Get user's subscription info with computed limits
 */
export async function getUserSubscription(userId: string): Promise<UserSubscriptionInfo> {
  const [sub, mapCountResult] = await Promise.all([
    db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    }),
    db
      .select({ count: count() })
      .from(userCareerGraphs)
      .where(eq(userCareerGraphs.userId, userId)),
  ]);

  const mapCount = mapCountResult[0]?.count ?? 0;
  const tier = (sub?.tier ?? 'free') as SubscriptionTier;
  const tierConfig = BILLING_CONFIG.tiers[tier];

  return {
    tier,
    status: sub?.status ?? 'active',
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    stripeCustomerId: sub?.stripeCustomerId ?? null,
    limits: {
      maxMaps: tierConfig.maxMaps,
      currentMaps: mapCount,
      canCreateMap: mapCount < tierConfig.maxMaps,
      hasWatermark: tierConfig.hasWatermark,
    },
  };
}

/**
 * Check if user can create a new map (within their tier limit)
 */
export async function canCreateMap(userId: string): Promise<boolean> {
  const subInfo = await getUserSubscription(userId);
  return subInfo.limits.canCreateMap;
}

/**
 * Check if resume should have watermark based on subscription tier
 */
export async function shouldHaveWatermark(userId: string): Promise<boolean> {
  const subInfo = await getUserSubscription(userId);
  return subInfo.limits.hasWatermark;
}

/**
 * Get or create Stripe customer for user
 */
export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  // Check existing subscription for customer ID
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  if (sub?.stripeCustomerId) {
    return sub.stripeCustomerId;
  }

  // Get user details
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    metadata: {
      userId: user.id,
    },
  });

  // Upsert subscription record with customer ID
  await db
    .insert(subscriptions)
    .values({
      userId,
      stripeCustomerId: customer.id,
      tier: 'free',
      status: 'active',
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeCustomerId: customer.id,
        updatedAt: new Date(),
      },
    });

  return customer.id;
}

/**
 * Get active Stripe subscription for a user (if any)
 * Returns the full Stripe subscription object for upgrades/downgrades
 */
export async function getActiveSubscription(userId: string): Promise<Stripe.Subscription | null> {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  if (!sub?.stripeSubscriptionId) {
    return null;
  }

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);

    // Only return if subscription is active or trialing
    if (stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing') {
      return stripeSubscription;
    }

    return null;
  } catch (error) {
    // Subscription might have been deleted in Stripe
    console.error('Error retrieving Stripe subscription:', error);
    return null;
  }
}

/**
 * Handle subscription created webhook event
 */
export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    console.error('No price ID found in subscription');
    return;
  }

  const tier = getTierFromPriceId(priceId);

  // Find subscription record by customer ID
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeCustomerId, customerId),
  });

  if (!sub) {
    console.error('No subscription record found for customer:', customerId);
    return;
  }

  // Update subscription record
  // current_period_end is on the subscription item, not the subscription itself
  const subscriptionItem = subscription.items.data[0];
  await db
    .update(subscriptions)
    .set({
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      tier,
      status: subscription.status,
      currentPeriodEnd: subscriptionItem?.current_period_end
        ? new Date(subscriptionItem.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));

  // Grant monthly credits for the tier
  const monthlyCredits = BILLING_CONFIG.tiers[tier].monthlyCredits;
  if (monthlyCredits > 0) {
    await addCredits(
      sub.userId,
      monthlyCredits,
      'subscription',
      `${tier}_subscription_credits`,
      { tier, subscriptionId: subscription.id }
    );
  }
}

/**
 * Handle subscription updated webhook event
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    console.error('No price ID found in subscription update');
    return;
  }

  const tier = getTierFromPriceId(priceId);
  const subscriptionItem = subscription.items.data[0];

  await db
    .update(subscriptions)
    .set({
      stripePriceId: priceId,
      tier,
      status: subscription.status,
      currentPeriodEnd: subscriptionItem?.current_period_end
        ? new Date(subscriptionItem.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));
}

/**
 * Handle subscription deleted/canceled webhook event
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = subscription.customer as string;

  await db
    .update(subscriptions)
    .set({
      tier: 'free',
      status: 'canceled',
      stripeSubscriptionId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));
}

/**
 * Handle invoice paid webhook event (for subscription renewals)
 */
export async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  // Only grant credits for subscription renewals, not initial payment
  if (invoice.billing_reason !== 'subscription_cycle') {
    return;
  }

  const customerId = invoice.customer as string;
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeCustomerId, customerId),
  });

  if (!sub || sub.tier === 'free') {
    return;
  }

  const tier = sub.tier as SubscriptionTier;
  const monthlyCredits = BILLING_CONFIG.tiers[tier].monthlyCredits;

  if (monthlyCredits > 0) {
    await addCredits(
      sub.userId,
      monthlyCredits,
      'subscription',
      `${tier}_renewal_credits`,
      { tier, invoiceId: invoice.id }
    );
  }
}

/**
 * Handle invoice payment failed webhook event
 */
export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;

  await db
    .update(subscriptions)
    .set({
      status: 'past_due',
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));
}
