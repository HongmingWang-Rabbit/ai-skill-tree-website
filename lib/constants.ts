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
  BLOG: "/blog",
} as const;

// Navigation links (used in Header for both desktop and mobile)
export const NAV_LINKS = [
  { href: ROUTES.HOME, labelKey: "common.home" },
  { href: ROUTES.DASHBOARD, labelKey: "common.dashboard" },
  { href: ROUTES.BLOG, labelKey: "common.blog" },
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
  companyResearch: {
    searchDepth: 'advanced' as const,
    maxResults: 5,
    maxResultsToInclude: 3, // Top N results to include in AI context
    contentPreviewLength: 300, // Characters per result snippet
  },
} as const;

// Merge Map Configuration
export const MERGE_CONFIG = {
  similarityThreshold: 0.3, // Minimum similarity score to highlight as "recommended"
} as const;

// Skill Expansion Configuration (for expanding completed skill trees)
export const SKILL_EXPAND_CONFIG = {
  // AI generation settings
  model: 'gpt-4o-mini' as const,
  temperature: 0.7,
  maxTokens: 2000,
  // Skill generation parameters
  minSkillsToGenerate: 5,
  maxSkillsToGenerate: 8,
  prerequisiteLevelThreshold: 5, // Skills at this level or above can be prerequisites for new skills
  advancedSkillMinLevel: 7, // Minimum level for newly generated advanced skills
  advancedSkillMaxLevel: 10, // Maximum level for newly generated advanced skills
} as const;

