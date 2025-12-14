import { db, credits, creditTransactions } from './db';
import { eq, sql, desc } from 'drizzle-orm';
import { BILLING_CONFIG, type CreditOperation } from './constants';

export interface CreditCheckResult {
  sufficient: boolean;
  balance: number;
  required: number;
}

export interface CreditDeductResult {
  success: boolean;
  newBalance: number;
  error?: string;
}

/**
 * Get user's credit balance, creating record with signup bonus if not exists
 */
export async function getUserCredits(userId: string): Promise<number> {
  const existing = await db.query.credits.findFirst({
    where: eq(credits.userId, userId),
  });

  if (existing) {
    return existing.balance;
  }

  // Create initial credits for new user with signup bonus
  try {
    const [created] = await db
      .insert(credits)
      .values({
        userId,
        balance: BILLING_CONFIG.signupBonus,
      })
      .onConflictDoNothing()
      .returning();

    // If insert was skipped due to race condition, fetch existing
    if (!created) {
      const refetched = await db.query.credits.findFirst({
        where: eq(credits.userId, userId),
      });
      return refetched?.balance ?? BILLING_CONFIG.signupBonus;
    }

    // Record initial credit transaction
    await db.insert(creditTransactions).values({
      userId,
      amount: BILLING_CONFIG.signupBonus,
      balanceAfter: BILLING_CONFIG.signupBonus,
      type: 'bonus',
      operation: 'signup_bonus',
      metadata: { reason: 'Welcome bonus for new user' },
    });

    return created.balance;
  } catch {
    // Handle race condition - fetch existing record
    const refetched = await db.query.credits.findFirst({
      where: eq(credits.userId, userId),
    });
    return refetched?.balance ?? BILLING_CONFIG.signupBonus;
  }
}

/**
 * Check if user has sufficient credits for an operation
 */
export async function hasEnoughCredits(
  userId: string,
  operation: CreditOperation
): Promise<CreditCheckResult> {
  const balance = await getUserCredits(userId);
  const required = BILLING_CONFIG.creditCosts[operation];

  return {
    sufficient: balance >= required,
    balance,
    required,
  };
}

/**
 * Deduct credits after successful operation (atomic update)
 * Uses atomic SQL to prevent race conditions without transactions
 */
export async function deductCredits(
  userId: string,
  operation: CreditOperation,
  metadata?: Record<string, unknown>
): Promise<CreditDeductResult> {
  const cost = BILLING_CONFIG.creditCosts[operation];

  try {
    // Ensure user has a credits record
    await ensureCreditsRecord(userId);

    // Atomic update: only deduct if balance >= cost
    const [updated] = await db
      .update(credits)
      .set({
        balance: sql`${credits.balance} - ${cost}`,
        updatedAt: new Date(),
      })
      .where(sql`${credits.userId} = ${userId} AND ${credits.balance} >= ${cost}`)
      .returning();

    if (!updated) {
      // Either user doesn't exist or insufficient balance
      const current = await db.query.credits.findFirst({
        where: eq(credits.userId, userId),
      });
      return {
        success: false,
        newBalance: current?.balance ?? 0,
        error: 'Insufficient credits',
      };
    }

    // Record transaction (non-critical, can fail without rolling back)
    await db.insert(creditTransactions).values({
      userId,
      amount: -cost,
      balanceAfter: updated.balance,
      type: 'usage',
      operation,
      metadata: metadata ?? null,
    });

    return { success: true, newBalance: updated.balance };
  } catch (error) {
    console.error('Error deducting credits:', error);
    return { success: false, newBalance: 0, error: 'Failed to deduct credits' };
  }
}

/**
 * Add credits to user account (for purchases, subscription grants, refunds)
 * Uses atomic SQL operations without transactions
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: 'purchase' | 'subscription' | 'bonus' | 'refund',
  operation: string,
  metadata?: Record<string, unknown>
): Promise<{ newBalance: number }> {
  // Ensure user has a credits record first
  await ensureCreditsRecord(userId);

  // Atomic update: add to balance
  const [updated] = await db
    .update(credits)
    .set({
      balance: sql`${credits.balance} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(credits.userId, userId))
    .returning();

  if (!updated) {
    throw new Error('Failed to update credits');
  }

  // Record transaction (non-critical)
  await db.insert(creditTransactions).values({
    userId,
    amount,
    balanceAfter: updated.balance,
    type,
    operation,
    metadata: metadata ?? null,
  });

  return { newBalance: updated.balance };
}

/**
 * Get credit transaction history for a user
 */
export async function getCreditHistory(
  userId: string,
  limit = 50
): Promise<typeof creditTransactions.$inferSelect[]> {
  return await db.query.creditTransactions.findMany({
    where: eq(creditTransactions.userId, userId),
    orderBy: [desc(creditTransactions.createdAt)],
    limit,
  });
}

/**
 * Initialize credits for a new user (call from auth events)
 * Uses INSERT ON CONFLICT to handle race conditions without transactions
 */
export async function initializeUserCredits(userId: string): Promise<void> {
  await ensureCreditsRecord(userId);
}

/**
 * Helper: Ensure a credits record exists for the user
 * Uses INSERT ON CONFLICT DO NOTHING for atomic upsert
 */
async function ensureCreditsRecord(userId: string): Promise<void> {
  // Try to insert, ignore if already exists
  const [inserted] = await db
    .insert(credits)
    .values({
      userId,
      balance: BILLING_CONFIG.signupBonus,
    })
    .onConflictDoNothing()
    .returning();

  // If we actually inserted a new record, record the signup bonus transaction
  if (inserted) {
    await db.insert(creditTransactions).values({
      userId,
      amount: BILLING_CONFIG.signupBonus,
      balanceAfter: BILLING_CONFIG.signupBonus,
      type: 'bonus',
      operation: 'signup_bonus',
      metadata: { reason: 'Welcome bonus for new user' },
    });
  }
}
