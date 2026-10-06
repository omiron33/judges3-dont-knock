// s04-summer · "King Eglon had a summer room, a throne, a fancy door," (15.89-20.82).
// The summer room in the dark: a slow track across the diorama. Each named thing lights on its word:
// the lattice windows fill with moonlight on "summer room", the candles by the throne catch on
// "throne", and a light sweeps the gold foil door on "fancy door".
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { L, stepT, packLights } from '/song/lib/paper.js';
import { slam } from '/song/lib/sync.js';
import { THRONE_GLSL, THRONE_UNIFORMS, ROOM, roomLights } from '/song/lib/x-throne.js';

export const kind = 'shader';
const T_ROOM = 18.04, T_THRONE = 19.02, T_DOOR = 19.58;

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    return { pos: [mix(10, -9, e), mix(11, 10, e), mix(-52, -44, e)], target: [mix(6, -10, e), mix(5, 4.5, e), 40], fov: 38, roll: 0 };
  };
  const on = (t, t0, d = 0.5) => ease.out3(clamp01((t - t0 + 0.08) / d));
  return {
    name: 's04-summer', from: P.from, to: P.to,
    frag: THRONE_GLSL,
    uniforms: { ...THRONE_UNIFORMS, uAper: 0.35, uFocus: 75, uAmb: L(70, 72, 85, 3.0), uFillDir: [0.3, 0.55, -0.78], uFillSoft: 7, uHaze: L(30, 34, 48, 0.5), uHazeD: 0.002, uDust: 1.2, uVol: 0.0, uVolTint: [0.8, 0.9, 1.15], uDrape: [-52, 52], uGround: -9.5 },
    camera: cam,
    update(t, u) {
      u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      u.uStepT.value = stepT(t);
      const c = cam(t);
      u.uFocus.value = 40 - c.pos[2] + 2;
      const r = on(t, T_ROOM, 0.7), th = on(t, T_THRONE, 0.4), dr = on(t, T_DOOR, 0.5);
      u.uWin.value = [mix(0.3, 1, r), mix(0.3, 1, r), mix(0.3, 1, r)];
      u.uCand.value = [th > 0.02 ? 1 : 0, th > 0.02 ? 1 : 0];
      u.uSlamY.value = -0.25 * slam(t);
      // the light on the door sweeps down its foil after "fancy door"
      const sweep = clamp01((t - T_DOOR) / 1.0);
      const lights = roomLights(t, { moon: mix(0.6, 1.7, r), cand: th, key: 1.6, extra: [
        { pos: [ROOM.throneX - 6, 30, 6], col: L(255, 196, 140, 3.2 * th), rad: 4, range: 30 },
        { pos: [ROOM.doorX + mix(-6, 6, ease.inOut3(sweep)), mix(18, 4, ease.inOut3(sweep)), 34], col: L(255, 200, 140, 5 * dr), rad: 1.5, range: 8 },
      ] });
      u.uL.value = packLights(lights);
      u.uLN.value = lights.length;
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.12, threshold: 1.0, vignette: 0.55, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.01, 0.012, 0.025], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
