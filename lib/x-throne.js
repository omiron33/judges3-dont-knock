// Eglon's summer room as a paper diorama: a cool roof chamber of dark plaster card with arched
// lattice windows (thin wood bars cut by hand) letting in moonlight from a parchment night sky, hangings
// of distressed fabric between them, a tall carved throne of thin wood inlaid with tarnished gold foil
// (its back on one flat, its seat front and arms on another so the king sits *in* it), iron candle
// stands, the fancy double door of gold foil with incised patterns (its leaves swing by narrowing on
// their hinges) and a dark corridor behind it. Puppets stand on three figure flats (near, mid, the
// king's) and a fourth flat in the corridor behind the door for those who leave.
//
// Sheets, front to back:
//   0 foreground: dark drapes at the frame edges, a ground row of floor boards       z 0
//   1 near figures                                                                    z 12
//   2 mid figures                                                                     z 18
//   3 throne seat front and arms, candle stands                                       z 22
//   4 the king's flat                                                                 z 25
//   5 throne back                                                                     z 29
//   6 hangings of fabric                                                              z 37
//   7 the wall: windows, the door opening                                             z 40
//   8 door leaves                                                                     z 41.5
//   9 corridor figures                                                                z 46
//  10 corridor back                                                                   z 52
//  11 night sky parchment                                                             z 70
//  12 light box                                                                       z 76
import { PAPER_HEAD, PAPER_TRACE, PAPER_UNIFORMS, L, flicker } from '/song/lib/paper.js';
import { PUPPET_GLSL, pose } from '/song/lib/puppet.js';

// world layout (cm)
export const ROOM = {
  floor: -8,                 // where feet stand
  throneX: 4,
  doorX: -34, doorHW: 7, doorTop: 14,
  win: [-14, 22, 40],        // lattice windows (centres)
  candA: [-11, 6], candB: [17, 6],   // candle stands (x, flame y) on the seat flat
};

// colours (sRGB 0..1, the puppet tone and its second tone: belt, hem band)
const lin = (c) => c.map((v) => Math.pow(v, 2.2));
export const TONES = {
  ehud: [lin([0.42, 0.2, 0.11]), lin([0.12, 0.08, 0.05])],
  eglon: [lin([0.16, 0.07, 0.14]), lin([0.62, 0.47, 0.22])],
  guard: [lin([0.24, 0.21, 0.12]), lin([0.1, 0.07, 0.045])],
  bearerA: [lin([0.36, 0.3, 0.22]), lin([0.52, 0.46, 0.36])],
  bearerB: [lin([0.3, 0.2, 0.13]), lin([0.2, 0.17, 0.13])],
  bearerC: [lin([0.4, 0.34, 0.26]), lin([0.25, 0.2, 0.15])],
  scribe: [lin([0.46, 0.42, 0.34]), lin([0.2, 0.15, 0.1])],
  servant: [lin([0.38, 0.33, 0.27]), lin([0.24, 0.2, 0.16])],
};
// figure slots: 0..6; layer 0 near, 1 mid, 2 king, 3 corridor; -1 hidden
export const OFF = pose({ scale: 0 });

export const THRONE_UNIFORMS = {
  ...PAPER_UNIFORMS,
  uF0: OFF, uF1: OFF, uF2: OFF, uF3: OFF, uF4: OFF, uF5: OFF, uF6: OFF,
  uLay: [0, 0, 0, 1, 1, 1, 2],
  uTone: new Array(21).fill(0.2), uTone2: new Array(21).fill(0.1),
  uCarry: [0, 0, 0, 0, 0, 0, 0],   // what each figure carries: 0 nothing, 1 basket, 2 jar, 3 sack, 4 tablet, 5 spear
  uDoor: 0.0,                      // 0 shut .. 1 wide open
  uDrape: [-80, 80],               // inner edges of the foreground drapes (x at z 0)
  uGround: -9.0,                   // top of the ground row
  uWin: [1, 1, 1],                 // brightness of each window's sky
  uCand: [1, 1],                   // candles lit
  uSeat: 1.0,                      // throne seat front shown
  uGoat: [999, -8, 0],             // the goat: x, y, step
  uSlamY: 0.0,                     // ground-row bounce (paper slam)
  uCandP: [ROOM.candA[0], ROOM.candA[1], ROOM.candB[0], ROOM.candB[1]],   // candle flames (x, y) A and B
  uStill: 0,                       // 1: the flames stand still
  uProp: [0, 0, 0],                // a loose prop on the near flat: x, y, kind (see propSD)
};

