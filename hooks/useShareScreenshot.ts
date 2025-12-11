'use client';

import { useCallback, useState } from 'react';
import { domToPng } from 'modern-screenshot';
import {
  SCREENSHOT_CONFIG,
  SCREENSHOT_COLORS,
  REACTFLOW_SELECTORS,
  SHARE_SLIDES,
  type ShareSlideType,
  type ShareSlide,
} from '@/lib/screenshot-constants';

// Re-export types and constants for convenience
export { SHARE_SLIDES, type ShareSlideType, type ShareSlide };

// Node position data for viewport calculations
export interface NodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isCompleted: boolean;
  isCenterNode: boolean;
}

interface ShareScreenshotOptions {
  filename?: string;
  careerTitle?: string;
  progress?: number;
  slideType?: ShareSlideType;
  completedSkills?: string[];
  totalSkills?: number;
  nodePositions?: NodePosition[];
}

interface UseShareScreenshotReturn {
  isCapturing: boolean;
  capturePreview: (element: HTMLElement | null, options?: ShareScreenshotOptions) => Promise<string | null>;
  downloadFromDataUrl: (dataUrl: string, filename?: string) => void;
  copyFromDataUrl: (dataUrl: string) => Promise<boolean>;
  shareFromDataUrl: (dataUrl: string, title?: string, text?: string) => Promise<boolean>;
}

// --- Utility Functions ---

function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || SCREENSHOT_CONFIG.IMAGE_FORMAT;
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

function getDomain(): string {
  return typeof window !== 'undefined' ? window.location.host : SCREENSHOT_CONFIG.FALLBACK_DOMAIN;
}

