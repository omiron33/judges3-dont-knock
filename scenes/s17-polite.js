// s17-polite · "Don't knock, he's busy! Ain't it nice to be polite?" (68.80-73.48). The guards bow
// politely to the closed door and freeze there on "busy!"; a servant shuffles in on twos with a tray
// of figs and waits behind them; on "polite?" all four bow again. The candle in its niche burns down.
import { grade, ease, clamp01, mix, spring } from '/song/lib/look.js';
import { stepT } from '/song/lib/paper.js';
import { DOOR_GLSL, DOOR_UNIFORMS, setFigs, doorLights, skyCol, TONES, jit } from '/song/lib/x-door.js';

export const kind = 'shader';
const FLOOR = -13.5;
const BOW1 = 69.1, FREEZE = 69.64, UP = 70.74, BOW2 = 72.39;

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    return { pos: [mix(-14, -6, e), 13, mix(-60, -54, e)], target: [mix(-9, -4, e), 10.5, 40], fov: 34 };
  };
  return {
    name: 's17-polite', from: P.from, to: P.to,
    frag: DOOR_GLSL,
    uniforms: { ...DOOR_UNIFORMS, uAper: 0.3, uFocus: 86, uFillSoft: 6, uAmb: [0.03, 0.028, 0.03], uFillDir: [0.3, 0.5, -0.8], uHaze: [0.01, 0.01, 0.014], uHazeD: 0.002, uDust: 0.9, uVol: 0.015 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      const step = Math.floor((t + 1 / 120) * 12);
      // the bow: down on the hit, held (frozen) until the guitar lets them up, then down again
      const sT = s >= FREEZE && s < UP ? FREEZE : s;
      const b1 = clamp01((sT - BOW1) / 0.4) * (1 - ease.inOut3(clamp01((sT - UP) / 0.5)));
      const b2 = spring(sT, BOW2, 0.4, 0.25) * (1 - ease.inOut3(clamp01((sT - BOW2 - 0.75) / 0.5)) * 0.3);
      const bow = Math.max(b1, b2);
      const frozen = s >= FREEZE && s < UP;
      const w = (k, a) => (frozen ? 0 : jit(step, k, a));
      const g = (k, x, tone, sc) => ({
        pose: { x, y: FLOOR, scale: sc, face: 1, lean: -0.55 * bow + w(k, 0.012), head: -0.3 * bow + w(k + 7, 0.02),
          sh: mix(0.1, -0.15, bow), el: mix(-0.3, -2.1, bow), fsh: -0.5 + 0.3 * bow, fel: -0.85, sway: 0, style: 5 },
        tone, b: { type: 1, ang: 0.05 - 0.03 * k - 0.35 * bow },
      });
      // the servant shuffles in from the left, stops behind the guards and waits; bows with them at the end
      const walk = clamp01((s - 70.0) / 1.7);
      const sx = mix(-46, -24.0, ease.out3(walk));
      const stride = walk > 0 && walk < 1 ? 0.35 * Math.sin(s * 9.5) : 0;
      const sb = spring(sT, BOW2 + 0.1, 0.4, 0.25) * 0.6;
      const servant = {
        pose: { x: sx, y: FLOOR + Math.abs(stride) * 0.2, scale: 1.05, face: 1, lean: -0.08 - 0.35 * sb + jit(step, 9, 0.015), head: 0.05 - 0.25 * sb + (walk >= 1 ? 0.06 * Math.sin(s * 2.0) : 0),
          sh: -0.6, el: -1.9, fsh: -0.2 + 0.4 * stride, fel: -0.4, sway: stride, style: 2 },
        tone: TONES.servant, a: { type: 2, ang: 0.35 * sb },
      };
      setFigs(u, [g(0, -0.5, TONES.guard, 1.15), g(1, -7.0, TONES.guard2, 1.12), g(2, -13.5, TONES.guard3, 1.1), servant]);
      const e = clamp01((t - P.from) / (P.to - P.from));
      u.uCandle.value = mix(0.8, 0.66, e);
      u.uFlame.value = 0.92 + 0.1 * Math.sin(t * 11.0);
      u.uSky.value = skyCol(0.05 * e);
      doorLights(t, u, { candle: u.uCandle.value, dawn: 0.05 * e });
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.16, threshold: 0.9, vignette: 0.55, grain: 0.02 }); },
    finish() { return { grade: { shadows: [0.012, 0.01, 0.018], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
