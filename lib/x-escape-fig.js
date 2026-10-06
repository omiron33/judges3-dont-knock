// Ehud on the run: a copy of the shared puppet's figure() (lib/puppet.js) with three additions for
// the escape scenes: a torn cloak streaming from his shoulders, a ram's horn in his near hand, and a
// head that can turn to look back over his shoulder (mirrored in profile). Paints with figMat, plus
// its own cloak and horn. Needs PUPPET_GLSL before it.
export const ESCFIG_GLSL = /* glsl */ `
#define PT_CLOAK 20
#define PT_HORN 21
uniform float uFig[12];
uniform float uHB, uCloak, uCloakPh, uHorn;

// the cloak in the body frame: anchored behind the shoulders, streaming back, torn at the tail
float fCloak(vec2 q, float len, float ph) {
  if (len <= 0.01) return 1e3;
  float L = 6.5 * len;
  float x = -q.x - 0.15;                    // distance back from the shoulder
  float u = sat(x / L);
  float cy = 15.0 - 1.6 * u - 2.2 * u * u * (1.0 - len) + 0.55 * sin(u * 5.0 - ph) * u;
  float w = 0.6 + 2.0 * u;
  float d = abs(q.y - cy) - w * 0.5;
  d = max(d, -x - 0.1);
  // the tattered tail: teeth along the end
  float tail = x - L + 0.9 * (0.5 + 0.5 * sin((q.y - cy) * 5.0 + ph * 2.0)) + 0.4 * vnoise(q * 3.0);
  d = max(d, tail);
  return d * 0.8;
}
// a ram's horn in the hand frame (the hand points along -y)
float fHornH(vec2 h) {
  float d = sdTaper(h, vec2(0.05, -0.2), vec2(0.55, -1.3), 0.14, 0.2);
  d = min(d, sdTaper(h, vec2(0.55, -1.3), vec2(0.5, -2.4), 0.2, 0.28));
  d = min(d, sdTaper(h, vec2(0.5, -2.4), vec2(-0.1, -3.1), 0.28, 0.42));
  return d;
}

float figureE(vec2 p, Fig f, out int part, out vec2 lp, out float shade, bool hq) {
  vec2 q = (p - f.pos) / f.scale;
  q.x *= f.face;
  float bnd = length((q - vec2(-1.5, 11.5)) * vec2(1.3, 0.85)) - 15.0;
  if (bnd > 0.5) { part = PT_NONE; lp = q; shade = 0.0; return bnd * f.scale; }
  vec2 qw = jnt(q, vec2(0.0, 10.4), f.lean) + vec2(0.0, 10.4);
  vec2 hc = vec2(0.42, 17.6);
  vec2 qh = jnt(qw, vec2(0.4, 16.6), f.head) + vec2(0.4, 16.6) - hc;
  if (uHB > 0.5) qh.x = 0.12 - qh.x;        // looking back over his shoulder
  float wide = 0.4;
  float up, fo, ha; vec2 lu, lf, lh;
  fArm(qw, f.sh, f.el, wide, up, fo, ha, lu, lf, lh);
  float fup, ffo, fha; vec2 flu, flf, flh;
  fArm(qw - vec2(-0.3, 0.05), f.fsh, f.fel, wide, fup, ffo, fha, flu, flf, flh);
  float face = min(fHead(qh, f), fNeck(qw));
  float hair = fHair(qh, f);
  float beard = fBeard(qh, f);
  float torso = fTorso(qw, f);
  float robe = fRobe(q, f);
  float nleg = 1e3, fleg = 1e3; vec2 lnl = q, lfl = q;
  fLegs(q, f, nleg, fleg, lnl, lfl);
  float cloak = fCloak(qw, uCloak, uCloakPh);
  float horn = uHorn > 0.5 ? fHornH(lh / uHorn) * uHorn : 1e3;
  float pin = min(length(lu) - 0.12, length(lf) - 0.1);
  float nearArm = min(min(up, fo), ha);
  float farArm = min(min(fup, ffo), fha);
  float sc = f.scale;
  part = PT_NONE; lp = q;
  if (horn < 0.0) { part = PT_HORN; lp = lh / max(uHorn, 1.0); shade = 0.0; return horn * sc; }
  if (pin < 0.0 && nearArm < 0.0) { part = PT_PIN; lp = lu; shade = 0.0; return pin * sc; }
  if (ha < 0.0) { part = PT_HAND; lp = lh; shade = 0.0; return ha * sc; }
  if (fo < 0.0) { part = PT_FORE; lp = lf; shade = 0.0; return fo * sc; }
  if (up < 0.0) { part = PT_UPPER; lp = lu; shade = 0.0; return up * sc; }
  float sh0 = 0.0;
  if (hq) {
    float u2, f2, h2; vec2 a2, b2, c2;
    fArm(qw + vec2(0.14, -0.18), f.sh, f.el, wide, u2, f2, h2, a2, b2, c2);
    sh0 = smoothstep(0.35, -0.2, min(min(u2, f2), h2));
  }
  if (beard < 0.0) { part = PT_BEARD; lp = qh; shade = sh0; return beard * sc; }
  if (hair < 0.0) { part = PT_HAIR; lp = qh; shade = sh0; return hair * sc; }
  if (face < 0.0) { part = PT_FACE; lp = qh; shade = sh0 + smoothstep(0.3, -0.1, hair + 0.15) * 0.6; return face * sc; }
  float hs = smoothstep(0.35, -0.15, min(face, hair) + 0.25);
  if (torso < 0.0) { part = PT_TORSO; lp = qw; shade = max(sh0, hs * 0.7); return torso * sc; }
  if (robe < 0.0) { part = PT_ROBE; lp = q; shade = max(sh0, smoothstep(0.4, -0.2, torso + 0.15) * 0.5); return robe * sc; }
  if (nleg < 0.0) { part = PT_LEG; lp = lnl; shade = smoothstep(0.4, -0.2, robe + 0.1) * 0.5; return nleg * sc; }
  if (fleg < 0.0) { part = PT_FARLEG; lp = lfl; shade = 0.55; return fleg * sc; }
  if (farArm < 0.0) { part = PT_FAR; lp = flu; shade = 0.55; return farArm * sc; }
  if (cloak < 0.0) { part = PT_CLOAK; lp = qw; shade = smoothstep(0.5, -0.3, min(torso, robe)) * 0.5; return cloak * sc; }
  float d = min(min(min(nearArm, farArm), min(face, hair)), min(min(torso, robe), beard));
  d = min(d, min(min(nleg, fleg), min(cloak, horn)));
  shade = 0.0;
  return d * sc;
}

// Ehud's paper and cloth: rust tunic, dark leather belt, a soot-brown cloak, a horn of old ivory
Mat ehudMat(int part, vec2 lp, float shade, Fig f) {
  if (part == PT_CLOAK) {
    Mat m = mPaper(lin(vec3(0.17, 0.12, 0.09)));
    m.kind = K_FABRIC; m.tear = 0.8; m.fuzz = 0.07; m.trans = 0.55;
    m.alb *= 0.8 + 0.35 * (0.5 + 0.5 * sin(lp.y * 7.0 + lp.x * 1.3));    // creases along the flow
    m.alb *= 1.0 - 0.5 * shade;
    m.seed = f.seed + 20.0; return m;
  }
  if (part == PT_HORN) {
    Mat m = mPaper(lin(vec3(0.66, 0.57, 0.42)));
    m.tear = 0.0; m.fuzz = 0.0; m.trans = 0.4;
    m.alb *= 0.75 + 0.3 * step(0.5, fract(length(lp - vec2(0.3, -1.6)) * 4.0));   // ridges of the horn
    m.seed = f.seed + 21.0; return m;
  }
  return figMat(part, lp, shade, f, lin(vec3(0.42, 0.2, 0.11)), lin(vec3(0.12, 0.08, 0.05)));
}
`;

