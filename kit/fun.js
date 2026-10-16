// Little set pieces that play when you click a prop: a skier jumping past the
// cabin, a snowball hitting the window, a canoe and a fish on the lake.
// Each factory builds its actors once and returns a play() function.
import { THREE, V3, mat, add, rod, canvasTex, rand, reduce } from './core.js';

const ease = (k) => k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;

function runner(ctx, duration, step, done) {
  let t0 = -1;
  ctx.onFrame((t, dt) => {
    if (t0 < 0) return;
    const k = Math.min(1, (t - t0) / duration);
    step(k, dt, t);
    if (k >= 1) { t0 = -1; done && done(); }
  });
  return { start: () => { if (t0 < 0) t0 = ctx.uTime.value; }, get busy() { return t0 >= 0; } };
}

// ---------------------------------------------------------------- skier

function skierModel() {
  const g = new THREE.Group();
  const pants = mat(0x2b2f3a, 0.8), jacket = mat(0xe8443a, 0.7), skin = mat(0xf1c9a5, 0.8), dark = mat(0x1d1f24, 0.5);
  for (const s of [-1, 1]) {
    add(g, new THREE.BoxGeometry(1.7, 0.03, 0.09), mat(0xffc93c, 0.4), 0.1, 0.02, s * 0.13, { cast: false });
    add(g, new THREE.BoxGeometry(0.3, 0.22, 0.13), dark, 0, 0.14, s * 0.13, { cast: false });
    rod(g, new V3(0, 0.22, s * 0.13), new V3(0.2, 0.6, s * 0.14), 0.07, pants);
    rod(g, new V3(0.2, 0.6, s * 0.14), new V3(-0.05, 0.92, s * 0.13), 0.08, pants);
  }
  const torso = add(g, new THREE.BoxGeometry(0.34, 0.56, 0.4), jacket, 0.02, 1.18, 0, { cast: false });
  torso.rotation.z = -0.4;
  add(g, new THREE.SphereGeometry(0.13, 16, 12), skin, 0.2, 1.56, 0, { cast: false });
  const beanie = add(g, new THREE.SphereGeometry(0.135, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x2f6bff, 0.9), 0.19, 1.6, 0, { cast: false });
  beanie.rotation.z = -0.3;
  add(g, new THREE.SphereGeometry(0.05, 10, 8), mat(0xffffff, 0.9), 0.15, 1.75, 0, { cast: false });
  add(g, new THREE.BoxGeometry(0.06, 0.07, 0.26), mat(0xff8a1f, 0.2, 0.5), 0.32, 1.58, 0, { cast: false });
  for (const s of [-1, 1]) {
    const hand = new V3(0.5, 1.02, s * 0.3);
    rod(g, new V3(0.14, 1.36, s * 0.2), hand, 0.05, jacket);
    rod(g, hand, new V3(-0.25, 0.05, s * 0.34), 0.012, dark);
  }
  return g;
}

export function skier(ctx, { y, z, x0 = -20, x1 = 20, scale = 2.3, duration = 5 }) {
  const s = skierModel();
  s.scale.setScalar(scale);
  s.visible = false;
  ctx.scene.add(s);
  let sprayAt = 0, landed = false, cheered = false;
  const jump = [0.42, 0.62];
  const r = runner(ctx, duration, (k, dt, t) => {
    s.visible = true;
    const x = x0 + (x1 - x0) * k;
    const j = (k - jump[0]) / (jump[1] - jump[0]);
    const air = j > 0 && j < 1;
    s.position.set(x, y + (air ? Math.sin(j * Math.PI) * 5 : 0), z + Math.sin(k * 9) * 1.2);
    s.rotation.z = air ? -ease(j) * Math.PI * 2 : Math.sin(k * 18) * 0.06;
    s.rotation.y = air ? 0 : Math.cos(k * 9) * 0.25;
    if (air && j > 0.45 && !cheered) { cheered = true; ctx.bubble('WOO!', new V3(x + 1, y + 11, z), { size: 3 }); }
    if (j >= 1 && !landed) { landed = true; ctx.burst(new V3(x, y + 0.3, z), { count: 90, speed: 6, size: 0.6, life: 1.4 }); }
    if (!air && t - sprayAt > 0.08) { sprayAt = t; ctx.burst(new V3(x - 1, y + 0.3, s.position.z), { count: 12, speed: 3.5, size: 0.7, life: 0.8 }); }
  }, () => { s.visible = false; landed = cheered = false; });
  return () => { if (!reduce) r.start(); };
}

