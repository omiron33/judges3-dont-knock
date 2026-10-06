// The title, stamped in gold foil on the book's cover.
import { lyricModule, foilTitle } from '/song/lib/words.js';
export default lyricModule((ctx, t, P) => foilTitle(ctx, t, { t0: 0.35, t1: 2.95 }), { shade: 0.35 });
