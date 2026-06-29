"use client";
import type { Project, User } from "./types";
import ProjectCard from "./ProjectCard";

// The original card-grid gallery (the design you liked).
export default function Gallery({
  projects,
  loading,
  onOpen,
  onLike,
}: {
  user: User;
  projects: Project[];
  loading: boolean;
  onOpen: (p: Project) => void;
  onLike: (p: Project, btn: HTMLElement) => void;
}) {
  if (loading) return <div className="spinner" />;
  if (!projects.length) {
    return (
      <div className="grid">
        <div className="empty">
          <div className="big">🔭</div>
          <h3>No projects here yet</h3>
          <p>Be the first to share something awesome — tap ＋ Add Project!</p>
        </div>
      </div>
    );
  }
  return (
    <div className="grid">
      {projects.map((p) => (
        <ProjectCard key={p.id} p={p} onOpen={onOpen} onLike={onLike} />
      ))}
    </div>
  );
}
