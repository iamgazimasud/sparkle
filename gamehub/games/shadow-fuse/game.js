// SHADOW FUSE — 1v1 fuse race vs AI on a shared rotatable grid.
// STYLE FORMULA (all procedural art keys off these roles): sleek dark neon vector art
// with soft volumetric glow; bevel-edged slate tiles, rounded flame shapes, thin
// luminous outlines; environment deep charcoal slate w/ indigo shadows; player flame
// radiant cyan; rival flame hot orange; bomb/hazards crimson pulse; boosts warm gold;
// midnight-arsenal mood lit only by the fires; flat frontal perspective.
import { STR } from "./strings.js?v=2";

/* ================= settings ================= */
const DEFAULTS = { diff: 1, arena: 1, speed: 1, theme: 1, flame: 0, fx: 0, sound: 1, music: 1 };
let S = { ...DEFAULTS };
try { Object.assign(S, JSON.parse(localStorage.getItem("sf_settings") || "{}")); } catch (e) {}
const saveS = () => { try { localStorage.setItem("sf_settings", JSON.stringify(S)); } catch (e) {} };
const loadJ = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const saveJ = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
let streak = loadJ("sf_streak", { n: 0, diff: -1 });
let wfRec = loadJ("sf_wf", { w: 0, t: 0 });

const ARENA = [5, 7, 9];
const BASE_SPEED = [0.72, 0.92, 1.22];        // tiles per second
const RAMP_T = [40, 60, 85];                  // seconds until +15% endgame ramp
const THEMES = [
  { bg1: "#16110c", bg2: "#0a0705", tile: "#2c241c", edgeL: "#453a2d", edgeD: "#120d08", groove: "#0d0906", amb: "rgba(255,170,80,0.045)" },
  { bg1: "#0b0f20", bg2: "#05070f", tile: "#161c33", edgeL: "#2a3459", edgeD: "#080b16", groove: "#05070f", amb: "rgba(90,140,255,0.05)" },
  { bg1: "#180b07", bg2: "#0b0402", tile: "#291710", edgeL: "#472516", edgeD: "#120703", groove: "#0b0402", amb: "rgba(255,90,40,0.06)" }
];
const FLAMES = [["#22d3ee", "#a5f3fc"], ["#a78bfa", "#ddd6fe"], ["#34d399", "#a7f3d0"], ["#f8fafc", "#ffffff"]];
const BOT_COL = ["#fb923c", "#fed7aa"];
const GOLD = "#fbbf24", RED = "#ef4444", VIOLET = "#c084fc";

/* ================= rng ================= */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let rng = mulberry32(1);

/* ================= board ================= */
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // N E S W
const OPP = d => (d + 2) & 3;
const BASE_CONNS = { straight: [0, 2], curve: [0, 1], tee: [0, 1, 2], cross: [0, 1, 2, 3] };
function connMask(tile) { let m = 0; for (const d of BASE_CONNS[tile.type]) m |= 1 << ((d + tile.rot) & 3); return m; }
const hasConn = (tile, d) => (connMask(tile) >> d & 1) === 1;
function pairPossible(type, a, b) {
  if (a === b) return false;
  if (type === "cross" || type === "tee") return true;
  const opp = ((a + 2) & 3) === b;
  return type === "straight" ? opp : !opp; // curve: adjacent only
}

let N = 7, board = [], bombX = 3, bombY = 3;
const inB = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
const isBomb = (x, y) => x === bombX && y === bombY;
const idx = (x, y) => y * N + x;

function genBoard(seed) {
  rng = mulberry32(seed);
  N = ARENA[S.arena]; bombX = bombY = (N - 1) >> 1;
  for (let tries = 0; tries < 60; tries++) {
    board = [];
    for (let y = 0; y < N; y++) { const row = []; for (let x = 0; x < N; x++) {
      const r = rng();
      const type = r < 0.30 ? "straight" : r < 0.70 ? "curve" : r < 0.92 ? "tee" : "cross";
      row.push({ type, rot: (rng() * 4) | 0, special: null, fixed: false, anim: 0, animDir: 1, segs: [] });
    } board.push(row); }
    // fixed pads: bomb + ignition corners are open crosses
    const fix = (x, y) => { const t = board[y][x]; t.type = "cross"; t.rot = 0; t.fixed = true; };
    fix(bombX, bombY); fix(0, N - 1); fix(N - 1, 0);
    // specials
    const nEmber = [1, 2, 3][S.arena], nDamp = [1, 2, 2][S.arena], nRelic = S.arena === 2 ? 1 : 0;
    const free = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++)
      if (!board[y][x].fixed && (Math.abs(x - bombX) + Math.abs(y - bombY)) > 1) free.push([x, y]);
    for (let i = free.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; [free[i], free[j]] = [free[j], free[i]]; }
    let k = 0;
    for (let i = 0; i < nEmber && k < free.length; i++) board[free[k][1]][free[k++][0]].special = "ember";
    for (let i = 0; i < nDamp && k < free.length; i++) board[free[k][1]][free[k++][0]].special = "damp";
    for (let i = 0; i < nRelic && k < free.length; i++) board[free[k][1]][free[k++][0]].special = "relic";
    // gentle opening: each ignition corner gets at least one connected first step
    for (const [cx2, cy2] of [[0, N - 1], [N - 1, 0]]) {
      let open = false;
      const nbs = [];
      for (let d = 0; d < 4; d++) {
        const nx = cx2 + DIRS[d][0], ny = cy2 + DIRS[d][1];
        if (!inB(nx, ny) || board[ny][nx].fixed) continue;
        nbs.push([nx, ny, OPP(d)]);
        if (hasConn(board[ny][nx], OPP(d))) open = true;
      }
      if (!open && nbs.length) {
        const [nx, ny, need] = nbs[(rng() * nbs.length) | 0];
        const t = board[ny][nx];
        for (let r2 = 0; r2 < 4 && !hasConn(t, need); r2++) t.rot = (t.rot + 1) & 3;
      }
    }
    // solvable for both corners under free rotation + fair-ish distance
    const dP = rotFreeDist(0, N - 1), dB = rotFreeDist(N - 1, 0);
    if (dP < 1e8 && dB < 1e8 && Math.abs(dP - dB) <= 2) return;
  }
}
// BFS where a cell passes a→b if its TYPE allows it under some rotation
function rotFreeDist(sx, sy) {
  const dist = new Array(N * N * 4).fill(1e9); const q = [];
  for (let d = 0; d < 4; d++) { dist[idx(sx, sy) * 4 + d] = 0; q.push([sx, sy, d, 0]); }
  while (q.length) {
    const [x, y, e, c] = q.shift();
    for (let d = 0; d < 4; d++) {
      if (d === e) continue;
      const t = board[y][x];
      if (!t.fixed && !pairPossible(t.type, e, d)) continue;
      if (t.fixed && !isBomb(x, y) && !hasConn(t, e)) { /* cross pads: always open */ }
      const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
      if (!inB(nx, ny)) continue;
      if (isBomb(nx, ny)) return c + 1;
      const s = OPP(d), key = idx(nx, ny) * 4 + s;
      if (dist[key] > c + 1) { dist[key] = c + 1; q.push([nx, ny, s, c + 1]); }
    }
  }
  return 1e9;
}

/* ================= flames ================= */
function mkFlame(id, x, y, from, col) {
  return { id, x, y, from, to: -1, half: "in", t: 0.02, stalled: false, stallT: 0, boost: 0,
    dead: false, won: false, visited: new Set([idx(x, y)]), col, inBomb: false, decoy: null };
}
let pF = null, bF = null;

function tileSpeedMult(fl) {
  const t = board[fl.y] && board[fl.y][fl.x]; let m = 1;
  if (fl.inBomb) return 1;
  if (t) { if (t.special === "damp") m *= 0.5; }
  if (fl.boost > 0) m *= 1.5;
  return m;
}