// ---------------------------------------------------------------- snowball

export function snowball(ctx, win) {
  const ball = add(ctx.scene, new THREE.SphereGeometry(0.09, 16, 12), mat(0xffffff, 0.9), 0, 0, 0, { cast: false });
  ball.visible = false;
  const splatTex = () => canvasTex(256, 256, (g) => {
    g.fillStyle = 'rgba(250,252,255,0.95)';
    g.beginPath(); g.arc(128, 110, 62, 0, 7); g.fill();
    for (let i = 0; i < 14; i++) {
      const a = rand(0, Math.PI * 2), d = rand(60, 110), r = rand(8, 20);
      g.beginPath(); g.arc(128 + Math.cos(a) * d, 110 + Math.sin(a) * d * 0.9, r, 0, 7); g.fill();
    }
    for (let i = 0; i < 5; i++) { const x = rand(90, 166); g.fillRect(x, 110, rand(6, 12), rand(60, 130)); }
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(190,205,230,0.5)';
    g.beginPath(); g.arc(140, 125, 40, 0, 7); g.fill();
  }).tex;
  const splats = [];
  let from, to;
  const r = runner(ctx, 0.55, (k) => {
    ball.visible = true;
    ball.position.lerpVectors(from, to, k);
    ball.position.y += Math.sin(k * Math.PI) * 1.5;
  }, () => {
    ball.visible = false;
    const m = add(ctx.scene, new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map: splatTex(), transparent: true, depthWrite: false }), to.x, to.y, win.z - 0.065, { cast: false, receive: false });
    m.rotation.z = rand(-0.5, 0.5);
    splats.push({ m, t0: ctx.uTime.value, y: to.y });
    ctx.shake(0.012);
    ctx.burst(new V3(to.x, to.y, win.z - 0.1), { count: 40, speed: 1.6, size: 0.03, life: 0.7, gravity: 3 });
    ctx.bubble('SPLAT!', new V3(to.x, to.y + 0.18, win.z + 0.25), { size: 0.11 });
  });
  ctx.onFrame((t) => {
    for (let i = splats.length - 1; i >= 0; i--) {
      const s = splats[i], a = t - s.t0;
      s.m.position.y = s.y - Math.max(0, a - 1) * 0.03;
      s.m.material.opacity = a < 4 ? 1 : 1 - (a - 4) / 1.5;
      if (a > 5.5) { ctx.scene.remove(s.m); s.m.material.map.dispose(); s.m.material.dispose(); splats.splice(i, 1); }
    }
  });
  return () => {
    if (r.busy) return;
    to = new V3(rand(win.x0 + 0.25, win.x1 - 0.25), rand(win.y0 + 0.4, win.y1 - 0.3), win.z - 0.07);
    from = new V3(to.x + rand(-6, 6), to.y - 1, -14);
    r.start();
  };
}

// ---------------------------------------------------------------- lake

function canoeModel() {
  const g = new THREE.Group();
  const hull = add(g, new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0xc0392b, 0.6), 0, 0.3, 0, { cast: false });
  hull.scale.set(2.6, 0.45, 0.5);
  add(g, new THREE.BoxGeometry(5, 0.06, 0.06), mat(0x7a4b2a, 0.7), 0, 0.3, 0, { cast: false });
  add(g, new THREE.BoxGeometry(0.4, 0.6, 0.42), mat(0xffc93c, 0.7), -0.6, 0.6, 0, { cast: false });
  add(g, new THREE.SphereGeometry(0.15, 12, 10), mat(0xf1c9a5, 0.8), -0.6, 1.05, 0, { cast: false });
  const hat = add(g, new THREE.CylinderGeometry(0.28, 0.28, 0.03, 16), mat(0x5b7a3a, 0.8), -0.6, 1.15, 0, { cast: false });
  add(hat, new THREE.CylinderGeometry(0.13, 0.15, 0.12, 16), mat(0x5b7a3a, 0.8), 0, 0.07, 0, { cast: false });
  const paddle = new THREE.Group();
  paddle.position.set(-0.5, 0.75, 0);
  rod(paddle, new V3(0, 0.5, 0), new V3(0, -0.9, 0), 0.025, mat(0x8a5c36, 0.7));
  add(paddle, new THREE.BoxGeometry(0.05, 0.45, 0.2), mat(0x8a5c36, 0.7), 0, -1, 0, { cast: false });
  g.add(paddle);
  g.userData.paddle = paddle;
  return g;
}

