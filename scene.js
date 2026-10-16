// Ski cabin: a snowy day, a chairlift running up the hill outside, skis and a
// shinai leaning by the window, cocoa on the desk and an amber CRT.
import { createDesk, THREE, V3, DESK } from './kit/core.js';
import { cabinRoom } from './kit/rooms.js';
import { sky, mountains, water, trees, snowfall, chairlift, glass } from './kit/outside.js';
import { crtMonitor, keyboard, deskLamp, mug, takeoutBag, grassBlock, phone, books, goggles, skis, shinai, postcards } from './kit/objects.js';
import { skier, snowball } from './kit/fun.js';

const ctx = createDesk({
  background: 0xdfe6ee, exposure: 1.0, bloom: [0.35, 0.5, 0.85], grain: 0.025, vignette: 0.6,
  screenStyle: 'amber', scanlines: true, screenLight: 0.3,
  view: { look: [0, 1.12, -0.15], rise: 0.15, width: 1.6 },
  sections: { outside: { lines: ['~/outside', '', 'skiing', '  whenever it snows', '', 'hiking the same mountains', '  once it melts'] } },
});
const { scene } = ctx;

const WIN = { x0: -0.85, x1: 0.85, y0: 0.98, y1: 2.4, z: -0.45 };
cabinRoom(ctx, WIN, { logColor: 0x6e4a30, deskColor: 0xd9b98c, legColor: 0x8a6440 });
glass(ctx, WIN, { frost: true, sheen: 0.04 });

// ---------------------------------------------------------------- light
scene.add(new THREE.HemisphereLight(0xe4ecf6, 0x6a5038, 1.6));
const day = new THREE.DirectionalLight(0xe6eeff, 1.3);
day.position.set(-1, 4, -5);
day.target.position.set(0, DESK, 0.2);
day.castShadow = true;
day.shadow.mapSize.set(1024, 1024);
day.shadow.radius = 6;
Object.assign(day.shadow.camera, { left: -2.5, right: 2.5, top: 2.5, bottom: -2.5, near: 0.5, far: 14 });
day.shadow.bias = -0.0004;
scene.add(day, day.target);

// ---------------------------------------------------------------- view
const BASE = -4;
sky(ctx, { top: 0x8193ab, mid: 0xa9b7c8, horizon: 0xd3dbe4 });
mountains(ctx, { z: -650, base: BASE, amp: 230, seed: 3.3, freq: 0.8, rock: 0x6d7888, forest: 0x56636b, snowLine: 110, treeLine: -1e9, snow: 0xf7f9fc, haze: 0xd3dbe4, hazeAmt: 0.25, mist: 0.2 });
mountains(ctx, {
  z: -320, base: BASE, amp: 95, seed: 0.9, freq: 1.2, rock: 0x8d98a8, forest: 0x2c4136, snow: 0xf4f7fb,
  snowForest: true, treeLine: 70, snowLine: 80, haze: 0xdfe6ee, hazeAmt: 0.12, mist: 0.1,
  runs: [[-45, 0.32, 9], [-8, 0.12, 7], [35, -0.2, 10], [80, 0.05, 6]],
});
water(ctx, { y: BASE, near: 6, far: 240, deep: 0xeef3f9, color: 0xdde5ef, glint: 0.35 });
chairlift(ctx, { from: [-40, BASE, -150], to: [-15, 50, -305], towers: 6, chairs: 14 });
trees(ctx, { count: 60, x: [-100, -24], z: [-14, -100], y: () => BASE, size: [6, 12], color: 0x23392c, snowy: true });
trees(ctx, { count: 60, x: [24, 100], z: [-14, -100], y: () => BASE, size: [6, 12], color: 0x23392c, snowy: true });
snowfall(ctx, { count: 2600 });

// ---------------------------------------------------------------- desk
crtMonitor(ctx, { x: 0.15, z: -0.02 });
keyboard(ctx, { x: 0.15, z: 0.27 });
deskLamp(ctx, { metal: 0xb08d57, shade: 0x7a1f1f, power: 4 });
mug(ctx, { x: -0.13, z: 0.33, color: 0xc0392b, band: 0xf4f1ea, drink: 0x5a3424, label: 'cocoa · about' });
takeoutBag(ctx, { x: -0.7, z: -0.16 });
grassBlock(ctx, { x: -0.5, z: 0.24, snowy: true });
phone(ctx, { x: -0.27, z: 0.16 });
books(ctx, { x: 0.62, z: 0.24 });
goggles(ctx, { x: 0.47, z: -0.27, rotY: -0.2, play: snowball(ctx, WIN) });

// gear corner: skis on the left, shinai on the right
skis(ctx, { base: new V3(-1.15, 0, -0.3), top: new V3(-1.1, 1.6, -0.4), play: skier(ctx, { y: BASE, z: -40 }) });
shinai(ctx, { base: new V3(1.13, 0, -0.18), dir: new V3(-0.08, 1, -0.17) });

postcards(ctx, { x: 1.02, y: 1.78, z: WIN.z + 0.1, current: 'powder' });

ctx.start();
