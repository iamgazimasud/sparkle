import { prisma } from "./db";
import { ytId } from "./constants";

export type ProjectDTO = {
  id: string;
  type: string;
  title: string;
  desc: string;
  cover: string;
  link: string | null;
  image: string | null;
  ytId: string | null;
  createdAt: string;
  author: { id: string; name: string; age: number; avatar: string };
  likes: number;
  comments: { id: string; text: string; author: { name: string; avatar: string }; createdAt: string }[];
  liked: boolean;
};

/** Fetch projects with counts, comments, and whether `viewerId` liked each. */
export async function getProjects(opts: { type?: string; authorId?: string; viewerId?: string | null }) {
  const where: Record<string, unknown> = {};
  if (opts.type && opts.type !== "all") where.type = opts.type;
  if (opts.authorId) where.authorId = opts.authorId;

  const rows = await prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, age: true, avatar: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, avatar: true } } },
      },
      likes: opts.viewerId ? { where: { userId: opts.viewerId }, select: { id: true } } : false,
      _count: { select: { likes: true } },
    },
  });

  return rows.map((p): ProjectDTO => ({
    id: p.id,
    type: p.type,
    title: p.title,
    desc: p.desc,
    cover: p.cover,
    link: p.link,
    image: p.image,
    ytId: ytId(p.link),
    createdAt: p.createdAt.toISOString(),
    author: p.author,
    likes: p._count.likes,
    comments: p.comments.map((c) => ({
      id: c.id,
      text: c.text,
      author: c.author,
      createdAt: c.createdAt.toISOString(),
    })),
    liked: Array.isArray(p.likes) ? p.likes.length > 0 : false,
  }));
}
