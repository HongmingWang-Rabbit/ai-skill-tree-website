import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, isSubscriptionPriceId } from '@/lib/stripe';
import { getOrCreateStripeCustomer, getActiveSubscription } from '@/lib/subscription';
import { SITE_URL } from '@/lib/constants';
import { locales, defaultLocale } from '@/i18n/routing';
import { z } from 'zod';

const CheckoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  locale: z.enum([...locales] as [string, ...string[]]).default(defaultLocale),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = CheckoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { priceId, locale } = validation.data;

    // Determine if this is a subscription or one-time payment
    const isSubscription = isSubscriptionPriceId(priceId);

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(session.user.id);

    // For subscriptions, check if user already has an active subscription
    if (isSubscription) {
      const existingSubscription = await getActiveSubscription(session.user.id);

      if (existingSubscription) {
        // User already has a subscription - update it instead of creating new one
        // This handles upgrades and downgrades
        const subscriptionItem = existingSubscription.items.data[0];

        if (subscriptionItem.price.id === priceId) {
          // Already on this plan
          return NextResponse.json(
            { error: 'You are already subscribed to this plan' },
            { status: 400 }
          );
        }

        // Update the subscription to the new price
        // proration_behavior: 'create_prorations' charges/credits the difference
        await stripe.subscriptions.update(existingSubscription.id, {
          items: [
            {
              id: subscriptionItem.id,
              price: priceId,
            },
          ],
          proration_behavior: 'create_prorations',
          metadata: {
            userId: session.user.id,
          },
        });

        return NextResponse.json({
          success: true,
          upgraded: true,
          message: 'Subscription updated successfully',
          redirectUrl: `${SITE_URL}/${locale}/pricing?upgraded=true`,
        });
      }
    }

    // No existing subscription or this is a one-time payment - create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isSubscription ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${SITE_URL}/${locale}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/${locale}/pricing?checkout=canceled`,
      metadata: {
        userId: session.user.id,
        priceId,
      },
      ...(isSubscription && {
        subscription_data: {
          metadata: {
            userId: session.user.id,
          },
        },
      }),
    });

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('Checkout error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
