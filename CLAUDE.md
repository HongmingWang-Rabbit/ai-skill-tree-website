# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Before You Start

**Always check existing utilities before implementing new code:**

1. **Check `lib/` first** - Contains reusable utilities:
   - `lib/cache.ts` - Redis caching: `getCachedCareer()`, `setCachedCareer()`, `getCachedSkillGraph()`, `setCachedSkillGraph()`, `invalidateCareerCache()`
   - `lib/schemas.ts` - Zod schemas: `SkillNodeSchema`, `SkillEdgeSchema`, `CareerResponseSchema`, `CareerSearchSchema`, `GenerateCareerSchema`, `UserNodeDataSchema`, `MapUpdateSchema`
   - `lib/normalize-career.ts` - String utils: `normalizeCareerKey()`, `formatCareerTitle()`, `generateShareSlug()`, `isUUID()`, `isShareSlug()`
   - `lib/ai.ts` - OpenAI functions (using gpt-4o-mini): `generateCareerSkillTree()`, `generateSkillTestQuestions()`, `gradeSkillTestAnswers()`, `suggestCareerSearches()`, `analyzeCareerQuery()`
   - `lib/ai-chat.ts` - AI chat utilities: `processChatMessage()`, `generateModificationSummary()`, `applyModifications()`, `generateSmartMerge()`, types: `ChatModification`, `ChatContext`, `ChatMessage`
   - `lib/ai-document.ts` - Document skill extraction: `extractSkillsFromDocument()`, `mergeExtractedWithExisting()`, `generateExtractionSummary()`, types: `DocumentImportResult`
   - `lib/document-parser.ts` - Document parsing utilities: `parsePDF()`, `parseWord()`, `parseImage()`, `parseText()`, `parseURL()`, `detectURLType()`, `truncateForAI()`, `isSupportedFileType()`, `isImageFile()`, `getMimeType()`, types: `ParsedDocument`, `DocumentParseError`
   - `lib/mcp/tavily.ts` - Tavily web search integration: `searchTavily()`, `searchTrendingTech()`, `searchCareerSkills()`, `formatSearchResultsForAI()`
   - `lib/auth.ts` - NextAuth config with Google, Twitter, WeChat, Web3 providers
   - `lib/wechat-provider.ts` - Custom WeChat OAuth provider: `WeChatProvider()`, `WeChatMPProvider()`, `isWeChatBrowser()`
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
     - SEO: `SITE_URL`, `APP_DESCRIPTION` (used across metadata and JSON-LD)
     - Master Graph: `MASTER_GRAPH_CONFIG` (node sizes, radii, edge colors for skill universe visualization)
     - AI Chat: `AI_CHAT_CONFIG` (panel dimensions, API settings like model/temperature/maxTokens, animation timing, search keywords)
     - Tavily: `TAVILY_CONFIG` (API URL, search depth defaults, domain filters for trending tech and career skills searches)
     - Merge: `MERGE_CONFIG` (similarityThreshold for highlighting recommended maps to merge)
     - Document Import: `DOCUMENT_IMPORT_CONFIG` (maxFileSizeBytes, charsPerToken, fileTypes with extensions/mimeTypes, userAgent, portfolioDomains, aiExtraction settings with models/tokens/temperature/limits, preview settings with confidenceThresholds), derived constants: `SUPPORTED_EXTENSIONS`, `SUPPORTED_MIME_TYPES`, `IMAGE_EXTENSIONS`, `EXTENSION_TO_MIME`, `SUPPORTED_FILE_ACCEPT`
     - API Routes: `API_ROUTES` (centralized API endpoint paths for client-side fetching)

