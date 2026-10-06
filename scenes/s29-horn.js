// s29-horn · "Ehud blew the horn on Ephraim's hill," (115.2-119.59). Dawn on the hilltop of Ephraim:
// Ehud, a rim-lit puppet on the crest of torn black card, lifts a ram's horn of layered card and
// blows; rings of torn parchment ripple out through the layers of the diorama, each wooded ridge
// lifting as the ring passes, and birds of black card lift out of the woods on their threads.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, flicker, L, stepT } from '/song/lib/paper.js';
import { slam } from '/song/lib/sync.js';
import { EPH_HEAD, EPH_UNIFORMS, PAPER_TRACE } from '/song/lib/x-ephraim.js';
import { pose } from '/song/lib/puppet.js';

export const kind = 'shader';

// the blasts (ring launches): first on "horn", then down the line
const BLASTS = [116.7, 117.26, 117.96, 118.62];

const GLSL = EPH_HEAD + /* glsl */ `
uniform float uEhud[12];
uniform vec4 uHorn;          // mouthpiece x, y, elevation, scale
uniform vec4 uBlast;         // launch times of the rings
uniform vec2 uRingC;         // where the rings spread from (the bell of the horn)
uniform float uBirdT, uSlam;
#define NL 11
// 0 crest, 1 Ehud, 2 near rings, 3 woods, 4 far rings + birds, 5 mid hills, 6 far woods, 7 far range,
// 8 clouds, 9 sky, 10 light box
float sheetZ(int i, vec2 p) {
  if (i == 0) return 0.0;
  if (i == 1) return 2.0;
  if (i == 2) return 9.0;
  if (i == 3) return 20.0;
  if (i == 4) return 31.0;
  if (i == 5) return 44.0;
  if (i == 6) return 58.0;
  if (i == 7) return 78.0;
  if (i == 8) return 98.0;
  if (i == 9) return 116.0;
  return 122.0;
}
float sheetOpac(int i) {
  if (i == 2 || i == 4) return 0.7;
  if (i == 8) return 0.85;
  if (i == 9) return 0.93;
  if (i == 10) return 0.0;
  return 1.0;
}
// a ridge lifts as the ring sweeps along it (layer delay dl, distance from the source along x)
float ripple(vec2 p, float dl, float sp) {
  float r = 0.0;
  for (int k = 0; k < 4; k++) {
    float a = uTime - uBlast[k] - dl;
    if (a < 0.0 || a > 2.2) continue;
    float front = a * sp;
    float x = abs(p.x - uRingC.x);
    r += exp(-pow((x - front) / 4.0, 2.0)) * exp(-a * 1.3) * (k == 0 ? 1.4 : 0.8);
  }
  return r;
}
// rings of torn paper expanding from the horn; dl delays them for a deeper layer
float ringsSD(vec2 p, float dl, float grow, bool hq) {
  float d = 1e3;
  vec2 q = p - uRingC;
  float r = length(q), an = atan(q.y, q.x);
  for (int k = 0; k < 4; k++) {
    float a = uTime - uBlast[k] - dl;
    if (a < 0.0 || a > 2.0) continue;
    float R = 1.5 + a * grow * (1.0 - 0.18 * a);
    float w = 0.35 + 0.25 * a;
    float ring = abs(r - R) - w;
    // the ring tears into pieces as it grows
    float gap = vnoise(vec2(an * 5.0 + float(k) * 3.0, float(k))) - (0.1 + 0.32 * a);
    ring = max(ring, -gap * R * 0.5);
    ring = max(ring, -(q.y + 2.5));   // they spread up and out over the valley, not into the dark slope
    d = min(d, ring);
  }
  return torn(d, p, 0.22, 21.0 + dl * 10.0, hq);
}
float birdsSD(vec2 p, out float which) {
  float d = 1e3; which = -1.0;
  for (int k = 0; k < 7; k++) {
    float fk = float(k);
    float t0 = 0.08 * fk + 0.25 * hash11(fk + 3.0);
    float a = max(uBirdT - t0, 0.0);
    vec2 c = vec2(-28.0 + fk * 6.5 + 5.0 * hash11(fk), -5.0 + 2.0 * hash11(fk + 1.0)) + vec2(-a * (4.0 + 3.0 * hash11(fk + 5.0)), a * (12.0 + 5.0 * hash11(fk + 7.0)) - a * a * 1.5);
    float flap = a > 0.0 ? (mod(floor(uStepT * 12.0 + 0.5) + fk, 2.0) < 1.0 ? 0.8 : -0.5) : -0.2;
    float b = birdSD(p, c, 1.2 + 0.5 * hash11(fk + 9.0), flap, true);
    if (b < d) { d = b; which = fk; }
  }
  return d;
}
// the ram's horn: a curved tapered tube from the mouthpiece, curling upward to a flared bell
float hornSD(vec2 p, out float phi) {
  vec2 A = uHorn.xy; float e = uHorn.z, s = uHorn.w;
  float face = -1.0;
  vec2 t0 = vec2(face * cos(e), sin(e));
  vec2 n = vec2(-face * sin(e), cos(e));
  float R = 3.2 * s;
  vec2 C = A + R * n;
  vec2 v = p - C;
  vec2 m = -n;
  float ph = atan(face * (m.x * v.y - m.y * v.x), dot(m, v));
  if (ph < -0.6) ph += 6.2831853;
  phi = ph;
  float pm = 1.4;
  float pc = clamp(ph, 0.0, pm);
  vec2 dirc = rot(-face * pc) * m;   // point on the arc at pc
  vec2 P = C + R * dirc;
  float w = s * (0.13 + 0.5 * pow(pc / pm, 1.8));
  float d = length(p - P) - w;
  // the flare of the bell
  if (ph > pm - 0.15) d = min(d, sdBox2(rot(-face * pm) * (p - (C + R * (rot(-face * pm) * m))), vec2(0.1 * s, 0.75 * s)));
  return d;
}
float ehudSD(vec2 p, bool hq, out int part, out vec2 lp, out float sh, out float hp) {
  float d = figure(p, figAt(uEhud), part, lp, sh, hq);
  float h = hornSD(p, hp);
  if (h < 0.0 && !(part == PT_HAND && d < 0.0)) { part = 99; return h; }
  return min(d, h);
}
float sheetSD(int i, vec2 p, bool hq) {
  if (i == 0) {
    // the crest: rises from the dark slope at left to the knoll where Ehud stands
    float y = -15.0 + 12.5 * smoothstep(-34.0, 6.0, p.x) - 2.5 * smoothstep(12.0, 34.0, p.x) + 0.8 * sin(p.x * 0.4);
    y += (ridge(p.x, 0.0, 1.6, 0.18, 2.0) - 0.8);
    return torn(sdBelow(p, y), p, 0.3, 1.0, hq);
  }
  if (i == 1) { int pt; vec2 lp; float sh, hp; return ehudSD(p, hq, pt, lp, sh, hp); }
  if (i == 2) return ringsSD(p, 0.0, 9.0, hq);
  if (i == 3) return woodsSD(p + vec2(0.0, -ripple(p, 0.12, 22.0) * 2.2 - uSlam * 0.6), -7.0, 5.0, 10.0, 3.2, 3.0, hq);
  if (i == 4) { float w; return min(ringsSD(p, 0.28, 16.0, hq), birdsSD(p, w)); }
  if (i == 5) return hillSD(p + vec2(0.0, -ripple(p, 0.3, 30.0) * 2.5), 0.0, 10.0, 0.03, 5.0, 0.35, hq);
  if (i == 6) return woodsSD(p * 0.6 + vec2(0.0, -ripple(p, 0.45, 40.0) * 1.6), 2.0, 3.5, 6.5, 2.6, 6.0, hq) / 0.6;
  if (i == 7) return hillSD(p + vec2(0.0, -ripple(p, 0.6, 55.0) * 2.2), 8.0, 20.0, 0.016, 8.0, 0.4, hq);
  if (i == 8) return cloudsSD(p, 40.0, -6.0 + uTime * 0.6, 3.0, hq);
  if (i == 9) return max(-1.0, -sdCircle(p - vec2(34.0, 13.0), 5.5));
  return -1.0;
}
Mat sheetMat(int i, vec2 p, float sd) {
  if (i == 0) { Mat m = mCard(lin(vec3(0.06, 0.05, 0.045))); m.tear = 0.7; m.fuzz = 0.05; m.alb *= 0.8 + 0.4 * brush(p, 0.1, 1.0); m.seed = 1.0; return m; }
  if (i == 1) {
    int pt; vec2 lp; float sh, hp;
    ehudSD(p, true, pt, lp, sh, hp);
    if (pt == 99) {
      // layered card: ivory to soot brown toward the bell, with the ridged growth bands of a ram's horn
      vec3 c = mix(lin(vec3(0.62, 0.54, 0.42)), lin(vec3(0.3, 0.2, 0.12)), sat(hp / 1.4));
      c *= 0.7 + 0.3 * step(0.35, fract(hp * 7.0));
      Mat m = mPaper(c); m.tear = 0.3; m.fuzz = 0.02; m.trans = 0.4; m.seed = 77.0; return m;
    }
    return figMat(pt, lp, sh, figAt(uEhud), lin(vec3(0.42, 0.2, 0.11)), lin(vec3(0.12, 0.08, 0.05)));
  }
  if (i == 2 || (i == 4 && ringsSD(p, 0.28, 16.0, false) < 0.3)) {
    Mat m = mPaper(lin(vec3(0.78, 0.68, 0.52))); m.trans = 0.85; m.fuzz = 0.1; m.seed = 20.0 + float(i); return m;
  }
  if (i == 4) { Mat m = mCard(lin(vec3(0.05, 0.045, 0.04))); m.seed = 30.0; return m; }
  if (i == 3) { Mat m = hillMat(p, lin(vec3(0.11, 0.1, 0.08)), 3.0, 0.6); m.trans = 0.15; return m; }
  if (i == 5) return hillMat(p, lin(vec3(0.2, 0.17, 0.14)), 5.0, 0.4);
  if (i == 6) return hillMat(p, lin(vec3(0.3, 0.26, 0.22)), 6.0, 0.2);
  if (i == 7) { Mat m = hillMat(p, lin(vec3(0.42, 0.36, 0.31)), 8.0, 0.0); m.trans = 0.45; return m; }
  if (i == 8) { Mat m = mPaper(lin(vec3(0.55, 0.45, 0.38))); if (p.y > 46.0 && sd > -0.06) m = mCard(lin(vec3(0.6))); m.trans = 0.75; m.seed = 9.0; m.fuzz = 0.12; return m; }
  if (i == 9) return skyMat(p, 0.0, 1.0, 10.0);
  // the light box: the low sun
  float k = exp(-length(p - vec2(34.0, 13.0)) * 0.12);
  return mGlow(vec3(4.0, 2.7, 1.5) * (0.6 + 2.5 * k));
}
` + PAPER_TRACE;

