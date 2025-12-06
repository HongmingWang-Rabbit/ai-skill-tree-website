import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, userCareerGraphs, careers, skillGraphs } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ careerId: string }>;
}

// Get user's saved graph for a specific career
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { careerId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the user's saved graph for this career
    const savedGraph = await db.query.userCareerGraphs.findFirst({
      where: and(
        eq(userCareerGraphs.userId, session.user.id),
        eq(userCareerGraphs.careerId, careerId)
      ),
    });

    if (!savedGraph) {
      return NextResponse.json(
        { error: 'Graph not found', saved: false },
        { status: 404 }
      );
    }

    // Also get the career and base skill graph data
    const career = await db.query.careers.findFirst({
      where: eq(careers.id, careerId),
    });

    const baseGraph = career?.skillGraphId
      ? await db.query.skillGraphs.findFirst({
          where: eq(skillGraphs.id, career.skillGraphId),
        })
      : null;

    return NextResponse.json({
      saved: true,
      graph: savedGraph,
      career,
      baseGraph,
    });
  } catch (error) {
    console.error('Get user graph error:', error);
    return NextResponse.json(
      { error: 'Failed to get graph' },
      { status: 500 }
    );
  }
}

// Delete user's saved graph for a specific career
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { careerId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await db
      .delete(userCareerGraphs)
      .where(
        and(
          eq(userCareerGraphs.userId, session.user.id),
          eq(userCareerGraphs.careerId, careerId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete graph error:', error);
    return NextResponse.json(
      { error: 'Failed to delete graph' },
      { status: 500 }
    );
  }
}
