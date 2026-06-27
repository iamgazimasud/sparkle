import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPin, verifyPin, setSession, clearSession, getCurrentUser } from "@/lib/auth";
import { AVATARS } from "@/lib/constants";

// GET /api/auth -> current user (or null)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  const { pinHash, ...safe } = user;
  return NextResponse.json({ user: safe });
}

// POST /api/auth -> signup or login
// body: { action: "signup"|"login"|"logout", name, pin, age?, avatar? }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (action === "logout") {
    await clearSession();
    return NextResponse.json({ ok: true });
  }

  const name = (body.name || "").trim();
  const pin = (body.pin || "").trim();

  if (!name || name.length < 2 || name.length > 16)
    return NextResponse.json({ error: "Pick a nickname (2–16 letters)." }, { status: 400 });
  if (!/^\d{4}$/.test(pin))
    return NextResponse.json({ error: "Your secret PIN must be 4 numbers." }, { status: 400 });

  if (action === "signup") {
    const existing = await prisma.user.findUnique({ where: { name } });
    if (existing) return NextResponse.json({ error: "That nickname is taken — try another!" }, { status: 409 });

    const age = Math.min(17, Math.max(5, Number(body.age) || 10));
    const avatar = AVATARS.includes(body.avatar) ? body.avatar : "🦊";

    const user = await prisma.user.create({
      data: { name, age, avatar, pinHash: hashPin(pin) },
    });
    await setSession(user.id);
    const { pinHash, ...safe } = user;
    return NextResponse.json({ user: safe });
  }

  if (action === "login") {
    const user = await prisma.user.findUnique({ where: { name } });
    if (!user || !verifyPin(pin, user.pinHash))
      return NextResponse.json({ error: "Wrong nickname or PIN." }, { status: 401 });
    await setSession(user.id);
    const { pinHash, ...safe } = user;
    return NextResponse.json({ user: safe });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
