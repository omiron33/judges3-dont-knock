// The paper diorama. Every world in this film is a miniature set built from flat sheets: torn
// cardstock, parchment, handmade pulp, black card, tarnished foil, thin wood, thread and wax, each
// sheet standing at its own depth like the flats of a toy theatre. This module renders such a set by
// tracing camera rays through the stack of sheets (front to back), then lighting what they hit with
// candles, fire, moonlight and narrow shafts of divine light that pass physically through the paper:
// every sheet in front of a light casts a soft shadow, and thin paper glows when lit from behind.
//
// A world supplies, in GLSL, between PAPER_HEAD and PAPER_TRACE:
//   #define NL <n>                          number of sheets, sorted front (0) to back
//   float sheetZ(int i, vec2 p)             depth of sheet i at x,y (cm); a sheet may bend
//   float sheetSD(int i, vec2 p, bool hq)   signed distance to the paper of sheet i (<0 on paper, cm);
//                                           hq is false for shadow and haze rays (skip fine detail)
//   Mat sheetMat(int i, vec2 p, float sd)   what the paper is there: colour, kind, light it lets through
//   float sheetOpac(int i)                  how much light the sheet stops (black card 1, parchment 0.8)
// Units are centimetres: the camera looks along +z into the set. Lights are uploaded as uL (see
// packLights). Everything is a pure function of song time.

export const PAPER_UNIFORMS = {
  uFocus: 60.0, uAper: 0.0,
  uL: new Array(54).fill(0), uLN: 0,
  uAmb: [0.02, 0.02, 0.025], uFillDir: [0.25, 0.55, -0.8], uFillSoft: 6.0,
  uBg: [0.004, 0.004, 0.005],
  uHaze: [0.02, 0.02, 0.025], uHazeD: 0.0,
  uVol: 0.0, uVolTint: [1, 1, 1],
  uDust: 0.0,
  uStepT: 0.0, uBoil: 0.0,
};

