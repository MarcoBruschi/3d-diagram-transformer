import { redis } from './redis';
import { getOrgPlan } from './stripe';

/**
 * AI Spending Caps & Budget Controls
 * Caps monthly token costs to protect against accidental runaway loops or billing spikes.
 */

export interface SpendingCapStatus {
  allowed: boolean;
  currentSpentCents: number;
  capCents: number;
  percentage: number;
  isWarning: boolean;
  message?: string;
}

// Monthly AI spending caps in cents (USD)
export const MONTHLY_SPENDING_CAPS_CENTS: Record<string, number> = {
  free: 50,          // $0.50 (for free tier testing)
  pro: 1500,         // $15.00
  enterprise: 10000, // $100.00
};

/**
 * Formats current month key for Redis: spending:ai:{orgId}:{YYYY-MM}
 */
function getMonthlySpendingKey(orgId: string): string {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  return `spending:ai:${orgId}:${yearMonth}`;
}

/**
 * Verifies if the organization has remaining AI budget before making an inference call.
 * @param orgId Organization UUID or slug
 * @param estimatedCostCents Estimated cost of the upcoming request in cents (default 1 cent)
 */
export async function checkAiSpendingCap(
  orgId: string,
  estimatedCostCents: number = 1
): Promise<SpendingCapStatus> {
  try {
    const plan = await getOrgPlan(orgId);
    const capCents = MONTHLY_SPENDING_CAPS_CENTS[plan] ?? MONTHLY_SPENDING_CAPS_CENTS.free;
    const key = getMonthlySpendingKey(orgId);

    const rawSpent = await redis.get(key);
    const currentSpentCents = rawSpent ? parseInt(rawSpent, 10) : 0;
    const projectedTotal = currentSpentCents + estimatedCostCents;

    const percentage = capCents > 0 ? (currentSpentCents / capCents) * 100 : 100;
    const isWarning = percentage >= 80;
    const allowed = projectedTotal <= capCents;

    let message: string | undefined;
    if (!allowed) {
      message = `Limite orçamentário mensal de IA atingido ($${(capCents / 100).toFixed(2)} USD). Atualize seu plano para continuar.`;
    } else if (isWarning) {
      message = `Aviso: Você consumiu ${percentage.toFixed(0)}% da sua cota mensal de IA.`;
    }

    return {
      allowed,
      currentSpentCents,
      capCents,
      percentage: Math.min(100, Math.round(percentage)),
      isWarning,
      message,
    };
  } catch (error) {
    console.warn('[SpendingCap] Error checking budget, failing open:', error);
    return {
      allowed: true,
      currentSpentCents: 0,
      capCents: 1500,
      percentage: 0,
      isWarning: false,
    };
  }
}

/**
 * Records actual AI token expenditure into Redis with a 45-day TTL.
 */
export async function recordAiSpending(orgId: string, costCents: number): Promise<number> {
  if (costCents <= 0) return 0;
  try {
    const key = getMonthlySpendingKey(orgId);
    // Increment cents and ensure TTL covers the month + buffer (45 days)
    const results = await redis.pipeline()
      .incrby ? (redis as any).pipeline().incrby(key, costCents).expire(key, 45 * 86400).exec()
      : redis.pipeline().incr(key).expire(key, 45 * 86400).exec();

    const incrVal = results?.[0]?.[1];
    return typeof incrVal === 'number' ? incrVal : costCents;
  } catch (error) {
    console.warn('[SpendingCap] Failed to record spending:', error);
    return 0;
  }
}
