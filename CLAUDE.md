# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Before You Start

**Always check existing utilities before implementing new code:**

1. **Check `lib/` first** - Contains reusable utilities:
   - `lib/cache.ts` - Redis caching: `getCachedCareer()`, `setCachedCareer()`, `getCachedSkillGraph()`, `setCachedSkillGraph()`, `invalidateCareerCache()`, `getCachedLearningResources()`, `setCachedLearningResources()`, `invalidateLearningCache()`
   - `lib/schemas.ts` - Zod schemas: `SkillNodeSchema`, `SkillEdgeSchema`, `CareerResponseSchema`, `CareerSearchSchema`, `GenerateCareerSchema`, `UserNodeDataSchema`, `MapUpdateSchema`, `WorkExperienceSchema`, `ProfileUpdateSchema`, `ResumeGenerateSchema`, `LearningResourcesSchema`, `AffiliatedLinkSchema`; types: `LearningResource` (shared between API and components)
   - `lib/normalize-career.ts` - String utils: `normalizeCareerKey()`, `formatCareerTitle()`, `generateShareSlug()`, `isUUID()`, `isShareSlug()`
   - `lib/ai.ts` - OpenAI functions (using gpt-4o-mini): `generateCareerSkillTree()`, `generateSkillTestQuestions()`, `gradeSkillTestAnswers()`, `suggestCareerSearches()`, `analyzeCareerQuery()`
   - `lib/ai-chat.ts` - AI chat utilities: `processChatMessage()`, `generateModificationSummary()`, `applyModifications()`, `generateSmartMerge()`, types: `ChatModification`, `ChatContext`, `ChatMessage`
   - `lib/ai-document.ts` - Document skill extraction: `extractSkillsFromDocument()`, `mergeExtractedWithExisting()`, `generateExtractionSummary()`, types: `DocumentImportResult`, `ExtractedExperience`
   - `lib/ai-resume.ts` - Resume generation AI functions: `analyzeJobPosting()`, `analyzeJobTitle()`, `generateResumeContent()`, types: `JobRequirements`, `ResumeSkill`, `ResumeSkillGroup`, `ResumeContent`, `CareerSkillData`, `UserProfile`
   - `lib/document-parser.ts` - Document parsing utilities: `parsePDF()`, `parseWord()`, `parseImage()`, `parseText()`, `parseURL()`, `detectURLType()`, `truncateForAI()`, `isSupportedFileType()`, `isImageFile()`, `getMimeType()`, types: `ParsedDocument`, `DocumentParseError`
   - `lib/mcp/tavily.ts` - Tavily web search integration: `searchTavily()`, `searchTrendingTech()`, `searchCareerSkills()`, `searchLearningResources()`, `detectPlatformFromUrl()`, `formatSearchResultsForAI()`
   - `lib/auth.ts` - NextAuth config with Google, Twitter, WeChat, Web3 providers; also calls `initializeUserCredits()` on signup
   - `lib/wechat-provider.ts` - Custom WeChat OAuth provider: `WeChatProvider()`, `WeChatMPProvider()`, `isWeChatBrowser()`
   - `lib/stripe.ts` - Stripe client utilities: `getStripe()` (lazy initialization), `stripe` (proxy), `getTierFromPriceId()`, `getCreditsFromPriceId()`, `isSubscriptionPriceId()`, `isCreditPackPriceId()`
   - `lib/credits.ts` - Credit management (uses atomic SQL, no transactions for Neon HTTP compatibility): `getUserCredits()`, `hasEnoughCredits()`, `deductCredits()`, `addCredits()`, `getCreditHistory()`, `initializeUserCredits()`, types: `CreditCheckResult`, `CreditDeductResult`
   - `lib/subscription.ts` - Subscription management: `getUserSubscription()`, `getActiveSubscription()` (returns Stripe subscription for upgrades/downgrades), `canCreateMap()`, `shouldHaveWatermark()`, `getOrCreateStripeCustomer()`, webhook handlers: `handleSubscriptionCreated()`, `handleSubscriptionUpdated()`, `handleSubscriptionDeleted()`, `handleInvoicePaid()`, `handleInvoicePaymentFailed()`, types: `UserSubscriptionInfo`
   - `lib/db/index.ts` - Database connection, exports all schema types
   - `lib/constants.ts` - App constants:
     - Skill: `SKILL_PASS_THRESHOLD`, `SKILL_PROGRESS_MAX`, `SKILL_SCORE_EXCELLENT_THRESHOLD`
     - Share: `SHARE_SLUG_LENGTH`, `SHARE_SLUG_CHARS`, `SHARE_SLUG_GENERATION_MAX_RETRIES`
     - Map: `MAP_TITLE_MAX_LENGTH`
     - User: `USER_NAME_MAX_LENGTH`
     - Timing: `SIGN_IN_PROMPT_DELAY_MS`, `AUTO_SAVE_DEBOUNCE_MS`
     - Assets: `ASSETS.ICON`, `ASSETS.ICON_LARGE`
     - Branding: `APP_NAME`
     - Routes: `ROUTES` (centralized route paths: `HOME`, `DASHBOARD`, `PROFILE`, `CAREER`)
     - Header: `HEADER_SCROLL_THRESHOLD`, `HEADER_HEIGHT_DEFAULT`, `HEADER_HEIGHT_SCROLLED`, `NAV_LINKS`
     - Background: `BACKGROUND_CONFIG` (grid, colors, mouse interaction settings)
     - Hero: `HERO_ICON_ROTATION_DURATION`
     - Auth: `PROVIDER_COLORS` (brand colors for OAuth providers)
     - SEO: `SITE_URL`, `APP_DESCRIPTION`, `SEO_CONFIG` (organization details with foundingDate/supportedLanguages/expertiseAreas/socialProfiles, software details with version/applicationCategory/features, course defaults for JSON-LD, aiCrawlers list for robots.txt, disallowedPaths, FAQ data for GEO, HowTo steps for AI search engines)
     - Master Graph: `MASTER_GRAPH_CONFIG` (node sizes, radii, edge colors for skill universe visualization)
     - AI Chat: `AI_CHAT_CONFIG` (panel dimensions, API settings like model/temperature/maxTokens, animation timing, search keywords)
     - Tavily: `TAVILY_CONFIG` (API URL, search depth defaults, domain filters for trending tech and career skills searches)
     - Merge: `MERGE_CONFIG` (similarityThreshold for highlighting recommended maps to merge)
     - Learning: `LEARNING_CONFIG` (platform domains for courses/video/docs/community, cacheTtlSeconds for Redis caching, searchDepth, maxResults, descriptionPreviewLength, levelThresholds for beginner/intermediate/advanced, maxAffiliatedLinks, modal dimensions, platformInfo with name/icon/color for each platform), derived constant: `LEARNING_PLATFORM_DOMAINS`
     - Resume Export: `RESUME_CONFIG` (bioMaxLength, experienceMaxItems, pdfMaxSkillsPerCategory, aiModel, aiMaxTokens, aiJobAnalysisMaxTokens, aiTemperature, jobUrlTimeout, jobContentMaxChars, jobTitleMaxLength, previewSkillCategories, previewSkillsPerCategory, previewHighlightsCount, pdfLabels for i18n-ready section titles including watermarkMain/watermarkSub for free tier, monthAbbreviations for date formatting)
     - Document Import: `DOCUMENT_IMPORT_CONFIG` (maxFileSizeBytes, charsPerToken, fileTypes with extensions/mimeTypes, userAgent, portfolioDomains, aiExtraction settings with models/tokens/temperature/limits, preview settings with confidenceThresholds/maxDisplayedExperiences, modal settings with maxHeightVh/headerHeightPx), derived constants: `SUPPORTED_EXTENSIONS`, `SUPPORTED_MIME_TYPES`, `IMAGE_EXTENSIONS`, `EXTENSION_TO_MIME`, `SUPPORTED_FILE_ACCEPT`
     - Billing: `BILLING_CONFIG` (tiers with name/maxMaps/hasWatermark/monthlyCredits, creditCosts per operation, signupBonus, creditPacks with amounts, stripePrices from env vars, fallbackPrices for display when Stripe unavailable), derived types: `SubscriptionTier`, `CreditOperation`
     - API Routes: `API_ROUTES` (centralized API endpoint paths: `AI_CHAT`, `AI_GENERATE`, `AI_ANALYZE`, `AI_MERGE`, `USER_GRAPH`, `USER_PROFILE`, `USER_MASTER_MAP`, `USER_CREDITS`, `USER_SUBSCRIPTION`, `MAP`, `MAP_FORK`, `IMPORT_DOCUMENT`, `IMPORT_URL`, `RESUME_GENERATE`, `LEARNING_RESOURCES`, `ADMIN_AFFILIATED_LINKS`, `STRIPE_CHECKOUT`, `STRIPE_PORTAL`, `STRIPE_PRICES`)
     - React Query: `QUERY_CONFIG` (staleTime, gcTime, retryCount for client-side caching)
     - Landing Page: `LANDING_PAGE_CONFIG` (featuredCareers array, stats array, workflowSteps array, demo settings with orbitalSkillCount/orbitalRadius/connectionLineWidth, animation timing with sectionDelay/staggerDelay/duration)

