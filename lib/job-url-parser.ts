/**
 * Unified job URL parsing utility
 * Handles LinkedIn, Indeed, and generic job posting URLs
 */

import { parseURL } from './document-parser';
import { isLinkedInJobUrl, searchLinkedInJob, searchIndeedJob, formatJobSearchResultsForAI } from './mcp/tavily';
import { isIndeedJobUrl, extractIndeedJobKey } from './indeed-parser';
import { DOCUMENT_IMPORT_CONFIG } from './constants';

/**
 * Parse job posting content from various URL types
 * @param jobUrl - The job posting URL
 * @param jobTitle - Optional job title for better search results
 * @returns Parsed job posting content or null if parsing failed
 */
export async function parseJobUrl(
  jobUrl: string,
  jobTitle?: string
): Promise<string | null> {
  let content: string | null = null;

  // LinkedIn URLs need Tavily search (JS-rendered pages)
  if (isLinkedInJobUrl(jobUrl)) {
    try {
      const searchResults = await searchLinkedInJob(jobUrl, jobTitle);
      if (searchResults && searchResults.results.length > 0) {
        content = formatJobSearchResultsForAI(searchResults);
      }
    } catch {
      // Tavily search failed
    }
  }
  // Indeed URLs also need Tavily search (JS-rendered pages)
  else if (isIndeedJobUrl(jobUrl)) {
    try {
      const jobKey = extractIndeedJobKey(jobUrl);
      const searchResults = await searchIndeedJob(jobUrl, jobTitle, jobKey);
      if (searchResults && searchResults.results.length > 0) {
        content = formatJobSearchResultsForAI(searchResults);
      }
    } catch {
      // Tavily search failed
    }
  }

  // Fallback to direct URL parsing if no content yet
  if (!content) {
    try {
      const parsed = await parseURL(jobUrl);
      if (parsed.content && parsed.content.length > DOCUMENT_IMPORT_CONFIG.minContentLength) {
        content = parsed.content;
      }
    } catch {
      // Direct parsing failed
    }
  }

  return content;
}

/**
 * Check if parsed content is valid for analysis
 */
export function isValidJobContent(content: string | null): content is string {
  return content !== null && content.length > DOCUMENT_IMPORT_CONFIG.minContentLength;
}
