import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClerkIdentity } from "@/lib/auth";
import { publicUser } from "@/lib/user";
import { AVATARS } from "@/lib/constants";
import { sendWelcomeEmail } from "@/lib/email";

// POST /api/profile -> create the Sparkle profile for the signed-in Clerk user.
// body: { name, age, avatar }
export async function POST(req: Request) {
  const id = await getClerkIdentity();
  if (!id) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  // Already has a profile? Return it.
  const existing = await prisma.user.findUnique({ where: { clerkId: id.userId } });
  if (existing) return NextResponse.json({ user: publicUser(existing) });

  const body = await req.json().catch(() => ({}));
  const name = (body.name || "").trim();
  if (!name || name.length < 2 || name.length > 16)
    return NextResponse.json({ error: "Pick a nickname (2–16 letters)." }, { status: 400 });

  const taken = await prisma.user.findUnique({ where: { name } });
  if (taken) return NextResponse.json({ error: "That nickname is taken — try another!" }, { status: 409 });

  const age = Math.min(20, Math.max(5, Number(body.age) || 10));
  const avatar = AVATARS.includes(body.avatar) ? body.avatar : "🦊";

  const user = await prisma.user.create({
    data: { name, age, avatar, clerkId: id.userId, email: id.email },
  });
  if (id.email) sendWelcomeEmail(id.email, name); // fire-and-forget
  return NextResponse.json({ user: publicUser(user) });
}
