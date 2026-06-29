import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isKind, SPARKS } from "@/lib/constants";
import { COMMUNITY } from "@/lib/score";
import { interactionBlock } from "@/lib/guard";

// POST /api/projects/[id]/comments -> add a comment
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const block = interactionBlock(user);
  if (block) return NextResponse.json({ error: block.error, code: block.code }, { status: block.status });

  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const text = String(body.text || "").trim();
  if (!text || text.length > 140)
    return NextResponse.json({ error: "Write something (max 140)." }, { status: 400 });
  if (!isKind(text))
    return NextResponse.json({ error: "Let's keep Sparkle kind! 💛 Try something nice." }, { status: 400 });

  const project = await prisma.project.findUnique({ where: { id }, select: { id: true, authorId: true } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { text, authorId: user.id, projectId: id },
    include: { author: { select: { name: true, avatar: true } } },
  });
  // The commenter earns for being kind; the creator earns for their project sparking talk.
  await prisma.user.update({ where: { id: user.id }, data: { sparks: { increment: SPARKS.comment } } });
  if (project.authorId !== user.id)
    await prisma.user.update({
      where: { id: project.authorId },
      data: { sparks: { increment: COMMUNITY.commentReceived } },
    });

  return NextResponse.json({
    comment: {
      id: comment.id,
      text: comment.text,
      author: comment.author,
      authorId: user.id,
      createdAt: comment.createdAt.toISOString(),
    },
  });
}
