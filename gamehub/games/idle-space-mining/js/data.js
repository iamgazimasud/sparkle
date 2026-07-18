'use strict';
// Static game data: resources, planets, miners, generators, factories, research,
// AI managers, ships, missions, events, achievements.

const DATA = {};

// ---------------------------------------------------------------- Resources
DATA.resources = [
  { id: 'stone',               name: 'Stone',                tier: 'Basic',     value: 0.5,  color: '#9aa5b1', icon: '🪨' },
  { id: 'iron',                name: 'Iron',                 tier: 'Basic',     value: 1,    color: '#c9a687', icon: '⛓️' },
  { id: 'copper',              name: 'Copper',               tier: 'Basic',     value: 2,    color: '#e08d4f', icon: '🟠' },
  { id: 'coal',                name: 'Coal',                 tier: 'Basic',     value: 1.5,  color: '#5b6470', icon: '⚫' },
  { id: 'titanium',            name: 'Titanium',             tier: 'Advanced',  value: 25,   color: '#b8c4d0', icon: '🔩' },
  { id: 'gold',                name: 'Gold',                 tier: 'Advanced',  value: 80,   color: '#ffd54a', icon: '🟡' },
  { id: 'platinum',            name: 'Platinum',             tier: 'Advanced',  value: 150,  color: '#dfe8f2', icon: '⚪' },
  { id: 'uranium',             name: 'Uranium',              tier: 'Advanced',  value: 300,  color: '#8dff57', icon: '☢️' },
  { id: 'diamond',             name: 'Diamond',              tier: 'Advanced',  value: 600,  color: '#9ef2ff', icon: '💎' },
  { id: 'darkMatter',          name: 'Dark Matter',          tier: 'Rare',      value: 5e3,  color: '#a56bff', icon: '🌑' },
  { id: 'quantumCrystal',      name: 'Quantum Crystal',      tier: 'Rare',      value: 2e4,  color: '#5ad0ff', icon: '🔮' },
  { id: 'antimatter',          name: 'Antimatter',           tier: 'Rare',      value: 1e5,  color: '#ff5ad0', icon: '✨' },
  { id: 'stellarCore',         name: 'Stellar Core',         tier: 'Rare',      value: 5e5,  color: '#ffb347', icon: '🌟' },
  { id: 'neutronOre',          name: 'Neutron Ore',          tier: 'Rare',      value: 1e6,  color: '#7f9cff', icon: '🧲' },
  { id: 'singularityFragment', name: 'Singularity Fragment', tier: 'Legendary', value: 5e7,  color: '#ff4d6d', icon: '🕳️' },
  { id: 'alienArtifact',       name: 'Alien Artifact',       tier: 'Legendary', value: 2e8,  color: '#54ffb0', icon: '👽' },
];

