'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useUserSubscription, useUserCredits, useStripePrices, formatStripePrice } from '@/hooks/useQueryHooks';
import { showToast } from '@/components/ui';
import { BILLING_CONFIG, API_ROUTES } from '@/lib/constants';
import { useSearchParams } from 'next/navigation';

type BillingInterval = 'monthly' | 'yearly';

// Separate component to handle search params (needs Suspense boundary)
function PricingRefetchHandler({
  refetchSubscription,
  refetchCredits,
}: {
  refetchSubscription: () => void;
  refetchCredits: () => void;
}) {
  const searchParams = useSearchParams();
  const t = useTranslations('pricing');
  const router = useRouter();

  useEffect(() => {
    const upgraded = searchParams.get('upgraded');
    const fromPortal = searchParams.get('portal');

    if (upgraded === 'true') {
      showToast.success(t('planUpdated'));
      refetchSubscription();
      refetchCredits();
      router.replace('/pricing');
    } else if (fromPortal === 'true') {
      // Returning from Stripe Portal - refetch to get updated data
      refetchSubscription();
      refetchCredits();
      router.replace('/pricing');
    }
  }, [searchParams, t, refetchSubscription, refetchCredits, router]);

  return null;
}

export default function PricingPage() {
  const { data: session } = useSession();
  const t = useTranslations('pricing');
  const locale = useLocale();
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const { data: subscription, isLoading: isLoadingSubscription, refetch: refetchSubscription } = useUserSubscription(!!session?.user?.id);
  const { data: creditsData, isLoading: isLoadingCredits, refetch: refetchCredits } = useUserCredits(!!session?.user?.id);
  const { data: prices } = useStripePrices();

  const handleSubscribe = async (priceId: string | null | undefined) => {
    if (!priceId) {
      showToast.error(t('priceNotConfigured'));
      return;
    }

    if (!session) {
      router.push('/?signin=true');
      return;
    }

    setLoadingPriceId(priceId);
    try {
      const response = await fetch(API_ROUTES.STRIPE_CHECKOUT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, locale }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('checkoutFailed'));
      }

      // Check if this was an upgrade/downgrade (no redirect needed)
      if (data.upgraded) {
        showToast.success(t('planUpdated'));
        setLoadingPriceId(null);
        // Refresh the page to show updated subscription
        window.location.reload();
        return;
      }

      // Redirect to Stripe Checkout for new subscriptions
      window.location.href = data.url;
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : t('checkoutFailed'));
      setLoadingPriceId(null);
    }
  };

  const handleManageBilling = async () => {
    if (!session) {
      router.push('/?signin=true');
      return;
    }

    try {
      const response = await fetch(API_ROUTES.STRIPE_PORTAL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('portalFailed'));
      }

      window.location.href = data.url;
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : t('portalFailed'));
    }
  };

  const currentTier = subscription?.tier || 'free';

  // Get dynamic prices from Stripe, with fallback for when Stripe isn't configured
  const getSubscriptionPrice = (tier: 'pro' | 'premium', interval: BillingInterval) => {
    const key = `${tier}${interval === 'monthly' ? 'Monthly' : 'Yearly'}` as 'proMonthly' | 'proYearly' | 'premiumMonthly' | 'premiumYearly';

    // If we have Stripe prices, use them
    if (prices?.subscriptions?.[key]?.unitAmount) {
      const price = prices.subscriptions[key];
      return formatStripePrice(price?.unitAmount, price?.currency);
    }

    // Fallback to display prices when Stripe isn't configured
    return BILLING_CONFIG.fallbackPrices[key];
  };

  // Get price ID from Stripe API response (not from env vars which aren't available client-side)
  const getSubscriptionPriceId = (tier: 'pro' | 'premium', interval: BillingInterval): string | null => {
    const key = `${tier}${interval === 'monthly' ? 'Monthly' : 'Yearly'}` as 'proMonthly' | 'proYearly' | 'premiumMonthly' | 'premiumYearly';
    return prices?.subscriptions?.[key]?.id || null;
  };

  const getCreditPackPrice = (packKey: 'credits500' | 'credits2000' | 'credits5000') => {
    // If we have Stripe prices, use them
    if (prices?.creditPacks?.[packKey]?.unitAmount) {
      const price = prices.creditPacks[packKey];
      return formatStripePrice(price?.unitAmount, price?.currency);
    }

    // Fallback to display prices when Stripe isn't configured
    return BILLING_CONFIG.fallbackPrices[packKey];
  };

  // Get credit pack price ID from Stripe API response
  const getCreditPackPriceId = (packKey: 'credits500' | 'credits2000' | 'credits5000'): string | null => {
    return prices?.creditPacks?.[packKey]?.id || null;
  };

  const tiers = [
    {
      id: 'free',
      name: t('free.name'),
      description: t('free.description'),
      price: BILLING_CONFIG.fallbackPrices.free,
      priceId: null,
      features: t.raw('free.features') as string[],
      highlighted: false,
    },
    {
      id: 'pro',
      name: t('pro.name'),
      description: t('pro.description'),
      price: getSubscriptionPrice('pro', billingInterval),
      priceId: getSubscriptionPriceId('pro', billingInterval),
      features: t.raw('pro.features') as string[],
      highlighted: true,
    },
    {
      id: 'premium',
      name: t('premium.name'),
      description: t('premium.description'),
      price: getSubscriptionPrice('premium', billingInterval),
      priceId: getSubscriptionPriceId('premium', billingInterval),
      features: t.raw('premium.features') as string[],
      highlighted: false,
    },
  ];

  const creditPacks = [
    {
      id: 'credits500',
      name: t('credits500'),
      price: getCreditPackPrice('credits500'),
      priceId: getCreditPackPriceId('credits500'),
      save: null,
    },
    {
      id: 'credits2000',
      name: t('credits2000'),
      price: getCreditPackPrice('credits2000'),
      priceId: getCreditPackPriceId('credits2000'),
      save: t('credits2000Save'),
    },
    {
      id: 'credits5000',
      name: t('credits5000'),
      price: getCreditPackPrice('credits5000'),
      priceId: getCreditPackPriceId('credits5000'),
      save: t('credits5000Save'),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-12">
      {/* Handle URL params from Stripe Portal/upgrade returns */}
      <Suspense fallback={null}>
        <PricingRefetchHandler
          refetchSubscription={refetchSubscription}
          refetchCredits={refetchCredits}
        />
      </Suspense>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">{t('title')}</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">{t('subtitle')}</p>
        </div>

        {/* Current Status Section - Only shown for logged in users */}
        {session && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-12">
            <h2 className="text-lg font-semibold text-white mb-4">{t('currentStatus')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Subscription Status */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">{t('subscription')}</p>
                {isLoadingSubscription ? (
                  <div className="h-6 w-20 bg-slate-700 rounded animate-pulse" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white capitalize">
                      {subscription?.tier || 'Free'}
                    </span>
                    {subscription?.tier !== 'free' && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        subscription?.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {subscription?.status}
                      </span>
                    )}
                  </div>
                )}
                {subscription?.currentPeriodEnd && subscription?.tier !== 'free' && (
                  <p className="text-xs text-slate-400 mt-1">
                    {subscription?.cancelAtPeriodEnd ? t('expiresOn') : t('renewsOn')}{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Credits Balance */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">{t('creditsBalance')}</p>
                {isLoadingCredits ? (
                  <div className="h-6 w-20 bg-slate-700 rounded animate-pulse" />
                ) : (
                  <p className="text-xl font-bold text-amber-400">
                    {creditsData?.balance?.toLocaleString() ?? 0}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">{t('creditsAvailable')}</p>
              </div>

              {/* Manage Actions */}
              <div className="bg-slate-800/50 rounded-xl p-4 flex flex-col justify-center gap-2">
                {subscription?.tier !== 'free' && (
                  <button
                    onClick={handleManageBilling}
                    className="w-full py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    {t('manageSubscription')}
                  </button>
                )}
                <button
                  onClick={handleManageBilling}
                  className="w-full py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  {t('updatePaymentMethod')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-800 rounded-full p-1 flex gap-1">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingInterval === 'monthly'
                  ? 'bg-amber-500 text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('monthly')}
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                billingInterval === 'yearly'
                  ? 'bg-amber-500 text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('yearly')}
              <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                {t('yearlyDiscount')}
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier) => {
            const isCurrentTier = currentTier === tier.id;
            const isLoading = loadingPriceId === tier.priceId;

            return (
              <div
                key={tier.id}
                className={`relative bg-slate-900/50 border rounded-2xl p-8 ${
                  tier.highlighted
                    ? 'border-amber-500 ring-2 ring-amber-500/20'
                    : 'border-slate-800'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-500 text-slate-900 text-xs font-semibold px-3 py-1 rounded-full">
                      {t('mostPopular')}
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{tier.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-white">{tier.price}</span>
                    {tier.id !== 'free' && (
                      <span className="text-slate-400">
                        {billingInterval === 'monthly' ? t('perMonth') : t('perYear')}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {tier.id === 'free' ? (
                  isCurrentTier ? (
                    <div className="w-full py-3 text-center text-slate-400 bg-slate-800 rounded-lg">
                      {t('currentPlan')}
                    </div>
                  ) : (
                    <Link
                      href="/dashboard"
                      className="block w-full py-3 text-center text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      {t('getStarted')}
                    </Link>
                  )
                ) : isCurrentTier ? (
                  <button
                    onClick={handleManageBilling}
                    className="w-full py-3 text-center text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    {t('currentPlan')}
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(tier.priceId)}
                    disabled={isLoading}
                    className={`w-full py-3 text-center font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                      tier.highlighted
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-900'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      </span>
                    ) : (
                      t('subscribe')
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Credit Packs */}
        <div id="credits" className="scroll-mt-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">{t('creditsTitle')}</h2>
            <p className="text-slate-400">{t('creditsSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-16">
            {creditPacks.map((pack) => {
              const isLoading = loadingPriceId === pack.priceId;

              return (
                <div
                  key={pack.id}
                  className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">{pack.name}</h3>
                  <div className="text-2xl font-bold text-amber-400 mb-1">{pack.price}</div>
                  <div className="h-5">
                    {pack.save && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                        {pack.save}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleSubscribe(pack.priceId)}
                    disabled={isLoading || !session}
                    className="w-full mt-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      </span>
                    ) : !session ? (
                      t('signInRequired')
                    ) : (
                      t('buyNow')
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">{t('faq.title')}</h2>
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">{t('faq.q1')}</h3>
              <p className="text-slate-400 text-sm">{t('faq.a1')}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">{t('faq.q2')}</h3>
              <p className="text-slate-400 text-sm">{t('faq.a2')}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">{t('faq.q3')}</h3>
              <p className="text-slate-400 text-sm">{t('faq.a3')}</p>
            </div>
          </div>
        </div>

        {/* Manage Billing Link */}
        {session && subscription?.tier !== 'free' && (
          <div className="text-center mt-12">
            <button
              onClick={handleManageBilling}
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              {t('manageBilling')} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
