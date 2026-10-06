// The end title, stamped on the closed book.
import { lyricModule, foilTitle } from '/song/lib/words.js';
export default lyricModule((ctx, t, P) => foilTitle(ctx, t, { t0: P.from + 4.8, t1: P.to + 1 }), { shade: 0.35 });
