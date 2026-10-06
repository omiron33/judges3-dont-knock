// The carved stones by Gilgal in moonlight (s08): a row of tall standing stones of grey card, each
// incised with a crude idol face, a second ring of smaller stones on the slope behind, torn hills, a
// tissue moon cut in a night-blue parchment sky, and black rocks in front. Ehud and two bearers walk
// the path between.
import { PAPER_HEAD, PAPER_TRACE, PAPER_UNIFORMS } from '/song/lib/paper.js';
import { PUPPET_GLSL, pose } from '/song/lib/puppet.js';
import { ROAD_LIB } from '/song/lib/x-road.js';

export const STONES_UNIFORMS = {
  ...PAPER_UNIFORMS,
  uEhud: pose({ style: 2 }), uB0: pose({ style: 1 }), uB1: pose({ style: 2 }), uMoon: [30, 34], uShiver: 0, uSlamS: 0, uBask: [0, 0, 0, 0],
};

export const STONES_GLSL = PAPER_HEAD + PUPPET_GLSL + ROAD_LIB + /* glsl */ `
uniform float uEhud[12], uB0[12], uB1[12];
uniform vec2 uMoon;
uniform float uShiver, uSlamS;
uniform vec4 uBask;
#define NL 8
// 0 rocks, 1 figures, 2 path bank, 3 the standing stones, 4 far stones and slope, 5 far hills, 6 sky,
// 7 light box
float sheetZ(int i, vec2 p) {
  if (i == 0) return 0.0;
  if (i == 1) return 14.0;
  if (i == 2) return 16.0;
  if (i == 3) return 27.0;
  if (i == 4) return 50.0;
  if (i == 5) return 80.0;
  if (i == 6) return 108.0;
  return 114.0;
}
float sheetOpac(int i) { if (i == 7) return 0.0; if (i == 6) return 0.92; return 1.0; }

// the big stones: base x, half width, height, lean
vec4 bigStone(int k) {
  if (k == 0) return vec4(-25.0, 2.6, 21.0, -0.04);
  if (k == 1) return vec4(-11.0, 2.2, 16.5, 0.03);
  if (k == 2) return vec4(5.0, 2.9, 23.0, -0.02);
  if (k == 3) return vec4(19.0, 2.0, 14.0, 0.05);
  return vec4(33.0, 2.5, 19.0, -0.03);
}
float bigStones(vec2 p, bool hq, out int which) {
  float d = 1e3; which = -1;
  for (int k = 0; k < 5; k++) {
    vec4 s = bigStone(k);
    float sd = stoneSD(p, vec2(s.x, -7.0 + (k == 2 ? uSlamS : 0.0)), s.y, s.z, s.w, float(k) * 3.3 + 1.0, hq);
    if (sd < d) { d = sd; which = k; }
  }
  return d;
}
float figs(vec2 p, bool hq, out int who, out int pt, out vec2 lp, out float sh) {
  who = 0;
  float a = figure(p, figAt(uEhud), pt, lp, sh, hq);
  if (a < 0.0) return a;
  int pt1; vec2 lp1; float sh1;
  float b = figure(p, figAt(uB0), pt1, lp1, sh1, hq);
  if (b < 0.0) { who = 1; pt = pt1; lp = lp1; sh = sh1; return b; }
  float c = figure(p, figAt(uB1), pt1, lp1, sh1, hq);
  if (c < 0.0) { who = 2; pt = pt1; lp = lp1; sh = sh1; return c; }
  // the bearers' empty baskets on their shoulders
  float bk = 1e3;
  for (int k = 0; k < 2; k++) {
    vec2 h = k == 0 ? uBask.xy : uBask.zw;
    vec2 q = p - h;
    float bowl = max(sdEllipsoid(vec3(q - vec2(0.0, -1.5), 0.0), vec3(1.7, 1.25, 1.0)), q.y + 1.45);
    float handle = abs(sdEllipsoid(vec3(q - vec2(0.0, -1.45), 0.0), vec3(1.4, 1.45, 1.0))) - 0.1;
    handle = max(handle, -(q.y + 1.45));
    bk = min(bk, min(bowl, handle));
  }
  if (bk < 0.0) { who = 3; return bk; }
  return min(min(a, b), min(c, bk));
}
float sheetSD(int i, vec2 p, bool hq) {
  if (i == 0) {
    float y = -13.5 + 9.0 * smoothstep(-24.0, -38.0, p.x) + 0.7 * sin(p.x * 0.4) + 1.5 * smoothstep(20.0, 36.0, p.x);
    float d = sdBelow(p, y);
    // a broken stone close to the lens at the left, black against the moon
    d = min(d, stoneSD(p, vec2(-36.0, -14.0), 4.5, 30.0, 0.06, 77.0, hq));
    return torn(d, p, 0.3, 1.0, hq);
  }
  if (i == 1) { int w, pt; vec2 lp; float sh; return figs(p, hq, w, pt, lp, sh); }
  if (i == 2) return torn(sdBelow(p, -6.0 + 0.4 * sin(p.x * 0.13)), p, 0.2, 2.0, hq);
  if (i == 3) { int w; return min(bigStones(p, hq, w), torn(sdBelow(p, -5.0 + 0.6 * sin(p.x * 0.2)), p, 0.2, 31.0, hq)); }
  if (i == 4) {
    float d = sdBelow(p, ridge(p.x + 13.0, -1.0, 7.0, 0.03, 4.0));
    for (int k = 0; k < 7; k++) {
      float x0 = -40.0 + float(k) * 13.0 + 3.0 * hash11(float(k) + 0.5);
      float yb = ridge(x0 + 13.0, -1.0, 7.0, 0.03, 4.0) - 0.8;
      d = min(d, stoneSD(p, vec2(x0, yb), 1.1 + 0.4 * hash11(float(k)), 5.0 + 4.0 * hash11(float(k) + 2.0), (hash11(float(k) + 7.0) - 0.5) * 0.15, float(k) + 50.0, hq));
    }
    return torn(d, p, 0.3, 4.0, hq);
  }
  if (i == 5) return torn(sdBelow(p, ridge(p.x - 30.0, 10.0, 16.0, 0.02, 6.0)), p, 0.4, 6.0, hq);
  if (i == 6) {
    float d = -1.0;
    vec2 c = floor(p / 3.2); vec2 h = hash22(c);
    float st = length(p - (c + h) * 3.2) - (0.035 + 0.05 * hash12(c + 5.0));
    if (hash12(c + 1.0) > 0.82 && p.y > 22.0) d = max(d, -st);
    return d;
  }
  return -1.0;
}
Mat sheetMat(int i, vec2 p, float sd) {
  if (i == 0) { Mat m = mCard(lin(vec3(0.035, 0.035, 0.04))); m.tear = 0.3; m.seed = 1.0; return m; }
  if (i == 1) {
    int w, pt; vec2 lp; float sh;
    figs(p, true, w, pt, lp, sh);
    if (w == 0) return figMat(pt, lp, sh, figAt(uEhud), EHUD_TUNIC, EHUD_BELT);
    if (w == 1) return figMat(pt, lp, sh, figAt(uB0), lin(vec3(0.3, 0.27, 0.2)), lin(vec3(0.24, 0.22, 0.19)));
    if (w == 2) return figMat(pt, lp, sh, figAt(uB1), lin(vec3(0.27, 0.25, 0.22)), lin(vec3(0.1, 0.08, 0.06)));
    Mat m = mPaper(lin(vec3(0.36, 0.28, 0.17))); m.kind = K_WOOD; m.alb *= 0.65 + 0.4 * step(0.5, fract(p.x * 2.2 + p.y * 1.6)) * step(0.5, fract(p.y * 2.0)); m.tear = 0.0; return m;
  }
  if (i == 2) {
    Mat m = mPaper(lin(vec3(0.22, 0.21, 0.2)));
    float dy = -6.0 + 0.4 * sin(p.x * 0.13) - p.y;
    m.alb *= (0.75 + 0.35 * brush(p, 0.05, 2.0)) * mix(0.9, 0.25, smoothstep(0.5, 5.0, dy));
    m.seed = 2.0; return m;
  }
  if (i == 3) {
    int w; bigStones(p, true, w);
    if (w < 0 || w == 9 || p.y < -5.0 + 0.6 * sin(p.x * 0.2) - 0.3) {
      Mat m = mCard(lin(vec3(0.3, 0.29, 0.28)) * (0.6 + 0.4 * brush(p, 0.0, 33.0)));
      m.alb *= 1.0 - 0.4 * hatch(p * 0.8, 0.4, 1.6);
      m.tear = 0.6; m.seed = 40.0; return m;
    }
    vec4 s = bigStone(w);
    float carve;
    vec3 a = stoneAlb(p, vec2(s.x, -7.0), s.y, s.z, s.w, float(w) * 3.3 + 1.0, carve);
    Mat m = mCard(a); m.tear = 0.7; m.fuzz = 0.03; m.trans = 0.05; m.bump = 1.2 + carve; m.seed = float(w) + 30.0;
    return m;
  }
  if (i == 4) { Mat m = mCard(lin(vec3(0.1, 0.11, 0.13))); m.alb *= 0.7 + 0.45 * brush(p, 0.3, 4.0); m.seed = 4.0; return m; }
  if (i == 5) { Mat m = mPaper(lin(vec3(0.17, 0.19, 0.23))); m.alb *= 0.75 + 0.4 * brush(p, -0.1, 6.0); m.trans = 0.45; m.seed = 6.0; return m; }
  if (i == 6) {
    float k = smoothstep(5.0, 55.0, length(p - uMoon));
    vec3 a = mix(lin(vec3(0.3, 0.33, 0.4)), lin(vec3(0.06, 0.065, 0.085)), k);
    a *= 1.0 - 0.6 * smoothstep(0.0, -40.0, p.x - 10.0) * smoothstep(5.0, 30.0, p.y);
    a *= 0.8 + 0.3 * brush(p * 0.4, 0.1, 10.0);
    Mat m = mPaper(a); m.trans = 0.5; m.tear = 0.0; m.seed = 10.0;
    // the moon: a disc of tissue glued over the sky, glowing and mottled by its pulp
    float md = sdCircle(p - uMoon, 4.6) + (fbm(p * 1.2, 3) - 0.5) * 0.35;
    float mk = smoothstep(0.15, -0.15, md);
    m.alb = mix(m.alb, lin(vec3(0.78, 0.8, 0.84)), mk);
    float maria = smoothstep(0.45, 0.7, fbm((p - uMoon) * 0.45 + 5.0, 4));
    m.emit = mk * vec3(0.7, 0.75, 0.85) * (0.6 + 0.6 * pulp(p * 2.5, 3.0)) * (1.0 - 0.45 * maria);
    m.alb *= 1.0 - 0.4 * maria * mk;
    // a torn strip of cloud tissue drifting across the moon
    float cl = abs(p.y - uMoon.y + 1.2 - 0.12 * (p.x - uMoon.x) - 0.6 * sin(p.x * 0.4)) - 0.9 - (fbm(p * 0.8, 3) - 0.5) * 1.4;
    m.emit *= mix(1.0, 0.35, smoothstep(0.2, -0.2, cl));
    // the halo: the sky paper glowing round the moon
    m.emit += vec3(0.16, 0.19, 0.27) * exp(-max(length(p - uMoon) - 4.6, 0.0) / 9.0) * (0.7 + 0.5 * pulp(p * 1.5, 7.0));
    return m;
  }
  return mGlow(vec3(1.8, 2.0, 2.4));
}
` + PAPER_TRACE;
