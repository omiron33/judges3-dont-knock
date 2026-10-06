// s11-message · "I've got a message from God," said Ehud, soft and sweet. (47.15-51.54).
// The room emptied: Ehud and Eglon face to face by one candle, close. Ehud leans in as if to whisper;
// the king tilts his ear to him, then lifts his head at "God" (the drum hit). The candle flame stands
// very still; only the dust drifts and the camera eases in. The throne glints soft behind.
import { grade, ease, clamp01, mix, spring } from '/song/lib/look.js';
import { L, stepT, packLights } from '/song/lib/paper.js';
import { THRONE_GLSL, THRONE_UNIFORMS, ROOM, TONES, OFF, roomLights, setTones, pose } from '/song/lib/x-throne.js';

export const kind = 'shader';
const T_MSG = 48.1, T_GOD = 48.78, T_SOFT = 50.39;
const CAND = [11.4, 6.4];

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    return { pos: [mix(12.5, 11.6, e), mix(7.5, 7.8, e), mix(-24, -19, e)], target: [mix(11.5, 11.2, e), mix(6.4, 7.2, e), 30], fov: 32, roll: 0 };
  };
  return {
    name: 's11-message', from: P.from, to: P.to,
    frag: THRONE_GLSL,
    uniforms: { ...THRONE_UNIFORMS, uAper: 0.5, uFocus: 25, uAmb: L(60, 62, 75, 1.4), uFillDir: [0.3, 0.55, -0.78], uFillSoft: 7, uHaze: L(30, 34, 48, 0.5), uHazeD: 0.002, uDust: 1.6, uVol: 0.0, uVolTint: [0.8, 0.9, 1.15], uDrape: [-80, 80], uGround: -16,
      uWin: [0.6, 0.5, 0.25], uCand: [0, 1], uCandP: [ROOM.candA[0], ROOM.candA[1], CAND[0], CAND[1]], uStill: 1, uSeat: 0,
      uLay: [2, 9, 9, 9, 9, 9, 2], uCarry: [0, 0, 0, 0, 0, 0, 0] },
    camera: cam,
    update(t, u) {
      u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      const s = stepT(t);
      const F = ROOM.floor;
      // Ehud leans in to whisper, closer on "message", his hand lifted to shade the words
      const lean = ease.inOut3(clamp01((s - P.from) / 0.8)) * 0.12 + ease.inOut3(clamp01((s - T_MSG + 0.15) / 0.4)) * 0.16;
      const soft = clamp01((s - T_SOFT) / 0.4);
      u.uF0.value = pose({ x: 15.4, y: F, scale: 0.95, face: -1, lean: 0.5 * lean - 0.04 * soft, head: -0.28 - 0.1 * lean, sh: mix(-0.5, 0.1, soft), el: mix(-2.4, -1.3, soft),
        fsh: mix(0.1, 0.35, soft), fel: mix(-0.3, -0.7, soft), sway: 0.06, style: 2 });
      // Eglon: inclines his ear, lifts his head at "God", then leans back in, rapt
      const god = spring(s, T_GOD, 0.4, 0.35) * (1 - 0.6 * clamp01((s - T_GOD - 0.9) / 0.6));
      u.uF6.value = pose({ x: 6.3, y: F, scale: 1.15, face: 1, lean: 0.2 - 0.14 * god, head: 0.32 - 0.45 * god, sh: -0.1 - 0.15 * god, el: -1.45 - 0.35 * god, fsh: -0.1, fel: -0.7, sway: 0.02, style: 4 });
      u.uF1.value = OFF; u.uF2.value = OFF; u.uF3.value = OFF; u.uF4.value = OFF; u.uF5.value = OFF;
      setTones(u, [TONES.ehud, null, null, null, null, null, TONES.eglon]);
      u.uFocus.value = 25 - cam(t).pos[2];
      const lights = roomLights(t, { moon: 1.2, cand: 1.0, candA: 0, key: 0.35, candP: [0, 0, CAND[0], CAND[1]], still: 1, extra: [
        { pos: [11, 12, 6], col: L(150, 160, 200, 1.2), rad: 3, range: 20 },
        { pos: [ROOM.throneX + 2, 17, 27.2], col: L(255, 160, 80, 3), rad: 1, range: 7 },
      ] });
      u.uL.value = packLights(lights);
      u.uLN.value = lights.length;
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.14, threshold: 0.95, vignette: 0.6, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.01, 0.012, 0.025], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
