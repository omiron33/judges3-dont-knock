// The words as things in the paper world. Each sung line is printed in letterpress ink on a torn
// strip of aged parchment that slaps down into the frame as the line begins (a little bounce, a
// little tilt, a brass pin) and lifts away when it has been read. Words are stamped on their sung
// onsets. The chorus hook is painted on a wooden placard hung on two strings. Names and words of
// weight are stamped in their own ink: crimson for the blade, dark antique gold for the king and for
// God. Dark ink on parchment (or cream paint on dark wood): every word reads at a glance.
// Only lyric modules import this module, so typography changes never re-render a picture.
import { ease, clamp01, clean, keep, linesIn, lyricModule, outFade, carry } from '/song/lib/type.js';
export { keep, linesIn, lyricModule, outFade, carry, ease, clamp01 };

// fonts: EB Garamond (engine), Anton (song)
await (async () => {
  const buf = await fetch('/song/fonts/Anton-Regular.ttf').then((r) => { if (!r.ok) throw Error('font Anton'); return r.arrayBuffer(); });
  const f = new FontFace('Anton', buf); await f.load(); document.fonts.add(f);
})();

// ---------------- seeded randomness ----------------
function rng(seed) {
  let a = (Math.floor(seed * 9973) ^ 0x9e3779b9) >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hashStr = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };

// ---------------- materials (made once) ----------------
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
// aged parchment: warm ivory, pulp clouds, fibres, specks and foxing
const PARCH = (() => {
  const S = 1024, c = makeCanvas(S, S), x = c.getContext('2d'), r = rng(3.7);
  x.fillStyle = 'rgb(222, 208, 178)'; x.fillRect(0, 0, S, S);
  x.filter = 'blur(28px)';
  for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '160, 130, 90' : '245, 236, 214'}, ${0.08 + 0.12 * r()})`; x.beginPath(); x.ellipse(r() * S, r() * S, 40 + 160 * r(), 30 + 120 * r(), r() * 3, 0, 7); x.fill(); }
  x.filter = 'none';
  for (let i = 0; i < 900; i++) {
    x.strokeStyle = `rgba(${r() < 0.6 ? '120, 96, 64' : '250, 244, 228'}, ${0.05 + 0.12 * r()})`; x.lineWidth = 0.6 + r() * 1.2;
    const px = r() * S, py = r() * S, a = r() * 6.3, l = 8 + 30 * r();
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + 0.5) * l * 0.5, py + Math.sin(a + 0.5) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(90, 64, 36, ${0.08 + 0.2 * r()})`; x.fillRect(r() * S, r() * S, 1 + r() * 1.6, 1 + r() * 1.6); }
  x.filter = 'blur(6px)';
  for (let i = 0; i < 14; i++) { x.fillStyle = `rgba(150, 100, 50, ${0.08 + 0.1 * r()})`; x.beginPath(); x.arc(r() * S, r() * S, 4 + 14 * r(), 0, 7); x.fill(); }
  x.filter = 'none';
  return c;
})();
// thin planed wood: dark walnut with grain
const WOOD = (() => {
  const W = 2048, H = 512, c = makeCanvas(W, H), x = c.getContext('2d'), r = rng(8.1);
  x.fillStyle = 'rgb(58, 38, 24)'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) {
    const y0 = r() * H, amp = 3 + 10 * r(), fr = 0.002 + 0.004 * r(), ph = r() * 6;
    x.strokeStyle = `rgba(${r() < 0.5 ? '30, 18, 10' : '96, 66, 42'}, ${0.15 + 0.3 * r()})`; x.lineWidth = 0.8 + 2.5 * r();
    x.beginPath(); for (let px = 0; px <= W; px += 16) { const py = y0 + amp * Math.sin(px * fr + ph) + 4 * Math.sin(px * fr * 3.1 + ph * 2); px ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
  }
  for (let k = 0; k < 3; k++) { const kx = r() * W, ky = r() * H; const g = x.createRadialGradient(kx, ky, 2, kx, ky, 26 + 20 * r()); g.addColorStop(0, 'rgba(20, 12, 6, 0.8)'); g.addColorStop(1, 'rgba(20, 12, 6, 0)'); x.fillStyle = g; x.beginPath(); x.ellipse(kx, ky, 60, 24, 0, 0, 7); x.fill(); }
  return c;
})();
let PARCH_PAT = null, WOOD_PAT = null;
const pat = (ctx) => { if (!PARCH_PAT) { PARCH_PAT = ctx.createPattern(PARCH, 'repeat'); WOOD_PAT = ctx.createPattern(WOOD, 'repeat'); } };

