# Credits and licenses

**Don't Knock, He's Busy** — TechnoChristianity / omiron33.

The lyrics retell Judges 3:12–30 (Ehud and Eglon, king of Moab) as a country-funk story song. The recording was created with Suno. The film's scenes, procedural worlds, typography and deterministic rendering code are released under this repository's MIT license. The song recording and finished film are distributed separately; they are not relicensed as software.

## Rendering dependencies

- [Three.js](https://github.com/mrdoob/three.js), MIT License.
- [Playwright](https://github.com/microsoft/playwright), Apache License 2.0.
- FFmpeg and Google Chrome are installed separately and retain their respective licenses.

Every image in the film is computed by the scene shaders in this repository: the paper, fibres, torn edges, foil, ink and light are all simulated in code. No photographs, textures, 3D models or generated images are used.

## Fonts

- EB Garamond — SIL Open Font License, notice in `renderer/web/fonts/EBGaramond-OFL.txt`.
- Inter Tight — SIL Open Font License, notice in `renderer/web/fonts/InterTight-OFL.txt`.
- Bebas Neue — SIL Open Font License, notice in `fonts/OFL-bebasneue.txt`.
- Anton — SIL Open Font License, notice in `fonts/OFL-anton.txt`.

## Timing data

The word timings in `data/lyrics.json` were made by forced alignment of the sung lyrics against a separated vocal stem on a local machine (Hybrid Demucs separation, then torchaudio CTC forced alignment), checked word by word against a local Whisper transcription. They are machine estimates. The beat and loudness measurements in `data/audio.json` come from `tools/analyze.py`. The optional tools that produced them are described in [scene architecture](AUTHORING.md); they are not needed to render.
