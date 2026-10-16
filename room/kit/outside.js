// The world beyond the window: sky, layered mountains, water, trees, weather.
// Distances are in metres; the room sits at the origin looking down -z.
import { THREE, V3, mat, add, canvasTex, rand, reduce } from './core.js';

const NOISE = `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
  float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a*noise(p); p *= 2.03; a *= .5; } return v; }
`;
const WORLD_VS = 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }';
const col = (c) => new THREE.Color(c);

export function sky(ctx, { top, mid, horizon, z = -900, sun = null }) {
  const m = new THREE.ShaderMaterial({
    depthWrite: false,
    uniforms: { uTop: { value: col(top) }, uMid: { value: col(mid) }, uHor: { value: col(horizon) }, uSun: { value: new THREE.Vector2(...(sun || [9999, 9999])) } },
    vertexShader: WORLD_VS,
    fragmentShader: `uniform vec3 uTop, uMid, uHor; uniform vec2 uSun; varying vec3 vW;
      void main(){
        float t = clamp(vW.y / 400., 0., 1.);
        vec3 c = mix(uHor, uMid, smoothstep(0., .35, t));
        c = mix(c, uTop, smoothstep(.35, 1., t));
        float s = length(vW.xy - uSun);
        c += vec3(1., .9, .7) * (exp(-s/40.) * .9 + exp(-s/220.) * .25);
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  add(ctx.scene, new THREE.PlaneGeometry(4000, 1400), m, 0, 300, z, { cast: false, receive: false });
}

// one ridge line. Layers further away get more haze so the range reads in depth.
export function mountains(ctx, {
  z, base, amp, seed = 1, width = 1400, freq = 1,
  rock = 0x5d6670, forest = 0x2b4a32, snow = 0xf3f6fb, haze = 0xbcd2e6, hazeAmt = 0,
  snowLine = 1e9, treeLine = -1e9, snowForest = false, runs = [], mist = 0.25,
}) {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, base - 200);
  const f = 0.006 * freq;
  for (let x = -width / 2; x <= width / 2; x += 2) {
    const h = 0.5 * (1 - Math.abs(Math.sin(x * f + seed))) + 0.3 * (1 - Math.abs(Math.sin(x * f * 2.3 + seed * 2))) + 0.2 * (1 - Math.abs(Math.sin(x * f * 5.1 + seed * 3)));
    s.lineTo(x, base + amp * h ** 1.5);
  }
  s.lineTo(width / 2, base - 200);
  const runArr = Array.from({ length: 4 }, (_, i) => new V3(...(runs[i] || [0, 0, 0])));
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uRock: { value: col(rock) }, uForest: { value: col(forest) }, uSnow: { value: col(snow) }, uHaze: { value: col(haze) },
      uHazeAmt: { value: hazeAmt }, uSnowLine: { value: snowLine }, uTreeLine: { value: treeLine }, uBase: { value: base }, uAmp: { value: amp },
      uSnowForest: { value: snowForest ? 1 : 0 }, uRuns: { value: runArr }, uMist: { value: mist },
    },
    vertexShader: WORLD_VS,
    fragmentShader: `${NOISE}
      uniform vec3 uRock, uForest, uSnow, uHaze, uRuns[4];
      uniform float uHazeAmt, uSnowLine, uTreeLine, uBase, uAmp, uSnowForest, uMist;
      varying vec3 vW;
      void main(){
        vec2 p = vW.xy;
        float n = fbm(p * vec2(.035, .06));
        float gully = fbm(vec2(p.x * .22, p.y * .025));
        vec3 c = uRock * (.75 + .5 * n) * (.8 + .4 * gully);
        // forest below the tree line, speckled
        float fr = 1. - smoothstep(uTreeLine - 6., uTreeLine + 6., p.y + (n - .5) * 30.);
        float speck = noise(p * vec2(2.2, 3.4)) * .6 + noise(p * vec2(.5, .8)) * .4;
        vec3 fc = uForest * (.6 + .7 * speck);
        if (uSnowForest > .5) fc = mix(fc, uSnow * .92, smoothstep(.45, .7, speck));
        c = mix(c, fc, fr);
        // ski runs cut through the trees
        for (int i = 0; i < 4; i++) {
          vec3 r = uRuns[i];
          if (r.z > 0.) {
            float d = abs(p.x - (r.x + (p.y - uBase) * r.y));
            c = mix(c, uSnow * (.9 + .1 * n), (1. - smoothstep(r.z * .6, r.z, d)) * fr);
          }
        }
        // snow above the snow line, streaking down gullies
        float sn = smoothstep(uSnowLine - 4., uSnowLine + 4., p.y + (gully - .5) * 60. + (n - .5) * 20.);
        c = mix(c, uSnow * (.82 + .25 * n), sn);
        // haze, thicker low in the valleys
        float low = 1. - smoothstep(uBase, uBase + uAmp * .6, p.y);
        c = mix(c, uHaze, clamp(uHazeAmt + low * uMist, 0., 1.));
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  add(ctx.scene, new THREE.ShapeGeometry(s), m, 0, 0, z, { cast: false, receive: false });
}

// deep is the colour close in, color the colour toward the horizon
export function water(ctx, { y, near = 20, far = 900, deep, color, glint = 1, sunX = 0, width = 3000 }) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: ctx.uTime, uNear: { value: col(deep) }, uFar: { value: col(color) }, uGlint: { value: glint }, uSunX: { value: sunX }, uFarD: { value: far } },
    vertexShader: WORLD_VS,
    fragmentShader: `${NOISE}
      uniform float uTime, uGlint, uSunX, uFarD; uniform vec3 uNear, uFar; varying vec3 vW;
      void main(){
        float d = -vW.z;
        float t = smoothstep(0., uFarD * .7, d);
        vec3 c = mix(uNear, uFar, pow(t, .6));
        float w = noise(vec2(vW.x * .08, d * .5 - uTime * .4)) * noise(vec2(vW.x * .05 + uTime * .1, d * .25));
        c *= .9 + .25 * w;
        float sp = pow(noise(vec2(vW.x * .9 + uTime * .7, d * 2.2 - uTime)), 18.);
        float col = exp(-abs(vW.x - uSunX * t) / (40. + d * .3));
        c += vec3(1., .95, .85) * sp * uGlint * (2.5 * col + .4) * (1. - t * .6);
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  const p = add(ctx.scene, new THREE.PlaneGeometry(width, far - near), m, 0, y, -(near + far) / 2, { cast: false, receive: false });
  p.rotation.x = -Math.PI / 2;
}

// conifers; snowy ones get white caps
export function trees(ctx, { count, x: [x0, x1], z: [z0, z1], y = () => 0, size = [6, 14], color = 0x24412b, snowy = false, avoid = () => false }) {
  const geo = new THREE.ConeGeometry(0.33, 1, 7).translate(0, 0.5, 0);
  const pine = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial(), count);
  const caps = snowy ? new THREE.InstancedMesh(new THREE.ConeGeometry(0.25, 0.55, 7).translate(0, 0.72, 0), new THREE.MeshLambertMaterial({ color: 0xf4f8ff }), count) : null;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  let n = 0;
  for (let tries = 0; n < count && tries < count * 4; tries++) {
    const x = rand(x0, x1), z = rand(z0, z1);
    if (avoid(x, z)) continue;
    const h = rand(...size);
    m4.compose(new V3(x, y(x, z), z), q, new V3(h * rand(0.8, 1.1), h, h * rand(0.8, 1.1)));
    pine.setMatrixAt(n, m4);
    pine.setColorAt(n, c.set(color).multiplyScalar(rand(0.7, 1.25)));
    caps?.setMatrixAt(n, m4);
    n++;
  }
  pine.count = n;
  ctx.scene.add(pine);
  if (caps) { caps.count = n; ctx.scene.add(caps); }
}

export function clouds(ctx, { count = 8, y: [y0, y1], z: [z0, z1], x: [x0, x1] = [-700, 700], size = [120, 260], opacity = 0.85, color = 0xffffff, drift = 2 }) {
  const tex = canvasTex(256, 128, (g) => {
    for (let i = 0; i < 14; i++) {
      const x = rand(50, 206), y = rand(50, 85), r = rand(20, 46);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
    }
  }).tex;
  const list = [];
  for (let i = 0; i < count; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, depthWrite: false }));
    const w = rand(...size);
    s.scale.set(w, w * 0.5, 1);
    s.position.set(rand(x0, x1), rand(y0, y1), rand(z0, z1));
    ctx.scene.add(s);
    list.push(s);
  }
  ctx.onFrame((t, dt) => { for (const s of list) { s.position.x += dt * drift; if (s.position.x > x1) s.position.x = x0; } });
}

export function snowfall(ctx, { count = 2500, x: [x0, x1] = [-6, 6], y: [y0, y1] = [-3, 7], z: [z0, z1] = [-0.6, -14], speed = 0.9, size = 0.035 }) {
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) { pos.set([rand(x0, x1), rand(y0, y1), rand(z1, z0)], i * 3); seed[i] = Math.random(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dot = canvasTex(32, 32, (c) => { const gr = c.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 32, 32); }).tex;
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size, map: dot, transparent: true, depthWrite: false, color: 0xffffff }));
  pts.frustumCulled = false;
  ctx.scene.add(pts);
  if (reduce) return;
  ctx.onFrame((t, dt) => {
    for (let i = 0; i < count; i++) {
      const k = seed[i];
      let y = pos[i * 3 + 1] - dt * speed * (0.6 + k * 0.8);
      if (y < y0) y = y1;
      pos[i * 3 + 1] = y;
      pos[i * 3] += Math.sin(t * (0.6 + k) + k * 40) * dt * 0.25 + dt * 0.12;
      if (pos[i * 3] > x1) pos[i * 3] = x0;
    }
    g.attributes.position.needsUpdate = true;
  });
}

export function sailboats(ctx, { y, list }) {
  const boats = list.map(([x, z, s = 1, v = 0.6]) => {
    const g = new THREE.Group();
    add(g, new THREE.BoxGeometry(5, 0.9, 1.5), mat(0xf6f6f2, 0.5), 0, 0.45, 0, { cast: false });
    const sail = new THREE.Shape(); sail.moveTo(0, 0); sail.lineTo(0, 8); sail.lineTo(3.6, 0.3); sail.closePath();
    add(g, new THREE.ShapeGeometry(sail), new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }), -0.6, 1, 0, { cast: false });
    const jib = new THREE.Shape(); jib.moveTo(0, 0); jib.lineTo(0, 6.5); jib.lineTo(-2.4, 0.3); jib.closePath();
    add(g, new THREE.ShapeGeometry(jib), new THREE.MeshLambertMaterial({ color: 0xeef2f6, side: THREE.DoubleSide }), -0.7, 1, 0.05, { cast: false });
    g.scale.setScalar(s);
    g.position.set(x, y, z);
    ctx.scene.add(g);
    return { g, v, x };
  });
  ctx.onFrame((t) => { for (const b of boats) { b.g.position.x = b.x + Math.sin(t * 0.02 * b.v) * 60; b.g.rotation.z = Math.sin(t * 0.8 + b.x) * 0.03; } });
}

// a float plane crossing the harbour now and then
export function seaplane(ctx, { y, z, span = 700, period = 70 }) {
  const g = new THREE.Group();
  const white = mat(0xf4f4f0, 0.4), stripe = mat(0xd8352a, 0.5);
  add(g, new THREE.BoxGeometry(9, 1.4, 1.4), white, 0, 0, 0, { cast: false });
  add(g, new THREE.BoxGeometry(9.2, 0.35, 1.45), stripe, 0, -0.1, 0, { cast: false });
  add(g, new THREE.BoxGeometry(2, 0.2, 14), white, 0.8, 0.8, 0, { cast: false });
  add(g, new THREE.BoxGeometry(1.4, 2, 0.2), white, -4.2, 1, 0, { cast: false });
  for (const s of [-1, 1]) add(g, new THREE.BoxGeometry(6, 0.4, 0.4), white, 0.4, -1.8, s * 1.6, { cast: false });
  ctx.scene.add(g);
  ctx.onFrame((t) => {
    const k = (t / period) % 1;
    g.position.set(-span / 2 + k * span, y + Math.sin(k * Math.PI) * 25, z);
    g.rotation.z = Math.cos(k * Math.PI) * 0.12;
  });
}

// a two-way chairlift from the base area up a run
export function chairlift(ctx, { from, to, towers = 7, chairs = 16, speed = 0.012 }) {
  const A = new V3(...from), B = new V3(...to);
  const dark = mat(0x2a2d33, 0.6);
  const side = new V3(2.2, 0, 0);
  const at = (u, s) => A.clone().lerp(B, u).add(new V3(0, 6 - Math.sin(u * Math.PI * towers) ** 2 * 0.6, 0)).addScaledVector(side, s);
  for (let i = 0; i <= towers; i++) {
    const p = A.clone().lerp(B, i / towers);
    add(ctx.scene, new THREE.BoxGeometry(0.5, 6.5, 0.5), dark, p.x, p.y + 3.2, p.z, { cast: false });
    add(ctx.scene, new THREE.BoxGeometry(5, 0.3, 0.3), dark, p.x, p.y + 6.4, p.z, { cast: false });
  }
  for (const s of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 40; i++) pts.push(at(i / 40, s));
    ctx.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x222222 })));
  }
  const list = [];
  for (let i = 0; i < chairs; i++) {
    const c = new THREE.Group();
    add(c, new THREE.BoxGeometry(1.6, 0.2, 0.7), dark, 0, -1.4, 0, { cast: false });
    add(c, new THREE.BoxGeometry(0.08, 1.4, 0.08), dark, 0, -0.7, 0, { cast: false });
    if (Math.random() < 0.5) add(c, new THREE.BoxGeometry(0.5, 0.7, 0.4), mat([0xd8352a, 0x2b6cff, 0xffc93c][i % 3], 0.6), 0.3, -1.0, 0, { cast: false });
    ctx.scene.add(c);
    list.push({ c, u: i / chairs });
  }
  ctx.onFrame((t, dt) => {
    for (const ch of list) {
      ch.u = (ch.u + dt * speed) % 1;
      const up = ch.u < 0.5, u = up ? ch.u * 2 : 2 - ch.u * 2;
      ch.c.position.copy(at(u, up ? -1 : 1));
    }
  });
}

// the window pane: faint reflection, optional frost creeping in from the edges
export function glass(ctx, win, { frost = false, sheen = 0.05 } = {}) {
  const w = win.x1 - win.x0, h = win.y1 - win.y0;
  const tex = canvasTex(512, Math.round(512 * h / w), (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, `rgba(255,255,255,${sheen})`); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(255,255,255,${sheen * 0.6})`);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (!frost) return;
    for (let i = 0; i < 2600; i++) {
      const edge = Math.random() < 0.5;
      let x = Math.random() * W, y = Math.random() * H;
      if (edge) y = H - Math.random() ** 3 * H * 0.35; else x = Math.random() < 0.5 ? Math.random() ** 3 * W * 0.15 : W - Math.random() ** 3 * W * 0.15;
      const r = rand(1, 7);
      g.strokeStyle = `rgba(240,248,255,${rand(0.08, 0.3)})`;
      g.lineWidth = 0.8;
      g.beginPath();
      for (let k = 0; k < 3; k++) { const a = Math.random() * Math.PI; g.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      g.stroke();
    }
    const fog = g.createLinearGradient(0, H, 0, H * 0.6);
    fog.addColorStop(0, 'rgba(235,245,255,0.45)'); fog.addColorStop(1, 'rgba(235,245,255,0)');
    g.fillStyle = fog; g.fillRect(0, 0, W, H);
  }).tex;
  add(ctx.scene, new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }), (win.x0 + win.x1) / 2, (win.y0 + win.y1) / 2, win.z - 0.05, { cast: false, receive: false });
}
