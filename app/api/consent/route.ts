import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { publicUser } from "@/lib/user";

// POST /api/consent -> record parental/guardian consent for the current child.
// body: { parentEmail }
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parentEmail = String(body.parentEmail || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(parentEmail))
    return NextResponse.json({ error: "Please enter a valid grown-up's email." }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { parentEmail, consentAt: new Date() },
  });

  return NextResponse.json({ user: publicUser(updated) });
}
