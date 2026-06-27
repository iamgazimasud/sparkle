"use client";
import { useEffect, useState } from "react";
import { BADGES, levelFor } from "@/lib/constants";
import type { Project, User } from "./types";
import { api } from "./api";
import ProjectCard from "./ProjectCard";

export default function Profile({
  user,
  onOpen,
  onLike,
  onLogout,
}: {
  user: User;
  onOpen: (p: Project) => void;
  onLike: (p: Project, btn: HTMLElement) => void;
  onLogout: () => void;
}) {
  const [mine, setMine] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.projects("all", user.id).then((p) => { setMine(p); setLoading(false); });
  }, [user.id]);

  const L = levelFor(user.sparks);
  const cats = new Set(mine.map((p) => p.type));
  const likesGot = mine.reduce((a, p) => a + p.likes, 0);
  const myComments = mine.reduce(
    (a, p) => a + p.comments.filter((c) => c.author.name === user.name).length, 0
  );

  const got = (id: string) => {
    const s = { posts: mine.length, cats, likesGot, myComments };
    switch (id) {
      case "first": return s.posts >= 1;
      case "three": return s.posts >= 3;
      case "five": return s.posts >= 5;
      case "artist": return s.cats.has("art");
      case "coder": return s.cats.has("code");
      case "tuber": return s.cats.has("youtube");
      case "kind": return s.myComments >= 3;
      case "loved": return s.likesGot >= 10;
      default: return false;
    }
  };

  return (
    <>
      <div className="profile-head">
        <div className="pav">{user.avatar}</div>
        <div style={{ flex: 1 }}>
          <h2>{user.name}</h2>
          <div style={{ color: "var(--ink-soft)", fontWeight: 700 }}>age {user.age} · maker</div>
          <div className="lvl-row">
            <span className="lvl-pill">{L.lv.e} {L.lv.name}</span>
            <div className="pbar"><i style={{ width: `${L.progress}%` }} /></div>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700, marginTop: 5 }}>
            {L.next
              ? `${L.next.min - user.sparks} more ⚡ to reach ${L.next.e} ${L.next.name}`
              : "Max level — you're a legend! 🌟"}
          </div>
          <button className="logout" onClick={onLogout}>Log out</button>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><div className="n">{mine.length}</div><div className="l">Projects</div></div>
        <div className="stat"><div className="n">⚡{user.sparks}</div><div className="l">Sparks</div></div>
        <div className="stat"><div className="n">{likesGot}</div><div className="l">Stars got</div></div>
        <div className="stat"><div className="n">{cats.size}</div><div className="l">Skills</div></div>
      </div>

      <div className="badges">
        <h3>🏅 My Badges</h3>
        <div className="badge-grid">
          {BADGES.map((b) => (
            <div key={b.id} className={`bdg ${got(b.id) ? "got" : "locked"}`}>
              <div className="e">{b.e}</div>
              <div className="n">{b.n}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-title">🎨 My Projects</div>
      {loading ? (
        <div className="spinner" />
      ) : mine.length ? (
        <div className="grid">
          {mine.map((p) => <ProjectCard key={p.id} p={p} onOpen={onOpen} onLike={onLike} />)}
        </div>
      ) : (
        <div className="grid">
          <div className="empty">
            <div className="big">🌱</div>
            <h3>No projects yet!</h3>
            <p>Tap the ＋ button to share your first creation and earn Sparks!</p>
          </div>
        </div>
      )}
    </>
  );
}
