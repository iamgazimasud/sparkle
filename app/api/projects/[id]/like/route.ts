import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SPARKS } from "@/lib/constants";

// POST /api/projects/[id]/like -> toggle like
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const { id } = await ctx.params;

  const project = await prisma.project.findUnique({ where: { id }, select: { authorId: true } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.like.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: id } },
  });

  let liked: boolean;
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.like.create({ data: { userId: user.id, projectId: id } });
    liked = true;
    // The viewer earns a spark for engaging; the creator earns one for being loved.
    await prisma.user.update({ where: { id: user.id }, data: { sparks: { increment: SPARKS.like } } });
    if (project.authorId !== user.id)
      await prisma.user.update({ where: { id: project.authorId }, data: { sparks: { increment: SPARKS.like } } });
  }

  const count = await prisma.like.count({ where: { projectId: id } });
  return NextResponse.json({ liked, likes: count });
}
