/**
 * Indeed job posting detection
 * Indeed job pages are JS-rendered and require Tavily search (like LinkedIn)
 */

/**
 * Check if URL is an Indeed job URL
 * Indeed job pages are JS-rendered and can't be scraped directly
 */
export function isIndeedJobUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('indeed.com') && (
    lowerUrl.includes('vjk=') ||      // Job view key in URL params
    lowerUrl.includes('/viewjob') ||   // Direct job view URL
    lowerUrl.includes('jk=') ||        // Job key parameter
    lowerUrl.includes('/job/')         // Job path
  );
}

/**
 * Extract job key from Indeed URL for search
 */
export function extractIndeedJobKey(url: string): string | null {
  // Try to extract vjk (view job key) or jk (job key)
  const vjkMatch = url.match(/vjk=([a-f0-9]+)/i);
  if (vjkMatch) return vjkMatch[1];

  const jkMatch = url.match(/jk=([a-f0-9]+)/i);
  if (jkMatch) return jkMatch[1];

  // Try to extract from /viewjob?jk= pattern
  const viewJobMatch = url.match(/viewjob\?.*jk=([a-f0-9]+)/i);
  if (viewJobMatch) return viewJobMatch[1];

  return null;
}
