import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import type { SkillNodeData } from './SkillNode';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 140;

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 100,
    marginx: 50,
    marginy: 50,
  });

  // Add nodes to the graph
  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Calculate the layout
  dagre.layout(g);

  // Apply positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
}

export function groupNodesByCategory(nodes: Node[]): Map<string, Node[]> {
  const groups = new Map<string, Node[]>();

  nodes.forEach((node) => {
    const category = (node.data as unknown as SkillNodeData)?.category || 'Other';
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(node);
  });

  return groups;
}

export function sortNodesByLevel(nodes: Node[]): Node[] {
  return [...nodes].sort((a, b) => {
    const levelA = (a.data as unknown as SkillNodeData)?.level || 0;
    const levelB = (b.data as unknown as SkillNodeData)?.level || 0;
    return levelA - levelB;
  });
}
