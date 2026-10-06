// s33-eighty · "The land got eighty quiet years; That's how the chapter tells it." (128.36-132.76).
// The quiet years as the turning pages of the diorama: a great parchment page sweeps across the set on
// the hits and behind it the season changes (ploughing behind an ox, harvest sheaves, the vineyard,
// an olive grove), while a father and his son work the land and the boy grows tall from page to page.
// A paper sun and moon on threads swing round over the hills, again and again.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, L, stepT } from '/song/lib/paper.js';
import { EPH_HEAD, EPH_UNIFORMS, PAPER_TRACE } from '/song/lib/x-ephraim.js';

export const kind = 'shader';

// page turns, centred on the hits
const TURNS = [129.49, 130.58, 131.68];
const SWEEP = 0.62;
const ZPAGE = 1.0;

const GLSL = EPH_HEAD + /* glsl */ `
uniform vec2 uSea;        // the season before the page and after it
uniform float uPageX;     // the middle of the turning page (x on the page's plane)
uniform float uArm;       // the sun-and-moon arm's angle
uniform float uDay;       // 1 by day .. 0 by night
#define NL 8
// 0 the turning page, 1 the near land (father and son), 2 the fields, 3 the far hills and village,
// 4 sun and moon on threads, 5 far range, 6 sky, 7 light box
const float ZP = 6.0;
const float PW = 26.0;
float sheetZ(int i, vec2 p) {
  if (i == 0) { float u = sat((p.x - (uPageX - PW * 0.5)) / PW); return ZP - 3.5 * sin(3.14159 * u) - 2.0 * smoothstep(0.75, 1.0, u); }
  if (i == 1) return 8.0;
  if (i == 2) return 20.0;
  if (i == 3) return 34.0;
  if (i == 4) return 44.0;
  if (i == 5) return 58.0;
  if (i == 6) return 80.0;
  return 85.0;
}
float sheetOpac(int i) { if (i == 6) return 0.93; if (i == 7) return 0.0; return 1.0; }
// which season a point on a layer at depth z shows: old to the left of the page, new to the right
float seasonAt(vec2 p, float z) {
  float xs = uCamPos.x + (uPageX - uCamPos.x) * (z - uCamPos.z) / (ZP - uCamPos.z);
  return p.x < xs ? uSea.x : uSea.y;
}
vec2 sunPos() { return vec2(0.0, -12.0) + 22.0 * vec2(sin(uArm), cos(uArm)); }
vec2 moonPos() { return vec2(0.0, -12.0) - 22.0 * vec2(sin(uArm), cos(uArm)); }

// ---- the near land: ground, father and son, and the season's work ----
float sonScale(float s) { return s < 0.5 ? 0.36 : (s < 1.5 ? 0.48 : (s < 2.5 ? 0.6 : 0.74)); }
Fig father(float s) {
  float w = uStepT * 6.0;
  if (s < 0.5) return mkFig(vec2(-5.0, -12.0), 0.72, 1.0, 0.22, 0.1, -0.75, -0.45, -0.6, -0.55, 0.32 * sin(w), 2.0);   // at the plough
  if (s < 1.5) return mkFig(vec2(-8.0, -12.0), 0.72, 1.0, 0.38 + 0.08 * sin(w), 0.15, -1.0 + 0.3 * sin(w), -0.4, -0.5, -0.8, 0.15, 2.0);   // reaping
  if (s < 2.5) return mkFig(vec2(-6.0, -12.0), 0.72, 1.0, -0.05, -0.2, -2.3 + 0.15 * sin(w), -0.4, -1.8, -0.5, 0.05, 2.0);  // picking grapes
  return mkFig(vec2(-4.0, -12.0), 0.66, 1.0, 0.16, 0.12, -0.3, -0.9, 0.2, -0.3, 0.05, 1.0);                         // old now, on his staff
}
Fig son(float s) {
  float w = uStepT * 6.0;
  float sc = sonScale(s);
  if (s < 0.5) return mkFig(vec2(-13.0, -12.0), sc, 1.0, 0.1, 0.0, 0.4 * sin(w * 1.3), -0.5, -0.3, -0.4, 0.4 * sin(w), 2.0);   // sowing behind
  if (s < 1.5) return mkFig(vec2(2.5, -12.0), sc, 1.0, 0.45, 0.2, -0.6 + 0.2 * sin(w), -0.5, -0.4, -0.6, 0.1, 2.0);                // gathering the sheaves
  if (s < 2.5) return mkFig(vec2(-11.0, -12.0), sc, 1.0, 0.05, 0.05, -0.6, -1.2, -0.5, -1.1, 0.25 * sin(w), 2.0);              // the basket
  return mkFig(vec2(1.5, -12.0), sc, -1.0, 0.0, 0.1, -0.2, -0.3, 0.3, -0.2, 0.0, 2.0);                                         // grown, beside him
}
// the ox and plough, the sheaves, the basket, the vine posts, the olive tree
float oxSD(vec2 p) {
  vec2 q = p - vec2(7.0, -12.0);
  float w = uStepT * 6.0;
  float d = sdEllipsoid(vec3(q - vec2(0.0, 5.0), 0.0), vec3(4.2, 2.0, 1.0));
  d = smin(d, sdEllipsoid(vec3(q - vec2(4.6, 5.6), 0.0), vec3(1.4, 1.0, 1.0)), 0.6);       // head
  d = min(d, sdTaper(q, vec2(4.4, 6.3), vec2(5.6, 7.6), 0.18, 0.06));                      // horn
  d = min(d, sdTaper(q, vec2(-4.0, 5.6), vec2(-4.8, 3.2), 0.2, 0.08));                     // tail
  for (int k = 0; k < 4; k++) {
    float x = k < 2 ? 2.8 - float(k) * 1.1 : -2.4 - float(k - 2) * 1.1;
    float sw = 0.35 * sin(w + float(k) * 1.6);
    d = min(d, sdTaper(q, vec2(x, 4.0), vec2(x + sw, 0.0), 0.42, 0.25));
  }
  // the yoke pole and the plough behind
  d = min(d, sdSeg(q, vec2(3.4, 6.6), vec2(-8.5, 2.6), 0.13));
  d = min(d, sdSeg(q, vec2(-8.6, 2.8), vec2(-9.8, -0.2), 0.16));
  d = min(d, sdTri(q, vec2(-10.5, 0.2), vec2(-8.6, 0.2), vec2(-9.8, -0.8)));
  d = min(d, sdSeg(q, vec2(-8.9, 2.4), vec2(-10.4, 4.6), 0.11));                            // handles
  return d;
}
float sheafSD(vec2 p, vec2 c, float h) {
  vec2 q = (p - c) / h;
  // a bundle of stalks: flared at the foot, bound at the waist, the ears fanning out on top
  float foot = sdTri(q, vec2(-0.55, 0.0), vec2(0.55, 0.0), vec2(0.0, 1.6));
  float waist = sdBox2(q - vec2(0.0, 0.8), vec2(0.17, 0.5));
  float top = sdTri(q, vec2(0.0, 0.7), vec2(-0.75, 2.0), vec2(0.75, 2.0));
  top = min(top, sdEllipsoid(vec3(q - vec2(0.0, 2.0), 0.0), vec3(0.78, 0.38, 1.0)));
  float d = min(min(foot, waist), top);
  d += (vnoise(vec2(q.x * 14.0, q.y * 2.0) + c.x) - 0.5) * 0.08;
  return d * h;
}
float vineSD(vec2 p, vec2 c) {
  vec2 q = p - c;
  float d = sdBox2(q - vec2(0.0, 3.5), vec2(0.18, 3.5));
  d = min(d, sdEllipsoid(vec3(q - vec2(0.0, 6.5), 0.0), vec3(3.0, 1.6, 1.0)) + (vnoise(q * 1.5) - 0.5) * 0.6);
  return d;
}
float grapesSD(vec2 p, vec2 c) {
  vec2 q = p - c;
  float d = 1e3;
  for (int k = 0; k < 6; k++) { vec2 o = vec2(float(k % 3) * 0.32 - 0.32 + 0.16 * float(k / 3), -float(k / 3) * 0.3); d = min(d, sdCircle(q - o, 0.2)); }
  return d;
}
float oliveSD(vec2 p, vec2 c) {
  vec2 q = p - c;
  float d = sdTaper(q, vec2(0.0, 0.0), vec2(0.6, 5.0), 0.8, 0.4);
  d = min(d, sdTaper(q, vec2(0.5, 4.0), vec2(-1.5, 6.0), 0.4, 0.2));
  float cr = sdEllipsoid(vec3(q - vec2(0.4, 7.4), 0.0), vec3(4.6, 2.8, 1.0));
  cr = min(cr, sdEllipsoid(vec3(q - vec2(-2.3, 6.0), 0.0), vec3(2.2, 1.6, 1.0)));
  return min(d, cr + (vnoise(q * 1.8) - 0.5) * 0.7);
}
float nearGround(vec2 p) { return sdBelow(p, -12.2 + 0.7 * sin(p.x * 0.12) + 0.3 * sin(p.x * 0.5)); }
// what: 0 ground, 1 father, 2 son, 3 ox/plough, 4 sheaf, 5 vine, 6 grapes, 7 olive, 8 basket
float nearSD(vec2 p, float s, bool hq, out int what, out int part, out vec2 lp, out float shd) {
  what = 0; part = PT_NONE; lp = p; shd = 0.0;
  float d = nearGround(p);
  int pt; vec2 l; float sh;
  float fa = figure(p, father(s), pt, l, sh, hq);
  if (fa < 0.0) { what = 1; part = pt; lp = l; shd = sh; return fa; }
  float so = figure(p, son(s), pt, l, sh, hq);
  if (so < 0.0) { what = 2; part = pt; lp = l; shd = sh; return so; }
  d = min(d, min(fa, so));
  float e = 1e3; int w = 0;
  if (s < 0.5) { e = oxSD(p); w = 3; }
  else if (s < 1.5) {
    e = min(min(sheafSD(p, vec2(8.0, -12.0), 2.6), sheafSD(p, vec2(12.5, -12.0), 2.8)), min(sheafSD(p, vec2(16.5, -12.0), 2.5), sheafSD(p, vec2(-15.0, -12.0), 2.6)));
    w = 4;
  } else if (s < 2.5) {
    float g = min(grapesSD(p, vec2(6.0, -4.3)), min(grapesSD(p, vec2(8.4, -4.6)), grapesSD(p, vec2(13.6, -4.4))));
    if (g < 0.0) { what = 6; return g; }
    e = min(vineSD(p, vec2(7.0, -12.0)), vineSD(p, vec2(13.5, -12.0)));
    Fig b = son(s);
    float bk = sdBox2(p - (b.pos + vec2(2.2, 7.4) * b.scale), vec2(1.5, 1.0) * b.scale * 1.4);
    if (bk < 0.0) { what = 8; return bk; }
    e = min(e, min(bk, g));
    w = 5;
  } else { e = oliveSD(p, vec2(12.0, -12.2)); w = 7; }
  if (e < 0.0) { what = w; return e; }
  return min(d, e);
}
// ---- the fields ----
float fieldsSD(vec2 p, float s) {
  float y = -6.5 + 1.2 * sin(p.x * 0.08 + 1.0);
  float d = sdBelow(p, y);
  if (s > 0.5 && s < 1.5) {        // stooks along the field
    float c = floor(p.x / 3.2); vec2 q = vec2(p.x - (c + 0.5) * 3.2, p.y - y);
    d = min(d, sdTri(q, vec2(-0.8, -0.2), vec2(0.8, -0.2), vec2(0.0, 1.8)));
  } else if (s > 1.5 && s < 2.5) { // rows of vines on their stakes
    float c = floor(p.x / 2.6); vec2 q = vec2(p.x - (c + 0.5) * 2.6, p.y - y);
    d = min(d, min(sdBox2(q - vec2(0.0, 0.9), vec2(0.08, 0.9)), sdEllipsoid(vec3(q - vec2(0.0, 1.7), 0.0), vec3(1.1, 0.6, 1.0))));
  } else if (s > 2.5) {            // an olive grove
    float c = floor(p.x / 4.5); vec2 q = vec2(p.x - (c + 0.5) * 4.5, p.y - y);
    d = min(d, min(sdSeg(q, vec2(0.0, 0.0), vec2(0.1, 1.4), 0.2), sdEllipsoid(vec3(q - vec2(0.0, 2.2), 0.0), vec3(1.7, 1.1, 1.0))));
  }
  return d;
}
// ---- the far hills and the village ----
float villageSD(vec2 p) {
  float y = ridge(p.x, 1.0, 5.0, 0.03, 21.0);
  float d = sdBelow(p, y);
  vec2 q = p - vec2(-14.0, 0.0);
  float base = ridge(-14.0, 1.0, 5.0, 0.03, 21.0) - 0.6;
  for (int k = 0; k < 6; k++) {
    float fk = float(k);
    vec2 c = vec2(-6.0 + fk * 2.4, base + 0.6 * hash11(fk));
    float h = 1.2 + 0.9 * hash11(fk + 3.0);
    d = min(d, sdBox2(q - c - vec2(0.0, h * 0.5), vec2(0.9, h * 0.5)));
  }
  d = min(d, sdBox2(q - vec2(1.0, base + 2.6), vec2(0.7, 1.4)));   // a watchtower
  return d;
}
float sheetSD(int i, vec2 p, bool hq) {
  if (i == 0) {
    float x0 = uPageX - PW * 0.5, x1 = uPageX + PW * 0.5;
    float d = max(x0 - p.x, p.x - x1);
    d = max(d, abs(p.y + 4.0) - 32.0);
    return torn(d, p, 0.25, 80.0, hq);
  }
  if (i == 1) { int w, pt; vec2 lp; float sh; return torn(nearSD(p, seasonAt(p, 8.0), hq, w, pt, lp, sh), p, 0.06, 81.0, hq); }
  if (i == 2) return torn(fieldsSD(p, seasonAt(p, 20.0)), p, 0.15, 82.0, hq);
  if (i == 3) return torn(villageSD(p), p, 0.12, 83.0, hq);
  if (i == 4) {
    vec2 sp = sunPos(), mp = moonPos();
    float d = min(sdCircle(p - sp, 3.0), sdCircle(p - mp, 2.4) );
    d = max(d, -sdCircle(p - mp - vec2(1.2, 0.6), 2.1));   // the moon's crescent cut away
    d = min(d, min(sdBox2(p - vec2(sp.x, sp.y + 40.0), vec2(0.03, 37.0)), sdBox2(p - vec2(mp.x, mp.y + 40.0), vec2(0.03, 37.6))));
    return torn(d, p, 0.08, 84.0, hq);
  }
  if (i == 5) return hillSD(p, 3.0, 9.0, 0.02, 22.0, 0.4, hq);
  return -1.0;
}
vec3 seasonTone(float s, vec3 spring, vec3 summer, vec3 autumn, vec3 winter) { return s < 0.5 ? spring : (s < 1.5 ? summer : (s < 2.5 ? autumn : winter)); }
Mat sheetMat(int i, vec2 p, float sd) {
  if (i == 0) {
    // the back of the page: aged parchment, foxed, darker toward its edges
    float u = sat((p.x - (uPageX - PW * 0.5)) / PW);
    Mat m = mPaper(lin(vec3(0.74, 0.62, 0.45)));
    m.alb *= 0.75 + 0.3 * pulp(p * 0.8, 85.0);
    m.alb *= mix(1.0, 0.45, smoothstep(4.0, 22.0, p.y));   // darker up where the words sit
    m.alb *= 1.0 - 0.35 * smoothstep(0.55, 0.85, fbm(p * 0.25 + 4.0, 4));
    m.alb *= mix(0.55, 1.0, sin(3.14159 * u));
    // a painted border, ruled twice in faded red-brown ink, as on a page of the old book
    vec2 bq = vec2(abs(p.x - uPageX) - (PW * 0.5 - 2.0), abs(p.y + 4.0) - 30.0);
    float frame = max(bq.x, bq.y);
    m.alb = mix(m.alb, lin(vec3(0.36, 0.16, 0.1)), 0.7 * (smoothstep(0.12, 0.0, abs(frame)) + smoothstep(0.08, 0.0, abs(frame + 0.6))));
    m.trans = 0.15; m.tear = 0.6; m.seed = 85.0; return m;
  }
  if (i == 1) {
    float s = seasonAt(p, 8.0);
    int w, pt; vec2 lp; float sh;
    nearSD(p, s, true, w, pt, lp, sh);
    if (w == 1) return figMat(pt, lp, sh, father(s), lin(vec3(0.34, 0.29, 0.21)), lin(vec3(0.2, 0.16, 0.12)));
    if (w == 2) return figMat(pt, lp, sh, son(s), lin(vec3(0.42, 0.2, 0.11)), lin(vec3(0.12, 0.08, 0.05)));
    if (w == 3) { Mat m = mCard(lin(vec3(0.2, 0.14, 0.1))); m.alb *= 0.8 + 0.4 * brush(p, 0.1, 86.0); m.tear = 0.3; return m; }
    if (w == 4) { Mat m = mPaper(lin(vec3(0.66, 0.5, 0.24))); m.alb *= 0.6 + 0.6 * vnoise(vec2(p.x * 7.0, p.y * 0.5)); m.fuzz = 0.08; return m; }
    if (w == 5 || w == 7) { Mat m = mCard(lin(w == 5 ? vec3(0.16, 0.15, 0.09) : vec3(0.2, 0.22, 0.16))); m.alb *= 0.7 + 0.5 * vnoise(p * 3.0); m.tear = 0.5; m.fuzz = 0.04; return m; }
    if (w == 6) { Mat m = mPaper(lin(vec3(0.3, 0.06, 0.08))); m.kind = K_INK; m.tear = 0.0; m.fuzz = 0.0; return m; }
    if (w == 8) { Mat m = mCard(lin(vec3(0.38, 0.27, 0.15))); m.kind = K_WOOD; m.alb *= 0.8 + 0.3 * step(0.5, fract(p.y * 3.0)); return m; }
    vec3 c = seasonTone(s, vec3(0.2, 0.15, 0.1), vec3(0.3, 0.24, 0.13), vec3(0.22, 0.14, 0.1), vec3(0.18, 0.17, 0.14));
    Mat m = hillMat(p, lin(c), 81.0, 0.3);
    if (s < 0.5) m.alb *= 0.75 + 0.35 * step(0.5, fract(p.y * 1.4 + p.x * 0.05));   // the furrows
    return m;
  }
  if (i == 2) {
    float s = seasonAt(p, 20.0);
    vec3 c = seasonTone(s, vec3(0.3, 0.3, 0.2), vec3(0.55, 0.43, 0.22), vec3(0.3, 0.2, 0.15), vec3(0.28, 0.3, 0.24));
    Mat m = hillMat(p, lin(c), 82.0, 0.25);
    m.alb *= 0.8 + 0.3 * step(0.5, fract(p.y * 0.9 + 0.2 * sin(p.x * 0.1)));   // strips of field
    return m;
  }
  if (i == 3) {
    Mat m = hillMat(p, lin(vec3(0.24, 0.2, 0.17)), 83.0, 0.2);
    // lit windows in the village toward night
    vec2 q = p - vec2(-14.0, 0.0);
    vec2 wc = floor(q / vec2(0.8, 0.9));
    vec2 wq = q - (wc + 0.5) * vec2(0.8, 0.9);
    float win = step(0.55, hash12(wc + 3.0)) * step(abs(q.x - 0.0), 9.0) * step(p.y, 6.0) * step(ridge(p.x, 1.0, 5.0, 0.03, 21.0) + 0.3, p.y) * step(sdBox2(wq, vec2(0.13, 0.17)), 0.0);
    if (win > 0.5 && sd < -0.15) { m.alb *= 0.3; m.emit = vec3(1.6, 0.8, 0.28) * (1.0 - 0.7 * uDay); }
    return m;
  }
  if (i == 4) {
    vec2 sp = sunPos();
    if (length(p - sp) < 3.2) { Mat m = mFoil(lin(vec3(0.85, 0.62, 0.3)), true); m.emit = vec3(0.5, 0.3, 0.1); return m; }
    if (length(p - moonPos()) < 2.6) { Mat m = mPaper(lin(vec3(0.75, 0.74, 0.7))); m.tear = 0.6; m.trans = 0.7; return m; }
    return mCard(lin(vec3(0.45, 0.42, 0.38)));
  }
  if (i == 5) { Mat m = hillMat(p, lin(vec3(0.34, 0.3, 0.28)), 22.0, 0.0); m.trans = 0.45; return m; }
  if (i == 6) {
    Mat m = skyMat(p, 0.0, uDay, 23.0);
    m.alb *= mix(1.0, 0.4, smoothstep(8.0, 30.0, p.y));   // the top stays dark for the words
    return m;
  }
  return mGlow(mix(vec3(0.5, 0.6, 0.9), vec3(3.2, 2.3, 1.4), uDay));
}
` + PAPER_TRACE;

