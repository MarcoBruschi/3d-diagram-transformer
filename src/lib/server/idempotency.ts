import { redis } from './redis';

/**
 * Server-Side Idempotency Store
 * Guarantees that payment webhooks, checkout sessions, and mutating API calls
 * are processed exactly once within a 24-hour window.
 */

const DEFAULT_IDEMPOTENCY_TTL = 86400; // 24 hours

export async function isIdempotentProcessed(idempotencyKey: string): Promise<boolean> {
  if (!idempotencyKey) return false;
  try {
    const key = `idempotency:${idempotencyKey}`;
    const exists = await redis.get(key);
    return exists !== null;
  } catch (error) {
    console.warn('[Idempotency] Failed to check status, proceeding:', error);
    return false;
  }
}

export async function markIdempotentProcessed<T = any>(
  idempotencyKey: string,
  resultData?: T,
  ttlSeconds: number = DEFAULT_IDEMPOTENCY_TTL
): Promise<void> {
  if (!idempotencyKey) return;
  try {
    const key = `idempotency:${idempotencyKey}`;
    const value = resultData ? JSON.stringify(resultData) : 'PROCESSED';
    await redis.set(key, value, 'EX', ttlSeconds);
  } catch (error) {
    console.warn('[Idempotency] Failed to mark as processed:', error);
  }
}

export async function getIdempotentResult<T = any>(idempotencyKey: string): Promise<T | null> {
  if (!idempotencyKey) return null;
  try {
    const key = `idempotency:${idempotencyKey}`;
    const raw = await redis.get(key);
    if (!raw || raw === 'PROCESSED') return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
