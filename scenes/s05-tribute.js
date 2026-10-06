// s05-tribute · "And folks lined up with tribute like they always had before." (20.82-25.21).
// Eglon, huge and crowned, sunk in his throne; a line of tribute bearers shuffles forward a step on
// every beat (baskets, a jar, a sack, a goat on a cord); an old scribe at the foot of the throne cuts a
// tally on his wax tablet each time. The king waves them on with a lazy hand on the drum hits.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { L, stepT, packLights } from '/song/lib/paper.js';
import { slam, BEATS, lastHit, KICKS } from '/song/lib/sync.js';
import { THRONE_GLSL, THRONE_UNIFORMS, ROOM, TONES, OFF, roomLights, setTones, pose } from '/song/lib/x-throne.js';

export const kind = 'shader';

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    return { pos: [mix(12, 9, e), 10, mix(-30, -26, e)], target: [mix(11, 8, e), 3.5, 30], fov: 36, roll: 0 };
  };
  // the line advances a step on each beat, with a little settle
  const steps = (t) => {
    const b = lastHit(t, BEATS);
    const n = BEATS.filter((x) => x >= P.from - 0.01 && x <= t).length;
    return { n, k: ease.out3(clamp01(b.ago / 0.18)) };
  };
  return {
    name: 's05-tribute', from: P.from, to: P.to,
    frag: THRONE_GLSL,
    uniforms: { ...THRONE_UNIFORMS, uAper: 0.4, uFocus: 50, uAmb: L(70, 72, 85, 2.0), uFillDir: [0.3, 0.55, -0.78], uFillSoft: 7, uHaze: L(30, 34, 48, 0.5), uHazeD: 0.002, uDust: 1.2, uVol: 0.0, uVolTint: [0.8, 0.9, 1.15], uDrape: [-80, 80], uGround: -14, uWin: [1, 0.25, 0.5],
      uLay: [0, 1, 1, 1, 0, 0, 2], uCarry: [4, 1, 2, 3, 0, 0, 0] },
    camera: cam,
    update(t, u) {
      u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      const s = stepT(t);
      const { n, k } = steps(s);
      const adv = (n - 1 + k) * 0.75;
      const ph = n % 2 ? 1 : -1;
      const sway = (i) => ph * (i % 2 ? 1 : -1) * 0.12 * (1 - k * 0.6);
      const F = ROOM.floor;
      // 0 the scribe (near), 1..3 bearers (mid), 6 the king
      const tally = slam(s, KICKS.filter((x) => x > P.from), 0.3);
      u.uF0.value = pose({ x: -2, y: F, scale: 0.92, face: 1, lean: 0.12, head: 0.25, sh: -0.9, el: -1.0, fsh: -0.6 - 0.25 * tally, fel: -1.2, sway: 0.05, style: 1 });
      u.uF1.value = pose({ x: 20 - adv, y: F, scale: 0.95, face: -1, lean: 0.05 + 0.03 * k, head: 0.12, sh: -2.7, el: 0.35, fsh: 0.1, fel: -0.2, sway: sway(0), style: 3 });
      u.uF2.value = pose({ x: 28.5 - adv, y: F, scale: 1.0, face: -1, lean: 0.12, head: 0.05, sh: -0.8, el: -0.9, fsh: -0.6, fel: -0.8, sway: sway(1), style: 1 });
      u.uF3.value = pose({ x: 37 - adv, y: F, scale: 0.98, face: -1, lean: 0.18, head: 0.1, sh: -0.35, el: -1.1, fsh: -0.3, fel: -0.9, sway: sway(2), style: 0 });
      u.uF4.value = pose({ x: 33 - adv, y: F - 0.4, scale: 0.9, face: -1, lean: 0.06, head: -0.05, sh: -0.6, el: -0.5, fsh: 0.0, fel: -0.2, sway: sway(3), style: 2 });
      u.uF5.value = OFF;
      // the king: sunk in the throne, chin up, waving them on with a lazy hand on the hits
      const wave = slam(s, KICKS.filter((x) => x > P.from + 0.5), 0.5);
      u.uF6.value = pose({ x: ROOM.throneX - 0.4, y: F - 1.2, scale: 1.15, face: 1, lean: -0.08, head: -0.18 + 0.05 * Math.sin(s * 2.3), sh: -0.5 - 0.35 * wave, el: -1.3 + 0.5 * wave, fsh: -0.2, fel: -0.6, sway: 0, style: 4 });
      u.uGoat.value = [26.5 - adv, F, n];
      setTones(u, [TONES.scribe, TONES.bearerA, TONES.bearerB, TONES.bearerC, TONES.bearerB, null, TONES.eglon]);
      u.uFocus.value = 30 - cam(t).pos[2] - 4;
      const lights = roomLights(t, { moon: 1.5, cand: 0.7, key: 0.8, extra: [
        { pos: [ROOM.throneX + 8, 30, 4], col: L(255, 200, 150, 2.0), rad: 4, range: 30 },
        { pos: [ROOM.throneX + 2, 17, 27.2], col: L(255, 160, 80, 6), rad: 1, range: 7 },
      ] });
      u.uL.value = packLights(lights);
      u.uLN.value = lights.length;
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.12, threshold: 1.0, vignette: 0.55, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.01, 0.012, 0.025], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
