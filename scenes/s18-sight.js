// s18-sight · "They gave him every minute that he needed / To get clean out of sight." (73.48-78.97).
// A sand-glass of wood and mica, paper sand pouring, on a table by candlelight; through the arched
// window behind it, tiny Ehud runs across the moonlit hills and drops over the last ridge.
// Words: upper left (the dark wall).
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, L, flicker } from '/song/lib/paper.js';
import { slam } from '/song/lib/sync.js';
import { world, ESC_UNIFORMS, hills, sky, lightBox, clouds, pose, runPose, stepAt, stepIdx, F } from '/song/lib/x-escape.js';
import { GLASS_GLSL, glassSheet, wallSheet } from '/song/lib/x-escape-glass.js';

export const kind = 'shader';
// the hill he crosses: y = 9 sin(0.1 x); the last ridge in front of it
const GR = [0, 0, 9, 0.1];
const gy = (x) => GR[0] + GR[1] * x + GR[2] * Math.sin(x * GR[3]);
const RIDGE = '4.6 + 0.7 * sin(p.x * 0.27 + 1.0) + 0.3 * sin(p.x * 0.9)';

const FRAG = world([
  glassSheet({ z: 8, x: 9.5, y: -1.5 }),
  wallSheet({ z: 22 }),
  { z: 60, sd: `return torn(sdBelow(p, ${RIDGE}), p, 0.25, 140.0, hq);`,
    mat: `Mat m = mPaper(lin(vec3(0.38, 0.38, 0.42))); m.trans = 0.35; m.seed = 140.0; m.alb *= 0.75 + 0.35 * brush(p, 0.2, 140.0);
      m.alb *= 1.0 - 0.3 * sat((${RIDGE} - p.y) / 8.0); return m;` },
  { z: 64, sd: `float d = torn(sdBelow(p, groundY(p.x)), p, 0.3, 141.0, hq);
      int pt; vec2 lp; float sh; d = min(d, figureE(p, figAt(uFig), pt, lp, sh, hq)); return d;`,
    mat: `{ int pt; vec2 lp; float sh; Fig f = figAt(uFig); float a = figureE(p, f, pt, lp, sh, true); if (a < 0.03 && pt != PT_NONE) return ehudMat(pt, lp, sh, f); }
      Mat m = mPaper(lin(vec3(0.42, 0.42, 0.45))); m.trans = 0.35; m.seed = 141.0; m.alb *= 0.75 + 0.35 * brush(p, -0.2, 141.0);
      m.alb *= 1.0 - 0.55 * sat((groundY(p.x) - p.y) / 7.0); return m;` },
  hills({ z: 88, base: 6, amp: 12, scale: 0.03, seed: 143, col: [0.5, 0.5, 0.54], trans: 0.4 }),
  hills({ z: 112, base: 12, amp: 16, scale: 0.02, seed: 145, col: [0.6, 0.6, 0.64], trans: 0.45 }),
  sky({ z: 135, moon: [50, 27, 4.5], seed: 147, low: [0.3, 0.31, 0.38], top: [0.04, 0.045, 0.07], y0: 10, y1: 40, starMin: 15 }),
  lightBox({ z: 141 }),
], GLASS_GLSL);

export default (P) => {
  const D = P.to - P.from;
  const cam = (t) => {
    const u = ease.inOut3(clamp01((t - P.from) / D));
    // a slow push toward the glass, the window sliding behind it
    return { pos: [mix(9, 11, u), 1.5, mix(-30, -26, u)], target: [mix(13, 14, u), 1.5, 60], fov: 40, roll: 0 };
  };
  return {
    name: 's18-sight', from: P.from, to: P.to,
    frag: FRAG,
    uniforms: { ...ESC_UNIFORMS, uGr: GR, uAper: 0.4, uFocus: 36, uAmb: L(60, 64, 80, 1.0), uFillDir: [0.3, 0.6, -0.75], uHaze: L(70, 78, 100, 0.5), uHazeD: 0.004, uDust: 1.0 },
    camera: cam,
    update(t, u) {
      const st = stepAt(t), n = stepIdx(t);
      const prog = clamp01((st - P.from) / D);
      const x = mix(2, 36, prog);
      const r = runPose(t, { x, y: gy(x), scale: 0.22, lean: 0.3 });
      u.uFig.value = pose(r.pose);
      u.uCloak.value = 0.85;
      u.uCloakPh.value = n * 1.1;
      u.uBoil.value = n;
      // the sand runs on twos: the top empties over the scene (not quite all of it)
      u.uK.value = [0.1 + 0.85 * prog, 0.12 * Math.max(0, slam(t)), (n % 4) * 1.7, 0, 0, 0, 0, 0];
      // rack focus: on the glass, then out to the window as Ehud reaches the ridge
      const rf = clamp01((t - (P.from + 2.8)) / 1.2);
      u.uFocus.value = mix(36, 88, ease.inOut3(rf));
      u.uAper.value = mix(0.4, 0.25, rf);
      const fk = flicker(t, 1.3);
      u.uL.value = packLights([
        { dir: [0.35, 0.4, 0.85], col: L(190, 205, 235, 2.2), rad: 1 },                  // the moon, through the window
        { pos: [-6, -6, 2], col: L(255, 175, 110, 7.0 * fk), rad: 0.8, range: 11 },        // a candle off to the left, low
        { dir: [0.3, 0.6, -0.75], col: L(140, 150, 185, 0.35), rad: 2 },
        { pos: [x - 1, gy(x) + 5, 67], col: L(200, 215, 245, 1.2), rad: 1, range: 10 },   // moon rim on the runner
        { pos: [22, 30, 50], col: L(180, 195, 235, 6.0), rad: 3, range: 45 },              // window light spilling into the room
      ]);
      u.uLN.value = 5;
    },
    post(t) { return grade(t, { exposure: 1.45, bloom: 0.16, threshold: 0.9, vignette: 0.55, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.012, 0.012, 0.025], highlights: [1.0, 0.95, 0.88], amount: 0.4 } }; },
  };
};
