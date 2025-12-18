# CLAUDE.md

Guidance for Claude Code. **Check existing utilities before implementing new code.**

## Commands

```bash
pnpm dev          # Dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm db:push      # Push schema changes
pnpm db:studio    # Drizzle Studio GUI
```

## Quick Reference

| Need | Use |
|------|-----|
| Path alias | `@/*` → project root |
| Assets | `ASSETS.ICON`, `ASSETS.ICON_LARGE` from `lib/constants` |
| Credits | `hasEnoughCredits()` before, `deductCredits()` after AI ops |
| Subscriptions | `canCreateMap()`, `shouldHaveWatermark()` |
| Lazy load | `next/dynamic` with `ssr: false` for React Flow, PDFs |
| i18n | Import `Link`, `useRouter` from `@/i18n/navigation` |
| Locales | `locales`, `i18nNamespaces` from `@/i18n/routing` |
| Translations | `useTranslations('namespace')` from `next-intl` |

## i18n Structure

```
locales/
├── en/           # English (served at root URL)
├── zh/           # Chinese (served at /zh/)
└── ja/           # Japanese (served at /ja/)
    ├── common.json
    ├── home.json
    ├── dashboard.json
    └── ... (18 namespace files per locale)
```

**Locale prefix mode:** `as-needed` - English uses root URL, other locales get `/{locale}` prefix

**URL helpers for metadata/sitemap:**
```tsx
import { getLocaleUrl, getLocalePath } from '@/i18n/routing';
import { SITE_URL } from '@/lib/constants';

// Full URLs (for metadata, sitemap, hreflang)
getLocaleUrl(SITE_URL, 'en', '/pricing')  // → https://personalskillmap.com/pricing
getLocaleUrl(SITE_URL, 'zh', '/pricing')  // → https://personalskillmap.com/zh/pricing

// Paths (for internal navigation when next-intl Link unavailable)
getLocalePath('en', '/dashboard')  // → /dashboard
getLocalePath('zh', '/dashboard')  // → /zh/dashboard
```

**Adding translations:**
1. Add keys to all 3 locale files: `locales/{en,zh,ja}/{namespace}.json`
2. For new namespaces: create files + add to `i18nNamespaces` in `i18n/routing.ts`

**Using translations:**
```tsx
import { useTranslations } from 'next-intl';
const t = useTranslations('dashboard');
<span>{t('saveButton')}</span>
```

## UI Patterns

```tsx
// Confirmation
import { ConfirmModal } from '@/components/ui';
<ConfirmModal isOpen={show} onConfirm={fn} title="..." message="..." variant="danger" />

// Toast
import { showToast } from '@/components/ui';
showToast.success('Done'); showToast.error('Failed');

// Dropdown
import { DropdownMenu } from '@/components/ui';
<DropdownMenu items={[{ id: 'x', label: 'X', onClick: fn }]} />
```

## Key Files

- `i18n/routing.ts` - Locales, namespaces, OG locale mapping, `getLocaleUrl()`, `getLocalePath()`
- `lib/constants.ts` - All constants (routes, billing, configs, `PDF_FONT_CONFIG`, `PDF_LABELS`, `AI_LOCALE_INSTRUCTIONS`, `BLOG_CONFIG`)
- `lib/schemas.ts` - Zod schemas and shared types
- `lib/ai-resume.ts` - Resume/cover letter AI functions
- `lib/document-parser.ts` - Document parsing (`parsePDF`, `parseWord`, `parseURL`) with dynamic imports for serverless
- `lib/blog.ts` - Blog utilities (`getBlogPosts()`, `getBlogPost()`, `calculateReadingTime()`, `extractToc()`)
- `lib/credits.ts` - Credit management
- `lib/auth.ts` - NextAuth (Google, Twitter, WeChat, Web3)
- `hooks/useQueryHooks.ts` - React Query hooks
- `components/resume/pdfFonts.ts` - PDF font registration (Noto Sans SC/JP) and CJK hyphenation

## Blog

Blog posts are markdown files stored in `content/blog/{locale}/`:

```
content/blog/
├── en/
│   └── my-post.md
├── zh/
│   └── my-post.md
└── ja/
    └── my-post.md
```

**Frontmatter format:**
```yaml
---
title: "Post Title"
description: "SEO description"
date: "2025-01-15"
tags: ["career", "skills"]
image: "/blog/cover.jpg"  # Optional
author: "Author Name"  # Defaults to BLOG_CONFIG.defaultAuthor
---
```

**Features:** Auto-generated Table of Contents (h2-h4), reading time estimate (supports CJK), SEO with Article schema, server-side markdown rendering with `marked`

**Config:** `BLOG_CONFIG` in `lib/constants.ts` - `contentDir`, `defaultAuthor`, `wordsPerMinute`, `cjkCharsPerWord`, `tocMinLevel`, `tocMaxLevel`, `cardMaxTags`

**Adding a new post:**
1. Create `.md` file in `content/blog/{en,zh,ja}/`
2. Use same filename for all locales (translations)
3. Deploy - posts are statically generated at build time

## Before Completing Tasks

1. No hardcoded values (use constants)
2. No temp code, unnecessary logs, or comments
3. Update `locales/{en,zh,ja}/*.json` for new UI strings
4. Ensure all 3 locales have matching keys

## Detailed Docs

- [Architecture Reference](docs/architecture.md) - Libraries, components, schemas
- [Feature Docs](docs/features/) - Document import, resume export, billing, etc.
