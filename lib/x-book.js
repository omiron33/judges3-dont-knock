// The ancient Bible on a dark table by one candle, seen from above: worn leather boards with brass
// corners and blind-tooled frames, the block of parchment pages, an ink drawing of Eglon's palace on
// the open page, and cut-paper layers (hills, palms, the palace) that rise off the page as it opens,
// the way a pop-up book does. Used for the title (s00) and for the ending, where it all folds back and
// the book closes (s42). uOpen 0 closed .. 1 lying open; uPop 0 flat .. 1 risen.
import { PAPER_HEAD, PAPER_TRACE, PAPER_UNIFORMS } from '/song/lib/paper.js';

export const BOOK_UNIFORMS = { ...PAPER_UNIFORMS, uOpen: 0, uPop: 0, uFlame: 1, uDim: 1 };

export const BOOK_GLSL = PAPER_HEAD + /* glsl */ `
uniform float uOpen, uPop, uFlame, uDim;
#define NL 9
// 0 flame, 1 candle, 2 pop palms, 3 pop palace, 4 pop hills, 5 cover, 6 page, 7 page block, 8 table
const float HINGE = -26.0;
const vec2 BOOK = vec2(26.0, 18.0);      // half size of one board (spine at HINGE)
float coverAng() { return uOpen * PI; }
float sheetZ(int i, vec2 p) {
  if (i == 0) return 30.0;
  if (i == 1) return 36.0;
  if (i == 2) return 50.0 - 7.5 * uPop;
  if (i == 3) return 50.0 - 5.0 * uPop;
  if (i == 4) return 50.0 - 2.6 * uPop;
  if (i == 5) return 49.4 - 16.0 * sin(coverAng());
  if (i == 6) return 50.0;
  if (i == 7) return 51.2;
  return 53.0;
}
float sheetOpac(int i) { return i == 0 ? 0.0 : 1.0; }
// the board in its own unfolded coordinates: x from the hinge 0..2*BOOK.x
vec2 coverLocal(vec2 p, out float ok) {
  float a = coverAng(), c = cos(a);
  ok = abs(c) > 0.02 ? 1.0 : 0.0;
  return vec2((p.x - HINGE) / max(abs(c), 0.02), p.y);
}
float bookRect(vec2 p, vec2 off, vec2 hs, float r) { return sdBox2(p - off, hs - r) - r; }
// pop-up shapes, in page coordinates (page centred at x = HINGE + BOOK.x)
float popHills(vec2 p) { vec2 q = p - vec2(HINGE + BOOK.x, 0.0); return max(sdBox2(q, vec2(20.0, 12.0)), q.y - ridge(q.x, -4.0, 6.0, 0.12, 2.0)); }
float popPalace(vec2 p) {
  vec2 q = p - vec2(HINGE + BOOK.x + 2.0, -3.0);
  float d = sdBox2(q - vec2(0.0, 1.0), vec2(7.0, 3.2));
  d = min(d, sdBox2(q - vec2(0.0, 5.0), vec2(3.0, 1.4)));                 // the summer room on the roof
  for (int k = 0; k < 4; k++) d = min(d, sdBox2(q - vec2(-6.0 + float(k) * 4.0, 4.6), vec2(0.6, 0.8)));
  // lattice windows cut through
  vec2 w = vec2(mod(q.x + 0.6, 1.2) - 0.6, mod(q.y, 1.6) - 0.8);
  d = max(d, -(q.y > -1.5 && q.y < 3.5 ? sdBox2(w, vec2(0.22, 0.4)) : 1.0));
  return max(d, -q.y - 2.2);
}
float popPalms(vec2 p) {
  float d = 1e3;
  for (int k = 0; k < 2; k++) {
    vec2 q = p - vec2(HINGE + BOOK.x + (k == 0 ? -12.0 : 13.0), -6.0);
    d = min(d, sdTaper(q, vec2(0.0), vec2(0.6, 9.0), 0.45, 0.3));
    for (int j = 0; j < 6; j++) { float a = float(j) / 5.0 * 2.6 + 0.25; vec2 dir = vec2(cos(a), sin(a)); d = min(d, sdTaper(q - vec2(0.6, 9.0), vec2(0.0), dir * 4.2 - vec2(0.0, 1.2 * abs(dir.x)), 0.5, 0.05)); }
  }
  return d;
}
float sheetSD(int i, vec2 p, bool hq) {
  vec2 pc = vec2(HINGE + BOOK.x, 0.0);
  if (i == 0) return length((p - vec2(40.0, -16.0)) * vec2(1.0, 0.6)) - 0.35 * uFlame;
  if (i == 1) return sdCircle(p - vec2(40.0, -16.0), 1.8 + 0.2 * vnoise(p * 2.0));
  if (i == 2) return uPop < 0.02 ? 1e3 : torn(popPalms(p), p, 0.12, 3.0, hq);
  if (i == 3) return uPop < 0.02 ? 1e3 : cut(popPalace(p), p, 4.0);
  if (i == 4) return uPop < 0.02 ? 1e3 : torn(popHills(p), p, 0.3, 5.0, hq);
  if (i == 5) {
    float ok; vec2 q = coverLocal(p, ok);
    float sgn = cos(coverAng()) >= 0.0 ? 1.0 : -1.0;
    q.x *= sgn;
    if (ok < 0.5) return sdBox2(p - vec2(HINGE, 0.0), vec2(0.4, BOOK.y));
    return bookRect(q, vec2(BOOK.x, 0.0), BOOK + vec2(0.6, 0.6), 1.2) * abs(cos(coverAng()));
  }
  if (i == 6) {
    // the page (right side) and, once the cover has turned, the inside of the board on the left
    float d = bookRect(p, pc, BOOK - vec2(0.6), 0.6);
    return d;
  }
  if (i == 7) return bookRect(p, pc + vec2(0.4, -0.4), BOOK + vec2(0.2), 1.0);
  return -1.0;
}
Mat sheetMat(int i, vec2 p, float sd) {
  vec2 pc = vec2(HINGE + BOOK.x, 0.0);
  if (i == 0) return mGlow(vec3(2.4, 1.4, 0.45) * uFlame * (1.0 - 0.7 * smoothstep(0.0, 0.9, length(p - vec2(40.0, -16.0)))));
  if (i == 1) { Mat m = mPaper(lin(vec3(0.5, 0.45, 0.36))); m.kind = K_INK; m.tear = 0.0; m.fuzz = 0.0; m.trans = 0.8; m.alb *= 0.8 + 0.25 * smoothstep(3.0, 0.5, length(p - vec2(40.0, -16.0))); return m; }
  if (i == 2) { Mat m = mPaper(lin(vec3(0.2, 0.22, 0.14))); m.trans = 0.3; m.alb *= 0.8 + 0.4 * hatch(p, 0.3, 1.8); return m; }
  if (i == 3) {
    Mat m = mCard(lin(vec3(0.6, 0.52, 0.4)));
    m.alb *= 1.0 - 0.5 * hatch(p * 1.4, 0.4, 2.0) * smoothstep(-6.0, 2.0, -(p.y + 3.0));
    // the gold foil doors
    vec2 q = p - vec2(HINGE + BOOK.x + 2.0, -3.0);
    if (sdBox2(q - vec2(0.0, -0.8), vec2(1.0, 1.4)) < 0.0) m = mFoil(lin(vec3(0.85, 0.64, 0.3)), true);
    return m;
  }
  if (i == 4) { Mat m = mPaper(lin(vec3(0.42, 0.34, 0.24))); m.alb *= 0.75 + 0.35 * brush(p, 0.4, 5.0); return m; }
  if (i == 5) {
    float ok; vec2 q = coverLocal(p, ok);
    bool inside = cos(coverAng()) < 0.0;
    if (inside) { Mat m = mPaper(lin(vec3(0.5, 0.42, 0.3))); m.alb *= 0.7 + 0.4 * fbm(q * 0.5, 4); m.tear = 0.0; m.fuzz = 0.0; return m; }
    // worn leather: crackle, scuffs, a blind-tooled double frame, brass corners
    Mat m = mCard(lin(vec3(0.3, 0.24, 0.19)));
    vec2 cr = voronoiEdge(q * 0.9);
    m.alb *= 0.75 + 0.35 * fbm(q * 0.35, 4) - 0.25 * smoothstep(0.08, 0.0, cr.x);
    vec2 c = q - vec2(BOOK.x, 0.0);
    float fr = min(abs(sdBox2(c, BOOK - vec2(2.2))), abs(sdBox2(c, BOOK - vec2(3.2))));
    m.alb *= 1.0 - 0.6 * smoothstep(0.18, 0.0, fr);
    vec2 cc = abs(c) - (BOOK - vec2(0.2));
    if (cc.x + cc.y > -4.2 && cc.x > -4.0 && cc.y > -4.0) { m = mFoil(lin(vec3(0.62, 0.44, 0.2)), true); m.bump = 0.4; m.alb *= 0.7 + 0.5 * fbm(q * 3.0, 2); }
    m.bump = 1.4; m.seed = 5.0;
    return m;
  }
  if (i == 6) {
    // aged parchment with an ink drawing of the palace by its palms
    Mat m = mPaper(lin(vec3(0.66, 0.58, 0.45)));
    m.alb *= 0.82 + 0.25 * fbm(p * 0.3, 4);
    m.alb *= 1.0 - 0.35 * smoothstep(BOOK.x - 6.0, BOOK.x, abs(p.x - pc.x)) - 0.2 * smoothstep(BOOK.y - 5.0, BOOK.y, abs(p.y));
    float ink = 0.0;
    float pal = popPalace(p), hills = popHills(p), palms = popPalms(p);
    ink = max(ink, smoothstep(0.12, 0.0, abs(pal)) * (1.0 - uPop));
    ink = max(ink, smoothstep(0.1, 0.0, abs(hills)) * (1.0 - uPop));
    ink = max(ink, smoothstep(0.1, 0.0, abs(palms)) * (1.0 - uPop));
    ink = max(ink, hatch(p * 1.2, 0.35, 1.6) * step(pal, 0.0) * 0.6 * (1.0 - uPop));
    // a ruled frame and a drop capital's red square
    ink = max(ink, smoothstep(0.1, 0.0, abs(sdBox2(p - pc, BOOK - vec2(3.0)))) * 0.8);
    m.alb = mix(m.alb, lin(vec3(0.12, 0.09, 0.07)), ink * 0.85);
    if (sdBox2(p - pc - vec2(-BOOK.x + 6.0, BOOK.y - 6.0), vec2(1.8)) < 0.0) m.alb = mix(m.alb, lin(vec3(0.5, 0.1, 0.08)), 0.8);
    m.trans = 0.3; m.tear = 0.0; m.fuzz = 0.0; m.seed = 6.0;
    return m;
  }
  if (i == 7) {
    // the block of pages: fine stripes of page edges, gilt long ago and worn
    Mat m = mPaper(lin(vec3(0.6, 0.5, 0.34)));
    m.alb *= 0.75 + 0.3 * sin(length(p - pc) * 30.0) * 0.5 + 0.15;
    m.tear = 0.0; m.fuzz = 0.0; return m;
  }
  // the table: dark old wood
  vec2 q = rot(0.08) * p;
  Mat m = mCard(lin(vec3(0.13, 0.08, 0.05)));
  m.kind = K_WOOD;
  m.alb *= 0.7 + 0.45 * vnoise(vec2(q.x * 0.06, q.y * 1.6 + 3.0 * vnoise(q * 0.05))) + 0.1 * vnoise(q * vec2(0.3, 12.0));
  m.alb *= 1.0 - 0.3 * smoothstep(0.0, 1.0, thumb(p, vec2(30.0, 14.0), 0.4, 2.0) * 2.0);
  m.alb *= uDim;
  return m;
}
` + PAPER_TRACE;
