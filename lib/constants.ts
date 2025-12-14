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

// Learning Resources Configuration
export const LEARNING_CONFIG = {
  // Platform domains for Tavily search (grouped by type)
  platforms: {
    courses: ['udemy.com', 'coursera.org', 'edx.org', 'pluralsight.com', 'skillshare.com', 'linkedin.com/learning'],
    video: ['youtube.com'],
    documentation: ['developer.mozilla.org', 'docs.microsoft.com', 'reactjs.org', 'nodejs.org', 'python.org', 'go.dev', 'rust-lang.org'],
    community: ['dev.to', 'medium.com', 'stackoverflow.com', 'hashnode.com', 'freecodecamp.org'],
  },
  // Cache settings
  cacheTtlSeconds: 3600, // 1 hour - shorter than careers since web results change more frequently
  // Search settings
  searchDepth: 'advanced' as const,
  maxResults: 10,
  descriptionPreviewLength: 200, // Truncate resource descriptions in search results
  // Skill level thresholds (for converting numeric level to difficulty text)
  levelThresholds: {
    beginner: 3,      // level 1-3 = beginner
    intermediate: 6,  // level 4-6 = intermediate
    // level 7+ = advanced
  },
  // Affiliated links settings
  maxAffiliatedLinks: 3,
  // Modal dimensions
  modal: {
    maxHeightVh: 80,
    headerHeightPx: 60,
  },
  // Platform display info (name, icon, color for each platform)
  platformInfo: {
    udemy: { name: 'Udemy', icon: '🎓', color: '#A435F0' },
    coursera: { name: 'Coursera', icon: '📚', color: '#0056D2' },
    edx: { name: 'edX', icon: '🏛️', color: '#02262B' },
    youtube: { name: 'YouTube', icon: '▶️', color: '#FF0000' },
    pluralsight: { name: 'Pluralsight', icon: '📺', color: '#F15B2A' },
    skillshare: { name: 'Skillshare', icon: '🎨', color: '#00FF84' },
    linkedin: { name: 'LinkedIn Learning', icon: '💼', color: '#0A66C2' },
    mdn: { name: 'MDN Docs', icon: '📖', color: '#83D0F2' },
    microsoft: { name: 'Microsoft Docs', icon: '📄', color: '#5E5E5E' },
    stackoverflow: { name: 'Stack Overflow', icon: '💬', color: '#F48024' },
    medium: { name: 'Medium', icon: '✍️', color: '#000000' },
    devto: { name: 'DEV.to', icon: '👩‍💻', color: '#0A0A0A' },
    freecodecamp: { name: 'freeCodeCamp', icon: '🔥', color: '#0A0A23' },
    official: { name: 'Official Docs', icon: '📘', color: '#4A90D9' },
    other: { name: 'Resource', icon: '🔗', color: '#6B7280' },
  },
} as const;

// Derived: All learning platform domains (flattened)
export const LEARNING_PLATFORM_DOMAINS = Object.values(LEARNING_CONFIG.platforms).flat();

// Resume Export Configuration
export const RESUME_CONFIG = {
  // User profile limits
  bioMaxLength: 500,
  experienceMaxItems: 10,
  experienceDescriptionMaxLength: 1000,
  experienceCompanyMaxLength: 100,
  experienceTitleMaxLength: 100,
  experienceLocationMaxLength: 100,
  // PDF settings
  pdfMaxSkillsPerCategory: 8,
  pdfMaxCategories: 6,
  pdfMaxExperienceItems: 5,
  // AI settings
  aiModel: 'gpt-4o-mini' as const,
  aiMaxTokens: 4000,
  aiJobAnalysisMaxTokens: 2000,
  aiTemperature: 0.5,
  // Job analysis
  jobUrlTimeout: 30000,
  jobContentMaxChars: 10000,
  jobTitleMaxLength: 200,
  // Preview settings (for modal)
  previewSkillCategories: 3,
  previewSkillsPerCategory: 4,
  previewHighlightsCount: 3,
  // PDF section labels (can be customized for i18n)
  pdfLabels: {
    applyingFor: 'Applying for:',
    professionalSummary: 'Professional Summary',
    keyHighlights: 'Key Highlights',
    skills: 'Skills',
    workExperience: 'Work Experience',
    footer: 'Generated by Personal Skill Map',
    present: 'Present',
  },
  // Month abbreviations for PDF date formatting
  monthAbbreviations: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
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
    importedSkillProgress: 100, // Progress value for imported skills (100 = learned/mastered)
    // Context limits for AI prompts
    existingSkillsLimit: 20, // Max existing skills to include in context
    mergeSkillsLimit: 30, // Max skills per map in merge
    mergeEdgesLimit: 50, // Max edges per map in merge
  },
  // Preview settings
  preview: {
    maxDisplayedSkillsPerCategory: 8,
    maxDisplayedCategories: 5, // Max categories to show in summary
    maxDisplayedExperiences: 5, // Max work experiences to show in preview
    confidenceThresholds: {
      high: 0.8,
      medium: 0.5,
    },
  },
  // Modal layout settings
  modal: {
    maxHeightVh: 85, // Modal max height as viewport percentage
    headerHeightPx: 200, // Approximate header + padding + actions height
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
  USER_MASTER_MAP: '/api/user/master-map',
  MAP: '/api/map',
  MAP_FORK: '/api/map/fork',
  IMPORT_DOCUMENT: '/api/import/document',
  IMPORT_URL: '/api/import/url',
  RESUME_GENERATE: '/api/resume/generate',
  LEARNING_RESOURCES: '/api/learning/resources',
  ADMIN_AFFILIATED_LINKS: '/api/admin/affiliated-links',
} as const;

