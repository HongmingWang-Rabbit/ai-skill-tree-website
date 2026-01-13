/**
 * Graph Operations Tool
 *
 * Utilities for skill graph manipulation.
 * Used by expand, merge, and chat skills.
 */

import { z } from 'zod';
import type { Tool } from '../types';
import type { SkillNode, SkillEdge } from '@/lib/schemas';
import { SkillNodeSchema, SkillEdgeSchema } from '@/lib/schemas';

// ============================================================================
// Schemas
// ============================================================================

export const GraphModificationSchema = z.object({
  addNodes: z.array(SkillNodeSchema).default([]),
  updateNodes: z
    .array(
      z.object({
        id: z.string(),
        updates: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          icon: z.string().optional(),
          level: z.number().min(1).max(10).optional(),
          category: z.string().optional(),
          prerequisites: z.array(z.string()).optional(),
        }),
      })
    )
    .default([]),
  removeNodes: z.array(z.string()).default([]),
  addEdges: z.array(SkillEdgeSchema).default([]),
  removeEdges: z.array(z.string()).default([]),
});

export type GraphModification = z.infer<typeof GraphModificationSchema>;

export const ApplyModificationsParamsSchema = z.object({
  currentNodes: z.array(SkillNodeSchema),
  currentEdges: z.array(SkillEdgeSchema),
  modifications: GraphModificationSchema,
});

export type ApplyModificationsParams = z.infer<typeof ApplyModificationsParamsSchema>;

export interface ApplyModificationsResult {
  nodes: SkillNode[];
  edges: SkillEdge[];
  summary: {
    nodesAdded: number;
    nodesUpdated: number;
    nodesRemoved: number;
    edgesAdded: number;
    edgesRemoved: number;
  };
}

// ============================================================================
// Tool Implementation
// ============================================================================

export const graphOpsTool: Tool<ApplyModificationsParams, ApplyModificationsResult> = {
  id: 'graph-ops',
  name: 'Graph Operations',
  description: 'Apply modifications to skill graph (add/update/remove nodes and edges)',
  paramsSchema: ApplyModificationsParamsSchema,

  async execute(params: ApplyModificationsParams): Promise<ApplyModificationsResult> {
    const { currentNodes, currentEdges, modifications } = params;

    let nodes = [...currentNodes];
    let edges = [...currentEdges];

    // Track changes
    const summary = {
      nodesAdded: 0,
      nodesUpdated: 0,
      nodesRemoved: 0,
      edgesAdded: 0,
      edgesRemoved: 0,
    };

    // 1. Remove nodes first
    if (modifications.removeNodes.length > 0) {
      const removeSet = new Set(modifications.removeNodes);
      const beforeCount = nodes.length;
      nodes = nodes.filter((n) => !removeSet.has(n.id));
      summary.nodesRemoved = beforeCount - nodes.length;

      // Also remove edges connected to removed nodes
      edges = edges.filter((e) => !removeSet.has(e.source) && !removeSet.has(e.target));
    }

    // 2. Update existing nodes
    for (const update of modifications.updateNodes) {
      const index = nodes.findIndex((n) => n.id === update.id);
      if (index !== -1) {
        nodes[index] = { ...nodes[index], ...update.updates };
        summary.nodesUpdated++;
      }
    }

    // 3. Add new nodes
    if (modifications.addNodes.length > 0) {
      // Ensure no duplicate IDs
      const existingIds = new Set(nodes.map((n) => n.id));
      const newNodes = modifications.addNodes.filter((n) => !existingIds.has(n.id));
      nodes = [...nodes, ...newNodes];
      summary.nodesAdded = newNodes.length;
    }

    // 4. Remove edges
    if (modifications.removeEdges.length > 0) {
      const removeSet = new Set(modifications.removeEdges);
      const beforeCount = edges.length;
      edges = edges.filter((e) => !removeSet.has(e.id));
      summary.edgesRemoved = beforeCount - edges.length;
    }

    // 5. Add new edges
    if (modifications.addEdges.length > 0) {
      // Ensure no duplicate edges
      const existingEdgeIds = new Set(edges.map((e) => e.id));
      const nodeIds = new Set(nodes.map((n) => n.id));

      const newEdges = modifications.addEdges.filter((e) => {
        // Skip if edge already exists
        if (existingEdgeIds.has(e.id)) return false;
        // Skip if source or target node doesn't exist
        if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) return false;
        return true;
      });

      edges = [...edges, ...newEdges];
      summary.edgesAdded = newEdges.length;
    }

    return { nodes, edges, summary };
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Apply modifications to nodes and edges (sync version)
 */
export function applyModifications(
  currentNodes: SkillNode[],
  currentEdges: SkillEdge[],
  modifications: GraphModification
): { nodes: SkillNode[]; edges: SkillEdge[] } {
  let nodes = [...currentNodes];
  let edges = [...currentEdges];

  // Remove nodes
  if (modifications.removeNodes.length > 0) {
    const removeSet = new Set(modifications.removeNodes);
    nodes = nodes.filter((n) => !removeSet.has(n.id));
    edges = edges.filter((e) => !removeSet.has(e.source) && !removeSet.has(e.target));
  }

  // Update nodes
  for (const update of modifications.updateNodes) {
    const index = nodes.findIndex((n) => n.id === update.id);
    if (index !== -1) {
      nodes[index] = { ...nodes[index], ...update.updates };
    }
  }

  // Add new nodes
  nodes = [...nodes, ...modifications.addNodes];

  // Remove edges
  if (modifications.removeEdges.length > 0) {
    const removeSet = new Set(modifications.removeEdges);
    edges = edges.filter((e) => !removeSet.has(e.id));
  }

  // Add new edges
  edges = [...edges, ...modifications.addEdges];

  return { nodes, edges };
}

/**
 * Generate a unique skill ID
 */
export function generateSkillId(name: string, existingIds: Set<string>): string {
  // Convert to lowercase hyphenated
  let id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Ensure uniqueness
  let counter = 1;
  let finalId = id;
  while (existingIds.has(finalId)) {
    finalId = `${id}-${counter}`;
    counter++;
  }

  return finalId;
}

/**
 * Create an edge between two skills
 */
export function createEdge(sourceId: string, targetId: string): SkillEdge {
  return {
    id: `${sourceId}-to-${targetId}`,
    source: sourceId,
    target: targetId,
    animated: false,
  };
}

/**
 * Validate that all edges reference existing nodes
 */
export function validateEdges(
  edges: SkillEdge[],
  nodes: SkillNode[]
): { valid: SkillEdge[]; invalid: SkillEdge[] } {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const valid: SkillEdge[] = [];
  const invalid: SkillEdge[] = [];

  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      valid.push(edge);
    } else {
      invalid.push(edge);
    }
  }

  return { valid, invalid };
}
