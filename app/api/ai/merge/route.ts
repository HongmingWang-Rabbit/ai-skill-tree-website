import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateSmartMerge } from '@/lib/ai-chat';
import { SkillNodeSchema, SkillEdgeSchema } from '@/lib/schemas';
import { locales, type Locale } from '@/i18n/routing';
import { hasEnoughCredits, deductCredits } from '@/lib/credits';

// Request schema for merge operation
const MergeRequestSchema = z.object({
  sourceNodes: z.array(SkillNodeSchema),
  sourceEdges: z.array(SkillEdgeSchema),
  sourceCareerTitle: z.string(),
  targetNodes: z.array(SkillNodeSchema),
  targetEdges: z.array(SkillEdgeSchema),
  targetCareerTitle: z.string(),
  locale: z.enum([...locales] as [string, ...string[]]).default('en'),
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication for merge operations
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validatedInput = MergeRequestSchema.parse(body);

    // Check credits before AI merge
    const creditCheck = await hasEnoughCredits(session.user.id, 'ai_merge');
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

    // Generate smart merge using AI
    const merged = await generateSmartMerge(
      validatedInput.sourceNodes,
      validatedInput.sourceEdges,
      validatedInput.sourceCareerTitle,
      validatedInput.targetNodes,
      validatedInput.targetEdges,
      validatedInput.targetCareerTitle,
      validatedInput.locale as Locale
    );

    // Deduct credits after successful merge
    const deductResult = await deductCredits(session.user.id, 'ai_merge', {
      sourceCareerTitle: validatedInput.sourceCareerTitle,
      targetCareerTitle: validatedInput.targetCareerTitle,
    });

    return NextResponse.json({
      success: true,
      data: {
        nodes: merged.nodes,
        edges: merged.edges,
        mergedTitle: merged.mergedTitle,
      },
      credits: { balance: deductResult.newBalance },
    });
  } catch (error) {
    console.error('Merge API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to merge skill maps' },
      { status: 500 }
    );
  }
}
