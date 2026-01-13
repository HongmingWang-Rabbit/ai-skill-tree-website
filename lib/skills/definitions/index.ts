/**
 * Skill Definitions Index
 *
 * Exports all skill definitions and provides utilities
 * for skill registration.
 */

import type { SkillDefinition } from '../types';
import { expandSkill } from './expand.skill';
import { trendingSkill } from './trending.skill';
import { resourcesSkill } from './resources.skill';
import { chatSkill } from './chat.skill';

// Re-export individual skills
export { expandSkill } from './expand.skill';
export { trendingSkill } from './trending.skill';
export { resourcesSkill } from './resources.skill';
export { chatSkill } from './chat.skill';

/**
 * All registered skills
 * Order matters for intent matching - more specific skills first
 */
export const skills: SkillDefinition[] = [
  // Specific skills (checked first)
  expandSkill,
  trendingSkill,
  resourcesSkill,

  // Fallback (checked last)
  chatSkill,
];

/**
 * Get skill by ID
 */
export function getSkillById(id: string): SkillDefinition | undefined {
  return skills.find((s) => s.id === id);
}

/**
 * Get all slash commands
 */
export function getSlashCommands(): Array<{
  command: string;
  name: string;
  description: string;
}> {
  return skills
    .filter((s) => s.slashCommand)
    .map((s) => ({
      command: s.slashCommand!,
      name: s.name,
      description: s.description,
    }));
}

/**
 * Skill IDs for type safety
 */
export type SkillId = 'expand' | 'trending' | 'resources' | 'chat';
