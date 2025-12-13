// Skill progress constants
export const SKILL_PASS_THRESHOLD = 60; // Minimum score to pass a skill test (0-100)
export const SKILL_PROGRESS_MAX = 100;
export const SKILL_SCORE_EXCELLENT_THRESHOLD = 80; // Score threshold for excellent feedback display

// Share slug constants
export const SHARE_SLUG_LENGTH = 6;
export const SHARE_SLUG_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
export const SHARE_SLUG_GENERATION_MAX_RETRIES = 5;

// Map title constraints
export const MAP_TITLE_MAX_LENGTH = 100;

// User profile constraints
export const USER_NAME_MAX_LENGTH = 100;

// UI timing constants (in milliseconds)
export const SIGN_IN_PROMPT_DELAY_MS = 2000;
export const AUTO_SAVE_DEBOUNCE_MS = 1000;

// Asset paths
export const ASSETS = {
  ICON: "/icon-transparent-bg.png",
  ICON_LARGE: "/large-icon-transparent-bg.png",
} as const;

// App branding
export const APP_NAME = "Personal Skill Map";
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://www.personalskillmap.com/";
export const APP_DESCRIPTION =
  "Discover and visualize your career path with AI-generated skill maps. Explore the skills you need to master your dream career.";

// Header constants
export const HEADER_SCROLL_THRESHOLD = 10;
export const HEADER_HEIGHT_DEFAULT = 80; // h-20 in pixels
export const HEADER_HEIGHT_SCROLLED = 64; // h-16 in pixels

// Route paths (centralized route definitions)
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  CAREER: "/career",
} as const;

// Navigation links (used in Header for both desktop and mobile)
export const NAV_LINKS = [
  { href: ROUTES.HOME, labelKey: "common.home" },
  { href: ROUTES.DASHBOARD, labelKey: "common.dashboard" },
  { href: ROUTES.HOME, labelKey: "common.explore" },
] as const;

// Background animation constants
export const BACKGROUND_CONFIG = {
  GRID_CELL_SIZE: 200,
  NODE_SKIP_RATE: 0.4,
  CENTER_CLUSTER_COUNT: 6,
  MAX_CONNECTION_DISTANCE: 200,
  MAX_CONNECTIONS_PER_NODE: 2,
  MOUSE_INTERACTION_RADIUS: 200,
  MOUSE_ATTRACTION_STRENGTH: 8,
  MOUSE_SCALE_FACTOR: 0.3,
  COLORS: ["#A78BFA", "#34D399", "#60A5FA", "#FBBF24", "#F472B6"],
} as const;

// Hero section constants
export const HERO_ICON_ROTATION_DURATION = 30; // seconds

// Provider brand colors
export const PROVIDER_COLORS = {
  WECHAT: {
    bg: "#07C160",
    hover: "#06AD56",
  },
} as const;

// Master Skill Graph Layout
export const MASTER_GRAPH_CONFIG = {
  centerNodeSize: 140,
  careerRadius: 250,
  careerNodeWidth: 140,
  careerNodeHeight: 50,
  skillRadius: 120,
  skillNodeWidth: 100,
  skillNodeHeight: 24,
  maxDisplayedSkillsPerCareer: 12,
  edgeColors: {
    default: '#475569',
    mastered: '#10b981',
    inProgress: '#f59e0b',
    notStarted: '#334155',
  },
} as const;

// AI Chat Configuration
export const AI_CHAT_CONFIG = {
  // UI dimensions
  panelWidth: 400,
  panelHeight: 500,
  panelMaxHeight: '70vh',
  inputMaxHeight: 120,
  // API settings
  maxMessageLength: 2000,
  maxTokens: 4000,
  maxTokensMerge: 6000, // Merge needs more tokens for combining two maps
  temperature: 0.7,
  model: 'gpt-4o-mini' as const,
  chatHistoryLimit: 10,
  skillDisplayLimit: 30, // Max skills to show in system prompt
  // Animation
  springDamping: 25,
  springStiffness: 300,
  // Search intent detection keywords
  searchKeywords: {
    trending: ['trending', 'trend', 'latest', 'new', 'popular', 'hot', '2024', '2025', 'modern'],
    search: ['search', 'find', 'look up', 'google', 'web', 'online', 'internet'],
  },
} as const;

