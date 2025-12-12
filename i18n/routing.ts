import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'zh', 'ja'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

// Mapping from app locales to Open Graph locale codes
export const ogLocaleMap: Record<Locale, string> = {
  en: 'en_US',
  zh: 'zh_CN',
  ja: 'ja_JP',
};

// Helper to get OG locale from app locale
export function getOgLocale(locale: string): string {
  return ogLocaleMap[locale as Locale] || 'en_US';
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // Disable locale detection to prevent cookie-based locale from conflicting
  // with URL-based locale, which can cause hydration mismatches.
  // The locale is always determined by the URL prefix.
  localeDetection: false,
});
