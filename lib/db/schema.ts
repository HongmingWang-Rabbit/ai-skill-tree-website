import { pgTable, text, timestamp, uuid, integer, jsonb, primaryKey, unique, boolean } from 'drizzle-orm/pg-core';

// Note: For locale types, use `Locale` from '@/i18n/routing' as the canonical source

// Type for user's work experience (stored in users.experience JSONB)
export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  startDate: string; // ISO date string (YYYY-MM)
  endDate: string | null; // null = current position
  description: string;
  location?: string;
}

export const careers = pgTable('careers', {
  id: uuid('id').primaryKey().defaultRandom(),
  canonicalKey: text('canonical_key').notNull(),
  locale: text('locale').notNull().default('en'),
  title: text('title').notNull(),
  description: text('description'),
  skillGraphId: uuid('skill_graph_id'),
  generatedAt: timestamp('generated_at').defaultNow(),
}, (table) => ({
  // Unique constraint on canonicalKey + locale combination
  uniqueKeyLocale: unique('careers_canonical_key_locale_unique').on(table.canonicalKey, table.locale),
}));

export const skillGraphs = pgTable('skill_graphs', {
  id: uuid('id').primaryKey().defaultRandom(),
  careerId: uuid('career_id').references(() => careers.id),
  locale: text('locale').notNull().default('en'),
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

// NextAuth.js tables for authentication
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  walletAddress: text('wallet_address').unique(),
  // Resume profile fields
  bio: text('bio'),
  experience: jsonb('experience').$type<WorkExperience[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').notNull().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.identifier, table.token] }),
}));

// User's saved career graphs (personal maps)
export const userCareerGraphs = pgTable('user_career_graphs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  careerId: uuid('career_id').notNull().references(() => careers.id, { onDelete: 'cascade' }),
  // Custom title for user's map (defaults to career title)
  title: text('title'),
  // Store node positions and progress as JSONB for flexibility
  nodeData: jsonb('node_data').notNull().$type<UserNodeData[]>(),
  // Custom nodes/edges for merged or AI-modified maps (overrides base skillGraph when present)
  customNodes: jsonb('custom_nodes').$type<SkillNodeData[]>(),
  customEdges: jsonb('custom_edges').$type<SkillEdgeData[]>(),
  // Sharing settings
  isPublic: boolean('is_public').notNull().default(false),
  shareSlug: text('share_slug').unique(),
  // Track lineage when copied from another user's map (soft reference, no FK constraint to avoid circular type)
  copiedFromId: uuid('copied_from_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User's master skill map (cached merged view of all careers)
export const userMasterMaps = pgTable('user_master_maps', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull().default('en'),
  // Merged skills from all careers
  mergedSkills: jsonb('merged_skills').notNull().$type<MergedSkill[]>(),
  // Mapping from merged skill ID to original skill IDs
  skillMapping: jsonb('skill_mapping').notNull().$type<Record<string, string[]>>(),
  // Source graph IDs used to generate this map (for invalidation)
  sourceGraphIds: text('source_graph_ids').array().notNull(),
  generatedAt: timestamp('generated_at').defaultNow(),
}, (table) => ({
  uniqueUserLocale: unique('user_master_maps_user_locale').on(table.userId, table.locale),
}));

// User skill progress tracking (for detailed per-skill tracking)
export const userSkillProgress = pgTable('user_skill_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  careerId: uuid('career_id').notNull().references(() => careers.id, { onDelete: 'cascade' }),
  skillId: text('skill_id').notNull(),
  progress: integer('progress').notNull().default(0),
  unlockedAt: timestamp('unlocked_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Affiliated links for learning resources (admin-configurable priority links)
export const affiliatedLinks = pgTable('affiliated_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: text('url').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  platform: text('platform').notNull(), // udemy, coursera, youtube, edx, etc.
  imageUrl: text('image_url'),
  // Matching criteria - skills can match by name patterns or category
  skillPatterns: jsonb('skill_patterns').notNull().$type<string[]>(), // keywords to match skill names
  categoryPatterns: jsonb('category_patterns').$type<string[]>(), // category matching
  priority: integer('priority').notNull().default(0), // higher = shown first
  isActive: boolean('is_active').notNull().default(true),
  clickCount: integer('click_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User subscriptions (Stripe integration)
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePriceId: text('stripe_price_id'),
  tier: text('tier').notNull().default('free'), // 'free' | 'pro' | 'premium'
  status: text('status').notNull().default('active'), // 'active' | 'canceled' | 'past_due' | 'paused'
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User credits balance
export const credits = pgTable('credits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  balance: integer('balance').notNull().default(500), // 500 credits = $5 initial bonus
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Credit transaction audit trail
export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(), // Negative = deduction, Positive = addition
  balanceAfter: integer('balance_after').notNull(),
  type: text('type').notNull(), // 'usage' | 'purchase' | 'subscription' | 'bonus' | 'refund'
  operation: text('operation').notNull(), // 'ai_generate', 'resume_export', 'signup_bonus', etc.
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type for user's node data (position + progress)
export interface UserNodeData {
  skillId: string;
  progress: number;
  position?: { x: number; y: number };
}

// Types for merged master skill map
export interface MergedSkill {
  id: string;                    // Generated merged skill ID
  name: string;                  // Canonical skill name
  description: string;           // Best description from sources
  icon: string;                  // Emoji icon
  level: number;                 // Average level across sources
  category: string;              // Primary category
  progress: number;              // Max progress across all careers
  sourceSkills: SourceSkillRef[];// Original skills that merged into this
}

export interface SourceSkillRef {
  skillId: string;
  careerId: string;
  careerTitle: string;
  originalName: string;          // Original name before merge
}

// Infer types from schema
export type Career = typeof careers.$inferSelect;
export type NewCareer = typeof careers.$inferInsert;
export type SkillGraph = typeof skillGraphs.$inferSelect;
export type NewSkillGraph = typeof skillGraphs.$inferInsert;
export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type UserSkillProgress = typeof userSkillProgress.$inferSelect;
export type NewUserSkillProgress = typeof userSkillProgress.$inferInsert;
export type UserCareerGraph = typeof userCareerGraphs.$inferSelect;
export type NewUserCareerGraph = typeof userCareerGraphs.$inferInsert;
export type UserMasterMap = typeof userMasterMaps.$inferSelect;
export type NewUserMasterMap = typeof userMasterMaps.$inferInsert;
export type AffiliatedLink = typeof affiliatedLinks.$inferSelect;
export type NewAffiliatedLink = typeof affiliatedLinks.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Credit = typeof credits.$inferSelect;
export type NewCredit = typeof credits.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