export const PAPER_HEAD = /* glsl */ `
uniform float uFocus, uAper;
uniform float uL[54];
uniform int uLN;
uniform vec3 uAmb, uFillDir, uBg, uHaze, uVolTint;
uniform float uFillSoft, uHazeD, uVol, uDust, uStepT, uBoil;

// what a sheet is made of
#define K_PAPER 0
#define K_CARD 1
#define K_GOLD 2
#define K_SILVER 3
#define K_FABRIC 4
#define K_WOOD 5
#define K_GLOW 6
#define K_INK 7
struct Mat {
  vec3 alb;      // linear albedo
  int kind;
  float trans;   // light let through when lit from behind (0..1)
  float tear;    // 1 torn (white deckled fibre edge), 0 knife-cut
  float fuzz;    // length of loose fibres beyond the edge (cm)
  vec3 emit;     // light it gives (flame, ember, the glow of the divine)
  float bump;    // relief of the fibres
  float seed;
};
Mat mPaper(vec3 c) { Mat m; m.alb = c; m.kind = K_PAPER; m.trans = 0.45; m.tear = 1.0; m.fuzz = 0.05; m.emit = vec3(0); m.bump = 1.0; m.seed = 0.0; return m; }
Mat mCard(vec3 c) { Mat m = mPaper(c); m.kind = K_CARD; m.trans = 0.08; m.tear = 0.0; m.fuzz = 0.0; m.bump = 0.6; return m; }
Mat mFoil(vec3 c, bool gold) { Mat m = mPaper(c); m.kind = gold ? K_GOLD : K_SILVER; m.trans = 0.0; m.tear = 0.0; m.fuzz = 0.0; m.bump = 1.0; return m; }
Mat mGlow(vec3 e) { Mat m = mPaper(vec3(0.0)); m.kind = K_GLOW; m.emit = e; m.trans = 0.0; m.tear = 0.0; m.fuzz = 0.0; return m; }

// sRGB 0..1 to linear
vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }

// ---------------- the stuff of paper ----------------
// pulp: soft clouds of thicker and thinner fibre (0..1, ~0.5)
float pulp(vec2 p, float seed) { return fbm(p * 0.45 + seed * 17.3, 4); }
// fibres: thin long strands laid every which way (0..1 strength)
float fibres(vec2 p, float seed) {
  float f = 0.0;
  for (int k = 0; k < 3; k++) {
    float a = hash11(seed * 3.1 + float(k) * 7.7) * PI;
    vec2 q = rot(a) * p;
    float n = vnoise(q * vec2(2.2, 38.0) + float(k) * 13.1 + seed);
    f += pow(n, 7.0);
  }
  return f;
}
// grain of the sheet's surface (fine tooth), 0..1
float tooth(vec2 p) { return vnoise(p * 22.0) * 0.6 + vnoise(p * 61.0) * 0.4; }

// torn edge: push a clean signed distance out and in along the tear (cm)
float torn(float sd, vec2 p, float amt, float seed, bool hq) {
  float n = (fbm(p * 1.1 + seed * 5.1, hq ? 4 : 2) - 0.5) * 2.0 * amt;
  if (hq) n += (vnoise(p * 9.0 + seed) - 0.5) * amt * 0.35;
  return sd + n;
}
// a knife cut: nearly straight, with the small wander of a hand
float cut(float sd, vec2 p, float seed) { return sd + (vnoise(p * 3.0 + seed * 9.0) - 0.5) * 0.05; }

// 2D shapes (p in cm)
float sdBox2(vec2 p, vec2 b) { vec2 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }
float sdCircle(vec2 p, float r) { return length(p) - r; }
float sdSeg(vec2 p, vec2 a, vec2 b, float r) { vec2 pa = p - a, ba = b - a; float h = sat(dot(pa, ba) / dot(ba, ba)); return length(pa - ba * h) - r; }
float sdTri(vec2 p, vec2 a, vec2 b, vec2 c) {
  vec2 e0 = b - a, e1 = c - b, e2 = a - c, v0 = p - a, v1 = p - b, v2 = p - c;
  vec2 pq0 = v0 - e0 * sat(dot(v0, e0) / dot(e0, e0)), pq1 = v1 - e1 * sat(dot(v1, e1) / dot(e1, e1)), pq2 = v2 - e2 * sat(dot(v2, e2) / dot(e2, e2));
  float s = sign(e0.x * e2.y - e0.y * e2.x);
  vec2 d = min(min(vec2(dot(pq0, pq0), s * (v0.x * e0.y - v0.y * e0.x)), vec2(dot(pq1, pq1), s * (v1.x * e1.y - v1.y * e1.x))), vec2(dot(pq2, pq2), s * (v2.x * e2.y - v2.y * e2.x)));
  return -sqrt(d.x) * sign(d.y);
}
// a tapering stroke: thick r0 at a, r1 at b
float sdTaper(vec2 p, vec2 a, vec2 b, float r0, float r1) { vec2 pa = p - a, ba = b - a; float h = sat(dot(pa, ba) / dot(ba, ba)); return length(pa - ba * h) - mix(r0, r1, h); }
// a ridge line y = f(x) as a silhouette (paper below the line): negative under
float sdBelow(vec2 p, float y) { return p.y - y; }
// a range of hills / mountains cut along a noisy ridge: base height h, peaks amp, scale s
float ridge(float x, float h, float amp, float s, float seed) {
  float r = 0.0, a = 1.0, f = s;
  for (int k = 0; k < 4; k++) { r += a * (1.0 - abs(vnoise(vec2(x * f, seed + float(k) * 3.7)) * 2.0 - 1.0)); a *= 0.45; f *= 2.1; }
  return h + amp * r / 1.7;
}

// ---------------- the hand at work ----------------
// ink wash and brush: streaky strokes laid at angle a (0..1 variation)
float brush(vec2 p, float a, float seed) {
  vec2 q = rot(a) * p;
  return vnoise(q * vec2(0.6, 7.0) + seed) * 0.6 + vnoise(q * vec2(1.4, 19.0) + seed * 2.0) * 0.4;
}
// cross-hatching in charcoal or ink: density 0..1 -> ink coverage 0..1
float hatch(vec2 p, float dens, float scale) {
  float l1 = abs(fract((p.x + p.y) * scale + vnoise(p * 2.0) * 0.4) - 0.5);
  float l2 = abs(fract((p.x - p.y) * scale * 1.1 + vnoise(p * 2.3 + 4.0) * 0.4) - 0.5);
  float c = smoothstep(0.5 * dens, 0.5 * dens - 0.12, 0.5 - l1);
  if (dens > 0.45) c = max(c, smoothstep(0.5 * (dens - 0.45) * 1.8, 0.5 * (dens - 0.45) * 1.8 - 0.12, 0.5 - l2));
  return c;
}
// ink bleeding out from a front: coverage 0..1 and the darker dried rim. f < 0 is inside the ink.
vec2 inkBleed(vec2 p, float f) {
  float g = f + (fbm(p * 1.6, 4) - 0.5) * 1.2 + (vnoise(p * 9.0) - 0.5) * 0.25;
  float cov = smoothstep(0.15, -0.1, g);
  float rim = smoothstep(0.35, 0.0, abs(g + 0.12)) * cov;
  return vec2(cov, rim);
}
// a thumbprint: faint ridges in an oval (0..1)
float thumb(vec2 p, vec2 c, float ang, float r) {
  vec2 q = rot(ang) * (p - c); q.y *= 0.75;
  float d = length(q);
  float rr = sin(d * 95.0 + vnoise(q * 3.0) * 4.0) * 0.5 + 0.5;
  return rr * smoothstep(r, r * 0.4, d) * 0.5;
}
// cracks for gold leaf to run through: distance to a crack (cm) and its cell
vec2 cracks(vec2 p, float scale) { vec2 v = voronoiEdge(p * scale + vec2(vnoise(p * 1.3), vnoise(p * 1.3 + 7.0)) * 0.6); return vec2(v.x / scale, v.y); }

// stop-motion: the time of the current hand-placed step (12 a second) and a per-step jitter
vec2 boil(float seed, float amt) { return (hash22(vec2(seed, floor(uBoil))) - 0.5) * 2.0 * amt; }
`;