export default (P) => {
  const dur = P.to - P.from;
  const cam = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / dur));
    return { pos: [mix(-6, -2, e), mix(2.5, 4.5, e), mix(-54, -45, e)], target: [mix(2, 4, e), mix(6.5, 8, e), 40], fov: 36, roll: 0.0 };
  };
  // Ehud's pose over the scene: looking out, the horn lifted to his lips, then blowing
  const ehud = (t) => {
    const s = stepT(t);
    const up = ease.inOut3(clamp01((s - 115.75) / 0.85));            // raising the horn
    const blow = s >= 116.68 ? 1 : 0;
    const breath = blow ? 0.04 * Math.sin((s - 116.68) * 9) : 0;
    return {
      fig: pose({ x: 8, y: -3.0, scale: 0.86, face: -1, lean: mix(0.05, -0.08, up) - breath, head: mix(0.12, -0.06, up) - breath, sh: mix(-0.25, -1.45, up), el: mix(-0.6, -2.05, up), fsh: mix(0.15, -1.75, up), fel: mix(-0.3, -1.45, up), sway: 0.08, style: 2 }),
      up,
    };
  };
  return {
    name: 's29-horn', from: P.from, to: P.to,
    frag: GLSL,
    uniforms: { ...EPH_UNIFORMS, uEhud: pose(), uHorn: [0, 0, 0, 1], uBlast: BLASTS, uRingC: [0, 0], uBirdT: 0, uSlam: 0,
      uAper: 0.3, uFocus: 52, uFillSoft: 7, uAmb: L(90, 84, 92, 1.0), uFillDir: [0.35, 0.55, -0.75], uHaze: L(150, 120, 100, 0.35), uHazeD: 0.0035, uDust: 1.2, uVol: 0.0, uVolTint: [1.0, 0.85, 0.65] },
    camera: cam,
    update(t, u) {
      const s = stepT(t);
      u.uStepT.value = s; u.uBoil.value = Math.floor((t + 1 / 120) * 12);
      const { fig, up } = ehud(t);
      u.uEhud.value = fig;
      // the horn: from the hand (held low) to the lips (raised)
      const sc = fig[2];
      const mouth = mouthOf(fig);
      const hand = handOf(fig);
      const ax = mix(hand[0] - 0.2 * sc, mouth[0] - 0.05 * sc, up), ay = mix(hand[1] + 0.2 * sc, mouth[1], up);
      const el = mix(-1.1, 0.42 - fig[4] - fig[5], up);
      u.uHorn.value = [ax, ay, el, sc];
      // the bell of the horn: where the rings start
      const R = 3.2 * sc, n = [Math.sin(el), Math.cos(el)], C = [ax + R * n[0], ay + R * n[1]];
      const m = [-n[0], -n[1]], a = 1.4, ca = Math.cos(a), sa = Math.sin(a);
      // rot(-face*a) with face -1 -> rot(a) = [[c, s], [-s, c]]
      u.uRingC.value = [C[0] + R * (ca * m[0] + sa * m[1]), C[1] + R * (-sa * m[0] + ca * m[1])];
      u.uBirdT.value = Math.max(0, s - 117.05);
      u.uSlam.value = 0;
      u.uFocus.value = mix(56, 47, ease.inOut3(clamp01((t - P.from) / dur)));
      const blowGlow = t > 116.7 ? 1 + 0.25 * Math.exp(-(t - 116.7) * 2) : 1;
      u.uL.value = packLights([
        { pos: [34, 12, 119], col: L(255, 212, 168, 24 * blowGlow), rad: 3, range: 30 },        // the sun behind the sky
        { pos: [16, 17, 12], col: L(255, 208, 160, 5.5), rad: 2, range: 26 },                  // rim on Ehud
        { pos: [26, 6, 88], col: L(255, 196, 150, 9), rad: 4, range: 40, shaft: true },        // dawn behind the far range
        { pos: [50, 6, 4], col: L(240, 175, 140, 2.2), rad: 6, range: 90 },                    // low rose key from the right
        { pos: [-20, 45, 136], col: L(220, 214, 205, 10), rad: 10, range: 90 },                 // the open sky behind the parchment
      ]);
      u.uLN.value = 5;
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.2, threshold: 0.85, vignette: 0.6, grain: 0.022 }); },
    finish() { return { grade: { shadows: [0.014, 0.011, 0.012], highlights: [1.0, 0.93, 0.82], amount: 0.4 } }; },
  };
};

// JS copies of the puppet's joint math (see figHand / figMouth in x-ephraim.js)
const R2 = (a, v) => { const c = Math.cos(a), s = Math.sin(a); return [c * v[0] + s * v[1], -s * v[0] + c * v[1]]; };
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
function unlean(f, qw) { return add([0, 10.4], R2(f[4], [qw[0], qw[1] - 10.4])); }
function toWorld(f, q) { return [f[0] + f[2] * q[0] * f[3], f[1] + f[2] * q[1]]; }
function handOf(f) { const qw = add([0.3, 15.1], R2(f[6], add([0, -3.4], R2(f[7], [0.05, -3.6])))); return toWorld(f, unlean(f, qw)); }
function mouthOf(f) { const qw = add([0.4, 16.6], R2(f[5], [0.85 + 0.42 - 0.4, -0.45 + 17.6 - 16.6])); return toWorld(f, unlean(f, qw)); }
