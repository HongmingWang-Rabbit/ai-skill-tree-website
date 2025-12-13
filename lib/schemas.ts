import { z } from 'zod';
import { SKILL_PROGRESS_MAX, MAP_TITLE_MAX_LENGTH, USER_NAME_MAX_LENGTH, RESUME_CONFIG } from './constants';

// User node data schema (for saved map progress)
export const UserNodeDataSchema = z.object({
  skillId: z.string(),
  progress: z.number().min(0).max(SKILL_PROGRESS_MAX),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
});

export type UserNodeDataInput = z.infer<typeof UserNodeDataSchema>;

// Map update schema
export const MapUpdateSchema = z.object({
  title: z.string().min(1).max(MAP_TITLE_MAX_LENGTH).optional(),
  isPublic: z.boolean().optional(),
  nodeData: z.array(UserNodeDataSchema).optional(),
  // Custom nodes/edges for merged or AI-modified maps
  customNodes: z.array(z.lazy(() => SkillNodeSchema)).optional(),
  customEdges: z.array(z.lazy(() => SkillEdgeSchema)).optional(),
  // ID of source map to delete after successful merge
  deleteSourceMapId: z.string().uuid().optional(),
});

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

// Document import schemas
export const DocumentImportSchema = z.object({
  locale: z.enum(['en', 'zh', 'ja']).default('en'),
  // For update mode, existing map context
  existingNodes: z.array(z.lazy(() => SkillNodeSchema)).optional(),
  existingEdges: z.array(z.lazy(() => SkillEdgeSchema)).optional(),
});

export const URLImportSchema = z.object({
  url: z.string().url(),
  locale: z.enum(['en', 'zh', 'ja']).default('en'),
  // For update mode, existing map context
  existingNodes: z.array(z.lazy(() => SkillNodeSchema)).optional(),
  existingEdges: z.array(z.lazy(() => SkillEdgeSchema)).optional(),
});

// Work experience schema (for resume profile)
export const WorkExperienceSchema = z.object({
  id: z.string(),
  company: z.string().min(1).max(RESUME_CONFIG.experienceCompanyMaxLength),
  title: z.string().min(1).max(RESUME_CONFIG.experienceTitleMaxLength),
  startDate: z.string(), // ISO date (YYYY-MM)
  endDate: z.string().nullable(), // null = current position
  description: z.string().max(RESUME_CONFIG.experienceDescriptionMaxLength),
  location: z.string().max(RESUME_CONFIG.experienceLocationMaxLength).optional(),
});

// Profile update schema (extended for resume feature)
export const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(USER_NAME_MAX_LENGTH).optional(),
  bio: z.string().max(RESUME_CONFIG.bioMaxLength).optional(),
  experience: z.array(WorkExperienceSchema).max(RESUME_CONFIG.experienceMaxItems).optional(),
});

// Resume generation request schema
export const ResumeGenerateSchema = z.object({
  locale: z.enum(['en', 'zh', 'ja']).default('en'),
  jobTitle: z.string().max(RESUME_CONFIG.jobTitleMaxLength).optional(),
  jobUrl: z.string().url().optional(),
});

// Types derived from schemas
export type SkillNode = z.infer<typeof SkillNodeSchema>;
export type SkillEdge = z.infer<typeof SkillEdgeSchema>;
export type CareerResponse = z.infer<typeof CareerResponseSchema>;
export type DocumentImportInput = z.infer<typeof DocumentImportSchema>;
export type URLImportInput = z.infer<typeof URLImportSchema>;
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
export type ResumeGenerateInput = z.infer<typeof ResumeGenerateSchema>;
