// s30-came · "And Israel came down fast." (119.59-123.43). The host of Israel streams down the
// wooded hillside at dawn: three files of puppets with spears and torches on three layers of torn
// hillside, marching on twos; the nearer layers slam up into place on the drum hits, one after another.
import { grade, ease, clamp01, mix, spring } from '/song/lib/look.js';
import { packLights, flicker, L, stepT } from '/song/lib/paper.js';
import { EPH_HEAD, EPH_UNIFORMS, PAPER_TRACE } from '/song/lib/x-ephraim.js';

export const kind = 'shader';

const GLSL = EPH_HEAD + /* glsl */ `
uniform vec3 uRow;      // how far each file has marched (x offset)
uniform vec3 uDrop;     // each layer's drop below its place (slams up on the hits)
#define NL 8
// 0 near hillside + file, 1 middle hillside + file, 2 far hillside + file, 3 far hills,
// 4 clouds, 5 sky, 6 light box, 7 the oak in front (drawn first: see the index map below)
const float SC0 = 0.62, SC1 = 0.5, SC2 = 0.42;
float sZ(int i, vec2 p) {
  if (i == 0) return 4.0;
  if (i == 1) return 20.0;
  if (i == 2) return 38.0;
  if (i == 3) return 62.0;
  if (i == 4) return 86.0;
  if (i == 5) return 108.0;
  return 114.0;
}
float sOp(int i) { if (i == 4) return 0.85; if (i == 5) return 0.93; if (i == 6) return 0.0; return 1.0; }
// the hillside line of each layer (the files walk on it)
float yb(int i) { return i == 0 ? -9.0 : (i == 1 ? -2.5 : 0.5); }
float slopeOf(int i) { return i == 0 ? 0.42 : (i == 1 ? 0.34 : 0.2); }
float groundSD(int i, vec2 p, bool hq) {
  float y = yb(i) + slopeOf(i) * p.x + 0.6 * sin(p.x * 0.3 + float(i)) - 0.4;
  float d = sdBelow(p, y);
  // tufts of grass and the odd bush on the slope
  float bush = sdCircle(vec2(mod(p.x + float(i) * 7.0, 19.0) - 9.5, p.y - y), 1.4 + 0.6 * hash11(floor((p.x + float(i) * 7.0) / 19.0)));
  d = min(d, bush);
  return torn(d, p, 0.25, 50.0 + float(i), hq);
}
// a great oak in the near corner, its canopy darkening the top right of the frame
float oakSD(vec2 p, bool hq) {
  float d = sdTaper(p, vec2(34.0, -20.0), vec2(31.0, 12.0), 2.6, 1.5);
  d = min(d, sdTaper(p, vec2(31.5, 6.0), vec2(14.0, 10.0), 1.1, 0.4));
  d = min(d, sdTaper(p, vec2(31.0, 10.0), vec2(42.0, 18.0), 1.0, 0.45));
  float cr = 1e3;
  for (int k = 0; k < 10; k++) {
    float fk = float(k);
    vec2 c = vec2(6.0 + fk * 4.8 + 1.5 * hash11(fk), 13.5 + 3.0 * hash11(fk + 4.0) + 0.8 * max(0.0, 3.0 - fk));
    cr = min(cr, sdCircle(p - c, 4.8 + 1.6 * hash11(fk + 2.0)));
  }
  // leaves hanging lower at the tips of the boughs
  cr = min(cr, sdCircle(p - vec2(13.0, 9.0), 2.6));
  cr = min(cr, sdCircle(p - vec2(19.5, 8.0), 2.8));
  cr = min(cr, sdCircle(p - vec2(25.5, 8.6), 2.4));
  cr = min(cr, sdCircle(p - vec2(41.0, 9.5), 3.0));
  if (hq) cr += (fbm(p * 0.7, 3) - 0.5) * 2.2 + (vnoise(p * 3.0) - 0.5) * 0.5;
  return torn(min(d, cr), p, 0.3, 60.0, hq);
}
float layerSD(int i, vec2 p, bool hq, out Fig f, out int part, out vec2 lp, out float sh, out int extra, out float cell, out int what) {
  float sc = i == 0 ? SC0 : (i == 1 ? SC1 : SC2);
  vec2 p0 = p;
  p.y += uDrop[i];
  float g = groundSD(i, p, hq);
  float h = hostSD(p, uRow[i], 5.6 * sc, sc, -1.0, yb(i) - 0.2, slopeOf(i), float(i) * 3.7, uStepT + float(i) * 0.13, 0.14, hq, f, part, lp, sh, extra, cell);
  what = 0;
  float d = g;
  if (h < 0.0) { what = 1; d = h; }
  else d = min(g, h);
  return d;
}
float sSD(int i, vec2 p, bool hq) {
  if (i <= 2) { Fig f; int pt, ex, w; vec2 lp; float sh, c; return layerSD(i, p, hq, f, pt, lp, sh, ex, c, w); }
  if (i == 3) return min(hillSD(p, 0.0, 12.0, 0.02, 8.0, 0.4, hq), woodsSD(p * 0.8, 3.0, 3.0, 6.0, 2.4, 9.0, hq) / 0.8);
  if (i == 4) return cloudsSD(p, 34.0, -30.0 + uTime * 0.5, 7.0, hq);
  if (i == 5) return max(-1.0, -sdCircle(p - vec2(-42.0, 12.0), 5.0));
  return -1.0;
}
Mat sMat(int i, vec2 p, float sd) {
  if (i <= 2) {
    Fig f; int pt, ex, w; vec2 lp; float sh, c;
    layerSD(i, p, true, f, pt, lp, sh, ex, c, w);
    if (w == 1) { Mat m = hostMat(pt, lp, sh, f, ex, c, float(i) * 3.7, 1.0); if (ex != 4) m.alb *= i == 2 ? 0.7 : 1.0; return m; }
    vec3 c0 = i == 0 ? lin(vec3(0.07, 0.06, 0.05)) : (i == 1 ? lin(vec3(0.13, 0.11, 0.09)) : lin(vec3(0.22, 0.19, 0.16)));
    Mat m = hillMat(p, c0, 50.0 + float(i), 0.5); m.trans = 0.2; return m;
  }
  if (i == 3) { Mat m = hillMat(p, lin(vec3(0.36, 0.31, 0.27)), 8.0, 0.0); m.trans = 0.45; return m; }
  if (i == 4) { Mat m = mPaper(lin(vec3(0.55, 0.47, 0.4))); m.trans = 0.75; m.seed = 9.0; m.fuzz = 0.12; return m; }
  if (i == 5) return skyMat(p, -4.0, 0.9, 12.0);
  float k = exp(-length(p - vec2(-42.0, 12.0)) * 0.12);
  return mGlow(vec3(4.0, 2.8, 1.7) * (0.6 + 2.5 * k));
}
// sheet 0 is the oak in front of everything; the rest follow
float sheetZ(int i, vec2 p) { return i == 0 ? 0.5 : sZ(i - 1, p); }
float sheetOpac(int i) { return i == 0 ? 1.0 : sOp(i - 1); }
float sheetSD(int i, vec2 p, bool hq) { return i == 0 ? oakSD(p, hq) : sSD(i - 1, p, hq); }
Mat sheetMat(int i, vec2 p, float sd) {
  if (i == 0) { Mat m = mCard(lin(vec3(0.035, 0.03, 0.028))); m.alb *= 0.8 + 0.4 * brush(p, 1.2, 61.0); m.tear = 0.5; m.fuzz = 0.06; m.seed = 61.0; return m; }
  return sMat(i - 1, p, sd);
}
` + PAPER_TRACE;

