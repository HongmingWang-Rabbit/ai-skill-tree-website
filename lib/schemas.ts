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

// Project schema (for portfolio/worked projects)
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(RESUME_CONFIG.projectNameMaxLength),
  description: z.string().max(RESUME_CONFIG.projectDescriptionMaxLength),
  url: z.string().max(RESUME_CONFIG.projectUrlMaxLength).optional(),
  technologies: z.array(z.string().max(RESUME_CONFIG.projectTechnologyMaxLength)).max(RESUME_CONFIG.projectTechnologiesMaxItems),
  startDate: z.string().optional(), // ISO date (YYYY-MM)
  endDate: z.string().nullable().optional(), // null = ongoing
});

// Education schema (for academic history)
export const EducationSchema = z.object({
  id: z.string(),
  school: z.string().min(1).max(RESUME_CONFIG.educationSchoolMaxLength),
  degree: z.string().max(RESUME_CONFIG.educationDegreeMaxLength).optional(),
  fieldOfStudy: z.string().max(RESUME_CONFIG.educationFieldMaxLength).optional(),
  startDate: z.string().optional(), // ISO date (YYYY-MM)
  endDate: z.string().nullable().optional(), // null = ongoing
  description: z.string().max(RESUME_CONFIG.educationDescriptionMaxLength).optional(),
  location: z.string().max(RESUME_CONFIG.educationLocationMaxLength).optional(),
});

// User address schema
export const UserAddressSchema = z.object({
  city: z.string().max(RESUME_CONFIG.addressCityMaxLength).optional(),
  state: z.string().max(RESUME_CONFIG.addressStateMaxLength).optional(),
  country: z.string().max(RESUME_CONFIG.addressCountryMaxLength).optional(),
});

// Profile update schema (extended for resume feature)
export const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(USER_NAME_MAX_LENGTH).optional(),
  bio: z.string().max(RESUME_CONFIG.bioMaxLength).optional(),
  phone: z.string().max(RESUME_CONFIG.phoneMaxLength).optional(),
  address: UserAddressSchema.optional(),
  experience: z.array(WorkExperienceSchema).max(RESUME_CONFIG.experienceMaxItems).optional(),
  projects: z.array(ProjectSchema).max(RESUME_CONFIG.projectsMaxItems).optional(),
  education: z.array(EducationSchema).max(RESUME_CONFIG.educationMaxItems).optional(),
});

// Resume generation request schema
export const ResumeGenerateSchema = z.object({
  locale: z.enum(['en', 'zh', 'ja', 'es', 'pt-BR', 'de', 'fr', 'it', 'nl', 'pl']).default('en'),
  jobTitle: z.string().max(RESUME_CONFIG.jobTitleMaxLength).optional(),
  jobUrl: z.string().url().optional(),
  jobDescription: z.string().max(50000).optional(), // Full job posting text (up to ~10k words)
});

// Learning resources request schema
export const LearningResourcesSchema = z.object({
  skillName: z.string().min(1).max(200),
  category: z.string().optional(),
  level: z.number().min(1).max(10).optional(),
});

// Affiliated link schema (for admin CRUD)
export const AffiliatedLinkSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  platform: z.enum(['udemy', 'coursera', 'edx', 'youtube', 'pluralsight', 'skillshare', 'linkedin', 'official', 'other']),
  imageUrl: z.string().url().optional(),
  skillPatterns: z.array(z.string()).min(1),
  categoryPatterns: z.array(z.string()).optional(),
  priority: z.number().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
});

// Types derived from schemas
export type SkillNode = z.infer<typeof SkillNodeSchema>;
export type SkillEdge = z.infer<typeof SkillEdgeSchema>;
export type CareerResponse = z.infer<typeof CareerResponseSchema>;
export type DocumentImportInput = z.infer<typeof DocumentImportSchema>;
export type URLImportInput = z.infer<typeof URLImportSchema>;
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type UserAddress = z.infer<typeof UserAddressSchema>;
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
export type ResumeGenerateInput = z.infer<typeof ResumeGenerateSchema>;
export type LearningResourcesInput = z.infer<typeof LearningResourcesSchema>;
export type AffiliatedLinkInput = z.infer<typeof AffiliatedLinkSchema>;
export type MapUpdateInput = z.infer<typeof MapUpdateSchema>;

// Learning resource type (shared between API and components)
export interface LearningResource {
  id: string;
  url: string;
  title: string;
  description: string;
  platform: string;
  isAffiliated: boolean;
  imageUrl?: string;
}
