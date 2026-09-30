import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';

const CreateCommentSchema = z.object({
  nodeId: z.string().optional().nullable(),
  position3D: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }).optional().nullable(),
  content: z.string().min(1).max(2000),
  mentions: z.array(z.string()).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/diagrams/:id/comments - List comments anchored to diagram or nodes
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

    const comments = await prisma.diagramComment.findMany({
      where: { diagramId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('[Comments GET Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/diagrams/:id/comments - Create comment anchored to 3D node
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const diagram = await prisma.diagram.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!diagram || diagram.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    const body = await req.json();
    const validated = CreateCommentSchema.parse(body);

    const comment = await prisma.diagramComment.create({
      data: {
        diagramId: id,
        userId: authUser.userId,
        nodeId: validated.nodeId,
        position3D: validated.position3D as any,
        content: validated.content,
        mentions: validated.mentions as any,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues?.[0]?.message || 'Invalid comment data' }, { status: 400 });
    }
    console.error('[Comments POST Error]:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