2. **Check `components/` for existing UI**:
   - `components/ui/` - `GlassPanel`, `XPProgressRing`, `SearchInput`, `ShareModal`, `LanguageSwitcher`, `DropdownMenu` (reusable 3-dots menu), `ConfirmModal` (styled confirmation dialog), `Toast`/`Toaster`/`showToast` (toast notifications via react-hot-toast), `FileDropzone` (drag-and-drop file upload), `Icons` (common: `MenuIcon`, `CloseIcon`, `ChevronRightIcon`, `WeChatIcon`, `GoogleIcon`; AI chat: `ChatIcon`, `MinimizeIcon`, `SendIcon`, `WarningIcon`, `EditIcon`, `TrashIcon`, `ConnectionIcon`, `ArrowRightIcon`, `PreviewIcon`, `CheckCircleIcon`, `MergeIcon`; menu: `MoreVerticalIcon`, `ShareIcon`, `SaveIcon`, `SortIcon`; import: `UploadIcon`, `DocumentIcon`, `LinkIcon`, `FilePdfIcon`, `FileTextIcon`, `FileWordIcon`, `FileImageIcon`, `ImportIcon`; resume: `PlusIcon`, `BriefcaseIcon`, `DownloadIcon`, `ResumeIcon`, `SparklesIcon`; learning: `BookOpenIcon`, `ExternalLinkIcon`, `StarIcon`)
   - `components/layout/` - `Header` (site navigation with mobile menu), `SkillTreeBackground` (animated network background)
   - `components/skill-graph/` - `SkillGraph`, `LazySkillGraph` (dynamic import wrapper), `SkillGraphSkeleton`, `SkillNode`, `CenterNode`, `SkillEdge`, layout utilities
   - `components/auth/` - `AuthModal` (login modal with social/Web3 tabs)
   - `components/ai-chat/` - `AIChatPanel` (floating chat panel with document import), `ChatMessage`, `ChatInput`, `ModificationPreview` (changes confirmation modal), `MergeMapModal` (merge skill maps UI)
   - `components/import/` - `DocumentImportModal` (modal for importing skills from documents/URLs), `ImportPreview` (preview extracted skills before confirmation)
   - `components/resume/` - `ResumePDF` (PDF template using @react-pdf/renderer, accepts `hasWatermark` prop for free tier overlay), `ResumeExportModal` (multi-stage modal for resume generation with PDF preview), `PDFDownloadButton` (wrapper for dynamic PDF download to avoid SSR issues), `PDFPreviewPanel` (inline PDF viewer using PDFViewer)
   - `components/learning/` - `LearningResourcesModal` (modal for displaying learning resources from web search and affiliated links)
   - `components/seo/` - `JsonLd`, `OrganizationJsonLd`, `SoftwareAppJsonLd` (structured data for SEO)
   - `components/providers/` - `AuthProvider`, `Web3Provider`, `QueryProvider` (React Query for data fetching)
   - `components/dashboard/` - `MasterSkillMap` (dashboard hero with graph), `MasterSkillGraph`, `LazyMasterSkillGraph` (dynamic import wrapper), `MasterSkillGraphSkeleton`, `ExperienceEditor` (modal for managing work experience)

3. **Check `hooks/`** - Custom React hooks:
   - `useShareScreenshot` - Screenshot/share functionality
   - `useQueryHooks.ts` - React Query hooks for data fetching:
     - `useUserGraphs()` - Fetch user's saved career graphs with caching
     - `useUserProfile()` - Fetch user profile (bio, experience)
     - `useMasterMap()` - Fetch master skill map data
     - `useDeleteMap()` - Mutation for deleting maps (invalidates cache)
     - `useUpdateProfile()` - Mutation for profile updates
     - `useUserCredits()` - Fetch user's credit balance and history
     - `useUserSubscription()` - Fetch user's subscription info and limits
     - `useStripePrices()` - Fetch prices from Stripe (cached 10 min)
     - `formatStripePrice()` - Format Stripe cents to currency display
     - `queryKeys` - Centralized query keys for cache invalidation

