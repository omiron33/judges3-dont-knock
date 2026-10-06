// s07-secret · "With a double-edged little secret riding on his right-hand hip." (29.6-33.98).
// Close on Ehud's tunic. On "double-edged" the paper layer of the tunic starts to peel back from the
// hem corner, a step at a time like a hand working it, tearing along the fold and showing its pale
// lining; under it, strapped along his thigh, the double-edged dagger of tarnished foil. On the
// stop-time hit a glint runs down the blade from guard to point (and a smaller one on the next).
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { L, stepT, packLights, flicker } from '/song/lib/paper.js';
import { slam } from '/song/lib/sync.js';
import { THIGH_GLSL, THIGH_UNIFORMS } from '/song/lib/x-throne-thigh.js';

export const kind = 'shader';
const T_PEEL = 30.14, T_SECRET = 31.06, T_HIP = 32.34, G1 = 32.91, G2 = 33.46;

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    return { pos: [mix(3.2, 4.6, e), mix(4.6, 4.2, e), mix(-30, -25, e)], target: [mix(3.6, 4.4, e), mix(4.2, 3.9, e), 2], fov: 34, roll: mix(0.015, -0.01, e) };
  };
  return {
    name: 's07-secret', from: P.from, to: P.to,
    frag: THIGH_GLSL,
    uniforms: { ...THIGH_UNIFORMS, uAper: 0.45, uFocus: 30, uAmb: L(70, 66, 66, 1.2), uFillDir: [0.35, 0.5, -0.8], uFillSoft: 5, uDust: 1.4, uBg: [0.004, 0.004, 0.005] },
    camera: cam,
    update(t, u) {
      u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      const s = stepT(t);
      // the peel: in hand-placed steps (on twos), a pull on "double-edged", more on "secret", the rest by "hip"
      const a = ease.out3(clamp01((s - T_PEEL + 0.05) / 0.5)) * 11;
      const b = ease.out3(clamp01((s - T_SECRET) / 0.6)) * 6;
      const c = ease.inOut3(clamp01((s - (T_HIP - 0.7)) / 0.8)) * 5;
      u.uPeel.value = a + b + c + (a > 0.1 ? 0.15 * Math.sin(s * 5) : 0);
      // the glint on the hit: a bright bead running guard to point in 0.35 s
      const g1 = clamp01((t - G1) / 0.35), g2 = clamp01((t - G2) / 0.3);
      const on1 = t >= G1 && t < G1 + 0.45, on2 = t >= G2 && t < G2 + 0.4;
      u.uGlint.value = on2 ? [g2 * 1.1, 0.6 * Math.sin(Math.PI * g2)] : on1 ? [g1 * 1.15, 1.6 * Math.sin(Math.PI * Math.min(1, g1 * 1.1))] : [0, 0];
      const c0 = cam(t);
      // rack focus: on the tunic while it peels, onto the blade at the glint
      u.uFocus.value = mix(0.5, 1.1, clamp01((t - 31.8) / 0.6)) - c0.pos[2];
      const fl = flicker(t, 3.3);
      const gl = Math.max(slam(t, [G1], 0.4), 0.5 * slam(t, [G2], 0.4));
      u.uL.value = packLights([
        { pos: [-14, 6, -8], col: L(255, 200, 150, 8 * fl), rad: 1.2, range: 18 },            // the candle, low left, raking across the cloth
        { dir: [0.5, 0.35, 0.79], col: L(150, 170, 220, 1.4), rad: 1.5 },                       // moonlight from behind right: the rim
        { pos: [mix(3, 6, clamp01((t - G1) / 0.4)), 8, -6], col: L(255, 240, 210, 22 * gl), rad: 0.6, range: 12 },   // the glint's light
        { pos: [-18, 10, 26], col: L(255, 150, 70, 6 * fl), rad: 0.6, range: 10 },             // a candle far back in the room
      ]);
      u.uLN.value = 4;
    },
    post(t) { return grade(t, { exposure: 1.3, bloom: 0.16, threshold: 0.9, vignette: 0.6, grain: 0.024 }); },
    finish() { return { grade: { shadows: [0.012, 0.01, 0.012], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
