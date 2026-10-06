// s08-sent · "He sent the other fellows home, then turned around once more:" (33.98-38.37). The
// carved standing stones by Gilgal in moonlight: the two bearers walk off home to the left with their
// empty baskets; Ehud walks with them, slows, stops, and on "turned" swings round to face back the
// way he came, then strolls back toward the palace.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, L, stepT } from '/song/lib/paper.js';
import { pose } from '/song/lib/puppet.js';
import { slam, KICKS } from '/song/lib/sync.js';
import { STONES_GLSL, STONES_UNIFORMS } from '/song/lib/x-road-stones.js';
import { strollAt, handAt } from '/song/lib/x-road.js';

export const kind = 'shader';

const SC = 0.8, SPEED = 7.6;
const T_SLOW = 35.3, T_STOP = 35.98, T_TURN = 36.69, T_BACK = 37.27;

export default (P) => {
  const span = P.to - P.from;
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / span));
    return { pos: [mix(0, 3, e), 3.0, mix(-44, -39, e)], target: [mix(-1, 2, e), 4.8, 40], fov: 29, roll: 0 };
  };
  // Ehud's x along the path (he walks left, eases to a stop, then strolls back right)
  const ehudX = (s) => {
    const x0 = 10;
    let x = x0 - SPEED * (Math.min(s, T_SLOW) - P.from);
    if (s > T_SLOW) { const k = Math.min(s, T_STOP) - T_SLOW; x -= SPEED * (k - (k * k) / (2 * (T_STOP - T_SLOW))); }
    if (s > T_BACK) x += SPEED * 0.75 * (s - T_BACK);
    return x;
  };
  return {
    name: 's08-sent', from: P.from, to: P.to,
    frag: STONES_GLSL,
    uniforms: { ...STONES_UNIFORMS, uAper: 0.3, uFocus: 54, uFillSoft: 8, uAmb: L(60, 66, 84, 1.3), uFillDir: [-0.3, 0.55, -0.78], uHaze: L(30, 36, 52, 0.4), uHazeD: 0.005, uDust: 0.7 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      const a = s - P.from;
      // the bearers: steady, home-bound, never looking back
      const b0 = strollAt(a, { rate: 1.82, stride: 0.22, swing: 0.25, phase: 1.2 });
      const b1 = strollAt(a, { rate: 1.82, stride: 0.28, swing: 0.3, phase: 2.6 });
      u.uB0.value = pose({ x: -3 - SPEED * a, y: -6 + b0.lift * 0.3, scale: SC * 0.97, face: -1, lean: 0.06, head: 0.05, sh: 0.1 + b0.sh * 0.3, el: -0.15, fsh: b0.fsh * 0.6, fel: -0.3, sway: b0.sway, style: 1 });
      u.uB1.value = pose({ x: -14 - SPEED * a, y: -6 + b1.lift * 0.4, scale: SC * 1.02, face: -1, lean: 0.03, head: 0.0, sh: 0.05 + b1.sh * 0.3, el: -0.1, fsh: b1.fsh, fel: -0.3, sway: b1.sway, style: 2 });
      const h0 = handAt(u.uB0.value), h1 = handAt(u.uB1.value);
      u.uBask.value = [h0[0], h0[1] + 0.6, h1[0], h1[1] + 0.6];
      // Ehud: walking, slowing, stopped; turning on "turned"; strolling back
      const x = ehudX(s);
      const walking = s < T_STOP || s >= T_BACK;
      const st = strollAt(a, { rate: 1.82, stride: 0.3, swing: 0.55 });
      const slow = s < T_SLOW ? 1 : s < T_STOP ? 1 - (s - T_SLOW) / (T_STOP - T_SLOW) : 0;
      const face = s < T_TURN ? -1 : 1;
      // a beat of thought before the turn (head up, a pause), a little hop as he swings round
      const think = s >= T_STOP && s < T_TURN ? clamp01((s - T_STOP) / 0.3) : 0;
      const hop = s >= T_TURN && s < T_TURN + 0.25 ? Math.sin(Math.PI * (s - T_TURN) / 0.25) : 0;
      const back = s >= T_BACK ? 1 : 0;
      u.uEhud.value = pose({
        x, y: -6 + (walking ? st.lift * 0.5 : 0) + hop * 0.8, scale: SC, face,
        lean: 0.05 - 0.1 * think + 0.08 * hop, head: -0.1 * think + 0.04 * Math.sin(s * 3.0),
        sh: walking ? st.sh * (back ? 1 : slow) : mix(-0.1, 0.35, think) - 0.3 * hop, el: walking ? st.el : -0.4 - 0.9 * think,
        fsh: walking ? st.fsh * (back ? 1 : slow) : 0.1, fel: walking ? st.fel : -0.3,
        sway: walking ? st.sway * (back ? 1 : slow) : 0.12 * hop, style: 2,
      });
      u.uShiver.value = slam(t, KICKS);
      // the middle stone settles into the earth on the kick
      u.uSlamS.value = -0.35 * slam(t, KICKS, 0.4);
      u.uFocus.value = mix(54, 50, clamp01((t - P.from) / span));
      u.uL.value = packLights([
        { dir: [0.35, 0.45, 0.82], col: L(170, 190, 235, 2.2), rad: 0.8 },                   // the moon behind the stones
        { pos: [26, 22, -12], col: L(185, 200, 240, 9), rad: 3, range: 40 },                 // cold moonlight on the walkers
        { dir: [-0.5, 0.35, -0.8], col: L(90, 100, 140, 0.35), rad: 3 },                     // night fill
      ]);
      u.uLN.value = 3;
      u.uMoon.value = [30, 34];
    },
    post(t) { return grade(t, { exposure: 1.4, bloom: 0.15, threshold: 0.9, vignette: 0.55, grain: 0.02 }); },
    finish() { return { grade: { shadows: [0.01, 0.012, 0.02], highlights: [0.94, 0.97, 1.0], amount: 0.4 } }; },
  };
};
