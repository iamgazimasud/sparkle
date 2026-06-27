// Clerk is the auth system. The app still boots WITHOUT keys (showing a "finish
// setup" screen) so you can run/preview it before wiring Clerk up. Add the two keys
// in .env / Vercel to switch real login on. See LAUNCH.md.
export const clerkEnabled =
  !!process.env.CLERK_SECRET_KEY && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Client components can't read server env, so expose the publishable-key presence
// (the publishable key is safe to expose — that's its purpose).
export const clerkEnabledPublic = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
