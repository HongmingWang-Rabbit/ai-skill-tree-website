# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Before You Start

**Always check existing utilities before implementing new code:**

1. **Check `lib/` first** - Contains reusable utilities:
   - `lib/cache.ts` - Redis caching: `getCachedCareer()`, `setCachedCareer()`, `getCachedSkillGraph()`, `setCachedSkillGraph()`, `invalidateCareerCache()`
   - `lib/schemas.ts` - Zod schemas: `SkillNodeSchema`, `SkillEdgeSchema`, `CareerResponseSchema`, `CareerSearchSchema`, `GenerateCareerSchema`, `UserNodeDataSchema`, `MapUpdateSchema`
   - `lib/normalize-career.ts` - String utils: `normalizeCareerKey()`, `formatCareerTitle()`, `generateShareSlug()`, `isUUID()`, `isShareSlug()`
   - `lib/ai.ts` - OpenAI functions: `generateCareerSkillTree()`, `generateSkillTestQuestions()`, `gradeSkillTestAnswers()`, `suggestCareerSearches()`
   - `lib/auth.ts` - NextAuth config with Google, Twitter, Web3 providers
   - `lib/db/index.ts` - Database connection, exports all schema types
   - `lib/constants.ts` - App constants:
     - Skill: `SKILL_PASS_THRESHOLD`, `SKILL_PROGRESS_MAX`, `SKILL_SCORE_EXCELLENT_THRESHOLD`
     - Share: `SHARE_SLUG_LENGTH`, `SHARE_SLUG_CHARS`, `SHARE_SLUG_GENERATION_MAX_RETRIES`
     - Map: `MAP_TITLE_MAX_LENGTH`
     - Timing: `SIGN_IN_PROMPT_DELAY_MS`, `AUTO_SAVE_DEBOUNCE_MS`
     - Assets: `ASSETS.ICON`, `ASSETS.ICON_LARGE`
     - Branding: `APP_NAME`
     - Header: `HEADER_SCROLL_THRESHOLD`, `HEADER_HEIGHT_DEFAULT`, `HEADER_HEIGHT_SCROLLED`, `NAV_LINKS`
     - Background: `BACKGROUND_CONFIG` (grid, colors, mouse interaction settings)
     - Hero: `HERO_ICON_ROTATION_DURATION`

2. **Check `components/` for existing UI**:
   - `components/ui/` - `GlassPanel`, `XPProgressRing`, `SearchInput`, `ShareModal`, `LanguageSwitcher`, `Icons` (`MenuIcon`, `CloseIcon`)
   - `components/layout/` - `Header` (site navigation with mobile menu), `SkillTreeBackground` (animated network background)
   - `components/skill-graph/` - `SkillGraph`, `SkillNode`, `CenterNode`, `SkillEdge`, layout utilities
   - `components/auth/` - Authentication components
   - `components/providers/` - Context providers

3. **Check `hooks/`** - Custom React hooks:
   - `useShareScreenshot` - Screenshot/share functionality

4. **Check `i18n/` for internationalization**:
   - `i18n/routing.ts` - Locale configuration: `locales`, `Locale` type, `defaultLocale`, `routing`
   - `i18n/request.ts` - Server-side request configuration for next-intl
   - `i18n/navigation.ts` - Locale-aware navigation: `Link`, `useRouter`, `usePathname`, `redirect`
   - **Important**: Always import `locales` and `Locale` type from `@/i18n/routing` - never define locale arrays elsewhere

5. **Check `messages/` for translations**:
   - `messages/en.json` - English translations
   - `messages/zh.json` - Chinese translations
   - `messages/ja.json` - Japanese translations

## Commands

```bash
# Development
pnpm dev              # Start dev server with Turbopack (http://localhost:3000)
pnpm build            # Production build
pnpm lint             # Run ESLint

# Database (Drizzle ORM with Neon PostgreSQL)
pnpm db:push          # Push schema changes to database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio GUI
```

## Architecture

This is a Next.js 15 App Router application called **Personal Skill Map** for generating AI-powered career skill maps.

### Core Data Flow

1. User enters a career query → `POST /api/ai/generate` → OpenAI GPT-4o generates skill map JSON
2. Generated data is cached in Upstash Redis and persisted to Neon PostgreSQL
3. Skill map is rendered as an interactive graph using React Flow (@xyflow/react)
4. Landing page displays animated network background with spinning logo behind search

### Key Directories

