import { pgTable, text, timestamp, uuid, integer, jsonb } from 'drizzle-orm/pg-core';

export const careers = pgTable('careers', {
  id: uuid('id').primaryKey().defaultRandom(),
  canonicalKey: text('canonical_key').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  skillGraphId: uuid('skill_graph_id'),
  generatedAt: timestamp('generated_at').defaultNow(),
});

export const skillGraphs = pgTable('skill_graphs', {
  id: uuid('id').primaryKey().defaultRandom(),
  careerId: uuid('career_id').references(() => careers.id),
  nodes: jsonb('nodes').notNull().$type<SkillNodeData[]>(),
  edges: jsonb('edges').notNull().$type<SkillEdgeData[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const skills = pgTable('skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  skillGraphId: uuid('skill_graph_id').references(() => skillGraphs.id),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  level: integer('level').notNull().default(1),
  category: text('category'),
  prerequisites: jsonb('prerequisites').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Types for JSONB columns
export interface SkillNodeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  category: string;
  progress: number;
  prerequisites: string[];
}

export interface SkillEdgeData {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

// Infer types from schema
export type Career = typeof careers.$inferSelect;
export type NewCareer = typeof careers.$inferInsert;
export type SkillGraph = typeof skillGraphs.$inferSelect;
export type NewSkillGraph = typeof skillGraphs.$inferInsert;
export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
