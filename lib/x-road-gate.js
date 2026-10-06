// The gate of a Moabite town at dusk (s01): a heavy town wall of cut card with a round-arched gate
// whose parchment lining glows with the fire inside, rooftops and a tower beyond, a dusk sky of
// painted parchment. In front, a line of Israelite farmers (puppets) bring a sack, a jar and a lamb
// to a fat tax-collector at a trestle table, and on the near gate post, a plate of parchment
// scratched with tally marks, one for every year.
import { PAPER_HEAD, PAPER_TRACE, PAPER_UNIFORMS } from '/song/lib/paper.js';
import { PUPPET_GLSL, pose } from '/song/lib/puppet.js';
import { ROAD_LIB } from '/song/lib/x-road.js';

export const GATE_UNIFORMS = {
  ...PAPER_UNIFORMS,
  uTax: pose({ style: 4 }), uF0: pose({ style: 1 }), uF1: pose({ style: 3 }), uF2: pose({ style: 2 }),
  uSack: [0, 0, 0, 0], uJar: [0, 0, 0, 0], uLamb: [0, 0, 0, 0],
  uTally: 17, uCutK: 1, uPost: 0, uFlame: 1, uFire: 1, uFresh: 0,
};

export const GATE_GLSL = PAPER_HEAD + PUPPET_GLSL + ROAD_LIB + /* glsl */ `
uniform float uTax[12], uF0[12], uF1[12], uF2[12];
uniform vec4 uSack, uJar, uLamb;   // xy position, z rotation, w step
uniform float uTally, uCutK, uPost, uFlame, uFire, uFresh;
#define NL 9
// 0 near ground and jars, 1 gate post, 2 people and the table, 3 ground, 4 town wall, 5 its lining,
// 6 roofs and tower, 7 sky, 8 light box
float sheetZ(int i, vec2 p) {
  if (i == 0) return 0.0;
  if (i == 1) return 7.0;
  if (i == 2) return 16.0;
  if (i == 3) return 18.0;
  if (i == 4) return 33.0;
  if (i == 5) return 34.5;
  if (i == 6) return 56.0;
  if (i == 7) return 84.0;
  return 90.0;
}
float sheetOpac(int i) { if (i == 8) return 0.0; if (i == 5) return 0.6; if (i == 7) return 0.9; return 1.0; }

// ---- small props ----
float sackSD(vec2 q) {   // a tied grain sack, base at the origin, about 3 tall
  float d = sdBox2(q - vec2(0.0, 1.2), vec2(1.15, 1.1)) - 0.45;
  d = smin(d, sdTri(q, vec2(-0.5, 2.4), vec2(0.5, 2.4), vec2(0.15, 3.5)), 0.3);
  return d;
}
float jarSD(vec2 q) {    // a tall clay jar, base at the origin
  float d = sdEllipsoid(vec3(q - vec2(0.0, 1.8), 0.0), vec3(1.25, 1.75, 1.0));
  d = min(d, sdBox2(q - vec2(0.0, 3.7), vec2(0.5, 0.5)));
  d = min(d, sdBox2(q - vec2(0.0, 4.2), vec2(0.75, 0.15)));
  d = max(d, -q.y + 0.15);
  return d;
}
float lambSD(vec2 q, float st, out int part) {   // a lamb facing +x, feet at the origin
  part = 0;
  float g = sin(st * 3.1);
  float legs = 1e3;
  for (int k = 0; k < 4; k++) {
    float x = k < 2 ? 1.2 + float(k) * 0.4 : -1.3 + float(k - 2) * 0.4;
    float sw = (k == 0 || k == 3) ? g : -g;
    legs = min(legs, sdTaper(q, vec2(x, 1.8), vec2(x + sw * 0.25, 0.0), 0.2, 0.14));
  }
  vec2 b = q - vec2(0.0, 2.6);
  float body = sdEllipsoid(vec3(b, 0.0), vec3(2.1, 1.15, 1.0));
  float an = atan(b.y, b.x);
  body -= 0.14 * abs(sin(an * 9.0));    // the curly fleece, cut in scallops
  float head = sdEllipsoid(vec3(rot(0.5) * (q - vec2(2.3, 3.5)), 0.0), vec3(0.75, 0.45, 1.0));
  float ear = sdTaper(q, vec2(2.0, 3.8), vec2(1.4, 3.6 - 0.2 * g), 0.18, 0.08);
  if (head < 0.0) { part = 2; return head; }
  if (ear < 0.0) { part = 2; return ear; }
  if (body < 0.0) { part = 1; return body; }
  if (legs < 0.0) { part = 3; return legs; }
  return min(min(body, head), min(ear, legs));
}

// ---- the people sheet: table, collector, farmers, sack, jar, lamb ----
// who: 0 collector, 1..3 farmers, 4 table, 5 sack, 6 jar, 7 lamb, 8 coins, 9 turban
float people(vec2 p, bool hq, out int who, out int pt, out vec2 lp, out float sh) {
  who = -1; pt = 0; lp = p; sh = 0.0;
  // the trestle table in front of the collector
  vec2 tq = p - vec2(7.0, -7.0);
  float top = sdBox2(tq - vec2(0.0, 5.6), vec2(4.6, 0.35));
  float legs = min(sdTaper(tq, vec2(-3.4, 5.4), vec2(-4.0, 0.0), 0.3, 0.25), sdTaper(tq, vec2(3.4, 5.4), vec2(4.0, 0.0), 0.3, 0.25));
  legs = min(legs, sdSeg(tq, vec2(-3.7, 2.0), vec2(3.7, 2.0), 0.15));
  float table = min(top, legs);
  if (table < 0.0) { who = 4; lp = tq; return table; }
  // coins stacked on the table
  float coins = 1e3;
  for (int k = 0; k < 3; k++) coins = min(coins, sdBox2(tq - vec2(1.0 + float(k) * 0.9, 6.15 + 0.12 * float(k)), vec2(0.38, 0.2 + 0.12 * float(k))));
  if (coins < 0.0) { who = 8; lp = tq; return coins; }
  float sk = sackSD(rot(uSack.z) * (p - uSack.xy));
  if (sk < 0.0) { who = 5; lp = p - uSack.xy; return sk; }
  float jr = jarSD(rot(uJar.z) * (p - uJar.xy));
  if (jr < 0.0) { who = 6; lp = p - uJar.xy; return jr; }
  int lpart; float lb = lambSD((p - uLamb.xy) / 0.9, uLamb.w, lpart) * 0.9;
  if (lb < 0.0) { who = 7; pt = lpart; lp = p - uLamb.xy; return lb; }
  Fig fc = figAt(uTax);
  float tb = turbanSD(p, fc);
  if (tb < 0.0) { who = 9; lp = headLocal(p, fc); return tb; }
  float c = figure(p, fc, pt, lp, sh, hq);
  if (c < 0.0) { who = 0; return c; }
  int pt1; vec2 lp1; float sh1;
  float f0 = figure(p, figAt(uF0), pt1, lp1, sh1, hq);
  if (f0 < 0.0) { who = 1; pt = pt1; lp = lp1; sh = sh1; return f0; }
  float f1 = figure(p, figAt(uF1), pt1, lp1, sh1, hq);
  if (f1 < 0.0) { who = 2; pt = pt1; lp = lp1; sh = sh1; return f1; }
  float f2 = figure(p, figAt(uF2), pt1, lp1, sh1, hq);
  if (f2 < 0.0) { who = 3; pt = pt1; lp = lp1; sh = sh1; return f2; }
  return min(min(min(table, coins), min(sk, jr)), min(min(lb, tb), min(min(c, f0), min(f1, f2))));
}

// ---- the gate post and its tallies ----
vec2 postC() { return vec2(17.5, -10.0); }
float postSD(vec2 p, bool hq) {
  vec2 q = p - postC() - vec2(0.0, uPost);
  float d = sdBox2(q - vec2(0.0, 13.0), vec2(3.2, 13.0));
  d = min(d, sdBox2(q - vec2(0.0, 26.5), vec2(3.9, 0.9)));    // capital
  // the torch bracket and the torch on the post's left side
  d = min(d, sdSeg(q, vec2(-3.0, 18.0), vec2(-4.6, 19.2), 0.18));
  d = min(d, sdTaper(q, vec2(-4.6, 18.6), vec2(-4.9, 21.3), 0.28, 0.4));
  // the flame
  vec2 fq = q - vec2(-4.9, 21.4);
  float fl = sdTaper(fq, vec2(0.0, 0.3), vec2(0.25 * sin(uTime * 9.0), 1.6 * uFlame + 0.4), 0.5, 0.04) + (vnoise(fq * 3.0 - vec2(0.0, uTime * 5.0)) - 0.5) * 0.3;
  d = min(d, fl);
  return cut(d, p, 7.0);
}
// distance to the nearest tally scratch, and whether it is the fresh one
vec2 tallies(vec2 q) {
  // q in plate coordinates: the plate spans x -2.4..2.4, y 0..7
  float d = 1e3, fresh = 0.0;
  for (int k = 0; k < 18; k++) {
    if (float(k) >= uTally) break;
    int row = k < 10 ? 0 : 1;
    int j = k - row * 10;
    int grp = j / 5, m = j - grp * 5;
    float x0 = -1.9 + float(grp) * 2.2;
    float y0 = row == 0 ? 4.1 : 0.9;
    float s;
    float lenK = (k == 17) ? uCutK : 1.0;
    if (m < 4) {
      float x = x0 + float(m) * 0.42 + 0.05 * sin(float(k) * 7.1);
      vec2 a = vec2(x, y0 + 2.2), b = vec2(x + 0.06 * sin(float(k) * 3.3), y0);
      s = sdSeg(q, a, mix(a, b, lenK), 0.065);
    } else {
      s = sdSeg(q, vec2(x0 - 0.35, y0 + 0.5), vec2(x0 + 1.6, y0 + 1.8), 0.06);
    }
    if (s < d) { d = s; fresh = k == 17 ? 1.0 : 0.0; }
  }
  return vec2(d, fresh);
}

// ---- the wall and its gate ----
float wallSD(vec2 p, bool holes) {
  float d = sdBox2(p - vec2(0.0, -2.0), vec2(80.0, 14.0));
  // a tower at the left, crenellations along the top
  d = min(d, sdBox2(p - vec2(-24.0, 10.0), vec2(6.0, 22.0)));
  float cr = sdBox2(vec2(mod(p.x + 0.9, 1.8) - 0.9, p.y - 12.6), vec2(0.5, 0.7));
  d = min(d, max(cr, abs(p.x - 2.0) - 40.0));
  if (holes) {
    // the arched gate
    float g = min(sdBox2(p - vec2(-4.0, -6.0), vec2(4.6, 7.0)), sdCircle(p - vec2(-4.0, 1.0), 4.6));
    // slit windows in the tower
    float w = min(sdBox2(p - vec2(-24.0, 14.0), vec2(0.35, 1.4)), sdBox2(p - vec2(-21.0, 7.0), vec2(0.3, 1.1)));
    d = max(d, -min(g, w));
  }
  return cut(d, p, 4.0);
}
float roofsSD(vec2 p) {
  float d = sdBelow(p, 6.0);
  float cx = floor(p.x / 6.5);
  for (int k = -1; k <= 1; k++) {
    float c = cx + float(k);
    float x0 = c * 6.5 + 3.25;
    float h = 9.0 + 7.0 * hash11(c * 0.71 + 3.0);
    d = min(d, sdBox2(p - vec2(x0, h * 0.5), vec2(2.4 + 0.8 * hash11(c + 1.0), h * 0.5)));
    if (hash11(c + 8.0) > 0.6) d = min(d, sdCircle(p - vec2(x0, h), 2.0));   // a dome
  }
  // a stepped temple of the god of Moab
  for (int k = 0; k < 4; k++) d = min(d, sdBox2(p - vec2(6.0, 10.0 + float(k) * 2.6), vec2(7.0 - float(k) * 1.5, 1.3)));
  return d;
}

float sheetSD(int i, vec2 p, bool hq) {
  if (i == 0) {
    float d = sdBelow(p, -12.0 + 0.6 * sin(p.x * 0.35) + 3.0 * smoothstep(-16.0, -30.0, p.x));
    d = min(d, jarSD((p - vec2(-23.0, -11.0)) / 1.9) * 1.9);
    d = min(d, sackSD((p - vec2(-18.5, -11.5)) / 1.5) * 1.5);
    return torn(d, p, 0.15, 1.0, hq);
  }
  if (i == 1) return postSD(p, hq);
  if (i == 2) { int w, pt; vec2 lp; float sh; return people(p, hq, w, pt, lp, sh); }
  if (i == 3) return torn(sdBelow(p, -7.0 + 0.3 * sin(p.x * 0.2)), p, 0.2, 3.0, hq);
  if (i == 4) return wallSD(p, true);
  if (i == 5) return sdBox2(p - vec2(-4.0, -3.0), vec2(6.5, 10.5));
  if (i == 6) return cut(roofsSD(p), p, 6.0);
  return -1.0;
}
Mat sheetMat(int i, vec2 p, float sd) {
  if (i == 0) { Mat m = mCard(lin(vec3(0.045, 0.04, 0.035))); m.seed = 1.0; return m; }
  if (i == 1) {
    vec2 q = p - postC() - vec2(0.0, uPost);
    vec2 fq = q - vec2(-4.9, 21.4);
    if (fq.y > 0.2 && length(fq) < 3.0 && sdTaper(fq, vec2(0.0, 0.3), vec2(0.25 * sin(uTime * 9.0), 1.6 * uFlame + 0.4), 0.5, 0.04) + (vnoise(fq * 3.0 - vec2(0.0, uTime * 5.0)) - 0.5) * 0.3 < 0.05) {
      float k = sat(1.0 - fq.y / (1.6 * uFlame + 0.6));
      return mGlow(mix(vec3(3.0, 0.9, 0.2), vec3(6.0, 3.4, 1.2), k * k) * uFlame * (0.8 + 0.4 * vnoise(fq * 4.0 - vec2(0.0, uTime * 6.0))));
    }
    // weathered wood post
    Mat m = mCard(lin(vec3(0.24, 0.17, 0.11)));
    m.kind = K_WOOD;
    m.alb *= 0.7 + 0.45 * vnoise(vec2(q.x * 3.0, q.y * 0.25)) + 0.15 * sin(q.x * 9.0 + vnoise(q * 0.5) * 4.0);
    m.alb *= 1.0 - 0.5 * smoothstep(1.5, 3.2, abs(q.x));
    // the parchment plate nailed to it, with the tallies scratched in
    vec2 pq = q - vec2(0.0, 9.0);
    float plate = torn(sdBox2(pq - vec2(0.0, 3.5), vec2(2.6, 3.9)), p, 0.2, 9.0, true);
    if (plate < 0.0) {
      m = mPaper(lin(vec3(0.66, 0.57, 0.42)));
      m.alb *= 0.78 + 0.3 * brush(pq, 0.1, 9.0);
      m.alb *= 1.0 - 0.3 * smoothstep(0.4, 0.75, fbm(pq * 0.8, 3));   // stains
      m.alb *= 1.0 - 0.25 * thumb(pq, vec2(1.6, 6.4), 0.4, 0.6);
      vec2 tl = tallies(pq);
      float groove = smoothstep(0.03, -0.02, tl.x);
      float lip = smoothstep(0.1, 0.02, tl.x) * (1.0 - groove);
      vec3 ink = lin(vec3(0.08, 0.05, 0.035));
      m.alb = mix(m.alb, ink, groove * 0.92);
      m.alb = mix(m.alb, lin(vec3(0.85, 0.78, 0.64)), lip * 0.5);
      // the fresh cut: raw pale fibre glinting for a moment
      m.emit = vec3(2.2, 1.5, 0.8) * smoothstep(0.12, 0.0, tl.x) * tl.y * uFresh;
      m.tear = 1.0; m.trans = 0.3; m.seed = 9.0;
      // nail heads
      float nl = min(length(pq - vec2(-2.1, 7.0)), min(length(pq - vec2(2.1, 7.0)), min(length(pq - vec2(-2.1, 0.0)), length(pq - vec2(2.1, 0.0))))) - 0.16;
      if (nl < 0.0) m = mFoil(lin(vec3(0.3, 0.24, 0.18)), false);
    }
    // the iron bracket
    if (sdSeg(q, vec2(-3.0, 18.0), vec2(-4.6, 19.2), 0.2) < 0.0 || (q.x < -3.5 && q.y > 18.4 && q.y < 21.5)) { m = mCard(lin(vec3(0.07, 0.06, 0.05))); m.kind = K_WOOD; }
    m.seed = 7.0;
    return m;
  }
  if (i == 2) {
    int w, pt; vec2 lp; float sh;
    people(p, true, w, pt, lp, sh);
    if (w == 0) {
      if (pt == PT_CROWN) { Mat m = mPaper(lin(vec3(0.5, 0.44, 0.32))); m.kind = K_FABRIC; return m; }
      return figMat(pt, lp, sh, figAt(uTax), lin(vec3(0.22, 0.15, 0.1)), lin(vec3(0.1, 0.07, 0.05)));
    }
    if (w == 9) {
      Mat m = mPaper(lin(vec3(0.52, 0.46, 0.34)));
      m.kind = K_FABRIC; m.tear = 0.3;
      m.alb *= 0.75 + 0.3 * sin((lp.y - 0.4 * lp.x) * 9.0) * 0.5 + 0.15;    // the wraps
      return m;
    }
    if (w == 1) return figMat(pt, lp, sh, figAt(uF0), lin(vec3(0.3, 0.26, 0.19)), lin(vec3(0.2, 0.18, 0.15)));
    if (w == 2) return figMat(pt, lp, sh, figAt(uF1), lin(vec3(0.33, 0.2, 0.14)), lin(vec3(0.24, 0.2, 0.16)));
    if (w == 3) return figMat(pt, lp, sh, figAt(uF2), lin(vec3(0.25, 0.26, 0.19)), lin(vec3(0.1, 0.08, 0.06)));
    if (w == 4) {
      Mat m = mCard(lin(vec3(0.27, 0.18, 0.11))); m.kind = K_WOOD;
      m.alb *= 0.7 + 0.4 * vnoise(vec2(lp.x * 0.4, lp.y * 6.0));
      return m;
    }
    if (w == 8) { Mat m = mFoil(lin(vec3(0.75, 0.58, 0.3)), true); m.alb *= 0.6 + 0.4 * step(0.5, fract(lp.y * 6.0)); return m; }
    if (w == 5) { Mat m = mPaper(lin(vec3(0.44, 0.36, 0.25))); m.kind = K_FABRIC; m.alb *= 0.8 + 0.25 * brush(lp * 2.0, 0.4, 5.0); m.alb *= 1.0 - 0.3 * hatch(lp * 2.0, 0.3, 2.0); return m; }
    if (w == 6) { Mat m = mPaper(lin(vec3(0.42, 0.22, 0.12))); m.tear = 0.0; m.alb *= 1.0 - 0.5 * smoothstep(0.08, 0.0, abs(lp.y - 2.6) - 0.06); m.alb *= 0.85 + 0.2 * brush(lp, 1.5, 6.0); return m; }
    if (w == 7) {
      if (pt == 1) { Mat m = mPaper(lin(vec3(0.7, 0.66, 0.58))); m.fuzz = 0.08; m.alb *= 0.75 + 0.35 * vnoise(lp * 5.0); return m; }
      if (pt == 2) { Mat m = mPaper(lin(vec3(0.18, 0.15, 0.13))); m.tear = 0.0; return m; }
      Mat m = mPaper(lin(vec3(0.15, 0.12, 0.1))); m.tear = 0.0; return m;
    }
    return mCard(vec3(0.02));
  }
  if (i == 3) {
    Mat m = mPaper(lin(vec3(0.28, 0.23, 0.17)));
    float dy = -7.0 + 0.3 * sin(p.x * 0.2) - p.y;
    m.alb *= (0.75 + 0.35 * brush(p, 0.05, 3.0)) * mix(0.9, 0.2, smoothstep(0.4, 5.0, dy));
    m.seed = 3.0; return m;
  }
  if (i == 4) {
    // the wall: big cut stones painted with charcoal and shadowed at the joints
    Mat m = mCard(lin(vec3(0.24, 0.2, 0.16)));
    vec2 b = vec2(p.x + 0.9 * step(0.5, fract(p.y / 2.4 * 0.5)) * 1.0, p.y);
    vec2 sc = vec2(fract(b.x / 3.6), fract(b.y / 2.4));
    float joint = min(min(sc.x, 1.0 - sc.x) * 3.6, min(sc.y, 1.0 - sc.y) * 2.4);
    m.alb *= 0.65 + 0.4 * hash12(floor(vec2(b.x / 3.6, b.y / 2.4)));
    m.alb *= mix(0.35, 1.0, smoothstep(0.0, 0.18, joint));
    m.alb *= 0.8 + 0.3 * brush(p, 0.2, 4.0);
    m.alb *= 1.0 - 0.5 * smoothstep(-5.0, 20.0, p.y) * smoothstep(0.0, -30.0, p.x);   // the upper left in deep shade
    m.seed = 4.0; return m;
  }
  if (i == 5) { Mat m = mPaper(lin(vec3(0.7, 0.52, 0.34))); m.trans = 0.8; m.seed = 5.0; m.alb *= 0.8 + 0.3 * pulp(p, 5.0); return m; }
  if (i == 6) { Mat m = mCard(lin(vec3(0.09, 0.075, 0.07))); m.seed = 6.0; return m; }
  if (i == 7) {
    vec2 c = vec2(24.0, 4.0);
    float k = smoothstep(4.0, 70.0, length((p - c) * vec2(0.6, 1.0)));
    vec3 a = mix(lin(vec3(0.5, 0.38, 0.3)), lin(vec3(0.07, 0.06, 0.075)), k);
    a *= 0.8 + 0.3 * brush(p * 0.4, 0.06, 10.0);
    Mat m = mPaper(a); m.trans = 0.5; m.tear = 0.0; m.seed = 10.0; return m;
  }
  return mGlow(vec3(1.6, 1.1, 0.75));
}
` + PAPER_TRACE;
