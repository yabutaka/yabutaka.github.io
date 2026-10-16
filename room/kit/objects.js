// Desk props, each built from primitives and registered as a clickable item
// when it stands for a section. Positions are on the desk unless noted.
import { THREE, V3, DESK, mat, add, rod, canvasTex, rand } from './core.js';
import { strike } from './fun.js';

const group = (x, y, z, rotY = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY; return g; };

// ---------------------------------------------------------------- monitors

export function crtMonitor(ctx, { x = 0.15, z = -0.02, color = 0xe2cfae } = {}) {
  const m = group(x, DESK, z);
  const body = mat(color, 0.55);
  add(m, new THREE.BoxGeometry(0.26, 0.02, 0.22), body, 0, 0.01, 0);
  add(m, new THREE.BoxGeometry(0.46, 0.38, 0.3), body, 0, 0.215, 0);
  add(m, new THREE.BoxGeometry(0.34, 0.29, 0.14), body, 0, 0.215, -0.21);
  add(m, new THREE.BoxGeometry(0.4, 0.31, 0.01), mat(0x111214, 0.4), 0, 0.225, 0.152);
  const sg = new THREE.PlaneGeometry(0.37, 0.28, 24, 18);
  const p = sg.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, 0.012 * (1 - (p.getX(i) / 0.185) ** 2 * 0.5 - (p.getY(i) / 0.14) ** 2 * 0.5));
  sg.computeVertexNormals();
  const screen = add(m, sg, new THREE.MeshBasicMaterial({ map: ctx.screenTex, toneMapped: false }), 0, 0.225, 0.157, { cast: false });
  add(m, new THREE.SphereGeometry(0.005, 8, 8), new THREE.MeshBasicMaterial({ color: 0x5dff8a }), 0.19, 0.045, 0.152);
  add(m, new THREE.BoxGeometry(0.06, 0.012, 0.004), mat(0x9a9180, 0.5), -0.16, 0.045, 0.151);
  ctx.item('home', m, 'monitor · home', { zoomOnly: true });
  ctx.setScreen(screen, new V3(x, DESK + 0.225, z + 0.16), 0.46, 0.4);
  return m;
}

// thin-bezel 16:10 display on an aluminium stand (pair with screenSize [768, 480])
export function slimMonitor(ctx, { x = 0.1, z = -0.1, frame = 0x1b1c1f, stand = 0xc9ccd1 } = {}) {
  const m = group(x, DESK, z);
  const alu = mat(stand, 0.35, 0.8);
  add(m, new THREE.BoxGeometry(0.2, 0.008, 0.16), alu, 0, 0.004, 0.02);
  add(m, new THREE.BoxGeometry(0.05, 0.3, 0.012), alu, 0, 0.16, -0.035).rotation.x = -0.12;
  const W = 0.6, H = 0.375, cy = 0.33;
  add(m, new THREE.BoxGeometry(W + 0.016, H + 0.016, 0.018), mat(frame, 0.4, 0.2), 0, cy, 0);
  const screen = add(m, new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: ctx.screenTex, toneMapped: false }), 0, cy, 0.0095, { cast: false });
  ctx.item('home', m, 'monitor · home', { zoomOnly: true });
  ctx.setScreen(screen, new V3(x, DESK + cy, z + 0.01), W + 0.02, H + 0.02);
  return m;
}

export function keyboard(ctx, { x = 0.15, z = 0.27, base = 0xd3c9b1, keys = 0xe8e1cf, flat = false } = {}) {
  const kb = group(x, DESK, z, -0.04);
  const bh = flat ? 0.008 : 0.022, kh = flat ? 0.004 : 0.012;
  add(kb, new THREE.BoxGeometry(0.44, bh, 0.15), mat(base, flat ? 0.35 : 0.6, flat ? 0.6 : 0), 0, bh / 2, 0);
  const k = new THREE.InstancedMesh(new THREE.BoxGeometry(0.022, kh, 0.022), mat(keys, 0.5), 15 * 5);
  const m4 = new THREE.Matrix4();
  let n = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) k.setMatrixAt(n++, m4.makeTranslation(-0.196 + c * 0.028, bh + kh / 2, -0.056 + r * 0.028));
  k.castShadow = true;
  kb.add(k);
  ctx.scene.add(kb);
  return kb;
}

