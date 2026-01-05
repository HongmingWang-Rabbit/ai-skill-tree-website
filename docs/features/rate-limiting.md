# Rate Limiting

API rate limiting to protect against abuse and ensure fair usage.

## Overview

Rate limiting is implemented using [Upstash Ratelimit](https://github.com/upstash/ratelimit) with Redis for distributed rate limiting across serverless functions.

## Configuration

All rate limit settings are in `lib/constants.ts` under `RATE_LIMIT_CONFIG`:

```ts
export const RATE_LIMIT_CONFIG = {
  limits: {
    publicAI: 10,        // Anonymous AI requests per window
    careerSearch: 20,    // Career search requests per window
    authenticatedAI: 30, // Authenticated AI requests per window
    heavyAI: 5,          // Heavy AI operations per window
  },
  windowSeconds: 60,     // Time window (1 minute)
  // ...
} as const;
```

## Rate Limiter Types

| Type | Requests/min | Use Case |
|------|--------------|----------|
| `publicAI` | 10 | Anonymous AI requests (generate, analyze, chat) |
| `careerSearch` | 20 | Career search suggestions |
| `authenticatedAI` | 30 | Authenticated user AI requests |
| `heavyAI` | 5 | Resource-intensive operations (resume generation) |

## Usage

### Basic Usage

```ts
import { applyRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Apply rate limiting - uses IP for anonymous, user ID for authenticated
  const rateLimitResult = await applyRateLimit('publicAI');
  if (!rateLimitResult.success) {
    return rateLimitResult.response; // Returns 429 with Retry-After header
  }

  // Continue with request...
}
```

### With Authentication

```ts
import { applyRateLimit } from '@/lib/rate-limit';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Use stricter limits for anonymous, generous for authenticated
  const rateLimitResult = await applyRateLimit(
    session?.user?.id ? 'authenticatedAI' : 'publicAI',
    session?.user?.id
  );
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }

  // Continue...
}
```

## Protected Endpoints

| Endpoint | Rate Limiter | Notes |
|----------|--------------|-------|
| `/api/career/search` | `careerSearch` | Public search suggestions |
| `/api/ai/generate` | `publicAI` / `authenticatedAI` | Career skill tree generation |
| `/api/ai/analyze` | `publicAI` / `authenticatedAI` | Career query analysis |
| `/api/ai/chat` | `publicAI` / `authenticatedAI` | AI chat for skill map editing |

## Response When Rate Limited

```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "code": "RATE_LIMITED",
  "retryAfter": 45
}
```

HTTP Status: `429 Too Many Requests`

Headers:
- `X-RateLimit-Remaining: 0`
- `X-RateLimit-Reset: <timestamp>`
- `Retry-After: <seconds>`

## Implementation Details

### IP Detection

The rate limiter detects client IP using these headers (in order):
1. `x-forwarded-for` (first IP in chain)
2. `x-real-ip`
3. `cf-connecting-ip` (Cloudflare)
4. Fallback: `127.0.0.1` (development)

### Graceful Degradation

If Redis is unavailable, rate limiting fails open (allows requests) to prevent service disruption. Errors are logged for monitoring.

### Sliding Window Algorithm

Uses Upstash's sliding window algorithm for smooth rate limiting without burst issues at window boundaries.

## Key Files

- `lib/rate-limit.ts` - Rate limiting utilities
- `lib/constants.ts` - `RATE_LIMIT_CONFIG` configuration
- `lib/cache.ts` - Redis connection (shared with caching)
