// s01-rent · "Well, Moab had been collecting rent for eighteen years." (3.81-9.32). The gate of a
// Moabite town at dusk: Israelite farmers bring a sack, a jar and a lamb to a fat tax-collector at
// his trestle table; on the near gate post, tally marks scratched in a parchment plate, and on the
// drum hit just before "eighteen" the eighteenth is cut. Firelight glows through the gate.
import { grade, ease, clamp01, mix, spring } from '/song/lib/look.js';
import { packLights, flicker, L, stepT } from '/song/lib/paper.js';
import { pose } from '/song/lib/puppet.js';
import { slam, KICKS, BEATS, lastHit } from '/song/lib/sync.js';
import { GATE_GLSL, GATE_UNIFORMS } from '/song/lib/x-road-gate.js';
import { handAt } from '/song/lib/x-road.js';

export const kind = 'shader';

const T_HAND = 4.94, T_BOW = 5.49, T_CUT = 6.59, T_JAR = 7.69;

export default (P) => {
  const span = P.to - P.from;
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / span));
    return { pos: [mix(-3, 2, e), mix(3.2, 3.8, e), mix(-41, -36, e)], target: [mix(-1, 4, e), mix(4.4, 4.8, e), 40], fov: 32, roll: 0 };
  };
  return {
    name: 's01-rent', from: P.from, to: P.to,
    frag: GATE_GLSL,
    uniforms: { ...GATE_UNIFORMS, uAper: 0.3, uFocus: 54, uFillSoft: 7, uAmb: L(64, 62, 72, 1.0), uFillDir: [0.3, 0.55, -0.78], uHaze: L(50, 40, 36, 0.35), uHazeD: 0.004, uDust: 0.9 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      const beat = lastHit(s, BEATS);
      const bp = Math.exp(-6 * beat.ago);          // a pulse on each beat (for nods)
      const k = slam(t, KICKS);
      // the collector: reaching for the sack, patting it, nodding greedily on the beats after the cut
      const got = s >= T_HAND;
      const tally = s >= T_CUT;
      const count = tally ? bp : 0;
      u.uTax.value = pose({
        x: 10.5, y: -7, scale: 0.86, face: -1, lean: got ? 0.18 : 0.12 + 0.05 * Math.sin(s * 4),
        head: 0.08 + 0.25 * count + (got && !tally ? 0.1 : 0), sh: got ? -0.7 + 0.25 * bp : -1.25 + 0.1 * Math.sin(s * 6),
        el: got ? -0.5 : -0.25, fsh: -0.4, fel: -0.6, sway: 0.03 * Math.sin(s * 3), style: 4,
      });
      // the old farmer offers the sack; it lands on the table on the drum; he bows
      const bow = s >= T_BOW ? spring(s, T_BOW, 0.4, 0.3) : 0;
      const f0 = pose({
        x: -0.8, y: -7, scale: 0.8, face: 1, lean: 0.08 + 0.07 * bow - 0.02 * bow * Math.sin((s - T_BOW) * 5),
        head: 0.15 + 0.4 * bow, sh: got ? -0.35 + 0.2 * bow : -1.1 - 0.08 * Math.sin(s * 5), el: got ? -0.3 : -0.55,
        fsh: got ? -0.2 : -1.0, fel: -0.5, sway: 0.05 * Math.sin(s * 2.4), style: 1,
      });
      u.uF0.value = f0;
      if (!got) { const h = handAt(f0); u.uSack.value = [h[0] + 0.3, h[1] - 3.0, 0.08 * Math.sin(s * 5), 0]; }
      else { const land = spring(s, T_HAND, 0.3, 0.45); u.uSack.value = [5.0, -1.05 + 1.2 * (1 - land), -0.15 * (1 - land), 0]; }
      // the woman with the jar shuffles on the beats and holds it out on the hit
      const off = s >= T_JAR ? spring(s, T_JAR, 0.45, 0.3) : 0;
      const f1 = pose({
        x: -9.4 + 0.5 * off, y: -7, scale: 0.78, face: 1, lean: 0.06 + 0.1 * off, head: 0.05 + 0.04 * bp,
        sh: mix(-0.55, -1.0, off), el: mix(-1.0, -0.6, off), fsh: mix(-0.5, -1.1, off), fel: -0.9,
        sway: 0.08 * Math.sin(s * Math.PI / 0.55), style: 3,
      });
      u.uF1.value = f1;
      const hj = handAt(f1);
      u.uJar.value = [hj[0] + 0.4, hj[1] - 2.0, 0.05 * Math.sin(s * 4), 0];
      // the young man with the lamb; the lamb fidgets on the beats
      u.uF2.value = pose({
        x: -17.5, y: -7, scale: 0.8, face: 1, lean: 0.02, head: -0.05 + 0.05 * Math.sin(s * 2),
        sh: 0.6, el: -0.9, fsh: -0.2, fel: -0.4, sway: 0.06 * Math.sin(s * 2.2 + 1), style: 2,
      });
      u.uLamb.value = [-14.2 + 0.2 * Math.sin(s * 1.3), -7, 0, s * 4 + 6 * bp];
      // the eighteenth tally: scratched in on the drum hit before "eighteen"
      const cutK = clamp01((t - T_CUT + 0.02) / 0.12);
      u.uTally.value = t >= T_CUT - 0.02 ? 18 : 17;
      u.uCutK.value = t >= T_CUT - 0.02 ? cutK : 1;
      // the raw fibre of the fresh cut glints, then dulls
      u.uFresh.value = t >= T_CUT - 0.02 ? Math.exp(-2.2 * Math.max(0, t - T_CUT - 0.1)) : 0;
      // the post takes the cut: a short jolt of the post alone
      u.uPost.value = t >= T_CUT ? -0.18 * slam(t, [T_CUT], 0.3) : 0;   // ark-shake-ok: the gate post jolts under the knife
      const fk = flicker(t, 1), ff = flicker(t, 4);
      u.uFlame.value = 0.85 + 0.25 * (fk - 0.95) * 3 + 0.15 * k;
      u.uFocus.value = mix(56, 50, ease.inOut3(clamp01((t - P.from) / span)));
      u.uL.value = packLights([
        { pos: [12.6, 12.6, 6.6], col: L(255, 170, 100, 7 * fk), rad: 0.8, range: 18 },          // the torch on the gate post
        { pos: [-4, -4, 37.5], col: L(255, 150, 80, 6 * ff), rad: 2, range: 10 },              // fire in the gateway
        { dir: [0.35, 0.22, 0.9], col: L(220, 170, 140, 1.1), rad: 1.2 },                         // the dusk behind
        { dir: [-0.35, 0.5, -0.8], col: L(110, 120, 160, 0.45), rad: 3 },                         // cool fill
      ]);
      u.uLN.value = 4;
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.18, threshold: 0.85, vignette: 0.55, grain: 0.02 }); },
    finish() { return { grade: { shadows: [0.012, 0.01, 0.014], highlights: [1.0, 0.94, 0.85], amount: 0.4 } }; },
  };
};
