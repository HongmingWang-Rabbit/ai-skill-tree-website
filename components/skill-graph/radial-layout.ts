import type { Node, Edge } from '@xyflow/react';
import { LAYOUT_CONFIG } from './constants';
import { getBestHandles, seededRandom } from './layout-utils';

const {
  NODE_WIDTH,
  NODE_HEIGHT,
  CENTER_NODE_SIZE,
  CENTER_NODE_MAX_SIZE,
  CENTER_NODE_TITLE_THRESHOLD,
  CENTER_NODE_GROWTH_FACTOR,
  CENTER_NODE_DECORATIVE_RINGS_SPACE,
  CENTER_NODE_GAP,
  CENTER_X,
  CENTER_Y,
  RING_SPACING,
  MIN_RADIUS,
  JITTER_AMOUNT,
  MAX_NODES_PER_RING,
  SUB_RING_SPACING,
} = LAYOUT_CONFIG;

/**
 * Calculate dynamic center node size based on title length
 * Must match the calculation in CenterNode.tsx
 */
function calculateCenterNodeSize(titleLength: number): number {
  const dynamicSize = Math.max(
    CENTER_NODE_SIZE,
    CENTER_NODE_SIZE + Math.max(0, titleLength - CENTER_NODE_TITLE_THRESHOLD) * CENTER_NODE_GROWTH_FACTOR
  );
  return Math.min(dynamicSize, CENTER_NODE_MAX_SIZE);
}

/**
 * Calculate minimum radius based on center node size
 * Accounts for decorative rings and node dimensions
 */
function calculateMinRadius(centerNodeSize: number): number {
  const centerRadius = centerNodeSize / 2;
  const nodeHalfHeight = NODE_HEIGHT / 2;
  return centerRadius + CENTER_NODE_DECORATIVE_RINGS_SPACE + nodeHalfHeight + CENTER_NODE_GAP;
}

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

interface LayoutOptions {
  preservePositions?: boolean;
  centerNodeTitle?: string;
}

/**
 * Build parent-child relationship map from edges
 */
function buildChildrenMap(edges: Edge[]): Map<string, string[]> {
  const childrenMap = new Map<string, string[]>();

  edges.forEach((edge) => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source)!.push(edge.target);
  });

  return childrenMap;
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
 * Calculate node position from polar coordinates
 * @param depth - The depth level of the node
 * @param angle - The angle in radians
 * @param nodeId - The node ID for consistent jitter
 * @param isCenter - Whether this is the center node
 * @param subRingIndex - Which sub-ring within the depth level (0-based)
 * @param centerNodeSize - Dynamic size of center node
 * @param minRadius - Dynamic minimum radius for first ring
 */
function calculateNodePosition(
  depth: number,
  angle: number,
  nodeId: string,
  isCenter: boolean,
  subRingIndex: number = 0,
  centerNodeSize: number = CENTER_NODE_SIZE,
  minRadius: number = MIN_RADIUS
): { x: number; y: number } {
  if (isCenter) {
    return {
      x: CENTER_X - centerNodeSize / 2,
      y: CENTER_Y - centerNodeSize / 2,
    };
  }

  // Base radius for this depth, plus offset for sub-ring
  const baseRadius = minRadius + (depth - 1) * RING_SPACING;
  const subRingOffset = subRingIndex * SUB_RING_SPACING;
  const radius = baseRadius + subRingOffset;

  const jitter = (seededRandom(nodeId) - 0.5) * JITTER_AMOUNT;
  const adjustedAngle = angle - Math.PI / 2; // Start from top

  return {
    x: CENTER_X + (radius + jitter) * Math.cos(adjustedAngle) - NODE_WIDTH / 2,
    y: CENTER_Y + (radius + jitter) * Math.sin(adjustedAngle) - NODE_HEIGHT / 2,
  };
}

/**
 * Group nodes by depth and assign sub-ring indices
 * Returns a map of nodeId -> { depth, subRingIndex, angleIndex, totalInSubRing }
 */
