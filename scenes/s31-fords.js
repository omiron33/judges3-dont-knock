// s31-fords · "They held the fords against Moab," (123.43-126.17). The fords of the Jordan at dawn:
// the river as overlapping strips of dark painted paper buckling and rolling downstream; a line of
// Israelite spearmen stands in the shallows with spears levelled and thrusts on the drum hits;
// across the water the Moabites are dark silhouettes against the dawn, halted, flinching back.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, flicker, L, stepT } from '/song/lib/paper.js';
import { slam } from '/song/lib/sync.js';
import { EPH_HEAD, EPH_UNIFORMS, PAPER_TRACE } from '/song/lib/x-ephraim.js';

export const kind = 'shader';

const HITS = [123.45, 124.55, 125.1, 125.65];

const GLSL = EPH_HEAD + /* glsl */ `
uniform float uThrust, uFlinch, uWT;
#define NL 11
// 0 near water, 1 water over the spearmen's shins, 2 Israelite spearmen, 3 water between, 4 Moabites,
// 5 water behind, 6 far water, 7 far bank and reeds, 8 hills of Moab, 9 sky, 10 light box
float sheetZ(int i, vec2 p) {
  if (i == 0) return waterZ(2.0, p, 0.0, uWT, 0.6);
  if (i == 1) return waterZ(8.0, p, 1.0, uWT, 0.5);
  if (i == 2) return 10.0;
  if (i == 3) return waterZ(13.0, p, 2.0, uWT, 0.5);
  if (i == 4) return 16.0;
  if (i == 5) return waterZ(19.0, p, 3.0, uWT, 0.5);
  if (i == 6) return waterZ(27.0, p, 4.0, uWT, 0.4);
  if (i == 7) return 36.0;
  if (i == 8) return 58.0;
  if (i == 9) return 90.0;
  return 96.0;
}
float sheetOpac(int i) { if (i == 9) return 0.93; if (i == 10) return 0.0; return 1.0; }
float waterH(int i) { return i == 0 ? -12.5 : (i == 1 ? -6.3 : (i == 3 ? -4.7 : (i == 5 ? -3.3 : -2.0))); }

// a soldier in a line: cell c of a file spaced sp along x at feet height y0
// israel: spear levelled forward and thrusting; else a Moabite: helmet, round shield, spear upright
float soldier(vec2 p, float c, float sp, float sc, float face, float y0, bool israel, bool hq, out Fig f, out int part, out vec2 lp, out float shd, out int extra) {
  extra = 0; part = PT_NONE; lp = p; shd = 0.0;
  float x = (c + 0.5) * sp + (hash11(c * 1.37 + (israel ? 1.0 : 5.0)) - 0.5) * sp * 0.3;
  float jit = hash11(c * 3.3 + (israel ? 2.0 : 9.0));
  float ph = uStepT * 3.0 + c * 1.7;
  if (israel) {
    float th = uThrust * (0.6 + 0.4 * jit);
    f = mkFig(vec2(x + face * th * 0.6 * sc, y0), sc * (0.95 + 0.1 * jit), face, 0.1 + 0.16 * th, 0.05, -0.55 - 0.35 * th, -1.0 + 0.3 * th, 0.2 - 0.3 * th, -1.3, 0.35 + 0.1 * sin(ph), 2.0);
  } else {
    float fl = uFlinch * (0.5 + 0.5 * jit);
    f = mkFig(vec2(x - face * fl * 2.2 * sc, y0), sc * (0.97 + 0.08 * jit), face, -0.06 - 0.35 * fl, -0.25 * fl, -0.35 + 0.3 * fl, -1.25, 0.25, -0.4, -0.35 * fl + 0.05 * sin(ph), 5.0);
  }
  if (abs(p.x - x) > 18.0 * sc || p.y < y0 - 1.0 * sc || p.y > y0 + 34.0 * sc) return max(abs(p.x - x) - 13.0 * sc, 0.3);
  float d = figure(p, f, part, lp, shd, hq);
  vec2 hp = handFrame(p, f);
  vec2 g = vec2(0.05, -0.5);
  vec2 dl = handDir(f, israel ? vec2(1.0, 0.16) : vec2(0.08, 1.0));
  vec2 a = g - dl * (israel ? 7.0 : 8.0), b = g + dl * (israel ? 9.0 : 11.0);
  float st = sdSeg(hp, a, b, israel ? 0.22 : 0.17) * f.scale;
  vec2 n = vec2(-dl.y, dl.x);
  float hd = sdTri(hp, b - n * 0.5, b + n * 0.5, b + dl * 2.0) * f.scale;
  if (hd < 0.0) { extra = 2; return hd; }
  if (!israel) {
    // a round shield on the far arm, in front of the body
    vec2 q = (p - f.pos) / f.scale; q.x *= f.face;
    float sh = sdCircle(q - vec2(1.1, 11.6), 2.3) * f.scale;
    if (sh < 0.0 && part != PT_HAND && part != PT_FORE && part != PT_UPPER) { extra = 5; lp = q - vec2(1.1, 11.6); return sh; }
    d = min(d, sh);
  }
  if (st < 0.0 && d >= 0.0) { extra = 1; return st; }
  return min(d, min(st, hd));
}
float lineSD(vec2 p, float off, float sp, float sc, float face, float y0, float x0, float x1, bool israel, bool hq, out Fig f, out int part, out vec2 lp, out float shd, out int extra, out float cell) {
  float c0 = floor((p.x - off) / sp);
  float best = 1e3;
  for (int k = 0; k < 4; k++) {
    float c = c0 + (k == 0 ? 0.0 : (k == 1 ? -face : (k == 2 ? face : -2.0 * face)));
    float xc = (c + 0.5) * sp + off;
    if (xc < x0 || xc > x1) continue;
    Fig f1; int pt1, ex1; vec2 lp1; float sh1;
    float d = soldier(p - vec2(off, 0.0), c, sp, sc, face, y0, israel, hq, f1, pt1, lp1, sh1, ex1);
    if (d < best) { best = d; f = f1; part = pt1; lp = lp1; shd = sh1; extra = ex1; cell = c; }
    if (best < 0.0 || !hq) break;
  }
  return best;
}
// the thickets of the Jordan along the far bank: tamarisk and willow cut as lumpy card, a few reeds
float reedsSD(vec2 p, bool hq) {
  float bank = -1.5 + 1.2 * sin(p.x * 0.07) + 0.6 * sin(p.x * 0.23);
  float d = sdBelow(p, bank);
  float cx = floor(p.x / 3.4);
  for (int k = -1; k <= 1; k++) {
    float c = cx + float(k);
    float x0 = c * 3.4 + 1.7 + (hash11(c + 5.0) - 0.5) * 1.5;
    float h = 1.5 + 3.5 * hash11(c * 0.71);
    d = min(d, sdEllipsoid(vec3(p - vec2(x0, bank + h * 0.5), 0.0), vec3(1.6 + 0.8 * hash11(c + 1.0), h * 0.6 + 0.6, 1.0)));
    float rx = x0 + 1.4;
    float bend = 0.4 * sin(uTime * 1.3 + c);
    d = min(d, sdTaper(p, vec2(rx, bank), vec2(rx + bend, bank + h + 2.0), 0.16, 0.05));
  }
  if (hq) d += (vnoise(p * 2.0) - 0.5) * 0.35;
  return torn(d, p, 0.12, 70.0, hq);
}
float sheetSD(int i, vec2 p, bool hq) {
  if (i == 0 || i == 1 || i == 3 || i == 5 || i == 6) return waterSD(p, waterH(i), float(i), uWT, hq);
  if (i == 2) { Fig f; int pt, ex; vec2 lp; float sh, c; return lineSD(p, 0.0, 4.6, 0.55, 1.0, -9.5, -60.0, -3.0, true, hq, f, pt, lp, sh, ex, c); }
  if (i == 4) { Fig f; int pt, ex; vec2 lp; float sh, c; return lineSD(p, 1.3, 5.0, 0.58, -1.0, -7.6, 6.0, 60.0, false, hq, f, pt, lp, sh, ex, c); }
  if (i == 7) return reedsSD(p, hq);
  if (i == 8) return hillSD(p, 4.0, 14.0, 0.022, 13.0, 0.4, hq);
  if (i == 9) return max(-1.0, -sdCircle(p - vec2(30.0, 7.0), 4.5));
  return -1.0;
}
Mat sheetMat(int i, vec2 p, float sd) {
  if (i == 0 || i == 1 || i == 3 || i == 5 || i == 6) { Mat m = waterMat(p, waterH(i), float(i), uWT, i >= 5 ? 1.0 : 0.0); if (i >= 5) m.alb *= 1.3; m.bump = 0.25; return m; }
  if (i == 2) {
    Fig f; int pt, ex; vec2 lp; float sh, c;
    lineSD(p, 0.0, 4.6, 0.55, 1.0, -9.5, -60.0, -3.0, true, true, f, pt, lp, sh, ex, c);
    return hostMat(pt, lp, sh, f, ex, c, 2.0, 1.0);
  }
  if (i == 4) {
    // the Moabites: black card silhouettes, only their bronze and the rim catching the dawn
    Fig f; int pt, ex; vec2 lp; float sh, c;
    lineSD(p, 1.3, 5.0, 0.58, -1.0, -7.6, 6.0, 60.0, false, true, f, pt, lp, sh, ex, c);
    if (ex == 2 || pt == PT_HELM) { Mat m = mFoil(lin(vec3(0.42, 0.3, 0.18)), true); return m; }
    if (ex == 5) { Mat m = mCard(lin(vec3(0.07, 0.05, 0.04))); m.alb *= 1.0 + 1.5 * smoothstep(0.25, 0.0, abs(length(lp) - 1.9)); return m; }
    Mat m = mCard(lin(vec3(0.035, 0.03, 0.03))); m.tear = 0.3; m.fuzz = 0.03; return m;
  }
  if (i == 7) { Mat m = mCard(lin(vec3(0.04, 0.04, 0.035))); m.tear = 0.4; m.fuzz = 0.04; m.seed = 70.0; return m; }
  if (i == 8) { Mat m = hillMat(p, lin(vec3(0.17, 0.15, 0.14)), 13.0, 0.3); m.trans = 0.35; return m; }
  if (i == 9) {
    Mat m = skyMat(p, 2.0, 1.0, 14.0);
    m.alb *= mix(1.0, 0.35, smoothstep(14.0, 34.0, p.y));   // the top of the sky stays dark (the words sit there)
    return m;
  }
  float k = exp(-length(p - vec2(30.0, 7.0)) * 0.12);
  return mGlow(vec3(4.0, 2.8, 1.7) * (0.6 + 2.5 * k));
}
` + PAPER_TRACE;

