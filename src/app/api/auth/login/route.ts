import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { verifyPassword, generateAccessToken, generateRefreshToken } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/ratelimit';

export const dynamic = 'force-dynamic';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
  inviteCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await checkRateLimit(ip, 'auth-login', 15, 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait before retrying.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = LoginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
      include: { organization: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(validated.password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    let activeOrgId = user.organizationId;
    let activeRole = user.role;
    let targetOrg = user.organization;

    // If an inviteCode was provided, switch existing user to that workspace
    if (validated.inviteCode) {
      let rawCode = validated.inviteCode.trim();
      if (rawCode.includes('invite=')) {
        try {
          const parsed = new URL(rawCode.startsWith('http') ? rawCode : `http://localhost/${rawCode}`);
          rawCode = parsed.searchParams.get('invite') || rawCode;
        } catch {}
      }
      const invitedOrg = await prisma.organization.findFirst({
        where: { inviteToken: rawCode },
      });

      if (invitedOrg && invitedOrg.id !== user.organizationId) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            organizationId: invitedOrg.id,
            role: 'editor',
          },
        });
        activeOrgId = invitedOrg.id;
        activeRole = 'editor';
        targetOrg = invitedOrg;
      }
    }

    const tokenPayload = {
      userId: user.id,
      organizationId: activeOrgId,
      email: user.email,
      role: activeRole as 'admin' | 'editor' | 'viewer',
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = await generateRefreshToken(tokenPayload);

    // Record login audit log asynchronously
    prisma.auditLog.create({
      data: {
        userId: user.id,
        orgId: user.organizationId,
        action: 'auth.login',
        ipAddress: ip,
        userAgent: req.headers.get('user-agent'),
      },
    }).catch(() => {});

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        organizationId: user.organization.id,
        organizationName: user.organization.name,
        plan: user.organization.plan,
      },
      accessToken,
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues?.[0]?.message || 'Invalid input data' }, { status: 400 });
    }
    console.error('[Auth Login Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
