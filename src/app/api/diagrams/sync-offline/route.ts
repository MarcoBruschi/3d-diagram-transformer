import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/ratelimit';
import { checkDiagramQuota } from '@/lib/server/stripe';

export const dynamic = 'force-dynamic';

/**
 * Deep recursive validation to block Prototype Pollution payloads (__proto__, constructor, prototype)
 */
function containsPrototypePollution(value: any): boolean {
  if (!value || typeof value !== 'object') return false;

  if (Array.isArray(value)) {
    return value.some(containsPrototypePollution);
  }

  const keys = Array.from(new Set([...Object.keys(value), ...Object.getOwnPropertyNames(value)]));
  for (const key of keys) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true;
    }
    if (containsPrototypePollution(value[key])) {
      return true;
    }
  }

  return false;
}

const DraftNodeSchema = z
  .object({
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
  })
  .strict();

const DraftConnectionSchema = z
  .object({
    id: z.string().min(1).max(100),
    source: z.string().min(1).max(100),
    target: z.string().min(1).max(100),
    type: z.string().max(100).default('sync'),
    label: z.string().max(100).optional(),
    protocol: z.string().max(100).optional(),
    style: z.string().max(50).optional(),
    description: z.string().max(500).optional(),
  })
  .strict();

const DiagramDraftSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, 'Nome do rascunho é obrigatório').max(255),
    description: z.string().max(1000).optional(),
    type: z.string().max(100).default('custom'),
    data: z.any().default({ nodes: [], connections: [] }),
    clientUpdatedAt: z.string().optional(),
  });

const SyncOfflineRequestSchema = z
  .object({
    drafts: z
      .array(DiagramDraftSchema)
      .min(1, 'Pelo menos um rascunho deve ser enviado para sincronização'),
  });

export async function POST(req: NextRequest) {
  try {
    // 1. Strict Authentication Enforcement
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Autenticação necessária para sincronizar rascunhos offline.' },
        { status: 401 }
      );
    }

    // Role-based Access Control: Viewers cannot create or mutate diagrams
    if (authUser.role === 'viewer') {
      return NextResponse.json(
        { error: 'Visualizadores não possuem permissão para sincronizar alterações em diagramas.' },
        { status: 403 }
      );
    }

    // 2. Rate Limiting per User
    const rateCheck = await checkRateLimit(authUser.userId, 'diagrams-sync-offline', 20, 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Muitas tentativas de sincronização offline. Aguarde um momento antes de reenviar.' },
        { status: 429 }
      );
    }

    const rawBody = await req.json();

    // 3. Strict Prototype Pollution Defense
    if (containsPrototypePollution(rawBody)) {
      return NextResponse.json(
        { error: 'Tentativa de Prototype Pollution detectada no payload de sincronização.' },
        { status: 400 }
      );
    }

    // 4. Strict Zod Schema Validation
    const { drafts } = SyncOfflineRequestSchema.parse(rawBody);

    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    let targetOrgId = authUser.organizationId;
    if (!UUID_REGEX.test(targetOrgId)) {
      const dbUser = await prisma.user.findFirst({
        where: UUID_REGEX.test(authUser.userId) ? { id: authUser.userId } : { email: authUser.email },
        select: { organizationId: true },
      });
      if (dbUser?.organizationId) targetOrgId = dbUser.organizationId;
    }

    // 5. Pre-check quotas for new diagrams vs existing diagram updates
    const draftIds = drafts.map((d) => d.id).filter(Boolean) as string[];
    const existingDiagrams = await prisma.diagram.findMany({
      where: {
        id: { in: draftIds },
        organizationId: targetOrgId,
      },
      select: { id: true },
    });
    const existingIdSet = new Set(existingDiagrams.map((d) => d.id));

    // Calculate how many drafts represent brand new diagram creations
    const newDiagramsCount = drafts.filter((d) => !d.id || !existingIdSet.has(d.id)).length;

    if (newDiagramsCount > 0) {
      const quota = await checkDiagramQuota(targetOrgId);
      if (quota.currentCount + newDiagramsCount > quota.maxAllowed) {
        return NextResponse.json(
          {
            error: `A sincronização excede o limite de diagramas permitido pelo seu plano (${quota.currentCount}/${quota.maxAllowed} diagramas no plano ${quota.plan.toUpperCase()}). Faça upgrade para sincronizar diagramas ilimitados.`,
            code: 'PLAN_LIMIT_REACHED',
            currentCount: quota.currentCount,
            attemptedNew: newDiagramsCount,
            maxAllowed: quota.maxAllowed,
            plan: quota.plan,
          },
          { status: 402 }
        );
      }
    }

    // 6. Process synchronization in an atomic database transaction
    const results = await prisma.$transaction(async (tx) => {
      const syncedDiagrams = [];

      for (const draft of drafts) {
        let diagram;
        const nodeCount = Array.isArray(draft.data?.nodes) ? draft.data.nodes.length : 0;

        if (draft.id && existingIdSet.has(draft.id)) {
          // Update existing diagram
          diagram = await tx.diagram.update({
            where: { id: draft.id },
            data: {
              name: draft.name,
              description: draft.description,
              type: draft.type,
              data: draft.data,
              nodeCount,
            },
          });
        } else {
          // Create new diagram
          diagram = await tx.diagram.create({
            data: {
              organizationId: targetOrgId,
              createdBy: authUser.userId,
              name: draft.name,
              description: draft.description,
              type: draft.type,
              data: draft.data,
              nodeCount,
              isPublic: false,
            },
          });

          // Create initial version (v1)
          await tx.diagramVersion.create({
            data: {
              diagramId: diagram.id,
              version: 1,
              data: draft.data,
              createdBy: authUser.userId,
            },
          });
        }

        syncedDiagrams.push(diagram);
      }

      await tx.auditLog.create({
        data: {
          userId: authUser.userId,
          orgId: targetOrgId,
          action: 'diagram.sync_offline',
          metadata: {
            totalDrafts: drafts.length,
            newCount: newDiagramsCount,
            updatedCount: drafts.length - newDiagramsCount,
          },
        },
      });

      return syncedDiagrams;
    });

    const syncedDiagramsSummary = results.map((d) => ({
      id: d.id,
      name: d.name,
      createdAt: d.createdAt,
    }));

    return NextResponse.json({
      success: true,
      syncedDiagrams: syncedDiagramsSummary,
      diagrams: results,
      message: `${results.length} rascunho(s) sincronizado(s) com sucesso na nuvem.`,
      syncedCount: results.length,
      createdCount: newDiagramsCount,
      updatedCount: results.length - newDiagramsCount,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Dados de sincronização offline inválidos.' },
        { status: 400 }
      );
    }
    console.error('[Sync Offline Error]:', error);
    return NextResponse.json(
      { error: 'Falha interna ao sincronizar rascunhos offline.' },
      { status: 500 }
    );
  }
}
