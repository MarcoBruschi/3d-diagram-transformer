import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/server/auth';
import {
  updateParticipantPresence,
  getActiveParticipants,
  removeParticipant,
  updateWorkspacePresence,
} from '@/lib/server/presence';
import { checkRateLimit } from '@/lib/server/ratelimit';
import { checkPlanFeature } from '@/lib/server/stripe';
import { redis } from '@/lib/server/redis';
import { prisma } from '@/lib/server/db';

const DiagramMutationSchema = z.object({
  nodes: z.array(z.any()).optional(),
  connections: z.array(z.any()).optional(),
  nodeId: z.string().optional(),
  position3D: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    z: z.number().finite(),
  }).optional(),
  position2D: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  version: z.number().optional(),
  lastModifiedBy: z.string().optional(),
}).passthrough();

const PresenceUpdateSchema = z.object({
  cursor: z
    .object({
      x: z.number().finite(),
      y: z.number().finite(),
      z: z.number().finite(),
    })
    .optional(),
  color: z.string().max(30).regex(/^#[0-9a-fA-F]{3,8}$|^[a-zA-Z]+$/).optional(),
  activeNodeId: z.string().max(100).optional(),
  diagramMutation: DiagramMutationSchema.optional(),
  currentDiagramName: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// GET /api/collaborate/:id - Get list of active participants and live mutation
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const isUuid = UUID_REGEX.test(id);
    let diagram = await prisma.diagram.findFirst({
      where: isUuid ? { OR: [{ id }, { shareToken: id }] } : { shareToken: id },
      select: { id: true, name: true, organizationId: true, isPublic: true },
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
        select: { id: true, name: true, organizationId: true, isPublic: true },
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
      if (!isUuid) {
        return NextResponse.json(
          { participants: [], liveDiagramMutation: null, canonicalDiagramId: id },
          { status: 200 }
        );
      }
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    const roomId = diagram.id;
    const isTenantMember = authUser?.organizationId === diagram.organizationId;

    if (!diagram.isPublic && !isTenantMember) {
      return NextResponse.json(
        { error: 'Apenas membros da organização proprietária podem acessar a colaboração deste diagrama.' },
        { status: 403 }
      );
    }

    // STRICT PLAN PERMISSION CHECK: Multiplayer evaluated against diagram's organization ONLY if not public
    if (!diagram.isPublic) {
      const check = await checkPlanFeature(diagram.organizationId, 'canCollaborate');
      if (!check.allowed) {
        return NextResponse.json(
          {
            error: 'Colaboração multiplayer em tempo real é exclusiva dos planos Pro e Enterprise.',
            code: 'FEATURE_GATED_PLAN',
            currentPlan: check.plan,
            requiredPlan: 'pro',
          },
          { status: 403 }
        );
      }
    }

    const [participants, rawMutation] = await Promise.all([
      getActiveParticipants(roomId),
      redis.get(`diagram:live:${roomId}`).catch(() => null),
    ]);

    let liveDiagramMutation: any = null;
    if (rawMutation) {
      try {
        liveDiagramMutation = JSON.parse(rawMutation);
      } catch {}
    }

    return NextResponse.json({
      participants,
      liveDiagramMutation,
      canonicalDiagramId: diagram.id,
    });
  } catch (error) {
    console.error('[Collaborate GET Error]:', error);
    return NextResponse.json({ error: 'Failed to get participants' }, { status: 500 });
  }
}

// POST /api/collaborate/:id - Update 3D cursor position, workspace presence and mutation (Rate limited: 300 req/min)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await checkRateLimit(clientIp, 'presence-heartbeat', 1200, 60);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Too many heartbeat requests' }, { status: 429 });
    }

    const { id } = await params;
    const isUuid = UUID_REGEX.test(id);
    let diagram = await prisma.diagram.findFirst({
      where: isUuid ? { OR: [{ id }, { shareToken: id }] } : { shareToken: id },
      select: { id: true, name: true, organizationId: true, isPublic: true },
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
        select: { id: true, name: true, organizationId: true, isPublic: true },
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
      if (!isUuid) {
        return NextResponse.json(
          { success: true, participants: [], liveDiagramMutation: null, canonicalDiagramId: id },
          { status: 200 }
        );
      }
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    const roomId = diagram.id;
    const isTenantMember = authUser?.organizationId === diagram.organizationId;

    if (!diagram.isPublic && !isTenantMember) {
      if (!authUser) {
        return NextResponse.json(
          { error: 'Autenticação necessária para participar da colaboração em tempo real', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: 'Apenas membros da organização proprietária podem acessar a colaboração deste diagrama.' },
        { status: 403 }
      );
    }

    // STRICT PLAN PERMISSION CHECK: Only enforce plan gate for private diagrams
    if (!diagram.isPublic) {
      const check = await checkPlanFeature(diagram.organizationId, 'canCollaborate');
      if (!check.allowed) {
        return NextResponse.json(
          {
            error: 'Colaboração multiplayer em tempo real é exclusiva dos planos Pro e Enterprise.',
            code: 'FEATURE_GATED_PLAN',
            currentPlan: check.plan,
            requiredPlan: 'pro',
          },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const validated = PresenceUpdateSchema.parse(body);

    let userId: string;
    let name: string;
    let color: string;
    let email: string;

    if (authUser) {
      userId = authUser.userId;
      name = authUser.email.split('@')[0];
      email = authUser.email;
      color = validated.color || '#3b82f6';
    } else {
      // Guest collaborator on public/shared diagram
      const cleanIp = clientIp.replace(/[^a-zA-Z0-9]/g, '').slice(-4) || 'guest';
      userId = req.headers.get('x-anonymous-user-id') || `guest-${cleanIp}`;
      name = `Convidado (${cleanIp})`;
      email = `${userId}@guest.local`;
      color = validated.color || '#10b981';
    }

    // 1. Update 3D participant presence if cursor provided
    if (validated.cursor) {
      await updateParticipantPresence(roomId, {
        userId,
        name,
        color,
        cursor: validated.cursor,
        activeNodeId: validated.activeNodeId,
      });
    }

    // 2. Update workspace presence
    if (diagram.organizationId) {
      await updateWorkspacePresence(diagram.organizationId, {
        userId,
        name,
        email,
        currentDiagramId: diagram.id,
        currentDiagramName: diagram.name || validated.currentDiagramName,
      });
    }

    // 3. Handle live diagram mutation if provided
    let liveDiagramMutation: any = null;
    const liveKey = `diagram:live:${roomId}`;
    if (validated.diagramMutation) {
      liveDiagramMutation = validated.diagramMutation;
      try {
        await redis.set(liveKey, JSON.stringify(liveDiagramMutation), 'EX', 3600);
      } catch (err) {
        console.warn('[Collaborate] Error saving live diagram mutation:', err);
      }
    } else {
      try {
        const raw = await redis.get(liveKey);
        if (raw) {
          liveDiagramMutation = JSON.parse(raw);
        }
      } catch {}
    }

    const participants = await getActiveParticipants(roomId);

    return NextResponse.json({
      success: true,
      participants,
      liveDiagramMutation,
      canonicalDiagramId: diagram.id,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues?.[0]?.message || 'Invalid cursor payload' }, { status: 400 });
    }
    console.error('[Collaborate POST Error]:', error);
    return NextResponse.json({ error: 'Failed to update presence' }, { status: 500 });
  }
}

// DELETE /api/collaborate/:id - Leave room
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const isUuid = UUID_REGEX.test(id);
    const diagram = await prisma.diagram.findFirst({
      where: isUuid ? { OR: [{ id }, { shareToken: id }] } : { shareToken: id },
      select: { id: true },
    });
    const roomId = diagram ? diagram.id : id;

    const authUser = await getAuthUser(req);
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userId = authUser ? authUser.userId : (req.headers.get('x-anonymous-user-id') || `guest-${clientIp}`);

    await removeParticipant(roomId, userId);
    return NextResponse.json({ success: true, canonicalDiagramId: diagram?.id || roomId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to leave room' }, { status: 500 });
  }
}
