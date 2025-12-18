import { use } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getBlogPosts } from '@/lib/blog';
import { BlogCard } from '@/components/blog';
import { routing } from '@/i18n/routing';

interface Props {
  params: Promise<{ locale: string }>;
}

// Generate static params for all locales
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Disable dynamic params - return 404 for non-generated paths
export const dynamicParams = false;

// Force static generation - no serverless functions needed
export const dynamic = 'force-static';

export default function BlogPage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const posts = getBlogPosts(locale);
  const t = use(getTranslations('blog'));

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            {t('description')}
          </p>
        </header>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">{t('noPosts')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
