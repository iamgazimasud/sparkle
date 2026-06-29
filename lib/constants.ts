// Shared constants used across the app (client + server safe).

export const AVATARS = ["🦊","🐼","🦄","🐯","🐸","🐙","🦖","🐶","🐱","🦉","🐲","🦁","🐵","🐧","🦋","🐝","🦕","🐢","🐰","🐨","🦩","🦈","🐠","🌟"];

export const ART_EMOJIS = ["🎨","🖼️","🐉","🌈","🚀","🏰","🦄","🌸","⚽","🎸","🤖","🦕","🍕","🌋","🐳","🦊","🎮","🪐","🧁","🦋","🏎️","🎭","🌻","⭐"];

export const CATS: Record<string, { label: string; e: string }> = {
  art: { label: "Art", e: "🎨" },
  // The "youtube" key is kept for existing data, but it now accepts ANY video/social
  // link (YouTube, TikTok, Instagram, Vimeo, Scratch...), shown to kids as "Link".
  youtube: { label: "Link", e: "🔗" },
  code: { label: "Code/Game", e: "🕹️" },
  video: { label: "Video", e: "🎬" },
  music: { label: "Music", e: "🎵" },
};

/** Allow only real web links (http/https) — blocks javascript: and other schemes. */
export function isHttpUrl(s?: string | null): boolean {
  if (!s) return false;
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Identify the platform of a shared link so we can show a friendly card. */
export function linkInfo(url?: string | null): { label: string; emoji: string; domain: string } | null {
  if (!isHttpUrl(url)) return null;
  let host = "";
  try { host = new URL(url!).hostname.replace(/^www\./, ""); } catch { return null; }
  const u = (url || "").toLowerCase();
  const match = (re: RegExp, label: string, emoji: string) => (re.test(u) ? { label, emoji, domain: host } : null);
  return (
    match(/youtu\.?be|youtube\.com/, "YouTube", "📺") ||
    match(/tiktok\.com/, "TikTok", "🎵") ||
    match(/instagram\.com/, "Instagram", "📸") ||
    match(/vimeo\.com/, "Vimeo", "🎬") ||
    match(/facebook\.com|fb\.watch/, "Facebook", "👍") ||
    match(/twitter\.com|x\.com/, "X", "🐦") ||
    match(/scratch\.mit\.edu/, "Scratch", "🐱") ||
    match(/twitch\.tv/, "Twitch", "🎮") ||
    match(/soundcloud\.com/, "SoundCloud", "🎧") ||
    { label: host || "Link", emoji: "🔗", domain: host }
  );
}

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
