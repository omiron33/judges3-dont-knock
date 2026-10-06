// s19-relieving · "One guard said, 'He's relieving himself.' / The others said, 'Fair enough.'"
// (78.97-83.36). At the door the front guard turns and whispers behind his hand; the other two lean
// in to listen, straighten, nod sagely on the beats and step back from the door.
import { grade, ease, clamp01, mix, spring } from '/song/lib/look.js';
import { stepT } from '/song/lib/paper.js';
import { DOOR_GLSL, DOOR_UNIFORMS, setFigs, doorLights, skyCol, TONES, jit } from '/song/lib/x-door.js';

export const kind = 'shader';
const FLOOR = -13.5;
const NODS = [82.27, 82.82];

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    return { pos: [mix(-6, -4, e), 11, mix(-44, -36, e)], target: [mix(-6, -3, e), 6.5, 40], fov: 32 };
  };
  const nod = (t) => { let n = 0; for (const b of NODS) { const x = t - b + 0.04; if (x >= 0 && x < 0.5) n = Math.max(n, x < 0.12 ? x / 0.12 : Math.max(0, 1 - (x - 0.12) / 0.3)); } return n; };
  return {
    name: 's19-relieving', from: P.from, to: P.to,
    frag: DOOR_GLSL,
    uniforms: { ...DOOR_UNIFORMS, uAper: 0.35, uFocus: 72, uFillSoft: 6, uAmb: [0.03, 0.028, 0.03], uFillDir: [0.3, 0.5, -0.8], uHaze: [0.01, 0.01, 0.014], uHazeD: 0.002, uDust: 1.0, uVol: 0.015 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      const step = Math.floor((t + 1 / 120) * 12);
      // the whisper: the front guard turns round on twos, cups his hand, leans in
      const turn = s >= 79.25 ? -1 : 1;
      const lean = spring(s, 79.3, 0.35, 0.3) * (1 - ease.inOut3(clamp01((s - 81.1) / 0.4)));
      const listen = spring(s, 79.5, 0.4, 0.3) * (1 - ease.inOut3(clamp01((s - 81.3) / 0.4)));
      const back = ease.inOut3(clamp01((s - 82.3) / 0.9));
      const n = nod(s);
      const stride = back > 0 && back < 1 ? 0.3 * Math.sin(s * 10.0) : 0;
      const A = {
        pose: { x: -0.5 - 1.2 * lean, y: FLOOR, scale: 1.15, face: turn, lean: -0.22 * lean + jit(step, 1, 0.012), head: -0.08 * lean - 0.2 * n + 0.08 * Math.sin(s * 9.0) * lean,
          sh: mix(-0.1, -1.1, lean), el: mix(-0.3, -2.5, lean), fsh: -0.5, fel: -0.85, sway: 0, style: 5 },
        tone: TONES.guard, b: { type: 1, ang: 0.05 * turn },
      };
      const Bp = {
        pose: { x: -8 - 2.6 * back, y: FLOOR, scale: 1.12, face: 1, lean: -0.25 * listen + jit(step, 2, 0.012), head: 0.12 * listen - 0.28 * n,
          sh: mix(0.1, 0.25, listen), el: -0.4, fsh: -0.5, fel: -0.85, sway: stride, style: 5 },
        tone: TONES.guard2, b: { type: 1, ang: 0.03 - 0.1 * listen },
      };
      const C = {
        pose: { x: -14.5 + 1.0 * listen - 2.8 * back, y: FLOOR, scale: 1.1, face: 1, lean: -0.32 * listen + jit(step, 3, 0.012), head: 0.16 * listen - 0.28 * nod(s - 0.08),
          sh: mix(0.1, -0.3, listen), el: mix(-0.3, -1.4, listen), fsh: -0.5, fel: -0.85, sway: -stride, style: 5 },
        tone: TONES.guard3, b: { type: 1, ang: -0.04 - 0.12 * listen },
      };
      setFigs(u, [A, Bp, C]);
      const e = clamp01((t - P.from) / (P.to - P.from));
      u.uCandle.value = mix(0.6, 0.5, e);
      u.uFlame.value = 0.92 + 0.1 * Math.sin(t * 11.0);
      u.uSky.value = skyCol(0.12 + 0.05 * e);
      doorLights(t, u, { candle: u.uCandle.value, dawn: 0.12 + 0.05 * e });
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.16, threshold: 0.9, vignette: 0.55, grain: 0.02 }); },
    finish() { return { grade: { shadows: [0.012, 0.01, 0.018], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
