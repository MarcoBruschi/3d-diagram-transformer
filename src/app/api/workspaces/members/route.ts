import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/ratelimit';
import { redis } from '@/lib/server/redis';

export const dynamic = 'force-dynamic';

const InviteMemberSchema = z.object({
  email: z.string().email('E-mail inválido'),
  role: z.enum(['admin', 'editor', 'viewer']).default('editor'),
});

const UpdateMemberRoleSchema = z.object({
  memberId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

const DeleteMemberSchema = z.object({
  memberId: z.string().uuid('ID de membro inválido'),
});

// GET /api/workspaces/members - Get all members of current user's organization and invite link
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isUuid = (val?: string) =>
      val ? /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val) : false;

    let org: any = null;

    // 1. Direct org lookup by UUID
    if (isUuid(authUser.organizationId)) {
      org = await prisma.organization.findUnique({
        where: { id: authUser.organizationId },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                  createdAt: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    // 2. Fallback: lookup user in PostgreSQL to get their true organization relation
    if (!org) {
      const userWhere = isUuid(authUser.userId) ? { id: authUser.userId } : { email: authUser.email };
      const dbUser = await prisma.user.findFirst({
        where: userWhere,
        include: {
          organization: {
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  avatarUrl: true,
                  createdAt: true,
                },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      });
      if (dbUser?.organization) {
        org = dbUser.organization;
      }
    }

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || 'http';

    // 3. Graceful fallback if database organization is missing
    if (!org) {
      const fallbackSlug = authUser.email ? authUser.email.split('@')[0] : 'team-workspace';
      return NextResponse.json({
        workspace: {
          id: authUser.organizationId || 'ws-main',
          name: 'Workspace Principal',
          slug: fallbackSlug,
          plan: 'free',
        },
        members: [
          {
            id: authUser.userId || 'user-1',
            name: authUser.email.split('@')[0],
            email: authUser.email,
            role: authUser.role || 'admin',
            createdAt: new Date().toISOString(),
          },
        ],
        inviteUrl: `${proto}://${host}/register?invite=${fallbackSlug}`,
      });
    }

    if (!org.inviteToken) {
      const token = 'inv_editor_' + crypto.randomBytes(16).toString('hex');
      try {
        await redis.set(
          `workspace:invite:${token}`,
          JSON.stringify({ orgId: org.id, role: 'editor' }),
          'EX',
          30 * 24 * 60 * 60
        );
      } catch {}
      await prisma.organization.update({
        where: { id: org.id },
        data: { inviteToken: token },
      });
      org.inviteToken = token;
    }

    const inviteUrl = `${proto}://${host}/register?invite=${org.inviteToken}`;

    const membersMap = new Map<string, any>();
    for (const u of org.users || []) {
      membersMap.set(u.id, u);
    }
    for (const m of org.members || []) {
      if (m.user) {
        membersMap.set(m.user.id, {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          avatarUrl: m.user.avatarUrl,
          createdAt: m.createdAt,
        });
      }
    }

    return NextResponse.json({
      workspace: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
      },
      members: Array.from(membersMap.values()),
      inviteUrl,
    });
  } catch (error) {
    console.error('[Workspace Members GET Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve workspace members' }, { status: 500 });
  }
}

// POST /api/workspaces/members - Invite or generate role-linked invite link
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await checkRateLimit(ip, 'workspace-invite', 20, 60);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Too many invite requests. Please slow down.' }, { status: 429 });
    }

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role verification: only Admin can invite or modify workspace members
    if (authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem convidar membros para o Workspace.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = InviteMemberSchema.parse(body);

    // Explicit privilege escalation defense: only admins can invite users to the admin role
    if (validated.role === 'admin' && authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem convidar membros para o cargo de administrador.' },
        { status: 403 }
      );
    }

    const isUuid = (val?: string) =>
      val ? /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val) : false;

    let org: any = null;
    if (isUuid(authUser.organizationId)) {
      org = await prisma.organization.findUnique({
        where: { id: authUser.organizationId },
      });
    }

    if (!org) {
      const userWhere = isUuid(authUser.userId) ? { id: authUser.userId } : { email: authUser.email };
      const dbUser = await prisma.user.findFirst({
        where: userWhere,
        include: { organization: true },
      });
      if (dbUser?.organization) {
        org = dbUser.organization;
      }
    }

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Generate role-encoded invite token: inv_<role>_<hex32>
    const token = `inv_${validated.role}_${crypto.randomBytes(16).toString('hex')}`;

    // Store invite metadata in Redis with 30-day expiration
    try {
      await redis.set(
        `workspace:invite:${token}`,
        JSON.stringify({ orgId: org.id, role: validated.role }),
        'EX',
        30 * 24 * 60 * 60
      );
    } catch (err) {
      console.warn('[Workspace Invite] Redis cache error:', err);
    }

    // Persist as active invite token in organization for DB query fallback
    await prisma.organization.update({
      where: { id: org.id },
      data: { inviteToken: token },
    });
    org.inviteToken = token;

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const inviteUrl = `${proto}://${host}/register?invite=${org.inviteToken}`;

    // Check if target user exists in system
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      if (existingUser.organizationId === org.id) {
        return NextResponse.json(
          { message: 'Este usuário já faz parte deste Workspace.', member: existingUser },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          isPendingInvite: true,
          message: `Convite gerado com permissão "${validated.role}". O usuário deve aceitar para entrar no workspace.`,
          inviteUrl,
        },
        { status: 200 }
      );
    }

    // Target user does not have an account yet: return ready-to-share invite URL with selected role
    return NextResponse.json({
      success: true,
      isPendingAccount: true,
      role: validated.role,
      message: `Link de convite com cargo "${validated.role}" gerado! Compartilhe o link abaixo com ${validated.email}.`,
      inviteUrl,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dados inválidos' }, { status: 400 });
    }
    console.error('[Workspace Members POST Error]:', error);
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 });
  }
}

