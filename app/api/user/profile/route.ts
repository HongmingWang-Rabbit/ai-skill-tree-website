import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { eq } from 'drizzle-orm';
import { db, users } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { ProfileUpdateSchema } from '@/lib/schemas';

// GET /api/user/profile - Get user profile (including bio and experience)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name: user.name || '',
        email: user.email || '',
        image: user.image || '',
        bio: user.bio || '',
        phone: user.phone || '',
        address: user.address || {},
        experience: user.experience || [],
        projects: user.projects || [],
        education: user.education || [],
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/user/profile - Update user profile (name, bio, experience)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate with Zod schema
    const result = ProfileUpdateSchema.safeParse(body);
    if (!result.success) {
      console.error('Profile update validation failed:', result.error.flatten());
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, bio, phone, address, experience, projects, education } = result.data;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (trimmedName.length === 0) {
        return NextResponse.json(
          { error: 'Name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = trimmedName;
    }

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    if (address !== undefined) {
      updateData.address = address;
    }

    if (experience !== undefined) {
      updateData.experience = experience;
    }

    if (projects !== undefined) {
      updateData.projects = projects;
    }

    if (education !== undefined) {
      updateData.education = education;
    }

    // Update the user's profile
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      ...(name !== undefined && { name: name.trim() }),
      ...(bio !== undefined && { bio }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(experience !== undefined && { experience }),
      ...(projects !== undefined && { projects }),
      ...(education !== undefined && { education }),
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
