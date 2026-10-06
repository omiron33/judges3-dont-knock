// Ehud's night escape as a paper diorama: moonlit hills of torn cardstock layered toward the hill
// country of Ephraim, the carved standing stones by Gilgal, a path of torn earth, a painted night
// sky with a tissue moon and pinhole stars against a light box, clouds of torn paper on thread.
//
// A scene builds its own stack from the sheet makers below (front to back) with world([...]):
// each maker returns { z, sd, mat, opac } as GLSL snippets. Shared animation uniforms: uK[8]
// (free per-scene values, e.g. slams), uGr (the path's ground line y = x0 + x1*x + x2*sin(x*x3)),
// and Ehud's pose uFig[12] with uHB, uCloak, uCloakPh, uHorn (lib/x-escape-fig.js).
import { PAPER_HEAD, PAPER_TRACE, PAPER_UNIFORMS } from '/song/lib/paper.js';
import { PUPPET_GLSL, pose } from '/song/lib/puppet.js';
import { ESCFIG_GLSL, runPose, stepIdx, stepAt } from '/song/lib/x-escape-fig.js';

export { pose, runPose, stepIdx, stepAt };
export const F = (x) => { const s = Number(x).toFixed(4); return s; };

export const ESC_UNIFORMS = {
  ...PAPER_UNIFORMS,
  uFig: pose({ style: 2 }), uHB: 0, uCloak: 0.8, uCloakPh: 0, uHorn: 0,
  uK: new Array(8).fill(0), uGr: [0, 0, 0, 1],
};

const COMMON = /* glsl */ `
uniform float uK[8];
uniform vec4 uGr;
float groundY(float x) { return uGr.x + uGr.y * x + uGr.z * sin(x * uGr.w); }
// grass and weeds of cut paper along a line y0(x): blades in cells of width w, height h
float blades(vec2 p, float y0, float w, float h, float seed) {
  float d = 1e3;
  float c0 = floor(p.x / w);
  for (int k = -1; k <= 1; k++) {
    float c = c0 + float(k);
    float r = hash11(c * 0.73 + seed);
    if (hash11(c * 2.31 + seed * 1.7) < 0.45) continue;
    float x0 = (c + 0.5) * w + (r - 0.5) * w * 0.6;
    float hh = h * (0.35 + 0.9 * hash11(c * 1.37 + seed + 3.0));
    float lean = (hash11(c + seed * 7.0) - 0.5) * 0.9;
    d = min(d, sdTaper(p, vec2(x0, y0 - 0.2), vec2(x0 + lean * hh, y0 + hh), w * 0.4, 0.02));
  }
  return d;
}
`;

// assemble the world GLSL from a list of sheets (front to back)
export function world(sheets, extra = '') {
  let g = PAPER_HEAD + PUPPET_GLSL + ESCFIG_GLSL + COMMON + extra + `\n#define NL ${sheets.length}\n`;
  sheets.forEach((s, k) => {
    const z = typeof s.z === 'number' ? `return ${F(s.z)};` : s.z;
    g += `float esZ${k}(vec2 p) { ${z} }\nfloat esSD${k}(vec2 p, bool hq) { ${s.sd} }\nMat esM${k}(vec2 p, float sd) { ${s.mat} }\n`;
  });
  g += 'float sheetZ(int i, vec2 p) {\n' + sheets.map((s, k) => `  if (i == ${k}) return esZ${k}(p);`).join('\n') + '\n  return 1e4;\n}\n';
  g += 'float sheetSD(int i, vec2 p, bool hq) {\n' + sheets.map((s, k) => `  if (i == ${k}) return esSD${k}(p, hq);`).join('\n') + '\n  return 1e3;\n}\n';
  g += 'Mat sheetMat(int i, vec2 p, float sd) {\n' + sheets.map((s, k) => `  if (i == ${k}) return esM${k}(p, sd);`).join('\n') + '\n  return mCard(vec3(0.0));\n}\n';
  g += 'float sheetOpac(int i) {\n' + sheets.map((s, k) => `  if (i == ${k}) return ${F(s.opac ?? 1)};`).join('\n') + '\n  return 1.0;\n}\n';
  return g + PAPER_TRACE;
}

