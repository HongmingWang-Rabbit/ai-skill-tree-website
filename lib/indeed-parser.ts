/**
 * Indeed job posting parser
 * Handles Indeed's JSON API responses
 */

import { DOCUMENT_IMPORT_CONFIG, JOB_BOARD_CONFIG } from './constants';

const { indeed, acceptHeader } = JOB_BOARD_CONFIG;

/**
 * Check if URL is an Indeed JSON API URL
 */
export function isIndeedJsonUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('indeed.com') && lowerUrl.includes(indeed.jsonIndicator);
}

/**
 * Parse Indeed job posting from JSON API URL
 * @param url - Indeed job URL with json=1 parameter
 * @returns Formatted job posting content for AI analysis
 */
export async function parseIndeedJob(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DOCUMENT_IMPORT_CONFIG.urlTimeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': DOCUMENT_IMPORT_CONFIG.userAgent,
        'Accept': acceptHeader,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    // Try to parse as JSON
    if (contentType.includes('application/json') || text.trim().startsWith('{')) {
      try {
        const data = JSON.parse(text);
        return formatIndeedJobData(data);
      } catch {
        return null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Format Indeed job JSON data into readable content for AI
 */
function formatIndeedJobData(data: Record<string, unknown>): string | null {
  const { fieldMappings } = indeed;
  const parts: string[] = [];

  // Job title
  const title = extractField(data, fieldMappings.title);
  if (title) {
    parts.push(`Job Title: ${title}`);
  }

  // Company name - critical for cover letter
  const company = extractField(data, fieldMappings.company);
  if (company) {
    parts.push(`Company: ${company}`);
  }

  // Location
  const location = extractField(data, fieldMappings.location);
  if (location) {
    parts.push(`Location: ${location}`);
  }

  // Salary
  const salary = extractField(data, fieldMappings.salary);
  if (salary) {
    parts.push(`Salary: ${typeof salary === 'object' ? JSON.stringify(salary) : salary}`);
  }

  // Job description
  const description = extractField(data, fieldMappings.description);
  if (description) {
    const cleanDesc = typeof description === 'string'
      ? description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      : String(description);
    parts.push(`\nJob Description:\n${cleanDesc}`);
  }

  // Requirements/qualifications
  const requirements = extractField(data, fieldMappings.requirements);
  if (requirements) {
    const reqText = Array.isArray(requirements) ? requirements.join('\n- ') : String(requirements);
    parts.push(`\nRequirements:\n- ${reqText}`);
  }

  // Benefits
  const benefits = extractField(data, fieldMappings.benefits);
  if (benefits) {
    const benefitText = Array.isArray(benefits) ? benefits.join('\n- ') : String(benefits);
    parts.push(`\nBenefits:\n- ${benefitText}`);
  }

  // Job type
  const jobType = extractField(data, fieldMappings.jobType);
  if (jobType) {
    parts.push(`Job Type: ${jobType}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join('\n');
}

/**
 * Extract a field from nested object by trying multiple possible keys
 */
function extractField(data: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    // Try direct access
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      return data[key];
    }

    // Try nested access (e.g., data.job.title)
    for (const topKey of Object.keys(data)) {
      const nested = data[topKey];
      if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        const nestedObj = nested as Record<string, unknown>;
        if (nestedObj[key] !== undefined && nestedObj[key] !== null && nestedObj[key] !== '') {
          return nestedObj[key];
        }
      }
    }
  }
  return null;
}
