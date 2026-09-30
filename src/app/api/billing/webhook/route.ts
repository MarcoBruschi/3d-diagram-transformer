import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/server/stripe';
import { prisma } from '@/lib/server/db';
import Stripe from 'stripe';
import { isIdempotentProcessed, markIdempotentProcessed } from '@/lib/server/idempotency';
import { invalidateOrgPlanCache } from '@/lib/server/cache';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  if (process.env.NODE_ENV === 'production') {
    if (!signature || !STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header or STRIPE_WEBHOOK_SECRET in production' },
        { status: 400 }
      );
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('[Stripe Webhook Signature Error]:', err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }
  } else {
    if (!STRIPE_WEBHOOK_SECRET) {
      try {
        event = JSON.parse(body) as Stripe.Event;
      } catch (err: any) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
      }
    } else {
      if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
      }
      try {
        event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
      } catch (err: any) {
        console.error('[Stripe Webhook Signature Error]:', err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
      }
    }
  }

  // Idempotency check: prevent duplicate execution of same Stripe event
  if (event?.id) {
    const alreadyProcessed = await isIdempotentProcessed(event.id);
    if (alreadyProcessed) {
      return NextResponse.json({ received: true, deduplicated: true });
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.organizationId;
        if (orgId) {
          await prisma.organization.update({
            where: { id: orgId },
            data: {
              plan: 'pro',
              subscriptionStatus: 'active',
              subscriptionId: session.subscription as string,
              ...(session.customer ? { stripeCustomerId: session.customer as string } : {}),
            },
          });

          await prisma.auditLog.create({
            data: {
              orgId,
              action: 'billing.upgrade_pro',
              metadata: { sessionId: session.id },
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;

        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { subscriptionStatus: 'past_due' },
          });

          await prisma.auditLog.create({
            data: {
              orgId: org.id,
              action: 'billing.payment_failed',
              metadata: { invoiceId: invoice.id },
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (org) {
          const status = subscription.status; // 'active', 'past_due', 'canceled'
          const plan = status === 'active' ? 'pro' : 'free';

          await prisma.organization.update({
            where: { id: org.id },
            data: {
              subscriptionStatus: status,
              plan,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              plan: 'free',
              subscriptionStatus: 'canceled',
            },
          });

          await prisma.auditLog.create({
            data: {
              orgId: org.id,
              action: 'billing.downgrade_free',
              metadata: { subscriptionId: subscription.id },
            },
          });
        }
        break;
      }

      default:
        // Unhandled event
        break;
    }

    if (event?.id) {
      await markIdempotentProcessed(event.id);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook Processing Error]:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