const v3 = (c) => `vec3(${F(c[0])}, ${F(c[1])}, ${F(c[2])})`;

// ---------------- sheet makers ----------------

// foreground: black torn card with cut grass, the nearest silhouette
export function fgRocks({ z = 0, base = -12, amp = 6, scale = 0.06, seed = 1, col = [0.06, 0.055, 0.05], grass = 1.6, slide = '0.0' } = {}) {
  return {
    z,
    sd: `vec2 q = p - vec2(${slide}, 0.0); float y = ridge(q.x, ${F(base)}, ${F(amp)}, ${F(scale)}, ${F(seed)});
      float d = torn(sdBelow(q, y), q, 0.3, ${F(seed)}, hq);
      ${grass > 0 ? `if (hq || true) d = min(d, blades(q, y, 0.55, ${F(grass)}, ${F(seed)}));` : ''}
      return d;`,
    mat: `Mat m = mCard(lin(${v3(col)})); m.tear = 0.2; m.fuzz = 0.03; m.trans = 0.15; m.seed = ${F(seed)};
      m.alb *= 0.8 + 0.4 * brush(p, 0.4, ${F(seed)}); return m;`,
  };
}

// a range of hills of torn paper / cardstock; extra: GLSL that may lower d further (trees, rocks)
export function hills({ z, base, amp, scale = 0.03, seed = 3, col = [0.2, 0.2, 0.22], trans = 0.3, tearAmt = 0.4, hatchAmt = 0.25, extra = '', matExtra = '', slide = '0.0', paper = true, tear = 1.0 } = {}) {
  return {
    z,
    sd: `vec2 q = p - vec2(${slide}, 0.0); float y = ridge(q.x, ${F(base)}, ${F(amp)}, ${F(scale)}, ${F(seed)});
      float d = torn(sdBelow(q, y), q, ${F(tearAmt)}, ${F(seed)}, hq);
      ${extra}
      return d;`,
    mat: `vec2 q = p - vec2(${slide}, 0.0); float y = ridge(q.x, ${F(base)}, ${F(amp)}, ${F(scale)}, ${F(seed)});
      Mat m = ${paper ? 'mPaper' : 'mCard'}(lin(${v3(col)})); m.trans = ${F(trans)}; m.seed = ${F(seed)}; m.tear = ${F(tear)};
      m.alb *= 0.8 + 0.3 * brush(q * 0.7, 0.25 + 0.2 * sin(${F(seed)}), ${F(seed)});
      // charcoal hatching deepening down the slope, lighter at the moonlit crest
      float depth = sat((y - q.y) / ${F(Math.max(amp, 4) * 1.4)});
      m.alb *= 1.0 - ${F(hatchAmt)} * hatch(q * 0.55, 0.25 + 0.5 * depth, 1.3) * (0.4 + 0.6 * depth);
      m.alb *= 1.0 - 0.65 * sqrt(depth);
      ${matExtra}
      return m;`,
  };
}

