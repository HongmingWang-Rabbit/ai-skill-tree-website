import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { routing, locales, getOgLocale, getLocaleUrl } from '@/i18n/routing';
import { AuthProvider, Web3Provider, QueryProvider } from '@/components/providers';
import { Header } from '@/components/layout';
import { JsonLd, OrganizationJsonLd, SoftwareAppJsonLd } from '@/components/seo';
import { Toaster } from '@/components/ui';
import { SITE_URL } from '@/lib/constants';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  // Generate alternate language links for hreflang (respects as-needed locale prefix)
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = getLocaleUrl(SITE_URL, loc);
  }
  // x-default points to root URL (English content without locale prefix)
  languages['x-default'] = SITE_URL.endsWith('/') ? SITE_URL.slice(0, -1) : SITE_URL;

  const currentUrl = getLocaleUrl(SITE_URL, locale);

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    alternates: {
      canonical: currentUrl,
      languages,
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: currentUrl,
      locale: getOgLocale(locale),
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => getOgLocale(l)),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await params first, then extract locale
  const { locale } = await params;

  // Validate that the incoming locale is valid using next-intl's hasLocale
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering - must be called before any next-intl functions
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <JsonLd type="website" />
        <OrganizationJsonLd />
        <SoftwareAppJsonLd />
      </head>
      <body className="antialiased bg-slate-950 min-h-screen" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <AuthProvider>
              <Web3Provider>
                <Toaster />
                <Header />
                <main>{children}</main>
              </Web3Provider>
            </AuthProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
