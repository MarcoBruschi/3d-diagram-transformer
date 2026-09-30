import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/diagrams/:id/versions - List all versions metadata
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    const versions = await prisma.diagramVersion.findMany({
      where: { diagramId: id },
      select: {
        id: true,
        version: true,
        createdAt: true,
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { version: 'desc' },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('[Diagram Versions Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve versions' }, { status: 500 });
  }
}
