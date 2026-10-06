// s34-check · "But down at Eglon's palace, I'll bet / They still check the door themselves."
// (132.76-137.69). Years later: cobwebs in the doorway, the niche candle long dead, moonlight. An old
// guard with a grey beard shuffles up with an oil lamp, creaks the gold door open a crack on "check
// the door" and peeks in, lamp first.
import { grade, ease, clamp01, mix, spring } from '/song/lib/look.js';
import { stepT, packLights, L } from '/song/lib/paper.js';
import { DOOR_GLSL, DOOR_UNIFORMS, setFigs, skyCol, TONES, fk, jit } from '/song/lib/x-door.js';

export const kind = 'shader';
const FLOOR = -13.5;
const CREAK0 = 135.5, CREAK1 = 136.3;

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    return { pos: [mix(-16, -2, e), mix(10, 7, e), mix(-52, -38, e)], target: [mix(-13, 0, e), mix(6, 3, e), 40], fov: 32 };
  };
  return {
    name: 's34-check', from: P.from, to: P.to,
    frag: DOOR_GLSL,
    uniforms: { ...DOOR_UNIFORMS, uRoom: 1, uCob: 1, uAper: 0.35, uFocus: 72, uFillSoft: 6, uAmb: [0.02, 0.022, 0.03], uFillDir: [0.3, 0.5, -0.8], uHaze: [0.01, 0.012, 0.018], uHazeD: 0.003, uDust: 2.2, uVol: 0.025 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      const step = Math.floor((t + 1 / 120) * 12);
      const c = cam(t);
      u.uFocus.value = 29 - c.pos[2];
      // the shuffle: slow, short steps, on twos, stopping by the left leaf
      const w = clamp01((s - 132.9) / 2.4);
      const x = mix(-30, -4.5, w);
      const walking = w > 0 && w < 1;
      const stride = walking ? 0.22 * Math.sin(s * 7.0) : 0;
      // the creak: the leaf jerks open in three little steps
      const ck = clamp01((s - CREAK0) / (CREAK1 - CREAK0));
      const crack = 0.5 * (Math.floor(ck * 3.0 + 0.0001) / 3.0) + 0.03 * Math.sin(s * 30) * (ck > 0 && ck < 1 ? 1 : 0);
      u.uOpenL.value = crack; u.uOpenR.value = 0;
      const reach = spring(s, 135.35, 0.35, 0.3) * (1 - ease.inOut3(clamp01((s - 136.2) / 0.3)));
      const peek = spring(s, 136.3, 0.45, 0.25);
      const pose = { x: x + 1.4 * peek, y: FLOOR, scale: 1.08, face: 1, lean: -0.18 - 0.28 * peek + jit(step, 1, 0.01), head: -0.12 - 0.15 * peek + 0.05 * Math.sin(s * 3),
        sh: mix(mix(-0.9, -1.5, reach), -1.25, peek), el: mix(-1.25, mix(-0.55, -0.35, peek), Math.max(reach, peek)), fsh: -0.45, fel: -0.9, sway: stride, style: 5 };
      const K = fk(pose);
      setFigs(u, [{ pose, tone: [[0.27, 0.24, 0.15], [0.12, 0.08, 0.05]], old: true, a: { type: 4, ang: 0.0, s: 1.0 }, b: { type: 1, ang: 0.12 } }]);
      const flame = [K.hand[0] + 1.95 * 1.0, K.hand[1] + 1.6];
      u.uCandle.value = 0.03; u.uFlame.value = 0.0;
      const lf = 0.92 + 0.08 * Math.sin(t * 13.0) + 0.04 * Math.sin(t * 29.0);
      u.uFlame.value = 0.0;
      u.uSky.value = skyCol(0).map((v) => v * 0.8);
      const lights = [
        // the oil lamp in his hand
        { pos: [flame[0], flame[1], 27.5], col: L(255, 175, 95, 8.0 * lf), rad: 0.6, range: 16 },
        // moonlight from the window
        { pos: [31, 2, 36.0], col: L(150, 175, 230, 6.5), rad: 2.5, range: 24, shaft: true },
        // a sliver of the lamp inside the room once the crack opens
        { pos: [-1, -2, 44], col: L(255, 170, 90, 6.0 * crack * lf), rad: 1.0, range: 14 },
        { dir: [-0.35, 0.35, -0.87], col: [0.07, 0.08, 0.11], rad: 4 },
      ];
      u.uL.value = packLights(lights); u.uLN.value = lights.length;
    },
    post(t) { return grade(t, { exposure: 1.4, bloom: 0.18, threshold: 0.85, vignette: 0.6, grain: 0.024 }); },
    finish() { return { grade: { shadows: [0.01, 0.012, 0.022], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
