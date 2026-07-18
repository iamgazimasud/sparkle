'use strict';
// Interactive tutorial: objective-based steps that advance by watching real game
// state, plus a "How to Play" reference guide. Veterans' saves fast-forward
// through already-completed steps silently.

const TUTORIAL = {
  steps: [
    { icon: '👆', title: 'Mine your first ore',
      text: 'Click the planet (or press <b>Space</b>) 5 times. Every click chips ore into your Cargo Hold.',
      check: () => S.stats.clicks >= 5 },
    { icon: '💰', title: 'Sell your cargo',
      text: 'Ore is worthless until sold. Hit <b>Sell All</b> under the Cargo Hold to turn it into credits.',
      check: () => S.stats.creditsEarned > 0 },
    { icon: '🛸', title: 'Hire your first drone',
      text: 'Buy a <b>Mining Drone</b> in the Mine tab (15 credits). It mines for you — forever, even while you idle.',
      tab: 'mine', check: () => Game.totalMiners() >= 1 },
    { icon: '⛏️', title: 'Build a fleet',
      text: 'Own <b>5 miners</b> in total. Each purchase costs a little more than the last — that\'s idle economics.',
      tab: 'mine', check: () => Game.totalMiners() >= 5 },
    { icon: '🧪', title: 'Fund science',
      text: 'Buy a <b>Research Lab</b> in the Research tab. Labs slowly generate Research Points (RP).',
      tab: 'research', check: () => S.labs >= 1 },
    { icon: '🔬', title: 'First breakthrough',
      text: 'Spend RP on any research. Tip: <b>Auto-Sell Protocols</b> sells your ore automatically so you never click Sell again.',
      tab: 'research', check: () => Object.keys(S.research).length >= 1 },
    { icon: '⚡', title: 'Power the machines',
      text: 'Advanced machines drain energy — when demand beats supply, <b>everything slows down</b>. Buy a Solar Panel in the Energy tab to stay ahead.',
      tab: 'energy', check: () => Object.values(S.generators).some(n => n > 0) },
    { icon: '🪐', title: 'Reach for the Moon',
      text: 'Save <b>50K credits</b> and unlock <b>The Moon</b> in the Planets tab: ×2 mining speed and precious titanium veins.',
      tab: 'planets', check: () => Object.keys(S.planets).length >= 2 },
  ],

  el: null,
  _renderedStep: -1,

  init() {
    this.el = document.createElement('div');
    this.el.id = 'tutorial-card';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);
  },

  refresh() {
    if (!S.tut) S.tut = { step: 0, done: false };
    if (S.tut.done) { this.hide(); return; }

    let advanced = 0;
    const from = S.tut.step;
    while (S.tut.step < this.steps.length && this.steps[S.tut.step].check()) {
      S.tut.step++;
      advanced++;
    }

    if (S.tut.step >= this.steps.length) {
      // Whole tutorial cleared in one pass from step 0 = a veteran save; finish silently.
      this.complete(from === 0 && advanced === this.steps.length);
      return;
    }
    if (advanced > 0) {
      Sound.play('research');
      UI.toast('✅ Objective complete!', 'good', 2500);
      this._renderedStep = -1;
    }
    this.render();
  },

  render() {
    const i = S.tut.step;
    const st = this.steps[i];
    this.el.style.display = 'block';
    if (this._renderedStep !== i) {
      this._renderedStep = i;
      this.el.innerHTML = `
        <div class="tut-head"><span class="tut-tag">TUTORIAL ${i + 1}/${this.steps.length}</span>
          <button class="tut-skip" onclick="TUTORIAL.skip()">Skip ✕</button></div>
        <div class="tut-body"><span class="tut-icon">${st.icon}</span>
          <div><div class="tut-title">${st.title}</div><div class="tut-text">${st.text}</div></div></div>`;
    }
    // Pulse the tab the player needs to visit
    UI.tabs.forEach(t => {
      const btn = document.getElementById('tab-' + t.id);
      if (btn) btn.classList.toggle('tab-pulse', st.tab === t.id && UI.activeTab !== t.id);
    });
  },

  hide() {
    if (this.el) this.el.style.display = 'none';
    document.querySelectorAll('.tab-pulse').forEach(b => b.classList.remove('tab-pulse'));
  },

  complete(silent) {
    S.tut.done = true;
    this.hide();
    if (silent) return;
    Game.addCredits(2500);
    Sound.play('achievement');
    UI.modal(`
      <h2>🎓 Tutorial Complete!</h2>
      <p>You know everything you need, Commander. Here's a <b style="color:var(--gold)">2,500 credit</b> graduation bonus.</p>
      <p>From here the galaxy is yours: factories refine ore into fortunes, ships explore the unknown,
      AI managers run the empire — and when you earn your first <b>1T credits</b>, Galactic Ascension
      awaits in the Prestige tab.</p>
      <p>Stuck? The <b>❓ How to Play</b> guide is always in the top bar.</p>
      <div class="modal-actions"><button class="btn btn-buy" onclick="UI.closeModal()">To the stars 🚀</button></div>`);
  },

  skip() {
    S.tut.done = true;
    this.hide();
    UI.toast('Tutorial skipped. Reopen it any time from Settings.', 'info');
  },

  replay() {
    S.tut = { step: 0, done: false };
    this._renderedStep = -1;
    UI.toast('🎓 Tutorial restarted', 'info');
  },
};

