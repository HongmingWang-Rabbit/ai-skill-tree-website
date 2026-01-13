/**
 * Resources Skill
 *
 * Find learning resources (tutorials, courses, docs) for skills.
 */

import type { SkillDefinition, SkillContext, LearningResourceResult } from '../types';
import { ResourcesResponseSchema, type ResourcesResponse } from '../schemas';
import { LOCALE_INSTRUCTIONS } from '@/lib/ai-chat';
import { searchLearning } from '../tools/web-search';
import { AI_CHAT_CONFIG } from '@/lib/constants';

export const resourcesSkill: SkillDefinition = {
  id: 'resources',
  name: 'Learning Resources',
  description: 'Find tutorials, courses, certifications, and docs for skills',
  aliases: ['learn', 'tutorial', 'course', 'how to', 'study', 'certificate', 'certification'],
  slashCommand: '/resources',

  intentPatterns: [
    /\b(learn|study|tutorial|course|resource|how to learn)\b/i,
    /\bwhere (can|do|should) I learn\b/i,
    /\b(find|get|show).*(tutorial|course|resource)/i,
    /\bteach me\b/i,
    /\b(certificate|certification|certified|credential)\b/i,
    /\b(get|earn|obtain).*(certificate|certified)\b/i,
  ],

  contextRequirements: {
    needsSkillList: true, // To know which skills to find resources for
    needsCareerInfo: true,
    needsChatHistory: false,
    needsUserMaps: false,
    maxSkillsInContext: AI_CHAT_CONFIG.skillContext.minimal,
  },

  tools: ['web-search', 'learning'],

  // Pre-execute: search for learning resources if skill specified
  async preExecute(ctx: SkillContext): Promise<SkillContext> {
    // Extract skill name from route params if available
    const skillName = (ctx.customData?.routeParams as { args?: string })?.args;

    if (skillName) {
      const searchResults = await searchLearning(skillName);

      return {
        ...ctx,
        customData: {
          ...ctx.customData,
          targetSkill: skillName,
          webSearchResults: searchResults,
        },
      };
    }

    return ctx;
  },

  systemPrompt: (ctx: SkillContext) => {
    const targetSkill = ctx.customData?.targetSkill as string | undefined;
    const webResults = ctx.customData?.webSearchResults as string | undefined;
    const skillNames = ctx.skills?.map(s => s.name).join(', ') || 'various skills';

    return `You are a learning resource curator for Personal Skill Map.

${LOCALE_INSTRUCTIONS[ctx.locale]}

Career: "${ctx.careerTitle}"
${targetSkill ? `Target skill: "${targetSkill}"` : `Available skills: ${skillNames}`}

${webResults ? `
WEB SEARCH RESULTS:
${webResults}
` : ''}

Your task: Recommend high-quality learning resources.

${targetSkill ? `
Find 3-5 resources for learning "${targetSkill}":
- Include a mix of: free tutorials, video courses, official docs, certifications
- Prioritize well-known platforms (Udemy, Coursera, YouTube, MDN, official docs)
- Include both beginner and intermediate options
- If relevant, include professional certifications (Google, AWS, HubSpot, etc.)
` : `
Suggest a learning path with resources for the user's career development.
Pick 2-3 key skills and recommend resources for each.
Include relevant certifications if available.
`}

Resource types: course, tutorial, docs, video, article, certificate

Return JSON:
{
  "message": "Your recommendations and learning advice",
  "resources": [
    {
      "skillName": "SEO",
      "items": [
        {
          "title": "Google SEO Certification",
          "url": "https://skillshop.google.com",
          "platform": "Google Skillshop",
          "type": "certificate",
          "description": "Free official Google certification for SEO fundamentals"
        },
        {
          "title": "SEO Tutorial",
          "url": "https://example.com",
          "platform": "Platform",
          "type": "tutorial",
          "description": "Description here"
        }
      ]
    }
  ],
  "suggestedOrder": ["SEO Basics", "Keyword Research", "Technical SEO"]
}`;
  },

  responseSchema: ResourcesResponseSchema,

  // Post-process to convert to standard SkillResult
  postProcess(rawResponse, _ctx): LearningResourceResult {
    const response = rawResponse as ResourcesResponse;
    return {
      message: response.message,
      data: {
        resources: response.resources,
      },
      suggestFollowUp: response.suggestedOrder
        ? [`Learn ${response.suggestedOrder[0]} first`, 'Add these skills to my map']
        : undefined,
    };
  },

  maxTokens: AI_CHAT_CONFIG.skillMaxTokens.resources,
};
