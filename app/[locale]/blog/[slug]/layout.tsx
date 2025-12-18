import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, getLocaleUrl, getOgLocale } from '@/i18n/routing';
import { SITE_URL, APP_NAME } from '@/lib/constants';
import { getBlogPost, getAllBlogSlugs } from '@/lib/blog';
import { JsonLd } from '@/components/seo';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getBlogPost(slug, locale);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  // Get all locales this post exists in
  const allSlugs = getAllBlogSlugs();
  const postLocales = allSlugs.find((s) => s.slug === slug)?.locales || [locale];

  // Generate alternate language links
  const languages: Record<string, string> = {};
  for (const loc of postLocales) {
    languages[loc] = getLocaleUrl(SITE_URL, loc, `/blog/${slug}`);
  }
  if (postLocales.includes('en')) {
    languages['x-default'] = getLocaleUrl(SITE_URL, 'en', `/blog/${slug}`);
  }

  const currentUrl = getLocaleUrl(SITE_URL, locale, `/blog/${slug}`);

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: currentUrl,
      languages,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: currentUrl,
      siteName: APP_NAME,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      locale: getOgLocale(locale),
      alternateLocale: postLocales
        .filter((l) => l !== locale)
        .map((l) => getOgLocale(l)),
      images: post.image ? [{ url: post.image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : undefined,
    },
  };
}

export default async function BlogPostLayout({ children, params }: Props) {
  const { locale, slug } = await params;
  const post = getBlogPost(slug, locale);
  const t = await getTranslations({ locale, namespace: 'common' });

  if (!post) {
    notFound();
  }

  return (
    <>
      {/* Article Schema for SEO */}
      <JsonLd
        type="article"
        data={{
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          author: post.author,
          image: post.image,
          url: getLocaleUrl(SITE_URL, locale, `/blog/${slug}`),
        }}
      />
      {/* Breadcrumb Schema */}
      <JsonLd
        type="breadcrumb"
        data={{
          breadcrumbs: [
            { name: t('home'), url: getLocaleUrl(SITE_URL, locale) },
            { name: 'Blog', url: getLocaleUrl(SITE_URL, locale, '/blog') },
            { name: post.title, url: getLocaleUrl(SITE_URL, locale, `/blog/${slug}`) },
          ],
        }}
      />
      {children}
    </>
  );
}
