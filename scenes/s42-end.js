// s42-end · (outro and end title, 172.2-182.4). The book again from above by its candle: the cut-paper
// palace and palms fold back down into the page, the leather cover swings shut on a beat, the end
// title is stamped on it (lyric layer), and it ends on the closed book exactly as the film began.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, flicker, L } from '/song/lib/paper.js';
import { BOOK_GLSL, BOOK_UNIFORMS } from '/song/lib/x-book.js';
import { BEATS } from '/song/lib/sync.js';
export const kind = 'shader';
export default (P) => {
  const shut = BEATS.find((b) => b >= P.from + 3.6) ?? P.from + 3.6;   // the cover lands on a beat
  const cam = (t) => {
    // out of the page (the opening's dive in reverse) and back to the exact framing the film opened on
    const k = ease.inOut3(clamp01((t - P.from) / 5.5));
    return { pos: [mix(0.0, -1.5, k), mix(-1.0, -3.0, k), mix(14.0, -20.0, k)], target: [mix(0.0, -0.5, k), mix(-1.0, -0.5, k), 60.0], fov: mix(46, 52, k), roll: mix(0.0, 0.03, k) };
  };
  return {
    name: 's42-end', from: P.from, to: P.to, frag: BOOK_GLSL,
    uniforms: { ...BOOK_UNIFORMS, uAper: 0.25, uFocus: 64, uAmb: L(60, 52, 46, 0.5), uFillDir: [-0.3, 0.5, -0.8], uDust: 0.8, uBg: [0.002, 0.0015, 0.001] },
    camera: cam,
    update(t, u) {
      u.uPop.value = 1 - ease.inOut3(clamp01((t - P.from - 0.4) / 2.0));
      // the cover swings over and lands with a small bounce
      const c = clamp01((t - (shut - 1.45)) / 1.45);   // as smooth as the opening
      const land = t > shut ? 0.04 * Math.exp(-6 * (t - shut)) * Math.sin((t - shut) * 30) : 0;
      u.uOpen.value = 1 - ease.inOut3(c) + Math.abs(land);
      const out = 0;   // the candle burns on: the film ends on the same book it opened with
      const fl = flicker(t, 2.1) * (1 - ease.inOut3(out)) * (1 + 0.4 * Math.sin(t * 40) * out);
      u.uFlame.value = Math.max(0, fl);
      const cm = cam(t);
      u.uFocus.value = 50 - cm.pos[2] - 1.0;
      u.uL.value = packLights([
        { pos: [40, -16, 31], col: L(255, 170, 90, 9 * Math.max(0, fl)), rad: 0.8, range: 34 },
        { dir: [-0.4, 0.5, -0.75], col: L(150, 150, 165, 1.4 * (1 - 0.7 * out)), rad: 2 },
      ]);
      u.uLN.value = 2;
    },
    post(t) { return grade(t, { exposure: 1.25, bloom: 0.18, threshold: 0.85, vignette: 0.6, grain: 0.022 }); },
    finish(t) { return { grade: { shadows: [0.012, 0.008, 0.004], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
