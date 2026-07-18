# 🎮 GameHub

A standalone static website that collects all our browser games in one place.

**Live at https://gazigames.vercel.app** (Vercel project `gazigames`).

## Games

| Game | Folder | Source project |
|------|--------|----------------|
| Space Frontier: Alien War | `games/space-frontier/` | `~/space war alien/game` |
| Shadow Fuse | `games/shadow-fuse/` | `~/game ai/shadow-fuse/public` |

## Structure

- `index.html` — the hub landing page (game cards are rendered from `games.js`)
- `play.html?g=<slug>` — player page that wraps a game in an iframe with a
  back-to-hub bar and a fullscreen button
- `games.js` — the game catalog (title, description, cover, colors, URL)
- `games/<slug>/` — each game, fully self-contained, unmodified

## Add a new game

1. Copy the game's static files into `games/<new-slug>/` (it needs its own
   `index.html`).
2. Add an entry to the `GAMES` array in `games.js`.

That's it — the hub and player pick it up automatically.

## Run locally

```bash
python3 -m http.server 4610 -d gamehub
# open http://localhost:4610
```

## Deploy

Pure static files. Production lives on Vercel (project `gazigames`,
domain gazigames.vercel.app). To ship an update:

```bash
cd gamehub && vercel deploy --prod --yes
```