const HITS = [120.16, 121.26];

export default (P) => {
  const dur = P.to - P.from;
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / dur));
    return { pos: [mix(10, 5, e), mix(1, -0.5, e), mix(-50, -46, e)], target: [mix(4, -1, e), mix(1.5, 0.5, e), 40], fov: 38, roll: 0.0 };
  };
  return {
    name: 's30-came', from: P.from, to: P.to,
    frag: GLSL,
    uniforms: { ...EPH_UNIFORMS, uRow: [0, 0, 0], uDrop: [0, 0, 0],
      uAper: 0.28, uFocus: 60, uFillSoft: 7, uAmb: L(90, 84, 92, 1.0), uFillDir: [-0.35, 0.55, -0.75], uHaze: L(150, 125, 105, 0.35), uHazeD: 0.004, uDust: 1.0 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      u.uStepT.value = s; u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      // the files march down to the left (on twos), the near ones a little faster
      u.uRow.value = [-(s - P.from) * 5.2, -(s - P.from) * 4.0 - 2.0, -(s - P.from) * 3.0 - 1.0];
      // the far file is already coming; the middle slams up on the first hit, the near on the second
      const land = (h) => (t < h - 0.05 ? 70 : 70 * (1 - spring(t, h - 0.05, 0.32, 0.4)));
      u.uDrop.value = [land(HITS[1]), land(HITS[0]), 0];
      u.uFocus.value = mix(66, 52, ease.inOut3(clamp01((t - P.from) / dur)));
      const fk = (k) => flicker(t, k);
      u.uL.value = packLights([
        { pos: [-42, 12, 111], col: L(255, 212, 168, 24), rad: 3, range: 30 },                    // the sun behind the sky
        { pos: [10, 45, 125], col: L(220, 214, 205, 10), rad: 10, range: 90 },                   // the open sky
        { pos: [-30, 4, 70], col: L(255, 196, 150, 8), rad: 4, range: 40 },                      // dawn behind the far hills
        { pos: [-26, 18, 12], col: L(255, 205, 155, 4.5), rad: 2, range: 30 },                   // rim on the near file
        { pos: [6 + u.uRow.value[1] * 0.3, 6, 16], col: L(255, 150, 70, 3.5 * fk(1)), rad: 1, range: 12 },   // torches of the middle file
        { pos: [-6 + u.uRow.value[0] * 0.3, -2, 1], col: L(255, 150, 70, 3.0 * fk(2)), rad: 1, range: 12 },  // torches of the near file
      ]);
      u.uLN.value = 6;
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.2, threshold: 0.85, vignette: 0.6, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.014, 0.011, 0.012], highlights: [1.0, 0.93, 0.82], amount: 0.4 } }; },
  };
};
