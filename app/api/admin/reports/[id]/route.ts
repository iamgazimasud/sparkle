import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdmin } from "@/lib/admin";

// POST /api/admin/reports/[id] -> act on a report (admin only)
// body: { action: "hide" | "unhide" | "ban" | "dismiss" | "resolve" }
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const { id } = await ctx.params;
  const { action } = await req.json().catch(() => ({}));

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });

  switch (action) {
    case "hide":
      if (report.projectId) await prisma.project.update({ where: { id: report.projectId }, data: { hidden: true } });
      if (report.commentId) await prisma.comment.update({ where: { id: report.commentId }, data: { hidden: true } });
      await prisma.report.update({ where: { id }, data: { status: "resolved" } });
      break;
    case "unhide":
      if (report.projectId) await prisma.project.update({ where: { id: report.projectId }, data: { hidden: false } });
      if (report.commentId) await prisma.comment.update({ where: { id: report.commentId }, data: { hidden: false } });
      break;
    case "ban": {
      // Ban the author of the reported content (or the reported user).
      let userId = report.targetUserId;
      if (!userId && report.projectId) {
        const p = await prisma.project.findUnique({ where: { id: report.projectId }, select: { authorId: true } });
        userId = p?.authorId ?? null;
      }
      if (!userId && report.commentId) {
        const c = await prisma.comment.findUnique({ where: { id: report.commentId }, select: { authorId: true } });
        userId = c?.authorId ?? null;
      }
      if (userId && userId !== admin.id) await prisma.user.update({ where: { id: userId }, data: { isBanned: true } });
      await prisma.report.update({ where: { id }, data: { status: "resolved" } });
      break;
    }
    case "dismiss":
      await prisma.report.update({ where: { id }, data: { status: "dismissed" } });
      break;
    case "resolve":
      await prisma.report.update({ where: { id }, data: { status: "resolved" } });
      break;
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
