// The antechamber outside Eglon's summer room, as a paper diorama: a soot-dark wall of plastered
// parchment, the fancy double door of tarnished gold foil with cut rosettes and pierced holes, a
// candle in a niche that burns down over the choruses, a lattice window whose light goes from moon
// to dawn, and the palace staff (up to five puppets: guards with spears, a servant with figs, a
// scribe) standing on the floor strip in front. Behind the door: the summer room (floor, empty
// throne, a fallen purple robe and the crown) seen only when the leaves swing open.
//
// Sheets: 0 foreground drape, 1 puppets and props, 2 floor, 3 wall, 4 door leaves, 5 niche and the
// room's furniture, 6 the room's back wall, 7 light box.
import { PAPER_HEAD, PAPER_TRACE, PAPER_UNIFORMS, packLights } from '/song/lib/paper.js';
import { PUPPET_GLSL, pose } from '/song/lib/puppet.js';

const Z12 = () => new Array(12).fill(0);
export const DOOR_UNIFORMS = {
  ...PAPER_UNIFORMS,
  uF0: Z12(), uF1: Z12(), uF2: Z12(), uF3: Z12(), uF4: Z12(),
  uTone: new Array(15).fill(0.2), uTone2: new Array(15).fill(0.1),
  uPA: new Array(25).fill(0), uPB: new Array(25).fill(0), uFH: new Array(20).fill(0), uOld: new Array(5).fill(0),
  uOpenL: 0, uOpenR: 0, uRattle: [0, 0], uCandle: 1, uFlame: 1, uDawn: 0, uRoom: 0,
  uCrown: [9, 0], uFigZ: 29, uDrape: 1, uValZ: 30, uValY: 1000, uCob: 0, uSky: [0.2, 0.25, 0.4],
};