// BFS along CURRENT connections only (no rotations), skipping this flame's trail
function connDist(sx, sy, entry, visited) {
  const seen = new Set([idx(sx, sy) * 4 + entry]);
  let q = [[sx, sy, entry, 0]];
  while (q.length) {
    const nq = [];
    for (const [x, y, e, c] of q) {
      const t = board[y][x];
      for (let d = 0; d < 4; d++) {
        if (d === e || !hasConn(t, d)) continue;
        const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
        if (!inB(nx, ny)) continue;
        if (isBomb(nx, ny)) return c + 1;
        if (visited.has(idx(nx, ny))) continue;
        if (!hasConn(board[ny][nx], OPP(d))) continue;
        const k = idx(nx, ny) * 4 + OPP(d);
        if (seen.has(k)) continue;
        seen.add(k); nq.push([nx, ny, OPP(d), c + 1]);
      }
    }
    q = nq;
  }
  return 1e9;
}
// pick exit at tile center following CURRENT connections; prefers routes that
// actually reach the bomb as wired right now, else drifts toward it
function chooseExit(fl, forDecoy) {
  const t = board[fl.y][fl.x], cands = [];
  for (let d = 0; d < 4; d++) {
    if (d === fl.from || !hasConn(t, d)) continue;
    const nx = fl.x + DIRS[d][0], ny = fl.y + DIRS[d][1];
    if (!inB(nx, ny)) continue;
    if (isBomb(nx, ny)) return { d, bomb: true };
    if (fl.visited.has(idx(nx, ny))) continue;
    if (!hasConn(board[ny][nx], OPP(d))) continue;
    const live = connDist(nx, ny, OPP(d), fl.visited);
    const man = Math.abs(nx - bombX) + Math.abs(ny - bombY);
    const straight = d === OPP(fl.from) ? 0 : 1;
    cands.push({ d, live, man, straight });
  }
  if (!cands.length) return null;
  cands.sort((a, b) => a.live - b.live || a.man - b.man || a.straight - b.straight || a.d - b.d);
  return forDecoy && cands.length > 1 ? cands[1] : cands[0];
}

function stepFlame(fl, dt, game) {
  if (fl.dead || fl.won) return;
  const spd = BASE_SPEED[S.speed] * tileSpeedMult(fl) * (game.time > RAMP_T[S.arena] ? 1.15 : 1);
  const adv = dt * spd * 2; // per half-tile

  if (fl.inBomb) { fl.t += adv; if (fl.t >= 1) { fl.t = 1; fl.won = true; } return; }

  if (fl.half === "in") {
    fl.t += adv;
    if (fl.t >= 1) {
      fl.t = 1;
      const ex = chooseExit(fl);
      if (ex) {
        fl.stalled = false; fl.stallT = 0; fl.to = ex.d; fl.half = "out"; fl.t = 0;
        const tl = board[fl.y][fl.x];
        if (tl.special === "ember") { fl.boost = 2; spawnBurst(fl, GOLD, 10); sfx.ember(); }
        if (tl.special === "relic" && !fl.decoy) spawnDecoy(fl);
      } else { if (!fl.stalled) { fl.stalled = true; sfx.sputterStart(); } fl.stallT += dt; }
    }
  } else { // out
    if (fl.t < 1) fl.t = Math.min(1, fl.t + adv);
    if (fl.t >= 1) {
      const nx = fl.x + DIRS[fl.to][0], ny = fl.y + DIRS[fl.to][1];
      if (isBomb(nx, ny)) {
        commitSeg(fl); fl.x = nx; fl.y = ny; fl.from = OPP(fl.to); fl.inBomb = true; fl.t = 0;
        fl.stalled = false; fl.stallT = 0; return;
      }
      if (hasConn(board[ny][nx], OPP(fl.to))) {
        commitSeg(fl);
        if (fl.boost > 0) fl.boost--;
        fl.x = nx; fl.y = ny; fl.from = OPP(fl.to); fl.to = -1; fl.half = "in"; fl.t = 0;
        fl.visited.add(idx(nx, ny)); fl.stalled = false; fl.stallT = 0;
      } else { if (!fl.stalled) { fl.stalled = true; sfx.sputterStart(); } fl.stallT += dt; }
    }
  }
  if (fl.stalled && fl.stallT >= 3) fl.dead = true;
}
function commitSeg(fl) {
  const tl = board[fl.y][fl.x];
  tl.segs.push({ relA: (fl.from - tl.rot) & 3, relB: (fl.to - tl.rot) & 3, col: fl.col[0] });
}

/* ---- decoy (fork relic) ---- */
function spawnDecoy(fl) {
  const ex = chooseExit(fl, true);
  if (!ex) return;
  fl.decoy = { x: fl.x, y: fl.y, from: fl.from, to: ex.d, half: "out", t: 0, ttl: 3, col: fl.col, visited: new Set(fl.visited) };
  sfx.relic();
}
function stepDecoy(fl, dt, game) {
  const D = fl.decoy; if (!D) return;
  D.ttl -= dt; if (D.ttl <= 0) { spawnBurst(D, "#94a3b8", 8); fl.decoy = null; return; }
  const adv = dt * BASE_SPEED[S.speed] * 2;
  if (D.half === "out") {
    D.t += adv;
    if (D.t >= 1) {
      const nx = D.x + DIRS[D.to][0], ny = D.y + DIRS[D.to][1];
      if (!inB(nx, ny) || isBomb(nx, ny) || !hasConn(board[ny] && board[ny][nx] || { type: "cross", rot: 0 }, OPP(D.to))) { fl.decoy = null; return; }
      D.x = nx; D.y = ny; D.from = OPP(D.to); D.half = "in"; D.t = 0; D.visited.add(idx(nx, ny));
    }
  } else {
    D.t += adv;
    if (D.t >= 1) {
      const ex = chooseExit(D); if (!ex || ex.bomb) { fl.decoy = null; return; }
      D.to = ex.d; D.half = "out"; D.t = 0;
    }
  }
}

/* ---- projection: the two tiles ahead of a flame (warning zone) ---- */
function projectAhead(fl) {
  const out = [];
  if (fl.dead || fl.won || fl.inBomb) return out;
  let x = fl.x, y = fl.y, from = fl.from, to = fl.to, half = fl.half;
  const vis = fl.visited;
  for (let i = 0; i < 2; i++) {
    let d = -1;
    if (half === "out" && to >= 0) d = to;
    else {
      const t = board[y][x]; let best = null;
      for (let dd = 0; dd < 4; dd++) {
        if (dd === from || !hasConn(t, dd)) continue;
        const nx = x + DIRS[dd][0], ny = y + DIRS[dd][1];
        if (!inB(nx, ny)) continue;
        if (isBomb(nx, ny)) { best = { dd, man: -1 }; break; }
        if (vis.has(idx(nx, ny)) || !hasConn(board[ny][nx], OPP(dd))) continue;
        const man = Math.abs(nx - bombX) + Math.abs(ny - bombY);
        if (!best || man < best.man) best = { dd, man };
      }
      if (!best) break; d = best.dd;
    }
    const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
    if (!inB(nx, ny) || isBomb(nx, ny)) break;
    out.push(idx(nx, ny));
    x = nx; y = ny; from = OPP(d); to = -1; half = "in";
  }
  return out;
}

