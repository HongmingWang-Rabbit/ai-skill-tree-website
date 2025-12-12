import { NextRequest, NextResponse } from 'next/server';
import { analyzeCareerQuery } from '@/lib/ai';
import { locales, defaultLocale, type Locale } from '@/i18n/routing';
import { z } from 'zod';

export const runtime = 'edge';

const AnalyzeSchema = z.object({
  query: z.string().min(1).max(500),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, locale: rawLocale } = AnalyzeSchema.parse(body);

    // Validate locale
    const locale = (locales.includes(rawLocale as Locale) ? rawLocale : defaultLocale) as Locale;

    const result = await analyzeCareerQuery(query, locale);

    return NextResponse.json({
      success: true,
      data: result,
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
