import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';
import { invalidatePublicDiagramCache } from '@/lib/server/cache';

const ShareSchema = z.object({
  isPublic: z.boolean(),
});

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

    if (authUser.role === 'viewer') {
      return NextResponse.json({ error: 'Visualizadores não possuem permissão para alterar o compartilhamento de diagramas' }, { status: 403 });
    }

    const diagram = await prisma.diagram.findUnique({
      where: { id },
    });

    if (!diagram || diagram.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    const body = await req.json();
    const { isPublic } = ShareSchema.parse(body);

    const previousShareToken = diagram.shareToken;
    let nextShareToken: string | null = null;

    if (isPublic) {
      // Reuse existing share token or generate a collision-resistant 24-character hex share token
      nextShareToken = previousShareToken || crypto.randomBytes(12).toString('hex');
    }

    // Atomic update in PostgreSQL
    const updated = await prisma.diagram.update({
      where: { id },
      data: {
        isPublic,
        shareToken: nextShareToken,
      },
      select: {
        id: true,
        name: true,
        isPublic: true,
        shareToken: true,
      },
    });

    // Atomic cache invalidation in Redis when sharing is revoked
    if (!isPublic) {
      if (previousShareToken) {
        await invalidatePublicDiagramCache(previousShareToken);
      }
      await invalidatePublicDiagramCache(id);
    }

    return NextResponse.json({
      success: true,
      diagram: updated,
      shareUrl: isPublic && updated.shareToken ? `/shared/${updated.shareToken}` : null,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues?.[0]?.message || 'Invalid input' }, { status: 400 });
    }
    console.error('[Diagram Share Error]:', error);
    return NextResponse.json({ error: 'Failed to update sharing settings' }, { status: 500 });
  }
}