// the carved standing stones (the quarries / idols by Gilgal) on a mound. xs: stone centres;
// heights hs. kick: uK index that slams the row into place (the stones drop a little on a hit)
export function stones({ z, xs, hs, y = -6, seed = 11, kick = -1, col = [0.33, 0.32, 0.3], moundAmp = 2.0 } = {}) {
  const n = xs.length;
  const arr = (a) => `float[${n}](${a.map(F).join(', ')})`;
  const drop = kick >= 0 ? `uK[${kick}]` : '0.0';
  return {
    z,
    sd: `float d = torn(sdBelow(p, ${F(y)} + ${F(moundAmp)} * (0.6 + 0.4 * sin(p.x * 0.11 + ${F(seed)})) - 0.4), p, 0.25, ${F(seed)}, hq);
      float X[${n}] = ${arr(xs)}; float H[${n}] = ${arr(hs)};
      for (int k = 0; k < ${n}; k++) {
        float h = H[k]; vec2 c = vec2(X[k], ${F(y)} + ${drop} * (0.4 + 0.3 * float(k % 2)));
        vec2 q = p - c;
        float r = hash11(float(k) * 3.1 + ${F(seed)});
        q.x += q.y * (r - 0.5) * 0.16;                        // a lean
        // a rough-hewn monolith: the sides wander, it tapers, the top is broken at a slant
        float u = sat(q.y / h);
        float w = h * (0.17 + 0.07 * r) * (1.0 - 0.3 * u) * (0.9 + 0.25 * vnoise(vec2(q.y * 0.35, float(k) * 7.0)));
        float s = abs(q.x + h * 0.03 * sin(q.y * 0.4 + r * 6.0)) - w;
        float top = h * (0.92 + 0.08 * sin(r * 17.0)) + q.x * (r - 0.5) * 0.9 - 0.25 * abs(sin(q.x * 2.3 + r * 9.0));
        s = max(s, q.y - top);
        s = max(s, -q.y - 1.0);
        // idols: a carved head on a neck, shoulders cut square
        if (r > 0.5) {
          float hw = h * (0.17 + 0.07 * r) * 0.46;
          vec2 hq2 = q - vec2(0.0, h * 0.82 + hw * 0.6);
          float idol = sdEllipsoid(vec3(hq2, 0.0), vec3(hw * 0.85, hw, 1.0));
          // a flat-topped crown with a pair of curled horns, like the old gods of Moab
          idol = min(idol, sdBox2(hq2 - vec2(0.0, hw * 0.95), vec2(hw * 0.7 + (hq2.y - hw * 0.6) * 0.25, hw * 0.4)));
          vec2 hm = vec2(abs(hq2.x), hq2.y);
          idol = min(idol, sdTaper(hm, vec2(hw * 0.6, hw * 0.75), vec2(hw * 1.45, hw * 1.25), hw * 0.2, hw * 0.07));
          idol = min(idol, sdTaper(hm, vec2(hw * 1.45, hw * 1.25), vec2(hw * 1.5, hw * 1.8), hw * 0.07, hw * 0.02));
          s = min(max(s, q.y - h * 0.8), idol);
        }
        d = min(d, torn(s, p, 0.18, float(k) + ${F(seed)}, hq));
      }
      return d;`,
    mat: `Mat m = mCard(lin(${v3(col)})); m.tear = 0.6; m.fuzz = 0.03; m.trans = 0.05; m.seed = ${F(seed)}; m.bump = 1.4;
      // pulp stone: mottled, and carved: rings, notches and spirals cut with a knife, rubbed with charcoal
      m.alb *= 0.7 + 0.5 * fbm(p * 0.6 + ${F(seed)}, 4);
      float X[${n}] = ${arr(xs)}; float H[${n}] = ${arr(hs)};
      float carve = 0.0;
      for (int k = 0; k < ${n}; k++) {
        vec2 q = p - vec2(X[k], ${F(y)} + ${drop} * (0.4 + 0.3 * float(k % 2)));
        float h = H[k];
        if (abs(q.x) > h * 0.4 || q.y < 0.0 || q.y > h * 1.1) continue;
        float r = hash11(float(k) * 3.1 + ${F(seed)});
        q.x += q.y * (r - 0.5) * 0.16;
        // rings near the foot, a band of zigzag, a sunk spiral eye on the plain stones
        float ring = abs(fract(q.y / h * 6.0 + r) - 0.5);
        carve = max(carve, smoothstep(0.05, 0.0, ring - 0.0) * step(h * 0.08, q.y) * step(q.y, h * 0.22));
        float zz = abs(q.y - h * 0.5 - 0.35 * abs(fract(q.x * 0.9 + r) - 0.5) * 2.0 + 0.35);
        carve = max(carve, smoothstep(0.1, 0.03, zz) * (1.0 - step(0.5, r)));
        vec2 sc = q - vec2(0.0, h * (0.68 + 0.05 * r));
        float sp = abs(fract((atan(sc.y, sc.x) / 6.2832) + length(sc) * 1.1) - 0.5);
        carve = max(carve, smoothstep(0.08, 0.0, sp - 0.02) * smoothstep(h * 0.12, h * 0.06, length(sc)) * (1.0 - step(0.5, r)));
        // idols: hollow eyes, a slot mouth, arms folded across the body as incised lines
        if (r > 0.5) {
          float w = h * (0.17 + 0.07 * r) * 0.46;
          vec2 fc = q - vec2(0.0, h * 0.82 + w * 0.6);
          vec2 e1 = fc - vec2(-w * 0.34, w * 0.05), e2 = fc - vec2(w * 0.34, w * 0.05);
          carve = max(carve, smoothstep(0.05, 0.0, min(length(e1 * vec2(0.55, 1.6)), length(e2 * vec2(0.55, 1.6))) - w * 0.12));
          carve = max(carve, smoothstep(0.05, 0.0, sdSeg(fc, vec2(0.0, w * 0.3), vec2(0.0, -w * 0.3), 0.04)) * 0.6);
          carve = max(carve, smoothstep(0.05, 0.0, abs(fc.y - w * 0.5) - 0.05) * step(abs(fc.x), w * 1.1));
          float arm = min(abs(q.y - h * 0.55 + q.x * 0.5), abs(q.y - h * 0.55 - q.x * 0.5));
          carve = max(carve, smoothstep(0.08, 0.02, arm) * step(abs(q.x), w * 1.2) * step(h * 0.4, q.y) * step(q.y, h * 0.7));
        }
      }
      m.alb *= 1.0 - 0.75 * carve;
      m.alb *= 1.0 - 0.45 * smoothstep(${F(y)} + 3.0, ${F(y)} - 1.0, p.y);
      return m;`,
  };
}

