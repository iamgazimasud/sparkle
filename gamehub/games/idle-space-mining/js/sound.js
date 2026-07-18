'use strict';
// Procedural WebAudio sound effects + ambient space music. No audio files needed.

const Sound = {
  ctx: null,
  master: null,
  musicGain: null,
  started: false,

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);
    } catch (e) { /* no audio support */ }
  },

  // Called on first user interaction (browsers block audio before a gesture)
  unlock() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (!this.started) { this.started = true; this.startAmbient(); }
  },

  tone(freq, dur, type, vol, when = 0, slide = 0) {
    if (!this.ctx || S.settings.sfx <= 0) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * S.settings.sfx, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + dur + 0.05);
  },

  play(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'click': {
        const f = 190 + Math.random() * 80;
        this.tone(f, 0.07, 'square', 0.12, 0, -60);
        this.tone(f * 2.7, 0.04, 'sine', 0.06);
        break;
      }
      case 'buy':
        this.tone(330, 0.08, 'sine', 0.16);
        this.tone(495, 0.1, 'sine', 0.14, 0.06);
        break;
      case 'sell':
        this.tone(520, 0.06, 'triangle', 0.12);
        this.tone(660, 0.09, 'triangle', 0.1, 0.05);
        break;
      case 'research':
        this.tone(440, 0.12, 'sine', 0.14);
        this.tone(554, 0.12, 'sine', 0.12, 0.09);
        this.tone(659, 0.18, 'sine', 0.12, 0.18);
        break;
      case 'achievement':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.14, i * 0.09));
        break;
      case 'event':
        this.tone(392, 0.2, 'sine', 0.14);
        this.tone(523, 0.25, 'sine', 0.12, 0.12);
        break;
      case 'bad':
        this.tone(220, 0.2, 'sawtooth', 0.1);
        this.tone(165, 0.3, 'sawtooth', 0.1, 0.12);
        break;
      case 'prestige':
        [262, 330, 392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.3, 'sine', 0.13, i * 0.11));
        break;
      case 'deny':
        this.tone(140, 0.09, 'square', 0.07);
        break;
      case 'planet':
        this.tone(196, 0.4, 'sine', 0.14, 0, 100);
        this.tone(392, 0.5, 'sine', 0.1, 0.2, 100);
        break;
    }
  },

  startAmbient() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = S.settings.music * 0.14;
    this.musicGain.connect(this.master);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    filter.connect(this.musicGain);

    // Slow-drifting detuned pad
    const freqs = [55, 82.4, 110, 164.8];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      osc.detune.value = (i - 1.5) * 4;
      const g = ctx.createGain();
      g.gain.value = 0.22;
      // Slow LFO on each voice so the pad breathes
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.04 + i * 0.017;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.12;
      lfo.connect(lfoGain); lfoGain.connect(g.gain);
      osc.connect(g); g.connect(filter);
      osc.start(); lfo.start();
    });

    // Occasional sparkle notes
    const sparkle = () => {
      if (S.settings.music > 0) {
        const scale = [523, 587, 659, 784, 880, 1047];
        const f = scale[Math.floor(Math.random() * scale.length)];
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(S.settings.music * 0.05, t + 0.4);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
        osc.connect(g); g.connect(this.master);
        osc.start(t); osc.stop(t + 3.2);
      }
      setTimeout(sparkle, 4000 + Math.random() * 9000);
    };
    setTimeout(sparkle, 3000);
  },

  updateVolumes() {
    if (this.musicGain) this.musicGain.gain.value = S.settings.music * 0.14;
  },
};
