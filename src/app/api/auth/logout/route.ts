import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, revokeSession, revokeAccessToken } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Revoke refreshToken — deletes session key from Redis
  const refreshToken =
    req.cookies.get('refreshToken')?.value ||
    req.cookies.get('diag_refresh_token')?.value;
  if (refreshToken) {
    try {
      const decoded = await verifyRefreshToken(refreshToken);
      if (decoded?.jti) {
        await revokeSession(decoded.userId, decoded.jti);
      }
    } catch {}
  }

  // Revoke accessToken — adds JTI to blocklist with remaining TTL (max 15 min)
  // Read from Authorization header first, then fallback to cookie
  const authHeader = req.headers.get('Authorization');
  const accessToken = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : req.cookies.get('token')?.value || req.cookies.get('accessToken')?.value;

  if (accessToken) {
    await revokeAccessToken(accessToken);
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set('diag_refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set('accessToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
