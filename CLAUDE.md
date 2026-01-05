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
| Rate limiting | `applyRateLimit('publicAI')` from `lib/rate-limit` |
| Lazy load | `next/dynamic` with `ssr: false` for React Flow, PDFs |
| i18n | Import `Link`, `useRouter` from `@/i18n/navigation` |
| Locales | `locales`, `i18nNamespaces` from `@/i18n/routing` |
| Translations | `useTranslations('namespace')` from `next-intl` |

## i18n Structure

```
locales/
├── en/           # English (served at root URL)
├── zh/           # Chinese (served at /zh/)
├── ja/           # Japanese (served at /ja/)
├── es/           # Spanish (served at /es/)
├── pt-BR/        # Portuguese Brazil (served at /pt-BR/)
├── de/           # German (served at /de/)
├── fr/           # French (served at /fr/)
├── it/           # Italian (served at /it/)
├── nl/           # Dutch (served at /nl/)
└── pl/           # Polish (served at /pl/)
    ├── common.json
    ├── home.json
    ├── dashboard.json
    └── ... (19 namespace files per locale)
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
1. Add keys to all 10 locale files: `locales/{en,zh,ja,es,pt-BR,de,fr,it,nl,pl}/{namespace}.json`
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

// SearchInput with mobile placeholder
import { SearchInput } from '@/components/ui';
<SearchInput
  onSearch={fn}
  placeholder={t('longPlaceholder')}
  mobilePlaceholder={t('shortPlaceholder')}
/>
```

## Responsive Design

Use Tailwind breakpoints for mobile-first design:
- `sm:` (640px+) - Tablets and up
- Hide text on mobile, show on larger: `<span className="hidden sm:inline">{t('text')}</span>`
- Smaller padding/gaps on mobile: `p-3 sm:p-6`, `gap-2 sm:gap-4`
- Show only icons on mobile: `<Icon /><span className="hidden sm:inline">{t('label')}</span>`
- Collapsible panels on mobile: Use accordion pattern with `expandedPanel` state
- Hide secondary elements on mobile: Minimap (`!hidden sm:!block`), descriptions

**Z-index layering (headers/menus):**
- Main header: `z-50` (fixed)
- Mobile nav menu: `z-[45]` (below main header, above page content)
- Career sub-header: `z-40` (sticky, below mobile menu)

## Key Files

- `i18n/routing.ts` - Locales, namespaces, OG locale mapping, `getLocaleUrl()`, `getLocalePath()`
- `lib/constants.ts` - All constants (routes, billing, configs, `PDF_FONT_CONFIG`, `PDF_LABELS`, `AI_LOCALE_INSTRUCTIONS`, `LOCALE_NAMES`, `LOCALE_DISPLAY_NAMES`, `LOCALE_FLAGS`, `BLOG_CONFIG`, `IMPORT_MERGE_CONFIG`, `SKILL_EXPAND_CONFIG`, `RATE_LIMIT_CONFIG`)
- `lib/schemas.ts` - Zod schemas and shared types
- `lib/ai.ts` - Career skill tree AI functions (`generateCareerSkillTree`, `generateAdvancedSkills`, `analyzeCareerQuery`)
- `lib/ai-resume.ts` - Resume/cover letter AI functions (relevance rating, optimization, personalized cover letters)
- `lib/document-parser.ts` - Document parsing (`parsePDF`, `parseWord`, `parseURL`) with dynamic imports for serverless
- `lib/import-merge.ts` - Smart import merging utilities (fuzzy matching, deduplication for bio, experience, projects, education, skill maps)
- `lib/blog.ts` - Blog utilities (`getBlogPosts()`, `getBlogPost()`, `calculateReadingTime()`, `extractToc()`)
- `lib/credits.ts` - Credit management
- `lib/rate-limit.ts` - Rate limiting (`applyRateLimit()`, `checkRateLimit()`) using Upstash Redis
- `lib/auth.ts` - NextAuth (Google, Twitter, WeChat, Web3)
- `hooks/useQueryHooks.ts` - React Query hooks
- `hooks/useCareerSearch.ts` - Career search with AI analysis (used in homepage and dashboard)
- `components/resume/pdfFonts.ts` - PDF font registration (Noto Sans SC/JP) and CJK hyphenation

## Blog

Blog posts are markdown files stored in `content/blog/{locale}/`:

```
content/blog/
├── en/           # English
├── zh/           # Chinese
├── ja/           # Japanese
├── es/           # Spanish
├── pt-BR/        # Portuguese Brazil
├── de/           # German
├── fr/           # French
├── it/           # Italian
├── nl/           # Dutch
└── pl/           # Polish
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

**Config:** `BLOG_CONFIG` in `lib/constants.ts` - `contentDir`, `defaultAuthor`, `wordsPerMinute`, `cjkCharsPerWord`, `tocMinLevel`, `tocMaxLevel`, `headingScrollMarginClass`, `cardMaxTags`

**Adding a new post:**
1. Create `.md` file in `content/blog/{locale}/` for each locale
2. Use same filename for all locales (translations)
3. Deploy - posts are statically generated at build time

## Before Completing Tasks

1. No hardcoded values (use constants)
2. No temp code, unnecessary logs, or comments
3. Update `locales/{en,zh,ja,es,pt-BR,de,fr,it,nl,pl}/*.json` for new UI strings
4. Ensure all 10 locales have matching keys

## Detailed Docs

- [Architecture Reference](docs/architecture.md) - Libraries, components, schemas
- [Feature Docs](docs/features/) - Document import, resume export, billing, rate limiting, etc.