// ---------------------------------------------------------------- lamp

export function deskLamp(ctx, { x = 0.72, z = -0.22, target = [0.2, DESK, 0.15], metal = 0x23262c, shade = 0x1f3d34, power = 5, on = true } = {}) {
  const g = new THREE.Group();
  const m = mat(metal, 0.4, 0.6);
  const a = new V3(x, DESK + 0.02, z), b = new V3(x - 0.08, DESK + 0.36, z - 0.06), head = new V3(x - 0.22, DESK + 0.4, z + 0.1);
  const tgt = new V3(...target);
  add(g, new THREE.CylinderGeometry(0.075, 0.085, 0.02, 32), m, a.x, DESK + 0.01, a.z);
  rod(g, a, b, 0.008, m);
  rod(g, b, head, 0.008, m);
  add(g, new THREE.SphereGeometry(0.014, 12, 12), m, b.x, b.y, b.z);
  const dir = new V3().subVectors(tgt, head).normalize();
  const s = add(g, new THREE.ConeGeometry(0.06, 0.1, 32, 1, true), new THREE.MeshStandardMaterial({ color: shade, roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide }), head.x, head.y, head.z, { receive: false });
  s.quaternion.setFromUnitVectors(new V3(0, -1, 0), dir);
  s.position.addScaledVector(dir, 0.03);
  const bulb = new THREE.MeshBasicMaterial({ color: 0xffd9a8, toneMapped: false });
  add(g, new THREE.SphereGeometry(0.022, 16, 16), bulb, head.x, head.y, head.z, { cast: false }).position.addScaledVector(dir, 0.05);

  const light = new THREE.SpotLight(0xffbd7a, 0, 0, 0.95, 0.8, 1.4);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.bias = -0.0005;
  light.shadow.camera.near = 0.05;
  light.shadow.camera.far = 3;
  light.position.copy(head).addScaledVector(dir, 0.04);
  light.target.position.copy(tgt);
  ctx.scene.add(light, light.target);

  let lit = on, level = 0;
  ctx.onFrame((t, dt) => {
    level += ((lit ? 1 : 0) - level) * Math.min(1, dt * (lit ? 6 : 12));
    const f = lit && level < 0.95 && Math.random() < 0.3 ? 0.4 : 1;
    light.intensity = power * level * f * ctx.state.intro;
    bulb.color.setRGB(1.4 * level * f + 0.05, 1.05 * level * f + 0.04, 0.7 * level * f + 0.03);
  });
  ctx.item('lamp', g, 'lamp', { noHop: true, toggle: () => (lit = !lit) });
  return g;
}

// ---------------------------------------------------------------- section props

const softDot = () => canvasTex(64, 64, (c) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); }).tex;

export function mug(ctx, { x = -0.13, z = 0.33, color = 0xeeeae2, band = 0x2f6bff, drink = 0x2a160c, steam = true, label = 'coffee · about' } = {}) {
  const g = group(x, DESK, z);
  const ceramic = mat(color, 0.35);
  add(g, new THREE.CylinderGeometry(0.04, 0.036, 0.09, 32), ceramic, 0, 0.045, 0);
  add(g, new THREE.CylinderGeometry(0.035, 0.035, 0.002, 32), mat(drink, 0.15), 0, 0.083, 0, { cast: false });
  add(g, new THREE.TorusGeometry(0.024, 0.007, 10, 20, Math.PI), ceramic, 0.04, 0.045, 0).rotation.z = -Math.PI / 2;
  if (band != null) add(g, new THREE.CylinderGeometry(0.0405, 0.0405, 0.018, 32, 1, true), mat(band, 0.4), 0, 0.06, 0);
  if (steam) {
    const tex = softDot(), puffs = [];
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }));
      s.userData.t = i / 7;
      g.add(s);
      puffs.push(s);
    }
    ctx.onFrame((t, dt) => {
      for (const s of puffs) {
        const k = s.userData.t = (s.userData.t + dt * 0.25) % 1;
        s.position.set(Math.sin(k * 6 + s.id) * 0.012, 0.09 + k * 0.14, 0);
        s.scale.setScalar(0.03 + k * 0.06);
        s.material.opacity = Math.sin(k * Math.PI) * 0.22;
      }
    });
  }
  ctx.item('about', g, label);
  return g;
}

