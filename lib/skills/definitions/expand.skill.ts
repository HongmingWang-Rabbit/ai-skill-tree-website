/**
 * Expand Skill
 *
 * Adds new skills to the map based on user request.
 * Focuses on logical progression and prerequisites.
 */

import type { SkillDefinition, SkillContext } from '../types';
import { BaseModificationResponseSchema } from '../schemas';
import { LOCALE_INSTRUCTIONS } from '@/lib/ai-chat';
import { formatSkillsForPrompt } from '../context';
import { AI_CHAT_CONFIG } from '@/lib/constants';

export const expandSkill: SkillDefinition = {
  id: 'expand',
  name: 'Expand Skills',
  description: 'Add new skills to your map based on requirements or suggestions',
  aliases: ['add', 'grow', 'more', 'extend'],
  slashCommand: '/expand',

  intentPatterns: [
    /\b(expand|add more|grow|extend)\b.*\b(skill|map)\b/i,
    /\bcan you (expand|add)\b/i,
    /\bmore skills?\b/i,
    /\badd\s+\w+\s+(skill|to\s+(my|the)\s+map)/i,
  ],

  contextRequirements: {
    needsSkillList: true,
    needsCareerInfo: true,
    needsChatHistory: false,
    needsUserMaps: false,
    maxSkillsInContext: AI_CHAT_CONFIG.skillContext.medium,
  },

  tools: ['graph-ops'],

  systemPrompt: (ctx: SkillContext) => `You are a skill expansion specialist for Personal Skill Map.

${LOCALE_INSTRUCTIONS[ctx.locale]}

Career: "${ctx.careerTitle}"
${ctx.careerDescription ? `Description: ${ctx.careerDescription}` : ''}

Current skills (${ctx.skills?.length || 0}):
${formatSkillsForPrompt(ctx.skills)}

Your task: Add 3-5 relevant skills that complement the existing ones.

Rules:
1. Generate unique IDs (lowercase-hyphenated, e.g., "react-testing-library")
2. Set appropriate levels (1-3: beginner, 4-6: intermediate, 7-10: advanced)
3. Define prerequisites based on logical learning order
4. Use relevant emoji icons
5. Create edges for all prerequisite relationships
6. Ensure new skills integrate well with existing ones
7. Don't duplicate existing skills

Return JSON:
{
  "message": "Brief explanation of what you added and why",
  "modifications": {
    "addNodes": [{ "id": "...", "name": "...", "description": "...", "icon": "...", "level": 5, "category": "...", "prerequisites": [...] }],
    "updateNodes": [],
    "removeNodes": [],
    "addEdges": [{ "id": "source-to-target", "source": "...", "target": "..." }],
    "removeEdges": []
  },
  "isOffTopic": false
}`,

  responseSchema: BaseModificationResponseSchema,

  maxTokens: AI_CHAT_CONFIG.skillMaxTokens.expand,
};
