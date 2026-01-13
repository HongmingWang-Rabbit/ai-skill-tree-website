/**
 * Context Management for Skills
 *
 * Builds minimal context for each skill to reduce token usage.
 */

import type {
  FullContext,
  SkillContext,
  SkillSummary,
  SkillDefinition,
  ContextRequirements,
} from './types';
import type { SkillNode } from '@/lib/schemas';
import { AI_CHAT_CONFIG } from '@/lib/constants';

/**
 * Build minimal context for a skill based on its requirements
 */
export function buildSkillContext(
  skill: SkillDefinition,
  full: FullContext
): SkillContext {
  const req = skill.contextRequirements;

  // Use custom builder if provided
  if (req.customContextBuilder) {
    return req.customContextBuilder(full);
  }

  // Build minimal context based on requirements
  return {
    locale: full.locale,
    careerTitle: req.needsCareerInfo ? full.careerTitle : undefined,
    careerDescription: req.needsCareerInfo ? full.careerDescription : undefined,
    skills: req.needsSkillList
      ? summarizeSkills(full.nodes, req.maxSkillsInContext)
      : undefined,
    chatHistory: req.needsChatHistory
      ? full.chatHistory?.slice(-AI_CHAT_CONFIG.skillContext.historyLimit)
      : undefined,
    userMaps: req.needsUserMaps ? full.userMaps : undefined,
  };
}

/**
 * Summarize skills to reduce token usage
 * Only includes essential fields: id, name, level, category
 */
export function summarizeSkills(
  nodes: SkillNode[],
  maxCount: number
): SkillSummary[] {
  const toSummarize = maxCount > 0 ? nodes.slice(0, maxCount) : nodes;
  return toSummarize.map((n) => ({
    id: n.id,
    name: n.name,
    level: n.level,
    category: n.category,
  }));
}

/**
 * Estimate token count for a context object
 * Rough estimate: ~4 chars per token for English
 */
export function estimateTokens(ctx: SkillContext): number {
  const json = JSON.stringify(ctx);
  return Math.ceil(json.length / 4);
}

/**
 * Format skills for system prompt
 */
export function formatSkillsForPrompt(skills?: SkillSummary[]): string {
  if (!skills || skills.length === 0) {
    return 'No skills in map yet.';
  }

  return skills
    .map((s) => `- ${s.name} (${s.category}, L${s.level})`)
    .join('\n');
}

/**
 * Format user maps for system prompt
 */
export function formatUserMapsForPrompt(
  maps?: Array<{ id: string; title: string; careerTitle: string }>
): string {
  if (!maps || maps.length === 0) {
    return '';
  }

  return (
    'Available maps for merging:\n' +
    maps.map((m) => `- "${m.title}" (${m.careerTitle})`).join('\n')
  );
}

/**
 * Default context requirements for skills that don't specify
 */
export const DEFAULT_CONTEXT_REQUIREMENTS: ContextRequirements = {
  needsSkillList: true,
  needsCareerInfo: true,
  needsChatHistory: false,
  needsUserMaps: false,
  maxSkillsInContext: AI_CHAT_CONFIG.skillContext.default,
};

/**
 * Minimal context requirements (for simple skills)
 */
export const MINIMAL_CONTEXT_REQUIREMENTS: ContextRequirements = {
  needsSkillList: false,
  needsCareerInfo: false,
  needsChatHistory: false,
  needsUserMaps: false,
  maxSkillsInContext: AI_CHAT_CONFIG.skillContext.minimal,
};

/**
 * Full context requirements (for complex chat)
 */
export const FULL_CONTEXT_REQUIREMENTS: ContextRequirements = {
  needsSkillList: true,
  needsCareerInfo: true,
  needsChatHistory: true,
  needsUserMaps: true,
  maxSkillsInContext: AI_CHAT_CONFIG.skillContext.large,
};
