import { getRequestConfig } from 'next-intl/server';
import { routing, i18nNamespaces } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate that the incoming locale is valid
  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale;
  }

  // Load and merge all namespace files from /locales/{locale}/
  const messages = Object.fromEntries(
    await Promise.all(
      i18nNamespaces.map(async (ns) => [
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