// --- Viewport Calculation ---

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function calculateBoundingBox(nodes: NodePosition[]): BoundingBox {
  return nodes.reduce(
    (box, { x, y, width, height }) => ({
      minX: Math.min(box.minX, x),
      minY: Math.min(box.minY, y),
      maxX: Math.max(box.maxX, x + width),
      maxY: Math.max(box.maxY, y + height),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );
}

function calculateViewportTransform(
  nodes: NodePosition[],
  containerWidth: number,
  containerHeight: number
): string {
  if (nodes.length === 0) return '';

  const { minX, minY, maxX, maxY } = calculateBoundingBox(nodes);
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const contentCenterX = (minX + maxX) / 2;
  const contentCenterY = (minY + maxY) / 2;

  const padding = SCREENSHOT_CONFIG.VIEWPORT_PADDING;
  const scaleX = (containerWidth - padding * 2) / contentWidth;
  const scaleY = (containerHeight - padding * 2) / contentHeight;
  const scale = Math.min(scaleX, scaleY, SCREENSHOT_CONFIG.MAX_ZOOM);

  const translateX = (containerWidth / 2) - (contentCenterX * scale);
  const translateY = (containerHeight / 2) - (contentCenterY * scale);

  return `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

// --- Branding Overlay Creation ---

function createBrandingOverlay(
  slideType: ShareSlideType,
  options?: ShareScreenshotOptions
): HTMLElement {
  const domain = getDomain();

  const header = document.createElement('div');
  header.style.cssText = `
    position: absolute;
    top: 20px;
    left: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    pointer-events: none;
  `;

  // Title section
  const titleSection = document.createElement('div');
  titleSection.style.cssText = `
    background: ${SCREENSHOT_COLORS.BACKGROUND_OVERLAY};
    backdrop-filter: blur(8px);
    border: 1px solid ${SCREENSHOT_COLORS.BORDER_SUBTLE};
    border-radius: 12px;
    padding: 16px 24px;
  `;

  const title = document.createElement('div');
  title.style.cssText = `
    font-size: 24px;
    font-weight: 700;
    color: ${SCREENSHOT_COLORS.TEXT_PRIMARY};
    margin-bottom: 4px;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  title.textContent = slideType === 'completed'
    ? `My ${options?.careerTitle || 'Career'} Achievements`
    : `My ${options?.careerTitle || 'Career'} Skill Map`;

  const subtitle = document.createElement('div');
  subtitle.style.cssText = `
    font-size: 14px;
    color: ${SCREENSHOT_COLORS.TEXT_SECONDARY};
    font-family: system-ui, -apple-system, sans-serif;
  `;
  subtitle.textContent = `Powered by ${domain}`;

  titleSection.appendChild(title);
  titleSection.appendChild(subtitle);
  header.appendChild(titleSection);

  // Progress section (if provided)
  if (options?.progress !== undefined) {
    const progressSection = document.createElement('div');
    progressSection.style.cssText = `
      background: ${SCREENSHOT_COLORS.BACKGROUND_OVERLAY};
      backdrop-filter: blur(8px);
      border: 1px solid ${SCREENSHOT_COLORS.BORDER_SUBTLE};
      border-radius: 12px;
      padding: 16px 24px;
      text-align: center;
    `;

    const progressValue = document.createElement('div');
    progressValue.style.cssText = `
      font-size: 32px;
      font-weight: 700;
      color: ${SCREENSHOT_COLORS.ACCENT_AMBER};
      font-family: system-ui, -apple-system, sans-serif;
    `;
    progressValue.textContent = `${options.progress}%`;

    const progressLabel = document.createElement('div');
    progressLabel.style.cssText = `
      font-size: 12px;
      color: ${SCREENSHOT_COLORS.TEXT_SECONDARY};
      font-family: system-ui, -apple-system, sans-serif;
    `;
    progressLabel.textContent = slideType === 'completed'
      ? `${options.completedSkills?.length || 0} Skills Mastered`
      : 'Complete';

    progressSection.appendChild(progressValue);
    progressSection.appendChild(progressLabel);
    header.appendChild(progressSection);
  }

  return header;
}

// --- Summary Card Creation ---

function createSummaryCard(options?: ShareScreenshotOptions): string | null {
  const { SUMMARY_CARD_WIDTH: width, SUMMARY_CARD_HEIGHT: height } = SCREENSHOT_CONFIG;
  const domain = getDomain();
  const completedSkills = options?.completedSkills || [];
  const progress = options?.progress || 0;
  const careerTitle = options?.careerTitle || 'Career';
  const totalSkills = options?.totalSkills || 0;

  const canvas = document.createElement('canvas');
  canvas.width = width * SCREENSHOT_CONFIG.SCALE;
  canvas.height = height * SCREENSHOT_CONFIG.SCALE;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.scale(SCREENSHOT_CONFIG.SCALE, SCREENSHOT_CONFIG.SCALE);

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, SCREENSHOT_COLORS.BACKGROUND_PRIMARY);
  gradient.addColorStop(1, SCREENSHOT_COLORS.BACKGROUND_SECONDARY);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Subtle dot pattern
  ctx.fillStyle = SCREENSHOT_COLORS.ACCENT_PATTERN;
  const spacing = SCREENSHOT_CONFIG.SUMMARY_PATTERN_SPACING;
  for (let i = 0; i < width; i += spacing) {
    for (let j = 0; j < height; j += spacing) {
      ctx.beginPath();
      ctx.arc(i, j, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Title
  ctx.fillStyle = SCREENSHOT_COLORS.TEXT_PRIMARY;
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`My ${careerTitle} Journey`, width / 2, 60);

  // Progress ring
  const centerX = width / 2;
  const centerY = 180;
  const radius = SCREENSHOT_CONFIG.SUMMARY_PROGRESS_RING_RADIUS;

  // Background circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = SCREENSHOT_COLORS.PROGRESS_TRACK;
  ctx.lineWidth = 12;
  ctx.stroke();

  // Progress arc
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + (progress / 100) * Math.PI * 2);
  ctx.strokeStyle = SCREENSHOT_COLORS.ACCENT_AMBER;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Progress text
  ctx.fillStyle = SCREENSHOT_COLORS.ACCENT_AMBER;
  ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${progress}%`, centerX, centerY);

  // Stats
  ctx.fillStyle = SCREENSHOT_COLORS.TEXT_SECONDARY;
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${completedSkills.length} of ${totalSkills} skills mastered`, centerX, centerY + radius + 40);

  // Skills section header
  ctx.fillStyle = SCREENSHOT_COLORS.TEXT_PRIMARY;
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Skills Learned:', 60, 310);

  // Skills list in columns
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  const maxSkills = SCREENSHOT_CONFIG.SUMMARY_MAX_SKILLS_TO_SHOW;
  const skillsPerColumn = SCREENSHOT_CONFIG.SUMMARY_SKILLS_PER_COLUMN;
  const skillsToShow = completedSkills.slice(0, maxSkills);
  const columnWidth = (width - 120) / 2;

  skillsToShow.forEach((skill, index) => {
    const column = index < skillsPerColumn ? 0 : 1;
    const row = index % skillsPerColumn;
    const x = 60 + column * columnWidth;
    const y = 340 + row * 28;

    ctx.fillStyle = SCREENSHOT_COLORS.ACCENT_EMERALD;
    ctx.fillText('✓', x, y);
    ctx.fillStyle = SCREENSHOT_COLORS.TEXT_LIGHT;
    ctx.fillText(skill, x + 20, y);
  });

  if (completedSkills.length > maxSkills) {
    ctx.fillStyle = SCREENSHOT_COLORS.TEXT_SECONDARY;
    ctx.fillText(`+${completedSkills.length - maxSkills} more...`, 60, 340 + skillsPerColumn * 28);
  }

  // Footer
  ctx.fillStyle = SCREENSHOT_COLORS.TEXT_MUTED;
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Powered by ${domain}`, width / 2, height - 30);

  return canvas.toDataURL(SCREENSHOT_CONFIG.IMAGE_FORMAT, SCREENSHOT_CONFIG.IMAGE_QUALITY);
}

// --- Node/Edge Processing ---

function processAchievementsSlide(
  clonedContainer: HTMLElement,
  completedNodeIds: Set<string>
): void {
  // Hide non-completed nodes, add glow to completed ones
  const nodes = clonedContainer.querySelectorAll(REACTFLOW_SELECTORS.NODE);
  nodes.forEach((node) => {
    if (node instanceof HTMLElement) {
      const nodeId = node.getAttribute('data-id');
      if (nodeId && !completedNodeIds.has(nodeId)) {
        node.style.display = 'none';
      } else if (nodeId && completedNodeIds.has(nodeId)) {
        node.style.filter = `drop-shadow(0 0 12px ${SCREENSHOT_COLORS.GLOW_EMERALD})`;
      }
    }
  });

  // Show only edges connecting visible nodes
  const edges = clonedContainer.querySelectorAll(REACTFLOW_SELECTORS.EDGE);
  edges.forEach((edge) => {
    if (edge instanceof HTMLElement || edge instanceof SVGElement) {
      const edgeElement = edge as HTMLElement;
      const sourceId = edgeElement.getAttribute('data-source');
      const targetId = edgeElement.getAttribute('data-target');

      const sourceVisible = sourceId && completedNodeIds.has(sourceId);
      const targetVisible = targetId && completedNodeIds.has(targetId);

      if (!sourceVisible || !targetVisible) {
        edgeElement.style.display = 'none';
      } else {
        const path = edgeElement.querySelector('path');
        if (path) {
          path.style.stroke = SCREENSHOT_COLORS.ACCENT_EMERALD;
          path.style.filter = `drop-shadow(0 0 4px ${SCREENSHOT_COLORS.GLOW_EMERALD_SUBTLE})`;
        }
      }
    }
  });
}

// --- Main Capture Function ---

async function captureElement(
  element: HTMLElement,
  options?: ShareScreenshotOptions
): Promise<string | null> {
  const slideType = options?.slideType || 'full';
  const nodePositions = options?.nodePositions || [];

  // Summary slide uses canvas, not DOM capture
  if (slideType === 'summary') {
    return createSummaryCard(options);
  }

  const reactFlowContainer = element.querySelector(REACTFLOW_SELECTORS.CONTAINER) as HTMLElement;
  const targetElement = reactFlowContainer || element;

  if (targetElement.offsetWidth === 0 || targetElement.offsetHeight === 0) {
    return null;
  }

  // Determine visible nodes based on slide type
  const visibleNodePositions = slideType === 'completed'
    ? nodePositions.filter(n => n.isCompleted || n.isCenterNode)
    : nodePositions;

  // Pre-calculate viewport transform
  const containerWidth = targetElement.offsetWidth || SCREENSHOT_CONFIG.DEFAULT_CONTAINER_WIDTH;
  const containerHeight = targetElement.offsetHeight || SCREENSHOT_CONFIG.DEFAULT_CONTAINER_HEIGHT;
  const viewportTransform = calculateViewportTransform(visibleNodePositions, containerWidth, containerHeight);

  // Create set of visible node IDs for quick lookup
  const completedNodeIds = new Set(
    nodePositions.filter(n => n.isCompleted || n.isCenterNode).map(n => n.id)
  );

  try {
    const dataUrl = await domToPng(targetElement, {
      backgroundColor: SCREENSHOT_COLORS.BACKGROUND_PRIMARY,
      scale: SCREENSHOT_CONFIG.SCALE,
      filter: (node) => {
        if (node instanceof HTMLElement) {
          const classList = node.classList;
          if (classList?.contains(REACTFLOW_SELECTORS.MINIMAP.slice(1))) return false;
          if (classList?.contains(REACTFLOW_SELECTORS.CONTROLS.slice(1))) return false;
          if (classList?.contains(REACTFLOW_SELECTORS.PANEL.slice(1))) return false;
        }
        return true;
      },
      onCloneNode: (clonedNode): void => {
        if (!(clonedNode instanceof HTMLElement)) return;

        // Apply viewport transform to ReactFlow container
        if (clonedNode.classList?.contains(REACTFLOW_SELECTORS.CONTAINER.slice(1))) {
          const viewport = clonedNode.querySelector(REACTFLOW_SELECTORS.VIEWPORT) as HTMLElement;
          if (viewport && viewportTransform) {
            viewport.style.transform = viewportTransform;
            viewport.style.transformOrigin = '0 0';
          }

          // Process achievements slide
          if (slideType === 'completed') {
            processAchievementsSlide(clonedNode, completedNodeIds);
          }

          // Add branding overlay
          const brandingOverlay = createBrandingOverlay(slideType, options);
          clonedNode.appendChild(brandingOverlay);
        }
      },
    });

    return dataUrl;
  } catch {
    return null;
  }
}

// --- Main Hook ---

export function useShareScreenshot(): UseShareScreenshotReturn {
  const [isCapturing, setIsCapturing] = useState(false);

  const capturePreview = useCallback(async (
    element: HTMLElement | null,
    options?: ShareScreenshotOptions
  ): Promise<string | null> => {
    if (!element && options?.slideType !== 'summary') {
      return null;
    }

    setIsCapturing(true);
    try {
      return await captureElement(element!, options);
    } catch {
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const downloadFromDataUrl = useCallback((dataUrl: string, filename?: string): void => {
    const link = document.createElement('a');
    link.download = filename || `skill-tree-${Date.now()}.png`;
    link.href = dataUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 100);
  }, []);

  const copyFromDataUrl = useCallback(async (dataUrl: string): Promise<boolean> => {
    try {
      const blob = dataURLtoBlob(dataUrl);
      const item = new ClipboardItem({ [SCREENSHOT_CONFIG.IMAGE_FORMAT]: blob });
      await navigator.clipboard.write([item]);
      return true;
    } catch {
      return false;
    }
  }, []);

  const shareFromDataUrl = useCallback(async (
    dataUrl: string,
    title?: string,
    text?: string
  ): Promise<boolean> => {
    let canShareFiles = false;
    try {
      canShareFiles = navigator.canShare?.({
        files: [new File([], 'test.png', { type: SCREENSHOT_CONFIG.IMAGE_FORMAT })]
      }) ?? false;
    } catch {
      canShareFiles = false;
    }

    if (!navigator.share || !canShareFiles) {
      downloadFromDataUrl(dataUrl);
      return true;
    }

    try {
      const blob = dataURLtoBlob(dataUrl);
      const file = new File([blob], 'skill-tree.png', { type: SCREENSHOT_CONFIG.IMAGE_FORMAT });

      await navigator.share({
        title: title || 'My Skill Tree Progress',
        text: text || 'Check out my skill tree progress!',
        files: [file],
      });
      return true;
    } catch {
      return false;
    }
  }, [downloadFromDataUrl]);

  return {
    isCapturing,
    capturePreview,
    downloadFromDataUrl,
    copyFromDataUrl,
    shareFromDataUrl,
  };
}
