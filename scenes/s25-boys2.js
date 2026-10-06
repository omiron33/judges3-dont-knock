// s25-boys2 · "That's what the palace boys kept saying" (100.641-102.941). Moab's riders far back on
// the night road, torches bobbing, trotting the wrong way; on the drum hit the leader pulls up and
// turns round, the others bunch into him, and on they go, still the wrong way. Words: upper third.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, L, flicker } from '/song/lib/paper.js';
import { world, ESC_UNIFORMS, fgRocks, hills, woodedHills, clouds, sky, lightBox, stepAt, stepIdx } from '/song/lib/x-escape.js';
import { RIDER_GLSL, riderHill } from '/song/lib/x-escape-sets.js';

export const kind = 'shader';
const HIT = 101.5;
const RB = -6, RA = 0.8;

const FRAG = world([
  fgRocks({ z: 6, base: -14, amp: 7, scale: 0.08, seed: 12, grass: 1.4, col: [0.14, 0.13, 0.12] }),
  riderHill({ z: 30, base: RB, amp: RA, scale: 0.02, seed: 52, col: [0.36, 0.34, 0.32] }),
  woodedHills({ z: 52, base: -3, amp: 8, scale: 0.03, seed: 54, col: [0.42, 0.42, 0.44], treeW: 2.6, treeMin: 3, treeMax: 6 }),
  hills({ z: 85, base: 4, amp: 14, scale: 0.02, seed: 56, col: [0.55, 0.55, 0.58], trans: 0.4 }),
  clouds({ z: 120, y: 30, x0: -90, span: 180, n: 4, w: 18, drift: '(uTime - 100.0) * 1.5', seed: 58, col: [0.22, 0.22, 0.25] }),
  sky({ z: 135, moon: null, seed: 59, low: [0.32, 0.33, 0.4], top: [0.02, 0.025, 0.035], y0: 0, y1: 45, stars: 0.86, starMin: 15 }),
  lightBox({ z: 141, col: [0.9, 1.0, 1.3] }),
], RIDER_GLSL);

// rider k's x at stepped time st, and facing
function rider(k, st) {
  const v = 7.5;                                  // cm a second, trotting left
  const x0 = [2, 8.5, 15][k];
  if (st < HIT) return { x: x0 - v * (st - 100.641), face: -1, gait: true };
  const halt = Math.min(st - HIT, 0.5);
  const xh = x0 - v * (HIT - 100.641);
  // the followers bunch up into the leader (slide a little closer as they stop)
  const bunch = k === 0 ? 0 : -(k * 1.6) * Math.min(1, (st - HIT) / 0.25);
  if (st < HIT + 0.5) return { x: xh + bunch, face: k === 0 && st > HIT + 0.08 ? 1 : -1, gait: false };
  return { x: xh + bunch - v * (st - HIT - 0.5), face: -1, gait: true };
}

export default (P) => {
  const D = P.to - P.from;
  const cam = (t) => {
    const u = clamp01((t - P.from) / D);
    const x = mix(9, 1, ease.inOut3(u));
    return { pos: [x, 2, -26], target: [x - 1, 7, 60], fov: 33, roll: 0 };
  };
  return {
    name: 's25-boys2', from: P.from, to: P.to,
    frag: FRAG,
    uniforms: { ...ESC_UNIFORMS, uR: new Array(16).fill(0), uAper: 0.35, uFocus: 56, uAmb: L(55, 60, 80, 1.0), uFillDir: [0.3, 0.6, -0.75], uHaze: L(50, 56, 75, 0.5), uHazeD: 0.004, uDust: 0.7 },
    camera: cam,
    update(t, u) {
      const st = stepAt(t);
      const n = stepIdx(t);
      const R = new Array(16).fill(0);
      const lights = [
        { dir: [-0.3, 0.45, 0.84], col: L(170, 185, 220, 2.0), rad: 1 },
        { dir: [0.3, 0.6, -0.75], col: L(120, 130, 165, 1.4), rad: 2 },
      ];
      for (let k = 0; k < 3; k++) {
        const r = rider(k, st);
        const ph = r.gait ? n * 1.05 + k * 2.1 : 0.4 + k;
        const s = 2.1;
        const bob = r.gait ? 0.12 * s * Math.abs(Math.sin(ph)) : 0;
        R.splice(k * 4, 4, r.x, r.face, ph, s);
        const fx = r.x + r.face * 0.62 * s, fy = RB + RA * 0.5 + 4.9 * s + bob;
        lights.push({ pos: [fx, fy, 27], col: L(255, 150, 60, 5.5 * flicker(t, k * 3.3)), rad: 0.6, range: 9 });
      }
      u.uR.value = R;
      u.uBoil.value = n;
      u.uFocus.value = 56;
      u.uL.value = packLights(lights);
      u.uLN.value = lights.length;
    },
    post(t) { return grade(t, { exposure: 1.45, bloom: 0.2, threshold: 0.85, vignette: 0.55, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.01, 0.012, 0.025], highlights: [1.0, 0.95, 0.88], amount: 0.4 } }; },
  };
};