/* ================= distance (Dijkstra w/ rotation penalty) ================= */
// integer costs: step=2, pair-needs-rotation +5, neighbor-side-closed +3
function fuseDist(fl, wantPath) {
  if (fl.won || fl.inBomb) return { d: 0, path: [] };
  if (fl.dead) return { d: 1e9, path: [] };
  const NS = N * N * 4, dist = new Int32Array(NS).fill ? new Int32Array(NS) : [];
  for (let i = 0; i < NS; i++) dist[i] = 1 << 29;
  const prev = wantPath ? new Int32Array(NS).fill(-1) : null;
  const BK = 900, buckets = Array.from({ length: BK }, () => []);
  let best = 1 << 29, bestEnd = -1;
  const push = (x, y, e, c, from) => {
    const k = idx(x, y) * 4 + e;
    if (c < dist[k]) { dist[k] = c; if (prev) prev[k] = from; if (c < BK) buckets[c].push(k); }
  };
  // seed: committed exit when mid-crossing, else all exits from current cell
  const seedFrom = (x, y, e, c0, pk) => {
    const t = board[y][x];
    for (let d = 0; d < 4; d++) {
      if (d === e) continue;
      if (!isBomb(x, y) && !pairPossible(t.type, e, d) && !t.fixed) continue;
      const now = isBomb(x, y) || (hasConn(t, e) && hasConn(t, d));
      if (!now && t.fixed && !isBomb(x, y)) continue;
      let c = c0 + 2 + (now ? 0 : 5);
      const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
      if (!inB(nx, ny)) continue;
      if (isBomb(nx, ny)) { if (c < best) { best = c; bestEnd = idx(x, y) * 4 + e; } continue; }
      if (fl.visited.has(idx(nx, ny)) && !(nx === fl.x && ny === fl.y)) continue;
      const nt = board[ny][nx], s = OPP(d);
      if (!hasConn(nt, s)) { if (nt.fixed) continue; c += 3; }
      push(nx, ny, s, c, pk);
    }
  };
  if (fl.half === "out" && fl.to >= 0) {
    const nx = fl.x + DIRS[fl.to][0], ny = fl.y + DIRS[fl.to][1];
    if (isBomb(nx, ny)) return { d: 1, path: [] };
    if (inB(nx, ny)) {
      const nt = board[ny][nx], s = OPP(fl.to);
      if (!fl.visited.has(idx(nx, ny)) || true) {
        let c = 2 + (hasConn(nt, s) ? 0 : (nt.fixed ? 1 << 28 : 3));
        if (c < 1 << 28) push(nx, ny, s, c, -1);
      }
    }
  } else seedFrom(fl.x, fl.y, fl.from, 0, -1);

  for (let c = 0; c < BK; c++) {
    if (c >= best) break;
    const b = buckets[c];
    for (let i = 0; i < b.length; i++) {
      const k = b[i]; if (dist[k] !== c) continue;
      const cell = k >> 2, e = k & 3, x = cell % N, y = (cell / N) | 0;
      seedFrom(x, y, e, c, k);
    }
  }
  let path = [];
  if (wantPath && bestEnd >= 0) {
    let k = bestEnd;
    while (k >= 0) { path.push(k >> 2); k = prev[k]; }
    path.reverse();
  }
  return { d: best, path };
}

/* ================= bot speech ================= */
let sayLast = 0, sayHide = null;
function botSay(kind, force) {
  const set = STR.botLines[S.diff], lines = set && set[kind];
  if (!lines || !lines.length) return;
  const now = performance.now();
  if (!force && now - sayLast < 2500) return;
  sayLast = now;
  const el = document.getElementById("botSay");
  el.textContent = lines[(Math.random() * lines.length) | 0];
  el.classList.add("show");
  clearTimeout(sayHide);
  sayHide = setTimeout(() => el.classList.remove("show"), 2400);
}

/* ================= rotation action ================= */
let game = null;
function warnSet() {
  const s = new Set();
  if (pF) for (const c of projectAhead(pF)) s.add(c);
  if (bF) for (const c of projectAhead(bF)) s.add(c);
  return s;
}
function rotCost(x, y) { return game && game.warn.has(idx(x, y)) ? 2 : 1; }
function tileLocked(x, y) {
  const t = board[y][x];
  if (t.fixed) return true;
  for (const f of [pF, bF]) if (f && !f.inBomb && f.x === x && f.y === y && !f.dead) return true;
  return false;
}
function tryRotate(actor, x, y, delta) {
  if (!game || game.scene !== "play") return false;
  if (!inB(x, y) || tileLocked(x, y)) { if (actor === "p") sfx.deny(); return false; }
  const cost = rotCost(x, y);
  const sp = actor === "p" ? game.pSparks : game.bSparks;
  if (sp < cost) { if (actor === "p") { sfx.deny(); game.pips = 0.5; } return false; }
  const t = board[y][x];
  t.rot = (t.rot + delta) & 3; t.anim = 1; t.animDir = delta === 3 ? -1 : 1;
  if (actor === "p") {
    game.pSparks -= cost; game.stats.rot++;
    const onBotPath = game.botPathCells.has(idx(x, y));
    if (onBotPath || game.warn.has(idx(x, y))) { game.stats.blocks++; botSay("hit"); }
  } else {
    game.bSparks -= cost;
    if (game.warn.has(idx(x, y)) || cost === 2) botSay("block");
  }
  sfx.rotate(cost === 2);
  spawnDust(x, y);
  return true;
}

/* ================= BOT ================= */
const BOT = {
  interval: [1.5, 0.95, 0.6, 0.4],
  telegraph: [0.7, 0.5, 0.28, 0.16],
  blockW: [0, 0.65, 1.0, 1.25],
  err: [0.15, 0.05, 0, 0],
  pay2: [false, false, true, true],
  bank: [false, false, true, true],
  thresh: [2.0, 1.6, 1.2, 0.9]
};
function botThink(dt) {
  const D = S.diff;
  if (game.botPlan) { // telegraphed move pending
    game.botPlan.t -= dt;
    if (game.botPlan.t <= 0) {
      const { x, y, delta } = game.botPlan; game.botPlan = null;
      tryRotate("b", x, y, delta);
      game.botThinkT = BOT.interval[D] * (0.7 + rng() * 0.6);
    }
    return;
  }
  game.botThinkT -= dt;
  if (game.botThinkT > 0 || bF.dead || bF.won || bF.inBomb) return;
  game.botThinkT = BOT.interval[D] * (0.7 + rng() * 0.6);
  if (game.bSparks < 1) return;

  // player flame the bot "sees" — a live decoy fools it half the time
  let seenP = pF;
  if (pF.decoy && rng() < 0.5) seenP = { ...pF, x: pF.decoy.x, y: pF.decoy.y, from: pF.decoy.from, to: pF.decoy.to, half: pF.decoy.half, visited: pF.decoy.visited, dead: false, won: false, inBomb: false };

  const dB0 = fuseDist(bF, true), dP0 = fuseDist(seenP, true);
  game.botPathCells = new Set(dB0.path);
  // is the player's route to the bomb already fully wired? then cutting is urgent
  const pLive = seenP.inBomb ? 0 : connDist(seenP.x, seenP.y, seenP.from, seenP.visited);

  // candidate tiles: near own flame + on both projected paths
  const cand = new Set();
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const x = bF.x + dx, y = bF.y + dy;
    if (inB(x, y) && !tileLocked(x, y)) cand.add(idx(x, y));
  }
  for (const c of dP0.path.slice(0, 6)) { const x = c % N, y = (c / N) | 0; if (!tileLocked(x, y)) cand.add(c); }
  for (const c of dB0.path.slice(0, 6)) { const x = c % N, y = (c / N) | 0; if (!tileLocked(x, y)) cand.add(c); }

  let bestMove = null, bestScore = BOT.thresh[D];
  for (const c of cand) {
    const x = c % N, y = (c / N) | 0, t = board[y][x];
    const cost = rotCost(x, y);
    if (cost > game.bSparks) continue;
    if (cost === 2 && !BOT.pay2[D]) continue;
    const deltas = t.type === "straight" ? [1] : t.type === "cross" ? [] : [1, 2, 3];
    for (const delta of deltas) {
      t.rot = (t.rot + delta) & 3;
      const dB1 = fuseDist(bF).d, dP1 = fuseDist(seenP).d;
      t.rot = (t.rot - delta) & 3;
      if (dB1 > dB0.d + 6) continue; // never brick own route
      let score = (dB0.d - dB1) * 1.0 + (Math.min(dP1, 60) - Math.min(dP0.d, 60)) * BOT.blockW[D] * 0.9 - cost * 1.4;
      // urgency: player close to bomb, or their route already complete -> cuts matter more
      if (dP0.d <= 8) score += (Math.min(dP1, 60) - Math.min(dP0.d, 60)) * BOT.blockW[D] * 0.8;
      if (pLive < 1e9) score += (Math.min(dP1, 60) - Math.min(dP0.d, 60)) * BOT.blockW[D] * 1.1;
      if (score > bestScore) { bestScore = score; bestMove = { x, y, delta }; }
    }
  }
  // banking: keep a spare spark unless the move is big
  if (bestMove && BOT.bank[D] && game.bSparks < 2 && bestScore < 5) bestMove = null;
  // fallibility: sometimes fires a dud rotation
  if (rng() < BOT.err[D]) {
    const arr = [...cand];
    if (arr.length) {
      const c = arr[(rng() * arr.length) | 0];
      bestMove = { x: c % N, y: (c / N) | 0, delta: 1 };
    }
  }
  if (bestMove) game.botPlan = { ...bestMove, t: BOT.telegraph[D], full: BOT.telegraph[D] };
}

