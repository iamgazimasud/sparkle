"use client";
import { useEffect, useState } from "react";
import type { LeaderboardData, User } from "./types";
import { api } from "./api";

const MEDAL = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ me, onOpenUser }: { me: User; onOpenUser: (id: string) => void }) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.leaderboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;
  if (!data) return null;

  const { month, entries, previousMonth } = data;

  return (
    <div className="lb-wrap">
      {previousMonth.winner && (
        <div className="champ-card" onClick={() => onOpenUser(previousMonth.winner!.id)}>
          <div className="champ-crown">👑</div>
          <div className="champ-label">{previousMonth.month}&apos;s Champion</div>
          <div className="champ-av">{previousMonth.winner.avatar}</div>
          <div className="champ-name">{previousMonth.winner.name}</div>
          <div className="champ-score">⚡ {previousMonth.winner.score} Sparks · {previousMonth.winner.projects} project{previousMonth.winner.projects === 1 ? "" : "s"}</div>
        </div>
      )}

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