// the path he runs on: a strip of torn earth along groundY(x), with Ehud on it. strip: how far the
// earth falls below the line (cm). figure: draw Ehud here.
export function path({ z, seed = 21, col = [0.13, 0.11, 0.09], grass = 0.9, figure = true, below = 30, extra = '', extraMat = '', ground = true } = {}) {
  return {
    z,
    sd: `float y = groundY(p.x);
      float d = ${ground ? '' : '1e3; if (false) d = '}torn(max(sdBelow(p, y), -(p.y - y + ${F(below)})), p, 0.2, ${F(seed)}, hq);
      ${grass > 0 ? `d = min(d, blades(p, y, 0.7, ${F(grass)}, ${F(seed)} + 5.0));` : ''}
      ${figure ? `int pt; vec2 lp; float sh; d = min(d, figureE(p, figAt(uFig), pt, lp, sh, hq));` : ''}
      ${extra}
      return d;`,
    mat: `${figure ? `{ int pt; vec2 lp; float sh; Fig f = figAt(uFig); float a = figureE(p, f, pt, lp, sh, true);
        if (a < 0.03 && pt != PT_NONE) return ehudMat(pt, lp, sh, f); }` : ''}
      ${extraMat}
      Mat m = mPaper(lin(${v3(col)})); m.trans = 0.2; m.tear = 0.35; m.seed = ${F(seed)};
      m.alb *= 0.7 + 0.5 * brush(p, 0.05, ${F(seed)});
      m.alb *= 1.0 - 0.5 * sat((groundY(p.x) - p.y) / 6.0);
      return m;`,
  };
}

