import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { getAuthUser, generateAccessToken, generateRefreshToken } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/ratelimit';
import { redis } from '@/lib/server/redis';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const CreateWorkspaceSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres').max(100),
});

// GET /api/workspaces - List all workspaces user belongs to or has accessed
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let targetUserId = authUser.userId;
    let targetOrgId = authUser.organizationId;

    if (!UUID_REGEX.test(targetUserId) || !UUID_REGEX.test(targetOrgId)) {
      const dbUser = await prisma.user.findFirst({
        where: UUID_REGEX.test(authUser.userId) ? { id: authUser.userId } : { email: authUser.email },
        select: { id: true, organizationId: true, role: true },
      });
      if (dbUser) {
        targetUserId = dbUser.id;
        targetOrgId = dbUser.organizationId;
      }
    }

    // Fetch workspaces through OrganizationMember for the user
    let memberships = await prisma.organizationMember.findMany({
      where: { userId: targetUserId },
      include: {
        organization: {
          include: {
            _count: {
              select: { members: true, users: true },
            },
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    // Fallback: if user has no memberships yet, fallback to user.organizationId
    if (memberships.length === 0 && targetOrgId && UUID_REGEX.test(targetOrgId)) {
      const fallbackOrg = await prisma.organization.findUnique({
        where: { id: targetOrgId },
        include: {
          _count: {
            select: { members: true, users: true },
          },
        },
      });

      if (fallbackOrg) {
        // Self-heal default membership
        const createdMember = await prisma.organizationMember.upsert({
          where: {
            uq_org_member: {
              organizationId: fallbackOrg.id,
              userId: targetUserId,
            },
          },
          update: { isDefault: true },
          create: {
            organizationId: fallbackOrg.id,
            userId: targetUserId,
            role: authUser.role || 'admin',
            isDefault: true,
          },
          include: {
            organization: {
              include: {
                _count: {
                  select: { members: true, users: true },
                },
              },
            },
          },
        }).catch(() => null);

        if (createdMember) {
          memberships = [createdMember];
        }
      }
    }

    // Ensure at least one membership is marked as default
    if (memberships.length > 0 && !memberships.some((m) => m.isDefault)) {
      memberships[0].isDefault = true;
      prisma.organizationMember.update({
        where: { id: memberships[0].id },
        data: { isDefault: true },
      }).catch(() => {});
    }

    const workspaces = memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      plan: (m.organization.plan as 'free' | 'pro' | 'enterprise') || 'free',
      memberCount: m.organization._count?.members || m.organization._count?.users || 1,
      role: (m.role as 'admin' | 'editor' | 'viewer') || 'editor',
      isDefault: m.isDefault,
      isPersonal: m.isDefault,
      isActive: m.organization.id === targetOrgId,
    }));

    if (workspaces.length === 0) {
      workspaces.push({
        id: authUser.organizationId || 'ws-default',
        name: 'Workspace Pessoal',
        slug: authUser.email ? authUser.email.split('@')[0] : 'workspace',
        plan: 'free',
        memberCount: 1,
        role: (authUser.role as 'admin' | 'editor' | 'viewer') || 'admin',
        isDefault: true,
        isPersonal: true,
        isActive: true,
      });
    }

    const personalWorkspace = workspaces.find((w) => w.isDefault || w.isPersonal) || workspaces[0];
    const addedWorkspaces = workspaces.filter((w) => w.id !== personalWorkspace?.id);

    return NextResponse.json({
      workspaces,
      personalWorkspace,
      addedWorkspaces,
      currentWorkspaceId: targetOrgId,
    });
  } catch (error) {
    console.error('[Workspaces GET Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 });
  }
}

// POST /api/workspaces - Create a new workspace or switch workspace
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    let targetUserId = authUser.userId;
    if (!UUID_REGEX.test(targetUserId)) {
      const dbUser = await prisma.user.findFirst({
        where: { email: authUser.email },
        select: { id: true },
      });
      if (dbUser) targetUserId = dbUser.id;
    }

    // Support workspace switching via POST /api/workspaces as well
    if (body.action === 'switch' || (body.workspaceId && !body.name)) {
      const workspaceId = body.workspaceId;
      if (!workspaceId) {
        return NextResponse.json({ error: 'workspaceId é obrigatório' }, { status: 400 });
      }

      const member = await prisma.organizationMember.findUnique({
        where: {
          uq_org_member: {
            organizationId: workspaceId,
            userId: targetUserId,
          },
        },
        include: {
          organization: {
            include: {
              _count: { select: { members: true, users: true } },
            },
          },
        },
      });

      let targetOrg: any = member?.organization || null;
      let targetRole: 'admin' | 'editor' | 'viewer' = (member?.role as any) || 'editor';
      let isDefault = member?.isDefault || false;

      if (!targetOrg) {
        const directOrg = await prisma.organization.findUnique({
          where: { id: workspaceId },
          include: {
            users: { where: { id: targetUserId } },
            _count: { select: { members: true, users: true } },
          },
        });

        if (!directOrg || (directOrg.users.length === 0 && directOrg.id !== authUser.organizationId)) {
          return NextResponse.json({ error: 'Você não tem permissão para acessar este workspace.' }, { status: 403 });
        }

        targetOrg = directOrg;
        targetRole = (directOrg.users[0]?.role as any) || 'editor';
      }

      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: {
          organizationId: targetOrg.id,
          role: targetRole,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
        },
      });

      const tokenPayload = {
        userId: updatedUser.id,
        organizationId: targetOrg.id,
        email: updatedUser.email,
        role: updatedUser.role as 'admin' | 'editor' | 'viewer',
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = await generateRefreshToken(tokenPayload);

      const response = NextResponse.json({
        success: true,
        message: `Alternado para o Workspace "${targetOrg.name}" com sucesso.`,
        accessToken,
        workspace: {
          id: targetOrg.id,
          name: targetOrg.name,
          slug: targetOrg.slug,
          plan: targetOrg.plan,
          memberCount: targetOrg._count?.members || targetOrg._count?.users || 1,
          role: updatedUser.role,
          isDefault,
          isPersonal: isDefault,
        },
        user: {
          ...updatedUser,
          plan: targetOrg.plan,
        },
      });

      response.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    const rateCheck = await checkRateLimit(authUser.userId, 'workspace-create', 15, 60);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 });
    }

    const { name } = CreateWorkspaceSchema.parse(body);

    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      crypto.randomBytes(3).toString('hex');
    const inviteToken = 'inv_editor_' + crypto.randomBytes(16).toString('hex');

    const result = await prisma.$transaction(async (tx) => {
      // Ensure user's existing personal workspace is preserved in OrganizationMember
      const existingPersonal = await tx.organizationMember.findFirst({
        where: { userId: targetUserId, isDefault: true },
      });
      if (!existingPersonal && authUser.organizationId) {
        await tx.organizationMember.upsert({
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

      const organization = await tx.organization.create({
        data: {
          name,
          slug,
          inviteToken,
          plan: 'free',
        },
      });

      // Add user as admin member of this newly created workspace (isDefault: false unless no existing workspace)
      const isFirstOrg = !existingPersonal && !authUser.organizationId;
      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: targetUserId,
          role: 'admin',
          isDefault: isFirstOrg,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: targetUserId },
        data: {
          organizationId: organization.id,
          role: 'admin',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: targetUserId,
          orgId: organization.id,
          action: 'workspace.create',
          metadata: { name, slug },
          ipAddress: req.headers.get('x-forwarded-for') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        },
      });

      return { organization, user: updatedUser, isDefault: isFirstOrg };
    });

    try {
      await redis.set(
        `workspace:invite:${inviteToken}`,
        JSON.stringify({ orgId: result.organization.id, role: 'editor' }),
        'EX',
        30 * 24 * 60 * 60
      );
    } catch (err) {
      console.warn('[Workspace Invite Cache Error]:', err);
    }

    const tokenPayload = {
      userId: result.user.id,
      organizationId: result.organization.id,
      email: result.user.email,
      role: 'admin' as const,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = await generateRefreshToken(tokenPayload);

    const newWorkspace = {
      id: result.organization.id,
      name: result.organization.name,
      slug: result.organization.slug,
      plan: 'free' as const,
      memberCount: 1,
      role: 'admin' as const,
      isDefault: result.isDefault,
      isPersonal: result.isDefault,
    };

    const response = NextResponse.json(
      {
        success: true,
        workspace: newWorkspace,
        accessToken,
        user: {
          ...result.user,
          plan: 'free',
        },
      },
      { status: 201 }
    );

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dados inválidos' }, { status: 400 });
    }
    console.error('[Workspace Create Error]:', error);
    return NextResponse.json({ error: 'Falha ao processar workspace' }, { status: 500 });
  }
}
