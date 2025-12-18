'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  content: string;
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

// Generate slug from heading text (must match extractToc logic in lib/blog.ts)
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Custom heading components with IDs for TOC anchor links
function HeadingWithId({
  level,
  children,
  ...props
}: { level: 2 | 3 | 4 } & React.HTMLAttributes<HTMLHeadingElement>) {
  const text = typeof children === 'string' ? children : String(children);
  const id = generateHeadingId(text);
  const className = 'scroll-mt-20';

  if (level === 2) return <h2 id={id} className={className} {...props}>{children}</h2>;
  if (level === 3) return <h3 id={id} className={className} {...props}>{children}</h3>;
  return <h4 id={id} className={className} {...props}>{children}</h4>;
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

      {/* Content */}
      <div className="prose prose-invert prose-slate max-w-none prose-headings:text-white prose-p:text-slate-300 prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-code:text-purple-300 prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700 prose-blockquote:border-purple-500 prose-blockquote:text-slate-400 prose-li:text-slate-300 prose-img:rounded-xl">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: (props) => <HeadingWithId level={2} {...props} />,
            h3: (props) => <HeadingWithId level={3} {...props} />,
            h4: (props) => <HeadingWithId level={4} {...props} />,
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