export function takeoutBag(ctx, { x = -0.7, z = -0.16, rotY = 0.35 } = {}) {
  const g = group(x, DESK, z, rotY);
  const kraft = mat(0xb48a5a, 0.95);
  add(g, new THREE.BoxGeometry(0.17, 0.2, 0.11), kraft, 0, 0.1, 0);
  add(g, new THREE.BoxGeometry(0.17, 0.05, 0.05), kraft, 0, 0.215, 0).rotation.x = 0.2;
  add(g, new THREE.PlaneGeometry(0.1, 0.06), mat(0xe8443a, 0.7), 0, 0.12, 0.0555, { cast: false });
  add(g, new THREE.PlaneGeometry(0.05, 0.065), mat(0xf4f1ea, 0.9), 0.05, 0.05, 0.056, { cast: false });
  ctx.item('work', g, 'takeout · work');
  return g;
}

export function grassBlock(ctx, { x = -0.5, z = 0.24, rotY = 0.5, snowy = false } = {}) {
  const px = (fn) => canvasTex(16, 16, (g) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { g.fillStyle = fn(x, y); g.fillRect(x, y, 1, 1); } }, { pixel: true }).tex;
  const j = (a) => a[(Math.random() * a.length) | 0];
  const greens = snowy ? ['#f4f8ff', '#e3ecf7', '#ffffff', '#d4e0ef'] : ['#5f9f35', '#6fb43f', '#4f8a2c', '#7cc04a'];
  const dirts = ['#79553a', '#8b6446', '#5f412b', '#96714f'];
  const top = px(() => j(greens)), dirt = px(() => j(dirts));
  const side = px((x, y) => (y < 3 || (y < 5 && Math.random() < 0.45)) ? j(greens) : j(dirts));
  const m = (t) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 });
  const g = group(x, DESK, z, rotY);
  add(g, new THREE.BoxGeometry(0.1, 0.1, 0.1), [m(side), m(side), m(top), m(dirt), m(side), m(side)], 0, 0.05, 0);
  ctx.item('agent', g, (snowy ? 'snowy block' : 'grass block') + ' · agent', { spin: true });
  return g;
}

export function phone(ctx, { x = -0.27, z = 0.16, rotY = 0.25 } = {}) {
  const scr = canvasTex(128, 256);
  const g = group(x, DESK, z, rotY);
  add(g, new THREE.BoxGeometry(0.08, 0.012, 0.06), mat(0x2b2d33, 0.5), 0, 0.006, 0);
  const ph = new THREE.Group();
  ph.position.set(0, 0.012, -0.01);
  ph.rotation.x = -0.28;
  add(ph, new THREE.BoxGeometry(0.072, 0.15, 0.008), mat(0x111111, 0.3, 0.4), 0, 0.075, 0);
  add(ph, new THREE.PlaneGeometry(0.066, 0.142), new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: false }), 0, 0.075, 0.0041, { cast: false });
  g.add(ph);
  const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  let n = 0;
  ctx.onFrame((t) => {
    if (n++ % 2) return;
    const c = scr.g;
    const gr = c.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#2b3550'); gr.addColorStop(1, '#40322c');
    c.fillStyle = gr; c.fillRect(0, 0, 128, 256);
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1;
    for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(64 + i * 8, 150); c.lineTo(64 + i * 30, 256); c.stroke(); }
    for (let i = 0; i < 5; i++) { const yy = 150 + i * i * 6; c.beginPath(); c.moveTo(0, yy); c.lineTo(128, yy); c.stroke(); }
    const a = t * 0.9, ca = Math.cos(a), sa = Math.sin(a);
    const P = V.map(([x, y, z]) => { const X = x * ca - z * sa, Z = x * sa + z * ca, Y = y * 0.94 - Z * 0.34, ZZ = y * 0.34 + Z * 0.94 + 5; return [64 + X / ZZ * 120, 120 + Y / ZZ * 120]; });
    c.strokeStyle = '#8fb4ff'; c.lineWidth = 2;
    c.beginPath();
    for (const [i, j] of E) { c.moveTo(...P[i]); c.lineTo(...P[j]); }
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.fillRect(52, 236, 24, 3);
    scr.tex.needsUpdate = true;
  });
  ctx.item('ios', g, 'phone · ios');
  return g;
}

