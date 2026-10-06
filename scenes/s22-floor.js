// s22-floor · "The king was on the floor by then," (92.15-94.48). The gold doors swing open and the
// antechamber's light falls into the summer room: the throne empty, the king's crown rolling across
// the floor to a stop beside the edge of a fallen purple robe. Nothing more. The guard drops the key.
import { grade, ease, clamp01, mix, spring } from '/song/lib/look.js';
import { stepT, packLights, L } from '/song/lib/paper.js';
import { slam } from '/song/lib/sync.js';
import { DOOR_GLSL, DOOR_UNIFORMS, setFigs, TONES, fk, jit } from '/song/lib/x-door.js';

export const kind = 'shader';
const FLOOR = -13.5;
const OPEN0 = 92.36, OPEN1 = 93.27, DROP = 93.4;

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const f = ease.inOut3(clamp01((t - P.from - 0.25) / (P.to - P.from - 0.25)));
    return { pos: [mix(6, 4.5, f), mix(-1.5, -9.6, f), mix(-34, 17, f)], target: [mix(6, 5, f), mix(-4, -12.0, f), 54], fov: mix(34, 30, f) };
  };
  return {
    name: 's22-floor', from: P.from, to: P.to,
    frag: DOOR_GLSL,
    uniforms: { ...DOOR_UNIFORMS, uRoom: 1, uDrape: 0, uAper: 0.3, uFocus: 60, uFillSoft: 6, uAmb: [0.025, 0.024, 0.028], uFillDir: [0.2, 0.5, -0.85], uHaze: [0.012, 0.011, 0.014], uHazeD: 0.002, uDust: 1.6, uVol: 0.035 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      const step = Math.floor((t + 1 / 120) * 12);
      const c = cam(t);
      u.uFocus.value = 54 - c.pos[2];
      // the doors: a heave, then they swing wide and bang open on the kick
      const k = clamp01((s - OPEN0) / (OPEN1 - OPEN0));
      const open = 1.12 * (k * k * (3 - 2 * k)) + 0.06 * slam(s, [OPEN1], 0.3);
      u.uOpenL.value = open; u.uOpenR.value = open * 0.97;
      // the crown: rolls in from the left, slows, rocks and settles on its side by the robe
      const r = clamp01((s - 92.55) / 1.45);
      const cx = mix(-6.5, 3.4, 1 - Math.pow(1 - r, 2.6));
      const rock = r < 1 ? Math.sin(r * 26) * 0.35 * (1 - r) : 0;
      const settle = spring(s, 94.0, 0.3, 0.4);
      u.uCrown.value = [cx, mix(-(cx + 1.5) / 1.9, 0.0, 0) * 0 + rock + 0.28 * settle];
      // the guard at the left with the key (drops it on "by then"); one at the right edge
      const gA = { x: -8.5, y: FLOOR, scale: 1.1, face: 1, lean: -0.1 + jit(step, 1, 0.012), head: -0.18, sh: -0.5, el: -0.3, fsh: -0.5, fel: -0.85, sway: 0, style: 5 };
      const K = fk(gA);
      let keyProp;
      const hang = [K.hand[0], K.hand[1] - 5.9];
      if (s < DROP) keyProp = { type: 3, at: hang, ang: 0.1 * Math.sin(s * 5), s: 0.7 };
      else {
        const f = s - DROP, y = Math.max(FLOOR + 1.0, hang[1] - 0.5 * 140 * f * f);
        const landed = y <= FLOOR + 1.0;
        keyProp = { type: 3, at: [hang[0] - 9.0 * Math.min(f, 0.3), y], ang: landed ? 1.5 : 5.0 * f, s: 0.7 };
      }
      const startle = spring(s, DROP, 0.3, 0.3);
      gA.lean += 0.12 * startle; gA.head += 0.3 * startle; gA.sh = mix(-0.5, -1.6, startle); gA.el = mix(-0.3, -0.6, startle);
      const gB = { x: 25, y: FLOOR, scale: 1.12, face: -1, lean: -0.15 + 0.1 * startle + jit(step, 2, 0.012), head: -0.25 + 0.2 * startle, sh: -0.3, el: -1.6, fsh: -0.5, fel: -0.85, sway: 0, style: 5 };
      setFigs(u, [{ pose: gA, tone: TONES.guard, a: keyProp, b: { type: 1, ang: 0.08 } }, { pose: gB, tone: TONES.guard2, b: { type: 1, ang: -0.08 } }]);
      u.uCandle.value = 0.05; u.uFlame.value = 0.6;
      u.uDawn.value = 1; u.uSky.value = [0.5, 0.3, 0.2];
      const fl = 0.95 + 0.05 * Math.sin(t * 11);
      const lights = [
        // the antechamber's light falling in through the opening doors
        { pos: [4, 12, 8], col: L(255, 205, 150, 2.0 * fl * mix(0.35, 1, k)), rad: 2.0, range: 45, shaft: true },
        // dawn behind the summer room's lattice windows
        { pos: [8, 0, 84], col: L(220, 190, 210, 5.0), rad: 4, range: 30 },
        // a cold rim from the antechamber window, on the guards
        { pos: [32, 0, 36], col: L(190, 190, 215, 0.8), rad: 3, range: 26 },
        { dir: [-0.3, 0.4, -0.86], col: [0.04, 0.04, 0.05], rad: 4 },
        // a low glow off the floor onto the heap of robe
        { pos: [12, -9, 46], col: L(255, 200, 160, 0.5), rad: 2, range: 10 },
      ];
      u.uL.value = packLights(lights); u.uLN.value = lights.length;
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.2, threshold: 0.85, vignette: 0.55, grain: 0.02 }); },
    finish() { return { grade: { shadows: [0.012, 0.01, 0.018], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