export default (P) => {
  const dur = P.to - P.from;
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / dur));
    return { pos: [mix(-3, 3, e), mix(-3, -2, e), mix(-40, -36, e)], target: [mix(-1, 1, e), mix(-3.5, -3, e), 40], fov: 38, roll: 0.0 };
  };
  return {
    name: 's33-eighty', from: P.from, to: P.to,
    frag: GLSL,
    uniforms: { ...EPH_UNIFORMS, uSea: [0, 0], uPageX: 1e4, uArm: 0, uDay: 1,
      uAper: 0.25, uFocus: 46, uFillSoft: 7, uAmb: L(96, 90, 92, 1.2), uFillDir: [0.3, 0.55, -0.75], uHaze: L(120, 105, 95, 0.3), uHazeD: 0.004, uDust: 1.0 },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      u.uStepT.value = s; u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      // which season, and where the page is
      let sea = 0, px = 1e4;
      TURNS.forEach((c, k) => {
        const a = c - SWEEP / 2, b = c + SWEEP / 2;
        if (s >= b) sea = k + 1;
        else if (s >= a) { const s2 = stepT(t + 1 / 240, 24); px = mix(52, -52, ease.inOut3(clamp01((s2 - a) / SWEEP))); sea = k; }
      });
      const turning = px < 1e3;
      u.uSea.value = turning ? [sea, sea + 1] : [sea, sea];
      u.uPageX.value = px;
      // the sun and moon arm turns twice round over the scene (by hand, on twos)
      const arm = -0.9 + ((s - P.from) / dur) * Math.PI * 3;
      u.uArm.value = arm;
      const sunY = -12 + 22 * Math.cos(arm), sunX = 22 * Math.sin(arm);
      const day = clamp01((sunY + 6) / 12);
      u.uDay.value = day;
      u.uFocus.value = mix(46, 42, ease.inOut3(clamp01((t - P.from) / dur)));
      u.uL.value = packLights([
        { pos: [sunX, sunY, 47], col: L(255, 205, 150, 10 * day), rad: 3, range: 30 },             // the sun, behind its paper disc
        { pos: [-sunX, -12 - 22 * Math.cos(arm), 47], col: L(170, 185, 230, 6 * (1 - day)), rad: 3, range: 30 },   // the moon
        { pos: [0, 30, 84], col: L(230, 220, 205, 6 + 6 * day), rad: 10, range: 70 },                // the sky's light box
        { pos: [-30, 14, -12], col: mix(L(185, 190, 225, 4.5), L(250, 200, 160, 6.5), day), rad: 6, range: 70 },  // key on the near land
        { pos: [20, 6, 14], col: L(255, 196, 150, 2.2 * (0.4 + 0.6 * day)), rad: 3, range: 26 },      // between the near land and the fields
      ]);
      u.uLN.value = 5;
    },
    post(t) { return grade(t, { exposure: 1.45, bloom: 0.18, threshold: 0.85, vignette: 0.6, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.012, 0.011, 0.013], highlights: [1.0, 0.93, 0.82], amount: 0.4 } }; },
  };
};
