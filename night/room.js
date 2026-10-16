// A desk on a rainy Vancouver night, built from primitives in three.js.
// The CRT runs the same ASCII field as the plain homepage and shows the section
// for whichever object you click. Nothing is loaded except three.js itself.
import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { postcards } from '../kit/objects.js';

const veil = document.getElementById('veil');
if (!WebGL.isWebGL2Available()) {
  veil.innerHTML = 'no webgl here. <a href="/plain/">see the plain version</a>';
  throw new Error('WebGL2 unavailable');
}

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const V3 = THREE.Vector3;
const DESK = 0.76; // desk surface height

// ---------------------------------------------------------------- content

const SECTIONS = {
  home: {
    label: 'home', tint: 0x7dffc4,
    lines: [{ title: 'takashi yabuta' }, 'software engineer · vancouver, bc', '', '> click things on the desk'],
    links: [['github', 'https://github.com/yabutaka'], ['linkedin', 'https://www.linkedin.com/in/takashi-yabuta']],
  },
  about: {
    label: 'about', tint: 0xffd59a,
    lines: ['hi!', '', "I'm a software engineer at DoorDash,", 'building backend systems that move', 'a lot of data.', '', 'outside work: LLM agents + iOS AR apps.', 'I speak English and 日本語.'],
    links: [['github', 'https://github.com/yabutaka'], ['linkedin', 'https://www.linkedin.com/in/takashi-yabuta']],
  },
  work: {
    label: 'work', tint: 0xff6a5a,
    lines: ['~/work', '', '2022 - now   DoorDash', '             software engineer', '', '2020, 2021   Oracle', '             software engineer intern'],
    links: [['linkedin', 'https://www.linkedin.com/in/takashi-yabuta']],
  },
  agent: {
    label: 'agent', tint: 0x8fe36b,
    lines: ['~/projects/agent', '', 'Minecraft AI Agent', 'an LLM agent that plays Minecraft.', '', '$ git clone yabutaka/hauru-bot'],
    links: [['hauru-bot', 'https://github.com/yabutaka/hauru-bot']],
  },
  ios: {
    label: 'ios', tint: 0x8fb4ff,
    lines: ['~/projects/ios', '', 'Aremo', '  voice chat with AR avatars', '', 'ShARe', '  make and share AR objects'],
    links: [],
  },
  education: {
    label: 'education', tint: 0xffc93c,
    lines: ['~/education', '', '2018 - 2022  UC San Diego', '             B.S. Data Science', '             minor in Math'],
    links: [],
  },
};

const BOOT = ['TY-BIOS v2.26  (c) yabutaka', '', 'memory test ....... 640K ok', 'rain ............... yes', 'mounting ~/desk .... ok', '', 'starting field.js'];

// ---------------------------------------------------------------- renderer

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07080d);
const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 300);

const mat = (color, roughness = 0.8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
function add(parent, geo, material, x = 0, y = 0, z = 0, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  parent.add(m);
  return m;
}
function rod(parent, a, b, r, material) {
  const d = new V3().subVectors(b, a);
  const m = add(parent, new THREE.CylinderGeometry(r, r, d.length(), 12), material);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.normalize());
  return m;
}
function canvasTex(w, h, draw, { pixel = false } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw && draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (pixel) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; }
  else t.anisotropy = 4;
  return { canvas: c, g, tex: t };
}

// ---------------------------------------------------------------- room

const wallMat = mat(0x2a2832, 0.95);
const WIN = { x0: -0.72, x1: 0.72, y0: 0.98, y1: 1.98, z: -0.45 };
{
  const T = 0.1, zc = WIN.z - T / 2;
  add(scene, new THREE.BoxGeometry(3, 4, T), wallMat, WIN.x0 - 1.5, 2, zc);
  add(scene, new THREE.BoxGeometry(3, 4, T), wallMat, WIN.x1 + 1.5, 2, zc);
  add(scene, new THREE.BoxGeometry(WIN.x1 - WIN.x0, WIN.y0, T), wallMat, 0, WIN.y0 / 2, zc);
  add(scene, new THREE.BoxGeometry(WIN.x1 - WIN.x0, 4 - WIN.y1, T), wallMat, 0, (4 + WIN.y1) / 2, zc);
  add(scene, new THREE.PlaneGeometry(8, 6), mat(0x16141a, 0.9), 0, 0, 0).rotation.x = -Math.PI / 2;
  // side wall so wide screens don't see into the void
  add(scene, new THREE.PlaneGeometry(4, 4), wallMat, -1.9, 2, 1.5).rotation.y = Math.PI / 2;

  const frame = mat(0xd9d4c7, 0.6);
  const w = WIN.x1 - WIN.x0, h = WIN.y1 - WIN.y0, cx = 0, cy = (WIN.y0 + WIN.y1) / 2, fz = WIN.z - 0.04;
  add(scene, new THREE.BoxGeometry(w + 0.08, 0.04, 0.06), frame, cx, WIN.y1, fz);
  add(scene, new THREE.BoxGeometry(0.04, h, 0.06), frame, WIN.x0, cy, fz);
  add(scene, new THREE.BoxGeometry(0.04, h, 0.06), frame, WIN.x1, cy, fz);
  add(scene, new THREE.BoxGeometry(0.03, h, 0.04), frame, cx, cy, fz);
  add(scene, new THREE.BoxGeometry(w, 0.03, 0.04), frame, cx, cy + 0.12, fz);
  // sill
  add(scene, new THREE.BoxGeometry(w + 0.2, 0.035, 0.16), frame, cx, WIN.y0 - 0.017, WIN.z + 0.03);
}

