import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { careers, userCareerGraphs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { SITE_URL, APP_NAME } from '@/lib/constants';
import { locales, defaultLocale, getOgLocale } from '@/i18n/routing';
import { isUUID, isShareSlug, formatCareerTitle } from '@/lib/normalize-career';
import { JsonLd } from '@/components/seo';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; careerId: string }>;
}

// Fetch career data based on careerId format
async function getCareerData(careerId: string): Promise<{ title: string; description: string; canonicalKey: string }> {
  try {
    if (isUUID(careerId)) {
      // User's own map - fetch from userCareerGraphs then get career
      const userMap = await db.select().from(userCareerGraphs).where(eq(userCareerGraphs.id, careerId)).limit(1);
      if (userMap[0]) {
        const career = await db.select().from(careers).where(eq(careers.id, userMap[0].careerId)).limit(1);
        if (career[0]) {
          return {
            title: userMap[0].title || career[0].title,
            description: career[0].description || '',
            canonicalKey: career[0].canonicalKey,
          };
        }
      }
    } else if (isShareSlug(careerId)) {
      // Shared map - fetch by shareSlug
      const sharedMap = await db.select().from(userCareerGraphs).where(eq(userCareerGraphs.shareSlug, careerId)).limit(1);
      if (sharedMap[0]) {
        const career = await db.select().from(careers).where(eq(careers.id, sharedMap[0].careerId)).limit(1);
        if (career[0]) {
          return {
            title: sharedMap[0].title || career[0].title,
            description: career[0].description || '',
            canonicalKey: career[0].canonicalKey,
          };
        }
      }
    } else {
      // Base career - fetch by canonicalKey
      const career = await db.select().from(careers).where(eq(careers.canonicalKey, careerId)).limit(1);
      if (career[0]) {
        return {
          title: career[0].title,
          description: career[0].description || '',
          canonicalKey: career[0].canonicalKey,
        };
      }
    }
  } catch {
    // Fall back to formatted careerId
  }

  return {
    title: formatCareerTitle(careerId),
    description: '',
    canonicalKey: careerId,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; careerId: string }>;
}): Promise<Metadata> {
  const { locale, careerId } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  const { title, description, canonicalKey } = await getCareerData(careerId);

  const pageTitle = t('careerTitle', { career: title });
  const pageDescription = description || t('careerDescription', { career: title });

  // Generate alternate language links
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${SITE_URL}/${loc}/career/${canonicalKey}`;
  }
  languages['x-default'] = `${SITE_URL}/${defaultLocale}/career/${canonicalKey}`;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: `${SITE_URL}/${locale}/career/${canonicalKey}`,
      languages,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `${SITE_URL}/${locale}/career/${canonicalKey}`,
      type: 'website',
      locale: getOgLocale(locale),
      alternateLocale: locales.filter((l) => l !== locale).map((l) => getOgLocale(l)),
      siteName: APP_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
    },
  };
}

export default async function CareerLayout({ children, params }: LayoutProps) {
  const { locale, careerId } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const { title: careerName, description: careerDescription } = await getCareerData(careerId);

  return (
    <>
      {/* Career Course Schema */}
      <JsonLd
        type="career"
        data={{
          careerName,
          careerDescription,
          locale,
        }}
      />
      {/* Breadcrumb Schema */}
      <JsonLd
        type="breadcrumb"
        data={{
          breadcrumbs: [
            { name: t('home'), url: `${SITE_URL}/${locale}` },
            { name: careerName, url: `${SITE_URL}/${locale}/career/${careerId}` },
          ],
        }}
      />
      {children}
    </>
  );
}
