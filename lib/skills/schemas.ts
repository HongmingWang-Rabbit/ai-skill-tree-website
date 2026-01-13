/**
 * Shared Zod schemas for the skill system
 *
 * These schemas are used across multiple skill definitions
 * to ensure consistency and reduce duplication.
 */

import { z } from 'zod';
import { SkillNodeSchema, SkillEdgeSchema } from '@/lib/schemas';

/**
 * Schema for node updates (partial skill modifications)
 */
export const NodeUpdateSchema = z.object({
  id: z.string(),
  updates: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    level: z.number().min(1).max(10).optional(),
    category: z.string().optional(),
    prerequisites: z.array(z.string()).optional(),
  }),
});

/**
 * Schema for skill graph modifications
 * Used by expand, trending, chat, and other modification skills
 */
export const ModificationsSchema = z.object({
  addNodes: z.array(SkillNodeSchema).default([]),
  updateNodes: z.array(NodeUpdateSchema).default([]),
  removeNodes: z.array(z.string()).default([]),
  addEdges: z.array(SkillEdgeSchema).default([]),
  removeEdges: z.array(z.string()).default([]),
});

export type Modifications = z.infer<typeof ModificationsSchema>;

/**
 * Base response schema for skills that modify the graph
 */
export const BaseModificationResponseSchema = z.object({
  message: z.string(),
  modifications: ModificationsSchema,
  isOffTopic: z.boolean().default(false),
});

export type BaseModificationResponse = z.infer<typeof BaseModificationResponseSchema>;

/**
 * Response schema for skills that may optionally modify the graph
 * Used by chat skill where modifications are optional
 */
export const OptionalModificationResponseSchema = z.object({
  message: z.string(),
  modifications: ModificationsSchema.optional(),
  isOffTopic: z.boolean().default(false),
});

export type OptionalModificationResponse = z.infer<typeof OptionalModificationResponseSchema>;

/**
 * Response schema with source citations
 * Used by trending skill
 */
export const ModificationWithSourcesResponseSchema = BaseModificationResponseSchema.extend({
  sources: z.array(z.string()).optional(),
});

export type ModificationWithSourcesResponse = z.infer<typeof ModificationWithSourcesResponseSchema>;

/**
 * Learning resource type enum
 */
export const ResourceTypeSchema = z.enum(['course', 'tutorial', 'docs', 'video', 'article', 'certificate']);

export type ResourceType = z.infer<typeof ResourceTypeSchema>;

/**
 * Learning resource item schema
 */
export const ResourceItemSchema = z.object({
  title: z.string(),
  url: z.string(),
  platform: z.string(),
  type: ResourceTypeSchema,
  description: z.string().optional(),
});

export type ResourceItem = z.infer<typeof ResourceItemSchema>;

/**
 * Response schema for learning resources skill
 */
export const ResourcesResponseSchema = z.object({
  message: z.string(),
  resources: z.array(z.object({
    skillName: z.string(),
    items: z.array(ResourceItemSchema),
  })),
  suggestedOrder: z.array(z.string()).optional(),
});

export type ResourcesResponse = z.infer<typeof ResourcesResponseSchema>;
