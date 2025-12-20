/**
 * Tavily API integration for web search
 * Used by the AI chat to search for trending technologies and skills
 */

import { TAVILY_CONFIG, LEARNING_CONFIG, LEARNING_PLATFORM_DOMAINS } from '@/lib/constants';

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

/**
 * Search for learning resources for a specific skill
 */
export async function searchLearningResources(
  skillName: string,
  options?: {
    category?: string;
    level?: number;
  }
): Promise<TavilySearchResponse | null> {
  const year = new Date().getFullYear();
  // Convert numeric level to difficulty text using configured thresholds
  const { beginner, intermediate } = LEARNING_CONFIG.levelThresholds;
  const levelText = options?.level
    ? options.level <= beginner ? 'beginner' : options.level <= intermediate ? 'intermediate' : 'advanced'
    : '';

  const query = `learn ${skillName} ${levelText} tutorial course ${year}`.trim();

  return searchTavily(query, {
    searchDepth: LEARNING_CONFIG.searchDepth,
    maxResults: LEARNING_CONFIG.maxResults,
    includeDomains: [...LEARNING_PLATFORM_DOMAINS],
  });
}

/**
 * Search for company information for cover letter personalization
 * @param companyName - Name of the company to research
 */
export async function searchCompanyInfo(
  companyName: string
): Promise<TavilySearchResponse | null> {
  const { searchDepth, maxResults } = TAVILY_CONFIG.companyResearch;
  const year = new Date().getFullYear();
  const query = `${companyName} company about mission products services ${year}`;

  return searchTavily(query, {
    searchDepth,
    maxResults,
  });
}

/**
 * Search for LinkedIn job posting details
 * LinkedIn job pages are JS-rendered and can't be scraped directly
 * @param jobUrl - LinkedIn job URL
 * @param jobTitle - Optional job title to improve search
 */
export async function searchLinkedInJob(
  jobUrl: string,
  jobTitle?: string
): Promise<TavilySearchResponse | null> {
  // Extract job ID from URL for more targeted search
  const jobIdMatch = jobUrl.match(/currentJobId=(\d+)|jobs\/view\/(\d+)/);
  const jobId = jobIdMatch?.[1] || jobIdMatch?.[2];

  // Build search query
  let query = 'linkedin job posting';
  if (jobTitle) {
    query = `${jobTitle} job description requirements qualifications`;
  } else if (jobId) {
    query = `linkedin job ${jobId} description requirements`;
  }

  return searchTavily(query, {
    searchDepth: 'advanced',
    maxResults: 5,
    includeDomains: ['linkedin.com'],
  });
}

/**
 * Format LinkedIn job search results for AI context
 */
export function formatJobSearchResultsForAI(
  searchResponse: TavilySearchResponse | null
): string {
  if (!searchResponse || searchResponse.results.length === 0) {
    return '';
  }

  const { results, answer } = searchResponse;
  let formatted = '';

  if (answer) {
    formatted += `Job Overview: ${answer}\n\n`;
  }

  formatted += 'Job Details from Search:\n';
  results.forEach((result) => {
    formatted += `\n--- ${result.title} ---\n`;
    formatted += `${result.content}\n`;
  });

  return formatted;
}

/**
 * Format company search results for cover letter AI context
 */
export function formatCompanyResearchForAI(
  searchResponse: TavilySearchResponse | null,
  companyName: string
): string {
  if (!searchResponse || searchResponse.results.length === 0) {
    return '';
  }

  const { maxResultsToInclude, contentPreviewLength } = TAVILY_CONFIG.companyResearch;
  const { results, answer } = searchResponse;

  let formatted = `\nCOMPANY RESEARCH FOR ${companyName.toUpperCase()}:\n`;

  if (answer) {
    formatted += `Overview: ${answer}\n\n`;
  }

  formatted += 'Key Information:\n';
  results.slice(0, maxResultsToInclude).forEach((result) => {
    formatted += `- ${result.content.slice(0, contentPreviewLength)}...\n`;
  });

  return formatted;
}

/**
 * Detect platform from URL hostname
 */
export function detectPlatformFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('udemy')) return 'udemy';
    if (hostname.includes('coursera')) return 'coursera';
    if (hostname.includes('edx.org')) return 'edx';
    if (hostname.includes('youtube')) return 'youtube';
    if (hostname.includes('pluralsight')) return 'pluralsight';
    if (hostname.includes('skillshare')) return 'skillshare';
    if (hostname.includes('linkedin.com/learning')) return 'linkedin';
    if (hostname.includes('developer.mozilla')) return 'mdn';
    if (hostname.includes('docs.microsoft') || hostname.includes('learn.microsoft')) return 'microsoft';
    if (hostname.includes('stackoverflow')) return 'stackoverflow';
    if (hostname.includes('medium.com')) return 'medium';
    if (hostname.includes('dev.to')) return 'devto';
    if (hostname.includes('freecodecamp')) return 'freecodecamp';

    return 'other';
  } catch {
    return 'other';
  }
}
