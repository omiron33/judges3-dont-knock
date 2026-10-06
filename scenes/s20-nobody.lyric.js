// The words of s20-nobody: torn parchment strips in the ut zone.
import { lyricModule, paperVerse } from '/song/lib/words.js';
export default lyricModule((ctx, t, P, lines) => paperVerse(ctx, t, P, lines, { zone: 'ut' }), { shade: 0.5 });