// JavaScript: Ehud's running pose at time t. A 6-step stride cycle on twos (12 a second: half a
// second a cycle); arms swing opposite the legs; the body bobs. dir: +1 runs right, -1 left.
const STRIDE = [0.55, 0.3, -0.12, -0.55, -0.3, 0.12];
const BOB = [0.0, 0.55, 0.85, 0.0, 0.55, 0.85];
// the step index: offset by half a 60 fps frame so a step change never lands inside a frame's shutter
export const stepIdx = (t, rate = 12) => Math.floor((t + 1 / 120) * rate);
export const stepAt = (t, rate = 12) => stepIdx(t, rate) / rate;
export function runPose(t, { x = 0, y = 0, scale = 0.5, face = 1, lean = 0.22, head = 0.04, rate = 12, phase = 0, arm = 1.6 } = {}) {
  const k = ((stepIdx(t, rate) + phase) % 6 + 6) % 6;
  const s = STRIDE[k];
  return {
    pose: { x, y: y + BOB[k] * 0.9 * scale, scale, face, lean, head, sh: -s * arm + 0.1, el: -1.2 + 0.5 * s * arm, fsh: s * arm + 0.1, fel: -1.2 - 0.5 * s * arm, sway: s, style: 2 },
    k, s,
  };
}
