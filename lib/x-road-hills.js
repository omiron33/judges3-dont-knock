// The road through the hills at dusk (s02): a toy-theatre of torn hills, the low sun burning behind
// a parchment sky, torn clouds on thread, a worn road bank Ehud and his tribute donkey walk along,
// and black cut-card scrub in the foreground.
import { PAPER_HEAD, PAPER_TRACE, PAPER_UNIFORMS } from '/song/lib/paper.js';
import { PUPPET_GLSL, pose } from '/song/lib/puppet.js';
import { ROAD_LIB } from '/song/lib/x-road.js';

export const HILLS_UNIFORMS = {
  ...PAPER_UNIFORMS,
  uEhud: pose({ style: 2 }), uDonk: [0, 0, 0, 0], uRope: [0, 0, 0, 0], uSun: [-30, 14], uCloudX: 0, uShiver: 0,
};

export const HILLS_GLSL = PAPER_HEAD + PUPPET_GLSL + ROAD_LIB + /* glsl */ `
uniform float uEhud[12];
uniform vec4 uDonk, uRope;
uniform vec2 uSun;
uniform float uCloudX, uShiver;
#define NL 9
// 0 scrub, 1 Ehud and the donkey, 2 road bank, 3 near hill, 4 mid hills, 5 far hills, 6 clouds,
// 7 sky, 8 light box
float sheetZ(int i, vec2 p) {
  if (i == 0) return 0.0;
  if (i == 1) return 14.0;
  if (i == 2) return 16.5;
  if (i == 3) return 32.0;
  if (i == 4) return 56.0;
  if (i == 5) return 86.0;
  if (i == 6) return 104.0;
  if (i == 7) return 118.0;
  return 124.0;
}
float sheetOpac(int i) {
  if (i == 8) return 0.0;
  if (i == 7) return 0.9;
  if (i == 6) return 0.85;
  return 1.0;
}
float roadY(float x) { return -6.0 + 0.35 * sin(x * 0.11) + 0.15 * sin(x * 0.37); }
float ropeSD(vec2 p) {
  vec2 a = uRope.xy, b = uRope.zw;
  float d = 1e3;
  float sag = 0.9 + 0.15 * length(b - a) * 0.1;
  vec2 prev = a;
  for (int k = 1; k <= 4; k++) {
    float s = float(k) / 4.0;
    vec2 c = mix(a, b, s) - vec2(0.0, sag * 4.0 * s * (1.0 - s));
    d = min(d, sdSeg(p, prev, c, 0.06));
    prev = c;
  }
  return d;
}
float scrubSD(vec2 p, bool hq) {
  // a torn black bank across the bottom, tufts of grass cut along it, and a thorn bush at the left
  float y = -12.6 + 5.0 * smoothstep(-14.0, -44.0, p.x) + 3.0 * smoothstep(10.0, 40.0, p.x) + 0.8 * sin(p.x * 0.3);
  float d = sdBelow(p, y);
  float cx = floor(p.x / 0.9);
  for (int k = -1; k <= 1; k++) {
    float c = cx + float(k);
    float x0 = c * 0.9 + 0.45;
    float h = 1.2 + 2.6 * hash11(c * 0.71) * hash11(c * 1.3 + 2.0);
    float yb = -12.6 + 5.0 * smoothstep(-14.0, -44.0, x0) + 3.0 * smoothstep(10.0, 40.0, x0) + 0.8 * sin(x0 * 0.3);
    d = min(d, sdTaper(p, vec2(x0, yb - 0.3), vec2(x0 + (hash11(c + 5.0) - 0.5) * 1.6 + uShiver * 0.25, yb + h), 0.18, 0.02));
  }
  // the bush: crooked thorny strokes
  for (int k = 0; k < 6; k++) {
    vec2 a = vec2(-19.0 + float(k) * 1.6, -9.5);
    vec2 b = a + vec2((hash11(float(k) + 0.4) - 0.5) * 9.0, 5.0 + 6.0 * hash11(float(k) + 2.2));
    d = min(d, sdTaper(p, a, b, 0.35, 0.06));
  }
  return torn(d, p, 0.12, 1.0, hq);
}
float figSheet(vec2 p, bool hq, out int who, out int pt, out vec2 lp, out float sh) {
  Fig e = figAt(uEhud);
  float a = figure(p, e, pt, lp, sh, hq);
  who = 0;
  if (a < 0.0) return a;
  int dp; vec2 dl;
  float b = donkey(p, uDonk.xy, 0.78, 1.0, uDonk.z, uDonk.w, 1.0, dp, dl);
  if (b < 0.0) { who = 1; pt = dp; lp = dl; return b; }
  float r = ropeSD(p);
  if (r < 0.0) { who = 2; return r; }
  return min(min(a, b), r);
}
float sheetSD(int i, vec2 p, bool hq) {
  if (i == 0) return scrubSD(p, hq);
  if (i == 1) { int w, pt; vec2 lp; float sh; return figSheet(p, hq, w, pt, lp, sh); }
  if (i == 2) return torn(sdBelow(p, roadY(p.x)), p, 0.18, 2.0, hq);
  if (i == 3) {
    float d = sdBelow(p, ridge(p.x, -2.0, 9.0, 0.03, 3.0));
    // a lone flat-topped acacia on the hill, its branches cut thin
    vec2 tb = vec2(-21.0, ridge(-21.0, -2.0, 9.0, 0.03, 3.0) - 0.5);
    float tr = sdTaper(p, tb, tb + vec2(-0.8, 4.0), 0.45, 0.22);
    tr = min(tr, sdTaper(p, tb + vec2(-0.8, 3.6), tb + vec2(-4.5, 6.2), 0.22, 0.08));
    tr = min(tr, sdTaper(p, tb + vec2(-0.7, 3.3), tb + vec2(3.6, 6.4), 0.2, 0.08));
    tr = min(tr, sdTaper(p, tb + vec2(-0.8, 3.9), tb + vec2(0.2, 6.8), 0.16, 0.06));
    float can = sdEllipsoid(vec3(p - tb - vec2(-0.4, 7.0), 0.0), vec3(6.0, 0.85, 1.0));
    can += (vnoise(p * vec2(1.5, 3.0)) - 0.5) * 1.1;
    d = min(d, min(tr, can));
    return torn(d, p, 0.3, 3.0, hq);
  }
  if (i == 4) {
    float y = ridge(p.x + 40.0, 6.0, 12.0, 0.025, 4.0);
    float d = sdBelow(p, y);
    // little olive trees along the crest
    float cx = floor(p.x / 5.0);
    float x0 = cx * 5.0 + 2.5 + (hash11(cx) - 0.5) * 2.0;
    if (hash11(cx + 3.0) > 0.45) {
      float yb = ridge(x0 + 40.0, 6.0, 12.0, 0.025, 4.0);
      float tr = min(sdTaper(p, vec2(x0, yb - 0.5), vec2(x0 + 0.3, yb + 1.4), 0.2, 0.1), sdEllipsoid(vec3(p - vec2(x0 - 0.3, yb + 2.0), 0.0), vec3(1.2, 0.8, 1.0)));
      tr = smin(tr, sdEllipsoid(vec3(p - vec2(x0 + 0.7, yb + 2.4), 0.0), vec3(1.0, 0.75, 1.0)), 0.3);
      tr += (vnoise(p * 3.0) - 0.5) * 0.5;
      d = min(d, tr);
    }
    return torn(d, p, 0.3, 4.0, hq);
  }
  if (i == 5) return torn(sdBelow(p, ridge(p.x - 20.0, 16.0, 18.0, 0.018, 6.0)), p, 0.45, 6.0, hq);
  if (i == 6) {
    float d = 1e3;
    for (int k = 0; k < 4; k++) {
      vec2 c = vec2(-58.0 + float(k) * 36.0 + uCloudX * (1.0 + 0.3 * float(k)), 36.0 + 9.0 * hash11(float(k) + 4.0));
      vec2 q = p - c;
      float w = 10.0 + 6.0 * hash11(float(k) + 1.0);
      float cl = sdBox2(q, vec2(w, 1.1 + 0.8 * hash11(float(k) + 9.0)));
      cl = smin(cl, sdEllipsoid(vec3(q - vec2(-w * 0.2, 1.2), 0.0), vec3(w * 0.5, 2.2, 1.0)), 1.0);
      cl = torn(cl, p, 0.7, float(k) + 20.0, hq);
      d = min(d, min(cl, sdBox2(q - vec2(w * 0.4, 40.0), vec2(0.03, 39.0))));
    }
    return d;
  }
  if (i == 7) return max(-1.0, -sdCircle(p - uSun, 4.2));
  return -1.0;
}
Mat sheetMat(int i, vec2 p, float sd) {
  if (i == 0) { Mat m = mCard(lin(vec3(0.04, 0.035, 0.03))); m.tear = 0.0; m.fuzz = 0.0; m.trans = 0.0; m.seed = 1.0; return m; }
  if (i == 1) {
    int w, pt; vec2 lp; float sh;
    figSheet(p, true, w, pt, lp, sh);
    if (w == 0) return figMat(pt, lp, sh, figAt(uEhud), EHUD_TUNIC, EHUD_BELT);
    if (w == 1) return donkeyMat(pt, lp, 5.0);
    Mat m = mPaper(lin(vec3(0.45, 0.38, 0.26))); m.kind = K_FABRIC; m.tear = 0.0; m.fuzz = 0.02; return m;
  }
  if (i == 2) {
    // the road bank: dusty parchment, cart ruts and pebbles painted near the top, darker below
    float dy = roadY(p.x) - p.y;
    Mat m = mPaper(lin(vec3(0.3, 0.25, 0.19)));
    m.alb *= 0.75 + 0.35 * brush(p, 0.05, 2.0);
    m.alb *= mix(0.8, 0.2, smoothstep(0.5, 5.0, dy));
    m.alb *= 1.0 - 0.4 * smoothstep(0.08, 0.0, abs(dy - 0.9 - 0.1 * sin(p.x * 0.5)) - 0.05);
    vec2 c = floor(p / 0.7); vec2 h = hash22(c);
    float peb = length(p - (c + h) * 0.7) - 0.12 * hash12(c + 2.0);
    m.alb *= 1.0 - 0.5 * smoothstep(0.03, 0.0, peb) * step(0.6, hash12(c + 1.0));
    m.seed = 2.0; m.trans = 0.25; return m;
  }
  if (i == 3) {
    Mat m = mPaper(lin(vec3(0.24, 0.2, 0.15)));
    m.alb *= 0.75 + 0.4 * brush(p, 0.25, 3.0);
    // the road painted winding up over the hill
    float path = abs(p.x - 6.0 - 7.0 * sin(p.y * 0.35) + p.y * 0.8) - mix(1.1, 0.15, sat((p.y + 6.0) / 12.0));
    m.alb = mix(m.alb, lin(vec3(0.4, 0.34, 0.26)) * (0.8 + 0.3 * brush(p, 1.0, 9.0)), smoothstep(0.15, -0.1, path) * 0.45);
    m.alb *= 1.0 - 0.35 * hatch(p * 0.7, 0.3, 1.8);
    m.trans = 0.3; m.seed = 3.0; return m;
  }
  if (i == 4) { Mat m = mPaper(lin(vec3(0.2, 0.18, 0.15))); m.alb *= 0.7 + 0.45 * brush(p, -0.2, 4.0); m.trans = 0.35; m.seed = 4.0; return m; }
  if (i == 5) { Mat m = mPaper(lin(vec3(0.28, 0.24, 0.24))); m.alb *= 0.75 + 0.4 * brush(p, 0.1, 6.0); m.trans = 0.45; m.seed = 6.0; return m; }
  if (i == 6) {
    Mat m = mPaper(lin(vec3(0.42, 0.33, 0.28)));
    m.trans = 0.8; m.fuzz = 0.12; m.seed = 9.0; return m;
  }
  if (i == 7) {
    // painted dusk: ochre and rust near the sun, soot toward the top right
    float k = smoothstep(4.0, 60.0, length((p - uSun) * vec2(0.7, 1.0)));
    vec3 a = mix(lin(vec3(0.52, 0.42, 0.31)), lin(vec3(0.12, 0.1, 0.1)), k);
    a *= 1.0 - 0.6 * smoothstep(10.0, 60.0, p.y + p.x * 0.5);
    a *= 0.8 + 0.3 * brush(p * 0.4, 0.08, 10.0);
    Mat m = mPaper(a); m.trans = 0.55; m.tear = 0.0; m.seed = 10.0; return m;
  }
  return mGlow(vec3(1.9, 1.35, 0.95));
}
` + PAPER_TRACE;
