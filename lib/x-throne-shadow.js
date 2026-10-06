// The blow, told as shadow theatre: a small proscenium of black card and worn gilt in the dark summer
// room, a stretched parchment screen, and behind it the two puppets cut from black card with one
// candle further back. We see only their shadows thrown on the parchment, soft-edged where the
// puppets stand off the screen. Dried-blood crimson ink can bloom into the parchment from one point
// (uInk: centre x, y, radius, drips): the only mark the deed leaves. No gore, nothing anatomical.
//
// Sheets: 0 proscenium and curtains (z 0), 1 the parchment screen (z 8), 2 the puppets and the blade
// (z 12), 3 the dark back of the box (z 44).
import { PAPER_HEAD, PAPER_TRACE, PAPER_UNIFORMS } from '/song/lib/paper.js';
import { PUPPET_GLSL } from '/song/lib/puppet.js';
import { OFF } from '/song/lib/x-throne.js';

export const SCREEN = { z: 8, fig: 12, hw: 22, y0: -7, y1: 12.5 };

export const SHADOW_UNIFORMS = {
  ...PAPER_UNIFORMS,
  uF0: OFF, uF1: OFF,
  uBlade: [0, 0, 0, 0],      // hand x, y, angle (radians, 0 = pointing +x), length drawn (cm)
  uInk: [0, 0, 0, 0],        // centre x, y on the screen, radius, drip length
  uGroundY: -9,              // top of the black card ground row on the puppet flat
};