/* ================= match ================= */
function newGame() {
  const seed = (Math.random() * 2 ** 31) | 0;
  genBoard(seed);
  pF = mkFlame("p", 0, N - 1, 2, FLAMES[S.flame]);
  bF = mkFlame("b", N - 1, 0, 0, BOT_COL);
  game = {
    scene: "countdown", cd: 3.6, time: 0,
    pSparks: 3, bSparks: 3, warn: new Set(),
    botThinkT: 1.0, botPlan: null, botPathCells: new Set(),
    stats: { rot: 0, blocks: 0, traps: 0 }, botWasStalled: false, pWasStalled: false,
    finishT: 0, outcome: null, shake: 0, flash: 0, zoom: 0, pips: 0, seed,
    clutchRescue: false, focus: null
  };
  particles.length = 0;
  cursor.x = 0; cursor.y = N - 2;
  botSay("greet", true);
}

function update(dt) {
  if (!game) return;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const t = board[y][x]; if (t.anim > 0) t.anim = Math.max(0, t.anim - dt * 6.5);
  }
  game.shake = Math.max(0, game.shake - dt * 3.2);
  game.flash = Math.max(0, game.flash - dt * 2.4);
  game.pips = Math.max(0, game.pips - dt * 2);

  if (game.scene === "countdown") {
    const prev = Math.ceil(game.cd - 0.6);
    game.cd -= dt;
    const now = Math.ceil(game.cd - 0.6);
    if (now !== prev && now >= 0) { now === 0 ? sfx.go() : sfx.tick(); }
    if (game.cd <= 0) { game.scene = "play"; music.setIntensity(0.3); }
    return;
  }
  if (game.scene === "finish") {
    game.finishT -= dt;
    game.zoom = Math.min(1, game.zoom + dt * 2.2); // kill-cam push-in
    if (game.finishT <= 0) endMatch();
    // keep particles/flames animating in slow-mo
  }
  if (game.scene !== "play" && game.scene !== "finish") return;

  const ts = game.scene === "finish" ? 0.25 : 1;
  const d = dt * ts;
  game.time += d;
  game.pSparks = Math.min(3, game.pSparks + d * 0.5);
  game.bSparks = Math.min(3, game.bSparks + d * 0.5);
  game.warn = warnSet();

  const prevPStalled = pF.stalled, prevPStall = pF.stallT, prevBStalled = bF.stalled;
  stepFlame(pF, d, game); stepFlame(bF, d, game);
  stepDecoy(pF, d, game); stepDecoy(bF, d, game);

  if (bF.stalled && !game.botWasStalled) { game.stats.traps++; botSay("panic", true); }
  game.botWasStalled = bF.stalled;
  if (pF.stalled && !game.pWasStalled) { sfx.sputterStart(); botSay("gloat"); }
  game.pWasStalled = pF.stalled;
  // last-gasp rescues: player escaping a deep sputter is CLUTCH; bot escaping brags
  if (prevPStalled && !pF.stalled && !pF.dead && prevPStall > 2.2) game.clutchRescue = true;
  if (prevBStalled && !bF.stalled && !bF.dead) botSay("rescue");

  if (game.scene === "play") {
    botThink(d);
    // music intensity from proximity
    const prox = 1 - Math.min(manDist(pF), manDist(bF)) / (N);
    music.setIntensity(0.3 + Math.max(0, prox) * 0.7);
    // finish triggers
    const pWin = pF.won, bWin = bF.won, pDead = pF.dead, bDead = bF.dead;
    if (pWin || bWin || pDead || bDead) {
      game.outcome = pWin && bWin ? "draw" : pWin ? "win" : bWin ? "lose" : pDead && bDead ? "draw" : pDead ? "loseTrap" : "winTrap";
      game.scene = "finish"; game.finishT = 1.6;
      if (pWin || bWin) { game.focus = { x: bombX, y: bombY }; detonate(pWin ? pF : bF); }
      else { const df = pDead ? pF : bF; game.focus = { x: df.x, y: df.y }; fizzle(df); }
    } else if ((pF.inBomb || bF.inBomb) && game.zoom < 1) game.zoom = Math.min(1, game.zoom + dt * 3);
  }
}
function manDist(fl) { return fl.inBomb ? 0 : Math.abs(fl.x - bombX) + Math.abs(fl.y - bombY); }

function detonate(fl) {
  sfx.explosion(); music.setIntensity(0);
  game.shake = S.fx === 0 ? 1.4 : 0; game.flash = S.fx === 0 ? 1 : 0.3;
  for (let i = 0; i < (S.fx === 0 ? 90 : 30); i++) spawnBurst({ x: bombX, y: bombY }, i % 3 ? fl.col[0] : GOLD, 1, 3.2);
}
function fizzle(fl) {
  sfx.fizzle(); music.setIntensity(0);
  for (let i = 0; i < 24; i++) spawnBurst(fl, "#6b7280", 1, 1.1);
}
function endMatch() {
  game.scene = "results";
  const o = game.outcome;
  const name = STR.diffNames[S.diff];
  const win = o === "win" || o === "winTrap";
  const title = o === "draw" ? STR.draw : win ? (S.diff === 3 ? STR.wildfireWin : STR.victory) : STR.defeat;
  let hi;
  if (o === "draw") hi = STR.statHighlightDraw;
  else if (o === "winTrap") hi = STR.statHighlightTrap;
  else if (o === "win") hi = manDist(bF) <= 1 ? STR.statHighlightClose : STR.statHighlightRace;
  else if (o === "loseTrap") hi = STR.statHighlightLossTrap;
  else hi = STR.statHighlightLossRace;
  hi = hi.replace("{name}", name).replace("{t}", (manDist(bF) / BASE_SPEED[S.speed]).toFixed(1));
  // near-miss framing: every loss is unfinished business
  if (o === "lose" || o === "loseTrap") {
    const tiles = manDist(pF);
    hi += " " + (tiles <= 2 ? STR.nearMissClose : STR.nearMiss.replace("{n}", tiles));
  }
  // streaks (loss aversion included) + Wildfire lifetime record
  if (streak.diff !== S.diff) { streak.n = 0; streak.diff = S.diff; }
  let streakLine = "";
  if (o !== "draw") {
    if (win) { streak.n++; if (streak.n >= 2) streakLine = STR.streakWin.replace("{n}", streak.n); }
    else { if (streak.n >= 2) streakLine = STR.streakLost.replace("{n}", streak.n); streak.n = 0; }
    saveJ("sf_streak", streak);
  }
  if (S.diff === 3) {
    wfRec.t++; if (win) wfRec.w++; saveJ("sf_wf", wfRec);
    streakLine += (streakLine ? "  ·  " : "") + STR.wfRecord.replace("{w}", wfRec.w).replace("{t}", wfRec.t);
  }
  const clutch = win && (game.clutchRescue || manDist(bF) <= 1);
  ui.results(title, o === "draw" ? "draw" : win ? "win" : "lose", hi, game.stats, game.time, streakLine, clutch);
  botSay(win ? "lose" : o === "draw" ? "draw" : "win", true);
  win ? sfx.victory() : o === "draw" ? sfx.go() : sfx.defeat();
}

/* ================= particles ================= */
const particles = [];
const MAXP = 320;
function spawnBurst(at, col, n, pow = 1) {
  for (let i = 0; i < n; i++) {
    if (particles.length >= MAXP) particles.shift();
    const a = Math.random() * Math.PI * 2, v = (0.4 + Math.random() * 1.6) * pow;
    particles.push({ cx: at.x, cy: at.y, ox: 0, oy: 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.4, life: 0.5 + Math.random() * 0.6, t: 0, col, sz: 0.05 + Math.random() * 0.08 });
  }
}
function spawnDust(x, y) {
  for (let i = 0; i < (S.fx === 0 ? 6 : 2); i++) {
    if (particles.length >= MAXP) particles.shift();
    const a = Math.random() * Math.PI * 2;
    particles.push({ cx: x, cy: y, ox: 0, oy: 0, vx: Math.cos(a) * 0.5, vy: Math.sin(a) * 0.5, life: 0.35, t: 0, col: "#8b93a8", sz: 0.04 });
  }
}
function stepParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.t += dt;
    if (p.t >= p.life) { particles.splice(i, 1); continue; }
    p.ox += p.vx * dt; p.oy += p.vy * dt; p.vy += 0.5 * dt;
  }
}

