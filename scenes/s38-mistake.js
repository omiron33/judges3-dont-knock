// s38-mistake · "Don't knock, he's busy! That was their mistake:" (146.74-151.40). The doors stand
// open on the empty summer room (the crown on the floor by the robe); the guards with the key stare
// in and freeze on "busy!", turn and look at each other on the beats, and on "mistake" their heads
// snap round (a replacement head, as stop-motion does it) to look straight out at us.
import { grade, ease, clamp01, mix, spring } from '/song/lib/look.js';
import { stepT, packLights, L } from '/song/lib/paper.js';
import { DOOR_GLSL, DOOR_UNIFORMS, setFigs, TONES, jit } from '/song/lib/x-door.js';

export const kind = 'shader';
const FLOOR = -13.5;
const FREEZE = 147.56, LOOK1 = 148.12, LOOK2 = 148.66, BACK = 149.21, OUT = 150.6;

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    return { pos: [mix(3, 4, e), mix(10, 7, e), mix(-58, -40, e)], target: [mix(4, 4, e), mix(6, 4.5, e), 40], fov: 33 };
  };
  return {
    name: 's38-mistake', from: P.from, to: P.to,
    frag: DOOR_GLSL,
    uniforms: { ...DOOR_UNIFORMS, uRoom: 1, uOpenL: 1.1, uOpenR: 1.08, uCrown: [3.4, 0.28], uAper: 0.3, uFocus: 80, uFillSoft: 6, uAmb: [0.03, 0.028, 0.03], uFillDir: [0.3, 0.5, -0.8], uHaze: [0.01, 0.01, 0.014], uHazeD: 0.002, uDust: 1.2, uVol: 0.02 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      const step = Math.floor((t + 1 / 120) * 12);
      const c = cam(t);
      u.uFocus.value = 29 - c.pos[2];
      const frozen = s >= FREEZE && s < LOOK1;
      const w = (k, a) => (frozen ? 0 : jit(step, k, a));
      const out = s >= OUT;
      const pop = spring(s, OUT, 0.25, 0.4);
      // A (left, nearest the door) and B behind him look in; C on the right holds the key
      const lookA = s >= LOOK1 && s < BACK ? -1 : 1;     // A turns to B
      const lookC = s >= LOOK2 ? 1 : -1;                // C turns away from the room to them
      const A = { x: -5.5, y: FLOOR, scale: 1.15, face: out ? 1 : lookA, lean: (frozen ? -0.12 : -0.06) + w(1, 0.012), head: out ? 0 : -0.1, sh: 0.15, el: -0.35, fsh: -0.5, fel: -0.85, sway: 0, style: 5 };
      const Bp = { x: -12.5, y: FLOOR, scale: 1.12, face: 1, lean: (frozen ? -0.18 : -0.05) + w(2, 0.012), head: out ? 0 : (s >= LOOK1 && s < BACK ? 0.0 : -0.12), sh: 0.15, el: -0.35, fsh: -0.5, fel: -0.85, sway: 0, style: 5 };
      const Cp = { x: 21, y: FLOOR, scale: 1.12, face: out ? -1 : lookC, lean: (frozen ? -0.15 : -0.05) + w(3, 0.012), head: out ? 0 : -0.08, sh: -1.2, el: -0.9, fsh: -0.5, fel: -0.85, sway: 0, style: 5 };
      const fr = (p) => (out ? { ...p, head: 0.04 * pop } : p);
      setFigs(u, [
        { pose: fr(A), tone: TONES.guard, b: { type: 1, ang: 0.06 * A.face }, front: out },
        { pose: fr(Bp), tone: TONES.guard2, b: { type: 1, ang: 0.04 }, front: out },
        { pose: fr(Cp), tone: TONES.guard3, a: { type: 3, ang: 0.15 * Cp.face, s: 0.8 }, b: { type: 1, ang: -0.05 * Cp.face }, front: out },
      ]);
      u.uCandle.value = 0.05; u.uFlame.value = 0.6;
      u.uDawn.value = 1; u.uSky.value = [0.5, 0.32, 0.22];
      const fl = 0.95 + 0.05 * Math.sin(t * 11);
      const lights = [
        // dawn through the summer room's windows, out through the open doors
        { pos: [8, 0, 84], col: L(230, 195, 200, 5.0), rad: 4, range: 30 },
        { pos: [6, 2, 47], col: L(240, 190, 160, 1.6), rad: 3, range: 22 },
        // the candle-stub's last glow and the window, on the guards
        { pos: [-25, -4, 31.5], col: L(255, 140, 60, 1.0 * fl), rad: 1.2, range: 20 },
        { pos: [31, 2, 36.0], col: L(240, 200, 170, 4.0), rad: 2.5, range: 22 },
        { dir: [-0.3, 0.4, -0.87], col: [0.14, 0.12, 0.1], rad: 4 },
      ];
      u.uL.value = packLights(lights); u.uLN.value = lights.length;
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.16, threshold: 0.9, vignette: 0.55, grain: 0.02 }); },
    finish() { return { grade: { shadows: [0.012, 0.01, 0.018], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
