import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';

interface RouteParams {
  params: Promise<{ id: string; v: string }>;
}

// GET /api/diagrams/:id/versions/:v - Get specific historical version snapshot
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id, v } = await params;
    const versionNum = parseInt(v, 10);

    if (isNaN(versionNum)) {
      return NextResponse.json({ error: 'Invalid version number' }, { status: 400 });
    }

    const authUser = await getAuthUser(req);

    const diagram = await prisma.diagram.findUnique({
      where: { id },
      select: { organizationId: true, isPublic: true },
    });

    if (!diagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    const hasAccess = authUser && authUser.organizationId === diagram.organizationId;
    if (!hasAccess && !diagram.isPublic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const snapshot = await prisma.diagramVersion.findUnique({
      where: {
        diagramId_version: {
          diagramId: id,
          version: versionNum,
        },
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!snapshot) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error('[Diagram Version Snapshot Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve version snapshot' }, { status: 500 });
  }
}