export const PAPER_TRACE = /* glsl */ `
// ---------------- lens ----------------
vec3 lensRay(vec2 fc, out vec3 ro) {
  // the engine's camera puts world +x on the left of the frame; mirror it so +x is to the right
  vec3 rd = camRay(vec2(uRes.x - fc.x, fc.y), ro);
  if (uAper <= 0.0) return rd;
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  vec3 fp = ro + rd * (uFocus / dot(rd, ww));
  vec2 j = vec2(hash12(uJitter * 917.0 + 3.1 + uTime * 1.7), hash12(uJitter * 613.0 + 7.7 - uTime * 2.3));
  float r = sqrt(j.x), th = 6.2831853 * j.y;
  ro += (uu * cos(th) + vv * sin(th)) * r * uAper;
  return normalize(fp - ro);
}

// ray against sheet i (with bend): distance along the ray, or -1
float hitSheet(int i, vec3 ro, vec3 rd, out vec2 xy) {
  if (abs(rd.z) < 1e-5) return -1.0;
  float z = sheetZ(i, ro.xy);
  float t = (z - ro.z) / rd.z;
  for (int k = 0; k < 2; k++) {
    vec2 q = ro.xy + rd.xy * t;
    z = sheetZ(i, q);
    t = (z - ro.z) / rd.z;
  }
  xy = ro.xy + rd.xy * t;
  return t;
}

// light number k: pos (or direction toward a far light), colour, softness radius, range, kind
// kind: 0 point, 1 directional; +2 if it scatters in the air (shafts)
vec3 lPos(int k) { return vec3(uL[k * 9], uL[k * 9 + 1], uL[k * 9 + 2]); }
vec3 lCol(int k) { return vec3(uL[k * 9 + 3], uL[k * 9 + 4], uL[k * 9 + 5]); }
float lRad(int k) { return uL[k * 9 + 6]; }
float lRange(int k) { return uL[k * 9 + 7]; }
int lKind(int k) { return int(uL[k * 9 + 8] + 0.5); }

// How much of a light reaches point P past every other sheet. soft is the light's radius (cm) for a
// point light, or the angular softness for a directional one.
float reach(int self, vec3 P, vec3 L, bool dir, float soft) {
  float v = 1.0;
  vec3 d = dir ? L : L - P;
  float dl = dir ? 1e4 : length(d);
  d = dir ? L : d / dl;
  if (abs(d.z) < 1e-4) return 1.0;
  for (int j = 0; j < NL; j++) {
    if (j == self) continue;
    vec2 q = P.xy;
    float zj = sheetZ(j, P.xy);
    float t = (zj - P.z) / d.z;
    if (t <= 0.02 || t >= dl - 0.02) continue;
    q = P.xy + d.xy * t;
    t = (sheetZ(j, q) - P.z) / d.z;
    if (t <= 0.02 || t >= dl - 0.02) continue;
    q = P.xy + d.xy * t;
    float pen = dir ? max(t * soft, 0.03) : max(soft * t / max(dl - t, 0.5), 0.03);
    float s = sheetSD(j, q, false);
    float cov = smoothstep(pen, -pen, s);
    v *= 1.0 - cov * sheetOpac(j);
    if (v < 0.01) return 0.0;
  }
  return v;
}

vec3 lightAt(int k, vec3 P, out vec3 Ld) {
  vec3 lp = lPos(k);
  if ((lKind(k) & 1) == 1) { Ld = normalize(lp); return lCol(k); }
  vec3 d = lp - P; float r = length(d); Ld = d / r;
  float rg = lRange(k);
  return lCol(k) / (1.0 + (r * r) / (rg * rg));
}

// foil: crinkled into small facets, each catching the light its own way
vec3 foilNormal(vec2 p, vec3 n) {
  vec2 v = voronoiEdge(p * 3.2);
  vec2 h = hash22(vec2(v.y * 91.0, v.y * 13.0)) - 0.5;
  return normalize(n + vec3(h * 0.55, 0.0) + vec3(vnoise(p * 30.0) - 0.5, vnoise(p * 30.0 + 3.0) - 0.5, 0.0) * 0.12);
}

// Light one hit on sheet i. P world point, p sheet coords, rd view ray, m material, sd distance.
vec3 lightSheet(int i, vec3 P, vec2 p, vec3 rd, Mat m, float sd, vec2 g, vec2 tz) {
  // the sheet faces the camera (-z); fibres, tooth and the cut edge's bevel tilt it
  float th = tooth(p) * 0.6 + fibres(p, m.seed) * 0.5 + pulp(p * 3.0, m.seed) * 0.4;
  vec2 gb = vec2(tooth(p + vec2(0.02, 0)) - tooth(p), tooth(p + vec2(0, 0.02)) - tooth(p)) * 18.0;
  vec3 n = normalize(vec3(tz - gb * 0.08 * m.bump, -1.0));
  // the bevel of a cut or torn edge: within ~1.5 mm of the edge the paper rolls away
  float bev = smoothstep(-0.15, 0.0, sd);
  if (bev > 0.0 && dot(g, g) > 1e-6) n = normalize(n + vec3(normalize(g) * bev * 1.4, 0.0));
  if (m.kind == K_GOLD || m.kind == K_SILVER) n = foilNormal(p, n);
  vec3 V = -rd;
  vec3 col = m.emit;
  float thin = 1.0 - pulp(p, m.seed + 3.0);   // thin places glow more
  // the soft fill: a broad light that makes every sheet shade the one behind it
  {
    float vis = reach(i, P, normalize(uFillDir), true, uFillSoft * 0.03);
    float nl = 0.55 + 0.45 * sat(dot(n, normalize(uFillDir)));
    col += m.alb * uAmb * nl * mix(0.35, 1.0, vis);
  }
  for (int k = 0; k < 6; k++) {
    if (k >= uLN) break;
    vec3 Ld; vec3 E = lightAt(k, P, Ld);
    if (dot(E, vec3(1)) < 1e-4) continue;
    bool dir = (lKind(k) & 1) == 1;
    float vis = reach(i, P, dir ? Ld : lPos(k), dir, lRad(k) * (dir ? 0.02 : 1.0));
    if (vis <= 0.0) continue;
    if (Ld.z < 0.0) {
      // lit from the camera side
      float nl = sat(dot(n, Ld));
      if (m.kind == K_GOLD || m.kind == K_SILVER) {
        vec3 H = normalize(Ld + V);
        float sp = pow(sat(dot(n, H)), 60.0) * 6.0 + pow(sat(dot(n, H)), 8.0) * 0.4;
        col += E * vis * (m.alb * (0.12 * nl + sp));
      } else if (m.kind == K_INK) {
        vec3 H = normalize(Ld + V);
        col += E * vis * (m.alb * nl + vec3(pow(sat(dot(n, H)), 90.0) * 1.2));
      } else {
        col += E * vis * m.alb * nl * (0.85 + 0.3 * th);
      }
    } else {
      // lit from behind: the paper glows through, warm, mottled by its pulp
      float tr = m.trans * mix(0.45, 1.45, thin) * sqrt(sat(Ld.z));
      col += E * vis * tr * (m.alb * 0.6 + 0.4 * sqrt(m.alb + 1e-4)) * vec3(1.0, 0.86, 0.66);
      // and the cut edge catches the rim
      col += E * vis * bev * 0.6 * mix(m.alb, vec3(0.8, 0.72, 0.6), 0.5) * (m.kind == K_CARD ? 0.35 : 1.0);
    }
  }
  return col;
}

// the albedo of a sheet near its edge: the torn rim shows pale fibre, a cut edge a dark line
vec3 edgeTone(Mat m, float sd, vec2 p) {
  vec3 a = m.alb;
  if (m.kind == K_GLOW) return a;
  if (m.tear > 0.0) {
    float w = 0.16 * m.tear * (0.6 + 0.8 * vnoise(p * 4.0));
    float k = smoothstep(-w, 0.0, sd);
    // the torn core is paler than the face, but only a little on dark card (no chalk outline)
    vec3 core = min(a * 2.4 + vec3(0.035, 0.03, 0.025), vec3(0.62, 0.56, 0.46));
    a = mix(a, core, k * 0.6 * m.tear);
  } else if (m.kind == K_CARD || m.kind == K_WOOD) {
    a *= mix(1.0, 0.55, smoothstep(-0.04, 0.0, sd));
  }
  return a;
}

// loose fibres just past the edge (alpha 0..1)
float fuzzA(Mat m, float sd, vec2 p, vec2 g) {
  if (m.fuzz <= 0.0 || sd <= 0.0 || sd > m.fuzz) return 0.0;
  vec2 nn = dot(g, g) > 1e-8 ? normalize(g) : vec2(0, 1);
  vec2 q = vec2(dot(p, vec2(-nn.y, nn.x)), dot(p, nn));
  float h = pow(vnoise(vec2(q.x * 48.0, q.y * 3.0) + m.seed), 4.0) * 1.8;
  return sat(h * pow(1.0 - sd / m.fuzz, 1.5));
}

// motes of dust drifting in the light
vec3 motes(vec3 ro, vec3 rd, float tmax) {
  vec3 acc = vec3(0);
  for (int k = 0; k < 3; k++) {
    float z = uCamPos.z + 12.0 + float(k) * 18.0 + 6.0 * hash11(float(k) + 0.5);
    float t = (z - ro.z) / rd.z;
    if (t <= 0.0 || t > tmax) continue;
    vec2 q = ro.xy + rd.xy * t;
    vec2 drift = vec2(sin(uTime * 0.13 + float(k)), uTime * -0.08) * (1.0 + float(k));
    vec2 c = floor((q - drift) / 2.4);
    vec2 h = hash22(c + float(k) * 31.0);
    vec2 mp = (c + 0.2 + 0.6 * h) * 2.4 + drift;
    float d = length(q - mp);
    float sz = 0.02 + 0.03 * hash12(c + 7.0);
    float a = smoothstep(sz, 0.0, d) * step(0.55, hash12(c + 3.0));
    if (a <= 0.0) continue;
    vec3 P = vec3(mp, z);
    for (int l = 0; l < 6; l++) {
      if (l >= uLN) break;
      vec3 Ld; vec3 E = lightAt(l, P, Ld);
      bool dir = (lKind(l) & 1) == 1;
      acc += a * E * reach(-1, P, dir ? Ld : lPos(l), dir, 0.0) * 0.35;
    }
  }
  return acc * uDust;
}

// light scattered in the air: shafts through the cut-outs
vec3 shafts(vec3 ro, vec3 rd, float tmax, vec2 fc) {
  vec3 acc = vec3(0);
  float tm = min(tmax, 400.0);
  const int N = 14;
  float jit = hash12(fc + fract(uTime * 7.3) * 113.0);
  for (int l = 0; l < 6; l++) {
    if (l >= uLN) break;
    if ((lKind(l) & 2) == 0) continue;
    bool dir = (lKind(l) & 1) == 1;
    for (int s = 0; s < N; s++) {
      float t = tm * (float(s) + jit) / float(N);
      vec3 P = ro + rd * t;
      vec3 Ld; vec3 E = lightAt(l, P, Ld);
      float v = reach(-1, P, dir ? Ld : lPos(l), dir, 0.0);
      float dens = 0.6 + 0.8 * vnoise(P * 0.08 + vec3(0, 0, uTime * 0.05));
      float ph = 0.4 + 0.6 * pow(sat(dot(rd, Ld) * 0.5 + 0.5), 4.0);
      acc += E * v * dens * ph * (tm / float(N));
    }
  }
  return acc * uVol * 0.01 * uVolTint;
}

vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = lensRay(fc, ro);
  vec3 acc = vec3(0); float aacc = 0.0; float tFirst = 1e5;
  float pxk = 2.0 * tan(radians(uFov) * 0.5) / uRes.y;   // world size of a pixel per unit distance
  for (int i = 0; i < NL; i++) {
    vec2 p;
    float t = hitSheet(i, ro, rd, p);
    if (t <= 0.0) continue;
    float sd = sheetSD(i, p, true);
    float px = t * pxk * 0.7;
    if (sd > 0.35 + px) continue;
    Mat m = sheetMat(i, p, sd);
    vec2 g = vec2(0);
    if (abs(sd) < max(m.fuzz, 0.18) + px) {
      float e = max(px, 0.01);
      g = vec2(sheetSD(i, p + vec2(e, 0), false) - sheetSD(i, p - vec2(e, 0), false), sheetSD(i, p + vec2(0, e), false) - sheetSD(i, p - vec2(0, e), false));
    }
    float cov = smoothstep(px, -px, sd);
    float a = max(cov, fuzzA(m, sd, p, g));
    if (a <= 0.002) continue;
    m.alb = edgeTone(m, sd, p);
    if (sd > 0.0) { m.alb = min(m.alb * 2.4 + vec3(0.035, 0.03, 0.025), vec3(0.62, 0.56, 0.46)); m.kind = m.kind == K_GLOW ? K_GLOW : K_PAPER; m.trans = 0.9; }
    vec3 P = vec3(p, ro.z + rd.z * t);
    vec2 tz = vec2(sheetZ(i, p + vec2(0.05, 0)) - sheetZ(i, p - vec2(0.05, 0)), sheetZ(i, p + vec2(0, 0.05)) - sheetZ(i, p - vec2(0, 0.05))) * 10.0;
    vec3 c = lightSheet(i, P, p, rd, m, sd, g, tz);
    float hz = 1.0 - exp(-t * uHazeD);
    c = mix(c, uHaze, hz);
    acc += (1.0 - aacc) * a * c;
    if (tFirst > 1e4) tFirst = t;
    aacc += (1.0 - aacc) * a;
    if (aacc > 0.995) break;
  }
  acc += (1.0 - aacc) * uBg;
  if (uVol > 0.0) acc += shafts(ro, rd, tFirst > 1e4 ? 400.0 : tFirst, fc);
  if (uDust > 0.0) acc += motes(ro, rd, tFirst);
  return acc;
}
`;