// desk
const wood = mat(0x5b3a24, 0.55);
{
  add(scene, new THREE.BoxGeometry(1.9, 0.045, 0.82), wood, 0, DESK - 0.0225, 0);
  for (const [x, z] of [[-0.9, -0.36], [0.9, -0.36], [-0.9, 0.36], [0.9, 0.36]])
    add(scene, new THREE.BoxGeometry(0.05, DESK - 0.045, 0.05), wood, x, (DESK - 0.045) / 2, z);
  add(scene, new THREE.BoxGeometry(1.8, 0.1, 0.02), wood, 0, DESK - 0.1, 0.4);
}

// ---------------------------------------------------------------- outside

const outside = new THREE.Group();
scene.add(outside);
const uTime = { value: 0 };

// sky: low clouds lit orange by the city
add(outside, new THREE.PlaneGeometry(600, 300), new THREE.ShaderMaterial({
  depthWrite: false,
  vertexShader: 'varying float vY; void main(){ vY = (modelMatrix*vec4(position,1.)).y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `varying float vY;
    void main(){
      vec3 top = vec3(.006,.009,.026), glow = vec3(.075,.05,.075), low = vec3(.02,.018,.03);
      float t = smoothstep(-10., 70., vY);
      vec3 c = mix(glow, top, t);
      c = mix(low, c, smoothstep(-30., 0., vY));
      gl_FragColor = vec4(c, 1.);
    }`,
}), 0, 40, -140, { cast: false, receive: false });

// north shore mountains
{
  const s = new THREE.Shape();
  s.moveTo(-160, -40);
  for (let x = -160; x <= 160; x += 2) {
    const y = 0.6 * (4 + 9 * Math.sin(x * 0.03 + 1.3) + 5 * Math.sin(x * 0.071 + 0.4) + 2 * Math.sin(x * 0.19) + (x > -20 && x < 30 ? 6 * Math.cos((x - 5) * 0.06) : 0));
    s.lineTo(x, y);
  }
  s.lineTo(160, -40);
  add(outside, new THREE.ShapeGeometry(s), new THREE.MeshBasicMaterial({ color: 0x080a14 }), 0, 0, -100, { cast: false, receive: false });
}

// city lights, a ski hill, a skytrain and a plane, all as twinkling points
const lightsMat = new THREE.ShaderMaterial({
  uniforms: { uTime }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute float size; attribute float phase; attribute vec3 color;
    uniform float uTime; varying vec3 vC; varying float vA;
    void main(){
      vec4 mv = modelViewMatrix*vec4(position,1.);
      gl_Position = projectionMatrix*mv;
      gl_PointSize = max(1.5, size * 2400. / -mv.z);
      vC = color;
      vA = phase < 0. ? 1. : .72 + .28*sin(uTime*(.4+phase*1.7) + phase*40.);
    }`,
  fragmentShader: `varying vec3 vC; varying float vA;
    void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5, .0, d); gl_FragColor = vec4(vC*vA*a*1.6, a); }`,
});
function pointCloud(pts) {
  const g = new THREE.BufferGeometry();
  const pos = [], col = [], size = [], phase = [];
  const c = new THREE.Color();
  for (const p of pts) {
    pos.push(p.x, p.y, p.z);
    c.set(p.c); col.push(c.r, c.g, c.b);
    size.push(p.s); phase.push(p.p ?? Math.random());
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('size', new THREE.Float32BufferAttribute(size, 1));
  g.setAttribute('phase', new THREE.Float32BufferAttribute(phase, 1));
  const pts3 = new THREE.Points(g, lightsMat);
  pts3.frustumCulled = false;
  return pts3;
}
{
  const warm = [0xffc27a, 0xffd9a0, 0xffe7c4, 0xfff2dd], cool = [0xbfd4ff, 0x9fe8ff], all = [...warm, ...warm, ...cool];
  const pick = a => a[(Math.random() * a.length) | 0];
  const pts = [];
  // downtown towers: columns of windows
  for (let i = 0; i < 70; i++) {
    const x = -26 + Math.random() * 46, z = -32 - Math.random() * 22, h = 2 + Math.random() ** 2 * 11;
    const base = -9, cols = 1 + (Math.random() * 3 | 0);
    for (let y = base; y < base + h; y += 0.55) for (let k = 0; k < cols; k++)
      if (Math.random() < 0.55) pts.push({ x: x + k * 0.35, y, z, c: pick(all), s: 0.05 + Math.random() * 0.04 });
    if (h > 9) pts.push({ x, y: base + h + 0.4, z, c: 0xff3b30, s: 0.16, p: 0.9 }); // tower beacon
  }
  // low-rise sprawl
  for (let i = 0; i < 500; i++)
    pts.push({ x: -45 + Math.random() * 90, y: -9.5 + Math.random() * 1.5, z: -18 - Math.random() * 40, c: pick(warm), s: 0.05 + Math.random() * 0.05 });
  // north shore along the water and up the slopes
  for (let i = 0; i < 400; i++) {
    const x = -90 + Math.random() * 180;
    pts.push({ x, y: -3 + Math.random() ** 2 * 7, z: -96, c: pick(warm), s: 0.18 + Math.random() * 0.12 });
  }
  // ski run lights
  for (let i = 0; i < 26; i++) pts.push({ x: 2 + i * 0.6 + Math.sin(i) * 0.4, y: 2 + i * 0.32, z: -97, c: 0xd8e4ff, s: 0.16, p: -1 });
  outside.add(pointCloud(pts));
}
const train = pointCloud(Array.from({ length: 8 }, (_, i) => ({ x: i * 0.32, y: -6.4, z: -26, c: 0xdff3ff, s: 0.09, p: -1 })));
outside.add(train);
const plane = pointCloud([{ x: 0, y: 0, z: 0, c: 0xff4d4d, s: 0.7, p: 0.95 }, { x: 0.6, y: 0, z: 0, c: 0xffffff, s: 0.5, p: -1 }]);
plane.position.set(-80, 32, -110);
outside.add(plane);

// rain beyond the glass
const RAIN = 1400;
const rainPos = new Float32Array(RAIN * 6);
const rainSeed = new Float32Array(RAIN * 3);
for (let i = 0; i < RAIN; i++) {
  rainSeed[i * 3] = -3.5 + Math.random() * 7;
  rainSeed[i * 3 + 1] = Math.random() * 8;
  rainSeed[i * 3 + 2] = -0.7 - Math.random() * 7;
}
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x8d9cc2, transparent: true, opacity: 0.28, depthWrite: false }));
rain.frustumCulled = false;
scene.add(rain);
function updateRain(t) {
  for (let i = 0; i < RAIN; i++) {
    const x = rainSeed[i * 3], z = rainSeed[i * 3 + 2];
    const y = 5 - ((rainSeed[i * 3 + 1] + t * 7) % 8);
    const xx = x - (5 - y) * 0.08;
    rainPos.set([xx, y, z, xx + 0.02, y + 0.22, z], i * 6);
  }
  rainGeo.attributes.position.needsUpdate = true;
}

