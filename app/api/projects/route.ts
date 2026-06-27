import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getProjects } from "@/lib/shape";
import { isKind, ytId, CATS, ART_EMOJIS, SPARKS } from "@/lib/constants";

// GET /api/projects?type=art&author=<id>
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "all";
  const authorId = searchParams.get("author") || undefined;
  const viewer = await getCurrentUser();
  const projects = await getProjects({ type, authorId, viewerId: viewer?.id ?? null });
  return NextResponse.json({ projects });
}

// POST /api/projects -> create a project
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const type = String(body.type || "");
  const title = String(body.title || "").trim();
  const desc = String(body.desc || "").trim();
  const link = String(body.link || "").trim();
  const cover = ART_EMOJIS.includes(body.cover) ? body.cover : CATS[type]?.e || "✨";
  let image: string | null = typeof body.image === "string" ? body.image : null;

  if (!CATS[type]) return NextResponse.json({ error: "Pick a project type." }, { status: 400 });
  if (!title || title.length > 60) return NextResponse.json({ error: "Give it a name (max 60)." }, { status: 400 });
  if (desc.length > 280) return NextResponse.json({ error: "Description too long." }, { status: 400 });
  if (!isKind(title) || !isKind(desc))
    return NextResponse.json({ error: "Let's keep it kind & friendly! 💛" }, { status: 400 });
  if (type === "youtube" && !ytId(link))
    return NextResponse.json({ error: "Paste a valid YouTube link." }, { status: 400 });
  // Keep uploaded images small (data URL). ~700KB cap.
  if (image && image.length > 950_000) image = null;

  const project = await prisma.project.create({
    data: {
      type,
      title,
      desc: desc || "Check out my project!",
      cover,
      link: type === "youtube" || type === "video" ? link || null : null,
      image,
      authorId: user.id,
    },
  });

  await prisma.user.update({ where: { id: user.id }, data: { sparks: { increment: SPARKS.post } } });

  const [shaped] = await getProjects({ viewerId: user.id, authorId: user.id });
  return NextResponse.json({ project: shaped ?? { id: project.id } });
}
