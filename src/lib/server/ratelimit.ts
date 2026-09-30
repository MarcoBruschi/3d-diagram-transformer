import { redis } from './redis';
import { getOrgPlan, PLAN_LIMITS } from './stripe';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Implements sliding/fixed window rate limiting backed by Redis pipeline.
 * Key: ratelimit:{userId}:{endpoint}
 * 
 * @param identifier User ID or IP address
 * @param endpoint Endpoint name (e.g. 'ai-analyze', 'auth-login')
 * @param maxRequests Maximum allowed requests in the window
 * @param windowSeconds Window duration in seconds
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number = 30,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}:${endpoint}`;

  try {
    const results = await redis.pipeline().incr(key).expire(key, windowSeconds).exec();

    // results is [[error, incrResult], [error, expireResult]]
    const incrResult = results?.[0]?.[1];
    const current = typeof incrResult === 'number' ? incrResult : parseInt(String(incrResult ?? 1), 10);

    const remaining = Math.max(0, maxRequests - current);
    const success = current <= maxRequests;

    return {
      success,
      limit: maxRequests,
      remaining,
      reset: windowSeconds,
    };
  } catch (error) {
    console.warn('[RateLimit] Redis unavailable, allowing request with fail-open policy:', error);
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: windowSeconds,
    };
  }
}

/**
 * Checks rate limits scaled by organization plan (free, pro, enterprise)
 * Endpoint types: 'general' | 'ai' | 'telemetry'
 */
export async function checkPlanRateLimit(
  identifier: string,
  orgId: string,
  endpointType: 'general' | 'ai' | 'telemetry'
): Promise<RateLimitResult> {
  const plan = await getOrgPlan(orgId);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  let maxRequests: number = limits.generalRateLimitPerMin;
  if (endpointType === 'ai') {
    maxRequests = limits.aiRateLimitPerMin;
  } else if (endpointType === 'telemetry') {
    maxRequests = limits.telemetryRateLimitPerMin;
  }

  return checkRateLimit(identifier, `${endpointType}-plan-limit`, maxRequests, 60);
}