// droplets on the glass
const glass = canvasTex(512, 360);
const drops = Array.from({ length: 260 }, () => ({ x: Math.random() * 512, y: Math.random() * 360, r: 0.5 + Math.random() ** 3 * 2 }));
const runners = Array.from({ length: 10 }, () => ({ x: Math.random() * 512, y: Math.random() * 360, v: 0, r: 2 + Math.random() * 1.5 }));
function updateGlass(dt) {
  const g = glass.g;
  g.clearRect(0, 0, 512, 360);
  g.fillStyle = 'rgba(150,170,210,0.035)';
  g.fillRect(0, 0, 512, 360);
  for (const d of drops) {
    g.fillStyle = 'rgba(200,215,255,0.07)';
    g.beginPath(); g.arc(d.x, d.y, d.r, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,240,220,0.22)';
    g.fillRect(d.x - d.r * 0.3, d.y - d.r * 0.5, 1, 1);
  }
  for (const r of runners) {
    // drops stick, then let go and streak down
    r.v = r.v > 0 ? r.v + dt * 40 : Math.random() < dt * 0.4 ? 20 : 0;
    r.y += r.v * dt;
    if (r.y > 380) { r.y = -10; r.x = Math.random() * 512; r.v = 0; }
    if (r.v > 0) {
      g.strokeStyle = 'rgba(200,215,255,0.07)';
      g.lineWidth = r.r * 0.9;
      g.beginPath(); g.moveTo(r.x, r.y - 40); g.lineTo(r.x, r.y); g.stroke();
    }
    g.fillStyle = 'rgba(210,225,255,0.14)';
    g.beginPath(); g.arc(r.x, r.y, r.r, 0, 7); g.fill();
  }
  glass.tex.needsUpdate = true;
}
add(scene, new THREE.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0),
  new THREE.MeshBasicMaterial({ map: glass.tex, transparent: true, depthWrite: false }),
  0, (WIN.y0 + WIN.y1) / 2, WIN.z - 0.05, { cast: false, receive: false });

// ---------------------------------------------------------------- lights

scene.add(new THREE.HemisphereLight(0x7a7c94, 0x2a1e18, 1.5));
const moon = new THREE.DirectionalLight(0x8ea4e0, 0.9);
moon.position.set(-0.5, 3, -4);
scene.add(moon);

