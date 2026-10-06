// s39-break · "They minded all the king's good manners / While Ehud made his break." (151.4-157.43).
// Dawn over the layered hills: Eglon's palace far behind with its lamps still lit, the road winding
// away from it, and on the last hill of Ephraim tiny Ehud raises the ram's horn against the sunrise.
// Words: upper left.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, L } from '/song/lib/paper.js';
import { slam, KICKS, lastHit } from '/song/lib/sync.js';
import { world, ESC_UNIFORMS, fgRocks, hills, woodedHills, path, clouds, sky, lightBox, pose, stepAt, stepIdx } from '/song/lib/x-escape.js';
import { palaceGLSL, palaceWinGLSL } from '/song/lib/x-escape-sets.js';

export const kind = 'shader';
// his hill: rising to a crest at x ~ 16
const GR = [-9, 0.0, 9.5, 0.1];
const gy = (x) => GR[0] + GR[1] * x + GR[2] * Math.sin(x * GR[3]);
const EX = 15.5;
const RAISE = 151.42;

// the road: a pale worn band winding down across a hill sheet
const road = (a, b, c) => `{ float ry = ${a} + ${b} * q.x + ${c} * sin(q.x * 0.09); float rb = smoothstep(0.9, 0.3, abs(q.y - ry) - 0.3) * step(q.y, y - 0.6);
  m.alb = mix(m.alb, lin(vec3(0.55, 0.47, 0.4)), rb * 0.6); }`;

const FRAG = world([
  fgRocks({ z: 4, base: -21, amp: 7, scale: 0.07, seed: 151, grass: 1.2, col: [0.16, 0.14, 0.13] }),
  path({ z: 30, seed: 153, col: [0.3, 0.26, 0.23], grass: 0.9, below: 40 }),
  woodedHills({ z: 48, base: -10, amp: 7, scale: 0.03, seed: 155, col: [0.38, 0.34, 0.34], treeW: 2.6, treeMin: 2.5, treeMax: 5, treeX0: -60, treeX1: -20, matExtra: road('-11.0', '0.12', '1.5') }),
  hills({ z: 75, base: -4, amp: 9, scale: 0.025, seed: 157, col: [0.48, 0.43, 0.43], trans: 0.4, matExtra: road('-6.5', '0.05', '1.2') }),
  hills({ z: 100, base: 0, amp: 5, scale: 0.02, seed: 159, col: [0.55, 0.5, 0.5], trans: 0.4,
    extra: palaceGLSL(-62, 3, 0.85), matExtra: palaceWinGLSL(-62, 3, 0.85) + 'if (q.x > -75.0 && q.x < -50.0 && q.y > 2.0) { m.alb *= 0.45; }' }),
  hills({ z: 120, base: 6, amp: 16, scale: 0.016, seed: 161, col: [0.62, 0.55, 0.55], trans: 0.45 }),
  clouds({ z: 128, y: 34, x0: -120, span: 240, n: 5, w: 20, drift: '(uTime - 151.0) * 1.2', seed: 163, col: [0.35, 0.3, 0.34] }),
  sky({ z: 140, moon: [38, 12, 9], moonCol: [3.0, 1.9, 1.0], moonK: 1.0, haloK: 2.5, seed: 165, low: [0.75, 0.52, 0.42], top: [0.04, 0.05, 0.09], y0: 6, y1: 38, stars: 0.92, starMin: 50 }),
  lightBox({ z: 146, col: [1.8, 1.3, 0.9] }),
]);

export default (P) => {
  const D = P.to - P.from;
  const cam = (t) => {
    const u = ease.inOut3(clamp01((t - P.from) / D));
    // a slow pull back and rise, the whole road coming into view
    return { pos: [mix(4, -2, u), mix(2, 5, u), mix(-34, -46, u)], target: [mix(6, 0, u), mix(4, 6, u), 80], fov: 40, roll: 0 };
  };
  return {
    name: 's39-break', from: P.from, to: P.to,
    frag: FRAG,
    uniforms: { ...ESC_UNIFORMS, uGr: GR, uAper: 0.25, uFocus: 64, uAmb: L(100, 92, 105, 1.6), uFillDir: [0.3, 0.6, -0.75], uHaze: L(120, 105, 115, 0.5), uHazeD: 0.004, uDust: 0.6 },
    camera: cam,
    update(t, u) {
      const st = stepAt(t), n = stepIdx(t);
      const raised = st >= RAISE;
      // on each later drum he gives the horn a blast: head back, horn up a notch
      const h = lastHit(st, KICKS.filter((k) => k > RAISE + 0.3));
      const blast = h.ago < 0.25 ? 1 : 0;
      const p = { x: EX, y: gy(EX), scale: 0.38, face: 1, lean: raised ? -0.08 - 0.08 * blast : 0.05, head: raised ? -0.32 - 0.12 * blast : 0.05,
        sh: raised ? -2.25 - 0.15 * blast : -0.3, el: raised ? -0.35 : -0.6, fsh: raised ? 0.5 : 0.2, fel: -0.4, sway: 0.18, style: 2 };
      if (st >= RAISE - 0.1 && st < RAISE + 0.12) { p.sh = -1.4; p.el = -1.3; }     // the arm swinging up
      u.uFig.value = pose(p);
      u.uHorn.value = 1.9;
      u.uCloak.value = 0.6 + 0.15 * blast;
      u.uCloakPh.value = n * 0.9;
      u.uBoil.value = n;
      u.uFocus.value = -cam(t).pos[2] + 30;
      u.uL.value = packLights([
        { dir: [0.35, 0.12, 0.93], col: L(255, 190, 130, 2.6), rad: 1 },               // the sunrise behind
        { dir: [-0.3, 0.6, -0.75], col: L(150, 155, 190, 0.9), rad: 2 },
        { pos: [EX + 1.5, gy(EX) + 6, 34], col: L(255, 200, 150, 2.0 + 1.0 * blast), rad: 1, range: 10 },   // rim on the horn-blower
        { pos: [-62, 6, 96], col: L(255, 150, 70, 1.4), rad: 2, range: 10 },             // the palace lamps
        { dir: [0.7, 0.25, -0.65], col: L(255, 175, 125, 0.9), rad: 2 },
      ]);
      u.uLN.value = 5;
    },
    post(t) { return grade(t, { exposure: 1.4, bloom: 0.2, threshold: 0.85, vignette: 0.55, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.015, 0.012, 0.03], highlights: [1.0, 0.94, 0.86], amount: 0.4 } }; },
  };
};