export const SHADOW_GLSL = PAPER_HEAD + PUPPET_GLSL + /* glsl */ `
uniform float uF0[12], uF1[12];
uniform vec4 uBlade, uInk;
uniform float uGroundY;
#define NL 4
#define SZ ${SCREEN.z.toFixed(1)}
#define SHW ${SCREEN.hw.toFixed(1)}
#define SY0 ${SCREEN.y0.toFixed(1)}
#define SY1 ${SCREEN.y1.toFixed(1)}
float sheetZ(int i, vec2 p) {
  if (i == 0) return 0.0;
  if (i == 1) return SZ + 0.25 * sin(p.x * 0.4) * sin(p.y * 0.3);   // the parchment sags a little
  if (i == 2) return ${SCREEN.fig.toFixed(1)};
  return 44.0;
}
float sheetOpac(int i) { return i == 1 ? 0.55 : 1.0; }
vec2 girthS(vec2 p, Fig f) { return f.style == 4.0 ? vec2(f.pos.x + (p.x - f.pos.x) / 1.22, p.y) : p; }
// the dagger: a double-edged leaf a cubit long, a small crossguard, the grip in the fist
float bladeSD(vec2 p) {
  if (uBlade.w <= 0.01) return 1e3;
  vec2 q = rot(uBlade.z) * (p - uBlade.xy);
  float L = uBlade.w;
  float b = sdTaper(q, vec2(0.15, 0.0), vec2(0.15 + L, 0.0), 0.32, 0.015);
  b = min(b, sdBox2(q - vec2(0.15, 0.0), vec2(0.1, 0.6)));
  b = min(b, sdBox2(q - vec2(-0.45, 0.0), vec2(0.5, 0.17)));
  return b;
}
float puppets(vec2 p, bool hq) {
  int pt; vec2 lp; float sh;
  Fig a = figAt(uF0), b = figAt(uF1);
  float d = 1e3;
  if (a.scale > 0.01) d = min(d, figure(girthS(p, a), a, pt, lp, sh, hq));
  if (b.scale > 0.01) d = min(d, figure(girthS(p, b), b, pt, lp, sh, hq));
  d = min(d, bladeSD(p));
  // a ground row of black card for them to stand on, with a few tufts cut along it
  d = min(d, p.y - uGroundY - 0.25 * sin(p.x * 0.9) - 0.4 * pow(max(0.0, sin(p.x * 2.3 + 1.0)), 8.0));
  // the rods that work the puppets, from below
  if (a.scale > 0.01) d = min(d, sdSeg(p, a.pos + vec2(0.0, 10.0 * a.scale), vec2(a.pos.x - 1.0, -30.0), 0.07));
  if (b.scale > 0.01) d = min(d, sdSeg(p, b.pos + vec2(0.0, 10.0 * b.scale), vec2(b.pos.x + 1.0, -30.0), 0.07));
  return d;
}
float frameSD(vec2 p, bool hq) {
  // a black card proscenium: the screen opening with a shallow arch, a valance across the top
  float open = sdBox2(p - vec2(0.0, (SY0 + SY1) * 0.5), vec2(SHW - 1.2, (SY1 - SY0) * 0.5 - 0.6));
  open = max(open, p.y - SY1 + 0.4);
  float d = -open;
  return cut(d, p, 3.0);
}
float sheetSD(int i, vec2 p, bool hq) {
  if (i == 0) return frameSD(p, hq);
  if (i == 1) return sdBox2(p - vec2(0.0, (SY0 + SY1) * 0.5), vec2(SHW, (SY1 - SY0) * 0.5 + 0.5));
  if (i == 2) return puppets(p, hq);
  return -1.0;
}
Mat sheetMat(int i, vec2 p, float sd) {
  if (i == 0) {
    // the frame: black card with a worn gilt edge round the opening; heavy soot-crimson cloth above
    float open = sdBox2(p - vec2(0.0, (SY0 + SY1) * 0.5), vec2(SHW - 1.2, (SY1 - SY0) * 0.5 - 0.6));
    float edge = abs(max(open, p.y - SY1 + 0.4)) ;
    Mat m = mCard(lin(vec3(0.07, 0.055, 0.045)));
    m.kind = K_WOOD;
    m.alb *= 0.7 + 0.5 * vnoise(vec2(p.x * 0.4, p.y * 5.0));
    if (p.y > SY1 + 1.2) {
      m = mPaper(lin(vec3(0.12, 0.035, 0.03)));
      m.kind = K_FABRIC; m.trans = 0.05;
      float folds = 0.5 + 0.5 * sin(p.x * 1.1 + 0.4 * sin(p.y * 0.5));
      m.alb *= 0.4 + 0.7 * folds;
    } else if (sd > -0.9) {
      Mat g = mFoil(lin(vec3(0.62, 0.47, 0.24)), true);
      g.alb *= 0.45 + 0.55 * smoothstep(0.4, 0.75, 1.0 - fbm(p * 0.6, 3));
      return g;
    }
    m.seed = 3.0;
    return m;
  }
  if (i == 1) {
    // the screen: old parchment, stains and fibres, the crimson ink soaking in
    vec3 a = lin(vec3(0.86, 0.76, 0.58));
    float inkK = 0.0;
    a *= 0.82 + 0.25 * pulp(p * 1.5, 5.0);
    a *= 1.0 - 0.18 * smoothstep(0.5, 0.8, fbm(p * 0.2 + 3.0, 4));    // tide-mark stains
    a *= 1.0 - 0.25 * smoothstep(SHW - 6.0, SHW, abs(p.x));            // darker toward the edges
    if (uInk.z > 0.01) {
      vec2 iq = p - uInk.xy;
      float f = length(iq * vec2(1.0, 1.25)) - uInk.z * (0.75 + 0.5 * fbm(normalize(iq + 1e-4) * 2.5 + 7.0, 3));

      // drips run down from the stain
      for (int k = 0; k < 4; k++) {
        float x = uInk.x + (float(k) - 1.5) * uInk.z * 0.45 + (hash11(float(k) + 3.0) - 0.5) * 1.5;
        float len = uInk.w * (0.5 + hash11(float(k) + 7.0));
        float dr = sdTaper(p, vec2(x, uInk.y - uInk.z * 0.5), vec2(x + 0.2, uInk.y - uInk.z * 0.5 - len), 0.35, 0.12);
        f = min(f, dr);
      }
      vec2 ink = inkBleed(p, f);
      vec3 crim = lin(vec3(0.3, 0.035, 0.03));
      a = mix(a, crim, ink.x * 0.92);
      inkK = ink.x;
      a = mix(a, lin(vec3(0.2, 0.02, 0.02)), ink.y * 0.7);
    }
    Mat m = mPaper(a);
    m.trans = 0.92 * (1.0 - 0.55 * inkK); m.tear = 0.0; m.fuzz = 0.0; m.seed = 11.0;
    return m;
  }
  if (i == 2) { Mat m = mCard(lin(vec3(0.03))); return m; }
  return mPaper(lin(vec3(0.015)));
}
` + PAPER_TRACE;
