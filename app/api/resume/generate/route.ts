import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { eq } from 'drizzle-orm';
import { authOptions } from '@/lib/auth';
import { db, users, userCareerGraphs, careers, skillGraphs, type SkillNodeData } from '@/lib/db';
import { ResumeGenerateSchema } from '@/lib/schemas';
import { parseURL } from '@/lib/document-parser';
import { SKILL_PASS_THRESHOLD } from '@/lib/constants';
import {
  analyzeJobPosting,
  analyzeJobTitle,
  generateResumeContent,
  type CareerSkillData,
  type UserProfile,
  type JobRequirements,
} from '@/lib/ai-resume';
import { type Locale } from '@/i18n/routing';

// POST /api/resume/generate - Generate resume content
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
    const result = ResumeGenerateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { locale, jobTitle, jobUrl } = result.data;
    const userId = session.user.id;

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
      bio: user.bio || '',
      experience: user.experience || [],
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
      // Use custom nodes if available, otherwise use skill graph nodes
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
      }).filter(skill => skill.progress > 0); // Only include skills with progress

      if (skills.length > 0) {
        careerSkillData.push({
          careerTitle: userGraph.graph.title || userGraph.career?.title || 'Career',
          skills,
        });
      }
    }

    // Check if user has any skills
    const totalSkills = careerSkillData.reduce((sum, career) => sum + career.skills.length, 0);
    if (totalSkills === 0) {
      return NextResponse.json(
        { error: 'No skills found. Please add some skills to your career maps first.' },
        { status: 400 }
      );
    }

    // Analyze job requirements if job info provided
    let jobRequirements: JobRequirements | null = null;

    if (jobUrl) {
      try {
        // Fetch and parse job URL
        const parsed = await parseURL(jobUrl);
        if (parsed.content && parsed.content.length > 50) {
          jobRequirements = await analyzeJobPosting(parsed.content, jobTitle, locale as Locale);
        }
      } catch (error) {
        console.warn('Failed to parse job URL, falling back to title analysis:', error);
        // Fall back to job title analysis if URL parsing fails
        if (jobTitle) {
          jobRequirements = await analyzeJobTitle(jobTitle, locale as Locale);
        }
      }
    } else if (jobTitle) {
      // Use job title for requirements inference
      jobRequirements = await analyzeJobTitle(jobTitle, locale as Locale);
    }

    // Generate resume content
    const resumeContent = await generateResumeContent(
      userProfile,
      careerSkillData,
      jobRequirements,
      locale as Locale
    );

    // Calculate stats
    const masteredSkills = careerSkillData.reduce(
      (sum, career) => sum + career.skills.filter(s => s.progress >= SKILL_PASS_THRESHOLD).length,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          name: userProfile.name,
          email: userProfile.email,
          bio: userProfile.bio,
        },
        experience: userProfile.experience,
        resumeContent,
        jobRequirements,
        stats: {
          totalSkills,
          masteredSkills,
          careerCount: careerSkillData.length,
        },
      },
    });

  } catch (error) {
    console.error('Resume generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    );
  }
}