// Import Merge Configuration (for smart deduplication during imports)
export const IMPORT_MERGE_CONFIG = {
  // Fuzzy matching thresholds (0-1 scale)
  similarityThreshold: 0.6, // General threshold for matching items (company, title, school, etc.)
  bioSimilarityThreshold: 0.7, // Higher threshold for bio - only merge if significantly different
  dateMatchBoost: 0.8, // Effective similarity when dates match exactly
  degreeMatchThreshold: 0.5, // Lower threshold for degree matching (more lenient)
  // Weights for combined similarity scores
  companyWeight: 0.6, // Company name is more important than title
  titleWeight: 0.4, // Job title weight in experience matching
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

// Editor Modal Configuration (shared by ProjectEditor, ExperienceEditor, EducationEditor)
export const EDITOR_MODAL_CONFIG = {
  zIndex: 50,
  backdropOpacity: 60,
  maxWidth: 'max-w-2xl',
  maxHeight: 'max-h-[85vh]',
  contentMaxHeight: 'max-h-[60vh]',
  listPreviewTechLimit: 5, // Max technologies to show in project list preview
  textareaRows: 4,
} as const;

// Resume Export Configuration
export const RESUME_CONFIG = {
  // User profile limits
  bioMaxLength: 500,
  phoneMaxLength: 30,
  // Address field limits
  addressCityMaxLength: 100,
  addressStateMaxLength: 100,
  addressCountryMaxLength: 100,
  // Work experience limits
  experienceMaxItems: 10,
  experienceDescriptionMaxLength: 1000,
  experienceCompanyMaxLength: 100,
  experienceTitleMaxLength: 100,
  experienceLocationMaxLength: 100,
  // Education limits
  educationMaxItems: 8,
  educationSchoolMaxLength: 120,
  educationDegreeMaxLength: 120,
  educationFieldMaxLength: 120,
  educationDescriptionMaxLength: 400,
  educationLocationMaxLength: 100,
  // Project limits
  projectsMaxItems: 10,
  projectNameMaxLength: 100,
  projectDescriptionMaxLength: 500,
  projectUrlMaxLength: 500,
  projectTechnologiesMaxItems: 15,
  projectTechnologyMaxLength: 50,
  // PDF settings
  pdfMaxSkillsPerCategory: 8,
  pdfMaxCategories: 6,
  pdfMaxExperienceItems: 5,
  // AI settings
  aiModel: 'gpt-4o-mini' as const,
  aiMaxTokens: 4000,
  aiJobAnalysisMaxTokens: 2000,
  aiTemperature: 0.5,
  aiOptimizationTemperature: 0.6, // Slightly higher for creative experience rewrites
  maxKeywordsToInject: 20, // Max ATS keywords to inject into experience
  maxSkillsInPrompt: 30, // Max skills to include in AI prompts
  // AI filtering context limits
  maxRequiredSkillsInContext: 10, // Max required skills to include in AI filtering context
  maxPreferredSkillsInContext: 5, // Max preferred skills to include in AI filtering context
  maxResponsibilitiesInContext: 5, // Max responsibilities to include in AI filtering context
  // Job analysis
  jobUrlTimeout: 30000,
  jobContentMaxChars: 10000,
  jobTitleMaxLength: 200,
  // Preview settings (for modal)
  previewSkillCategories: 3,
  previewSkillsPerCategory: 4,
  previewHighlightsCount: 3,
  // PDF layout settings
  pdfMaxProjects: 5,
} as const;

// Locale-aware PDF labels for section titles (used in ResumePDF and CoverLetterPDF)
export const PDF_LABELS = {
  en: {
    applyingFor: 'Applying for:',
    professionalSummary: 'Professional Summary',
    keyHighlights: 'Key Highlights',
    skills: 'Skills',
    workExperience: 'Work Experience',
    education: 'Education',
    projects: 'Projects',
    present: 'Present',
    ongoing: 'Ongoing',
    footer: 'Powered by Personal Skill Map',
    footerUrl: 'personalskillmap.com',
    watermarkMain: 'SKILL MAP',
    watermarkSub: 'Powered by Personal Skill Map',
    watermarkDraft: 'DRAFT',
    monthAbbreviations: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  zh: {
    applyingFor: '申请职位：',
    professionalSummary: '个人简介',
    keyHighlights: '核心亮点',
    skills: '技能',
    workExperience: '工作经历',
    education: '教育背景',
    projects: '项目经历',
    present: '至今',
    ongoing: '进行中',
    footer: 'Personal Skill Map 提供支持',
    footerUrl: 'personalskillmap.com',
    watermarkMain: '技能地图',
    watermarkSub: 'Personal Skill Map 提供支持',
    watermarkDraft: '草稿',
    monthAbbreviations: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  },
  ja: {
    applyingFor: '応募職種：',
    professionalSummary: '職務概要',
    keyHighlights: '主な実績',
    skills: 'スキル',
    workExperience: '職務経歴',
    education: '学歴',
    projects: 'プロジェクト',
    present: '現在',
    ongoing: '進行中',
    footer: 'Personal Skill Map 提供',
    footerUrl: 'personalskillmap.com',
    watermarkMain: 'スキルマップ',
    watermarkSub: 'Personal Skill Map',
    watermarkDraft: '下書き',
    monthAbbreviations: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  },
  es: {
    applyingFor: 'Aplicando para:',
    professionalSummary: 'Resumen Profesional',
    keyHighlights: 'Logros Destacados',
    skills: 'Habilidades',
    workExperience: 'Experiencia Laboral',
    education: 'Educación',
    projects: 'Proyectos',
    present: 'Presente',
    ongoing: 'En curso',
    footer: 'Con tecnología de Personal Skill Map',
    footerUrl: 'personalskillmap.com',
    watermarkMain: 'MAPA DE HABILIDADES',
    watermarkSub: 'Personal Skill Map',
    watermarkDraft: 'BORRADOR',
    monthAbbreviations: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  },
  'pt-BR': {
    applyingFor: 'Candidatando-se a:',
    professionalSummary: 'Resumo Profissional',
    keyHighlights: 'Principais Realizações',
    skills: 'Habilidades',
    workExperience: 'Experiência Profissional',
    education: 'Educação',
    projects: 'Projetos',
    present: 'Presente',
    ongoing: 'Em andamento',
    footer: 'Desenvolvido por Personal Skill Map',
    footerUrl: 'personalskillmap.com',
    watermarkMain: 'MAPA DE HABILIDADES',
    watermarkSub: 'Personal Skill Map',
    watermarkDraft: 'RASCUNHO',
    monthAbbreviations: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  },
  de: {
    applyingFor: 'Bewerbung für:',
    professionalSummary: 'Berufliches Profil',
    keyHighlights: 'Wichtige Erfolge',
    skills: 'Kompetenzen',
    workExperience: 'Berufserfahrung',
    education: 'Ausbildung',
    projects: 'Projekte',
    present: 'Gegenwart',
    ongoing: 'Laufend',
    footer: 'Bereitgestellt von Personal Skill Map',
    footerUrl: 'personalskillmap.com',
    watermarkMain: 'SKILL MAP',
    watermarkSub: 'Personal Skill Map',
    watermarkDraft: 'ENTWURF',
    monthAbbreviations: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  },
  fr: {
    applyingFor: 'Candidature pour :',
    professionalSummary: 'Profil Professionnel',
    keyHighlights: 'Réalisations Clés',
    skills: 'Compétences',
    workExperience: 'Expérience Professionnelle',
    education: 'Formation',
    projects: 'Projets',
    present: 'Présent',
    ongoing: 'En cours',
    footer: 'Propulsé par Personal Skill Map',
    footerUrl: 'personalskillmap.com',
    watermarkMain: 'CARTE DE COMPÉTENCES',
    watermarkSub: 'Personal Skill Map',
    watermarkDraft: 'BROUILLON',
    monthAbbreviations: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
  },
  it: {
    applyingFor: 'Candidatura per:',
    professionalSummary: 'Profilo Professionale',
    keyHighlights: 'Risultati Chiave',
    skills: 'Competenze',
    workExperience: 'Esperienza Lavorativa',
    education: 'Istruzione',
    projects: 'Progetti',
    present: 'Presente',
    ongoing: 'In corso',
    footer: 'Realizzato da Personal Skill Map',
    footerUrl: 'personalskillmap.com',
    watermarkMain: 'MAPPA COMPETENZE',
    watermarkSub: 'Personal Skill Map',
    watermarkDraft: 'BOZZA',
    monthAbbreviations: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
  },
  nl: {
    applyingFor: 'Solliciteren voor:',
    professionalSummary: 'Professioneel Profiel',
    keyHighlights: 'Belangrijkste Prestaties',
    skills: 'Vaardigheden',
    workExperience: 'Werkervaring',
    education: 'Opleiding',
    projects: 'Projecten',
    present: 'Heden',
    ongoing: 'Lopend',
    footer: 'Aangedreven door Personal Skill Map',
    footerUrl: 'personalskillmap.com',
    watermarkMain: 'VAARDIGHEDENKAART',
    watermarkSub: 'Personal Skill Map',
    watermarkDraft: 'CONCEPT',
    monthAbbreviations: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
  },
  pl: {
    applyingFor: 'Aplikuję na stanowisko:',
    professionalSummary: 'Profil Zawodowy',
    keyHighlights: 'Kluczowe Osiągnięcia',
    skills: 'Umiejętności',
    workExperience: 'Doświadczenie Zawodowe',
    education: 'Wykształcenie',
    projects: 'Projekty',
    present: 'Obecnie',
    ongoing: 'W trakcie',
    footer: 'Stworzone przez Personal Skill Map',
    footerUrl: 'personalskillmap.com',
    watermarkMain: 'MAPA UMIEJĘTNOŚCI',
    watermarkSub: 'Personal Skill Map',
    watermarkDraft: 'WERSJA ROBOCZA',
    monthAbbreviations: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'],
  },
} as const;

// AI locale instructions for multilingual content generation
export const AI_LOCALE_INSTRUCTIONS = {
  en: 'Generate all content in English.',
  zh: 'Generate all content in Simplified Chinese (简体中文).',
  ja: 'Generate all content in Japanese (日本語).',
  es: 'Generate all content in Spanish (Español).',
  'pt-BR': 'Generate all content in Brazilian Portuguese (Português Brasileiro).',
  de: 'Generate all content in German (Deutsch).',
  fr: 'Generate all content in French (Français).',
  it: 'Generate all content in Italian (Italiano).',
  nl: 'Generate all content in Dutch (Nederlands).',
  pl: 'Generate all content in Polish (Polski).',
} as const;

// Human-readable locale names for AI prompts (English names)
export const LOCALE_NAMES = {
  en: 'English',
  zh: 'Chinese',
  ja: 'Japanese',
  es: 'Spanish',
  'pt-BR': 'Brazilian Portuguese',
  de: 'German',
  fr: 'French',
  it: 'Italian',
  nl: 'Dutch',
  pl: 'Polish',
} as const;

// Native language names for UI display (language switcher, dropdowns)
export const LOCALE_DISPLAY_NAMES = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  es: 'Español',
  'pt-BR': 'Português',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  nl: 'Nederlands',
  pl: 'Polski',
} as const;

// Locale flags for UI display (emoji flags)
export const LOCALE_FLAGS = {
  en: '🇺🇸',
  zh: '🇨🇳',
  ja: '🇯🇵',
  es: '🇪🇸',
  'pt-BR': '🇧🇷',
  de: '🇩🇪',
  fr: '🇫🇷',
  it: '🇮🇹',
  nl: '🇳🇱',
  pl: '🇵🇱',
} as const;

// PDF Font Configuration for CJK support
export const PDF_FONT_CONFIG = {
  // Google Fonts CDN URLs for Noto Sans CJK fonts
  notoSansSC: {
    regular: 'https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYxNbPzS5HE.ttf',
    bold: 'https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_EnYxNbPzS5HE.ttf',
  },
  notoSansJP: {
    regular: 'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75vY0rw-oME.ttf',
    bold: 'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFJUi75vY0rw-oME.ttf',
  },
  // Font family names for registration (referenced by families below)
  fontFamilies: {
    notoSansSC: 'NotoSansSC',
    notoSansJP: 'NotoSansJP',
  },
  // Font family mapping by locale
  // Uses Noto Sans SC for en/zh (supports Latin + CJK) to handle mixed-language content
  // Uses Noto Sans JP for ja (optimized for Japanese with Latin support)
  // European languages use NotoSansSC which includes full Latin character support
  families: {
    en: { regular: 'NotoSansSC', bold: 'NotoSansSC' }, // SC includes Latin chars, handles untranslated CJK
    zh: { regular: 'NotoSansSC', bold: 'NotoSansSC' },
    ja: { regular: 'NotoSansJP', bold: 'NotoSansJP' },
    es: { regular: 'NotoSansSC', bold: 'NotoSansSC' },
    'pt-BR': { regular: 'NotoSansSC', bold: 'NotoSansSC' },
    de: { regular: 'NotoSansSC', bold: 'NotoSansSC' },
    fr: { regular: 'NotoSansSC', bold: 'NotoSansSC' },
    it: { regular: 'NotoSansSC', bold: 'NotoSansSC' },
    nl: { regular: 'NotoSansSC', bold: 'NotoSansSC' },
    pl: { regular: 'NotoSansSC', bold: 'NotoSansSC' },
  },
  // Locale to date format mapping (for toLocaleDateString)
  dateLocales: {
    en: 'en-US',
    zh: 'zh-CN',
    ja: 'ja-JP',
    es: 'es-ES',
    'pt-BR': 'pt-BR',
    de: 'de-DE',
    fr: 'fr-FR',
    it: 'it-IT',
    nl: 'nl-NL',
    pl: 'pl-PL',
  },
  // CJK Unicode ranges for text wrapping detection
  cjkPattern: /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff]/,
} as const;

