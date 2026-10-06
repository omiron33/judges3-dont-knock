// s21-key · "They waited till it got embarrassing, / Then somebody fetched the key." (87.75-92.15).
// Time passing: the window goes from moonlight to dawn, the candle burns to a stub, the guards
// shuffle and lean on their spears; one runs off left and comes back with a huge brass key, which
// he hoists high on "key".
import { grade, ease, clamp01, mix, spring } from '/song/lib/look.js';
import { stepT } from '/song/lib/paper.js';
import { DOOR_GLSL, DOOR_UNIFORMS, setFigs, doorLights, skyCol, TONES, jit } from '/song/lib/x-door.js';

export const kind = 'shader';
const FLOOR = -13.5;

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    return { pos: [mix(-2, -6, e), 13, mix(-62, -56, e)], target: [mix(0, -4, e), 11, 40], fov: 34 };
  };
  return {
    name: 's21-key', from: P.from, to: P.to,
    frag: DOOR_GLSL,
    uniforms: { ...DOOR_UNIFORMS, uAper: 0.3, uFocus: 88, uFillSoft: 6, uAmb: [0.03, 0.028, 0.03], uFillDir: [0.3, 0.5, -0.8], uHaze: [0.01, 0.01, 0.014], uHazeD: 0.002, uDust: 1.0, uVol: 0.02 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      const step = Math.floor((t + 1 / 120) * 12);
      const e = clamp01((t - P.from) / (P.to - P.from));
      const dawn = ease.inOut3(clamp01((t - P.from) / 3.6));
      // two guards shuffle in place: weight shifts, slumps, a yawn
      const A = {
        pose: { x: -1, y: FLOOR, scale: 1.15, face: 1, lean: 0.06 + 0.05 * Math.sin(s * 3.1) + jit(step, 1, 0.012), head: -0.15 + 0.15 * Math.sin(s * 2.3),
          sh: 0.15, el: -0.3, fsh: -0.5, fel: -0.85, sway: 0.12 * Math.sin(s * 4.4), style: 5 },
        tone: TONES.guard, b: { type: 1, ang: 0.15 + 0.05 * Math.sin(s * 3.1) },
      };
      const yawn = Math.max(0, Math.sin(clamp01((s - 88.3) / 1.0) * Math.PI));
      const Bp = {
        pose: { x: -8, y: FLOOR, scale: 1.12, face: 1, lean: 0.1 * yawn + jit(step, 2, 0.012), head: 0.35 * yawn - 0.12, sh: mix(0.1, -2.9, yawn), el: mix(-0.3, -0.6, yawn), fsh: -0.5, fel: -0.85, sway: 0.1 * Math.sin(s * 3.3 + 1), style: 5 },
        tone: TONES.guard2, b: { type: 1, ang: -0.12 },
      };
      // the third runs off left (on "embarrassing") and back with the key
      let x = -15, face = 1, sway = 0.08 * Math.sin(s * 3.7), lean = 0, sh = 0.1, el = -0.3, keyUp = 0, key = false;
      if (s >= 89.3 && s < 90.15) { const k = clamp01((s - 89.3) / 0.85); x = mix(-15, -50, k * k); face = -1; sway = 0.5 * Math.sin(s * 15); lean = -0.2; }
      else if (s >= 90.15 && s < 90.55) { x = -60; }
      else if (s >= 90.55) {
        const k = ease.out3(clamp01((s - 90.55) / 0.85));
        x = mix(-50, -16, k); face = 1; key = true;
        sway = k < 1 ? 0.45 * Math.sin(s * 15) : 0; lean = k < 1 ? -0.15 : 0;
        keyUp = spring(s, 91.45, 0.35, 0.3);
        sh = mix(-1.3, -2.85, keyUp); el = mix(-1.2, -0.2, keyUp);
      }
      const C = {
        pose: { x, y: FLOOR, scale: 1.1, face, lean: lean + jit(step, 3, 0.015), head: 0.2 * keyUp, sh, el, fsh: -0.5, fel: -0.85, sway, style: 5 },
        tone: TONES.guard3, b: { type: 1, ang: -0.05 * face },
        a: key ? { type: 3, ang: mix(-1.2, 0.0, keyUp) * face, s: 1.0 } : null,
      };
      setFigs(u, [A, Bp, C]);
      u.uCandle.value = mix(0.36, 0.06, ease.inOut3(e));
      u.uFlame.value = mix(0.95, 0.55, e) + 0.1 * Math.sin(t * 11.0);
      u.uSky.value = skyCol(dawn);
      doorLights(t, u, { candle: u.uCandle.value, dawn, flick: mix(1, 0.6, e) });
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.16, threshold: 0.9, vignette: 0.55, grain: 0.02 }); },
    finish() { return { grade: { shadows: [0.012, 0.01, 0.018], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