// PATCH /api/workspaces/members - Update member role with Admin Lockout prevention
export async function PATCH(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await checkRateLimit(ip, 'workspace-member-role', 30, 60);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 });
    }

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role verification: only Admin can change member roles
    if (authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem alterar cargos de membros.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = UpdateMemberRoleSchema.parse(body);
    const targetUserId = validated.memberId || validated.userId;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Identificador do membro é obrigatório' }, { status: 400 });
    }

    const isUuid = (val?: string) =>
      val ? /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val) : false;

    let org: any = null;
    if (isUuid(authUser.organizationId)) {
      org = await prisma.organization.findUnique({
        where: { id: authUser.organizationId },
      });
    }

    if (!org) {
      const userWhere = isUuid(authUser.userId) ? { id: authUser.userId } : { email: authUser.email };
      const dbUser = await prisma.user.findFirst({
        where: userWhere,
        include: { organization: true },
      });
      if (dbUser?.organization) {
        org = dbUser.organization;
      }
    }

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const member = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!member || member.organizationId !== org.id) {
      return NextResponse.json({ error: 'Membro não encontrado neste workspace.' }, { status: 404 });
    }

    // Admin Lockout prevention: if demoting an admin, ensure at least one admin remains
    if (member.role === 'admin' && validated.role !== 'admin') {
      const adminCount = await prisma.user.count({
        where: { organizationId: org.id, role: 'admin' },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Não é permitido remover o único administrador do workspace' },
          { status: 400 }
        );
      }
    }

    const updatedMember = await prisma.user.update({
      where: { id: member.id },
      data: { role: validated.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    await prisma.organizationMember.upsert({
      where: {
        uq_org_member: {
          organizationId: org.id,
          userId: member.id,
        },
      },
      update: { role: validated.role },
      create: {
        organizationId: org.id,
        userId: member.id,
        role: validated.role,
        isDefault: false,
      },
    }).catch(() => {});

    await prisma.auditLog.create({
      data: {
        userId: authUser.userId,
        orgId: org.id,
        action: 'workspace.member_role_update',
        metadata: {
          targetUserId: member.id,
          previousRole: member.role,
          newRole: validated.role,
        },
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Cargo do membro atualizado para ${validated.role}.`,
      member: updatedMember,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dados inválidos' }, { status: 400 });
    }
    console.error('[Workspace Members PATCH Error]:', error);
    return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 });
  }
}

// DELETE /api/workspaces/members - Remove member from workspace (reassigning to personal workspace)
export async function DELETE(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await checkRateLimit(ip, 'workspace-member-delete', 20, 60);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 });
    }

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role verification: only Admin can delete members
    if (authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem remover membros do workspace.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    let targetUserId = searchParams.get('userId') || searchParams.get('memberId');

    if (!targetUserId) {
      try {
        const body = await req.json();
        targetUserId = body?.userId || body?.memberId;
      } catch {}
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Identificador do membro é obrigatório' }, { status: 400 });
    }

    const validated = DeleteMemberSchema.parse({ memberId: targetUserId });

    const isUuid = (val?: string) =>
      val ? /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val) : false;

    let org: any = null;
    if (isUuid(authUser.organizationId)) {
      org = await prisma.organization.findUnique({
        where: { id: authUser.organizationId },
      });
    }

    if (!org) {
      const userWhere = isUuid(authUser.userId) ? { id: authUser.userId } : { email: authUser.email };
      const dbUser = await prisma.user.findFirst({
        where: userWhere,
        include: { organization: true },
      });
      if (dbUser?.organization) {
        org = dbUser.organization;
      }
    }

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const member = await prisma.user.findUnique({
      where: { id: validated.memberId },
    });

    if (!member || member.organizationId !== org.id) {
      return NextResponse.json({ error: 'Membro não encontrado neste workspace.' }, { status: 404 });
    }

    // Admin Lockout prevention: if member is an admin, check remaining admins
    if (member.role === 'admin') {
      const adminCount = await prisma.user.count({
        where: { organizationId: org.id, role: 'admin' },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Não é permitido remover o único administrador do workspace' },
          { status: 400 }
        );
      }
    }

    // Reassign member to their default personal workspace or another workspace they belong to
    await prisma.$transaction(async (tx) => {
      // 1. Remove membership from this workspace
      await tx.organizationMember.deleteMany({
        where: {
          organizationId: org.id,
          userId: member.id,
        },
      });

      // 2. Check if user already has a default personal workspace
      const personalMember = await tx.organizationMember.findFirst({
        where: {
          userId: member.id,
          isDefault: true,
          organizationId: { not: org.id },
        },
      });

      let targetOrgId = personalMember?.organizationId;
      let targetRole = personalMember?.role || 'admin';

      if (!targetOrgId) {
        // Fallback: check any other workspace member belongs to
        const otherMember = await tx.organizationMember.findFirst({
          where: {
            userId: member.id,
            organizationId: { not: org.id },
          },
        });
        if (otherMember) {
          targetOrgId = otherMember.organizationId;
          targetRole = otherMember.role;
        }
      }

      if (!targetOrgId) {
        const emailPrefix = member.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const personalOrgName = `${member.name || emailPrefix}'s Workspace`;
        const personalSlug = `${emailPrefix}-personal-${crypto.randomBytes(3).toString('hex')}`;
        const personalInvite = 'inv_admin_' + crypto.randomBytes(16).toString('hex');

        const personalOrg = await tx.organization.create({
          data: {
            name: personalOrgName,
            slug: personalSlug,
            inviteToken: personalInvite,
            plan: 'free',
          },
        });
        targetOrgId = personalOrg.id;
        targetRole = 'admin';

        await tx.organizationMember.create({
          data: {
            organizationId: personalOrg.id,
            userId: member.id,
            role: 'admin',
            isDefault: true,
          },
        });
      }

      if (member.organizationId === org.id) {
        await tx.user.update({
          where: { id: member.id },
          data: {
            organizationId: targetOrgId,
            role: targetRole,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: authUser.userId,
          orgId: org.id,
          action: 'workspace.member_removed',
          metadata: {
            removedMemberId: member.id,
            removedMemberEmail: member.email,
            newOrganizationId: targetOrgId,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Membro removido do workspace com sucesso e reatribuído a um workspace individual.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dados inválidos' }, { status: 400 });
    }
    console.error('[Workspace Members DELETE Error]:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