/* ================= audio (all synthesized — see design/assets.csv) ================= */
let AC = null, masterG, musicG, sfxG, crackleSrc = null, crackleG = null;
function audioInit() {
  if (AC) return;
  AC = new (window.AudioContext || window.webkitAudioContext)();
  masterG = AC.createGain(); masterG.connect(AC.destination); masterG.gain.value = 0.9;
  musicG = AC.createGain(); musicG.connect(masterG);
  sfxG = AC.createGain(); sfxG.connect(masterG);
  applyAudioToggles();
  music.start();
  // fuse crackle bed (looped generated buffer)
  const len = AC.sampleRate * 1.6, buf = AC.createBuffer(1, len, AC.sampleRate), ch = buf.getChannelData(0);
  let e = 0;
  for (let i = 0; i < len; i++) {
    if (Math.random() < 0.004) e = 0.5 + Math.random() * 0.5;
    e *= 0.988;
    ch[i] = (Math.random() * 2 - 1) * e * 0.55;
  }
  crackleSrc = AC.createBufferSource(); crackleSrc.buffer = buf; crackleSrc.loop = true;
  const bp = AC.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2600; bp.Q.value = 0.6;
  crackleG = AC.createGain(); crackleG.gain.value = 0;
  crackleSrc.connect(bp); bp.connect(crackleG); crackleG.connect(sfxG);
  crackleSrc.start();
}
function applyAudioToggles() {
  if (!AC) return;
  musicG.gain.value = S.music ? 0.14 : 0;
  sfxG.gain.value = S.sound ? 0.5 : 0;
}
function env(g, t0, a, peak, dec) {
  g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(peak, t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + dec);
}
function blip(freq, type, peak, dec, when = 0, glide = 0) {
  if (!AC) return;
  const t0 = AC.currentTime + when, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, glide), t0 + dec);
  env(g, t0, 0.005, peak, dec);
  o.connect(g); g.connect(sfxG); o.start(t0); o.stop(t0 + dec + 0.1);
}
function noise(peak, dec, fType, fFreq, when = 0, fGlide = 0) {
  if (!AC) return;
  const t0 = AC.currentTime + when, len = AC.sampleRate * (dec + 0.05);
  const buf = AC.createBuffer(1, len, AC.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  const src = AC.createBufferSource(); src.buffer = buf;
  const f = AC.createBiquadFilter(); f.type = fType; f.frequency.setValueAtTime(fFreq, t0);
  if (fGlide) f.frequency.exponentialRampToValueAtTime(Math.max(40, fGlide), t0 + dec);
  const g = AC.createGain(); env(g, t0, 0.004, peak, dec);
  src.connect(f); f.connect(g); g.connect(sfxG); src.start(t0); src.stop(t0 + dec + 0.1);
}
const sfx = {
  tick() { blip(1150, "square", 0.22, 0.07); },
  go() { blip(660, "sawtooth", 0.3, 0.3, 0, 1320); noise(0.25, 0.25, "highpass", 1000); },
  rotate(heavy) {
    noise(heavy ? 0.5 : 0.35, 0.07, "bandpass", heavy ? 500 : 900);
    blip(heavy ? 130 : 190, "sine", 0.4, 0.09, 0, heavy ? 70 : 120);
  },
  deny() { blip(160, "square", 0.18, 0.12, 0, 110); },
  ember() { blip(880, "sine", 0.25, 0.2, 0, 1760); },
  relic() { blip(520, "triangle", 0.25, 0.3, 0, 1040); blip(780, "triangle", 0.2, 0.3, 0.08, 1560); },
  sputterStart() { noise(0.2, 0.3, "bandpass", 1800, 0, 500); },
  fizzle() { noise(0.4, 0.9, "bandpass", 2200, 0, 260); blip(300, "sine", 0.2, 0.7, 0, 60); },
  explosion() {
    blip(70, "sine", 0.9, 1.2, 0, 28);
    noise(0.8, 1.0, "lowpass", 3200, 0, 120);
    noise(0.4, 0.4, "highpass", 400, 0.03);
  },
  victory() { [523, 659, 784, 1047].forEach((f, i) => blip(f, "triangle", 0.25, 0.35, i * 0.11)); },
  defeat() { [392, 330, 262].forEach((f, i) => blip(f, "triangle", 0.22, 0.4, i * 0.16)); },
  spark() { noise(0.18, 0.09, "highpass", 3000); }
};
// tense synthesized loop, 132bpm; intensity layers hats + riser
const music = {
  playing: false, intensity: 0.3, next: 0, step: 0, timer: null,
  start() {
    if (this.playing || !AC) return;
    this.playing = true; this.next = AC.currentTime + 0.1; this.step = 0;
    this.timer = setInterval(() => this.tick(), 40);
  },
  setIntensity(v) { this.intensity = v; },
  tick() {
    if (!AC) return;
    const spb = 60 / 132 / 4; // 16th
    while (this.next < AC.currentTime + 0.15) {
      const s = this.step % 64, t0 = this.next;
      const on = (freq, type, peak, dec, dest) => {
        const o = AC.createOscillator(), g = AC.createGain();
        o.type = type; o.frequency.setValueAtTime(freq, t0);
        env(g, t0, 0.004, peak, dec); o.connect(g); g.connect(dest || musicG);
        o.start(t0); o.stop(t0 + dec + 0.1);
      };
      if (s % 16 === 0) { // kick
        const o = AC.createOscillator(), g = AC.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(120, t0); o.frequency.exponentialRampToValueAtTime(38, t0 + 0.14);
        env(g, t0, 0.003, 0.9, 0.18); o.connect(g); g.connect(musicG); o.start(t0); o.stop(t0 + 0.3);
      }
      if (s % 8 === 4) on(2200, "square", 0.06, 0.03); // clock tick
      const bassNotes = [55, 55, 65.4, 49];
      if (s % 4 === 0) on(bassNotes[(s / 16) | 0], "sawtooth", 0.16, 0.16);
      if (this.intensity > 0.55 && s % 4 === 2) on(4500, "square", 0.03, 0.02); // hats
      if (this.intensity > 0.8 && s % 32 === 0) on(220 * (1 + this.intensity), "triangle", 0.08, 0.5); // riser ping
      this.next += spb; this.step++;
    }
  }
};

/* ================= input ================= */
const canvas = document.getElementById("c"), ctx = canvas.getContext("2d");
const DPR_CAP = 1.5;
let vw = innerWidth, vh = innerHeight;
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, DPR_CAP);
  vw = innerWidth; vh = innerHeight;
  canvas.width = vw * dpr; canvas.height = vh * dpr;
  canvas.style.width = vw + "px"; canvas.style.height = vh + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize); addEventListener("orientationchange", resize); resize();

function layout() {
  const m = Math.min(vw, vh) * 0.055;
  const size = Math.min(vw - m * 2, vh - m * 2 - 30);
  const ts = size / N;
  return { ts, ox: (vw - ts * N) / 2, oy: (vh - ts * N) / 2 + 6 };
}
function cellAt(px, py) {
  const L = layout();
  const x = Math.floor((px - L.ox) / L.ts), y = Math.floor((py - L.oy) / L.ts);
  return inB(x, y) ? { x, y } : null;
}

const cursor = { x: 0, y: 0, visible: false };
let hover = null;
let pDown = null, longFired = false, longTimer = null;

canvas.addEventListener("pointerdown", e => {
  audioInit();
  if (!game || game.scene !== "play") return;
  pDown = { x: e.clientX, y: e.clientY, t: performance.now() };
  longFired = false;
  clearTimeout(longTimer);
  longTimer = setTimeout(() => {
    const c = cellAt(pDown.x, pDown.y);
    if (c) { tryRotate("p", c.x, c.y, 3); longFired = true; }
  }, 350);
});
canvas.addEventListener("pointerup", e => {
  clearTimeout(longTimer);
  if (!game || game.scene !== "play" || !pDown) return;
  const dx = e.clientX - pDown.x, dy = e.clientY - pDown.y;
  if (!longFired && Math.hypot(dx, dy) < 18) {
    const c = cellAt(e.clientX, e.clientY);
    if (c) { tryRotate("p", c.x, c.y, 1); cursor.visible = false; }
  }
  pDown = null;
});
canvas.addEventListener("pointermove", e => { hover = cellAt(e.clientX, e.clientY); });
canvas.addEventListener("contextmenu", e => {
  e.preventDefault();
  if (!game || game.scene !== "play") return;
  const c = cellAt(e.clientX, e.clientY);
  if (c) tryRotate("p", c.x, c.y, 3);
});

