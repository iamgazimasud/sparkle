"use client";
import { useRef, useState } from "react";
import { CATS } from "@/lib/constants";
import type { FeedItem, Project, User } from "./types";
import { burst } from "./fx";
import LinkCard from "./LinkCard";

export default function FeedCard({
  item,
  me,
  onOpen,
  onLike,
  onShare,
  onComment,
  onOpenUser,
}: {
  item: FeedItem;
  me: User;
  onOpen: (p: Project) => void;
  onLike: (p: Project, btn: HTMLElement) => void;
  onShare: (p: Project, btn: HTMLElement) => void;
  onComment: (p: Project, text: string) => Promise<void>;
  onOpenUser: (id: string) => void;
}) {
  const p = item.project;
  const cat = CATS[p.type] ?? { e: "✨", label: "Project" };
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    try {
      await onComment(p, value);
      setText("");
    } finally {
      setBusy(false);
    }
  }

  const shown = p.comments.slice(-2); // newest two inline
  const more = p.comments.length - shown.length;

  return (
    <article className="post">
      {item.sharedBy && (
        <div className="post-shared">🔁 <b>{item.sharedBy.name}</b> shared this</div>
      )}
      {item.shareMessage && <div className="post-sharemsg">“{item.shareMessage}”</div>}

      <header className="post-head clickable" onClick={() => onOpenUser(p.author.id)}>
        <span className="av big">{p.author.avatar}</span>
        <div>
          <div className="post-author">{p.author.name} <span className="age">· age {p.author.age}</span></div>
          <div className="post-cat">{cat.e} {cat.label}</div>
        </div>
      </header>

      <h3 className="post-title">{p.title}</h3>
      {p.desc && <p className="post-desc">{p.desc}</p>}

      {p.link && !p.ytId ? (
        <LinkCard url={p.link} />
      ) : (
        <div className="post-media" onClick={() => onOpen(p)}>
          {p.ytId ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://img.youtube.com/vi/${p.ytId}/hqdefault.jpg`} alt="" />
              <div className="play-ov"><div className="pbtn">▶️</div></div>
            </>
          ) : p.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={p.image} alt={p.title} />
          ) : (
            <div className="emoji-art">{p.cover || cat.e}</div>
          )}
        </div>
      )}

      <div className="post-stats">
        <span>🌟 {p.likes}</span>
        <span>💬 {p.comments.length}</span>
        <span>🔁 {p.shares}</span>
      </div>

      <div className="post-bar">
        <button className={p.liked ? "on" : ""}
          onClick={(e) => { onLike(p, e.currentTarget); if (!p.liked) burst(e.currentTarget, "🌟"); }}>
          🌟 Like
        </button>
        <button onClick={() => inputRef.current?.focus()}>💬 Comment</button>
        <button className={p.shared ? "on" : ""}
          onClick={(e) => { onShare(p, e.currentTarget); if (!p.shared) burst(e.currentTarget, "🔁"); }}>
          🔁 {p.shared ? "Shared" : "Share"}
        </button>
      </div>

      {(shown.length > 0 || more > 0) && (
        <div className="post-comments">
          {more > 0 && (
            <button className="view-all" onClick={() => onOpen(p)}>View all {p.comments.length} comments</button>
          )}
          {shown.map((c) => (
            <div key={c.id} className="post-cmt">
              <span className="av">{c.author.avatar}</span>
              <div><b>{c.author.name}</b> {c.text}</div>
            </div>
          ))}
        </div>
      )}

      <div className="post-add">
        <span className="av">{me.avatar}</span>
        <input ref={inputRef} value={text} maxLength={140} placeholder="Write a kind comment..."
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
        <button onClick={submit} disabled={busy || !text.trim()}>Post</button>
      </div>
    </article>
  );
}