export default (P) => {
  const dur = P.to - P.from;
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / dur));
    return { pos: [mix(-6, -2, e), mix(-4.5, -4.0, e), mix(-40, -35, e)], target: [mix(-1, 1, e), mix(0.3, 0.8, e), 40], fov: 40, roll: 0.0 };
  };
  return {
    name: 's31-fords', from: P.from, to: P.to,
    frag: GLSL,
    uniforms: { ...EPH_UNIFORMS, uThrust: 0, uFlinch: 0, uWT: 0,
      uAper: 0.3, uFocus: 50, uFillSoft: 7, uAmb: L(80, 78, 88, 1.0), uFillDir: [-0.4, 0.5, -0.75], uHaze: L(120, 100, 90, 0.3), uHazeD: 0.004, uDust: 1.0 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      u.uStepT.value = s; u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      u.uWT.value = s;   // the paper water rolls on twos too
      // a thrust on every hit (held a moment, then drawn back), the Moabites flinch a beat later
      const th = HITS.reduce((a, h) => { const x = s - h; return x < 0 ? a : Math.max(a, x < 0.17 ? 1 : Math.max(0, 1 - (x - 0.17) / 0.25)); }, 0);
      u.uThrust.value = th;
      u.uFlinch.value = HITS.reduce((a, h) => { const x = s - h - 0.08; return x < 0 ? a : Math.max(a, Math.exp(-x * 3) * Math.min(1, x * 12)); }, 0);
      u.uFocus.value = mix(52, 46, ease.inOut3(clamp01((t - P.from) / dur)));
      const sl = Math.max(0, slam(t));
      u.uL.value = packLights([
        { pos: [30, 7, 93], col: L(255, 212, 168, 22), rad: 3, range: 26 },                       // the sun behind the sky
        { pos: [24, 9, 42], col: L(255, 200, 150, 12), rad: 3, range: 34 },                     // dawn behind the Moabites (rim)
        { pos: [10, 6, 22], col: L(255, 205, 160, 3), rad: 3, range: 22 },                      // glints on the far water
        { pos: [-30, 10, -14], col: L(240, 185, 150, 3.4 * (1 + 0.25 * sl)), rad: 6, range: 70 }, // low warm key on Israel
        { pos: [-10, 30, 50], col: L(200, 205, 215, 6), rad: 8, range: 60 },                     // pale sky fill from above
      ]);
      u.uLN.value = 5;
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.2, threshold: 0.85, vignette: 0.6, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.012, 0.011, 0.013], highlights: [1.0, 0.93, 0.82], amount: 0.4 } }; },
  };
};
