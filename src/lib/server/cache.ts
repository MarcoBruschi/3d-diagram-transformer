import crypto from 'crypto';
import { redis } from './redis';

/**
 * Multi-Tier Redis Caching Layer for Enterprise Resilience
 * Provides strongly-typed cache getters, setters with TTL, and key invalidation.
 */

export const CACHE_TTL = {
  SHARED_DIAGRAM: 300,        // 5 minutes
  TEMPLATES_LIST: 3600,       // 1 hour
  ORG_SUBSCRIPTION: 900,      // 15 minutes
  RATE_LIMIT_FALLBACK: 60,    // 1 minute
  QUERY_CACHE: 120,           // 2 minutes
  GEMINI_ANALYSIS: 86400,     // 24 hours
} as const;

/**
 * Hashes raw text/content into a deterministic SHA-256 fingerprint for cache keys
 */
export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Retrieve cached JSON value by key
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[CacheGet Failed] key=${key}`, error);
    return null;
  }
}

/**
 * Store JSON value in Redis with expiration in seconds
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = CACHE_TTL.QUERY_CACHE
): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    await redis.set(key, serialized, 'EX', ttlSeconds);
  } catch (error) {
    console.warn(`[CacheSet Failed] key=${key}`, error);
  }
}

/**
 * Delete one or more keys from cache
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.warn(`[CacheDel Failed] key=${key}`, error);
  }
}

// ==========================================
// Domain-Specific Cache Helpers
// ==========================================

export async function getSharedDiagramCache<T>(identifier: string): Promise<T | null> {
  return cacheGet<T>(`cache:shared:${identifier}`);
}

export async function setSharedDiagramCache<T>(
  identifier: string,
  data: T,
  ttlSeconds: number = CACHE_TTL.SHARED_DIAGRAM
): Promise<void> {
  await cacheSet(`cache:shared:${identifier}`, data, ttlSeconds);
}

export async function invalidateSharedDiagramCache(identifier: string): Promise<void> {
  await cacheDel(`cache:shared:${identifier}`);
}

// Aliases for compatibility
export const getCachedPublicDiagram = getSharedDiagramCache;
export const setCachedPublicDiagram = setSharedDiagramCache;
export const invalidatePublicDiagramCache = invalidateSharedDiagramCache;

// Gemini Analysis Caching
export async function getCachedGeminiAnalysis<T>(hash: string): Promise<T | null> {
  return cacheGet<T>(`cache:gemini:${hash}`);
}

export async function setCachedGeminiAnalysis<T>(
  hash: string,
  data: T,
  ttlSeconds: number = CACHE_TTL.GEMINI_ANALYSIS
): Promise<void> {
  await cacheSet(`cache:gemini:${hash}`, data, ttlSeconds);
}

// Templates Caching
export async function getTemplatesCache<T>(category: string = 'all'): Promise<T | null> {
  return cacheGet<T>(`cache:templates:${category}`);
}

export async function setTemplatesCache<T>(category: string = 'all', data: T): Promise<void> {
  await cacheSet(`cache:templates:${category}`, data, CACHE_TTL.TEMPLATES_LIST);
}

export async function invalidateTemplatesCache(category: string = 'all'): Promise<void> {
  await cacheDel(`cache:templates:${category}`);
  if (category !== 'all') {
    await cacheDel('cache:templates:all');
  }
}

// Organization Plan Caching
export async function getOrgPlanCache(orgId: string): Promise<string | null> {
  return cacheGet<string>(`cache:org:plan:${orgId}`);
}

export async function setOrgPlanCache(orgId: string, plan: string): Promise<void> {
  await cacheSet(`cache:org:plan:${orgId}`, plan, CACHE_TTL.ORG_SUBSCRIPTION);
}

export async function invalidateOrgPlanCache(orgId: string): Promise<void> {
  await cacheDel(`cache:org:plan:${orgId}`);
}
