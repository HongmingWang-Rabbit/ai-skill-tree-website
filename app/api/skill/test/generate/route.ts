import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateSkillTestQuestions } from '@/lib/ai';

export const runtime = 'edge';

const GenerateTestSchema = z.object({
  skillName: z.string().min(1),
  skillDescription: z.string().min(1),
  skillLevel: z.number().min(1).max(10),
  category: z.string().min(1),
  careerTitle: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skillName, skillDescription, skillLevel, category, careerTitle } =
      GenerateTestSchema.parse(body);

    const questions = await generateSkillTestQuestions(
      skillName,
      skillDescription,
      skillLevel,
      category,
      careerTitle
    );

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Generate test error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
