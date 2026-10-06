// The words' voices and type helpers. Only lyric modules import this, so typography changes never
// re-render pictures. Each word is set by what it means: its colour, face and weight carry it.
import { ease, clamp01, clean } from '/song/lib/look.js';
export * from '/song/lib/look.js';
import lyricsAll from '/timing.js';
// the film's scene windows, for carrying a line across a cut (see carry)
const FILM = await fetch('/song/film.json').then((r) => r.json()).catch(() => ({ scenes: [] }));

// the song's display font (the engine supplies EB Garamond and Inter Tight)
await (async () => {
  const buf = await fetch('/song/fonts/BebasNeue-Regular.ttf').then((r) => { if (!r.ok) throw Error('font Bebas Neue'); return r.arrayBuffer(); });
  const f = new FontFace('Bebas Neue', buf); await f.load(); document.fonts.add(f);
})();
const BEBAS = (px) => `400 ${px}px "Bebas Neue"`;

const GAR = (w, it = false) => (px) => `${it ? 'italic ' : ''}${w} ${px}px "EB Garamond"`;
const INTER = (w, it = false) => (px) => `${it ? 'italic ' : ''}${w} ${Math.round(px * 0.8)}px "Inter Tight"`;

// The narration is one voice: upright bone Garamond. The words of God take gold italic (set per line
// with voice: 'god', or per word with the override), and words of weight take their own colour and face.
export const SPEAKERS = {
  narrator: { color: '242, 234, 218', font: GAR(500), track: -0.005, scale: 1.0 },
  // God speaking: gold italic Garamond with a little light
  god: { color: '255, 220, 150', glow: '255, 170, 70', font: GAR(500, true), track: 0.0, scale: 1.04 },
};
export const VOICES = {
  // the small words of a big line, for layouts that set them quietly
  quiet: { words: [], color: '236, 230, 218', font: GAR(500), caps: false, track: 0.0, scale: 0.62 },
  // God, grace and the covenant: gold capitals that carry a little light
  holy: { words: ['god', 'lord', 'grace', 'covenant', 'spirit', 'heaven', 'just', 'perfect', 'pleasing'], color: '255, 222, 150', glow: '255, 170, 60', font: BEBAS, caps: true, track: 0.05, scale: 1.14 },
  // Noe and his house: warm cedar gold, spaced capitals
  noe: { words: ['noe', 'shem', 'ham', 'japheth', 'sons', 'wife', 'wives'], color: '242, 200, 140', font: BEBAS, caps: true, track: 0.14, scale: 1.1 },
  // the heavy hits: forge-red capitals
  wrong: { words: ['giants', 'wickedness', 'evil', 'corrupt', 'corruption', 'corrupted', 'wrong', 'destroy', 'renown'], color: '255, 120, 84', glow: '200, 40, 20', font: BEBAS, caps: true, track: 0.06, scale: 1.16 },
  // judgment and the flood: ash capitals
  ash: { words: ['flood', 'perish', 'die', 'end', 'wipe', 'grieve', 'flesh'], color: '196, 202, 210', font: BEBAS, caps: true, track: 0.06, scale: 1.16 },
  // the ark and its making: honey cedar
  ark: { words: ['ark', 'timber', 'pitch', 'door', 'rooms', 'stories', 'build'], color: '236, 180, 110', font: BEBAS, caps: true, track: 0.08, scale: 1.12 },
  // numbers and measures: silver capitals, like a builder's mark
  measure: { words: ['one', 'hundred', 'twenty', 'three', 'fifty', 'thirty', 'cubits', 'cubit', 'years', 'second', 'third', 'lower'], color: '214, 224, 240', font: BEBAS, caps: true, track: 0.1, scale: 1.08 },
  // the living: a soft warm italic
  living: { words: ['cattle', 'creatures', 'birds', 'beasts', 'pairs', 'male', 'female', 'breathes', 'kind', 'living', 'daughters', 'beautiful', 'mankind'], color: '236, 214, 190', font: GAR(600, true), track: 0.0, scale: 1.08 },
  // the fallen angels ("the sons of God"): cold star-white capitals with a pale blue glow, set by phrase in linesIn
  fallen: { words: [], color: '226, 236, 255', glow: '150, 190, 255', font: BEBAS, caps: true, track: 0.12, scale: 1.1 },
  // the earth
  earth: { words: ['earth'], color: '222, 196, 160', font: BEBAS, caps: true, track: 0.06, scale: 1.12 },
};
const LEX = {};
for (const [k, c] of Object.entries(VOICES)) for (const w of c.words) LEX[w] = k;
export const PLAIN = SPEAKERS.narrator;
PLAIN.font = GAR(500);
// a word may carry its own speaker (the words of God); otherwise the narrator
export const speakerOf = (w) => (w && typeof w === 'object' && w.voice) || 'narrator';

