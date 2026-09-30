import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { redis } from './redis';

const DEFAULT_JWT_SECRET = 'super-secure-3d-diagram-jwt-secret-min-32-chars';
const DEFAULT_REFRESH_SECRET = 'super-secure-refresh-secret-min-32-chars';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === DEFAULT_JWT_SECRET || secret.length < 32) {
      throw new Error(
        '[Security FATAL] JWT_SECRET must be explicitly set with at least 32 characters in production. Fallback defaults are blocked.'
      );
    }
    return secret;
  }
  return secret || DEFAULT_JWT_SECRET;
}

export function getJwtRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === DEFAULT_REFRESH_SECRET || secret.length < 32) {
      throw new Error(
        '[Security FATAL] JWT_REFRESH_SECRET must be explicitly set with at least 32 characters in production. Fallback defaults are blocked.'
      );
    }
    return secret;
  }
  return secret || DEFAULT_REFRESH_SECRET;
}

// Access token TTL must match jwt expiresIn below (15 min = 900 s)
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

// Redis key prefix for the accessToken JTI blocklist
const ACCESS_BLOCKLIST_PREFIX = 'blocklist:access:';

export interface TokenPayload {
  userId: string;
  organizationId: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  jti?: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: Omit<TokenPayload, 'jti'>): string {
  // Each accessToken carries a unique jti so it can be individually revoked
  const jti = crypto.randomUUID();
  return jwt.sign({ ...payload, jti }, getJwtSecret(), { expiresIn: '15m' });
}

export async function generateRefreshToken(payload: Omit<TokenPayload, 'jti'>): Promise<string> {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ ...payload, jti }, getJwtRefreshSecret(), { expiresIn: '30d' });
  
  // Store session in Redis for instant revocation support (30 days TTL)
  try {
    await redis.set(`session:${payload.userId}:${jti}`, 'active', 'EX', 30 * 24 * 60 * 60);
  } catch (err) {
    console.warn('[Auth] Failed to store session jti in Redis:', err);
  }
  
  return token;
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;

    // Check JTI blocklist — revoked tokens are denied even if JWT signature is valid
    if (decoded.jti) {
      try {
        const blocked = await redis.get(`${ACCESS_BLOCKLIST_PREFIX}${decoded.jti}`);
        if (blocked) return null; // Token was explicitly revoked on logout
      } catch (err) {
        // Redis unavailable: fail-open (degrade gracefully, do not hard-block)
        console.warn('[Auth] Redis blocklist check failed (fail-open):', err);
      }
    }

    return decoded;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const decoded = jwt.verify(token, getJwtRefreshSecret()) as TokenPayload;
    if (decoded.jti) {
      const session = await redis.get(`session:${decoded.userId}:${decoded.jti}`);
      if (!session) return null; // Revoked session
    }
    return decoded;
  } catch {
    return null;
  }
}

export async function revokeSession(userId: string, jti: string): Promise<void> {
  try {
    await redis.del(`session:${userId}:${jti}`);
  } catch (err) {
    console.warn('[Auth] Failed to revoke session:', err);
  }
}

/**
 * Adds an accessToken's JTI to the Redis blocklist.
 * TTL matches the token's remaining lifetime so the key auto-expires.
 */
export async function revokeAccessToken(token: string): Promise<void> {
  try {
    // Decode without verification — we only need the jti and exp, signature was already checked upstream
    const decoded = jwt.decode(token) as (TokenPayload & { exp?: number }) | null;
    if (!decoded?.jti) return;

    // Calculate remaining TTL: use (exp - now) clamped to ACCESS_TOKEN_TTL_SECONDS
    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp ? Math.max(1, decoded.exp - now) : ACCESS_TOKEN_TTL_SECONDS;

    await redis.set(`${ACCESS_BLOCKLIST_PREFIX}${decoded.jti}`, '1', 'EX', ttl);
  } catch (err) {
    console.warn('[Auth] Failed to add accessToken to blocklist:', err);
  }
}

/**
 * Extracts and verifies the authenticated user from the Request
 * Reads from Authorization header: "Bearer <token>" or "auth-token" cookie
 */
export async function getAuthUser(req: NextRequest): Promise<TokenPayload | null> {
  const authHeader = req.headers.get('Authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else {
    token =
      req.cookies.get('token')?.value ||
      req.cookies.get('accessToken')?.value ||
      req.cookies.get('diag_access_token')?.value ||
      null;
  }

  if (!token) return null;
  return verifyAccessToken(token);
}
