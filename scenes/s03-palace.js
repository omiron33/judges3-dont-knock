// s03-palace · (groove, 13.16-15.89). Eglon's palace revealed by the city of palms: the cut-paper
// palace slams down into place on the first drum, the palm grove behind rises on the second, and the
// lattice windows light storey by storey on the beats as the camera cranes up past the black palms
// to the summer room on the roof. Gold foil doors catch the light at the start.
import { grade, ease, clamp01, mix, spring } from '/song/lib/look.js';
import { packLights, flicker, L } from '/song/lib/paper.js';
import { slam, KICKS } from '/song/lib/sync.js';
import { PALACE_GLSL, PALACE_UNIFORMS } from '/song/lib/x-road-palace.js';

export const kind = 'shader';

const T_DROP = 13.18, T_RISE = 13.73, T_W0 = 14.25, T_W1 = 14.8, T_W2 = 15.35;

export default (P) => {
  const span = P.to - P.from;
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / span));
    return { pos: [mix(-3, 1, e), mix(-7, 7, e), mix(-36, -40, e)], target: [mix(-1, 0.5, e), mix(-2, 10, e), 40], fov: 34, roll: mix(0.015, 0, e) };
  };
  const on = (t, t0) => (t < t0 ? 0 : clamp01(spring(t, t0, 0.35, 0.25)));
  return {
    name: 's03-palace', from: P.from, to: P.to,
    frag: PALACE_GLSL,
    uniforms: { ...PALACE_UNIFORMS, uAper: 0.35, uFocus: 60, uFillSoft: 7, uAmb: L(64, 62, 78, 1.0), uFillDir: [-0.3, 0.55, -0.78], uHaze: L(40, 34, 40, 0.35), uHazeD: 0.004, uDust: 0.8 },
    camera: cam,
    update(t, u) {
      u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      // the palace lands (drops from above with a paper bounce); the grove rises on the next drum
      u.uDrop.value = 2.6 * (1 - spring(t, T_DROP - 0.06, 0.32, 0.4));
      u.uRise.value = -6 * (1 - (t < T_RISE ? 0 : spring(t, T_RISE, 0.32, 0.4)));
      u.uSway.value = 0.05 * Math.sin(t * 1.7) + 0.06 * slam(t, KICKS);
      // windows light on the beats: ground floor, upper floor, summer room
      const fk = flicker(t, 3);
      u.uWin.value = [0.25 + 0.75 * on(t, T_W0) * fk, 0.2 + 0.8 * on(t, T_W1) * fk, 0.1 + 0.55 * on(t, T_W2) * flicker(t, 7)];
      const e = clamp01((t - P.from) / span);
      u.uFocus.value = mix(58, 66, e);
      u.uL.value = packLights([
        { pos: [-3, -4, 27.5], col: L(255, 160, 80, 9 * (0.4 + 0.6 * on(t, T_W0)) * fk), rad: 2, range: 14 },   // lamps inside the ground floor
        { pos: [1, 12, 27.5], col: L(255, 200, 140, 4 * (0.2 + 0.8 * on(t, T_W2))), rad: 2, range: 8 },        // the summer room's lamp
        { dir: [0.3, 0.25, 0.92], col: L(210, 150, 120, 1.2), rad: 1.2 },                                    // dusk behind
        { pos: [-16, 6, -6], col: L(190, 185, 215, 4.5), rad: 3, range: 40 },                                  // a cool key catching the gold doors
      ]);
      u.uLN.value = 4;
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.18, threshold: 0.85, vignette: 0.55, grain: 0.02 }); },
    finish() { return { grade: { shadows: [0.01, 0.01, 0.018], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
