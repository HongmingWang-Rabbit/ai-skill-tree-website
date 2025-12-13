/**
 * Tavily API integration for web search
 * Used by the AI chat to search for trending technologies and skills
 */

import { TAVILY_CONFIG } from '@/lib/constants';

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
  answer?: string;
}

/**
 * Search for information using Tavily API
 * @param query - Search query
 * @param options - Search options
 */
export async function searchTavily(
  query: string,
  options?: {
    searchDepth?: 'basic' | 'advanced';
    maxResults?: number;
    includeDomains?: string[];
    excludeDomains?: string[];
  }
): Promise<TavilySearchResponse | null> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    console.warn('TAVILY_API_KEY not configured - web search disabled');
    return null;
  }

  try {
    const response = await fetch(TAVILY_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: options?.searchDepth || TAVILY_CONFIG.defaultSearchDepth,
        max_results: options?.maxResults || TAVILY_CONFIG.defaultMaxResults,
        include_domains: options?.includeDomains,
        exclude_domains: options?.excludeDomains,
        include_answer: true,
      }),
    });

    if (!response.ok) {
      console.error('Tavily search failed:', response.statusText);
      return null;
    }

    const data = await response.json();
    return {
      query,
      results: data.results || [],
      answer: data.answer,
    };
  } catch (error) {
    console.error('Tavily search error:', error);
    return null;
  }
}

/**
 * Search for trending technologies in a specific field
 */
export async function searchTrendingTech(
  field: string,
  year: number = new Date().getFullYear()
): Promise<TavilySearchResponse | null> {
  const { searchDepth, maxResults, includeDomains } = TAVILY_CONFIG.trendingTech;
  return searchTavily(
    `trending ${field} technologies skills ${year}`,
    { searchDepth, maxResults, includeDomains: [...includeDomains] }
  );
}

/**
 * Search for skills related to a career path
 */
export async function searchCareerSkills(
  careerTitle: string
): Promise<TavilySearchResponse | null> {
  const { searchDepth, maxResults, includeDomains } = TAVILY_CONFIG.careerSkills;
  return searchTavily(
    `${careerTitle} skills requirements roadmap ${new Date().getFullYear()}`,
    { searchDepth, maxResults, includeDomains: [...includeDomains] }
  );
}

/**
 * Format Tavily search results for AI context
 */
export function formatSearchResultsForAI(
  searchResponse: TavilySearchResponse | null
): string {
  if (!searchResponse) {
    return 'Web search is not available. Please respond based on your existing knowledge.';
  }

  const { query, results, answer } = searchResponse;

  let formatted = `Web Search Results for: "${query}"\n\n`;

  if (answer) {
    formatted += `Summary: ${answer}\n\n`;
  }

  if (results.length > 0) {
    formatted += 'Sources:\n';
    results.forEach((result, index) => {
      formatted += `${index + 1}. ${result.title}\n`;
      formatted += `   ${result.content.slice(0, TAVILY_CONFIG.contentPreviewLength)}...\n`;
      formatted += `   Source: ${result.url}\n\n`;
    });
  }

  return formatted;
}
