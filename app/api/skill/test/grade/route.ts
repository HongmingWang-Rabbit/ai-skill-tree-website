import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { gradeSkillTestAnswers } from '@/lib/ai';

export const runtime = 'edge';

const GradeTestSchema = z.object({
  skillName: z.string().min(1),
  skillDescription: z.string().min(1),
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      expectedConcepts: z.array(z.string()),
      answer: z.string(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skillName, skillDescription, questions } = GradeTestSchema.parse(body);

    const gradingResult = await gradeSkillTestAnswers(
      skillName,
      skillDescription,
      questions
    );

    return NextResponse.json(gradingResult);
  } catch (error) {
    console.error('Grade test error:', error);

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
