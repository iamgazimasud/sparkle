import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/report -> file a safety report
// body: { projectId?, commentId?, targetUserId?, reason }
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const reason = String(body.reason || "").trim().slice(0, 300) || "Reported";
  const projectId = body.projectId ? String(body.projectId) : null;
  const commentId = body.commentId ? String(body.commentId) : null;
  const targetUserId = body.targetUserId ? String(body.targetUserId) : null;

  if (!projectId && !commentId && !targetUserId)
    return NextResponse.json({ error: "Nothing to report." }, { status: 400 });

  await prisma.report.create({
    data: { reason, reporterId: user.id, projectId, commentId, targetUserId },
  });

  return NextResponse.json({ ok: true });
}
