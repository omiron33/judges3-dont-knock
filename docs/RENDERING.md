# Rendering

## Requirements

- Node.js 22 or newer.
- Google Chrome with WebGL2 and GPU acceleration. Set `CHROME` to its executable path when needed.
- FFmpeg with H.264 (`libx264`), AAC and FFV1 support.
- Dependencies installed with `npm ci`: Three.js 0.180.0 and playwright-core 1.55.0.

The bundled runtime in `renderer/` is the deterministic scene renderer used for this film, and it is all the film needs. It reads `film.json`, serves the scene modules to headless Chrome and encodes with FFmpeg. No other engine, model API, cloud account, downloaded model or language-model process is required to render.

## Commands

```sh
npm run validate
npm test
npm run still -- --scene s00-title --time 2 --samples 2
npm run still -- --scene s12-dagger --time 55.3 --samples 4
node tools/render.mjs scene --scene s00-title --from 0.3 --to 1.3 --draft
npm run render -- --draft
npm run render -- --out out/film.mp4
```

`tools/still.sh <scene> <time> [samples]` is a shorthand for the still command. `node tools/params.mjs <scene> --times` prints a scene's window and the sung lines inside it.

The full-film command needs `media/song.wav`: SHA-256 `d922df7dec3e48bf87c3a8a292ee8f9ca25f87b0347044545a2b57ed1bffcd41`, 182.4 seconds, PCM 16-bit stereo at 48 kHz. The recording is distributed separately from the source.

## Output and caching

Still images go to `out/portable/stills/`. Final-quality scene files go to `out/portable/`; draft files go to `out/portable-draft/`. The complete film is `out/film.mp4`, or `out/film-draft.mp4` for a draft. All generated media and caches are ignored by Git.

The runner renders one scene at a time: the picture (plate) without words, then the transparent lyric layer (FFV1 with alpha), then the composite. Finally it joins the scene files with the original recording. Cache keys cover renderer code, the scene's module and everything it imports, the timing data, quality and the render interval, so a finished scene is reused until something it depends on changes.

The film uses hard cuts only; the portable runner rejects transition definitions rather than rendering them incorrectly. 
## Quality tier

The film renders at the standard tier set in `film.json`: 60 fps, 10 sub-frame samples per picture frame (motion blur, anti-aliasing and the thin-lens depth of field are integrated over them) and 8 for the lyric layer, encoded with x264 `slow` at CRF 18. `--samples` overrides the picture samples; `--draft` drops to 30 fps and two samples for a quick look.

## Lyric backing

The film-wide lyric settings are the `"lyric"` block of `film.json`, read by `renderer/web/layer.js`:

- `haloSpread: 9` — how far the soft backing spreads round the words.
- `shade: 0.5` — the film-wide strength of that darkening. Each lyric module also passes its own `shade` through `lyricModule` in `lib/type.js` (0.5 unless the scene asks otherwise; 0.45 to 0.7 across the film), and the module's value takes precedence.
- `lift: false` — the backing always darkens. With `lift` on, the renderer brightens behind dark words instead, which can draw a pale box round words with a dark glow; this film keeps every word on a darkened ground.

## GPU backend

The default backend is Metal on macOS, Chrome's platform default on Windows and Vulkan on Linux. `ARK_ANGLE=default` lets Chrome choose; `ARK_ANGLE` can also select another installed ANGLE backend. macOS is the verified rendering environment for this film. Other platforms require an appropriate Chrome installation and GPU driver. On Windows the renderer flushes after every draw so long shader passes do not trip the driver's GPU timeout.

Output may vary with the GPU, Chrome version and encoder; do not expect byte-identical exports across machines.
