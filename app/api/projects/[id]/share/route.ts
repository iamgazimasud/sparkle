import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { interactionBlock } from "@/lib/guard";
import { SPARKS } from "@/lib/constants";
import { COMMUNITY } from "@/lib/score";

// POST /api/projects/[id]/share -> toggle a re-share of a project to your feed.
// body: { message? }
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const block = interactionBlock(user);
  if (block) return NextResponse.json({ error: block.error, code: block.code }, { status: block.status });

  const { id } = await ctx.params;
  const project = await prisma.project.findUnique({ where: { id }, select: { authorId: true } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const message = String(body.message || "").trim().slice(0, 200) || null;

  const existing = await prisma.share.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: id } },
  });

  let shared: boolean;
  if (existing) {
    await prisma.share.delete({ where: { id: existing.id } });
    shared = false;
  } else {
    await prisma.share.create({ data: { userId: user.id, projectId: id, message } });
    shared = true;
    await prisma.user.update({ where: { id: user.id }, data: { sparks: { increment: SPARKS.like } } });
    if (project.authorId !== user.id)
      await prisma.user.update({ where: { id: project.authorId }, data: { sparks: { increment: COMMUNITY.commentReceived } } });
  }

  const shares = await prisma.share.count({ where: { projectId: id } });
  return NextResponse.json({ shared, shares });
}
