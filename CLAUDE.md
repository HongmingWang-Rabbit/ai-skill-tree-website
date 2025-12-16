# CLAUDE.md

Guidance for Claude Code when working with this repository.

## Before You Start

**Always check existing utilities before implementing new code:**

### Core Libraries (`lib/`)

| File | Purpose |
|------|---------|
| `cache.ts` | Redis caching: `getCachedCareer()`, `setCachedCareer()`, `getCachedSkillGraph()`, `invalidateCareerCache()`, `getCachedLearningResources()` |
| `schemas.ts` | Zod schemas and shared types: `SkillNodeSchema`, `WorkExperience`, `Project`, `UserAddress`, `LearningResource` |
| `normalize-career.ts` | String utils: `normalizeCareerKey()`, `formatCareerTitle()`, `generateShareSlug()`, `isUUID()` |
| `ai.ts` | OpenAI (gpt-4o-mini): `generateCareerSkillTree()`, `generateSkillTestQuestions()`, `analyzeCareerQuery()` |
| `ai-chat.ts` | Chat: `processChatMessage()`, `applyModifications()`, `generateSmartMerge()` |
| `ai-document.ts` | Document extraction: `extractSkillsFromDocument()`, `mergeExtractedWithExisting()` |
| `ai-resume.ts` | Resume AI: `analyzeJobPosting()`, `generateResumeContent()` |
| `document-parser.ts` | Parsing: `parsePDF()`, `parseWord()`, `parseImage()`, `parseURL()` |
| `mcp/tavily.ts` | Web search: `searchTavily()`, `searchLearningResources()` |
| `auth.ts` | NextAuth config with Google, Twitter, WeChat, Web3 providers |
| `stripe.ts` | Stripe client: `getStripe()`, `getTierFromPriceId()` |
| `credits.ts` | Credit management: `hasEnoughCredits()`, `deductCredits()`, `addCredits()` |
| `subscription.ts` | Subscription: `canCreateMap()`, `shouldHaveWatermark()`, webhook handlers |
| `constants.ts` | All app constants (see below) |

### Key Constants (`lib/constants.ts`)

- **Routes**: `ROUTES`, `API_ROUTES`
- **Assets**: `ASSETS.ICON`, `ASSETS.ICON_LARGE`
- **Billing**: `BILLING_CONFIG` (tiers, creditCosts, signupBonus)
- **Features**: `AI_CHAT_CONFIG`, `DOCUMENT_IMPORT_CONFIG`, `RESUME_CONFIG`, `LEARNING_CONFIG`
- **Layout**: `MASTER_GRAPH_CONFIG`, `LANDING_PAGE_CONFIG`
- **SEO**: `SEO_CONFIG`, `SITE_URL`

### Components

| Directory | Key Components |
|-----------|---------------|
| `ui/` | `GlassPanel`, `SearchInput`, `ShareModal`, `DropdownMenu`, `ConfirmModal`, `Toast`/`showToast`, `FileDropzone`, Icons |
| `layout/` | `Header`, `SkillTreeBackground` |
| `skill-graph/` | `SkillGraph`, `LazySkillGraph`, `SkillNode`, `CenterNode`, `SkillEdge` |
| `auth/` | `AuthModal` (login with social/Web3) |
| `ai-chat/` | `AIChatPanel`, `ChatMessage`, `ModificationPreview`, `MergeMapModal` |
| `import/` | `DocumentImportModal`, `ImportPreview` |
| `resume/` | `ResumePDF`, `ResumeExportModal`, `PDFDownloadButton` |
| `learning/` | `LearningResourcesModal` |
| `dashboard/` | `MasterSkillMap`, `ExperienceEditor`, `ProjectEditor` |

### Hooks (`hooks/`)

- `useQueryHooks.ts` - React Query hooks: `useUserGraphs()`, `useUserProfile()`, `useMasterMap()`, `useDeleteMap()`, `useUserCredits()`, `useUserSubscription()`
- `useShareScreenshot` - Screenshot/share functionality

### i18n

- Locales: `en`, `zh`, `ja` (in `i18n/routing.ts`)
- Import `Link`, `useRouter` from `@/i18n/navigation`
- Use `getLocalePath(locale, path)` for auth callbacks

