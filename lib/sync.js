// The set reacting to the music. The recording was measured once (data/audio.json): beats, kick
// drum hits and loudness envelopes (rms, low, mid, high) at 20 frames a second. Scene modules use
// these to slam paper layers into place on the drums, shiver loose fibres on the bass and fold or
// tear scenery on the guitar hits. Local set motion only: never shake the whole frame here.
const A = await fetch('/song/data/audio.json').then((r) => r.json());

export const KICKS = A.kicks;
export const BEATS = A.beats.map((b) => (typeof b === 'number' ? b : b.time));
const RATE = A.envelopeRate;

// an envelope (rms | low | mid | high) at song time t, smoothly interpolated, 0..~1
export function env(t, band = 'rms') {
  const a = A[band], x = t * RATE, i = Math.floor(x), f = x - i;
  const v0 = a[Math.max(0, Math.min(a.length - 1, i))], v1 = a[Math.max(0, Math.min(a.length - 1, i + 1))];
  return v0 + (v1 - v0) * f;
}
// the same, averaged over a window (seconds) so it breathes instead of flickering
export function envSmooth(t, band = 'rms', win = 0.25) {
  let s = 0; const n = 6;
  for (let k = 0; k < n; k++) s += env(t - win * (k / (n - 1)), band);
  return s / n;
}
// the most recent hit (from a list of times) at or before t, and how long ago it was
export function lastHit(t, list = KICKS) {
  let lo = 0, hi = list.length - 1, r = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (list[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; }
  return r < 0 ? { i: -1, at: -1e9, ago: 1e9 } : { i: r, at: list[r], ago: t - list[r] };
}
// A slam: 1 at the moment of a hit, decaying with a small paper bounce. Use as a displacement that
// lands a layer into place (offset * slam) or as a flash of light.
export function slam(t, list = KICKS, dur = 0.35) {
  const h = lastHit(t, list);
  if (h.ago > dur * 3) return 0;
  const x = h.ago / dur;
  return Math.exp(-4.0 * x) * Math.cos(x * 9.0);
}
// the number of hits so far (for things that step forward on each drum: a layer per hit)
export const hitsSince = (t, t0, list = KICKS) => list.filter((k) => k >= t0 && k <= t).length;
// kicks and beats inside a window
export const hitsIn = (from, to, list = KICKS) => list.filter((k) => k >= from && k < to);
