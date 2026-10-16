// Summer cabin: a sunny log cabin above an alpine lake. A trail map on the
// wall, kendo men on the shelf, and the beige CRT showing the homepage.
import { createDesk, THREE, V3, DESK } from '../kit/core.js';
import { cabinRoom } from '../kit/rooms.js';
import { sky, mountains, water, trees, clouds, glass } from '../kit/outside.js';
import { crtMonitor, keyboard, mug, takeoutBag, grassBlock, phone, books, succulent, men, topoMap, bottle, postcards } from '../kit/objects.js';
import { canoe, fish } from '../kit/fun.js';

const ctx = createDesk({
  background: 0xbcd6ee, exposure: 1.05, bloom: [0.15, 0.4, 1.0], grain: 0.02, vignette: 0.75,
  screenStyle: 'paper', scanlines: true, screenLight: 0.1,
  view: { look: [0, 1.12, -0.15], rise: 0.15, width: 1.6 },
});
const { scene } = ctx;

const WIN = { x0: -0.85, x1: 0.85, y0: 0.98, y1: 2.4, z: -0.45 };
cabinRoom(ctx, WIN, { logColor: 0xc8925a, deskColor: 0x4a2a17, legColor: 0x2e1a0e, shelf: [1.08, 1.42, 0.62] });
glass(ctx, WIN, { sheen: 0.05 });

// ---------------------------------------------------------------- light
scene.add(new THREE.HemisphereLight(0xdcebff, 0x8a6a4a, 1.3));
const sun = new THREE.DirectionalLight(0xfff0d6, 3.4);
sun.position.set(3.2, 5, -5);
sun.target.position.set(0, DESK, 0.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -2.5, right: 2.5, top: 2.5, bottom: -2.5, near: 0.5, far: 14 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight(0xffe9cf, 0.7);
fill.position.set(-0.5, 2, 4);
scene.add(fill);

// ---------------------------------------------------------------- view
const LAKE = -3;
sky(ctx, { top: 0x2a68c8, mid: 0x7db0ea, horizon: 0xd2e6f5, sun: [600, 700] });
clouds(ctx, { count: 9, y: [180, 300], z: [-700, -850], opacity: 0.8 });
mountains(ctx, { z: -620, base: LAKE, amp: 300, seed: 5.3, freq: 0.7, rock: 0x7b818a, forest: 0x4b5e55, snowLine: 150, treeLine: 40, haze: 0xc5d9ea, hazeAmt: 0.45, mist: 0.15 });
mountains(ctx, { z: -330, base: LAKE, amp: 200, seed: 1.7, freq: 1.1, rock: 0x6c6f73, forest: 0x2c4a33, snowLine: 135, treeLine: 55, haze: 0xbad3e6, hazeAmt: 0.12, mist: 0.1 });
water(ctx, { y: LAKE, near: 6, far: 330, deep: 0x1f8c97, color: 0x79cfd0, glint: 0.9, sunX: 120 });
trees(ctx, { count: 380, x: [-320, 320], z: [-250, -320], y: () => LAKE, size: [10, 18], color: 0x24412b });
trees(ctx, { count: 40, x: [-90, -26], z: [-14, -80], y: () => LAKE, size: [7, 13], color: 0x2a4a30 });
trees(ctx, { count: 40, x: [26, 90], z: [-14, -80], y: () => LAKE, size: [7, 13], color: 0x2a4a30 });

// ---------------------------------------------------------------- desk
crtMonitor(ctx, { x: 0.15, z: -0.02 });
keyboard(ctx, { x: 0.15, z: 0.27 });
mug(ctx, { x: -0.13, z: 0.33, color: 0x3466a8, band: null, label: 'enamel mug · about' });
takeoutBag(ctx, { x: -0.7, z: -0.16 });
grassBlock(ctx, { x: -0.5, z: 0.24 });
phone(ctx, { x: -0.27, z: 0.16 });
books(ctx, { x: 0.62, z: 0.24 });
bottle(ctx, { x: 0.55, z: -0.22, play: fish(ctx, { y: LAKE, z: -30 }) });
succulent(ctx, { x: -0.45, y: WIN.y0, z: WIN.z + 0.06 });
topoMap(ctx, { x: -1.3, y: 1.5, z: WIN.z + 0.13, w: 0.56, h: 0.42, play: canoe(ctx, { y: LAKE, z: -45 }) });
men(ctx, { x: 1.08, y: 1.44, z: WIN.z + 0.13, rotY: -0.45 });

postcards(ctx, { x: -1.45, y: 1.1, z: WIN.z + 0.12, current: 'cabin' });

ctx.start();
