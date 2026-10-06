// The words of s28-sight2: torn parchment strips in the ur zone.
import { lyricModule, paperVerse } from '/song/lib/words.js';
export default lyricModule((ctx, t, P, lines) => paperVerse(ctx, t, P, lines, { zone: 'ur' }), { shade: 0.5 });
