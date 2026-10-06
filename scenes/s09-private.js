// s09-private · "I got a private word for His Majesty, / If he'll kindly clear the floor." (38.37-42.76).
// Back in the summer room: Ehud bows low before the throne on "private"; Eglon leans forward,
// intrigued, then preens on "Majesty"; the courtiers behind prick up their heads on the drum hit. On
// "clear the floor" the king flicks his fingers at the room.
import { grade, ease, clamp01, mix, spring } from '/song/lib/look.js';
import { L, stepT, packLights } from '/song/lib/paper.js';
import { KICKS, slam } from '/song/lib/sync.js';
import { THRONE_GLSL, THRONE_UNIFORMS, ROOM, TONES, OFF, roomLights, setTones, pose } from '/song/lib/x-throne.js';

export const kind = 'shader';
const T_PRIV = 38.9, T_MAJ = 40.0, T_CLEAR = 41.6, T_FLOOR = 42.02;

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    return { pos: [mix(14, 11, e), mix(7, 8, e), mix(-25, -18, e)], target: [mix(12.5, 10, e), mix(4, 5.5, e), 30], fov: 36, roll: 0 };
  };
  return {
    name: 's09-private', from: P.from, to: P.to,
    frag: THRONE_GLSL,
    uniforms: { ...THRONE_UNIFORMS, uAper: 0.45, uFocus: 40, uAmb: L(70, 72, 85, 2.0), uFillDir: [0.3, 0.55, -0.78], uFillSoft: 7, uHaze: L(30, 34, 48, 0.5), uHazeD: 0.002, uDust: 1.2, uVol: 0.0, uVolTint: [0.8, 0.9, 1.15], uDrape: [-80, 80], uGround: -14, uWin: [1, 0.35, 0.3], uCand: [1, 0],
      uLay: [0, 1, 1, 0, 9, 9, 2], uCarry: [0, 5.5, 0, 4, 0, 0, 0] },
    camera: cam,
    update(t, u) {
      u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      const s = stepT(t);
      const F = ROOM.floor;
      // Ehud bows low on "private" and holds it, rising a little on "Majesty"
      const bow = ease.inOut3(clamp01((s - T_PRIV + 0.1) / 0.3)) * (1 - 0.35 * clamp01((s - T_MAJ) / 0.4));
      const ask = clamp01((s - T_CLEAR) / 0.3);
      u.uF0.value = pose({ x: 17, y: F, scale: 0.95, face: -1, lean: 0.62 * bow + 0.05, head: 0.2 * bow - 0.1 * ask, sh: -0.2 - 0.6 * bow + 0.3 * ask, el: -0.4 - 0.9 * ask, fsh: 0.3 * bow, fel: -0.3, sway: 0.1, style: 2 });
      // the king: leans in, intrigued; preens on "Majesty"; flicks his fingers on "clear the floor"
      const lean = ease.out3(clamp01((s - T_PRIV - 0.2) / 0.5));
      const preen = spring(s, T_MAJ, 0.4, 0.3) * (1 - clamp01((s - T_MAJ - 1.0) / 0.4));
      const flick = slam(s, [T_FLOOR], 0.4);
      u.uF6.value = pose({ x: ROOM.throneX - 0.4, y: F - 1.2, scale: 1.15, face: 1, lean: 0.22 * lean - 0.18 * preen, head: 0.12 * lean - 0.3 * preen,
        sh: mix(-0.5, -1.4, preen) - 0.4 * flick, el: mix(-1.2, -1.6, preen) + 0.8 * flick, fsh: -0.2, fel: -0.6, sway: 0, style: 4 });
      // courtiers prick up their heads on the hit, and look round at "clear the floor"
      const prick = spring(s, KICKS.find((k) => k > T_PRIV) ?? T_PRIV + 0.05, 0.3, 0.4);
      const look = clamp01((s - T_FLOOR - 0.1) / 0.2);
      u.uF1.value = pose({ x: 25, y: F, scale: 1.0, face: -1, lean: -0.04 + 0.06 * prick, head: mix(0.15, -0.2, prick) + 0.3 * look, sh: 0.1, el: -1.45, fsh: 0.1, fel: -0.3, sway: 0.06, style: 5 });
      u.uF2.value = pose({ x: 31, y: F, scale: 0.92, face: -1, lean: 0.08 * prick, head: mix(0.2, -0.15, prick) + 0.25 * look, sh: 0.05, el: -0.7, fsh: 0.1, fel: -0.5, sway: -0.08, style: 3 });
      u.uF3.value = pose({ x: -4.5, y: F, scale: 0.92, face: 1, lean: 0.1 + 0.08 * prick, head: mix(0.3, 0.0, prick), sh: -0.9, el: -1.0, fsh: -0.6, fel: -1.2, sway: 0.05, style: 1 });
      u.uF4.value = OFF; u.uF5.value = OFF;
      setTones(u, [TONES.ehud, TONES.guard, TONES.servant, TONES.scribe, null, null, TONES.eglon]);
      u.uFocus.value = mix(12, 25, clamp01((s - T_PRIV) / 1.2)) - cam(t).pos[2];
      const lights = roomLights(t, { moon: 1.5, cand: 0.8, candB: 0, key: 0.7, extra: [
        { pos: [22, 24, -2], col: L(255, 200, 150, 5), rad: 4, range: 24 },
        { pos: [ROOM.throneX + 2, 17, 27.2], col: L(255, 160, 80, 5), rad: 1, range: 7 },
      ] });
      u.uL.value = packLights(lights);
      u.uLN.value = lights.length;
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.12, threshold: 1.0, vignette: 0.55, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.01, 0.012, 0.025], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