export function books(ctx, { x = 0.6, z = 0.24, rotY = -0.3 } = {}) {
  const g = group(x, DESK, z, rotY);
  const spine = (bg, fg, text) => canvasTex(256, 40, (c) => { c.fillStyle = bg; c.fillRect(0, 0, 256, 40); c.fillStyle = fg; c.font = '600 22px "JetBrains Mono", monospace'; c.textBaseline = 'middle'; c.fillText(text, 16, 21); }).tex;
  const book = (y, h, rot, bg, fg, text) => {
    const cover = mat(bg, 0.8), pages = mat(0xece4cf, 0.95);
    add(g, new THREE.BoxGeometry(0.24, h, 0.17), [pages, cover, cover, cover, new THREE.MeshStandardMaterial({ map: spine(bg, fg, text), roughness: 0.8 }), pages], 0, y + h / 2, 0).rotation.y = rot;
  };
  book(0, 0.04, 0.05, '#7a2e2e', '#f0d9a8', 'LINEAR ALGEBRA');
  book(0.04, 0.032, -0.08, '#2c4a3a', '#e8e1cf', 'STATISTICS');
  book(0.072, 0.036, 0.12, '#182b49', '#ffcd00', 'UC SAN DIEGO');
  ctx.item('education', g, 'books · education');
  return g;
}

// ---------------------------------------------------------------- plants

export function succulent(ctx, { x, y, z, pot = 0xb5603b } = {}) {
  const g = group(x, y, z);
  add(g, new THREE.CylinderGeometry(0.05, 0.038, 0.08, 20), mat(pot, 0.9), 0, 0.04, 0);
  const leaf = mat(0x3f7a3a, 0.7);
  for (let i = 0; i < 9; i++) {
    const l = add(g, new THREE.SphereGeometry(0.02, 10, 8), leaf);
    const a = i * 2.4, tilt = 0.4 + (i % 3) * 0.25;
    l.scale.set(0.5, 2.6, 1.1);
    l.position.set(Math.cos(a) * 0.03, 0.12 + (i % 3) * 0.02, Math.sin(a) * 0.03);
    l.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt);
  }
  ctx.item('plant', g, 'plant', { wiggle: true, noHop: true });
  return g;
}

// tall fiddle-leaf fig on the floor
export function fig(ctx, { x, z } = {}) {
  const g = group(x, 0, z);
  add(g, new THREE.CylinderGeometry(0.15, 0.12, 0.34, 32), mat(0xf1efe9, 0.6), 0, 0.17, 0);
  const stem = mat(0x6b5034, 0.9), leaf = mat(0x2f5e2a, 0.55);
  const top = new V3(0.03, 1.5, 0);
  rod(g, new V3(0, 0.3, 0), top, 0.012, stem, 0.008);
  for (let i = 0; i < 26; i++) {
    const k = i / 26, a = i * 2.39;
    const p = new V3(0, 0.3, 0).lerp(top, 0.25 + k * 0.75);
    const l = add(g, new THREE.SphereGeometry(1, 12, 8), leaf);
    l.scale.set(0.075, 0.11, 0.008);
    l.position.copy(p).add(new V3(Math.cos(a) * 0.1, 0.02, Math.sin(a) * 0.1));
    l.rotation.set(rand(-0.6, 0.6), -a + Math.PI / 2, Math.cos(a) * 0.7);
  }
  ctx.item('plant', g, 'plant', { wiggle: true, noHop: true });
  return g;
}

// ---------------------------------------------------------------- kendo

