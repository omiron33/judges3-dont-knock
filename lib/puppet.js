// Articulated papercraft figures: people cut from card, cloth and parchment, joined at shoulder,
// elbow, neck and waist with small brass brads, and moved a step at a time like stop-motion puppets.
// Each figure is drawn in profile on one sheet of the diorama. The parts overlap in a fixed order
// (near arm, head, torso, robe, far arm) and each casts a small soft shadow on the parts beneath it.
//
// A figure's pose is 12 floats (see pose() below): position, scale, facing, waist lean, head tilt,
// near shoulder and elbow, far shoulder and elbow, robe sway, style and a seed.
// Styles: 0 a woman in a long robe and veil, 1 an old man with a long beard and mantle, 2 a young man
// in a knee-length tunic with a short beard (legs show; sway is his stride), 3 a woman with her hair
// bound, 4 a rotund king in a heavy robe with a gold crown, 5 a guard in a short tunic and bronze
// helmet (legs show; sway is his stride).

export const PUPPET_GLSL = /* glsl */ `
// part ids
#define PT_NONE 0
#define PT_HAND 1
#define PT_FORE 2
#define PT_UPPER 3
#define PT_FACE 4
#define PT_HAIR 5
#define PT_BEARD 6
#define PT_TORSO 7
#define PT_ROBE 8
#define PT_FAR 9
#define PT_FEET 10
#define PT_PIN 11
#define PT_MANTLE 12
#define PT_CROWN 13
#define PT_HELM 14
#define PT_LEG 15
#define PT_FARLEG 16

bool tunicOf(float st) { return st == 2.0 || st == 5.0; }
struct Fig { vec2 pos; float scale, face, lean, head, sh, el, fsh, fel, sway, style, seed; };
Fig figAt(float a[12]) { Fig f; f.pos = vec2(a[0], a[1]); f.scale = a[2]; f.face = a[3]; f.lean = a[4]; f.head = a[5]; f.sh = a[6]; f.el = a[7]; f.fsh = a[8]; f.fel = a[9]; f.sway = a[10]; f.style = a[11]; f.seed = a[0] * 0.37 + a[11]; return f; }

// a point in a child frame: translate to the joint, rotate by the angle
vec2 jnt(vec2 p, vec2 j, float a) { return rot(-a) * (p - j); }

// the figure's parts in figure space (feet at the origin, facing +x, about 20 units tall: long and
// slender like a shadow-theatre figure)
float fRobe(vec2 q, Fig f) {
  // a long robe, wider at the hem, the hem swaying a little with the step
  float y = q.y;
  if (tunicOf(f.style)) {
    // a knee-length tunic, belted
    float k = sat((10.6 - y) / 5.7);
    float half_ = mix(1.05, 1.75, k);
    float d = abs(q.x - 0.1 - f.sway * 0.4 * k) - half_;
    d = max(d, y - 10.8);
    return max(d, -y + 4.9 + 0.12 * sin(q.x * 3.0 + f.seed) + 0.08 * vnoise(q * 4.0));
  }
  if (f.style == 4.0) {
    // the king: one great bell of robe from the shoulders, swelling over his girth
    float d = sdEllipsoid(vec3(q - vec2(0.7, 10.6), 0.0), vec3(3.3, 4.6, 1.0));
    float k2 = sat((10.0 - y) / 9.8);
    float sk = abs(q.x - 0.5 - f.sway * k2) - mix(2.9, 3.3, k2);
    sk = max(sk, y - 10.0);
    d = smin(d, sk, 0.6);
    d = min(d, sdTaper(q, vec2(0.2, 15.4), vec2(0.5, 12.0), 1.1, 2.4));
    return max(d, -y + 0.3 + 0.16 * sin(q.x * 3.0 + f.seed) + 0.1 * vnoise(q * 4.0));
  }
  float k = sat((10.4 - y) / 10.2);
  float half_ = mix(1.05, 2.25, k * k * 0.55 + k * 0.45);
  float cx = f.sway * k * k * 0.9 + 0.12 * k;
  float d = abs(q.x - cx) - half_;
  d = max(d, y - 10.6);
  d = max(d, -y + 0.3 + 0.16 * sin(q.x * 3.0 + f.seed) + 0.1 * vnoise(q * 4.0));
  return d;
}
// the mantle: an outer layer over the shoulders and down the back
float fMantle(vec2 q, Fig f) {
  if (tunicOf(f.style) || f.style == 4.0) return 1e3;
  float len = f.style == 1.0 ? 3.0 : 4.2;
  float d = sdTaper(q, vec2(-0.25, 15.6), vec2(-0.75 - f.sway * 0.4, len), 1.0, 1.9);
  d = max(d, q.x - 0.55 - 0.08 * (15.6 - q.y));
  return d;
}
float fTorso(vec2 q, Fig f) {
  float d = sdTaper(q, vec2(0.05, 10.2), vec2(0.15, 15.4), 1.0, 1.15);
  if (f.style == 0.0 || f.style == 3.0) d = smin(d, sdCircle(q - vec2(0.75, 13.9), 0.55), 0.3);
  return d;
}
float fNeck(vec2 q) { return sdSeg(q, vec2(0.25, 15.6), vec2(0.4, 16.6), 0.3); }
// the head in profile: skull, brow, nose, lips, chin
float fHead(vec2 h, Fig f) {
  float d = sdEllipsoid(vec3(h - vec2(-0.05, 0.25), 0.0), vec3(0.88, 1.12, 1.0));
  d = smin(d, sdEllipsoid(vec3(h - vec2(0.45, -0.48), 0.0), vec3(0.52, 0.52, 1.0)), 0.25);   // jaw
  d = smin(d, sdTri(h, vec2(0.82, 0.3), vec2(1.18, -0.14), vec2(0.82, -0.17)), 0.06);          // nose
  d = smin(d, sdCircle(h - vec2(0.85, -0.45), 0.1), 0.05);                                     // lip
  d = smin(d, sdCircle(h - vec2(0.72, -0.78), 0.17), 0.1);                                     // chin
  return d;
}
float fHair(vec2 h, Fig f) {
  if (f.style == 0.0) {
    // a veil over the head falling behind the shoulders
    float d = sdEllipsoid(vec3(h - vec2(-0.3, 0.4), 0.0), vec3(1.05, 1.3, 1.0));
    d = min(d, sdTaper(h, vec2(-0.5, 0.0), vec2(-1.0, -3.0), 0.9, 1.15));
    d = max(d, -(sdEllipsoid(vec3(h - vec2(0.4, -0.18), 0.0), vec3(0.8, 1.06, 1.0))));
    return d;
  }
  if (f.style == 1.0) {
    float d = sdEllipsoid(vec3(h - vec2(-0.25, 0.45), 0.0), vec3(1.0, 1.15, 1.0));
    d = min(d, sdTaper(h, vec2(-0.6, 0.1), vec2(-1.05, -2.8), 0.8, 1.0));
    d = max(d, -(sdEllipsoid(vec3(h - vec2(0.5, -0.13), 0.0), vec3(0.8, 1.02, 1.0))));
    return d;
  }
  if (f.style == 2.0 || f.style == 4.0 || f.style == 5.0) {
    float d = sdEllipsoid(vec3(h - vec2(-0.22, 0.5), 0.0), vec3(0.94, 0.9, 1.0));
    d = max(d, -(sdEllipsoid(vec3(h - vec2(0.47, -0.08), 0.0), vec3(0.77, 0.9, 1.0))));
    return d - 0.045 * sin(atan(h.y, h.x) * 14.0);
  }
  float d = sdEllipsoid(vec3(h - vec2(-0.25, 0.42), 0.0), vec3(0.98, 1.06, 1.0));
  d = min(d, sdCircle(h - vec2(-1.02, 0.5), 0.5));
  d = max(d, -(sdEllipsoid(vec3(h - vec2(0.47, -0.08), 0.0), vec3(0.8, 1.02, 1.0))));
  return d;
}
float fBeard(vec2 h, Fig f) {
  if (f.style == 2.0 || f.style == 4.0 || f.style == 5.0) {
    // a short beard along the jaw
    float d = sdTaper(h, vec2(0.05, -0.35), vec2(0.72, -0.98), 0.38, 0.26);
    d = max(d, -(sdEllipsoid(vec3(h - vec2(0.85, -0.42), 0.0), vec3(0.3, 0.16, 1.0))));
    return d - 0.03 * sin(h.x * 20.0);
  }
  if (f.style != 1.0) return 1e3;
  float d = sdTaper(h, vec2(0.55, -0.5), vec2(0.4, -2.6), 0.52, 0.1);
  d = smin(d, sdTaper(h, vec2(0.15, -0.25), vec2(0.55, -1.2), 0.42, 0.34), 0.2);
  return d - 0.035 * sin(h.y * 18.0);
}
// the king's crown (gold foil, five points) and the guard's bronze helmet with its crest
float fCrown(vec2 h, Fig f) {
  if (f.style != 4.0) return 1e3;
  vec2 c = h - vec2(-0.15, 1.05);
  float d = sdBox2(c - vec2(0.0, 0.2), vec2(0.85, 0.24));
  for (int k = 0; k < 5; k++) { float x = -0.72 + float(k) * 0.36; d = min(d, sdTri(c, vec2(x - 0.15, 0.3), vec2(x + 0.15, 0.3), vec2(x, 0.85))); }
  return d;
}
float fHelm(vec2 h, Fig f) {
  if (f.style != 5.0) return 1e3;
  float d = sdEllipsoid(vec3(h - vec2(-0.15, 0.45), 0.0), vec3(1.12, 1.15, 1.0));
  d = smin(d, sdTri(h, vec2(-0.9, 1.0), vec2(0.6, 1.0), vec2(-0.25, 2.0)), 0.15);
  d = max(d, -(h.y - 0.15 + 0.3 * sat(h.x)));
  d = min(d, sdTaper(h, vec2(-0.6, 1.25), vec2(0.4, 1.55), 0.18, 0.05));      // crest
  d = min(d, sdBox2(h - vec2(-0.15, 0.08), vec2(1.05, 0.1)));                  // brim
  return d;
}
// legs (for the tunic styles): stride s swings the thighs, the back knee bends
void fLegs(vec2 q, Fig f, out float nl, out float fl, out vec2 lpn, out vec2 lpf) {
  float s = f.sway;
  for (int k = 0; k < 2; k++) {
    float a0 = k == 0 ? s * 0.9 : -s * 0.9;
    vec2 a = jnt(q, vec2(0.1 + (k == 0 ? 0.15 : -0.15), 10.0), a0);
    float bend = 0.12 + 1.3 * max(0.0, -a0);
    float th = sdTaper(a, vec2(0.0), vec2(0.0, -4.9), 0.55, 0.4);
    vec2 b = jnt(a, vec2(0.0, -4.9), -bend);
    float sh = sdTaper(b, vec2(0.0), vec2(0.0, -4.7), 0.38, 0.26);
    float ft = sdEllipsoid(vec3(b - vec2(0.36, -4.88), 0.0), vec3(0.62, 0.2, 1.0));
    float d = min(min(th, sh), ft);
    if (k == 0) { nl = d; lpn = b; } else { fl = d; lpf = b; }
  }
}

// an arm: upper from the shoulder, forearm from the elbow, the hand at the end. A wide sleeve hangs
// from the forearm. Outputs the distance of each piece and its local coordinates.
void fArm(vec2 q, float sh, float el, float wide, out float up, out float fo, out float ha, out vec2 lpu, out vec2 lpf, out vec2 lph) {
  vec2 s = vec2(0.3, 15.1);
  lpu = jnt(q, s, sh);
  up = sdTaper(lpu, vec2(0.0), vec2(0.0, -3.4), 0.42, 0.34);
  lpf = jnt(lpu, vec2(0.0, -3.4), el);
  fo = sdTaper(lpf, vec2(0.0), vec2(0.0, -3.0), 0.34, 0.27);
  // the sleeve: a wide cloth falling from the forearm (always hanging down a little)
  float sl = sdTaper(lpf, vec2(0.0, -0.4), vec2(-0.45 * wide, -2.6), 0.35, 0.35 + 0.65 * wide);
  sl = max(sl, -lpf.x - 0.2 - 0.6 * wide);
  fo = min(fo, sl);
  lph = jnt(lpf, vec2(0.0, -3.1), 0.0);
  // a slender hand: palm, four fingers together, the thumb apart
  ha = sdTaper(lph, vec2(0.0, 0.1), vec2(0.06, -0.55), 0.24, 0.2);
  ha = smin(ha, sdTaper(lph, vec2(0.05, -0.5), vec2(0.12, -1.15), 0.19, 0.09), 0.08);
  ha = min(ha, sdTaper(lph, vec2(0.18, -0.2), vec2(0.42, -0.55), 0.09, 0.06));
}

// Which part of figure f lies at sheet point p, its signed distance and its local coords.
// shadow: how much the parts above shade this one (0..1).
float figure(vec2 p, Fig f, out int part, out vec2 lp, out float shade, bool hq) {
  vec2 q = (p - f.pos) / f.scale;
  q.x *= f.face;
  // far from the figure: a cheap bound
  float bnd = length((q - vec2(0.0, 10.5)) * vec2(1.6, 1.0)) - 13.0;
  if (bnd > 0.5) { part = PT_NONE; lp = q; shade = 0.0; return bnd * f.scale; }
  // the waist leans
  vec2 qw = jnt(q, vec2(0.0, 10.4), f.lean) + vec2(0.0, 10.4);
  vec2 hc = vec2(0.42, 17.6);
  vec2 qh = jnt(qw, vec2(0.4, 16.6), f.head) + vec2(0.4, 16.6) - hc;
  float wide = (f.style == 1.0 || f.style == 0.0) ? 1.0 : 0.4;
  float up, fo, ha; vec2 lu, lf, lh;
  fArm(qw, f.sh, f.el, wide, up, fo, ha, lu, lf, lh);
  float fup, ffo, fha; vec2 flu, flf, flh;
  fArm(qw - vec2(-0.3, 0.05), f.fsh, f.fel, wide, fup, ffo, fha, flu, flf, flh);
  float face = min(fHead(qh, f), fNeck(qw));
  float hair = fHair(qh, f);
  float beard = fBeard(qh, f);
  float torso = fTorso(qw, f);
  float robe = fRobe(q, f);
  float mantle = fMantle(qw, f);
  float crown = fCrown(qh, f), helm = fHelm(qh, f);
  float nleg = 1e3, fleg = 1e3; vec2 lnl = q, lfl = q;
  if (tunicOf(f.style)) fLegs(q, f, nleg, fleg, lnl, lfl);
  float feet = tunicOf(f.style) ? 1e3 : min(sdEllipsoid(vec3(q - vec2(0.9 + f.sway * 0.6, 0.18), 0.0), vec3(0.75, 0.24, 1.0)), sdEllipsoid(vec3(q - vec2(-0.15 - f.sway * 0.4, 0.18), 0.0), vec3(0.7, 0.22, 1.0)));
  // brass pins at shoulder and elbow
    float pin = min(length(lu) - 0.12, length(lf) - 0.1);
  float nearArm = min(min(up, fo), ha);
  float farArm = min(min(fup, ffo), fha);
  // painting order, front first
  float d = 1e3; part = PT_NONE; lp = q;
  float sc = f.scale;
  if (pin < 0.0 && nearArm < 0.0) { part = PT_PIN; lp = lu; shade = 0.0; return pin * sc; }
  if (ha < 0.0) { part = PT_HAND; lp = lh; shade = 0.0; return ha * sc; }
  if (fo < 0.0) { part = PT_FORE; lp = lf; shade = 0.0; return fo * sc; }
  if (up < 0.0) { part = PT_UPPER; lp = lu; shade = 0.0; return up * sc; }
  // what the near arm shades below it (a light up and to the front)
  float sh0 = 0.0;
  {
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
  // outside: the distance to the whole figure
  d = min(min(min(nearArm, farArm), min(face, hair)), min(min(min(torso, mantle), robe), min(beard, feet)));
  d = min(d, min(min(crown, helm), min(nleg, fleg)));
  shade = 0.0;
  return d * sc;
}

// The paper, cloth and paint of each part. tone: robe colour, tone2: mantle/veil colour (linear).
Mat figMat(int part, vec2 lp, float shade, Fig f, vec3 tone, vec3 tone2) {
  vec3 skin = lin(vec3(0.62, 0.48, 0.36));
  Mat m;
  if (part == PT_PIN) { m = mFoil(lin(vec3(0.85, 0.62, 0.3)), true); return m; }
  if (part == PT_CROWN) { m = mFoil(lin(vec3(0.9, 0.7, 0.32)), true); m.alb *= 0.8 + 0.3 * step(0.0, sin(lp.x * 12.0)); return m; }
  if (part == PT_HELM) { m = mFoil(lin(vec3(0.5, 0.34, 0.2)), true); m.bump = 0.3; m.alb *= 1.0 - 0.6 * smoothstep(0.35, 0.8, fbm(lp * 2.0, 3)); return m; }
  if (part == PT_LEG || part == PT_FARLEG) {
    m = mPaper(skin * (part == PT_FARLEG ? 0.5 : 1.0)); m.tear = 0.0; m.fuzz = 0.0; m.trans = 0.3;
    // sandal straps
    if (lp.y < -3.6) m.alb = mix(m.alb, lin(vec3(0.16, 0.1, 0.06)), step(0.5, fract(lp.y * 3.0)) * 0.9);
    m.alb *= 1.0 - 0.55 * shade; m.seed = f.seed + float(part); return m;
  }
  if (part == PT_HAND || part == PT_FACE) {
    m = mPaper(skin);
    m.tear = 0.0; m.fuzz = 0.0; m.trans = 0.35;
    if (part == PT_FACE) {
      vec2 h = lp;
      // painted features: a closed or downcast eye in charcoal, a brow, a touch of red on the lip
      float eye = sdSeg(h, vec2(0.38, 0.08), vec2(0.68, 0.03), 0.038);
      float lid = sdSeg(h, vec2(0.36, 0.17), vec2(0.72, 0.1), 0.025);
      float brow = sdSeg(h, vec2(0.32, 0.36), vec2(0.78, 0.32), 0.04);
      m.alb *= 1.0 - 0.85 * smoothstep(0.02, 0.0, min(eye, brow * 1.3));
      m.alb *= 1.0 - 0.35 * smoothstep(0.03, 0.0, lid);
      m.alb = mix(m.alb, lin(vec3(0.55, 0.2, 0.16)), 0.6 * smoothstep(0.1, 0.0, sdCircle(h - vec2(0.86, -0.45), 0.08)));
      // a charcoal shadow drawn under the cheek and along the back of the jaw
      m.alb *= 1.0 - 0.35 * smoothstep(0.4, 1.2, length(h - vec2(0.6, 0.0)));
    }
  } else if (part == PT_HAIR || part == PT_BEARD) {
    vec3 c = f.style == 1.0 ? lin(vec3(0.72, 0.7, 0.66)) : lin(vec3(0.09, 0.07, 0.06));
    if (f.style == 4.0) c = lin(vec3(0.05, 0.04, 0.04));
    m = mPaper(c);
    m.alb *= 0.75 + 0.5 * pow(vnoise(vec2(lp.x * 3.0, lp.y * 22.0) + f.seed), 2.0);   // combed strands
    m.tear = 1.0; m.fuzz = 0.05;
  } else if (part == PT_MANTLE) {
    m = mPaper(tone2); m.kind = K_FABRIC; m.tear = 0.6; m.fuzz = 0.06; m.trans = 0.5;
  } else if (part == PT_TORSO || part == PT_ROBE || part == PT_UPPER || part == PT_FORE || part == PT_FAR) {
    vec3 c = tone;
    if (part == PT_FAR) c *= 0.55;
    m = mPaper(c); m.kind = K_FABRIC; m.tear = 0.4; m.fuzz = 0.04; m.trans = 0.3;
    // the weave of the cloth and painted folds running down
    vec2 w = lp * 9.0;
    float weave = 0.5 + 0.5 * sin(w.x * 3.1) * sin(w.y * 3.1);
    m.alb *= 0.88 + 0.16 * weave;
    if (part == PT_ROBE) {
      float folds = 0.5 + 0.5 * sin(lp.x * 4.2 + 0.4 * sin(lp.y * 0.9) + f.seed);
      m.alb *= 0.72 + 0.4 * folds;
      // a band of worn embroidery at the hem
      float band = smoothstep(0.08, 0.0, abs(lp.y - 1.0) - 0.16) + 0.6 * smoothstep(0.05, 0.0, abs(lp.y - 1.55) - 0.05);
      if (!tunicOf(f.style)) m.alb = mix(m.alb, tone2 * 1.2, band * 0.7);
      else m.alb = mix(m.alb, tone2, smoothstep(0.06, 0.0, abs(lp.y - 10.2) - 0.25) * 0.85);   // the belt
      if (f.style == 4.0) m.alb = mix(m.alb, lin(vec3(0.85, 0.66, 0.3)), 0.6 * smoothstep(0.05, 0.0, abs(fract(lp.x * 0.9 + lp.y * 0.3) - 0.5) - 0.44));  // gold stripes
    }
  } else {
    m = mCard(lin(vec3(0.08, 0.06, 0.05)));
  }
  m.alb *= 1.0 - 0.55 * shade;
  m.seed = f.seed + float(part);
  return m;
}
`;

// JavaScript: a figure's 12 floats
export function pose({ x = 0, y = 0, scale = 1, face = 1, lean = 0, head = 0, sh = 0.2, el = -0.3, fsh = -0.1, fel = -0.2, sway = 0, style = 0 } = {}) {
  return [x, y, scale, face, lean, head, sh, el, fsh, fel, sway, style];
}
