// s37-quarry3 · "While Ehud made the quarry line." (144.666-146.736). The carved stones one last time:
// closer on Ehud at full run, the idols sliding past behind him; on the first hit he throws a grin
// back over his shoulder, then faces front again for the hills. Words: upper right.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, L } from '/song/lib/paper.js';
import { slam } from '/song/lib/sync.js';
import { world, ESC_UNIFORMS, fgRocks, hills, woodedHills, stones, path, clouds, sky, lightBox, moonLights, pose, runPose, stepAt, stepIdx } from '/song/lib/x-escape.js';

export const kind = 'shader';

const GR = [-8, 0.0, 0.5, 0.17];
const gy = (x) => GR[0] + GR[1] * x + GR[2] * Math.sin(x * GR[3]);
const LOOK = 144.85, LOOK_END = 146.2;

const FRAG = world([
  fgRocks({ z: 3, base: -18.5, amp: 6, scale: 0.09, seed: 6, grass: 1.0, col: [0.22, 0.2, 0.18] }),
  path({ z: 20, seed: 25, col: [0.32, 0.28, 0.24], grass: 0.6 }),
  stones({ z: 29, xs: [-30, -17, -4, 9, 22, 35, 48, 61], hs: [17, 21, 15, 20, 16, 22, 15, 19], y: -9, kick: 0, seed: 19 }),
  woodedHills({ z: 50, base: -2, amp: 9, scale: 0.035, seed: 15, col: [0.4, 0.39, 0.38], treeW: 2.4, treeMin: 2.5, treeMax: 5.5 }),
  hills({ z: 78, base: 6, amp: 15, scale: 0.025, seed: 16, col: [0.5, 0.49, 0.48], trans: 0.35 }),
  hills({ z: 110, base: 15, amp: 20, scale: 0.016, seed: 18, col: [0.6, 0.59, 0.58], trans: 0.4, hatchAmt: 0.25 }),
  clouds({ z: 128, y: 36, x0: -100, span: 120, n: 3, w: 15, drift: '(uTime - 144.0) * 2.5', seed: 35 }),
  sky({ z: 140, moon: [-30, 37, 5.5], seed: 45, low: [0.3, 0.31, 0.36], top: [0.03, 0.035, 0.05], y0: 20, y1: 70 }),
  lightBox({ z: 146 }),
]);

export default (P) => {
  const D = P.to - P.from;
  const ex = (t) => mix(-12, 26, clamp01((t - P.from) / D));
  const cam = (t) => {
    // the camera runs with him, letting him gain a little across the frame
    const x = mix(-8, 28, clamp01((t - P.from) / D));
    return { pos: [x, -2, -24], target: [x + 1, 2.5, 60], fov: 31, roll: 0 };
  };
  return {
    name: 's37-quarry3', from: P.from, to: P.to,
    frag: FRAG,
    uniforms: { ...ESC_UNIFORMS, uGr: GR, uAper: 0.35, uFocus: 44, uAmb: L(70, 76, 95, 1.2), uFillDir: [0.3, 0.6, -0.75], uHaze: L(70, 78, 100, 0.55), uHazeD: 0.004, uDust: 0.4 },
    camera: cam,
    update(t, u) {
      const st = stepAt(t);
      const x = ex(st);
      const look = st >= LOOK && st < LOOK_END;
      const r = runPose(t, { x, y: gy(x), scale: 0.62, lean: look ? 0.12 : 0.26, head: look ? -0.15 : 0.04 });
      // looking back he flaps his far hand in a little wave over the shoulder
      if (look) { r.pose.fsh = 1.5 + (stepIdx(t) % 2 ? 0.3 : -0.1); r.pose.fel = 0.7; }
      u.uFig.value = pose(r.pose);
      u.uHB.value = look ? 1 : 0;
      u.uCloak.value = 0.95;
      u.uCloakPh.value = stepIdx(t) * 1.1;
      u.uBoil.value = stepIdx(t);
      u.uK.value = [-1.0 * slam(t), 0, 0, 0, 0, 0, 0, 0];
      u.uFocus.value = 44;
      const cx = cam(t).pos[0];
      u.uL.value = packLights(moonLights({ moonDir: [-0.45, 0.45, 0.77], k: 2.4, front: 0.7, frontDir: [0.3, 0.75, -0.6], rimPos: [x - 3, gy(x) + 10, 25], rimK: 1.4,
        extra: [{ pos: [cx - 3, 12, 2], col: L(190, 200, 225, 6.5), rad: 2, range: 16 }] }));
      u.uLN.value = 4;
    },
    post(t) { return grade(t, { exposure: 1.45, bloom: 0.14, threshold: 0.9, vignette: 0.55, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.01, 0.013, 0.03], highlights: [0.95, 0.97, 1.0], amount: 0.4 } }; },
  };
};
