// Room shells: back wall with a window, floor and desk. The desk surface is
// always DESK high, 1.9m wide and centred on the origin.
import { THREE, DESK, mat, add, canvasTex, rand } from './core.js';

function planks(base, gap, w = 1024, n = 8) {
  return canvasTex(w, w, (g) => {
    const h = w / n;
    for (let i = 0; i < n; i++) {
      const c = new THREE.Color(base).multiplyScalar(rand(0.82, 1.12));
      g.fillStyle = `#${c.getHexString()}`;
      g.fillRect(0, i * h, w, h);
      g.strokeStyle = 'rgba(0,0,0,0.06)';
      for (let k = 0; k < 14; k++) { g.beginPath(); const y = i * h + rand(4, h - 4); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + rand(-4, 4), w * 0.6, y + rand(-4, 4), w, y); g.stroke(); }
      g.fillStyle = gap;
      g.fillRect(0, i * h, w, 2);
      g.fillRect(rand(0, w), i * h, 2, h);
    }
  }, { repeat: [3, 3] }).tex;
}

function wallWithHole(parent, win, material, { T = 0.1, W = 7, H = 4 } = {}) {
  const zc = win.z - T / 2;
  add(parent, new THREE.BoxGeometry(W / 2 + win.x0, H, T), material, (-W / 2 + win.x0) / 2, H / 2, zc);
  add(parent, new THREE.BoxGeometry(W / 2 - win.x1, H, T), material, (W / 2 + win.x1) / 2, H / 2, zc);
  add(parent, new THREE.BoxGeometry(win.x1 - win.x0, win.y0, T), material, (win.x0 + win.x1) / 2, win.y0 / 2, zc);
  add(parent, new THREE.BoxGeometry(win.x1 - win.x0, H - win.y1, T), material, (win.x0 + win.x1) / 2, (H + win.y1) / 2, zc);
}

// ---------------------------------------------------------------- modern studio

export function studioRoom(ctx, win) {
  const s = ctx.scene;
  const plaster = mat(0xeeebe5, 0.92);
  wallWithHole(s, win, plaster);
  const floor = add(s, new THREE.PlaneGeometry(10, 5.5), new THREE.MeshStandardMaterial({ map: planks(0xc79f6e, 'rgba(60,40,20,0.25)'), roughness: 0.6 }), 0, 0, 2.3);
  floor.rotation.x = -Math.PI / 2;
  add(s, new THREE.BoxGeometry(7, 0.08, 0.02), mat(0xf6f4f0, 0.6), 0, 0.04, win.z + 0.01);

  // slim black frame, three tall panes
  const black = mat(0x1a1b1d, 0.45, 0.4);
  const w = win.x1 - win.x0, h = win.y1 - win.y0, cx = (win.x0 + win.x1) / 2, cy = (win.y0 + win.y1) / 2, fz = win.z - 0.03;
  add(s, new THREE.BoxGeometry(w, 0.03, 0.05), black, cx, win.y0, fz);
  add(s, new THREE.BoxGeometry(w, 0.03, 0.05), black, cx, win.y1, fz);
  for (let i = 0; i <= 3; i++) add(s, new THREE.BoxGeometry(0.03, h, 0.05), black, win.x0 + (w * i) / 3, cy, fz);

  // light oak top on a black steel frame
  const oak = new THREE.MeshStandardMaterial({ map: planks(0xd9b88a, 'rgba(0,0,0,0)', 512, 3), roughness: 0.45 });
  add(s, new THREE.BoxGeometry(1.9, 0.03, 0.8), oak, 0, DESK - 0.015, 0);
  for (const x of [-0.88, 0.88]) {
    add(s, new THREE.BoxGeometry(0.03, DESK - 0.03, 0.03), black, x, (DESK - 0.03) / 2, -0.34);
    add(s, new THREE.BoxGeometry(0.03, DESK - 0.03, 0.03), black, x, (DESK - 0.03) / 2, 0.34);
    add(s, new THREE.BoxGeometry(0.03, 0.03, 0.7), black, x, DESK - 0.045, 0);
  }
  add(s, new THREE.BoxGeometry(1.76, 0.03, 0.03), black, 0, DESK - 0.045, -0.34);
}

