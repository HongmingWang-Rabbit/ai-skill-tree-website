import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales, getLocaleUrl } from '@/i18n/routing';
import { SITE_URL, APP_NAME } from '@/lib/constants';
import { JsonLd } from '@/components/seo';

// Force static generation for blog layout
export const dynamic = 'force-static';

interface Props {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });

  const title = t('title');
  const description = t('description');

  // Generate alternate language links
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = getLocaleUrl(SITE_URL, loc, '/blog');
  }
  languages['x-default'] = getLocaleUrl(SITE_URL, 'en', '/blog');

  const currentUrl = getLocaleUrl(SITE_URL, locale, '/blog');

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

export default async function BlogLayout({ children, params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <>
      {/* Breadcrumb Schema */}
      <JsonLd
        type="breadcrumb"
        data={{
          breadcrumbs: [
            { name: t('home'), url: getLocaleUrl(SITE_URL, locale) },
            { name: t('blog'), url: getLocaleUrl(SITE_URL, locale, '/blog') },
          ],
        }}
      />
      {children}
    </>
  );
}
