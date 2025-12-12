import Script from 'next/script';
import { APP_NAME, SITE_URL, APP_DESCRIPTION } from '@/lib/constants';
import { locales } from '@/i18n/routing';

interface JsonLdProps {
  type: 'website' | 'career' | 'breadcrumb';
  data?: {
    careerName?: string;
    careerDescription?: string;
    locale?: string;
    breadcrumbs?: Array<{ name: string; url: string }>;
  };
}

export function JsonLd({ type, data }: JsonLdProps) {
  let jsonLd: object;

  switch (type) {
    case 'website':
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: APP_NAME,
        description: APP_DESCRIPTION,
        url: SITE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/{locale}/career/{search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: [...locales],
      };
      break;

    case 'career':
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: data?.careerName || 'Career Skill Map',
        description: data?.careerDescription || APP_DESCRIPTION,
        provider: {
          '@type': 'Organization',
          name: APP_NAME,
          url: SITE_URL,
        },
        educationalLevel: 'Beginner to Advanced',
        inLanguage: data?.locale || 'en',
        isAccessibleForFree: true,
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
          courseWorkload: 'Self-paced',
        },
      };
      break;

    case 'breadcrumb':
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: data?.breadcrumbs?.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })) || [],
      };
      break;

    default:
      return null;
  }

  return (
    <Script
      id={`json-ld-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      strategy="afterInteractive"
    />
  );
}

// Organization schema for the website
export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['English', 'Chinese', 'Japanese'],
    },
  };

  return (
    <Script
      id="json-ld-organization"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      strategy="afterInteractive"
    />
  );
}

// Software Application schema
export function SoftwareAppJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: APP_NAME,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <Script
      id="json-ld-software"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      strategy="afterInteractive"
    />
  );
}
