import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeCareerQuery } from '@/lib/ai';
import { locales, defaultLocale, type Locale } from '@/i18n/routing';
import { z } from 'zod';
import { hasEnoughCredits, deductCredits } from '@/lib/credits';
import { applyRateLimit } from '@/lib/rate-limit';

const AnalyzeSchema = z.object({
  query: z.string().min(1).max(500),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Apply rate limiting - stricter for anonymous, more generous for authenticated
    const rateLimitResult = await applyRateLimit(
      session?.user?.id ? 'authenticatedAI' : 'publicAI',
      session?.user?.id
    );
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const body = await request.json();
    const { query, locale: rawLocale } = AnalyzeSchema.parse(body);

    // Validate locale
    const locale = (locales.includes(rawLocale as Locale) ? rawLocale : defaultLocale) as Locale;

    // Check credits for logged-in users before AI call
    if (session?.user?.id) {
      const creditCheck = await hasEnoughCredits(session.user.id, 'ai_analyze');
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

    const result = await analyzeCareerQuery(query, locale);

    // Deduct credits after successful analysis
    let newCreditsBalance: number | undefined;
    if (session?.user?.id) {
      const deductResult = await deductCredits(session.user.id, 'ai_analyze', {
        query,
        locale,
      });
      newCreditsBalance = deductResult.newBalance;
    }

    return NextResponse.json({
      success: true,
      data: result,
      credits: newCreditsBalance !== undefined ? { balance: newCreditsBalance } : undefined,
    });
  } catch (error) {
    console.error('Analyze query error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to analyze query' },
      { status: 500 }
    );
  }
}
