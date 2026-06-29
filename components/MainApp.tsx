"use client";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { levelFor } from "@/lib/constants";
import type { Project, User, Award } from "./types";
import { api } from "./api";
import { confetti } from "./fx";
import Feed from "./Feed";
import Profile from "./Profile";
import AddModal from "./AddModal";
import DetailModal from "./DetailModal";

// The signed-in app. Auth/profile gating lives in SparkleApp (the Clerk gate).
export default function MainApp({
  profile,
  initialProjects,
  onLogout,
}: {
  profile: User;
  initialProjects: Project[];
  onLogout: () => void;
}) {
  const [user, setUser] = useState<User>(profile);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [route, setRoute] = useState<"feed" | "profile">("feed");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const [detail, setDetail] = useState<Project | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<string | undefined>(undefined);
  const [levelUp, setLevelUp] = useState<{ e: string; name: string } | null>(null);
  const [award, setAward] = useState<Award | null>(null);

  function patch(updated: Project) {
    setProjects((ps) => ps.map((p) => (p.id === updated.id ? { ...updated } : p)));
    setDetail((d) => (d && d.id === updated.id ? { ...updated } : d));
  }

  async function changeFilter(c: string) {
    setFilter(c);
    setLoading(true);
    const list = await api.projects(c);
    setProjects(list);
    setLoading(false);
  }

  function bumpSparks(n: number) {
    setUser((u) => {
      const before = levelFor(u.sparks).idx;
      const next = { ...u, sparks: u.sparks + n };
      const after = levelFor(next.sparks).idx;
      if (after > before) {
        const L = levelFor(next.sparks).lv;
        setLevelUp({ e: L.e, name: L.name });
        confetti();
      }
      return next;
    });
  }

  async function like(p: Project, _btn: HTMLElement) {
    const optimistic = { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) };
    patch(optimistic);
    try {
      const res = await api.toggleLike(p.id);
      patch({ ...p, liked: res.liked, likes: res.likes });
      if (res.liked) bumpSparks(1);
    } catch {
      patch(p);
    }
  }

  function onCommented(p: Project) {
    patch({ ...p });
    bumpSparks(2);
  }

  function onCreated(p: Project, earned: Award) {
    setProjects((ps) => [p, ...ps.filter((x) => x.id !== p.id)]);
    setAddOpen(false);
    setFilter("all");
    setRoute("feed");
    confetti();
    setAward(earned);
    bumpSparks(earned.total);
  }

  function openAdd(type?: string) {
    setAddType(type);
    setDetail(null);
    setAddOpen(true);
  }

  return (
    <>
      <header>
        <div className="bar">
          <div className="logo" onClick={() => setRoute("feed")}>
            <div className="mark">✨</div><span>Spark<b>le</b></span>
          </div>
          <div className="spacer" />
          {user.isAdmin && (
            <a className="ghost-btn" href="/admin" title="Moderation dashboard">🛡️ Admin</a>
          )}
          <div className="coin" title="Sparks you earned!"><span className="big">⚡</span><span>{user.sparks}</span></div>
          <button className="me-btn" onClick={() => setRoute("profile")}>
            <span>{user.name}</span><span className="av">{user.avatar}</span>
          </button>
          <div style={{ display: "flex", alignItems: "center" }} title="Account & sign out">
            <UserButton />
          </div>
        </div>
      </header>

      <main className="wrap">
        {route === "feed" ? (
          <Feed
            user={user}
            projects={projects}
            filter={filter}
            setFilter={changeFilter}
            loading={loading}
            onOpen={setDetail}
            onLike={like}
          />
        ) : (
          <Profile user={user} onOpen={setDetail} onLike={like} onLogout={onLogout} />
        )}
      </main>

      <button className="fab" onClick={() => openAdd()}>
        <span className="plus">＋</span><span className="lbl">Add Project</span>
      </button>

      <nav className="botnav">
        <button className={route === "feed" ? "on" : ""} onClick={() => setRoute("feed")}>
          <span className="e">🏠</span>Explore
        </button>
        <button onClick={() => openAdd()}><span className="e">➕</span>Add</button>
        <button className={route === "profile" ? "on" : ""} onClick={() => setRoute("profile")}>
          <span className="e">⭐</span>Me
        </button>
      </nav>

      {detail && (
        <DetailModal
          project={detail}
          myId={user.id}
          onClose={() => setDetail(null)}
          onLike={like}
          onCommented={onCommented}
          onInspired={(type) => openAdd(type)}
          onBlocked={() => { setDetail(null); changeFilter(filter); }}
        />
      )}

      {addOpen && (
        <AddModal initialType={addType} onClose={() => setAddOpen(false)} onCreated={onCreated} />
      )}

      {award && (
        <div className="scrim" onClick={() => setAward(null)}>
          <div className="modal" style={{ maxWidth: 400, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 64 }}>⚡</div>
            <h2>You earned {award.total} Sparks!</h2>
            <p className="sub">Here&apos;s how you earned them:</p>
            <div className="award-list">
              {award.parts.map((part, i) => (
                <div className="award-row" key={i}>
                  <span className="al">{part.emoji} {part.label}</span>
                  <span className="ap">+{part.points}</span>
                </div>
              ))}
              <div className="award-row total">
                <span className="al">Total</span>
                <span className="ap">⚡ {award.total}</span>
              </div>
            </div>
            <p className="hint">💡 Get even more when other kids ❤️ like and 💬 comment on your project!</p>
            <button className="primary" onClick={() => setAward(null)}>Woohoo! 🎉</button>
          </div>
        </div>
      )}

      {!award && levelUp && (
        <div className="scrim" onClick={() => setLevelUp(null)}>
          <div className="modal" style={{ maxWidth: 380, textAlign: "center" }}>
            <div style={{ fontSize: 74 }}>🏆</div>
            <h2>Level Up! {levelUp.e}</h2>
            <p className="sub">You&apos;re now a {levelUp.name}! Keep sharing to climb higher.</p>
            <button className="primary" onClick={() => setLevelUp(null)}>Awesome! 🎉</button>
          </div>
        </div>
      )}
    </>
  );
}
