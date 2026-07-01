export type User = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  sparks: number;
  email: string | null;
  plan: string;
  consented: boolean;
  isAdmin: boolean;
  isBanned: boolean;
};

export type AwardPart = { label: string; points: number; emoji: string };
export type Award = { total: number; parts: AwardPart[] };

export type Comment = {
  id: string;
  text: string;
  author: { name: string; avatar: string };
  authorId: string;
  createdAt: string;
};

export type Project = {
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
  comments: Comment[];
  liked: boolean;
  shared: boolean;
};

export type MakerProfile = {
  id: string;
  name: string;
  avatar: string;
  age: number;
  sparks: number;
  plan: string;
};

export type LeaderEntry = {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  score: number;
  projects: number;
};

export type LeaderboardData = {
  month: string;
  entries: LeaderEntry[];
  previousMonth: { month: string; winner: LeaderEntry | null };
};

export type FeedItem = {
  id: string;
  project: Project;
  sharedBy?: { name: string; avatar: string };
  sharedAt?: string;
  shareMessage?: string | null;
};
