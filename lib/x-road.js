// The road world's shared kit (scenes 01, 02, 03, 08): the paper donkey, cut-card palms, carved
// standing stones, a turban to sit on a fat man's head, Ehud's colours and the JavaScript that walks
// a puppet on twos. GLSL here goes after PAPER_HEAD + PUPPET_GLSL.

// Ehud's colours (shared with the other workers' scenes)
export const ROAD_LIB = /* glsl */ `
#define EHUD_TUNIC lin(vec3(0.42, 0.2, 0.11))
#define EHUD_BELT lin(vec3(0.12, 0.08, 0.05))

// a point in a figure's head frame (the frame fHead/fCrown use)
vec2 headLocal(vec2 p, Fig f) {
  vec2 q = (p - f.pos) / f.scale; q.x *= f.face;
  vec2 qw = jnt(q, vec2(0.0, 10.4), f.lean) + vec2(0.0, 10.4);
  return jnt(qw, vec2(0.4, 16.6), f.head) + vec2(0.4, 16.6) - vec2(0.42, 17.6);
}
// a wrapped cloth turban dome over the head (hides a crown), world units
float turbanSD(vec2 p, Fig f) {
  vec2 h = headLocal(p, f);
  float d = sdEllipsoid(vec3(h - vec2(-0.12, 1.25), 0.0), vec3(1.2, 0.95, 1.0));
  d = max(d, -(h.y - 0.55 - 0.25 * h.x));
  return d * f.scale;
}

// ---------------- the donkey ----------------
// A paper donkey in profile, feet at pos, facing +x (face -1 mirrors), withers about 12 units high.
// gait: the stride phase (radians); load: 1 with panniers and a jar.
// parts: 1 pack, 2 near legs, 3 head and neck, 4 ears and mane, 5 body, 6 tail, 7 far legs, 8 blanket
float donkey(vec2 p, vec2 pos, float sc, float face, float gait, float bob, float load, out int part, out vec2 lp) {
  vec2 q = (p - pos) / sc; q.x *= face; lp = q;
  part = 0;
  float bnd = sdBox2(q - vec2(1.5, 10.0), vec2(11.0, 11.0));
  if (bnd > 0.5) return bnd * sc;
  float g = sin(gait), g2 = sin(gait + 1.6);
  float by = 0.25 * abs(cos(gait));
  vec2 qb = q - vec2(0.0, by);
  // legs: thigh to hoof, the knee bending on the back swing
  float nl = 1e3, fl = 1e3;
  for (int k = 0; k < 4; k++) {
    float fx = k < 2 ? 4.2 : -4.4;
    float ph = (k == 0 || k == 3) ? g : -g;
    bool farLeg = k == 1 || k == 2;
    vec2 a = vec2(fx + (farLeg ? -0.6 : 0.0), 7.4);
    vec2 kn = a + vec2(ph * 1.0, -3.6);
    vec2 ho = kn + vec2(ph * 0.5 + max(0.0, -ph) * 0.8, -3.4 + max(0.0, -ph) * 0.5);
    float d = min(sdTaper(qb, a, kn, k < 2 ? 1.15 : 1.45, 0.62), sdTaper(qb, kn, ho, 0.62, 0.5));
    d = min(d, sdBox2(qb - ho - vec2(0.1, 0.05), vec2(0.5, 0.25)));
    if (farLeg) fl = min(fl, d); else nl = min(nl, d);
  }
  // body, neck, head
  float body = sdEllipsoid(vec3(qb - vec2(0.0, 8.7), 0.0), vec3(6.5, 3.4, 1.0));
  body = smin(body, sdCircle(qb - vec2(-4.5, 9.0), 2.9), 1.0);
  vec2 hb = qb + vec2(0.0, bob);
  float neck = sdTaper(hb, vec2(4.4, 9.6), vec2(7.4, 13.7), 2.5, 1.6);
  float head = sdTaper(hb, vec2(7.6, 14.3), vec2(11.3, 11.5), 1.75, 1.0);
  head = smin(head, neck, 0.6);
  float ears = min(sdTaper(hb, vec2(7.0, 15.4), vec2(5.4, 19.6), 0.7, 0.18), sdTaper(hb, vec2(7.7, 15.5), vec2(7.6, 19.9), 0.7, 0.18));
  float mane = sdTaper(hb, vec2(4.0, 11.6), vec2(6.9, 15.6), 0.6, 0.4) - 0.12 * abs(sin(hb.y * 9.0));
  float tail = min(sdTaper(qb, vec2(-6.6, 9.8), vec2(-7.6 - 0.4 * g2, 4.4), 0.38, 0.2), sdTaper(qb, vec2(-7.6 - 0.4 * g2, 5.0), vec2(-7.7 - 0.5 * g2, 3.0), 0.5, 0.15));
  // the load: a sack on the near side, a bundle and a jar on top
  float pack = 1e3, blanket = 1e3;
  if (load > 0.0) {
    pack = sdBox2(qb - vec2(-0.6, 8.6), vec2(2.3, 2.2)) - 0.5;
    pack = smin(pack, sdCircle(qb - vec2(-0.6, 11.1), 1.2), 0.8);
    pack = min(pack, sdEllipsoid(vec3(qb - vec2(2.0, 12.3), 0.0), vec3(1.7, 0.85, 1.0)));
    float jar = sdEllipsoid(vec3(qb - vec2(-1.2, 13.3), 0.0), vec3(1.15, 1.45, 1.0));
    jar = min(jar, sdBox2(qb - vec2(-1.2, 14.9), vec2(0.45, 0.45)));
    pack = min(pack, jar);
    blanket = max(sdBox2(qb - vec2(-0.5, 9.9), vec2(3.6, 2.4)), body - 0.3);
  }
  if (pack < 0.0) { part = 1; return pack * sc; }
  if (nl < 0.0) { part = 2; lp = qb; return nl * sc; }
  if (ears < 0.0) { part = 4; return ears * sc; }
  if (mane < 0.0) { part = 4; return mane * sc; }
  if (head < 0.0) { part = 3; lp = hb; return head * sc; }
  if (blanket < 0.0) { part = 8; return blanket * sc; }
  if (body < 0.0) { part = 5; lp = qb; return body * sc; }
  if (tail < 0.0) { part = 6; return tail * sc; }
  if (fl < 0.0) { part = 7; return fl * sc; }
  float d = min(min(min(pack, nl), min(ears, mane)), min(min(head, body), min(tail, fl)));
  return d * sc;
}
Mat donkeyMat(int part, vec2 lp, float seed) {
  Mat m;
  vec3 hide = lin(vec3(0.3, 0.27, 0.24));
  if (part == 1) {
    m = mPaper(lin(vec3(0.4, 0.33, 0.23)));
    m.alb *= 0.8 + 0.3 * brush(lp * 3.0, 0.4, seed);
    m.alb *= 1.0 - 0.35 * hatch(lp * 1.6, 0.35, 2.0);
    // the cord round the sack
    m.alb *= 1.0 - 0.6 * smoothstep(0.12, 0.0, abs(lp.y - 10.0 - 0.2 * lp.x));
    if (length(lp - vec2(-1.2, 13.5)) < 1.8) { m = mPaper(lin(vec3(0.4, 0.2, 0.11))); m.alb *= 1.0 - 0.5 * smoothstep(0.1, 0.0, abs(lp.y - 13.9) - 0.08); m.tear = 0.0; }
    m.kind = K_FABRIC; m.tear = 0.3; m.fuzz = 0.05;
  } else if (part == 8) {
    m = mPaper(lin(vec3(0.36, 0.1, 0.07)));
    m.alb *= 0.8 + 0.4 * step(0.5, fract(lp.x * 0.7));
    m.kind = K_FABRIC; m.tear = 0.6; m.fuzz = 0.06;
  } else if (part == 4) {
    m = mPaper(lin(vec3(0.1, 0.085, 0.075))); m.tear = 1.0; m.fuzz = 0.06;
  } else if (part == 3) {
    m = mPaper(hide);
    m.alb = mix(m.alb, lin(vec3(0.46, 0.43, 0.38)), smoothstep(9.8, 11.0, lp.x));   // pale muzzle
    m.alb *= 1.0 - 0.85 * smoothstep(0.2, 0.0, length(lp - vec2(8.6, 14.0)) - 0.13);   // the eye
    m.alb *= 1.0 - 0.7 * smoothstep(0.15, 0.0, length(lp - vec2(11.4, 11.9)) - 0.12);   // nostril
    m.tear = 0.0; m.fuzz = 0.0;
  } else if (part == 5) {
    m = mPaper(hide);
    m.alb = mix(m.alb, lin(vec3(0.5, 0.46, 0.4)), smoothstep(7.6, 5.8, lp.y));   // pale belly
    m.alb *= 1.0 - 0.3 * hatch(lp * 1.2, 0.3 * smoothstep(8.4, 5.6, lp.y), 2.4);
    m.tear = 0.3;
  } else if (part == 7) {
    m = mPaper(hide * 0.45); m.tear = 0.0;
  } else if (part == 6) {
    m = mPaper(lin(vec3(0.12, 0.1, 0.08)));
  } else {
    m = mPaper(hide * 0.85); m.tear = 0.0;
    m.alb = mix(m.alb, lin(vec3(0.08, 0.06, 0.05)), step(lp.y, 0.6));   // hooves
  }
  m.seed = seed + float(part) * 3.0;
  return m;
}

// ---------------- palms of cut card ----------------
// a date palm: a curved ringed trunk from b, height h, bent by bend, its fronds stirred by sway
float palmSD(vec2 p, vec2 b, float h, float bend, float sway, float seed, out float ring) {
  ring = 0.0;
  vec2 q = p - b;
  if (sdBox2(q - vec2(bend * h * 0.3, h * 0.6), vec2(h * 0.75, h * 0.75)) > 1.0) return sdBox2(q - vec2(bend * h * 0.3, h * 0.6), vec2(h * 0.75, h * 0.75));
  // trunk as a curve: x = bend * h * s^2 * 0.3
  float s = sat(q.y / h);
  float cx = bend * h * 0.3 * s * s;
  float trunk = abs(q.x - cx) - h * mix(0.034, 0.022, s) - 0.04 * sin(q.y * 6.0 / max(h * 0.05, 0.1));
  trunk = max(trunk, max(-q.y, q.y - h));
  ring = s;
  vec2 top = vec2(bend * h * 0.3, h);
  float d = trunk;
  for (int k = 0; k < 8; k++) {
    float a = -2.5 + float(k) * 0.71 + (hash11(seed + float(k)) - 0.5) * 0.3 + sway * (0.6 + 0.4 * hash11(seed * 3.0 + float(k)));
    vec2 dir = vec2(cos(a + 1.57), sin(a + 1.57));
    float L = h * (0.33 + 0.12 * hash11(seed + float(k) * 7.0));
    vec2 m1 = top + dir * L * 0.5;
    vec2 e1 = m1 + vec2(dir.x * L * 0.45, -L * 0.42 + max(dir.y, 0.0) * L * 0.2);
    for (int j = 0; j < 2; j++) {
      vec2 a0 = j == 0 ? top : m1, a1 = j == 0 ? m1 : e1;
      vec2 pa = q - a0, ba = a1 - a0;
      float hh = sat(dot(pa, ba) / dot(ba, ba));
      float along = (float(j) + hh) * 0.5;
      float w = h * 0.06 * (1.0 - along * 0.8) * (0.3 + 0.7 * fract(along * 26.0 + seed));
      d = min(d, length(pa - ba * hh) - w);
    }
  }
  d = min(d, sdCircle(q - top, h * 0.035));
  return d;
}

// ---------------- carved standing stones ----------------
// a tall stone from base b, half width w, height h, leaning a little; carved with a crude idol face
float stoneSD(vec2 p, vec2 b, float w, float h, float lean, float seed, bool hq) {
  vec2 q = p - b;
  q.x -= lean * q.y;
  float taper = mix(1.0, 0.72, sat(q.y / h));
  float d = sdBox2(vec2(q.x / taper, q.y - h * 0.5), vec2(w, h * 0.5));
  d = smin(d, sdEllipsoid(vec3(q - vec2(0.0, h * 0.97), 0.0), vec3(w * 0.75, w * 0.6, 1.0)), w * 0.5);
  return torn(d, p, 0.35, seed, hq);
}
// the stone's surface: rough grey card, charcoal shading and an incised idol (heavy brow, deep
// almond eyes, a long nose ridge, a grim mouth, chevron bands below). carve: how deep the cut is.
vec3 stoneAlb(vec2 p, vec2 b, float w, float h, float lean, float seed, out float carve) {
  vec2 q = p - b; q.x -= lean * q.y;
  vec3 a = lin(vec3(0.34, 0.33, 0.31)) * (0.6 + 0.5 * brush(p * 0.8, 0.25 + 0.3 * hash11(seed), seed));
  a *= 1.0 - 0.22 * hatch(p * 0.9, 0.3 * smoothstep(-w * 0.2, w, q.x) + 0.1, 1.6);
  a *= 1.0 - 0.4 * smoothstep(0.5, 0.8, fbm(p * 0.25 + seed, 3));
  a *= 0.75 + 0.35 * smoothstep(0.0, h, q.y);
  float sx = 1.0 + 0.25 * (hash11(seed) - 0.5);
  vec2 f = (q - vec2(0.0, h * 0.74)) / w;
  f.x *= sx;
  // almond eyes, deep
  vec2 e1 = f - vec2(-0.36, 0.0), e2 = f - vec2(0.36, 0.0);
  float eye = min(sdEllipsoid(vec3(e1, 0.0), vec3(0.25, 0.09 + 0.03 * hash11(seed + 1.0), 1.0)), sdEllipsoid(vec3(e2, 0.0), vec3(0.25, 0.09, 1.0)));
  float rim = min(sdEllipsoid(vec3(e1, 0.0), vec3(0.33, 0.16, 1.0)), sdEllipsoid(vec3(e2, 0.0), vec3(0.33, 0.16, 1.0)));
  float brow = abs(f.y - 0.24 - 0.08 * abs(f.x)) - 0.06;
  brow = max(brow, abs(f.x) - 0.72);
  float nose = sdTaper(f, vec2(0.0, 0.18), vec2(0.0, -0.42), 0.06, 0.14);
  float mouth = abs(f.y + 0.68 + 0.12 * f.x * f.x) - 0.045;
  mouth = max(mouth, abs(f.x) - 0.38);
  // chevrons and a band of drilled dots lower down
  vec2 c = vec2(q.x / w, (q.y - h * 0.4) / w);
  float chev = abs(fract(c.y * 1.3 + abs(c.x) * 0.7) - 0.5) - 0.07;
  chev = max(chev, abs(c.y) - 0.85);
  vec2 dc = vec2(fract(c.x * 3.0) - 0.5, c.y + 1.2);
  float dots = length(dc * vec2(1.0, 3.0)) - 0.15;
  float cutd = min(min(eye, mouth), min(chev, dots));
  carve = smoothstep(0.03, -0.02, cutd);
  float raised = smoothstep(0.03, -0.02, min(nose, brow));
  float lip = smoothstep(0.05, 0.0, abs(rim)) * (1.0 - carve);
  a = mix(a, a * 0.12, carve);
  a = mix(a, a * 1.45, raised);
  a = mix(a, a * 1.25, lip * 0.6);
  return a;
}
`;