// clouds of torn paper hanging on thread
export function clouds({ z, y = 60, n = 4, span = 160, x0 = -80, w = 14, drift = 'uTime * 0.0', seed = 31, col = [0.2, 0.2, 0.23] } = {}) {
  return {
    z, opac: 0.85,
    sd: `float d = 1e3;
      for (int k = 0; k < ${n}; k++) {
        vec2 c = vec2(${F(x0)} + float(k) * ${F(span / n)} + ${drift} * (1.0 + float(k) * 0.3), ${F(y)} + 10.0 * hash11(float(k) + ${F(seed)}));
        vec2 q = p - c;
        float ww = ${F(w)} * (0.7 + 0.6 * hash11(float(k) + 2.0));
        float cl = 1e3;
        for (int j = 0; j < 5; j++) { float fx = (float(j) / 4.0 - 0.5) * 1.6 * ww; float r = (0.18 + 0.16 * hash11(float(k * 5 + j) + 0.7)) * ww * (1.0 - 0.5 * abs(fx) / ww); cl = min(cl, sdCircle(q - vec2(fx, 0.2 * r), r)); }
        cl = max(cl, -q.y - 0.4);
        cl = torn(cl, p, 0.5, float(k) + ${F(seed)}, hq);
        float th = sdBox2(q - vec2(ww * 0.2, 60.0), vec2(0.04, 58.0));
        d = min(d, min(cl, th));
      }
      return d;`,
    mat: `Mat m = mPaper(lin(${v3(col)})); m.trans = 0.75; m.fuzz = 0.12; m.seed = ${F(seed)};
      m.alb *= 0.75 + 0.4 * brush(p, 0.1, ${F(seed)}); return m;`,
  };
}

// the painted night sky: a wash darker toward the top, the moon cut out (the light box shows through
// tissue), pinholes for stars. moon: [x, y, r] or null. dawn: 0..1 warms the low sky.
export function sky({ z, moonK = 1.0, moonCol = [1.6, 1.75, 2.15], haloK = 1.0, moon = [-40, 60, 7], top = [0.03, 0.035, 0.05], low = [0.12, 0.12, 0.15], y0 = 0, y1 = 110, seed = 41, stars = 0.82, starMin = 30 } = {}) {
  return {
    z, opac: 0.8,
    sd: `float d = -1.0;
      vec2 c = floor(p / 3.0); vec2 h = hash22(c + ${F(seed)});
      float st = length(p - (c + h) * 3.0) - (0.05 + 0.07 * hash12(c + 5.0));
      if (hash12(c + 1.0) > ${F(stars)} && p.y > ${F(starMin)}) d = max(d, -st);
      return d;`,
    mat: `float moonHalo = 0.0; float moonK = ${F(moonK)};
      ${moon ? `{ vec2 mq = p - vec2(${F(moon[0])}, ${F(moon[1])});
        float md = torn(sdCircle(mq, ${F(moon[2])}), p, 0.15, 3.0, true);
        // the tissue moon, lit from behind: mottled pulp, a faint darker sea or two
        if (md < 0.0) return mGlow(${v3(moonCol)} * moonK * (0.86 + 0.18 * pulp(p * 2.0, 5.0)) * (1.0 - 0.12 * smoothstep(0.55, 0.7, fbm(mq * 0.25 + 3.0, 3))));
        // its halo on the painted sky
        moonHalo = exp(-max(md, 0.0) * ${F(1.6 / moon[2])}) * 0.5; }` : ''}
      vec3 a = mix(lin(${v3(low)}), lin(${v3(top)}), smoothstep(${F(y0)}, ${F(y1)}, p.y));
      a *= 0.75 + 0.4 * brush(p * 0.4, 0.12, ${F(seed)});
      Mat m = mPaper(a); m.trans = 0.3; m.tear = 0.0; m.seed = ${F(seed)};
      m.emit = ${v3(moonCol)} * 0.19 * moonHalo * moonK * 0.25 * ${F(haloK)};
      return m;`,
  };
}

// the light box behind everything (glows through the moon and stars)
export function lightBox({ z, col = [1.6, 1.8, 2.3], warm = null } = {}) {
  return {
    z, opac: 0.0, sd: 'return -1.0;',
    mat: warm ? `return mGlow(mix(${v3(warm[0])}, ${v3(col)}, smoothstep(${F(warm[1])}, ${F(warm[2])}, p.y)));` : `return mGlow(${v3(col)});`,
  };
}

