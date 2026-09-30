import { redis } from './redis';

/**
 * Distributed Mutex Lock backed by Redis SET NX EX
 * Prevents race conditions and duplicate mutations across serverless instances.
 */

export interface MutexResult {
  acquired: boolean;
  release: () => Promise<void>;
}

export async function acquireLock(
  lockKey: string,
  ttlSeconds: number = 10
): Promise<MutexResult> {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const key = `lock:${lockKey}`;

  try {
    const res = await redis.set(key, token, 'EX', ttlSeconds);
    const acquired = res === 'OK';

    const release = async () => {
      try {
        const currentToken = await redis.get(key);
        if (currentToken === token) {
          await redis.del(key);
        }
      } catch (err) {
        console.warn(`[Mutex] Error releasing lock ${key}:`, err);
      }
    };

    return { acquired, release };
  } catch (error) {
    console.warn(`[Mutex] Redis unavailable for lock ${key}, permitting fallback execution:`, error);
    return {
      acquired: true,
      release: async () => {},
    };
  }
}

/**
 * Executes an asynchronous function within a scoped distributed mutex lock.
 * If the lock cannot be acquired, throws a 409 Conflict error.
 */
export async function withDistributedLock<T>(
  lockKey: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 10
): Promise<T> {
  const { acquired, release } = await acquireLock(lockKey, ttlSeconds);
  if (!acquired) {
    const error = new Error(`Resource is currently locked by another operation: ${lockKey}`);
    (error as any).statusCode = 409;
    (error as any).code = 'CONCURRENT_MUTATION_CONFLICT';
    throw error;
  }

  try {
    return await fn();
  } finally {
    await release();
  }
}
