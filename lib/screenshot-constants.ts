// Screenshot capture configuration
export const SCREENSHOT_CONFIG = {
  // Image quality
  SCALE: 2,
  IMAGE_FORMAT: 'image/png' as const,
  IMAGE_QUALITY: 1.0,

  // Viewport fit settings
  VIEWPORT_PADDING: 150,
  MAX_ZOOM: 0.8,

  // Default dimensions
  DEFAULT_CONTAINER_WIDTH: 800,
  DEFAULT_CONTAINER_HEIGHT: 600,

  // Summary card dimensions
  SUMMARY_CARD_WIDTH: 800,
  SUMMARY_CARD_HEIGHT: 600,
  SUMMARY_MAX_SKILLS_TO_SHOW: 12,
  SUMMARY_SKILLS_PER_COLUMN: 6,
  SUMMARY_PROGRESS_RING_RADIUS: 70,
  SUMMARY_PATTERN_SPACING: 30,

  // Fallback domain when window is not available (SSR)
  FALLBACK_DOMAIN: 'skillmap.ai',
} as const;

// Theme colors used in screenshots (matching Tailwind theme)
export const SCREENSHOT_COLORS = {
  // Background colors
  BACKGROUND_PRIMARY: '#0f172a', // slate-900
  BACKGROUND_SECONDARY: '#1e293b', // slate-800
  BACKGROUND_OVERLAY: 'rgba(15, 23, 42, 0.9)',

  // Border colors
  BORDER_SUBTLE: 'rgba(148, 163, 184, 0.2)',
  PROGRESS_TRACK: '#334155', // slate-700

  // Text colors
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#94a3b8', // slate-400
  TEXT_MUTED: '#64748b', // slate-500
  TEXT_LIGHT: '#e2e8f0', // slate-200

  // Accent colors
  ACCENT_AMBER: '#fbbf24', // amber-400
  ACCENT_EMERALD: '#34d399', // emerald-400
  ACCENT_PATTERN: 'rgba(180, 130, 70, 0.03)',

  // Glow effects
  GLOW_EMERALD: 'rgba(52, 211, 153, 0.7)',
  GLOW_EMERALD_SUBTLE: 'rgba(52, 211, 153, 0.5)',

  // Social platform colors
  WECHAT_GREEN: '#07C160',
  WECHAT_GREEN_MUTED: 'rgba(7, 193, 96, 0.1)',
  WECHAT_GREEN_BORDER: 'rgba(7, 193, 96, 0.3)',
} as const;

// ReactFlow CSS selectors for filtering
export const REACTFLOW_SELECTORS = {
  CONTAINER: '.react-flow',
  VIEWPORT: '.react-flow__viewport',
  NODE: '.react-flow__node',
  EDGE: '.react-flow__edge',
  MINIMAP: '.react-flow__minimap',
  CONTROLS: '.react-flow__controls',
  PANEL: '.react-flow__panel',
} as const;

// Share slide type definitions
export type ShareSlideType = 'full' | 'completed' | 'summary';

export interface ShareSlide {
  type: ShareSlideType;
  title: string;
  description: string;
}

export const SHARE_SLIDES: ShareSlide[] = [
  { type: 'full', title: 'Full Skill Map', description: 'Complete skill tree with all skills' },
  { type: 'completed', title: 'Achievements', description: 'Highlight completed skills' },
  { type: 'summary', title: 'Summary Card', description: 'Overview with learned skills list' },
];

// Social sharing platforms
export type SocialPlatform = 'x' | 'telegram' | 'wechat';

export interface SocialShareConfig {
  id: SocialPlatform;
  name: string;
  color: string;
  hoverColor: string;
  getShareUrl: (text: string, url: string) => string;
}

export const SOCIAL_PLATFORMS: SocialShareConfig[] = [
  {
    id: 'x',
    name: 'X (Twitter)',
    color: 'bg-black',
    hoverColor: 'hover:bg-gray-900',
    getShareUrl: (text, url) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    color: 'bg-[#0088cc]',
    hoverColor: 'hover:bg-[#0077b5]',
    getShareUrl: (text, url) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: 'wechat',
    name: 'WeChat',
    color: 'bg-[#07C160]',
    hoverColor: 'hover:bg-[#06AD56]',
    // WeChat doesn't have a direct share URL - we'll show instructions to copy and share
    getShareUrl: () => '',
  },
];
