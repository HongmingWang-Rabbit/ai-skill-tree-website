import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserSubscription } from '@/lib/subscription';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const subscription = await getUserSubscription(session.user.id);

    // Convert Infinity to -1 for JSON serialization (client interprets -1 as unlimited)
    return NextResponse.json({
      success: true,
      data: {
        ...subscription,
        limits: {
          ...subscription.limits,
          maxMaps: subscription.limits.maxMaps === Infinity ? -1 : subscription.limits.maxMaps,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
