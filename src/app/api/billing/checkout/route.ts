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
      return NextResponse.json({ error: 'Apenas administradores do workspace podem gerenciar assinaturas' }, { status: 403 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: authUser.organizationId },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { priceId, billingCycle = 'monthly', plan = 'pro', successUrl, cancelUrl } = body;

    // Enterprise plan is disabled for now as requested
    if (plan === 'enterprise') {
      return NextResponse.json(
        { error: 'O plano Enterprise está desabilitado temporariamente para checkout automatizado. Entre em contato com a equipe comercial.' },
        { status: 400 }
      );
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: authUser.email,
        name: org.name,
        metadata: {
          organizationId: org.id,
        },
      });
      customerId = customer.id;

      await prisma.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Resolve actual Stripe price ID based on billing cycle (Monthly R$ 89 vs Yearly R$ 69/mo)
    const isRealStripePrice = (id?: string) => typeof id === 'string' && id.startsWith('price_') && id.length > 20;

    let targetPriceId: string | undefined;
    if (isRealStripePrice(priceId)) {
      targetPriceId = priceId;
    } else if (billingCycle === 'yearly') {
      targetPriceId =
        process.env.STRIPE_PRICE_PRO_YEARLY ||
        process.env.STRIPE_PRO_YEARLY_PRICE_ID ||
        process.env.STRIPE_PRO_PRICE_ID;
    } else {
      // monthly
      targetPriceId =
        process.env.STRIPE_PRICE_PRO_MONTHLY ||
        process.env.STRIPE_PRO_MONTHLY_PRICE_ID ||
        process.env.STRIPE_PRO_PRICE_ID;
    }

    const finalPriceId = targetPriceId || 'price_1UJIht1nSQDZtJkjPyFZ5zYK';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: authUser.organizationId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      // Pass session_id so frontend can instantly synchronize plan on return without waiting for webhook
      success_url: successUrl || `${origin}/studio?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${origin}/studio?billing=canceled`,
      metadata: {
        organizationId: org.id,
        userId: authUser.userId,
        billingCycle,
        plan: 'pro',
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('[Billing Checkout Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to create checkout session' }, { status: 500 });
  }
}
