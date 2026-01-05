import { NextRequest, NextResponse } from 'next/server';
import { CareerSearchSchema } from '@/lib/schemas';
import { suggestCareerSearches } from '@/lib/ai';
import { db, careers } from '@/lib/db';
import { ilike, or } from 'drizzle-orm';
import { applyRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting (20 requests per minute per IP)
    const rateLimitResult = await applyRateLimit('careerSearch');
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    const { query: validatedQuery } = CareerSearchSchema.parse({ query });

    // Search existing careers in database
    const existingCareers = await db
      .select()
      .from(careers)
      .where(
        or(
          ilike(careers.title, `%${validatedQuery}%`),
          ilike(careers.canonicalKey, `%${validatedQuery}%`)
        )
      )
      .limit(5);

    // Get AI suggestions for additional careers
    const suggestions = await suggestCareerSearches(validatedQuery);

    return NextResponse.json({
      success: true,
      data: {
        existing: existingCareers,
        suggestions: suggestions.filter(
          (s) => !existingCareers.some((c) => c.title.toLowerCase() === s.toLowerCase())
        ),
      },
    });
  } catch (error) {
    console.error('Search error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