// shinai: four bamboo staves, leather tip, string along the back, tsuba and grip.
// base is the pommel end, dir points to the tip.
export function shinai(ctx, { base, dir, roll = 0, parent = null } = {}) {
  const g = new THREE.Group();
  const L = 1.17;
  const bamboo = mat(0xd9b779, 0.55), leather = mat(0xf2ebdc, 0.7), tsuba = mat(0x1a1410, 0.6);
  add(g, new THREE.CylinderGeometry(0.0145, 0.0145, 0.28, 16), leather, 0, 0.14, 0); // tsuka (grip)
  add(g, new THREE.CylinderGeometry(0.016, 0.016, 0.012, 16), leather, 0, 0.006, 0); // tsukagashira
  add(g, new THREE.CylinderGeometry(0.042, 0.042, 0.006, 32), tsuba, 0, 0.285, 0); // tsuba
  add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.012, 16), mat(0x3b2a20, 0.8), 0, 0.296, 0); // tsubadome
  // the four staves taper toward the tip
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const s = add(g, new THREE.CylinderGeometry(0.0055, 0.0085, L - 0.33, 8), bamboo, Math.cos(a) * 0.0065, 0.28 + (L - 0.33) / 2, Math.sin(a) * 0.0065);
    s.scale.set(1, 1, 1);
  }
  add(g, new THREE.CylinderGeometry(0.0135, 0.0125, 0.05, 16), leather, 0, L - 0.025, 0); // sakigawa
  add(g, new THREE.CylinderGeometry(0.0145, 0.0145, 0.012, 16), leather, 0, L * 0.73, 0); // nakayui
  rod(g, new V3(0, 0.28, -0.0135), new V3(0, L - 0.04, -0.011), 0.0012, mat(0x5a2d1a, 0.8)); // tsuru
  // invisible, fatter hit area so the thin sword is easy to click
  add(g, new THREE.CylinderGeometry(0.05, 0.05, L, 8), new THREE.MeshBasicMaterial({ visible: false }), 0, L / 2, 0, { cast: false, receive: false });
  g.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir.clone().normalize());
  g.rotateY(roll);
  const pivot = new THREE.Group();
  pivot.position.copy(base);
  pivot.add(g);
  (parent || ctx.scene).add(pivot);
  const top = base.clone().addScaledVector(dir.clone().normalize(), L * 0.85).add(new V3(0, 0, 0.35));
  ctx.item('kendo', pivot, 'shinai · kendo', { noHop: true, play: strike(ctx, pivot, top) });
  return pivot;
}

// men: the head armor. Padded navy futon, steel grille, flaps over the shoulders.
export function men(ctx, { x, y, z, rotY = 0 } = {}) {
  const g = group(x, y, z, rotY);
  const stitch = canvasTex(128, 128, (c) => {
    c.fillStyle = '#1b2140'; c.fillRect(0, 0, 128, 128);
    c.strokeStyle = 'rgba(160,170,210,0.35)'; c.lineWidth = 1;
    for (let i = 4; i < 128; i += 6) { c.beginPath(); c.moveTo(0, i); c.lineTo(128, i); c.stroke(); }
  }, { repeat: [2, 2] }).tex;
  const navy = new THREE.MeshStandardMaterial({ map: stitch, roughness: 0.95, side: THREE.DoubleSide });
  const steel = mat(0xc9c4b0, 0.35, 0.85), trim = mat(0x8c2b2b, 0.7);

  // head: a dome with the face cut out
  const open = 1.0;
  const dome = add(g, new THREE.SphereGeometry(0.12, 32, 20, Math.PI / 2 + open, Math.PI * 2 - open * 2, 0, Math.PI * 0.62), navy, 0, 0.2, 0);
  dome.scale.set(1, 1.15, 1.05);
  // dark lining so the grille reads against shadow, not the wall behind
  add(g, new THREE.SphereGeometry(0.105, 24, 16), mat(0x0d0f1c, 1), 0, 0.2, -0.005).scale.set(1, 1.12, 1);
  // grille: a centre bar and horizontal hoops
  const gr = add(g, new THREE.TorusGeometry(0.122, 0.004, 6, 32, Math.PI * 0.82), steel, 0, 0.2, 0);
  gr.rotation.set(0, Math.PI / 2, -Math.PI * 0.41 + Math.PI / 2);
  gr.scale.set(1.15, 1, 1.05);
  for (let i = 0; i < 13; i++) {
    const yy = -0.07 + i * 0.013;
    const r = 0.122 * Math.sqrt(Math.max(0.2, 1 - (yy / 0.14) ** 2));
    const hoop = add(g, new THREE.TorusGeometry(r, 0.0022, 4, 20, open * 1.9), steel, 0, 0.2 + yy * 1.15, 0);
    hoop.rotation.set(Math.PI / 2, 0, Math.PI / 2 - open * 0.95);
    hoop.scale.set(1, 1.05, 1);
  }
  // red leather trim around the face opening
  const rim = add(g, new THREE.TorusGeometry(0.125, 0.006, 6, 32, Math.PI * 0.95), trim, 0, 0.2, 0.004);
  rim.rotation.set(0, Math.PI / 2, -Math.PI * 0.47 + Math.PI / 2);
  rim.scale.set(1.15, 1, 1.07);
  // shoulder flaps (men-dare)
  for (const s of [-1, 1]) {
    const f = add(g, new THREE.BoxGeometry(0.17, 0.2, 0.012), navy, s * 0.15, 0.07, -0.02);
    f.rotation.set(0.15, s * 0.5, s * 0.45);
  }
  // throat flap (tsukidare)
  const tk = add(g, new THREE.BoxGeometry(0.11, 0.08, 0.01), navy, 0, 0.04, 0.11);
  tk.rotation.x = -0.25;
  // himo (cords) at the back
  const cord = mat(0x2d3f8f, 0.7);
  for (const s of [-1, 1]) rod(g, new V3(s * 0.02, 0.2, -0.12), new V3(s * 0.06, 0.02, -0.16), 0.003, cord);
  ctx.item('kendo', g, 'men · kendo', { spin: true, play: () => ctx.bubble('MEN!', new V3(x, y + 0.42, z + 0.1), { size: 0.1 }) });
  return g;
}

