import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { hashPassword, generateAccessToken, generateRefreshToken } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/ratelimit';
import { redis } from '@/lib/server/redis';

export const dynamic = 'force-dynamic';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(1).max(100),
  orgName: z.string().min(1).max(100).optional(),
  inviteCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await checkRateLimit(ip, 'auth-register', 10, 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = RegisterSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(validated.password);

    // Create default organization slug from orgName or email
    const orgName = validated.orgName || `${validated.name}'s Workspace`;
    const slugBase = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const personalSlug = `${slugBase}-${Math.random().toString(36).substring(2, 7)}`;
    const personalInviteToken = 'inv_' + crypto.randomBytes(16).toString('hex');

    // Create organization(s), user & memberships in a transaction
    const result = await prisma.$transaction(async (tx) => {
      let targetOrg = null;
      let targetRole: 'admin' | 'editor' | 'viewer' = 'editor';

      if (validated.inviteCode) {
        let rawCode = validated.inviteCode.trim();
        if (rawCode.includes('invite=')) {
          try {
            const parsedUrl = new URL(rawCode.startsWith('http') ? rawCode : `http://localhost/${rawCode}`);
            rawCode = parsedUrl.searchParams.get('invite') || rawCode;
          } catch {}
        }
        try {
          const cached = await redis.get(`workspace:invite:${rawCode}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.role && ['admin', 'editor', 'viewer'].includes(parsed.role)) {
              targetRole = parsed.role;
            }
          }
        } catch {}
        const roleMatch = rawCode.match(/^inv_(admin|editor|viewer)_/);
        if (roleMatch) {
          targetRole = roleMatch[1] as 'admin' | 'editor' | 'viewer';
        }

        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(rawCode);
        targetOrg = await tx.organization.findFirst({
          where: isUuid
            ? { OR: [{ id: rawCode }, { inviteToken: rawCode }, { slug: rawCode }] }
            : { OR: [{ inviteToken: rawCode }, { slug: rawCode }] },
        });
      }

      // Always create the user's default personal organization
      const personalOrg = await tx.organization.create({
        data: {
          name: orgName,
          slug: personalSlug,
          inviteToken: personalInviteToken,
          plan: 'free',
        },
      });

      // Active workspace is targetOrg if registered via valid invite, otherwise personalOrg
      const activeOrg = targetOrg || personalOrg;
      const activeRole = targetOrg ? targetRole : 'admin';

      const user = await tx.user.create({
        data: {
          email: validated.email,
          name: validated.name,
          passwordHash,
          role: activeRole,
          organizationId: activeOrg.id,
          emailVerified: false,
        },
      });

      // Default personal workspace membership
      await tx.organizationMember.create({
        data: {
          organizationId: personalOrg.id,
          userId: user.id,
          role: 'admin',
          isDefault: true,
        },
      });

      // If registered from invite code, also add membership to the invited workspace
      if (targetOrg) {
        await tx.organizationMember.create({
          data: {
            organizationId: targetOrg.id,
            userId: user.id,
            role: targetRole,
            isDefault: false,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          orgId: activeOrg.id,
          action: targetOrg ? 'auth.join_workspace' : 'auth.register',
          ipAddress: ip,
          userAgent: req.headers.get('user-agent'),
        },
      });

      return { user, org: activeOrg, personalOrg };
    });

    const tokenPayload = {
      userId: result.user.id,
      organizationId: result.org.id,
      email: result.user.email,
      role: result.user.role as 'admin' | 'editor' | 'viewer',
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = await generateRefreshToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        avatarUrl: result.user.avatarUrl,
        role: result.user.role,
        organizationId: result.org.id,
        organizationName: result.org.name,
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
    console.error('[Auth Register Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
