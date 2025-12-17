# Architecture Reference

Detailed reference for codebase structure. See [CLAUDE.md](../CLAUDE.md) for quick start.

## Internationalization (`i18n/` & `locales/`)

| File | Purpose |
|------|---------|
| `i18n/routing.ts` | Locale config: `locales`, `i18nNamespaces`, `ogLocaleMap`, `getLocalePath()`, `getLocaleUrl()` |
| `i18n/request.ts` | next-intl server config, loads namespace files |
| `i18n/navigation.ts` | Locale-aware `Link`, `useRouter`, `usePathname` |
| `locales/{locale}/*.json` | Translation files by namespace (18 files per locale) |

**Locale prefix mode:** `as-needed` - English (default) uses root URL, other locales get `/{locale}` prefix

**URL Helpers:**
- `getLocalePath(locale, path)` - Returns path with locale prefix (respects as-needed mode)
- `getLocaleUrl(baseUrl, locale, path)` - Returns full URL with locale prefix (for metadata/sitemap)

**Namespaces:** `common`, `header`, `home`, `career`, `dashboard`, `featuredCareers`, `languageSwitcher`, `auth`, `masterMap`, `seo`, `skillGraph`, `aiChat`, `import`, `resume`, `coverLetter`, `learning`, `billing`, `pricing`

**Adding new locale:** Create folder in `locales/`, add to `locales` array in `routing.ts`

**Adding new namespace:** Create JSON files in all locale folders, add to `i18nNamespaces` in `routing.ts`

## Core Libraries (`lib/`)

| File | Purpose |
|------|---------|
| `cache.ts` | Redis caching: `getCachedCareer()`, `setCachedCareer()`, `getCachedSkillGraph()`, `invalidateCareerCache()`, `getCachedLearningResources()` |
| `schemas.ts` | Zod schemas and shared types: `SkillNodeSchema`, `WorkExperience`, `Project`, `UserAddress`, `LearningResource` |
| `normalize-career.ts` | String utils: `normalizeCareerKey()`, `formatCareerTitle()`, `generateShareSlug()`, `isUUID()` |
| `ai.ts` | OpenAI (gpt-4o-mini): `generateCareerSkillTree()`, `generateSkillTestQuestions()`, `analyzeCareerQuery()` |
| `ai-chat.ts` | Chat: `processChatMessage()`, `applyModifications()`, `generateSmartMerge()` |
| `ai-document.ts` | Document extraction: `extractSkillsFromDocument()`, `mergeExtractedWithExisting()` |
| `ai-resume.ts` | Resume/Cover Letter AI: `analyzeJobPosting()`, `analyzeJobTitle()`, `optimizeExperience()`, `generateResumeContent()`, `generateCoverLetter()` |
| `document-parser.ts` | Parsing: `parsePDF()`, `parseWord()`, `parseImage()`, `parseURL()` |
| `mcp/tavily.ts` | Web search: `searchTavily()`, `searchLearningResources()` |
| `auth.ts` | NextAuth config with Google, Twitter, WeChat, Web3 providers |
| `stripe.ts` | Stripe client: `getStripe()`, `getTierFromPriceId()` |
| `credits.ts` | Credit management: `hasEnoughCredits()`, `deductCredits()`, `addCredits()` |
| `subscription.ts` | Subscription: `canCreateMap()`, `shouldHaveWatermark()`, webhook handlers |
| `constants.ts` | All app constants (routes, billing, configs) |

## Constants (`lib/constants.ts`)

- **Routes**: `ROUTES`, `API_ROUTES`
- **Assets**: `ASSETS.ICON`, `ASSETS.ICON_LARGE`
- **Billing**: `BILLING_CONFIG` (tiers, creditCosts, signupBonus)
- **Features**: `AI_CHAT_CONFIG`, `DOCUMENT_IMPORT_CONFIG`, `RESUME_CONFIG`, `LEARNING_CONFIG`
- **Layout**: `MASTER_GRAPH_CONFIG`, `LANDING_PAGE_CONFIG`
- **SEO**: `SEO_CONFIG`, `SITE_URL`

## Components

| Directory | Key Components |
|-----------|---------------|
| `ui/` | `GlassPanel`, `SearchInput`, `ShareModal`, `DropdownMenu`, `ConfirmModal`, `Toast`/`showToast`, `FileDropzone`, Icons |
| `layout/` | `Header`, `SkillTreeBackground` |
| `skill-graph/` | `SkillGraph`, `LazySkillGraph`, `SkillNode`, `CenterNode`, `SkillEdge` |
| `auth/` | `AuthModal` (login with social/Web3) |
| `ai-chat/` | `AIChatPanel`, `ChatMessage`, `ModificationPreview`, `MergeMapModal` |
| `import/` | `DocumentImportModal`, `ImportPreview` |
| `resume/` | `ResumePDF`, `ResumeExportModal`, `CoverLetterModal`, `PDFDownloadButton` |
| `learning/` | `LearningResourcesModal` |
| `dashboard/` | `MasterSkillMap`, `ExperienceEditor`, `ProjectEditor` |

## Hooks (`hooks/`)

- `useQueryHooks.ts` - React Query: `useUserGraphs()`, `useUserProfile()`, `useMasterMap()`, `useDeleteMap()`, `useUserCredits()`, `useUserSubscription()`
- `useShareScreenshot` - Screenshot/share functionality

## Database Schema

| Table | Purpose |
|-------|---------|
| `careers` | Generated careers with canonicalKey |
| `skillGraphs` | JSONB nodes/edges per career |
| `userCareerGraphs` | User maps with `nodeData`, `customNodes`, `customEdges`, `shareSlug` |
| `subscriptions` | Stripe integration with tier/status |
| `credits`/`creditTransactions` | Credit balance and audit trail |

## API Routes

- `/api/ai/*` - AI generation, chat, analysis
- `/api/map/*` - Map CRUD, fork
- `/api/user/*` - Profile, graphs, credits
- `/api/import/*` - Document/URL import
- `/api/resume/*` - Resume generation
- `/api/cover-letter/*` - Cover letter generation
- `/api/stripe/*` - Payments, webhooks
- `/api/learning/*` - Learning resources

## Data Flow

**Import → Visualize → Export:**
1. Upload resume → `POST /api/import/document` → AI extracts skills
2. `POST /api/map/fork` creates skill map → View on career page
3. `POST /api/resume/generate` → Export tailored resume
4. `POST /api/cover-letter/generate` → Generate personalized cover letter

**Career Exploration:**
1. Enter query → `POST /api/ai/analyze` → Redirect to `/career/{key}`
2. Career page → `POST /api/ai/generate` → Generate skill map
3. Cache in Redis, persist to PostgreSQL, render with React Flow
