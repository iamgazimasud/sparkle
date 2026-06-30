"use client";
import { CATS, linkInfo } from "@/lib/constants";
import type { Project } from "./types";
import { burst } from "./fx";

export default function ProjectCard({
  p,
  onOpen,
  onLike,
  onOpenUser,
}: {
  p: Project;
  onOpen: (p: Project) => void;
  onLike: (p: Project, btn: HTMLElement) => void;
  onOpenUser?: (id: string) => void;
}) {
  const cat = CATS[p.type] ?? { e: "✨", label: "Project" };
  return (
    <div className="card" onClick={() => onOpen(p)}>
      <div className="thumb">
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
          <div className="emoji-art">{(p.link && linkInfo(p.link)?.emoji) || p.cover || cat.e}</div>
        )}
        <div className="badge-cat">{cat.e} {cat.label}</div>
      </div>
      <div className="body">
        <h3>{p.title}</h3>
        <p className="desc">{p.desc}</p>
        <div
          className={`author${onOpenUser ? " clickable" : ""}`}
          onClick={onOpenUser ? (e) => { e.stopPropagation(); onOpenUser(p.author.id); } : undefined}
        >
          <span className="av">{p.author.avatar}</span>
          <span>{p.author.name}</span>
          <span className="age">· age {p.author.age}</span>
        </div>
        <div className="actions" onClick={(e) => e.stopPropagation()}>
          <button
            className={`react ${p.liked ? "liked" : ""}`}
            onClick={(e) => { onLike(p, e.currentTarget); if (!p.liked) burst(e.currentTarget, "🌟"); }}
          >
            <span className="ic">🌟</span><span>{p.likes}</span>
          </button>
          <button className="comment-btn" onClick={() => onOpen(p)}>💬 {p.comments.length}</button>
        </div>
      </div>
    </div>
  );
}
