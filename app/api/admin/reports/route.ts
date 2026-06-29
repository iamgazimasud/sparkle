import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdmin } from "@/lib/admin";

// GET /api/admin/reports?status=open -> list reports (admin only)
export async function GET(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const status = new URL(req.url).searchParams.get("status") || "open";

  const reports = await prisma.report.findMany({
    where: status === "all" ? {} : { status },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      reporter: { select: { name: true, avatar: true } },
      project: { select: { id: true, title: true, hidden: true, author: { select: { id: true, name: true, isBanned: true } } } },
      comment: { select: { id: true, text: true, hidden: true, author: { select: { id: true, name: true, isBanned: true } } } },
    },
  });

  return NextResponse.json({
    reports: reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      reporter: r.reporter,
      kind: r.projectId ? "project" : r.commentId ? "comment" : "user",
      project: r.project,
      comment: r.comment,
      targetUserId: r.targetUserId,
    })),
  });
}