// ---------------------------------------------------------------- log cabin

export function cabinRoom(ctx, win, { logColor = 0xb57d47, deskColor = 0x4a2a17, legColor = 0x2e1a0e, shelf = null } = {}) {
  const s = ctx.scene;
  // chinking behind the logs
  wallWithHole(s, win, mat(0xe9dcc2, 0.95), { T: 0.06 });

  // stacked logs, cut around the window
  const R = 0.1, step = 0.185, segs = [];
  for (let y = R; y < 3.4; y += step) {
    if (y + R > win.y0 - 0.06 && y - R < win.y1 + 0.06) segs.push([-3.5, win.x0 - 0.1, y], [win.x1 + 0.1, 3.5, y]);
    else segs.push([-3.5, 3.5, y]);
  }
  const logs = new THREE.InstancedMesh(new THREE.CylinderGeometry(R, R, 1, 16).rotateZ(Math.PI / 2), mat(0xffffff, 0.85), segs.length);
  const m4 = new THREE.Matrix4(), c = new THREE.Color();
  segs.forEach(([a, b, y], i) => {
    m4.makeScale(b - a, 1, 1).setPosition((a + b) / 2, y, win.z - 0.02);
    logs.setMatrixAt(i, m4);
    logs.setColorAt(i, c.set(logColor).multiplyScalar(rand(0.78, 1.12)));
  });
  logs.castShadow = logs.receiveShadow = true;
  s.add(logs);

  const floor = add(s, new THREE.PlaneGeometry(10, 5.5), new THREE.MeshStandardMaterial({ map: planks(0x8a5c36, 'rgba(30,15,5,0.5)', 1024, 6), roughness: 0.75 }), 0, 0, 2.3);
  floor.rotation.x = -Math.PI / 2;

  // chunky window frame with a cross, deep sill
  const wood = mat(0x7a4b2a, 0.7);
  const w = win.x1 - win.x0, h = win.y1 - win.y0, cx = (win.x0 + win.x1) / 2, cy = (win.y0 + win.y1) / 2, fz = win.z + 0.02;
  add(s, new THREE.BoxGeometry(w + 0.16, 0.08, 0.12), wood, cx, win.y1 + 0.04, fz);
  add(s, new THREE.BoxGeometry(0.08, h + 0.08, 0.12), wood, win.x0 - 0.04, cy, fz);
  add(s, new THREE.BoxGeometry(0.08, h + 0.08, 0.12), wood, win.x1 + 0.04, cy, fz);
  add(s, new THREE.BoxGeometry(0.04, h, 0.06), wood, cx, cy, win.z - 0.03);
  add(s, new THREE.BoxGeometry(w, 0.04, 0.06), wood, cx, cy, win.z - 0.03);
  add(s, new THREE.BoxGeometry(w + 0.3, 0.05, 0.22), wood, cx, win.y0 - 0.025, win.z + 0.08);

  // thick slab desk on timber legs
  const slab = new THREE.MeshStandardMaterial({ map: planks(deskColor, 'rgba(0,0,0,0.25)', 512, 3), roughness: 0.5 });
  const legs = mat(legColor, 0.6);
  add(s, new THREE.BoxGeometry(1.9, 0.06, 0.82), slab, 0, DESK - 0.03, 0);
  for (const [x, z] of [[-0.86, -0.34], [0.86, -0.34], [-0.86, 0.34], [0.86, 0.34]])
    add(s, new THREE.BoxGeometry(0.08, DESK - 0.06, 0.08), legs, x, (DESK - 0.06) / 2, z);

  if (shelf) {
    const [x, y, len] = shelf;
    add(s, new THREE.BoxGeometry(len, 0.035, 0.24), wood, x, y, win.z + 0.1);
    for (const dx of [-len / 2 + 0.08, len / 2 - 0.08]) add(s, new THREE.BoxGeometry(0.03, 0.14, 0.16), mat(0x2a2522, 0.5, 0.5), x + dx, y - 0.08, win.z + 0.06);
  }
}
