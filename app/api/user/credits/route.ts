import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserCredits, getCreditHistory } from '@/lib/credits';
import { BILLING_CONFIG } from '@/lib/constants';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const [balance, history] = await Promise.all([
      getUserCredits(session.user.id),
      getCreditHistory(session.user.id, 20),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        balance,
        history,
        creditCosts: BILLING_CONFIG.creditCosts,
      },
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}