4. **Check `i18n/` for internationalization**:
   - `i18n/routing.ts` - Locale configuration: `locales`, `Locale` type, `defaultLocale`, `routing`, `ogLocaleMap`, `getOgLocale()`, `getLocalePath()`
   - `i18n/request.ts` - Server-side request configuration for next-intl
   - `i18n/navigation.ts` - Locale-aware navigation: `Link`, `useRouter`, `usePathname`, `redirect`
   - **Important**: Always import `locales` and `Locale` type from `@/i18n/routing` - never define locale arrays elsewhere
   - **Important**: Use `getOgLocale()` for Open Graph locale codes - add new locales to `ogLocaleMap`
   - **Important**: Use `getLocalePath(locale, path)` for auth callbacks (signIn/signOut) where next-intl's Link/router can't be used

5. **Check `messages/` for translations**:
   - `messages/en.json` - English translations
   - `messages/zh.json` - Chinese translations
   - `messages/ja.json` - Japanese translations
   - Translation namespaces: `common`, `header`, `home`, `career`, `dashboard`, `featuredCareers`, `languageSwitcher`, `auth`, `masterMap`, `seo`, `aiChat`, `skillGraph`, `import`, `resume`, `learning`, `billing`, `pricing`

6. **Check `components/skill-graph/` for layout utilities**:
   - `constants.ts` - Layout constants: `LAYOUT_CONFIG` (node sizes, center node dynamic sizing, ring spacing, max nodes per ring), `CENTER_NODE_ID`
   - `radial-layout.ts` - `getRadialLayout()` with options: `preservePositions` (keep saved positions), `centerNodeTitle` (enable dynamic center node sizing)
   - `layout-utils.ts` - Edge handle utilities, seeded random for consistent jitter
   - `CenterNode.tsx` - Dynamic center node component (size adjusts based on title length using `LAYOUT_CONFIG` constants)

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

**Primary Flow (Import → Visualize → Export):**
1. User uploads resume/document on landing page → `DocumentImportModal` opens
2. AI extracts skills, bio, work experience → `POST /api/import/document` or `/api/import/url`
3. Skills converted to SkillNodes → `POST /api/map/fork` creates new skill map
4. User views and customizes skill map on career page
5. User exports AI-tailored resume → `POST /api/resume/generate`

**Secondary Flow (Career Exploration):**
1. User enters a query on the landing page → `POST /api/ai/analyze` analyzes if it's a specific career or vague preference
2. Specific career (e.g., "Software Engineer") → redirects to `/career/{canonicalKey}`
3. Vague query (e.g., "I want to work remotely") → shows career suggestions modal with AI recommendations
4. Career page → `POST /api/ai/generate` → OpenAI gpt-4o-mini generates skill map JSON
5. Generated data is cached in Upstash Redis and persisted to Neon PostgreSQL
6. Skill map is rendered as an interactive graph using React Flow (@xyflow/react)

### Landing Page Structure

The landing page (`app/[locale]/(marketing)/page.tsx`) is organized into modular sections:

**Sections (top to bottom):**
1. **HeroSection** - Main headline, Import CTA button, "or explore careers" link
2. **TwoPathsSection** - Two cards: "Start from Resume" vs "Explore Career Paths"
3. **WorkflowSection** - 3-step process: Import → Visualize → Export
4. **FeaturesSection** - 6 feature cards (Import, Skill Maps, Resume, Chat, Universe, Share)
5. **DemoPreviewSection** - Animated skill graph visualization with orbital nodes
6. **StatsSection** - Platform statistics (skills mapped, career paths, etc.)
7. **SecondaryCTASection** - Career search with SearchInput + featured careers
8. **Footer** - Build credits

**Key Integration Points:**
- `DocumentImportModal` opens from Hero CTA and TwoPathsSection
- `SuggestionsModal` opens when vague career query returns suggestions
- All text uses i18n translations from `home.*` namespace
- All configurable values use `LANDING_PAGE_CONFIG` from constants

**Configuration:**
All landing page data is centralized in `LANDING_PAGE_CONFIG` (lib/constants.ts):
```typescript
LANDING_PAGE_CONFIG = {
  featuredCareers: [{ titleKey, icon, key }],  // Popular career buttons
  stats: [{ key, value }],                      // Stats section metrics
  workflowSteps: [{ key, icon }],               // How it works steps
  demo: { orbitalSkillCount, orbitalRadius, connectionLineWidth },
  animation: { sectionDelay, staggerDelay, duration },
}
```

### Key Directories

- `app/[locale]/` - Locale-prefixed pages (e.g., `/en/career/...`, `/zh/career/...`)
- `app/api/` - API routes: `/ai/generate`, `/ai/analyze`, `/ai/chat` (streaming AI chat), `/ai/merge` (smart merge two maps), `/career/[careerId]`, `/career/search`, `/skill/test`, `/user/graph`, `/user/master-map`, `/user/profile` (GET/PATCH user profile with bio/experience), `/user/credits` (GET credit balance/history), `/user/subscription` (GET subscription info), `/map/[mapId]`, `/map/fork`, `/map/[mapId]/copy`, `/import/document` (file upload), `/import/url` (URL import), `/resume/generate` (AI resume generation), `/stripe/checkout` (create Stripe checkout session), `/stripe/webhook` (Stripe webhook handler), `/stripe/portal` (billing portal)
- `components/skill-graph/` - React Flow visualization: `SkillGraph.tsx` (main), `SkillNode.tsx`, `SkillEdge.tsx`, radial/dagre layout utilities
- `i18n/` - Internationalization configuration (next-intl)
- `messages/` - Translation files (en.json, zh.json, ja.json)
- `lib/db/schema.ts` - Drizzle schema: careers, skillGraphs, skills, users (NextAuth), userCareerGraphs, userSkillProgress, affiliatedLinks, subscriptions, credits, creditTransactions
- `lib/ai.ts` - OpenAI integration (gpt-4o-mini): `generateCareerSkillTree()`, `generateSkillTestQuestions()`, `gradeSkillTestAnswers()`, `analyzeCareerQuery()`, types: `CareerSuggestion`, `QueryAnalysisResult`

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