// ---------------- inks ----------------
const INK = { plain: [30, 24, 20], crimson: [128, 22, 18], gold: [112, 76, 24], name: [70, 34, 18] };
// which ink a word takes (by its letters, lower case, punctuation stripped)
const KEY = (w) => clean(w).toLowerCase().replace(/[^a-z']/g, '').replace(/'s$/, '');
const WORDS = {
  crimson: ['dagger', 'double-edged', 'doubleedged', 'secret', 'hard', 'landed', 'floor', 'blade', 'break'],
  gold: ['king', 'eglon', 'majesty', 'throne', 'god', 'royal', 'palace', 'tribute', 'payment', 'reign', 'king\'s'],
  name: ['ehud', 'moab', 'israel', 'ephraim', 'ephraim\'s'],
};
const INK_OF = {};
for (const [k, l] of Object.entries(WORDS)) for (const w of l) INK_OF[w] = k;
export const inkOf = (w) => INK_OF[KEY(w)] ?? 'plain';

const FONT = (px, ink) => (ink === 'plain' ? `500 ${px}px "EB Garamond"` : `700 ${px}px "EB Garamond"`);
const shown = (w) => clean(w).replace(/^[“"]/, '“').replace(/[”"]$/, '”');

// measure a run of words at px
function layoutWords(ctx, words, px) {
  const out = []; let x = 0;
  ctx.letterSpacing = '0px';
  for (const w of words) {
    const ink = inkOf(w.w);
    ctx.font = FONT(px, ink);
    const s = shown(w.w);
    const wd = ctx.measureText(s).width;
    out.push({ w, s, ink, x, wd });
    ctx.font = FONT(px, 'plain');
    x += wd + ctx.measureText(' ').width * 1.05;
  }
  ctx.font = FONT(px, 'plain');
  return { items: out, width: x - ctx.measureText(' ').width * 1.05 };
}
// split a line into one or two rows that fit maxW
function rows(ctx, words, px, maxW) {
  const all = layoutWords(ctx, words, px);
  if (all.width <= maxW || words.length < 4) return [all];
  let best = 1, bd = 1e9;
  for (let i = 2; i < words.length - 1; i++) {
    const a = layoutWords(ctx, words.slice(0, i), px).width, b = layoutWords(ctx, words.slice(i), px).width;
    const d = Math.max(a, b); if (d < bd) { bd = d; best = i; }
  }
  return [layoutWords(ctx, words.slice(0, best), px), layoutWords(ctx, words.slice(best), px)];
}

// a torn-edged path round a rectangle (centred at 0,0)
function tornPath(ctx, w, h, seed, rough = 1) {
  const r = rng(seed), pts = [];
  const step = 22;
  const edge = (x0, y0, x1, y1, nx, ny, amp) => {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(L / step));
    let wob = 0;
    for (let i = 0; i < n; i++) {
      const k = i / n; wob = wob * 0.7 + (r() - 0.5) * amp;
      const j = (r() - 0.5) * amp * 0.6 + wob;
      pts.push([x0 + (x1 - x0) * k + nx * j, y0 + (y1 - y0) * k + ny * j]);
    }
  };
  const a = 9 * rough;
  edge(-w / 2, -h / 2, w / 2, -h / 2, 0, -1, a); edge(w / 2, -h / 2, w / 2, h / 2, 1, 0, a * 1.6);
  edge(w / 2, h / 2, -w / 2, h / 2, 0, 1, a); edge(-w / 2, h / 2, -w / 2, -h / 2, -1, 0, a * 1.6);
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
}
function brassPin(ctx, x, y, s = 1) {
  const g = ctx.createRadialGradient(x - 5 * s, y - 6 * s, 1, x, y, 15 * s);
  g.addColorStop(0, 'rgb(250, 222, 150)'); g.addColorStop(0.45, 'rgb(170, 120, 50)'); g.addColorStop(1, 'rgb(70, 44, 18)');
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 5;
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 13 * s, 0, 7); ctx.fill(); ctx.restore();
}

