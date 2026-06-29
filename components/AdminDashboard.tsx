"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "./api";

type Report = {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { name: string; avatar: string };
  kind: "project" | "comment" | "user";
  project: { id: string; title: string; hidden: boolean; author: { id: string; name: string; isBanned: boolean } } | null;
  comment: { id: string; text: string; hidden: boolean; author: { id: string; name: string; isBanned: boolean } } | null;
  targetUserId: string | null;
};

export default function AdminDashboard({ adminName }: { adminName: string }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState("open");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.adminReports(status);
      setReports(d.reports);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: string) {
    setBusy(id + action);
    try {
      await api.adminAct(id, action);
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <header>
        <div className="bar">
          <a className="logo" href="/"><div className="mark">🛡️</div><span>Spark<b>le</b> Mod</span></a>
          <div className="spacer" />
          <a className="ghost-btn" href="/">← Back to app</a>
        </div>
      </header>

      <main className="wrap">
        <div className="hero" style={{ display: "block" }}>
          <h1>🛡️ Moderation queue</h1>
          <p>Hi {adminName} — review what kids reported and keep Sparkle safe.</p>
        </div>

        <div className="tabs">
          {["open", "resolved", "dismissed", "all"].map((s) => (
            <button key={s} className={s === status ? "on" : ""} onClick={() => setStatus(s)}>
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="spinner" />
        ) : reports.length === 0 ? (
          <div className="badges" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48 }}>🎉</div>
            <h3>All clear!</h3>
            <p style={{ color: "var(--ink-soft)", fontWeight: 600 }}>No {status === "all" ? "" : status} reports right now.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reports.map((r) => {
              const target = r.project || r.comment;
              const authorName = target?.author?.name ?? "(unknown)";
              const hidden = target?.hidden;
              const banned = target?.author?.isBanned;
              return (
                <div key={r.id} className="report-card">
                  <div className="report-head">
                    <span className="report-kind">{r.kind === "project" ? "🎨 Project" : r.kind === "comment" ? "💬 Comment" : "👤 User"}</span>
                    <span className={`report-status s-${r.status}`}>{r.status}</span>
                  </div>
                  <div className="report-body">
                    {r.project && <div className="report-content"><b>{r.project.title}</b>{hidden && <em> (hidden)</em>}</div>}
                    {r.comment && <div className="report-content">“{r.comment.text}”{hidden && <em> (hidden)</em>}</div>}
                    <div className="report-meta">
                      by <b>{authorName}</b>{banned && <span className="banned-tag">BANNED</span>} ·
                      reported by {r.reporter.avatar} {r.reporter.name}
                    </div>
                    <div className="report-reason">Reason: {r.reason}</div>
                  </div>
                  {r.status === "open" && (
                    <div className="report-actions">
                      <button className="ra-hide" disabled={!!busy} onClick={() => act(r.id, "hide")}>🙈 Hide content</button>
                      <button className="ra-ban" disabled={!!busy} onClick={() => act(r.id, "ban")}>🚫 Ban {authorName}</button>
                      <button className="ra-dismiss" disabled={!!busy} onClick={() => act(r.id, "dismiss")}>👌 It&apos;s fine</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
