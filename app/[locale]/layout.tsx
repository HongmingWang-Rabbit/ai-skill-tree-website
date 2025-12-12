import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { AuthProvider, Web3Provider } from '@/components/providers';
import { Header } from '@/components/layout';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
      <body className="antialiased bg-slate-950 min-h-screen" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <Web3Provider>
              <Header />
              <main>{children}</main>
            </Web3Provider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
