import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { getOrCreateStripeCustomer } from '@/lib/subscription';
import { SITE_URL } from '@/lib/constants';
import { locales, defaultLocale, type Locale } from '@/i18n/routing';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const locale: Locale = locales.includes(body.locale) ? body.locale : defaultLocale;

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(session.user.id);

    // Create billing portal session
    // Return to pricing page with portal=true so it refetches subscription data
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${SITE_URL}/${locale}/pricing?portal=true`,
    });

    return NextResponse.json({
      success: true,
      url: portalSession.url,
    });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
