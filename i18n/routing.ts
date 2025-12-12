import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'zh', 'ja'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // Disable locale detection to prevent cookie-based locale from conflicting
  // with URL-based locale, which can cause hydration mismatches.
  // The locale is always determined by the URL prefix.
  localeDetection: false,
});
