import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/ratelimit';
import { checkDiagramQuota } from '@/lib/server/stripe';
import { getDiagramViewers } from '@/lib/server/presence';
import { parsePaginationParams, buildPaginatedResponse } from '@/lib/server/pagination';
import { invalidateSharedDiagramCache } from '@/lib/server/cache';

const NodeSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  type: z.string().max(100).default('custom'),
  status: z.string().max(50).optional(),
  importance: z.number().int().min(1).max(5).optional(),
  description: z.string().max(1000).optional(),
  position2D: z.object({ x: z.number(), y: z.number() }).optional(),
  position3D: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  properties: z.record(z.string(), z.any()).optional(),
  metrics: z.record(z.string(), z.any()).optional(),
});

const ConnectionSchema = z.object({
  id: z.string().min(1).max(100),
  source: z.string().min(1).max(100),
  target: z.string().min(1).max(100),
  type: z.string().max(100).default('sync'),
  label: z.string().max(100).optional(),
  protocol: z.string().max(100).optional(),
  style: z.string().max(50).optional(),
  trafficRate: z.number().optional(),
  description: z.string().max(500).optional(),
});

const CreateDiagramSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  type: z.string().max(100).default('custom'),
  data: z.object({
    nodes: z.array(NodeSchema).default([]),
    connections: z.array(ConnectionSchema).default([]),
  }).default({ nodes: [], connections: [] }),
  isPublic: z.boolean().default(false),
  thumbnailUrl: z.string().url().optional(),
});

// GET /api/diagrams - List diagrams (Lazy loads JSONB data for performance, Rate limit 100 req/min)
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(authUser.userId, 'diagrams-list', 100, 60);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait.' }, { status: 429 });
    }

    const { page, limit, cursor, skip } = parsePaginationParams(req, { defaultLimit: 20, maxLimit: 100 });
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const type = searchParams.get('type')?.trim();
    const filter = searchParams.get('filter')?.trim(); // 'personal' | 'workspace' | 'all'

    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    let targetOrgId = authUser.organizationId;
    let targetUserId = authUser.userId;

    if (!UUID_REGEX.test(targetOrgId) || !UUID_REGEX.test(targetUserId)) {
      const dbUser = await prisma.user.findFirst({
        where: UUID_REGEX.test(authUser.userId) ? { id: authUser.userId } : { email: authUser.email },
        select: { id: true, organizationId: true },
      });
      if (dbUser?.organizationId) {
        targetOrgId = dbUser.organizationId;
      }
      if (dbUser?.id) {
        targetUserId = dbUser.id;
      }
    }

    const whereClause: any = {
      organizationId: targetOrgId,
    };

    if (filter === 'personal') {
      whereClause.createdBy = targetUserId;
    } else if (filter === 'workspace') {
      whereClause.createdBy = { not: targetUserId };
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type && type !== 'all') {
      whereClause.type = type;
    }

    const findArgs: any = {
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        nodeCount: true,
        isPublic: true,
        shareToken: true,
        thumbnailUrl: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    };

    if (cursor) {
      findArgs.cursor = { id: cursor };
      findArgs.skip = 1;
    } else if (typeof skip === 'number') {
      findArgs.skip = skip;
    }

    const [total, diagrams] = await Promise.all([
      prisma.diagram.count({ where: whereClause }),
      prisma.diagram.findMany(findArgs),
    ]);

    const diagramsWithViewers = await Promise.all(
      diagrams.map(async (d) => {
        const activeViewers = await getDiagramViewers(d.id, targetOrgId);
        return {
          ...d,
          nodeCount: typeof d.nodeCount === 'number' ? d.nodeCount : 0,
          activeViewers,
        };
      })
    );

    const response = buildPaginatedResponse(diagramsWithViewers, limit, {
      page,
      total,
      getCursor: (item) => item.id,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Diagrams List Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch diagrams' }, { status: 500 });
  }
}

// POST /api/diagrams - Create a new diagram with version 1
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role === 'viewer') {
      return NextResponse.json({ error: 'Viewers cannot create diagrams' }, { status: 403 });
    }

    const rateCheck = await checkRateLimit(authUser.userId, 'diagrams-create', 30, 60);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Rate limit exceeded for diagram creation' }, { status: 429 });
    }

    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    let targetOrgId = authUser.organizationId;
    let targetUserId = authUser.userId;

    if (!UUID_REGEX.test(targetOrgId) || !UUID_REGEX.test(targetUserId)) {
      const dbUser = await prisma.user.findFirst({
        where: UUID_REGEX.test(authUser.userId) ? { id: authUser.userId } : { email: authUser.email },
        select: { id: true, organizationId: true },
      });
      if (dbUser) {
        targetOrgId = dbUser.organizationId;
        targetUserId = dbUser.id;
      }
    }

    // Check Plan Limits via centralized checkDiagramQuota
    const quota = await checkDiagramQuota(targetOrgId);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Limite do plano ${quota.plan.toUpperCase()} atingido (máx. ${quota.maxAllowed} diagramas). Faça upgrade para criar diagramas ilimitados.`,
          code: 'PLAN_LIMIT_REACHED',
          currentCount: quota.currentCount,
          limit: quota.maxAllowed,
        },
        { status: 402 } // Payment Required
      );
    }

    const body = await req.json();
    const validated = CreateDiagramSchema.parse(body);

    const nodeCount = Array.isArray(validated.data.nodes) ? validated.data.nodes.length : 0;

    const result = await prisma.$transaction(async (tx) => {
      const diagram = await tx.diagram.create({
        data: {
          name: validated.name,
          description: validated.description,
          type: validated.type,
          data: validated.data as any,
          nodeCount,
          isPublic: validated.isPublic,
          thumbnailUrl: validated.thumbnailUrl,
          organizationId: targetOrgId,
          createdBy: targetUserId,
        },
      });

      // Save initial version (v1)
      await tx.diagramVersion.create({
        data: {
          diagramId: diagram.id,
          version: 1,
          data: validated.data as any,
          createdBy: targetUserId,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: targetUserId,
          orgId: targetOrgId,
          action: 'diagram.create',
          resourceId: diagram.id,
          metadata: { name: diagram.name, nodeCount },
        },
      });

      return diagram;
    });

    return NextResponse.json({ success: true, diagram: result }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues?.[0]?.message || 'Invalid input data' }, { status: 400 });
    }
    console.error('[Diagrams Create Error]:', error);
    return NextResponse.json({ error: 'Failed to create diagram' }, { status: 500 });
  }
}
