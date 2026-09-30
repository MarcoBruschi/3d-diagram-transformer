import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';
import { stripe } from '@/lib/server/stripe';

export const dynamic = 'force-dynamic';

/**
 * POST /api/billing/sync
 * Instantly synchronizes the user's workspace plan directly from Stripe after checkout return,
 * avoiding any latency or delivery failure from webhooks.
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { sessionId } = body;

    const org = await prisma.organization.findUnique({
      where: { id: authUser.organizationId },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // 1. If sessionId is provided (from redirect: /studio?billing=success&session_id=cs_...)
    if (sessionId && typeof sessionId === 'string' && sessionId.startsWith('cs_')) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer'],
      });

      const sessionOrgId = session.metadata?.organizationId || session.client_reference_id;
      const isOwner = sessionOrgId === org.id || (session.customer as any)?.email === authUser.email;

      if (!isOwner) {
        return NextResponse.json({ error: 'Checkout session does not belong to this workspace' }, { status: 403 });
      }

      const isPaid = session.payment_status === 'paid' || session.status === 'complete';
      if (isPaid) {
        const subId = typeof session.subscription === 'string'
          ? session.subscription
          : (session.subscription as any)?.id || null;

        const custId = typeof session.customer === 'string'
          ? session.customer
          : (session.customer as any)?.id || org.stripeCustomerId;

        await prisma.organization.update({
          where: { id: org.id },
          data: {
            plan: 'pro',
            subscriptionStatus: 'active',
            subscriptionId: subId,
            stripeCustomerId: custId,
          },
        });

        await prisma.auditLog.create({
          data: {
            orgId: org.id,
            userId: authUser.userId,
            action: 'billing.sync_upgrade_pro',
            metadata: { sessionId, subId, trigger: 'checkout_redirect_sync' },
          },
        });

        return NextResponse.json({
          success: true,
          plan: 'pro',
          message: 'Plano Pro Architect ativado com sucesso!',
        });
      }
    }

    // 2. Fallback: check customer active subscriptions directly on Stripe if customerId exists
    if (org.stripeCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: org.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const activeSub = subscriptions.data[0] as any;
        const periodEnd = activeSub.current_period_end
          ? new Date(activeSub.current_period_end * 1000)
          : null;

        await prisma.organization.update({
          where: { id: org.id },
          data: {
            plan: 'pro',
            subscriptionStatus: 'active',
            subscriptionId: activeSub.id,
            ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
          },
        });

        return NextResponse.json({
          success: true,
          plan: 'pro',
          message: 'Assinatura ativa confirmada junto ao Stripe.',
        });
      }
    }

    return NextResponse.json({
      success: false,
      plan: org.plan,
      message: 'Nenhuma assinatura ativa encontrada para sincronização.',
    });
  } catch (error: any) {
    console.error('[Billing Sync Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync billing status' }, { status: 500 });
  }
}
