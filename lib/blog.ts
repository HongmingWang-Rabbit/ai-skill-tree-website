import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Locale, locales } from '@/i18n/routing';
import { BLOG_CONFIG, PDF_FONT_CONFIG } from '@/lib/constants';

// Blog post frontmatter interface
export interface BlogPostMeta {
  title: string;
  description: string;
  date: string;
  tags: string[];
  image?: string;
  author: string;
}

// Table of contents item
export interface TocItem {
  id: string;
  text: string;
  level: number;
}

// Full blog post with content
export interface BlogPost extends BlogPostMeta {
  slug: string;
  content: string;
  locale: string;
  readingTime: number; // minutes
  toc: TocItem[];
}

// Blog post preview (for listing)
export interface BlogPostPreview extends BlogPostMeta {
  slug: string;
  locale: string;
  readingTime: number; // minutes
}

/**
 * Calculate reading time in minutes from content
 */
export function calculateReadingTime(content: string): number {
  // Remove markdown syntax for more accurate count
  const plainText = content
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/`[^`]*`/g, '') // inline code
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links
    .replace(/[#*_~>/|-]/g, '') // markdown symbols
    .replace(/\n+/g, ' '); // newlines

  // Count CJK characters (Chinese, Japanese, Korean)
  const cjkPattern = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g;
  const cjkMatches = plainText.match(cjkPattern);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;

  // Count regular words (non-CJK)
  const nonCjkText = plainText.replace(cjkPattern, ' ');
  const words = nonCjkText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Calculate total "word equivalents"
  const totalWords = wordCount + cjkCount / BLOG_CONFIG.cjkCharsPerWord;

  // Calculate reading time, minimum 1 minute
  return Math.max(1, Math.ceil(totalWords / BLOG_CONFIG.wordsPerMinute));
}

/**
 * Extract table of contents from markdown content
 */
export function extractToc(content: string): TocItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const toc: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length; // 2 = h2, 3 = h3, 4 = h4
    const text = match[2].trim();
    // Generate slug-like ID from heading text
    const id = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    toc.push({ id, text, level });
  }

  return toc;
}

const BLOG_DIR = path.join(process.cwd(), BLOG_CONFIG.contentDir);

/**
 * Get all blog posts for a specific locale, sorted by date (newest first)
 */
export function getBlogPosts(locale: string): BlogPostPreview[] {
  const localeDir = path.join(BLOG_DIR, locale);

  // Return empty array if directory doesn't exist
  if (!fs.existsSync(localeDir)) {
    return [];
  }

  const files = fs.readdirSync(localeDir).filter((file) => file.endsWith('.md'));

  const posts = files
    .map((filename) => {
      const slug = filename.replace(/\.md$/, '');
      const filePath = path.join(localeDir, filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);

      return {
        slug,
        locale,
        title: data.title || slug,
        description: data.description || '',
        date: data.date || new Date().toISOString().split('T')[0],
        tags: data.tags || [],
        image: data.image,
        author: data.author || BLOG_CONFIG.defaultAuthor,
        readingTime: calculateReadingTime(content),
      } as BlogPostPreview;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

/**
 * Get a single blog post by slug and locale
 */
export function getBlogPost(slug: string, locale: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, locale, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    slug,
    locale,
    content,
    title: data.title || slug,
    description: data.description || '',
    date: data.date || new Date().toISOString().split('T')[0],
    tags: data.tags || [],
    image: data.image,
    author: data.author || BLOG_CONFIG.defaultAuthor,
    readingTime: calculateReadingTime(content),
    toc: extractToc(content),
  };
}

/**
 * Get all blog slugs across all locales (for sitemap generation)
 */
export function getAllBlogSlugs(): { slug: string; locales: Locale[] }[] {
  const slugMap = new Map<string, Locale[]>();

  for (const locale of locales) {
    const localeDir = path.join(BLOG_DIR, locale);

    if (!fs.existsSync(localeDir)) {
      continue;
    }

    const files = fs.readdirSync(localeDir).filter((file) => file.endsWith('.md'));

    for (const filename of files) {
      const slug = filename.replace(/\.md$/, '');
      const existingLocales = slugMap.get(slug) || [];
      slugMap.set(slug, [...existingLocales, locale as Locale]);
    }
  }

  return Array.from(slugMap.entries()).map(([slug, locales]) => ({
    slug,
    locales,
  }));
}

/**
 * Get all slugs for a specific locale (for generateStaticParams)
 */
export function getBlogSlugsForLocale(locale: string): string[] {
  const localeDir = path.join(BLOG_DIR, locale);

  if (!fs.existsSync(localeDir)) {
    return [];
  }

  return fs
    .readdirSync(localeDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace(/\.md$/, ''));
}

/**
 * Format date for display based on locale
 */
export function formatBlogDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  const dateLocale = PDF_FONT_CONFIG.dateLocales[locale as keyof typeof PDF_FONT_CONFIG.dateLocales] || 'en-US';

  return date.toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
