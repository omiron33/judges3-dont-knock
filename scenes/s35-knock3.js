// s35-knock3 · "Don't knock, he's busy! Give the king a little time." (137.69-142.35). The final
// chorus: the whole palace as a cutaway dollhouse diorama, every room at once: the guards upstairs
// before the locked gold door by candlelight, the dark summer room beside them (the empty throne in
// moonlight), the hall and kitchen below, and far beyond on the hill tiny Ehud running.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { stepT, L } from '/song/lib/paper.js';
import { slam } from '/song/lib/sync.js';
import { HOUSE_GLSL_FULL, HOUSE_UNIFORMS, pose, packLights } from '/song/lib/x-door-house.js';

export const kind = 'shader';
const PY = -2.0;
const NODS = [137.72, 138.24, 138.78, 139.34, 139.89, 140.43, 140.99, 141.54, 142.09];
const hillY = (x) => -10.0 + 7.0 * Math.exp(-(((x - 34.0) / 12.0) ** 2)) + 1.2 * Math.sin(x * 0.21) - 4.0 * (((t) => t * t * (3 - 2 * t))(Math.min(1, Math.max(0, (x - 5.0) / (-35.0)))));

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    return { pos: [mix(-14, -6, e), mix(-6, -5, e), mix(-62, -58, e)], target: [mix(-12, -5, e), -5.5, 40], fov: 27 };
  };
  const nod = (t) => { let n = 0; for (const b of NODS) { const x = t - b + 0.04; if (x >= 0 && x < 0.45) n = Math.max(n, x < 0.1 ? x / 0.1 : Math.max(0, 1 - (x - 0.1) / 0.3)); } return n; };
  return {
    name: 's35-knock3', from: P.from, to: P.to,
    frag: HOUSE_GLSL_FULL,
    uniforms: { ...HOUSE_UNIFORMS, uAper: 0.25, uFocus: 100, uFillSoft: 6, uAmb: [0.03, 0.03, 0.035], uFillDir: [0.3, 0.5, -0.8], uHaze: [0.012, 0.013, 0.02], uHazeD: 0.0025, uDust: 0.7, uVol: 0.02 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      const c = cam(t);
      u.uFocus.value = 41.5 - c.pos[2];
      const n = nod(s);
      const floorUp = -8.5 + PY;
      const g = (x, k) => pose({ x, y: floorUp, scale: 0.3, face: 1, lean: 0.03 - 0.08 * nod(s - k * 0.03), head: -0.25 * nod(s - k * 0.03), sh: -1.1, el: -2.5, fsh: -0.3, fel: -0.5, sway: 0, style: 5 });
      u.uF0.value = g(-23.5, 0); u.uF1.value = g(-26.5, 1); u.uF2.value = g(-29.5, 2);
      // a servant crossing the hall below on twos
      const sx = mix(-38, -18, clamp01((s - 137.8) / 4.4));
      u.uF3.value = pose({ x: sx, y: -22.0 + PY, scale: 0.3, face: 1, lean: -0.05, head: 0.05, sh: -0.6, el: -1.9, fsh: 0.3 * Math.sin(s * 9), fel: -0.4, sway: 0.35 * Math.sin(s * 9), style: 2 });
      // Ehud running along the far hill
      const ex = mix(26, 44, clamp01((s - P.from) / (P.to - P.from)));
      u.uF4.value = pose({ x: ex, y: hillY(ex) - 0.1, scale: 0.16, face: 1, lean: -0.22, head: 0.1, sh: 0.9 * Math.sin(s * 11), el: -1.2, fsh: -0.9 * Math.sin(s * 11), fel: -1.2, sway: 0.5 * Math.sin(s * 11), style: 2 });
      u.uPalm.value = 0.6 * slam(t) + 0.15 * Math.sin(t * 1.3);
      u.uFlame.value = 0.9 + 0.12 * Math.sin(t * 11) + 0.05 * Math.sin(t * 27);
      const fl = u.uFlame.value;
      const lights = [
        // the antechamber candle and the hall lamp
        { pos: [-36.0, -4.8 + PY, 40.0], col: L(255, 160, 80, 4.0 * fl), rad: 0.6, range: 11 },
        { pos: [-28, -12.5 + PY, 40.0], col: L(255, 150, 70, 3.2 * fl), rad: 0.8, range: 13 },
        // the kitchen hearth
        { pos: [5, -19.5 + PY, 40.0], col: L(255, 130, 50, 3.0 * fl), rad: 1.0, range: 13 },
        // moonlight through the summer room's lattice, and the low moon behind the hills
        { pos: [1, -1 + PY, 62], col: L(160, 180, 235, 6.0), rad: 1.5, range: 18, shaft: true },
        { pos: [46, -4, 130], col: L(170, 185, 230, 5.0), rad: 4, range: 60 },
        { dir: [-0.25, 0.4, -0.88], col: [0.32, 0.29, 0.27], rad: 4 },
      ];
      u.uL.value = packLights(lights); u.uLN.value = lights.length;
    },
    post(t) { return grade(t, { exposure: 1.4, bloom: 0.18, threshold: 0.85, vignette: 0.55, grain: 0.02 }); },
    finish() { return { grade: { shadows: [0.012, 0.012, 0.022], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
