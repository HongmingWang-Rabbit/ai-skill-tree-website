import { use } from 'react';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getBlogPost, getBlogSlugsForLocale, formatBlogDate } from '@/lib/blog';
import { BlogPost } from '@/components/blog';
import { routing } from '@/i18n/routing';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

// Generate static params for all blog posts
export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];

  for (const locale of routing.locales) {
    const slugs = getBlogSlugsForLocale(locale);
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }

  return params;
}

export default function BlogPostPage({ params }: Props) {
  const { locale, slug } = use(params);
  setRequestLocale(locale);

  const post = getBlogPost(slug, locale);

  if (!post) {
    notFound();
  }

  // Prepare post data for client component (with pre-formatted date)
  const postData = {
    ...post,
    formattedDate: formatBlogDate(post.date, locale),
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <BlogPost post={postData} />
      </div>
    </div>
  );
}
