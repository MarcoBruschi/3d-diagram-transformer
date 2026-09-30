import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';
import { invalidatePublicDiagramCache } from '@/lib/server/cache';

const NodeSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  type: z.string().max(100).default('custom'),
  status: z.string().max(50).optional(),
  importance: z.number().int().min(1).max(5).optional(),
  description: z.string().max(1000).optional(),
  position2D: z.object({ x: z.number(), y: z.number() }).optional(),
  position3D: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  properties: z.record(z.string(), z.any()).optional(),
  metrics: z.record(z.string(), z.any()).optional(),
});

const ConnectionSchema = z.object({
  id: z.string().min(1).max(100),
  source: z.string().min(1).max(100),
  target: z.string().min(1).max(100),
  type: z.string().max(100).default('sync'),
  label: z.string().max(100).optional(),
  protocol: z.string().max(100).optional(),
  style: z.string().max(50).optional(),
  trafficRate: z.number().optional(),
  description: z.string().max(500).optional(),
});

const UpdateDiagramSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  type: z.string().max(100).optional(),
  data: z.object({
    nodes: z.array(NodeSchema).default([]),
    connections: z.array(ConnectionSchema).default([]),
  }).optional(),
  isPublic: z.boolean().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/diagrams/:id - Get full diagram with nodes and connections
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    const authUser = await getAuthUser(req);

    const diagram = await prisma.diagram.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!diagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    // Access control: must belong to user's org or be public
    let userOrgId = authUser?.organizationId;
    if (authUser && userOrgId && !UUID_REGEX.test(userOrgId)) {
      const dbUser = await prisma.user.findFirst({
        where: UUID_REGEX.test(authUser.userId) ? { id: authUser.userId } : { email: authUser.email },
        select: { organizationId: true },
      });
      if (dbUser?.organizationId) userOrgId = dbUser.organizationId;
    }

    const hasOrgAccess = authUser && userOrgId === diagram.organizationId;
    if (!hasOrgAccess && !diagram.isPublic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ diagram });
  } catch (error) {
    console.error('[Diagram Get Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve diagram' }, { status: 500 });
  }
}

// PUT /api/diagrams/:id - Update diagram and create a new version when data changes
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role === 'viewer') {
      return NextResponse.json({ error: 'Viewers cannot modify diagrams' }, { status: 403 });
    }

    const currentDiagram = await prisma.diagram.findUnique({
      where: { id },
    });

    if (!currentDiagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    let userOrgId = authUser.organizationId;
    let userId = authUser.userId;
    if (!UUID_REGEX.test(userOrgId) || !UUID_REGEX.test(userId)) {
      const dbUser = await prisma.user.findFirst({
        where: UUID_REGEX.test(authUser.userId) ? { id: authUser.userId } : { email: authUser.email },
        select: { id: true, organizationId: true },
      });
      if (dbUser) {
        userOrgId = dbUser.organizationId;
        userId = dbUser.id;
      }
    }

    if (currentDiagram.organizationId !== userOrgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validated = UpdateDiagramSchema.parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      let nodeCount = currentDiagram.nodeCount;
      if (validated.data && Array.isArray(validated.data.nodes)) {
        nodeCount = validated.data.nodes.length;
      }

      const updatedDiagram = await tx.diagram.update({
        where: { id },
        data: {
          ...(validated.name && { name: validated.name }),
          ...(validated.description !== undefined && { description: validated.description }),
          ...(validated.type && { type: validated.type }),
          ...(validated.data && { data: validated.data as any, nodeCount }),
          ...(validated.isPublic !== undefined && { isPublic: validated.isPublic }),
          ...(validated.thumbnailUrl !== undefined && { thumbnailUrl: validated.thumbnailUrl }),
        },
      });

      // If data was updated, record a new version
      if (validated.data) {
        const latestVersion = await tx.diagramVersion.findFirst({
          where: { diagramId: id },
          orderBy: { version: 'desc' },
          select: { version: true },
        });

        const nextVersion = (latestVersion?.version || 0) + 1;

        await tx.diagramVersion.create({
          data: {
            diagramId: id,
            version: nextVersion,
            data: validated.data as any,
            createdBy: authUser.userId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: authUser.userId,
          orgId: authUser.organizationId,
          action: 'diagram.update',
          resourceId: id,
          metadata: { updatedFields: Object.keys(validated) },
        },
      });

      return updatedDiagram;
    });

    // Invalidate public cache if diagram had a share token
    if (updated.shareToken) {
      await invalidatePublicDiagramCache(updated.shareToken);
    }

    return NextResponse.json({ success: true, diagram: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues?.[0]?.message || 'Invalid input data' }, { status: 400 });
    }
    console.error('[Diagram Update Error]:', error);
    return NextResponse.json({ error: 'Failed to update diagram' }, { status: 500 });
  }
}

// DELETE /api/diagrams/:id - Delete diagram
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentDiagram = await prisma.diagram.findUnique({
      where: { id },
    });

    if (!currentDiagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    let userOrgId = authUser.organizationId;
    if (!UUID_REGEX.test(userOrgId)) {
      const dbUser = await prisma.user.findFirst({
        where: UUID_REGEX.test(authUser.userId) ? { id: authUser.userId } : { email: authUser.email },
        select: { organizationId: true },
      });
      if (dbUser?.organizationId) userOrgId = dbUser.organizationId;
    }

    if (currentDiagram.organizationId !== userOrgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (authUser.role === 'viewer') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.diagram.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          userId: authUser.userId,
          orgId: authUser.organizationId,
          action: 'diagram.delete',
          resourceId: id,
          metadata: { name: currentDiagram.name },
        },
      });
    });

    if (currentDiagram.shareToken) {
      await invalidatePublicDiagramCache(currentDiagram.shareToken);
    }

    return NextResponse.json({ success: true, message: 'Diagram deleted successfully' });
  } catch (error) {
    console.error('[Diagram Delete Error]:', error);
    return NextResponse.json({ error: 'Failed to delete diagram' }, { status: 500 });
  }
}