// ---------------------------------------------------------------- outdoors

export function skis(ctx, { base, top, colors = [0xd8352a, 0xf2f2f2], parent = null, play } = {}) {
  const g = new THREE.Group();
  const L = 1.65, tip = 0.18;
  for (const [i, c] of colors.entries()) {
    const geo = new THREE.BoxGeometry(0.09, L, 0.014, 1, 40, 1);
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const y = p.getY(k);
      const u = y - (L / 2 - tip);
      if (u > 0) p.setZ(k, p.getZ(k) + (u / tip) ** 2 * 0.06);
      p.setX(k, p.getX(k) * (1 - Math.abs(y / L) * 0.25));
    }
    geo.computeVertexNormals();
    const m = add(g, geo, mat(c, 0.35), (i - 0.5) * 0.1, L / 2, 0.01 * i);
    m.rotation.y = (i - 0.5) * 0.08;
    add(m, new THREE.BoxGeometry(0.07, 0.24, 0.05), mat(0x222428, 0.5), 0, -0.05, 0.03); // binding
  }
  // poles
  for (const s of [-1, 1]) rod(g, new V3(0.15 + s * 0.03, 0, 0.05), new V3(0.12 + s * 0.02, 1.2, 0), 0.007, mat(0x1d1f24, 0.3, 0.7));
  const dir = new V3().subVectors(top, base).normalize();
  g.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir);
  g.position.copy(base);
  (parent || ctx.scene).add(g);
  ctx.item('outside', g, 'skis', { noHop: true, wiggle: true, play });
  return g;
}

export function goggles(ctx, { x, z, rotY = 0.4, play } = {}) {
  const g = group(x, DESK, z, rotY);
  const lensTex = canvasTex(128, 64, (c) => {
    const gr = c.createLinearGradient(0, 0, 128, 64);
    gr.addColorStop(0, '#ffb347'); gr.addColorStop(0.5, '#ff5e62'); gr.addColorStop(1, '#6a5acd');
    c.fillStyle = gr; c.fillRect(0, 0, 128, 64);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(10, 8, 60, 6);
  }).tex;
  const lens = add(g, new THREE.SphereGeometry(0.1, 24, 12, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.35, Math.PI * 0.3), new THREE.MeshStandardMaterial({ map: lensTex, roughness: 0.15, metalness: 0.4, side: THREE.DoubleSide }), 0, 0.045, -0.06);
  lens.scale.set(1.3, 1, 1);
  const frame = add(g, new THREE.TorusGeometry(0.1, 0.012, 8, 32, Math.PI * 0.55), mat(0x111111, 0.5), 0, 0.045, -0.06);
  frame.rotation.set(Math.PI / 2, 0, Math.PI * 0.225);
  frame.scale.set(1.3, 1, 1);
  const strap = add(g, new THREE.TorusGeometry(0.1, 0.012, 4, 40, Math.PI * 1.45), mat(0x2b6cff, 0.8), 0, 0.012, -0.06);
  strap.rotation.set(Math.PI / 2, 0, Math.PI * 0.775);
  strap.scale.set(1.3, 1, 0.4);
  ctx.item('outside', g, 'goggles', { play });
  return g;
}

