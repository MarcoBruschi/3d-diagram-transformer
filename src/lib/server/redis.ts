import Redis from 'ioredis';

declare global {
  var redisGlobal: Redis | undefined;
}

const REDIS_URL = process.env.REDIS_URL || 'redis://:redis_secret_password@localhost:6379';

class MemoryCacheFallback {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiresAt: number | null = null;
    if (mode === 'EX' && duration) {
      expiresAt = Date.now() + duration * 1000;
    } else if (mode === 'PX' && duration) {
      expiresAt = Date.now() + duration;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const next = (current ? parseInt(current, 10) : 0) + 1;
    this.store.set(key, { value: String(next), expiresAt: null });
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  pipeline() {
    const ops: Array<() => Promise<any>> = [];
    const chain = {
      incr: (k: string) => {
        ops.push(() => this.incr(k));
        return chain;
      },
      expire: (k: string, seconds: number) => {
        ops.push(() => this.expire(k, seconds));
        return chain;
      },
      exec: async () => {
        const results: Array<[Error | null, any]> = [];
        for (const op of ops) {
          try {
            const res = await op();
            results.push([null, res]);
          } catch (e: any) {
            results.push([e, null]);
          }
        }
        return results;
      },
    };
    return chain as any;
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    const hash = this.store.get(key);
    let parsed: Record<string, string> = {};
    if (hash) {
      try {
        parsed = JSON.parse(hash.value);
      } catch {}
    }
    parsed[field] = value;
    this.store.set(key, { value: JSON.stringify(parsed), expiresAt: hash?.expiresAt || null });
    return 1;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const item = await this.get(key);
    if (!item) return {};
    try {
      return JSON.parse(item);
    } catch {
      return {};
    }
  }

  async hdel(key: string, field: string): Promise<number> {
    const hash = this.store.get(key);
    if (!hash) return 0;
    try {
      const parsed = JSON.parse(hash.value);
      delete parsed[field];
      this.store.set(key, { value: JSON.stringify(parsed), expiresAt: hash.expiresAt });
      return 1;
    } catch {
      return 0;
    }
  }
}

let redisInstance: Redis | MemoryCacheFallback;

if (process.env.NODE_ENV === 'production' && (!process.env.REDIS_URL || process.env.REDIS_URL.includes('localhost'))) {
  if (!(globalThis as any).__redis_security_warned__) {
    (globalThis as any).__redis_security_warned__ = true;
    console.warn(
      '[Security Notice] REDIS_URL is missing or pointing to localhost in production. For distributed serverless caching on Vercel, configure a managed Redis provider (such as Upstash Redis or Redis Cloud).'
    );
  }
}

try {
  if (globalThis.redisGlobal) {
    redisInstance = globalThis.redisGlobal;
  } else {
    const isTls = REDIS_URL.startsWith('rediss://');
    const client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null;
        return Math.min(times * 100, 1000);
      },
      tls: isTls ? { rejectUnauthorized: false } : undefined,
    });

    client.on('error', (err) => {
      console.warn('[Redis] Connection warning:', err.message);
    });

    // Persist in globalThis to reuse existing connections across warm serverless lambdas on Vercel
    globalThis.redisGlobal = client;
    redisInstance = client;
  }
} catch {
  redisInstance = new MemoryCacheFallback();
}

export const redis = redisInstance;
