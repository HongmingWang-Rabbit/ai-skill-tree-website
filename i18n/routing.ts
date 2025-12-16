import { defineRouting } from 'next-intl/routing';

// Supported locales - add new locales here and create corresponding folder in /locales
export const locales = ['en', 'zh', 'ja'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

// Translation namespaces - add new namespaces here when creating new translation files
// Each namespace corresponds to a JSON file in /locales/{locale}/{namespace}.json
export const i18nNamespaces = [
  'common',
  'header',
  'home',
  'career',
  'dashboard',
  'featuredCareers',
  'languageSwitcher',
  'auth',
  'masterMap',
  'seo',
  'skillGraph',
  'aiChat',
  'import',
  'resume',
  'coverLetter',
  'learning',
  'billing',
  'pricing',
] as const;
export type I18nNamespace = (typeof i18nNamespaces)[number];

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

/**
 * Constructs a locale-prefixed path for use in auth callbacks (signIn/signOut).
 * Use this when next-intl's Link/router can't be used (e.g., NextAuth callbacks).
 * @param locale - Current locale (from useLocale())
 * @param path - Path to prefix (should start with "/", e.g., "/dashboard")
 * @returns Locale-prefixed path (e.g., "/zh/dashboard")
 */
export function getLocalePath(locale: string, path: string = '/'): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // For root path, just return /{locale}
  if (normalizedPath === '/') {
    return `/${locale}`;
  }
  return `/${locale}${normalizedPath}`;
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