export function bottle(ctx, { x, z, color = 0xff7a29, play } = {}) {
  const g = group(x, DESK, z);
  add(g, new THREE.CylinderGeometry(0.036, 0.036, 0.2, 24), new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, transmission: 0.2, thickness: 0.02 }), 0, 0.1, 0);
  add(g, new THREE.CylinderGeometry(0.026, 0.026, 0.03, 20), mat(0x1d1f24, 0.6), 0, 0.215, 0);
  add(g, new THREE.TorusGeometry(0.014, 0.004, 6, 16), mat(0x1d1f24, 0.6), 0, 0.235, 0);
  ctx.item('outside', g, 'water bottle', { play });
  return g;
}

// a framed topographic map on the wall
export function topoMap(ctx, { x, y, z, w = 0.5, h = 0.375, rotY = 0, frame = 0x5b3a24, play } = {}) {
  const tex = canvasTex(640, 480, (c) => {
    c.fillStyle = '#efe6cf'; c.fillRect(0, 0, 640, 480);
    // lake
    c.fillStyle = '#9fd0d6';
    c.beginPath(); c.ellipse(430, 330, 70, 36, 0.3, 0, 7); c.fill();
    const peaks = [[200, 170, 13], [470, 140, 10], [320, 300, 7], [120, 380, 6]];
    c.strokeStyle = 'rgba(140,90,50,0.55)'; c.lineWidth = 1.2;
    for (const [px, py, n] of peaks) for (let k = 1; k <= n; k++) {
      c.beginPath();
      for (let a = 0; a <= 64; a++) {
        const t = a / 64 * Math.PI * 2;
        const r = k * 14 * (1 + 0.18 * Math.sin(t * 3 + k * 0.7 + px) + 0.08 * Math.sin(t * 7 + py));
        const X = px + Math.cos(t) * r * 1.3, Y = py + Math.sin(t) * r;
        a ? c.lineTo(X, Y) : c.moveTo(X, Y);
      }
      c.lineWidth = k % 5 ? 1 : 2;
      c.stroke();
    }
    // the trail
    c.strokeStyle = '#d23b2f'; c.lineWidth = 3; c.setLineDash([10, 7]);
    c.beginPath(); c.moveTo(40, 450); c.bezierCurveTo(180, 400, 240, 300, 330, 260); c.bezierCurveTo(400, 230, 440, 200, 470, 140); c.stroke();
    c.setLineDash([]);
    c.fillStyle = '#d23b2f'; c.beginPath(); c.arc(470, 140, 7, 0, 7); c.fill();
    c.fillStyle = '#5b3a24'; c.font = '600 22px "JetBrains Mono", monospace';
    c.fillText('▲ SUMMIT', 485, 128);
    c.font = '18px "JetBrains Mono", monospace';
    c.fillText('TRAIL MAP · 1:25 000', 24, 36);
  }).tex;
  const g = group(x, y, z, rotY);
  add(g, new THREE.BoxGeometry(w + 0.04, h + 0.04, 0.02), mat(frame, 0.6), 0, 0, 0);
  add(g, new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }), 0, 0, 0.0105, { cast: false });
  ctx.item('outside', g, 'trail map', { noHop: true, wiggle: true, play });
  return g;
}

// ---------------------------------------------------------------- room switcher