// ---------------------------------------------------------------- Planets
DATA.planets = [
  { id: 'asteroid',  name: 'Asteroid X-117',        cost: 0,      mult: 1,    colors: ['#8a8f9c', '#4a4e59', '#9aa5b1'],
    desc: 'A lonely rock drifting through the void. Where every empire begins.',
    dist: { stone: 0.40, iron: 0.35, copper: 0.15, coal: 0.10 } },
  { id: 'moon',      name: 'The Moon',              cost: 50e3,   mult: 2,    colors: ['#d8dce6', '#7d8494', '#c9d4ff'],
    desc: 'Dusty craters hide veins of titanium beneath the regolith.',
    dist: { stone: 0.30, iron: 0.30, copper: 0.20, coal: 0.15, titanium: 0.05 } },
  { id: 'mars',      name: 'Mars',                  cost: 1e6,    mult: 4,    colors: ['#e0764a', '#8a3b22', '#ff9a66'],
    desc: 'The red planet. Iron-rich soil and the first gold deposits.',
    dist: { iron: 0.35, copper: 0.20, coal: 0.15, titanium: 0.20, gold: 0.10 } },
  { id: 'ice',       name: 'Glacius Prime',         cost: 25e6,   mult: 8,    colors: ['#bfe8ff', '#5a9fd4', '#9fe0ff'],
    desc: 'A frozen world. Diamonds glitter in kilometer-deep ice sheets.',
    dist: { stone: 0.25, titanium: 0.30, platinum: 0.25, gold: 0.15, diamond: 0.05 } },
  { id: 'volcanic',  name: 'Ignis IV',              cost: 500e6,  mult: 16,   colors: ['#ff7a3c', '#5a1c10', '#ff5a2a'],
    desc: 'Rivers of magma churn uranium to the surface. Handle with care.',
    dist: { coal: 0.25, titanium: 0.20, uranium: 0.30, gold: 0.15, diamond: 0.10 } },
  { id: 'ocean',     name: 'Thalassa',              cost: 10e9,   mult: 32,   colors: ['#4aa8ff', '#1c3f8a', '#66c2ff'],
    desc: 'An endless sea. Strange dark matter pools in the abyssal trenches.',
    dist: { platinum: 0.30, gold: 0.25, diamond: 0.25, uranium: 0.15, darkMatter: 0.05 } },
  { id: 'gas',       name: 'Titanus Gas Giant',     cost: 250e9,  mult: 64,   colors: ['#e8b46a', '#8a5a2a', '#ffd08a'],
    desc: 'Floating extractors harvest exotic matter from crushing storm bands.',
    dist: { uranium: 0.30, platinum: 0.20, darkMatter: 0.35, quantumCrystal: 0.15 } },
  { id: 'crystal',   name: 'Prisma',                cost: 5e12,   mult: 128,  colors: ['#c48aff', '#5a2a8a', '#d0a0ff'],
    desc: 'The entire planet is one massive quantum crystal lattice.',
    dist: { diamond: 0.30, quantumCrystal: 0.40, darkMatter: 0.20, antimatter: 0.10 } },
  { id: 'alien',     name: 'Xenos Reach',           cost: 100e12, mult: 256,  colors: ['#7aff8a', '#1c5a2a', '#8affa0'],
    desc: 'Ruins of an ancient civilization. Their artifacts still hum with power.',
    dist: { quantumCrystal: 0.30, antimatter: 0.30, darkMatter: 0.20, stellarCore: 0.15, alienArtifact: 0.05 } },
  { id: 'blackhole', name: 'Event Horizon Station', cost: 2.5e15, mult: 512,  colors: ['#3a3a4a', '#0a0a12', '#a56bff'],
    desc: 'Mining the accretion disk of a black hole. Time runs strangely here.',
    dist: { antimatter: 0.35, stellarCore: 0.30, neutronOre: 0.25, darkMatter: 0.10 } },
  { id: 'dyson',     name: 'Dyson Sphere',          cost: 50e15,  mult: 1024, colors: ['#ffd54a', '#8a6a1c', '#ffe08a'],
    desc: 'A megastructure englobing an entire star. Ultimate engineering.',
    dist: { stellarCore: 0.40, neutronOre: 0.30, antimatter: 0.20, singularityFragment: 0.10 } },
  { id: 'core',      name: 'Galaxy Core',           cost: 1e18,   mult: 2048, colors: ['#ff8ad0', '#5a1c4a', '#ffa0d8'],
    desc: 'The blazing heart of the galaxy. Billions of stars within reach.',
    dist: { neutronOre: 0.40, stellarCore: 0.25, singularityFragment: 0.25, alienArtifact: 0.10 } },
  { id: 'dimension', name: 'Unknown Dimension',     cost: 50e18,  mult: 4096, colors: ['#8a9cff', '#2a1c5a', '#a0b0ff'],
    desc: 'Beyond the wormhole. Reality itself can be mined here.',
    dist: { singularityFragment: 0.50, alienArtifact: 0.30, neutronOre: 0.20 } },
];