// A word stamped onto the paper: it lands slightly large and settles, ink darkening as it presses.
function stamp(ctx, it, x, y, px, t, a, onWood = false) {
  const k = ease.out3(clamp01((t - it.w.start + 0.05) / 0.14));
  if (k <= 0) return;
  const sc = 1 + 0.12 * (1 - k);
  const [r, g, b] = onWood ? [234, 220, 186] : INK[it.ink];
  ctx.save();
  ctx.translate(x + it.x + it.wd / 2, y); ctx.scale(sc, sc);
  ctx.font = onWood ? `400 ${px}px "Anton"` : FONT(px, it.ink);
  ctx.textBaseline = 'alphabetic';
  // the impression: a faint light edge pressed into the paper below the ink
  if (!onWood) { ctx.fillStyle = `rgba(255, 248, 230, ${0.35 * a * k})`; ctx.fillText(it.s, -it.wd / 2 + 1.5, 2.5); }
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, a * (0.35 + 0.65 * k))})`;
  if (it.ink === 'gold' && !onWood) { ctx.shadowColor = `rgba(255, 210, 120, ${0.35 * a})`; ctx.shadowBlur = 0; ctx.shadowOffsetX = -1; ctx.shadowOffsetY = -1.5; }
  ctx.fillText(it.s, -it.wd / 2, 0);
  ctx.restore();
}
// ink speckle: the uneven take of letterpress ink (light flecks knocked out of the letters)
function speckle(ctx, x, y, w, h, seed, a) {
  const r = rng(seed);
  ctx.save(); ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = `rgba(214, 198, 166, ${0.5 * a})`;
  for (let i = 0; i < w * h / 900; i++) ctx.fillRect(x + r() * w, y + r() * h, 1.5 + r() * 2.5, 1 + r() * 2);
  ctx.restore();
}

// ---------------- the strip ----------------
// One line on a torn parchment strip. o: x, y (the strip's anchor), align ('left'|'center'|'right'),
// px (letter size on the 3840 canvas), maxW, alpha, tilt (resting angle, radians), from (time the
// strip arrives; default just before the first word), pin ('left'|'right'|false).
export function strip(ctx, line, t, o = {}) {
  pat(ctx);
  const words = line.words ?? line;
  if (!words.length) return null;
  const px = o.px ?? 104, maxW = o.maxW ?? 1900, alpha = o.alpha ?? 1;
  if (alpha <= 0.003) return null;
  const R = rows(ctx, words, px, maxW);
  const w = Math.max(...R.map((r) => r.width)) + px * 1.25, h = px * (0.55 + 1.22 * R.length) + px * 0.35;
  const seed = hashStr(words.map((x) => x.w).join(' ') + words[0].start);
  const rr = rng(seed);
  const t0 = o.from ?? words[0].start - 0.22;
  const k = clamp01((t - t0) / 0.42);
  if (k <= 0) return null;
  // arrival: drops in from above with a tilt and settles with a small paper bounce
  const x2 = k * 2.6, bounce = Math.exp(-3.2 * x2) * Math.cos(x2 * 7.5);
  const drop = -90 * bounce, tilt0 = o.tilt ?? (rr() - 0.5) * 0.04;
  const ang = tilt0 + 0.07 * bounce * (rr() < 0.5 ? 1 : -1);
  let ax = o.x ?? 1920;
  if (o.align === 'left') ax += w / 2; else if (o.align === 'right') ax -= w / 2;
  // stay inside a 160 px margin
  ax = Math.min(3840 - 160 - w / 2, Math.max(160 + w / 2, ax));
  const ay = (o.y ?? 1080) + drop;
  const a = alpha * clamp01(k * 3);
  ctx.save();
  ctx.translate(ax, ay); ctx.rotate(ang);
  ctx.globalAlpha = a;
  // the strip, its shadow, its aged edge
  tornPath(ctx, w, h, seed, o.rough ?? 1);
  ctx.save(); ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'; ctx.shadowBlur = 34; ctx.shadowOffsetX = 10; ctx.shadowOffsetY = 18 + 30 * (1 - k);
  ctx.translate((rr() - 0.5) * 300, (rr() - 0.5) * 300); ctx.fillStyle = PARCH_PAT; ctx.translate(-(rr() - 0.5) * 300, -(rr() - 0.5) * 300);
  ctx.fill(); ctx.restore();
  ctx.save(); ctx.clip();
  const ge = ctx.createRadialGradient(0, 0, Math.min(w, h) * 0.3, 0, 0, Math.max(w, h) * 0.62);
  ge.addColorStop(0, 'rgba(120, 84, 44, 0)'); ge.addColorStop(1, 'rgba(110, 72, 36, 0.38)');
  ctx.fillStyle = ge; ctx.fillRect(-w, -h, w * 2, h * 2);
  ctx.restore();
  ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(250, 242, 222, 0.55)'; ctx.stroke();
  // the words, row by row
  const top = -h / 2 + px * 0.35 + px * 0.95;
  R.forEach((row, i) => {
    const rx = -row.width / 2, ry = top + i * px * 1.22;
    for (const it of row.items) stamp(ctx, it, rx, ry, px, t, 1);
  });
  speckle(ctx, -w / 2, -h / 2, w, h, seed * 7, 1);
  if (o.pin !== false) brassPin(ctx, (o.pin === 'right' ? 1 : -1) * (w / 2 - px * 0.32), -h / 2 + px * 0.34, px / 104);
  ctx.restore();
  ctx.globalAlpha = 1;
  return { x: ax, y: ay, w, h };
}

// The chorus hook painted on a wooden placard hung by two strings from above; it swings in on the
// first word and sways to rest. words: the words to paint (e.g. "Don't knock, he's busy!").
export function placard(ctx, words, t, o = {}) {
  pat(ctx);
  if (!words.length) return null;
  const px = o.px ?? 200, alpha = o.alpha ?? 1;
  if (alpha <= 0.003) return null;
  ctx.font = `400 ${px}px "Anton"`; ctx.letterSpacing = `${px * 0.04}px`;
  const items = []; let x = 0;
  for (const w of words) { const s = clean(w.w).toUpperCase(); const wd = ctx.measureText(s).width; items.push({ w, s, ink: 'plain', x, wd }); x += wd + px * 0.32; }
  const tw = x - px * 0.32;
  const w = tw + px * 1.1, h = px * 1.55;
  const t0 = o.from ?? words[0].start - 0.3;
  const k = clamp01((t - t0) / 0.5);
  if (k <= 0) return null;
  const s = (t - t0) * 1.0;
  const ang = (1 - ease.out3(clamp01(s * 2))) * -0.35 + 0.05 * Math.exp(-1.6 * s) * Math.sin(s * 6.5) + 0.006 * Math.sin(t * 1.3);
  const cx = o.x ?? 1920, top = o.y ?? 560;
  ctx.save();
  ctx.globalAlpha = alpha * clamp01(k * 4);
  ctx.translate(cx, top - h * 0.5 - 380); ctx.rotate(ang); ctx.translate(0, 380);
  // strings up out of frame
  ctx.strokeStyle = 'rgba(210, 196, 160, 0.75)'; ctx.lineWidth = 3;
  for (const sx of [-w * 0.36, w * 0.36]) { ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx * 0.6, -1400); ctx.stroke(); }
  // the plank
  ctx.save(); ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'; ctx.shadowBlur = 40; ctx.shadowOffsetX = 14; ctx.shadowOffsetY = 26;
  tornPath(ctx, w, h, hashStr(items.map((i) => i.s).join()) + 1, 0.35);
  ctx.translate(0, h / 2); ctx.fillStyle = WOOD_PAT; ctx.fill(); ctx.translate(0, -h / 2); ctx.restore();
  tornPath(ctx, w, h, hashStr(items.map((i) => i.s).join()) + 1, 0.35);
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(140, 104, 70, 0.6)'; ctx.stroke();
  for (const sx of [-w * 0.36, w * 0.36]) brassPin(ctx, sx, 0 + px * 0.18 - h / 2 + 4, 1.2);
  // painted letters
  const rx = -tw / 2, ry = px * 0.36;
  ctx.letterSpacing = `${px * 0.04}px`;
  for (const it of items) stamp(ctx, it, rx, ry, px, t, 1, true);
  ctx.letterSpacing = '0px';
  ctx.restore();
  ctx.globalAlpha = 1;
  return { w, h };
}

// ---------------- layouts ----------------
// Zones (where the storyboard keeps it dark): ul, ur, ut (upper third, centred), ll, lr, lt, l (left
// third), r (right third), c.
const ZONES = {
  ul: { x: 260, y: 420, align: 'left', maxW: 1700 }, ur: { x: 3580, y: 420, align: 'right', maxW: 1700 },
  ut: { x: 1920, y: 400, align: 'center', maxW: 2600 }, uc: { x: 1920, y: 400, align: 'center', maxW: 2600 },
  ll: { x: 260, y: 1620, align: 'left', maxW: 1700 }, lr: { x: 3580, y: 1620, align: 'right', maxW: 1700 },
  lt: { x: 1920, y: 1700, align: 'center', maxW: 2600 },
  l: { x: 260, y: 900, align: 'left', maxW: 1400 }, r: { x: 3580, y: 900, align: 'right', maxW: 1400 },
  c: { x: 1920, y: 1080, align: 'center', maxW: 2600 },
};
// Lines shown in pairs at a zone: the first strip at the zone, the second just below it (or above it
// in a lower zone). Each strip keeps until read (keep), then lifts away.
export function paperVerse(ctx, t, P, lines, { zone = 'ul', px = 104, group = 2, gap = 1.0, dy = 0 } = {}) {
  const z = ZONES[zone];
  const down = z.y < 1300 ? 1 : -1;
  for (let i = 0; i < lines.length; i += group) {
    const grp = lines.slice(i, i + group);
    const a = keep(t, grp.at(-1), P, { first: grp[0], fade: 0.18 });
    if (a <= 0) continue;
    let y = z.y + dy;
    grp.forEach((l, j) => {
      const r = strip(ctx, l, t, { ...z, y, px, alpha: a, pin: z.align === 'right' ? 'right' : 'left' });
      const hgt = r ? r.h : px * 2;
      y += down * (hgt * 0.92 * gap + px * 0.15);
    });
  }
}
// Split a chorus line at its hook ("Don't knock, he's busy!"): returns { hook, rest } word arrays.
export function hookOf(line) {
  const ws = line.words;
  const i = ws.findIndex((w) => /busy/i.test(w.w));
  return i < 0 ? { hook: [], rest: ws } : { hook: ws.slice(0, i + 1), rest: ws.slice(i + 1) };
}
// A chorus scene: the hook on the placard in the upper third, the rest of the line (and the next
// lines) on strips below it.
export function chorus(ctx, t, P, lines, { zone = 'ut', px = 104, hookPx = 210 } = {}) {
  const z = ZONES[zone];
  let lead = lines[0];
  const hasHook = lead && /don.?t knock/i.test(lead.text);
  if (hasHook) {
    const { hook, rest } = hookOf(lead);
    const a = keep(t, lead, P, { fade: 0.18 });
    placard(ctx, hook, t, { x: z.x, y: z.y + 40, px: hookPx, alpha: a });
    if (rest.length) strip(ctx, rest, t, { x: z.x, y: z.y + 330, align: 'center', px, alpha: a, maxW: 2600, pin: false, from: rest[0].start - 0.25 });
    lines = lines.slice(1);
  }
  if (lines.length) paperVerse(ctx, t, P, lines, { zone, px, dy: hasHook ? 560 : 0 });
}

// The title stamped in gold foil into the dark leather of the book's cover (or the end board):
// debossed capitals with a lit upper edge, the chapter beneath in small tracked capitals.
export function foilTitle(ctx, t, { t0 = 0, t1 = 1e9, x = 1920, y = 1020, px = 230, title = "DON'T KNOCK, HE'S BUSY", sub = 'JUDGES 3' } = {}) {
  const a = clamp01((t - t0) / 0.35) * (1 - clamp01((t - t1) / 0.6));
  if (a <= 0.003) return;
  const sweep = clamp01((t - t0) / 1.6);
  ctx.save(); ctx.globalAlpha = a;
  const draw = (s, py, size, font, track) => {
    ctx.font = font(size); ctx.letterSpacing = `${size * track}px`;
    const w = ctx.measureText(s).width, x0 = x - w / 2;
    // the deboss: a dark lip below, a light lip above
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'; ctx.fillText(s, x0 + 2, py + 5);
    const g = ctx.createLinearGradient(x0, py - size, x0 + w, py);
    const m = sweep * 1.4 - 0.2;
    g.addColorStop(0, 'rgb(120, 82, 32)'); g.addColorStop(clamp01(m - 0.15), 'rgb(176, 128, 56)');
    g.addColorStop(clamp01(m), 'rgb(250, 220, 150)'); g.addColorStop(clamp01(m + 0.15), 'rgb(176, 128, 56)'); g.addColorStop(1, 'rgb(128, 88, 34)');
    ctx.fillStyle = g; ctx.fillText(s, x0, py);
    ctx.letterSpacing = '0px';
  };
  draw(title, y, px, (s) => `400 ${s}px "Anton"`, 0.06);
  draw(sub, y + px * 0.75, px * 0.36, (s) => `600 ${s}px "EB Garamond"`, 0.42);
  ctx.restore();
}
