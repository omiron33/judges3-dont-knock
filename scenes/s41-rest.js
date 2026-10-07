// s41-rest · (outro, 164.56-172.23). The quiet land of the eighty years under the evening: the ford
// with its stepping stones and the river of painted paper still rolling, stooks in the near field, a
// village on its hill with candlelit windows, strips of field and olive rows on the far slopes, the
// last sun low behind the hills. The camera pulls slowly back until the whole land is seen as what it
// is: a diorama in an old wooden box with a worn gold-leaf edge, standing in the dark.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, flicker, L, stepT } from '/song/lib/paper.js';
import { slam, KICKS } from '/song/lib/sync.js';
import { EPH_HEAD, EPH_UNIFORMS, PAPER_TRACE } from '/song/lib/x-ephraim.js';

export const kind = 'shader';

const GLSL = EPH_HEAD + /* glsl */ `
uniform float uWT, uBirdX;
#define NL 12
// 0 the box's front frame, 1 near bank and reeds, 2 near water, 3 the ford's stones, 4 far water,
// 5 the near field with stooks, 6 the village, 7 its candlelit lining, 8 the far fields, 9 far hills,
// 10 sky, 11 light box
float sheetZ(int i, vec2 p) {
  if (i == 0) return -6.0;
  if (i == 1) return 0.0;
  if (i == 2) return waterZ(5.0, p, 0.0, uWT, 0.35);
  if (i == 3) return 8.0;
  if (i == 4) return waterZ(11.0, p, 1.0, uWT, 0.3);
  if (i == 5) return 16.0;
  if (i == 6) return 28.0;
  if (i == 7) return 29.5;
  if (i == 8) return 42.0;
  if (i == 9) return 62.0;
  if (i == 10) return 92.0;
  return 98.0;
}
float sheetOpac(int i) { if (i == 7) return 0.5; if (i == 10) return 0.93; if (i == 11) return 0.0; return 1.0; }
// each flat of the diorama ends at the sides of the box
// (sized with depth so that from the farthest camera they stay hidden behind the box's front)
float ends(vec2 p, float z) {
  // wide enough to fill the view through the opening from every camera on the pull, yet hidden behind
  // the front of the box from the farthest one
  float w = 1.4 * (0.62 * (z + 45.0) + 4.0);
  float h = 1.4 * (0.344 * (z + 45.5) + 5.0);
  return sdBox2(p - vec2(0.0, 1.0), vec2(w, h));
}
float villageSD(vec2 p, bool holes) {
  float hill = ridge(p.x, -1.0, 3.0, 0.05, 31.0) + 4.0 * exp(-pow((p.x - 4.0) * 0.09, 2.0));
  float d = sdBelow(p, hill);
  for (int k = 0; k < 9; k++) {
    float fk = float(k);
    float x = -6.0 + fk * 2.2 + 0.6 * hash11(fk);
    float b = ridge(x, -1.0, 3.0, 0.05, 31.0) + 4.0 * exp(-pow((x - 4.0) * 0.09, 2.0)) - 0.5;
    float h = 1.4 + 1.2 * hash11(fk + 3.0);
    vec2 q = p - vec2(x, b);
    float house = sdBox2(q - vec2(0.0, h * 0.5), vec2(0.95, h * 0.5));
    if (k == 4) house = min(house, sdBox2(q - vec2(0.0, h + 1.2), vec2(0.6, 1.4)));   // a tower
    if (holes) {
      vec2 wq = vec2(mod(q.x + 0.25, 0.5) - 0.25, q.y - h * 0.55);
      float win = sdBox2(wq, vec2(0.1, 0.16));
      if (hash11(fk * 7.1) > 0.35 && abs(q.x) < 0.7) house = max(house, -win);
    }
    d = min(d, house);
  }
  return d;
}
float stooksSD(vec2 p) {
  float y = -5.5 + 0.8 * sin(p.x * 0.09);
  float d = sdBelow(p, y);
  float c = floor(p.x / 3.4);
  if (mod(c, 5.0) != 2.0) {
    vec2 q = vec2(p.x - (c + 0.5) * 3.4, p.y - y + 0.2);
    float st = sdTri(q, vec2(-0.75, 0.0), vec2(0.75, 0.0), vec2(0.0, 1.9));
    st = min(st, sdEllipsoid(vec3(q - vec2(0.0, 1.9), 0.0), vec3(0.55, 0.3, 1.0)));
    d = min(d, st);
  }
  // an old oak at the field's edge
  vec2 o = p - vec2(-17.0, y);
  float oak = sdTaper(o, vec2(0.0, 0.0), vec2(0.3, 4.0), 0.5, 0.3);
  oak = min(oak, sdEllipsoid(vec3(o - vec2(0.3, 5.6), 0.0), vec3(3.4, 2.4, 1.0)) + (vnoise(o * 1.6) - 0.5) * 0.7);
  return min(d, oak);
}
float farFieldsSD(vec2 p) {
  float y = ridge(p.x, 4.0, 6.0, 0.03, 33.0);
  float d = sdBelow(p, y);
  // olive rows on the slope
  float c = floor(p.x / 2.2);
  vec2 q = vec2(p.x - (c + 0.5) * 2.2, p.y - (y - 0.3));
  if (hash11(c * 1.3) > 0.4) d = min(d, sdEllipsoid(vec3(q - vec2(0.0, 0.5), 0.0), vec3(0.8, 0.55, 1.0)));
  return d;
}
float sheetSD(int i, vec2 p, bool hq) {
  if (i == 0) {
    // the front frame of the box: a thick wooden surround with an opening
    float opening = sdBox2(p - vec2(0.0, 1.0), vec2(24.0, 13.5));
    return 1e3;   // no box: the land stays a land; the ending returns to the book
  }
  if (i == 1) {
    float y = -11.0 + 1.0 * sin(p.x * 0.15) + 0.5 * sin(p.x * 0.4);
    float d = sdBelow(p, y);
    float cx = floor(p.x / 0.7);
    for (int k = -1; k <= 1; k++) {
      float c = cx + float(k);
      if (hash11(c * 0.37) < 0.45) continue;
      float x0 = c * 0.7 + 0.35;
      float h = 1.5 + 3.0 * hash11(c * 1.7);
      float bend = (hash11(c + 2.0) - 0.5) * 1.0 + 0.15 * sin(uTime * 0.9 + c);
      d = min(d, sdTaper(p, vec2(x0, y - 0.5), vec2(x0 + bend, y + h), 0.1, 0.02));
    }
    return max(torn(d, p, 0.15, 91.0, hq), ends(p, 0.0));
  }
  if (i == 2) return max(waterSD(p, -9.2, 20.0, uWT, hq), ends(p, 5.0));
  if (i == 3) {
    // the ford: flat stones laid across the shallows
    float d = 1e3;
    for (int k = 0; k < 8; k++) {
      float fk = float(k);
      vec2 c = vec2(-8.0 + fk * 2.6 + 0.5 * hash11(fk), -8.6 + 0.3 * sin(fk * 1.7));
      d = min(d, sdEllipsoid(vec3(p - c, 0.0), vec3(0.95 + 0.3 * hash11(fk + 2.0), 0.45, 1.0)));
    }
    return torn(d, p, 0.08, 92.0, hq);
  }
  if (i == 4) return max(waterSD(p, -7.6, 21.0, uWT, hq), ends(p, 11.0));
  if (i == 5) return max(torn(stooksSD(p), p, 0.12, 93.0, hq), ends(p, 16.0));
  if (i == 6) return max(torn(villageSD(p, true), p, 0.06, 94.0, hq), ends(p, 28.0));
  if (i == 7) return max(villageSD(p, false) + 0.2, ends(p, 28.0));
  if (i == 8) return max(torn(farFieldsSD(p), p, 0.15, 95.0, hq), ends(p, 42.0));
  if (i == 9) {
    float d = hillSD(p, 7.0, 12.0, 0.02, 36.0, 0.4, hq);
    float birds = 1e3;
    for (int k = 0; k < 5; k++) { float fk = float(k); birds = min(birds, birdSD(p, vec2(uBirdX + fk * 2.3 + hash11(fk) * 1.5, 18.0 + 1.6 * hash11(fk + 1.0) + 0.6 * sin(uTime * 2.0 + fk)), 0.5, mod(floor(uStepT * 6.0) + fk, 2.0) < 1.0 ? 0.7 : -0.4, false)); }
    return max(min(d, birds), ends(p, 62.0));
  }
  if (i == 10) return max(max(-1.0, -sdCircle(p - vec2(22.0, 12.0), 4.0)), ends(p, 92.0));
  return max(-1.0, ends(p, 91.0));
}
Mat sheetMat(int i, vec2 p, float sd) {
  if (i == 0) {
    // old dark wood, the grain running along each side, a worn gold-leaf rim round the opening
    vec2 q = p - vec2(0.0, 1.0);
    bool side = abs(q.x) - 24.0 > abs(q.y) - 13.5;
    float g = side ? q.x : q.y;
    Mat m = mCard(lin(vec3(0.16, 0.1, 0.06)));
    m.kind = K_WOOD;
    m.alb *= 0.65 + 0.5 * vnoise(vec2(g * 0.3, (side ? q.y : q.x) * 6.0) + 3.0) * (0.7 + 0.3 * sin(g * 9.0 + vnoise(p) * 4.0));
    float rim = -sdBox2(q, vec2(24.0, 13.5));
    if (rim > -0.9) {
      Mat f = mFoil(lin(vec3(0.75, 0.56, 0.28)), true);
      f.alb *= 1.0 - 0.6 * smoothstep(0.45, 0.75, fbm(p * 1.5, 3));   // worn through to the bole
      return f;
    }
    return m;
  }
  if (i == 1) { Mat m = mCard(lin(vec3(0.05, 0.045, 0.035))); m.tear = 0.5; m.fuzz = 0.04; return m; }
  if (i == 2 || i == 4) { Mat m = waterMat(p, i == 2 ? -9.2 : -7.6, i == 2 ? 20.0 : 21.0, uWT, 1.0); m.bump = 0.3; return m; }
  if (i == 3) { Mat m = mCard(lin(vec3(0.3, 0.27, 0.23))); m.alb *= 0.7 + 0.4 * vnoise(p * 2.0); m.tear = 0.5; return m; }
  if (i == 5) {
    Mat m = hillMat(p, lin(vec3(0.3, 0.24, 0.13)), 93.0, 0.25);
    m.alb *= 0.85 + 0.25 * step(0.5, fract(p.y * 1.3 + p.x * 0.04));   // stubble rows
    return m;
  }
  if (i == 6) {
    Mat m = mCard(lin(vec3(0.3, 0.25, 0.2)));
    m.alb *= 0.75 + 0.35 * brush(p, 1.5, 94.0);
    m.alb *= 1.0 - 0.25 * smoothstep(0.08, 0.0, abs(fract(p.y * 2.2) - 0.5) - 0.44);   // courses of stone
    return m;
  }
  if (i == 7) { Mat m = mPaper(lin(vec3(0.9, 0.72, 0.45))); m.trans = 0.95; return m; }
  if (i == 8) {
    Mat m = hillMat(p, lin(vec3(0.3, 0.27, 0.2)), 95.0, 0.15);
    m.trans = 0.1;
    // a patchwork of fields in strips, each its own tone
    float strip = hash11(floor(p.y * 0.9 + 0.4 * sin(p.x * 0.07)) + floor(p.x / 9.0) * 3.1);
    m.alb *= 0.7 + 0.5 * strip;
    return m;
  }
  if (i == 9) { Mat m = hillMat(p, lin(vec3(0.34, 0.29, 0.27)), 36.0, 0.0); m.trans = 0.45; return m; }
  if (i == 10) {
    Mat m = skyMat(p, 6.0, 0.4, 37.0);
    m.alb *= mix(vec3(1.0), lin(vec3(0.5, 0.5, 0.62)), smoothstep(8.0, 30.0, p.y));   // dusk violet overhead
    return m;
  }
  float k = exp(-length(p - vec2(22.0, 12.0)) * 0.13);
  return mGlow(vec3(2.6, 2.0, 1.6) * (0.45 + 2.2 * k));
}
` + PAPER_TRACE;

