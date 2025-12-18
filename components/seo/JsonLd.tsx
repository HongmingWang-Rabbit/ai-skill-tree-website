import Script from 'next/script';
import { APP_NAME, SITE_URL, APP_DESCRIPTION, SEO_CONFIG, ASSETS } from '@/lib/constants';
import { locales, defaultLocale } from '@/i18n/routing';

interface FAQItem {
  question: string;
  answer: string;
}

interface HowToStep {
  name: string;
  text: string;
  url?: string;
}

interface JsonLdProps {
  type: 'website' | 'career' | 'breadcrumb' | 'faq' | 'howto' | 'article';
  data?: {
    careerName?: string;
    careerDescription?: string;
    locale?: string;
    breadcrumbs?: readonly { name: string; url: string }[];
    faqs?: readonly FAQItem[];
    howToName?: string;
    howToDescription?: string;
    howToSteps?: readonly HowToStep[];
    // Article fields
    headline?: string;
    description?: string;
    datePublished?: string;
    author?: string;
    image?: string;
    url?: string;
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
        name: data?.careerName || SEO_CONFIG.course.defaultName,
        description: data?.careerDescription || APP_DESCRIPTION,
        provider: {
          '@type': 'Organization',
          name: APP_NAME,
          url: SITE_URL,
        },
        educationalLevel: SEO_CONFIG.course.educationalLevel,
        inLanguage: data?.locale || defaultLocale,
        isAccessibleForFree: true,
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: SEO_CONFIG.course.courseMode,
          courseWorkload: SEO_CONFIG.course.courseWorkload,
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

    case 'faq':
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data?.faqs?.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })) || [],
      };
      break;

    case 'howto':
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: data?.howToName || SEO_CONFIG.howToMeta.name,
        description: data?.howToDescription || SEO_CONFIG.howToMeta.description,
        step: data?.howToSteps?.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.name,
          text: step.text,
          url: step.url,
        })) || [],
      };
      break;

    case 'article':
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data?.headline,
        description: data?.description,
        datePublished: data?.datePublished,
        author: {
          '@type': 'Person',
          name: data?.author || APP_NAME,
        },
        publisher: {
          '@type': 'Organization',
          name: APP_NAME,
          url: SITE_URL,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}${ASSETS.ICON}`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': data?.url,
        },
        ...(data?.image && {
          image: {
            '@type': 'ImageObject',
            url: data.image.startsWith('http') ? data.image : `${SITE_URL}${data.image}`,
          },
        }),
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
    logo: `${SITE_URL}${ASSETS.ICON}`,
    description: APP_DESCRIPTION,
    sameAs: SEO_CONFIG.organization.socialProfiles.filter(Boolean),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: SEO_CONFIG.organization.supportedLanguages,
    },
    foundingDate: SEO_CONFIG.organization.foundingDate,
    knowsAbout: SEO_CONFIG.organization.expertiseAreas,
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
    description: APP_DESCRIPTION,
    url: SITE_URL,
    applicationCategory: SEO_CONFIG.software.applicationCategory,
    applicationSubCategory: SEO_CONFIG.software.applicationSubCategory,
    operatingSystem: SEO_CONFIG.software.operatingSystem,
    browserRequirements: SEO_CONFIG.software.browserRequirements,
    softwareVersion: SEO_CONFIG.software.version,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    featureList: SEO_CONFIG.software.features,
    screenshot: `${SITE_URL}${ASSETS.ICON_LARGE}`,
    author: {
      '@type': 'Organization',
      name: APP_NAME,
    },
    inLanguage: [...locales],
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