function assignSubRings(
  nodes: Node[],
  depths: Map<string, number>,
  centerNodeId: string
): Map<string, { depth: number; subRingIndex: number; angleIndex: number; totalInSubRing: number }> {
  const result = new Map<string, { depth: number; subRingIndex: number; angleIndex: number; totalInSubRing: number }>();

  // Group nodes by depth
  const nodesByDepth = new Map<number, Node[]>();
  nodes.forEach((node) => {
    if (node.id === centerNodeId) {
      result.set(node.id, { depth: 0, subRingIndex: 0, angleIndex: 0, totalInSubRing: 1 });
      return;
    }
    const depth = depths.get(node.id);
    if (depth === undefined) return;

    if (!nodesByDepth.has(depth)) {
      nodesByDepth.set(depth, []);
    }
    nodesByDepth.get(depth)!.push(node);
  });

  // For each depth level, assign sub-ring indices
  nodesByDepth.forEach((nodesAtDepth, depth) => {
    const numSubRings = Math.ceil(nodesAtDepth.length / MAX_NODES_PER_RING);

    nodesAtDepth.forEach((node, index) => {
      const subRingIndex = Math.floor(index / MAX_NODES_PER_RING);
      const angleIndex = index % MAX_NODES_PER_RING;

      // Calculate how many nodes are in this sub-ring
      const startOfSubRing = subRingIndex * MAX_NODES_PER_RING;
      const endOfSubRing = Math.min(startOfSubRing + MAX_NODES_PER_RING, nodesAtDepth.length);
      const totalInSubRing = endOfSubRing - startOfSubRing;

      result.set(node.id, {
        depth,
        subRingIndex: numSubRings > 1 ? subRingIndex : 0,
        angleIndex,
        totalInSubRing
      });
    });
  });

  return result;
}

/**
 * Check if a position is a valid saved position (not the default {0,0})
 */
function hasSavedPosition(node: Node): boolean {
  return node.position && (node.position.x !== 0 || node.position.y !== 0);
}

/**
 * Main layout function - arranges nodes in a radial tree pattern
 * Limits nodes per ring to MAX_NODES_PER_RING, creating sub-rings for overflow
 * @param nodes - Array of nodes to layout
 * @param edges - Array of edges connecting nodes
 * @param _direction - Unused, kept for API compatibility
 * @param centerNodeId - ID of the center node
 * @param options - Layout options (preservePositions: keep existing non-zero positions)
 */
export function getRadialLayout(
  nodes: Node[],
  edges: Edge[],
  _direction: 'TB' | 'LR' = 'TB',
  centerNodeId?: string,
  options: LayoutOptions = {}
): LayoutResult {
  const { preservePositions = false, centerNodeTitle = '' } = options;
  if (nodes.length === 0) {
    return { nodes: [], edges };
  }

  if (!centerNodeId) {
    return { nodes, edges };
  }

  // Calculate dynamic center node size and min radius
  const centerNodeSize = calculateCenterNodeSize(centerNodeTitle.length);
  const dynamicMinRadius = Math.max(MIN_RADIUS, calculateMinRadius(centerNodeSize));

  const childrenMap = buildChildrenMap(edges);
  const depths = assignNodeDepths(centerNodeId, childrenMap);
  const subRingAssignments = assignSubRings(nodes, depths, centerNodeId);

  // Position all nodes
  const nodeMap = new Map<string, Node>();
  const layoutedNodes = nodes.map((node) => {
    const isCenter = node.id === centerNodeId;
    const assignment = subRingAssignments.get(node.id);

    // If preservePositions is enabled and node has a saved position, keep it
    if (preservePositions && !isCenter && hasSavedPosition(node)) {
      nodeMap.set(node.id, node);
      return node;
    }

    let position: { x: number; y: number };

    if (isCenter) {
      position = calculateNodePosition(0, 0, node.id, true, 0, centerNodeSize, dynamicMinRadius);
    } else if (assignment) {
      // Calculate angle based on position in sub-ring
      // Evenly distribute nodes around the circle
      const angleStep = (2 * Math.PI) / assignment.totalInSubRing;
      // Offset odd sub-rings by half a step for better distribution
      const angleOffset = assignment.subRingIndex % 2 === 1 ? angleStep / 2 : 0;
      const angle = assignment.angleIndex * angleStep + angleOffset;

      position = calculateNodePosition(
        assignment.depth,
        angle,
        node.id,
        false,
        assignment.subRingIndex,
        centerNodeSize,
        dynamicMinRadius
      );
    } else {
      // Fallback for unconnected nodes - place in outer ring
      const unconnectedNodes = nodes.filter(n => !subRingAssignments.has(n.id) || subRingAssignments.get(n.id)?.depth === undefined);
      const fallbackIndex = unconnectedNodes.indexOf(node);
      const totalUnconnected = unconnectedNodes.length;
      const fallbackAngle = (fallbackIndex / Math.max(totalUnconnected, 1)) * 2 * Math.PI;
      const fallbackRadius = dynamicMinRadius + 3 * RING_SPACING;
      position = {
        x: CENTER_X + fallbackRadius * Math.cos(fallbackAngle - Math.PI / 2) - NODE_WIDTH / 2,
        y: CENTER_Y + fallbackRadius * Math.sin(fallbackAngle - Math.PI / 2) - NODE_HEIGHT / 2,
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
