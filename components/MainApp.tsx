"use client";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { levelFor, CATS } from "@/lib/constants";
import type { FeedItem, Project, User, Award } from "./types";
import { api } from "./api";
import { confetti } from "./fx";
import Feed from "./Feed";
import Gallery from "./Gallery";
import Leaderboard from "./Leaderboard";
import Profile from "./Profile";
import AddModal from "./AddModal";
import DetailModal from "./DetailModal";
import UserProfileModal from "./UserProfileModal";

const CHIPS: [string, string, string][] = [
  ["all", "✨", "All"],
  ...Object.entries(CATS).map(([k, v]) => [k, v.e, v.label] as [string, string, string]),
];

type Route = "gallery" | "feed" | "leaderboard" | "profile";

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
  const [route, setRoute] = useState<Route>("gallery");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const [detail, setDetail] = useState<Project | null>(null);
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<string | undefined>(undefined);
  const [levelUp, setLevelUp] = useState<{ e: string; name: string } | null>(null);
  const [award, setAward] = useState<Award | null>(null);

  // The grid gallery shows original posts (not re-shares), derived from the feed.
  const projects = feed.filter((it) => it.id.startsWith("post:")).map((it) => it.project);

  function patch(updated: Project) {
    setFeed((items) => items.map((it) => (it.project.id === updated.id ? { ...it, project: { ...updated } } : it)));
    setDetail((d) => (d && d.id === updated.id ? { ...updated } : d));
  }

  async function refreshFeed(f = filter) {
    setFeed(await api.feed(f));
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
      await refreshFeed();
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
    confetti();
    setAward(earned);
    bumpSparks(earned.total);
  }

  function openAdd(type?: string) {
    setAddType(type);
    setDetail(null);
    setAddOpen(true);
  }

  function openUser(id: string) {
    setDetail(null);
    setViewUserId(id);
  }

  const browsing = route === "gallery" || route === "feed" || route === "leaderboard";
  const showChips = route === "gallery" || route === "feed";

  return (
    <>
      <header>
        <div className="bar">
          <div className="logo" onClick={() => setRoute("gallery")}>
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
        {route === "profile" ? (
          <Profile user={user} onOpen={setDetail} onLike={like} onLogout={onLogout} />
        ) : (
          <>
            <div className="hero">
              <div style={{ flex: 1 }}>
                <h1>Hi {user.name}! {user.avatar}</h1>
                <p>{route === "feed"
                  ? "See what makers are up to — like, comment & share to your feed! 🔁"
                  : route === "leaderboard"
                  ? "This month's top makers — keep creating to climb! 🏆"
                  : "Browse cool projects and get inspired to make your own! ✨"}</p>
              </div>
              <div className="pin">{route === "leaderboard" ? "🏆" : "🎨"}</div>
            </div>

            <div className="tabs view-tabs">
              <button className={route === "gallery" ? "on" : ""} onClick={() => setRoute("gallery")}>🖼️ Gallery</button>
              <button className={route === "feed" ? "on" : ""} onClick={() => setRoute("feed")}>📰 Feed</button>
              <button className={route === "leaderboard" ? "on" : ""} onClick={() => setRoute("leaderboard")}>🏆 Top</button>
            </div>

            {showChips && (
              <div className="chips">
                {CHIPS.map(([k, e, l]) => (
                  <button key={k} className={`chip ${k === filter ? "on" : ""}`} data-c={k} onClick={() => changeFilter(k)}>
                    {e} {l}
                  </button>
                ))}
              </div>
            )}

            {route === "gallery" ? (
              <Gallery user={user} projects={projects} loading={loading} onOpen={setDetail} onLike={like} onOpenUser={openUser} />
            ) : route === "leaderboard" ? (
              <Leaderboard me={user} onOpenUser={openUser} />
            ) : (
              <div className="feed-wrap">
                <Feed user={user} items={feed} loading={loading} onOpen={setDetail} onLike={like} onShare={share} onComment={comment} onOpenUser={openUser} />
              </div>
            )}
          </>
        )}
      </main>

      <button className="fab" onClick={() => openAdd()}>
        <span className="plus">＋</span><span className="lbl">Add Project</span>
      </button>

      <nav className="botnav">
        <button className={route === "gallery" ? "on" : ""} onClick={() => setRoute("gallery")}>
          <span className="e">🖼️</span>Gallery
        </button>
        <button className={route === "feed" ? "on" : ""} onClick={() => setRoute("feed")}>
          <span className="e">📰</span>Feed
        </button>
        <button className={route === "leaderboard" ? "on" : ""} onClick={() => setRoute("leaderboard")}>
          <span className="e">🏆</span>Top
        </button>
        <button className={route === "profile" ? "on" : ""} onClick={() => setRoute("profile")}>
          <span className="e">⭐</span>Me
        </button>
      </nav>

      {viewUserId && (
        <UserProfileModal
          userId={viewUserId}
          onClose={() => setViewUserId(null)}
          onOpenProject={setDetail}
          onLike={like}
        />
      )}

      {detail && (
        <DetailModal
          project={detail}
          myId={user.id}
          onClose={() => setDetail(null)}
          onLike={like}
          onCommented={onCommentedFromModal}
          onInspired={(type) => openAdd(type)}
          onBlocked={() => { setDetail(null); refreshFeed(); }}
          onOpenUser={openUser}
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
