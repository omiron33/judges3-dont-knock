// The porch outside the summer room, at night: the gold double doors seen from outside in a wall of
// dark dressed stone under the porch roof, a column of fluted card in the foreground, the porch open
// to the moonlit sky on the right. A big box lock of blackened iron sits on the right leaf with a
// cutaway window into its works: three brass tumblers and the bolt. The great brass key (uKey) goes
// in from the side and turns (its bow foreshortening as it rolls over), the tumblers lift and the
// bolt shoots across into the other leaf. A guard dozes against the wall by the door.
//
// Sheets: 0 foreground column and the porch floor's edge (z 0), 1 Ehud (z 12), 2 key (z 12.6),
// 3 lock box (z 13), 4 lock works (z 13.4), 5 the guard (z 13.7), 6 door leaves (z 14), 7 the wall
// and porch roof (z 15), 8 the room seen through the doors (z 24), 9 night sky (z 60), 10 light box.
import { PAPER_HEAD, PAPER_TRACE, PAPER_UNIFORMS } from '/song/lib/paper.js';
import { PUPPET_GLSL } from '/song/lib/puppet.js';
import { OFF, TONES } from '/song/lib/x-throne.js';

export const PORCH = { doorX: 6, doorHW: 6.5, floor: -8, doorTop: 13, lock: [2.0, 3.75], lockS: 0.62, Z: { ehud: 12, key: 12.6, lock: 13, guard: 13.7, door: 14, wall: 15 } };

export const PORCH_UNIFORMS = {
  ...PAPER_UNIFORMS,
  uF0: OFF, uF1: OFF,
  uDoor: 0,             // 0 shut .. 1 open
  uKey: [0, 0, 0],      // inserted (0 out .. 1 in), turn (radians about its shaft), shown
  uLockK: 0,            // the works: 0 unlocked .. 1 locked (tumblers up, bolt across)
  uTone: new Array(6).fill(0.2), uTone2: new Array(6).fill(0.1),
  uCarryK: 0,           // 1: the key is in Ehud's hand (pocketing)
};

