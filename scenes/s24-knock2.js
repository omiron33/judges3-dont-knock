// s24-knock2 · "Don't knock, he's busy! Give the king a little time." (96.231-100.641). CHORUS 2, the
// escape: a wide layered night landscape, tiny Ehud running hard toward the hill country of Ephraim,
// and far back on a distant ridge Moab's torches, small and slow. Words: upper third.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, L, flicker } from '/song/lib/paper.js';
import { slam } from '/song/lib/sync.js';
import { world, ESC_UNIFORMS, fgRocks, hills, woodedHills, path, clouds, sky, lightBox, moonLights, pose, runPose, stepAt, stepIdx } from '/song/lib/x-escape.js';
import { RIDER_GLSL, riderHill } from '/song/lib/x-escape-sets.js';

export const kind = 'shader';
const GR = [-9, 0.05, 0.9, 0.12];
const gy = (x) => GR[0] + GR[1] * x + GR[2] * Math.sin(x * GR[3]);
const RB = 2, RA = 1.0;

const FRAG = world([
  fgRocks({ z: 5, base: -22, amp: 8, scale: 0.07, seed: 31, grass: 1.3, col: [0.14, 0.13, 0.12], slide: '0.0' }),
  path({ z: 25, seed: 33, col: [0.3, 0.27, 0.24], grass: 0.6 }),
  woodedHills({ z: 45, base: -9, amp: 7, scale: 0.035, seed: 35, col: [0.36, 0.35, 0.35], treeW: 2.2, treeMin: 2, treeMax: 4.5, treeX0: 5 }),
  hills({ z: 70, base: -4, amp: 10, scale: 0.025, seed: 37, col: [0.45, 0.45, 0.47], trans: 0.35 }),
  riderHill({ z: 95, base: RB, amp: RA, scale: 0.02, seed: 39, col: [0.5, 0.5, 0.53] }),
  woodedHills({ z: 120, base: 8, amp: 22, scale: 0.012, seed: 41, col: [0.58, 0.58, 0.62], trans: 0.45, treeW: 3.5, treeMin: 3, treeMax: 6, treeX0: 30 }),
  clouds({ z: 130, y: 16, x0: -120, span: 240, n: 5, w: 20, drift: '(uTime - 96.0) * 1.5', seed: 43, col: [0.24, 0.24, 0.27] }),
  sky({ z: 140, moon: [-58, 22, 5.5], seed: 45, low: [0.3, 0.31, 0.37], top: [0.02, 0.025, 0.035], y0: 5, y1: 45, starMin: 12 }),
  lightBox({ z: 146 }),
], RIDER_GLSL);

export default (P) => {
  const D = P.to - P.from;
  const ex = (st) => mix(-16, 18, clamp01((st - P.from) / D));
  const cam = (t) => {
    const u = clamp01((t - P.from) / D);
    const x = mix(-8, 14, u);
    return { pos: [x, 4, -42], target: [x - 2, 6, 60], fov: 40, roll: 0 };
  };
  return {
    name: 's24-knock2', from: P.from, to: P.to,
    frag: FRAG,
    uniforms: { ...ESC_UNIFORMS, uGr: GR, uR: new Array(16).fill(0), uAper: 0.25, uFocus: 67, uAmb: L(70, 76, 95, 1.2), uFillDir: [0.3, 0.6, -0.75], uHaze: L(70, 78, 100, 0.55), uHazeD: 0.004, uDust: 0.5 },
    camera: cam,
    update(t, u) {
      const st = stepAt(t), n = stepIdx(t);
      const x = ex(st);
      const r = runPose(t, { x, y: gy(x), scale: 0.36, lean: 0.28 });
      // the double hit: two quick hops
      const hop = [98.08, 98.21].reduce((a, h) => a + (st >= h && st < h + 0.17 ? 1 : 0), 0);
      r.pose.y += hop * 0.36 * 2.2;
      u.uFig.value = pose(r.pose);
      u.uCloak.value = 0.95;
      u.uCloakPh.value = n * 1.1;
      u.uBoil.value = n;
      // the riders, far back, trotting left (the wrong way) along the distant ridge
      const R = new Array(16).fill(0);
      const lights = moonLights({ moonDir: [-0.5, 0.35, 0.79], k: 2.2, front: 0.9, frontDir: [0.3, 0.75, -0.6], rimPos: [x - 2, gy(x) + 6, 29], rimK: 0.9 });
      lights.push({ pos: [cam(t).pos[0] - 6, 10, 5], col: L(190, 200, 225, 5.5), rad: 2, range: 22 });
      let fx = 0;
      for (let k = 0; k < 3; k++) {
        const rx = -38 + k * 3.2 - 3.0 * (st - P.from);
        R.splice(k * 4, 4, rx, -1, n * 1.05 + k * 2.1, 0.75);
        fx += rx / 3;
      }
      lights.push({ pos: [fx - 0.5, RB + RA * 0.5 + 3.8, 92], col: L(255, 150, 60, 3.0 * flicker(t, 2.0)), rad: 1, range: 9 });
      u.uR.value = R;
      u.uFocus.value = 67;
      u.uL.value = packLights(lights);
      u.uLN.value = lights.length;
    },
    post(t) { return grade(t, { exposure: 1.45, bloom: 0.16, threshold: 0.9, vignette: 0.55, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.01, 0.013, 0.03], highlights: [0.95, 0.97, 1.0], amount: 0.4 } }; },
  };
};
