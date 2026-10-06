// s28-sight2 · "They gave him every minute that he needed / To get clean out of sight." (109.71-115.2).
// Dawn: Ehud climbs into the wooded hills of Ephraim, forests of stacked cut-paper silhouettes, and
// the nearest stand of trees swallows him. The dawn warms behind the layers. Words: upper right.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, L } from '/song/lib/paper.js';
import { slam, KICKS } from '/song/lib/sync.js';
import { pines } from '/song/lib/x-escape-sets.js';
import { world, ESC_UNIFORMS, fgRocks, hills, woodedHills, path, clouds, sky, lightBox, pose, runPose, stepAt, stepIdx } from '/song/lib/x-escape.js';

export const kind = 'shader';
const GR = [-9, 0.36, 0.5, 0.35];
const gy = (x) => GR[0] + GR[1] * x + GR[2] * Math.sin(x * GR[3]);

// a forest sheet: the slope line with dense tall pines; x0: where the trees begin
const forest = (o) => woodedHills({ scale: 0.04, tearAmt: 0.3, hatchAmt: 0.15, ...o });

const FRAG = world([
  pines({ z: 13, xs: [8, 12.5, 17, 23, 28.5, 35], ys: [-4.4, -3, -1.6, 0.2, 1.8, 3.6], hs: [24, 31, 27, 33, 28, 31], seed: 81, col: [0.17, 0.15, 0.15], sway: 'uK[1]', ground: '-4.5 + 0.3 * (p.x - 7.0) - 100.0 * step(p.x, 6.0)' }),
  path({ z: 20, seed: 83, col: [0.3, 0.26, 0.22], grass: 0.8 }),
  forest({ z: 30, base: -6, amp: 6, seed: 85, col: [0.2, 0.21, 0.25], treeW: 2.0, treeMin: 9, treeMax: 15, treeX0: -6, slide: 'uK[2]' }),
  forest({ z: 46, base: 0, amp: 8, seed: 87, col: [0.32, 0.32, 0.37], treeW: 2.3, treeMin: 7, treeMax: 12, treeX0: -30, slide: 'uK[3]', trans: 0.35 }),
  forest({ z: 68, base: 8, amp: 10, seed: 89, col: [0.46, 0.44, 0.47], treeW: 2.8, treeMin: 5, treeMax: 9, trans: 0.4 }),
  hills({ z: 95, base: 14, amp: 16, scale: 0.018, seed: 91, col: [0.6, 0.56, 0.56], trans: 0.45 }),
  clouds({ z: 118, y: 40, x0: -110, span: 220, n: 5, w: 18, drift: '(uTime - 109.0) * 1.2', seed: 93, col: [0.4, 0.36, 0.4] }),
  sky({ z: 130, moon: null, seed: 95, low: [0.8, 0.6, 0.5], top: [0.05, 0.06, 0.11], y0: 18, y1: 55, stars: 0.93, starMin: 55 }),
  lightBox({ z: 136, col: [1.6, 1.3, 1.0] }),
]);

export default (P) => {
  const D = P.to - P.from;
  const cam = (t) => {
    const u = ease.inOut3(clamp01((t - P.from) / D));
    const x = mix(-6, 3, u);
    return { pos: [x, -1, mix(-42, -36, u)], target: [x + 1, 3, 60], fov: 42, roll: 0 };
  };
  return {
    name: 's28-sight2', from: P.from, to: P.to,
    frag: FRAG,
    uniforms: { ...ESC_UNIFORMS, uGr: GR, uAper: 0.3, uFocus: 60, uAmb: L(100, 92, 105, 1.8), uFillDir: [0.3, 0.6, -0.75], uHaze: L(120, 105, 115, 0.5), uHazeD: 0.005, uDust: 0.8 },
    camera: cam,
    update(t, u) {
      const st = stepAt(t), n = stepIdx(t);
      const x = mix(-19, 12.5, clamp01((st - P.from) / 4.2));
      const r = runPose(t, { x, y: gy(x), scale: 0.45, lean: 0.4, rate: 10 });
      u.uFig.value = pose(r.pose);
      u.uCloak.value = 0.7;
      u.uCloakPh.value = n * 1.1;
      u.uBoil.value = n;
      // drum hits jolt the forest layers sideways a hair, each settling
      const s = slam(t);
      u.uK.value = [0, 0.6 * s, -0.18 * s, 0.12 * s, 0, 0, 0, 0];
      u.uFocus.value = cam(t).pos[2] * -1 + 20;
      const dawn = clamp01((t - P.from) / D);
      u.uL.value = packLights([
        { dir: [0.35, 0.18, 0.92], col: L(255, 185, 135, 1.6 + 1.2 * dawn), rad: 1 },
        { dir: [-0.3, 0.6, -0.75], col: L(140, 150, 185, 0.8), rad: 2 },
        { pos: [x + 3, gy(x) + 7, 26], col: L(255, 190, 140, 1.4), rad: 1.5, range: 12 },
        { pos: [cam(t).pos[0] - 8, 6, 2], col: L(170, 170, 200, 3.0), rad: 2, range: 22 },
        { dir: [0.75, 0.3, -0.6], col: L(255, 170, 120, 1.1), rad: 2 },
      ]);
      u.uLN.value = 5;
    },
    post(t) { return grade(t, { exposure: 1.4, bloom: 0.18, threshold: 0.85, vignette: 0.55, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.015, 0.012, 0.03], highlights: [1.0, 0.94, 0.86], amount: 0.4 } }; },
  };
};