export const keyOf = (word) => clean(word).toLowerCase().replace(/[^a-z’'-]/g, '').replace(/’/g, "'").replace(/'s$/, '');
// voice of a word: an explicit override, else a word of meaning, else its speaker
export function voiceOf(word, override, speaker) {
  if (override) return VOICES[override] ?? SPEAKERS[override] ?? PLAIN;
  const k = LEX[keyOf(word)];
  if (k) return VOICES[k];
  return SPEAKERS[speaker] ?? PLAIN;
}
export const shown = (w, v) => { const s = clean(w).replace(/[;,.:—!?]+$/, '').replace(/^[“"]/, '').replace(/[”"]$/, ''); return v?.caps ? s.toUpperCase() : s; };

function setFont(ctx, v, size, italic) {
  ctx.font = v === PLAIN ? PLAIN.font(size, italic) : v.font(size);
  ctx.fontVariantCaps = 'normal';
  ctx.letterSpacing = `${(v.track ?? 0) * size}px`;
}
// Advance of a word in its voice (word plus a space).
export function measure(ctx, word, px, { italic = false, voice, speaker } = {}) {
  const v = voiceOf(word, voice, speaker);
  const size = Math.round(px * v.scale);
  setFont(ctx, v, size, italic);
  const w = ctx.measureText(shown(word, v)).width;
  ctx.font = PLAIN.font(px, false); ctx.fontVariantCaps = 'normal'; ctx.letterSpacing = '0px';
  // italics lean into the next word, and a closing apostrophe ("sons'") hides the gap: open both up
  const extra = ((v === PLAIN ? italic : /italic/.test(v.font(10))) ? size * 0.12 : 0) + (/['’]$/.test(shown(word, v)) ? size * 0.22 : 0);
  return w + ctx.measureText(' ').width * 1.1 + extra;
}
// Paint one word in its voice at (x, baseline y). alpha 0..1; glow adds the divine words' soft light.
export function paint(ctx, word, x, y, px, { alpha = 1, italic = false, voice, speaker, ink, glow = true } = {}) {
  const v = voiceOf(word, voice, speaker);
  const size = Math.round(px * v.scale);
  if (alpha > 0.002) {
    setFont(ctx, v, size, italic);
    if (glow && v.glow) { ctx.shadowColor = `rgba(${v.glow}, ${(0.55 * alpha).toFixed(3)})`; ctx.shadowBlur = size * 0.35; }
    ctx.fillStyle = `rgba(${ink ?? v.color}, ${Math.min(1, alpha).toFixed(3)})`;
    ctx.fillText(shown(word, v), x, y);
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
  }
  return measure(ctx, word, px, { italic, voice, speaker });
}
export function lineWidth(ctx, words, px, o = {}) {
  let w = 0;
  for (const x of words) w += measure(ctx, x.w ?? x, px, { ...o, voice: o.voice ?? x.v, speaker: o.voice ? undefined : (o.speaker ?? speakerOf(x)) });
  ctx.font = PLAIN.font(px, false);
  return w - ctx.measureText(' ').width * 1.1;
}

// A word's arrival: k eases 0..1 from just before its onset; fully set 0.1 s after it.
export function arrive(w, t, lead = 0.06, dur = 0.16) {
  const k = ease.out3(clamp01((t - w.start + lead) / dur));
  return { k, a: clamp01(k * 2.2) };
}
// fade-out helper: 1 until t0, 0 at t1
export const outFade = (t, t0, t1) => 1 - ease.inOut3(clamp01((t - t0) / (t1 - t0)));

// Set a line word by word: each word rises a little and settles on its sung onset.
// o: x, y, px, align ('left'|'center'|'right'), alpha, italic, rise, voice (force one voice)
export function setLine(ctx, line, t, o = {}) {
  let px = o.px ?? 200;
  const words = line.words ?? line;
  let total = lineWidth(ctx, words, px, o);
  // never run off the frame: shrink the line to fit inside a 200 px margin of the 3840 canvas
  const ax = o.x ?? 1920;
  const room = o.align === 'right' ? ax - 200 : o.align === 'left' ? 3640 - ax : 2 * Math.min(ax - 200, 3640 - ax);
  if (total > room) { px *= room / total; total = lineWidth(ctx, words, px, o); }
  let x = o.x ?? 1920;
  if (o.align === 'center' || !o.align) x -= total / 2; else if (o.align === 'right') x -= total;
  const laid = [];
  for (const w of words) {
    const st = arrive(w, t);
    const y = (o.y ?? 1080) + (1 - st.k) * (o.rise ?? px * 0.1);
    const adv = paint(ctx, w.w, x, y, px, { ...o, voice: o.voice ?? w.v, speaker: o.speaker ?? speakerOf(w), alpha: st.a * (o.alpha ?? 1) });
    laid.push({ w, x, adv, st });
    x += adv;
  }
  return { words: laid, width: total };
}

// Small tracked capitals in the annotation voice (a council, a year, a scripture reference).
export function note(ctx, text, x, y, { px = 44, alpha = 0.8, color = '236, 222, 196', align = 'left', track = 0.28 } = {}) {
  ctx.font = `500 ${px}px "Inter Tight"`;
  ctx.fontVariantCaps = 'normal';
  ctx.letterSpacing = `${px * track}px`;
  const w = ctx.measureText(text).width;
  ctx.fillStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
  ctx.fillText(text, align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, y);
  ctx.letterSpacing = '0px';
  return w;
}

// An inscription row: small words in tracked bone capitals, words with a voice large in that voice,
// all on one baseline and centred on x. Each word settles on its onset.
export function inscribe(ctx, words, t, { x = 1920, y = 1080, small = 120, big = 280, alpha = 1, rise } = {}) {
  const isBig = (w) => voiceOf(w.w) !== PLAIN;
  const sz = (w) => (isBig(w) ? big : small);
  const o = (w) => (isBig(w) ? {} : { voice: 'quiet' });
  let total = 0;
  const adv = words.map((w) => measure(ctx, w.w, sz(w), o(w)) + (isBig(w) ? 0 : small * 0.25));
  total = adv.reduce((s, v) => s + v, 0) - small * 0.5;
  let xx = x - total / 2;
  words.forEach((w, i) => {
    const st = arrive(w, t);
    const yy = y + (1 - st.k) * (rise ?? sz(w) * 0.08);
    paint(ctx, w.w, xx, yy, sz(w), { ...o(w), alpha: st.a * alpha });
    xx += adv[i];
  });
}

// ---------------- layouts ----------------
// the scene's lines: those sung inside its window. Pass { speaker: 'god' } to setLine/verse/single for the words of God.
export function linesIn(P) {
  return lyricsAll.lines.filter((l) => l.start >= P.from - 0.6 && l.start < P.to - 0.1)
    .map((l) => ({ ...l, words: markFallen(lyricsAll.words.filter((w) => w.start >= l.start - 0.05 && w.end <= l.end + 0.05)) }));
}
// "the sons of God" are the fallen angels here: those three words take the cold 'fallen' voice
function markFallen(ws) {
  const k = (w) => keyOf(w.w);
  return ws.map((w, i) => {
    const near = ws.slice(Math.max(0, i - 2), i + 3).map(k).join(' ');
    return /sons of god/.test(near) && ['sons', 'of', 'god'].includes(k(w)) ? { ...w, v: 'fallen' } : w;
  });
}
// lines shown in groups (pairs by default): each group's rows at y, y + gap·px, ...; a group stays
// until its last word has been read and the next group has begun, then crossfades out quickly (the
// next group takes the same place). x/align place the block.
export function verse(ctx, t, P, lines, { x = 260, y = 1500, px = 190, gap = 1.3, align = 'left', group = 2, groups, italic = false, voice, rise, speaker } = {}) {
  // groups: explicit sizes, e.g. [1, 1, 1, 2]; otherwise every group has `group` lines
  const starts = [];
  if (groups) { let i = 0; for (const n of groups) { starts.push([i, n]); i += n; } }
  else for (let i = 0; i < lines.length; i += group) starts.push([i, group]);
  for (const [g, n] of starts) {
    const grp = lines.slice(g, g + n);
    if (!grp.length) continue;
    const a = keep(t, grp.at(-1), P, { first: grp[0], fade: 0.08 });
    if (a <= 0) continue;
    // past the cut (when the next scene carries this group) only its last line goes on
    grp.forEach((l, i) => { if (i === grp.length - 1 || t < P.to) setLine(ctx, l, t, { x, y: y + i * px * gap, px, align, alpha: a, italic, voice, rise, speaker }); });
  }
}
// one line at a time, large
export function single(ctx, t, P, lines, o = {}) { verse(ctx, t, P, lines, { group: 1, ...o }); }
// the chorus shout: small words above, the voiced words huge, slamming in on their beat
export function shout(ctx, words, t, { cx = 1920, y = 1500, small = 130, big = 380, alpha = 1 } = {}) {
  const isSmall = (w) => voiceOf(w.w) === PLAIN || /^(this|is|the|of|on|us)$/i.test(shown(w.w));
  const smalls = words.filter(isSmall), bigs = words.filter((w) => !isSmall(w));
  let sw = 0; for (const w of smalls) sw += measure(ctx, w.w, small, { voice: 'quiet' });
  let x = cx - sw / 2;
  for (const w of smalls) { const st = arrive(w, t); paint(ctx, w.w, x, y - big * 0.97, small, { alpha: st.a * alpha, voice: 'quiet' }); x += measure(ctx, w.w, small, { voice: 'quiet' }); }
  let bw = 0; for (const w of bigs) bw += measure(ctx, w.w, big);
  let bx = cx - bw / 2;
  for (const w of bigs) {
    const st = arrive(w, t, 0.04, 0.12);
    const ww = measure(ctx, w.w, big);
    const sc = 1 + 0.08 * (1 - st.k);
    ctx.save(); ctx.translate(bx + ww / 2, y); ctx.scale(sc, sc);
    paint(ctx, w.w, -ww / 2, 0, big, { alpha: st.a * alpha });
    ctx.restore();
    bx += ww;
  }
}
// ---------------- when a line may leave ----------------
// A line stays fully set until every word in it has been readable for a good while after it is sung
// (at least HOLD s after its last word ends and 0.35 s after it begins), and never leaves before the
// next line has started; then it crossfades out over `fade`. With no next line in this scene it stays
// to the cut (or fades just before it); a line still being read at the cut is carried into the next
// scene by that scene's lyric module (carry). Returns the line's alpha at t.
//   line: a line ({ start, words }) or a words array; o.first: the group's first line (when the alpha
//   is for a group); o.until: the earliest time it may start to leave instead of the next line's start
export const HOLD = 0.22;
const lineFor = (w) => lyricsAll.lines.find((l) => w.start >= l.start - 0.05 && w.start <= l.end + 0.05);
export function keep(t, line, P, { first, until, fade = 0.12, lead = 0.12, hold = HOLD } = {}) {
  const ws = line.words ?? line;
  const w0 = (first?.words ?? first ?? ws)[0], wl = ws[ws.length - 1];
  if (!w0 || t < w0.start - lead) return 0;
  const seen = Math.max(wl.end + hold, wl.start + 0.35);
  let from;
  if (until != null) from = Math.max(seen, until);
  else {
    const L = lineFor(wl);
    const next = L && lyricsAll.lines[lyricsAll.lines.indexOf(L) + 1];
    from = next && next.start < P.to - 0.02 ? Math.max(seen, next.start) : Math.max(seen, P.to - fade);
  }
  return outFade(t, from, from + fade);
}
// Carry the previous scene's last line across the cut: `prev` is the previous scene's lyric module
// (imported statically, so its changes re-render this layer), drawn as it would be just past its own
// end until its last line has been read; `mod` is this scene's own module.
export const carry = (prev, mod) => (P) => {
  const own = mod(P);
  const i = FILM.scenes.findIndex((s) => Math.abs(s.to - P.from) < 1e-3);
  const ps = FILM.scenes[i];
  if (!ps) return own;
  const pm = prev({ ...(ps.params ?? {}), id: ps.id, from: ps.from, to: ps.to });
  return {
    ...own,
    drawText(ctx, t, ly) {
      if (t < P.from + 0.6) { ctx.save(); pm.drawText(ctx, t, ly); ctx.restore(); }
      own.drawText(ctx, t, ly);
    },
  };
};

// a lyric module from a draw function (ctx, t, P, lines)
export const lyricModule = (draw, { shade = 0.5 } = {}) => (P) => {
  const lines = linesIn(P);
  return {
    textSize: [3840, 2160], shade,
    textPlane(t, cam) { return cameraPlaneCompat(cam); },
    drawText(ctx, t) { draw(ctx, t, P, lines); },
  };
};
import { cameraPlane as cameraPlaneCompat0 } from '/engine.js';
const cameraPlaneCompat = (cam) => cameraPlaneCompat0(cam, { width: 1, dist: 1, aspect: 16 / 9 });
