import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales, defaultLocale } from '@/i18n/routing';
import { SITE_URL } from '@/lib/constants';

interface Props {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  const title = t('pricingTitle');
  const description = t('pricingDescription');

  // Generate alternate language links
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${SITE_URL}/${loc}/pricing`;
  }
  languages['x-default'] = `${SITE_URL}/${defaultLocale}/pricing`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/pricing`,
      languages,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/pricing`,
      siteName: 'Personal Skill Map',
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
