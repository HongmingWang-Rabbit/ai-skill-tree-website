import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { affiliatedLinks } from '@/lib/db/schema';
import { AffiliatedLinkSchema } from '@/lib/schemas';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

// GET all affiliated links
export async function GET() {
  const session = await getServerSession(authOptions);

  // TODO: Add admin role check when user roles are implemented
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const links = await db.select().from(affiliatedLinks);
    return NextResponse.json({ success: true, data: links });
  } catch (error) {
    console.error('Failed to fetch affiliated links:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch affiliated links' },
      { status: 500 }
    );
  }
}

// POST create new affiliated link
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // TODO: Add admin role check when user roles are implemented
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = AffiliatedLinkSchema.parse(body);

    const [newLink] = await db.insert(affiliatedLinks).values({
      url: validated.url,
      title: validated.title,
      description: validated.description,
      platform: validated.platform,
      imageUrl: validated.imageUrl,
      skillPatterns: validated.skillPatterns,
      categoryPatterns: validated.categoryPatterns,
      priority: validated.priority,
      isActive: validated.isActive,
    }).returning();

    return NextResponse.json({ success: true, data: newLink });
  } catch (error) {
    console.error('Failed to create affiliated link:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid input' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create affiliated link' },
      { status: 500 }
    );
  }
}

// PUT update affiliated link
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id' },
        { status: 400 }
      );
    }

    const validated = AffiliatedLinkSchema.partial().parse(data);

    const [updatedLink] = await db
      .update(affiliatedLinks)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(affiliatedLinks.id, id))
      .returning();

    if (!updatedLink) {
      return NextResponse.json(
        { success: false, error: 'Link not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedLink });
  } catch (error) {
    console.error('Failed to update affiliated link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update affiliated link' },
      { status: 500 }
    );
  }
}

// DELETE affiliated link
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id' },
        { status: 400 }
      );
    }

    const [deletedLink] = await db
      .delete(affiliatedLinks)
      .where(eq(affiliatedLinks.id, id))
      .returning();

    if (!deletedLink) {
      return NextResponse.json(
        { success: false, error: 'Link not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deletedLink });
  } catch (error) {
    console.error('Failed to delete affiliated link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete affiliated link' },
      { status: 500 }
    );
  }
}
