// s27-polite2 · "Don't knock, he's busy! Ain't it nice to be polite?" (105.022-109.71). Ehud hops a
// stream on stepping stones, the water strips of dark paper and silver foil buckling and rolling;
// on the middle stone, on the hits, he stops and tips an imaginary hat to us, then hops on.
// Words: upper left.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, L } from '/song/lib/paper.js';
import { slam } from '/song/lib/sync.js';
import { world, ESC_UNIFORMS, fgRocks, hills, woodedHills, path, clouds, sky, lightBox, moonLights, pose, runPose, stepAt, stepIdx } from '/song/lib/x-escape.js';
import { streamStrip, steppingStones } from '/song/lib/x-escape-sets.js';

export const kind = 'shader';
const SY = -8;
const FY = SY - 0.7;          // his feet sit a hair below the stone tops (the sandal soles)
const XS = [-12, -6, 0, 6, 12];
// the hops: [time landing, x]
const HOPS = [[105.02, -18], [105.5, -12], [105.98, -6], [106.44, 0], [107.95, 6], [108.42, 12], [108.9, 18], [109.71, 26]];

const FRAG = world([
  streamStrip({ z: 10, top: -11.2, amp: 0.4, seed: 61, col: [0.07, 0.08, 0.11], glint: 0.6 }),
  streamStrip({ z: 15, top: -9.6, amp: 0.35, seed: 62, col: [0.09, 0.1, 0.14], glint: 0.7, speed: 0.8 }),
  steppingStones({ z: 19, xs: XS, y: SY, seed: 71 }),
  path({ z: 20, figure: true, ground: false, grass: 0 }),
  streamStrip({ z: 23, top: -8.9, amp: 0.3, seed: 63, col: [0.11, 0.12, 0.16], glint: 0.8, speed: 0.7 }),
  streamStrip({ z: 27, top: -8.0, amp: 0.25, seed: 64, col: [0.13, 0.14, 0.18], glint: 0.6, speed: 0.6 }),
  // the banks: torn earth with reeds of cut paper
  hills({ z: 32, base: -7.5, amp: 2.5, scale: 0.05, seed: 65, col: [0.3, 0.28, 0.25], tear: 0.25, extra: 'd = min(d, blades(q, ridge(q.x, -7.5, 2.5, 0.05, 65.0), 0.45, 3.2, 66.0));' }),
  woodedHills({ z: 55, base: -4, amp: 9, scale: 0.035, seed: 67, col: [0.42, 0.41, 0.41], treeW: 2.3, treeMin: 3, treeMax: 6 }),
  hills({ z: 90, base: 6, amp: 15, scale: 0.02, seed: 68, col: [0.55, 0.55, 0.57], trans: 0.4 }),
  sky({ z: 130, moon: [42, 26, 6], seed: 69, low: [0.3, 0.31, 0.37], top: [0.02, 0.025, 0.035], y0: 10, y1: 50 }),
  lightBox({ z: 136 }),
]);

function ehud(t) {
  const st = stepAt(t), n = stepIdx(t);
  let i = 0;
  while (i < HOPS.length - 2 && st >= HOPS[i + 1][0]) i++;
  const [t0, x0] = HOPS[i], [t1, x1] = HOPS[i + 1];
  // standing on the middle stone between the hops
  if (i === 3 && st < 107.54) return { x: 0, y: FY, still: true, st, n };
  const a = i === 3 ? 107.54 : t0;
  const u = clamp01((st - a) / (t1 - a));
  return { x: mix(x0, x1, u), y: FY + 1.4 * Math.sin(Math.PI * u), u, st, n };
}

export default (P) => {
  const D = P.to - P.from;
  const cam = (t) => {
    const u = clamp01((t - P.from) / D);
    const x = mix(-7, 7, ease.inOut3(u));
    // a slow push in while he tips his hat
    const z = -30 + 5 * Math.sin(Math.PI * clamp01((t - 106.2) / 1.8));
    return { pos: [x, 2, z], target: [x * 0.8, 3, 60], fov: 36, roll: 0 };
  };
  return {
    name: 's27-polite2', from: P.from, to: P.to,
    frag: FRAG,
    uniforms: { ...ESC_UNIFORMS, uGr: [SY, 0, 0, 1], uAper: 0.35, uFocus: 50, uAmb: L(70, 76, 95, 1.2), uFillDir: [0.3, 0.6, -0.75], uHaze: L(70, 78, 100, 0.55), uHazeD: 0.004, uDust: 0.5 },
    camera: cam,
    update(t, u) {
      const e = ehud(t);
      let p;
      if (e.still) {
        // stopped: square to us in profile, and the hat comes off on the hits
        const st = e.st;
        const up = st >= 106.86 && st < 107.3;
        const sweep = st >= 106.99 && st < 107.3;
        p = { x: 0, y: FY, scale: 0.6, face: 1, lean: sweep ? 0.22 : 0.02, head: sweep ? 0.32 : 0.0, sh: 0.1, el: -0.3, fsh: 0.15, fel: -0.3, sway: 0.08, style: 2 };
        if (up && !sweep) { p.sh = -2.75; p.el = -1.25; }
        if (sweep) { p.sh = -1.3; p.el = -0.2; }
        if (st < 106.6) { p.sway = 0.25; p.lean = 0.15; }      // landing
      } else {
        // a hop: legs tucked in the air, flung wide to land
        const k = e.u < 0.2 || e.u > 0.85 ? 0.5 : 0.15;
        p = { x: e.x, y: e.y, scale: 0.6, face: 1, lean: 0.2, head: 0.04, sh: 0.7, el: -1.4, fsh: -0.9, fel: -1.2, sway: (e.n % 2 ? 1 : -1) * k, style: 2 };
      }
      u.uFig.value = pose(p);
      u.uCloak.value = e.still ? 0.35 : 0.8;
      u.uCloakPh.value = e.n * 1.1;
      u.uBoil.value = e.n;
      u.uK.value = [0, 0, 0, 0, 0, stepAt(t) + 0.15 * slam(t), 0, 0];
      u.uFocus.value = 50 - (cam(t).pos[2] + 30);
      const cx = cam(t).pos[0];
      u.uL.value = packLights(moonLights({ moonDir: [0.45, 0.4, 0.8], k: 2.2, front: 1.0, frontDir: [-0.2, 0.6, -0.78], rimPos: [e.x + 3, SY + 10, 25], rimK: 1.1,
        extra: [{ pos: [cx - 4, 10, 0], col: L(190, 200, 225, 6.0), rad: 2, range: 18 }] }));
      u.uLN.value = 4;
    },
    post(t) { return grade(t, { exposure: 1.45, bloom: 0.16, threshold: 0.9, vignette: 0.55, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.01, 0.013, 0.03], highlights: [0.95, 0.97, 1.0], amount: 0.4 } }; },
  };
};
