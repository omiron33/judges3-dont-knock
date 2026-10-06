// s36-boys3 · "That's what the palace boys kept saying" (142.35-144.67). The whole staff in a row
// before the gold door: the three guards with fingers to their lips, the scribe with his tablet and
// the servant with the figs, all nodding together on the beats.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { stepT } from '/song/lib/paper.js';
import { DOOR_GLSL, DOOR_UNIFORMS, setFigs, doorLights, skyCol, TONES, jit } from '/song/lib/x-door.js';

export const kind = 'shader';
const FLOOR = -13.5;
const NODS = [142.63, 143.18, 143.73, 144.28];

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    return { pos: [mix(-15, -9, e), 12, mix(-60, -56, e)], target: [mix(-12, -8, e), 9.5, 40], fov: 35 };
  };
  const nod = (t) => { let n = 0; for (const b of NODS) { const x = t - b + 0.04; if (x >= 0 && x < 0.5) n = Math.max(n, x < 0.12 ? x / 0.12 : Math.max(0, 1 - (x - 0.12) / 0.3)); } return n; };
  return {
    name: 's36-boys3', from: P.from, to: P.to,
    frag: DOOR_GLSL,
    uniforms: { ...DOOR_UNIFORMS, uAper: 0.3, uFocus: 86, uFillSoft: 6, uAmb: [0.03, 0.028, 0.03], uFillDir: [0.3, 0.5, -0.8], uHaze: [0.01, 0.01, 0.014], uHazeD: 0.002, uDust: 1.0, uVol: 0.015 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      const step = Math.floor((t + 1 / 120) * 12);
      const g = (k, x, tone, sc) => {
        const n = nod(s - k * 0.03);
        return {
          pose: { x, y: FLOOR, scale: sc, face: 1, lean: 0.04 - 0.07 * n + jit(step, k, 0.012), head: 0.02 - 0.24 * n + jit(step, k + 5, 0.02),
            sh: -1.1 + 0.05 * n, el: -2.5 + 0.08 * n, fsh: -0.5, fel: -0.85, sway: 0, style: 5 },
          tone, b: { type: 1, ang: 0.05 - 0.03 * k },
        };
      };
      const ns = nod(s - 0.12), nv = nod(s - 0.15);
      const scribe = {
        pose: { x: -21.5, y: FLOOR, scale: 1.08, face: 1, lean: 0.02 - 0.08 * ns + jit(step, 8, 0.012), head: -0.05 - 0.26 * ns, sh: -0.75, el: -1.5, fsh: -1.1, fel: -2.4, sway: 0, style: 1 },
        tone: TONES.scribe, a: { type: 5, ang: -0.25, s: 1.0 },
      };
      const servant = {
        pose: { x: -28.5, y: FLOOR, scale: 1.05, face: 1, lean: -0.04 - 0.1 * nv + jit(step, 9, 0.012), head: 0.04 - 0.26 * nv, sh: -0.6, el: -1.9, fsh: -0.3, fel: -0.5, sway: 0, style: 2 },
        tone: TONES.servant, a: { type: 2, ang: 0.08 * nv },
      };
      setFigs(u, [g(0, -1.0, TONES.guard, 1.15), g(1, -7.8, TONES.guard2, 1.12), g(2, -14.6, TONES.guard3, 1.1), scribe, servant]);
      u.uCandle.value = 0.7; u.uFlame.value = 0.92 + 0.1 * Math.sin(t * 11.0);
      u.uSky.value = skyCol(0);
      doorLights(t, u, { candle: 0.7 });
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.16, threshold: 0.9, vignette: 0.55, grain: 0.02 }); },
    finish() { return { grade: { shadows: [0.012, 0.01, 0.018], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
