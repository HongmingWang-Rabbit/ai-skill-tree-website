import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { db, users, userCareerGraphs, careers, skillGraphs, type SkillNodeData } from '@/lib/db';
import { parseURL } from '@/lib/document-parser';
import {
  analyzeJobPosting,
  analyzeJobTitle,
  generateCoverLetter,
  type CareerSkillData,
  type UserProfile,
  type JobRequirements,
} from '@/lib/ai-resume';
import { searchCompanyInfo, formatCompanyResearchForAI } from '@/lib/mcp/tavily';
import { parseJobUrl, isValidJobContent } from '@/lib/job-url-parser';
import { type Locale } from '@/i18n/routing';
import { hasEnoughCredits, deductCredits } from '@/lib/credits';
import { DOCUMENT_IMPORT_CONFIG } from '@/lib/constants';

// Input validation schema
const CoverLetterGenerateSchema = z.object({
  locale: z.enum(['en', 'zh', 'ja', 'es', 'pt-BR', 'de', 'fr', 'it', 'nl', 'pl']),
  jobTitle: z.string().max(200).optional(),
  jobUrl: z.string().url().optional(),
  jobDescription: z.string().max(50000).optional(), // Full job posting text
  companyUrl: z.string().url().optional(),
});

// POST /api/cover-letter/generate - Generate cover letter content
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = CoverLetterGenerateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { locale, jobTitle, jobUrl, jobDescription, companyUrl } = result.data;
    const userId = session.user.id;

    // Check credits before AI generation (same cost as resume)
    const creditCheck = await hasEnoughCredits(userId, 'resume_generate');
    if (!creditCheck.sufficient) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          code: 'INSUFFICIENT_CREDITS',
          creditsRequired: creditCheck.required,
          creditsBalance: creditCheck.balance,
        },
        { status: 402 }
      );
    }

    // Fetch user profile
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userProfile: UserProfile = {
      name: user.name || session.user.email || 'User',
      email: user.email || '',
      phone: user.phone || undefined,
      address: user.address || undefined,
      bio: user.bio || '',
      experience: user.experience || [],
      projects: user.projects || [],
      education: user.education || [],
    };

    // Fetch user's career skills
    const userGraphs = await db
      .select({
        graph: {
          id: userCareerGraphs.id,
          title: userCareerGraphs.title,
          nodeData: userCareerGraphs.nodeData,
          customNodes: userCareerGraphs.customNodes,
        },
        career: {
          title: careers.title,
        },
        skillGraph: {
          nodes: skillGraphs.nodes,
        },
      })
      .from(userCareerGraphs)
      .leftJoin(careers, eq(userCareerGraphs.careerId, careers.id))
      .leftJoin(skillGraphs, eq(careers.skillGraphId, skillGraphs.id))
      .where(eq(userCareerGraphs.userId, userId));

    // Build career skill data
    const careerSkillData: CareerSkillData[] = [];

    for (const userGraph of userGraphs) {
      const nodes = (userGraph.graph.customNodes || userGraph.skillGraph?.nodes || []) as SkillNodeData[];
      if (nodes.length === 0) continue;

      const nodeDataMap = new Map(
        (userGraph.graph.nodeData || []).map(nd => [nd.skillId, nd])
      );

      const skills = nodes.map(node => {
        const savedProgress = nodeDataMap.get(node.id);
        const progress = savedProgress?.progress ?? node.progress ?? 0;

        return {
          name: node.name,
          level: node.level,
          category: node.category,
          progress,
        };
      }).filter(skill => skill.progress > 0);

      if (skills.length > 0) {
        careerSkillData.push({
          careerTitle: userGraph.graph.title || userGraph.career?.title || 'Career',
          skills,
        });
      }
    }

    // Analyze job requirements if job info provided
    let jobRequirements: JobRequirements | null = null;
    let jobPostingContent: string | null = null;

    if (jobDescription && jobDescription.trim().length > DOCUMENT_IMPORT_CONFIG.minContentLength) {
      // Use directly pasted job description
      jobPostingContent = jobDescription.trim();
      jobRequirements = await analyzeJobPosting(jobPostingContent, jobTitle, locale as Locale);
    } else if (jobUrl) {
      // Parse job URL (handles LinkedIn, Indeed, and generic URLs)
      jobPostingContent = await parseJobUrl(jobUrl, jobTitle);

      // If URL was provided but we couldn't parse it, return error
      if (!isValidJobContent(jobPostingContent)) {
        return NextResponse.json(
          {
            error: 'Could not retrieve job posting content from the provided URL. Please check the URL or enter the job title manually.',
            code: 'JOB_URL_PARSE_FAILED',
          },
          { status: 422 }
        );
      }

      jobRequirements = await analyzeJobPosting(jobPostingContent, jobTitle, locale as Locale);
    } else if (jobTitle) {
      jobRequirements = await analyzeJobTitle(jobTitle, locale as Locale);
    }

    // Fetch company info if URL provided
    let companyInfo: string | null = null;
    if (companyUrl) {
      try {
        const parsed = await parseURL(companyUrl);
        if (parsed.content && parsed.content.length > DOCUMENT_IMPORT_CONFIG.minContentLength) {
          companyInfo = parsed.content;
        }
      } catch {
        // Company URL parsing failed - continue without company info
      }
    }

    // Do company background research if we have a company name
    let companyResearch: string | null = null;
    if (jobRequirements?.companyName) {
      try {
        const searchResults = await searchCompanyInfo(jobRequirements.companyName);
        companyResearch = formatCompanyResearchForAI(searchResults, jobRequirements.companyName);
      } catch {
        // Company research failed - continue without it
      }
    }

    // Generate cover letter with job posting content and company research for personalization
    const coverLetterContent = await generateCoverLetter(
      userProfile,
      careerSkillData,
      jobRequirements,
      companyInfo,
      jobPostingContent,
      companyResearch,
      locale as Locale
    );

    // Deduct credits after successful generation
    const deductResult = await deductCredits(userId, 'resume_generate', {
      type: 'cover_letter',
      locale,
      jobTitle,
      hasJobUrl: !!jobUrl,
    });

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          name: userProfile.name,
          email: userProfile.email,
        },
        coverLetterContent,
        jobRequirements,
      },
      credits: { balance: deductResult.newBalance },
    });

  } catch (error) {
    console.error('Cover letter generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}
