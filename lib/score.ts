// How a new project earns Sparks.
//
// "Beauty" can't be judged fairly by a computer — so the community judges that part
// through LIKES and COMMENTS over time (see the like/comment API routes, which reward
// the creator). At posting time we reward the things we CAN measure fairly: effort,
// completeness, and the craft involved in each kind of project.

export type AwardPart = { label: string; points: number; emoji: string };
export type Award = { total: number; parts: AwardPart[] };

// Craft bonus per project type — kept close together so no maker feels less valued.
const CRAFT: Record<string, { points: number; label: string; emoji: string }> = {
  art:     { points: 4, label: "Handmade art",      emoji: "🎨" },
  code:    { points: 6, label: "Coding takes skill", emoji: "🧠" },
  video:   { points: 5, label: "Filming & editing",  emoji: "🎞️" },
  music:   { points: 5, label: "Making music",        emoji: "🎵" },
  youtube: { points: 5, label: "Made a video",        emoji: "🎬" },
};

export function scoreNewProject(input: {
  type: string;
  desc: string;
  hasImage: boolean;
  hasVideo: boolean;
}): Award {
  const parts: AwardPart[] = [];

  // Everyone earns for being brave and sharing.
  parts.push({ label: "Shared your project", points: 10, emoji: "🎉" });

  // Showing real work (a photo or a video) takes effort.
  if (input.hasImage) parts.push({ label: "Added a real photo", points: 8, emoji: "📷" });
  if (input.hasVideo) parts.push({ label: "Added a video", points: 8, emoji: "🎬" });

  // A thoughtful description = a more complete, "complex" project.
  const len = input.desc.trim().length;
  if (len >= 120) parts.push({ label: "Wrote a detailed description", points: 6, emoji: "✍️" });
  else if (len >= 40) parts.push({ label: "Added a nice description", points: 3, emoji: "✍️" });

  // Craft bonus for the kind of thing they made.
  const craft = CRAFT[input.type];
  if (craft) parts.push({ label: craft.label, points: craft.points, emoji: craft.emoji });

  const total = parts.reduce((a, p) => a + p.points, 0);
  return { total, parts };
}

// How much the CREATOR earns when the community engages with their project.
// This is the "people like it / how beautiful" part of scoring.
export const COMMUNITY = {
  likeReceived: 3, // someone starred your project
  commentReceived: 2, // someone commented on your project
} as const;