// Tavily Web Search Configuration
export const TAVILY_CONFIG = {
  apiUrl: 'https://api.tavily.com/search',
  defaultSearchDepth: 'basic' as const,
  defaultMaxResults: 5,
  contentPreviewLength: 200,
  trendingTech: {
    searchDepth: 'advanced' as const,
    maxResults: 8,
    includeDomains: [
      'github.com',
      'stackoverflow.com',
      'dev.to',
      'medium.com',
      'hackernews.com',
      'techcrunch.com',
    ],
  },
  careerSkills: {
    searchDepth: 'advanced' as const,
    maxResults: 8,
    includeDomains: [
      'linkedin.com',
      'glassdoor.com',
      'indeed.com',
      'roadmap.sh',
      'github.com',
    ],
  },
} as const;

// Merge Map Configuration
export const MERGE_CONFIG = {
  similarityThreshold: 0.3, // Minimum similarity score to highlight as "recommended"
} as const;

// Document Import Configuration
export const DOCUMENT_IMPORT_CONFIG = {
  maxFileSizeBytes: 20 * 1024 * 1024, // 20MB (for images)
  maxContentTokens: 8000,
  minContentLength: 50, // Minimum characters for valid document content
  minTextContentLength: 20, // Minimum characters for text files
  charsPerToken: 4, // Average characters per token for truncation
  // File type definitions - single source of truth
  fileTypes: {
    pdf: { extensions: ['pdf'], mimeTypes: ['application/pdf'] },
    word: { extensions: ['doc', 'docx'], mimeTypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
    text: { extensions: ['txt', 'md', 'markdown'], mimeTypes: ['text/plain', 'text/markdown'] },
    image: { extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'], mimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp'] },
  },
  urlTimeout: 30000, // 30 seconds
  maxUrlContentLength: 100000, // characters
  userAgent: 'Mozilla/5.0 (compatible; SkillMapBot/1.0)',
  // Portfolio detection domains
  portfolioDomains: ['behance.net', 'dribbble.com', 'portfolio.', 'about.me', 'carrd.co'],
  // AI extraction settings
  aiExtraction: {
    textModel: 'gpt-4o-mini',
    visionModel: 'gpt-4o',
    maxTokens: 4000,
    temperature: 0.5,
    mergeTemperature: 0.3,
    maxInputTokens: 6000, // For truncating text content
    minSkills: 10, // Minimum skills to extract
    maxSkills: 25, // Maximum skills to extract
    // Context limits for AI prompts
    existingSkillsLimit: 20, // Max existing skills to include in context
    mergeSkillsLimit: 30, // Max skills per map in merge
    mergeEdgesLimit: 50, // Max edges per map in merge
  },
  // Preview settings
  preview: {
    maxDisplayedSkillsPerCategory: 8,
    maxDisplayedCategories: 5, // Max categories to show in summary
    confidenceThresholds: {
      high: 0.8,
      medium: 0.5,
    },
  },
} as const;

// Derived values for convenience (computed from fileTypes)
export const SUPPORTED_EXTENSIONS = Object.values(DOCUMENT_IMPORT_CONFIG.fileTypes)
  .flatMap(t => t.extensions.map(e => `.${e}`));
export const SUPPORTED_MIME_TYPES = Object.values(DOCUMENT_IMPORT_CONFIG.fileTypes)
  .flatMap(t => t.mimeTypes);
export const IMAGE_EXTENSIONS = DOCUMENT_IMPORT_CONFIG.fileTypes.image.extensions;
export const EXTENSION_TO_MIME: Record<string, string> = Object.values(DOCUMENT_IMPORT_CONFIG.fileTypes)
  .flatMap(t => t.extensions.map((ext, i) => ({ ext, mime: t.mimeTypes[Math.min(i, t.mimeTypes.length - 1)] })))
  .reduce((acc, { ext, mime }) => ({ ...acc, [ext]: mime }), {});
// For HTML file input accept attribute
export const SUPPORTED_FILE_ACCEPT = SUPPORTED_EXTENSIONS.join(',');

// API Routes (for client-side fetching)
export const API_ROUTES = {
  AI_CHAT: '/api/ai/chat',
  AI_GENERATE: '/api/ai/generate',
  AI_ANALYZE: '/api/ai/analyze',
  AI_MERGE: '/api/ai/merge',
  USER_GRAPH: '/api/user/graph',
  USER_PROFILE: '/api/user/profile',
  MAP: '/api/map',
  IMPORT_DOCUMENT: '/api/import/document',
  IMPORT_URL: '/api/import/url',
} as const;