export const THRONE_GLSL = PAPER_HEAD + PUPPET_GLSL + /* glsl */ `
uniform float uF0[12], uF1[12], uF2[12], uF3[12], uF4[12], uF5[12], uF6[12];
uniform float uLay[7], uTone[21], uTone2[21], uCarry[7];
uniform float uDoor, uGround, uSeat, uSlamY;
uniform vec2 uDrape, uCand;
uniform vec3 uWin, uGoat, uProp;
uniform vec4 uCandP;
uniform float uStill;
#define NL 13
#define DOORX ${ROOM.doorX.toFixed(1)}
#define DOORHW ${ROOM.doorHW.toFixed(1)}
#define DOORTOP ${ROOM.doorTop.toFixed(1)}
#define THRX ${ROOM.throneX.toFixed(1)}
#define FLOORY ${ROOM.floor.toFixed(1)}

float sheetZ(int i, vec2 p) {
  if (i == 0) return 0.0;
  if (i == 1) return 12.0;
  if (i == 2) return 18.0;
  if (i == 3) return 22.0;
  if (i == 4) return 25.0;
  if (i == 5) return 29.0;
  if (i == 6) return 37.0 + 0.35 * sin(p.x * 1.7 + p.y * 0.2);   // the cloth hangs in soft folds
  if (i == 7) return 40.0;
  if (i == 8) return 41.5;
  if (i == 9) return 46.0;
  if (i == 10) return 52.0;
  if (i == 11) return 70.0;
  return 76.0;
}
float sheetOpac(int i) {
  if (i == 6) return 0.85;
  if (i == 11) return 0.96;
  if (i == 12) return 0.0;
  return 1.0;
}

Fig figK(int k) {
  if (k == 0) return figAt(uF0);
  if (k == 1) return figAt(uF1);
  if (k == 2) return figAt(uF2);
  if (k == 3) return figAt(uF3);
  if (k == 4) return figAt(uF4);
  if (k == 5) return figAt(uF5);
  return figAt(uF6);
}
// the hand of figure f (near arm), in sheet coordinates: for things it carries
vec2 handOf(Fig f) {
  vec2 s = vec2(0.3, 15.1);
  vec2 e = s + rot(f.sh) * vec2(0.0, -3.4);
  vec2 h = e + rot(f.sh + f.el) * vec2(0.0, -3.5);
  // lean about the waist
  h = vec2(0.0, 10.4) + rot(f.lean) * (h - vec2(0.0, 10.4));
  return f.pos + f.scale * vec2(h.x * f.face, h.y);
}
// Props, drawn in the prop's own frame q (cm / figure units, anchored at a hand or on the floor).
// c: 1 basket, 2 jar, 3 sack, 4 tablet, 5..6 spear (tilt = (c - 5.5) * 3 radians). part out: 0 body,
// 1 the top (fruit, the spear's bronze blade)
float propSD(vec2 q, float c, out float part) {
  part = 0.0;
  if (c < 1.5) {   // a basket held up on the hand: woven, wider at the top, fruit heaped in it
    vec2 b = q - vec2(0.2, 1.4);
    float d = sdBox2(b, vec2(1.3 + 0.18 * b.y, 1.0));
    float fr = min(min(sdCircle(b - vec2(-0.5, 1.15), 0.5), sdCircle(b - vec2(0.35, 1.25), 0.55)), sdCircle(b - vec2(0.0, 1.55), 0.45));
    if (fr < d) part = 1.0;
    return min(d, fr);
  }
  if (c < 2.5) {   // a tall jar held up before the chest
    vec2 b = q - vec2(0.5, 1.2);
    float d = sdEllipsoid(vec3(b, 0.0), vec3(1.0, 1.5, 1.0));
    d = smin(d, sdBox2(b - vec2(0.0, 1.6), vec2(0.38, 0.5)), 0.2);
    return min(d, sdBox2(b - vec2(0.0, 2.1), vec2(0.55, 0.12)));
  }
  if (c < 3.5) {   // a tied sack (the payment)
    vec2 b = q - vec2(0.3, -1.0);
    float d = sdEllipsoid(vec3(b, 0.0), vec3(1.25, 1.45, 1.0));
    float tie = sdTri(b, vec2(-0.35, 1.2), vec2(0.35, 1.2), vec2(0.0, 2.0));
    if (tie < 0.0 || abs(b.y - 1.15) < 0.12) part = 1.0;
    return smin(d, tie, 0.15);
  }
  if (c < 4.5) {   // a wax tablet held up to tally
    vec2 b = rot(0.25) * (q - vec2(0.6, 0.4));
    return sdBox2(b, vec2(0.9, 1.25));
  }
  // a spear: a long shaft through the hand, a bronze leaf blade on top
  vec2 b = rot((c - 5.5) * 3.0) * q;
  float d = sdSeg(b, vec2(0.0, -9.0), vec2(0.0, 9.0), 0.13);
  float bl = sdTaper(b, vec2(0.0, 8.8), vec2(0.0, 11.4), 0.42, 0.02);
  bl = min(bl, sdBox2(b - vec2(0.0, 8.7), vec2(0.3, 0.12)));
  if (bl < d) part = 1.0;
  return min(d, bl);
}
Mat propMat(vec2 q, float c, float part, float seed) {
  Mat m;
  if (c < 1.5) {
    m = mPaper(lin(vec3(0.42, 0.3, 0.16))); m.kind = K_WOOD;
    m.alb *= 0.7 + 0.5 * step(0.5, fract((q.x + q.y) * 2.2)) * step(0.5, fract((q.x - q.y) * 2.2) + 0.3);
    if (part > 0.5) m = mPaper(lin(vec3(0.42, 0.14, 0.1)) * (0.7 + 0.5 * vnoise(q * 3.0)));
  } else if (c < 2.5) {
    m = mPaper(lin(vec3(0.46, 0.27, 0.15)));
    m.alb *= 0.75 + 0.4 * smoothstep(0.2, 0.8, vnoise(q * vec2(0.6, 3.0)));
    m.alb *= 1.0 - 0.4 * hatch(q * 2.0, 0.25, 2.0); m.tear = 0.0;
  } else if (c < 3.5) {
    m = mPaper(lin(vec3(0.48, 0.4, 0.29))); m.kind = K_FABRIC;
    m.alb *= 0.7 + 0.45 * brush(q * 2.0, 1.2, 4.0);
    m.alb *= 1.0 - 0.45 * smoothstep(-0.5, -2.4, q.y);
    if (part > 0.5) m = mPaper(lin(vec3(0.16, 0.1, 0.06)));
  } else if (c < 4.5) {
    m = mCard(lin(vec3(0.3, 0.2, 0.1)));
    float tl = abs(fract(q.x * 3.0) - 0.5);
    m.alb = mix(m.alb, lin(vec3(0.12, 0.09, 0.05)), smoothstep(0.08, 0.02, tl) * step(abs(q.y - 0.4), 0.8));
  } else {
    if (part > 0.5) m = mFoil(lin(vec3(0.62, 0.42, 0.22)), true);
    else { m = mCard(lin(vec3(0.3, 0.2, 0.11))); m.kind = K_WOOD; }
  }
  m.seed = seed;
  return m;
}
// what figure f carries in its near hand
float carried(vec2 p, Fig f, float c, out float part, out vec2 q) {
  part = 0.0; q = vec2(0.0);
  if (c < 0.5) return 1e3;
  vec2 h = handOf(f);
  q = (p - h) / f.scale; q.x *= f.face;
  if (dot(q, q) > 200.0) return 1e3;
  return propSD(q, c, part) * f.scale;
}
// a loose prop on the near flat (uProp: x, y, kind) and its scale
float looseProp(vec2 p, out float part, out vec2 q) {
  part = 0.0; q = vec2(0.0);
  if (uProp.z < 0.5) return 1e3;
  q = (p - uProp.xy) / 0.95;
  return propSD(q, uProp.z, part) * 0.95;
}
// the king is drawn a size wider than his frame: a man of great girth
vec2 girth(vec2 p, Fig f) { return f.style == 4.0 ? vec2(f.pos.x + (p.x - f.pos.x) / 1.22, p.y) : p; }
float figLayer(vec2 p, float lay, bool hq) {
  float d = 1e3;
  for (int k = 0; k < 7; k++) {
    if (abs(uLay[k] - lay) > 0.1) continue;
    Fig f = figK(k);
    if (f.scale < 0.01) continue;
    int pt; vec2 lp; float sh;
    d = min(d, figure(girth(p, f), f, pt, lp, sh, hq));
    float ck; vec2 cq; d = min(d, carried(p, f, uCarry[k], ck, cq));
  }
  if (lay < 0.5) { float pp; vec2 pq; d = min(d, looseProp(p, pp, pq)); }
  if (lay < 0.5 && uGoat.x < 900.0) {
    // the goat: a little cut-card goat on twos, beard and horns
    vec2 q = p - uGoat.xy; q.x = -q.x;
    float bob = uGoat.z;
    float d0 = sdEllipsoid(vec3(q - vec2(0.0, 3.2 + bob * 0.1), 0.0), vec3(2.6, 1.3, 1.0));
    d0 = smin(d0, sdTaper(q, vec2(2.0, 3.6), vec2(3.1, 5.0), 0.55, 0.5), 0.3);
    d0 = smin(d0, sdTaper(q, vec2(3.1, 5.2), vec2(4.2, 4.6), 0.6, 0.3), 0.2);
    d0 = min(d0, sdTaper(q, vec2(3.0, 5.6), vec2(2.2, 6.9), 0.16, 0.05));
    d0 = min(d0, sdTaper(q, vec2(4.0, 4.3), vec2(3.9, 3.5), 0.12, 0.04));
    for (int l = 0; l < 4; l++) {
      float lx = l < 2 ? 1.7 : -1.6; lx += (l == 1 || l == 3) ? -0.5 : 0.0;
      float sw = sin(bob * 3.0 + float(l) * 1.7) * 0.4;
      d0 = min(d0, sdTaper(q, vec2(lx, 2.6), vec2(lx + sw, 0.0), 0.28, 0.16));
    }
    d0 = min(d0, sdTaper(q, vec2(-2.5, 3.6), vec2(-3.1, 4.3), 0.2, 0.1));
    d = min(d, d0);
  }
  return d;
}
// this film's tailoring over the shared puppet paint: cloth lets less light through (the figures
// stay solid against the moonlit windows) and the king's robe is purple-black with thin gold stripes
Mat dressFig(Mat m, int pt, vec2 lp, float sh, Fig f, vec3 t1, vec3 t2) {
  if (m.kind == K_FABRIC || pt == PT_FACE || pt == PT_HAND || pt == PT_LEG || pt == PT_FARLEG) { m.trans *= 0.3; m.fuzz *= 0.6; }
  if (f.style == 5.0 && pt == PT_BEARD) {
    // the guards go clean-shaven under their helmets: the jaw is painted skin with a charcoal line
    m = mPaper(lin(vec3(0.6, 0.46, 0.34)) * (1.0 - 0.45 * sh)); m.tear = 0.0; m.fuzz = 0.0; m.trans = 0.1; m.seed = f.seed + 6.0;
  }
  if (f.style == 4.0 && (pt == PT_ROBE || pt == PT_TORSO)) {
    vec3 c = t1;
    float folds = 0.5 + 0.5 * sin(lp.x * 3.4 + 0.5 * sin(lp.y * 0.8) + f.seed);
    c *= 0.7 + 0.45 * folds;
    c *= 0.88 + 0.16 * (0.5 + 0.5 * sin(lp.x * 28.0) * sin(lp.y * 28.0));
    float st = abs(fract(lp.x * 0.75 + 0.15) - 0.5);
    float stripe = smoothstep(0.05, 0.02, st) * step(lp.y, 15.0);
    float hem = smoothstep(0.08, 0.0, abs(lp.y - 1.0) - 0.22);
    m = mPaper(c); m.kind = K_FABRIC; m.trans = 0.08; m.tear = 0.4; m.fuzz = 0.02;
    if (max(stripe, hem) > 0.5) { m = mFoil(t2 * (0.6 + 0.4 * vnoise(lp * 4.0)), true); }
    m.alb *= 1.0 - 0.55 * sh;
    m.seed = f.seed + float(pt);
  }
  return m;
}
Mat figLayerMat(vec2 p, float lay) {
  float best = 1e3; Mat m = mCard(lin(vec3(0.05)));
  for (int k = 0; k < 7; k++) {
    if (abs(uLay[k] - lay) > 0.1) continue;
    Fig f = figK(k);
    if (f.scale < 0.01) continue;
    float ck; vec2 cq; float dc = carried(p, f, uCarry[k], ck, cq);
    if (dc < 0.0) return propMat(cq, uCarry[k], ck, float(k) + 40.0);
    int pt; vec2 lp; float sh;
    float d = figure(girth(p, f), f, pt, lp, sh, true);
    if (d < best) {
      best = d;
      vec3 t1 = vec3(uTone[k * 3], uTone[k * 3 + 1], uTone[k * 3 + 2]);
      vec3 t2 = vec3(uTone2[k * 3], uTone2[k * 3 + 1], uTone2[k * 3 + 2]);
      m = figMat(pt, lp, sh, f, t1, t2);
      m = dressFig(m, pt, lp, sh, f, t1, t2);
      if (d < 0.0) return m;
    }
  }
  if (lay < 0.5) { float pp; vec2 pq; if (looseProp(p, pp, pq) < 0.0) return propMat(pq, uProp.z, pp, 49.0); }
  if (lay < 0.5 && uGoat.x < 900.0) {
    Mat g = mPaper(lin(vec3(0.5, 0.44, 0.36)));
    g.kind = K_FABRIC; g.fuzz = 0.12; g.alb *= 0.7 + 0.5 * vnoise(p * vec2(4.0, 0.8));
    if (best > -0.01) return g;
  }
  return m;
}

// ---------- the room ----------
float archSD(vec2 p, vec2 c, float hw, float y0, float y1) {
  // an arched opening: straight sides from y0 to y1, a round top above
  float d = sdBox2(p - vec2(c.x, (y0 + y1) * 0.5), vec2(hw, (y1 - y0) * 0.5));
  return min(d, sdCircle(p - vec2(c.x, y1), hw));
}
float latticeBars(vec2 q) {
  // diamond lattice of thin wood: two families of diagonal bars, a frame bar across the middle
  float s = 1.55;
  float a = abs(mod(q.x + q.y, s) - s * 0.5) * 0.7071;
  float b = abs(mod(q.x - q.y, s) - s * 0.5) * 0.7071;
  float d = min(a, b) - 0.13;
  d = min(d, abs(q.y - 6.0) - 0.22);
  d = min(d, abs(q.x) - 0.2);
  return d;
}
float winHole(vec2 p, int k) {
  float x = k == 0 ? ${ROOM.win[0].toFixed(1)} : (k == 1 ? ${ROOM.win[1].toFixed(1)} : ${ROOM.win[2].toFixed(1)});
  return archSD(p, vec2(x, 0.0), 4.4, 5.0, 17.0);
}
float doorHole(vec2 p) { return archSD(p, vec2(DOORX, 0.0), DOORHW, FLOORY - 2.0, DOORTOP); }
float wallSD(vec2 p, bool hq) {
  float hole = 1e3;
  for (int k = 0; k < 3; k++) {
    float w = winHole(p, k);
    float x = k == 0 ? ${ROOM.win[0].toFixed(1)} : (k == 1 ? ${ROOM.win[1].toFixed(1)} : ${ROOM.win[2].toFixed(1)});
    w = max(w, -latticeBars(p - vec2(x, 5.0)));
    hole = min(hole, w);
  }
  hole = min(hole, doorHole(p));
  return cut(-hole, p, 7.0);
}
// the door leaves: two leaves hinged at the jambs; open k narrows each toward its hinge
float leafSD(vec2 p, float side, float k, out vec2 lq) {
  float hinge = DOORX + side * DOORHW;
  float w = DOORHW * mix(1.0, 0.16, k);
  // local x from the hinge inward, 0..1 across the leaf
  float u = (hinge - p.x) * side / w;
  lq = vec2(u, p.y);
  float full = archSD(vec2(DOORX + side * (DOORHW - u * DOORHW), p.y), vec2(DOORX, 0.0), DOORHW - 0.05, FLOORY - 2.0, DOORTOP);
  float d = max(full, max(-u, u - 1.0) * w);
  // the meeting edge: a hair apart
  return d;
}
float doorSD(vec2 p, bool hq) {
  vec2 a, b;
  float l = leafSD(p, -1.0, uDoor, a);
  float r = leafSD(p, 1.0, uDoor, b);
  return min(l, r);
}
// the throne back: a tall carved panel with a pointed top, posts with finials, cut rosettes
float throneBack(vec2 p, bool hq) {
  vec2 q = p - vec2(THRX, FLOORY);
  float d = sdBox2(q - vec2(0.0, 12.5), vec2(5.6, 12.5));
  d = min(d, sdTri(q, vec2(-5.6, 24.5), vec2(5.6, 24.5), vec2(0.0, 31.0)));
  d = min(d, sdCircle(q - vec2(0.0, 31.4), 0.9));
  for (int s = -1; s <= 1; s += 2) {
    float x = float(s) * 6.3;
    d = min(d, sdBox2(q - vec2(x, 13.0), vec2(0.75, 13.0)));
    d = min(d, sdCircle(q - vec2(x, 26.6), 1.05));
    d = min(d, sdTri(q, vec2(x - 0.6, 27.3), vec2(x + 0.6, 27.3), vec2(x, 29.4)));
  }
  if (hq) {
    // cut rosettes in the crest and a row of slots under it
    vec2 r = q - vec2(0.0, 26.0);
    float ros = abs(length(r) - 1.6) - 0.22;
    ros = min(ros, sdCircle(r, 0.45));
    for (int k = 0; k < 4; k++) { float a = float(k) * 1.5708 + 0.785; ros = min(ros, sdCircle(r - 1.6 * vec2(cos(a), sin(a)), 0.5)); }
    d = max(d, -ros);
    vec2 sq = vec2(mod(q.x + 0.9, 1.8) - 0.9, q.y - 21.6);
    float slot = sdBox2(sq, vec2(0.28, 1.2));
    slot = min(slot, sdCircle(sq - vec2(0.0, 1.2), 0.28));
    d = max(d, -max(slot, abs(q.x) - 4.4));
  }
  return cut(d, p, 11.0);
}
// the seat front and arms (in front of the king) and the candle stands
float seatSD(vec2 p, bool hq) {
  vec2 q = p - vec2(THRX, FLOORY);
  float d = 1e3;
  if (uSeat > 0.5) {
    d = sdBox2(q - vec2(0.0, 3.4), vec2(5.4, 3.4 + 0.0));
    d = min(d, sdBox2(q - vec2(0.0, 6.9), vec2(6.4, 0.35)));
    for (int s = -1; s <= 1; s += 2) {
      float x = float(s) * 6.6;
      d = min(d, sdBox2(q - vec2(x, 4.6), vec2(0.9, 4.6)));
      d = min(d, sdCircle(q - vec2(x, 9.9), 1.1));
      // lion-paw feet
      d = min(d, sdEllipsoid(vec3(q - vec2(x + float(s) * 0.3, 0.45), 0.0), vec3(1.4, 0.55, 1.0)));
    }
    d = cut(d, p, 12.0);
  }
  for (int c = 0; c < 2; c++) {
    if ((c == 0 ? uCand.x : uCand.y) < 0.5) continue;
    vec2 cp = c == 0 ? uCandP.xy : uCandP.zw;
    vec2 r = p - cp;
    float s = sdSeg(r, vec2(0.0, FLOORY - cp.y), vec2(0.0, -3.4), 0.22);                        // iron stem
    s = min(s, sdTri(r, vec2(-1.8, FLOORY - cp.y), vec2(1.8, FLOORY - cp.y), vec2(0.0, FLOORY - cp.y + 2.6)));   // tripod foot
    s = min(s, sdBox2(r - vec2(0.0, -3.3), vec2(1.3, 0.16)));                                   // drip pan
    s = min(s, sdBox2(r - vec2(0.0, -2.05), vec2(0.42, 1.15)));                                 // wax candle
    s = min(s, sdSeg(r, vec2(0.0, -0.9), vec2(0.0, -0.6), 0.03));                              // wick
    // the flame: a tear drop that sways on twos
    vec2 fb = boil(float(c) * 3.0 + 1.0, 0.06 * (1.0 - uStill));
    vec2 fr = r - vec2(fb.x, 0.05);
    float fl = sdEllipsoid(vec3(fr, 0.0), vec3(0.32, 0.62, 1.0));
    fl = smin(fl, sdTri(fr, vec2(-0.2, 0.2), vec2(0.2, 0.2), vec2(fb.x * 2.0, 1.25 + fb.y)), 0.12);
    s = min(s, fl);
    d = min(d, s);
  }
  return d;
}
float flameAt(vec2 p) {
  float best = 1e3;
  for (int c = 0; c < 2; c++) {
    if ((c == 0 ? uCand.x : uCand.y) < 0.5) continue;
    vec2 cp = c == 0 ? uCandP.xy : uCandP.zw;
    vec2 fb = boil(float(c) * 3.0 + 1.0, 0.06 * (1.0 - uStill));
    vec2 fr = p - cp - vec2(fb.x, 0.05);
    float fl = sdEllipsoid(vec3(fr, 0.0), vec3(0.32, 0.62, 1.0));
    fl = smin(fl, sdTri(fr, vec2(-0.2, 0.2), vec2(0.2, 0.2), vec2(fb.x * 2.0, 1.25 + fb.y)), 0.12);
    best = min(best, fl);
  }
  return best;
}
float hangSD(vec2 p, bool hq) {
  float d = 1e3;
  for (int k = 0; k < 4; k++) {
    float x = k == 0 ? -51.0 : (k == 1 ? -23.5 : (k == 2 ? 31.0 : 50.0));
    float w = 3.3 + 0.3 * hash11(float(k));
    float bot = -1.0 - 3.0 * hash11(float(k) + 4.0);
    vec2 q = p - vec2(x, 0.0);
    float b = sdBox2(q - vec2(0.0, (27.0 + bot) * 0.5), vec2(w, (27.0 - bot) * 0.5));
    // the hem cut in points with a fringe
    b = max(b, -(q.y - bot - 1.6 * abs(fract(q.x / 2.2 + 0.5) - 0.5) * 2.0) );
    d = min(d, b);
  }
  // the rod across the top
  d = min(d, sdBox2(p - vec2(0.0, 27.4), vec2(70.0, 0.3)));
  return torn(d, p, 0.18, 13.0, hq);
}
float foreSD(vec2 p, bool hq) {
  // the ground row: floor boards' front edge, and the drapes at the frame edges
  float g = sdBelow(p, uGround + uSlamY + 0.35 * sin(p.x * 0.31) + 0.2 * sin(p.x * 1.3 + 2.0));
  g = torn(g, p, 0.2, 21.0, hq);
  float dl = p.x - uDrape.x - 1.6 * sin(p.y * 0.35 + 1.0) - 0.8 * sin(p.y * 0.9);
  float dr = uDrape.y - p.x + 1.6 * sin(p.y * 0.33) + 0.8 * sin(p.y * 1.1 + 2.0);
  dl = torn(dl, p, 0.25, 22.0, hq); dr = torn(dr, p, 0.25, 23.0, hq);
  return min(g, min(dl, dr));
}
float corridorSD(vec2 p) { return -1.0; }
float skySD(vec2 p, bool hq) {
  float d = -1.0;
  d = max(d, -sdCircle(p - vec2(30.0, 34.0), 4.2));      // the moon, cut through to the light box
  vec2 c = floor(p / 2.2);
  vec2 h = hash22(c);
  float st = length(p - (c + h) * 2.2) - (0.03 + 0.05 * hash12(c + 5.0));
  if (hash12(c + 1.0) > 0.78) d = max(d, -st);
  return d;
}

// the floor is a run of ground rows, one on each flat, like the raked stage of a toy theatre
float floorSD(vec2 p, float seed, bool hq) { return torn(p.y - (FLOORY - 0.2), p, 0.12, seed, hq); }
Mat floorMat(vec2 p, float z) {
  // flagstones of dark painted card, seams in charcoal, the far rows a little paler
  vec3 a = lin(vec3(0.3, 0.26, 0.21)) * mix(0.7, 1.0, z / 30.0);
  a *= 0.7 + 0.45 * brush(p * 0.5, 0.05, z);
  // flagstones drawn in perspective on the card: rows that narrow toward the top edge
  float dy = FLOORY - p.y;
  float row = log(1.0 + dy * 0.6) * 3.0;
  float rs = smoothstep(0.12, 0.0, abs(fract(row) - 0.5) - 0.44);
  float cx = (p.x - THRX) / (4.0 + dy * 1.2) + floor(row) * 0.5;
  float cs = smoothstep(0.1, 0.0, abs(fract(cx) - 0.5) - 0.46);
  a *= 1.0 - 0.55 * max(rs, cs);
  // the king's rug before the throne: dried-blood crimson, a border of dull gold thread
  if (z < 13.0) {
    vec2 rq = vec2((p.x - THRX) / (1.0 + dy * 0.12), dy);
    float rug = sdBox2(rq - vec2(0.0, 9.0), vec2(7.5, 9.0));
    if (rug < 0.0) {
      vec3 r = lin(vec3(0.3, 0.07, 0.05)) * (0.7 + 0.4 * vnoise(p * vec2(9.0, 2.0)));
      float bd = smoothstep(0.15, 0.0, abs(rug + 0.9) - 0.35);
      float dia = smoothstep(0.1, 0.0, abs(abs(rq.x) * 0.5 + abs(fract(rq.y * 0.25) - 0.5) * 2.0 - 0.9) - 0.08);
      r = mix(r, lin(vec3(0.5, 0.38, 0.16)), max(bd, dia * 0.7));
      Mat m = mPaper(r); m.kind = K_FABRIC; m.fuzz = 0.06; m.seed = 77.0; return m;
    }
  }
  a *= 1.0 - 0.45 * smoothstep(2.0, 14.0, dy);
  Mat m = mCard(a); m.tear = 0.5; m.seed = z; return m;
}
float sheetSD(int i, vec2 p, bool hq) {
  if (i == 0) return foreSD(p, hq);
  if (i == 1) return min(figLayer(p, 0.0, hq), floorSD(p, 1.0, hq));
  if (i == 2) return min(figLayer(p, 1.0, hq), floorSD(p, 2.0, hq));
  if (i == 3) return min(seatSD(p, hq), floorSD(p, 3.0, hq));
  if (i == 4) return min(figLayer(p, 2.0, hq), floorSD(p, 4.0, hq));
  if (i == 5) return min(throneBack(p, hq), floorSD(p, 5.0, hq));
  if (i == 6) return hangSD(p, hq);
  if (i == 7) return wallSD(p, hq);
  if (i == 8) return max(doorSD(p, hq), doorHole(p) - 0.6);
  if (i == 9) return max(figLayer(p, 3.0, hq), doorHole(p) - 0.5);
  if (i == 10) return max(-1.0, doorHole(p) - 3.0);
  if (i == 11) return skySD(p, hq);
  return -1.0;
}

vec3 woodGrain(vec2 p, vec3 base, float seed) {
  float g = vnoise(vec2(p.x * 0.35, p.y * 6.0) + seed) * 0.6 + vnoise(vec2(p.x * 1.4, p.y * 21.0) + seed) * 0.4;
  return base * (0.72 + 0.5 * g);
}
// tarnished gold foil: bright where it caught, dark in the cracks and the tarnish
Mat goldLeaf(vec2 p, float seed) {
  Mat m = mFoil(lin(vec3(0.7, 0.53, 0.27)), true);
  vec2 cr = cracks(p, 1.1);
  m.alb *= 0.35 + 0.65 * smoothstep(0.0, 0.03, cr.x);
  m.alb *= 1.0 - 0.6 * smoothstep(0.5, 0.8, fbm(p * 0.25 + seed, 3));   // tarnish
  m.alb *= 0.7;
  m.seed = seed;
  return m;
}

Mat sheetMat(int i, vec2 p, float sd) {
  if (i == 0) {
    if (p.y < uGround + 1.5 + uSlamY && p.x > uDrape.x + 2.5 && p.x < uDrape.y - 2.5) {
      // floor boards seen edge on: dark planks with charcoal seams
      Mat m = mCard(lin(vec3(0.16, 0.11, 0.075)));
      m.kind = K_WOOD;
      m.alb = woodGrain(p * vec2(0.4, 1.0), m.alb, 3.0);
      m.alb *= 1.0 - 0.6 * smoothstep(0.06, 0.0, abs(fract(p.x / 7.3) - 0.5) - 0.47);
      m.tear = 0.3; m.seed = 1.0; return m;
    }
    // the drapes: distressed heavy fabric, deep soot-crimson, folds in charcoal
    Mat m = mPaper(lin(vec3(0.2, 0.065, 0.055)));
    m.kind = K_FABRIC; m.trans = 0.15; m.fuzz = 0.1; m.tear = 0.8;
    float folds = 0.5 + 0.5 * sin(p.x * 0.9 + 0.6 * sin(p.y * 0.2));
    m.alb *= 0.45 + 0.6 * folds;
    m.alb *= 0.8 + 0.3 * vnoise(p * vec2(6.0, 0.6));
    m.alb *= 1.0 - 0.4 * smoothstep(0.5, 0.8, fbm(p * 0.3, 3));
    m.seed = 2.0; return m;
  }
  if (i >= 1 && i <= 5 && p.y < FLOORY - 0.15 && !(i == 3 && uSeat > 0.5 && abs(p.x - THRX) < 8.2) && !(i == 5 && abs(p.x - THRX) < 7.0)) {
    // under the feet: unless something stands on this flat right there
    float above = (i == 1 || i == 2 || i == 4) ? figLayer(p, i == 1 ? 0.0 : (i == 2 ? 1.0 : 2.0), false) : 1.0;
    if (above > 0.0) return floorMat(p, sheetZ(i, p));
  }
  if (i == 1) return figLayerMat(p, 0.0);
  if (i == 2) return figLayerMat(p, 1.0);
  if (i == 3) {
    if (flameAt(p) < 0.02) {
      float core = smoothstep(0.0, -0.35, flameAt(p));
      return mGlow(mix(vec3(2.6, 1.0, 0.3), vec3(6.0, 4.4, 2.2), core) * 2.0);
    }
    vec2 q = p - vec2(THRX, FLOORY);
    bool seatPart = uSeat > 0.5 && abs(q.x) < 8.2 && q.y < 11.2 && q.y > -0.4;
    if (!seatPart) {
      // candle stand: blackened iron, the wax candle ivory
      float wx = 1e3;
      for (int c = 0; c < 2; c++) {
        vec2 cp = c == 0 ? uCandP.xy : uCandP.zw;
        wx = min(wx, sdBox2(p - cp - vec2(0.0, -2.05), vec2(0.42, 1.15)));
      }
      if (wx < 0.02) { Mat m = mPaper(lin(vec3(0.82, 0.74, 0.58))); m.trans = 0.8; m.tear = 0.0; m.seed = 31.0; return m; }
      Mat m = mCard(lin(vec3(0.06, 0.055, 0.05))); m.kind = K_SILVER; m.alb = lin(vec3(0.2, 0.19, 0.18)); m.seed = 32.0; return m;
    }
    // the seat front: thin dark wood with gold-foil bands, arms and knobs
    float band = min(abs(q.y - 6.9) - 0.35, abs(q.y - 0.9) - 0.25);
    bool knob = min(length(q - vec2(-6.6, 9.9)), length(q - vec2(6.6, 9.9))) < 1.15;
    bool panel = abs(q.x) < 5.4 && q.y < 6.55;
    if (band < 0.0 || knob) return goldLeaf(p, 33.0);
    Mat m = mCard(lin(vec3(0.27, 0.16, 0.085)));
    m.kind = K_WOOD; m.alb = woodGrain(p, m.alb, 34.0);
    if (panel) {
      // an incised gold-foil diamond pattern on the panel
      vec2 r = vec2(mod(q.x + 1.4, 2.8) - 1.4, mod(q.y - 1.2, 2.8) - 1.4);
      float dm = abs(r.x) + abs(r.y) - 0.9;
      if (abs(dm) < 0.14) return goldLeaf(p, 35.0);
      m.alb *= 0.75;
    }
    m.alb *= 1.0 - 0.35 * hatch(p * 1.2, 0.3 * smoothstep(4.0, 0.0, q.y), 1.6);
    m.seed = 36.0; return m;
  }
  if (i == 4) return figLayerMat(p, 2.0);
  if (i == 5) {
    vec2 q = p - vec2(THRX, FLOORY);
    float inner = sdBox2(q - vec2(0.0, 12.0), vec2(4.6, 10.4));
    float border = abs(inner) - 0.4;
    float crest = abs(length(q - vec2(0.0, 26.0)) - 1.6) - 0.5;
    bool finial = length(vec2(abs(q.x) - 6.3, q.y - 26.6)) < 1.1 || length(q - vec2(0.0, 31.4)) < 0.95 || (abs(abs(q.x) - 6.3) < 0.65 && q.y > 26.5);
    if (border < 0.0 || crest < 0.0 || finial || (q.y > 24.3 && sdTri(q, vec2(-5.0, 24.7), vec2(5.0, 24.7), vec2(0.0, 30.2)) > -0.45)) return goldLeaf(p, 41.0);
    Mat m = mCard(lin(vec3(0.26, 0.155, 0.08)));
    m.kind = K_WOOD; m.alb = woodGrain(p, m.alb, 42.0);
    if (inner < 0.0) {
      // the cushion back: worn purple-black cloth, a faded sun-disc of gold thread
      m = mPaper(lin(vec3(0.34, 0.1, 0.09)));
      m.kind = K_FABRIC; m.fuzz = 0.05; m.tear = 0.3;
      m.alb *= 0.75 + 0.4 * vnoise(p * vec2(1.0, 7.0));
      float disc = abs(length(q - vec2(0.0, 16.5)) - 2.4) - 0.12;
      float rays = abs(sin(atan(q.y - 16.5, q.x) * 8.0)) - 0.5;
      if (disc < 0.0 || (length(q - vec2(0.0, 16.5)) < 2.2 && length(q - vec2(0.0, 16.5)) > 1.2 && rays > 0.3)) return goldLeaf(p, 43.0);
    }
    m.seed = 44.0; return m;
  }
  if (i == 6) {
    // hangings: distressed fabric, dried-blood crimson and soot, threads of dull gold
    Mat m = mPaper(lin(vec3(0.17, 0.045, 0.04)));
    m.kind = K_FABRIC; m.trans = 0.4; m.fuzz = 0.12; m.tear = 0.9;
    if (p.y > 27.0) { m = mCard(lin(vec3(0.12, 0.08, 0.05))); m.kind = K_WOOD; return m; }
    float xx = mod(p.x + 60.0, 1.0);
    m.alb *= 0.6 + 0.5 * vnoise(vec2(p.x * 9.0, p.y * 0.4));
    float stripe = smoothstep(0.1, 0.0, abs(fract(p.y / 5.0) - 0.5) - 0.42);
    m.alb = mix(m.alb, lin(vec3(0.5, 0.38, 0.17)), stripe * 0.6);
    m.alb *= 1.0 - 0.5 * smoothstep(0.55, 0.85, fbm(p * 0.5 + 9.0, 3));   // worn, moth-eaten dark
    m.seed = 61.0; return m;
  }
  if (i == 7) {
    // the wall: dark plaster laid on card, brush strokes, cracks, a painted frieze at the top
    vec3 a = lin(vec3(0.24, 0.205, 0.17));
    a *= 0.7 + 0.4 * brush(p * 0.6, 0.3, 71.0);
    vec2 cr = cracks(p * 0.5, 0.4);
    a *= 1.0 - 0.35 * smoothstep(0.08, 0.0, cr.x) * step(0.6, hash11(cr.y * 7.0));
    float fr = smoothstep(0.1, 0.0, abs(p.y - 28.5) - 1.4);
    float zig = step(0.0, sin(p.x * 1.6) * 0.9 - (p.y - 28.5));
    a = mix(a, lin(vec3(0.36, 0.17, 0.09)) * (0.7 + 0.3 * zig), fr * 0.8);
    a *= 1.0 - 0.45 * smoothstep(-2.0, -9.0, p.y);    // darker toward the floor
    // around windows and the door a carved frame
    float wf = 1e3;
    for (int k = 0; k < 3; k++) wf = min(wf, abs(winHole(p, k)) - 0.6);
    float df = abs(doorHole(p)) - 1.0;
    if (df < 0.0) return goldLeaf(p, 72.0);
    Mat m = mPaper(a);
    if (wf < 0.0) { m = mCard(lin(vec3(0.24, 0.15, 0.08))); m.kind = K_WOOD; m.alb = woodGrain(p, m.alb, 73.0); }
    // the lattice bars inside the windows
    float wh = 1e3;
    for (int k = 0; k < 3; k++) wh = min(wh, winHole(p, k));
    if (wh < 0.0) { m = mCard(lin(vec3(0.18, 0.11, 0.06))); m.kind = K_WOOD; m.alb = woodGrain(p * 3.0, m.alb, 74.0); }
    m.trans = 0.12; m.tear = 0.0; m.seed = 75.0; return m;
  }
  if (i == 8) {
    // the fancy door: gold foil over wood, incised panels, rosettes, studs; the meeting edge dark
    vec2 lq;
    float side = p.x < DOORX + (DOORHW * mix(1.0, 0.16, uDoor) - DOORHW) * 0.0 ? -1.0 : 1.0;
    side = p.x < DOORX ? -1.0 : 1.0;
    leafSD(p, side, uDoor, lq);
    float u = lq.x;   // 0 at the hinge, 1 at the meeting edge
    float w = DOORHW * mix(1.0, 0.16, uDoor);
    vec2 r = vec2(u * DOORHW, p.y - FLOORY);    // leaf coordinates before foreshortening
    Mat m = goldLeaf(vec2(r.x * side, r.y) + vec2(side * 3.0, 0.0), 81.0 + side);
    // incised panels: two tall panels framed by dark lines, a rosette in each, studs in a grid
    float pan = min(sdBox2(r - vec2(3.5, 6.0), vec2(2.4, 4.6)), sdBox2(r - vec2(3.5, 16.2), vec2(2.4, 4.4)));
    float line = abs(pan) - 0.16;
    vec2 rc = r - vec2(3.5, r.y < 11.1 ? 6.0 : 16.2);
    float ros = abs(length(rc) - 1.5) - 0.12;
    float petals = abs(sin(atan(rc.y, rc.x) * 4.0)) * 1.4 - length(rc);
    float stud = length(vec2(mod(r.x, 1.4) - 0.7, mod(r.y, 1.4) - 0.7)) - 0.17;
    float edge = 1.0 - u;
    vec3 dark = lin(vec3(0.06, 0.035, 0.02));
    if (line < 0.0 || ros < 0.0 || (petals > 0.0 && length(rc) < 1.4 && length(rc) > 0.3)) { m = mCard(dark); m.kind = K_WOOD; }
    else if (pan > 0.2 && stud < 0.0) m.alb *= 1.35;
    if (edge * DOORHW < 0.12) { m = mCard(dark); }
    // the swung leaf turns away from the room light
    m.alb *= mix(1.0, 0.35, uDoor);
    return m;
  }
  if (i == 9) return figLayerMat(p, 3.0);
  if (i == 10) {
    // the corridor beyond: dark stone, a faint lamp far down it
    Mat m = mPaper(lin(vec3(0.12, 0.1, 0.085)) * (0.7 + 0.4 * brush(p, 1.5, 91.0)));
    m.alb *= 1.0 - 0.6 * hatch(p * 0.8, 0.5, 1.4);
    return m;
  }
  if (i == 11) {
    // the night sky: indigo-grey wash on parchment, darker at the top; each window can be dimmed
    vec3 a = mix(lin(vec3(0.42, 0.45, 0.52)), lin(vec3(0.12, 0.13, 0.18)), smoothstep(0.0, 40.0, p.y));
    a *= 0.75 + 0.4 * brush(p * 0.4, 0.1, 111.0);
    float k = p.x < ${((ROOM.win[0] + ROOM.win[1]) / 2).toFixed(1)} ? uWin.x : (p.x < ${((ROOM.win[1] + ROOM.win[2]) / 2).toFixed(1)} ? uWin.y : uWin.z);
    Mat m = mPaper(a * k); m.trans = 0.75; m.tear = 0.0; m.seed = 112.0; return m;
  }
  return mGlow(vec3(1.6, 1.75, 2.2) * mix(0.4, 1.0, max(uWin.x, max(uWin.y, uWin.z))));
}
` + PAPER_TRACE;

