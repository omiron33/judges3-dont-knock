// s15-boys · "That's what the palace boys kept saying" (64.42-66.73). The three guards in a row
// before the gold door, fingers to their lips, nodding together on every beat; the camera slides
// along the row.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { stepT } from '/song/lib/paper.js';
import { DOOR_GLSL, DOOR_UNIFORMS, setFigs, doorLights, skyCol, TONES, jit } from '/song/lib/x-door.js';

export const kind = 'shader';
const FLOOR = -13.5;
const NODS = [64.71, 65.26, 65.8, 66.35];

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    return { pos: [mix(-18, -4, e), 11, -40], target: [mix(-12, -2, e), 7.5, 40], fov: 30 };
  };
  // a nod: down sharply on the beat, back up over the half beat
  const nod = (t) => { let n = 0; for (const b of NODS) { const x = t - b + 0.04; if (x >= 0 && x < 0.5) n = Math.max(n, x < 0.12 ? x / 0.12 : Math.max(0, 1 - (x - 0.12) / 0.3)); } return n; };
  return {
    name: 's15-boys', from: P.from, to: P.to,
    frag: DOOR_GLSL,
    uniforms: { ...DOOR_UNIFORMS, uAper: 0.35, uFocus: 70, uFillSoft: 6, uAmb: [0.03, 0.028, 0.03], uFillDir: [0.3, 0.5, -0.8], uHaze: [0.01, 0.01, 0.014], uHazeD: 0.002, uDust: 1.0, uVol: 0.015 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      const step = Math.floor((t + 1 / 120) * 12);
      const g = (k, x, tone, sc, spear) => {
        const n = nod(s - k * 0.04);
        return {
          pose: { x, y: FLOOR, scale: sc, face: 1, lean: 0.04 - 0.07 * n + jit(step, k, 0.012), head: 0.02 - 0.24 * n + jit(step, k + 5, 0.02),
            sh: -1.1 + 0.05 * n, el: -2.5 + 0.08 * n, fsh: -0.5, fel: -0.85, sway: 0.0, style: 5 },
          tone, b: spear ? { type: 1, ang: 0.05 - 0.03 * k } : null,
        };
      };
      setFigs(u, [g(0, -4.5, TONES.guard, 1.15, true), g(1, -11.5, TONES.guard2, 1.12, true), g(2, -18.5, TONES.guard3, 1.1, true)]);
      u.uCandle.value = 0.86 - 0.04 * clamp01((t - P.from) / (P.to - P.from));
      u.uFlame.value = 0.92 + 0.1 * Math.sin(t * 11.0);
      u.uSky.value = skyCol(0);
      doorLights(t, u, { candle: u.uCandle.value });
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.16, threshold: 0.9, vignette: 0.55, grain: 0.02 }); },
    finish() { return { grade: { shadows: [0.012, 0.01, 0.018], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
