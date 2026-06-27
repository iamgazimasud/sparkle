import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";

// Stripe calls this when a subscription is created, paid, or cancelled.
// Configure it in the Stripe dashboard: Webhooks -> add endpoint -> /api/stripe/webhook
export async function POST(req: Request) {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text(); // raw body required for signature verification
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 });
  }

  async function setPlan(customerId: string, plan: "free" | "pro") {
    await prisma.user.updateMany({ where: { stripeCustomerId: customerId }, data: { plan } });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
      // Prefer client_reference_id (our user id) so the very first upgrade always lands.
      if (s.client_reference_id) {
        await prisma.user.update({
          where: { id: s.client_reference_id },
          data: { plan: "pro", stripeCustomerId: customerId ?? undefined },
        }).catch(() => {});
      } else if (customerId) {
        await setPlan(customerId, "pro");
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const active = sub.status === "active" || sub.status === "trialing";
      await setPlan(customerId, active ? "pro" : "free");
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      await setPlan(customerId, "free");
      break;
    }
  }

  return NextResponse.json({ received: true });
}
