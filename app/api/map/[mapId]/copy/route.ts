import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, userCareerGraphs, careers, type UserNodeData } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { generateShareSlug, isUUID } from '@/lib/normalize-career';
import { MAP_TITLE_MAX_LENGTH, SHARE_SLUG_GENERATION_MAX_RETRIES } from '@/lib/constants';

const CopySchema = z.object({
  title: z.string().min(1).max(MAP_TITLE_MAX_LENGTH).optional(),
});

// POST: Copy a public map to your own account
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const { mapId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isUUID(mapId)) {
      return NextResponse.json(
        { error: 'Invalid map ID' },
        { status: 400 }
      );
    }

    // Find the source map
    const sourceMap = await db.query.userCareerGraphs.findFirst({
      where: eq(userCareerGraphs.id, mapId),
    });

    if (!sourceMap) {
      return NextResponse.json(
        { error: 'Map not found' },
        { status: 404 }
      );
    }

    // Can't copy your own map (use fork for that)
    if (sourceMap.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot copy your own map. Use fork instead.' },
        { status: 400 }
      );
    }

    // Only allow copying public maps
    if (!sourceMap.isPublic) {
      return NextResponse.json(
        { error: 'This map is private and cannot be copied' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { title } = CopySchema.parse(body);

    // Get the career for default title
    const career = await db.query.careers.findFirst({
      where: eq(careers.id, sourceMap.careerId),
    });

    // Generate unique share slug
    let shareSlug = generateShareSlug();
    for (let i = 0; i < SHARE_SLUG_GENERATION_MAX_RETRIES; i++) {
      const existing = await db.query.userCareerGraphs.findFirst({
        where: eq(userCareerGraphs.shareSlug, shareSlug),
      });
      if (!existing) break;
      shareSlug = generateShareSlug();
    }

    // Create the copy
    const newMaps = await db
      .insert(userCareerGraphs)
      .values({
        userId: session.user.id,
        careerId: sourceMap.careerId,
        title: title || sourceMap.title || career?.title || 'Untitled',
        nodeData: sourceMap.nodeData as UserNodeData[],
        isPublic: false, // Copies start as private
        shareSlug,
        copiedFromId: sourceMap.id,
      })
      .returning();

    if (!Array.isArray(newMaps) || newMaps.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create map copy' },
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
      { error: 'Failed to copy map' },
      { status: 500 }
    );
  }
}