// Postcards pinned to the wall, one per room. Clicking one takes you there.
const ROOMS = [
  { key: 'powder', label: 'powder', href: '/room/', draw(g) {
    sky(g, '#8193ab', '#d3dbe4'); hills(g, '#eef2f7', 120, 30); hills(g, '#f7f9fc', 160, 18);
    g.strokeStyle = '#2a2d33'; g.lineWidth = 2; g.beginPath(); g.moveTo(40, 200); g.lineTo(200, 90); g.stroke();
    for (let i = 0; i < 4; i++) g.fillRect(70 + i * 40, 175 - i * 27, 3, 18);
    g.fillStyle = '#23392c'; for (let i = 0; i < 9; i++) tree(g, 20 + i * 30 + rand(-6, 6), 215, 22);
    g.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(rand(20, 280), rand(20, 220), rand(1, 2.5), 0, 7); g.fill(); }
  } },
  { key: 'night', label: 'night', href: '/room/night/', draw(g) {
    sky(g, '#0b1530', '#3a2f45'); hills(g, '#080a14', 120, 40);
    for (let i = 0; i < 90; i++) { g.fillStyle = Math.random() < 0.7 ? '#ffc27a' : '#bfd4ff'; g.fillRect(rand(20, 280), rand(160, 220), 2, 2); }
    g.strokeStyle = 'rgba(160,180,220,0.45)'; g.lineWidth = 1;
    for (let i = 0; i < 40; i++) { const x = rand(20, 280), y = rand(20, 200); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 14); g.stroke(); }
  } },
  { key: 'harbour', label: 'harbour', href: '/room/harbour/', draw(g) {
    sky(g, '#3f7fd0', '#d8e7f2'); hills(g, '#9aa8b8', 110, 50); hills(g, '#4f5c56', 140, 30);
    g.fillStyle = '#2a6a90'; g.fillRect(20, 160, 260, 60);
    g.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 30; i++) g.fillRect(rand(20, 280), rand(165, 218), 4, 1);
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(180, 160); g.lineTo(180, 118); g.lineTo(200, 158); g.fill();
  } },
  { key: 'cabin', label: 'cabin', href: '/room/trailhead/', draw(g) {
    sky(g, '#2a68c8', '#d2e6f5'); hills(g, '#7b818a', 90, 60);
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(130, 72); g.lineTo(150, 50); g.lineTo(172, 76); g.fill();
    g.fillStyle = '#24412b'; for (let i = 0; i < 12; i++) tree(g, 20 + i * 23, 165, 30);
    g.fillStyle = '#5fc3c9'; g.fillRect(20, 165, 260, 55);
  } },
];
function sky(g, top, bottom) { const gr = g.createLinearGradient(0, 20, 0, 220); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(20, 20, 260, 200); }
function hills(g, color, base, amp) {
  g.fillStyle = color; g.beginPath(); g.moveTo(20, 220);
  for (let x = 20; x <= 280; x += 4) g.lineTo(x, base + amp * 0.5 - amp * Math.abs(Math.sin(x * 0.025 + base)) - amp * 0.4 * Math.abs(Math.sin(x * 0.07)));
  g.lineTo(280, 220); g.fill();
}
function tree(g, x, y, h) { g.beginPath(); g.moveTo(x, y - h); g.lineTo(x - h * 0.3, y); g.lineTo(x + h * 0.3, y); g.fill(); }

export function postcards(ctx, { x, y, z, rotY = 0, current, cols = 2, gap = [0.19, 0.21] } = {}) {
  ROOMS.forEach((r, i) => {
    const here = r.key === current;
    const tex = canvasTex(300, 340, (g) => {
      g.fillStyle = '#fbf8f1'; g.fillRect(0, 0, 300, 340);
      g.save(); g.beginPath(); g.rect(20, 20, 260, 200); g.clip(); r.draw(g); g.restore();
      g.fillStyle = here ? '#d23b2f' : '#2a2a30';
      g.font = '56px VT323'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(here ? `${r.label} ★` : r.label, 150, 280);
    }).tex;
    const c = new THREE.Group();
    c.position.set(x + (i % cols) * gap[0], y - Math.floor(i / cols) * gap[1], z);
    c.rotation.set(0, rotY, rand(-0.08, 0.08));
    add(c, new THREE.BoxGeometry(0.15, 0.17, 0.004), mat(0xfbf8f1, 0.8), 0, 0, 0);
    add(c, new THREE.PlaneGeometry(0.15, 0.17), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }), 0, 0, 0.0025, { cast: false });
    add(c, new THREE.SphereGeometry(0.009, 10, 8), mat(here ? 0xd23b2f : 0x2f6bff, 0.4), 0, 0.07, 0.008);
    ctx.item(`room:${r.key}`, c, here ? `postcard · ${r.label} (you are here)` : `postcard · go to ${r.label}`, { href: r.href, current: here, noHop: true, wiggle: true });
  });
}
