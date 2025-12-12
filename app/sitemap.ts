import { MetadataRoute } from 'next';
import { locales } from '@/i18n/routing';
import { db } from '@/lib/db';
import { careers } from '@/lib/db/schema';
import { SITE_URL } from '@/lib/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Add homepage for each locale
  for (const locale of locales) {
    entries.push({
      url: `${SITE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${SITE_URL}/${l}`])
        ),
      },
    });

    // Add dashboard page for each locale
    entries.push({
      url: `${SITE_URL}/${locale}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${SITE_URL}/${l}/dashboard`])
        ),
      },
    });
  }

  // Fetch all public careers from database
  try {
    const allCareers = await db
      .select({
        canonicalKey: careers.canonicalKey,
        locale: careers.locale,
        generatedAt: careers.generatedAt,
      })
      .from(careers);

    // Group careers by canonicalKey to create proper alternates
    const careersByKey = new Map<string, { locale: string; generatedAt: Date | null }[]>();
    for (const career of allCareers) {
      const existing = careersByKey.get(career.canonicalKey) || [];
      existing.push({ locale: career.locale, generatedAt: career.generatedAt });
      careersByKey.set(career.canonicalKey, existing);
    }

    // Add career pages with proper alternates
    for (const [canonicalKey, localeData] of careersByKey) {
      // Get the most recent generation date
      const lastModified = localeData.reduce((latest, curr) => {
        if (!curr.generatedAt) return latest;
        return curr.generatedAt > latest ? curr.generatedAt : latest;
      }, new Date(0));

      // Add entry for each locale this career exists in
      for (const { locale } of localeData) {
        const alternateLanguages: Record<string, string> = {};
        for (const { locale: altLocale } of localeData) {
          alternateLanguages[altLocale] = `${SITE_URL}/${altLocale}/career/${canonicalKey}`;
        }

        entries.push({
          url: `${SITE_URL}/${locale}/career/${canonicalKey}`,
          lastModified: lastModified > new Date(0) ? lastModified : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: {
            languages: alternateLanguages,
          },
        });
      }
    }
  } catch (error) {
    // If database query fails, just return static pages
    console.error('Failed to fetch careers for sitemap:', error);
  }

  return entries;
}
