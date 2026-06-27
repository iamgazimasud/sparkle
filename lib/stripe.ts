import Stripe from "stripe";

// Stripe is optional: the app runs fine without keys (the "Go Pro" button just shows
// "coming soon"). Set STRIPE_SECRET_KEY in .env / Vercel to turn payments on.
const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key ? new Stripe(key) : null;
export const stripeEnabled = !!stripe && !!process.env.STRIPE_PRICE_ID;

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

export function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
    "http://localhost:4321"
  );
}
