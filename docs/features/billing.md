# Billing & Credit System

Credit-based billing system integrated with Stripe for payments.

## Subscription Tiers

| Tier | Max Maps | Watermark | Monthly Credits |
|------|----------|-----------|-----------------|
| Free | 1 | Yes | 0 |
| Pro | Unlimited | No | 1000 |
| Premium | Unlimited | No | 3000 |

## Credit System

- New users receive 500 credits ($5 worth) on signup
- AI operations consume credits based on token usage (see `BILLING_CONFIG.creditCosts`)
- Credits are deducted after successful operations (not on failed attempts)
- All transactions recorded in `creditTransactions` table for audit trail

## Key Files

- `lib/stripe.ts` - Stripe client with lazy initialization
- `lib/credits.ts` - Credit management (check, deduct, add, history)
- `lib/subscription.ts` - Subscription management and webhook handlers
- `lib/constants.ts` - `BILLING_CONFIG` with tier definitions and credit costs

## API Routes

- `POST /api/stripe/checkout` - Create checkout session
  - Handles upgrades/downgrades via `stripe.subscriptions.update()`
  - Returns `{ upgraded: true, redirectUrl }` for immediate changes
- `POST /api/stripe/webhook` - Handle Stripe events
  - Events: `customer.subscription.*`, `invoice.*`, `checkout.session.completed`
  - **Local dev**: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- `POST /api/stripe/portal` - Create billing portal session
- `GET /api/stripe/prices` - Fetch prices (cached 10 min)
- `GET /api/user/credits` - Get balance and history
- `GET /api/user/subscription` - Get subscription info (`maxMaps=-1` for unlimited)

## Database Schema

```typescript
subscriptions: {
  userId: uuid,
  stripeCustomerId: text,
  stripeSubscriptionId: text,
  stripePriceId: text,
  tier: 'free' | 'pro' | 'premium',
  status: 'active' | 'canceled' | 'past_due' | 'paused',
  currentPeriodEnd: timestamp,
  cancelAtPeriodEnd: boolean,
}

credits: {
  userId: uuid,
  balance: integer, // default: 500
}

creditTransactions: {
  userId: uuid,
  amount: integer, // negative = deduction
  balanceAfter: integer,
  type: 'usage' | 'purchase' | 'subscription' | 'bonus' | 'refund',
  operation: string,
  metadata: jsonb,
}
```

## Integrating Credit Checks

```typescript
import { hasEnoughCredits, deductCredits } from '@/lib/credits';

// Before operation
const creditCheck = await hasEnoughCredits(userId, 'ai_generate');
if (!creditCheck.sufficient) {
  return NextResponse.json({
    error: 'Insufficient credits',
    code: 'INSUFFICIENT_CREDITS',
    creditsRequired: creditCheck.required,
    creditsBalance: creditCheck.balance,
  }, { status: 402 });
}

// After success
const { newBalance } = await deductCredits(userId, 'ai_generate', { query });
```

## Checking Subscription Limits

```typescript
import { canCreateMap, shouldHaveWatermark } from '@/lib/subscription';

const allowed = await canCreateMap(userId);
const hasWatermark = await shouldHaveWatermark(userId);
```

## Handling Unlimited Maps on Client

```typescript
const isUnlimited = subscription.limits.maxMaps === -1;
const displayLimit = isUnlimited ? '∞' : subscription.limits.maxMaps;
```

## Pricing Page

- Shows tiers with prices from Stripe API
- "Your Current Plan" section with manage/update buttons
- URL params: `?upgraded=true`, `?portal=true` for data refresh
- Uses Suspense boundary for `useSearchParams`

## Configuration

`BILLING_CONFIG` in constants:
- `tiers`: Tier definitions with limits
- `creditCosts`: Credit cost per operation
- `signupBonus`: 500 credits
- `creditPacks`: [500, 2000, 5000]
- `stripePrices`: Price IDs from env vars (server-side only)
