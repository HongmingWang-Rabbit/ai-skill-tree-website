import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { URLImportSchema } from '@/lib/schemas';
import { parseURL, detectURLType, type DocumentParseError } from '@/lib/document-parser';
import { extractSkillsFromDocument, generateExtractionSummary } from '@/lib/ai-document';
import { searchTavily, formatSearchResultsForAI } from '@/lib/mcp/tavily';
import { type Locale } from '@/i18n/routing';
import { hasEnoughCredits, deductCredits, type CreditDeductResult } from '@/lib/credits';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const validated = URLImportSchema.parse(body);

    const { url, locale } = validated;

    // Check credits for logged-in users before AI extraction
    if (session?.user?.id) {
      const creditCheck = await hasEnoughCredits(session.user.id, 'import_url');
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
    const urlType = detectURLType(url);

    let parsedDocument;
    let warning: string | undefined;

    try {
      // Try to parse the URL directly
      parsedDocument = await parseURL(url);
    } catch (error) {
      const parseError = error as DocumentParseError;

      // For LinkedIn or other blocked URLs, try Tavily as fallback
      if (
        urlType === 'linkedin' ||
        parseError.code === 'FETCH_FAILED' ||
        parseError.code === 'TIMEOUT'
      ) {
        // Try to extract username or profile info from URL
        const profileInfo = extractProfileInfo(url, urlType);

        if (profileInfo) {
          // Use Tavily to search for profile information
          const searchResults = await searchTavily(
            `${profileInfo.query} skills experience`,
            {
              searchDepth: 'advanced',
              maxResults: 8,
              includeDomains: urlType === 'linkedin' ? ['linkedin.com'] : undefined,
            }
          );

          if (searchResults && searchResults.results.length > 0) {
            // Create a synthetic document from search results
            const searchContent = formatSearchResultsForAI(searchResults);
            parsedDocument = {
              content: searchContent,
              metadata: {
                type: 'url' as const,
                title: profileInfo.name || 'Profile',
                sourceUrl: url,
                wordCount: searchContent.split(/\s+/).length,
              },
            };
            warning =
              urlType === 'linkedin'
                ? 'LinkedIn profile access is limited. Skills extracted from search results.'
                : 'Direct page access failed. Skills extracted from search results.';
          } else {
            // No fallback available
            return NextResponse.json(
              {
                success: false,
                error: urlType === 'linkedin'
                  ? 'Unable to access LinkedIn profile. LinkedIn requires login for most profiles.'
                  : parseError.message || 'Failed to fetch URL content',
                code: parseError.code,
                urlType,
              },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            {
              success: false,
              error: parseError.message || 'Failed to fetch URL content',
              code: parseError.code,
              urlType,
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error: parseError.message || 'Failed to parse URL content',
            code: parseError.code,
            urlType,
          },
          { status: 400 }
        );
      }
    }

    // Extract skills using AI
    const existingContext =
      validated.existingNodes && validated.existingEdges
        ? {
            nodes: validated.existingNodes,
            edges: validated.existingEdges,
          }
        : undefined;

    const result = await extractSkillsFromDocument(
      parsedDocument,
      locale as Locale,
      existingContext
    );

    // Generate human-readable summary
    const summaries = generateExtractionSummary(result, locale as Locale);

    // Deduct credits after successful extraction
    let deductResult: CreditDeductResult | undefined;
    if (session?.user?.id) {
      deductResult = await deductCredits(session.user.id, 'import_url', {
        url,
        urlType,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        nodes: result.nodes,
        edges: result.edges,
        suggestedTitle: result.suggestedTitle,
        confidence: result.confidence,
        bio: result.bio,
        phone: result.phone,
        address: result.address,
        experience: result.experience,
        projects: result.projects,
        education: result.education,
        summaries,
        documentInfo: {
          type: parsedDocument.metadata.type,
          title: parsedDocument.metadata.title,
          sourceUrl: parsedDocument.metadata.sourceUrl,
          wordCount: parsedDocument.metadata.wordCount,
        },
        urlType,
        warning,
      },
      credits: deductResult ? { balance: deductResult.newBalance } : undefined,
    });
  } catch (error) {
    console.error('URL import error:', error);

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

/**
 * Extract profile information from URL for search fallback
 */
function extractProfileInfo(
  url: string,
  urlType: 'linkedin' | 'github' | 'portfolio' | 'generic'
): { name: string | null; query: string } | null {
  try {
    const urlObj = new URL(url);

    if (urlType === 'linkedin') {
      // Extract username from LinkedIn URL: linkedin.com/in/username
      const match = urlObj.pathname.match(/\/in\/([^\/]+)/);
      if (match) {
        const username = match[1].replace(/-/g, ' ');
        return {
          name: username,
          query: `"${username}" LinkedIn profile`,
        };
      }
    } else if (urlType === 'github') {
      // Extract username from GitHub URL: github.com/username
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts.length >= 1) {
        const username = parts[0];
        return {
          name: username,
          query: `${username} GitHub developer`,
        };
      }
    }

    // For generic URLs, use the domain
    return {
      name: null,
      query: `site:${urlObj.hostname}`,
    };
  } catch {
    return null;
  }
}
