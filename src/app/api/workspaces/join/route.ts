import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { getAuthUser, generateAccessToken, generateRefreshToken } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/ratelimit';
import { redis } from '@/lib/server/redis';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const JoinWorkspaceSchema = z.object({
  inviteCode: z.string().min(1, 'Código, slug ou link de convite é obrigatório'),
});

// POST /api/workspaces/join - Join an existing organization/workspace using inviteCode, slug or id
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await checkRateLimit(ip, 'workspace-join', 20, 60);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde um momento.' }, { status: 429 });
    }

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Autenticação necessária para entrar no workspace' }, { status: 401 });
    }

    const body = await req.json();
    const validated = JoinWorkspaceSchema.parse(body);

    // Sanitize inviteCode: handle full URL, query params (invite/join/code), or raw slug/ID
    let rawCode = validated.inviteCode.trim();

    if (rawCode.includes('http://') || rawCode.includes('https://') || rawCode.includes('?') || rawCode.includes('/')) {
      try {
        const urlToParse = rawCode.startsWith('http://') || rawCode.startsWith('https://')
          ? rawCode
          : `http://localhost/${rawCode.replace(/^\/+/, '')}`;
        const parsedUrl = new URL(urlToParse);
        const paramCode =
          parsedUrl.searchParams.get('invite') ||
          parsedUrl.searchParams.get('join') ||
          parsedUrl.searchParams.get('code') ||
          parsedUrl.searchParams.get('workspace') ||
          parsedUrl.searchParams.get('token');

        if (paramCode) {
          rawCode = paramCode.trim();
        } else {
          // Fallback to last path segment (e.g. /workspaces/join/team-slug -> team-slug)
          const segments = parsedUrl.pathname.split('/').filter(Boolean);
          const lastSeg = segments[segments.length - 1];
          if (lastSeg && !['join', 'workspaces', 'api'].includes(lastSeg.toLowerCase())) {
            rawCode = decodeURIComponent(lastSeg).trim();
          }
        }
      } catch {}
    } else if (rawCode.includes('=')) {
      const match = rawCode.match(/(?:invite|join|code|workspace|token)=([^&]+)/);
      if (match) {
        rawCode = decodeURIComponent(match[1]).trim();
      }
    }

    if (!rawCode) {
      return NextResponse.json(
        { error: 'Código de convite, slug ou ID inválido.' },
        { status: 400 }
      );
    }

    const isUuid = UUID_REGEX.test(rawCode);

    // Find target organization by inviteToken, slug, or id (UUID)
    const org = await prisma.organization.findFirst({
      where: isUuid
        ? {
            OR: [
              { id: rawCode },
              { inviteToken: rawCode },
              { slug: rawCode },
            ],
          }
        : {
            OR: [
              { inviteToken: rawCode },
              { slug: rawCode },
            ],
          },
      include: {
        users: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });

    if (!org) {
      return NextResponse.json(
        { error: 'Workspace não encontrado. Verifique se o link, slug ou código de convite está correto.' },
        { status: 404 }
      );
    }

    let assignedRole: 'admin' | 'editor' | 'viewer' = 'editor';

    // 1. Check Redis cache for verified invite metadata
    let verifiedFromRedis = false;
    try {
      const cached = await redis.get(`workspace:invite:${rawCode}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.orgId === org.id && parsed.role && ['admin', 'editor', 'viewer'].includes(parsed.role)) {
          assignedRole = parsed.role;
          verifiedFromRedis = true;
        }
      }
    } catch {}

    // 2. Anti-tampering defense: never grant admin role solely from unverified token prefix manipulation
    if (!verifiedFromRedis) {
      const roleMatch = rawCode.match(/^inv_(admin|editor|viewer)_/);
      if (roleMatch) {
        const potentialRole = roleMatch[1] as 'admin' | 'editor' | 'viewer';
        if (potentialRole === 'admin') {
          // Demote to editor if admin role was not verified in Redis
          assignedRole = 'editor';
        } else {
          assignedRole = potentialRole;
        }
      }
    }

    // Resolve user UUID if authUser.userId is not in UUID format
    let targetUserId = authUser.userId;
    if (!UUID_REGEX.test(targetUserId)) {
      const dbUser = await prisma.user.findFirst({
        where: { email: authUser.email },
        select: { id: true },
      });
      if (dbUser) targetUserId = dbUser.id;
    }

    // Ensure user's existing/personal workspace is preserved in OrganizationMember
    const existingPersonal = await prisma.organizationMember.findFirst({
      where: { userId: targetUserId, isDefault: true },
    });
    if (!existingPersonal && authUser.organizationId && authUser.organizationId !== org.id) {
      await prisma.organizationMember.upsert({
        where: {
          uq_org_member: {
            organizationId: authUser.organizationId,
            userId: targetUserId,
          },
        },
        update: { isDefault: true },
        create: {
          organizationId: authUser.organizationId,
          userId: targetUserId,
          role: authUser.role || 'admin',
          isDefault: true,
        },
      }).catch(() => {});
    }

    // Upsert membership in target organization without overwriting personal workspace
    await prisma.organizationMember.upsert({
      where: {
        uq_org_member: {
          organizationId: org.id,
          userId: targetUserId,
        },
      },
      update: {
        role: assignedRole,
      },
      create: {
        organizationId: org.id,
        userId: targetUserId,
        role: assignedRole,
        isDefault: false,
      },
    });

    // Switch active workspace for user
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        organizationId: org.id,
        role: assignedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: authUser.userId,
        orgId: org.id,
        action: 'workspace.join',
        ipAddress: ip,
        userAgent: req.headers.get('user-agent'),
      },
    }).catch(() => {});

    // Count members in this workspace
    const memberCount = await prisma.organizationMember.count({
      where: { organizationId: org.id },
    }).catch(() => org.users.length + 1);

    // Issue updated tokens with the joined organizationId
    const tokenPayload = {
      userId: updatedUser.id,
      organizationId: org.id,
      email: updatedUser.email,
      role: updatedUser.role as 'admin' | 'editor' | 'viewer',
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = await generateRefreshToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      message: `Você entrou com sucesso no Workspace "${org.name}"!`,
      accessToken: newAccessToken,
      workspace: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        memberCount: Math.max(memberCount, 1),
        role: updatedUser.role,
        isDefault: false,
        isPersonal: false,
      },
      user: updatedUser,
    });

    // Set refresh token cookie
    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Código inválido' }, { status: 400 });
    }
    console.error('[Workspace Join Error]:', error);
    return NextResponse.json({ error: 'Falha ao entrar no workspace' }, { status: 500 });
  }
}
