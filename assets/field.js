// ASCII field: a faint grid of characters that ripples and lights up around the cursor.
// With no cursor (touch, or mouse outside the window) a ghost cursor wanders on its own.
(() => {
  const canvas = document.getElementById('field');
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RAMP = ' .:-=+*#%@';
  const COLORS = ['#ff5a4e', '#ffb800', '#2f7bff', '#19c39b', '#ff6bd6', '#8b5cf6'];
  const IDLE = '#d3d5dd';
  const CW = 10, CH = 16, R = 180;

  let W = 0, H = 0, t = 0, last = 0;
  let mouse = null;
  const ghost = { x: null, y: null };

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = '13px "JetBrains Mono", ui-monospace, monospace';
    ctx.textBaseline = 'top';
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 33) return; // ~30fps is plenty
    last = now;

    const tx = mouse ? mouse.x : W * (0.55 + 0.35 * Math.sin(t * 0.5));
    const ty = mouse ? mouse.y : H * (0.5 + 0.3 * Math.sin(t * 0.8 + 1));
    if (ghost.x === null) { ghost.x = tx; ghost.y = ty; }
    ghost.x += (tx - ghost.x) * 0.12;
    ghost.y += (ty - ghost.y) * 0.12;

    ctx.clearRect(0, 0, W, H);
    for (let y = 0; y < H; y += CH) {
      for (let x = 0; x < W; x += CW) {
        let v = Math.sin(x * 0.013 + t) + Math.sin(y * 0.013 - t * 0.8) + Math.sin((x + y) * 0.008 + t * 0.5);
        const d = Math.hypot(x - ghost.x, y - ghost.y);
        const k = Math.max(0, 1 - d / R);
        if (k) v += Math.cos(d * 0.06 - t * 4) * 2.2 * k;
        const ch = RAMP[Math.max(0, Math.min(9, ((v + 3) / 6 * 9) | 0))];
        if (ch === ' ') continue;
        if (k > 0.05) {
          ctx.fillStyle = COLORS[((d / 24 + t * 3) | 0) % COLORS.length];
          ctx.globalAlpha = 0.35 + k * 0.65;
        } else {
          ctx.fillStyle = IDLE;
          ctx.globalAlpha = 1;
        }
        ctx.fillText(ch, x, y);
      }
    }
    ctx.globalAlpha = 1;
    if (!reduce) t += 0.03;
  }

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse') mouse = { x: e.clientX, y: e.clientY };
  });
  document.addEventListener('pointerleave', () => { mouse = null; });
  document.documentElement.addEventListener('mouseleave', () => { mouse = null; });

  resize();
  if (document.fonts) document.fonts.ready.then(resize);
  requestAnimationFrame(frame);
})();