// ---------------- JavaScript side ----------------
// Lights for the uniform: [{ pos:[x,y,z] | dir:[x,y,z], col:[r,g,b] (linear), rad, range, shaft }]
export function packLights(list) {
  const a = new Array(54).fill(0);
  list.slice(0, 6).forEach((l, k) => {
    const p = l.dir ?? l.pos;
    a.splice(k * 9, 9, p[0], p[1], p[2], l.col[0], l.col[1], l.col[2], l.rad ?? 1, l.range ?? 40, (l.dir ? 1 : 0) + (l.shaft ? 2 : 0));
  });
  return a;
}
// a flame's flicker (0.75..1.15), deterministic in t
export function flicker(t, seed = 0) {
  const s = Math.sin;
  return 0.95 + 0.08 * s(t * 13.1 + seed) + 0.05 * s(t * 23.7 + seed * 2.1) + 0.04 * s(t * 7.3 + seed * 0.7);
}
// stop motion: time held on the current step (12 steps a second)
// (offset half a 60 fps frame so a step never changes inside one frame's shutter: no double exposure)
export const stepT = (t, fps = 12) => Math.floor((t + 1 / 120) * fps) / fps;
// colours in sRGB 0..255 to linear, times k
export const L = (r, g, b, k = 1) => [r, g, b].map((v) => Math.pow(v / 255, 2.2) * k);
