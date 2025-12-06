import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, userCareerGraphs, type UserNodeData } from '@/lib/db';
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

// Get all user's saved graphs
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const savedGraphs = await db.query.userCareerGraphs.findMany({
      where: eq(userCareerGraphs.userId, session.user.id),
    });

    return NextResponse.json({ graphs: savedGraphs });
  } catch (error) {
    console.error('Get graphs error:', error);
    return NextResponse.json(
      { error: 'Failed to get graphs' },
      { status: 500 }
    );
  }
}