// Auth callbacks (signIn/signOut where next-intl routing doesn't apply)
import { getLocalePath } from '@/i18n/routing';
import { ROUTES } from '@/lib/constants';
signIn('google', { callbackUrl: getLocalePath(locale, ROUTES.DASHBOARD) });
signOut({ callbackUrl: getLocalePath(locale) }); // Redirects to locale root
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

NextAuth.js with four providers:
- Google OAuth
- Twitter OAuth 2.0
- WeChat OAuth (Web QR code + in-app browser)
- Web3 wallet (SIWE - Sign-In with Ethereum via wagmi/RainbowKit)

Session strategy is JWT. Auth config in `lib/auth.ts`.

**WeChat Login:**
- `lib/wechat-provider.ts` - Custom OAuth provider supporting two flows:
  - `WeChatProvider` - Web QR code login for desktop browsers (uses `qrconnect` endpoint)
  - `WeChatMPProvider` - In-app browser login when user is inside WeChat (uses `oauth2/authorize` endpoint)
- `isWeChatBrowser()` - Client-side helper to detect WeChat's in-app browser
- `AuthModal.tsx` automatically detects browser type and uses appropriate provider
- Requires `WECHAT_APP_ID` and `WECHAT_APP_SECRET` environment variables (optional - WeChat login is disabled if not set)

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
- `GET /api/map/[mapId]` - Fetch map by UUID or shareSlug (returns `customNodes`/`customEdges` if available)
- `PATCH /api/map/[mapId]` - Update map settings (owner only):
  - `title`, `isPublic`, `nodeData` (progress/positions)
  - `customNodes`, `customEdges` (for merged/AI-modified graphs)
  - `deleteSourceMapId` (delete another map after merge)
- `DELETE /api/map/[mapId]` - Delete map (owner only)
- `POST /api/map/fork` - Create map from career or another map
- `POST /api/map/[mapId]/copy` - Copy public map to own account

### Database Schema (lib/db/schema.ts)

- `careers` - Generated careers with canonicalKey (unique slug)
- `skillGraphs` - JSONB nodes/edges for each career (base template)
- `userCareerGraphs` - User's saved skill tree maps with:
  - `title` - Custom title for the map
  - `nodeData` - JSONB array of skill progress and positions
  - `customNodes` - JSONB array of custom nodes (from merge or AI modifications, overrides base skillGraph)
  - `customEdges` - JSONB array of custom edges (from merge or AI modifications, overrides base skillGraph)
  - `isPublic` - Whether the map can be viewed by others
  - `shareSlug` - 6-char alphanumeric slug for short URLs
  - `copiedFromId` - UUID of source map if copied from another user
- `userSkillProgress` - Per-skill progress tracking

**Custom Graph Data:**
When a user merges maps or applies AI modifications, the new nodes/edges are stored in `customNodes`/`customEdges`. The API returns custom data when available, falling back to the base `skillGraphs` data otherwise.

### Master Skill Map (Dashboard)

The dashboard displays a "Skill Universe" visualization showing all user's careers and skills in a unified graph:

**Data Flow:**
1. User visits dashboard → `GET /api/user/master-map` fetches all career graphs with skills
2. Data returned directly from database (no AI processing)
3. `MasterSkillGraph` component renders React Flow graph with radial layout

**Graph Structure:**
- Center node: User name with overall mastery percentage
- Secondary nodes: Each career path (clickable to navigate)
- Tertiary nodes: Skills from each career (color-coded by progress)

**Layout Configuration** (`MASTER_GRAPH_CONFIG` in constants):
- `centerNodeSize`: 140px
- `careerRadius`: 250px from center
- `skillRadius`: 120px from career
- `maxDisplayedSkillsPerCareer`: 12 (for performance)
- `edgeColors`: mastered (green), inProgress (amber), notStarted (gray)

**Components:**
- `MasterSkillMap` - Container with stats header and graph
- `MasterSkillGraph` - React Flow visualization with custom node types

### AI Chat Feature

The career page includes an AI-powered chat panel for modifying skill maps via natural language:

**Components:**
- `AIChatPanel` - Floating collapsible chat panel (bottom-right corner)
- `ChatMessage` - Individual message display with modification badges
- `ChatInput` - Text input with auto-resize and send button
- `ModificationPreview` - Modal showing changes before applying
- `MergeMapModal` - UI for merging two skill maps

**Data Flow:**
1. User sends message → `POST /api/ai/chat` with skill map context
2. API performs Tavily web search if trending tech keywords detected
3. OpenAI generates JSON response with message and modifications
4. Streaming response updates UI in real-time
5. If modifications present, shows preview modal for confirmation
6. User confirms → changes applied to skill graph
7. Undo button restores previous state (single-level undo)

**Merge Flow:**
1. User clicks merge → `MergeMapModal` fetches user's other maps (similar maps highlighted)
2. User selects map to merge → `POST /api/ai/merge` with both maps
3. AI generates intelligent merge combining both skill sets
4. Preview shows merged result → user confirms to apply
5. Merged data saved to `customNodes`/`customEdges`, source map deleted

**Configuration:**
All AI chat settings are in `AI_CHAT_CONFIG` (lib/constants.ts):
- `model`: OpenAI model to use (default: 'gpt-4o-mini')
- `maxTokens`: Token limit for responses
- `temperature`: Response randomness
- `chatHistoryLimit`: Messages to include in context

**Web Search Integration:**
- Uses Tavily API for searching trending technologies
- Configured via `TAVILY_API_KEY` environment variable (optional)
- Auto-triggered when user mentions "trending", "latest", "2024/2025", etc.

**Scope Guard:**
AI is restricted to skill map related tasks only. Off-topic requests are declined gracefully with `isOffTopic: true` in response.

### Document Import Feature

Users can import skills, professional bio, and work experience from resumes, portfolios, or web profiles to create or update skill maps:

**Supported Input Types:**
- PDF files (resumes, CVs)
- Word documents (.doc, .docx)
- Images (.png, .jpg, .gif, .webp) - uses GPT-4o vision
- Text/Markdown files
- URLs (LinkedIn profiles, GitHub, personal websites)

**Entry Points:**
1. Dashboard: Import button creates new skill maps from documents
2. AI Chat: "Import from document" suggestion updates existing maps

**Extracted Data:**
- Skills with categories, levels, and confidence scores
- Professional bio/summary (2-4 sentences)
- Work experience (company, title, dates, location, description)

