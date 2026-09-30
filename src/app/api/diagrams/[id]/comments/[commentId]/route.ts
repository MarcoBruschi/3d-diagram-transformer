import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';

const PatchCommentSchema = z.object({
  resolved: z.boolean().optional(),
  content: z.string().min(1).max(2000).optional(),
});

interface RouteParams {
  params: Promise<{ id: string; commentId: string }>;
}

// PATCH /api/diagrams/:id/comments/:commentId - Resolve or edit comment
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id, commentId } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const comment = await prisma.diagramComment.findUnique({
      where: { id: commentId },
      include: { diagram: true },
    });

    if (!comment || comment.diagramId !== id) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.diagram.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validated = PatchCommentSchema.parse(body);

    // Only the author can edit content, but any workspace editor can mark resolved
    if (validated.content && comment.userId !== authUser.userId) {
      return NextResponse.json({ error: 'Apenas o autor pode editar o conteúdo do comentário' }, { status: 403 });
    }

    const updated = await prisma.diagramComment.update({
      where: { id: commentId },
      data: {
        ...(validated.resolved !== undefined && { resolved: validated.resolved }),
        ...(validated.content !== undefined && { content: validated.content }),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ success: true, comment: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues?.[0]?.message || 'Invalid update data' }, { status: 400 });
    }
    console.error('[Comment PATCH Error]:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

// DELETE /api/diagrams/:id/comments/:commentId - Delete comment
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id, commentId } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const comment = await prisma.diagramComment.findUnique({
      where: { id: commentId },
      include: { diagram: true },
    });

    if (!comment || comment.diagramId !== id) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // BUG-004: IDOR cross-tenant mitigation — reject before checking author/role
    if (comment.diagram.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (comment.userId !== authUser.userId && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Permission denied to delete comment' }, { status: 403 });
    }

    await prisma.diagramComment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Comment DELETE Error]:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
