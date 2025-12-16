# SEO & Multi-locale Support

Comprehensive SEO with multi-locale support and GEO (Generative Engine Optimization) for AI search engines.

## Key Files

- `app/layout.tsx` - Root metadata (Open Graph, Twitter cards, robots)
- `app/[locale]/layout.tsx` - Locale-specific metadata, hreflang alternates, JSON-LD
- `app/[locale]/career/[careerId]/layout.tsx` - Career page metadata, Course/Breadcrumb schemas
- `app/[locale]/(marketing)/layout.tsx` - Landing page FAQ/HowTo schemas
- `app/sitemap.ts` - Dynamic sitemap with all locales
- `app/robots.ts` - Robots.txt with AI crawler rules
- `components/seo/JsonLd.tsx` - JSON-LD components

## JSON-LD Schemas

- `JsonLd type="website"` - WebSite with SearchAction
- `JsonLd type="career"` - Course schema for skill maps
- `JsonLd type="breadcrumb"` - BreadcrumbList navigation
- `JsonLd type="faq"` - FAQPage for GEO
- `JsonLd type="howto"` - HowTo for process docs
- `OrganizationJsonLd` - Organization with expertise
- `SoftwareAppJsonLd` - SoftwareApplication with features

## GEO (AI Search Engine Optimization)

- robots.txt allows AI crawlers (configured via `SEO_CONFIG.aiCrawlers`)
- FAQ schema helps AI engines answer common questions (`SEO_CONFIG.faq`)
- HowTo schema explains skill mapping process (`SEO_CONFIG.howToSteps`)
- All SEO data centralized in `SEO_CONFIG`

## Features

- Locale-aware canonical URLs and hreflang tags
- Dynamic sitemap with alternate language links
- Career pages have dynamic metadata from database
- Open Graph and Twitter Card meta tags
- Locale-specific titles/descriptions via `seo` namespace

## Adding SEO to New Pages

```tsx
import { locales, defaultLocale } from '@/i18n/routing';
import { SITE_URL } from '@/lib/constants';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${SITE_URL}/${loc}/page`;
  }
  languages['x-default'] = `${SITE_URL}/${defaultLocale}/page`;

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    alternates: {
      canonical: `${SITE_URL}/${locale}/page`,
      languages,
    },
  };
}
```

**Note**: Use `defaultLocale` for x-default, not hardcoded `'en'`.