// ---------------------------------------------------------------- Miners
DATA.miners = [
  { id: 'drone',     name: 'Mining Drone',      cost: 15,     prod: 0.5,   energy: 0,    icon: '🛸', desc: 'A humble automated drone. Chips away at rock, never complains.' },
  { id: 'advDrone',  name: 'Advanced Drone',    cost: 300,    prod: 3,     energy: 1,    icon: '🚁', desc: 'Twin plasma cutters and a bigger cargo hold.' },
  { id: 'laser',     name: 'Mining Laser',      cost: 5e3,    prod: 15,    energy: 3,    icon: '🔦', desc: 'Orbital laser array that vaporizes rock into collectible dust.' },
  { id: 'excavator', name: 'Heavy Excavator',   cost: 75e3,   prod: 70,    energy: 8,    icon: '🚜', desc: 'A rolling fortress of drills and conveyor belts.' },
  { id: 'orbital',   name: 'Orbital Extractor', cost: 1.2e6,  prod: 350,   energy: 20,   icon: '🛰️', desc: 'Pulls ore straight into orbit with gravity tethers.' },
  { id: 'cracker',   name: 'Planet Cracker',    cost: 25e6,   prod: 1800,  energy: 50,   icon: '💥', desc: 'Splits continental plates for convenient access to the mantle.' },
  { id: 'swarm',     name: 'AI Swarm',          cost: 600e6,  prod: 9500,  energy: 120,  icon: '🐝', desc: 'A self-replicating swarm of intelligent micro-miners.' },
  { id: 'nanobots',  name: 'Nanobot Cloud',     cost: 15e9,   prod: 50e3,  energy: 300,  icon: '☁️', desc: 'Disassembles matter atom by atom. Very tidy.' },
  { id: 'quantum',   name: 'Quantum Miner',     cost: 500e9,  prod: 300e3, energy: 800,  icon: '⚛️', desc: 'Mines ore from superpositions of all possible asteroids.' },
  { id: 'reality',   name: 'Reality Extractor', cost: 20e12,  prod: 2e6,   energy: 2000, icon: '🌀', desc: 'Extracts value directly from the fabric of spacetime.' },
];
DATA.minerCostMult = 1.15;

// ---------------------------------------------------------------- Energy generators
DATA.generators = [
  { id: 'solar',   name: 'Solar Panel',         cost: 2e3,   out: 5,      icon: '☀️', desc: 'Clean, simple starlight power.' },
  { id: 'fusion',  name: 'Fusion Reactor',      cost: 4e5,   out: 40,     icon: '🔆', desc: 'A tiny star in a magnetic bottle.' },
  { id: 'nuclear', name: 'Nuclear Plant',       cost: 2e7,   out: 250,    icon: '☢️', desc: 'Classic fission. Reliable and slightly ominous.' },
  { id: 'dm',      name: 'Dark Matter Reactor', cost: 5e10,  out: 2000,   icon: '🌑', desc: 'Annihilates dark matter for absurd energy yields.' },
  { id: 'dyson',   name: 'Dyson Array',         cost: 5e13,  out: 15000,  icon: '🌞', desc: 'A segment of stellar-englobing collectors.' },
  { id: 'coreTap', name: 'Galaxy Core Tap',     cost: 5e16,  out: 120000, icon: '🌌', desc: 'Siphons power from the galactic center itself.' },
];
DATA.generatorCostMult = 1.2;

// ---------------------------------------------------------------- Factories (refine ore into credits)
DATA.factories = [
  { id: 'smelter', name: 'Iron Smelter',      cost: 25e3,  input: 'iron',        inRate: 10, outCr: 45,   energy: 5,    icon: '🏭', product: 'Iron Plates' },
  { id: 'steel',   name: 'Steel Mill',        cost: 1e6,   input: 'iron',        inRate: 50, outCr: 300,  energy: 15,   icon: '🏗️', product: 'Steel' },
  { id: 'alloy',   name: 'Alloy Foundry',     cost: 5e7,   input: 'titanium',    inRate: 20, outCr: 1800, energy: 40,   icon: '⚙️', product: 'Advanced Alloy' },
  { id: 'nano',    name: 'Nano Assembler',    cost: 2e9,   input: 'platinum',    inRate: 10, outCr: 6e3,  energy: 100,  icon: '🔬', product: 'Nano Alloy' },
  { id: 'qforge',  name: 'Quantum Forge',     cost: 5e11,  input: 'darkMatter',  inRate: 5,  outCr: 12e4, energy: 400,  icon: '🌀', product: 'Quantum Alloy' },
  { id: 'splant',  name: 'Singularity Plant', cost: 1e14,  input: 'stellarCore', inRate: 2,  outCr: 6e6,  energy: 1500, icon: '🕳️', product: 'Singularity Matrix' },
];
DATA.factoryCostMult = 1.18;

