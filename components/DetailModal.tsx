"use client";
import { useState } from "react";
import { CATS, STICKERS } from "@/lib/constants";
import type { Project } from "./types";
import { api } from "./api";
import { burst } from "./fx";

export default function DetailModal({
  project,
  meName,
  onClose,
  onLike,
  onCommented,
  onInspired,
}: {
  project: Project;
  meName: string;
  onClose: () => void;
  onLike: (p: Project, btn: HTMLElement) => void;
  onCommented: (p: Project) => void;
  onInspired: (type: string) => void;
}) {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const cat = CATS[project.type] ?? { e: "✨", label: "Project" };

  async function send(preset?: string) {
    const value = preset || text.trim();
    if (!value) return;
    setErr("");
    setBusy(true);
    try {
      const c = await api.comment(project.id, value);
      project.comments.push(c);
      setText("");
      onCommented(project);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="x" onClick={onClose}>×</button>

        <div className="detail-media">
          {project.ytId ? (
            <iframe src={`https://www.youtube.com/embed/${project.ytId}`} allowFullScreen title={project.title} />
          ) : project.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={project.image} alt={project.title} />
          ) : (
            <div className="emoji-art">{project.cover || cat.e}</div>
          )}
        </div>

        <div style={{ marginBottom: 6 }}>
          <span className="badge-cat" style={{ position: "static" }}>{cat.e} {cat.label}</span>
        </div>
        <h2>{project.title}</h2>
        <div className="author" style={{ margin: "4px 0 10px" }}>
          <span className="av">{project.author.avatar}</span>
          <span>{project.author.name}</span>
          <span className="age">· age {project.author.age}</span>
        </div>
        <p className="sub" style={{ color: "var(--ink)" }}>{project.desc}</p>

        <div style={{ display: "flex", gap: 8, margin: "12px 0", flexWrap: "wrap" }}>
          <button className={`react ${project.liked ? "liked" : ""}`}
            onClick={(e) => { onLike(project, e.currentTarget); if (!project.liked) burst(e.currentTarget, "🌟"); }}>
            <span className="ic">🌟</span><span>{project.likes}</span>
          </button>
        </div>

        {/* The inspiration engine — turn a viewer into a maker. */}
        <button className="primary" style={{ marginTop: 0 }} onClick={() => onInspired(project.type)}>
          This inspired me — I&apos;ll make one too! ✨
        </button>

        <div className="section-title" style={{ fontSize: 16, margin: "16px 0 8px" }}>
          💬 Comments ({project.comments.length})
        </div>
        <div className="cmt-list">
          {project.comments.length ? (
            project.comments.map((c) => (
              <div key={c.id} className="cmt">
                <span className="av">{c.author.avatar}</span>
                <div><div className="who">{c.author.name}</div><div className="txt">{c.text}</div></div>
              </div>
            ))
          ) : (
            <div style={{ color: "var(--ink-soft)", fontWeight: 600, fontSize: 14, padding: 6 }}>
              No comments yet — say something kind! 💛
            </div>
          )}
        </div>

        {err && <div className="err">{err}</div>}
        <div className="stickers">
          {STICKERS.slice(0, 5).map((s) => (
            <button key={s} onClick={() => send(s)} disabled={busy}>{s}</button>
          ))}
        </div>
        <div className="cmt-input">
          <input maxLength={140} value={text} placeholder="Write something kind..."
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
          <button onClick={() => send()} disabled={busy}>Send</button>
        </div>
        <div className="safe-note" style={{ marginTop: 12 }}>💛 <span>Be kind! Comments are for cheering each other on.</span></div>
      </div>
    </div>
  );
}
