// Pieces of the escape world beyond the hills: Moab's riders with torches on the road, a stream of
// buckling paper strips with stepping stones, stacked forests, the sand-glass and the window, and the
// palace far behind. Each maker returns a sheet for world() in lib/x-escape.js.
import { F } from '/song/lib/x-escape.js';

const v3 = (c) => `vec3(${F(c[0])}, ${F(c[1])}, ${F(c[2])})`;

// Riders GLSL: a horse and rider of black card in profile, the rider holding up a torch.
// uR[16]: four riders × (x, facing, gait phase, scale). Hooves on y0(x).
export const RIDER_GLSL = /* glsl */ `
uniform float uR[16];
float horseRider(vec2 q, float ph, out float flame) {
  // q: rider space, hooves at y = 0, facing +x, ~5 units tall
  float d = sdEllipsoid(vec3(q - vec2(0.0, 1.75), 0.0), vec3(1.35, 0.55, 1.0));
  d = smin(d, sdTaper(q, vec2(0.95, 1.95), vec2(1.55, 2.85), 0.4, 0.26), 0.2);          // neck
  d = smin(d, sdTaper(q, vec2(1.55, 2.85), vec2(2.15, 2.45), 0.27, 0.15), 0.08);        // head
  d = min(d, sdTri(q, vec2(1.4, 3.0), vec2(1.6, 3.0), vec2(1.45, 3.35)));               // ear
  d = min(d, sdTaper(q, vec2(-1.25, 1.95), vec2(-1.75 - 0.15 * sin(ph), 0.9), 0.18, 0.08));   // tail
  for (int k = 0; k < 4; k++) {
    float fx = k < 2 ? 0.85 : -0.85;
    float a = sin(ph + float(k) * 1.6 + (k < 2 ? 0.0 : 3.1)) * 0.45;
    vec2 hip = vec2(fx + (k % 2 == 0 ? 0.12 : -0.12), 1.5);
    vec2 knee = hip + vec2(sin(a), -cos(a)) * 0.75;
    vec2 hoof = knee + vec2(sin(a * 0.3 - 0.15), -cos(a * 0.3)) * 0.78;
    d = min(d, sdTaper(q, hip, knee, 0.17, 0.11));
    d = min(d, sdTaper(q, knee, hoof, 0.1, 0.08));
  }
  // the rider: torso, a round helmet, the torch arm raised
  d = min(d, sdTaper(q, vec2(-0.1, 2.15), vec2(0.05, 3.35), 0.34, 0.28));
  d = min(d, sdCircle(q - vec2(0.12, 3.72), 0.27));
  d = min(d, max(sdCircle(q - vec2(0.08, 3.8), 0.36), -(q.y - 3.78)));                // helmet dome
  d = min(d, sdBox2(q - vec2(0.08, 3.78), vec2(0.42, 0.05)));                          // brim
  d = min(d, sdTaper(q, vec2(-0.1, 2.3), vec2(0.35, 1.95), 0.17, 0.13));               // leg over the flank
  d = min(d, sdTaper(q, vec2(0.1, 3.2), vec2(0.55, 3.9), 0.11, 0.09));
  d = min(d, sdTaper(q, vec2(0.55, 3.9), vec2(0.62, 4.55), 0.06, 0.08));               // torch stick
  flame = sdTaper(q, vec2(0.62, 4.6), vec2(0.6 + 0.1 * sin(ph * 2.0), 5.25), 0.16, 0.02);
  return d;
}
float riders(vec2 p, float groundBase, float groundAmp, float gScale, float gSeed, out float flame, out float glowD) {
  float d = 1e3; flame = 1e3; glowD = 1e3;
  for (int k = 0; k < 4; k++) {
    float s = uR[k * 4 + 3];
    if (s <= 0.0) continue;
    float x = uR[k * 4];
    float y = ridge(x, groundBase, groundAmp, gScale, gSeed) - 0.15 * s;
    vec2 q = (p - vec2(x, y)) / s;
    q.x *= uR[k * 4 + 1];
    if (length(q - vec2(0.0, 2.5)) > 4.5) { d = min(d, (length(q - vec2(0.0, 2.5)) - 4.0) * s); glowD = min(glowD, length(q - vec2(0.62, 4.9)) * s); continue; }
    float fl;
    d = min(d, horseRider(q, uR[k * 4 + 2], fl) * s);
    flame = min(flame, fl * s);
    glowD = min(glowD, length(q - vec2(0.62, 4.9)) * s);
  }
  return d;
}
`;

