"use client";
import { useState } from "react";
import { CATS, STICKERS } from "@/lib/constants";
import type { Project } from "./types";
import { api } from "./api";
import { burst } from "./fx";
import LinkCard from "./LinkCard";

const REASONS = ["It's mean or bullying", "It's not safe for kids", "It's spam", "Something else"];

type ReportTarget = { kind: "project" | "comment"; id: string; label: string };

export default function DetailModal({
  project,
  myId,
  onClose,
  onLike,
  onCommented,
  onInspired,
  onBlocked,
  onOpenUser,
}: {
  project: Project;
  myId: string;
  onClose: () => void;
  onLike: (p: Project, btn: HTMLElement) => void;
  onCommented: (p: Project) => void;
  onInspired: (type: string) => void;
  onBlocked: () => void;
  onOpenUser: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [notice, setNotice] = useState("");
  const cat = CATS[project.type] ?? { e: "✨", label: "Project" };
  const isMine = project.author.id === myId;

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

  async function submitReport(reason: string) {
    if (!reportTarget) return;
    try {
      await api.report(
        reportTarget.kind === "project"
          ? { projectId: reportTarget.id, reason }
          : { commentId: reportTarget.id, reason }
      );
      setReportTarget(null);
      setNotice("Thanks for telling us! 💛 A grown-up will take a look.");
    } catch (e) { setErr((e as Error).message); }
  }

  async function blockMaker() {
    try {
      await api.block(project.author.id, "block");
      onBlocked();
    } catch (e) { setErr((e as Error).message); }
  }

  return (
    <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="x" onClick={onClose}>×</button>

        {project.link && !project.ytId ? (
          <div style={{ marginBottom: 14 }}><LinkCard url={project.link} big /></div>
        ) : (
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
        )}

        <div style={{ marginBottom: 6 }}>
          <span className="badge-cat" style={{ position: "static" }}>{cat.e} {cat.label}</span>
        </div>
        <h2>{project.title}</h2>
        <div className="author clickable" style={{ margin: "4px 0 10px" }}
          onClick={() => onOpenUser(project.author.id)}>
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
                <div style={{ flex: 1 }}>
                  <div className="who">{c.author.name}</div>
                  <div className="txt">{c.text}</div>
                </div>
                {c.authorId !== myId && (
                  <button className="flag" title="Report this comment"
                    onClick={() => setReportTarget({ kind: "comment", id: c.id, label: "comment" })}>🚩</button>
                )}
              </div>
            ))
          ) : (
            <div style={{ color: "var(--ink-soft)", fontWeight: 600, fontSize: 14, padding: 6 }}>
              No comments yet — say something kind! 💛
            </div>
          )}
        </div>

        {err && <div className="err">{err}</div>}
        {notice && <div className="safe-note" style={{ marginTop: 0 }}>✅ <span>{notice}</span></div>}
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

        {/* Safety controls (not shown on your own project) */}
        {!isMine && (
          <div className="safety-row">
            <button onClick={() => setReportTarget({ kind: "project", id: project.id, label: "project" })}>🚩 Report this project</button>
            <button onClick={blockMaker}>🚫 Block {project.author.name}</button>
          </div>
        )}

        {/* Reason picker */}
        {reportTarget && (
          <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) setReportTarget(null); }}>
            <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: 20 }}>Tell a grown-up 🛡️</h2>
              <p className="sub">What&apos;s wrong with this {reportTarget.label}?</p>
              {REASONS.map((r) => (
                <button key={r} className="reason-btn" onClick={() => submitReport(r)}>{r}</button>
              ))}
              <button className="logout" style={{ display: "block", margin: "10px auto 0" }}
                onClick={() => setReportTarget(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
