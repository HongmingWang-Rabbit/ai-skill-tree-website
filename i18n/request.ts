import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

// All available namespaces - add new namespaces here when creating new translation files
const namespaces = [
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

export type Namespace = (typeof namespaces)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate that the incoming locale is valid
  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale;
  }

  // Load and merge all namespace files
  const messages = Object.fromEntries(
    await Promise.all(
      namespaces.map(async (ns) => [
        ns,
        (await import(`../locales/${locale}/${ns}.json`)).default,
      ])
    )
  );

  return {
    locale,
    messages,
  };
});