// Shared PDF style values (Tailwind-inspired color palette)
export const PDF_STYLES = {
  colors: {
    text: {
      primary: '#0f172a',     // slate-900
      secondary: '#1e293b',   // slate-800
      muted: '#334155',       // slate-700
      subtle: '#475569',      // slate-600
      placeholder: '#64748b', // slate-500
      disabled: '#94a3b8',    // slate-400
    },
    background: {
      white: '#ffffff',
      muted: '#f1f5f9',       // slate-100
      subtle: '#e2e8f0',      // slate-200
    },
    accent: {
      amber: '#f59e0b',       // amber-500
      amberLight: '#fef3c7',  // amber-100
      cyan: '#0ea5e9',        // sky-500
      cyanLight: '#e0f2fe',   // sky-100
    },
    watermark: {
      main: '#e5e7eb',        // gray-200
      sub: '#d1d5db',         // gray-300
      draft: '#e2e8f0',       // slate-200
    },
  },
  borderRadius: {
    sm: 3,
    md: 4,
    lg: 8,
  },
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
    maxDisplayedProjects: 3, // Max projects to show in preview
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

// Billing & Subscription Configuration
export const BILLING_CONFIG = {
  // Subscription tiers
  tiers: {
    free: { name: 'Free', maxMaps: 1, hasWatermark: true, monthlyCredits: 0 },
    pro: { name: 'Pro', maxMaps: Infinity, hasWatermark: false, monthlyCredits: 1000 },
    premium: { name: 'Premium', maxMaps: Infinity, hasWatermark: false, monthlyCredits: 3000 },
  },

  // Credit costs per operation (1 credit = $0.01, pricing is 5x actual token cost)
  creditCosts: {
    ai_generate: 10,            // Career generation (~2000 tokens)
    ai_chat: 15,                // Chat with modifications (~3000 tokens)
    ai_merge: 13,               // Map merging (~2500 tokens)
    ai_analyze: 4,              // Query analysis (~800 tokens)
    resume_generate: 20,        // Resume generation (~4000 tokens)
    import_document: 20,        // Document import - text (~4000 tokens)
    import_document_vision: 30, // Document import - image/vision (~6000 tokens)
    import_url: 20,             // URL import (~4000 tokens)
    skill_test_generate: 5,     // Test questions (~1000 tokens)
    skill_test_grade: 5,        // Test grading (~1000 tokens)
  },

  // Initial signup bonus
  signupBonus: 500, // 500 credits = $5 worth

  // Credit pack definitions (credits per pack)
  creditPacks: {
    pack500: 500,
    pack2000: 2000,
    pack5000: 5000,
  },

  // Stripe price IDs (set via environment variables)
  stripePrices: {
    proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    proYearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    premiumMonthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    premiumYearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
    credits500: process.env.STRIPE_PRICE_CREDITS_500,
    credits2000: process.env.STRIPE_PRICE_CREDITS_2000,
    credits5000: process.env.STRIPE_PRICE_CREDITS_5000,
  },

  // Fallback display prices (shown when Stripe prices unavailable)
  // These should match actual Stripe prices for consistency
  fallbackPrices: {
    free: '$0',
    proMonthly: '$5 USD',
    proYearly: '$48 USD',
    premiumMonthly: '$20 USD',
    premiumYearly: '$192 USD',
    credits500: '$5 USD',
    credits2000: '$18 USD',
    credits5000: '$40 USD',
  },
} as const;

export type SubscriptionTier = keyof typeof BILLING_CONFIG.tiers;
export type CreditOperation = keyof typeof BILLING_CONFIG.creditCosts;

// API Routes (for client-side fetching)
export const API_ROUTES = {
  AI_CHAT: '/api/ai/chat',
  AI_GENERATE: '/api/ai/generate',
  AI_ANALYZE: '/api/ai/analyze',
  AI_MERGE: '/api/ai/merge',
  USER_GRAPH: '/api/user/graph',
  USER_PROFILE: '/api/user/profile',
  USER_MASTER_MAP: '/api/user/master-map',
  USER_CREDITS: '/api/user/credits',
  USER_SUBSCRIPTION: '/api/user/subscription',
  MAP: '/api/map',
  MAP_FORK: '/api/map/fork',
  IMPORT_DOCUMENT: '/api/import/document',
  IMPORT_URL: '/api/import/url',
  RESUME_GENERATE: '/api/resume/generate',
  COVER_LETTER_GENERATE: '/api/cover-letter/generate',
  LEARNING_RESOURCES: '/api/learning/resources',
  ADMIN_AFFILIATED_LINKS: '/api/admin/affiliated-links',
  STRIPE_CHECKOUT: '/api/stripe/checkout',
  STRIPE_PORTAL: '/api/stripe/portal',
  STRIPE_PRICES: '/api/stripe/prices',
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

// Blog Configuration
export const BLOG_CONFIG = {
  // Content settings
  contentDir: 'content/blog',
  defaultAuthor: 'Personal Skill Map Team',
  // Reading time calculation
  wordsPerMinute: 200,
  cjkCharsPerWord: 2, // CJK characters count as ~2 chars per word equivalent
  // TOC settings
  tocMinLevel: 2,
  tocMaxLevel: 4,
  headingScrollMarginClass: 'scroll-mt-20', // Tailwind class for TOC heading anchor offset
  // UI settings
  cardMaxTags: 3, // Max tags to display on blog card
} as const;

// SEO & GEO Configuration
export const SEO_CONFIG = {
  // Organization details
  organization: {
    foundingDate: '2024',
    supportedLanguages: ['English', 'Chinese', 'Japanese', 'Spanish', 'Portuguese', 'German', 'French', 'Italian', 'Dutch', 'Polish'],
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
      'Cover letter generation with company personalization',
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
      answer: 'Our AI analyzes your skill map and work experience to generate a professional PDF resume. You can optionally paste a job posting URL, and the AI will tailor your resume to match the specific job requirements with ATS optimization, impact-focused rewrites, and strength highlighting.',
    },
    {
      question: 'Can I generate cover letters?',
      answer: 'Yes! When generating a resume, toggle "Include Cover Letter" to create both documents at once. The AI creates a compelling cover letter with an opening hook, achievement-focused body paragraphs, and company-specific connection points. Preview both documents in tabbed view and download them together as a ZIP file.',
    },
    {
      question: 'Is Personal Skill Map free to use?',
      answer: 'Yes, Personal Skill Map is free to use. You can create skill maps, track your progress, and generate resumes without any cost.',
    },
    {
      question: 'What languages are supported?',
      answer: 'Personal Skill Map supports 10 languages: English, Chinese (Simplified), Japanese, Spanish, Portuguese (Brazil), German, French, Italian, Dutch, and Polish. The AI generates skill maps and content in your selected language.',
    },
    {
      question: 'Can I generate resumes in different languages?',
      answer: 'Yes! You can generate resumes and cover letters in any of our 10 supported languages (English, Chinese, Japanese, Spanish, Portuguese, German, French, Italian, Dutch, Polish) regardless of your input language. The AI translates job titles, education details, project descriptions, and all content to your selected output language while preserving company names, school names, and technical terms.',
    },
  ],
  // HowTo steps for GEO
  howToSteps: [
    {
      name: 'Import Your Skills',
      text: 'Upload your resume (PDF, Word, or image) or paste your LinkedIn URL. The AI extracts skills plus contact, experience, projects, and education automatically.',
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
      name: 'Generate Your Resume & Cover Letter',
      text: 'Export professional PDF resumes and personalized cover letters tailored to specific job postings. The AI optimizes your resume for ATS, rewrites experience for impact, and creates compelling cover letters.',
    },
  ],
  howToMeta: {
    name: 'How to Build Your Personal Skill Map',
    description: 'Learn how to import your skills, visualize your career path, and generate AI-tailored resumes and cover letters with Personal Skill Map.',
  },
} as const;

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  // Requests per window for each limiter type
  limits: {
    publicAI: 10,        // Anonymous AI requests per window
    careerSearch: 20,    // Career search requests per window
    authenticatedAI: 30, // Authenticated AI requests per window
    heavyAI: 5,          // Heavy AI operations (resume gen) per window
  },
  // Time window in seconds
  windowSeconds: 60,
  // Redis key prefixes
  prefixes: {
    publicAI: 'ratelimit:public-ai',
    careerSearch: 'ratelimit:career-search',
    authenticatedAI: 'ratelimit:auth-ai',
    heavyAI: 'ratelimit:heavy-ai',
  },
  // Error messages
  errorMessage: 'Too many requests. Please try again later.',
  errorCode: 'RATE_LIMITED',
} as const;
