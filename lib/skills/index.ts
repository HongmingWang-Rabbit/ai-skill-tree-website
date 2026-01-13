/**
 * Internal Skill System
 *
 * MCP-like system for Personal Skill Map platform.
 *
 * Features:
 * - On-demand skill loading (reduced context)
 * - Slash commands (/expand, /trending, /resources)
 * - Intent-based routing
 * - Tool composition (web search, graph ops)
 *
 * Usage:
 * ```ts
 * import { skillSystem } from '@/lib/skills';
 *
 * // Execute a skill
 * const result = await skillSystem.execute(message, context);
 *
 * // Get available slash commands
 * const commands = skillSystem.getSlashCommands();
 * ```
 */

import { SkillRouter } from './router';
import { SkillExecutor } from './executor';
import { skills } from './definitions';
import { getToolRegistry } from './tools';
import type { FullContext, SkillResult, ExecutorOptions } from './types';

// ============================================================================
// Exports
// ============================================================================

// Types
export type {
  SkillDefinition,
  SkillContext,
  SkillResult,
  FullContext,
  ChatMessage,
  SkillSummary,
  MapSummary,
  Tool,
  ToolId,
  RouteResult,
  ExecutorOptions,
  LearningResourceResult,
  SkillTestResult,
} from './types';

// Context utilities
export {
  buildSkillContext,
  summarizeSkills,
  estimateTokens,
  formatSkillsForPrompt,
  formatUserMapsForPrompt,
  DEFAULT_CONTEXT_REQUIREMENTS,
  MINIMAL_CONTEXT_REQUIREMENTS,
  FULL_CONTEXT_REQUIREMENTS,
} from './context';

// Router
export { SkillRouter, parseSlashCommand } from './router';

// Executor
export { SkillExecutor, createSkillExecutor } from './executor';

// Skills
export {
  skills,
  getSkillById,
  getSlashCommands,
  expandSkill,
  trendingSkill,
  resourcesSkill,
  chatSkill,
} from './definitions';

// Tools
export {
  getToolRegistry,
  webSearchTool,
  graphOpsTool,
  applyModifications,
  GraphModificationSchema,
  type GraphModification,
} from './tools';

// ============================================================================
// Skill System Singleton
// ============================================================================

class SkillSystem {
  private router: SkillRouter;
  private executor: SkillExecutor;
  private initialized = false;

  constructor() {
    this.router = new SkillRouter();
    this.executor = new SkillExecutor(this.router);
  }

  /**
   * Initialize the skill system
   */
  private initialize(): void {
    if (this.initialized) return;

    // Register all skills
    for (const skill of skills) {
      this.router.register(skill);
    }

    // Register all tools
    const toolRegistry = getToolRegistry();
    for (const tool of toolRegistry.list()) {
      this.executor.registerTool(tool);
    }

    this.initialized = true;
  }

  /**
   * Execute a skill based on user message
   */
  async execute(
    message: string,
    context: FullContext,
    options?: ExecutorOptions
  ): Promise<SkillResult> {
    this.initialize();
    return this.executor.execute(message, context, options);
  }

  /**
   * Execute with streaming
   */
  async *executeStream(
    message: string,
    context: FullContext,
    options?: ExecutorOptions
  ): AsyncGenerator<{ chunk?: string; result?: SkillResult }> {
    this.initialize();
    yield* this.executor.executeStream(message, context, options);
  }

  /**
   * Route a message to a skill (without executing)
   */
  route(message: string) {
    this.initialize();
    return this.router.route(message);
  }

  /**
   * Get available slash commands for UI
   */
  getSlashCommands() {
    this.initialize();
    return this.router.getSlashCommands();
  }

  /**
   * Check if message is a slash command
   */
  isSlashCommand(message: string): boolean {
    this.initialize();
    return this.router.isSlashCommand(message);
  }

  /**
   * Get help for a command
   */
  getCommandHelp(command: string): string | undefined {
    this.initialize();
    return this.router.getCommandHelp(command);
  }

  /**
   * Get the router instance
   */
  getRouter(): SkillRouter {
    this.initialize();
    return this.router;
  }

  /**
   * Get the executor instance
   */
  getExecutor(): SkillExecutor {
    this.initialize();
    return this.executor;
  }
}

// Singleton instance
let skillSystemInstance: SkillSystem | null = null;

/**
 * Get the skill system singleton
 */
export function getSkillSystem(): SkillSystem {
  if (!skillSystemInstance) {
    skillSystemInstance = new SkillSystem();
  }
  return skillSystemInstance;
}

/**
 * Convenience export for direct use
 */
export const skillSystem = {
  execute: (message: string, context: FullContext, options?: ExecutorOptions) =>
    getSkillSystem().execute(message, context, options),

  executeStream: (message: string, context: FullContext, options?: ExecutorOptions) =>
    getSkillSystem().executeStream(message, context, options),

  route: (message: string) => getSkillSystem().route(message),

  getSlashCommands: () => getSkillSystem().getSlashCommands(),

  isSlashCommand: (message: string) => getSkillSystem().isSlashCommand(message),

  getCommandHelp: (command: string) => getSkillSystem().getCommandHelp(command),
};
