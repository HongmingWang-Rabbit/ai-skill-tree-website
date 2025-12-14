import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateCareerSkillTree, type SupportedLocale } from '@/lib/ai';
import { GenerateCareerSchema } from '@/lib/schemas';
import { normalizeCareerKey } from '@/lib/normalize-career';
import { setCachedCareer, getCachedCareer } from '@/lib/cache';
import { db, careers, skillGraphs } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { hasEnoughCredits, deductCredits } from '@/lib/credits';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { career, locale = 'en' } = GenerateCareerSchema.parse(body);

    const canonicalKey = normalizeCareerKey(career);
    // Include locale in cache key to store different language versions separately
    const cacheKey = `${canonicalKey}:${locale}`;

    // Check cache first
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

    // Check database for this locale version
    const existingCareer = await db.query.careers.findFirst({
      where: and(
        eq(careers.canonicalKey, canonicalKey),
        eq(careers.locale, locale)
      ),
    });

    if (existingCareer) {
      const existingGraph = await db.query.skillGraphs.findFirst({
        where: eq(skillGraphs.careerId, existingCareer.id),
      });

      if (existingGraph) {
        const result = { career: existingCareer, skillGraph: existingGraph };
        await setCachedCareer(cacheKey, result);
        return NextResponse.json({
          success: true,
          data: result,
          source: 'database',
        });
      }
    }

    // Check credits for logged-in users before generating
    if (session?.user?.id) {
      const creditCheck = await hasEnoughCredits(session.user.id, 'ai_generate');
      if (!creditCheck.sufficient) {
        return NextResponse.json(
          {
            success: false,
            error: 'Insufficient credits',
            code: 'INSUFFICIENT_CREDITS',
            creditsRequired: creditCheck.required,
            creditsBalance: creditCheck.balance,
          },
          { status: 402 }
        );
      }
    }

    // Generate new skill tree with AI in the specified locale
    const generated = await generateCareerSkillTree(career, locale as SupportedLocale);

    // Save to database with locale - use upsert to handle race conditions
    const [newCareer] = await db
      .insert(careers)
      .values({
        canonicalKey: generated.canonicalKey,
        locale: locale,
        title: generated.title,
        description: generated.description,
      })
      .onConflictDoUpdate({
        target: [careers.canonicalKey, careers.locale],
        set: {
          title: generated.title,
          description: generated.description,
        },
      })
      .returning();

    // Check if skill graph already exists for this career
    const existingGraph = await db.query.skillGraphs.findFirst({
      where: eq(skillGraphs.careerId, newCareer.id),
    });

    let newSkillGraph;
    if (existingGraph) {
      // Update existing skill graph
      [newSkillGraph] = await db
        .update(skillGraphs)
        .set({
          nodes: generated.skills,
          edges: generated.edges,
          updatedAt: new Date(),
        })
        .where(eq(skillGraphs.careerId, newCareer.id))
        .returning();
    } else {
      // Create new skill graph
      [newSkillGraph] = await db
        .insert(skillGraphs)
        .values({
          careerId: newCareer.id,
          locale: locale,
          nodes: generated.skills,
          edges: generated.edges,
        })
        .returning();
    }

    // Update career with skill graph ID
    await db
      .update(careers)
      .set({ skillGraphId: newSkillGraph.id })
      .where(eq(careers.id, newCareer.id));

    const result = { career: newCareer, skillGraph: newSkillGraph };

    // Cache the result
    await setCachedCareer(cacheKey, result);

    // Deduct credits after successful generation
    let newCreditsBalance: number | undefined;
    if (session?.user?.id) {
      const deductResult = await deductCredits(session.user.id, 'ai_generate', {
        career,
        locale,
        careerId: newCareer.id,
      });
      newCreditsBalance = deductResult.newBalance;
    }

    return NextResponse.json({
      success: true,
      data: result,
      source: 'generated',
      credits: newCreditsBalance !== undefined ? { balance: newCreditsBalance } : undefined,
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
