// s13-porch · "Then he slipped out past the porch, locked the door, and left the guard." (55.856-59.977).
// Outside the summer room at night. Ehud slips out between the gold doors, turns and pulls them shut
// (they meet on the drum hit), the camera closes on the box lock: he slides the big brass key in,
// and on the hit it rolls over, the tumblers in the cutaway lift and the bolt shoots across. Key out,
// into his belt; the camera eases back as he strolls off past the guard dozing against the wall.
import { grade, ease, clamp01, mix, spring, keys } from '/song/lib/look.js';
import { L, stepT, packLights, flicker } from '/song/lib/paper.js';
import { pose, handOf } from '/song/lib/x-throne.js';
import { PORCH_GLSL, PORCH_UNIFORMS, PORCH, porchTones } from '/song/lib/x-throne-porch.js';

export const kind = 'shader';
const T_TURN = 56.55, T_SHUT = 57.05, T_KEYIN = 57.42, T_LOCK = 58.15, T_OUT = 58.55, T_GO = 59.01;
const F = PORCH.floor;

export default (P) => {
  const camKeys = [
    [P.from, [-2.5, 6.5, -40, -2.0, 4.0]],
    [57.25, [-1.5, 6.0, -34, -0.5, 4.0]],
    [57.75, [-0.8, 4.6, -3.5, 0.6, 3.7]],
    [58.6, [-0.6, 4.5, -2.5, 0.8, 3.7]],
    [59.15, [-7.0, 6.0, -34, -7.5, 4.0]],
    [P.to, [-9.0, 6.0, -36, -9.5, 4.0]],
  ];
  const cam = (t) => {
    const k = keys(t, camKeys, ease.inOut3);
    return { pos: [k[0], k[1], k[2]], target: [k[3], k[4], PORCH.Z.door], fov: mix(38, 30, clamp01((k[2] + 34) / 35)), roll: 0 };
  };
  // where the key's bow sits when fully in (world), for Ehud's hand
  const bowAt = (inK) => [PORCH.lock[0] + PORCH.lockS * (-4.6 + 3.0 * inK - 3.2), PORCH.lock[1]];
  const ARM = { sh: -0.9, el: -0.5 };
  const reach = handOf(pose({ x: 0, y: F, scale: 0.95, face: 1, ...ARM }));
  return {
    name: 's13-porch', from: P.from, to: P.to,
    frag: PORCH_GLSL,
    uniforms: { ...PORCH_UNIFORMS, uAper: 0.35, uFocus: 50, uAmb: L(70, 74, 90, 1.8), uFillDir: [0.4, 0.5, -0.75], uFillSoft: 6, uDust: 1.2, uHaze: L(30, 34, 48, 0.5), uHazeD: 0.002 },
    camera: cam,
    update(t, u) {
      u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      const s = stepT(t);
      porchTones(u);
      // the doors: ajar as he slips out, pulled shut to meet on the hit
      const shut = spring(s, T_SHUT - 0.18, 0.28, 0.25);
      u.uDoor.value = Math.max(0, mix(0.42, 0, shut));
      // the key: in, rolled over on the hit, out
      const kin = ease.inOut3(clamp01((s - T_KEYIN) / 0.35)) * (1 - ease.inOut3(clamp01((s - T_OUT) / 0.3)));
      const turn = Math.PI * ease.inOut3(clamp01((s - T_LOCK + 0.04) / 0.3));
      const shown = s >= T_KEYIN - 0.15 && s < T_OUT + 0.32;
      u.uKey.value = [kin, turn, shown ? 1 : 0];
      u.uLockK.value = ease.out3(clamp01((s - T_LOCK - 0.08) / 0.2));
      // Ehud
      let e;
      if (s < T_TURN) {
        const k = clamp01((s - P.from) / (T_TURN - P.from));
        e = pose({ x: mix(6.2, 1.0, ease.out3(k)), y: F, scale: 0.95, face: -1, lean: 0.12, head: 0.1, sh: 0.2, el: -0.6, fsh: -0.2, fel: -0.4, sway: 0.4 * Math.sin(s * 10), style: 2 });
      } else if (s < T_KEYIN - 0.2) {
        // turned to the doors, both hands on them, pulling
        const pull = clamp01((s - T_TURN) / 0.4);
        e = pose({ x: mix(-1.0, -2.2, pull), y: F, scale: 0.95, face: 1, lean: mix(0.15, -0.12, pull), head: 0.05, sh: -1.45 + 0.2 * pull, el: -0.1, fsh: -1.35, fel: -0.1, sway: -0.15 * pull, style: 2 });
      } else if (s < T_OUT + 0.32) {
        // at the lock, hand on the key's bow
        const b = bowAt(kin);
        e = pose({ x: b[0] - reach[0], y: F, scale: 0.95, face: 1, lean: 0.05, head: 0.18, ...ARM, fsh: 0.1, fel: -0.3, sway: 0.05, style: 2 });
      } else if (s < T_GO) {
        // the key to his belt
        const k = clamp01((s - T_OUT - 0.32) / 0.2);
        const b = bowAt(0);
        e = pose({ x: b[0] - reach[0], y: F, scale: 0.95, face: 1, lean: 0.02, head: 0.05 - 0.1 * k, sh: mix(ARM.sh, 0.3, k), el: mix(ARM.el, -1.2, k), fsh: 0.1, fel: -0.3, sway: 0.05, style: 2 });
      } else {
        // and off he strolls, past the guard, a glance back at him
        const k = clamp01((s - T_GO) / (P.to - T_GO));
        const x0 = bowAt(0)[0] - reach[0];
        e = pose({ x: mix(x0, -21, k), y: F, scale: 0.95, face: -1, lean: 0.04, head: -0.05 + 0.25 * clamp01((s - 59.4) / 0.2), sh: 0.3 * Math.sin(s * 10), el: -0.4, fsh: -0.3 * Math.sin(s * 10), fel: -0.4, sway: 0.38 * Math.sin(s * 10), style: 2 });
      }
      u.uF0.value = e;
      // the guard, dozing against the wall: chin on his chest, breathing slow
      const br = Math.sin(t * 2.1);
      u.uF1.value = pose({ x: -13.5, y: F, scale: 0.98, face: 1, lean: -0.1 + 0.02 * br, head: 0.75 + 0.06 * br, sh: 0.08, el: -0.15, fsh: 0.12, fel: -0.1, sway: 0.18, style: 5 });
      const c = cam(t);
      const close = clamp01((c.pos[2] + 30) / 20);
      u.uFocus.value = mix(PORCH.Z.ehud - c.pos[2], PORCH.Z.lock - c.pos[2], close);
      u.uAper.value = mix(0.35, 0.12, close);
      const fl = flicker(t, 5.2);
      const glint = Math.max(0, Math.sin(Math.PI * clamp01((s - T_LOCK) / 0.35)));
      u.uL.value = packLights([
        { dir: [0.7, 0.42, -0.58], col: L(150, 170, 220, 1.5), rad: 1.5 },                      // moonlight from the open porch
        { pos: [17, 13, 9], col: L(255, 160, 80, 10 * fl), rad: 0.8, range: 18 },               // a lamp on the wall right of the door
        { pos: [PORCH.doorX, 5, 19], col: L(255, 150, 70, 40 * u.uDoor.value * flicker(t, 1.1)), rad: 1, range: 16 },   // the room's candles, through the gap
        { pos: [PORCH.lock[0] - 1, PORCH.lock[1] + 2.5, 8], col: L(255, 220, 170, 2.5 + 4 * glint), rad: 0.6, range: 7 },  // the light on the lock
        { pos: [-9, 12, 8], col: L(255, 150, 80, 3.5 * fl), rad: 0.8, range: 12 },               // a dimmer lamp by the guard
      ]);
      u.uLN.value = 5;
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.12, threshold: 1.0, vignette: 0.55, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.01, 0.012, 0.025], highlights: [1.0, 0.95, 0.86], amount: 0.4 } }; },
  };
};