**Data Flow:**
1. User uploads file or enters URL
2. `POST /api/import/document` or `POST /api/import/url` parses content
3. `lib/document-parser.ts` extracts text (pdf-parse for PDFs, cheerio + @extractus/article-extractor for URLs)
4. `lib/ai-document.ts` uses OpenAI to extract skills, bio, and work experience
5. For LinkedIn/login-walled sites, Tavily API provides fallback content extraction
6. Preview modal shows extracted skills, bio, and work experience with confidence indicators
7. User confirms → skills converted to SkillNodes, bio and experience saved to user profile

**Components:**
- `DocumentImportModal` - Tab-based modal for file upload or URL input
- `ImportPreview` - Shows extracted skills grouped by category before confirmation
- `FileDropzone` - Drag-and-drop file upload with validation

**API Routes:**
- `POST /api/import/document` - Multipart form upload for files (uses nodejs runtime)
- `POST /api/import/url` - JSON body with URL to import

**Configuration:**
`DOCUMENT_IMPORT_CONFIG` in `lib/constants.ts`:
- `maxFileSizeBytes`: 20MB limit
- `maxContentTokens`: 8000 tokens for content processing
- `minContentLength`: 50 chars minimum for valid document
- `minTextContentLength`: 20 chars minimum for text files
- `charsPerToken`: 4 chars per token for truncation calculation
- `fileTypes`: Single source of truth for all supported file types (pdf, word, text, image)
- `urlTimeout`: 30 seconds for URL fetching
- `maxUrlContentLength`: 100000 characters for URL content
- `userAgent`: Bot user agent string for URL fetching
- `portfolioDomains`: Domains to detect as portfolio sites
- `aiExtraction`:
  - `textModel`: gpt-4o-mini for text documents
  - `visionModel`: GPT-4o for image analysis
  - `maxTokens`: 4000 tokens for AI responses
  - `temperature`: 0.5 for extraction
  - `mergeTemperature`: 0.3 for merge operations
  - `maxInputTokens`: 6000 tokens for text truncation
  - `minSkills`: 10 minimum skills to extract
  - `maxSkills`: 25 maximum skills to extract
  - `importedSkillProgress`: 100 (skills from resumes are marked as learned)
  - `existingSkillsLimit`: 20 max existing skills in context
  - `mergeSkillsLimit`: 30 max skills per map in merge
  - `mergeEdgesLimit`: 50 max edges per map in merge
- `preview`:
  - `maxDisplayedSkillsPerCategory`: 8 skills shown per category
  - `maxDisplayedCategories`: 5 max categories in summary
  - `maxDisplayedExperiences`: 5 max work experiences in preview
  - `confidenceThresholds.high`: 0.8 for high confidence
  - `confidenceThresholds.medium`: 0.5 for medium confidence
- `modal`:
  - `maxHeightVh`: 85 (modal max height as viewport percentage)
  - `headerHeightPx`: 200 (header + padding + actions height for scroll calculation)

Derived constants (computed from fileTypes):
- `SUPPORTED_EXTENSIONS`: All supported file extensions
- `SUPPORTED_MIME_TYPES`: All supported MIME types
- `IMAGE_EXTENSIONS`: Image-only extensions
- `EXTENSION_TO_MIME`: Extension to MIME type mapping
- `SUPPORTED_FILE_ACCEPT`: HTML file input accept attribute string

**Update vs Create Mode:**
- Dashboard: Creates new skill maps (`mode='create'`)
- AI Chat: Updates existing maps (`mode='update'`), filtering out duplicate skills

### Resume Export Feature

Users can generate professional PDF resumes based on their skill maps and work experience:

**Components:**
- `ResumeExportModal` - Multi-stage modal (input → generating → preview → pdfPreview → download)
- `ResumePDF` - PDF template using @react-pdf/renderer with professional styling and text-based watermark
- `PDFDownloadButton` - Wrapper for dynamic PDF download (avoids SSR issues)
- `PDFPreviewPanel` - Inline PDF viewer using `PDFViewer` for live preview before download
- `ExperienceEditor` - Modal for managing work experience entries

**Data Flow:**
1. Dashboard shows bio textarea (with explicit Save button) and work experience management
2. User clicks "Export Resume" → opens `ResumeExportModal`
3. User optionally enters job title or job posting URL for tailored resume
4. `POST /api/resume/generate` fetches user's skills from all career maps
5. If job URL provided, `parseURL()` extracts content and AI analyzes requirements
6. AI generates tailored resume content (summary, skills grouped by relevance, highlights)
7. API checks subscription tier via `shouldHaveWatermark()` and returns `hasWatermark` flag
8. Preview stage shows generated content with editable summary and PDF options (watermark/footer toggles)
9. User can click "Preview PDF" to see full PDF in `pdfPreview` stage
10. User downloads PDF via `PDFDownloadLink` (client-side rendering)
11. Free tier PDFs include "SKILL MAP" watermark overlay; Pro/Premium can toggle it off

**PDF Options:**
- `showWatermark` toggle - Always visible, but free tier users cannot turn it off (forced ON)
- `showFooter` toggle - Controls footer text display ("Generated by Personal Skill Map • date")
- Toggles update PDF preview in real-time using `key` props for component remounting

**Watermark Feature:**
- Free tier users see a watermark on exported PDFs (configured in `BILLING_CONFIG.tiers.free.hasWatermark`)
- `shouldHaveWatermark(userId)` in `lib/subscription.ts` checks user's tier
- Watermark uses text-based overlay (not image) for @react-pdf/renderer compatibility
- Watermark text configured in `RESUME_CONFIG.pdfLabels.watermarkMain` ("SKILL MAP") and `watermarkSub` ("Powered by Personal Skill Map")
- Pro/Premium tiers have `hasWatermark: false` and can toggle watermark on/off

**React-PDF Implementation Notes:**
- All PDF components use `next/dynamic` with `ssr: false` to avoid SSR issues
- `isMounted` state pattern ensures client-side only rendering
- `key` props on PDF components force complete remount when toggle states change (fixes react-pdf re-render issues)
- Watermark uses `fixed` prop on `View` to appear on every page

**API Route:**
- `POST /api/resume/generate` - Generate resume content
  - Input: `{ locale, jobTitle?, jobUrl? }`
  - Returns: profile, experience, AI-generated resumeContent, jobRequirements, stats, hasWatermark

