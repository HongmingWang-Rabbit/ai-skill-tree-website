import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, userCareerGraphs, careers, skillGraphs, type UserNodeData } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { generateShareSlug } from '@/lib/normalize-career';
import { MAP_TITLE_MAX_LENGTH, SHARE_SLUG_GENERATION_MAX_RETRIES } from '@/lib/constants';

const ForkSchema = z.object({
  // Fork from a base career
  careerId: z.string().uuid().optional(),
  // Or fork from another user's map
  mapId: z.string().uuid().optional(),
  // Custom title for the new map
  title: z.string().min(1).max(MAP_TITLE_MAX_LENGTH).optional(),
}).refine(
  (data) => data.careerId || data.mapId,
  { message: 'Either careerId or mapId must be provided' }
);

// POST: Create a fork of a career or another user's map
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
    const { careerId, mapId, title } = ForkSchema.parse(body);

    let baseCareerId: string;
    let baseNodeData: UserNodeData[] | null = null;
    let copiedFromId: string | null = null;
    let careerTitle: string;

    if (mapId) {
      // Forking from another user's map
      const sourceMap = await db.query.userCareerGraphs.findFirst({
        where: eq(userCareerGraphs.id, mapId),
      });

      if (!sourceMap) {
        return NextResponse.json(
          { error: 'Source map not found' },
          { status: 404 }
        );
      }

      // Only allow copying public maps (unless it's the user's own map)
      if (!sourceMap.isPublic && sourceMap.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Cannot fork a private map' },
          { status: 403 }
        );
      }

      baseCareerId = sourceMap.careerId;
      baseNodeData = sourceMap.nodeData as UserNodeData[];
      copiedFromId = sourceMap.id;

      // Get career title
      const career = await db.query.careers.findFirst({
        where: eq(careers.id, baseCareerId),
      });
      careerTitle = sourceMap.title || career?.title || 'Untitled';
    } else if (careerId) {
      // Forking from a base career
      const career = await db.query.careers.findFirst({
        where: eq(careers.id, careerId),
      });

      if (!career) {
        return NextResponse.json(
          { error: 'Career not found' },
          { status: 404 }
        );
      }

      baseCareerId = career.id;
      careerTitle = career.title;

      // Get the skill graph to initialize node data
      const skillGraph = await db.query.skillGraphs.findFirst({
        where: eq(skillGraphs.careerId, career.id),
      });

      if (skillGraph) {
        // Initialize nodeData from skill graph nodes
        baseNodeData = (skillGraph.nodes as Array<{ id: string; progress?: number }>).map((node) => ({
          skillId: node.id,
          progress: node.progress || 0,
        }));
      }
    } else {
      return NextResponse.json(
        { error: 'Either careerId or mapId must be provided' },
        { status: 400 }
      );
    }

    // Generate unique share slug
    let shareSlug = generateShareSlug();
    for (let i = 0; i < SHARE_SLUG_GENERATION_MAX_RETRIES; i++) {
      const existing = await db.query.userCareerGraphs.findFirst({
        where: eq(userCareerGraphs.shareSlug, shareSlug),
      });
      if (!existing) break;
      shareSlug = generateShareSlug();
    }

    // Create the new user map
    const newMaps = await db
      .insert(userCareerGraphs)
      .values({
        userId: session.user.id,
        careerId: baseCareerId,
        title: title || careerTitle,
        nodeData: baseNodeData || [],
        isPublic: false,
        shareSlug,
        copiedFromId,
      })
      .returning();

    if (!Array.isArray(newMaps) || newMaps.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create map' },
        { status: 500 }
      );
    }
    const newMap = newMaps[0];

    return NextResponse.json({
      success: true,
      map: {
        id: newMap.id,
        title: newMap.title,
        shareSlug: newMap.shareSlug,
      },
      redirectUrl: `/career/${newMap.id}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fork map' },
      { status: 500 }
    );
  }
}
