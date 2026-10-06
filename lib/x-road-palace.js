// Eglon's palace by the city of palms (s03): an intricate cut-paper palace of ivory card, stepped
// merlons, rows of lattice windows cut through it and glowing with the lamps behind its parchment
// lining, a summer room on the roof (a pavilion of lattice under an onion dome), gold-foil doors
// embossed with cut patterns; date palms of black card flanking it, a grove and the walled city of
// palms behind, a dusk sky.
import { PAPER_HEAD, PAPER_TRACE, PAPER_UNIFORMS } from '/song/lib/paper.js';
import { ROAD_LIB } from '/song/lib/x-road.js';
import { PUPPET_GLSL } from '/song/lib/puppet.js';

export const PALACE_UNIFORMS = { ...PAPER_UNIFORMS, uDrop: 0, uRise: 0, uWin: [0, 0, 0], uSway: 0 };

export const PALACE_GLSL = PAPER_HEAD + PUPPET_GLSL + ROAD_LIB + /* glsl */ `
uniform float uDrop, uRise, uSway;
uniform vec3 uWin;   // how lit each storey is: ground, upper, summer room
#define NL 7
// 0 near palms and ground, 1 the palace, 2 its lining, 3 grove, 4 city and hills, 5 sky, 6 light box
float sheetZ(int i, vec2 p) {
  if (i == 0) return 10.0;
  if (i == 1) return 24.0;
  if (i == 2) return 25.6;
  if (i == 3) return 42.0;
  if (i == 4) return 70.0;
  if (i == 5) return 100.0;
  return 106.0;
}
float sheetOpac(int i) { if (i == 6) return 0.0; if (i == 2) return 0.55; if (i == 5) return 0.9; return 1.0; }

// lattice: negative in the open cells of a diamond lattice of bars
float lattice(vec2 q, float k, float bar) {
  float a = abs(fract((q.x + q.y) * k) - 0.5), b = abs(fract((q.x - q.y) * k) - 0.5);
  float dist = (0.5 - max(a, b)) / k;
  return bar - dist;
}
float archWin(vec2 q, vec2 c, float w, float h) {
  return min(sdBox2(q - c, vec2(w, h)), sdCircle(q - c - vec2(0.0, h), w));
}
// the palace in its own frame (q), with the windows: storey index of the window hit
float palaceBody(vec2 q) {
  float d = sdBox2(q - vec2(0.0, -2.0), vec2(16.0, 9.0));                // the main block
  d = min(d, sdBox2(q - vec2(0.0, -11.4), vec2(21.0, 0.6)));              // the plinth and steps
  d = min(d, sdBox2(q - vec2(0.0, -12.4), vec2(23.0, 0.6)));
  d = min(d, sdBox2(q - vec2(0.0, 7.6), vec2(14.0, 0.6)));                // cornice
  // side towers with domes
  for (int k = 0; k < 2; k++) {
    float x = k == 0 ? -17.0 : 17.0;
    d = min(d, sdBox2(q - vec2(x, 2.0), vec2(2.6, 13.0)));
    d = min(d, sdCircle(q - vec2(x, 15.6), 2.4));
    d = min(d, sdTri(q, vec2(x - 0.4, 17.4), vec2(x + 0.4, 17.4), vec2(x, 19.6)));
  }
  // stepped merlons along the roof
  float mq = mod(q.x + 1.0, 2.0) - 1.0;
  float mer = min(sdBox2(vec2(mq, q.y - 7.9), vec2(0.7, 0.45)), sdBox2(vec2(mq, q.y - 8.5), vec2(0.4, 0.4)));
  d = min(d, max(mer, abs(q.x) - 14.0));
  // the summer room: a pavilion on the roof with a lattice screen and an onion dome
  d = min(d, sdBox2(q - vec2(0.0, 11.4), vec2(6.4, 3.4)));
  d = min(d, sdBox2(q - vec2(0.0, 15.0), vec2(7.2, 0.45)));
  float dome = sdEllipsoid(vec3(q - vec2(0.0, 16.4), 0.0), vec3(4.0, 3.3, 1.0));
  dome = smin(dome, sdTri(q, vec2(-1.6, 18.6), vec2(1.6, 18.6), vec2(0.0, 22.0)), 0.8);
  d = min(d, max(dome, -(q.y - 15.2)));
  d = min(d, sdBox2(q - vec2(0.0, 22.6), vec2(0.12, 0.8)));
  return d;
}
float palaceHoles(vec2 q, out int storey) {
  storey = -1;
  float h = 1e3;
  // ground floor: arched windows either side of the doors
  for (int k = 0; k < 4; k++) {
    float x = k < 2 ? -6.0 - float(k) * 5.0 : 6.0 + float(k - 2) * 5.0;
    float w = archWin(q, vec2(x, -5.4), 1.3, 1.9);
    if (w < h) { h = w; storey = 0; }
  }
  // upper floor: a row of tall lattice windows
  for (int k = 0; k < 6; k++) {
    float x = -12.5 + float(k) * 5.0;
    float w = archWin(q, vec2(x, 2.2), 1.2, 2.2);
    if (w < h) { h = w; storey = 1; }
  }
  // tower slits
  for (int k = 0; k < 2; k++) {
    float x = k == 0 ? -17.0 : 17.0;
    float w = min(archWin(q, vec2(x, 9.0), 0.6, 1.3), archWin(q, vec2(x, 3.0), 0.6, 1.3));
    if (w < h) { h = w; storey = 1; }
  }
  // the summer room's great lattice screen
  float sr = archWin(q, vec2(0.0, 11.0), 5.0, 1.8);
  if (sr < h) { h = sr; storey = 2; }
  // a frieze of small cut triangles along the cornice
  float tq = mod(q.x, 1.2) - 0.6;
  float fr = sdTri(vec2(tq, q.y), vec2(-0.35, 6.5), vec2(0.35, 6.5), vec2(0.0, 7.05));
  fr = max(fr, abs(q.x) - 13.5);
  if (fr < h) { h = fr; storey = 3; }
  // open lattice inside each window (the frieze stays open)
  float lat = storey == 3 ? -1.0 : lattice(q, storey == 2 ? 1.6 : 1.5, storey == 2 ? 0.075 : 0.06);
  if (storey == 2) lat = max(lat, -(abs(q.x) - 0.12));   // the screen's centre mullion
  if (storey == 2) lat = max(lat, -(abs(q.y - 12.0) - 0.12));
  return max(h, lat);
}
float doorSD(vec2 q) { return archWin(q, vec2(0.0, -8.6), 2.5, 3.0); }
vec2 palaceQ(vec2 p) { return p - vec2(0.0, uDrop); }

float palmsNear(vec2 p, out float ring) {
  float r0, r1, r2;
  float d = palmSD(p, vec2(-22.5, -13.0), 30.0, 0.35, uSway, 1.0, r0);
  float d1 = palmSD(p, vec2(23.0, -13.0), 27.0, -0.3, -uSway * 0.8, 4.0, r1);
  float d2 = palmSD(p, vec2(-12.0, -13.0), 17.0, -0.15, uSway * 1.2, 9.0, r2);
  ring = d < d1 ? r0 : r1;
  if (d2 < min(d, d1)) ring = r2;
  return min(min(d, d1), d2);
}

float sheetSD(int i, vec2 p, bool hq) {
  if (i == 0) {
    float ring;
    float d = palmsNear(p, ring);
    d = min(d, sdBelow(p, -12.0 + 0.6 * sin(p.x * 0.3) + 1.5 * smoothstep(10.0, 30.0, abs(p.x))));
    return torn(d, p, 0.08, 1.0, hq);
  }
  if (i == 1) {
    vec2 q = palaceQ(p);
    float d = palaceBody(q);
    int st;
    float holes = palaceHoles(q, st);
    d = max(d, -holes);
    d = max(d, -q.y - 13.0);
    return cut(d, p, 2.0);
  }
  if (i == 2) { vec2 q = palaceQ(p); return palaceBody(q) - 0.15; }
  if (i == 3) {
    // the grove: palms in a row, rising on the drum
    float d = sdBelow(p, -8.0 + uRise + 0.5 * sin(p.x * 0.2));
    for (int k = 0; k < 9; k++) {
      float x0 = -52.0 + float(k) * 13.0 + 3.0 * hash11(float(k) + 0.2);
      if (abs(x0) < 14.0) continue;
      float rr;
      d = min(d, palmSD(p, vec2(x0, -8.5 + uRise), 15.0 + 7.0 * hash11(float(k) + 3.0), (hash11(float(k) + 1.0) - 0.5) * 0.8, uSway * 0.6, float(k) + 20.0, rr));
    }
    return torn(d, p, 0.1, 3.0, hq);
  }
  if (i == 4) {
    float d = sdBelow(p, ridge(p.x, 2.0, 8.0, 0.02, 7.0));
    // the city wall and houses of the city of palms, far off
    float cw = sdBelow(p, 4.0 + 2.0 * step(0.5, fract(p.x / 7.0)) + 0.7 * step(0.6, fract(p.x / 2.3)));
    d = min(d, max(cw, abs(p.x) - 70.0));
    return torn(d, p, 0.25, 7.0, hq);
  }
  return -1.0;
}
Mat sheetMat(int i, vec2 p, float sd) {
  if (i == 0) {
    float ring;
    float d = palmsNear(p, ring);
    Mat m = mCard(lin(vec3(0.05, 0.045, 0.04)));
    // the trunk's rings scored into the card
    m.alb *= 0.8 + 0.5 * step(0.5, fract(ring * 34.0)) * step(d, 0.0) * step(ring, 0.97);
    m.seed = 1.0; return m;
  }
  if (i == 1) {
    vec2 q = palaceQ(p);
    // the gold doors: foil embossed with cut roundels and lozenges, a dark seam down the middle
    float dr = doorSD(q);
    if (dr < 0.0) {
      Mat m = mFoil(lin(vec3(0.78, 0.6, 0.3)), true);
      vec2 dq = q - vec2(0.0, -8.6);
      vec2 cell = vec2(mod(dq.x + 0.6, 1.2) - 0.6, mod(dq.y + 0.6, 1.2) - 0.6);
      float pat = min(abs(length(cell) - 0.38) - 0.05, abs(abs(cell.x) + abs(cell.y) - 0.5) - 0.04);
      m.alb *= 1.0 - 0.6 * smoothstep(0.04, 0.0, pat);
      m.alb *= 1.0 - 0.9 * smoothstep(0.1, 0.0, abs(dq.x) - 0.05);
      m.alb *= 1.0 - 0.7 * smoothstep(0.12, 0.0, abs(dr + 0.1) - 0.08);
      m.alb *= 0.55 + 0.5 * smoothstep(0.35, 0.7, fbm(dq * 1.5, 3));   // tarnish
      m.seed = 12.0; return m;
    }
    // the gilded rim of the summer room's dome and finials
    float dm = sdEllipsoid(vec3(q - vec2(0.0, 16.4), 0.0), vec3(4.0, 3.3, 1.0));
    if (q.y > 15.4 && abs(q.x) < 4.2 && dm < 0.1 || q.y > 18.5 && abs(q.x) < 2.0) {
      Mat m = mFoil(lin(vec3(0.62, 0.48, 0.26)), true);
      m.alb *= 0.45 + 0.6 * smoothstep(0.3, 0.7, fbm(q * 1.2, 3));
      m.alb *= 0.7 + 0.3 * step(0.5, fract(q.x * 1.5 + q.y * 0.4));
      return m;
    }
    // ivory card painted and charcoaled; bands of cut ornament
    Mat m = mCard(lin(vec3(0.5, 0.44, 0.35)));
    m.alb *= 0.72 + 0.35 * brush(p, 0.05, 2.0);
    m.alb *= 1.0 - 0.2 * hatch(p * 0.9, 0.3 * smoothstep(-4.0, 11.0, -q.y), 1.7);
    m.alb *= mix(0.55, 1.0, smoothstep(-12.0, 4.0, q.y));
    m.alb *= 1.0 - 0.4 * smoothstep(0.5, 0.8, fbm(p * 0.3, 3));
    float band = smoothstep(0.08, 0.0, abs(q.y - 0.2) - 0.3) + smoothstep(0.08, 0.0, abs(q.y - 9.8) - 0.2);
    m.alb = mix(m.alb, lin(vec3(0.3, 0.12, 0.08)), band * 0.75);
    // brick courses drawn in charcoal
    m.alb *= 1.0 - 0.25 * smoothstep(0.05, 0.0, abs(fract(q.y / 1.1) - 0.5) - 0.45);
    m.seed = 2.0; return m;
  }
  if (i == 2) {
    vec2 q = palaceQ(p);
    Mat m = mPaper(lin(vec3(0.82, 0.64, 0.38)));
    if (q.y > 9.0) m.alb = lin(vec3(0.8, 0.7, 0.5));
    m.alb *= 0.75 + 0.35 * pulp(p, 4.0);
    float lit = q.y < -1.0 ? uWin.x : q.y < 9.0 ? uWin.y : uWin.z;
    vec3 lamp = q.y > 9.0 ? vec3(1.0, 0.78, 0.5) : vec3(1.0, 0.6, 0.28);
    m.emit = lamp * lit * (q.y > 9.0 ? 0.45 : 0.9) * (0.55 + 0.6 * pulp(p * 1.5, 8.0));
    m.trans = q.y > 9.0 ? 0.35 : 0.9; m.seed = 4.0; return m;
  }
  if (i == 3) { Mat m = mCard(lin(vec3(0.07, 0.07, 0.065))); m.seed = 5.0; return m; }
  if (i == 4) { Mat m = mPaper(lin(vec3(0.14, 0.13, 0.15))); m.alb *= 0.75 + 0.4 * brush(p, 0.1, 7.0); m.trans = 0.4; m.seed = 7.0; return m; }
  if (i == 5) {
    float k = smoothstep(-10.0, 45.0, p.y);
    vec3 a = mix(lin(vec3(0.46, 0.32, 0.26)), lin(vec3(0.07, 0.07, 0.1)), k);
    a *= 0.8 + 0.3 * brush(p * 0.4, 0.05, 10.0);
    Mat m = mPaper(a); m.trans = 0.5; m.tear = 0.0; m.seed = 10.0;
    // the last of the dusk glowing low behind the city
    m.emit = vec3(0.5, 0.26, 0.14) * smoothstep(40.0, 0.0, p.y) * (0.7 + 0.5 * brush(p * 0.3, 0.05, 11.0));
    vec2 c = floor(p / 3.0); vec2 h = hash22(c);
    float st = length(p - (c + h) * 3.0) - (0.03 + 0.05 * hash12(c + 5.0));
    if (hash12(c + 1.0) > 0.85 && p.y > 26.0) m.emit = vec3(0.6, 0.6, 0.7) * smoothstep(0.02, -0.02, st);
    return m;
  }
  return mGlow(vec3(1.4, 1.0, 0.8));
}
` + PAPER_TRACE;
