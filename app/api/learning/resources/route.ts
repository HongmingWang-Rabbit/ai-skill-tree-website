import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { affiliatedLinks } from '@/lib/db/schema';
import { LearningResourcesSchema, type LearningResource } from '@/lib/schemas';
import { searchLearningResources, detectPlatformFromUrl, type TavilySearchResult } from '@/lib/mcp/tavily';
import { LEARNING_CONFIG } from '@/lib/constants';
import { getCachedLearningResources, setCachedLearningResources } from '@/lib/cache';
import { eq, and, sql, desc } from 'drizzle-orm';

export const runtime = 'nodejs';

interface LearningResourcesResponse {
  affiliatedLinks: LearningResource[];
  webResults: LearningResource[];
  skillName: string;
  totalCount: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate query params
    const validated = LearningResourcesSchema.parse({
      skillName: searchParams.get('skillName'),
      category: searchParams.get('category') || undefined,
      level: searchParams.get('level') ? parseInt(searchParams.get('level')!) : undefined,
    });

    const { skillName, category, level } = validated;
    const skillNameLower = skillName.toLowerCase();

    // Check cache first - returns full response (affiliated links + web results)
    // Cache is invalidated when affiliated links are updated
    const cacheKey = `${skillNameLower}:${category || ''}:${level || ''}`;
    const cached = await getCachedLearningResources<LearningResourcesResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    // 1. Fetch matching affiliated links from database
    // Match skill name against patterns (case-insensitive partial match)
    const affiliatedResults = await db
      .select()
      .from(affiliatedLinks)
      .where(
        and(
          eq(affiliatedLinks.isActive, true),
          sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(${affiliatedLinks.skillPatterns}) AS pattern
            WHERE lower(${skillNameLower}) LIKE '%' || lower(pattern) || '%'
            OR lower(pattern) LIKE '%' || lower(${skillNameLower}) || '%'
          )`
        )
      )
      .orderBy(desc(affiliatedLinks.priority))
      .limit(LEARNING_CONFIG.maxAffiliatedLinks);

    const affiliatedResources: LearningResource[] = affiliatedResults.map((link) => ({
      id: link.id,
      url: link.url,
      title: link.title,
      description: link.description || '',
      platform: link.platform,
      isAffiliated: true,
      imageUrl: link.imageUrl || undefined,
    }));

    // 2. Perform web search for additional resources
    const searchResponse = await searchLearningResources(skillName, { category, level });

    const webResources: LearningResource[] = searchResponse?.results
      .filter((result: TavilySearchResult) => {
        // Filter out already included affiliated links
        return !affiliatedResources.some((aff) => aff.url === result.url);
      })
      .map((result: TavilySearchResult, index: number) => ({
        // Use index + full URL hash to ensure unique IDs
        id: `web-${index}-${Buffer.from(result.url).toString('base64').replace(/[+/=]/g, '').slice(-12)}`,
        url: result.url,
        title: result.title,
        description: result.content.slice(0, LEARNING_CONFIG.descriptionPreviewLength),
        platform: detectPlatformFromUrl(result.url),
        isAffiliated: false,
      })) || [];

    const responseData: LearningResourcesResponse = {
      affiliatedLinks: affiliatedResources,
      webResults: webResources,
      skillName,
      totalCount: affiliatedResources.length + webResources.length,
    };

    // Cache the response
    await setCachedLearningResources(cacheKey, responseData);

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Learning resources fetch error:', error);

    // Check if it's a Zod validation error
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch learning resources' },
      { status: 500 }
    );
  }
}