export function canoe(ctx, { y, z, x0 = -30, x1 = 30, duration = 9 }) {
  const c = canoeModel();
  c.visible = false;
  ctx.scene.add(c);
  let said = false, splashAt = 0;
  const r = runner(ctx, duration, (k, dt, t) => {
    c.visible = true;
    c.position.set(x0 + (x1 - x0) * k, y + Math.sin(t * 2) * 0.05, z);
    c.rotation.x = Math.sin(t * 1.7) * 0.04;
    const p = c.userData.paddle;
    p.rotation.z = Math.sin(t * 4) * 0.7;
    p.position.z = Math.sin(t * 2) > 0 ? 0.55 : -0.55;
    if (t - splashAt > 0.5) { splashAt = t; ctx.burst(new V3(c.position.x - 1, y + 0.1, z + p.position.z), { count: 10, speed: 1.2, size: 0.25, color: 0xd8f4f6, life: 0.6, gravity: 4 }); }
    if (k > 0.35 && !said) { said = true; ctx.bubble('ahoy!', new V3(c.position.x, y + 3.2, z), { size: 1.6 }); }
  }, () => { c.visible = false; said = false; });
  return () => { if (!reduce) r.start(); };
}

export function fish(ctx, { y, z, x = 0 }) {
  const f = new THREE.Group();
  const body = add(f, new THREE.SphereGeometry(1, 16, 10), mat(0xff8a3d, 0.4), 0, 0, 0, { cast: false });
  body.scale.set(0.55, 0.22, 0.12);
  const tail = add(f, new THREE.ConeGeometry(0.2, 0.3, 3), mat(0xff8a3d, 0.4), -0.6, 0, 0, { cast: false });
  tail.rotation.z = Math.PI / 2;
  add(f, new THREE.SphereGeometry(0.04, 8, 6), mat(0x111111, 0.3), 0.38, 0.06, 0.1, { cast: false });
  f.visible = false;
  ctx.scene.add(f);
  let x0 = x, said = false;
  const r = runner(ctx, 1.4, (k) => {
    f.visible = true;
    f.position.set(x0 + k * 3, y + Math.sin(k * Math.PI) * 2.4, z);
    f.rotation.z = (0.5 - k) * 2.2;
    if (k > 0.4 && !said) { said = true; ctx.bubble('blub!', new V3(f.position.x, y + 4, z), { size: 1.2 }); }
  }, () => {
    f.visible = false; said = false;
    ctx.burst(new V3(x0 + 3, y, z), { count: 40, speed: 2.5, size: 0.3, color: 0xd8f4f6, life: 0.9 });
  });
  return () => {
    if (reduce || r.busy) return;
    x0 = x + rand(-6, 4);
    ctx.burst(new V3(x0, y, z), { count: 30, speed: 2, size: 0.3, color: 0xd8f4f6, life: 0.8 });
    r.start();
  };
}

// ---------------------------------------------------------------- kendo

// a strike for a shinai built on a pivot at its base: wind up, snap forward, return
export function strike(ctx, pivot, top, { calls = ['MEN!', 'KOTE!', 'DŌ!'] } = {}) {
  let n = 0, said = false;
  const r = runner(ctx, 1.3, (k) => {
    let a;
    if (k < 0.3) a = -ease(k / 0.3) * 0.35;
    else if (k < 0.42) a = -0.35 + ((k - 0.3) / 0.12) * 1.45;
    else if (k < 0.65) a = 1.1;
    else a = 1.1 * (1 - ease((k - 0.65) / 0.35));
    pivot.rotation.x = a;
    if (k > 0.42 && !said) { said = true; ctx.shake(0.008); ctx.bubble(calls[n++ % calls.length], top.clone(), { size: 0.1 }); }
  }, () => { pivot.rotation.x = 0; said = false; });
  return () => { if (!reduce) r.start(); else ctx.bubble(calls[n++ % calls.length], top.clone(), { size: 0.1 }); };
}
