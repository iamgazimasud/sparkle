"use client";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { levelFor } from "@/lib/constants";
import type { FeedItem, Project, User, Award } from "./types";
import { api } from "./api";
import { confetti } from "./fx";
import Feed from "./Feed";
import Profile from "./Profile";
import AddModal from "./AddModal";
import DetailModal from "./DetailModal";

// The signed-in app. Auth/profile gating lives in SparkleApp (the Clerk gate).
export default function MainApp({
  profile,
  initialFeed,
  onLogout,
}: {
  profile: User;
  initialFeed: FeedItem[];
  onLogout: () => void;
}) {
  const [user, setUser] = useState<User>(profile);
  const [feed, setFeed] = useState<FeedItem[]>(initialFeed);
  const [route, setRoute] = useState<"feed" | "profile">("feed");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const [detail, setDetail] = useState<Project | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<string | undefined>(undefined);
  const [levelUp, setLevelUp] = useState<{ e: string; name: string } | null>(null);
  const [award, setAward] = useState<Award | null>(null);

  // Update a project everywhere it appears in the feed (a post + any re-shares).
  function patch(updated: Project) {
    setFeed((items) => items.map((it) => (it.project.id === updated.id ? { ...it, project: { ...updated } } : it)));
    setDetail((d) => (d && d.id === updated.id ? { ...updated } : d));
  }

  async function refreshFeed(f = filter) {
    const items = await api.feed(f);
    setFeed(items);
  }

  async function changeFilter(c: string) {
    setFilter(c);
    setLoading(true);
    try { setFeed(await api.feed(c)); } finally { setLoading(false); }
  }

  function bumpSparks(n: number) {
    setUser((u) => {
      const before = levelFor(u.sparks).idx;
      const next = { ...u, sparks: u.sparks + n };
      const after = levelFor(next.sparks).idx;
      if (after > before) {
        setLevelUp({ e: levelFor(next.sparks).lv.e, name: levelFor(next.sparks).lv.name });
        confetti();
      }
      return next;
    });
  }

  async function like(p: Project, _btn?: HTMLElement) {
    patch({ ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) });
    try {
      const res = await api.toggleLike(p.id);
      patch({ ...p, liked: res.liked, likes: res.likes });
      if (res.liked) bumpSparks(1);
    } catch { patch(p); }
  }

  async function share(p: Project, _btn?: HTMLElement) {
    const wasShared = p.shared;
    patch({ ...p, shared: !wasShared, shares: p.shares + (wasShared ? -1 : 1) });
    try {
      const res = await api.toggleShare(p.id);
      patch({ ...p, shared: res.shared, shares: res.shares });
      if (res.shared) bumpSparks(1);
      await refreshFeed(); // reflect the new "shared by you" entry in the timeline
    } catch { patch(p); }
  }

  async function comment(p: Project, text: string) {
    const c = await api.comment(p.id, text);
    patch({ ...p, comments: [...p.comments, c] });
    bumpSparks(2);
  }

  function onCommentedFromModal(p: Project) {
    patch({ ...p });
    bumpSparks(2);
  }

  function onCreated(p: Project, earned: Award) {
    setFeed((items) => [{ id: `post:${p.id}`, project: p }, ...items.filter((it) => it.project.id !== p.id)]);
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
          {user.isAdmin && <a className="ghost-btn" href="/admin" title="Moderation dashboard">🛡️ Admin</a>}
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
            items={feed}
            filter={filter}
            setFilter={changeFilter}
            loading={loading}
            onOpen={setDetail}
            onLike={like}
            onShare={share}
            onComment={comment}
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
          <span className="e">🏠</span>Feed
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
          onCommented={onCommentedFromModal}
          onInspired={(type) => openAdd(type)}
          onBlocked={() => { setDetail(null); refreshFeed(); }}
        />
      )}

      {addOpen && <AddModal initialType={addType} onClose={() => setAddOpen(false)} onCreated={onCreated} />}

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
              <div className="award-row total"><span className="al">Total</span><span className="ap">⚡ {award.total}</span></div>
            </div>
            <p className="hint">💡 Get even more when other kids ❤️ like, 💬 comment, and 🔁 share your project!</p>
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
