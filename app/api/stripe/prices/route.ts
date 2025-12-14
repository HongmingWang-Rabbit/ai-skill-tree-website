import { NextResponse } from 'next/server';
import { stripe, getStripe } from '@/lib/stripe';
import { BILLING_CONFIG } from '@/lib/constants';

export interface StripePriceInfo {
  id: string;
  productKey: string;
  unitAmount: number | null;
  currency: string;
  interval: 'month' | 'year' | null;
  active: boolean;
}

export interface StripePricesResponse {
  success: boolean;
  data?: {
    subscriptions: {
      proMonthly: StripePriceInfo | null;
      proYearly: StripePriceInfo | null;
      premiumMonthly: StripePriceInfo | null;
      premiumYearly: StripePriceInfo | null;
    };
    creditPacks: {
      credits500: StripePriceInfo | null;
      credits2000: StripePriceInfo | null;
      credits5000: StripePriceInfo | null;
    };
  };
  error?: string;
}

// Map environment price IDs to product keys
const PRICE_ID_TO_KEY: Record<string, string> = {};

function initializePriceMapping() {
  const { stripePrices } = BILLING_CONFIG;
  if (stripePrices.proMonthly) PRICE_ID_TO_KEY[stripePrices.proMonthly] = 'proMonthly';
  if (stripePrices.proYearly) PRICE_ID_TO_KEY[stripePrices.proYearly] = 'proYearly';
  if (stripePrices.premiumMonthly) PRICE_ID_TO_KEY[stripePrices.premiumMonthly] = 'premiumMonthly';
  if (stripePrices.premiumYearly) PRICE_ID_TO_KEY[stripePrices.premiumYearly] = 'premiumYearly';
  if (stripePrices.credits500) PRICE_ID_TO_KEY[stripePrices.credits500] = 'credits500';
  if (stripePrices.credits2000) PRICE_ID_TO_KEY[stripePrices.credits2000] = 'credits2000';
  if (stripePrices.credits5000) PRICE_ID_TO_KEY[stripePrices.credits5000] = 'credits5000';
}

export async function GET() {
  try {
    // Ensure Stripe is initialized
    try {
      getStripe();
    } catch (initError) {
      console.error('Stripe initialization error:', initError);
      return NextResponse.json({
        success: false,
        error: initError instanceof Error ? initError.message : 'Failed to initialize Stripe',
      }, { status: 500 });
    }

    // Initialize price mapping
    initializePriceMapping();

    // Get all configured price IDs
    const priceIds = Object.keys(PRICE_ID_TO_KEY);

    if (priceIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No Stripe prices configured',
      }, { status: 500 });
    }

    // Fetch all prices from Stripe in parallel
    const pricePromises = priceIds.map(async (priceId) => {
      try {
        const price = await stripe.prices.retrieve(priceId);
        return {
          id: price.id,
          productKey: PRICE_ID_TO_KEY[priceId],
          unitAmount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval || null,
          active: price.active,
        } as StripePriceInfo;
      } catch (err) {
        // Log the error for debugging
        console.error(`Failed to fetch price ${priceId}:`, err instanceof Error ? err.message : err);
        return null;
      }
    });

    const prices = await Promise.all(pricePromises);

    // Organize prices by category
    const result: StripePricesResponse['data'] = {
      subscriptions: {
        proMonthly: null,
        proYearly: null,
        premiumMonthly: null,
        premiumYearly: null,
      },
      creditPacks: {
        credits500: null,
        credits2000: null,
        credits5000: null,
      },
    };

    for (const price of prices) {
      if (!price) continue;

      if (price.productKey.startsWith('pro') || price.productKey.startsWith('premium')) {
        result.subscriptions[price.productKey as keyof typeof result.subscriptions] = price;
      } else if (price.productKey.startsWith('credits')) {
        result.creditPacks[price.productKey as keyof typeof result.creditPacks] = price;
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching Stripe prices:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch prices',
    }, { status: 500 });
  }
}