// a stand of pines / scrub along a ridge line (GLSL to put in hills({extra}))
export const treesOn = (w = 1.8, hMin = 3, hMax = 7, seed = 5, x0 = -1e3, x1 = 1e3) => `
  { float cx = floor(q.x / ${F(w)});
    for (int k = -1; k <= 1; k++) {
      float c = cx + float(k);
      float x0 = c * ${F(w)} + ${F(w / 2)} + (hash11(c + ${F(seed)}) - 0.5) * ${F(w * 0.4)};
      if (x0 < ${F(x0)} || x0 > ${F(x1)} || hash11(c * 1.9 + ${F(seed)}) < 0.3) continue;
      float hh = ${F(hMin)} + ${F(hMax - hMin)} * hash11(c * 0.37 + ${F(seed)});
      float base = ridge(x0, ${'BASE'}, ${'AMP'}, ${'SCALE'}, ${'SEED'}) - 0.6;
      float tr = sdTri(q, vec2(x0 - hh * 0.28, base + hh * 0.15), vec2(x0 + hh * 0.28, base + hh * 0.15), vec2(x0, base + hh));
      tr = min(tr, sdTri(q, vec2(x0 - hh * 0.36, base - 0.3), vec2(x0 + hh * 0.36, base - 0.3), vec2(x0, base + hh * 0.62)));
      d = min(d, torn(tr, q, 0.08, c, hq));
    } }`;
// hills with trees: fills the ridge parameters into treesOn
export function woodedHills(o) {
  const t = treesOn(o.treeW ?? 1.8, o.treeMin ?? 3, o.treeMax ?? 7, (o.seed ?? 3) + 2, o.treeX0 ?? -1e3, o.treeX1 ?? 1e3)
    .replace("'BASE'", '').replace('BASE', F(o.base)).replace('AMP', F(o.amp)).replace('SCALE', F(o.scale ?? 0.03)).replace('SEED', F(o.seed ?? 3));
  return hills({ ...o, extra: (o.extra ?? '') + t });
}

// ---------------- lights ----------------
// The moon behind the set (rim light through and around the paper) plus a cool soft front fill.
export function moonLights({ moonDir = [-0.35, 0.5, 0.8], k = 1.6, front = 0.9, frontDir = [0.45, 0.4, -0.8], rimPos = null, rimK = 0, extra = [] } = {}) {
  const Lc = (r, g, b, s) => [r, g, b].map((v) => Math.pow(v / 255, 2.2) * s);
  const l = [
    { dir: moonDir, col: Lc(190, 205, 235, k), rad: 1 },
    { dir: frontDir, col: Lc(150, 165, 200, front), rad: 2 },
  ];
  if (rimPos) l.push({ pos: rimPos, col: Lc(200, 215, 245, rimK), rad: 1.5, range: 30 });
  return l.concat(extra);
}

// paper chips kicked up by a skid: small torn flecks thrown from o, tau seconds after the skid
// (stepped), flying toward dir (-1 left, +1 right). GLSL for path({ extra }) using uK slots.
export const chipsGLSL = (ox, oy, tau, dir, n = 9) => `
  { float tt = ${tau};
    if (tt > 0.0 && tt < 0.9) for (int k = 0; k < ${n}; k++) {
      float r1 = hash11(float(k) * 1.7 + 0.3), r2 = hash11(float(k) * 2.9 + 1.1);
      vec2 c = vec2(${ox}, ${oy}) + vec2(${dir} * (6.0 + 10.0 * r1) * tt, (9.0 + 9.0 * r2) * tt - 30.0 * tt * tt);
      if (c.y < ${oy} - 0.3) continue;
      vec2 q = rot(r1 * 6.0 + tt * (8.0 + 6.0 * r2)) * (p - c);
      float s = 0.18 + 0.2 * r2;
      d = min(d, sdTri(q, vec2(-s, -s * 0.6), vec2(s, -s * 0.4), vec2(0.0, s)));
    } }`;
