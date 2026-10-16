// Harbour studio: a bright, modern room on a sunny day, looking across the
// water at the North Shore mountains. The monitor shows the plain homepage
// style, and a shinai hangs on the wall.
import { createDesk, THREE, V3, DESK, add, mat } from '../kit/core.js';
import { studioRoom } from '../kit/rooms.js';
import { sky, mountains, water, trees, clouds, sailboats, seaplane, glass } from '../kit/outside.js';
import { slimMonitor, keyboard, mug, takeoutBag, grassBlock, phone, books, fig, shinai, postcards } from '../kit/objects.js';

const ctx = createDesk({
  background: 0xbcd6ee, exposure: 1.0, bloom: [0.12, 0.4, 1.0], grain: 0.018, vignette: 0.85,
  screenStyle: 'paper', scanlines: false, screenSize: [768, 480], screenLight: 0.08,
  view: { look: [0, 1.05, -0.15], width: 1.5, portraitWidth: 0.75, rise: 0.17 },
});
const { scene } = ctx;

const WIN = { x0: -1.25, x1: 0.85, y0: 0.12, y1: 2.6, z: -0.45 };
studioRoom(ctx, WIN);
glass(ctx, WIN, { sheen: 0.06 });

// ---------------------------------------------------------------- light
scene.add(new THREE.HemisphereLight(0xd7e8ff, 0xe8d6bd, 1.5));
const sun = new THREE.DirectionalLight(0xfff1dc, 3.2);
sun.position.set(-2.2, 4.5, -5);
sun.target.position.set(0, DESK, 0.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -2.5, right: 2.5, top: 2.5, bottom: -2.5, near: 0.5, far: 14 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight(0xfff6ea, 0.6);
fill.position.set(0.5, 2, 4);
scene.add(fill);

// ---------------------------------------------------------------- view
const SEA = -25;
sky(ctx, { top: 0x2f6fc4, mid: 0x86b6e6, horizon: 0xd8e7f2, sun: [-520, 620] });
clouds(ctx, { count: 10, y: [140, 260], z: [-700, -850], opacity: 0.75 });
mountains(ctx, { z: -800, base: SEA, amp: 330, seed: 4.2, freq: 0.6, rock: 0x7d8aa0, forest: 0x52637a, snowLine: 170, treeLine: 60, haze: 0xc6d9ea, hazeAmt: 0.62, mist: 0.2 });
mountains(ctx, { z: -480, base: SEA, amp: 190, seed: 2.1, freq: 0.9, rock: 0x6b7480, forest: 0x34503f, snowLine: 135, treeLine: 95, haze: 0xbcd2e6, hazeAmt: 0.35 });
mountains(ctx, { z: -280, base: SEA, amp: 105, seed: 0.7, freq: 1.4, rock: 0x4f5c56, forest: 0x2b4a35, treeLine: 200, haze: 0xb9d0e2, hazeAmt: 0.18 });
water(ctx, { y: SEA, near: 25, far: 900, deep: 0x1d4f6e, color: 0x7fa9c4, glint: 1.2, sunX: -200 });
// a wooded point on the left, like the edge of the park
add(scene, new THREE.BoxGeometry(220, 2, 130), mat(0x2d4a2f, 1), -150, SEA, -125, { cast: false, receive: false });
trees(ctx, { count: 260, x: [-255, -42], z: [-62, -188], y: () => SEA + 1, size: [14, 30], color: 0x23402a });
sailboats(ctx, { y: SEA, list: [[-20, -170, 1.4, 0.7], [70, -230, 1.6, 0.4], [150, -320, 2, 0.5], [-60, -380, 2.2, 0.3]] });
seaplane(ctx, { y: -2, z: -210, period: 55 });

// ---------------------------------------------------------------- desk
slimMonitor(ctx, { x: 0.1, z: -0.12 });
keyboard(ctx, { x: 0.1, z: 0.25, base: 0xd5d7db, keys: 0xf6f6f6, flat: true });
mug(ctx, { x: -0.16, z: 0.32, color: 0xf7f5f0, band: 0x19c39b });
takeoutBag(ctx, { x: -0.72, z: -0.16 });
grassBlock(ctx, { x: -0.5, z: 0.22 });
phone(ctx, { x: -0.31, z: 0.12 });
books(ctx, { x: 0.62, z: 0.2 });
fig(ctx, { x: -1.45, z: 0.1 });

// shinai on a pair of black wall pegs, right of the window
{
  const wallZ = WIN.z;
  const peg = mat(0x1a1b1d, 0.4, 0.4);
  for (const y of [0.55, 1.15]) add(scene, new THREE.BoxGeometry(0.05, 0.03, 0.07), peg, 1.2, y, wallZ + 0.035);
  shinai(ctx, { base: new V3(1.2, 0.22, wallZ + 0.06), dir: new V3(0.02, 1, 0) });
}

postcards(ctx, { x: 0.98, y: 1.7, z: WIN.z + 0.005, current: 'harbour', gap: [0.19, 0.2] });

ctx.start();
