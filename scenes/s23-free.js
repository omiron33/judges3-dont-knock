// s23-free · "And Ehud was running free." (94.48-96.231). Ehud at full stride along a moonlit ridge,
// cloak streaming, crossing the face of a great tissue moon; on the drum hit he leaps.
// Words: upper left.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, L } from '/song/lib/paper.js';
import { slam, KICKS } from '/song/lib/sync.js';
import { world, ESC_UNIFORMS, fgRocks, hills, woodedHills, path, clouds, sky, lightBox, pose, runPose, stepAt, stepIdx } from '/song/lib/x-escape.js';

export const kind = 'shader';

const GR = [-6, 0.06, 0.8, 0.21];
const gy = (x) => GR[0] + GR[1] * x + GR[2] * Math.sin(x * GR[3]);
const LEAP = 95.74;

const FRAG = world([
  fgRocks({ z: 2, base: -17, amp: 5, scale: 0.12, seed: 8, grass: 1.6, col: [0.1, 0.09, 0.08] }),
  path({ z: 20, seed: 27, col: [0.18, 0.16, 0.15], grass: 1.1, below: 60 }),
  hills({ z: 70, base: -9, amp: 10, scale: 0.03, seed: 22, col: [0.3, 0.3, 0.32], trans: 0.4 }),
  woodedHills({ z: 105, base: -6, amp: 16, scale: 0.02, seed: 24, col: [0.42, 0.42, 0.45], trans: 0.45, hatchAmt: 0.2, treeW: 3, treeMin: 3, treeMax: 6 }),
  clouds({ z: 125, y: 12, x0: -70, span: 140, n: 3, w: 17, drift: '(uTime - 94.0) * 4.0', seed: 37, col: [0.25, 0.25, 0.28] }),
  sky({ z: 140, moon: [3, 16, 19], seed: 47, low: [0.22, 0.23, 0.28], top: [0.03, 0.035, 0.05], y0: 0, y1: 60, starMin: 10 }),
  lightBox({ z: 146, col: [1.15, 1.25, 1.5] }),
]);

export default (P) => {
  const D = P.to - P.from;
  const cam = (t) => {
    const u = clamp01((t - P.from) / D);
    const x = mix(-5, 6, u);
    return { pos: [x, -1, -35], target: [x + 1, 7, 60], fov: 33, roll: -0.015 + 0.02 * u };
  };
  return {
    name: 's23-free', from: P.from, to: P.to,
    frag: FRAG,
    uniforms: { ...ESC_UNIFORMS, uGr: GR, uAper: 0.3, uFocus: 55, uAmb: L(60, 66, 85, 1.0), uFillDir: [0.3, 0.6, -0.75], uHaze: L(70, 78, 100, 0.5), uHazeD: 0.003, uDust: 0.6 },
    camera: cam,
    update(t, u) {
      const st = stepAt(t);
      const x = mix(-11, 15, clamp01((st - P.from) / D));
      const r = runPose(t, { x, y: gy(x), scale: 0.8, lean: 0.3 });
      // the leap: three steps flying with the stride flung wide, then landing
      const la = st - LEAP;
      if (la >= 0 && la < 0.25) {
        r.pose.sway = -0.62; r.pose.sh = 0.9; r.pose.el = -0.8; r.pose.fsh = -1.2; r.pose.fel = -1.4;
        r.pose.y = gy(x) + 0.8 * 3.2 * Math.sin(Math.PI * (la + 0.04) / 0.3);
        r.pose.lean = 0.2;
      }
      u.uFig.value = pose(r.pose);
      u.uCloak.value = 1.0;
      u.uCloakPh.value = stepIdx(t) * 1.3;
      u.uHB.value = 0;
      u.uBoil.value = stepIdx(t);
      u.uFocus.value = 55;
      u.uL.value = packLights([
        { dir: [0.0, 0.25, 0.97], col: L(200, 212, 240, 1.3), rad: 1 },
        { dir: [0.4, 0.5, -0.75], col: L(140, 152, 190, 0.45), rad: 2 },
        { pos: [x + 1, gy(x) + 9, 28], col: L(210, 222, 250, 2.6), rad: 1.5, range: 12 },
        { pos: [cam(t).pos[0] - 8, 4, -5], col: L(170, 180, 210, 0.6), rad: 2, range: 25 },
      ]);
      u.uLN.value = 4;
    },
    post(t) { return grade(t, { exposure: 1.4, bloom: 0.14, threshold: 0.95, vignette: 0.55, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.01, 0.013, 0.03], highlights: [0.95, 0.97, 1.0], amount: 0.4 } }; },
  };
};
