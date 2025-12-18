'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/lib/constants';

// TOC item type
interface TocItem {
  id: string;
  text: string;
  level: number;
}

// Blog post data passed from server component
interface BlogPostData {
  slug: string;
  locale: string;
  htmlContent: string; // Pre-rendered HTML from server
  title: string;
  description: string;
  date: string;
  formattedDate: string;
  tags: string[];
  image?: string;
  author: string;
  readingTime: number;
  toc: TocItem[];
}

interface BlogPostProps {
  post: BlogPostData;
}

// Table of Contents component
function TableOfContents({ items, title }: { items: TocItem[]; title: string }) {
  if (items.length === 0) return null;

  return (
    <nav className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}
          >
            <a
              href={`#${item.id}`}
              className="text-slate-400 hover:text-purple-400 transition-colors text-sm block py-1"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function BlogPost({ post }: BlogPostProps) {
  const t = useTranslations('blog');

  return (
    <article className="max-w-3xl mx-auto">
      {/* Back Link */}
      <Link
        href={ROUTES.BLOG}
        className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-8"
      >
        ← {t('backToBlog')}
      </Link>

      {/* Header */}
      <header className="mb-8">
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-sm font-medium bg-purple-500/20 text-purple-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-slate-400 text-sm">
          <span>{t('by')} {post.author}</span>
          <span>•</span>
          <time dateTime={post.date}>
            {post.formattedDate}
          </time>
          <span>•</span>
          <span>{t('minuteRead', { minutes: post.readingTime })}</span>
        </div>
      </header>

      {/* Featured Image */}
      {post.image && (
        <div className="aspect-video overflow-hidden rounded-xl mb-8 bg-slate-800 relative">
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Table of Contents */}
      <TableOfContents items={post.toc} title={t('tableOfContents')} />

      {/* Content - Pre-rendered HTML */}
      <div
        className="blog-content"
        dangerouslySetInnerHTML={{ __html: post.htmlContent }}
      />
    </article>
  );
}