const lampTarget = new THREE.Object3D();
lampTarget.position.set(0.2, DESK, 0.15);
scene.add(lampTarget);
const lamp = new THREE.SpotLight(0xffbd7a, 0, 0, 0.95, 0.8, 1.4);
lamp.castShadow = true;
lamp.shadow.mapSize.set(1024, 1024);
lamp.shadow.bias = -0.0005;
lamp.shadow.camera.near = 0.05;
lamp.shadow.camera.far = 3;
lamp.target = lampTarget;
scene.add(lamp);

const screenLight = new THREE.PointLight(0x7dffc4, 0.25, 1.6, 1.2);
screenLight.position.set(0.15, 0.95, 0.7);
scene.add(screenLight);

// ---------------------------------------------------------------- objects

const items = []; // clickable things
function item(id, group, label, opts = {}) {
  const it = { id, group, label, base: group.position.clone(), rotY: group.rotation.y, rotZ: group.rotation.z, hover: 0, pulse: 0, ...opts };
  group.traverse(o => { if (o.isMesh) o.userData.item = it; });
  items.push(it);
  if (!group.parent) scene.add(group);
  return it;
}

// CRT monitor
const SW = 640, SH = 480;
const crt = canvasTex(SW, SH);
const monitor = new THREE.Group();
monitor.position.set(0.15, DESK, -0.02);
let screenMesh;
{
  const beige = mat(0xe2cfae, 0.55);
  add(monitor, new THREE.BoxGeometry(0.26, 0.02, 0.22), beige, 0, 0.01, 0);
  add(monitor, new THREE.BoxGeometry(0.46, 0.38, 0.3), beige, 0, 0.215, 0);
  add(monitor, new THREE.BoxGeometry(0.34, 0.29, 0.14), beige, 0, 0.215, -0.21);
  add(monitor, new THREE.BoxGeometry(0.4, 0.31, 0.01), mat(0x111214, 0.4), 0, 0.225, 0.152);
  // slightly bulging glass
  const sg = new THREE.PlaneGeometry(0.37, 0.28, 24, 18);
  const p = sg.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, 0.012 * (1 - (p.getX(i) / 0.185) ** 2 * 0.5 - (p.getY(i) / 0.14) ** 2 * 0.5));
  sg.computeVertexNormals();
  screenMesh = add(monitor, sg, new THREE.MeshBasicMaterial({ map: crt.tex, toneMapped: false }), 0, 0.225, 0.157, { cast: false });
  // power LED and badge
  add(monitor, new THREE.SphereGeometry(0.005, 8, 8), new THREE.MeshBasicMaterial({ color: 0x5dff8a }), 0.19, 0.045, 0.152);
  add(monitor, new THREE.BoxGeometry(0.06, 0.012, 0.004), mat(0x9a9180, 0.5), -0.16, 0.045, 0.151);
}
item('home', monitor, 'monitor · home', { zoomOnly: true });

// keyboard
{
  const kb = new THREE.Group();
  kb.position.set(0.15, DESK, 0.27);
  kb.rotation.y = -0.04;
  add(kb, new THREE.BoxGeometry(0.44, 0.022, 0.15), mat(0xd3c9b1, 0.6), 0, 0.011, 0);
  const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(0.022, 0.012, 0.022), mat(0xe8e1cf, 0.5), 15 * 5);
  const m4 = new THREE.Matrix4();
  let n = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) keys.setMatrixAt(n++, m4.makeTranslation(-0.196 + c * 0.028, 0.026, -0.056 + r * 0.028));
  keys.castShadow = true;
  kb.add(keys);
  scene.add(kb);
}

// desk lamp
const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd9a8, toneMapped: false });
const lampGroup = new THREE.Group();
{
  const metal = mat(0x23262c, 0.4, 0.6);
  const a = new V3(0.72, DESK + 0.02, -0.22), b = new V3(0.64, DESK + 0.36, -0.28), head = new V3(0.5, DESK + 0.4, -0.12);
  add(lampGroup, new THREE.CylinderGeometry(0.075, 0.085, 0.02, 32), metal, a.x, DESK + 0.01, a.z);
  rod(lampGroup, a, b, 0.008, metal);
  rod(lampGroup, b, head, 0.008, metal);
  add(lampGroup, new THREE.SphereGeometry(0.014, 12, 12), metal, b.x, b.y, b.z);
  const dir = new V3().subVectors(lampTarget.position, head).normalize();
  const shade = add(lampGroup, new THREE.ConeGeometry(0.06, 0.1, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x1f3d34, roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide }), head.x, head.y, head.z, { receive: false });
  shade.quaternion.setFromUnitVectors(new V3(0, -1, 0), dir);
  shade.position.addScaledVector(dir, 0.03);
  add(lampGroup, new THREE.SphereGeometry(0.022, 16, 16), bulbMat, head.x, head.y, head.z, { cast: false }).position.addScaledVector(dir, 0.05);
  lamp.position.copy(head).addScaledVector(dir, 0.04);
}
const lampItem = item('lamp', lampGroup, 'lamp', { toggle: true, noHop: true });
let lampOn = true;