// ---------------------------------------------------------------- Research labs
DATA.labs = { cost: 10e3, costMult: 1.25, rate: 0.2, energy: 2 };

// ---------------------------------------------------------------- Research tree
// type: mining | click | synergy | autosell | sell | factory | energy | rp | offline | explspeed | explreward | all
DATA.research = [
  { id: 'drills1',  name: 'Improved Drill Bits',      cost: 50,    type: 'mining',     value: 1.25, cat: 'Mining',      desc: 'All mining output ×1.25' },
  { id: 'drills2',  name: 'Laser Focusing Arrays',    cost: 600,   type: 'mining',     value: 1.5,  cat: 'Mining',      req: 'drills1', desc: 'All mining output ×1.5' },
  { id: 'drills3',  name: 'Plasma Bore Technology',   cost: 8e3,   type: 'mining',     value: 2,    cat: 'Mining',      req: 'drills2', desc: 'All mining output ×2' },
  { id: 'drills4',  name: 'Quantum Drilling',         cost: 250e3, type: 'mining',     value: 3,    cat: 'Mining',      req: 'drills3', desc: 'All mining output ×3' },
  { id: 'drills5',  name: 'Alien Alloy Drills',       cost: 5e6,   type: 'mining',     value: 5,    cat: 'Mining',      req: 'drills4', desc: 'All mining output ×5' },
  { id: 'click1',   name: 'Ergonomic Controls',       cost: 100,   type: 'click',      value: 2,    cat: 'Mining',      desc: 'Click power ×2' },
  { id: 'click2',   name: 'Neural Mining Interface',  cost: 10e3,  type: 'click',      value: 5,    cat: 'Mining',      req: 'click1', desc: 'Click power ×5' },
  { id: 'synergy1', name: 'Click Synergy',            cost: 2e3,   type: 'synergy',    value: 0.02, cat: 'Mining',      desc: 'Clicks also gain +2% of your ore/sec' },
  { id: 'synergy2', name: 'Resonant Feedback',        cost: 100e3, type: 'synergy',    value: 0.05, cat: 'Mining',      req: 'synergy1', desc: 'Clicks gain a further +5% of ore/sec' },
  { id: 'autosell', name: 'Auto-Sell Protocols',      cost: 400,   type: 'autosell',   value: 1,    cat: 'Automation',  desc: 'Resources are sold automatically, continuously' },
  { id: 'market1',  name: 'Market Analytics',         cost: 1500,  type: 'sell',       value: 1.25, cat: 'Automation',  desc: 'Sell prices ×1.25' },
  { id: 'market2',  name: 'Galactic Trade Network',   cost: 50e3,  type: 'sell',       value: 1.5,  cat: 'Automation',  req: 'market1', desc: 'Sell prices ×1.5' },
  { id: 'fact1',    name: 'Assembly Lines',           cost: 2500,  type: 'factory',    value: 1.5,  cat: 'Factories',   desc: 'Factory output ×1.5' },
  { id: 'fact2',    name: 'Robotic Workers',          cost: 40e3,  type: 'factory',    value: 2,    cat: 'Factories',   req: 'fact1', desc: 'Factory output ×2' },
  { id: 'fact3',    name: 'Self-Optimizing Plants',   cost: 1e6,   type: 'factory',    value: 3,    cat: 'Factories',   req: 'fact2', desc: 'Factory output ×3' },
  { id: 'energy1',  name: 'Superconductors',          cost: 1e3,   type: 'energy',     value: 1.25, cat: 'Energy',      desc: 'Energy production ×1.25' },
  { id: 'energy2',  name: 'Fusion Efficiency',        cost: 20e3,  type: 'energy',     value: 1.5,  cat: 'Energy',      req: 'energy1', desc: 'Energy production ×1.5' },
  { id: 'energy3',  name: 'Zero-Point Taps',          cost: 500e3, type: 'energy',     value: 2,    cat: 'Energy',      req: 'energy2', desc: 'Energy production ×2' },
  { id: 'rp1',      name: 'Research Grants',          cost: 5e3,   type: 'rp',         value: 1.5,  cat: 'Science',     desc: 'Research point gain ×1.5' },
  { id: 'rp2',      name: 'AI Research Assistants',   cost: 100e3, type: 'rp',         value: 2,    cat: 'Science',     req: 'rp1', desc: 'Research point gain ×2' },
  { id: 'offline1', name: 'Deep Space Comms',         cost: 10e3,  type: 'offline',    value: 1,    cat: 'Science',     desc: 'Offline progress: cap 24h, efficiency 75%' },
  { id: 'expl1',    name: 'Ion Thrusters',            cost: 5e3,   type: 'explspeed',  value: 0.75, cat: 'Exploration', desc: 'Exploration missions 25% faster' },
  { id: 'expl2',    name: 'Warp Drive',               cost: 200e3, type: 'explspeed',  value: 0.5,  cat: 'Exploration', req: 'expl1', desc: 'Exploration missions 50% faster' },
  { id: 'expl3',    name: 'Xenolinguistics',          cost: 50e3,  type: 'explreward', value: 2,    cat: 'Exploration', desc: 'Exploration rewards ×2' },
  { id: 'sing',     name: 'Singularity Studies',      cost: 5e7,   type: 'all',        value: 2,    cat: 'Science',     desc: 'ALL production ×2' },
];

