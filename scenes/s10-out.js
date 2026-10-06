// s10-out · "Out went every servant. Up got Eglon from his seat." (42.76-47.15).
// The courtiers trot out of the fancy door one after another on twos (each slips through the opening
// into the dark corridor beyond); the gold doors swing shut on the drum hit; then Eglon heaves himself
// up out of the throne in three comic shoves, one on each beat, and settles with a wobble.
import { grade, ease, clamp01, mix, spring } from '/song/lib/look.js';
import { L, stepT, packLights } from '/song/lib/paper.js';
import { slam } from '/song/lib/sync.js';
import { THRONE_GLSL, THRONE_UNIFORMS, ROOM, TONES, OFF, roomLights, setTones, pose } from '/song/lib/x-throne.js';

export const kind = 'shader';
const T_SHUT = 44.43, HEAVES = [44.95, 45.5, 46.05], T_SEAT = 46.45;
const Z_MID = 18, Z_COR = 46;

export default (P) => {
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from - 1.6) / 2.2));
    return { pos: [mix(-17, -3, e), mix(8, 7.5, e), mix(-40, -32, e)], target: [mix(-17, -1, e), mix(4, 5.5, e), 30], fov: 38, roll: 0 };
  };
  // a courtier trotting left: in the room on the mid flat, then through the door into the corridor
  const walker = (t, s, x0, style, seed, c) => {
    const v = 18;
    const x = x0 - v * Math.max(0, s - P.from);
    const sway = 0.42 * Math.sin(s * 11 + seed);
    const p = { y: ROOM.floor, scale: style === 5 ? 1.0 : 0.93, face: -1, lean: 0.12, head: 0.05, sh: style === 5 ? 0.1 : -0.1, el: style === 5 ? -1.45 : -0.6, fsh: 0.2, fel: -0.3, sway, style };
    if (x > -31) return { lay: 1, a: pose({ ...p, x }) };
    // seen through the door, a flat further back: keep the same size and place on screen at the swap
    const k = (Z_COR - c.pos[2]) / (Z_MID - c.pos[2]);
    const xc = c.pos[0] + (x - c.pos[0]) * k * 0.9;
    const yc = c.pos[1] + (ROOM.floor - c.pos[1]) * k;
    if (xc < -50) return { lay: 9, a: OFF };
    return { lay: 3, a: pose({ ...p, x: xc, y: Math.max(yc, ROOM.floor - 6), scale: p.scale * k }) };
  };
  return {
    name: 's10-out', from: P.from, to: P.to,
    frag: THRONE_GLSL,
    uniforms: { ...THRONE_UNIFORMS, uAper: 0.35, uFocus: 60, uAmb: L(70, 72, 85, 2.0), uFillDir: [0.3, 0.55, -0.78], uFillSoft: 7, uHaze: L(30, 34, 48, 0.5), uHazeD: 0.002, uDust: 1.2, uVol: 0.0, uVolTint: [0.8, 0.9, 1.15], uDrape: [-80, 80], uGround: -14, uWin: [0.25, 0.8, 0.6], uCand: [1, 1] },
    camera: cam,
    update(t, u) {
      u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      const s = stepT(t);
      const F = ROOM.floor;
      const c = cam(s);
      const ws = [walker(t, s, -25, 5, 0, c), walker(t, s, -18, 3, 1.3, c), walker(t, s, -11, 1, 2.1, c), walker(t, s, -4, 5, 3.7, c)];
      // Ehud waits, hands folded, watching them go; then turns his head back to the king
      const back = clamp01((s - T_SHUT) / 0.3);
      u.uF0.value = pose({ x: 17.5, y: F, scale: 0.95, face: -1, lean: 0.04, head: mix(-0.05, 0.12, back) + 0.03 * Math.sin(s * 2), sh: 0.15, el: -1.2, fsh: 0.2, fel: -1.0, sway: 0.1, style: 2 });
      u.uF1.value = ws[0].a; u.uF2.value = ws[1].a; u.uF3.value = ws[2].a; u.uF4.value = ws[3].a; u.uF5.value = OFF;
      u.uLay.value = [0, ws[0].lay, ws[1].lay, ws[2].lay, ws[3].lay, 9, 2];
      u.uCarry.value = [0, 5.5, 0, 4, 5.5, 0, 0];
      // the doors: open, then shut on the hit with a little bounce of the leaves
      const shut = spring(t, T_SHUT - 0.12, 0.3, 0.25);
      u.uDoor.value = Math.max(0, mix(0.82, 0, shut));
      // Eglon heaves up in three shoves, then wobbles still
      let up = 0, push = 0;
      HEAVES.forEach((h, i) => { up += spring(s, h, 0.3, 0.45) / 3; push += slam(s, [h], 0.35); });
      const settle = spring(s, T_SEAT, 0.5, 0.5);
      const wob = 0.05 * Math.sin(s * 9) * Math.exp(-Math.max(0, s - T_SEAT) * 3) * (s > T_SEAT ? 1 : 0);
      u.uF6.value = pose({ x: ROOM.throneX - 0.4, y: F - 1.2 + 6.0 * up, scale: 1.15, face: 1, lean: 0.3 * push + 0.06 * up + wob, head: -0.05 - 0.15 * settle + 0.15 * push,
        sh: mix(-0.3, 0.3, Math.min(1, push + 0.5 * (1 - settle) * up)), el: mix(-1.3, 0.1, Math.min(1, push + 0.5 * (1 - settle) * up)), fsh: 0.2 * push, fel: -0.5, sway: wob, style: 4 });
      setTones(u, [TONES.ehud, TONES.guard, TONES.servant, TONES.scribe, TONES.guard, null, TONES.eglon]);
      u.uFocus.value = mix(Z_MID, 25, clamp01((s - T_SHUT) / 0.8)) - c.pos[2];
      const lights = roomLights(t, { moon: 1.5, cand: 0.8, key: 1.0, extra: [
        { pos: [ROOM.doorX + 2, 8, Z_COR + 3], col: L(255, 170, 100, 4 * (1 - shut)), rad: 1, range: 10 },
        { pos: [ROOM.doorX + 13, 20, 8], col: L(255, 190, 130, 5.5), rad: 3, range: 26 },
      ] });
      u.uL.value = packLights(lights);
      u.uLN.value = lights.length;
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.12, threshold: 1.0, vignette: 0.55, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.01, 0.012, 0.025], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
