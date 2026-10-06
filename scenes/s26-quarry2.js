// s26-quarry2 · "While Ehud made the quarry line." (102.941-105.022). The carved stones again, closer:
// Ehud runs in, skids on the drum hit, paper grit flying, and swings round the great idol and away.
// Words: upper right.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, L } from '/song/lib/paper.js';
import { slam } from '/song/lib/sync.js';
import { world, ESC_UNIFORMS, fgRocks, hills, woodedHills, stones, path, clouds, sky, lightBox, moonLights, pose, runPose, stepAt, stepIdx, chipsGLSL } from '/song/lib/x-escape.js';

export const kind = 'shader';

const GR = [-8, 0.0, 0.5, 0.2];
const gy = (x) => GR[0] + GR[1] * x + GR[2] * Math.sin(x * GR[3]);
const SKID = 103.15, SKID_END = 103.5;

const FRAG = world([
  fgRocks({ z: 3, base: -19, amp: 6, scale: 0.09, seed: 4, grass: 0.9, col: [0.22, 0.2, 0.18] }),
  stones({ z: 11, xs: [6.5], hs: [16], y: -11.5, seed: 18, kick: 1, moundAmp: 0.6, col: [0.3, 0.29, 0.28] }),
  path({ z: 20, seed: 23, col: [0.32, 0.28, 0.24], grass: 0.6, extra: chipsGLSL('uK[3]', 'uK[4]', 'uK[2]', '-1.0') }),
  stones({ z: 30, xs: [-34, -21, -8, 18, 31, 44], hs: [17, 21, 15, 22, 16, 19], y: -9, kick: 0, seed: 13 }),
  woodedHills({ z: 52, base: -2, amp: 9, scale: 0.035, seed: 9, col: [0.4, 0.39, 0.38], treeW: 2.4, treeMin: 2.5, treeMax: 5.5 }),
  hills({ z: 80, base: 6, amp: 15, scale: 0.025, seed: 12, col: [0.5, 0.49, 0.48], trans: 0.35 }),
  hills({ z: 112, base: 15, amp: 20, scale: 0.016, seed: 14, col: [0.6, 0.59, 0.58], trans: 0.4, hatchAmt: 0.25 }),
  clouds({ z: 128, y: 36, x0: -120, span: 110, n: 3, w: 15, drift: '(uTime - 102.0) * 2.0', seed: 33 }),
  sky({ z: 140, moon: [-40, 44, 6], seed: 43, low: [0.3, 0.31, 0.36], top: [0.03, 0.035, 0.05], y0: 20, y1: 70 }),
  lightBox({ z: 146 }),
]);

// Ehud's x on the run (stepped time): in, skid, then away round the idol
function ehud(st) {
  if (st < SKID) return { x: mix(-13, -5, clamp01((st - 102.941) / (SKID - 102.941))), mode: 'run' };
  if (st < SKID_END) { const u = (st - SKID) / (SKID_END - SKID); return { x: -5 + 2.6 * (1 - (1 - u) * (1 - u)), mode: 'skid', u }; }
  return { x: mix(-2.4, 17, clamp01((st - SKID_END) / (105.022 - SKID_END)) ** 0.9), mode: 'run' };
}

export default (P) => {
  const D = P.to - P.from;
  const cam = (t) => {
    const u = ease.inOut3(clamp01((t - P.from) / D));
    const x = mix(-9, 8, u);
    return { pos: [x, -4, -30], target: [x + 1, -1, 60], fov: 31, roll: 0 };
  };
  return {
    name: 's26-quarry2', from: P.from, to: P.to,
    frag: FRAG,
    uniforms: { ...ESC_UNIFORMS, uGr: GR, uAper: 0.35, uFocus: 50, uAmb: L(70, 76, 95, 1.2), uFillDir: [0.3, 0.6, -0.75], uHaze: L(70, 78, 100, 0.55), uHazeD: 0.004, uDust: 0.4 },
    camera: cam,
    update(t, u) {
      const st = stepAt(t);
      const e = ehud(st);
      let p;
      if (e.mode === 'skid') {
        // heels dug in, leaning back, arms thrown out; a little wobble each step
        const w = stepIdx(t) % 2 ? 0.05 : -0.05;
        p = { x: e.x, y: gy(e.x), scale: 0.6, face: 1, lean: -0.38 + w, head: 0.12, sh: -1.15, el: -0.35, fsh: 0.95, fel: -0.5, sway: -0.6, style: 2 };
        u.uCloak.value = 0.55;
      } else {
        p = runPose(t, { x: e.x, y: gy(e.x), scale: 0.6, lean: 0.26 }).pose;
        u.uCloak.value = 0.9;
      }
      u.uFig.value = pose(p);
      u.uCloakPh.value = stepIdx(t) * 1.1;
      u.uHB.value = 0;
      u.uBoil.value = stepIdx(t);
      const tau = st - SKID;
      u.uK.value = [-1.0 * slam(t), -0.8 * slam(t), tau, -5 + 1.2, gy(-5), 0, 0, 0];
      u.uFocus.value = 50;
      const cx = cam(t).pos[0];
      u.uL.value = packLights(moonLights({ moonDir: [-0.45, 0.45, 0.77], k: 2.4, front: 0.7, frontDir: [0.3, 0.75, -0.6], rimPos: [e.x - 3, gy(e.x) + 10, 25], rimK: 1.4,
        extra: [{ pos: [cx - 5, 12, 2], col: L(190, 200, 225, 6.5), rad: 2, range: 16 }, { pos: [3, 8, -6], col: L(180, 192, 220, 2.5), rad: 2, range: 14 }] }));
      u.uLN.value = 5;
    },
    post(t) { return grade(t, { exposure: 1.45, bloom: 0.14, threshold: 0.9, vignette: 0.55, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.01, 0.013, 0.03], highlights: [0.95, 0.97, 1.0], amount: 0.4 } }; },
  };
};