## Commands

```bash
pnpm dev              # Dev server with Turbopack
pnpm build            # Production build
pnpm lint             # ESLint

# Database (Drizzle + Neon)
pnpm db:push          # Push schema changes
pnpm db:studio        # Drizzle Studio GUI
```

## Architecture

Next.js 15 App Router for **Personal Skill Map** - AI-powered career skill maps.

### Core Data Flow

**Primary (Import → Visualize → Export):**
1. Upload resume → `POST /api/import/document` → AI extracts skills
2. `POST /api/map/fork` creates skill map → View on career page
3. `POST /api/resume/generate` → Export tailored resume

**Secondary (Career Exploration):**
1. Enter query → `POST /api/ai/analyze` → Redirect to `/career/{key}` or show suggestions
2. Career page → `POST /api/ai/generate` → Generate skill map with OpenAI
3. Cache in Redis, persist to PostgreSQL, render with React Flow

### Key Directories

- `app/[locale]/` - Locale-prefixed pages
- `app/api/` - API routes: `/ai/*`, `/map/*`, `/user/*`, `/import/*`, `/resume/*`, `/stripe/*`, `/learning/*`
- `lib/db/schema.ts` - Drizzle schema: careers, skillGraphs, users, userCareerGraphs, subscriptions, credits
- `messages/` - Translation files (en.json, zh.json, ja.json)

### Database Schema (Summary)

- `careers` - Generated careers with canonicalKey
- `skillGraphs` - JSONB nodes/edges per career
- `userCareerGraphs` - User maps with `nodeData`, `customNodes`, `customEdges`, `shareSlug`
- `subscriptions` - Stripe integration with tier/status
- `credits`/`creditTransactions` - Credit balance and audit trail

### Authentication

NextAuth.js with Google, Twitter, WeChat (QR + in-app), Web3 (SIWE). JWT sessions.

## UI Patterns

### Confirmation Dialogs
```tsx
import { ConfirmModal } from '@/components/ui';
<ConfirmModal isOpen={show} onConfirm={fn} title="..." message="..." variant="danger" />
```

### Toast Notifications
```tsx
import { showToast } from '@/components/ui';
showToast.success('Done'); showToast.error('Failed');
```

### Dropdown Menus
```tsx
import { DropdownMenu } from '@/components/ui';
<DropdownMenu items={[{ id: 'x', label: 'X', onClick: fn }]} />
```

## Quick Reference

- **Path alias**: `@/*` → project root
- **Assets**: Use `ASSETS.ICON`, `ASSETS.ICON_LARGE` from constants
- **Credits**: `hasEnoughCredits()` before, `deductCredits()` after AI ops
- **Subscriptions**: `canCreateMap()`, `shouldHaveWatermark()`
- **Lazy loading**: Use `next/dynamic` with `ssr: false` for React Flow, PDFs

## Detailed Feature Docs

See `docs/features/` for comprehensive documentation:

| Feature | File |
|---------|------|
| Document Import | [document-import.md](docs/features/document-import.md) |
| Resume Export | [resume-export.md](docs/features/resume-export.md) |
| AI Chat | [ai-chat.md](docs/features/ai-chat.md) |
| Billing & Credits | [billing.md](docs/features/billing.md) |
| Learning Resources | [learning-resources.md](docs/features/learning-resources.md) |
| Skill Graph Layout | [skill-graph-layout.md](docs/features/skill-graph-layout.md) |
| SEO | [seo.md](docs/features/seo.md) |
| User Maps & Sharing | [user-maps-sharing.md](docs/features/user-maps-sharing.md) |
| Loading Optimization | [loading-optimization.md](docs/features/loading-optimization.md) |
| Landing Page | [landing-page.md](docs/features/landing-page.md) |
| Master Skill Map | [master-skill-map.md](docs/features/master-skill-map.md) |

## Before Completing Any Task

1. **Code Quality**:
   - Modularized, reusable, scalable
   - No hardcoded values (use constants)
   - No temp code, unnecessary logs, or comments

2. **Documentation** (if changes affect):
   - `README.md` - Features, setup, structure
   - `CLAUDE.md` - New utilities, patterns
   - `messages/*.json` - New UI strings
