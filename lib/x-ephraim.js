// The hill country of Ephraim and the fords of the Jordan as a paper diorama, at dawn and in the
// quiet evening after: wooded hills of torn cardstock, a painted parchment sky glowing from the
// light box behind it, files of Israelite puppets with spears and torches, the river as overlapping
// strips of dark painted paper that buckle and roll, birds of black card on thread, Eglon's crown in
// gold foil. Shared helpers only; each scene builds its own stack of sheets from these.
import { PAPER_HEAD, PAPER_TRACE, PAPER_UNIFORMS } from '/song/lib/paper.js';
import { PUPPET_GLSL } from '/song/lib/puppet.js';

export { PAPER_TRACE };
export const EPH_UNIFORMS = { ...PAPER_UNIFORMS };

export const EPH_HEAD = PAPER_HEAD + PUPPET_GLSL + /* glsl */ `
// ---------------- figures: where their hands and mouths are ----------------
vec2 figToWorld(Fig f, vec2 q) { return f.pos + f.scale * vec2(q.x * f.face, q.y); }
vec2 figUnlean(Fig f, vec2 qw) { return vec2(0.0, 10.4) + rot(f.lean) * (qw - vec2(0.0, 10.4)); }
// the grip of the near hand (far = true: the far hand)
vec2 figHand(Fig f, bool far) {
  vec2 s = vec2(0.3, 15.1) + (far ? vec2(-0.3, 0.05) : vec2(0.0));
  float sh = far ? f.fsh : f.sh, el = far ? f.fel : f.el;
  vec2 qw = s + rot(sh) * (vec2(0.0, -3.4) + rot(el) * vec2(0.05, -3.6));
  return figToWorld(f, figUnlean(f, qw));
}
vec2 figMouth(Fig f) {
  vec2 hc = vec2(0.42, 17.6);
  vec2 qw = vec2(0.4, 16.6) + rot(f.head) * (vec2(0.85, -0.45) + hc - vec2(0.4, 16.6));
  return figToWorld(f, figUnlean(f, qw));
}
Fig mkFig(vec2 pos, float sc, float face, float lean, float head, float sh, float el, float fsh, float fel, float sway, float style) {
  Fig f; f.pos = pos; f.scale = sc; f.face = face; f.lean = lean; f.head = head; f.sh = sh; f.el = el; f.fsh = fsh; f.fel = fel; f.sway = sway; f.style = style; f.seed = pos.x * 0.37 + style; return f;
}

// ---------------- the land ----------------
float hillSD(vec2 p, float h, float amp, float s, float seed, float tear, bool hq) { return torn(sdBelow(p, ridge(p.x, h, amp, s, seed)), p, tear, seed, hq); }
// a row of Ephraim's woods: firs and round-crowned oaks cut from card, stacked along a ground line
float woodsSD(vec2 p, float base, float hmin, float hmax, float sp, float seed, bool hq) {
  float g = base + 1.2 * sin(p.x * 0.05 + seed) + 0.8 * sin(p.x * 0.13 + seed * 2.0);
  float d = sdBelow(p, g);
  float cx = floor(p.x / sp);
  for (int k = -1; k <= 1; k++) {
    float c = cx + float(k);
    float r = hash11(c * 0.37 + seed);
    float h = mix(hmin, hmax, hash11(c * 1.31 + seed * 3.0));
    float x0 = (c + 0.5) * sp + (hash11(c + 9.0 + seed) - 0.5) * sp * 0.5;
    float b = base + 1.2 * sin(x0 * 0.05 + seed) + 0.8 * sin(x0 * 0.13 + seed * 2.0) - 0.5;
    float tr;
    if (r < 0.55) {
      // a fir: three stacked tiers
      tr = sdTri(p, vec2(x0 - h * 0.32, b + h * 0.1), vec2(x0 + h * 0.32, b + h * 0.1), vec2(x0, b + h * 0.62));
      tr = min(tr, sdTri(p, vec2(x0 - h * 0.25, b + h * 0.42), vec2(x0 + h * 0.25, b + h * 0.42), vec2(x0, b + h * 0.85)));
      tr = min(tr, sdTri(p, vec2(x0 - h * 0.17, b + h * 0.68), vec2(x0 + h * 0.17, b + h * 0.68), vec2(x0, b + h)));
    } else {
      // an oak: a lumpy crown on a trunk
      tr = sdSeg(p, vec2(x0, b), vec2(x0, b + h * 0.5), h * 0.04);
      float cr = sdCircle(p - vec2(x0, b + h * 0.68), h * 0.27);
      cr = min(cr, sdCircle(p - vec2(x0 - h * 0.2, b + h * 0.55), h * 0.2));
      cr = min(cr, sdCircle(p - vec2(x0 + h * 0.21, b + h * 0.58), h * 0.19));
      tr = min(tr, cr + (hq ? (vnoise(p * 1.7 + seed) - 0.5) * h * 0.08 : 0.0));
    }
    d = min(d, tr);
  }
  return torn(d, p, 0.1, seed, hq);
}
// a painted hillside: charcoal and brush on paper; c the base colour
Mat hillMat(vec2 p, vec3 c, float seed, float hatchAmt) {
  Mat m = mPaper(c);
  m.alb *= 0.8 + 0.3 * brush(p * 0.25, 0.05 + seed * 0.02, seed);
  m.alb *= 1.0 - 0.4 * hatchAmt * hatch(p * 0.7, 0.4, 1.3);
  m.alb *= 0.85 + 0.3 * pulp(p * 1.4, seed);
  m.seed = seed; m.trans = 0.3; return m;
}
// the parchment sky: dirty ivory warming to ochre and rose ash at the horizon, a brushed wash
Mat skyMat(vec2 p, float hor, float warm, float seed) {
  float k = smoothstep(hor - 4.0, hor + 70.0, p.y);
  vec3 low = mix(lin(vec3(0.74, 0.6, 0.44)), lin(vec3(0.72, 0.66, 0.56)), 1.0 - warm);
  vec3 high = lin(vec3(0.24, 0.24, 0.26));
  vec3 a = mix(low, high, pow(k, 0.7));
  a *= 0.82 + 0.3 * brush(p * 0.35, 0.06, seed);
  // faint painted strata of cloud
  a *= 1.0 - 0.18 * smoothstep(0.55, 0.8, fbm(vec2(p.x * 0.03, p.y * 0.16) + seed, 4));
  Mat m = mPaper(a); m.trans = 0.6; m.tear = 0.0; m.seed = seed; return m;
}
// torn paper clouds hanging on threads (cx shifts them)
float cloudsSD(vec2 p, float y0, float cx, float seed, bool hq) {
  float d = 1e3;
  for (int k = 0; k < 3; k++) {
    vec2 c = vec2(-80.0 + float(k) * 62.0 + cx * (1.0 + float(k) * 0.25) + 24.0 * hash11(float(k) + seed), y0 + 10.0 * hash11(float(k) + 2.0 + seed));
    vec2 q = p - c;
    float w = 22.0 + 10.0 * hash11(float(k) + seed * 1.3);
    // long strata of torn paper, two or three overlapping, flat beneath
    float cl = 1e3;
    for (int j = 0; j < 3; j++) {
      float fj = float(j);
      vec2 o = vec2((hash11(fj + float(k) * 3.0 + seed) - 0.5) * w * 0.6, fj * 1.6);
      float ww = w * (1.0 - 0.28 * fj);
      float top = 1.6 + 1.4 * vnoise(vec2((q.x - o.x) * 0.12, fj + float(k) * 5.0 + seed));
      cl = min(cl, max(abs(q.y - o.y) - top * smoothstep(ww, ww * 0.3, abs(q.x - o.x)), abs(q.x - o.x) - ww));
    }
    cl = torn(cl, p, 0.5, float(k) + 11.0 + seed, hq);
    float th = min(sdBox2(q - vec2(-w * 0.5, 46.0), vec2(0.03, 44.0)), sdBox2(q - vec2(w * 0.45, 46.0), vec2(0.03, 44.0)));
    d = min(d, min(cl, th));
  }
  return d;
}
// a bird of black card in profile, wings at flap (-1 down .. 1 up), on a thread from above
float birdSD(vec2 p, vec2 c, float s, float flap, bool thread) {
  vec2 q = (p - c) / s;
  float d = sdEllipsoid(vec3(q - vec2(0.0, -0.05), 0.0), vec3(0.22, 0.32, 1.0));
  vec2 m = vec2(abs(q.x), q.y);
  vec2 el = vec2(0.85, 0.25 + 0.55 * flap), tip = vec2(1.9, 0.05 + 1.0 * flap);
  d = min(d, sdTaper(m, vec2(0.1, 0.0), el, 0.2, 0.13));
  d = min(d, sdTaper(m, el, tip, 0.13, 0.02));
  d *= s;
  if (thread) d = min(d, sdBox2(p - vec2(c.x, c.y + 60.0), vec2(0.025, 60.0 - 0.2 * s)));
  return d;
}

// ---------------- the river ----------------
// strip k of the river: its depth bends (the paper buckles and rolls downstream)
float waterZ(float z0, vec2 p, float k, float t, float amp) {
  return z0 + amp * sin(p.x * 0.11 - t * 1.6 + k * 2.1) + amp * 0.5 * sin(p.x * 0.27 + t * 0.9 + k * 4.3);
}
// its top edge rolls too
float waterSD(vec2 p, float h, float k, float t, bool hq) {
  float y = h + 0.7 * sin(p.x * 0.16 - t * 2.2 + k * 1.7) + 0.35 * sin(p.x * 0.41 - t * 1.3 + k);
  return torn(sdBelow(p, y), p, 0.18, 30.0 + k, hq);
}
// dark painted paper: slate and peat ink in long horizontal strokes, a pale line of froth at the top
Mat waterMat(vec2 p, float h, float k, float t, float gloss) {
  vec3 c = mix(lin(vec3(0.07, 0.085, 0.09)), lin(vec3(0.15, 0.15, 0.14)), brush(vec2(p.x - t * 3.0, p.y), 0.0, 40.0 + k));
  float y = h + 0.7 * sin(p.x * 0.16 - t * 2.2 + k * 1.7) + 0.35 * sin(p.x * 0.41 - t * 1.3 + k);
  float froth = smoothstep(0.55, 0.0, y - p.y) * (0.5 + 0.5 * vnoise(vec2(p.x * 1.4 - t * 4.0, k)));
  c = mix(c, lin(vec3(0.55, 0.52, 0.46)), froth * 0.55);
  // streaks of the brush that catch the light
  float st = pow(vnoise(vec2((p.x - t * 5.0) * 0.18, p.y * 2.6 + k * 7.0)), 6.0);
  c += lin(vec3(0.4, 0.36, 0.3)) * st * 0.5;
  Mat m = mPaper(c);
  if (gloss > 0.0 && froth < 0.3) { m.kind = K_INK; m.alb = c * 0.8; }
  m.tear = 0.6; m.trans = 0.25; m.seed = 40.0 + k; return m;
}

// ---------------- Eglon's crown ----------------
// in its own frame: band and five points, about 2 units wide at s = 1; turn squeezes it (a slow spin)
float crownSD(vec2 p, vec2 c, float s, float ang, float turn) {
  vec2 q = rot(ang) * (p - c) / s;
  q.x /= max(abs(turn), 0.18);
  float d = sdBox2(q - vec2(0.0, 0.2), vec2(1.0, 0.3));
  for (int k = 0; k < 5; k++) { float x = -0.84 + float(k) * 0.42; d = min(d, sdTri(q, vec2(x - 0.17, 0.4), vec2(x + 0.17, 0.4), vec2(x, 1.1))); d = min(d, sdCircle(q - vec2(x, 1.16), 0.08)); }
  return d * s * max(abs(turn), 0.18);
}
Mat crownMat(vec2 p, vec2 c, float s, float ang, float turn) {
  vec2 q = rot(ang) * (p - c) / s;
  q.x /= max(abs(turn), 0.18);
  Mat m = mFoil(lin(vec3(0.82, 0.62, 0.3)), true);
  if (turn < 0.0) m.alb *= 0.55;   // the inside of the band, darker
  m.alb *= 0.75 + 0.35 * step(0.0, sin(q.x * 13.0));
  // garnets set in the band
  for (int k = 0; k < 3; k++) { float x = -0.6 + float(k) * 0.6; if (turn > 0.0 && length(q - vec2(x, 0.2)) < 0.12) { m = mPaper(lin(vec3(0.38, 0.06, 0.05))); m.kind = K_INK; m.tear = 0.0; m.fuzz = 0.0; } }
  // tarnish
  m.alb *= 1.0 - 0.5 * smoothstep(0.5, 0.8, fbm(q * 2.5, 3));
  return m;
}

// ---------------- the host of Israel ----------------
// p in the frame of figure f's near hand, exactly as the puppet draws it (q units)
vec2 handFrame(vec2 p, Fig f) {
  vec2 q = (p - f.pos) / f.scale; q.x *= f.face;
  vec2 qw = jnt(q, vec2(0.0, 10.4), f.lean) + vec2(0.0, 10.4);
  vec2 lu = jnt(qw, vec2(0.3, 15.1), f.sh);
  vec2 lf = jnt(lu, vec2(0.0, -3.4), f.el);
  return lf - vec2(0.0, -3.1);
}
// a direction given in the figure's own upright frame, turned into its hand frame
vec2 handDir(Fig f, vec2 d) { return rot(-(f.lean + f.sh + f.el)) * normalize(d); }

// One file of marching puppets along a slope y = yb + slope * x, repeated every sp along x (off
// shifts the file; it marches when off grows). Every figure bears a spear or a torch. Outputs the
// figure and what was hit: extra 0 the puppet, 1 shaft, 2 spear head, 3 torch stick, 4 flame.
float hostOne(vec2 p, float c, float off, float sp, float sc, float face, float yb, float slope, float seed, float ts, float gaps, bool hq,
             out Fig fo, out int part, out vec2 lp, out float shd, out int extra) {
  extra = 0; part = PT_NONE; lp = p; shd = 0.0;
  Fig f;
  float h = hash11(c * 0.713 + seed);
  float x = (c + 0.5) * sp + off + (hash11(c * 1.37 + seed * 2.0) - 0.5) * sp * 0.3;
  float y = yb + slope * x;
  if (h < gaps) { fo = mkFig(vec2(x, y), sc, face, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 2.0); return max(abs(p.x - x) - sp * 0.2, sp * 0.15); }
  float ph = ts * 7.5 + c * 1.9 + seed;
  float torch = step(0.68, hash11(c * 3.1 + seed + 0.5));
  float style = hash11(c * 5.3 + seed) < 0.18 ? 1.0 : 2.0;
  float sway = style == 1.0 ? 0.25 * sin(ph) : 0.42 * sin(ph);
  float bob = abs(cos(ph)) * 0.25 * sc;
  float sh = torch > 0.5 ? -2.3 + 0.1 * sin(ph * 0.5) : -0.55 + 0.08 * sin(ph);
  float el = torch > 0.5 ? -0.25 : -1.0;
  f = mkFig(vec2(x, y + bob), sc * (0.94 + 0.12 * hash11(c + seed * 7.0)), face, 0.08 + 0.06 * sin(ph * 0.5) + slope * 0.4, -0.05 + 0.08 * hash11(c + 2.0), sh, el, 0.35 - 0.4 * sin(ph), -0.4, sway, style);
  fo = f;
  // cheap bound: far from this puppet and its pole
  if (abs(p.x - x) > 9.5 * f.scale || p.y < y - 1.0 * f.scale || p.y > y + 33.0 * f.scale) return max(abs(p.x - x) - 9.0 * f.scale, 0.3);
  float d = figure(p, f, part, lp, shd, hq);
  vec2 hp = handFrame(p, f);
  vec2 g = vec2(0.05, -0.5);
  if (torch > 0.5) {
    vec2 dl = handDir(f, vec2(0.12, 1.0));
    vec2 a = g - dl * 1.2, b = g + dl * 3.2;
    float st = sdSeg(hp, a, b, 0.17) * f.scale;
    vec2 n = vec2(-dl.y, dl.x);
    vec2 fq = vec2(dot(hp - b, n), dot(hp - b, dl)) - vec2(0.0, 0.7);
    float fl = sdEllipsoid(vec3(fq - vec2(0.12 * sin(ts * 11.0 + c), 0.2), 0.0), vec3(0.55, 1.05, 1.0));
    fl = smin(fl, sdTri(fq, vec2(-0.4, 0.4), vec2(0.4, 0.4), vec2(0.2 * sin(ts * 13.0 + c * 2.0), 2.0 + 0.4 * sin(ts * 17.0 + c))), 0.25);
    fl *= f.scale;
    if (fl < 0.0) { extra = 4; lp = fq; return fl; }
    if (st < 0.0 && d >= 0.0) { extra = 3; return st; }
    d = min(d, min(st, fl));
  } else {
    vec2 dl = handDir(f, vec2(0.2, 1.0));
    vec2 a = g - dl * 7.0, b = g + dl * 11.5;
    float st = sdSeg(hp, a, b, 0.17) * f.scale;
    vec2 n = vec2(-dl.y, dl.x);
    float hd = sdTri(hp, b - n * 0.5, b + n * 0.5, b + dl * 2.0) * f.scale;
    if (hd < 0.0) { extra = 2; return hd; }
    if (st < 0.0 && d >= 0.0) { extra = 1; return st; }
    d = min(d, min(st, hd));
  }
  return d;
}
// the file: this cell's puppet and both neighbours (they overlap: arms, spears and strides reach across)
float hostSD(vec2 p, float off, float sp, float sc, float face, float yb, float slope, float seed, float ts, float gaps, bool hq,
             out Fig f, out int part, out vec2 lp, out float shd, out int extra, out float cell) {
  float c0 = floor((p.x - off) / sp);
  float best = 1e3;
  for (int k = 0; k < 3; k++) {
    // the forward neighbour first: what reaches forward (hands, spears) is in front of what trails behind
    float c = c0 + (k == 0 ? 0.0 : (k == 1 ? -face : face));
    Fig f1; int pt1, ex1; vec2 lp1; float sh1;
    float d = hostOne(p, c, off, sp, sc, face, yb, slope, seed, ts, gaps, hq, f1, pt1, lp1, sh1, ex1);
    if (d < best) { best = d; f = f1; part = pt1; lp = lp1; shd = sh1; extra = ex1; cell = c; }
    if (best < 0.0 || !hq) break;
  }
  return best;
}

// earth-toned clothing per figure
vec3 hostTone(float c, float seed) {
  float h = hash11(c * 2.77 + seed * 1.1);
  if (h < 0.25) return lin(vec3(0.4, 0.24, 0.14));
  if (h < 0.5) return lin(vec3(0.33, 0.31, 0.22));
  if (h < 0.75) return lin(vec3(0.46, 0.38, 0.26));
  return lin(vec3(0.28, 0.24, 0.22));
}
Mat hostMat(int part, vec2 lp, float shd, Fig f, int extra, float cell, float seed, float glowK) {
  if (extra == 4) {
    float k = sat(1.0 - length(lp * vec2(1.3, 0.6) - vec2(0.0, 0.3)) * 0.8);
    return mGlow(mix(vec3(1.3, 0.32, 0.06), vec3(2.6, 1.3, 0.4), k) * glowK);
  }
  if (extra == 1 || extra == 3) { Mat m = mCard(lin(vec3(0.42, 0.3, 0.18))); m.kind = K_WOOD; return m; }
  if (extra == 2) { Mat m = mCard(lin(vec3(0.5, 0.48, 0.44))); m.alb *= 0.75 + 0.4 * vnoise(lp * 3.0); return m; }
  return figMat(part, lp, shd, f, hostTone(cell, seed), lin(vec3(0.12, 0.09, 0.06)));
}
`;
