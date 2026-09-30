import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';
import { checkPlanFeature } from '@/lib/server/stripe';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const CreateSourceSchema = z.object({
  name: z.string().min(2).max(100),
});

// GET /api/telemetry/sources - List telemetry ingestion keys
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let targetOrgId = authUser.organizationId;
    if (!UUID_REGEX.test(targetOrgId)) {
      const dbUser = await prisma.user.findFirst({
        where: UUID_REGEX.test(authUser.userId) ? { id: authUser.userId } : { email: authUser.email },
        select: { organizationId: true },
      });
      if (dbUser?.organizationId) targetOrgId = dbUser.organizationId;
    }

    const check = await checkPlanFeature(targetOrgId, 'canUseTelemetry');
    if (!check.allowed) {
      return NextResponse.json(
        { sources: [], isPro: check.allowed, plan: check.plan },
        { status: 200 }
      );
    }

    const sources = await prisma.telemetrySource.findMany({
      where: { organizationId: targetOrgId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ sources, isPro: check.allowed, plan: check.plan });
  } catch (error) {
    console.error('[Telemetry Sources GET Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch telemetry sources' }, { status: 500 });
  }
}

// POST /api/telemetry/sources - Create a new telemetry API key
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role === 'viewer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let targetOrgId = authUser.organizationId;
    if (!UUID_REGEX.test(targetOrgId)) {
      const dbUser = await prisma.user.findFirst({
        where: UUID_REGEX.test(authUser.userId) ? { id: authUser.userId } : { email: authUser.email },
        select: { organizationId: true },
      });
      if (dbUser?.organizationId) targetOrgId = dbUser.organizationId;
    }

    const check = await checkPlanFeature(targetOrgId, 'canUseTelemetry');
    if (!check.allowed) {
      return NextResponse.json(
        {
          error: 'Fontes de telemetria e Live Ops requerem plano Pro ou superior.',
          code: 'FEATURE_GATED_PLAN',
          currentPlan: check.plan,
          requiredPlan: 'pro',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name } = CreateSourceSchema.parse(body);

    const apiKey = `diag_tel_${crypto.randomBytes(24).toString('hex')}`;

    const source = await prisma.telemetrySource.create({
      data: {
        organizationId: targetOrgId,
        name,
        apiKey,
      },
    });

    return NextResponse.json({ success: true, source }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues?.[0]?.message || 'Invalid input' }, { status: 400 });
    }
    console.error('[Telemetry Sources POST Error]:', error);
    return NextResponse.json({ error: 'Failed to create telemetry source' }, { status: 500 });
  }
}

// DELETE /api/telemetry/sources?id=... - Revoke/Delete telemetry API key
export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role === 'viewer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let targetOrgId = authUser.organizationId;
    if (!UUID_REGEX.test(targetOrgId)) {
      const dbUser = await prisma.user.findFirst({
        where: UUID_REGEX.test(authUser.userId) ? { id: authUser.userId } : { email: authUser.email },
        select: { organizationId: true },
      });
      if (dbUser?.organizationId) targetOrgId = dbUser.organizationId;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.telemetrySource.deleteMany({
      where: {
        id,
        organizationId: targetOrgId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Telemetry Sources DELETE Error]:', error);
    return NextResponse.json({ error: 'Failed to delete telemetry source' }, { status: 500 });
  }
}
