import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken, revokeSession } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const refreshToken =
      req.cookies.get('refreshToken')?.value ||
      req.cookies.get('diag_refresh_token')?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: 'Missing refresh token cookie' }, { status: 401 });
    }

    const decoded = await verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    // Verify user is still active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User no longer exists' }, { status: 401 });
    }

    // Revoke old refresh token session
    if (decoded.jti) {
      await revokeSession(decoded.userId, decoded.jti);
    }

    const tokenPayload = {
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role as 'admin' | 'editor' | 'viewer',
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = await generateRefreshToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      accessToken: newAccessToken,
    });

    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    response.cookies.set('diag_refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    return response;
  } catch (error) {
    console.error('[Auth Refresh Error]:', error);
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
  }
}