// a hill sheet with a road along its crest and riders on it
export function riderHill({ z, base, amp, scale = 0.03, seed = 50, col = [0.3, 0.3, 0.32], trans = 0.3 } = {}) {
  const R = `${F(base)}, ${F(amp)}, ${F(scale)}, ${F(seed)}`;
  return {
    z,
    sd: `float y = ridge(p.x, ${R});
      float d = torn(sdBelow(p, y), p, 0.25, ${F(seed)}, hq);
      float fl, gd; d = min(d, riders(p, ${R}, fl, gd));
      d = min(d, fl);
      return d;`,
    mat: `float fl, gd; float r = riders(p, ${R}, fl, gd);
      if (fl < 0.02) return mGlow(vec3(5.0, 2.3, 0.7) * (0.8 + 0.4 * vnoise(p * 8.0 + uTime * 9.0)));
      float y = ridge(p.x, ${R});
      if (r < 0.02) { Mat m = mCard(lin(vec3(0.05, 0.045, 0.04))); m.seed = 3.0; return m; }
      Mat m = mPaper(lin(${v3(col)})); m.trans = ${F(trans)}; m.seed = ${F(seed)};
      m.alb *= 0.8 + 0.3 * brush(p * 0.7, 0.2, ${F(seed)});
      float depth = sat((y - p.y) / 10.0);
      m.alb *= 1.0 - 0.6 * sqrt(depth);
      // the road: a pale worn band just under the crest, ruts in charcoal
      float road = smoothstep(0.5, 0.2, abs(y - p.y - 0.9) - 0.35);
      m.alb = mix(m.alb, lin(vec3(0.5, 0.44, 0.36)), road * 0.55);
      // torchlight warming the road around the flames
      m.alb += lin(vec3(0.9, 0.45, 0.15)) * 0.25 * exp(-gd * 0.35) * 0.0;
      return m;`,
  };
}

// a strip of the stream: dark painted paper, its top edge rolling, the whole strip buckling in depth
// (on twos: uK[5] holds the stepped time). glint: silver-foil bands catching the moon.
export function streamStrip({ z, top, amp = 0.35, seed = 60, col = [0.1, 0.12, 0.16], glint = 0.5, speed = 1.0 } = {}) {
  const T = `uK[5] * ${F(speed)}`;
  return {
    z: `return ${F(z)} + 0.7 * sin(p.x * 0.23 + ${T} * 1.7 + ${F(seed)}) * (0.6 + 0.4 * sin(p.x * 0.07 + ${F(seed)}));`,
    sd: `float y = ${F(top)} + ${F(amp)} * sin(p.x * 0.55 - ${T} * 2.6 + ${F(seed)}) + ${F(amp * 0.5)} * sin(p.x * 1.3 + ${T} * 1.9 + ${F(seed * 2)});
      return torn(sdBelow(p, y), p, 0.12, ${F(seed)}, hq);`,
    mat: `float y = ${F(top)} + ${F(amp)} * sin(p.x * 0.55 - ${T} * 2.6 + ${F(seed)}) + ${F(amp * 0.5)} * sin(p.x * 1.3 + ${T} * 1.9 + ${F(seed * 2)});
      vec2 q = p - vec2(${T} * -1.5, 0.0);
      // glints: torn bands of silver foil along the flow, near the top of the strip
      float band = smoothstep(0.55, 0.75, vnoise(vec2(q.x * 0.35, (y - p.y) * 2.2) + ${F(seed)})) * smoothstep(1.6, 0.2, y - p.y);
      if (band * ${F(glint)} > 0.3) { Mat f = mFoil(lin(vec3(0.62, 0.66, 0.72)), false); f.seed = ${F(seed)}; return f; }
      Mat m = mPaper(lin(${v3(col)})); m.trans = 0.25; m.seed = ${F(seed)};
      m.alb *= 0.7 + 0.5 * brush(q * vec2(0.6, 2.0), 0.0, ${F(seed)});
      m.alb *= 1.0 - 0.5 * sat((y - p.y) / 4.0);
      return m;`,
  };
}

// stepping stones: flat-topped rocks with their tops at y (Ehud's feet), xs centres
export function steppingStones({ z, xs, y = -8, seed = 70, col = [0.4, 0.38, 0.36] } = {}) {
  const n = xs.length;
  return {
    z,
    sd: `float d = 1e3; float X[${n}] = float[${n}](${xs.map(F).join(', ')});
      for (int k = 0; k < ${n}; k++) {
        vec2 q = p - vec2(X[k], ${F(y)});
        float r = hash11(float(k) + ${F(seed)});
        float s = sdEllipsoid(vec3(q - vec2(0.0, -1.3), 0.0), vec3(2.5 + 0.6 * r, 1.6, 1.0));
        s = max(s, q.y - 0.05 * sin(q.x * 3.0 + r * 5.0));
        d = min(d, torn(s, p, 0.12, float(k) + ${F(seed)}, hq));
      }
      return d;`,
    mat: `Mat m = mCard(lin(${v3(col)})); m.tear = 0.5; m.bump = 1.5; m.seed = ${F(seed)};
      m.alb *= 0.65 + 0.55 * fbm(p * 0.9 + ${F(seed)}, 4);
      m.alb *= 1.0 - 0.6 * smoothstep(${F(y)} - 0.4, ${F(y)} - 2.6, p.y);   // wet and dark below the top
      return m;`,
  };
}

