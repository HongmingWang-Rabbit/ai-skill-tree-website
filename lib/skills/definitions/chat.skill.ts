/**
 * Chat Skill (Fallback)
 *
 * General conversation about skills and career.
 * This is the fallback when no other skill matches.
 */

import type { SkillDefinition, SkillContext } from '../types';
import { OptionalModificationResponseSchema } from '../schemas';
import { LOCALE_INSTRUCTIONS, SCOPE_GUARD_PROMPT } from '@/lib/ai-chat';
import { formatSkillsForPrompt, formatUserMapsForPrompt } from '../context';
import { AI_CHAT_CONFIG } from '@/lib/constants';

export const chatSkill: SkillDefinition = {
  id: 'chat',
  name: 'General Chat',
  description: 'General conversation about skills and career',
  aliases: [],
  // No slash command - this is the fallback

  intentPatterns: [], // Matches nothing - only used as fallback

  contextRequirements: {
    needsSkillList: true,
    needsCareerInfo: true,
    needsChatHistory: true, // Chat needs history for context
    needsUserMaps: true,
    maxSkillsInContext: AI_CHAT_CONFIG.skillContext.large,
  },

  tools: ['graph-ops'],

  systemPrompt: (ctx: SkillContext) => `${SCOPE_GUARD_PROMPT}

${LOCALE_INSTRUCTIONS[ctx.locale]}

You are helping a user with their skill map for: "${ctx.careerTitle}"
${ctx.careerDescription ? `Career description: ${ctx.careerDescription}` : ''}

Current skills in the map (${ctx.skills?.length || 0} total):
${formatSkillsForPrompt(ctx.skills)}

${ctx.userMaps && ctx.userMaps.length > 0 ? formatUserMapsForPrompt(ctx.userMaps) : ''}

When modifying the skill map:
1. Generate unique IDs for new skills (lowercase-hyphenated, e.g., "react-testing-library")
2. Set appropriate levels (1-3: beginner, 4-6: intermediate, 7-10: advanced)
3. Define prerequisites based on logical learning order
4. Use relevant emoji icons
5. Create edges for all prerequisite relationships
6. Ensure new skills integrate well with existing ones

Return valid JSON:
{
  "message": "Your conversational response explaining what you did or why you can't help",
  "modifications": {
    "addNodes": [{ skill objects }],
    "updateNodes": [{ "id": "skill-id", "updates": { partial skill updates } }],
    "removeNodes": ["skill-id-to-remove"],
    "addEdges": [{ edge objects }],
    "removeEdges": ["edge-id-to-remove"]
  },
  "isOffTopic": false
}

If no modifications are needed (just answering a question), omit "modifications" or set all arrays to empty.
If the request is off-topic (unrelated to skills/career), set "isOffTopic": true and politely decline.`,

  responseSchema: OptionalModificationResponseSchema,

  maxTokens: AI_CHAT_CONFIG.skillMaxTokens.chat,
};
