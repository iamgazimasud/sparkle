'use strict';
// Canvas scene: parallax starfield, nebula, rotating planet, orbiting drones with
// mining lasers, click particles and floating numbers.

const Render = {
  canvas: null, ctx: null,
  w: 0, h: 0, dpr: 1,
  stars: [],
  parts: [],   // spark particles
  texts: [],   // floating numbers
  angle: 0,
  planet: null,
  surface: [], // seeded surface blobs
  drones: [],
  bg: null,    // cached nebula background
  pulse: 0,    // click pulse on planet

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    if (window.ResizeObserver) {
      new ResizeObserver(() => this.resize()).observe(canvas.parentElement);
    }
    this.setPlanet(S.currentPlanet);
  },

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const w = Math.min(rect.width, window.innerWidth);
    const h = Math.max(260, rect.height);
    if (Math.abs(w - this.w) < 1 && Math.abs(h - this.h) < 1) return; // no real change
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = w;
    this.h = h;
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.makeStars();
    if (this.planet) this.makeBackground();
  },

  makeStars() {
    this.stars = [];
    const count = Math.floor((this.w * this.h) / 3200);
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        r: Math.random() * 1.3 + 0.3,
        layer: Math.random() < 0.6 ? 0.15 : Math.random() < 0.85 ? 0.35 : 0.7,
        tw: Math.random() * Math.PI * 2,
      });
    }
  },

  // Deterministic pseudo-random from seed (so planet surfaces are stable)
  seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 16807 + 12345) % 2147483647;
      return (s & 0xffff) / 0xffff;
    };
  },

  setPlanet(id) {
    this.planet = DATA.planetMap[id];
    const idx = DATA.planets.findIndex(p => p.id === id);
    const rand = this.seeded(idx * 7919 + 13);
    this.surface = [];
    const blobs = 9 + Math.floor(rand() * 6);
    for (let i = 0; i < blobs; i++) {
      this.surface.push({
        a: rand() * Math.PI * 2,       // longitude
        lat: (rand() - 0.5) * 1.6,     // latitude (-0.8..0.8 of radius)
        r: 0.08 + rand() * 0.2,        // size relative to planet radius
        dark: rand() < 0.6,
      });
    }
    this.drones = [];
    this.makeBackground();
  },

  makeBackground() {
    if (!this.w) return;
    this.bg = document.createElement('canvas');
    this.bg.width = this.w; this.bg.height = this.h;
    const c = this.bg.getContext('2d');
    c.fillStyle = '#05060e';
    c.fillRect(0, 0, this.w, this.h);
    const glow = this.planet ? this.planet.colors[2] : '#5ad0ff';
    // Two soft nebula clouds tinted by the planet palette
    const neb = (x, y, r, color, alpha) => {
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(5,6,14,0)');
      c.globalAlpha = alpha;
      c.fillStyle = g;
      c.fillRect(0, 0, this.w, this.h);
      c.globalAlpha = 1;
    };
    neb(this.w * 0.2, this.h * 0.25, this.w * 0.55, glow, 0.10);
    neb(this.w * 0.85, this.h * 0.7, this.w * 0.5, '#a56bff', 0.07);
    neb(this.w * 0.6, this.h * 0.1, this.w * 0.4, '#37e0ff', 0.05);
  },

  planetGeom() {
    const r = Math.min(this.w, this.h) * 0.28;
    return { x: this.w / 2, y: this.h * 0.52, r };
  },

  clickBurst(x, y) {
    if (!S.settings.particles) return;
    const glow = this.planet.colors[2];
    const n = S.settings.perf ? 5 : 12;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 140;
      this.parts.push({
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: 0.5 + Math.random() * 0.4, t: 0,
        r: 1 + Math.random() * 2.5,
        color: Math.random() < 0.6 ? glow : '#ffffff',
      });
    }
    this.pulse = 1;
  },

  floatText(txt, x, y, color) {
    this.texts.push({ txt, x: x + (Math.random() - 0.5) * 30, y, t: 0, life: 1.2, color: color || '#fff' });
    if (this.texts.length > 30) this.texts.shift();
  },

  draw(dt) {
    const ctx = this.ctx;
    if (!ctx || !this.planet) return;
    const { x: px, y: py, r: pr } = this.planetGeom();

    // Background
    if (this.bg) ctx.drawImage(this.bg, 0, 0, this.w, this.h);
    else { ctx.fillStyle = '#05060e'; ctx.fillRect(0, 0, this.w, this.h); }

    // Stars (parallax drift + twinkle)
    const t = performance.now() / 1000;
    ctx.save();
    for (const s of this.stars) {
      s.x -= s.layer * 6 * dt;
      if (s.x < -2) s.x = this.w + 2;
      const tw = 0.55 + 0.45 * Math.sin(t * 1.7 + s.tw);
      ctx.globalAlpha = tw * (0.3 + s.layer);
      ctx.fillStyle = '#cfe4ff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    this.angle += dt * 0.12;
    this.pulse = Math.max(0, this.pulse - dt * 3);

    const [c1, c2, glow] = this.planet.colors;

    // Atmosphere glow
    const scale = 1 + this.pulse * 0.03;
    const R = pr * scale;
    const ag = ctx.createRadialGradient(px, py, R * 0.8, px, py, R * 1.45);
    ag.addColorStop(0, glow + '55');
    ag.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(px, py, R * 1.45, 0, Math.PI * 2);
    ctx.fill();

    // Planet body
    const pg = ctx.createRadialGradient(px - R * 0.35, py - R * 0.4, R * 0.1, px, py, R);
    pg.addColorStop(0, c1);
    pg.addColorStop(1, c2);
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(px, py, R, 0, Math.PI * 2);
    ctx.fill();

    // Rotating surface features, clipped to the disc
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, R, 0, Math.PI * 2);
    ctx.clip();
    for (const b of this.surface) {
      const lon = b.a + this.angle;
      const sx = Math.sin(lon); // -1..1 across the visible face
      const cxr = Math.cos(lon);
      if (cxr < -0.15) continue; // back side
      const bx = px + sx * R * 0.9;
      const by = py + b.lat * R * 0.55;
      const squash = Math.max(0.2, cxr);
      ctx.globalAlpha = 0.22 * Math.min(1, cxr + 0.3);
      ctx.fillStyle = b.dark ? '#000000' : '#ffffff';
      ctx.beginPath();
      ctx.ellipse(bx, by, b.r * R * squash, b.r * R * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Terminator shading
    const sh = ctx.createLinearGradient(px - R, py, px + R, py);
    sh.addColorStop(0, 'rgba(0,0,0,0)');
    sh.addColorStop(0.75, 'rgba(0,0,0,0)');
    sh.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = sh;
    ctx.fillRect(px - R, py - R, R * 2, R * 2);
    ctx.restore();

    // Rim light
    ctx.strokeStyle = glow + '66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, R, 0, Math.PI * 2);
    ctx.stroke();

    // Drones: visual count scales with owned miners (log-ish, capped)
    const total = Game.totalMiners();
    const wantDrones = Math.min(S.settings.perf ? 8 : 18, total === 0 ? 0 : 2 + Math.floor(Math.log2(total + 1) * 2));
    while (this.drones.length < wantDrones) {
      this.drones.push({
        a: Math.random() * Math.PI * 2,
        dist: 1.35 + Math.random() * 0.55,
        speed: 0.25 + Math.random() * 0.5,
        size: 2 + Math.random() * 2.5,
        laser: 0,
        nextLaser: Math.random() * 4,
      });
    }
    if (this.drones.length > wantDrones) this.drones.length = wantDrones;

    for (const d of this.drones) {
      d.a += d.speed * dt;
      const dx = px + Math.cos(d.a) * R * d.dist;
      const dy = py + Math.sin(d.a) * R * d.dist * 0.55; // elliptical orbit
      const behind = Math.sin(d.a) < -0.2 && d.dist < 1.5;

      d.nextLaser -= dt;
      if (d.nextLaser <= 0) { d.laser = 0.5; d.nextLaser = 2 + Math.random() * 5; }
      if (d.laser > 0) {
        d.laser -= dt;
        if (!behind) {
          // Beam from drone to planet surface
          const ang = Math.atan2(py - dy, px - dx);
          const tx = px - Math.cos(ang) * R * 0.92;
          const ty = py - Math.sin(ang) * R * 0.92;
          ctx.save();
          ctx.strokeStyle = glow;
          ctx.globalAlpha = 0.7 * Math.min(1, d.laser * 4);
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(tx, ty); ctx.stroke();
          ctx.globalAlpha *= 0.5;
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(tx, ty); ctx.stroke();
          // Impact spark
          ctx.globalAlpha = Math.min(1, d.laser * 3);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(tx, ty, 2.5, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }

      ctx.save();
      ctx.globalAlpha = behind ? 0.35 : 1;
      ctx.fillStyle = '#dfe8f2';
      ctx.beginPath();
      ctx.arc(dx, dy, d.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(dx + d.size * 0.4, dy - d.size * 0.4, d.size * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Spark particles
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.t += dt;
      if (p.t >= p.life) { this.parts.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      const a = 1 - p.t / p.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * a + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Floating numbers
    ctx.textAlign = 'center';
    ctx.font = '600 15px "Segoe UI", system-ui, sans-serif';
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const ft = this.texts[i];
      ft.t += dt;
      if (ft.t >= ft.life) { this.texts.splice(i, 1); continue; }
      const a = 1 - ft.t / ft.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.txt, ft.x, ft.y - ft.t * 55);
    }
    ctx.globalAlpha = 1;
  },
};
