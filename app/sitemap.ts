import { MetadataRoute } from 'next';
import { locales, getLocaleUrl as getLocaleUrlBase } from '@/i18n/routing';
import { db } from '@/lib/db';
import { careers } from '@/lib/db/schema';
import { SITE_URL } from '@/lib/constants';
import { getAllBlogSlugs, getBlogPost } from '@/lib/blog';

// Bind SITE_URL to the centralized helper for convenience
const getLocaleUrl = (locale: string, path: string = '') =>
  getLocaleUrlBase(SITE_URL, locale, path);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Add homepage for each locale
  for (const locale of locales) {
    entries.push({
      url: getLocaleUrl(locale),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, getLocaleUrl(l)])
        ),
      },
    });

    // Note: /dashboard is excluded - it's a private authenticated page blocked by robots.txt

    // Add pricing page for each locale
    entries.push({
      url: getLocaleUrl(locale, '/pricing'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, getLocaleUrl(l, '/pricing')])
        ),
      },
    });

    // Add blog index page for each locale
    entries.push({
      url: getLocaleUrl(locale, '/blog'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, getLocaleUrl(l, '/blog')])
        ),
      },
    });
  }

  // Add blog posts
  const blogSlugs = getAllBlogSlugs();
  for (const { slug, locales: postLocales } of blogSlugs) {
    for (const locale of postLocales) {
      const post = getBlogPost(slug, locale);
      const alternateLanguages: Record<string, string> = {};
      for (const altLocale of postLocales) {
        alternateLanguages[altLocale] = getLocaleUrl(altLocale, `/blog/${slug}`);
      }

      entries.push({
        url: getLocaleUrl(locale, `/blog/${slug}`),
        lastModified: post?.date ? new Date(post.date) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: {
          languages: alternateLanguages,
        },
      });
    }
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
          alternateLanguages[altLocale] = getLocaleUrl(altLocale, `/career/${canonicalKey}`);
        }

        entries.push({
          url: getLocaleUrl(locale, `/career/${canonicalKey}`),
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
