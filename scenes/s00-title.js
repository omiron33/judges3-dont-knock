// s00-title · (title, 0-3.8). The ancient Bible closed on a dark table by one candle, seen from
// above; the title is stamped in gold foil on its leather cover (lyric layer). On the first drum hit
// the cover swings smoothly open, the cut-paper palace lifts off the page, and the camera dives in.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, flicker, L } from '/song/lib/paper.js';
import { BOOK_GLSL, BOOK_UNIFORMS } from '/song/lib/x-book.js';
export const kind = 'shader';
const OPEN = 3.29;   // the first kick: the cover is fully open as it lands
const LIFT = 1.45;   // the cover swings open smoothly over this long, ending on the kick
export default (P) => {
  const cam = (t) => {
    const dive = Math.pow(clamp01((t - OPEN - 0.1) / (P.to - OPEN - 0.1)), 3);
    const e = ease.inOut3(clamp01(t / (OPEN - LIFT)));
    return { pos: [mix(-1.5, 0.0, e), mix(-3.0, -1.0, e), mix(-20.0, -14.0, e) + 38.0 * dive], target: [mix(-0.5, 0.0, e), mix(-0.5, -1.0, e), 60.0], fov: mix(52, 46, e), roll: mix(0.03, 0.0, e) };
  };
  return {
    name: 's00-title', from: P.from, to: P.to, frag: BOOK_GLSL,
    uniforms: { ...BOOK_UNIFORMS, uAper: 0.25, uFocus: 64, uAmb: L(60, 52, 46, 0.5), uFillDir: [-0.3, 0.5, -0.8], uDust: 0.8, uBg: [0.002, 0.0015, 0.001] },
    camera: cam,
    update(t, u) {
      const o = clamp01((t - (OPEN - LIFT)) / LIFT);
      u.uOpen.value = ease.inOut3(o);
      u.uPop.value = ease.inOut3(clamp01((t - OPEN + 0.35) / 0.55));
      const fl = flicker(t, 1.3);
      u.uFlame.value = fl;
      const c = cam(t);
      u.uFocus.value = 50 - c.pos[2] - 1.0;
      u.uL.value = packLights([
        { pos: [40, -16, 31], col: L(255, 170, 90, 9 * fl), rad: 0.8, range: 34 },
        { dir: [-0.4, 0.5, -0.75], col: L(150, 150, 165, 1.4), rad: 2 },
      ]);
      u.uLN.value = 2;
    },
    post(t) { return grade(t, { exposure: 1.25, bloom: 0.18, threshold: 0.85, vignette: 0.6, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.012, 0.008, 0.004], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
