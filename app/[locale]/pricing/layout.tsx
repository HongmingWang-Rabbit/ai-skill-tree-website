import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales, getLocaleUrl } from '@/i18n/routing';
import { SITE_URL, APP_NAME } from '@/lib/constants';

interface Props {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  const title = t('pricingTitle');
  const description = t('pricingDescription');

  // Generate alternate language links (respects as-needed locale prefix)
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = getLocaleUrl(SITE_URL, loc, '/pricing');
  }
  // x-default points to English version (root URL for default locale)
  languages['x-default'] = getLocaleUrl(SITE_URL, 'en', '/pricing');

  const currentUrl = getLocaleUrl(SITE_URL, locale, '/pricing');

  return {
    title,
    description,
    alternates: {
      canonical: currentUrl,
      languages,
    },
    openGraph: {
      title,
      description,
      url: currentUrl,
      siteName: APP_NAME,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function PricingLayout({ children }: Props) {
  return <>{children}</>;
}
