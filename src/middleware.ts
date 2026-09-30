import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory sliding window rate limiter for Edge/Middleware
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

// Cleanup stale buckets periodically
const CLEANUP_INTERVAL = 60000;
let lastCleanup = Date.now();

function purgeStaleBuckets() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    lastCleanup = now;
    for (const [key, bucket] of rateLimitBuckets.entries()) {
      if (bucket.resetAt <= now) {
        rateLimitBuckets.delete(key);
      }
    }
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply rate limiting to /api/* routes
  if (pathname.startsWith('/api/')) {
    purgeStaleBuckets();

    // Determine client identifier: user IP or fallback
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    // Different limits for sensitive routes
    const isAuthRoute = pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register');
    const isRealtimeRoute =
      pathname.startsWith('/api/collaborate') ||
      pathname.startsWith('/api/telemetry');

    // Real-time synchronization and telemetry have dedicated per-user/per-diagram limiters in Redis
    if (isRealtimeRoute) {
      return NextResponse.next();
    }

    const maxRequests = isAuthRoute ? 30 : 600; // 30 req/min for auth, 600 req/min for studio operations
    const windowMs = 60 * 1000; // 1 minute

    const bucketKey = `${clientIp}:${isAuthRoute ? 'auth' : 'api'}`;
    const now = Date.now();
    let bucket = rateLimitBuckets.get(bucketKey);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 1, resetAt: now + windowMs };
      rateLimitBuckets.set(bucketKey, bucket);
    } else {
      bucket.count++;
    }

    const remaining = Math.max(0, maxRequests - bucket.count);
    const resetSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    if (bucket.count > maxRequests) {
      return new NextResponse(
        JSON.stringify({
          error: 'Muitas requisições. Por favor, aguarde alguns instantes.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: resetSeconds,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(resetSeconds),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(resetSeconds),
          },
        }
      );
    }

    // Continue with injected rate limit and security headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(resetSeconds));
    response.headers.set('X-Content-Type-Options', 'nosniff');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
