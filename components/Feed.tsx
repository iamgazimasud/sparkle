"use client";
import type { FeedItem, Project, User } from "./types";
import FeedCard from "./FeedCard";

// The Facebook-style newsfeed (content only — hero/tabs/chips live in MainApp).
export default function Feed({
  user,
  items,
  loading,
  onOpen,
  onLike,
  onShare,
  onComment,
  onOpenUser,
}: {
  user: User;
  items: FeedItem[];
  loading: boolean;
  onOpen: (p: Project) => void;
  onLike: (p: Project, btn: HTMLElement) => void;
  onShare: (p: Project, btn: HTMLElement) => void;
  onComment: (p: Project, text: string) => Promise<void>;
  onOpenUser: (id: string) => void;
}) {
  if (loading) return <div className="spinner" />;
  if (!items.length) {
    return (
      <div className="empty">
        <div className="big">🔭</div>
        <h3>Nothing here yet</h3>
        <p>Be the first to share something awesome — tap ＋ Add Project!</p>
      </div>
    );
  }
  return (
    <div className="feed">
      {items.map((it) => (
        <FeedCard key={it.id} item={it} me={user} onOpen={onOpen} onLike={onLike} onShare={onShare} onComment={onComment} onOpenUser={onOpenUser} />
      ))}
    </div>
  );
}
