import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';
import { checkPlanFeature } from '@/lib/server/stripe';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const v1 = parseInt(searchParams.get('v1') || '1', 10);
    const v2 = parseInt(searchParams.get('v2') || '2', 10);

    const authUser = await getAuthUser(req);

    const diagram = await prisma.diagram.findUnique({
      where: { id },
      select: { organizationId: true, isPublic: true, data: true },
    });

    if (!diagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    const hasAccess = authUser && authUser.organizationId === diagram.organizationId;
    if (!hasAccess && !diagram.isPublic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // STRICT PLAN PERMISSION CHECK: Visual diff is Pro / Enterprise only, evaluated against diagram's organization
    const check = await checkPlanFeature(diagram.organizationId, 'canUseVersionsDiff');
    if (!check.allowed) {
      return NextResponse.json(
        {
          error: 'Visual Diff de versões arquiteturais é exclusivo dos planos Pro e Enterprise.',
          code: 'FEATURE_GATED_PLAN',
          currentPlan: check.plan,
          requiredPlan: 'pro',
        },
        { status: 403 }
      );
    }

    const [ver1, ver2] = await Promise.all([
      prisma.diagramVersion.findUnique({
        where: { diagramId_version: { diagramId: id, version: v1 } },
      }),
      prisma.diagramVersion.findUnique({
        where: { diagramId_version: { diagramId: id, version: v2 } },
      }),
    ]);

    let g1 = ver1?.data as any;
    let g2 = ver2?.data as any;

    if (!ver1 && v1 === 1 && diagram.data) {
      g1 = diagram.data;
    }
    if (!ver2 && v2 === 1 && diagram.data) {
      g2 = diagram.data;
    }

    if (!g1 || !g2) {
      return NextResponse.json({ error: 'One or both versions not found' }, { status: 404 });
    }

    const nodes1: any[] = Array.isArray(g1?.nodes) ? g1.nodes : [];
    const nodes2: any[] = Array.isArray(g2?.nodes) ? g2.nodes : [];

    const conns1: any[] = Array.isArray(g1?.connections) ? g1.connections : [];
    const conns2: any[] = Array.isArray(g2?.connections) ? g2.connections : [];

    const map1 = new Map(nodes1.map((n) => [n.id, n]));
    const map2 = new Map(nodes2.map((n) => [n.id, n]));

    const nodesAdded: any[] = [];
    const nodesRemoved: any[] = [];
    const nodesModified: any[] = [];
    const nodesUnchanged: any[] = [];

    for (const [id2, n2] of map2.entries()) {
      if (!map1.has(id2)) {
        nodesAdded.push(n2);
      } else {
        const n1 = map1.get(id2)!;
        const changedProps: string[] = [];
        if (n1.name !== n2.name) changedProps.push('name');
        if (n1.type !== n2.type) changedProps.push('type');
        if (n1.description !== n2.description) changedProps.push('description');

        if (changedProps.length > 0) {
          nodesModified.push({ from: n1, to: n2, changedProps });
        } else {
          nodesUnchanged.push(n2);
        }
      }
    }

    for (const [id1, n1] of map1.entries()) {
      if (!map2.has(id1)) {
        nodesRemoved.push(n1);
      }
    }

    const connSet1 = new Set(conns1.map((c) => `${c.source}->${c.target}:${c.label || ''}`));
    const connSet2 = new Set(conns2.map((c) => `${c.source}->${c.target}:${c.label || ''}`));

    const connectionsAdded = conns2.filter((c) => !connSet1.has(`${c.source}->${c.target}:${c.label || ''}`));
    const connectionsRemoved = conns1.filter((c) => !connSet2.has(`${c.source}->${c.target}:${c.label || ''}`));

    return NextResponse.json({
      v1,
      v2,
      summary: {
        addedNodesCount: nodesAdded.length,
        removedNodesCount: nodesRemoved.length,
        modifiedNodesCount: nodesModified.length,
        unchangedNodesCount: nodesUnchanged.length,
        addedConnectionsCount: connectionsAdded.length,
        removedConnectionsCount: connectionsRemoved.length,
      },
      diff: {
        nodesAdded,
        nodesRemoved,
        nodesModified,
        connectionsAdded,
        connectionsRemoved,
      },
    });
  } catch (error) {
    console.error('[Architecture Diff Error]:', error);
    return NextResponse.json({ error: 'Failed to compute diff' }, { status: 500 });
  }
}
