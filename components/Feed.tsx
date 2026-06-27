"use client";
import { CATS } from "@/lib/constants";
import type { Project, User } from "./types";
import ProjectCard from "./ProjectCard";

const CHIPS: [string, string, string][] = [
  ["all", "✨", "All"],
  ...Object.entries(CATS).map(([k, v]) => [k, v.e, v.label] as [string, string, string]),
];

export default function Feed({
  user,
  projects,
  filter,
  setFilter,
  loading,
  onOpen,
  onLike,
}: {
  user: User;
  projects: Project[];
  filter: string;
  setFilter: (c: string) => void;
  loading: boolean;
  onOpen: (p: Project) => void;
  onLike: (p: Project, btn: HTMLElement) => void;
}) {
  return (
    <>
      <div className="hero">
        <div style={{ flex: 1 }}>
          <h1>Hi {user.name}! {user.avatar}</h1>
          <p>Check out what other makers built — then share your own and earn ⚡ Sparks!</p>
        </div>
        <div className="pin">🎨</div>
      </div>

      <div className="chips">
        {CHIPS.map(([k, e, l]) => (
          <button
            key={k}
            className={`chip ${k === filter ? "on" : ""}`}
            data-c={k}
            onClick={() => setFilter(k)}
          >
            {e} {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner" />
      ) : projects.length ? (
        <div className="grid">
          {projects.map((p) => (
            <ProjectCard key={p.id} p={p} onOpen={onOpen} onLike={onLike} />
          ))}
        </div>
      ) : (
        <div className="grid">
          <div className="empty">
            <div className="big">🔭</div>
            <h3>No projects here yet</h3>
            <p>Be the first to share something awesome in this category!</p>
          </div>
        </div>
      )}
    </>
  );
}
