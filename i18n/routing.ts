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
 * Constructs a locale-prefixed path respecting the 'as-needed' locale prefix mode.
 * Default locale (English) gets no prefix; other locales get /{locale} prefix.
 * Use this when next-intl's Link/router can't be used (e.g., NextAuth callbacks, metadata).
 * @param locale - Current locale (from useLocale())
 * @param path - Path to prefix (should start with "/", e.g., "/dashboard")
 * @returns Path with locale prefix only for non-default locales
 */
export function getLocalePath(locale: string, path: string = '/'): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // Default locale: no prefix (as-needed mode)
  if (locale === defaultLocale) {
    return normalizedPath;
  }
  // Other locales: add prefix
  if (normalizedPath === '/') {
    return `/${locale}`;
  }
  return `/${locale}${normalizedPath}`;
}

/**
 * Constructs a full URL with locale prefix respecting the 'as-needed' mode.
 * Default locale (English) uses root URL; other locales get /{locale} prefix.
 * @param baseUrl - Base URL (e.g., SITE_URL)
 * @param locale - Locale code
 * @param path - Optional path (should start with "/")
 * @returns Full URL with appropriate locale prefix
 */
export function getLocaleUrl(baseUrl: string, locale: string, path: string = ''): string {
  // Ensure baseUrl doesn't have trailing slash
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  if (locale === defaultLocale) {
    return path ? `${cleanBaseUrl}${path}` : cleanBaseUrl;
  }
  return `${cleanBaseUrl}/${locale}${path}`;
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  // Disable locale detection to prevent cookie-based locale from conflicting
  // with URL-based locale, which can cause hydration mismatches.
  // The locale is always determined by the URL prefix.
  localeDetection: false,
});