// ---------------------------------------------------------------- How to Play guide
UI.helpModal = function () {
  UI.modal(`
    <h2>❓ How to Play</h2>
    <div class="help-guide">
      <h3>👆 The Loop</h3>
      <p>Click the planet to mine ore → <b>sell</b> ore for credits → buy <b>miners</b> that mine automatically →
      upgrade, expand, repeat. Soon the game plays itself and your job becomes strategy.</p>
      <h3>🛸 Miners &amp; Drill</h3>
      <p>Miners in the Mine tab produce ore every second. New, stronger tiers appear once you own the previous tier.
      <b>Drill Power</b> boosts your manual clicks. Use the <b>x1 / x10 / x100 / Max</b> buttons in the top bar for bulk buying.</p>
      <h3>🏭 Factories</h3>
      <p>Factories consume raw ore (e.g. 10 Iron/s) and sell refined goods for far more than the raw ore is worth.
      They need a steady ore supply and energy.</p>
      <h3>⚡ Energy</h3>
      <p>Most machines consume energy. If consumption exceeds production, <b>miners, factories and labs all slow down
      proportionally</b> — watch the ⚡ meter in the top bar and build generators.</p>
      <h3>🔬 Research</h3>
      <p>Research Labs generate RP over time. Spend RP on permanent upgrades — <b>Auto-Sell Protocols</b> is the
      quality-of-life king. Some research needs a prerequisite first (🔒).</p>
      <h3>🚀 Fleet &amp; Exploration</h3>
      <p>Ships give permanent bonuses per level. The <b>Explorer</b> unlocks timed exploration missions whose rewards
      scale with your income. A <b>Defense Ship</b> turns pirate attacks into loot.</p>
      <h3>🤖 AI Managers</h3>
      <p>One-time hires with big permanent bonuses. Buy them all.</p>
      <h3>🪐 Planets</h3>
      <p>Each new world multiplies mining speed and offers rarer, more valuable ores. Your miners travel with you —
      switching planets is free once unlocked.</p>
      <h3>🌌 Prestige — Galactic Ascension</h3>
      <p>Earn <b>1T credits in one run</b> to Ascend: everything resets, but you gain Galactic Energy —
      <b>+2% ALL production each, forever</b>. Runs get dramatically faster after each Ascension.</p>
      <h3>💡 Tips</h3>
      <p>• Random events fire every few minutes — good ones stack with everything.<br>
      • Achievements each give +1% production; check the Awards tab for goals.<br>
      • Offline progress is collected when you return (12h cap; 24h with Deep Space Comms).<br>
      • Shortcuts: <b>1–9, 0, -</b> switch tabs, <b>Space</b> mines.</p>
    </div>
    <div class="modal-actions"><button class="btn btn-buy" onclick="UI.closeModal()">Got it</button></div>`);
};
