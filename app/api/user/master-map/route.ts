import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, userCareerGraphs, careers, skillGraphs, type SkillNodeData } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { SKILL_PASS_THRESHOLD } from '@/lib/constants';

export interface CareerWithSkills {
  id: string;
  careerId: string;
  title: string;
  skills: Array<{
    id: string;
    name: string;
    icon: string;
    level: number;
    category: string;
    progress: number;
  }>;
}

export interface MasterMapData {
  userName: string;
  careers: CareerWithSkills[];
  stats: {
    totalCareers: number;
    totalSkills: number;
    masteredSkills: number;
    inProgressSkills: number;
  };
}

// GET /api/user/master-map - Get user's careers with skills for graph visualization
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userName = session.user.name || session.user.email || 'User';

    // Fetch all user's career graphs with career and skill graph data
    const userGraphs = await db
      .select({
        graph: {
          id: userCareerGraphs.id,
          careerId: userCareerGraphs.careerId,
          title: userCareerGraphs.title,
          nodeData: userCareerGraphs.nodeData,
          customNodes: userCareerGraphs.customNodes,
        },
        career: {
          id: careers.id,
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

    // Build careers with skills
    const careersWithSkills: CareerWithSkills[] = [];
    let totalSkills = 0;
    let masteredSkills = 0;
    let inProgressSkills = 0;

    for (const userGraph of userGraphs) {
      // Use customNodes if present (from AI modifications or merging), otherwise fall back to base skillGraph
      const nodes = (userGraph.graph.customNodes || userGraph.skillGraph?.nodes) as SkillNodeData[] | null;
      if (!nodes || !userGraph.career) continue;
      const nodeDataMap = new Map(
        (userGraph.graph.nodeData || []).map(nd => [nd.skillId, nd])
      );

      const skills = nodes.map(node => {
        const savedProgress = nodeDataMap.get(node.id);
        const progress = savedProgress?.progress ?? node.progress ?? 0;

        if (progress >= SKILL_PASS_THRESHOLD) {
          masteredSkills++;
        } else if (progress > 0) {
          inProgressSkills++;
        }
        totalSkills++;

        return {
          id: `${userGraph.graph.id}:${node.id}`,
          name: node.name,
          icon: node.icon,
          level: node.level,
          category: node.category,
          progress,
        };
      });

      careersWithSkills.push({
        id: userGraph.graph.id,
        careerId: userGraph.career.id,
        title: userGraph.graph.title || userGraph.career.title,
        skills,
      });
    }

    const data: MasterMapData = {
      userName,
      careers: careersWithSkills,
      stats: {
        totalCareers: careersWithSkills.length,
        totalSkills,
        masteredSkills,
        inProgressSkills,
      },
    };

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Get master map error:', error);
    return NextResponse.json(
      { error: 'Failed to get master map' },
      { status: 500 }
    );
  }
}
