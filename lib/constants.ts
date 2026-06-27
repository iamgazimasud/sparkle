// Shared constants used across the app (client + server safe).

export const AVATARS = ["🦊","🐼","🦄","🐯","🐸","🐙","🦖","🐶","🐱","🦉","🐲","🦁","🐵","🐧","🦋","🐝","🦕","🐢","🐰","🐨","🦩","🦈","🐠","🌟"];

export const ART_EMOJIS = ["🎨","🖼️","🐉","🌈","🚀","🏰","🦄","🌸","⚽","🎸","🤖","🦕","🍕","🌋","🐳","🦊","🎮","🪐","🧁","🦋","🏎️","🎭","🌻","⭐"];

export const CATS: Record<string, { label: string; e: string }> = {
  art: { label: "Art", e: "🎨" },
  youtube: { label: "YouTube", e: "📺" },
  code: { label: "Code/Game", e: "🕹️" },
  video: { label: "Video", e: "🎬" },
  music: { label: "Music", e: "🎵" },
};

export const STICKERS = ["So cool! 🤩","Amazing! 🌟","Love it! ❤️","Wow! 👏","Great job! 🎉","Teach me! 🙌","You rock! 🤘","Beautiful! 🌈"];

export const LEVELS = [
  { min: 0,   name: "Sprout",     e: "🌱" },
  { min: 40,  name: "Explorer",   e: "🧭" },
  { min: 100, name: "Creator",    e: "🎨" },
  { min: 200, name: "Star Maker", e: "⭐" },
  { min: 350, name: "Legend",     e: "🏆" },
  { min: 600, name: "Superstar",  e: "🌟" },
];

export type BadgeDef = { id: string; e: string; n: string };
export const BADGES: BadgeDef[] = [
  { id: "first",  e: "🎉",  n: "First Post" },
  { id: "three",  e: "🔥",  n: "On a Roll" },
  { id: "five",   e: "🚀",  n: "Super Maker" },
  { id: "artist", e: "🎨",  n: "Artist" },
  { id: "coder",  e: "🕹️", n: "Coder" },
  { id: "tuber",  e: "📺",  n: "YouTuber" },
  { id: "kind",   e: "💌",  n: "Kind Friend" },
  { id: "loved",  e: "❤️",  n: "Loved" },
];

// Simple kindness filter for a kids' community.
const BAD = ["stupid","dumb","hate","ugly","idiot","loser","shut up","kill","hell"];
export function isKind(text: string): boolean {
  const low = text.toLowerCase();
  return !BAD.some((w) => low.includes(w));
}

export function ytId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export function levelFor(sparks: number) {
  let lv = LEVELS[0], idx = 0;
  LEVELS.forEach((l, i) => { if (sparks >= l.min) { lv = l; idx = i; } });
  const next = LEVELS[idx + 1];
  const progress = next ? Math.min(100, Math.round(((sparks - lv.min) / (next.min - lv.min)) * 100)) : 100;
  return { lv, idx, next, progress };
}

export const SPARKS = { post: 10, comment: 2, like: 1 } as const;
