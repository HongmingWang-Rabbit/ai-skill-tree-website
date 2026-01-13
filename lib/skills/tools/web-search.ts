/**
 * Web Search Tool
 *
 * Wraps Tavily API for skill web searches.
 * Used by trending, resources, and analyze skills.
 */

import { z } from 'zod';
import type { Tool } from '../types';
import {
  searchTavily,
  searchTrendingTech,
  searchCareerSkills,
  searchLearningResources,
  formatSearchResultsForAI,
  type TavilySearchResponse,
} from '@/lib/mcp/tavily';

// ============================================================================
// Schemas
// ============================================================================

export const WebSearchParamsSchema = z.object({
  query: z.string(),
  type: z.enum(['trending', 'career', 'learning', 'general']).default('general'),
  /** For career/trending searches */
  field: z.string().optional(),
  /** For learning searches */
  skillName: z.string().optional(),
  skillLevel: z.number().optional(),
});

export type WebSearchParams = z.infer<typeof WebSearchParamsSchema>;

export interface WebSearchResult {
  success: boolean;
  results: TavilySearchResponse | null;
  formatted: string;
  error?: string;
}

// ============================================================================
// Tool Implementation
// ============================================================================

export const webSearchTool: Tool<WebSearchParams, WebSearchResult> = {
  id: 'web-search',
  name: 'Web Search',
  description: 'Search the web for trending tech, learning resources, or career skills',
  paramsSchema: WebSearchParamsSchema,

  async execute(params: WebSearchParams): Promise<WebSearchResult> {
    try {
      let results: TavilySearchResponse | null = null;

      switch (params.type) {
        case 'trending':
          results = await searchTrendingTech(
            params.field || params.query,
            new Date().getFullYear()
          );
          break;

        case 'career':
          results = await searchCareerSkills(params.field || params.query);
          break;

        case 'learning':
          results = await searchLearningResources(
            params.skillName || params.query,
            { level: params.skillLevel }
          );
          break;

        case 'general':
        default:
          results = await searchTavily(params.query);
          break;
      }

      return {
        success: true,
        results,
        formatted: formatSearchResultsForAI(results),
      };
    } catch (error) {
      return {
        success: false,
        results: null,
        formatted: 'Web search is unavailable. Please respond based on your existing knowledge.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Quick search for trending tech in a field
 */
export async function searchTrending(field: string): Promise<string> {
  const result = await webSearchTool.execute({
    query: field,
    type: 'trending',
    field,
  });
  return result.formatted;
}

/**
 * Quick search for learning resources
 */
export async function searchLearning(
  skillName: string,
  level?: number
): Promise<string> {
  const result = await webSearchTool.execute({
    query: skillName,
    type: 'learning',
    skillName,
    skillLevel: level,
  });
  return result.formatted;
}