// ---------------------------------------------------------------- AI Managers
DATA.managers = [
  { id: 'engineer',  name: 'Engineer AI',  cost: 1e6,   type: 'mining',  value: 1.25, icon: '🤖', desc: '+25% mining speed. Optimizes every drill rotation.' },
  { id: 'scientist', name: 'Scientist AI', cost: 10e6,  type: 'rp',      value: 1.4,  icon: '🧠', desc: '+40% research speed. Never sleeps, always theorizes.' },
  { id: 'logistics', name: 'Logistics AI', cost: 50e6,  type: 'factory', value: 1.5,  icon: '📦', desc: '+50% factory output. Perfect routing, zero waste.' },
  { id: 'economy',   name: 'Economy AI',   cost: 250e6, type: 'sell',    value: 1.2,  icon: '💹', desc: '+20% sell prices. Reads galactic markets like a book.' },
  { id: 'quantum',   name: 'Quantum AI',   cost: 10e9,  type: 'all',     value: 1.1,  icon: '⚛️', desc: '+10% ALL production. Occasionally duplicates reality.' },
];

// ---------------------------------------------------------------- Ships
DATA.ships = [
  { id: 'cargo',    name: 'Cargo Ship',      baseCost: 5e6,   costMult: 3, max: 10, type: 'sell',    value: 0.10, icon: '🚚', desc: '+10% sell price per level' },
  { id: 'miner',    name: 'Mining Ship',     baseCost: 20e6,  costMult: 3, max: 10, type: 'mining',  value: 0.15, icon: '⛏️', desc: '+15% mining per level' },
  { id: 'explorer', name: 'Explorer',        baseCost: 50e6,  costMult: 4, max: 5,  type: 'explore', value: 0.05, icon: '🔭', desc: 'Unlocks exploration missions. -5% mission time per level' },
  { id: 'research', name: 'Research Vessel', baseCost: 100e6, costMult: 3, max: 10, type: 'rp',      value: 0.20, icon: '🧪', desc: '+20% research points per level' },
  { id: 'defense',  name: 'Defense Ship',    baseCost: 250e6, costMult: 4, max: 5,  type: 'defense', value: 1,    icon: '🛡️', desc: 'Repels pirates — attacks become loot instead of losses' },
  { id: 'cruiser',  name: 'Quantum Cruiser', baseCost: 100e9, costMult: 5, max: 5,  type: 'all',     value: 0.25, icon: '🚀', desc: '+25% ALL production per level' },
];

