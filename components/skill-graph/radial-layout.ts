import type { Node, Edge } from '@xyflow/react';
import { LAYOUT_CONFIG } from './constants';
import { getBestHandles, seededRandom } from './layout-utils';

const {
  NODE_WIDTH,
  NODE_HEIGHT,
  CENTER_NODE_SIZE,
  CENTER_X,
  CENTER_Y,
  RING_SPACING,
  MIN_RADIUS,
  JITTER_AMOUNT,
} = LAYOUT_CONFIG;

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Build parent-child relationship maps from edges
 */
function buildAdjacencyMaps(edges: Edge[]) {
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();

  edges.forEach((edge) => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source)!.push(edge.target);
    parentMap.set(edge.target, edge.source);
  });

  return { childrenMap, parentMap };
}

/**
 * Calculate subtree sizes for proportional angular space allocation
 */
function calculateSubtreeSizes(
  rootId: string,
  childrenMap: Map<string, string[]>
): Map<string, number> {
  const sizes = new Map<string, number>();

  function calculate(nodeId: string): number {
    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) {
      sizes.set(nodeId, 1);
      return 1;
    }
    const size = children.reduce((sum, childId) => sum + calculate(childId), 0);
    sizes.set(nodeId, size);
    return size;
  }

  calculate(rootId);
  return sizes;
}

/**
 * Assign depths to nodes using BFS from center
 */
function assignNodeDepths(
  centerId: string,
  childrenMap: Map<string, string[]>
): Map<string, number> {
  const depths = new Map<string, number>();
  depths.set(centerId, 0);

  const queue: string[] = [centerId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDepth = depths.get(current) || 0;
    const children = childrenMap.get(current) || [];

    children.forEach((childId) => {
      if (!depths.has(childId)) {
        depths.set(childId, currentDepth + 1);
        queue.push(childId);
      }
    });
  }

  return depths;
}

/**
 * Assign angular positions to nodes based on subtree sizes
 */
function assignNodeAngles(
  centerId: string,
  childrenMap: Map<string, string[]>,
  subtreeSizes: Map<string, number>
): Map<string, number> {
  const angles = new Map<string, number>();
  angles.set(centerId, 0);

  function assign(nodeId: string, startAngle: number, endAngle: number) {
    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) return;

    const totalSize = children.reduce(
      (sum, childId) => sum + (subtreeSizes.get(childId) || 1),
      0
    );

    let currentAngle = startAngle;
    children.forEach((childId) => {
      const childSize = subtreeSizes.get(childId) || 1;
      const angleSpan = ((endAngle - startAngle) * childSize) / totalSize;
      const childAngle = currentAngle + angleSpan / 2;

      angles.set(childId, childAngle);
      assign(childId, currentAngle, currentAngle + angleSpan);

      currentAngle += angleSpan;
    });
  }

  assign(centerId, -Math.PI, Math.PI);
  return angles;
}

/**
 * Calculate node position from polar coordinates
 */
function calculateNodePosition(
  depth: number,
  angle: number,
  nodeId: string,
  isCenter: boolean
): { x: number; y: number } {
  if (isCenter) {
    return {
      x: CENTER_X - CENTER_NODE_SIZE / 2,
      y: CENTER_Y - CENTER_NODE_SIZE / 2,
    };
  }

  const radius = MIN_RADIUS + (depth - 1) * RING_SPACING;
  const jitter = (seededRandom(nodeId) - 0.5) * JITTER_AMOUNT;
  const adjustedAngle = angle - Math.PI / 2; // Start from top

  return {
    x: CENTER_X + (radius + jitter) * Math.cos(adjustedAngle) - NODE_WIDTH / 2,
    y: CENTER_Y + (radius + jitter) * Math.sin(adjustedAngle) - NODE_HEIGHT / 2,
  };
}

/**
 * Main layout function - arranges nodes in a radial tree pattern
 * @param nodes - Array of nodes to layout
 * @param edges - Array of edges connecting nodes
 * @param _direction - Unused, kept for API compatibility
 * @param centerNodeId - ID of the center node
 */
export function getRadialLayout(
  nodes: Node[],
  edges: Edge[],
  _direction: 'TB' | 'LR' = 'TB',
  centerNodeId?: string
): LayoutResult {
  if (nodes.length === 0) {
    return { nodes: [], edges };
  }

  if (!centerNodeId) {
    return { nodes, edges };
  }

  const { childrenMap } = buildAdjacencyMaps(edges);
  const subtreeSizes = calculateSubtreeSizes(centerNodeId, childrenMap);
  const depths = assignNodeDepths(centerNodeId, childrenMap);
  const angles = assignNodeAngles(centerNodeId, childrenMap, subtreeSizes);

  // Position all nodes
  const nodeMap = new Map<string, Node>();
  const layoutedNodes = nodes.map((node) => {
    const depth = depths.get(node.id);
    const angle = angles.get(node.id);
    const isCenter = node.id === centerNodeId;

    let position: { x: number; y: number };

    if (isCenter || (depth !== undefined && angle !== undefined)) {
      position = calculateNodePosition(depth || 0, angle || 0, node.id, isCenter);
    } else {
      // Fallback for unconnected nodes
      const fallbackIndex = nodes.indexOf(node);
      const fallbackAngle = (fallbackIndex / nodes.length) * 2 * Math.PI;
      const fallbackRadius = MIN_RADIUS + 3 * RING_SPACING;
      position = {
        x: CENTER_X + fallbackRadius * Math.cos(fallbackAngle) - NODE_WIDTH / 2,
        y: CENTER_Y + fallbackRadius * Math.sin(fallbackAngle) - NODE_HEIGHT / 2,
      };
    }

    const positionedNode = { ...node, position };
    nodeMap.set(node.id, positionedNode);
    return positionedNode;
  });

  // Update edge handles based on positions
  const layoutedEdges = edges.map((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (sourceNode && targetNode) {
      const { sourceHandle, targetHandle } = getBestHandles(sourceNode, targetNode);
      return { ...edge, sourceHandle, targetHandle };
    }
    return edge;
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
}
