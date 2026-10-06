// The words of s04-summer: torn parchment strips in the ll zone.
import { lyricModule, paperVerse } from '/song/lib/words.js';
export default lyricModule((ctx, t, P, lines) => paperVerse(ctx, t, P, lines, { zone: 'll' }), { shade: 0.5 });
