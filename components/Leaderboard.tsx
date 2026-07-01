"use client";
import { useEffect, useState } from "react";
import type { LeaderEntry, User } from "./types";
import { api } from "./api";

const MEDAL = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ me, onOpenUser }: { me: User; onOpenUser: (id: string) => void }) {
  const [month, setMonth] = useState("");
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.leaderboard().then((d) => { setMonth(d.month); setEntries(d.entries); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div className="lb-wrap">
      <div className="lb-head">
        <div style={{ fontSize: 40 }}>🏆</div>
        <h2>Top Makers</h2>
        <p>{month} · most ⚡ Sparks earned this month</p>
      </div>

      {entries.length === 0 ? (
        <div className="empty">
          <div className="big">🌱</div>
          <h3>No scores yet this month</h3>
          <p>Post a project and earn Sparks to claim the #1 spot!</p>
        </div>
      ) : (
        <div className="lb-list">
          {entries.map((e) => (
            <div key={e.id} className={`lb-row clickable${e.id === me.id ? " me" : ""}${e.rank <= 3 ? " top" : ""}`}
              onClick={() => onOpenUser(e.id)}>
              <div className="lb-rank">{e.rank <= 3 ? MEDAL[e.rank - 1] : e.rank}</div>
              <div className="lb-av">{e.avatar}</div>
              <div className="lb-name">
                {e.name}{e.id === me.id && <span className="lb-you">YOU</span>}
                <div className="lb-sub">{e.projects} project{e.projects === 1 ? "" : "s"} this month</div>
              </div>
              <div className="lb-score">⚡ {e.score}</div>
            </div>
          ))}
        </div>
      )}
      <p className="hint" style={{ marginTop: 14 }}>
        💡 Earn Sparks by posting (+10) and when others ❤️ like, 💬 comment & 🔁 share your work!
      </p>
    </div>
  );
}
