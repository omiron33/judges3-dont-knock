// s16-quarry · "While Ehud made the quarry line." (66.727-68.798). Ehud running past the carved
// standing stones by moonlight, on twos, the layers of hills sliding behind him. Words: upper right.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, L } from '/song/lib/paper.js';
import { slam } from '/song/lib/sync.js';
import { world, ESC_UNIFORMS, fgRocks, hills, woodedHills, stones, path, clouds, sky, lightBox, moonLights, pose, runPose, stepAt, stepIdx } from '/song/lib/x-escape.js';

export const kind = 'shader';

const GR = [-8, 0.0, 0.6, 0.15];
const gy = (x) => GR[0] + GR[1] * x + GR[2] * Math.sin(x * GR[3]);

const FRAG = world([
  fgRocks({ z: 4, base: -21, amp: 9, scale: 0.07, seed: 2, grass: 0.9, col: [0.24, 0.22, 0.2] }),
  path({ z: 20, seed: 21, col: [0.32, 0.28, 0.24], grass: 0.6 }),
  stones({ z: 30, xs: [-30, -19, -9, 2, 12, 23, 34], hs: [12, 15, 11, 16, 13, 14, 10], y: -8, kick: 0 }),
  woodedHills({ z: 48, base: -4, amp: 9, scale: 0.035, seed: 3, col: [0.4, 0.39, 0.38], treeW: 2.2, treeMin: 2.5, treeMax: 5 }),
  hills({ z: 75, base: 4, amp: 16, scale: 0.025, seed: 5, col: [0.5, 0.49, 0.48], trans: 0.35 }),
  hills({ z: 110, base: 14, amp: 22, scale: 0.016, seed: 7, col: [0.6, 0.59, 0.58], trans: 0.4, hatchAmt: 0.25 }),
  clouds({ z: 128, y: 40, x0: -125, span: 120, n: 3, w: 16, drift: '(uTime - 66.0) * 2.0' }),
  sky({ z: 140, moon: [-48, 50, 6.5], seed: 41, low: [0.3, 0.31, 0.36], top: [0.03, 0.035, 0.05], y0: 20, y1: 70 }),
  lightBox({ z: 146 }),
]);

export default (P) => {
  const D = P.to - P.from;
  const cam = (t) => {
    const u = clamp01((t - P.from) / D);
    const x = mix(-16, 2, u);
    return { pos: [x, -5, -40], target: [x + 2, 1, 60], fov: 34, roll: 0 };
  };
  return {
    name: 's16-quarry', from: P.from, to: P.to,
    frag: FRAG,
    uniforms: { ...ESC_UNIFORMS, uGr: GR, uAper: 0.3, uFocus: 60, uAmb: L(70, 76, 95, 1.2), uFillDir: [0.3, 0.6, -0.75], uHaze: L(70, 78, 100, 0.55), uHazeD: 0.004, uDust: 0.4 },
    camera: cam,
    update(t, u) {
      const st = stepAt(t);
      const x = mix(-22, 8, clamp01((st - P.from) / D));
      const r = runPose(t, { x, y: gy(x), scale: 0.5 });
      u.uFig.value = pose(r.pose);
      u.uCloak.value = 0.85;
      u.uCloakPh.value = r.k * 1.1;
      u.uHB.value = 0;
      u.uHorn.value = 0;
      u.uBoil.value = stepIdx(t);
      u.uK.value = [-1.2 * slam(t), 0, 0, 0, 0, 0, 0, 0];
      u.uFocus.value = 60;
      const cx = cam(t).pos[0];
      u.uL.value = packLights(moonLights({ moonDir: [-0.45, 0.45, 0.77], k: 2.4, front: 0.7, frontDir: [0.3, 0.75, -0.6], rimPos: [x - 3, gy(x) + 9, 24], rimK: 1.4,
        extra: [{ pos: [cx - 4, 14, 0], col: L(190, 200, 225, 7.0), rad: 2, range: 18 }] }));
      u.uLN.value = 4;
    },
    post(t) { return grade(t, { exposure: 1.45, bloom: 0.14, threshold: 0.9, vignette: 0.55, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.01, 0.013, 0.03], highlights: [0.95, 0.97, 1.0], amount: 0.4 } }; },
  };
};