export const DOOR_GLSL = PAPER_HEAD + PUPPET_GLSL + /* glsl */ `
uniform float uF0[12], uF1[12], uF2[12], uF3[12], uF4[12];
uniform float uTone[15], uTone2[15], uPA[25], uPB[25], uFH[20], uOld[5];
uniform float uValZ, uValY, uFigZ, uOpenL, uOpenR, uCandle, uFlame, uDawn, uRoom, uDrape, uCob;
uniform vec2 uRattle, uCrown;
uniform vec3 uSky;
#define NL 8
#define DX 6.0
#define DHW 10.0
#define FLOORY -13.5
#define ARCHY 9.0

// ---- the puppets: a copy of figure() that can leave the head off (for a replacement head) ----
float figureX(vec2 p, Fig f, out int part, out vec2 lp, out float shade, bool hq, bool head) {
  vec2 q = (p - f.pos) / f.scale;
  q.x *= f.face;
  float bnd = length((q - vec2(0.0, 10.5)) * vec2(1.6, 1.0)) - 13.0;
  if (bnd > 0.5) { part = PT_NONE; lp = q; shade = 0.0; return bnd * f.scale; }
  vec2 qw = jnt(q, vec2(0.0, 10.4), f.lean) + vec2(0.0, 10.4);
  vec2 hc = vec2(0.42, 17.6);
  vec2 qh = jnt(qw, vec2(0.4, 16.6), f.head) + vec2(0.4, 16.6) - hc;
  float wide = (f.style == 1.0 || f.style == 0.0) ? 1.0 : 0.4;
  float up, fo, ha; vec2 lu, lf, lh;
  fArm(qw, f.sh, f.el, wide, up, fo, ha, lu, lf, lh);
  float fup, ffo, fha; vec2 flu, flf, flh;
  fArm(qw - vec2(-0.3, 0.05), f.fsh, f.fel, wide, fup, ffo, fha, flu, flf, flh);
  float face = head ? min(fHead(qh, f), fNeck(qw)) : fNeck(qw);
  float hair = head ? fHair(qh, f) : 1e3;
  float beard = head ? fBeard(qh, f) : 1e3;
  float torso = fTorso(qw, f);
  float robe = fRobe(q, f);
  float mantle = fMantle(qw, f);
  float crown = head ? fCrown(qh, f) : 1e3, helm = head ? fHelm(qh, f) : 1e3;
  float nleg = 1e3, fleg = 1e3; vec2 lnl = q, lfl = q;
  if (tunicOf(f.style)) fLegs(q, f, nleg, fleg, lnl, lfl);
  float feet = tunicOf(f.style) ? 1e3 : min(sdEllipsoid(vec3(q - vec2(0.9 + f.sway * 0.6, 0.18), 0.0), vec3(0.75, 0.24, 1.0)), sdEllipsoid(vec3(q - vec2(-0.15 - f.sway * 0.4, 0.18), 0.0), vec3(0.7, 0.22, 1.0)));
  float pin = min(length(lu) - 0.12, length(lf) - 0.1);
  float nearArm = min(min(up, fo), ha);
  float farArm = min(min(fup, ffo), fha);
  float d = 1e3; part = PT_NONE; lp = q;
  float sc = f.scale;
  if (pin < 0.0 && nearArm < 0.0) { part = PT_PIN; lp = lu; shade = 0.0; return pin * sc; }
  if (ha < 0.0) { part = PT_HAND; lp = lh; shade = 0.0; return ha * sc; }
  if (fo < 0.0) { part = PT_FORE; lp = lf; shade = 0.0; return fo * sc; }
  if (up < 0.0) { part = PT_UPPER; lp = lu; shade = 0.0; return up * sc; }
  float sh0 = 0.0;
  if (hq) {
    float u2, f2, h2; vec2 a2, b2, c2;
    fArm(qw + vec2(0.14, -0.18), f.sh, f.el, wide, u2, f2, h2, a2, b2, c2);
    sh0 = smoothstep(0.35, -0.2, min(min(u2, f2), h2));
  }
  if (crown < 0.0) { part = PT_CROWN; lp = qh; shade = 0.0; return crown * sc; }
  if (helm < 0.0) { part = PT_HELM; lp = qh; shade = 0.0; return helm * sc; }
  if (beard < 0.0) { part = PT_BEARD; lp = qh; shade = sh0; return beard * sc; }
  if (hair < 0.0 && f.style != 0.0) { part = PT_HAIR; lp = qh; shade = sh0; return hair * sc; }
  if (face < 0.0) { part = PT_FACE; lp = qh; shade = sh0 + smoothstep(0.3, -0.1, hair + 0.15) * 0.6; return face * sc; }
  if (hair < 0.0) { part = PT_MANTLE; lp = qh; shade = sh0; return hair * sc; }
  float hs = smoothstep(0.35, -0.15, min(face, hair) + 0.25);
  if (mantle < 0.0) { part = PT_MANTLE; lp = qw; shade = max(sh0, hs * 0.5); return mantle * sc; }
  if (f.style == 4.0 && robe < 0.0) { part = PT_ROBE; lp = q; shade = sh0; return robe * sc; }
  if (torso < 0.0) { part = PT_TORSO; lp = qw; shade = max(sh0, hs * 0.7); return torso * sc; }
  if (robe < 0.0) { part = PT_ROBE; lp = q; shade = max(sh0, smoothstep(0.4, -0.2, torso + 0.15) * 0.5); return robe * sc; }
  if (feet < 0.0) { part = PT_FEET; lp = q; shade = 0.3; return feet * sc; }
  if (nleg < 0.0) { part = PT_LEG; lp = lnl; shade = smoothstep(0.4, -0.2, robe + 0.1) * 0.5; return nleg * sc; }
  if (fleg < 0.0) { part = PT_FARLEG; lp = lfl; shade = 0.55; return fleg * sc; }
  if (farArm < 0.0) { part = PT_FAR; lp = flu; shade = 0.55; return farArm * sc; }
  d = min(min(min(nearArm, farArm), min(face, hair)), min(min(min(torso, mantle), robe), min(beard, feet)));
  d = min(d, min(min(crown, helm), min(nleg, fleg)));
  shade = 0.0;
  return d * sc;
}

Fig figN(int k) {
  if (k == 0) return figAt(uF0);
  if (k == 1) return figAt(uF1);
  if (k == 2) return figAt(uF2);
  if (k == 3) return figAt(uF3);
  return figAt(uF4);
}

// a point in a prop's frame (anchor a, angle ang: +y of the prop is rot by ang; scale s)
vec2 propL(vec2 p, vec2 a, float ang, float s) { vec2 d = (p - a) / s; float c = cos(ang), sn = sin(ang); return vec2(c * d.x + sn * d.y, -sn * d.x + c * d.y); }

// a hand-held prop: 1 spear, 2 tray of figs, 3 great brass key, 4 clay lamp, 5 tablet, 6 a forearm and fist
// returns distance (prop units) and which piece: 1 wood, 2 bronze, 3 figs, 4 brass, 5 flame, 6 clay,
// 7 parchment, 8 sleeve, 9 skin, 10 leather
float propSD(int type, vec2 l, out int pk) {
  pk = 0;
  if (type == 1) {
    float sh = sdSeg(l, vec2(0.0, -8.0), vec2(0.0, 14.6), 0.17);
    float tip = sdTri(l, vec2(-0.5, 14.4), vec2(0.5, 14.4), vec2(0.0, 18.0));
    tip = smin(tip, sdEllipsoid(vec3(l - vec2(0.0, 15.5), 0.0), vec3(0.55, 1.3, 1.0)), 0.3);
    float sock = sdBox2(l - vec2(0.0, 14.1), vec2(0.26, 0.45));
    float bt = sdBox2(l - vec2(0.0, -8.0), vec2(0.22, 0.4));
    float b = min(min(tip, sock), bt);
    if (b < 0.0) { pk = 2; return b; }
    pk = 1; return min(sh, b);
  }
  if (type == 2) {
    float tr = sdBox2(l - vec2(0.0, 0.25), vec2(3.0, 0.22));
    tr = min(tr, sdBox2(l - vec2(-2.95, 0.5), vec2(0.14, 0.4)));
    tr = min(tr, sdBox2(l - vec2(2.95, 0.5), vec2(0.14, 0.4)));
    float fg = 1e3;
    for (int k = 0; k < 4; k++) fg = min(fg, sdEllipsoid(vec3(l - vec2(-1.95 + float(k) * 1.3, 1.0), 0.0), vec3(0.62, 0.58, 1.0)));
    for (int k = 0; k < 3; k++) fg = min(fg, sdEllipsoid(vec3(l - vec2(-1.3 + float(k) * 1.3, 1.95), 0.0), vec3(0.6, 0.56, 1.0)));
    fg = min(fg, sdEllipsoid(vec3(l - vec2(-0.6, 2.85), 0.0), vec3(0.58, 0.55, 1.0)));
    float leaf = sdEllipsoid(vec3(rot(0.6) * (l - vec2(1.4, 2.8)), 0.0), vec3(1.1, 0.35, 1.0));
    if (tr < 0.0) { pk = 1; return tr; }
    if (fg < 0.0) { pk = 3; return fg; }
    if (leaf < 0.0) { pk = 10; return leaf; }
    return min(min(tr, fg), leaf);
  }
  if (type == 3) {
    float sh = sdSeg(l, vec2(0.0, -6.0), vec2(0.0, 6.0), 0.42);
    float bow = abs(length(l - vec2(0.0, 8.0)) - 1.75) - 0.5;
    bow = min(bow, sdCircle(vec2(abs(l.x) - 1.9, l.y - 8.0), 0.55));
    bow = min(bow, sdCircle(l - vec2(0.0, 10.15), 0.55));
    float collar = sdBox2(l - vec2(0.0, 5.6), vec2(0.75, 0.25));
    float bit = sdBox2(l - vec2(1.15, -4.8), vec2(1.05, 1.2));
    bit = max(bit, -sdBox2(l - vec2(1.6, -4.8), vec2(0.35, 0.3)));
    bit = max(bit, -sdBox2(l - vec2(2.1, -4.1), vec2(0.3, 0.25)));
    float d = min(min(sh, bow), min(collar, bit));
    pk = 4; return d;
  }
  if (type == 4) {
    float body = sdEllipsoid(vec3(l - vec2(0.0, 0.5), 0.0), vec3(1.3, 0.55, 1.0));
    body = smin(body, sdTaper(l, vec2(0.6, 0.6), vec2(1.9, 0.85), 0.32, 0.22), 0.2);
    body = min(body, abs(length(l - vec2(-1.45, 0.75)) - 0.38) - 0.11);
    float fl = sdEllipsoid(vec3(l - vec2(1.95, 1.55), 0.0), vec3(0.22, 0.55 * uFlame, 1.0));
    if (fl < 0.0) { pk = 5; return fl; }
    pk = 6; return min(body, fl);
  }
  if (type == 5) {
    float tb = sdBox2(l - vec2(0.0, 1.0), vec2(1.5, 1.9));
    float st = sdSeg(l, vec2(1.2, 2.2), vec2(2.6, 4.2), 0.07);
    if (st < 0.0) { pk = 1; return st; }
    pk = 7; return min(tb, st);
  }
  if (type == 6) {
    // a guard's forearm reaching in from below, the fist at the origin (knuckles toward +y)
    float fist = sdBox2(l - vec2(0.0, -0.3), vec2(1.45, 1.1)) - 0.55;
    for (int k = 0; k < 4; k++) fist = smin(fist, sdCircle(l - vec2(-1.3 + float(k) * 0.86, 1.25 - 0.12 * abs(float(k) - 1.5)), 0.55), 0.18);
    float thumb = sdTaper(l, vec2(1.9, -1.4), vec2(0.6, -0.2), 0.55, 0.42);
    float wrist = sdTaper(l, vec2(0.0, -1.5), vec2(0.15, -3.6), 1.45, 1.7);
    float brac = sdTaper(l, vec2(0.15, -3.4), vec2(0.4, -8.0), 1.85, 2.05);
    float sleeve = sdTaper(l, vec2(0.4, -7.6), vec2(1.2, -30.0), 2.45, 3.3);
    if (thumb < 0.0) { pk = 13; return thumb; }
    if (fist < 0.0) { pk = 9; return fist; }
    if (brac < 0.0) { pk = 2; return brac; }
    if (wrist < 0.0) { pk = 9; return wrist; }
    if (sleeve < 0.0) { pk = 8; return sleeve; }
    return min(min(min(fist, thumb), wrist), min(brac, sleeve));
  }
  return 1e3;
}

// a replacement head that looks straight out at us: bronze helmet, small painted face, dark beard
float frontHead(vec2 l, out int pk) {
  float helm = sdEllipsoid(vec3(l - vec2(0.0, 0.62), 0.0), vec3(1.42, 1.25, 1.0));
  helm = max(helm, -(l.y - 0.32));
  helm = min(helm, sdBox2(l - vec2(0.0, 0.32), vec2(1.5, 0.12)));
  helm = min(helm, sdTaper(l, vec2(0.0, 1.5), vec2(0.0, 2.45), 0.32, 0.12));
  float nose = sdBox2(l - vec2(0.0, 0.0), vec2(0.09, 0.42));
  float cheek = sdTaper(l * vec2(sign(l.x), 1.0), vec2(1.18, 0.3), vec2(1.02, -0.75), 0.22, 0.14);
  helm = min(helm, cheek);
  float face = sdEllipsoid(vec3(l - vec2(0.0, -0.3), 0.0), vec3(1.05, 1.18, 1.0));
  float beard = max(sdEllipsoid(vec3(l - vec2(0.0, -0.8), 0.0), vec3(1.0, 0.85, 1.0)), -(l.y + 0.42 - 0.18 * abs(l.x)));
  beard = max(beard, -sdEllipsoid(vec3(l - vec2(0.0, -0.6), 0.0), vec3(0.32, 0.12, 1.0)));
  if (nose < 0.0 || helm < 0.0) { pk = 2; return min(nose, helm); }
  if (beard < 0.0) { pk = 11; return beard; }
  pk = 12; return min(min(helm, face), beard);
}

struct FH { int kind; int k; int pt; vec2 lp; float sh; int pk; };

// everything on the puppet sheet: returns the distance; h says what is there (or nearest)
float figs(vec2 p, bool hq, out FH h) {
  float dm = 1e3; h.kind = 0; h.k = 0; h.pt = 0; h.lp = p; h.sh = 0.0; h.pk = 0;
  float best = 1e3;
  for (int k = 0; k < 5; k++) {
    // replacement head
    if (uFH[k * 4] > 0.5) {
      float s = uFH[k * 4 + 3];
      vec2 l = (p - vec2(uFH[k * 4 + 1], uFH[k * 4 + 2])) / s;
      int pk; float d = frontHead(l, pk) * s;
      if (d < 0.0 && h.kind == 0) { h.kind = 4; h.k = k; h.lp = l; h.pk = pk; }
      if (d < best && h.kind == 0) { best = d; h.k = k; h.lp = l; h.pk = pk; h.pt = 4; }
      dm = min(dm, d);
    }
    // the prop in the near hand
    int ta = int(uPA[k * 5] + 0.5);
    if (ta > 0) {
      vec2 l = propL(p, vec2(uPA[k * 5 + 1], uPA[k * 5 + 2]), uPA[k * 5 + 3], uPA[k * 5 + 4]);
      int pk; float d = propSD(ta, l, pk) * uPA[k * 5 + 4];
      if (d < 0.0 && h.kind == 0) { h.kind = 2; h.k = k; h.lp = l; h.pk = pk; }
      if (d < best && h.kind == 0) { best = d; h.k = k; h.lp = l; h.pk = pk; h.pt = 2; }
      dm = min(dm, d);
    }
    Fig f = figN(k);
    if (f.scale > 0.01) {
      int pt; vec2 lp; float sh;
      float d = figureX(p, f, pt, lp, sh, hq, uFH[k * 4] < 0.5);
      if (d < 0.0 && h.kind == 0) { h.kind = 1; h.k = k; h.pt = pt; h.lp = lp; h.sh = sh; }
      if (d < best && h.kind == 0) { best = d; h.k = k; h.pt = pt; h.lp = lp; h.sh = sh; h.pk = -1; }
      dm = min(dm, d);
    }
    int tb = int(uPB[k * 5] + 0.5);
    if (tb > 0) {
      vec2 l = propL(p, vec2(uPB[k * 5 + 1], uPB[k * 5 + 2]), uPB[k * 5 + 3], uPB[k * 5 + 4]);
      int pk; float d = propSD(tb, l, pk) * uPB[k * 5 + 4];
      if (d < 0.0 && h.kind == 0) { h.kind = 3; h.k = k; h.lp = l; h.pk = pk; }
      if (d < best && h.kind == 0) { best = d; h.k = k; h.lp = l; h.pk = pk; h.pt = 3; }
      dm = min(dm, d);
    }
  }
  if (h.kind == 0) h.kind = -h.pt;   // outside: nearest element (negative kind)
  return dm;
}

Mat propMat(int pk, vec2 l, float seed) {
  Mat m;
  if (pk == 1) { m = mCard(lin(vec3(0.32, 0.22, 0.13))); m.kind = K_WOOD; m.alb *= 0.75 + 0.45 * vnoise(vec2(l.x * 9.0, l.y * 0.8) + seed); }
  else if (pk == 2) { m = mFoil(lin(vec3(0.62, 0.42, 0.22)), true); m.alb *= 1.0 - 0.55 * smoothstep(0.4, 0.8, fbm(l * 1.5 + seed, 3)); }
  else if (pk == 3) { m = mPaper(lin(vec3(0.26, 0.11, 0.17))); m.alb *= 0.7 + 0.5 * vnoise(l * 5.0); m.tear = 0.2; }
  else if (pk == 4) { m = mFoil(lin(vec3(0.8, 0.6, 0.3)), true); m.alb *= 1.0 - 0.5 * smoothstep(0.45, 0.8, fbm(l * 1.2 + 3.0, 3)); }
  else if (pk == 5) { m = mGlow(lin(vec3(1.0, 0.72, 0.35)) * 14.0); }
  else if (pk == 6) { m = mCard(lin(vec3(0.42, 0.26, 0.17))); m.alb *= 0.75 + 0.4 * vnoise(l * 6.0); }
  else if (pk == 7) { m = mPaper(lin(vec3(0.66, 0.6, 0.48))); m.alb *= 1.0 - 0.35 * step(0.5, fract(l.y * 2.2)) * step(abs(l.x), 1.1) * step(0.75, vnoise(l * vec2(3.0, 9.0))); m.tear = 0.5; }
  else if (pk == 8) { m = mPaper(lin(vec3(0.24, 0.2, 0.11))); m.kind = K_FABRIC; m.alb *= 0.7 + 0.35 * (0.5 + 0.5 * sin(l.x * 3.0 + 0.3 * l.y)); m.tear = 0.5; }
  else if (pk == 9 || pk == 13) {
    m = mPaper(lin(vec3(0.6, 0.45, 0.33))); m.tear = 0.0; m.fuzz = 0.0; m.trans = 0.35;
    if (pk == 9) {
      // the curled fingers seen from above: charcoal lines between them, knuckle bumps lit, the
      // back of the hand shaded toward the wrist
      float fx = (l.x + 1.73) / 0.86;
      float fl = abs(fract(fx) - 0.5);
      m.alb *= 1.0 - 0.7 * smoothstep(0.42, 0.5, fl) * step(-0.2, l.y) * step(l.x, 1.5) * step(-1.7, l.x);
      m.alb *= 1.0 + 0.25 * smoothstep(0.8, 1.4, l.y);
      m.alb *= 1.0 - 0.4 * smoothstep(0.0, -1.8, l.y);
      m.alb *= 0.9 + 0.2 * vnoise(l * 6.0);
    } else {
      m.alb *= 0.85;
      m.alb = mix(m.alb, lin(vec3(0.75, 0.62, 0.52)), 0.6 * smoothstep(0.25, 0.0, length(l - vec2(0.75, -0.3)) - 0.15));
    }
  }
  else if (pk == 11) { m = mPaper(lin(vec3(0.07, 0.055, 0.05))); m.alb *= 0.75 + 0.5 * pow(vnoise(vec2(l.x * 22.0, l.y * 3.0)), 2.0); }
  else if (pk == 12) {
    m = mPaper(lin(vec3(0.62, 0.48, 0.36))); m.tear = 0.0; m.fuzz = 0.0; m.trans = 0.35;
    vec2 e = vec2(abs(l.x) - 0.42, l.y - 0.02);
    float eye = length(e * vec2(1.0, 1.25)) - 0.1;
    float brow = sdSeg(vec2(abs(l.x), l.y), vec2(0.22, 0.27), vec2(0.62, 0.21), 0.035);
    m.alb *= 1.0 - 0.9 * smoothstep(0.02, -0.01, min(eye, brow));
    m.alb *= 1.0 - 0.3 * smoothstep(0.5, 1.1, abs(l.x));
  }
  else { m = mPaper(lin(vec3(0.24, 0.3, 0.12))); m.tear = 0.3; }
  m.seed = seed;
  return m;
}

// ---- the door: two leaves of gold foil, cut rosettes, pierced holes, a sunburst in the arch ----
// leaf-local coords: u from the hinge (0) to the meeting edge (DHW), y
float leafShape(vec2 l) {
  float d = sdBox2(l - vec2(DHW * 0.5, (FLOORY - 2.0 + ARCHY) * 0.5), vec2(DHW * 0.5, (ARCHY - FLOORY + 2.0) * 0.5));
  float arch = max(length(l - vec2(DHW, ARCHY)) - DHW, -l.x);
  arch = max(arch, l.x - DHW);
  arch = max(arch, ARCHY - l.y);
  return min(d, arch) + 0.03;
}
float rosette(vec2 q, float r) {
  float a = atan(q.y, q.x);
  return length(q) - r * (0.62 + 0.38 * abs(cos(a * 4.0)));
}
// the pattern: x = groove (0..1), y = pierced hole distance, z = boss (raised stud) 0..1
vec3 leafPattern(vec2 l) {
  float g = 0.0, hole = 1e3, boss = 0.0;
  // border groove
  float bd = abs(leafShape(l) + 0.65) - 0.06;
  g = max(g, smoothstep(0.06, 0.0, bd));
  // panels
  for (int k = 0; k < 2; k++) {
    vec2 c = vec2(DHW * 0.5, k == 0 ? -8.4 : 1.6);
    vec2 hb = vec2(3.3, 3.9);
    float pd = sdBox2(l - c, hb);
    g = max(g, smoothstep(0.07, 0.0, abs(pd) - 0.05));
    g = max(g, 0.7 * smoothstep(0.06, 0.0, abs(pd + 0.5) - 0.03));
    float ro = rosette(l - c, 2.5);
    g = max(g, smoothstep(0.08, 0.0, abs(ro) - 0.05));
    g = max(g, 0.8 * smoothstep(0.07, 0.0, abs(rosette(rot(0.39) * (l - c), 1.3)) - 0.04));
    hole = min(hole, length(l - c) - 0.32);
    for (int j = 0; j < 4; j++) {
      float a = float(j) * 1.5708 + 0.785;
      hole = min(hole, length(l - c - vec2(cos(a), sin(a)) * 1.85) - 0.13);
    }
    // studs on the panel's corners
    vec2 sq = abs(l - c) - hb + 0.55;
    boss = max(boss, smoothstep(0.32, 0.18, length(sq)));
  }
  // the arch: sunburst rays from the meeting point
  vec2 ac = l - vec2(DHW, ARCHY - 1.0);
  if (l.y > ARCHY - 1.0) {
    float a = atan(ac.y, -ac.x);
    float ray = abs(fract(a * 7.0 / 3.14159) - 0.5);
    float r = length(ac);
    g = max(g, smoothstep(0.05, 0.0, ray - 0.03) * step(2.0, r) * step(r, 8.6));
    hole = min(hole, max(ray * r * 0.3 - 0.05, abs(r - 6.6) - 1.0));
    g = max(g, smoothstep(0.06, 0.0, abs(r - 8.9) - 0.05));
  }
  // a row of studs between the panels
  vec2 sr = vec2(mod(l.x + 0.8, 1.6) - 0.8, l.y + 3.4);
  boss = max(boss, smoothstep(0.28, 0.16, length(sr)) * step(0.6, l.x) * step(l.x, DHW - 0.6));
  // the great ring handle near the meeting edge
  float ring = abs(length(l - vec2(DHW - 1.6, -3.4)) - 0.95) - 0.17;
  boss = max(boss, smoothstep(0.05, -0.05, ring));
  boss = max(boss, smoothstep(0.42, 0.3, length(l - vec2(DHW - 1.6, -2.3))));
  return vec3(g, hole, boss);
}
// which leaf a sheet point is on, and its leaf-local coords
vec2 leafLocal(vec2 p, out float side) {
  vec2 r = p - uRattle;
  if (r.x < DX) { side = -1.0; return vec2((r.x - (DX - DHW)) / max(cos(uOpenL), 0.05), r.y); }
  side = 1.0; return vec2(((DX + DHW) - r.x) / max(cos(uOpenR), 0.05), r.y);
}

// ---- the wall: doorway, niche, window ----
float doorway(vec2 p) {
  vec2 q = p - vec2(DX, 0.0);
  float d = sdBox2(q - vec2(0.0, (FLOORY + ARCHY) * 0.5 - 1.0), vec2(DHW, (ARCHY - FLOORY) * 0.5 + 1.0));
  float a = max(length(q - vec2(0.0, ARCHY)) - DHW, ARCHY - q.y);
  return min(d, a);
}
#define NICHE vec2(-27.0, -4.0)
float niche(vec2 p) { vec2 q = p - NICHE; return min(sdBox2(q, vec2(3.2, 4.2)), sdCircle(q - vec2(0.0, 4.2), 3.2)); }
#define WIN vec2(31.0, 0.5)
float windowSD(vec2 p) { vec2 q = p - WIN; return min(sdBox2(q, vec2(4.0, 6.0)), sdCircle(q - vec2(0.0, 6.0), 4.0)); }
float lattice(vec2 p) {
  vec2 q = rot(0.785) * (p - WIN) * 1.0;
  vec2 c = abs(fract(q / 1.6) - 0.5) * 1.6;
  return min(c.x, c.y) - 0.16;   // < 0 on the lattice bars
}

// ---- the candle in the niche: wax column with drips on a brass dish, a paper flame ----
float candleSD(vec2 p, out int pk) {
  vec2 q = p - vec2(NICHE.x, NICHE.y - 4.2);
  float h = 0.5 + 7.0 * uCandle;
  float dish = sdBox2(q - vec2(0.0, 0.2), vec2(1.7, 0.2));
  dish = min(dish, sdBox2(q - vec2(0.0, 0.55), vec2(0.6, 0.25)));
  float wax = sdBox2(q - vec2(0.0, 0.8 + h * 0.5), vec2(0.62, h * 0.5));
  wax = smin(wax, sdTaper(q, vec2(0.55, 0.8 + h - 0.2), vec2(0.62, 0.8 + h - 1.6 - 0.8 * hash11(floor(uCandle * 9.0))), 0.18, 0.12), 0.1);
  wax = smin(wax, sdTaper(q, vec2(-0.5, 0.8 + h - 0.1), vec2(-0.66, 0.8 + h * 0.4), 0.15, 0.2), 0.1);
  wax = min(wax, sdSeg(q, vec2(0.0, 0.8 + h), vec2(0.03, 0.8 + h + 0.4), 0.05));
  float fy = 0.8 + h + 0.4;
  vec2 fq = q - vec2(0.03 + 0.06 * sin(uTime * 9.0), fy);
  float fl = sdEllipsoid(vec3(fq - vec2(0.0, 0.55 * uFlame), 0.0), vec3(0.3, 0.75 * uFlame + 0.05, 1.0));
  fl = smin(fl, sdTri(fq, vec2(-0.2, 0.9 * uFlame), vec2(0.2, 0.9 * uFlame), vec2(0.04 * sin(uTime * 7.0), 1.75 * uFlame)), 0.15);
  if (uFlame < 0.02) fl = 1e3;
  if (fl < 0.0) { pk = 5; return fl; }
  if (dish < 0.0) { pk = 2; return dish; }
  pk = 7; return min(min(dish, wax), fl);
}

// ---- the room behind the door ----
float throneSD(vec2 p) {
  vec2 q = p - vec2(DX, FLOORY);
  q.x = abs(q.x);
  float d = sdBox2(q - vec2(0.0, 6.5), vec2(5.2, 1.0));                 // seat
  d = min(d, sdBox2(q - vec2(4.6, 3.3), vec2(0.55, 3.3)));             // legs
  d = min(d, sdBox2(q - vec2(0.0, 15.0), vec2(4.2, 8.0)));             // back
  d = min(d, sdCircle(q - vec2(0.0, 22.5), 4.2));
  d = min(d, sdBox2(q - vec2(5.3, 9.2), vec2(0.55, 1.9)));             // arms
  d = min(d, sdCircle(q - vec2(5.3, 11.3), 0.85));
  d = min(d, sdTri(q, vec2(-0.9, 26.0), vec2(0.9, 26.0), vec2(0.0, 28.6)));   // finial
  return d;
}
float robeSD(vec2 p) {
  // the edge of a heavy robe fallen in a heap on the floor, coming in from the right of the doorway
  vec2 q = p - vec2(DX + 3.5, FLOORY);
  float d = sdEllipsoid(vec3(q - vec2(5.5, 0.4), 0.0), vec3(6.5, 3.6, 1.0));
  d = smin(d, sdEllipsoid(vec3(q - vec2(1.2, 0.2), 0.0), vec3(2.6, 1.5, 1.0)), 1.0);
  d = smin(d, sdEllipsoid(vec3(q - vec2(8.5, 2.5), 0.0), vec3(3.0, 2.4, 1.0)), 1.0);
  d += 0.18 * sin(q.x * 2.2 + q.y * 0.8) * smoothstep(0.0, 2.0, q.y);
  d = max(d, -q.y + 0.05 * sin(q.x * 3.0));
  return d;
}
float crownSD(vec2 p) {
  vec2 q = rot(-uCrown.y) * (p - vec2(uCrown.x, FLOORY + 1.45));
  float d = sdBox2(q - vec2(0.0, -0.75), vec2(1.7, 0.5));
  for (int k = 0; k < 5; k++) { float x = -1.44 + float(k) * 0.72; d = min(d, sdTri(q, vec2(x - 0.3, -0.3), vec2(x + 0.3, -0.3), vec2(x, 1.0))); }
  d = min(d, sdCircle(q - vec2(-1.44, 1.05), 0.17));
  d = min(d, sdCircle(q - vec2(0.0, 1.05), 0.17));
  d = min(d, sdCircle(q - vec2(1.44, 1.05), 0.17));
  return d;
}

float sheetZ(int i, vec2 p) {
  if (i == 0) return uDrape > 1.5 ? uValZ : 4.0;
  if (i == 1) return uFigZ;
  if (i == 2) return 33.0 - max(0.0, FLOORY + 0.3 - p.y) * 1.1;
  if (i == 3) return 40.0;
  if (i == 4) {
    vec2 r = p - uRattle;
    if (r.x < DX) return 40.6 + max(r.x - (DX - DHW), 0.0) * tan(uOpenL);
    return 40.6 + max((DX + DHW) - r.x, 0.0) * tan(uOpenR);
  }
  if (i == 5) return p.x < -16.0 ? 43.0 : 54.0;
  if (i == 6) return p.x < -16.0 ? 45.5 : (uRoom < 0.5 ? 41.6 : 70.0);
  return 88.0;
}
float sheetOpac(int i) {
  if (i == 7) return 0.0;
  if (i == 0) return 0.95;
  return 1.0;
}
float sheetSD(int i, vec2 p, bool hq) {
  if (i == 0) {
    // a heavy drape hanging at the left edge of the set, torn at its hem
    if (uDrape < 0.5) return 1e3;
    if (uDrape > 1.5) {
      // a dark valance hanging across the top of a close shot, its hem torn
      float y = uValY + 0.25 * sin(p.x * 0.9) + 0.12 * sin(p.x * 2.3 + 1.0);
      return torn(y - p.y, p, 0.18, 22.0, hq);
    }
    float x = -54.0 + 3.0 * sin(p.y * 0.12) + 1.2 * sin(p.y * 0.41);
    float d = p.x - x;
    d = max(d, -p.y - 30.0);
    return torn(d, p, 0.5, 21.0, hq);
  }
  if (i == 1) { FH h; return figs(p, hq, h); }
  if (i == 2) return torn(sdBelow(p, FLOORY + 0.3 + 0.15 * sin(p.x * 0.3)), p, 0.12, 2.0, hq);
  if (i == 3) {
    float d = -1.0;
    d = max(d, -doorway(p));
    d = max(d, -niche(p));
    float w = windowSD(p);
    d = max(d, -max(w, -lattice(p)));
    return cut(d, p, 3.0);
  }
  if (i == 4) {
    float side; vec2 l = leafLocal(p, side);
    float d = leafShape(l);
    if (hq) d = max(d, -leafPattern(l).y);
    return cut(d, p, 4.0);
  }
  if (i == 5) {
    if (p.x < -16.0) {
      // the niche's back and its candle
      int pk; return candleSD(p, pk);
    }
    if (uRoom < 0.5) return 1e3;
    float d = sdBelow(p, FLOORY + 0.4);
    d = min(d, throneSD(p));
    d = min(d, robeSD(p));
    d = min(d, crownSD(p));
    d = max(d, p.x - 23.0);
    return d;
  }
  if (i == 6) {
    if (p.x < -16.0) return sdBox2(p - NICHE - vec2(0.0, 1.0), vec2(5.0, 7.5));
    if (uRoom < 0.5) return sdBox2(p - vec2(DX, 2.0), vec2(DHW + 6.0, 22.0));
    float d = p.x - 23.0;
    // two lattice windows in the summer room's back wall
    for (int k = 0; k < 2; k++) {
      vec2 c = vec2(k == 0 ? -9.5 : 19.5, -2.0);
      float w = min(sdBox2(p - c, vec2(2.6, 5.5)), sdCircle(p - c - vec2(0.0, 5.5), 2.6));
      vec2 lq = rot(0.785) * (p - c);
      vec2 cc = abs(fract(lq / 1.3) - 0.5) * 1.3;
      float bars = min(cc.x, cc.y) - 0.13;
      d = max(d, -max(w, -bars));
    }
    return d;
  }
  return -1.0;
}

Mat sheetMat(int i, vec2 p, float sd) {
  if (i == 0) {
    Mat m = mPaper(lin(vec3(0.12, 0.05, 0.06)));
    m.kind = K_FABRIC; m.trans = 0.25; m.fuzz = 0.12; m.seed = 21.0;
    if (uDrape > 1.5) { m = mCard(lin(vec3(0.16, 0.07, 0.07))); m.tear = 0.5; m.fuzz = 0.05; m.seed = 22.0; m.alb *= 0.5 + 0.7 * (0.5 + 0.5 * sin(p.x * 1.4 + 0.6 * sin(p.y * 0.7))); return m; }
    m.alb *= 0.6 + 0.5 * (0.5 + 0.5 * sin(p.x * 1.1 + 2.0 * sin(p.y * 0.05)));
    return m;
  }
  if (i == 1) {
    FH h; figs(p, true, h);
    int kind = h.kind < 0 ? -h.kind : h.kind;
    int k = h.k;
    if (kind == 4) return propMat(h.pk, h.lp, 40.0 + float(k));
    if (kind == 2 || kind == 3) return propMat(h.pk < 1 ? 1 : h.pk, h.lp, 30.0 + float(k));
    Fig f = figN(k);
    if (h.pk == 0 && kind != 1) { int pt; vec2 lp; float sh; figureX(p, f, pt, lp, sh, true, uFH[k * 4] < 0.5); h.pt = pt; h.lp = lp; h.sh = sh; }
    vec3 t1 = vec3(uTone[k * 3], uTone[k * 3 + 1], uTone[k * 3 + 2]);
    vec3 t2 = vec3(uTone2[k * 3], uTone2[k * 3 + 1], uTone2[k * 3 + 2]);
    Mat m = figMat(h.pt, h.lp, h.sh, f, t1, t2);
    if (h.pt == PT_HELM) {
      // hammered bronze: dull card with dents and a worn bright rim, not glitter
      m = mCard(lin(vec3(0.5, 0.34, 0.18)));
      m.alb *= 0.75 + 0.4 * vnoise(h.lp * 4.0);
      m.alb *= 1.0 - 0.5 * smoothstep(0.5, 0.8, fbm(h.lp * 2.0, 3));
      if (h.lp.y < 0.3 || (h.lp.y > 1.1 && h.lp.x > -0.7 && h.lp.x < 0.5 && h.lp.y > 1.2 + 0.3 * (h.lp.x + 0.6))) m.alb = lin(vec3(0.16, 0.1, 0.07));
      m.seed = f.seed + 14.0;
    }
    if (uOld[k] > 0.5 && (h.pt == PT_BEARD || h.pt == PT_HAIR)) m.alb = lin(vec3(0.62, 0.6, 0.56)) * (0.75 + 0.5 * pow(vnoise(vec2(h.lp.x * 3.0, h.lp.y * 22.0)), 2.0));
    return m;
  }
  if (i == 2) {
    // floor: worn flagstones of grey card, charcoal joints, soot
    Mat m = mCard(lin(vec3(0.6, 0.52, 0.42)));
    float j = abs(fract(p.x / 6.0 + 0.3 * floor(p.y / 2.0)) - 0.5);
    m.alb *= 1.0 - 0.5 * smoothstep(0.03, 0.0, j - 0.47);
    m.alb *= 0.7 + 0.45 * fbm(p * 0.6, 3);
    m.seed = 2.0; m.tear = 0.5;
    return m;
  }
  if (i == 3) {
    // plastered parchment, painted stone courses, soot climbing to a black ceiling
    Mat m = mPaper(lin(vec3(0.4, 0.33, 0.25)));
    float yy = p.y + 0.5 * vnoise(p * 0.3);
    float row = floor(yy / 4.6);
    float bw = 5.0 + 4.0 * hash11(row * 3.7);
    float xx = p.x + bw * hash11(row + 0.5) + 0.4 * vnoise(p * 0.5 + 3.0);
    float bx = abs(fract(xx / bw) - 0.5) * bw;
    float by = abs(fract(yy / 4.6) - 0.5) * 4.6;
    float joint = smoothstep(0.16, 0.0, min(bw * 0.5 - bx, 2.3 - by) - 0.05 * vnoise(p * 4.0));
    float stone = hash12(vec2(floor(xx / bw), row));
    m.alb *= 0.8 + 0.35 * stone;
    m.alb *= 1.0 - 0.5 * joint;
    m.alb *= 0.7 + 0.45 * brush(p * 0.4, 0.1, 3.0);
    // torn patches of a paler plaster pasted over the stones
    float ptch = fbm(p * 0.07 + 11.0, 3);
    m.alb = mix(m.alb, lin(vec3(0.46, 0.4, 0.31)) * (0.8 + 0.3 * pulp(p, 3.0)), smoothstep(0.58, 0.6, ptch + 0.04 * vnoise(p * 3.0)) * 0.85);
    m.alb *= 1.0 - 0.35 * hatch(p * 0.7, 0.35 * smoothstep(0.0, 30.0, p.y), 1.6);
    // soot over the niche and up the wall; the ceiling darkness
    m.alb *= 1.0 - 0.6 * smoothstep(9.0, 0.0, length((p - NICHE - vec2(0.0, 11.0)) * vec2(1.4, 0.6)));
    m.alb *= mix(1.0, 0.12, smoothstep(14.0, 32.0, p.y));
    // a gold-foil moulding around the doorway
    float mould = abs(doorway(p) - 0.9) - 0.75;
    if (mould < 0.0) {
      Mat g = mFoil(lin(vec3(0.78, 0.58, 0.28)), true);
      g.alb *= 1.0 - 0.6 * smoothstep(0.5, 0.85, fbm(p * 0.7, 3));
      g.alb *= 1.0 - 0.6 * smoothstep(0.08, 0.0, abs(mould + 0.75) - 0.05);
      g.seed = 33.0;
      return g;
    }
    // the niche's lip
    float nl = abs(niche(p) - 0.45) - 0.4;
    m.alb *= 1.0 + 0.4 * smoothstep(0.1, -0.1, nl);
    // the window's frame of dark wood
    float wf = windowSD(p);
    if (wf < 0.6) { m = mCard(lin(vec3(0.16, 0.11, 0.07))); m.kind = K_WOOD; m.alb *= 0.7 + 0.5 * vnoise(vec2(p.x * 0.8, p.y * 7.0)); }
    // cobwebs: thread in the corners of the doorway, years later
    if (uCob > 0.0) {
      vec2 c = p - vec2(DX - DHW - 1.0, 17.0);
      float a = atan(c.y, c.x), r = length(c);
      float web = smoothstep(0.05, 0.0, abs(fract(a * 3.0) - 0.5) * r * 0.5) + smoothstep(0.05, 0.0, abs(fract(r * 0.8) - 0.5) * 1.2);
      m.alb = mix(m.alb, vec3(0.5, 0.48, 0.44), uCob * 0.5 * web * smoothstep(6.0, 1.0, r));
    }
    m.seed = 3.0; m.tear = 0.0; m.trans = 0.15;
    return m;
  }
  if (i == 4) {
    float side; vec2 l = leafLocal(p, side);
    vec3 pt = leafPattern(l);
    // gilded card: a smooth tarnished gold field; the relief (rosettes, studs, ring) is crinkled
    // foil that catches the light; grooves inked dark
    float relief = max(pt.z, smoothstep(0.2, 0.6, pt.x) * 0.0);
    Mat m = mCard(lin(vec3(0.66, 0.5, 0.24)));
    m.alb *= 0.8 + 0.3 * brush(l * 0.6, 1.57, side * 3.0);
    m.alb *= 1.0 - 0.4 * smoothstep(0.5, 0.8, fbm(l * 0.35 + side * 7.0, 3));
    m.alb = mix(m.alb, lin(vec3(0.25, 0.3, 0.22)), 0.2 * smoothstep(0.62, 0.85, fbm(l * 0.9 + 4.0, 3)));
    if (pt.z > 0.5 || fract(rosette(vec2(mod(l.x, DHW), l.y) - vec2(DHW * 0.5, l.y < -3.4 ? -8.4 : 1.6), 2.5) * 0.0) > 1.0) { m = mFoil(lin(vec3(0.9, 0.7, 0.34)), true); }
    // inside the rosettes the leaf is raised foil too
    vec2 rc = l - vec2(DHW * 0.5, l.y < -3.4 ? -8.4 : 1.6);
    float ro = rosette(rc, 2.5);
    if (ro < 0.0 && ro > -1.2) { m = mFoil(lin(vec3(0.85, 0.64, 0.3)), true); m.alb *= 1.0 - 0.4 * smoothstep(0.5, 0.8, fbm(l * 0.8, 3)); }
    // the panel frames and the leaf border are strips of foil
    float fr = 1e3;
    for (int k = 0; k < 2; k++) { vec2 c = vec2(DHW * 0.5, k == 0 ? -8.4 : 1.6); fr = min(fr, abs(sdBox2(l - c, vec2(3.3, 3.9)) + 0.25) - 0.22); }
    fr = min(fr, abs(leafShape(l) + 0.35) - 0.28);
    if (fr < 0.0) { m = mFoil(lin(vec3(0.85, 0.65, 0.3)), true); m.alb *= 1.0 - 0.45 * smoothstep(0.5, 0.8, fbm(l * 0.9 + 2.0, 3)); }
    m.alb *= 1.0 - 0.85 * pt.x;
    // the seam between the leaves is black
    m.alb *= smoothstep(0.0, 0.25, DHW - l.x);
    if (uCob > 0.0) m.alb *= 0.65;
    m.seed = 4.0 + side; m.tear = 0.0;
    return m;
  }
  if (i == 5) {
    if (p.x < -16.0) {
      int pk; candleSD(p, pk);
      if (pk == 5) return mGlow(lin(vec3(1.0, 0.7, 0.32)) * 16.0 * uFlame);
      if (pk == 2) { Mat m = mFoil(lin(vec3(0.6, 0.42, 0.2)), true); m.seed = 55.0; return m; }
      Mat m = mPaper(lin(vec3(0.62, 0.54, 0.4)));
      m.kind = K_PAPER; m.trans = 0.5; m.tear = 0.0; m.fuzz = 0.0; m.seed = 56.0;
      m.alb *= 0.85 + 0.2 * vnoise(p * vec2(3.0, 0.8));
      return m;
    }
    if (crownSD(p) < 0.02) { Mat m = mFoil(lin(vec3(0.9, 0.7, 0.32)), true); m.alb *= 0.8 + 0.3 * step(0.0, sin(p.x * 6.0)); m.seed = 51.0; return m; }
    if (robeSD(p) < 0.02) {
      vec2 q = p - vec2(DX + 3.5, FLOORY);
      Mat m = mPaper(lin(vec3(0.16, 0.07, 0.14)));
      m.kind = K_FABRIC; m.tear = 0.6; m.fuzz = 0.06; m.trans = 0.2;
      float fold = 0.5 + 0.5 * sin(q.x * 2.2 + q.y * 0.8 + 1.5 * sin(q.y * 1.3));
      m.alb *= 0.7 + 1.3 * fold * fold;
      m.alb *= 0.8 + 0.3 * vnoise(q * vec2(1.0, 8.0));
      float hem = smoothstep(0.1, 0.0, abs(robeSD(p) + 0.35) - 0.18);
      if (hem > 0.0) m.alb = mix(m.alb, lin(vec3(0.78, 0.58, 0.28)) * 0.7, hem * 0.8);
      m.seed = 52.0; return m;
    }
    if (throneSD(p) < 0.02) {
      vec2 q = p - vec2(DX, FLOORY);
      Mat m = mCard(lin(vec3(0.36, 0.25, 0.15)));
      m.kind = K_WOOD; m.alb *= 0.7 + 0.45 * vnoise(vec2(q.x * 0.6, q.y * 5.0));
      float inner = throneSD(p) + 0.7;
      float disc = abs(length(q - vec2(0.0, 19.0)) - 2.4) - 0.3;
      float rays = max(abs(fract(atan(q.y - 19.0, q.x) * 1.91) - 0.5) - 0.12, abs(length(q - vec2(0.0, 19.0)) - 3.6) - 0.8);
      if ((inner < 0.0 && inner > -0.3) || disc < 0.0 || rays < 0.0 || length(q - vec2(0.0, 19.0)) < 1.2) { Mat g = mFoil(lin(vec3(0.8, 0.6, 0.28)), true); g.alb *= 1.0 - 0.5 * smoothstep(0.5, 0.8, fbm(q, 3)); g.seed = 53.0; return g; }
      m.alb *= 1.0 - 0.5 * hatch(q * 0.8, 0.4, 1.5) * smoothstep(20.0, 4.0, q.y);
      m.seed = 53.0; return m;
    }
    Mat m = mCard(lin(vec3(0.42, 0.36, 0.3)));
    m.alb *= 0.7 + 0.5 * fbm(p * 0.5, 3);
    m.alb *= 1.0 - 0.5 * smoothstep(0.03, 0.0, abs(fract(p.x / 5.0 + 0.2 * floor(p.y)) - 0.5) - 0.47);
    m.alb *= mix(1.0, 0.25, smoothstep(-13.0, 4.0, p.y));
    m.seed = 54.0;
    return m;
  }
  if (i == 6) {
    if (p.x < -16.0) {
      vec2 q = p - NICHE;
      Mat m = mPaper(lin(vec3(0.42, 0.33, 0.24)));
      m.alb *= 0.7 + 0.4 * brush(q, 1.4, 5.0);
      m.alb *= 1.0 - 0.5 * smoothstep(1.0, 7.0, q.y) * smoothstep(2.5, 0.0, abs(q.x));
      m.seed = 5.0; m.tear = 0.0;
      return m;
    }
    Mat m = mPaper(lin(vec3(0.3, 0.26, 0.22)));
    m.alb *= 0.65 + 0.45 * brush(p * 0.5, 0.2, 6.0);
    m.alb *= mix(1.0, 0.2, smoothstep(8.0, 26.0, p.y));
    m.seed = 6.0; m.tear = 0.0; m.trans = 0.2;
    return m;
  }
  // light box: the sky beyond the windows (moon to dawn)
  return mGlow(uSky * (0.8 + 0.3 * smoothstep(-10.0, 20.0, p.y)));
}

// the candle in the niche: wax and flame live on sheet 5 (drawn there through the material)
` + PAPER_TRACE;

