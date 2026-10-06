// The whole palace as a cutaway dollhouse diorama (the final chorus): the front of the palace is
// cut away like a toy house so every room shows at once. Upstairs, the antechamber with the
// guards standing before the locked gold door by candlelight, and beside it the dark summer room
// (an empty throne in a shaft of moonlight). Downstairs, the hall and the kitchen. Behind the palace,
// palms of cut card and layered torn hills under a low moon, with Ehud a tiny running figure on the
// far ridge.
//
// Sheets: 0 foreground ground and palms, 1 the house's cut front (walls and floors), 2 puppets,
// 3 furniture, 4 rooms' back walls, 5 near hills (with Ehud), 6 far hills, 7 sky, 8 light box.
import { PAPER_HEAD, PAPER_TRACE, PAPER_UNIFORMS, packLights } from '/song/lib/paper.js';
import { PUPPET_GLSL, pose } from '/song/lib/puppet.js';

const Z12 = () => new Array(12).fill(0);
export const HOUSE_UNIFORMS = {
  ...PAPER_UNIFORMS,
  uF0: Z12(), uF1: Z12(), uF2: Z12(), uF3: Z12(), uF4: Z12(),
  uPalm: 0, uFlame: 1,
};

export const HOUSE_GLSL = PAPER_HEAD + PUPPET_GLSL + /* glsl */ `
uniform float uF0[12], uF1[12], uF2[12], uF3[12], uF4[12];
uniform float uPalm, uFlame;
#define NL 9
#define PY -2.0
// rooms (in house coords, y already offset by PY)
float roomHall(vec2 p)  { return sdBox2(p - vec2(-28.0, -16.0 + PY), vec2(12.0, 6.0)); }
float roomKit(vec2 p)   { return sdBox2(p - vec2(-1.5, -16.0 + PY), vec2(12.5, 6.0)); }
float roomAnte(vec2 p)  { return sdBox2(p - vec2(-26.0, -3.0 + PY), vec2(14.0, 5.5)); }
float roomSumm(vec2 p)  { return sdBox2(p - vec2(0.75, -3.0 + PY), vec2(11.25, 5.5)); }
float houseOut(vec2 p) {
  float d = sdBox2(p - vec2(-14.0, -11.0 + PY), vec2(28.0, 13.5));
  // crenellations along the roof
  float cr = sdBox2(vec2(mod(p.x + 0.9, 1.8) - 0.9, p.y - (3.2 + PY)), vec2(0.5, 0.75));
  cr = max(cr, abs(p.x + 14.0) - 28.0);
  d = min(d, cr);
  // a little roof pavilion over the summer room
  d = min(d, sdBox2(p - vec2(0.75, 3.9 + PY), vec2(5.0, 1.4)));
  d = min(d, sdTri(p, vec2(-5.2, 5.2 + PY), vec2(6.7, 5.2 + PY), vec2(0.75, 7.6 + PY)));
  return d;
}
float rooms(vec2 p) { return min(min(roomHall(p), roomKit(p)), min(roomAnte(p), roomSumm(p))); }

float palmSD(vec2 p, vec2 base, float h, float lean, float bend) {
  vec2 q = p - base;
  float tr = sdTaper(q, vec2(0.0), vec2(lean, h), 0.7, 0.45);
  float d = tr;
  vec2 top = vec2(lean, h);
  for (int k = 0; k < 7; k++) {
    float a = -1.3 + float(k) * 0.43 + bend * 0.15;
    vec2 tip = top + vec2(sin(a) * 6.0, cos(a) * 3.0 - 1.6 * abs(sin(a)) - 0.5 - bend);
    d = min(d, sdTaper(q, top, tip, 0.65, 0.05));
  }
  return d;
}

float hillY(float x) { return -10.0 + 7.0 * exp(-pow((x - 34.0) / 12.0, 2.0)) + 1.2 * sin(x * 0.21) - 4.0 * smoothstep(5.0, -30.0, x); }
Fig figN(int k) { if (k == 0) return figAt(uF0); if (k == 1) return figAt(uF1); if (k == 2) return figAt(uF2); if (k == 3) return figAt(uF3); return figAt(uF4); }

float sheetZ(int i, vec2 p) {
  if (i == 0) return 6.0;
  if (i == 1) return 38.0;
  if (i == 2) return 41.5;
  if (i == 3) return 44.0;
  if (i == 4) return 47.0;
  if (i == 5) return 78.0;
  if (i == 6) return 104.0;
  if (i == 7) return 135.0;
  return 145.0;
}
float sheetOpac(int i) { if (i == 8) return 0.0; if (i == 7) return 0.95; return 1.0; }

float sheetSD(int i, vec2 p, bool hq) {
  if (i == 0) {
    float g = torn(sdBelow(p, -25.5 + 1.2 * sin(p.x * 0.11) + 0.6 * sin(p.x * 0.37)), p, 0.3, 1.0, hq);
    float pa = palmSD(p, vec2(-33.0, -26.0), 11.0, 1.5, uPalm);
    pa = min(pa, palmSD(p, vec2(9.0, -26.0), 13.0, -1.5, -uPalm));
    pa = min(pa, palmSD(p, vec2(14.0, -26.0), 9.0, 1.2, uPalm * 0.7));
    return min(g, torn(pa, p, 0.08, 2.0, hq));
  }
  if (i == 1) {
    float d = max(houseOut(p), -rooms(p));
    return cut(d, p, 1.0);
  }
  if (i == 2) {
    float d = 1e3;
    for (int k = 0; k < 4; k++) {
      Fig f = figN(k);
      if (f.scale < 0.01) continue;
      int pt; vec2 lp; float sh;
      d = min(d, figure(p, f, pt, lp, sh, hq));
    }
    return d;
  }
  if (i == 3) {
    // the gold door on the antechamber's back wall, its candle; the throne in the summer room;
    // columns and a table in the hall; jars and a hearth hood in the kitchen
    float door = min(sdBox2(p - vec2(-18.5, -6.6 + PY), vec2(2.6, 2.6)), sdCircle(p - vec2(-18.5, -4.0 + PY), 2.6));
    float candle = sdBox2(p - vec2(-37.5, -6.4 + PY), vec2(0.2, 0.9 + 0.0 * uFlame));
    float fl = sdEllipsoid(vec3(p - vec2(-37.5, -5.1 + PY), 0.0), vec3(0.18, 0.4 * uFlame, 1.0));
    vec2 tq = p - vec2(3.0, -8.5 + PY);
    tq.x = abs(tq.x);
    float throne = sdBox2(tq - vec2(0.0, 1.6), vec2(1.6, 0.3));
    throne = min(throne, sdBox2(tq - vec2(1.35, 0.8), vec2(0.18, 0.8)));
    throne = min(throne, sdBox2(tq - vec2(0.0, 3.8), vec2(1.3, 2.2)));
    throne = min(throne, sdCircle(tq - vec2(0.0, 6.0), 1.3));
    float crown = sdBox2(p - vec2(-2.3, -8.25 + PY), vec2(0.5, 0.18));
    for (int k = 0; k < 3; k++) crown = min(crown, sdTri(p, vec2(-2.75 + float(k) * 0.42, -8.1 + PY), vec2(-2.45 + float(k) * 0.42, -8.1 + PY), vec2(-2.6 + float(k) * 0.42, -7.6 + PY)));
    float robe = max(sdEllipsoid(vec3(p - vec2(-0.2, -8.5 + PY), 0.0), vec3(1.9, 0.9, 1.0)), -(p.y - (-8.5 + PY)));
    float cols = min(sdBox2(p - vec2(-34.0, -16.0 + PY), vec2(0.7, 6.0)), sdBox2(p - vec2(-22.0, -16.0 + PY), vec2(0.7, 6.0)));
    float table = min(sdBox2(p - vec2(-28.0, -19.2 + PY), vec2(3.5, 0.3)), sdBox2(vec2(abs(p.x + 28.0) - 3.0, p.y - (-20.7 + PY)), vec2(0.25, 1.3)));
    float jars = 1e3;
    for (int k = 0; k < 4; k++) jars = min(jars, sdEllipsoid(vec3(p - vec2(-11.0 + float(k) * 1.9, -20.6 + PY + 0.2 * hash11(float(k))), 0.0), vec3(0.8, 1.3, 1.0)));
    // a plastered chimney hood over the hearth: a flue and a flared skirt
    vec2 hq2 = p - vec2(5.0, -16.0 + PY);
    float hood = max(abs(hq2.y) - 1.4, abs(hq2.x) - (1.0 + (1.4 - hq2.y) * 0.75));
    hood = min(hood, sdBox2(hq2 - vec2(0.0, 2.8), vec2(1.0, 1.6)));
    float fire = sdTri(p, vec2(3.9, -22.0 + PY), vec2(6.1, -22.0 + PY), vec2(5.0 + 0.2 * sin(uTime * 7.0), -19.8 + PY + 0.3 * uFlame));
    float d = min(min(min(door, candle), min(fl, throne)), min(min(crown, robe), min(min(cols, table), min(min(jars, hood), fire))));
    return d;
  }
  if (i == 4) {
    // the rooms' back walls; the summer room has two lattice windows cut through
    float d = max(rooms(p) - 0.8, -0.0 + 0.0);
    d = rooms(p) - 0.8;
    for (int k = 0; k < 2; k++) {
      vec2 c = vec2(k == 0 ? -6.0 : 8.0, -2.4 + PY);
      float w = min(sdBox2(p - c, vec2(1.3, 2.2)), sdCircle(p - c - vec2(0.0, 2.2), 1.3));
      vec2 lq = rot(0.785) * (p - c);
      vec2 cc = abs(fract(lq / 0.7) - 0.5) * 0.7;
      d = max(d, -max(w, -(min(cc.x, cc.y) - 0.07)));
    }
    return d;
  }
  if (i == 5) {
    float d = torn(sdBelow(p, hillY(p.x)), p, 0.3, 5.0, hq);
    Fig f = figN(4);
    if (f.scale > 0.01) { int pt; vec2 lp; float sh; d = min(d, figure(p, f, pt, lp, sh, hq)); }
    return d;
  }
  if (i == 6) return torn(sdBelow(p, ridge(p.x + 40.0, -16.0, 12.0, 0.02, 9.0) - 4.0 * smoothstep(0.0, -50.0, p.x)), p, 0.45, 9.0, hq);
  if (i == 7) {
    // the night sky: black paper with the low moon cut out
    float d = max(-1.0, -sdCircle(p - vec2(53.0, 0.5), 6.5));
    vec2 c = floor(p / 3.5);
    float st = length(p - (c + hash22(c)) * 3.5) - 0.06;
    if (hash12(c + 1.0) > 0.86 && p.y < 18.0) d = max(d, -st);
    return d;
  }
  return -1.0;
}

Mat sheetMat(int i, vec2 p, float sd) {
  if (i == 0) {
    Mat m = mCard(lin(vec3(0.08, 0.07, 0.06)));
    m.alb *= 0.7 + 0.5 * fbm(p * 0.3, 3); m.seed = 1.0; m.tear = 0.5;
    if (p.y > -24.0) { m = mPaper(lin(vec3(0.1, 0.11, 0.07))); m.alb *= 0.7 + 0.5 * brush(p, 1.0, 3.0); m.trans = 0.3; m.seed = 2.0; }
    return m;
  }
  if (i == 1) {
    // the house's cut edge: dark card, painted courses of brick on the outside, the floor slabs
    // edged with thin wood
    Mat m = mCard(lin(vec3(0.5, 0.42, 0.32)));
    float bx = abs(fract((p.x + 0.9 * mod(floor(p.y / 1.1), 2.0)) / 1.8) - 0.5);
    float by = abs(fract(p.y / 1.1) - 0.5);
    m.alb *= 1.0 - 0.45 * smoothstep(0.42, 0.5, max(bx, by));
    m.alb *= 0.7 + 0.45 * fbm(p * 0.4, 3);
    m.alb *= mix(1.0, 0.35, smoothstep(-2.0, 8.0, p.y));
    if (abs(p.y - (-9.25 + PY)) < 0.8 && p.x > -41.5 && p.x < 13.5) { m = mCard(lin(vec3(0.34, 0.22, 0.12))); m.kind = K_WOOD; m.alb *= 0.7 + 0.5 * vnoise(vec2(p.x * 0.5, p.y * 8.0)); }
    if (p.y > 2.4 + PY) { Mat g = mFoil(lin(vec3(0.7, 0.52, 0.26)), true); g.alb *= 0.6; g.seed = 9.0; if (p.y > 4.0 + PY && abs(p.x - 0.75) < 6.5) return g; }
    m.seed = 3.0;
    return m;
  }
  if (i == 2) {
    for (int k = 0; k < 4; k++) {
      Fig f = figN(k);
      if (f.scale < 0.01) continue;
      int pt; vec2 lp; float sh;
      float d = figure(p, f, pt, lp, sh, true);
      if (d < 0.02) {
        vec3 t1 = k == 3 ? lin(vec3(0.5, 0.43, 0.32)) : lin(vec3(0.3, 0.26, 0.14));
        vec3 t2 = k == 3 ? lin(vec3(0.24, 0.12, 0.08)) : lin(vec3(0.12, 0.08, 0.05));
        return figMat(pt, lp, sh, f, t1, t2);
      }
    }
    return mCard(lin(vec3(0.1)));
  }
  if (i == 3) {
    float door = min(sdBox2(p - vec2(-18.5, -6.6 + PY), vec2(2.6, 2.6)), sdCircle(p - vec2(-18.5, -4.0 + PY), 2.6));
    if (door < 0.03) {
      Mat m = mFoil(lin(vec3(0.85, 0.64, 0.3)), true);
      vec2 q = p - vec2(-18.5, -6.0 + PY);
      m.alb *= 1.0 - 0.8 * smoothstep(0.08, 0.0, abs(q.x) - 0.03);
      m.alb *= 1.0 - 0.6 * smoothstep(0.08, 0.0, abs(rosetteH(q - vec2(sign(q.x) * 1.25, -0.6))) - 0.04);
      m.seed = 31.0; return m;
    }
    if (sdEllipsoid(vec3(p - vec2(-37.5, -5.1 + PY), 0.0), vec3(0.18, 0.4 * uFlame, 1.0)) < 0.02) return mGlow(vec3(6.0, 3.6, 1.4) * uFlame);
    if (p.y < -19.4 + PY && p.y > -22.1 + PY && abs(p.x - 5.0) < 1.3) { Mat m = mGlow(vec3(3.0, 1.1, 0.25) * (0.7 + 0.5 * vnoise(p * 3.0 + uTime * 4.0))); return m; }
    vec2 cq = p - vec2(-2.3, -8.1 + PY);
    if (length(cq) < 0.9 && p.y < -7.4 + PY) { Mat m = mFoil(lin(vec3(0.9, 0.7, 0.32)), true); m.seed = 32.0; return m; }
    if (abs(p.x + 0.2) < 2.0 && p.y < -7.5 + PY && p.x > -2.2) { Mat m = mPaper(lin(vec3(0.16, 0.07, 0.14))); m.kind = K_FABRIC; m.seed = 33.0; return m; }
    if (p.x > -12.0 && p.x < 14.0 && p.y > -9.0 + PY && p.y < 2.0 + PY) { Mat m = mCard(lin(vec3(0.3, 0.2, 0.12))); m.kind = K_WOOD; m.seed = 34.0; return m; }
    if (p.x < -12.0 && p.y < -9.0 + PY) { Mat m = mCard(lin(vec3(0.4, 0.33, 0.25))); m.alb *= 0.7 + 0.4 * vnoise(vec2(p.x * 2.0, p.y * 0.3)); m.seed = 35.0; return m; }
    Mat m = mCard(lin(vec3(0.38, 0.24, 0.15))); m.alb *= 0.7 + 0.4 * vnoise(p * 2.0); m.seed = 36.0; return m;
  }
  if (i == 4) {
    // parchment walls: warm where candles burn, blue-dark in the summer room
    Mat m = mPaper(lin(vec3(0.5, 0.42, 0.32)));
    m.alb *= 0.7 + 0.4 * brush(p * 0.6, 0.1, 4.0);
    if (roomSumm(p) < 0.5) m.alb = lin(vec3(0.22, 0.22, 0.26)) * (0.7 + 0.4 * brush(p * 0.6, 0.2, 5.0));
    m.alb *= 1.0 - 0.3 * hatch(p * 1.2, 0.3, 1.4);
    m.trans = 0.35; m.seed = 4.0; m.tear = 0.0;
    return m;
  }
  if (i == 5) {
    Fig f = figN(4);
    if (f.scale > 0.01) { int pt; vec2 lp; float sh; float d = figure(p, f, pt, lp, sh, true); if (d < 0.02) return figMat(pt, lp, sh, f, lin(vec3(0.45, 0.2, 0.1)), lin(vec3(0.3, 0.22, 0.14))); }
    Mat m = mPaper(lin(vec3(0.16, 0.16, 0.15))); m.alb *= 0.7 + 0.5 * brush(p * 0.5, -0.2, 6.0); m.trans = 0.3; m.seed = 5.0; return m;
  }
  if (i == 6) { Mat m = mPaper(lin(vec3(0.13, 0.14, 0.17))); m.alb *= 0.75 + 0.4 * brush(p * 0.4, 0.15, 7.0); m.trans = 0.4; m.seed = 6.0; return m; }
  if (i == 7) {
    vec3 a = mix(lin(vec3(0.16, 0.17, 0.22)), lin(vec3(0.03, 0.03, 0.04)), smoothstep(-6.0, 12.0, p.y));
    Mat m = mPaper(a * (0.8 + 0.3 * brush(p * 0.4, 0.1, 8.0))); m.trans = 0.3; m.seed = 7.0; m.tear = 0.0; return m;
  }
  return mGlow(vec3(1.6, 1.75, 2.1));
}
` + PAPER_TRACE;

// a small rosette for the dollhouse door (needed above the materials)
export const HOUSE_GLSL_FULL = HOUSE_GLSL.replace('float palmSD(', `float rosetteH(vec2 q) { float a = atan(q.y, q.x); return length(q) - 0.7 * (0.62 + 0.38 * abs(cos(a * 4.0))); }
float palmSD(`);

export { pose, packLights };