// ---------- JavaScript helpers ----------
export function setTones(u, list) {
  // list: up to 7 TONES entries (or null)
  const a = new Array(21).fill(0.2), b = new Array(21).fill(0.1);
  list.forEach((t, k) => { if (!t) return; for (let j = 0; j < 3; j++) { a[k * 3 + j] = t[0][j]; b[k * 3 + j] = t[1][j]; } });
  u.uTone.value = a; u.uTone2.value = b;
}
// The usual lights of the room. opts: moon (k), candles (k), key (k), extra lights
export function roomLights(t, { moon = 1.6, cand = 1.0, candA = 1, candB = 1, key = 0.6, shaft = true, extra = [], candP = null, still = 0 } = {}) {
  const cp = candP ?? [ROOM.candA[0], ROOM.candA[1], ROOM.candB[0], ROOM.candB[1]];
  const fA = mix1(flicker(t, 1.3), 1, still), fB = mix1(flicker(t, 4.1), 1, still);
  return [
    { dir: [-0.32, 0.36, 0.88], col: L(150, 170, 220, moon), rad: 1.2, shaft },
    candA ? { pos: [cp[0], cp[1] + 0.6, 21.0], col: L(255, 150, 70, 10 * cand * candA * fA), rad: 0.5, range: 9 } : null,
    candB ? { pos: [cp[2], cp[3] + 0.6, 21.0], col: L(255, 150, 70, 10 * cand * candB * fB), rad: 0.5, range: 9 } : null,
    key ? { dir: [-0.62, 0.42, -0.66], col: L(150, 160, 195, key), rad: 2 } : null,
    ...extra,
  ].filter(Boolean).slice(0, 6);
}
const mix1 = (a, b, k) => a + (b - a) * k;
// where a figure's near hand is (world xy), from its pose array
export function handOf(a) {
  const [x, y, s, face, lean, , sh, el] = a;
  const R = (ang, v) => [Math.cos(ang) * v[0] - Math.sin(ang) * v[1], Math.sin(ang) * v[0] + Math.cos(ang) * v[1]];
  // the puppet's joints turn clockwise for a positive angle (GLSL rot)
  const e = R(-sh, [0, -3.4]);
  const f = R(-(sh + el), [0, -3.5]);
  let h = [0.3 + e[0] + f[0], 15.1 + e[1] + f[1]];
  const r = R(-lean, [h[0], h[1] - 10.4]);
  h = [r[0], r[1] + 10.4];
  return [x + s * h[0] * face, y + s * h[1]];
}
export { pose };
