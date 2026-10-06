// The words of s06-payment: torn parchment strips in the ul zone.
import { lyricModule, paperVerse } from '/song/lib/words.js';
export default lyricModule((ctx, t, P, lines) => paperVerse(ctx, t, P, lines, { zone: 'ul' }), { shade: 0.5 });
