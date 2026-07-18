'use strict';
// Game state, save/load, export/import.

const SAVE_KEY = 'idle-space-mining-save';
let S = null;

function defaultState() {
  return {
    version: 1,
    credits: 0,
    rp: 0,               // research points
    ge: 0,               // galactic energy (prestige currency)
    runCredits: 0,       // credits earned this prestige run (drives GE gain)
    prestiges: 0,
    drill: 0,            // manual drill upgrade level
    resources: {},       // id -> amount held
    miners: {},          // id -> count
    generators: {},
    factories: {},
    labs: 0,
    research: {},        // id -> 1
    managers: {},        // id -> 1
    ships: {},           // id -> level
    planets: { asteroid: 1 },
    currentPlanet: 'asteroid',
    mission: null,       // {id, endsAt, startedAt}
    event: null,         // {id, endsAt}
    nextEventAt: Date.now() + 180e3,
    achievements: {},    // id -> 1
    tut: { step: 0, done: false },
    stats: {
      oreMined: 0, clicks: 0, creditsEarned: 0, rpEarned: 0,
      cps: 0, bestCps: 0, missions: 0, eventsSeen: 0,
      playTime: 0, startedAt: Date.now(),
    },
    settings: { sfx: 0.5, music: 0.25, particles: true, perf: false },
    lastSave: 0,
  };
}

function mergeState(base, saved) {
  for (const k of Object.keys(saved)) {
    if (saved[k] !== null && typeof saved[k] === 'object' && !Array.isArray(saved[k]) &&
        base[k] !== null && typeof base[k] === 'object' && !Array.isArray(base[k])) {
      mergeState(base[k], saved[k]);
    } else {
      base[k] = saved[k];
    }
  }
  return base;
}

function loadState() {
  S = defaultState();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) mergeState(S, JSON.parse(raw));
  } catch (e) {
    console.warn('Save load failed, starting fresh:', e);
  }
  if (!DATA.planetMap[S.currentPlanet]) S.currentPlanet = 'asteroid';
}

function saveState() {
  S.lastSave = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage full/blocked */ }
}

function exportSave() {
  saveState();
  return btoa(unescape(encodeURIComponent(JSON.stringify(S))));
}

function importSave(str) {
  try {
    const obj = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
    if (!obj || typeof obj.credits !== 'number') throw new Error('bad save');
    S = mergeState(defaultState(), obj);
    saveState();
    return true;
  } catch (e) {
    return false;
  }
}

function hardReset() {
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}