// ---------------- JavaScript side ----------------
const R = (a, [x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];

// forward kinematics of a pose (the same joints as puppet.js): world positions of the hands and head
export function fk(P) {
  const o = { x: 0, y: 0, scale: 1, face: 1, lean: 0, head: 0, sh: 0.2, el: -0.3, fsh: -0.1, fel: -0.2, ...P };
  const c = [0, 10.4];
  const toWorld = (qw) => { const q = add(c, R(-o.lean, sub(qw, c))); return [o.x + o.scale * q[0] * o.face, o.y + o.scale * q[1]]; };
  const s = [0.3, 15.1], fs = [0.0, 15.15];
  const hand = (sh, el, s0) => toWorld(add(s0, R(-sh, add([0, -3.4], R(-el, [0, -3.6])))));
  const dir = (sh, el) => { const d = R(-o.lean, R(-sh - el, [0, -1])); return [d[0] * o.face, d[1]]; };
  const pv = [0.4, 16.6], hc = [0.42, 17.6];
  return {
    hand: hand(o.sh, o.el, s), far: hand(o.fsh, o.fel, fs),
    handDir: dir(o.sh, o.el), farDir: dir(o.fsh, o.fel),
    head: toWorld(add(pv, R(-o.head, sub(hc, pv)))),
  };
}

// a little stop-motion wobble per step
export const jit = (step, seed, amt) => (Math.sin(step * 12.9898 + seed * 78.233) * 43758.5453 % 1) * amt;

export const TONES = {
  guard: [[0.3, 0.26, 0.14], [0.12, 0.08, 0.05]],
  guard2: [[0.27, 0.25, 0.13], [0.12, 0.08, 0.05]],
  guard3: [[0.32, 0.24, 0.14], [0.12, 0.08, 0.05]],
  servant: [[0.5, 0.43, 0.32], [0.24, 0.12, 0.08]],
  scribe: [[0.18, 0.18, 0.2], [0.36, 0.32, 0.26]],
};
const lin = (c) => c.map((v) => Math.pow(v, 2.2));

// Put up to five puppets in the uniforms. Each: { pose, tone:[c1,c2], a:{type, at?, ang, s}, b:{...},
// front: bool (replacement head looking at us), old: bool }
// A prop's `at` defaults to the near hand (a) or the far hand (b).
export function setFigs(u, list) {
  const F = [u.uF0, u.uF1, u.uF2, u.uF3, u.uF4];
  const tone = [], tone2 = [], pa = [], pb = [], fh = [], old = [];
  for (let k = 0; k < 5; k++) {
    const f = list[k];
    if (!f) { F[k].value = new Array(12).fill(0); tone.push(0, 0, 0); tone2.push(0, 0, 0); pa.push(0, 0, 0, 0, 0); pb.push(0, 0, 0, 0, 0); fh.push(0, 0, 0, 0); old.push(0); continue; }
    if (f.pose) F[k].value = pose(f.pose); else F[k].value = new Array(12).fill(0);
    const t = f.tone ?? TONES.guard;
    tone.push(...lin(t[0])); tone2.push(...lin(t[1]));
    const K = f.pose ? fk(f.pose) : null;
    const s = f.pose?.scale ?? 1;
    const prop = (pr, def) => {
      if (!pr) return [0, 0, 0, 0, 0];
      const at = pr.at ?? def;
      return [pr.type, at[0], at[1], pr.ang ?? 0, pr.s ?? s];
    };
    pa.push(...prop(f.a, K?.hand)); pb.push(...prop(f.b, K?.far));
    fh.push(f.front ? 1 : 0, K ? K.head[0] : 0, K ? K.head[1] : 0, s);
    old.push(f.old ? 1 : 0);
  }
  u.uTone.value = tone; u.uTone2.value = tone2; u.uPA.value = pa; u.uPB.value = pb; u.uFH.value = fh; u.uOld.value = old;
}

// The antechamber's lights: the candle in its niche, the window (moon to dawn), a low fill, and up
// to three extra lights (the room, a lamp). candle 0..1 height, dawn 0..1.
export function doorLights(t, u, { candle = 1, dawn = 0, flick = 1, extra = [], candleK = 1, winK = 1, fillK = 1 } = {}) {
  const f = (s) => 0.95 + 0.08 * Math.sin(t * 13.1 + s) + 0.05 * Math.sin(t * 23.7 + s * 2.1) + 0.04 * Math.sin(t * 7.3 + s * 0.7);
  const cy = -8.2 + 7.0 * candle + 1.6;
  const mixc = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  const moon = [150, 175, 230], sun = [255, 196, 150];
  const wc = mixc(moon, sun, dawn).map((v) => Math.pow(v / 255, 2.2));
  const wk = (2.2 + 1.0 * dawn) * winK;
  const L = [
    { pos: [-27, cy, 42.2], col: [1.0, 0.55, 0.22].map((v) => v * 8 * flick * f(1) * candleK), rad: 0.5, range: 6 },
    { pos: [-26, cy + 0.5, 31.5], col: [1.0, 0.52, 0.2].map((v) => v * 1.25 * flick * f(1) * candleK), rad: 1.2, range: 22 },
    { pos: [31, 2, 36.0], col: wc.map((v) => v * wk * 2.6), rad: 2.5, range: 22, shaft: true },
    { pos: [-10, 10, 8], col: [1.0, 0.62, 0.32].map((v) => v * 1.1 * flick * candleK * fillK), rad: 6, range: 40 },
    { dir: [-0.35, 0.35, -0.87], col: [0.6, 0.62, 0.72].map((v) => v * 0.1 * fillK), rad: 4 },
  ];
  const all = [...L, ...extra].slice(0, 6);
  u.uL.value = packLights(all); u.uLN.value = all.length;
}
export const skyCol = (dawn) => {
  const a = [0.05, 0.08, 0.16], b = [0.85, 0.52, 0.32];
  return a.map((v, i) => (v + (b[i] - v) * dawn) * (1.3 + 0.6 * dawn));
};
