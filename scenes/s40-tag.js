// s40-tag · (spoken) "Next time the king's got a secret meeting, / Maybe knock anyway." (157.43-164.56).
// Close on the gold door. A guard's fist rises into the frame, hesitates, backs off, comes again;
// on "Maybe knock anyway" the knuckles knock twice on the beats and the door rattles in its frame.
import { grade, ease, clamp01, mix, spring } from '/song/lib/look.js';
import { stepT } from '/song/lib/paper.js';
import { DOOR_GLSL, DOOR_UNIFORMS, setFigs, doorLights, skyCol } from '/song/lib/x-door.js';

export const kind = 'shader';
const KNOCKS = [162.37, 162.88];
const HIT = [2.4, -4.2];   // where the knuckles meet the left leaf

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    return { pos: [mix(5.5, 5, e), mix(-1, -1.6, e), mix(12, 17, e)], target: [mix(5.5, 5, e), mix(-2.2, -2.6, e), 41], fov: 36 };
  };
  return {
    name: 's40-tag', from: P.from, to: P.to,
    frag: DOOR_GLSL,
    uniforms: { ...DOOR_UNIFORMS, uFigZ: 37.6, uDrape: 2, uValZ: 30, uAper: 0.18, uFocus: 26, uFillSoft: 5, uAmb: [0.03, 0.028, 0.03], uFillDir: [0.3, 0.5, -0.8], uHaze: [0.01, 0.01, 0.014], uHazeD: 0.002, uDust: 1.4, uVol: 0.0 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      const c = cam(t);
      u.uFocus.value = 40.6 - c.pos[2];
      // the valance's hem sits a third of the way down the frame
      const dz = 30 - c.pos[2], half = dz * Math.tan((c.fov * Math.PI) / 360);
      const cy = c.pos[1] + (c.target[1] - c.pos[1]) * (dz / (c.target[2] - c.pos[2]));
      u.uValY.value = cy + half / 3 - 0.35;
      // the fist's distance back from the knock point, along its own axis (0 = touching the door)
      const rise = ease.out3(clamp01((s - 157.9) / 1.2));
      let back = mix(14, 3.2, rise);
      // hesitation: drifts back on "secret meeting", creeps in again
      back += 1.6 * Math.sin(clamp01((s - 159.2) / 1.6) * Math.PI) - 0.8 * Math.sin(clamp01((s - 160.8) / 1.0) * Math.PI);
      // the wind-up and the two knocks
      let knock = 0, rattle = 0;
      if (s >= 161.9) {
        back = mix(back, 2.6, clamp01((s - 161.9) / 0.3));
        for (const k of KNOCKS) {
          const d = s - k;
          if (d > -0.18 && d < 0) back = mix(2.6, 0, (d + 0.18) / 0.18);          // swing in
          else if (d >= 0 && d < 0.25) { back = mix(0, 2.6, d / 0.25); }            // spring off
          if (d >= 0 && d < 0.4) { rattle = Math.max(rattle, Math.exp(-d * 11.0)); knock = Math.max(knock, Math.exp(-d * 18.0)); }
        }
        if (s >= KNOCKS[1] + 0.25) back = mix(2.6, 4.5, ease.inOut3(clamp01((s - KNOCKS[1] - 0.25) / 1.2)));
      }
      const ang = -0.55;
      const dir = [-Math.sin(ang), Math.cos(ang)];
      const at = [HIT[0] - dir[0] * back, HIT[1] - dir[1] * back];
      const sc = 1.0 + 0.012 * back;
      setFigs(u, [{ a: { type: 6, at, ang: ang + 0.02 * Math.sin(s * 3.0), s: sc }, tone: [[0, 0, 0], [0, 0, 0]] }]);
      u.uRattle.value = [0.09 * rattle * Math.sin(t * 90.0), 0.05 * rattle * Math.cos(t * 77.0)]; // ark-shake-ok: the door rattles under the knock
      u.uCandle.value = 0.55; u.uFlame.value = 0.92 + 0.1 * Math.sin(t * 11.0) + 0.3 * knock;
      u.uSky.value = skyCol(0);
      u.uDust.value = 1.4 + 3.0 * rattle;
      doorLights(t, u, { candle: 0.55 });
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.16, threshold: 0.9, vignette: 0.6, grain: 0.02 }); },
    finish() { return { grade: { shadows: [0.012, 0.01, 0.018], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
