import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/server/auth';
import { redis } from '@/lib/server/redis';
import { checkPlanFeature } from '@/lib/server/stripe';
import { prisma } from '@/lib/server/db';

const CameraSyncSchema = z.object({
  position: z.array(z.number()).length(3),
  target: z.array(z.number()).length(3),
  fov: z.number().optional(),
});

// Accepts either { position, target, fov } directly or nested in { camera: { ... } }
const PresenterPayloadSchema = z.union([
  CameraSyncSchema,
  z.object({
    camera: CameraSyncSchema,
  }),
]);

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// GET /api/collaborate/:id/presenter - Get active presenter camera state
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const isUuid = UUID_REGEX.test(id);

    let diagram = await prisma.diagram.findFirst({
      where: isUuid ? { OR: [{ id }, { shareToken: id }] } : { shareToken: id },
      select: { id: true, isPublic: true, organizationId: true, name: true },
    });

    const authUser = await getAuthUser(req);

    if (!diagram && authUser) {
      const orgDiagram = await prisma.diagram.findFirst({
        where: {
          organizationId: authUser.organizationId,
          OR: isUuid
            ? [{ name: { equals: id, mode: 'insensitive' } }, { id }]
            : [{ name: { equals: id, mode: 'insensitive' } }],
        },
        select: { id: true, isPublic: true, organizationId: true, name: true },
      });
      if (orgDiagram) {
        diagram = orgDiagram;
      } else {
        diagram = {
          id: `room:${authUser.organizationId}:${id}`,
          name: id,
          organizationId: authUser.organizationId,
          isPublic: false,
        };
      }
    }

    if (!diagram) {
      return NextResponse.json({ active: false });
    }

    if (!diagram.isPublic) {
      if (!authUser || authUser.organizationId !== diagram.organizationId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const key = `presenter:${diagram.id}`;
    const raw = await redis.get(key);

    if (!raw) {
      return NextResponse.json({ active: false, canonicalDiagramId: diagram.id });
    }

    const state = JSON.parse(raw);
    return NextResponse.json({ active: true, presenter: state, canonicalDiagramId: diagram.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get presenter state' }, { status: 500 });
  }
}

// POST /api/collaborate/:id/presenter - Broadcast camera position to all viewers
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userOrgId = authUser.organizationId;
    if (!UUID_REGEX.test(userOrgId)) {
      const dbUser = await prisma.user.findFirst({
        where: UUID_REGEX.test(authUser.userId) ? { id: authUser.userId } : { email: authUser.email },
        select: { organizationId: true },
      });
      if (dbUser?.organizationId) userOrgId = dbUser.organizationId;
    }

    const check = await checkPlanFeature(userOrgId, 'canCollaborate');
    if (!check.allowed) {
      return NextResponse.json(
        {
          error: 'Modo Apresentador e controle de câmera ao vivo requerem plano Pro ou superior',
          code: 'FEATURE_GATED_PLAN',
        },
        { status: 403 }
      );
    }

    // STRICT OWNERSHIP CHECK: Presenter must belong to diagram's organization
    const isUuid = UUID_REGEX.test(id);
    let diagram = await prisma.diagram.findFirst({
      where: isUuid ? { OR: [{ id }, { shareToken: id }] } : { shareToken: id },
      select: { id: true, organizationId: true, name: true },
    });

    if (!diagram && authUser) {
      const orgDiagram = await prisma.diagram.findFirst({
        where: {
          organizationId: authUser.organizationId,
          OR: isUuid
            ? [{ name: { equals: id, mode: 'insensitive' } }, { id }]
            : [{ name: { equals: id, mode: 'insensitive' } }],
        },
        select: { id: true, organizationId: true, name: true },
      });
      if (orgDiagram) {
        diagram = orgDiagram;
      } else {
        diagram = {
          id: `room:${authUser.organizationId}:${id}`,
          name: id,
          organizationId: authUser.organizationId,
        };
      }
    }

    if (!diagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    if (authUser.organizationId !== diagram.organizationId) {
      return NextResponse.json(
        { error: 'Apenas membros da organização proprietária do diagrama podem iniciar apresentações' },
        { status: 403 }
      );
    }

    if (authUser.role === 'viewer') {
      return NextResponse.json(
        { error: 'Visualizadores não possuem permissão para transmitir como apresentador' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = PresenterPayloadSchema.parse(body);
    const camera = 'camera' in parsed ? parsed.camera : parsed;

    const key = `presenter:${diagram.id}`;
    const payload = {
      userId: authUser.userId,
      userName: authUser.email.split('@')[0],
      camera,
      diagramId: diagram.id,
      diagramName: diagram.name || id,
      updatedAt: Date.now(),
    };

    // Keep camera broadcast active for 15 seconds unless renewed with heartbeat
    await Promise.all([
      redis.set(key, JSON.stringify(payload), 'EX', 15),
      redis.set(`presenter:org:${diagram.organizationId}`, JSON.stringify(payload), 'EX', 15),
    ]);

    return NextResponse.json({ success: true, canonicalDiagramId: diagram.id });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues?.[0]?.message || 'Invalid camera data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update camera sync' }, { status: 500 });
  }
}

// DELETE /api/collaborate/:id/presenter - Stop presenter mode (Requires Authentication & Ownership)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isUuid = UUID_REGEX.test(id);
    let diagram = await prisma.diagram.findFirst({
      where: isUuid ? { OR: [{ id }, { shareToken: id }] } : { shareToken: id },
      select: { id: true, organizationId: true },
    });

    if (!diagram && authUser) {
      diagram = {
        id: `room:${authUser.organizationId}:${id}`,
        organizationId: authUser.organizationId,
      };
    }

    if (!diagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    if (authUser.organizationId !== diagram.organizationId) {
      return NextResponse.json(
        { error: 'Apenas membros da organização proprietária podem encerrar apresentações' },
        { status: 403 }
      );
    }

    const key = `presenter:${diagram.id}`;
    const raw = await redis.get(key);
    if (!raw) {
      await redis.del(`presenter:org:${diagram.organizationId}`).catch(() => {});
      return NextResponse.json({ success: true, message: 'No active presentation session', canonicalDiagramId: diagram.id });
    }

    const state = JSON.parse(raw);

    // Only the presenter themselves or a workspace admin can terminate presentation
    const isPresenter = state.userId === authUser.userId;
    const isAdmin = authUser.role === 'admin';
    if (!isPresenter && !isAdmin) {
      return NextResponse.json(
        { error: 'Apenas o apresentador ou um administrador pode encerrar a apresentação' },
        { status: 403 }
      );
    }

    await Promise.all([
      redis.del(key),
      redis.del(`presenter:org:${diagram.organizationId}`),
    ]);
    return NextResponse.json({ success: true, message: 'Presentation session ended', canonicalDiagramId: diagram.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to end presentation' }, { status: 500 });
  }
}