// takeout bag → work
{
  const g = new THREE.Group();
  g.position.set(-0.7, DESK, -0.16);
  g.rotation.y = 0.35;
  const kraft = mat(0xb48a5a, 0.95);
  add(g, new THREE.BoxGeometry(0.17, 0.2, 0.11), kraft, 0, 0.1, 0);
  const fold = add(g, new THREE.BoxGeometry(0.17, 0.05, 0.05), kraft, 0, 0.215, 0);
  fold.rotation.x = 0.2;
  add(g, new THREE.PlaneGeometry(0.1, 0.06), mat(0xe8443a, 0.7), 0, 0.12, 0.0555, { cast: false });
  add(g, new THREE.PlaneGeometry(0.05, 0.065), mat(0xf4f1ea, 0.9), 0.05, 0.05, 0.056, { cast: false });
  item('work', g, 'takeout · work');
}

// grass block → agent
{
  const px = (fn) => canvasTex(16, 16, (g) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { g.fillStyle = fn(x, y); g.fillRect(x, y, 1, 1); } }, { pixel: true }).tex;
  const j = (a) => a[(Math.random() * a.length) | 0];
  const greens = ['#5f9f35', '#6fb43f', '#4f8a2c', '#7cc04a'], dirts = ['#79553a', '#8b6446', '#5f412b', '#96714f'];
  const top = px(() => j(greens)), dirt = px(() => j(dirts));
  const side = px((x, y) => (y < 3 || (y < 5 && Math.random() < 0.45)) ? j(greens) : j(dirts));
  const m = (t) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 });
  const g = new THREE.Group();
  g.position.set(-0.5, DESK, 0.24);
  g.rotation.y = 0.5;
  add(g, new THREE.BoxGeometry(0.1, 0.1, 0.1), [m(side), m(side), m(top), m(dirt), m(side), m(side)], 0, 0.05, 0);
  item('agent', g, 'grass block · agent', { spin: true });
}

// phone on a stand → ios
const phoneScreen = canvasTex(128, 256);
{
  const g = new THREE.Group();
  g.position.set(-0.27, DESK, 0.16);
  g.rotation.y = 0.25;
  add(g, new THREE.BoxGeometry(0.08, 0.012, 0.06), mat(0x2b2d33, 0.5), 0, 0.006, 0);
  const ph = new THREE.Group();
  ph.position.set(0, 0.012, -0.01);
  ph.rotation.x = -0.28;
  add(ph, new THREE.BoxGeometry(0.072, 0.15, 0.008), mat(0x111111, 0.3, 0.4), 0, 0.075, 0);
  add(ph, new THREE.PlaneGeometry(0.066, 0.142), new THREE.MeshBasicMaterial({ map: phoneScreen.tex, toneMapped: false }), 0, 0.075, 0.0041, { cast: false });
  g.add(ph);
  item('ios', g, 'phone · ios');
}

// mug → about
const steam = [];
{
  const g = new THREE.Group();
  g.position.set(-0.13, DESK, 0.33);
  const ceramic = mat(0xeeeae2, 0.35);
  add(g, new THREE.CylinderGeometry(0.04, 0.036, 0.09, 32), ceramic, 0, 0.045, 0);
  add(g, new THREE.CylinderGeometry(0.035, 0.035, 0.002, 32), mat(0x2a160c, 0.15), 0, 0.083, 0, { cast: false });
  add(g, new THREE.TorusGeometry(0.024, 0.007, 10, 20, Math.PI), ceramic, 0.04, 0.045, 0).rotation.z = -Math.PI / 2;
  add(g, new THREE.CylinderGeometry(0.0405, 0.0405, 0.018, 32, 1, true), mat(0x2f6bff, 0.4), 0, 0.06, 0);
  const sprite = canvasTex(64, 64, (c) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); }).tex;
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite, transparent: true, depthWrite: false, opacity: 0 }));
    s.userData.t = i / 7;
    g.add(s);
    steam.push(s);
  }
  item('about', g, 'coffee · about');
}

// books → education
{
  const g = new THREE.Group();
  g.position.set(0.6, DESK, 0.24);
  g.rotation.y = -0.3;
  const spine = (bg, fg, text) => canvasTex(256, 40, (c) => { c.fillStyle = bg; c.fillRect(0, 0, 256, 40); c.fillStyle = fg; c.font = '600 22px "JetBrains Mono", monospace'; c.textBaseline = 'middle'; c.fillText(text, 16, 21); }).tex;
  const book = (y, h, rot, bg, fg, text) => {
    const cover = mat(bg, 0.8), pages = mat(0xece4cf, 0.95);
    const b = add(g, new THREE.BoxGeometry(0.24, h, 0.17), [pages, cover, cover, cover, new THREE.MeshStandardMaterial({ map: spine(bg, fg, text), roughness: 0.8 }), pages], 0, y + h / 2, 0);
    b.rotation.y = rot;
  };
  book(0, 0.04, 0.05, '#7a2e2e', '#f0d9a8', 'LINEAR ALGEBRA');
  book(0.04, 0.032, -0.08, '#2c4a3a', '#e8e1cf', 'STATISTICS');
  book(0.072, 0.036, 0.12, '#182b49', '#ffcd00', 'UC SAN DIEGO');
  item('education', g, 'books · education');
}

