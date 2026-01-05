import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './cache';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { RATE_LIMIT_CONFIG } from './constants';

const { limits, windowSeconds, prefixes, errorMessage, errorCode } = RATE_LIMIT_CONFIG;
const windowDuration = `${windowSeconds} s` as const;

// Rate limit configurations for different endpoints
// Stricter limits for anonymous users, more generous for authenticated
export const rateLimiters = {
  // Public AI endpoints - strict limits
  publicAI: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limits.publicAI, windowDuration),
    prefix: prefixes.publicAI,
    analytics: true,
  }),

  // Career search - moderate limits
  careerSearch: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limits.careerSearch, windowDuration),
    prefix: prefixes.careerSearch,
    analytics: true,
  }),

  // Authenticated AI endpoints - more generous
  authenticatedAI: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limits.authenticatedAI, windowDuration),
    prefix: prefixes.authenticatedAI,
    analytics: true,
  }),

  // Heavy AI operations (resume generation, etc.) - strict
  heavyAI: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limits.heavyAI, windowDuration),
    prefix: prefixes.heavyAI,
    analytics: true,
  }),
};

export type RateLimiterType = keyof typeof rateLimiters;

/**
 * Get the client IP address from request headers
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();

  // Try various headers in order of preference
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = headersList.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headersList.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback for development
  return '127.0.0.1';
}

/**
 * Check rate limit for a given identifier
 * @param limiterType - The type of rate limiter to use
 * @param identifier - The identifier to rate limit (IP or user ID)
 * @returns Result with success status and optional response if rate limited
 */
export async function checkRateLimit(
  limiterType: RateLimiterType,
  identifier: string
): Promise<{
  success: boolean;
  response?: NextResponse;
  remaining?: number;
  reset?: number;
}> {
  try {
    const limiter = rateLimiters[limiterType];
    const { success, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return {
        success: false,
        remaining: 0,
        reset,
        response: NextResponse.json(
          {
            success: false,
            error: errorMessage,
            code: errorCode,
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': reset.toString(),
              'Retry-After': retryAfter.toString(),
            },
          }
        ),
      };
    }

    return { success: true, remaining, reset };
  } catch (error) {
    // If rate limiting fails (e.g., Redis is down), allow the request but log the error
    console.error('Rate limit check failed:', error);
    return { success: true };
  }
}

/**
 * Helper to apply rate limiting to an API route
 * Use IP for anonymous users, user ID for authenticated users
 */
export async function applyRateLimit(
  limiterType: RateLimiterType,
  userId?: string | null
): Promise<{
  success: boolean;
  response?: NextResponse;
}> {
  const identifier = userId || (await getClientIP());
  return checkRateLimit(limiterType, identifier);
}
