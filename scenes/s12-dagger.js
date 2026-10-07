// s12-dagger · "His left hand found the dagger. Well, the message landed hard." (51.54-55.856).
// SHADOW THEATRE. A parchment screen lit from behind by one candle; the two puppets show only as
// shadows. On "left hand" Ehud's hand drops to his thigh; on "found the dagger" he draws the blade out,
// slow; he holds it low while the king leans in; on "landed" he draws back, and on "hard" the thrust
// lands: one hard stop-time slam (the film's one violent collision, the frame takes one short damped
// jolt, gone inside 0.3 s), the king recoils, and dried-blood crimson ink blooms through the parchment
// and runs. The candle gutters. No gore, nothing anatomical: only shadow and ink.
import { grade, ease, clamp01, mix, spring } from '/song/lib/look.js';
import { L, stepT, packLights, flicker } from '/song/lib/paper.js';
import { slam } from '/song/lib/sync.js';
import { pose, handOf } from '/song/lib/x-throne.js';
import { SHADOW_GLSL, SHADOW_UNIFORMS, SCREEN } from '/song/lib/x-throne-shadow.js';

export const kind = 'shader';
const T_LEFT = 51.95, T_FOUND = 52.63, T_DAGGER = 53.05, T_WELL = 53.87, T_LANDED = 54.67, T_HARD = 55.23;
const LP = [0.0, 3.5, 24];   // the candle behind the screen
const K = (SCREEN.z - LP[2]) / (SCREEN.fig - LP[2]);   // shadow magnification
// a point on the puppet flat whose shadow falls at screen point (x, y), and back
const toFig = (x, y) => [LP[0] + (x - LP[0]) / K, LP[1] + (y - LP[1]) / K];
const toScreen = (x, y) => [LP[0] + (x - LP[0]) * K, LP[1] + (y - LP[1]) * K];

