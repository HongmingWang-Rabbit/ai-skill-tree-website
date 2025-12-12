import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, userCareerGraphs, careers, type UserNodeData } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const SaveGraphSchema = z.object({
  careerId: z.string().uuid(),
  nodeData: z.array(
    z.object({
      skillId: z.string(),
      progress: z.number().min(0).max(100),
      position: z
        .object({
          x: z.number(),
          y: z.number(),
        })
        .optional(),
    })
  ),
});

// Save or update user's graph data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { careerId, nodeData } = SaveGraphSchema.parse(body);

    // Check if user already has a saved graph for this career
    const existing = await db.query.userCareerGraphs.findFirst({
      where: and(
        eq(userCareerGraphs.userId, session.user.id),
        eq(userCareerGraphs.careerId, careerId)
      ),
    });

    let savedGraph;

    if (existing) {
      // Update existing graph
      [savedGraph] = await db
        .update(userCareerGraphs)
        .set({
          nodeData: nodeData as UserNodeData[],
          updatedAt: new Date(),
        })
        .where(eq(userCareerGraphs.id, existing.id))
        .returning();
    } else {
      // Create new saved graph
      [savedGraph] = await db
        .insert(userCareerGraphs)
        .values({
          userId: session.user.id,
          careerId,
          nodeData: nodeData as UserNodeData[],
        })
        .returning();
    }

    return NextResponse.json({
      success: true,
      graphId: savedGraph.id,
      isNew: !existing,
    });
  } catch (error) {
    console.error('Save graph error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save graph' },
      { status: 500 }
    );
  }
}

// Get all user's saved graphs with career info (single query, no N+1)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Join userCareerGraphs with careers to get all data in one query
    const savedGraphsWithCareers = await db
      .select({
        graph: {
          id: userCareerGraphs.id,
          careerId: userCareerGraphs.careerId,
          title: userCareerGraphs.title,
          nodeData: userCareerGraphs.nodeData,
          isPublic: userCareerGraphs.isPublic,
          shareSlug: userCareerGraphs.shareSlug,
          createdAt: userCareerGraphs.createdAt,
          updatedAt: userCareerGraphs.updatedAt,
        },
        career: {
          id: careers.id,
          title: careers.title,
          canonicalKey: careers.canonicalKey,
          locale: careers.locale,
        },
      })
      .from(userCareerGraphs)
      .leftJoin(careers, eq(userCareerGraphs.careerId, careers.id))
      .where(eq(userCareerGraphs.userId, session.user.id));

    return NextResponse.json({ graphs: savedGraphsWithCareers });
  } catch (error) {
    console.error('Get graphs error:', error);
    return NextResponse.json(
      { error: 'Failed to get graphs' },
      { status: 500 }
    );
  }
}