const BIND = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right",
  Space: "cw", Enter: "cw", KeyX: "ccw", KeyZ: "ccw", KeyP: "pause", Escape: "pause"
};
addEventListener("keydown", e => {
  const c = BIND[e.code]; if (!c) return;
  e.preventDefault(); audioInit();
  handleCommand(c);
});
function handleCommand(c) {
  if (c === "pause") { togglePause(); return; }
  if (!game || game.scene !== "play") return;
  cursor.visible = true;
  if (c === "up") cursor.y = Math.max(0, cursor.y - 1);
  else if (c === "down") cursor.y = Math.min(N - 1, cursor.y + 1);
  else if (c === "left") cursor.x = Math.max(0, cursor.x - 1);
  else if (c === "right") cursor.x = Math.min(N - 1, cursor.x + 1);
  else if (c === "cw") tryRotate("p", cursor.x, cursor.y, 1);
  else if (c === "ccw") tryRotate("p", cursor.x, cursor.y, 3);
}
// gamepad: dpad/left-stick moves the cursor, A = clockwise, B = counter, start = pause
const padPrev = {};
function pollPad() {
  for (const gp of navigator.getGamepads?.() ?? []) {
    if (!gp) continue;
    const map = { 12: "up", 13: "down", 14: "left", 15: "right", 0: "cw", 1: "ccw", 9: "pause" };
    for (const [i, cmd] of Object.entries(map)) {
      const pressed = gp.buttons[i] && gp.buttons[i].pressed;
      if (pressed && !padPrev[i]) handleCommand(cmd);
      padPrev[i] = pressed;
    }
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    const dz = 0.6;
    const dirs = [["left", ax < -dz], ["right", ax > dz], ["up", ay < -dz], ["down", ay > dz]];
    for (const [cmd, on] of dirs) {
      const k = "ax" + cmd;
      if (on && !padPrev[k]) handleCommand(cmd);
      padPrev[k] = on;
    }
  }
}

/* ================= render ================= */
function flamePos(fl, L) {
  if (fl.inBomb) {
    const cx = L.ox + (bombX + 0.5) * L.ts, cy = L.oy + (bombY + 0.5) * L.ts;
    const ex = cx - DIRS[OPP(fl.from)][0] * 0 , ey = cy;
    const fx = L.ox + (bombX + 0.5) * L.ts - DIRS[fl.from][0] * L.ts * 0.5 * (1 - fl.t) * -1;
    // enter from side fl.from toward center
    return {
      x: cx + DIRS[fl.from][0] * L.ts * 0.5 * (1 - fl.t),
      y: cy + DIRS[fl.from][1] * L.ts * 0.5 * (1 - fl.t)
    };
  }
  const cx = L.ox + (fl.x + 0.5) * L.ts, cy = L.oy + (fl.y + 0.5) * L.ts;
  if (fl.half === "in") {
    return { x: cx + DIRS[fl.from][0] * L.ts * 0.5 * (1 - fl.t), y: cy + DIRS[fl.from][1] * L.ts * 0.5 * (1 - fl.t) };
  }
  return { x: cx + DIRS[fl.to][0] * L.ts * 0.5 * fl.t, y: cy + DIRS[fl.to][1] * L.ts * 0.5 * fl.t };
}
let glowCache = {};
function glowSprite(col, r) {
  const key = col + r;
  if (glowCache[key]) return glowCache[key];
  const c = document.createElement("canvas"); c.width = c.height = r * 2;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, col); gr.addColorStop(0.35, col + "88"); gr.addColorStop(1, col + "00");
  g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
  glowCache[key] = c; return c;
}
function hexA(col, a) {
  const v = Math.round(a * 255).toString(16).padStart(2, "0");
  return col.length === 7 ? col + v : col;
}

function grooveEnds(tile) {
  // list of dirs currently open
  const out = [];
  for (let d = 0; d < 4; d++) if (hasConn(tile, d)) out.push(d);
  return out;
}
function drawGroove(x0, y0, ts, dirs, style, w) {
  ctx.strokeStyle = style; ctx.lineWidth = w; ctx.lineCap = "round";
  const cx = x0 + ts / 2, cy = y0 + ts / 2;
  for (const d of dirs) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + DIRS[d][0] * ts / 2, cy + DIRS[d][1] * ts / 2);
    ctx.stroke();
  }
}
function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

