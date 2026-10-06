// s14-knock · "Don't knock, he's busy! Give the king a little time." (59.98-64.42). Chorus 1: outside
// the locked gold doors three guards; the front one raises his knuckles to knock, the other two
// grab his arm; on "busy!" they all freeze; on "Give the king a little time" they ease his arm down
// together, nodding on the beats.
import { grade, ease, clamp01, mix, spring } from '/song/lib/look.js';
import { stepT } from '/song/lib/paper.js';
import { DOOR_GLSL, DOOR_UNIFORMS, setFigs, doorLights, skyCol, TONES } from '/song/lib/x-door.js';

export const kind = 'shader';
const FREEZE = 60.85, THAW = 62.51;
const NODS = [62.51, 63.06, 63.61, 64.16];

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    return { pos: [mix(-2, 0, e), 13.5, mix(-66, -58, e)], target: [mix(-1, 1, e), 11.5, 40], fov: 34 };
  };
  const nod = (t) => { let n = 0; for (const b of NODS) { const x = t - b; if (x >= 0 && x < 0.5) n += Math.sin((x / 0.5) * Math.PI) * 0.22; } return n; };
  return {
    name: 's14-knock', from: P.from, to: P.to,
    frag: DOOR_GLSL,
    uniforms: { ...DOOR_UNIFORMS, uAper: 0.3, uFocus: 92, uFillSoft: 6, uAmb: [0.03, 0.028, 0.03], uFillDir: [0.3, 0.5, -0.8], uHaze: [0.01, 0.01, 0.014], uHazeD: 0.002, uDust: 0.8, uVol: 0.015 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      // frozen: the step holds still on the stop-time hit
      const sT = s >= FREEZE && s < THAW ? FREEZE : s;
      const raise = ease.out3(clamp01((sT - P.from - 0.05) / 0.55));
      const grab = spring(sT, FREEZE - 0.2, 0.35, 0.3);
      const lower = ease.inOut3(clamp01((sT - THAW) / 1.6));
      const n = sT >= THAW ? nod(sT) : 0;
      const b = (k) => (sT >= FREEZE && sT < THAW ? 0 : 0.015 * Math.sin(s * 37.0 + k * 11.0));
      const A = {
        pose: { x: -5.0 - 0.6 * grab, y: FLOOR, scale: 1.15, face: 1, lean: mix(0.0, 0.12, grab) + b(1), head: -0.05 + mix(0, -0.3, grab * (1 - lower)) - n,
          sh: mix(mix(-0.2, -2.25, raise), -0.5, lower), el: mix(mix(-0.3, -1.0, raise), -0.2, lower), fsh: -0.5, fel: -0.9, sway: 0.0, style: 5 },
        tone: TONES.guard, b: { type: 1, ang: 0.06 },
      };
      const Bp = {
        pose: { x: -11.5 + 1.6 * grab, y: FLOOR, scale: 1.12, face: 1, lean: mix(0.0, -0.18, grab) * (1 - 0.6 * lower) + b(2), head: mix(0.0, 0.15, grab) - n,
          sh: mix(0.15, -1.8, grab) * (1 - 0.4 * lower), el: mix(-0.3, 0.05, grab), fsh: mix(-0.1, -0.9, grab), fel: -0.4, sway: mix(0.0, 0.3, grab) * (1 - lower), style: 5 },
        tone: TONES.guard2,
      };
      const C = {
        pose: { x: -18.5 + 1.6 * grab, y: FLOOR, scale: 1.1, face: 1, lean: mix(0.0, -0.3, grab) * (1 - 0.6 * lower) + b(3), head: mix(0.0, 0.2, grab) - n,
          sh: mix(0.1, -1.7, grab) * (1 - 0.3 * lower), el: mix(-0.2, -0.1, grab), fsh: -0.55, fel: -0.85, sway: mix(0.0, -0.35, grab) * (1 - lower), style: 5 },
        tone: TONES.guard3, b: { type: 1, ang: -0.05 },
      };
      setFigs(u, [A, Bp, C]);
      u.uCandle.value = 0.95 - 0.08 * clamp01((t - P.from) / (P.to - P.from));
      u.uFlame.value = 0.9 + 0.12 * Math.sin(t * 11.0) * (sT === FREEZE ? 0.2 : 1);
      u.uDawn.value = 0; u.uSky.value = skyCol(0);
      doorLights(t, u, { candle: u.uCandle.value });;
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.16, threshold: 0.9, vignette: 0.55, grain: 0.02 }); },
    finish() { return { grade: { shadows: [0.012, 0.01, 0.018], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
const FLOOR = -13.5;
