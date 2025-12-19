import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SkillNodeSchema, SkillEdgeSchema } from '@/lib/schemas';
import { locales, type Locale } from '@/i18n/routing';
import { generateAdvancedSkills } from '@/lib/ai';
import { hasEnoughCredits, deductCredits } from '@/lib/credits';

// Request schema
const ExpandRequestSchema = z.object({
  careerTitle: z.string().min(1),
  nodes: z.array(SkillNodeSchema),
  edges: z.array(SkillEdgeSchema),
  locale: z.enum([...locales] as [string, ...string[]]).default('en'),
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication for expansion
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validatedInput = ExpandRequestSchema.parse(body);

    // Check credits before AI call
    const creditCheck = await hasEnoughCredits(session.user.id, 'ai_chat');
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

    // Generate advanced skills
    const result = await generateAdvancedSkills(
      validatedInput.nodes,
      validatedInput.edges,
      validatedInput.careerTitle,
      validatedInput.locale as Locale
    );

    // Check if we got any new skills
    if (result.nodes.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          nodes: [],
          edges: [],
          message: 'No new advanced skills could be generated for this skill tree.',
        },
      });
    }

    // Deduct credits after successful generation
    const deductResult = await deductCredits(session.user.id, 'ai_chat', {
      careerTitle: validatedInput.careerTitle,
      action: 'expand_advanced_skills',
      newSkillsCount: result.nodes.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        nodes: result.nodes,
        edges: result.edges,
      },
      credits: { balance: deductResult.newBalance },
    });
  } catch (error) {
    console.error('Expand API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate advanced skills' },
      { status: 500 }
    );
  }
}
