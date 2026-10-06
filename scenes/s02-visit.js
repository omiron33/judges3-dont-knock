// s02-visit · "Then Ehud came to pay a visit." (9.32-13.16). A road through layered hills at dusk:
// Ehud strolls in on twos, swinging his free arm, leading his tribute donkey on a rope; he stops,
// tips his head to us on "visit", and strolls on. The sun burns low behind the parchment sky.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, flicker, L, stepT } from '/song/lib/paper.js';
import { pose } from '/song/lib/puppet.js';
import { slam, KICKS } from '/song/lib/sync.js';
import { HILLS_GLSL, HILLS_UNIFORMS } from '/song/lib/x-road-hills.js';
import { handAt, strollAt } from '/song/lib/x-road.js';

export const kind = 'shader';

const SC = 0.8;          // Ehud's scale
const STEP = 8.0;       // world units he covers a second while strolling
const T_STOP = 10.86, T_NOD = 11.16, T_GO = 11.95;

export default (P) => {
  const span = P.to - P.from;
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / span));
    return { pos: [mix(-43, -31, e), mix(2.4, 3.2, e), -42], target: [mix(-41, -30, e), 4.0, 40], fov: 30, roll: 0 };
  };
  // Ehud's x: strolling, stopped, strolling on (on twos)
  const ehudX = (s) => {
    const x0 = -54;
    const a = Math.min(s, T_STOP) - P.from;
    let x = x0 + STEP * a;
    if (s > T_GO) x += STEP * 0.8 * (s - T_GO);
    return x;
  };
  return {
    name: 's02-visit', from: P.from, to: P.to,
    frag: HILLS_GLSL,
    uniforms: { ...HILLS_UNIFORMS, uAper: 0.3, uFocus: 56, uFillSoft: 7, uAmb: L(70, 66, 74, 1.2), uFillDir: [0.35, 0.55, -0.75], uHaze: L(70, 48, 36, 0.35), uHazeD: 0.004, uDust: 0.8 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      const walking = s < T_STOP || s > T_GO;
      const settle = clamp01((s - T_STOP) / 0.25);
      const st = strollAt(s - P.from, { rate: 1.82, stride: 0.3, swing: 0.6 });
      const k = walking ? 1 : 1 - settle * 0.9;
      // the head tip: a quick nod forward and a lean back, with a little bounce of the shoulders
      const nod = s >= T_NOD && s < T_NOD + 0.6 ? Math.sin(Math.PI * (s - T_NOD) / 0.6) : 0;
      const x = ehudX(s);
      const e = pose({
        x, y: -6.0 + (walking ? st.lift * 0.5 : 0), scale: SC, face: 1,
        lean: 0.04 - 0.12 * nod, head: -0.05 + 0.45 * nod + (walking ? 0.04 * Math.sin(st.ph * 2) : 0),
        sh: walking ? st.sh : mix(st.sh * 0.1, -0.35, nod), el: walking ? st.el : -0.5 - 0.6 * nod,
        fsh: 0.75, fel: -0.25, sway: st.sway * k, style: 2,
      });
      u.uEhud.value = e;
      // the donkey keeps a rope's length behind, a step late, and stubborn about stopping
      const lag = 0.17;
      const sd = s - lag;
      const dWalk = sd < T_STOP + 0.2 || sd > T_GO + 0.1;
      const dx = ehudX(Math.min(sd, T_STOP + 0.15)) + (sd > T_GO + 0.1 ? STEP * 0.8 * (sd - T_GO - 0.1) : 0) - 15.5;
      const gait = dWalk ? (s - P.from) * 1.82 * Math.PI * 2 : (T_STOP - P.from) * 1.82 * Math.PI * 2;
      const bob = dWalk ? 0.35 * Math.sin(gait * 0.5) : 0.5 + 0.4 * Math.sin(s * 5.0);
      u.uDonk.value = [dx, -6.2, gait, bob];
      const h = handAt(e, true);
      const muz = [dx + 0.78 * 11.4, -6.2 + 0.78 * (11.6 - bob)];
      u.uRope.value = [h[0], h[1], muz[0], muz[1]];
      u.uCloudX.value = (t - P.from) * 1.2;
      u.uSun.value = [-44, 14];
      u.uShiver.value = 0.5 * Math.sin(t * 3) + slam(t, KICKS) * 1.5;
      const c = cam(t);
      u.uFocus.value = 56;
      const fk = flicker(t, 2);
      u.uL.value = packLights([
        { dir: [-0.45, 0.12, 0.88], col: L(255, 175, 115, 2.4), rad: 1.2 },                 // the low sun behind
        { pos: [-44, 10, -6], col: L(255, 214, 180, 8 * fk), rad: 2, range: 34 },          // warm key from the left
        { dir: [0.4, 0.5, -0.75], col: L(120, 130, 170, 0.45), rad: 3 },                   // cool sky fill
        { pos: [-44, 14, 121], col: L(255, 150, 70, 30), rad: 6, range: 30, shaft: true },  // the sun's glow behind the hills
      ]);
      u.uLN.value = 4;
      u.uVol.value = 0.02;
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.16, threshold: 0.9, vignette: 0.55, grain: 0.02 }); },
    finish() { return { grade: { shadows: [0.012, 0.01, 0.014], highlights: [1.0, 0.94, 0.85], amount: 0.4 } }; },
  };
};
