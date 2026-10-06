// The words of s21-key: torn parchment strips in the ul zone.
import { lyricModule, paperVerse } from '/song/lib/words.js';
export default lyricModule((ctx, t, P, lines) => paperVerse(ctx, t, P, lines, { zone: 'ul' }), { shade: 0.5 });
