import { NextRequest, NextResponse } from 'next/server';
import { db, careers, skillGraphs } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getCachedCareer, setCachedCareer } from '@/lib/cache';
import { locales, type Locale } from '@/i18n/routing';

export const runtime = 'edge';

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ careerId: string }> }
) {
  try {
    const { careerId } = await params;
    const { searchParams } = new URL(request.url);
    const locale = (searchParams.get('locale') || 'en') as Locale;

    // Validate locale using centralized config
    const validLocale = locales.includes(locale) ? locale : 'en';

    // Generate cache key with locale
    const cacheKey = `${careerId}:${validLocale}`;

    // Check cache first (with locale)
    const cached = await getCachedCareer<{
      career: typeof careers.$inferSelect;
      skillGraph: typeof skillGraphs.$inferSelect;
    }>(cacheKey);

    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        source: 'cache',
      });
    }

    // Try to find by ID (if UUID) or canonical key with locale
    const isUuid = UUID_REGEX.test(careerId);

    let career;
    if (isUuid) {
      // First try exact UUID match (no locale filter - UUID is unique)
      career = await db.query.careers.findFirst({
        where: eq(careers.id, careerId),
      });

      // If not found by UUID, try as canonicalKey with locale
      if (!career) {
        career = await db.query.careers.findFirst({
          where: and(
            eq(careers.canonicalKey, careerId),
            eq(careers.locale, validLocale)
          ),
        });
      }
    } else {
      // For non-UUID (canonicalKey), always filter by locale
      career = await db.query.careers.findFirst({
        where: and(
          eq(careers.canonicalKey, careerId),
          eq(careers.locale, validLocale)
        ),
      });
    }

    if (!career) {
      return NextResponse.json(
        { success: false, error: 'Career not found' },
        { status: 404 }
      );
    }

    // Get the skill graph
    const skillGraph = await db.query.skillGraphs.findFirst({
      where: eq(skillGraphs.careerId, career.id),
    });

    if (!skillGraph) {
      return NextResponse.json(
        { success: false, error: 'Skill graph not found' },
        { status: 404 }
      );
    }

    const result = { career, skillGraph };

    // Cache the result
    await setCachedCareer(cacheKey, result);

    return NextResponse.json({
      success: true,
      data: result,
      source: 'database',
    });
  } catch (error) {
    console.error('Get career error:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
