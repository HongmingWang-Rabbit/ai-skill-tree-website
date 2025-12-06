import type { Node, Edge } from '@xyflow/react';
import { LAYOUT_CONFIG, type HandlePosition } from './constants';

const { NODE_WIDTH, NODE_HEIGHT, CENTER_NODE_SIZE } = LAYOUT_CONFIG;

/**
 * Calculate the center point of a node based on its position and type
 */
export function getNodeCenter(node: Node): { x: number; y: number } {
  const isCenter = node.type === 'center';
  const width = isCenter ? CENTER_NODE_SIZE : NODE_WIDTH;
  const height = isCenter ? CENTER_NODE_SIZE : NODE_HEIGHT;
  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  };
}

/**
 * Determine the best handle positions for an edge based on relative node positions
 */
export function getBestHandles(
  sourceNode: Node,
  targetNode: Node
): { sourceHandle: string; targetHandle: string } {
  const source = getNodeCenter(sourceNode);
  const target = getNodeCenter(targetNode);

  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const angle = Math.atan2(dy, dx);

  let sourceDir: HandlePosition;
  let targetDir: HandlePosition;

  // Determine direction based on angle quadrant
  // angle: -PI to PI, where 0 is right, PI/2 is down, -PI/2 is up
  if (angle > -Math.PI / 4 && angle <= Math.PI / 4) {
    sourceDir = 'right';
    targetDir = 'left';
  } else if (angle > Math.PI / 4 && angle <= (3 * Math.PI) / 4) {
    sourceDir = 'bottom';
    targetDir = 'top';
  } else if (angle > (3 * Math.PI) / 4 || angle <= (-3 * Math.PI) / 4) {
    sourceDir = 'left';
    targetDir = 'right';
  } else {
    sourceDir = 'top';
    targetDir = 'bottom';
  }

  return {
    sourceHandle: `${sourceDir}-source`,
    targetHandle: `${targetDir}-target`,
  };
}

/**
 * Update edge handles based on current node positions
 */
export function updateEdgeHandles(nodes: Node[], edges: Edge[]): Edge[] {
  const nodeMap = new Map<string, Node>();
  nodes.forEach((node) => nodeMap.set(node.id, node));

  return edges.map((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (sourceNode && targetNode) {
      const { sourceHandle, targetHandle } = getBestHandles(sourceNode, targetNode);
      return {
        ...edge,
        sourceHandle,
        targetHandle,
      };
    }

    return edge;
  });
}

/**
 * Generate a deterministic pseudo-random value from a string seed
 */
export function seededRandom(seed: string): number {
  const numericSeed = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const x = Math.sin(numericSeed) * 10000;
  return x - Math.floor(x);
}
