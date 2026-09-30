import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';
import { stripe } from '@/lib/server/stripe';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem gerenciar o faturamento.' }, { status: 403 });
    }

    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    let targetOrgId = authUser.organizationId;
    if (!UUID_REGEX.test(targetOrgId)) {
      const dbUser = await prisma.user.findFirst({
        where: UUID_REGEX.test(authUser.userId) ? { id: authUser.userId } : { email: authUser.email },
        select: { organizationId: true },
      });
      if (dbUser?.organizationId) targetOrgId = dbUser.organizationId;
    }

    const org = await prisma.organization.findUnique({
      where: { id: targetOrgId },
    });

    if (!org || !org.stripeCustomerId) {
      return NextResponse.json({ error: 'No active billing customer found' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${origin}/studio`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('[Billing Portal Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to open billing portal' }, { status: 500 });
  }
}
