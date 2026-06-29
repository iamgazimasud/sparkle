import { prisma } from "./db";

export type LeaderEntry = {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  score: number;
  projects: number;
};

// Monthly leaderboard — ranks makers by the Sparks their activity earned THIS month:
// posting (+10), and likes (+3), comments (+2), shares (+2) their projects received.
export async function getMonthlyLeaderboard(limit = 20): Promise<{ month: string; entries: LeaderEntry[] }> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const month = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  const visible = { hidden: false, author: { isBanned: false } };
  const ownerSel = { project: { select: { authorId: true } } };

  const [projects, likes, comments, shares] = await Promise.all([
    prisma.project.findMany({ where: { createdAt: { gte: monthStart }, ...visible }, select: { authorId: true } }),
    prisma.like.findMany({ where: { createdAt: { gte: monthStart }, project: visible }, select: ownerSel }),
    prisma.comment.findMany({ where: { createdAt: { gte: monthStart }, hidden: false, project: visible }, select: ownerSel }),
    prisma.share.findMany({ where: { createdAt: { gte: monthStart }, project: visible }, select: ownerSel }),
  ]);

  const score: Record<string, number> = {};
  const posts: Record<string, number> = {};
  const add = (id: string, n: number) => { score[id] = (score[id] || 0) + n; };

  for (const p of projects) { add(p.authorId, 10); posts[p.authorId] = (posts[p.authorId] || 0) + 1; }
  for (const l of likes) add(l.project.authorId, 3);
  for (const c of comments) add(c.project.authorId, 2);
  for (const s of shares) add(s.project.authorId, 2);

  const ids = Object.keys(score);
  if (!ids.length) return { month, entries: [] };

  const users = await prisma.user.findMany({
    where: { id: { in: ids }, isBanned: false },
    select: { id: true, name: true, avatar: true },
  });

  const entries = users
    .map((u) => ({ id: u.id, name: u.name, avatar: u.avatar, score: score[u.id] || 0, projects: posts[u.id] || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((e, i) => ({ rank: i + 1, ...e }));

  return { month, entries };
}
