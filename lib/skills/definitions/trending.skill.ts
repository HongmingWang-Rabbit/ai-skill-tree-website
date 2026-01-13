/**
 * Trending Skill
 *
 * Searches for and adds trending technologies in the user's field.
 * Uses web search to get current information.
 */

import type { SkillDefinition, SkillContext } from '../types';
import { ModificationWithSourcesResponseSchema } from '../schemas';
import { LOCALE_INSTRUCTIONS } from '@/lib/ai-chat';
import { formatSkillsForPrompt } from '../context';
import { searchTrending } from '../tools/web-search';
import { AI_CHAT_CONFIG } from '@/lib/constants';

export const trendingSkill: SkillDefinition = {
  id: 'trending',
  name: 'Trending Tech',
  description: 'Find and add trending technologies in your field',
  aliases: ['latest', 'new', 'hot', 'popular', 'modern'],
  slashCommand: '/trending',

  intentPatterns: [
    /\b(trending|latest|new|hot|popular|modern)\b.*\b(tech|skill|tool|framework)/i,
    /\bwhat('s| is) (trending|new|hot)\b/i,
    /\b202[4-9]\b.*\b(skill|tech|tool)/i,
    /\btrend/i,
  ],

  contextRequirements: {
    needsSkillList: true,
    needsCareerInfo: true,
    needsChatHistory: false,
    needsUserMaps: false,
    maxSkillsInContext: AI_CHAT_CONFIG.skillContext.small,
  },

  tools: ['web-search', 'graph-ops'],

  // Pre-execute: fetch trending tech via web search
  async preExecute(ctx: SkillContext): Promise<SkillContext> {
    const field = ctx.careerTitle || AI_CHAT_CONFIG.defaultCareerFallback;
    const webSearchResults = await searchTrending(field);

    return {
      ...ctx,
      customData: {
        ...ctx.customData,
        webSearchResults,
      },
    };
  },

  systemPrompt: (ctx: SkillContext) => {
    const webResults = ctx.customData?.webSearchResults as string | undefined;

    return `You are a tech trends analyst for Personal Skill Map.

${LOCALE_INSTRUCTIONS[ctx.locale]}

Career: "${ctx.careerTitle}"

Current skills (${ctx.skills?.length || 0}):
${formatSkillsForPrompt(ctx.skills)}

${webResults ? `
WEB SEARCH RESULTS (use this for current trends):
${webResults}
` : 'Note: Web search unavailable. Use your knowledge of recent trends.'}

Your task: Add 3-5 trending skills for ${new Date().getFullYear()} that are relevant to this career.

Rules:
1. Only suggest genuinely trending technologies (from search results if available)
2. Generate unique IDs (lowercase-hyphenated)
3. Set levels based on typical learning curve
4. Create prerequisite edges to connect with existing skills
5. Use relevant emoji icons
6. Don't duplicate existing skills
7. Cite sources in your message when using web search results

Return JSON:
{
  "message": "Explanation of trending skills added, with sources cited",
  "modifications": {
    "addNodes": [{ "id": "...", "name": "...", "description": "...", "icon": "...", "level": 5, "category": "...", "prerequisites": [...] }],
    "updateNodes": [],
    "removeNodes": [],
    "addEdges": [{ "id": "source-to-target", "source": "...", "target": "..." }],
    "removeEdges": []
  },
  "sources": ["https://example.com/article"],
  "isOffTopic": false
}`;
  },

  responseSchema: ModificationWithSourcesResponseSchema,

  maxTokens: AI_CHAT_CONFIG.skillMaxTokens.trending,
};
