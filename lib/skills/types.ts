/**
 * Internal Skill System Types
 *
 * This is an MCP-like system for the Personal Skill Map platform.
 * Skills are discrete AI capabilities with focused prompts that:
 * 1. Reduce context window usage by loading on-demand
 * 2. Provide better tooling through composition
 * 3. Support slash commands for user invocation
 */

import { z } from 'zod';
import { type Locale } from '@/i18n/routing';
import { type SkillNode, type SkillEdge } from '@/lib/schemas';

// ============================================================================
// Tool Types
// ============================================================================

export type ToolId = 'web-search' | 'graph-ops' | 'learning' | 'document';

export interface Tool<TParams = unknown, TResult = unknown> {
  id: ToolId;
  name: string;
  description: string;
  paramsSchema?: z.ZodSchema<TParams>;
  execute: (params: TParams) => Promise<TResult>;
}

export interface ToolRegistry {
  get<T extends ToolId>(id: T): Tool | undefined;
  list(): Tool[];
}

// ============================================================================
// Context Types
// ============================================================================

/** Condensed skill info to reduce tokens */
export interface SkillSummary {
  id: string;
  name: string;
  level: number;
  category: string;
}

/** Condensed map info */
export interface MapSummary {
  id: string;
  title: string;
  careerTitle: string;
}

/** Chat message for history */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Full context available to the system */
export interface FullContext {
  locale: Locale;
  careerTitle: string;
  careerDescription: string;
  nodes: SkillNode[];
  edges: SkillEdge[];
  chatHistory?: ChatMessage[];
  userMaps?: MapSummary[];
  // For merge operations
  targetMap?: {
    id: string;
    title: string;
    careerTitle: string;
    nodes: SkillNode[];
    edges: SkillEdge[];
  };
  // User info
  userId?: string;
  isAuthenticated: boolean;
}

/** Minimal context passed to skills */
export interface SkillContext {
  locale: Locale;
  careerTitle?: string;
  careerDescription?: string;
  skills?: SkillSummary[];
  chatHistory?: ChatMessage[];
  userMaps?: MapSummary[];
  /** Skill-specific data (e.g., web search results) */
  customData?: Record<string, unknown>;
}

// ============================================================================
// Skill Definition Types
// ============================================================================

export interface ContextRequirements {
  /** Include current skills in context? */
  needsSkillList: boolean;
  /** Include career title/description? */
  needsCareerInfo: boolean;
  /** Include conversation history? */
  needsChatHistory: boolean;
  /** Include user's other maps? */
  needsUserMaps: boolean;
  /** Max skills to include (0 = all) */
  maxSkillsInContext: number;
  /** Custom context builder for complex skills */
  customContextBuilder?: (ctx: FullContext) => SkillContext;
}

export interface SkillDefinition<TResponse = unknown> {
  // ---- Metadata ----
  /** Unique skill ID (e.g., 'expand', 'trending') */
  id: string;
  /** Display name */
  name: string;
  /** Description of what this skill does */
  description: string;
  /** Alternative trigger words */
  aliases: string[];

  // ---- Invocation ----
  /** Slash command (e.g., '/expand') - optional */
  slashCommand?: string;
  /** Regex patterns for auto-detection */
  intentPatterns: RegExp[];

  // ---- Context ----
  /** What context this skill needs */
  contextRequirements: ContextRequirements;

  // ---- Tools ----
  /** Tools this skill can use */
  tools: ToolId[];

  // ---- Execution ----
  /** System prompt - can be string or function */
  systemPrompt: string | ((ctx: SkillContext) => string);
  /** Zod schema for response validation */
  responseSchema: z.ZodSchema<TResponse>;
  /** OpenAI model to use (default: from config) */
  model?: string;
  /** Temperature (default: from config) */
  temperature?: number;
  /** Max tokens (default: from config) */
  maxTokens?: number;

  // ---- Hooks ----
  /** Pre-execution hook (e.g., fetch web data) */
  preExecute?: (ctx: SkillContext) => Promise<SkillContext>;
  /** Post-process the response */
  postProcess?: (response: TResponse, ctx: SkillContext) => SkillResult;
}

// ============================================================================
// Result Types
// ============================================================================

/** Standard skill result */
export interface SkillResult {
  /** Message to display to user */
  message: string;
  /** Graph modifications (if any) */
  modifications?: {
    addNodes: SkillNode[];
    updateNodes: Array<{ id: string; updates: Partial<SkillNode> }>;
    removeNodes: string[];
    addEdges: SkillEdge[];
    removeEdges: string[];
  };
  /** Skill-specific data (e.g., resources, test questions) */
  data?: Record<string, unknown>;
  /** Suggested follow-up actions */
  suggestFollowUp?: string[];
  /** Was the request off-topic? */
  isOffTopic?: boolean;
}

/** Result from learning resources skill */
export interface LearningResourceResult extends SkillResult {
  data: {
    resources: Array<{
      skillName: string;
      items: Array<{
        title: string;
        url: string;
        platform: string;
        type: 'course' | 'tutorial' | 'docs' | 'video' | 'article' | 'certificate';
      }>;
    }>;
  };
}

/** Result from test skill */
export interface SkillTestResult extends SkillResult {
  data: {
    test: {
      skillId: string;
      skillName: string;
      questions: Array<{
        id: string;
        question: string;
        options: string[];
        correctIndex: number;
        explanation?: string;
      }>;
    };
  };
}

// ============================================================================
// Router Types
// ============================================================================

export interface RouteResult {
  skill: SkillDefinition;
  /** Extracted parameters from the command (e.g., skill name for /resources React) */
  params?: Record<string, string>;
  /** Was this an explicit slash command or intent detection? */
  matchType: 'slash-command' | 'intent' | 'fallback';
}

export interface SkillRouter {
  /** Route a message to the appropriate skill */
  route(message: string): RouteResult;
  /** Get all available slash commands for UI */
  getSlashCommands(): Array<{ command: string; name: string; description: string }>;
  /** Register a skill */
  register(skill: SkillDefinition): void;
}

// ============================================================================
// Executor Types
// ============================================================================

export interface ExecutorOptions {
  /** Enable streaming response */
  stream?: boolean;
  /** Timeout in ms */
  timeout?: number;
}

export interface SkillExecutor {
  /** Execute a skill with the given message and context */
  execute(
    message: string,
    context: FullContext,
    options?: ExecutorOptions
  ): Promise<SkillResult>;
  /** Execute with streaming */
  executeStream(
    message: string,
    context: FullContext,
    options?: ExecutorOptions
  ): AsyncGenerator<{ chunk?: string; result?: SkillResult }>;
}

// ============================================================================
// Registry Types
// ============================================================================

export interface SkillRegistry {
  /** Get a skill by ID */
  get(id: string): SkillDefinition | undefined;
  /** Get all registered skills */
  list(): SkillDefinition[];
  /** Register a skill */
  register(skill: SkillDefinition): void;
}