export default (P) => {
  const dur = P.to - P.from;
  const pull = (t) => ease.inOut3(clamp01((t - P.from) / dur));
  const cam = (t) => {
    const e = pull(t);
    return { pos: [mix(-3, 0, e), mix(-2.5, 1.5, e), mix(-30, -37, e)], target: [mix(-1, 0, e), mix(-3.5, 1.0, e), 40], fov: 38, roll: 0.0 };
  };
  return {
    name: 's41-rest', from: P.from, to: P.to,
    frag: GLSL,
    uniforms: { ...EPH_UNIFORMS, uWT: 0, uBirdX: 0,
      uAper: 0.3, uFocus: 50, uFillSoft: 7, uAmb: L(90, 84, 92, 1.0), uFillDir: [0.35, 0.55, -0.75], uHaze: L(110, 95, 100, 0.3), uHazeD: 0.003, uDust: 0.9, uBg: [0.002, 0.002, 0.003] },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      u.uStepT.value = s; u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      u.uWT.value = s * 0.6;
      u.uBirdX.value = -30 + (s - P.from) * 2.2;
      const e = pull(t);
      const c = cam(t);
      // focus rides the pull: from the ford to the whole box
      u.uFocus.value = mix(40, 86, e);
      u.uAper.value = mix(0.3, 0.45, e);
      const k = 1 + 0.12 * Math.max(0, slam(t));
      u.uL.value = packLights([
        { pos: [22, 12, 95], col: L(255, 205, 165, 12), rad: 3, range: 24 },                       // the low sun behind the sky
        { pos: [18, 8, 54], col: L(255, 185, 135, 6), rad: 4, range: 34 },                          // last light behind the far hills
        { pos: [3, 3, 30.5], col: L(255, 150, 70, 3.4 * flicker(t, 1) * k), rad: 0.8, range: 9 },   // candles in the village
        { pos: [-14, 34, 72], col: L(150, 158, 200, 6), rad: 10, range: 60 },                       // cool dusk from overhead on the far land and sky
        { pos: [18, 7, -3], col: L(245, 175, 125, 13), rad: 4, range: 40 },                        // low warm evening key (inside the box)
        { pos: [-30, 30, -60], col: L(150, 135, 120, 0.8 + 1.6 * e), rad: 10, range: 140 },          // the room's cool dark (lights the box)
      ]);
      u.uLN.value = 6;
    },
    post(t) { return grade(t, { exposure: 1.4, bloom: 0.2, threshold: 0.85, vignette: 0.62, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.012, 0.011, 0.014], highlights: [1.0, 0.92, 0.8], amount: 0.4 } }; },
  };
};