// plant on the sill
const plant = new THREE.Group();
{
  plant.position.set(-0.46, WIN.y0, WIN.z + 0.04);
  add(plant, new THREE.CylinderGeometry(0.05, 0.038, 0.08, 20), mat(0xb5603b, 0.9), 0, 0.04, 0);
  const leaf = mat(0x3f7a3a, 0.7);
  for (let i = 0; i < 9; i++) {
    const l = add(plant, new THREE.SphereGeometry(0.02, 10, 8), leaf, 0, 0.1, 0);
    const a = i * 2.4, tilt = 0.4 + (i % 3) * 0.25;
    l.scale.set(0.5, 2.6, 1.1);
    l.position.set(Math.cos(a) * 0.03, 0.12 + (i % 3) * 0.02, Math.sin(a) * 0.03);
    l.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt);
  }
  item('plant', plant, 'plant', { wiggle: true, noHop: true });
}

// postcards on the wall switch rooms
postcards({ scene, item, onFrame() {} }, { x: 1.0, y: 1.5, z: -0.395, current: 'night' });

// ---------------------------------------------------------------- CRT screen

const CW = 10, CH = 20, COLS = SW / CW, ROWS = SH / CH;
const RAMP = ' .:-=+*#%@';
const FIELD_COLORS = ['#ff5a4e', '#ffb800', '#2f7bff', '#19c39b', '#ff6bd6', '#8b5cf6'];
const overlay = canvasTex(SW, SH, (g) => {
  for (let y = 0; y < SH; y += 3) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, y, SW, 1); }
  const v = g.createRadialGradient(SW / 2, SH / 2, SH * 0.35, SW / 2, SH / 2, SH * 0.85);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.75)');
  g.fillStyle = v; g.fillRect(0, 0, SW, SH);
}).canvas;

let section = 'boot', sectionAt = 0, ft = 0;
const ghost = { x: SW / 2, y: SH / 2 };
let screenUV = null;

function drawScreen(now) {
  const g = crt.g;
  g.fillStyle = '#03100b';
  g.fillRect(0, 0, SW, SH);

  const tx = screenUV ? screenUV.x * SW : SW * (0.55 + 0.35 * Math.sin(ft * 0.5));
  const ty = screenUV ? (1 - screenUV.y) * SH : SH * (0.5 + 0.3 * Math.sin(ft * 0.8 + 1));
  ghost.x += (tx - ghost.x) * 0.15;
  ghost.y += (ty - ghost.y) * 0.15;

  g.font = '22px VT323';
  g.textBaseline = 'top';
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const x = c * CW, y = r * CH;
    let v = Math.sin(x * 0.02 + ft) + Math.sin(y * 0.02 - ft * 0.8) + Math.sin((x + y) * 0.012 + ft * 0.5);
    const d = Math.hypot(x - ghost.x, y - ghost.y), k = Math.max(0, 1 - d / 150);
    if (k) v += Math.cos(d * 0.07 - ft * 4) * 2.2 * k;
    const ch = RAMP[Math.max(0, Math.min(9, ((v + 3) / 6 * 9) | 0))];
    if (ch === ' ') continue;
    g.fillStyle = k > 0.05 ? FIELD_COLORS[((d / 24 + ft * 3) | 0) % FIELD_COLORS.length] : '#17402f';
    g.globalAlpha = k > 0.05 ? 0.4 + k * 0.6 : 1;
    g.fillText(ch, x, y);
  }
  g.globalAlpha = 1;

  // text panel, typed out
  const lines = section === 'boot' ? BOOT : SECTIONS[section].lines;
  let budget = reduce ? 1e9 : (now - sectionAt) * 0.09;
  const LH = 34, x0 = 52;
  let h = 36;
  for (const l of lines) h += l.title ? 76 : LH;
  const y0 = Math.max(28, (SH - h) / 2);
  g.fillStyle = 'rgba(2,9,6,0.86)';
  g.fillRect(x0 - 24, y0 - 18, SW - 2 * (x0 - 24), h);
  g.strokeStyle = 'rgba(125,255,196,0.35)';
  g.lineWidth = 2;
  g.strokeRect(x0 - 24, y0 - 18, SW - 2 * (x0 - 24), h);

  g.shadowColor = '#4dffaa';
  g.shadowBlur = 10;
  g.fillStyle = '#d8ffe9';
  let y = y0, cx = x0, cy = y0;
  for (const l of lines) {
    const text = l.title || l;
    const shown = text.slice(0, Math.max(0, budget | 0));
    budget -= text.length + 3;
    g.font = l.title ? '72px VT323' : '30px VT323';
    g.fillText(shown, x0, y);
    if (shown.length || budget > -text.length - 3) { cx = x0 + g.measureText(shown).width; cy = y; }
    y += l.title ? 76 : LH;
    if (budget <= 0) break;
  }
  if ((now / 500 | 0) % 2) g.fillRect(cx + 4, cy + 4, 14, 24);
  g.shadowBlur = 0;

  g.drawImage(overlay, 0, 0);
  crt.tex.needsUpdate = true;
}

