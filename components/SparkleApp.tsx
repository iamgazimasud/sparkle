"use client";
import { useState } from "react";
import { levelFor } from "@/lib/constants";
import type { Project, User } from "./types";
import { api } from "./api";
import { confetti } from "./fx";
import Feed from "./Feed";
import Profile from "./Profile";
import AddModal from "./AddModal";
import DetailModal from "./DetailModal";
import AuthModal from "./AuthModal";

export default function SparkleApp({
  initialUser,
  initialProjects,
}: {
  initialUser: User | null;
  initialProjects: Project[];
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [route, setRoute] = useState<"feed" | "profile">("feed");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const [detail, setDetail] = useState<Project | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<string | undefined>(undefined);
  const [levelUp, setLevelUp] = useState<{ e: string; name: string } | null>(null);

  // ---- data helpers ----
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
      if (!u) return u;
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

  async function like(p: Project, btn: HTMLElement) {
    if (!user) return;
    // optimistic
    const optimistic = { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) };
    patch(optimistic);
    try {
      const res = await api.toggleLike(p.id);
      patch({ ...p, liked: res.liked, likes: res.likes });
      if (res.liked) bumpSparks(1);
    } catch {
      patch(p); // revert
    }
  }

  function onCommented(p: Project) {
    patch({ ...p });
    bumpSparks(2);
  }

  function onCreated(p: Project) {
    setProjects((ps) => [p, ...ps.filter((x) => x.id !== p.id)]);
    setAddOpen(false);
    setFilter("all");
    setRoute("feed");
    confetti();
    bumpSparks(10);
  }

  function openAdd(type?: string) {
    setAddType(type);
    setDetail(null);
    setAddOpen(true);
  }

  async function logout() {
    await api.logout();
    setUser(null);
    setRoute("feed");
  }

  // ---- not logged in ----
  if (!user) {
    return <AuthModal onDone={(u) => { setUser(u); setRoute("feed"); confetti(); }} />;
  }

  return (
    <>
      <header>
        <div className="bar">
          <div className="logo" onClick={() => setRoute("feed")}>
            <div className="mark">✨</div><span>Spark<b>le</b></span>
          </div>
          <div className="spacer" />
          <div className="coin" title="Sparks you earned!"><span className="big">⚡</span><span>{user.sparks}</span></div>
          <button className="me-btn" onClick={() => setRoute("profile")}>
            <span>{user.name}</span><span className="av">{user.avatar}</span>
          </button>
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
          <Profile user={user} onOpen={setDetail} onLike={like} onLogout={logout} />
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
          meName={user.name}
          onClose={() => setDetail(null)}
          onLike={like}
          onCommented={onCommented}
          onInspired={(type) => openAdd(type)}
        />
      )}

      {addOpen && (
        <AddModal initialType={addType} onClose={() => setAddOpen(false)} onCreated={onCreated} />
      )}

      {levelUp && (
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
