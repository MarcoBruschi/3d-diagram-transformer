import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { redis } from '@/lib/server/redis';
import { checkPlanRateLimit } from '@/lib/server/ratelimit';

const SingleMetricSchema = z.object({
  diagramId: z.string().uuid(),
  nodeId: z.string().min(1),
  metricName: z.string().min(1).max(100),
  value: z.number(),
  unit: z.string().max(20).optional(),
  status: z.enum(['healthy', 'warning', 'critical', 'offline']).default('healthy'),
});

const IngestPayloadSchema = z.union([
  SingleMetricSchema,
  z.object({
    metrics: z.array(SingleMetricSchema).min(1),
  }),
  z.array(SingleMetricSchema).min(1),
]);

// POST /api/telemetry/ingest - Webhook receiver for Datadog, Prometheus, Grafana
export async function POST(req: NextRequest) {
  try {
    const apiKey =
      req.headers.get('X-Telemetry-Key') ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing X-Telemetry-Key header' }, { status: 401 });
    }

    const source = await prisma.telemetrySource.findUnique({
      where: { apiKey },
      include: { organization: true },
    });

    if (!source) {
      return NextResponse.json({ error: 'Invalid telemetry API key' }, { status: 403 });
    }

    const rateCheck = await checkPlanRateLimit(source.id, source.organizationId, 'telemetry');
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const rawBody = await req.json();
    const parsed = IngestPayloadSchema.parse(rawBody);

    // Normalize to array of metrics
    let metricsToProcess: z.infer<typeof SingleMetricSchema>[] = [];
    if (Array.isArray(parsed)) {
      metricsToProcess = parsed;
    } else if ('metrics' in parsed) {
      metricsToProcess = parsed.metrics;
    } else {
      metricsToProcess = [parsed];
    }

    if (metricsToProcess.length === 0) {
      return NextResponse.json({ success: true, processed: 0, metrics: [] });
    }

    // Batch diagram validation: query all distinct diagrams in a single query instead of N+1
    const distinctDiagramIds = [...new Set(metricsToProcess.map((m) => m.diagramId))];
    const validDiagrams = await prisma.diagram.findMany({
      where: {
        id: { in: distinctDiagramIds },
        organizationId: source.organizationId,
      },
      select: { id: true },
    });

    const validDiagramIds = new Set(validDiagrams.map((d) => d.id));
    const authorizedMetrics = metricsToProcess.filter((m) => validDiagramIds.has(m.diagramId));

    if (authorizedMetrics.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        metrics: [],
      });
    }

    // Deduplicate metrics by compound key within the same batch (keeping the most recent)
    const deduplicatedMetricsMap = new Map<string, z.infer<typeof SingleMetricSchema>>();
    for (const m of authorizedMetrics) {
      const compoundKey = `${m.diagramId}:${m.nodeId}:${m.metricName}`;
      deduplicatedMetricsMap.set(compoundKey, m);
    }
    const metricsToUpsert = Array.from(deduplicatedMetricsMap.values());

    // Batch upsert via prisma.$transaction to avoid sequential roundtrips
    const upsertOperations = metricsToUpsert.map((data) =>
      prisma.nodeMetric.upsert({
        where: {
          diagramId_nodeId_metricName: {
            diagramId: data.diagramId,
            nodeId: data.nodeId,
            metricName: data.metricName,
          },
        },
        create: {
          diagramId: data.diagramId,
          nodeId: data.nodeId,
          metricName: data.metricName,
          value: data.value,
          unit: data.unit,
          status: data.status,
        },
        update: {
          value: data.value,
          unit: data.unit,
          status: data.status,
        },
      })
    );

    const results = await prisma.$transaction(upsertOperations);

    // Broadcast into Redis for instant live 3D updates
    try {
      const broadcastPromises = metricsToUpsert.map(async (data) => {
        const payload = JSON.stringify({
          diagramId: data.diagramId,
          nodeId: data.nodeId,
          metricName: data.metricName,
          value: data.value,
          unit: data.unit,
          status: data.status,
          timestamp: Date.now(),
        });

        const roomChannel = `telemetry:${data.diagramId}`;
        await redis.set(`live_metric:${data.diagramId}:${data.nodeId}`, payload, 'EX', 3600);

        if (typeof (redis as any).publish === 'function') {
          await (redis as any).publish(roomChannel, payload);
          await (redis as any).publish('telemetry-feed', payload);
        }
      });

      await Promise.allSettled(broadcastPromises);
    } catch (err) {
      console.warn('[Telemetry] Redis live broadcast error:', err);
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      metrics: results,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues?.[0]?.message || 'Invalid metric payload' }, { status: 400 });
    }
    console.error('[Telemetry Ingest Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