let anim = 0;
function render() {
  anim += 1 / 60;
  const T = THEMES[S.theme];
  // background
  const bg = ctx.createRadialGradient(vw / 2, vh / 2, 0, vw / 2, vh / 2, Math.max(vw, vh) * 0.75);
  bg.addColorStop(0, T.bg1); bg.addColorStop(1, T.bg2);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, vw, vh);

  if (!game || game.scene === "home") return;
  const L = layout();

  ctx.save();
  if (game.shake > 0) {
    const s = game.shake * 7;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  if (game.zoom > 0 && (game.scene === "finish" || game.scene === "play" || game.scene === "results")) {
    const f = game.focus || { x: bombX, y: bombY };
    const z = 1 + game.zoom * (game.scene === "play" ? 0.12 : 0.22);
    const cx = L.ox + (f.x + 0.5) * L.ts, cy = L.oy + (f.y + 0.5) * L.ts;
    ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy);
  }

  // tiles
  const gap = L.ts * 0.06, r = L.ts * 0.12;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (isBomb(x, y)) continue;
    const t = board[y][x];
    const px = L.ox + x * L.ts, py = L.oy + y * L.ts;
    ctx.save();
    const cx = px + L.ts / 2, cy = py + L.ts / 2;
    if (t.anim > 0) {
      ctx.translate(cx, cy);
      ctx.rotate(-t.animDir * t.anim * t.anim * Math.PI / 2);
      const sc = 1 + t.anim * 0.06;
      ctx.scale(sc, sc);
      ctx.translate(-cx, -cy);
    }
    // slab
    rr(px + gap, py + gap, L.ts - gap * 2, L.ts - gap * 2, r);
    ctx.fillStyle = t.fixed ? T.edgeD : T.tile; ctx.fill();
    ctx.strokeStyle = T.edgeL; ctx.lineWidth = 1; ctx.stroke();
    // bevel hint
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath(); ctx.moveTo(px + gap + r, py + L.ts - gap); ctx.lineTo(px + L.ts - gap - r, py + L.ts - gap); ctx.stroke();
    // groove
    const dirs = grooveEnds(t);
    drawGroove(px, py, L.ts, dirs, T.groove, L.ts * 0.26);
    drawGroove(px, py, L.ts, dirs, "rgba(255,255,255,0.045)", L.ts * 0.30);
    // special tint
    if (t.special === "ember") {
      drawGroove(px, py, L.ts, dirs, hexA(GOLD, 0.16 + Math.sin(anim * 5) * 0.07), L.ts * 0.2);
      ctx.fillStyle = hexA(GOLD, 0.85);
      ctx.beginPath(); ctx.arc(cx, cy, L.ts * 0.055, 0, 7); ctx.fill();
    } else if (t.special === "damp") {
      drawGroove(px, py, L.ts, dirs, "rgba(56,130,246,0.18)", L.ts * 0.2);
      ctx.fillStyle = "rgba(96,165,250,0.9)";
      ctx.beginPath(); ctx.arc(cx, cy, L.ts * 0.05, 0, 7); ctx.fill();
    } else if (t.special === "relic") {
      ctx.fillStyle = hexA(VIOLET, 0.7 + Math.sin(anim * 4) * 0.2);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4);
      ctx.fillRect(-L.ts * 0.05, -L.ts * 0.05, L.ts * 0.1, L.ts * 0.1); ctx.restore();
    }
    // burned segments (ember trail)
    for (const sgm of t.segs) {
      const a = (sgm.relA + t.rot) & 3, b = (sgm.relB + t.rot) & 3;
      drawGroove(px, py, L.ts, [a, b].filter(d => d >= 0), hexA(sgm.col, 0.34), L.ts * 0.13);
      drawGroove(px, py, L.ts, [a, b].filter(d => d >= 0), "rgba(255,255,255,0.10)", L.ts * 0.05);
    }
    // warning edge
    if (game.warn.has(idx(x, y)) && game.scene === "play") {
      rr(px + gap, py + gap, L.ts - gap * 2, L.ts - gap * 2, r);
      ctx.strokeStyle = hexA(RED, 0.25 + Math.sin(anim * 7) * 0.15);
      ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
  }

  // bot telegraph shimmer
  if (game.botPlan) {
    const { x, y, t: tt, full } = game.botPlan;
    const px = L.ox + x * L.ts, py = L.oy + y * L.ts;
    rr(px + gap, py + gap, L.ts - gap * 2, L.ts - gap * 2, r);
    ctx.strokeStyle = hexA(BOT_COL[0], 0.3 + 0.5 * (1 - tt / full));
    ctx.lineWidth = 3; ctx.stroke();
  }

  // hover / cursor ghost preview
  const focus = cursor.visible ? cursor : hover;
  if (focus && game.scene === "play" && inB(focus.x, focus.y) && !isBomb(focus.x, focus.y)) {
    const t = board[focus.y][focus.x];
    const px = L.ox + focus.x * L.ts, py = L.oy + focus.y * L.ts;
    rr(px + gap, py + gap, L.ts - gap * 2, L.ts - gap * 2, r);
    const lk = tileLocked(focus.x, focus.y);
    ctx.strokeStyle = lk ? "rgba(148,163,184,0.35)" : hexA(pF.col[0], 0.85);
    ctx.lineWidth = 2.5; ctx.stroke();
    if (!lk) {
      const ghost = { type: t.type, rot: (t.rot + 1) & 3 };
      drawGroove(px, py, L.ts, grooveEnds(ghost), hexA(pF.col[0], 0.14), L.ts * 0.11);
    }
  }

  // bomb
  {
    const cx = L.ox + (bombX + 0.5) * L.ts, cy = L.oy + (bombY + 0.5) * L.ts;
    const pulse = 1 + Math.sin(anim * (4 + 6 * (1 - Math.min(manDist(pF), manDist(bF)) / N))) * 0.05;
    const R = L.ts * 0.33 * pulse;
    ctx.drawImage(glowSprite(RED, 64), cx - R * 1.9, cy - R * 1.9, R * 3.8, R * 3.8);
    const grd = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    grd.addColorStop(0, "#3d4152"); grd.addColorStop(1, "#0b0d14");
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(239,68,68,0.8)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R + 3, 0, 7); ctx.stroke();
    // match ramp arc
    const frac = Math.min(1, game.time / RAMP_T[S.arena]);
    ctx.strokeStyle = frac >= 1 ? hexA(RED, 0.6 + Math.sin(anim * 8) * 0.3) : "rgba(232,236,244,0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, R + 8, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    // fuse nub
    ctx.strokeStyle = "#9aa3b8"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx + R * 0.5, cy - R * 0.8); ctx.quadraticCurveTo(cx + R * 0.9, cy - R * 1.3, cx + R * 0.55, cy - R * 1.5); ctx.stroke();
  }

  // decoys then flames
  for (const fl of [pF, bF]) if (fl.decoy) drawFlame(fl.decoy, L, fl.col, 0.9);
  for (const fl of [pF, bF]) if (!fl.dead) drawFlame(fl, L, fl.col, 1);

  // particles
  for (const p of particles) {
    const px = L.ox + (p.cx + 0.5 + p.ox) * L.ts, py = L.oy + (p.cy + 0.5 + p.oy) * L.ts;
    const a = 1 - p.t / p.life;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.col;
    ctx.beginPath(); ctx.arc(px, py, p.sz * L.ts * a, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // flash
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255,244,220,${game.flash * 0.85})`;
    ctx.fillRect(0, 0, vw, vh);
  }

  drawHUD(L);

  if (game.scene === "countdown") {
    const n = Math.ceil(game.cd - 0.6);
    const txt = n <= 0 ? STR.countdownGo : String(n);
    const frac = 1 - ((game.cd - 0.6 + 1) % 1);
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.min(vw, vh) * (n <= 0 ? 0.14 : 0.22)}px system-ui`;
    ctx.fillStyle = n <= 0 ? hexA(GOLD, 0.95) : hexA(pF.col[0], 0.9);
    ctx.globalAlpha = 0.35 + 0.65 * (1 - frac * 0.5);
    ctx.translate(vw / 2, vh / 2);
    ctx.scale(1 + frac * 0.15, 1 + frac * 0.15);
    ctx.fillText(txt, 0, 0);
    ctx.restore();
  }
}