// ---------------------------------------------------------------- Exploration missions
DATA.missions = [
  { id: 'short',  name: 'Nearby Sector Sweep',   dur: 120,  mult: 1.5, icon: '🛰️', desc: 'A quick scan of the local asteroid field.' },
  { id: 'medium', name: 'Deep Field Expedition', dur: 600,  mult: 3,   icon: '🌠', desc: 'Chart unexplored systems beyond the frontier.' },
  { id: 'long',   name: 'Wormhole Traverse',     dur: 1800, mult: 6,   icon: '🕳️', desc: 'Risk the wormhole. Legendary rewards await.' },
];
DATA.missionFlavor = [
  'Your crew discovered a derelict station drifting in the dark.',
  'Ancient alien ruins yielded their secrets.',
  'A comet rich with frozen minerals crossed your path.',
  'You charted a hidden nebula and sold the maps.',
  'Space pirates fled at the sight of your fleet.',
  'A wormhole spat your ship out next to a treasure barge.',
  'Your scanners located a pristine mineral belt.',
  'An alien merchant traded exotic goods for star charts.',
];

// ---------------------------------------------------------------- Random events
DATA.events = [
  { id: 'meteor',      name: 'Meteor Shower',      icon: '☄️', dur: 30, weight: 10, good: true,  mult: { click: 7 },    desc: 'Click power ×7 — mine those meteors!' },
  { id: 'rush',        name: 'Mining Rush',        icon: '⛏️', dur: 60, weight: 12, good: true,  mult: { mining: 3 },   desc: 'Mining output ×3' },
  { id: 'boom',        name: 'Resource Boom',      icon: '📈', dur: 60, weight: 10, good: true,  mult: { all: 2 },      desc: 'ALL production ×2' },
  { id: 'merchant',    name: 'Alien Merchant',     icon: '👽', dur: 45, weight: 8,  good: true,  mult: { sell: 2.5 },   desc: 'Sell prices ×2.5' },
  { id: 'surge',       name: 'Quantum Surge',      icon: '⚡', weight: 8,  good: true,  instant: 'credits',   desc: 'A surge of quantum energy converts directly into credits!' },
  { id: 'cargo',       name: 'Lost Cargo Found',   icon: '📦', weight: 8,  good: true,  instant: 'resources', desc: 'A drifting cargo pod full of ore!' },
  { id: 'pirates',     name: 'Pirate Attack',      icon: '🏴‍☠️', weight: 6,  good: false, instant: 'pirates',   desc: 'Pirates raid your operation!' },
  { id: 'storm',       name: 'Solar Storm',        icon: '🌪️', dur: 45, weight: 5,  good: false, mult: { energy: 0.5 }, desc: 'Energy production halved' },
  { id: 'malfunction', name: 'Robot Malfunction',  icon: '🔧', dur: 30, weight: 4,  good: false, mult: { mining: 0.7 }, desc: 'Mining output -30%' },
  { id: 'treasure',    name: 'Secret Treasure',    icon: '💰', weight: 4,  good: true,  instant: 'treasure',  desc: 'A hidden cache of ancient wealth!' },
];

