import type { Project, Comment, User, Award } from "./types";

async function jsonOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export const api = {
  async me(): Promise<{ authed: boolean; user: User | null }> {
    const r = await fetch("/api/auth");
    return r.json();
  },
  async createProfile(input: { name: string; age: number; avatar: string }): Promise<User> {
    const d = await jsonOrThrow(await post("/api/profile", input));
    return d.user;
  },
  async projects(type = "all", author?: string): Promise<Project[]> {
    const q = new URLSearchParams({ type });
    if (author) q.set("author", author);
    const d = await (await fetch(`/api/projects?${q}`)).json();
    return d.projects;
  },
  async createProject(input: {
    type: string; title: string; desc: string; cover: string; link?: string; image?: string | null;
  }): Promise<{ project: Project; award: Award }> {
    const d = await jsonOrThrow(await post("/api/projects", input));
    return { project: d.project, award: d.award };
  },
  async toggleLike(id: string): Promise<{ liked: boolean; likes: number }> {
    return jsonOrThrow(await post(`/api/projects/${id}/like`, {}));
  },
  async comment(id: string, text: string): Promise<Comment> {
    const d = await jsonOrThrow(await post(`/api/projects/${id}/comments`, { text }));
    return d.comment;
  },
  async startUpgrade(): Promise<{ url: string }> {
    return jsonOrThrow(await post("/api/stripe/checkout", {}));
  },
};

function post(url: string, body: unknown) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
