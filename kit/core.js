// Shared engine for the desk variants: renderer, post, camera, picking,
// the monitor's screen and the HUD. Each variant builds its own room and
// view on top of this; ../room.js (the night desk) is standalone.
import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export { THREE };
export const V3 = THREE.Vector3;
export const DESK = 0.76; // desk surface height
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- helpers

export const mat = (color, roughness = 0.8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

export function add(parent, geo, material, x = 0, y = 0, z = 0, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  parent.add(m);
  return m;
}

export function rod(parent, a, b, r, material, r2 = r) {
  const d = new V3().subVectors(b, a);
  const m = add(parent, new THREE.CylinderGeometry(r2, r, d.length(), 12), material);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.normalize());
  return m;
}

export function canvasTex(w, h, draw, { pixel = false, repeat = null } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw && draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (pixel) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; }
  else t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return { canvas: c, g, tex: t };
}

export const rand = (a, b) => a + Math.random() * (b - a);

// ---------------------------------------------------------------- content

const LINKS = {
  github: ['github', 'https://github.com/yabutaka'],
  linkedin: ['linkedin', 'https://www.linkedin.com/in/takashi-yabuta'],
};

const BASE_SECTIONS = {
  home: {
    label: 'home', tint: 0x7dffc4,
    lines: [{ title: 'takashi yabuta' }, 'software engineer · vancouver, bc', '', '> click things on the desk'],
    links: [LINKS.github, LINKS.linkedin],
  },
  about: {
    label: 'about', tint: 0xffd59a,
    lines: ['hi!', '', "I'm a software engineer at DoorDash,", 'building backend systems that move', 'a lot of data.', '', 'outside work: LLM agents + iOS AR apps.', 'I speak English and 日本語.'],
    links: [LINKS.github, LINKS.linkedin],
  },
  work: {
    label: 'work', tint: 0xff6a5a,
    lines: ['~/work', '', '2022 - now   DoorDash', '             software engineer', '', '2020, 2021   Oracle', '             software engineer intern'],
    links: [LINKS.linkedin],
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
  kendo: {
    label: 'kendo', tint: 0xc9d6ff,
    lines: ['~/kendo', '', '剣道', 'I practice kendo, the Japanese', 'martial art of the sword.', '', 'shinai · the bamboo sword', 'men    · the head armor'],
    links: [],
  },
  outside: {
    label: 'outside', tint: 0xa8e6ff,
    lines: ['~/outside', '', 'hiking mountain trails', '  whenever the sun is out', '', 'skiing', '  whenever it snows'],
    links: [],
  },
};

const BOOT = ['TY-BIOS v2.26  (c) yabutaka', '', 'memory test ....... 640K ok', 'mounting ~/desk .... ok', '', 'starting field.js'];

// What the monitor looks like. "paper" is the plain homepage, verbatim.
const SCREEN_STYLES = {
  phosphor: { bg: '#03100b', idle: '#17402f', text: '#d8ffe9', glow: '#4dffaa', panel: 'rgba(2,9,6,0.86)', border: 'rgba(125,255,196,0.35)', body: '30px VT323', lh: 34, field: ['#ff5a4e', '#ffb800', '#2f7bff', '#19c39b', '#ff6bd6', '#8b5cf6'] },
  amber: { bg: '#120902', idle: '#3e2507', text: '#ffd89a', glow: '#ff9a1f', panel: 'rgba(16,9,2,0.88)', border: 'rgba(255,180,90,0.35)', body: '30px VT323', lh: 34, field: ['#ffb000', '#ff7a00', '#ffd36b', '#ff5a1f', '#ffe9b0'] },
  paper: { bg: '#fcfcf9', idle: '#d3d5dd', text: '#14141a', glow: null, panel: 'rgba(252,252,249,0.94)', border: 'rgba(20,20,26,0.10)', body: '20px "JetBrains Mono"', lh: 30, field: ['#ff5a4e', '#ffb800', '#2f7bff', '#19c39b', '#ff6bd6', '#8b5cf6'] },
};

// ---------------------------------------------------------------- engine

export function createDesk(cfg = {}) {
  const {
    background = 0x07080d, exposure = 1.1, bloom: [bStrength, bRadius, bThreshold] = [0.4, 0.5, 0.8],
    grain = 0.03, vignette = 0.55, screenStyle = 'phosphor', scanlines = true, sections = {},
    view = {},
  } = cfg;
  const veil = document.getElementById('veil');
  if (!WebGL.isWebGL2Available()) {
    veil.innerHTML = 'no webgl here. <a href="/plain/">see the plain version</a>';
    throw new Error('WebGL2 unavailable');
  }
  const VIEW = { look: [0, 0.98, -0.15], width: 1.45, portraitWidth: 0.72, rise: 0.2, ...view };
  const SECTIONS = { ...BASE_SECTIONS };
  for (const [k, v] of Object.entries(sections)) SECTIONS[k] = { ...SECTIONS[k], ...v };
  const S = SCREEN_STYLES[screenStyle];

  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 1200);
  const uTime = { value: 0 };
  const frameFns = [];
  const items = [];

  // the screen every variant has; monitor builders call setScreen
  const [SW, SH] = cfg.screenSize || [640, 480];
  const screen = canvasTex(SW, SH);
  const focus = { center: new V3(0.15, DESK + 0.225, 0.16), w: 0.42, h: 0.34 };
  let screenMesh = null;

  // a light in front of the monitor that takes on the section's color
  const screenLight = new THREE.PointLight(0xffffff, cfg.screenLight ?? 0.25, 1.6, 1.2);
  scene.add(screenLight);

  const ctx = {
    THREE, scene, camera, renderer, uTime, items, screenTex: screen.tex, screenLight,
    onFrame(fn) { frameFns.push(fn); },
    item(id, group, label, opts = {}) {
      const it = { id, group, label, base: group.position.clone(), rotY: group.rotation.y, rotZ: group.rotation.z, hover: 0, pulse: 0, ...opts };
      group.traverse(o => { if (o.isMesh) o.userData.item = it; });
      items.push(it);
      if (!group.parent) scene.add(group);
      return it;
    },
    setScreen(mesh, center, w, h) {
      screenMesh = mesh;
      focus.center.copy(center); focus.w = w; focus.h = h;
      screenLight.position.set(center.x, center.y - 0.03, center.z + 0.55);
    },
  };

  // ---------------------------------------------------------- screen drawing
  const CW = 10, CH = 20, COLS = SW / CW, ROWS = SH / CH;
  const RAMP = ' .:-=+*#%@';
  const overlay = canvasTex(SW, SH, (g) => {
    if (scanlines) for (let y = 0; y < SH; y += 3) { g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, y, SW, 1); }
    if (scanlines) {
      const v = g.createRadialGradient(SW / 2, SH / 2, SH * 0.35, SW / 2, SH / 2, SH * 0.85);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)');
      g.fillStyle = v; g.fillRect(0, 0, SW, SH);
    }
  }).canvas;

  let section = 'boot', sectionAt = 0, ft = 0, screenUV = null;
  const ghost = { x: SW / 2, y: SH / 2 };

  function drawScreen(now) {
    const g = screen.g;
    g.fillStyle = S.bg;
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
      g.fillStyle = k > 0.05 ? S.field[((d / 24 + ft * 3) | 0) % S.field.length] : S.idle;
      g.globalAlpha = k > 0.05 ? 0.4 + k * 0.6 : 1;
      g.fillText(ch, x, y);
    }
    g.globalAlpha = 1;

    const lines = section === 'boot' ? BOOT : SECTIONS[section].lines;
    let budget = reduce ? 1e9 : (now - sectionAt) * 0.09;
    const LH = S.lh, x0 = 52;
    let h = 36;
    for (const l of lines) h += l.title ? 76 : LH;
    const y0 = Math.max(28, (SH - h) / 2);
    g.fillStyle = S.panel;
    g.fillRect(x0 - 24, y0 - 18, SW - 2 * (x0 - 24), h);
    g.strokeStyle = S.border;
    g.lineWidth = 2;
    g.strokeRect(x0 - 24, y0 - 18, SW - 2 * (x0 - 24), h);

    if (S.glow) { g.shadowColor = S.glow; g.shadowBlur = 10; }
    g.fillStyle = S.text;
    let y = y0, cx = x0, cy = y0;
    for (const l of lines) {
      const text = l.title || l;
      const shown = text.slice(0, Math.max(0, budget | 0));
      budget -= text.length + 3;
      g.font = l.title ? '72px VT323' : S.body;
      g.fillText(shown, x0, l.title ? y : y + (LH - 30) / 2 + 2);
      cx = x0 + g.measureText(shown).width; cy = y;
      y += l.title ? 76 : LH;
      if (budget <= 0) break;
    }
    if ((now / 500 | 0) % 2) g.fillRect(cx + 4, cy + 4, 12, 24);
    g.shadowBlur = 0;
    g.drawImage(overlay, 0, 0);
    screen.tex.needsUpdate = true;
  }

  // ---------------------------------------------------------- post
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), bStrength, bRadius, bThreshold);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime, uGrain: { value: grain }, uVig: { value: vignette } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uGrain, uVig; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime*7.) * 43758.5453); }
      void main(){
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        c *= mix(uVig, 1., smoothstep(1.05, .35, length(vUv-.5)));
        c += (h(vUv*1000.) - .5) * uGrain;
        gl_FragColor = vec4(c, 1.);
      }`,
  }));

  // ---------------------------------------------------------- camera
  const viewNow = { pos: new V3(), look: new V3() };
  const want = { pos: new V3(), look: new V3() };
  let zoomed = false;
  const pointer = { x: 0, y: 0, ndc: new THREE.Vector2(9, 9), active: false };

  function framing() {
    const aspect = innerWidth / innerHeight;
    camera.fov = aspect < 1 ? 52 : 40;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    if (zoomed) {
      const d = Math.max((focus.h / 2 + 0.04) / tan, (focus.w / 2 + 0.05) / (tan * aspect));
      want.look.copy(focus.center);
      want.pos.copy(focus.center).add(new V3(0, 0.01, d));
    } else {
      const portrait = aspect < 1;
      const d = Math.max(1.85, (portrait ? VIEW.portraitWidth : VIEW.width) / (tan * aspect));
      const [lx, ly, lz] = VIEW.look;
      want.look.set(portrait ? lx - 0.05 : lx, portrait ? ly - 0.18 : ly, lz);
      want.pos.set(lx, ly + d * VIEW.rise, lz + d);
    }
  }

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloomPass.resolution.set(w, h);
    camera.aspect = w / h;
    framing();
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);

  // ---------------------------------------------------------- HUD + picking
  const hud = { nav: document.getElementById('sections'), links: document.getElementById('links'), tip: document.getElementById('tip'), sr: document.getElementById('sr') };

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
    if (it.toggle) { it.toggle(); return; }
    // props with their own animation play it in place; the screen still updates quietly
    if (it.play) { it.play(); if (SECTIONS[it.id] && section !== 'boot') setSection(it.id); return; }
    if (!SECTIONS[it.id]) return;
    if (section !== 'boot') setSection(it.id);
    zoomed = true;
    framing();
  }
  function back() { if (zoomed) { zoomed = false; framing(); } }

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
    if (it) activate(it); else back();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') back(); });

  function buildNav() {
    // only the homepage sections get tabs; lamps, gear and postcards are just for clicking
    const NAV = ['about', 'work', 'agent', 'ios', 'education'];
    const seen = new Set();
    for (const it of items) {
      if (!NAV.includes(it.id) || seen.has(it.id)) continue;
      seen.add(it.id);
      const b = document.createElement('button');
      b.textContent = SECTIONS[it.id].label;
      b.dataset.id = it.id;
      b.addEventListener('click', () => activate(it));
      hud.nav.appendChild(b);
    }
    const home = document.createElement('button');
    home.textContent = 'home'; home.dataset.id = 'home';
    home.addEventListener('click', () => { setSection('home'); zoomed = true; framing(); });
    hud.nav.prepend(home);
  }

  // ---------------------------------------------------------- loop
  let last = performance.now(), t = 0, intro = reduce ? 1 : 0, shake = 0;
  ctx.state = { get intro() { return intro; } };
  ctx.shake = (a) => { if (!reduce) shake = Math.max(shake, a); };

  // comic speech bubble that pops in, floats up and fades
  ctx.bubble = (text, pos, { size = 0.12, color = '#14141a', bg = '#ffffff', life = 1.4 } = {}) => {
    const c = canvasTex(256, 128, (g) => {
      g.fillStyle = bg; g.strokeStyle = color; g.lineWidth = 6;
      g.beginPath();
      for (let i = 0; i <= 24; i++) {
        const a = i / 24 * Math.PI * 2, r = i % 2 ? 1 : 0.86;
        const x = 128 + Math.cos(a) * 118 * r, y = 60 + Math.sin(a) * 52 * r;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = color; g.font = '64px VT323'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(text, 128, 62);
    });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: c.tex, transparent: true, depthTest: false, toneMapped: false }));
    sp.renderOrder = 10;
    sp.position.copy(pos);
    scene.add(sp);
    const t0 = t;
    const fn = () => {
      const k = (t - t0) / life;
      if (k >= 1) { scene.remove(sp); sp.material.map.dispose(); sp.material.dispose(); frameFns.splice(frameFns.indexOf(fn), 1); return; }
      const pop = k < 0.15 ? Math.sin(k / 0.15 * Math.PI * 0.75) / Math.sin(Math.PI * 0.75) : 1;
      sp.scale.set(size * 2 * pop, size * pop, 1);
      sp.position.y = pos.y + k * size * 0.8;
      sp.material.opacity = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
    };
    frameFns.push(fn);
  };

  // a puff of particles with gravity, e.g. snow spray
  const dot = canvasTex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }).tex;
  ctx.burst = (pos, { count = 60, speed = 3, size = 0.25, color = 0xffffff, life = 1.2, up = 1, gravity = 6 } = {}) => {
    const p = new Float32Array(count * 3), v = [];
    for (let i = 0; i < count; i++) {
      p.set([pos.x, pos.y, pos.z], i * 3);
      v.push(new V3(rand(-1, 1), rand(0.2, 1) * up, rand(-1, 1)).normalize().multiplyScalar(speed * rand(0.4, 1)));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const m = new THREE.PointsMaterial({ size, map: dot, color, transparent: true, depthWrite: false });
    const pts = new THREE.Points(geo, m);
    pts.frustumCulled = false;
    scene.add(pts);
    const t0 = t;
    const fn = (_, dt) => {
      const k = (t - t0) / life;
      if (k >= 1) { scene.remove(pts); geo.dispose(); m.dispose(); frameFns.splice(frameFns.indexOf(fn), 1); return; }
      for (let i = 0; i < count; i++) {
        v[i].y -= gravity * dt;
        p[i * 3] += v[i].x * dt; p[i * 3 + 1] += v[i].y * dt; p[i * 3 + 2] += v[i].z * dt;
      }
      geo.attributes.position.needsUpdate = true;
      m.opacity = 1 - k;
    };
    frameFns.push(fn);
  };
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (document.hidden) return;
    t += dt;
    uTime.value = t;
    if (!reduce) ft += dt * 0.9;
    if (section === 'boot' && now - sectionAt > 2400) setSection('home');

    const h = pointer.active ? pick() : (screenUV = null);
    if (h !== hovered) {
      hovered = h;
      canvas.style.cursor = h ? 'pointer' : 'default';
      const show = h && !(zoomed && h.zoomOnly);
      hud.tip.textContent = show ? h.label : '';
      hud.tip.style.opacity = show ? 1 : 0;
    }

    for (const it of items) {
      it.hover += ((it === hovered ? 1 : 0) - it.hover) * Math.min(1, dt * 10);
      it.pulse = Math.max(0, it.pulse - dt * 1.4);
      const p = it.pulse, still = it.noHop || it.zoomOnly;
      it.group.position.y = it.base.y + (still ? 0 : Math.sin(p * Math.PI) * 0.035 + it.hover * 0.006);
      if (it.spin) it.group.rotation.y = it.rotY + (p > 0 ? (1 - p * p) * Math.PI * 2 : 0) + Math.sin(t * 0.6) * 0.15;
      if (it.wiggle) it.group.rotation.z = it.rotZ + Math.sin(p * 18) * p * 0.06;
    }
    screenLight.intensity = (cfg.screenLight ?? 0.25) * intro;
    for (const fn of [...frameFns]) fn(t, dt, now);
    drawScreen(now);

    intro = Math.min(1, intro + dt * 0.5);
    const e = reduce ? 1 : 1 - Math.exp(-dt * 3.2);
    const par = reduce ? 0 : zoomed ? 0.01 : 0.07;
    const target = want.pos.clone().add(new V3(pointer.x * par, pointer.y * par * 0.5, (1 - intro) ** 2 * 0.8));
    viewNow.pos.lerp(target, e);
    viewNow.look.lerp(want.look, e);
    camera.position.copy(viewNow.pos);
    camera.lookAt(viewNow.look);
    if (shake > 0.0005) {
      camera.position.add(new V3(rand(-1, 1), rand(-1, 1), 0).multiplyScalar(shake));
      shake *= Math.exp(-dt * 12);
    }
    composer.render(dt);
  }

  ctx.start = () => {
    buildNav();
    resize();
    viewNow.pos.copy(want.pos).add(new V3(0, 0.1, 1.2));
    viewNow.look.copy(want.look);
    Promise.all([document.fonts.load('30px VT323'), document.fonts.load('20px "JetBrains Mono"')]).finally(() => {
      sectionAt = performance.now();
      veil.classList.add('gone');
      requestAnimationFrame(frame);
    });
  };
  return ctx;
}
