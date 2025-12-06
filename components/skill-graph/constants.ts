// Layout configuration constants
export const LAYOUT_CONFIG = {
  NODE_WIDTH: 160,
  NODE_HEIGHT: 140,
  CENTER_NODE_SIZE: 200,
  CENTER_X: 0,
  CENTER_Y: 0,
  RING_SPACING: 280,
  MIN_RADIUS: 300,
  JITTER_AMOUNT: 20,
} as const;

// Special node identifiers
export const CENTER_NODE_ID = '__career_center__';

// Handle position type
export type HandlePosition = 'top' | 'bottom' | 'left' | 'right';
