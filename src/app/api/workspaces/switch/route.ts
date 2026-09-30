import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { getAuthUser, generateAccessToken, generateRefreshToken } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/ratelimit';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const SwitchWorkspaceSchema = z.object({
  workspaceId: z.string().min(1, 'ID do workspace é obrigatório'),
});

// POST /api/workspaces/switch - Switch the user's active workspace and generate updated JWT token
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await checkRateLimit(ip, 'workspace-switch', 30, 60);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 });
    }

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId } = SwitchWorkspaceSchema.parse(body);

    let targetUserId = authUser.userId;
    if (!UUID_REGEX.test(targetUserId)) {
      const dbUser = await prisma.user.findFirst({
        where: { email: authUser.email },
        select: { id: true },
      });
      if (dbUser) targetUserId = dbUser.id;
    }

    const isUuid = UUID_REGEX.test(workspaceId);

    // Find the requested organization
    const org = await prisma.organization.findFirst({
      where: isUuid ? { id: workspaceId } : { slug: workspaceId },
      include: {
        _count: { select: { users: true } },
        users: {
          where: { id: targetUserId },
          select: { id: true, role: true },
        },
      },
    });

    if (org) {
      const userRole = (org.users?.[0]?.role as 'admin' | 'editor' | 'viewer') || 'editor';

      // Update current active organization for user in database
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          organizationId: org.id,
          role: userRole,
        },
      });

      const tokenPayload = {
        userId: targetUserId,
        organizationId: org.id,
        email: authUser.email,
        role: userRole,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = await generateRefreshToken(tokenPayload);

      const switchedWorkspace = {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan || 'free',
        memberCount: org._count?.users || 1,
        role: userRole,
      };

      const response = NextResponse.json({
        success: true,
        workspace: switchedWorkspace,
        accessToken,
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

    // Fallback if personal or virtual workspace ID is specified
    return NextResponse.json({
      success: true,
      workspace: {
        id: workspaceId,
        name: 'Workspace Pessoal (Padrão)',
        slug: 'workspace-personal',
        plan: 'free',
        memberCount: 1,
        role: 'admin',
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dados inválidos' }, { status: 400 });
    }
    console.error('[Workspace Switch Error]:', error);
    return NextResponse.json({ error: 'Falha ao alternar workspace' }, { status: 500 });
  }
}
