import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { stripe, stripeEnabled, STRIPE_PRICE_ID, appUrl } from "@/lib/stripe";

// POST /api/stripe/checkout -> returns a Stripe Checkout URL for the Pro plan.
export async function POST() {
  if (!stripe || !stripeEnabled) {
    return NextResponse.json({ error: "Payments aren't switched on yet. ✨ Coming soon!" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  // Reuse or create a Stripe customer for this account.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      metadata: { userId: user.id, nickname: user.name },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${appUrl()}/?pro=success`,
    cancel_url: `${appUrl()}/?pro=cancel`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
