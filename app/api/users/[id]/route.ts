import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getProjects } from "@/lib/shape";

// GET /api/users/[id] -> a maker's public profile + their projects
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const viewer = await getCurrentUser();

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, avatar: true, age: true, sparks: true, plan: true, isBanned: true, createdAt: true },
  });
  if (!user || user.isBanned) return NextResponse.json({ error: "Maker not found." }, { status: 404 });

  const projects = await getProjects({ authorId: id, viewerId: viewer?.id ?? null });
  const commentsMade = await prisma.comment.count({ where: { authorId: id, hidden: false } });

  return NextResponse.json({
    user: { id: user.id, name: user.name, avatar: user.avatar, age: user.age, sparks: user.sparks, plan: user.plan },
    projects,
    commentsMade,
  });
}
