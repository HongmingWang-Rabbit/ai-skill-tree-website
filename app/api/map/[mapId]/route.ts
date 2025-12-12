import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, userCareerGraphs, careers, skillGraphs, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { isUUID, isShareSlug, generateShareSlug } from '@/lib/normalize-career';
import { MapUpdateSchema } from '@/lib/schemas';
import { SHARE_SLUG_GENERATION_MAX_RETRIES } from '@/lib/constants';

// GET: Fetch a user map by UUID or shareSlug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const { mapId } = await params;
    const session = await getServerSession(authOptions);

    // Find the user map by UUID or shareSlug
    let userMap;
    if (isUUID(mapId)) {
      userMap = await db.query.userCareerGraphs.findFirst({
        where: eq(userCareerGraphs.id, mapId),
      });
    } else if (isShareSlug(mapId)) {
      userMap = await db.query.userCareerGraphs.findFirst({
        where: eq(userCareerGraphs.shareSlug, mapId),
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid map ID format' },
        { status: 400 }
      );
    }

    if (!userMap) {
      return NextResponse.json(
        { error: 'Map not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    const isOwner = session?.user?.id === userMap.userId;

    if (!isOwner && !userMap.isPublic) {
      return NextResponse.json(
        { error: 'This map is private' },
        { status: 403 }
      );
    }

    // Fetch the base career and skill graph data
    const career = await db.query.careers.findFirst({
      where: eq(careers.id, userMap.careerId),
    });

    if (!career) {
      return NextResponse.json(
        { error: 'Career not found' },
        { status: 404 }
      );
    }

    const skillGraph = await db.query.skillGraphs.findFirst({
      where: eq(skillGraphs.careerId, career.id),
    });

    // Fetch owner info for display (limited info)
    const owner = await db.query.users.findFirst({
      where: eq(users.id, userMap.userId),
      columns: {
        id: true,
        name: true,
        image: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        map: {
          id: userMap.id,
          title: userMap.title || career.title,
          nodeData: userMap.nodeData,
          isPublic: userMap.isPublic,
          shareSlug: userMap.shareSlug,
          createdAt: userMap.createdAt,
          updatedAt: userMap.updatedAt,
        },
        career: {
          id: career.id,
          canonicalKey: career.canonicalKey,
          title: career.title,
          description: career.description,
          locale: career.locale,
        },
        skillGraph: skillGraph ? {
          id: skillGraph.id,
          nodes: skillGraph.nodes,
          edges: skillGraph.edges,
        } : null,
        owner: isOwner ? null : owner, // Only show owner info if not the owner
        isOwner,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to get map' },
      { status: 500 }
    );
  }
}

// PATCH: Update map settings (title, isPublic, nodeData)
export async function PATCH(
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

    // Find the map and verify ownership
    const userMap = await db.query.userCareerGraphs.findFirst({
      where: eq(userCareerGraphs.id, mapId),
    });

    if (!userMap) {
      return NextResponse.json(
        { error: 'Map not found' },
        { status: 404 }
      );
    }

    if (userMap.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this map' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates = MapUpdateSchema.parse(body);

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }

    if (updates.isPublic !== undefined) {
      updateData.isPublic = updates.isPublic;

      // Generate shareSlug if making public and doesn't have one
      if (updates.isPublic && !userMap.shareSlug) {
        let slug = generateShareSlug();

        // Ensure uniqueness
        for (let i = 0; i < SHARE_SLUG_GENERATION_MAX_RETRIES; i++) {
          const existing = await db.query.userCareerGraphs.findFirst({
            where: eq(userCareerGraphs.shareSlug, slug),
          });
          if (!existing) break;
          slug = generateShareSlug();
        }

        updateData.shareSlug = slug;
      }
    }

    if (updates.nodeData !== undefined) {
      updateData.nodeData = updates.nodeData;
    }

    const updatedMaps = await db
      .update(userCareerGraphs)
      .set(updateData)
      .where(eq(userCareerGraphs.id, mapId))
      .returning();

    if (!Array.isArray(updatedMaps) || updatedMaps.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update map' },
        { status: 500 }
      );
    }
    const updatedMap = updatedMaps[0];

    return NextResponse.json({
      success: true,
      map: {
        id: updatedMap.id,
        title: updatedMap.title,
        isPublic: updatedMap.isPublic,
        shareSlug: updatedMap.shareSlug,
        updatedAt: updatedMap.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update map' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a user's map
export async function DELETE(
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

    // Find the map and verify ownership
    const userMap = await db.query.userCareerGraphs.findFirst({
      where: eq(userCareerGraphs.id, mapId),
    });

    if (!userMap) {
      return NextResponse.json(
        { error: 'Map not found' },
        { status: 404 }
      );
    }

    if (userMap.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this map' },
        { status: 403 }
      );
    }

    await db.delete(userCareerGraphs).where(eq(userCareerGraphs.id, mapId));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete map' },
      { status: 500 }
    );
  }
}