export default (P) => {
  // the one jolt on the blow: a damped kick of the whole frame, gone within 0.3 s
  const jolt = (t) => {
    const x = t - T_HARD;
    if (x < 0 || x > 0.3) return [0, 0];
    const k = Math.exp(-x * 16) * Math.cos(x * 70);
    return [0.55 * k, -0.35 * k];
  };
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (T_HARD - P.from)));
    const j = jolt(t);
    return { pos: [mix(-1.5, 0.5, e) + j[0], 6.0 + j[1], mix(-46, -39, e)], target: [mix(-0.5, 0.5, e) + j[0] * 0.5, 5.0 + j[1] * 0.5, 8], fov: 36, roll: j[0] * 0.01 };
  };
  return {
    name: 's12-dagger', from: P.from, to: P.to,
    // Ehud is left-handed: the whole shadow play is shown mirrored, so the blade is in his left hand
    frag: SHADOW_GLSL.replace('camRay(vec2(uRes.x - fc.x, fc.y), ro)', 'camRay(fc, ro)'),
    uniforms: { ...SHADOW_UNIFORMS, uAper: 0.3, uFocus: 40, uAmb: L(60, 55, 55, 0.6), uFillDir: [0.2, 0.5, -0.84], uFillSoft: 6, uBg: [0.002, 0.002, 0.002], uDust: 0.8 },
    camera: cam,
    update(t, u) {
      u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      const s = stepT(t);
      // Ehud (left, facing right) and Eglon (right, facing left), placed so their shadows meet
      const ea = toFig(-7.4, SCREEN.y0 + 1.6), ga = toFig(5.6, SCREEN.y0 + 1.6);
      const sc = 0.55;
      u.uGroundY.value = ea[1] + 0.2;
      // the hand: to the thigh, draws the blade slow, holds it low, draws back, thrusts on "hard"
      const toThigh = ease.inOut3(clamp01((s - T_LEFT) / 0.45));
      const draw = ease.inOut3(clamp01((s - T_FOUND) / 0.75));
      const back = ease.inOut3(clamp01((s - T_LANDED) / 0.4));
      const hit = s >= T_HARD ? 1 : ease.in2(clamp01((s - T_HARD + 0.12) / 0.12));
      const after = clamp01((s - T_HARD) / 0.6);
      let sh = mix(-0.2, 0.15, toThigh), el = mix(-0.4, 0.05, toThigh);
      sh = mix(sh, -0.55, draw); el = mix(el, -0.9, draw);
      sh = mix(sh, 0.35, back); el = mix(el, -1.5, back);
      sh = mix(sh, -1.45, hit); el = mix(el, -0.05, hit);
      const lean = 0.05 + 0.1 * draw - 0.12 * back + 0.32 * hit;
      const eh = pose({ x: ea[0] - 2.0 * hit * 0, y: ea[1], scale: sc, face: 1, lean, head: 0.08 - 0.05 * back + 0.1 * hit, sh, el, fsh: mix(0.1, -0.4, hit), fel: -0.5, sway: 0.15 * hit, style: 2 });
      u.uF0.value = eh;
      // the blade: grows out of the sheath at the thigh as it is drawn, then rides the fist
      const h = handOf(eh);
      const ang = mix(-Math.PI / 2 + 0.25, mix(-0.25, 0.1, back), draw) + mix(0, 0.1, hit);
      const len = 5.8 * sc * clamp01((s - T_FOUND) / 0.6);
      u.uBlade.value = [h[0], h[1], mix(ang, -0.05, hit), len];
      // the king: leans in, unsuspecting; on the blow he recoils, arms up, then sags
      const lean2 = ease.inOut3(clamp01((s - T_WELL) / 0.5)) * 0.12;
      const recoil = spring(s, T_HARD, 0.3, 0.25);
      const sag = 0.45 * ease.in2(clamp01((s - T_HARD - 0.25) / 0.6));
      u.uF1.value = pose({ x: ga[0], y: ga[1] - 1.6 * sag, scale: sc * 1.15, face: -1, lean: 0.06 + lean2 - 0.38 * recoil + 0.5 * sag, head: 0.1 - 0.5 * recoil + 0.4 * sag,
        sh: mix(-0.3, -2.4, recoil * (1 - sag)), el: mix(-1.2, -0.6, recoil), fsh: mix(-0.1, -2.0, recoil * (1 - sag)), fel: -0.4, sway: 0.1 * recoil, style: 4 });
      // the ink: blooms from where the blade's shadow meets him, runs down
      const tip = toScreen(h[0] + Math.cos(-0.05) * len, h[1] + Math.sin(-0.05) * len);
      const bloom = s >= T_HARD ? ease.out3(clamp01((t - T_HARD) / 0.55)) : 0;
      u.uInk.value = [tip[0] - 0.8, tip[1] + 0.3, bloom > 0 ? 0.4 + 3.6 * bloom : 0, 7 * ease.inOut3(clamp01((t - T_HARD - 0.15) / 0.5))];
      // the candle: steady, then it gutters after the blow
      const gut = s >= T_HARD ? 1 : 0;
      const fl = flicker(t, 2.0);
      const gk = gut ? 0.62 + 0.25 * Math.sin(t * 31) * Math.sin(t * 17 + 1) + 0.15 * slam(t, [T_HARD], 0.3) : fl;
      const sway = gut ? 0.5 * Math.sin(t * 13) * Math.exp(-(t - T_HARD) * 2) : 0.1 * Math.sin(t * 2.0);
      u.uL.value = packLights([
        { pos: [LP[0] + sway, LP[1], LP[2]], col: L(255, 160, 80, 7 * gk), rad: 0.3, range: 16 },
        { pos: [LP[0] + sway, LP[1] + 4, LP[2] + 6], col: L(255, 140, 60, 1.0 * gk), rad: 3, range: 18 },
        { dir: [-0.4, 0.5, -0.77], col: L(150, 150, 175, 0.25), rad: 2 },
      ]);
      u.uLN.value = 3;
      u.uFocus.value = SCREEN.z - cam(t).pos[2];
    },
    post(t) { return grade(t, { exposure: 1.25, bloom: 0.16, threshold: 0.95, vignette: 0.6, grain: 0.024 }); },
    finish() { return { grade: { shadows: [0.012, 0.008, 0.006], highlights: [1.0, 0.94, 0.84], amount: 0.4 } }; },
  };
};
