import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';
import { checkDiagramQuota } from '@/lib/server/stripe';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // BUG-003: Centralized quota guard — same limit enforced on create, clone, and duplicate
    const quota = await checkDiagramQuota(authUser.organizationId);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: 'Limite do plano Free atingido (máx. 3 diagramas). Faça upgrade para o plano Pro para criar diagramas ilimitados.',
          code: 'PLAN_LIMIT_REACHED',
          currentCount: quota.currentCount,
          limit: quota.maxAllowed,
        },
        { status: 402 }
      );
    }

    if (authUser.role === 'viewer') {
      return NextResponse.json({ error: 'Viewers cannot duplicate diagrams' }, { status: 403 });
    }

    const source = await prisma.diagram.findUnique({
      where: { id },
    });

    if (!source || (source.organizationId !== authUser.organizationId && !source.isPublic)) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    const duplicate = await prisma.$transaction(async (tx) => {
      const newDiagram = await tx.diagram.create({
        data: {
          name: `${source.name} (Copy)`,
          description: source.description,
          type: source.type,
          data: source.data as any,
          nodeCount: source.nodeCount,
          isPublic: false,
          organizationId: authUser.organizationId,
          createdBy: authUser.userId,
        },
      });

      await tx.diagramVersion.create({
        data: {
          diagramId: newDiagram.id,
          version: 1,
          data: source.data as any,
          createdBy: authUser.userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: authUser.userId,
          orgId: authUser.organizationId,
          action: 'diagram.duplicate',
          resourceId: newDiagram.id,
          metadata: { sourceId: source.id },
        },
      });

      return newDiagram;
    });

    return NextResponse.json({ success: true, diagram: duplicate }, { status: 201 });
  } catch (error) {
    console.error('[Diagram Duplicate Error]:', error);
    return NextResponse.json({ error: 'Failed to duplicate diagram' }, { status: 500 });
  }
}