function drawPhone(t) {
  const g = phoneScreen.g;
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#2b3550'); gr.addColorStop(1, '#40322c');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 256);
  // a floor grid and a spinning AR cube
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1;
  for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(64 + i * 8, 150); g.lineTo(64 + i * 30, 256); g.stroke(); }
  for (let i = 0; i < 5; i++) { const yy = 150 + i * i * 6; g.beginPath(); g.moveTo(0, yy); g.lineTo(128, yy); g.stroke(); }
  const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const a = t * 0.9, ca = Math.cos(a), sa = Math.sin(a);
  const P = V.map(([x, y, z]) => { const X = x * ca - z * sa, Z = x * sa + z * ca, Y = y * 0.94 - Z * 0.34, ZZ = y * 0.34 + Z * 0.94 + 5; return [64 + X / ZZ * 120, 120 + Y / ZZ * 120]; });
  g.strokeStyle = '#8fb4ff'; g.lineWidth = 2;
  g.beginPath();
  for (const [i, j] of E) { g.moveTo(...P[i]); g.lineTo(...P[j]); }
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.8)';
  g.fillRect(52, 236, 24, 3);
  phoneScreen.tex.needsUpdate = true;
}

// ---------------------------------------------------------------- post

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.5, 0.72);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const grain = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime*7.) * 43758.5453); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float v = smoothstep(1.05, .35, length(vUv-.5));
      c *= mix(.55, 1., v);
      c += (h(vUv*1000.) - .5) * .035;
      gl_FragColor = vec4(c, 1.);
    }`,
});
composer.addPass(grain);

// ---------------------------------------------------------------- camera

const view = { pos: new V3(), look: new V3() };
const want = { pos: new V3(), look: new V3() };
let zoomed = false;
const pointer = { x: 0, y: 0, ndc: new THREE.Vector2(9, 9), active: false };

function framing() {
  const aspect = innerWidth / innerHeight;
  camera.fov = aspect < 1 ? 52 : 40;
  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  if (zoomed) {
    // fit the screen (0.42 x 0.34 with margin) in view
    const d = Math.max(0.21 / tan, 0.26 / (tan * aspect));
    want.look.set(0.15, DESK + 0.225, 0.13);
    want.pos.set(0.15, DESK + 0.235, 0.13 + d);
  } else {
    // keep the whole desk (≈1.7m wide) in frame on narrow screens
    // portrait crops to the middle of the desk and sits above the HUD
    const portrait = aspect < 1;
    const d = Math.max(1.85, (portrait ? 0.72 : 1.45) / (tan * aspect));
    want.look.set(portrait ? -0.05 : 0, portrait ? 0.8 : 0.98, -0.15);
    want.pos.set(0, 0.98 + d * 0.2, -0.15 + d);
  }
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloom.resolution.set(w, h);
  camera.aspect = w / h;
  framing();
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

// ---------------------------------------------------------------- interaction

const hud = { nav: document.getElementById('sections'), links: document.getElementById('links'), tip: document.getElementById('tip'), sr: document.getElementById('sr') };
const NAV = [['home', 'home'], ['about', 'about'], ['work', 'work'], ['agent', 'agent'], ['ios', 'ios'], ['education', 'education']];
for (const [id, label] of NAV) {
  const b = document.createElement('button');
  b.textContent = label;
  b.dataset.id = id;
  b.addEventListener('click', () => activate(items.find(i => i.id === id)));
  hud.nav.appendChild(b);
}

function setSection(id) {
  section = id;
  sectionAt = performance.now();
  const s = SECTIONS[id];
  screenLight.color.set(s.tint).lerp(new THREE.Color(0xfff4e0), 0.55);
  for (const b of hud.nav.querySelectorAll('button[data-id]')) b.setAttribute('aria-pressed', b.dataset.id === id);
  hud.links.replaceChildren(...s.links.map(([t, href]) => Object.assign(document.createElement('a'), { textContent: t, href })));
  hud.sr.textContent = s.lines.map(l => l.title || l).filter(Boolean).join('. ');
}

function activate(it) {
  if (!it) return;
  it.pulse = 1;
  if (it.href) { if (!it.current) location.href = it.href; return; }
  if (it.toggle) { lampOn = !lampOn; return; }
  if (it.wiggle) return;
  if (section !== 'boot' && SECTIONS[it.id]) setSection(it.id);
  zoomed = true;
  framing();
}

const raycaster = new THREE.Raycaster();
let hovered = null;
function pick() {
  raycaster.setFromCamera(pointer.ndc, camera);
  const hit = raycaster.intersectObjects(items.map(i => i.group), true)[0];
  screenUV = hit && hit.object === screenMesh ? hit.uv.clone() : null;
  return hit ? hit.object.userData.item : null;
}

addEventListener('pointermove', (e) => {
  pointer.x = e.clientX / innerWidth * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  pointer.ndc.set(pointer.x, pointer.y);
  pointer.active = e.pointerType === 'mouse';
  hud.tip.style.left = e.clientX + 'px';
  hud.tip.style.top = e.clientY + 'px';
});
document.documentElement.addEventListener('mouseleave', () => { pointer.active = false; pointer.ndc.set(9, 9); });
canvas.addEventListener('click', (e) => {
  pointer.ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  const it = pick();
  if (it) activate(it);
  else if (zoomed) { zoomed = false; framing(); }
});
addEventListener('keydown', (e) => { if (e.key === 'Escape' && zoomed) { zoomed = false; framing(); } });

// ---------------------------------------------------------------- loop

let last = performance.now(), t = 0, lampLevel = 0, intro = reduce ? 1 : 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (document.hidden) return;
  t += dt;
  uTime.value = t;
  if (!reduce) ft += dt * 0.9;

  if (section === 'boot' && now - sectionAt > 2600) setSection('home');

  // hover
  const h = pointer.active ? pick() : (screenUV = null);
  if (h !== hovered) {
    hovered = h;
    canvas.style.cursor = h ? 'pointer' : 'default';
    const show = h && !(zoomed && h.zoomOnly);
    hud.tip.textContent = show ? h.label : '';
    hud.tip.style.opacity = show ? 1 : 0;
  }

  // objects
  for (const it of items) {
    it.hover += ((it === hovered ? 1 : 0) - it.hover) * Math.min(1, dt * 10);
    it.pulse = Math.max(0, it.pulse - dt * 1.4);
    const p = it.pulse, hop = it.noHop || it.zoomOnly ? 0 : Math.sin(p * Math.PI) * 0.035;
    it.group.position.y = it.base.y + hop + (it.zoomOnly || it.noHop ? 0 : it.hover * 0.006);
    if (it.spin) it.group.rotation.y = it.rotY + (p > 0 ? (1 - p * p) * Math.PI * 2 : 0) +Math.sin(t * 0.6) * 0.15;
    if (it.wiggle) it.group.rotation.z = it.rotZ + Math.sin(p * 18) * p * 0.12 + (it.href ? 0 : Math.sin(t * 0.9) * 0.01);
  }

  // lamp eases on/off with a little flicker
  lampLevel += ((lampOn ? 1 : 0) - lampLevel) * Math.min(1, dt * (lampOn ? 6 : 12));
  const flick = lampOn && lampLevel < 0.95 && Math.random() < 0.3 ? 0.4 : 1;
  lamp.intensity = 5 * lampLevel * flick * intro;
  bulbMat.color.setRGB(1.4 * lampLevel * flick + 0.05, 1.05 * lampLevel * flick + 0.04, 0.7 * lampLevel * flick + 0.03);
  screenLight.intensity = (0.22 + Math.sin(t * 60) * 0.03) * intro;

  // steam
  for (const s of steam) {
    s.userData.t = (s.userData.t + dt * 0.25) % 1;
    const k = s.userData.t;
    s.position.set(Math.sin(k * 6 + s.id) * 0.012, 0.09 + k * 0.14, 0);
    s.scale.setScalar(0.03 + k * 0.06);
    s.material.opacity = Math.sin(k * Math.PI) * 0.22;
  }

  // world outside
  train.position.x = ((t * 4) % 70) - 35;
  plane.position.x = ((t * 3) % 200) - 100;
  if (!reduce) updateRain(t);
  updateGlass(reduce ? 0 : dt);
  drawScreen(now);
  if ((now / 33 | 0) % 2) drawPhone(t);

  // camera: ease toward the framing, plus a little parallax from the pointer
  intro = Math.min(1, intro + dt * 0.5);
  const e = reduce ? 1 : 1 - Math.exp(-dt * 3.2);
  const par = reduce ? 0 : zoomed ? 0.01 : 0.07;
  const target = want.pos.clone().add(new V3(pointer.x * par, pointer.y * par * 0.5, (1 - intro) ** 2 * 0.8));
  view.pos.lerp(target, e);
  view.look.lerp(want.look, e);
  camera.position.copy(view.pos);
  camera.lookAt(view.look);

  composer.render(dt);
}

// ---------------------------------------------------------------- start

resize();
view.pos.copy(want.pos).add(new V3(0, 0.1, 1.2));
view.look.copy(want.look);
updateRain(0);
document.fonts.load('30px VT323').finally(() => {
  sectionAt = performance.now();
  veil.classList.add('gone');
  requestAnimationFrame(frame);
});
