// Visual celebration effects (client-only).

export function burst(el: HTMLElement | null, emoji: string) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 6; i++) {
    const s = document.createElement("div");
    s.textContent = emoji;
    s.style.cssText = `position:fixed;left:${r.left + r.width / 2}px;top:${r.top}px;font-size:18px;z-index:300;pointer-events:none;transition:transform .7s ease-out,opacity .7s`;
    document.body.appendChild(s);
    requestAnimationFrame(() => {
      s.style.transform = `translate(${(Math.random() - 0.5) * 80}px,${-40 - Math.random() * 50}px) rotate(${Math.random() * 90}deg)`;
      s.style.opacity = "0";
    });
    setTimeout(() => s.remove(), 700);
  }
}

export function confetti() {
  const colors = ["#ff5fa2", "#8a5cff", "#3aa0ff", "#27d2a0", "#ffce3a", "#ff8a3d"];
  for (let i = 0; i < 70; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[i % colors.length];
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    if (Math.random() > 0.5) c.style.borderRadius = "50%";
    document.body.appendChild(c);
    const dur = 2 + Math.random() * 1.5;
    const x = (Math.random() - 0.5) * 200;
    c.animate(
      [
        { transform: `translate(0,0) rotate(0)`, opacity: 1 },
        { transform: `translate(${x}px,105vh) rotate(${Math.random() * 720}deg)`, opacity: 0.9 },
      ],
      { duration: dur * 1000, easing: "cubic-bezier(.3,.6,.5,1)" }
    );
    setTimeout(() => c.remove(), dur * 1000);
  }
}
