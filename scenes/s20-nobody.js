// s20-nobody · "Nobody wanted to be the one / To interrupt that royal stuff." (83.36-87.75). The
// guards shove each other toward the door: on every beat the one at the back shoves the middle one
// up to the door, and the one who was in front turns tail and scurries round to the back.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { stepT } from '/song/lib/paper.js';
import { DOOR_GLSL, DOOR_UNIFORMS, setFigs, doorLights, skyCol, TONES, jit } from '/song/lib/x-door.js';

export const kind = 'shader';
const FLOOR = -13.5;
const EV = [83.91, 84.46, 85.02, 85.56, 86.12, 86.66, 87.21];
const SLOT = [-1.0, -8.0, -15.0];
const TN = [TONES.guard, TONES.guard2, TONES.guard3];
const SC = [1.15, 1.12, 1.1];

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    return { pos: [mix(-4, -2, e), 12, mix(-52, -46, e)], target: [mix(-5, -3, e), 8, 40], fov: 33 };
  };
  return {
    name: 's20-nobody', from: P.from, to: P.to,
    frag: DOOR_GLSL,
    uniforms: { ...DOOR_UNIFORMS, uAper: 0.3, uFocus: 78, uFillSoft: 6, uAmb: [0.03, 0.028, 0.03], uFillDir: [0.3, 0.5, -0.8], uHaze: [0.01, 0.01, 0.014], uHazeD: 0.002, uDust: 1.0, uVol: 0.015 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      const step = Math.floor((t + 1 / 120) * 12);
      let n = 0; while (n < EV.length && EV[n] <= s) n++;
      const since = n > 0 ? s - EV[n - 1] : 99;
      const k = ease.out3(clamp01(since / 0.42));
      const figs = [];
      for (let g = 0; g < 3; g++) {
        const cur = (((g - n) % 3) + 3) % 3;
        const prev = n > 0 ? (((g - n + 1) % 3) + 3) % 3 : cur;
        let x = mix(SLOT[prev], SLOT[cur], k);
        let face = 1, lean = 0, sh = 0.1, el = -0.3, head = 0, sway = 0, fsh = -0.5, fel = -0.85, spear = 0.05;
        const moving = k < 1 && n > 0;
        if (moving && prev === 1 && cur === 0) {
          // shoved: pitched toward the door, arms windmilling, leaning back against it
          x += 1.6 * Math.sin(k * Math.PI);
          lean = 0.3 * Math.sin(k * Math.PI) + 0.1; head = 0.25; sh = -2.6 + 0.5 * Math.sin(s * 20); el = -0.4; fsh = -2.2; fel = -0.6; sway = 0.3 * Math.sin(s * 14); spear = 0.5 * (1 - k);
        } else if (moving && prev === 2 && cur === 1) {
          // the shover: arms out, then steps up
          const push = Math.max(0, 1 - since / 0.3);
          lean = -0.3 * push; sh = mix(0.1, -1.5, push); el = mix(-0.3, -0.1, push); sway = 0.3 * Math.sin(s * 10) * (1 - push);
        } else if (moving && prev === 0 && cur === 2) {
          // the one who was in front: turns tail and scurries round to the back, ducking
          face = -1; lean = -0.25; head = -0.1; sway = 0.45 * Math.sin(s * 14); sh = 0.5; el = -0.6; spear = -0.3;
        } else if (cur === 0 && n > 0) {
          // in front of the door now: rigid, leaning away from it
          lean = 0.12 + 0.03 * Math.sin(s * 6); head = 0.15; sh = 0.3; el = -0.2;
        }
        figs[g] = {
          pose: { x, y: FLOOR, scale: SC[g], face, lean: lean + jit(step, g, 0.015), head: head + jit(step, g + 4, 0.02), sh, el, fsh, fel, sway, style: 5 },
          tone: TN[g], b: { type: 1, ang: spear * face },
        };
      }
      setFigs(u, figs);
      const e = clamp01((t - P.from) / (P.to - P.from));
      u.uCandle.value = mix(0.48, 0.38, e);
      u.uFlame.value = 0.92 + 0.1 * Math.sin(t * 11.0);
      u.uSky.value = skyCol(0.2 + 0.08 * e);
      doorLights(t, u, { candle: u.uCandle.value, dawn: 0.2 + 0.08 * e });
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.16, threshold: 0.9, vignette: 0.55, grain: 0.02 }); },
    finish() { return { grade: { shadows: [0.012, 0.01, 0.018], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