2. **Check `components/` for existing UI**:
   - `components/ui/` - `GlassPanel`, `XPProgressRing`, `SearchInput`, `ShareModal`, `LanguageSwitcher`, `DropdownMenu` (reusable 3-dots menu), `ConfirmModal` (styled confirmation dialog), `Toast`/`Toaster`/`showToast` (toast notifications via react-hot-toast), `FileDropzone` (drag-and-drop file upload), `Icons` (common: `MenuIcon`, `CloseIcon`, `ChevronRightIcon`, `WeChatIcon`, `GoogleIcon`; AI chat: `ChatIcon`, `MinimizeIcon`, `SendIcon`, `WarningIcon`, `EditIcon`, `TrashIcon`, `ConnectionIcon`, `ArrowRightIcon`, `PreviewIcon`, `CheckCircleIcon`, `MergeIcon`; menu: `MoreVerticalIcon`, `ShareIcon`, `SaveIcon`, `SortIcon`; import: `UploadIcon`, `DocumentIcon`, `LinkIcon`, `FilePdfIcon`, `FileTextIcon`, `FileWordIcon`, `FileImageIcon`, `ImportIcon`)
   - `components/layout/` - `Header` (site navigation with mobile menu), `SkillTreeBackground` (animated network background)
   - `components/skill-graph/` - `SkillGraph`, `SkillNode`, `CenterNode`, `SkillEdge`, layout utilities
   - `components/auth/` - `AuthModal` (login modal with social/Web3 tabs)
   - `components/ai-chat/` - `AIChatPanel` (floating chat panel with document import), `ChatMessage`, `ChatInput`, `ModificationPreview` (changes confirmation modal), `MergeMapModal` (merge skill maps UI)
   - `components/import/` - `DocumentImportModal` (modal for importing skills from documents/URLs), `ImportPreview` (preview extracted skills before confirmation)
   - `components/seo/` - `JsonLd`, `OrganizationJsonLd`, `SoftwareAppJsonLd` (structured data for SEO)
   - `components/providers/` - Context providers
   - `components/dashboard/` - `MasterSkillMap` (dashboard hero with graph), `MasterSkillGraph` (React Flow visualization of user's skill universe)

3. **Check `hooks/`** - Custom React hooks:
   - `useShareScreenshot` - Screenshot/share functionality

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
   - Translation namespaces: `common`, `header`, `home`, `career`, `dashboard`, `featuredCareers`, `languageSwitcher`, `auth`, `masterMap`, `seo`, `aiChat`, `skillGraph`, `import`

6. **Check `components/skill-graph/` for layout utilities**:
   - `constants.ts` - Layout constants: `LAYOUT_CONFIG` (node sizes, ring spacing, max nodes per ring)
   - `radial-layout.ts` - `getRadialLayout()` with `preservePositions` option for saved positions
   - `layout-utils.ts` - Edge handle utilities, seeded random for consistent jitter

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

1. User enters a query on the landing page → `POST /api/ai/analyze` analyzes if it's a specific career or vague preference
2. Specific career (e.g., "Software Engineer") → redirects to `/career/{canonicalKey}`
3. Vague query (e.g., "I want to work remotely") → shows career suggestions modal with AI recommendations
4. Career page → `POST /api/ai/generate` → OpenAI gpt-4o-mini generates skill map JSON
5. Generated data is cached in Upstash Redis and persisted to Neon PostgreSQL
6. Skill map is rendered as an interactive graph using React Flow (@xyflow/react)

### Key Directories

- `app/[locale]/` - Locale-prefixed pages (e.g., `/en/career/...`, `/zh/career/...`)
- `app/api/` - API routes: `/ai/generate`, `/ai/analyze`, `/ai/chat` (streaming AI chat), `/ai/merge` (smart merge two maps), `/career/[careerId]`, `/career/search`, `/skill/test`, `/user/graph`, `/user/master-map`, `/user/profile` (update user name), `/map/[mapId]`, `/map/fork`, `/map/[mapId]/copy`, `/import/document` (file upload), `/import/url` (URL import)
- `components/skill-graph/` - React Flow visualization: `SkillGraph.tsx` (main), `SkillNode.tsx`, `SkillEdge.tsx`, radial/dagre layout utilities
- `i18n/` - Internationalization configuration (next-intl)
- `messages/` - Translation files (en.json, zh.json, ja.json)
- `lib/db/schema.ts` - Drizzle schema: careers, skillGraphs, skills, users (NextAuth), userCareerGraphs, userSkillProgress
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

Users can import skills from resumes, portfolios, or web profiles to create or update skill maps:

**Supported Input Types:**
- PDF files (resumes, CVs)
- Word documents (.doc, .docx)
- Images (.png, .jpg, .gif, .webp) - uses GPT-4o vision
- Text/Markdown files
- URLs (LinkedIn profiles, GitHub, personal websites)

**Entry Points:**
1. Dashboard: Import button creates new skill maps from documents
2. AI Chat: "Import from document" suggestion updates existing maps

**Data Flow:**
1. User uploads file or enters URL
2. `POST /api/import/document` or `POST /api/import/url` parses content
3. `lib/document-parser.ts` extracts text (pdf-parse for PDFs, cheerio + @extractus/article-extractor for URLs)
4. `lib/ai-document.ts` uses OpenAI to extract skills with categories and confidence scores
5. For LinkedIn/login-walled sites, Tavily API provides fallback content extraction
6. Preview modal shows extracted skills grouped by category with confidence indicators
7. User confirms → skills converted to SkillNodes and saved via `/api/map/fork`

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
  - `existingSkillsLimit`: 20 max existing skills in context
  - `mergeSkillsLimit`: 30 max skills per map in merge
  - `mergeEdgesLimit`: 50 max edges per map in merge
- `preview`:
  - `maxDisplayedSkillsPerCategory`: 8 skills shown per category
  - `maxDisplayedCategories`: 5 max categories in summary
  - `confidenceThresholds.high`: 0.8 for high confidence
  - `confidenceThresholds.medium`: 0.5 for medium confidence

Derived constants (computed from fileTypes):
- `SUPPORTED_EXTENSIONS`: All supported file extensions
- `SUPPORTED_MIME_TYPES`: All supported MIME types
- `IMAGE_EXTENSIONS`: Image-only extensions
- `EXTENSION_TO_MIME`: Extension to MIME type mapping
- `SUPPORTED_FILE_ACCEPT`: HTML file input accept attribute string

**Update vs Create Mode:**
- Dashboard: Creates new skill maps (`mode='create'`)
- AI Chat: Updates existing maps (`mode='update'`), filtering out duplicate skills

### Skill Graph Layout

The skill graph uses a radial layout algorithm with smart features:

**Layout Configuration** (`LAYOUT_CONFIG` in `components/skill-graph/constants.ts`):
- `MAX_NODES_PER_RING`: 6 - Maximum nodes per ring before creating sub-rings
- `SUB_RING_SPACING`: 180 - Spacing between sub-rings at same depth
- `RING_SPACING`: 280 - Spacing between depth levels
- `MIN_RADIUS`: 300 - Minimum radius for first ring

**Features:**
- Nodes arranged in concentric rings around center career node
- Max 6 nodes per ring to prevent overlap, overflow creates sub-rings
- Saved positions persist across sessions (stored in `nodeData.position`)
- "Organize" button resets all nodes to calculated layout
- `preservePositions` option respects saved positions on load
- Auto-organize on merge: when new nodes are added, layout automatically reorganizes

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

The app has comprehensive SEO with multi-locale support:

**Key files:**
- `app/layout.tsx` - Root metadata (Open Graph, Twitter cards, robots directives)
- `app/[locale]/layout.tsx` - Locale-specific metadata with `generateMetadata()`, hreflang alternates
- `app/sitemap.ts` - Dynamic sitemap with all locales and career pages
- `app/robots.ts` - Robots.txt configuration
- `components/seo/JsonLd.tsx` - JSON-LD structured data components

**Features:**
- Locale-aware canonical URLs and hreflang tags
- Dynamic sitemap with alternate language links per page
- JSON-LD structured data (Website, Organization, Course schemas)
- Open Graph and Twitter Card meta tags
- Locale-specific titles and descriptions via `seo` translation namespace

**Adding SEO to new pages:**
```tsx
// In page.tsx or layout.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    alternates: {
      canonical: `${siteUrl}/${locale}/page`,
      languages: Object.fromEntries(locales.map(l => [l, `${siteUrl}/${l}/page`])),
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