**Database Schema (users table):**
- `bio: text` - Professional bio/summary
- `experience: jsonb` - Array of `WorkExperience` objects

**WorkExperience Type:**
```typescript
interface WorkExperience {
  id: string;
  company: string;
  title: string;
  startDate: string; // YYYY-MM format
  endDate: string | null; // null = current position
  description: string;
  location?: string;
}
```

**Configuration** (`RESUME_CONFIG` in constants):
- `bioMaxLength`: 500 chars
- `experienceMaxItems`: 10 max work experiences
- `aiModel`: gpt-4o-mini for content generation
- `aiMaxTokens`: 4000 for resume generation
- `aiJobAnalysisMaxTokens`: 2000 for job analysis
- `previewSkillCategories`: 3 categories in preview
- `previewSkillsPerCategory`: 4 skills per category in preview
- `previewHighlightsCount`: 3 highlights in preview
- `pdfLabels`: Section titles for i18n:
  - `applyingFor`, `professionalSummary`, `keyHighlights`, `skills`, `workExperience`, `footer`, `present`
  - `watermarkMain`: Main watermark text ("SKILL MAP")
  - `watermarkSub`: Secondary watermark text ("Powered by Personal Skill Map")
- `monthAbbreviations`: Date formatting array

**AI Functions** (`lib/ai-resume.ts`):
- `analyzeJobPosting(content, jobTitle, locale)` - Extract requirements from job posting
- `analyzeJobTitle(jobTitle, locale)` - Infer requirements from title alone
- `generateResumeContent(profile, careers, jobRequirements, locale)` - Generate tailored content

### Learning Resources Feature

Users can discover learning resources for any skill in their skill map:

**Entry Point:**
- Click "Start Learning" button on any available skill in the skill graph

**Data Flow:**
1. User clicks "Start Learning" on a skill → `LearningResourcesModal` opens
2. `GET /api/learning/resources?skillName=...` fetches resources
3. API queries `affiliatedLinks` table for pattern-matched affiliated links
4. API searches Tavily for web learning resources (courses, videos, docs)
5. Results displayed with affiliated links highlighted at top

**Components:**
- `LearningResourcesModal` - Modal displaying learning resources with platform icons
- Located in `components/learning/`

**API Routes:**
- `GET /api/learning/resources` - Fetch learning resources for a skill
  - Query params: `skillName` (required), `category`, `level`
  - Returns: `affiliatedLinks[]`, `webResults[]`, `totalCount`
- `GET/POST/PUT/DELETE /api/admin/affiliated-links` - CRUD for affiliated links (admin)

**Database Schema (affiliatedLinks table):**
```typescript
{
  id: uuid,
  url: text,
  title: text,
  description: text,
  platform: text, // 'udemy', 'coursera', 'youtube', etc.
  imageUrl: text,
  skillPatterns: jsonb, // Array of patterns to match skill names
  categoryPatterns: jsonb, // Optional category patterns
  priority: integer, // Higher = shown first
  isActive: boolean,
  clickCount: integer,
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

**Configuration** (`LEARNING_CONFIG` in constants):
- `platforms`: Domain groups for courses/video/docs/community
- `searchDepth`: 'advanced' for Tavily search
- `maxResults`: 10 web results
- `descriptionPreviewLength`: 200 chars for truncation
- `levelThresholds`: `{ beginner: 3, intermediate: 6 }` for difficulty mapping
- `maxAffiliatedLinks`: 3 affiliated links per skill
- `modal`: `{ maxHeightVh: 80, headerHeightPx: 60 }`
- `platformInfo`: Display info (name, icon, color) for each platform

**Affiliated Link Matching:**
Uses JSONB array pattern matching in PostgreSQL:
- `skillPatterns: ["react", "frontend"]` matches skills containing "react" or "frontend"
- Case-insensitive partial matching
- Results ordered by `priority` descending

### Billing & Credit System

The app has a credit-based billing system integrated with Stripe for payments:

**Subscription Tiers:**
| Tier | Max Maps | Watermark | Monthly Credits |
|------|----------|-----------|-----------------|
| Free | 1 | Yes | 0 |
| Pro | Unlimited | No | 1000 |
| Premium | Unlimited | No | 3000 |

**Credit System:**
- New users receive 500 credits ($5 worth) on signup
- AI operations consume credits based on token usage (see `BILLING_CONFIG.creditCosts`)
- Credits are deducted after successful operations (not on failed attempts)
- All transactions recorded in `creditTransactions` table for audit trail

**Key Files:**
- `lib/stripe.ts` - Stripe client with lazy initialization (avoids build-time errors)
- `lib/credits.ts` - Credit management (check, deduct, add, history)
- `lib/subscription.ts` - Subscription management and webhook handlers
- `lib/constants.ts` - `BILLING_CONFIG` with all tier definitions and credit costs

**API Routes:**
- `POST /api/stripe/checkout` - Create Stripe checkout session for subscription or credit pack
  - Handles upgrades/downgrades: checks for existing subscription and uses `stripe.subscriptions.update()` instead of creating new checkout session
  - Returns `{ upgraded: true, redirectUrl }` for immediate plan changes (no Stripe checkout redirect)
- `POST /api/stripe/webhook` - Handle Stripe webhook events (subscription lifecycle, payments)
  - Events handled: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`, `invoice.paid`, `invoice.payment_failed`, `checkout.session.completed`
  - **Local development**: Run `stripe listen --forward-to localhost:3000/api/stripe/webhook`
  - **Production**: Configure webhook endpoint in Stripe Dashboard with `STRIPE_WEBHOOK_SECRET`
- `POST /api/stripe/portal` - Create Stripe billing portal session (returns to `/pricing?portal=true`)
- `GET /api/stripe/prices` - Fetch prices from Stripe (cached via React Query for 10 min)
- `GET /api/user/credits` - Get user's credit balance and transaction history
- `GET /api/user/subscription` - Get user's subscription info and computed limits
  - Note: `maxMaps` is returned as `-1` for unlimited (JSON cannot serialize `Infinity`)

