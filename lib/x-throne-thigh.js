// Close on Ehud's thigh: the rust tunic of woven cloth-paper, its hem stitched, the belt across the
// top; beneath it his thigh of skin-toned paper with the double-edged dagger of tarnished foil strapped
// along the outer side (brass guard and pommel, the grip wound with dark thread, two leather straps
// with brass buckles). The tunic's paper layer peels back from the lower corner along a torn fold
// (uPeel: how far), the folded flap showing its paler lining. Behind, far out of focus, the dark wall
// of the summer room with a lattice window and a candle.
//
// Sheets: 0 the folded flap (z 0), 1 the tunic (z 0.5), 2 dagger and straps (z 1.1), 3 the thigh
// (z 1.8), 4 the room wall far behind (z 30), 5 the night sky (z 46), 6 light box (z 52).
import { PAPER_HEAD, PAPER_TRACE, PAPER_UNIFORMS } from '/song/lib/paper.js';

export const THIGH_UNIFORMS = { ...PAPER_UNIFORMS, uPeel: 0.0, uGlint: [0, 0] };

export const THIGH_GLSL = PAPER_HEAD + /* glsl */ `
uniform float uPeel;
uniform vec2 uGlint;     // x: position of the glint along the blade (0 guard .. 1 point), y: strength
#define NL 7
const vec2 CORNER = vec2(7.5, -2.6);
const vec2 PN = vec2(0.6, -0.8);   // the peel's direction: toward the lower outer corner
float sheetZ(int i, vec2 p) {
  if (i == 0) return 0.0;
  if (i == 1) return 0.5 + 0.12 * sin(p.x * 1.3 + 0.5) * sin(p.y * 0.7);
  if (i == 2) return 1.1 + 0.05 * p.x;
  if (i == 3) return 1.8 + 0.08 * p.x * p.x * 0.1;
  if (i == 4) return 30.0;
  if (i == 5) return 46.0;
  return 52.0;
}
float sheetOpac(int i) { return i == 6 ? 0.0 : (i == 5 ? 0.95 : 1.0); }
// the tunic before peeling: the frame's width, down to the stitched hem
float tunicShape(vec2 p) {
  float hem = -2.6 + 0.25 * sin(p.x * 0.8) + 0.12 * sin(p.x * 2.7 + 1.0);
  return max(abs(p.x - 1.0) - 22.0, hem - p.y);
}
vec2 foldF() { return CORNER + PN * 8.0 - PN * uPeel; }
float peelSide(vec2 p) { return dot(p - foldF(), PN); }   // > 0: peeled away
float tunicSD(vec2 p, bool hq) {
  float d = tunicShape(p);
  float side = torn(peelSide(p), p, 0.25, 4.0, hq);
  return max(d, side);
}
float flapSD(vec2 p, bool hq) {
  if (uPeel <= 8.05) return 1e3;
  float s = peelSide(p);
  if (s > 0.3) return 1e3;
  vec2 r = p - 2.0 * s * PN;          // where this point of the flap was before it folded
  float d = tunicShape(r);
  d = max(d, torn(s, p, 0.25, 4.0, hq));
  // the flap curls: it doesn't lie fully flat, its far part lifts and narrows
  return d + 0.02 * max(0.0, -s);
}
// the dagger lies along the outer thigh, point down
const vec2 GUARD = vec2(4.2, 6.2);
const vec2 TIPP = vec2(4.6, -1.4);
float bladeD(vec2 p, out float t) {
  vec2 ax = normalize(TIPP - GUARD);
  vec2 q = p - GUARD;
  t = dot(q, ax) / length(TIPP - GUARD);
  float w = mix(0.62, 0.02, pow(sat(t), 1.4));
  float side = abs(dot(q, vec2(-ax.y, ax.x)));
  return max(side - w, max(-dot(q, ax), dot(q, ax) - length(TIPP - GUARD)));
}
float daggerSD(vec2 p, bool hq) {
  float t; float b = bladeD(p, t);
  vec2 ax = normalize(TIPP - GUARD);
  vec2 q = p - GUARD;
  vec2 lq = vec2(dot(q, vec2(-ax.y, ax.x)), dot(q, ax));
  float guard = sdBox2(lq - vec2(0.0, -0.15), vec2(1.15, 0.22));
  guard = min(guard, sdCircle(vec2(abs(lq.x) - 1.15, lq.y + 0.15), 0.3));
  float grip = sdBox2(lq - vec2(0.0, -1.6), vec2(0.34, 1.3));
  float pommel = sdCircle(lq - vec2(0.0, -3.15), 0.55);
  float d = min(min(b, guard), min(grip, pommel));
  // two leather straps around the thigh, with buckles
  for (int k = 0; k < 2; k++) {
    float y = k == 0 ? 3.0 : -0.2;
    float st = abs(p.y - y + 0.08 * p.x - 0.35 * pow((p.x - 1.0) / 5.0, 2.0)) - 0.42;
    st = max(st, abs(p.x - 1.0) - 5.2);
    d = min(d, st);
  }
  return d;
}
float thighSD(vec2 p, bool hq) {
  // the thigh, its knee below the frame, widening up into the hip; the other leg behind
  float x0 = 1.0 + 0.1 * p.y;
  float w = 4.6 + 0.12 * p.y;
  float d = abs(p.x - x0) - w;
  float other = abs(p.x + 9.5 - 0.15 * p.y) - 3.6;
  return cut(min(d, other), p, 2.0);
}
float wallSD(vec2 p) {
  float win = sdBox2(p - vec2(-18.0, 4.0), vec2(5.0, 9.0));
  win = min(win, sdCircle(p - vec2(-18.0, 13.0), 5.0));
  float s = 1.9;
  float bars = min(abs(mod(p.x + p.y, s) - s * 0.5), abs(mod(p.x - p.y, s) - s * 0.5)) * 0.7071 - 0.16;
  return -max(win, -bars);
}
// his hand hanging at his side, in front of the cloth (the left: the one that will draw)
float handSD(vec2 p) {
  float d = sdTaper(p, vec2(-10.6, 10.5), vec2(-9.0, 0.6), 1.05, 0.8);
  d = smin(d, sdTaper(p, vec2(-9.0, 0.4), vec2(-8.6, -2.2), 0.82, 0.62), 0.3);
  d = smin(d, sdTaper(p, vec2(-8.7, -2.0), vec2(-8.3, -3.9), 0.55, 0.3), 0.25);
  d = min(d, sdTaper(p, vec2(-8.2, -0.8), vec2(-7.5, -2.3), 0.22, 0.15));
  return d;
}
float sheetSD(int i, vec2 p, bool hq) {
  if (i == 0) return flapSD(p, hq);
  if (i == 1) return tunicSD(p, hq);
  if (i == 2) return daggerSD(p, hq);
  if (i == 3) return thighSD(p, hq);
  if (i == 4) return wallSD(p);
  if (i == 5) return -1.0;
  return -1.0;
}
vec3 weave(vec2 p, vec3 c) {
  float w = 0.5 + 0.5 * sin(p.x * 26.0) * sin(p.y * 26.0);
  float th = vnoise(vec2(p.x * 40.0, p.y * 2.0)) * 0.5 + vnoise(vec2(p.x * 2.0, p.y * 40.0)) * 0.5;
  return c * (0.78 + 0.18 * w + 0.18 * th);
}
Mat sheetMat(int i, vec2 p, float sd) {
  if (false) {
    vec3 c = lin(vec3(0.6, 0.46, 0.34)) * (0.8 + 0.3 * pulp(p * 2.0, 4.0));
    c *= 1.0 - 0.5 * smoothstep(0.2, 0.9, abs(p.x + 9.0 - 0.1 * (p.y - 1.0)) / 0.9);
    float kn = smoothstep(0.06, 0.0, abs(fract(p.y * 1.4) - 0.5) - 0.45) * step(p.y, -2.2);
    c *= 1.0 - 0.4 * kn;
    Mat m = mPaper(c); m.tear = 0.0; m.trans = 0.3; m.seed = 13.0; return m;
  }
  if (i == 0) {
    // the lining on the back of the folded flap: paler undyed cloth, a seam, shadowed toward the fold
    float s = peelSide(p);
    vec3 c = weave(p, lin(vec3(0.46, 0.38, 0.28)));
    c *= mix(0.65, 1.05, smoothstep(0.0, -2.5, s));
    Mat m = mPaper(c); m.kind = K_FABRIC; m.fuzz = 0.08; m.tear = 1.0; m.trans = 0.35; m.seed = 2.0;
    return m;
  }
  if (i == 1) {
    vec3 c = weave(p, lin(vec3(0.42, 0.2, 0.11)));
    c *= 0.75 + 0.35 * (0.5 + 0.5 * sin(p.x * 0.9 + 0.6 * sin(p.y * 0.4)));    // folds
    // the hem: a band of dark stitched cloth, running stitches
    float hem = -2.6 + 0.25 * sin(p.x * 0.8) + 0.12 * sin(p.x * 2.7 + 1.0);
    float band = smoothstep(0.08, 0.0, abs(p.y - hem - 0.55) - 0.35);
    c = mix(c, lin(vec3(0.18, 0.09, 0.05)), band * 0.8);
    float stitch = step(0.5, fract(p.x * 2.2)) * smoothstep(0.05, 0.0, abs(p.y - hem - 1.05) - 0.04);
    c = mix(c, lin(vec3(0.62, 0.52, 0.36)), stitch * 0.8);
    // the belt across the top
    if (p.y > 8.2) { c = lin(vec3(0.12, 0.08, 0.05)) * (0.7 + 0.5 * vnoise(p * vec2(1.0, 8.0))); }
    // the shadow the flap throws as it lifts
    c *= 1.0 - 0.45 * smoothstep(1.2, 0.0, -peelSide(p)) * step(8.05, uPeel);
    Mat m = mPaper(c); m.kind = K_FABRIC; m.fuzz = 0.07; m.tear = 1.0; m.trans = 0.25; m.seed = 3.0;
    return m;
  }
  if (i == 2) {
    float t; float b = bladeD(p, t);
    vec2 ax = normalize(TIPP - GUARD);
    vec2 lq = vec2(dot(p - GUARD, vec2(-ax.y, ax.x)), dot(p - GUARD, ax));
    if (b < 0.01) {
      // tarnished silver foil, a ridge down the middle of the double edge, the glint running down it
      Mat m = mFoil(lin(vec3(0.62, 0.62, 0.6)), false);
      float ridge = smoothstep(0.08, 0.0, abs(lq.x));
      m.alb *= 0.6 + 0.4 * smoothstep(0.4, 0.75, 1.0 - fbm(p * 1.5, 3));
      m.alb *= 1.0 - 0.3 * ridge;
      float g = exp(-pow((t - uGlint.x) * 9.0, 2.0)) * uGlint.y;
      m.emit = vec3(1.6, 1.5, 1.3) * g * (0.4 + 0.6 * smoothstep(0.5, 0.0, abs(lq.x)));
      m.seed = 5.0;
      return m;
    }
    if (lq.y < 0.2 && lq.y > -2.9 && abs(lq.x) < 0.4) {
      // the grip wound with dark thread
      Mat m = mPaper(lin(vec3(0.12, 0.07, 0.05)) * (0.6 + 0.6 * step(0.5, fract(lq.y * 5.0 + lq.x * 0.6))));
      m.kind = K_FABRIC; m.tear = 0.0; m.fuzz = 0.02; m.seed = 6.0; return m;
    }
    if (lq.y > -3.8 && lq.y < 0.2 && abs(lq.x) < 1.6) {
      Mat m = mFoil(lin(vec3(0.75, 0.55, 0.28)), true);
      m.alb *= 0.55 + 0.45 * smoothstep(0.0, 0.04, cracks(p, 3.0).x);
      m.seed = 7.0; return m;
    }
    // straps: dark leather card, edges tooled, a brass buckle on each
    vec2 bq = vec2(p.x - 0.4, p.y - (p.y > 1.4 ? 3.0 : -0.2) + 0.08 * p.x);
    float buck = abs(sdBox2(bq, vec2(0.55, 0.45))) - 0.1;
    if (buck < 0.0) { Mat m = mFoil(lin(vec3(0.7, 0.5, 0.25)), true); m.seed = 8.0; return m; }
    Mat m = mCard(lin(vec3(0.16, 0.09, 0.05)) * (0.7 + 0.5 * vnoise(p * vec2(0.8, 6.0))));
    m.kind = K_WOOD; m.seed = 9.0; return m;
  }
  if (i == 3) {
    vec3 c = lin(vec3(0.6, 0.46, 0.34));
    c *= 0.8 + 0.3 * pulp(p * 2.0, 1.0);
    // charcoal modelling down the sides of the thigh, the other leg in shadow
    float x0 = 1.0 + 0.1 * p.y, w = 4.6 + 0.12 * p.y;
    c *= 1.0 - 0.55 * smoothstep(0.3, 1.0, abs(p.x - x0) / w);
    if (p.x < x0 - w) c *= 0.4;
    // the strap shadow on the skin
    c *= 1.0 - 0.35 * smoothstep(0.9, 0.2, abs(abs(p.y - 1.4) - 1.6));
    Mat m = mPaper(c); m.tear = 0.0; m.trans = 0.3; m.seed = 10.0; return m;
  }
  if (i == 4) {
    float win = sdBox2(p - vec2(-18.0, 4.0), vec2(5.0, 9.0));
    win = min(win, sdCircle(p - vec2(-18.0, 13.0), 5.0));
    Mat m = mPaper(lin(vec3(0.16, 0.13, 0.11)) * (0.7 + 0.4 * brush(p * 0.5, 0.3, 11.0)));
    if (win < 0.0) { m = mCard(lin(vec3(0.15, 0.1, 0.06))); m.kind = K_WOOD; }
    m.seed = 11.0; return m;
  }
  if (i == 5) {
    Mat m = mPaper(lin(vec3(0.35, 0.38, 0.46)) * (0.75 + 0.4 * brush(p * 0.4, 0.1, 12.0)));
    m.trans = 0.8; m.tear = 0.0; return m;
  }
  return mGlow(vec3(1.2, 1.35, 1.8));
}
` + PAPER_TRACE;
