// The sand-glass room (s18): a wooden sand-glass with mica bulbs and paper sand on a table, a dark
// plastered wall with an arched window, and through it the moonlit hills where tiny Ehud runs over the
// last ridge. Sheets for world() in lib/x-escape.js. uK[0]: sand run (0 full top .. 1 all fallen),
// uK[1]: a jolt of the glass on the drums (cm), uK[2]: the stream's flicker (stepped).
import { F } from '/song/lib/x-escape.js';

// the window: an arch in the wall, x0..x1, sill y0, spring of the arch ys
export const WIN = { x0: 9, x1: 31, y0: 2, ys: 8 };

export const GLASS_GLSL = /* glsl */ `
// sand-glass space: centre of the neck at the origin
float glassFrame(vec2 q) {
  float d = sdBox2(q - vec2(0.0, 8.0), vec2(4.6, 0.55));                 // top plate
  d = min(d, sdBox2(q - vec2(0.0, 8.75), vec2(3.9, 0.25)));
  d = min(d, sdBox2(q - vec2(0.0, -8.0), vec2(4.6, 0.55)));              // foot
  d = min(d, sdBox2(q - vec2(0.0, -8.75), vec2(3.9, 0.25)));
  for (int k = 0; k < 2; k++) {
    float x = k == 0 ? -3.85 : 3.85;
    // a turned post: beads and a long swelling shaft
    float r = 0.28 + 0.1 * sin(q.y * 1.6) + 0.18 * exp(-pow(q.y * 0.5, 2.0)) + 0.16 * exp(-pow((abs(q.y) - 6.6) * 2.5, 2.0));
    d = min(d, max(abs(q.x - x) - r, abs(q.y) - 7.6));
  }
  return d;
}
float bulbSD(vec2 q) {
  float a = sdEllipsoid(vec3(q - vec2(0.0, 3.85), 0.0), vec3(2.9, 3.6, 1.0));
  float b = sdEllipsoid(vec3(q - vec2(0.0, -3.85), 0.0), vec3(2.9, 3.6, 1.0));
  float d = smin(a, b, 0.9);
  return max(d, abs(q.y) - 7.45);
}
// paper sand: the pile left in the top bulb, the cone growing below, the thread of falling sand
float sandSD(vec2 q, float run, float fl) {
  float bulb = bulbSD(q) + 0.2;
  // top: sand below a level that sinks with a dimple at the neck
  float lvl = mix(5.6, 0.25, run) - 1.2 * exp(-q.x * q.x * 0.6) * sat(run * 4.0);
  float top = max(bulb, q.y - lvl);
  top = max(top, -q.y + 0.1);
  if (run > 0.985) top = 1e3;
  // bottom: a cone growing from the floor of the lower bulb
  float h = mix(0.3, 5.4, sqrt(run));
  float cone = q.y - (-7.3 + h * (1.0 - abs(q.x) / 2.9) + 0.12 * sin(q.x * 9.0 + fl));
  float bot = max(bulb, cone);
  bot = max(bot, q.y);
  // the falling thread
  float th = run < 0.985 ? sdBox2(q - vec2(0.03 * sin(q.y * 7.0 + fl * 3.0), (-7.3 + h) * 0.5), vec2(0.07, abs(-7.3 + h) * 0.5)) : 1e3;
  return min(min(top, bot), th);
}
`;

export function glassSheet({ z, x, y, seed = 120 } = {}) {
  const P0 = `vec2(${F(x)}, ${F(y)} + uK[1])`;
  return {
    z,
    sd: `vec2 q = p - ${P0};
      float d = glassFrame(q);
      float b = bulbSD(q);
      d = min(d, abs(b) - 0.09);                     // the mica: a thin rim
      d = min(d, sandSD(q, uK[0], uK[2]));
      // the table top
      d = min(d, torn(max(p.y - (${F(y)} - 9.0), -(p.y - ${F(y)} + 30.0)), p, 0.06, ${F(seed)}, hq));
      return d;`,
    mat: `vec2 q = p - ${P0};
      if (p.y < ${F(y)} - 9.0 + 0.05 && glassFrame(q) > 0.0) {
        Mat m = mCard(lin(vec3(0.24, 0.15, 0.09))); m.kind = K_WOOD; m.seed = ${F(seed)};
        m.alb *= 0.7 + 0.4 * (0.5 + 0.5 * sin(p.x * 3.0 + 4.0 * vnoise(p * vec2(0.3, 3.0))));
        m.alb *= 1.0 - 0.6 * sat((${F(y)} - 9.0 - p.y) / 6.0);
        return m;
      }
      if (sandSD(q, uK[0], uK[2]) < 0.03) {
        Mat m = mPaper(lin(vec3(0.72, 0.6, 0.42))); m.trans = 0.5; m.seed = ${F(seed)} + 2.0;
        m.alb *= 0.75 + 0.4 * vnoise(p * 14.0);     // grains of torn paper
        return m;
      }
      if (glassFrame(q) < 0.03) {
        Mat m = mCard(lin(vec3(0.3, 0.19, 0.11))); m.kind = K_WOOD; m.seed = ${F(seed)} + 1.0; m.bump = 1.2;
        m.alb *= 0.65 + 0.5 * (0.5 + 0.5 * sin(q.y * 1.2 + 6.0 * vnoise(q * vec2(4.0, 0.4))));
        m.alb = mix(m.alb, lin(vec3(0.7, 0.55, 0.3)), 0.25 * smoothstep(0.05, 0.0, abs(fract(q.y * 0.9) - 0.5) - 0.44));
        return m;
      }
      Mat m = mFoil(lin(vec3(0.7, 0.72, 0.74)), false); m.seed = ${F(seed)} + 3.0;   // mica
      return m;`,
  };
}

// the wall with its arched window; a deep reveal of black card, a wooden sill
export function wallSheet({ z, seed = 130 } = {}) {
  const w = WIN;
  const cx = (w.x0 + w.x1) / 2, hw = (w.x1 - w.x0) / 2;
  const win = `min(sdBox2(p - vec2(${F(cx)}, ${F((w.y0 + w.ys) / 2)}), vec2(${F(hw)}, ${F((w.ys - w.y0) / 2)})), max(sdCircle(p - vec2(${F(cx)}, ${F(w.ys)}), ${F(hw)}), -(p.y - ${F(w.ys)})))`;
  return {
    z,
    sd: `float d = -cut(${win}, p, ${F(seed)});
      return d;`,
    mat: `float wd = ${win};
      if (wd < 0.6 && p.y < ${F(w.y0)} + 0.1) { Mat m = mCard(lin(vec3(0.28, 0.18, 0.11))); m.kind = K_WOOD; m.seed = ${F(seed)}; return m; }
      Mat m = mPaper(lin(vec3(0.3, 0.27, 0.24))); m.tear = 0.0; m.trans = 0.1; m.seed = ${F(seed)};
      m.alb *= 0.7 + 0.4 * brush(p * 0.5, 0.3, ${F(seed)});
      m.alb *= 1.0 - 0.12 * hatch(p * 0.6, 0.3, 1.3);
      m.alb *= 0.45 + 0.55 * smoothstep(-0.1, 1.6, wd);            // the plaster darkens into the reveal
      return m;`,
  };
}
