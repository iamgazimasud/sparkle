import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/block -> block or unblock a user
// body: { userId, action: "block" | "unblock" }
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const blockedId = String(body.userId || "");
  const action = body.action === "unblock" ? "unblock" : "block";
  if (!blockedId) return NextResponse.json({ error: "Who do you want to block?" }, { status: 400 });
  if (blockedId === user.id) return NextResponse.json({ error: "You can't block yourself." }, { status: 400 });

  if (action === "block") {
    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId } },
      update: {},
      create: { blockerId: user.id, blockedId },
    });
  } else {
    await prisma.block.deleteMany({ where: { blockerId: user.id, blockedId } });
  }

  return NextResponse.json({ ok: true, blocked: action === "block" });
}
