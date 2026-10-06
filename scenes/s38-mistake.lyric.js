// The words of s38-mistake: the chorus hook on the hanging placard, the rest on a strip below.
import { lyricModule, chorus } from '/song/lib/words.js';
export default lyricModule((ctx, t, P, lines) => chorus(ctx, t, P, lines, { zone: 'ut' }), { shade: 0.5 });
