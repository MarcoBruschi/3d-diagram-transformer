import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getCachedPublicDiagram, setCachedPublicDiagram } from '@/lib/server/cache';
import { checkRateLimit } from '@/lib/server/ratelimit';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET /api/diagrams/shared/:token - Public read-only diagram with Redis caching and rate limiting
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await checkRateLimit(ip, 'diagram-shared-view', 60, 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429 }
      );
    }

    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // 1. Check Redis cache first
    const cached = await getCachedPublicDiagram(token);
    if (cached) {
      return NextResponse.json({ diagram: cached, source: 'cache' });
    }

    // 2. Fetch from PostgreSQL
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(token);
    const diagram = await prisma.diagram.findFirst({
      where: {
        OR: isUuid ? [{ shareToken: token }, { id: token }] : [{ shareToken: token }],
        isPublic: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        data: true,
        nodeCount: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!diagram) {
      return NextResponse.json({ error: 'Diagram not found or sharing has been disabled' }, { status: 404 });
    }

    // 3. Store in Redis cache (15 min TTL)
    await setCachedPublicDiagram(token, diagram, 900);

    return NextResponse.json({ diagram, source: 'db' });
  } catch (error) {
    console.error('[Public Diagram Share Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve shared diagram' }, { status: 500 });
  }
}
