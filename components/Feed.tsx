"use client";
import { CATS } from "@/lib/constants";
import type { FeedItem, Project, User } from "./types";
import FeedCard from "./FeedCard";

const CHIPS: [string, string, string][] = [
  ["all", "✨", "All"],
  ...Object.entries(CATS).map(([k, v]) => [k, v.e, v.label] as [string, string, string]),
];

export default function Feed({
  user,
  items,
  filter,
  setFilter,
  loading,
  onOpen,
  onLike,
  onShare,
  onComment,
}: {
  user: User;
  items: FeedItem[];
  filter: string;
  setFilter: (c: string) => void;
  loading: boolean;
  onOpen: (p: Project) => void;
  onLike: (p: Project, btn: HTMLElement) => void;
  onShare: (p: Project, btn: HTMLElement) => void;
  onComment: (p: Project, text: string) => Promise<void>;
}) {
  return (
    <div className="feed-wrap">
      <div className="hero">
        <div style={{ flex: 1 }}>
          <h1>Hi {user.name}! {user.avatar}</h1>
          <p>See what other makers are up to — like, comment, and share to your feed! 🔁</p>
        </div>
        <div className="pin">🎨</div>
      </div>

      <div className="chips">
        {CHIPS.map(([k, e, l]) => (
          <button key={k} className={`chip ${k === filter ? "on" : ""}`} data-c={k} onClick={() => setFilter(k)}>
            {e} {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner" />
      ) : items.length ? (
        <div className="feed">
          {items.map((it) => (
            <FeedCard key={it.id} item={it} me={user} onOpen={onOpen} onLike={onLike} onShare={onShare} onComment={onComment} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="big">🔭</div>
          <h3>Nothing here yet</h3>
          <p>Be the first to share something awesome — tap ＋ Add Project!</p>
        </div>
      )}
    </div>
  );
}
