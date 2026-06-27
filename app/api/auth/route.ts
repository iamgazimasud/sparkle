import { NextResponse } from "next/server";
import { getCurrentUser, getClerkUserId } from "@/lib/auth";
import { publicUser } from "@/lib/user";

// GET /api/auth -> who am I?
//   { authed: false }                          -> show landing / sign-in
//   { authed: true, user: null }               -> signed in, needs to make a profile
//   { authed: true, user: {...} }              -> ready to use the app
export async function GET() {
  const userId = await getClerkUserId();
  if (!userId) return NextResponse.json({ authed: false, user: null });
  const user = await getCurrentUser();
  return NextResponse.json({ authed: true, user: user ? publicUser(user) : null });
}
