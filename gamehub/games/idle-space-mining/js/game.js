'use strict';
// Core game logic: production math, purchases, prestige, events, exploration, offline progress.

const Game = {
  buyAmount: 1, // 1 | 10 | 100 | 'max'
  _achTimer: 0,
  _cpsAcc: 0,
  _cpsTime: 0,

  // ------------------------------------------------------------ multipliers
  researchMult(type) {
    let m = 1;
    for (const r of DATA.research) if (S.research[r.id] && r.type === type) m *= r.value;
    return m;
  },
  researchSum(type) {
    let v = 0;
    for (const r of DATA.research) if (S.research[r.id] && r.type === type) v += r.value;
    return v;
  },
  managerMult(type) {
    let m = 1;
    for (const a of DATA.managers) if (S.managers[a.id] && a.type === type) m *= a.value;
    return m;
  },
  shipBonus(type) {
    let v = 0;
    for (const sh of DATA.ships) {
      const lvl = S.ships[sh.id] || 0;
      if (lvl > 0 && sh.type === type) v += sh.value * lvl;
    }
    return v;
  },
  eventMult(type) {
    if (!S.event) return 1;
    const def = DATA.eventMap[S.event.id];
    return (def && def.mult && def.mult[type]) || 1;
  },
  achMult() { return 1 + 0.01 * Object.keys(S.achievements).length; },
  geMult() { return 1 + 0.02 * S.ge; },

  allMult() {
    return this.geMult() * this.achMult() * this.researchMult('all') * this.managerMult('all')
      * (1 + this.shipBonus('all')) * this.eventMult('all');
  },
  miningMult() {
    const p = DATA.planetMap[S.currentPlanet];
    return p.mult * this.allMult() * this.researchMult('mining') * this.managerMult('mining')
      * (1 + this.shipBonus('mining')) * this.eventMult('mining');
  },
  sellMult() {
    return this.researchMult('sell') * this.managerMult('sell')
      * (1 + this.shipBonus('sell')) * this.eventMult('sell');
  },
  factoryMult() {
    return this.allMult() * this.researchMult('factory') * this.managerMult('factory');
  },
  rpMult() {
    return this.allMult() * this.researchMult('rp') * this.managerMult('rp') * (1 + this.shipBonus('rp'));
  },

  // ------------------------------------------------------------ rates
  energyProd() {
    let e = 0;
    for (const g of DATA.generators) e += (S.generators[g.id] || 0) * g.out;
    return e * this.researchMult('energy') * this.eventMult('energy');
  },
  energyUse() {
    let u = 0;
    for (const m of DATA.miners) u += (S.miners[m.id] || 0) * m.energy;
    for (const f of DATA.factories) u += (S.factories[f.id] || 0) * f.energy;
    u += S.labs * DATA.labs.energy;
    return u;
  },
  energyEff() {
    const use = this.energyUse();
    if (use <= 0) return 1;
    return Math.min(1, this.energyProd() / use);
  },
  oreRateBase() {
    let r = 0;
    for (const m of DATA.miners) r += (S.miners[m.id] || 0) * m.prod;
    return r;
  },
  oreRate() { return this.oreRateBase() * this.miningMult() * this.energyEff(); },
  rpRate() { return S.labs * DATA.labs.rate * this.rpMult() * this.energyEff(); },

  clickPower() {
    let v = (1 + S.drill) * this.researchMult('click') * this.miningMult() * this.eventMult('click');
    v += this.researchSum('synergy') * this.oreRate();
    return v;
  },

  avgOreValue(planetId) {
    const p = DATA.planetMap[planetId || S.currentPlanet];
    let v = 0;
    for (const [rid, w] of Object.entries(p.dist)) v += w * DATA.resourceMap[rid].value;
    return v;
  },

  totalMiners() { let n = 0; for (const k in S.miners) n += S.miners[k]; return n; },
  totalFactories() { let n = 0; for (const k in S.factories) n += S.factories[k]; return n; },

  // ------------------------------------------------------------ core actions
  gainOre(amount) {
    const p = DATA.planetMap[S.currentPlanet];
    for (const [rid, w] of Object.entries(p.dist)) {
      S.resources[rid] = (S.resources[rid] || 0) + amount * w;
    }
    S.stats.oreMined += amount;
  },

  addCredits(v) {
    S.credits += v;
    S.stats.creditsEarned += v;
    S.runCredits += v;
    this._cpsAcc += v;
  },

  click() {
    const v = this.clickPower();
    this.gainOre(v);
    S.stats.clicks++;
    return v;
  },

  sellValue() {
    let v = 0;
    for (const r of DATA.resources) v += (S.resources[r.id] || 0) * r.value;
    return v * this.sellMult();
  },

  sellAll() {
    const v = this.sellValue();
    if (v <= 0) return 0;
    for (const r of DATA.resources) S.resources[r.id] = 0;
    this.addCredits(v);
    return v;
  },

  // ------------------------------------------------------------ main tick
  tick(dt) {
    S.stats.playTime += dt;
    const eff = this.energyEff();

    // Mining
    const ore = this.oreRateBase() * this.miningMult() * eff * dt;
    if (ore > 0) this.gainOre(ore);

    // Factories: consume input resources, output credits
    const fm = this.factoryMult() * eff;
    for (const f of DATA.factories) {
      const n = S.factories[f.id] || 0;
      if (!n) continue;
      const need = f.inRate * n * dt;
      const avail = S.resources[f.input] || 0;
      const frac = need > 0 ? Math.min(1, avail / need) : 0;
      if (frac > 0) {
        S.resources[f.input] = avail - need * frac;
        this.addCredits(f.outCr * n * frac * fm * dt);
      }
    }

    // Research labs
    const rp = this.rpRate() * dt;
    if (rp > 0) { S.rp += rp; S.stats.rpEarned += rp; }

    // Auto-sell (after factories have taken their share this tick)
    if (S.research.autosell) this.sellAll();

    // Rolling credits/sec estimate
    this._cpsTime += dt;
    if (this._cpsTime >= 2) {
      S.stats.cps = this._cpsAcc / this._cpsTime;
      if (S.stats.cps > S.stats.bestCps) S.stats.bestCps = S.stats.cps;
      this._cpsAcc = 0;
      this._cpsTime = 0;
    }

    // Exploration mission completion
    if (S.mission && Date.now() >= S.mission.endsAt) this.completeMission();

    // Random events
    if (S.event && Date.now() >= S.event.endsAt) {
      S.event = null;
      UI.dirty();
    }
    if (!S.event && Date.now() >= S.nextEventAt) this.trySpawnEvent();

    // Achievements (checked ~1/sec)
    this._achTimer += dt;
    if (this._achTimer >= 1) {
      this._achTimer = 0;
      this.checkAchievements();
    }
  },

  // ------------------------------------------------------------ purchasing
  bulkCost(base, mult, owned, n) {
    return base * Math.pow(mult, owned) * (Math.pow(mult, n) - 1) / (mult - 1);
  },
  maxBuy(base, mult, owned, budget) {
    const first = base * Math.pow(mult, owned);
    if (budget < first) return 0;
    return Math.floor(Math.log(budget * (mult - 1) / first + 1) / Math.log(mult));
  },
  // Resolve buy count & cost for the current buy-amount setting
  buyPlan(base, mult, owned) {
    let n = this.buyAmount === 'max' ? this.maxBuy(base, mult, owned, S.credits) : this.buyAmount;
    if (this.buyAmount === 'max' && n < 1) n = 1; // show cost of 1 when can't afford any
    return { n, cost: this.bulkCost(base, mult, owned, n) };
  },

  buyMiner(id) {
    const m = DATA.minerMap[id];
    const owned = S.miners[id] || 0;
    const { n, cost } = this.buyPlan(m.cost, DATA.minerCostMult, owned);
    if (S.credits < cost || n < 1) return Sound.play('deny');
    S.credits -= cost;
    S.miners[id] = owned + n;
    Sound.play('buy');
    UI.toastOnceKey('miner-' + id, m.icon + ' ' + m.name + ' deployed!');
    UI.dirty();
  },

  buyGenerator(id) {
    const g = DATA.generatorMap[id];
    const owned = S.generators[id] || 0;
    const { n, cost } = this.buyPlan(g.cost, DATA.generatorCostMult, owned);
    if (S.credits < cost || n < 1) return Sound.play('deny');
    S.credits -= cost;
    S.generators[id] = owned + n;
    Sound.play('buy');
    UI.dirty();
  },

  buyFactory(id) {
    const f = DATA.factoryMap[id];
    const owned = S.factories[id] || 0;
    const { n, cost } = this.buyPlan(f.cost, DATA.factoryCostMult, owned);
    if (S.credits < cost || n < 1) return Sound.play('deny');
    S.credits -= cost;
    S.factories[id] = owned + n;
    Sound.play('buy');
    UI.dirty();
  },

  buyLab() {
    const { n, cost } = this.buyPlan(DATA.labs.cost, DATA.labs.costMult, S.labs);
    if (S.credits < cost || n < 1) return Sound.play('deny');
    S.credits -= cost;
    S.labs += n;
    Sound.play('buy');
    UI.dirty();
  },

  drillCost() { return 50 * Math.pow(1.6, S.drill); },
  buyDrill() {
    const cost = this.drillCost();
    if (S.credits < cost) return Sound.play('deny');
    S.credits -= cost;
    S.drill++;
    Sound.play('buy');
    UI.dirty();
  },

  buyResearch(id) {
    const r = DATA.researchMap[id];
    if (!r || S.research[id]) return;
    if (r.req && !S.research[r.req]) return Sound.play('deny');
    if (S.rp < r.cost) return Sound.play('deny');
    S.rp -= r.cost;
    S.research[id] = 1;
    Sound.play('research');
    UI.toast('🔬 Research complete: ' + r.name, 'good');
    UI.dirty();
  },

  buyManager(id) {
    const m = DATA.managerMap[id];
    if (!m || S.managers[id]) return;
    if (S.credits < m.cost) return Sound.play('deny');
    S.credits -= m.cost;
    S.managers[id] = 1;
    Sound.play('research');
    UI.toast(m.icon + ' ' + m.name + ' is now online!', 'good');
    UI.dirty();
  },

  shipCost(id) {
    const sh = DATA.shipMap[id];
    const lvl = S.ships[id] || 0;
    return sh.baseCost * Math.pow(sh.costMult, lvl);
  },
  buyShip(id) {
    const sh = DATA.shipMap[id];
    const lvl = S.ships[id] || 0;
    if (lvl >= sh.max) return;
    const cost = this.shipCost(id);
    if (S.credits < cost) return Sound.play('deny');
    S.credits -= cost;
    S.ships[id] = lvl + 1;
    Sound.play('buy');
    UI.toast(sh.icon + ' ' + sh.name + ' → level ' + (lvl + 1), 'good');
    UI.dirty();
  },

  // ------------------------------------------------------------ planets
  unlockPlanet(id) {
    const p = DATA.planetMap[id];
    if (!p || S.planets[id]) return;
    if (S.credits < p.cost) return Sound.play('deny');
    S.credits -= p.cost;
    S.planets[id] = 1;
    this.selectPlanet(id);
    Sound.play('planet');
    UI.toast('🪐 New world unlocked: ' + p.name + '!', 'good');
  },

  selectPlanet(id) {
    if (!S.planets[id]) return;
    S.currentPlanet = id;
    Render.setPlanet(id);
    UI.dirty();
  },

  // ------------------------------------------------------------ exploration
  missionDuration(m) {
    const speed = this.researchMult('explspeed'); // <1 = faster
    // Explorer level 1 is the baseline; each level past it shaves 5% off mission time
    const shipSpeed = Math.max(0.5, 1 - (this.shipBonus('explore') - 0.05));
    return m.dur * speed * shipSpeed;
  },
  startMission(id) {
    if (S.mission) return;
    if (!(S.ships.explorer > 0)) return Sound.play('deny');
    const m = DATA.missionMap[id];
    const dur = this.missionDuration(m) * 1000;
    S.mission = { id, startedAt: Date.now(), endsAt: Date.now() + dur };
    Sound.play('buy');
    UI.toast(m.icon + ' Mission launched: ' + m.name, 'info');
    UI.dirty();
  },
  completeMission() {
    const m = DATA.missionMap[S.mission.id];
    S.mission = null;
    S.stats.missions++;
    const cps = Math.max(S.stats.cps, this.oreRate() * this.avgOreValue() * this.sellMult(), 10);
    let credits = cps * m.dur * m.mult * this.researchMult('explreward');
    this.addCredits(credits);
    let extra = '';
    // Chance of bonus rare resources from the current planet's richest vein
    if (Math.random() < 0.35) {
      const p = DATA.planetMap[S.currentPlanet];
      const rids = Object.keys(p.dist);
      const rid = rids[rids.length - 1]; // rarest resource on this planet
      const res = DATA.resourceMap[rid];
      const amt = Math.max(1, credits * 0.1 / res.value);
      S.resources[rid] = (S.resources[rid] || 0) + amt;
      extra = ' +' + fmt(amt) + ' ' + res.name + '!';
    }
    const flavor = DATA.missionFlavor[Math.floor(Math.random() * DATA.missionFlavor.length)];
    Sound.play('achievement');
    UI.toast('🚀 ' + flavor + ' Earned ' + fmt(credits) + ' credits.' + extra, 'good', 8000);
    UI.dirty();
  },

  // ------------------------------------------------------------ random events
  trySpawnEvent() {
    // Events only start once the player has a real operation going
    if (S.stats.creditsEarned < 10e3) {
      S.nextEventAt = Date.now() + 60e3;
      return;
    }
    const pool = DATA.events;
    const totalW = pool.reduce((a, e) => a + e.weight, 0);
    let roll = Math.random() * totalW;
    let def = pool[0];
    for (const e of pool) { roll -= e.weight; if (roll <= 0) { def = e; break; } }

    S.stats.eventsSeen++;
    S.nextEventAt = Date.now() + (120e3 + Math.random() * 150e3);

    if (def.instant) {
      this.applyInstantEvent(def);
    } else {
      S.event = { id: def.id, endsAt: Date.now() + def.dur * 1000 };
      Sound.play(def.good ? 'event' : 'bad');
      UI.toast(def.icon + ' ' + def.name + ' — ' + def.desc + ' (' + def.dur + 's)', def.good ? 'good' : 'bad', 6000);
    }
    UI.dirty();
  },

  applyInstantEvent(def) {
    const cps = Math.max(S.stats.cps, 5);
    switch (def.instant) {
      case 'credits': {
        const v = cps * 90;
        this.addCredits(v);
        Sound.play('event');
        UI.toast('⚡ Quantum Surge! +' + fmt(v) + ' credits', 'good', 6000);
        break;
      }
      case 'resources': {
        const amt = Math.max(this.oreRate() * 120, this.clickPower() * 50);
        this.gainOre(amt);
        Sound.play('event');
        UI.toast('📦 Lost cargo recovered! +' + fmt(amt) + ' ore', 'good', 6000);
        break;
      }
      case 'pirates': {
        if ((S.ships.defense || 0) > 0) {
          const v = cps * 60;
          this.addCredits(v);
          Sound.play('event');
          UI.toast('🛡️ Your defense fleet repelled pirates and seized ' + fmt(v) + ' credits of loot!', 'good', 7000);
        } else {
          const loss = S.credits * 0.05;
          S.credits -= loss;
          Sound.play('bad');
          UI.toast('🏴‍☠️ Pirates raided your stores! Lost ' + fmt(loss) + ' credits. (Defense Ships prevent this)', 'bad', 7000);
        }
        break;
      }
      case 'treasure': {
        const v = cps * 180;
        this.addCredits(v);
        Sound.play('achievement');
        UI.toast('💰 Secret treasure discovered! +' + fmt(v) + ' credits', 'good', 6000);
        break;
      }
    }
  },

  // ------------------------------------------------------------ achievements
  checkAchievements() {
    let gained = false;
    for (const a of DATA.achievements) {
      if (!S.achievements[a.id] && a.check(S)) {
        S.achievements[a.id] = 1;
        gained = true;
        Sound.play('achievement');
        UI.toast('🏆 Achievement: ' + a.name + ' (+1% all production)', 'gold', 6000);
      }
    }
    if (gained) UI.dirty();
  },

  // ------------------------------------------------------------ prestige
  pendingGE() {
    if (S.runCredits < 1e12) return 0;
    return Math.floor(15 * Math.pow(S.runCredits / 1e12, 0.55));
  },

  prestige() {
    const gain = this.pendingGE();
    if (gain < 1) return;
    S.ge += gain;
    S.prestiges++;
    // Reset run state; keep GE, prestige count, achievements, settings, lifetime stats
    S.credits = 0; S.rp = 0; S.runCredits = 0; S.drill = 0;
    S.resources = {}; S.miners = {}; S.generators = {}; S.factories = {}; S.labs = 0;
    S.research = {}; S.managers = {}; S.ships = {};
    S.planets = { asteroid: 1 };
    S.currentPlanet = 'asteroid';
    S.mission = null; S.event = null;
    S.nextEventAt = Date.now() + 180e3;
    Render.setPlanet('asteroid');
    Sound.play('prestige');
    saveState();
    UI.closeModal();
    UI.toast('🌌 Galactic Ascension! +' + gain + ' Galactic Energy (' + fmt(S.ge * 2) + '% permanent production bonus)', 'gold', 9000);
    UI.dirty();
  },

  // ------------------------------------------------------------ offline progress
  computeOffline() {
    if (!S.lastSave) return null;
    const dt = (Date.now() - S.lastSave) / 1000;
    if (dt < 90) return null;
    const hasComms = !!S.research.offline1;
    const cap = hasComms ? 24 * 3600 : 12 * 3600;
    const rate = hasComms ? 0.75 : 0.5;
    const t = Math.min(dt, cap);

    const ore = this.oreRateBase() * this.miningMult() * this.energyEff() * t * rate;
    const credits = (S.stats.cps || 0) * t * rate;
    const rp = this.rpRate() * t * rate;

    if (ore > 0) this.gainOre(ore);
    if (credits > 0) this.addCredits(credits);
    if (rp > 0) { S.rp += rp; S.stats.rpEarned += rp; }
    if (S.research.autosell) this.sellAll();

    return { away: dt, counted: t, ore, credits, rp, rate };
  },
};
