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
  shares: number;
  comments: { id: string; text: string; author: { name: string; avatar: string }; createdAt: string; authorId: string }[];
  liked: boolean;
  shared: boolean;
};

// A feed entry: either an original post, or someone re-sharing a post.
export type FeedItem = {
  id: string; // unique per feed row
  project: ProjectDTO;
  sharedBy?: { name: string; avatar: string };
  sharedAt?: string;
  shareMessage?: string | null;
};

// User ids hidden from this viewer (blocks in either direction).
async function blockedIdsFor(viewerId: string | null | undefined): Promise<string[]> {
  if (!viewerId) return [];
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: viewerId }, { blockedId: viewerId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const b of blocks) ids.add(b.blockerId === viewerId ? b.blockedId : b.blockerId);
  return [...ids];
}

function projectInclude(viewerId?: string | null) {
  return {
    author: { select: { id: true, name: true, age: true, avatar: true } },
    comments: {
      where: { hidden: false, author: { isBanned: false } },
      orderBy: { createdAt: "asc" as const },
      include: { author: { select: { name: true, avatar: true } } },
    },
    likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : (false as const),
    shares: viewerId ? { where: { userId: viewerId }, select: { id: true } } : (false as const),
    _count: { select: { likes: true, shares: true } },
  };
}

type ProjectRow = {
  id: string; type: string; title: string; desc: string; cover: string;
  link: string | null; image: string | null; createdAt: Date;
  author: { id: string; name: string; age: number; avatar: string };
  comments: { id: string; text: string; authorId: string; createdAt: Date; author: { name: string; avatar: string } }[];
  likes?: { id: string }[];
  shares?: { id: string }[];
  _count: { likes: number; shares: number };
};

async function fetchProjectRows(opts: { type?: string; authorId?: string; viewerId?: string | null; hiddenUserIds: string[] }): Promise<ProjectRow[]> {
  const where: Record<string, unknown> = { hidden: false, author: { isBanned: false } };
  if (opts.type && opts.type !== "all") where.type = opts.type;
  if (opts.authorId) where.authorId = opts.authorId;
  else if (opts.hiddenUserIds.length) where.authorId = { notIn: opts.hiddenUserIds };
  const rows = await prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: projectInclude(opts.viewerId),
  });
  return rows as unknown as ProjectRow[];
}

function toDTO(p: ProjectRow, hiddenUserIds: string[]): ProjectDTO {
  return {
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
    shares: p._count.shares,
    comments: p.comments
      .filter((c) => !hiddenUserIds.includes(c.authorId))
      .map((c) => ({ id: c.id, text: c.text, author: c.author, authorId: c.authorId, createdAt: c.createdAt.toISOString() })),
    liked: Array.isArray(p.likes) ? p.likes.length > 0 : false,
    shared: Array.isArray(p.shares) ? p.shares.length > 0 : false,
  };
}

/** Plain list of projects (used for profile + filters). */
export async function getProjects(opts: { type?: string; authorId?: string; viewerId?: string | null }) {
  const hiddenUserIds = await blockedIdsFor(opts.viewerId);
  const rows = await fetchProjectRows({ ...opts, hiddenUserIds });
  return rows.map((p) => toDTO(p, hiddenUserIds));
}

/** Facebook-style timeline: original posts + re-shares, newest first. */
export async function getFeed(opts: { type?: string; viewerId?: string | null }): Promise<FeedItem[]> {
  const hiddenUserIds = await blockedIdsFor(opts.viewerId);
  const rows = await fetchProjectRows({ type: opts.type, viewerId: opts.viewerId, hiddenUserIds });
  const dtoById = new Map<string, ProjectDTO>();
  const items: FeedItem[] = [];
  for (const p of rows) {
    const dto = toDTO(p, hiddenUserIds);
    dtoById.set(dto.id, dto);
    items.push({ id: `post:${dto.id}`, project: dto });
  }

  // Shares — only of visible projects, by non-blocked, non-banned sharers.
  const projectWhere: Record<string, unknown> = { hidden: false, author: { isBanned: false } };
  if (opts.type && opts.type !== "all") projectWhere.type = opts.type;
  const userWhere: Record<string, unknown> = { isBanned: false };
  if (hiddenUserIds.length) {
    projectWhere.authorId = { notIn: hiddenUserIds };
    userWhere.id = { notIn: hiddenUserIds };
  }
  const shares = await prisma.share.findMany({
    where: { project: projectWhere, user: userWhere },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, avatar: true } } },
  });

  for (const s of shares) {
    const dto = dtoById.get(s.projectId);
    if (!dto) continue; // project not visible
    items.push({
      id: `share:${s.id}`,
      project: dto,
      sharedBy: s.user,
      sharedAt: s.createdAt.toISOString(),
      shareMessage: s.message,
    });
  }

  // Newest first by the moment it hit the feed (share time or post time).
  items.sort((a, b) => {
    const at = a.sharedAt ?? a.project.createdAt;
    const bt = b.sharedAt ?? b.project.createdAt;
    return bt.localeCompare(at);
  });
  return items;
}
