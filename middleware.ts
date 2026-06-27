import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// When Clerk keys are present, run Clerk's middleware (required for auth() to work).
// When they're absent, pass through so the app still boots for local preview.
const enabled = !!process.env.CLERK_SECRET_KEY;

export default enabled ? clerkMiddleware() : () => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ico|webp|woff2?|ttf)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