function drawFlame(fl, L, col, alpha) {
  const p = flamePos(fl, L);
  const R = L.ts * 0.30;
  ctx.globalAlpha = alpha;
  ctx.drawImage(glowSprite(col[0], 64), p.x - R * 2.1, p.y - R * 2.1, R * 4.2, R * 4.2);
  // licking tongues
  for (let i = 0; i < (S.fx === 0 ? 5 : 3); i++) {
    const a2 = anim * 9 + i * 2.1;
    const dx = Math.sin(a2 * 1.3 + i) * R * 0.24;
    const h = R * (0.55 + 0.3 * Math.sin(a2 + i * 1.7));
    const grd = ctx.createRadialGradient(p.x + dx, p.y - h * 0.4, 0, p.x + dx, p.y - h * 0.4, h);
    grd.addColorStop(0, col[1]); grd.addColorStop(0.5, col[0]); grd.addColorStop(1, hexA(col[0], 0));
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.ellipse(p.x + dx, p.y - h * 0.35, h * 0.42, h, 0, 0, 7); ctx.fill();
  }
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(p.x, p.y, R * 0.22, 0, 7); ctx.fill();
  // sputter ring
  if (fl.stallT > 0 && fl.stalled) {
    const frac = 1 - fl.stallT / 3;
    ctx.strokeStyle = hexA(RED, 0.9);
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(p.x, p.y, R * 1.35, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    if (((anim * 4) | 0) % 2 === 0) {
      ctx.fillStyle = "rgba(120,128,145,0.5)";
      ctx.beginPath(); ctx.arc(p.x + Math.sin(anim * 3) * 6, p.y - R * 1.6, R * 0.3, 0, 7); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawPips(x, y, sparks, col, alignRight) {
  const w = 15, gapP = 7;
  for (let i = 0; i < 3; i++) {
    const px = alignRight ? x - i * (w + gapP) : x + i * (w + gapP);
    const fill = Math.max(0, Math.min(1, sparks - i));
    ctx.save();
    ctx.translate(px, y); ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = hexA(col, 0.5); ctx.lineWidth = 1.5;
    ctx.strokeRect(-w / 2, -w / 2, w, w);
    if (fill > 0) {
      ctx.fillStyle = hexA(col, 0.35 + 0.65 * fill);
      const s = w * Math.sqrt(fill);
      ctx.fillRect(-s / 2, -s / 2, s, s);
    }
    ctx.restore();
  }
}
function drawHUD(L) {
  if (game.scene === "results" || game.scene === "home") return;
  // player pips bottom-left
  const shakeX = game.pips > 0 ? Math.sin(anim * 60) * 3 * game.pips : 0;
  drawPips(28 + shakeX, vh - 26, game.pSparks, pF.col[0], false);
  // bot portrait + pips top-right
  const bx = vw - 34, by = 34;
  const mood = bF.stalled ? "panic" : pF.stalled ? "gloat" : game.outcome === "win" || game.outcome === "winTrap" ? "sad" : "idle";
  // flame hair
  for (let i = -1; i <= 1; i++) {
    const h = 10 + Math.sin(anim * 8 + i * 2) * 3;
    ctx.fillStyle = i === 0 ? BOT_COL[1] : BOT_COL[0];
    ctx.beginPath(); ctx.ellipse(bx + i * 7, by - 16 - h / 2, 4, h / 1.4, 0, 0, 7); ctx.fill();
  }
  ctx.fillStyle = "#1d2130";
  ctx.beginPath(); ctx.arc(bx, by, 16, 0, 7); ctx.fill();
  ctx.strokeStyle = BOT_COL[0]; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(bx, by, 16, 0, 7); ctx.stroke();
  ctx.fillStyle = BOT_COL[1];
  const ey = mood === "sad" ? by + 3 : by - 2;
  if (mood === "panic") {
    ctx.beginPath(); ctx.arc(bx - 6, ey, 3.4, 0, 7); ctx.arc(bx + 6, ey, 3.4, 0, 7); ctx.fill();
  } else if (mood === "gloat") {
    ctx.fillRect(bx - 9, ey - 1, 6, 2.6); ctx.fillRect(bx + 3, ey - 1, 6, 2.6);
  } else {
    ctx.beginPath(); ctx.arc(bx - 6, ey, 2.4, 0, 7); ctx.arc(bx + 6, ey, 2.4, 0, 7); ctx.fill();
  }
  // mouth
  ctx.strokeStyle = BOT_COL[1]; ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (mood === "gloat") ctx.arc(bx, by + 4, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  else if (mood === "sad" || mood === "panic") ctx.arc(bx, by + 10, 5, 1.15 * Math.PI, 1.85 * Math.PI);
  else ctx.moveTo(bx - 4, by + 6), ctx.lineTo(bx + 4, by + 6);
  ctx.stroke();
  drawPips(vw - 26, by + 32, game.bSparks, BOT_COL[0], true);
  // crackle volume tracks living flames
  if (crackleG) crackleG.gain.value = (game.scene === "play" || game.scene === "finish") ? 0.5 : 0;
}

/* ================= UI wiring ================= */
const $ = id => document.getElementById(id);
const screens = ["home", "settings", "howto", "pause", "results"];
function show(id) {
  for (const s of screens) $(s).classList.toggle("show", s === id);
  $("pauseBtn").classList.toggle("show", id === null);
}
const ui = {
  results(title, cls, hi, stats, time, streakLine, clutch) {
    $("rTitle").textContent = title;
    $("rTitle").className = "rTitle " + cls;
    $("rHi").textContent = hi;
    $("rStreak").textContent = streakLine || "";
    $("rStamp").textContent = STR.clutch;
    $("rStamp").classList.toggle("show", !!clutch);
    $("rStats").innerHTML = "";
    const rows = [[STR.statTime, time.toFixed(1) + "s"], [STR.statRotations, stats.rot], [STR.statBlocks, stats.blocks], [STR.statTraps, stats.traps]];
    for (const [k, v] of rows) {
      const d = document.createElement("div"); d.className = "stat";
      d.innerHTML = `<b>${v}</b><span>${k}</span>`;
      $("rStats").appendChild(d);
    }
    show("results");
  }
};

function bindTexts() {
  $("logoTxt").textContent = STR.title;
  $("tagTxt").textContent = STR.tagline;
  $("playBtn").textContent = STR.play;
  $("howBtn").textContent = STR.howTo;
  $("setBtn").textContent = STR.settings;
  $("setTitle").textContent = STR.settings;
  $("setBack").textContent = STR.back;
  $("howTitle").textContent = STR.howTo;
  $("howBack").textContent = STR.back;
  $("pauseTitle").textContent = STR.pause;
  $("resumeBtn").textContent = STR.resume;
  $("restartBtn").textContent = STR.restart;
  $("quitBtn").textContent = STR.quit;
  $("replayBtn").textContent = STR.replay;
  $("rSetBtn").textContent = STR.changeSettings;
  updateTogs();
  const cards = $("htCards"); cards.innerHTML = "";
  const icons = ["🔄", "💣", "⏱️"];
  STR.howToPanels.forEach((p, i) => {
    const d = document.createElement("div"); d.className = "htCard";
    d.innerHTML = `<div class="ico">${icons[i]}</div><h3>${p.h}</h3><p>${p.p}</p>`;
    cards.appendChild(d);
  });
}
function updateTogs() {
  $("sndTog").textContent = `${STR.sound}: ${S.sound ? STR.on : STR.off}`;
  $("musTog").textContent = `${STR.music}: ${S.music ? STR.on : STR.off}`;
  $("sndTog").classList.toggle("on", !!S.sound);
  $("musTog").classList.toggle("on", !!S.music);
}
function buildSettings() {
  const area = $("optArea"); area.innerHTML = "";
  const groups = [
    ["diff", STR.aiDifficulty, STR.diffNames, STR.diffTaunts],
    ["arena", STR.arenaSize, STR.arenaNames],
    ["speed", STR.burnSpeed, STR.speedNames],
    ["theme", STR.theme, STR.themeNames],
    ["flame", STR.flameColor, STR.flameNames],
    ["fx", STR.effects, STR.fxNames]
  ];
  for (const [key, label, names, subs] of groups) {
    const g = document.createElement("div"); g.className = "optGroup";
    const l = document.createElement("label"); l.textContent = label; g.appendChild(l);
    const opts = document.createElement("div"); opts.className = "opts";
    names.forEach((n, i) => {
      const o = document.createElement("div");
      o.className = "opt" + (S[key] === i ? " sel" : "");
      o.innerHTML = n + (subs ? `<small>${subs[i]}</small>` : "");
      o.onclick = () => { S[key] = i; saveS(); buildSettings(); sfx.tick(); };
      opts.appendChild(o);
    });
    g.appendChild(opts); area.appendChild(g);
  }
}
function togglePause() {
  if (!game) return;
  if (game.scene === "play") { game.scene = "paused"; show("pause"); }
  else if (game.scene === "paused") { game.scene = "play"; show(null); }
}
function startMatch() {
  audioInit();
  newGame();
  show(null);
  sfx.tick();
}
$("playBtn").onclick = startMatch;
$("replayBtn").onclick = startMatch;
$("howBtn").onclick = () => { audioInit(); show("howto"); sfx.tick(); };
$("howBack").onclick = () => { show(game && game.scene !== "home" ? "results" : "home"); sfx.tick(); };
$("setBtn").onclick = () => { audioInit(); buildSettings(); show("settings"); sfx.tick(); };
$("rSetBtn").onclick = () => { buildSettings(); show("settings"); sfx.tick(); };
$("setBack").onclick = () => {
  show(game && game.scene === "results" ? "results" : "home"); sfx.tick();
};
$("sndTog").onclick = () => { audioInit(); S.sound = S.sound ? 0 : 1; saveS(); applyAudioToggles(); updateTogs(); sfx.tick(); };
$("musTog").onclick = () => { audioInit(); S.music = S.music ? 0 : 1; saveS(); applyAudioToggles(); updateTogs(); };
$("pauseBtn").onclick = togglePause;
$("resumeBtn").onclick = togglePause;
$("restartBtn").onclick = () => { startMatch(); };
$("quitBtn").onclick = () => { game.scene = "home"; show("home"); music.setIntensity(0.3); };
addEventListener("blur", () => { if (game && game.scene === "play") togglePause(); });

bindTexts();

/* ================= loop ================= */
const dev = new URLSearchParams(location.search).has("dev");
if (dev) $("dev").style.display = "block";
const STEP = 1000 / 60;
let acc = 0, last = performance.now(), frames = 0, fpsAt = last;
let updates = 0;
window.SF = {
  get game() { return game; }, get board() { return board; },
  get updates() { return updates; }, get flames() { return { pF, bF }; },
  start: startMatch, rotate: (x, y, d) => tryRotate("p", x, y, d),
  set(k, v) { S[k] = v; },
  // headless simulation stepping (verification / smoke tests)
  step(ms) { let n = Math.round(ms / STEP); while (n-- > 0) { if (game && game.scene !== "paused") { update(STEP / 1000); stepParticles(STEP / 1000); updates++; } } }
};
function frame(now, fromWatchdog) {
  if (!fromWatchdog) requestAnimationFrame(t => frame(t, false));
  acc += Math.min(200, now - last); last = now;
  pollPad();
  while (acc >= STEP) {
    if (game && game.scene !== "paused") { update(STEP / 1000); stepParticles(STEP / 1000); updates++; }
    acc -= STEP;
  }
  render();
  if (dev && (frames++, now - fpsAt >= 500)) {
    const fps = Math.round(frames * 1000 / (now - fpsAt)); frames = 0; fpsAt = now;
    $("dev").textContent = fps + " fps · particles " + particles.length;
  }
}
requestAnimationFrame(t => frame(t, false));
// watchdog: browsers starve rAF in occluded/background windows — keep the
// simulation stepping (render catches up when frames resume)
setInterval(() => {
  const now = performance.now();
  if (now - last > 120) frame(now, true);
}, 66);
