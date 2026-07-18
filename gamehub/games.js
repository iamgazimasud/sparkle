// GameHub catalog — add a new game by copying its folder into games/
// and adding an entry here.
const GAMES = [
  {
    slug: "space-frontier",
    title: "Space Frontier: Alien War",
    tagline: "Blast through a 10-planet alien campaign",
    description:
      "A premium space shooter — fight through a 10-planet campaign, take down boss battles, buy weapon and shield upgrades, then test yourself in endless survival mode.",
    cover: "games/space-frontier/icon-512.png",
    coverFit: "contain",
    accent: "#38bdf8",
    accent2: "#8a5cff",
    chips: ["🚀 Shooter", "🪐 10 Planets", "👾 Boss Fights"],
    controls: "Keyboard · Touch · Gamepad",
    url: "games/space-frontier/index.html",
  },
  {
    slug: "shadow-fuse",
    title: "Shadow Fuse",
    tagline: "Two flames. One bomb. Outburn the machine.",
    description:
      "A 1v1 puzzle race — twist a grid of rotatable tiles to burn your fuse to the bomb before a scheming AI bot gets there. Cut its path, trap its flame, claim the boom.",
    cover: "games/shadow-fuse/assets/cover.jpg",
    coverFit: "cover",
    accent: "#fb923c",
    accent2: "#22d3ee",
    chips: ["🧩 Puzzle", "🤖 Vs AI", "🔥 1v1 Race"],
    controls: "Mouse · Touch · Keyboard · Gamepad",
    url: "games/shadow-fuse/index.html",
  },
  {
    slug: "idle-space-mining",
    title: "Idle Space Mining",
    tagline: "Build a galactic mining empire",
    description:
      "An idle empire builder — start with one drone on a lonely asteroid and grow across 13 planets with factories, research, ships, achievements and prestige. Progress even while you're away.",
    cover: "games/idle-space-mining/icon.svg",
    coverFit: "contain",
    accent: "#fbbf24",
    accent2: "#34d399",
    chips: ["⛏️ Idle Tycoon", "🪐 13 Planets", "🔬 Research Tree"],
    controls: "Mouse · Touch",
    url: "games/idle-space-mining/index.html",
  },
];
