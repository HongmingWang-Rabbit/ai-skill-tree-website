// Layout configuration constants
export const LAYOUT_CONFIG = {
  // Node dimensions
  NODE_WIDTH: 160,
  NODE_HEIGHT: 140,

  // Center node sizing
  CENTER_NODE_SIZE: 200, // Base size
  CENTER_NODE_MAX_SIZE: 300, // Maximum dynamic size
  CENTER_NODE_TITLE_THRESHOLD: 20, // Characters before size increases
  CENTER_NODE_GROWTH_FACTOR: 3, // Pixels per character over threshold
  CENTER_NODE_DECORATIVE_RINGS_SPACE: 30, // Space for decorative rings around center
  CENTER_NODE_GAP: 50, // Gap between center edge and first ring nodes
  CENTER_NODE_CONTENT_PADDING: 48, // Padding inside center node for content

  // Center node font size thresholds
  CENTER_NODE_FONT_SIZE_SMALL_THRESHOLD: 40, // Characters for smallest font
  CENTER_NODE_FONT_SIZE_MEDIUM_THRESHOLD: 25, // Characters for medium font

  // Layout positioning
  CENTER_X: 0,
  CENTER_Y: 0,
  RING_SPACING: 280,
  MIN_RADIUS: 350, // Base minimum radius for first ring
  JITTER_AMOUNT: 20,
  MAX_NODES_PER_RING: 6,
  SUB_RING_SPACING: 180,
} as const;

// Special node identifiers
export const CENTER_NODE_ID = '__career_center__';

// Handle position type
export type HandlePosition = 'top' | 'bottom' | 'left' | 'right';
