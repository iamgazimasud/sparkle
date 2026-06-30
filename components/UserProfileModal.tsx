"use client";
import { useEffect, useState } from "react";
import { BADGES, levelFor } from "@/lib/constants";
import type { MakerProfile, Project } from "./types";
import { api } from "./api";
import ProjectCard from "./ProjectCard";

// A read-only profile for ANY maker — opens when you tap an author's name/avatar.
export default function UserProfileModal({
  userId,
  onClose,
  onOpenProject,
  onLike,
}: {
  userId: string;
  onClose: () => void;
  onOpenProject: (p: Project) => void;
  onLike: (p: Project, btn: HTMLElement) => void;
}) {
  const [data, setData] = useState<{ user: MakerProfile; projects: Project[]; commentsMade: number } | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.userProfile(userId).then(setData).catch((e) => setErr((e as Error).message));
  }, [userId]);

  const got = (id: string, s: { posts: number; cats: Set<string>; likesGot: number; comments: number }) => {
    switch (id) {
      case "first": return s.posts >= 1;
      case "three": return s.posts >= 3;
      case "five": return s.posts >= 5;
      case "artist": return s.cats.has("art");
      case "coder": return s.cats.has("code");
      case "tuber": return s.cats.has("youtube");
      case "kind": return s.comments >= 3;
      case "loved": return s.likesGot >= 10;
      default: return false;
    }
  };

  return (
    <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <button className="x" onClick={onClose}>×</button>

        {err ? (
          <div className="empty"><div className="big">😕</div><h3>{err}</h3></div>
        ) : !data ? (
          <div className="spinner" />
        ) : (
          (() => {
            const { user, projects, commentsMade } = data;
            const L = levelFor(user.sparks);
            const cats = new Set(projects.map((p) => p.type));
            const likesGot = projects.reduce((a, p) => a + p.likes, 0);
            const stats = { posts: projects.length, cats, likesGot, comments: commentsMade };
            return (
              <>
                <div className="profile-head" style={{ marginTop: 6 }}>
                  <div className="pav">{user.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <h2>{user.name}</h2>
                    <div style={{ color: "var(--ink-soft)", fontWeight: 700 }}>age {user.age} · maker</div>
                    <div className="lvl-row">
                      <span className="lvl-pill">{L.lv.e} {L.lv.name}</span>
                      {user.plan === "pro" && <span className="pro-pill">✨ PRO</span>}
                    </div>
                  </div>
                </div>

                <div className="stats">
                  <div className="stat"><div className="n">{projects.length}</div><div className="l">Projects</div></div>
                  <div className="stat"><div className="n">⚡{user.sparks}</div><div className="l">Sparks</div></div>
                  <div className="stat"><div className="n">{likesGot}</div><div className="l">Stars got</div></div>
                  <div className="stat"><div className="n">{cats.size}</div><div className="l">Skills</div></div>
                </div>

                <div className="badges">
                  <h3>🏅 Badges</h3>
                  <div className="badge-grid">
                    {BADGES.map((b) => (
                      <div key={b.id} className={`bdg ${got(b.id, stats) ? "got" : "locked"}`}>
                        <div className="e">{b.e}</div><div className="n">{b.n}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="section-title">🎨 {user.name}&apos;s Projects</div>
                {projects.length ? (
                  <div className="grid">
                    {projects.map((p) => <ProjectCard key={p.id} p={p} onOpen={onOpenProject} onLike={onLike} />)}
                  </div>
                ) : (
                  <div className="empty"><div className="big">🌱</div><h3>No projects yet</h3></div>
                )}
              </>
            );
          })()
        )}
      </div>
    </div>
  );
}
