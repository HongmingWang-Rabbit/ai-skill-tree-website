import { NextRequest, NextResponse } from 'next/server';
import { db, careers, skillGraphs } from '@/lib/db';
import { eq, or } from 'drizzle-orm';
import { getCachedCareer, setCachedCareer } from '@/lib/cache';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ careerId: string }> }
) {
  try {
    const { careerId } = await params;

    // Check cache first
    const cached = await getCachedCareer<{
      career: typeof careers.$inferSelect;
      skillGraph: typeof skillGraphs.$inferSelect;
    }>(careerId);

    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        source: 'cache',
      });
    }

    // Try to find by ID or canonical key
    const career = await db.query.careers.findFirst({
      where: or(
        eq(careers.id, careerId),
        eq(careers.canonicalKey, careerId)
      ),
    });

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
    await setCachedCareer(career.canonicalKey, result);

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
