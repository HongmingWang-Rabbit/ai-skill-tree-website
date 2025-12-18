import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { BlogPostPreview, formatBlogDate } from '@/lib/blog';
import { ROUTES, BLOG_CONFIG } from '@/lib/constants';

interface BlogCardProps {
  post: BlogPostPreview;
}

export function BlogCard({ post }: BlogCardProps) {
  const t = useTranslations('blog');

  return (
    <Link
      href={`${ROUTES.BLOG}/${post.slug}`}
      className="group block bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
    >
      {/* Featured Image */}
      {post.image && (
        <div className="aspect-video overflow-hidden bg-slate-800 relative">
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.slice(0, BLOG_CONFIG.cardMaxTags).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs font-medium bg-purple-500/20 text-purple-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors line-clamp-2">
          {post.title}
        </h2>

        {/* Description */}
        <p className="text-slate-400 text-sm mb-4 line-clamp-3">
          {post.description}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>{formatBlogDate(post.date, post.locale)}</span>
            <span>•</span>
            <span>{t('minuteRead', { minutes: post.readingTime })}</span>
          </div>
          <span className="text-purple-400 group-hover:text-purple-300 transition-colors">
            {t('readMore')} →
          </span>
        </div>
      </div>
    </Link>
  );
}