- `app/[locale]/` - Locale-prefixed pages (e.g., `/en/career/...`, `/zh/career/...`)
- `app/api/` - API routes: `/ai/generate`, `/career/[careerId]`, `/career/search`, `/skill/test`, `/user/progress`, `/map/[mapId]`, `/map/fork`, `/map/[mapId]/copy`
- `components/skill-graph/` - React Flow visualization: `SkillGraph.tsx` (main), `SkillNode.tsx`, `SkillEdge.tsx`, radial/dagre layout utilities
- `i18n/` - Internationalization configuration (next-intl)
- `messages/` - Translation files (en.json, zh.json, ja.json)
- `lib/db/schema.ts` - Drizzle schema: careers, skillGraphs, skills, users (NextAuth), userCareerGraphs, userSkillProgress
- `lib/ai.ts` - OpenAI integration: `generateCareerSkillTree()`, `generateSkillTestQuestions()`, `gradeSkillTestAnswers()`

### Internationalization (i18n)

Uses next-intl with locale-prefixed URLs. Supported locales: `en`, `zh`, `ja`.

**Key files:**
- `middleware.ts` - Locale detection and URL routing
- `i18n/routing.ts` - Locale configuration
- `i18n/navigation.ts` - Locale-aware `Link`, `useRouter`, `usePathname`
- `messages/*.json` - Translation strings

**Usage in components:**
```tsx
// Client components
import { useTranslations, useLocale } from 'next-intl';
const t = useTranslations();
const locale = useLocale();
t('common.signIn'); // Returns translated string

// Navigation (use locale-aware versions)
import { Link, useRouter } from '@/i18n/navigation';
```

**AI-Generated Content Localization:**
- Career skill trees are generated in the user's current locale
- `lib/ai.ts`: `generateCareerSkillTree(query, locale)` accepts locale parameter
- All locales are stored in database with `locale` column
- Database schema: `careers` and `skillGraphs` tables have `locale` column
- Unique constraint: `(canonical_key, locale)` allows same career in multiple languages
- Cache keys: `{careerId}:{locale}` for all locales
- Skill names, descriptions, and categories are generated in the target language

### Authentication

NextAuth.js with three providers:
- Google OAuth
- Twitter OAuth 2.0
- Web3 wallet (SIWE - Sign-In with Ethereum via wagmi/RainbowKit)

Session strategy is JWT. Auth config in `lib/auth.ts`.

### User Maps & Sharing

The app supports user-owned skill maps with sharing capabilities:

**URL Routing:**
- `/career/{canonicalKey}` - Base career template (auto-forks on page load for logged-in users)
- `/career/{uuid}` - User's own map (full edit access, auto-saves changes)
- `/career/{shareSlug}` - Shared map view (read-only for non-owners, copy button available)

**Map Flow:**
1. Logged-in user visits base career → auto-creates personal map (fork) and redirects
2. User can customize title, track progress, reposition nodes (auto-saved)
3. User can make map public → generates 6-char share slug
4. Others can view public maps and copy to their account

**API Routes:**
- `GET /api/map/[mapId]` - Fetch map by UUID or shareSlug
- `PATCH /api/map/[mapId]` - Update map settings (owner only)
- `DELETE /api/map/[mapId]` - Delete map (owner only)
- `POST /api/map/fork` - Create map from career or another map
- `POST /api/map/[mapId]/copy` - Copy public map to own account

### Database Schema (lib/db/schema.ts)

- `careers` - Generated careers with canonicalKey (unique slug)
- `skillGraphs` - JSONB nodes/edges for each career
- `userCareerGraphs` - User's saved skill tree maps with:
  - `title` - Custom title for the map
  - `nodeData` - JSONB array of skill progress and positions
  - `isPublic` - Whether the map can be viewed by others
  - `shareSlug` - 6-char alphanumeric slug for short URLs
  - `copiedFromId` - UUID of source map if copied from another user
- `userSkillProgress` - Per-skill progress tracking

### Path Aliases

`@/*` maps to project root (e.g., `@/lib/db`, `@/components/ui`)

### Assets & Icons

- `public/icon-transparent-bg.png` - Standard app icon (used in header)
- `public/large-icon-transparent-bg.png` - Large icon (used in hero spinning animation)
- `app/icon.png` - Next.js auto-served app icon (192x192)
- `app/apple-icon.png` - Apple touch icon (180x180)
- `app/favicon.ico` - Browser favicon

Always use constants from `lib/constants.ts` (`ASSETS.ICON`, `ASSETS.ICON_LARGE`) instead of hardcoding paths.

## Before Completing Any Task

**Always perform these checks before finishing:**

1. **Code Quality Review:**
   - Modularized and reusable (no copy-paste duplication)
   - Scalable (easy to extend)
   - No hardcoded variables (use constants or config)
   - No one-time test logs, scripts, or temporary code
   - No unnecessary comments or console.logs

2. **Documentation Updates (if changes affect them):**
   - `README.md` - Update if features, setup, or structure changed
   - `CLAUDE.md` - Update if new utilities, patterns, or architecture changed
   - `messages/*.json` - Add translations for any new UI strings
