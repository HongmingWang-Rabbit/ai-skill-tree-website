import { MetadataRoute } from 'next';
import { SITE_URL, SEO_CONFIG } from '@/lib/constants';

export default function robots(): MetadataRoute.Robots {
  // Spread readonly arrays to make them mutable for Next.js types
  const disallowedPaths = [...SEO_CONFIG.disallowedPaths];

  // Generate rules for AI crawlers from config
  const aiCrawlerRules = SEO_CONFIG.aiCrawlers.map((userAgent) => ({
    userAgent,
    allow: '/',
    disallow: disallowedPaths,
  }));

  return {
    rules: [
      // Default rules for all crawlers
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowedPaths,
      },
      // AI Search Engines - allow access to public content
      ...aiCrawlerRules,
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
