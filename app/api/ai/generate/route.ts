import { NextRequest, NextResponse } from 'next/server';
import { generateCareerSkillTree } from '@/lib/ai';
import { GenerateCareerSchema } from '@/lib/schemas';
import { normalizeCareerKey } from '@/lib/normalize-career';
import { setCachedCareer, getCachedCareer } from '@/lib/cache';
import { db, careers, skillGraphs } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { career } = GenerateCareerSchema.parse(body);

    const canonicalKey = normalizeCareerKey(career);

    // Check cache first
    const cached = await getCachedCareer<{
      career: typeof careers.$inferSelect;
      skillGraph: typeof skillGraphs.$inferSelect;
    }>(canonicalKey);

    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        source: 'cache',
      });
    }

    // Check database
    const existingCareer = await db.query.careers.findFirst({
      where: eq(careers.canonicalKey, canonicalKey),
    });

    if (existingCareer) {
      const existingGraph = await db.query.skillGraphs.findFirst({
        where: eq(skillGraphs.careerId, existingCareer.id),
      });

      if (existingGraph) {
        const result = { career: existingCareer, skillGraph: existingGraph };
        await setCachedCareer(canonicalKey, result);
        return NextResponse.json({
          success: true,
          data: result,
          source: 'database',
        });
      }
    }

    // Generate new skill tree with AI
    const generated = await generateCareerSkillTree(career);

    // Save to database
    const [newCareer] = await db
      .insert(careers)
      .values({
        canonicalKey: generated.canonicalKey,
        title: generated.title,
        description: generated.description,
      })
      .returning();

    const [newSkillGraph] = await db
      .insert(skillGraphs)
      .values({
        careerId: newCareer.id,
        nodes: generated.skills,
        edges: generated.edges,
      })
      .returning();

    // Update career with skill graph ID
    await db
      .update(careers)
      .set({ skillGraphId: newSkillGraph.id })
      .where(eq(careers.id, newCareer.id));

    const result = { career: newCareer, skillGraph: newSkillGraph };

    // Cache the result
    await setCachedCareer(canonicalKey, result);

    return NextResponse.json({
      success: true,
      data: result,
      source: 'generated',
    });
  } catch (error) {
    console.error('Generate career error:', error);

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
