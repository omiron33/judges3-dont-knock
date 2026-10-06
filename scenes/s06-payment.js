// s06-payment · "Ehud brought the payment, gave the guards a friendly grin," (25.21-29.6).
// Ehud steps up at the head of the line with the tribute sack, bows and sets it down on "payment";
// two guards have their spears crossed before the throne; on "grin" he gives them a cheerful tilt of
// the head, freezes, and on the next beat the spears lift. Eglon waits on his throne behind, soft.
import { grade, ease, clamp01, mix, spring } from '/song/lib/look.js';
import { L, stepT, packLights } from '/song/lib/paper.js';
import { BEATS, lastHit } from '/song/lib/sync.js';
import { THRONE_GLSL, THRONE_UNIFORMS, ROOM, TONES, OFF, roomLights, setTones, pose, handOf } from '/song/lib/x-throne.js';

export const kind = 'shader';
const T_PAY = 26.3, T_DOWN = 26.75, T_GUARDS = 27.42, T_GRIN = 28.5, T_LIFT = 29.05;

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    return { pos: [mix(22, 21, e), mix(6, 5.5, e), mix(-32, -25, e)], target: [mix(20, 21, e), mix(2, 2.5, e), 30], fov: 36, roll: 0 };
  };
  const spearTilt = (t, s) => {
    // crossed (leaning forward toward each other) until the lift on the beat after the grin
    const up = spring(s, T_LIFT, 0.35, 0.3);
    return mix(-0.62, 0.0, up);
  };
  return {
    name: 's06-payment', from: P.from, to: P.to,
    frag: THRONE_GLSL,
    uniforms: { ...THRONE_UNIFORMS, uAper: 0.45, uFocus: 40, uAmb: L(70, 72, 85, 2.0), uFillDir: [0.3, 0.55, -0.78], uFillSoft: 7, uHaze: L(30, 34, 48, 0.5), uHazeD: 0.002, uDust: 1.2, uVol: 0.0, uVolTint: [0.8, 0.9, 1.15], uDrape: [-80, 80], uGround: -14, uWin: [0.3, 0.45, 1], uCand: [1, 0],
      uLay: [0, 1, 1, 9, 9, 9, 2] },
    camera: cam,
    update(t, u) {
      u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      const s = stepT(t);
      const F = ROOM.floor;
      // Ehud: walks in on twos, bows to set down the sack, straightens, grins at the guards
      const walk = clamp01((s - P.from) / (T_PAY - 0.1 - P.from));
      const x = mix(36, 29, ease.out3(walk));
      const stride = walk < 1 ? 0.38 * Math.sin(s * 10.5) : 0.04;
      const bow = clamp01((s - T_PAY) / 0.35) * (1 - clamp01((s - T_DOWN - 0.25) / 0.45));
      const grin = clamp01((s - T_GRIN) / 0.12);
      const look = clamp01((s - T_GUARDS) / 0.25);
      const holding = s < T_DOWN;
      const ehud = pose({ x, y: F, scale: 0.95, face: -1, lean: 0.62 * ease.inOut3(bow) + 0.03,
        head: mix(0.05 + 0.25 * bow, -0.12, look) - 0.22 * grin + 0.03 * Math.sin(s * 3),
        sh: holding ? -0.55 - 0.3 * bow : mix(-0.35, 0.25, look), el: holding ? -0.75 : -0.35 - 0.2 * grin,
        fsh: holding ? -0.45 : 0.15, fel: holding ? -0.9 : -0.3, sway: stride, style: 2 });
      u.uF0.value = ehud;
      u.uCarry.value = [holding ? 3 : 0, 0, 0, 0, 0, 0, 0];
      // once set down, the sack sits on the floor where his hand left it
      const hx = handOf(pose({ x: 29, y: F, scale: 0.95, face: -1, lean: 0.62, sh: -0.85, el: -0.75 }))[0];
      u.uProp.value = holding ? [0, 0, 0] : [hx - 0.6, F + 2.45 * 0.95, 3];
      // the guards: spears crossed, then lifted; a nod between them on the grin
      const tilt = spearTilt(t, s);
      const c = 5.5 + tilt / 3;
      u.uCarry.value = [holding ? 3 : 0, c, c, 0, 0, 0, 0];
      const nod = 0.12 * clamp01((s - T_GRIN - 0.15) / 0.2) * (1 - clamp01((s - T_LIFT) / 0.3));
      u.uF1.value = pose({ x: 13.5, y: F, scale: 1.0, face: 1, lean: 0.02, head: 0.05 + nod, sh: 0.1, el: -1.45, fsh: 0.1, fel: -0.3, sway: 0.08, style: 5 });
      u.uF2.value = pose({ x: 22.5, y: F, scale: 1.0, face: -1, lean: 0.02, head: 0.05 + nod, sh: 0.1, el: -1.45, fsh: 0.1, fel: -0.3, sway: -0.06, style: 5 });
      u.uF3.value = OFF; u.uF4.value = OFF; u.uF5.value = OFF;
      u.uF6.value = pose({ x: ROOM.throneX - 0.4, y: F - 1.2, scale: 1.15, face: 1, lean: -0.08, head: -0.15 + 0.04 * Math.sin(s * 1.7), sh: -0.4, el: -1.2, fsh: -0.2, fel: -0.6, sway: 0, style: 4 });
      setTones(u, [TONES.ehud, TONES.guard, TONES.guard, null, null, null, TONES.eglon]);
      u.uFocus.value = 12 - cam(t).pos[2];
      const lights = roomLights(t, { moon: 1.5, cand: 0.7, candB: 0, key: 0.8, extra: [
        { pos: [34, 22, -4], col: L(255, 200, 150, 6), rad: 4, range: 24 },
        { pos: [ROOM.throneX + 2, 17, 27.2], col: L(255, 160, 80, 5), rad: 1, range: 7 },
      ] });
      u.uL.value = packLights(lights);
      u.uLN.value = lights.length;
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.12, threshold: 1.0, vignette: 0.55, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.01, 0.012, 0.025], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