// ---------------- JavaScript ----------------
// rotate a figure-space vector the way the puppet's joints do (positive angle: clockwise)
const rw = (a, [x, y]) => [Math.cos(a) * x + Math.sin(a) * y, -Math.sin(a) * x + Math.cos(a) * y];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
// where a posed figure's hand is (world units). far: the far arm.
export function handAt(P, far = false) {
  const [x, y, scale, face, lean, , sh, el, fsh, fel] = P;
  const s = far ? fsh : sh, e = far ? fel : el;
  let S = far ? [0.0, 15.15] : [0.3, 15.1];
  const E = add(S, rw(s, [0, -3.4]));
  let H = add(E, rw(s + e, [0, -3.6]));
  H = add([0, 10.4], rw(lean, [H[0], H[1] - 10.4]));
  return [x + scale * H[0] * face, y + scale * H[1]];
}
// A stroll on twos: a pose's stride and arm swing at stop-motion time s. Returns pose fields.
export function strollAt(s, { rate = 1.9, stride = 0.42, swing = 0.55, bounce = 0.25, phase = 0 } = {}) {
  const ph = s * rate * Math.PI + phase;
  const sway = stride * Math.sin(ph);
  return {
    sway,
    sh: -swing * Math.sin(ph) - 0.05, el: -0.35 - 0.2 * Math.max(0, Math.sin(ph)),
    fsh: swing * Math.sin(ph) - 0.05, fel: -0.35 - 0.2 * Math.max(0, -Math.sin(ph)),
    lift: bounce * Math.abs(Math.cos(ph)),
    ph,
  };
}
