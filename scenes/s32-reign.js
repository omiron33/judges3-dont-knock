// s32-reign · "And the king's long reign was past." (126.17-128.36). Close on the Jordan at dawn: Eglon's
// crown of tarnished gold foil drifts away downstream between the buckling strips of dark painted
// paper, bobbing and slowly turning in the current, catching the low sun on each turn.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, L, stepT } from '/song/lib/paper.js';
import { EPH_HEAD, EPH_UNIFORMS, PAPER_TRACE } from '/song/lib/x-ephraim.js';

export const kind = 'shader';

const GLSL = EPH_HEAD + /* glsl */ `
uniform vec4 uCrown;      // x, y, z of the crown, its scale
uniform vec2 uTurn;       // in-plane tilt, turn (cos of the spin: the band seen from the side)
uniform float uWT;
#define NL 9
// 0 near water, 1 water in front of the crown, 2 the crown, 3 water behind, 4 far water,
// 5 far bank, 6 hills, 7 sky, 8 light box
float sheetZ(int i, vec2 p) {
  if (i == 0) return waterZ(4.0, p, 0.0, uWT, 0.7);
  if (i == 1) return waterZ(11.0, p, 1.0, uWT, 0.6);
  if (i == 2) return uCrown.z;
  if (i == 3) return waterZ(25.0, p, 3.0, uWT, 0.6);
  if (i == 4) return waterZ(36.0, p, 4.0, uWT, 0.5);
  if (i == 5) return 50.0;
  if (i == 6) return 72.0;
  if (i == 7) return 96.0;
  return 101.0;
}
float sheetOpac(int i) { if (i == 7) return 0.93; if (i == 8) return 0.0; return 1.0; }
float waterH(int i) { return i == 0 ? -10.5 : (i == 1 ? -3.6 : (i == 3 ? -1.4 : -0.2)); }
float sheetSD(int i, vec2 p, bool hq) {
  if (i == 0 || i == 1 || i == 3 || i == 4) return waterSD(p, waterH(i), float(i) + 10.0, uWT, hq);
  if (i == 2) return crownSD(p, uCrown.xy, uCrown.w, uTurn.x, uTurn.y);
  if (i == 5) {
    // the dark wooded bank, high on the left (the words sit over it), falling away to the right
    float y = 1.0 + 9.0 * smoothstep(30.0, -30.0, p.x) + 1.2 * sin(p.x * 0.3);
    float d = woodsSD(p, y - 2.0, 3.0, 7.0, 2.4, 15.0, hq);
    return min(d, sdBelow(p, y));
  }
  if (i == 6) return hillSD(p, 4.0, 10.0, 0.025, 16.0, 0.4, hq);
  if (i == 7) return max(-1.0, -sdCircle(p - vec2(24.0, 7.0), 4.0));
  return -1.0;
}
Mat sheetMat(int i, vec2 p, float sd) {
  if (i == 0 || i == 1 || i == 3 || i == 4) { Mat m = waterMat(p, waterH(i), float(i) + 10.0, uWT, i >= 1 ? 1.0 : 0.0); m.bump = 0.3; return m; }
  if (i == 2) return crownMat(p, uCrown.xy, uCrown.w, uTurn.x, uTurn.y);
  if (i == 5) { Mat m = mCard(lin(vec3(0.04, 0.04, 0.035))); m.tear = 0.4; m.fuzz = 0.04; m.seed = 15.0; return m; }
  if (i == 6) { Mat m = hillMat(p, lin(vec3(0.2, 0.17, 0.15)), 16.0, 0.2); m.trans = 0.4; return m; }
  if (i == 7) { Mat m = skyMat(p, 0.0, 1.0, 17.0); m.alb *= mix(1.0, 0.4, smoothstep(10.0, 30.0, p.y)); return m; }
  float k = exp(-length(p - vec2(24.0, 7.0)) * 0.12);
  return mGlow(vec3(4.0, 2.8, 1.7) * (0.6 + 2.5 * k));
}
` + PAPER_TRACE;

export default (P) => {
  const dur = P.to - P.from;
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / dur));
    return { pos: [mix(-2, 1.5, e), mix(-1.5, -1.0, e), mix(-20, -22, e)], target: [mix(1.0, 3.5, e), mix(-1.6, -1.0, e), 40], fov: 34, roll: 0.0 };
  };
  const crownAt = (t) => {
    const s = stepT(t);
    const k = (s - P.from) / dur;
    const x = mix(-1.5, 8.0, k), z = mix(13.5, 23.5, k);
    const bob = 0.35 * Math.sin(s * 4.1) + 0.15 * Math.sin(s * 7.3 + 1);
    return { s, x, y: -4.3 + bob + 1.2 * k, z, tilt: 0.3 * Math.sin(s * 2.1 + 0.6) + 0.08, turn: 0.73 + 0.27 * Math.cos(0.4 + (s - P.from) * 2.6) };
  };
  return {
    name: 's32-reign', from: P.from, to: P.to,
    frag: GLSL,
    uniforms: { ...EPH_UNIFORMS, uCrown: [0, 0, 16, 2], uTurn: [0, 1], uWT: 0,
      uAper: 0.35, uFocus: 40, uFillSoft: 7, uAmb: L(70, 68, 78, 1.0), uFillDir: [-0.3, 0.5, -0.8], uHaze: L(120, 100, 90, 0.3), uHazeD: 0.004, uDust: 1.2 },
    camera: cam,
    update(t, u) {
      const c = crownAt(t);
      u.uStepT.value = c.s; u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      u.uWT.value = c.s;
      u.uCrown.value = [c.x, c.y, c.z, 3.6];
      u.uTurn.value = [c.tilt, c.turn];
      // keep the crown in focus as it drifts away
      u.uFocus.value = c.z + 22;
      u.uL.value = packLights([
        { pos: [24, 7, 98], col: L(255, 212, 168, 22), rad: 3, range: 26 },                 // the sun behind the sky
        { pos: [18, 5, 44], col: L(255, 196, 150, 8), rad: 3, range: 30 },                 // dawn behind the far water
        { pos: [22, 3, 2], col: L(255, 200, 140, 7), rad: 2.5, range: 30 },                // low sun-gold key on the crown
        { pos: [-14, 14, -6], col: L(160, 170, 200, 1.4), rad: 6, range: 60 },             // cold fill
      ]);
      u.uLN.value = 4;
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.24, threshold: 0.8, vignette: 0.62, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.012, 0.011, 0.013], highlights: [1.0, 0.93, 0.82], amount: 0.4 } }; },
  };
};
