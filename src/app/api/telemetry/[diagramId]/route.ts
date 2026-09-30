import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';
import { checkPlanFeature } from '@/lib/server/stripe';

interface RouteParams {
  params: Promise<{ diagramId: string }>;
}

// GET /api/telemetry/:diagramId - Get all live node metrics for a diagram
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { diagramId } = await params;
    const authUser = await getAuthUser(req);

    const diagram = await prisma.diagram.findUnique({
      where: { id: diagramId },
      select: { organizationId: true, isPublic: true },
    });

    if (!diagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    const hasAccess = authUser && authUser.organizationId === diagram.organizationId;
    if (!hasAccess && !diagram.isPublic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // STRICT PLAN PERMISSION CHECK: Real-time telemetry is Pro / Enterprise only
    if (authUser) {
      const check = await checkPlanFeature(authUser.organizationId, 'canUseTelemetry');
      if (!check.allowed) {
        return NextResponse.json(
          {
            error: 'Telemetria Datadog/Prometheus em tempo real é exclusiva dos planos Pro e Enterprise.',
            code: 'FEATURE_GATED_PLAN',
            requiredPlan: 'pro',
          },
          { status: 403 }
        );
      }
    }

    const metrics = await prisma.nodeMetric.findMany({
      where: { diagramId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('[Telemetry GET Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve telemetry' }, { status: 500 });
  }
}