const f1 = (v) => v.toFixed(2);
export const PORCH_GLSL = PAPER_HEAD + PUPPET_GLSL + /* glsl */ `
uniform float uF0[12], uF1[12];
uniform float uDoor, uLockK, uCarryK;
uniform vec3 uKey;
uniform float uTone[6], uTone2[6];
#define NL 11
#define DX ${f1(PORCH.doorX)}
#define DHW ${f1(PORCH.doorHW)}
#define FL ${f1(PORCH.floor)}
#define DTOP ${f1(PORCH.doorTop)}
const vec2 LC = vec2(${f1(PORCH.lock[0])}, ${f1(PORCH.lock[1])});
#define LS ${f1(PORCH.lockS)}
float sheetZ(int i, vec2 p) {
  if (i == 0) return 0.0;
  if (i == 1) return ${f1(PORCH.Z.ehud)};
  if (i == 2) return ${f1(PORCH.Z.key)};
  if (i == 3) return ${f1(PORCH.Z.lock)};
  if (i == 4) return 13.4;
  if (i == 5) return ${f1(PORCH.Z.guard)};
  if (i == 6) return ${f1(PORCH.Z.door)};
  if (i == 7) return ${f1(PORCH.Z.wall)};
  if (i == 8) return 24.0;
  if (i == 9) return 60.0;
  return 66.0;
}
float sheetOpac(int i) { return i == 10 ? 0.0 : (i == 9 ? 0.95 : 1.0); }
float arch(vec2 p, float cx, float hw, float y0, float y1) {
  return min(sdBox2(p - vec2(cx, (y0 + y1) * 0.5), vec2(hw, (y1 - y0) * 0.5)), sdCircle(p - vec2(cx, y1), hw));
}
float doorHole(vec2 p) { return arch(p, DX, DHW, FL - 2.0, DTOP); }
// the lock rides the left leaf: map a point back to the leaf's unswung coordinates
vec2 onLeaf(vec2 p) {
  float hinge = DX - DHW;
  float w = DHW * mix(1.0, 0.18, uDoor);
  return vec2(hinge + (p.x - hinge) * DHW / w, p.y);
}
// ---- the key: bow (a ring with a quatrefoil cut), shaft, bit; in key space (x along the shaft) ----
float keySD(vec2 q, float turn) {
  // turning about its shaft: the bow and the bit foreshorten in y (cos) and flip
  float c = cos(turn);
  float sy = max(abs(c), 0.08);
  vec2 b = vec2(q.x, q.y / sy);
  float bow = abs(length(b - vec2(-3.2, 0.0)) - 1.15) - 0.38;
  bow = min(bow, sdCircle(b - vec2(-3.2, 0.0), 0.32));
  float shaft = sdBox2(q - vec2(0.2, 0.0), vec2(2.7, 0.24));
  shaft = min(shaft, sdBox2(q - vec2(-1.85, 0.0), vec2(0.25, 0.42)));
  return min(bow, shaft);
}
// the bit at the end of the shaft, inside the lock: swings round the shaft (y = sin of the turn)
float bitSD(vec2 q, float turn) {
  float s = sin(turn), c = cos(turn);
  float h = 0.95 * c;
  vec2 a = vec2(2.3, 0.0), b = vec2(2.3, h);
  float d = sdBox2(q - vec2(2.35, h * 0.5), vec2(0.42, abs(h) * 0.5 + 0.12));
  return d;
}
vec2 keySpace(vec2 p) {
  // the key enters the lock's left side along +x; uKey.x slides it in
  vec2 q = (p - LC) / LS;
  q.x -= -4.6 + 3.0 * uKey.x;
  return q;
}
float keyLayer(vec2 p) {
  if (uKey.z < 0.5) return 1e3;
  vec2 q = keySpace(p);
  // only the part outside the lock box shows on this flat
  float box = sdBox2((p - LC) / LS, vec2(3.6, 2.6));
  return max(keySD(q, uKey.y), -box) * LS;
}
// ---- the lock box: blackened iron plate, rivets, a cutaway window into the works ----
float lockBox(vec2 p, bool hq) {
  vec2 q = (p - LC) / LS;
  float d = sdBox2(q, vec2(3.6, 2.6)) - 0.15;
  float win = sdBox2(q - vec2(0.9, 0.1), vec2(2.25, 1.75));
  d = max(d, -win);
  // the keeper on the other leaf: a small iron box the bolt shoots into
  d = min(d, sdBox2(q - vec2(5.2, -0.75), vec2(0.8, 0.95)));
  return d * LS;
}
float lockWorks(vec2 p) {
  vec2 q = (p - LC) / LS;
  return (sdBox2(q - vec2(0.9, 0.1), vec2(2.4, 1.9))) * LS;
}
Mat worksMat(vec2 p) {
  vec2 q = (p - LC) / LS;
  // the inside of the lock: dark iron backplate; the bolt; three tumblers; the bit of the key
  Mat m = mCard(lin(vec3(0.05, 0.045, 0.04)));
  m.kind = K_SILVER; m.alb = lin(vec3(0.1, 0.095, 0.09)) * (0.6 + 0.6 * vnoise(q * 5.0));
  float bx = mix(-0.2, 2.0, uLockK);
  float bolt = sdBox2(q - vec2(bx, -0.75), vec2(1.6, 0.36));
  float tum = 1e3;
  for (int k = 0; k < 3; k++) {
    float x = 0.55 + float(k) * 0.75;
    float lift = uLockK * (0.55 + 0.12 * float(k));
    tum = min(tum, sdBox2(q - vec2(x, 0.75 + lift), vec2(0.22, 0.62)));
    tum = min(tum, sdBox2(q - vec2(x, 1.35 + lift * 0.5), vec2(0.06, 0.6)));  // spring wire
  }
  float bit = uKey.z > 0.5 ? bitSD(keySpace(p), uKey.y) : 1e3;
  if (bit < 0.0 || tum < 0.0 || bolt < 0.0) {
    Mat b = mFoil(lin(vec3(0.78, 0.58, 0.3)), true);
    if (bolt < 0.0) b.alb *= 0.8;
    b.alb *= 0.7 + 0.3 * smoothstep(0.0, 0.03, cracks(p, 4.0).x);
    return b;
  }
  return m;
}
// ---- figures ----
float figs(vec2 p, int which, bool hq, out Fig fo) {
  if (which == 0) fo = figAt(uF0); else fo = figAt(uF1);
  if (fo.scale < 0.01) return 1e3;
  int pt; vec2 lp; float sh;
  float d = figure(p, fo, pt, lp, sh, hq);
  if (which == 1) {
    // the guard's spear, leaning against his shoulder
    d = min(d, sdSeg(p, fo.pos + vec2(1.6 * fo.face, 0.0) * fo.scale, fo.pos + vec2(-1.8 * fo.face, 23.0) * fo.scale, 0.12));
    d = min(d, sdTaper(p, fo.pos + vec2(-1.8 * fo.face, 22.6) * fo.scale, fo.pos + vec2(-2.05 * fo.face, 25.5) * fo.scale, 0.38, 0.02));
  }
  return d;
}
// ---- the stone wall, porch roof and the open side ----
float wallSD(vec2 p, bool hq) {
  float d = -1.0;
  d = max(d, -doorHole(p));
  // the porch opens to the night on the right, between the wall's end and the next column
  d = max(d, -sdBox2(p - vec2(46.0, 6.0), vec2(14.0, 16.0)));
  return d;
}
float columnSD(vec2 p, float x, float w) {
  float d = sdBox2(p - vec2(x, 0.0), vec2(w, 60.0));
  return d;
}
float sheetSD(int i, vec2 p, bool hq) {
  Fig f;
  if (i == 0) {
    float col = columnSD(p, -27.0, 3.6);
    col = min(col, sdBox2(p - vec2(-27.0, 15.5), vec2(4.6, 0.8)));   // capital
    float floorRow = torn(p.y - (FL - 3.2 + 0.2 * sin(p.x * 0.4)), p, 0.15, 3.0, hq);
    return min(cut(col, p, 1.0), floorRow);
  }
  if (i == 1) return figs(p, 0, hq, f);
  if (i == 2) return keyLayer(p);
  if (i == 3) return lockBox(onLeaf(p), hq);
  if (i == 4) return lockWorks(onLeaf(p));
  if (i == 5) return figs(p, 1, hq, f);
  if (i == 6) {
    // two leaves hinged at the jambs; open narrows each toward its hinge
    float w = DHW * mix(1.0, 0.18, uDoor);
    float l = max(doorHole(p) + 0.0, max(p.x - (DX - DHW + w), -(p.x - (DX - DHW))));
    float r = max(doorHole(p), max((DX + DHW - w) - p.x, p.x - (DX + DHW)));
    return min(l, r) + 0.0 * w;
  }
  if (i == 7) {
    float d = wallSD(p, hq);
    // a second column and the floor of the porch
    d = min(d, columnSD(p, 32.0, 2.6));
    return d;
  }
  if (i == 8) return max(-1.0, doorHole(p) - 2.0);
  if (i == 9) return -1.0;
  return -1.0;
}
vec3 stone(vec2 p) {
  // dressed stone in courses, charcoal joints, worn
  vec2 c = vec2(p.x / 6.0 + 0.5 * floor(p.y / 3.0), p.y / 3.0);
  vec2 f = fract(c);
  float joint = smoothstep(0.06, 0.0, min(min(f.x, 1.0 - f.x) * 6.0, min(f.y, 1.0 - f.y) * 3.0) - 0.12);
  vec3 a = lin(vec3(0.3, 0.27, 0.23)) * (0.7 + 0.35 * hash12(floor(c)) ) * (0.75 + 0.35 * brush(p * 0.7, 0.2, 4.0));
  return a * (1.0 - 0.7 * joint);
}
Mat goldLeafP(vec2 p, float seed) {
  Mat m = mFoil(lin(vec3(0.7, 0.53, 0.27)), true);
  m.alb *= 0.45 + 0.55 * smoothstep(0.0, 0.03, cracks(p, 1.1).x);
  m.alb *= 1.0 - 0.35 * smoothstep(0.5, 0.8, fbm(p * 0.25 + seed, 3));
  m.alb *= 0.7; m.seed = seed;
  return m;
}
Mat sheetMat(int i, vec2 p, float sd) {
  if (i == 0) {
    if (p.y < FL - 2.6) { Mat m = mCard(stone(p * vec2(1.0, 2.0)) * 0.55); m.tear = 0.4; return m; }
    // the column: fluted card, lit down one side
    vec3 c = lin(vec3(0.32, 0.29, 0.25));
    float fl = 0.5 + 0.5 * cos((p.x + 27.0) * 3.4);
    c *= 0.45 + 0.55 * fl;
    c *= 0.7 + 0.35 * brush(p * 0.6, 1.57, 2.0);
    Mat m = mCard(c); m.seed = 1.0; return m;
  }
  if (i == 1 || i == 5) {
    Fig f; float d = figs(p, i == 1 ? 0 : 1, true, f);
    int pt; vec2 lp; float sh;
    float df = figure(p, f, pt, lp, sh, true);
    int k = i == 1 ? 0 : 1;
    vec3 t1 = vec3(uTone[k * 3], uTone[k * 3 + 1], uTone[k * 3 + 2]);
    vec3 t2 = vec3(uTone2[k * 3], uTone2[k * 3 + 1], uTone2[k * 3 + 2]);
    if (df > 0.02) {
      // the spear
      if (p.y > f.pos.y + 22.4 * f.scale) { Mat m = mFoil(lin(vec3(0.62, 0.42, 0.22)), true); return m; }
      Mat m = mCard(lin(vec3(0.3, 0.2, 0.11))); m.kind = K_WOOD; return m;
    }
    Mat m = figMat(pt, lp, sh, f, t1, t2);
    if (m.kind == K_FABRIC || pt == PT_FACE || pt == PT_HAND || pt == PT_LEG || pt == PT_FARLEG) { m.trans *= 0.3; m.fuzz *= 0.6; }
    if (f.style == 5.0 && pt == PT_BEARD) { m = mPaper(lin(vec3(0.6, 0.46, 0.34)) * (1.0 - 0.45 * sh)); m.tear = 0.0; m.fuzz = 0.0; m.trans = 0.1; }
    return m;
  }
  if (i == 2) {
    Mat m = mFoil(lin(vec3(0.8, 0.6, 0.3)), true);
    m.alb *= 0.6 + 0.4 * smoothstep(0.0, 0.03, cracks(p, 3.0).x);
    m.alb *= mix(0.55, 1.0, abs(cos(uKey.y)));
    m.seed = 21.0; return m;
  }
  if (i == 3) {
    p = onLeaf(p);
    vec2 q = (p - LC) / LS;
    Mat m = mCard(lin(vec3(0.08, 0.075, 0.07)));
    m.kind = K_SILVER; m.alb = lin(vec3(0.16, 0.15, 0.14)) * (0.6 + 0.6 * fbm(q * 2.0, 3));
    // rivets at the corners and a brass rim round the cutaway
    vec2 rq = abs(q) - vec2(3.2, 2.2);
    if (length(rq) < 0.28) { Mat g = mFoil(lin(vec3(0.7, 0.52, 0.27)), true); return g; }
    float rim = abs(sdBox2(q - vec2(0.9, 0.1), vec2(2.25, 1.75))) - 0.14;
    if (rim < 0.0) { Mat g = mFoil(lin(vec3(0.7, 0.52, 0.27)), true); g.alb *= 0.8; return g; }
    // the keyhole slot on the left side
    if (sdBox2(q - vec2(-3.0, 0.0), vec2(0.5, 0.2)) < 0.0) m.alb *= 0.15;
    m.seed = 31.0; return m;
  }
  if (i == 4) return worksMat(onLeaf(p));
  if (i == 6) {
    float side = p.x < DX ? -1.0 : 1.0;
    float w = DHW * mix(1.0, 0.18, uDoor);
    float hinge = DX + side * DHW;
    float u = (hinge - p.x) * side / w;
    vec2 r = vec2(u * DHW, p.y - FL);
    Mat m = goldLeafP(vec2(r.x * side, r.y) + vec2(side * 3.0, 0.0), 61.0 + side);
    float pan = min(sdBox2(r - vec2(3.2, 5.5), vec2(2.2, 4.2)), sdBox2(r - vec2(3.2, 15.0), vec2(2.2, 4.0)));
    float line = abs(pan) - 0.15;
    vec2 rc = r - vec2(3.2, r.y < 10.2 ? 5.5 : 15.0);
    float ros = abs(length(rc) - 1.4) - 0.11;
    float petals = abs(sin(atan(rc.y, rc.x) * 4.0)) * 1.3 - length(rc);
    float stud = length(vec2(mod(r.x, 1.3) - 0.65, mod(r.y, 1.3) - 0.65)) - 0.16;
    vec3 dark = lin(vec3(0.06, 0.035, 0.02));
    if (line < 0.0 || ros < 0.0 || (petals > 0.0 && length(rc) < 1.3 && length(rc) > 0.28)) { m = mCard(dark); m.kind = K_WOOD; }
    else if (pan > 0.2 && stud < 0.0) m.alb *= 1.35;
    if ((1.0 - u) * DHW < 0.12) m = mCard(dark);
    m.alb *= mix(1.0, 0.35, uDoor);
    return m;
  }
  if (i == 7) {
    if (sdBox2(p - vec2(32.0, 0.0), vec2(2.6, 60.0)) < 0.0) {
      vec3 c = lin(vec3(0.3, 0.27, 0.23)) * (0.45 + 0.55 * (0.5 + 0.5 * cos((p.x - 32.0) * 3.4)));
      Mat m = mCard(c); return m;
    }
    vec3 a = stone(p);
    // the porch roof: dark beams across the top
    if (p.y > 22.0) a = lin(vec3(0.09, 0.065, 0.045)) * (0.7 + 0.5 * vnoise(vec2(p.x * 0.3, p.y * 3.0)));
    if (abs(doorHole(p)) < 1.1) return goldLeafP(p, 71.0);
    if (p.y < FL) a *= 0.6;
    Mat m = mPaper(a); m.trans = 0.05; m.tear = 0.0; m.seed = 72.0; return m;
  }
  if (i == 8) {
    // the summer room glimpsed through the doors: dark, one warm glow
    vec3 a = lin(vec3(0.18, 0.12, 0.08)) * (0.6 + 0.5 * brush(p, 0.5, 8.0));
    Mat m = mPaper(a); m.seed = 81.0; return m;
  }
  if (i == 9) {
    vec3 a = mix(lin(vec3(0.36, 0.4, 0.5)), lin(vec3(0.1, 0.11, 0.16)), smoothstep(-5.0, 30.0, p.y));
    a *= 0.75 + 0.4 * brush(p * 0.4, 0.1, 9.0);
    Mat m = mPaper(a); m.trans = 0.75; m.tear = 0.0; return m;
  }
  return mGlow(vec3(1.5, 1.65, 2.1));
}
` + PAPER_TRACE;

export function porchTones(u) {
  const a = new Array(6).fill(0.2), b = new Array(6).fill(0.1);
  [TONES.ehud, TONES.guard].forEach((t, k) => { for (let j = 0; j < 3; j++) { a[k * 3 + j] = t[0][j]; b[k * 3 + j] = t[1][j]; } });
  u.uTone.value = a; u.uTone2.value = b;
}
