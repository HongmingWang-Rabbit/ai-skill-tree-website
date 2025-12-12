import { z } from 'zod';

export const SkillNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  level: z.number().min(1).max(10),
  category: z.string(),
  progress: z.number().min(0).max(100).default(0),
  prerequisites: z.array(z.string()).default([]),
});

export const SkillEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  animated: z.boolean().optional().default(true),
});

export const CareerResponseSchema = z.object({
  canonicalKey: z.string(),
  title: z.string(),
  description: z.string(),
  skills: z.array(SkillNodeSchema),
  edges: z.array(SkillEdgeSchema),
});

export const CareerSearchSchema = z.object({
  query: z.string().min(1).max(200),
});

export const GenerateCareerSchema = z.object({
  career: z.string().min(1).max(200),
  locale: z.enum(['en', 'zh', 'ja']).optional().default('en'),
});

// Types derived from schemas
export type SkillNode = z.infer<typeof SkillNodeSchema>;
export type SkillEdge = z.infer<typeof SkillEdgeSchema>;
export type CareerResponse = z.infer<typeof CareerResponseSchema>;