**Database Schema:**
```typescript
// User subscriptions (Stripe integration)
subscriptions: {
  userId: uuid,           // References users.id
  stripeCustomerId: text, // Stripe customer ID
  stripeSubscriptionId: text,
  stripePriceId: text,
  tier: 'free' | 'pro' | 'premium',
  status: 'active' | 'canceled' | 'past_due' | 'paused',
  currentPeriodEnd: timestamp,
  cancelAtPeriodEnd: boolean,
}

// User credit balance
credits: {
  userId: uuid,           // References users.id
  balance: integer,       // Current credit balance (default: 500)
}

// Credit transaction audit trail
creditTransactions: {
  userId: uuid,
  amount: integer,        // Negative = deduction, Positive = addition
  balanceAfter: integer,
  type: 'usage' | 'purchase' | 'subscription' | 'bonus' | 'refund',
  operation: string,      // 'ai_generate', 'signup_bonus', etc.
  metadata: jsonb,        // Additional context (query, locale, etc.)
}
```

**Integrating Credit Checks in API Routes:**
```typescript
import { hasEnoughCredits, deductCredits } from '@/lib/credits';

// Check credits before expensive operation
if (session?.user?.id) {
  const creditCheck = await hasEnoughCredits(session.user.id, 'ai_generate');
  if (!creditCheck.sufficient) {
    return NextResponse.json({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
      creditsRequired: creditCheck.required,
      creditsBalance: creditCheck.balance,
    }, { status: 402 });
  }
}

// Perform AI operation...

// Deduct credits after success
if (session?.user?.id) {
  const { newBalance } = await deductCredits(session.user.id, 'ai_generate', { query });
  // Optionally include newBalance in response
}
```

**Checking Subscription Limits:**
```typescript
import { canCreateMap, shouldHaveWatermark } from '@/lib/subscription';

// Check map limit before creating
const allowed = await canCreateMap(userId);
if (!allowed) {
  return NextResponse.json({ error: 'Map limit reached', code: 'MAP_LIMIT_REACHED' }, { status: 403 });
}

// Check watermark for resume export
const hasWatermark = await shouldHaveWatermark(userId);
```