// a stand of big pines of black card: trunk and tiers, each tier a torn triangle. xs/ys: foot of each
// tree, hs: heights. sway: GLSL for a sideways lean of the tops (e.g. a slam on the drums).
export function pines({ z, xs, ys, hs, seed = 100, col = [0.08, 0.08, 0.09], sway = '0.0', ground = null } = {}) {
  const n = xs.length;
  const A = (a) => `float[${n}](${a.map(F).join(', ')})`;
  return {
    z, opac: 1.0,
    sd: `float d = 1e3; float X[${n}] = ${A(xs)}; float Y[${n}] = ${A(ys)}; float H[${n}] = ${A(hs)};
      for (int k = 0; k < ${n}; k++) {
        vec2 q = p - vec2(X[k], Y[k]); float h = H[k];
        if (abs(q.x) > h * 0.4 || q.y < -1.0 || q.y > h * 1.05) { d = min(d, max(abs(q.x) - h * 0.35, max(-q.y - 1.0, q.y - h))); continue; }
        float r = hash11(float(k) + ${F(seed)});
        q.x -= (${sway}) * (q.y / h) * (q.y / h) * (0.6 + 0.8 * r);
        float tr = sdBox2(q - vec2(0.0, h * 0.2), vec2(h * 0.025, h * 0.22));
        for (int j = 0; j < 5; j++) {
          float y0 = h * (0.05 + 0.18 * float(j));
          float w = h * (0.17 - 0.027 * float(j)) * (0.85 + 0.3 * hash11(float(k * 7 + j) + ${F(seed)}));
          float th = h * (0.25 - 0.012 * float(j));
          tr = min(tr, sdTri(q, vec2(-w, y0), vec2(w, y0 + h * 0.02 * (r - 0.5)), vec2(0.0, y0 + th)));
        }
        d = min(d, torn(tr, p, 0.12, float(k) + ${F(seed)}, hq));
      }
      ${ground ? `d = min(d, torn(sdBelow(p, ${ground}), p, 0.3, ${F(seed)}, hq));` : ''}
      return d;`,
    mat: `Mat m = mCard(lin(${v3(col)})); m.tear = 0.5; m.fuzz = 0.04; m.trans = 0.12; m.seed = ${F(seed)};
      m.alb *= 0.75 + 0.4 * brush(p, 1.4, ${F(seed)});
      return m;`,
  };
}

// Eglon's palace far behind: a cut-paper silhouette on a low rise, lattice windows glowing with the
// lamps still burning inside, palms of cut card beside it. GLSL for hills({ extra }) (q = sheet point).
export const palaceGLSL = (x, y, s) => `
  { vec2 c = (q - vec2(${F(x)}, ${F(y)})) / ${F(s)};
    float pal = sdBox2(c - vec2(0.0, 2.0), vec2(6.0, 2.0));                 // the long hall
    pal = min(pal, sdBox2(c - vec2(-5.2, 3.5), vec2(1.1, 3.5)));            // towers
    pal = min(pal, sdBox2(c - vec2(5.2, 3.5), vec2(1.1, 3.5)));
    pal = min(pal, sdBox2(c - vec2(0.5, 5.2), vec2(2.6, 1.3)));             // the summer room on the roof
    pal = min(pal, sdBox2(vec2(mod(c.x + 0.25, 0.5) - 0.25, c.y - 4.15), vec2(0.13, 0.2)) + max(0.0, abs(c.x) - 6.0) * 9.0);   // crenels
    for (int k = 0; k < 3; k++) {                                           // palms
      float px = -9.5 + float(k) * 2.2 + (k == 2 ? 15.5 : 0.0);
      pal = min(pal, sdTaper(c, vec2(px, 0.0), vec2(px + 0.4, 5.0 + float(k)), 0.18, 0.1));
      for (int j = 0; j < 5; j++) { float a = -1.2 + float(j) * 0.6; vec2 tp = vec2(px + 0.4, 5.0 + float(k)); pal = min(pal, sdTaper(c, tp, tp + vec2(sin(a), cos(a) * 0.5 - 0.25) * 2.0, 0.16, 0.02)); }
    }
    d = min(d, pal * ${F(s)}); }`;
// the lit windows of that palace (for matExtra: returns a glow where a window is)
export const palaceWinGLSL = (x, y, s) => `
  { vec2 c = (q - vec2(${F(x)}, ${F(y)})) / ${F(s)};
    vec2 wc = vec2(mod(c.x, 0.9) - 0.45, mod(c.y, 1.3) - 0.65);
    float inHall = step(max(abs(c.x) - 5.6, abs(c.y - 2.0) - 1.4), 0.0) + step(max(abs(c.x - 0.5) - 2.2, abs(c.y - 5.2) - 0.9), 0.0);
    float w = sdBox2(wc, vec2(0.14, 0.26));
    if (inHall > 0.0 && w < 0.0 && hash12(floor(c / vec2(0.9, 1.3)) + 2.0) > 0.45) return mGlow(vec3(3.2, 1.7, 0.6) * (0.7 + 0.3 * hash12(floor(c / vec2(0.9, 1.3)))));
  }`;