// ---------------------------------------------------------------- Achievements (+1% all production each)
DATA.achievements = [];
(function buildAchievements() {
  const add = (id, name, desc, check) => DATA.achievements.push({ id, name, desc, check });
  [[1e3, 'Pebble Pusher'], [1e6, 'Rock Hound'], [1e9, 'Asteroid Eater'], [1e12, 'Planet Cracker'], [1e15, 'Star Devourer'], [1e18, 'Galaxy Consumer']]
    .forEach(([v, n], i) => add('ore' + i, n, 'Mine ' + fmt(v) + ' total ore', s => s.stats.oreMined >= v));
  [[100, 'Button Masher'], [1e3, 'Carpal Tunnel Candidate'], [1e4, 'Click Machine'], [1e5, 'Transcended Clicker']]
    .forEach(([v, n], i) => add('click' + i, n, 'Click ' + fmt(v) + ' times', s => s.stats.clicks >= v));
  [[1e4, 'First Paycheck'], [1e6, 'Millionaire'], [1e9, 'Billionaire'], [1e12, 'Trillionaire'], [1e15, 'Quadrillionaire'], [1e18, 'Galactic Tycoon']]
    .forEach(([v, n], i) => add('cr' + i, n, 'Earn ' + fmt(v) + ' lifetime credits', s => s.stats.creditsEarned >= v));
  [[10, 'Fleet Foreman'], [50, 'Drone Commander'], [200, 'Swarm Lord'], [500, 'Machine Emperor'], [1000, 'One With The Swarm']]
    .forEach(([v, n], i) => add('miner' + i, n, 'Own ' + v + ' total miners', s => Game.totalMiners() >= v));
  [[3, 'Solar Wanderer'], [6, 'System Hopper'], [10, 'Void Pioneer'], [13, 'Master of All Worlds']]
    .forEach(([v, n], i) => add('planet' + i, n, 'Unlock ' + v + ' planets', s => Object.keys(s.planets).length >= v));
  [[5, 'Curious Mind'], [15, 'Mad Scientist'], [25, 'Omniscient']]
    .forEach(([v, n], i) => add('res' + i, n, 'Complete ' + v + ' research projects', s => Object.keys(s.research).length >= v));
  [[10, 'Industrialist'], [50, 'Factory Magnate'], [150, 'Production Singularity']]
    .forEach(([v, n], i) => add('fact' + i, n, 'Own ' + v + ' total factories', s => Game.totalFactories() >= v));
  [[1, 'Born Again'], [5, 'Cycle Breaker'], [10, 'Eternal Ascendant']]
    .forEach(([v, n], i) => add('pres' + i, n, 'Ascend ' + v + ' time' + (v > 1 ? 's' : ''), s => s.prestiges >= v));
  add('ai1', 'Ghost in the Machine', 'Hire your first AI manager', s => Object.keys(s.managers).length >= 1);
  add('ai2', 'Council of Minds', 'Hire all 5 AI managers', s => Object.keys(s.managers).length >= 5);
  add('ship1', 'Set Sail', 'Buy your first ship', s => Object.values(s.ships).some(l => l > 0));
  add('expl1', 'Into the Unknown', 'Complete 5 exploration missions', s => s.stats.missions >= 5);
  add('bh', 'Event Horizon', 'Unlock the Black Hole Station', s => !!s.planets.blackhole);
  add('emperor', 'Galactic Emperor', 'Unlock the Unknown Dimension', s => !!s.planets.dimension);
})();

// ---------------------------------------------------------------- Lookup maps
DATA.resourceMap = Object.fromEntries(DATA.resources.map(r => [r.id, r]));
DATA.planetMap = Object.fromEntries(DATA.planets.map(p => [p.id, p]));
DATA.minerMap = Object.fromEntries(DATA.miners.map(m => [m.id, m]));
DATA.generatorMap = Object.fromEntries(DATA.generators.map(g => [g.id, g]));
DATA.factoryMap = Object.fromEntries(DATA.factories.map(f => [f.id, f]));
DATA.researchMap = Object.fromEntries(DATA.research.map(r => [r.id, r]));
DATA.managerMap = Object.fromEntries(DATA.managers.map(m => [m.id, m]));
DATA.shipMap = Object.fromEntries(DATA.ships.map(s => [s.id, s]));
DATA.missionMap = Object.fromEntries(DATA.missions.map(m => [m.id, m]));
DATA.eventMap = Object.fromEntries(DATA.events.map(e => [e.id, e]));