**Handling Unlimited Maps on Client:**
The API returns `-1` for `maxMaps` when tier has unlimited maps (since `Infinity` can't be JSON serialized):
```typescript
// In client component
const isUnlimited = subscription.limits.maxMaps === -1;
const displayLimit = isUnlimited ? '∞' : subscription.limits.maxMaps;
```

**Pricing Page (`app/[locale]/pricing/page.tsx`):**
- Shows subscription tiers with pricing from Stripe API
- "Your Current Plan" section at top showing:
  - Current subscription tier and status
  - Credits balance
  - "Manage Subscription" button (opens Stripe billing portal)
  - "Update Payment Method" button
  - Renewal/expiration date for active subscriptions (shows "Expires on" if `cancelAtPeriodEnd`)
- Price IDs are fetched from Stripe API, not hardcoded (server env vars not available in client)
- Handles URL params for data refresh:
  - `?upgraded=true` - Shows success toast and refetches subscription data after plan change
  - `?portal=true` - Refetches subscription data after returning from Stripe Portal
- Uses Suspense boundary for `useSearchParams` (required by Next.js 15)

**User Menu Billing Link:**
User dropdown menu (`components/auth/UserMenu.tsx`) includes a "Billing" link that navigates to `/pricing`.

**Configuration** (`BILLING_CONFIG` in constants):
- `tiers`: Subscription tier definitions with limits
- `creditCosts`: Credit cost per operation type
- `signupBonus`: 500 credits for new users
- `creditPacks`: Credit pack amounts (500, 2000, 5000)
- `stripePrices`: Stripe price IDs from environment variables (server-side only)

### Loading Optimization

The app implements comprehensive loading optimization for better perceived performance:

**Loading Pages (Next.js Suspense Boundaries):**
- `app/[locale]/dashboard/loading.tsx` - Dashboard skeleton with profile, stats grid, and career cards
- `app/[locale]/career/[careerId]/loading.tsx` - Career page skeleton with header, stats bar, and graph placeholder

**Skeleton Components:**
- `SkillGraphSkeleton` - Animated orbital node visualization while React Flow loads
- `MasterSkillGraphSkeleton` - Skill universe loading state with career/skill nodes

**Lazy Loading Heavy Components:**
Use `next/dynamic` with `ssr: false` for heavy client-side components:
```tsx
import dynamic from 'next/dynamic';

// Lazy load React Flow components (~100KB savings)
const LazySkillGraph = dynamic(
  () => import('@/components/skill-graph/LazySkillGraph').then(mod => mod.LazySkillGraph),
  { ssr: false }
);

// Lazy load heavy modals
const DocumentImportModal = dynamic(
  () => import('@/components/import/DocumentImportModal').then(mod => mod.DocumentImportModal),
  { ssr: false }
);
```

**Components with Lazy Wrappers:**
- `LazySkillGraph` - Wraps SkillGraph with dynamic import and skeleton fallback
- `LazyMasterSkillGraph` - Wraps MasterSkillGraph with dynamic import

**React Query for Data Fetching:**
Use React Query hooks instead of manual `useEffect` fetching:
```tsx
import { useUserGraphs, useUserProfile, useDeleteMap } from '@/hooks/useQueryHooks';

// In component:
const { data: graphs, isLoading } = useUserGraphs(!!userId);
const deleteMapMutation = useDeleteMap();

// Delete with automatic cache invalidation
deleteMapMutation.mutate(mapId, {
  onSuccess: () => showToast.success('Deleted'),
});
```

**Query Configuration** (`QUERY_CONFIG` in constants):
- `staleTime`: 60 seconds - data considered fresh
- `gcTime`: 5 minutes - cache retention
- `retryCount`: 1 - retry failed requests once

**Best Practices:**
1. Use `loading.tsx` files for route-level loading states
2. Use skeleton components that match the actual UI layout
3. Lazy load React Flow, PDF renderer, and heavy modals
4. Use React Query hooks for data fetching with caching
5. Prefer lazy loading for components not needed on initial render

### Skill Graph Layout

The skill graph uses a radial layout algorithm with smart features:

**Layout Configuration** (`LAYOUT_CONFIG` in `components/skill-graph/constants.ts`):
- Node dimensions:
  - `NODE_WIDTH`: 160 - Skill node width
  - `NODE_HEIGHT`: 140 - Skill node height
- Center node sizing (dynamic based on title length):
  - `CENTER_NODE_SIZE`: 200 - Base size
  - `CENTER_NODE_MAX_SIZE`: 300 - Maximum dynamic size
  - `CENTER_NODE_TITLE_THRESHOLD`: 20 - Characters before size increases
  - `CENTER_NODE_GROWTH_FACTOR`: 3 - Pixels per character over threshold
  - `CENTER_NODE_DECORATIVE_RINGS_SPACE`: 30 - Space for decorative rings
  - `CENTER_NODE_GAP`: 50 - Gap between center edge and first ring
  - `CENTER_NODE_CONTENT_PADDING`: 48 - Padding inside center node
  - `CENTER_NODE_FONT_SIZE_SMALL_THRESHOLD`: 40 - Characters for smallest font
  - `CENTER_NODE_FONT_SIZE_MEDIUM_THRESHOLD`: 25 - Characters for medium font
- Layout positioning:
  - `RING_SPACING`: 280 - Spacing between depth levels
  - `MIN_RADIUS`: 350 - Base minimum radius for first ring
  - `MAX_NODES_PER_RING`: 6 - Maximum nodes per ring before creating sub-rings
  - `SUB_RING_SPACING`: 180 - Spacing between sub-rings at same depth
  - `JITTER_AMOUNT`: 20 - Random jitter for organic look

**Dynamic Center Node:**
The center node size adjusts based on career title length:
- Titles under 20 chars: 200px (base size)
- Longer titles grow at 3px per character
- Maximum size capped at 300px
- Font size adapts: >40 chars = small, >25 chars = medium, else large
- Layout algorithm calculates minimum radius dynamically to prevent overlap

**Features:**
- Nodes arranged in concentric rings around center career node
- Max 6 nodes per ring to prevent overlap, overflow creates sub-rings
- Saved positions persist across sessions (stored in `nodeData.position`)
- "Organize" button resets all nodes to calculated layout
- `preservePositions` option respects saved positions on load
- Auto-organize on merge: when new nodes are added, layout automatically reorganizes
- `centerNodeTitle` option enables dynamic radius calculation

**Position Persistence:**
1. User drags node → position saved to `nodeData` via PATCH API
2. Page reload → layout uses `preservePositions: true` to keep saved positions
3. Merge/AI adds nodes → auto-detects new nodes and reorganizes entire layout
4. Click "Organize" → all positions reset (uses `preservePositions: false`)

**SkillGraphHandle Ref:**
The SkillGraph component exposes methods via `ref` for external control:
- `getNodePositions()` - Returns array of node positions for screenshot capture
- `sortNodes()` - Triggers layout reorganization (used by dropdown menu)

### SEO & Multi-locale Support

The app has comprehensive SEO with multi-locale support and GEO (Generative Engine Optimization) for AI search engines.

**Key files:**
- `app/layout.tsx` - Root metadata (Open Graph, Twitter cards, robots directives)
- `app/[locale]/layout.tsx` - Locale-specific metadata with `generateMetadata()`, hreflang alternates, global JSON-LD schemas
- `app/[locale]/career/[careerId]/layout.tsx` - Career page metadata with dynamic title/description, Course and Breadcrumb schemas
- `app/[locale]/(marketing)/layout.tsx` - Landing page FAQ and HowTo schemas for GEO
- `app/sitemap.ts` - Dynamic sitemap with all locales and career pages
- `app/robots.ts` - Robots.txt with AI crawler rules (GPTBot, Claude, Perplexity, etc.)
- `components/seo/JsonLd.tsx` - JSON-LD structured data components

**JSON-LD Schemas:**
- `JsonLd type="website"` - WebSite schema with SearchAction
- `JsonLd type="career"` - Course schema for career skill maps
- `JsonLd type="breadcrumb"` - BreadcrumbList for navigation hierarchy
- `JsonLd type="faq"` - FAQPage schema for GEO (AI search engines)
- `JsonLd type="howto"` - HowTo schema for process documentation
- `OrganizationJsonLd` - Organization with expertise areas
- `SoftwareAppJsonLd` - SoftwareApplication with feature list

**GEO (AI Search Engine Optimization):**
- robots.txt explicitly allows AI crawlers (configured via `SEO_CONFIG.aiCrawlers`)
- FAQ schema on landing page helps AI engines answer common questions (data in `SEO_CONFIG.faq`)
- HowTo schema explains the skill mapping process (data in `SEO_CONFIG.howToSteps`)
- Structured data enables AI engines to understand content relationships
- All SEO data is centralized in `SEO_CONFIG` for easy maintenance

**Features:**
- Locale-aware canonical URLs and hreflang tags (use `defaultLocale` for x-default, not hardcoded `'en'`)
- Dynamic sitemap with alternate language links per page
- Career pages have dynamic metadata fetched from database
- Open Graph and Twitter Card meta tags
- Locale-specific titles and descriptions via `seo` translation namespace

**Adding SEO to new pages:**
```tsx
// In page.tsx or layout.tsx
import { locales, defaultLocale } from '@/i18n/routing';
import { SITE_URL } from '@/lib/constants';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  // Generate alternate language links
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${SITE_URL}/${loc}/page`;
  }
  languages['x-default'] = `${SITE_URL}/${defaultLocale}/page`;

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    alternates: {
      canonical: `${SITE_URL}/${locale}/page`,
      languages,
    },
  };
}
```

### UI Patterns

**Confirmation Dialogs:**
Use `ConfirmModal` instead of browser's native `confirm()` for consistent styling:
```tsx
import { ConfirmModal } from '@/components/ui';

const [showConfirm, setShowConfirm] = useState(false);

<ConfirmModal
  isOpen={showConfirm}
  onConfirm={handleConfirm}
  onCancel={() => setShowConfirm(false)}
  title={t('dashboard.deleteTitle')}
  message={t('dashboard.confirmDelete')}
  confirmText={t('dashboard.delete')}
  cancelText={t('common.cancel')}
  variant="danger" // 'danger' | 'warning' | 'default'
  isLoading={isDeleting}
/>
```

**Toast Notifications:**
Use `showToast` for user feedback. `Toaster` is already added in `app/[locale]/layout.tsx`:
```tsx
import { showToast } from '@/components/ui';

showToast.success(t('dashboard.deleteSuccess'));
showToast.error(t('dashboard.deleteFailed'));
showToast.warning('Warning message');
showToast.info('Info message');
showToast.loading('Loading...');
showToast.dismiss(); // Dismiss all toasts
```

**Dropdown Menus:**
Use `DropdownMenu` for 3-dots action menus:
```tsx
import { DropdownMenu, type DropdownMenuItem, TrashIcon } from '@/components/ui';

const menuItems: DropdownMenuItem[] = [
  { id: 'delete', label: t('delete'), icon: <TrashIcon />, onClick: handleDelete, variant: 'danger' },
];

<DropdownMenu items={menuItems} position="bottom-right" />
```

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