// React Query Configuration
export const QUERY_CONFIG = {
  staleTime: 60 * 1000, // 1 minute - data considered fresh for this duration
  gcTime: 5 * 60 * 1000, // 5 minutes - keep cached data for this duration
  retryCount: 1, // Retry failed requests once
} as const;

// Landing Page Configuration
export const LANDING_PAGE_CONFIG = {
  // Featured careers shown on landing page
  featuredCareers: [
    { titleKey: 'frontendDeveloper', icon: '💻', key: 'frontend-developer' },
    { titleKey: 'dataScientist', icon: '📊', key: 'data-scientist' },
    { titleKey: 'uxDesigner', icon: '🎨', key: 'ux-designer' },
    { titleKey: 'devopsEngineer', icon: '⚙️', key: 'devops-engineer' },
    { titleKey: 'productManager', icon: '📋', key: 'product-manager' },
    { titleKey: 'mlEngineer', icon: '🤖', key: 'machine-learning-engineer' },
  ],
  // Stats displayed on landing page (placeholder values)
  stats: [
    { key: 'skillsMapped', value: '10,000+' },
    { key: 'careerPaths', value: '500+' },
    { key: 'resumesGenerated', value: '3,000+' },
    { key: 'fileTypes', value: '50+' },
  ],
  // Workflow steps
  workflowSteps: [
    { key: 'step1', icon: '📤' },
    { key: 'step2', icon: '🗺️' },
    { key: 'step3', icon: '📄' },
  ],
  // Demo preview configuration
  demo: {
    orbitalSkillCount: 6,
    orbitalRadius: '10rem',
    connectionLineWidth: '8rem',
  },
  // Animation timing
  animation: {
    sectionDelay: 0.2,
    staggerDelay: 0.1,
    duration: 0.5,
  },
} as const;

// SEO & GEO Configuration
export const SEO_CONFIG = {
  // Organization details
  organization: {
    foundingDate: '2024',
    supportedLanguages: ['English', 'Chinese', 'Japanese'],
    expertiseAreas: [
      'Career Development',
      'Skill Mapping',
      'Professional Growth',
      'AI-powered Learning',
      'Resume Generation',
    ],
    // Uncomment and add your social profiles when available
    socialProfiles: [
      // 'https://twitter.com/personalskillmap',
      // 'https://github.com/personalskillmap',
      // 'https://linkedin.com/company/personalskillmap',
    ],
  },
  // Software application details
  software: {
    version: '1.0',
    applicationCategory: 'EducationalApplication',
    applicationSubCategory: 'Career Development',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    features: [
      'AI-powered skill map generation',
      'Document import (PDF, Word, images)',
      'Resume export with AI tailoring',
      'Interactive skill visualization',
      'Multi-language support',
      'Progress tracking',
    ],
  },
  // Course/Career schema defaults
  course: {
    defaultName: 'Career Skill Map',
    educationalLevel: 'Beginner to Advanced',
    courseMode: 'online',
    courseWorkload: 'Self-paced',
  },
  // AI crawler user agents for robots.txt
  aiCrawlers: [
    'GPTBot',
    'ChatGPT-User',
    'Claude-Web',
    'anthropic-ai',
    'PerplexityBot',
    'Bytespider',
    'Google-Extended',
    'cohere-ai',
  ],
  // Paths to disallow for crawlers
  disallowedPaths: ['/api/', '/dashboard'],
  // FAQ data for GEO (AI search engines)
  faq: [
    {
      question: 'What is Personal Skill Map?',
      answer: 'Personal Skill Map is an AI-powered web application that helps you visualize and track your career skills. You can import skills from your resume, explore any career path, and generate tailored resumes for job applications.',
    },
    {
      question: 'How do I import skills from my resume?',
      answer: 'You can upload your resume in PDF, Word, or image format, or paste a LinkedIn URL. Our AI will automatically extract your skills, work experience, and professional summary to create your personalized skill map.',
    },
    {
      question: 'Can I explore different career paths?',
      answer: 'Yes! Simply search for any career title like "Software Engineer" or describe your preferences like "I want to work remotely". Our AI will generate a comprehensive skill map showing all the skills needed for that career path.',
    },
    {
      question: 'How does the resume generation work?',
      answer: 'Our AI analyzes your skill map and work experience to generate a professional PDF resume. You can optionally paste a job posting URL, and the AI will tailor your resume to match the specific job requirements.',
    },
    {
      question: 'Is Personal Skill Map free to use?',
      answer: 'Yes, Personal Skill Map is free to use. You can create skill maps, track your progress, and generate resumes without any cost.',
    },
    {
      question: 'What languages are supported?',
      answer: 'Personal Skill Map supports English, Chinese (Simplified), and Japanese. The AI generates skill maps and content in your selected language.',
    },
  ],
  // HowTo steps for GEO
  howToSteps: [
    {
      name: 'Import Your Skills',
      text: 'Upload your resume (PDF, Word, or image) or paste your LinkedIn URL. The AI will extract your existing skills automatically.',
    },
    {
      name: 'Visualize Your Skill Map',
      text: 'View your skills as an interactive map. See connections between skills, track your progress, and identify skill gaps.',
    },
    {
      name: 'Explore Career Paths',
      text: 'Search for any career to see what skills are required. Compare your current skills to your target career.',
    },
    {
      name: 'Generate Your Resume',
      text: 'Export a professional PDF resume tailored to specific job postings. The AI optimizes your resume for each application.',
    },
  ],
  howToMeta: {
    name: 'How to Build Your Personal Skill Map',
    description: 'Learn how to import your skills, visualize your career path, and generate AI-tailored resumes with Personal Skill Map.',
  },
} as const;
