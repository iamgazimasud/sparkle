'use strict';
// Bootstrap: load save, apply offline progress, wire input, run the loop.

(function boot() {
  loadState();

  // Offline progress (before UI so the modal shows over a ready screen)
  const offline = Game.computeOffline();

  UI.init();
  TUTORIAL.init();
  Render.init(document.getElementById('scene'));

  if (offline) UI.offlineModal(offline);

  // ---- Planet clicking
  const canvas = document.getElementById('scene');
  canvas.addEventListener('contextmenu', e => e.preventDefault()); // no long-press menu on mobile
  canvas.addEventListener('pointerdown', e => {
    Sound.unlock();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const g = Render.planetGeom();
    const gained = Game.click();
    Sound.play('click');
    const onPlanet = Math.hypot(x - g.x, y - g.y) <= g.r * 1.2;
    const fx = onPlanet ? x : g.x + (Math.random() - 0.5) * g.r;
    const fy = onPlanet ? y : g.y - g.r * 0.3;
    Render.clickBurst(fx, fy);
    Render.floatText('+' + fmt(gained), fx, fy - 10, DATA.planetMap[S.currentPlanet].colors[2]);
  });

  // First user gesture anywhere unlocks audio
  document.addEventListener('pointerdown', () => Sound.unlock(), { once: true });

  // ---- Keyboard shortcuts
  const tabKeys = { '1': 'mine', '2': 'factories', '3': 'energy', '4': 'research', '5': 'fleet', '6': 'ai', '7': 'planets', '8': 'prestige', '9': 'achieve', '0': 'stats', '-': 'settings' };
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (tabKeys[e.key]) UI.showTab(tabKeys[e.key]);
    if (e.code === 'Space') {
      e.preventDefault();
      const g = Render.planetGeom();
      const gained = Game.click();
      Sound.unlock();
      Sound.play('click');
      Render.clickBurst(g.x + (Math.random() - 0.5) * g.r, g.y - g.r * 0.2);
      Render.floatText('+' + fmt(gained), g.x, g.y - g.r - 10, DATA.planetMap[S.currentPlanet].colors[2]);
    }
  });

  // ---- Main loop
  let last = performance.now();
  function step(now, render) {
    const dt = (now - last) / 1000;
    if (dt <= 0) return;
    last = now;
    Game.tick(Math.min(dt, 60)); // production math is linear in dt, so big steps are safe
    if (render) {
      Render.draw(Math.min(dt, 0.1));
      UI.refresh(dt);
    }
  }
  function frame(now) {
    step(now, true);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // rAF pauses in hidden tabs; keep the empire running at ~1Hz in the background
  setInterval(() => { if (document.hidden) step(performance.now(), false); }, 1000);

  // ---- Autosave
  setInterval(saveState, 15000);
  window.addEventListener('beforeunload', saveState);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveState();
  });
})();
