import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';
import { checkDiagramQuota } from '@/lib/server/stripe';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/templates/:id/clone - Clone official or community template into user organization
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role === 'viewer') {
      return NextResponse.json({ error: 'Visualizadores não possuem permissão para clonar templates' }, { status: 403 });
    }

    // BUG-003: Centralized quota guard — replaces inline plan+count check
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

    const template = await prisma.diagramTemplate.findUnique({
      where: { id },
    });

    if (!template || (!template.isPublic && template.organizationId !== authUser.organizationId)) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const diagramName = body.name || `${template.name} (Cloned)`;

    const diagram = await prisma.$transaction(async (tx) => {
      // 1. Increment template popularity counter
      await tx.diagramTemplate.update({
        where: { id },
        data: { downloadsCount: { increment: 1 } },
      });

      const nodes = Array.isArray((template.data as any)?.nodes) ? (template.data as any).nodes : [];

      // 2. Clone diagram into user organization
      const created = await tx.diagram.create({
        data: {
          name: diagramName,
          description: template.description,
          type: template.category,
          data: template.data as any,
          nodeCount: nodes.length,
          organizationId: authUser.organizationId,
          createdBy: authUser.userId,
        },
      });

      // 3. Save initial version 1
      await tx.diagramVersion.create({
        data: {
          diagramId: created.id,
          version: 1,
          data: template.data as any,
          createdBy: authUser.userId,
        },
      });

      // 4. Audit log
      await tx.auditLog.create({
        data: {
          userId: authUser.userId,
          orgId: authUser.organizationId,
          action: 'template.clone',
          resourceId: created.id,
          metadata: { templateId: template.id, templateName: template.name },
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, diagram }, { status: 201 });
  } catch (error) {
    console.error('[Template Clone Error]:', error);
    return NextResponse.json({ error: 'Failed to clone template' }, { status: 500 });
  }
}
