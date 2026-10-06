# Building a papercraft scene

Every frame is drawn in code on the GPU. Nothing is a photograph, a downloaded model or a generated
image. The look is a handmade paper diorama shot like a stop-motion feature: dark, tactile, sacred,
ominous, enormous despite humble materials. See docs/STORYBOARD.md for every scene's intent and the
words zone it must keep dark and calm.

## The renderer (lib/paper.js)

A world is a stack of flat sheets standing at depths along +z (centimetres; the camera usually sits
at negative z looking into the set, y up, +x to the right of the frame). The tracer walks each camera
ray through the sheets front to back; every hit is lit by up to six lights, and every light is
shadowed by the sheets between it and the point (soft, with a penumbra that grows with the gap) and
shines through thin paper from behind. The world supplies, in GLSL, between `PAPER_HEAD` and
`PAPER_TRACE`:

```glsl
#define NL 8                                  // number of sheets, sorted front (0) to back
float sheetZ(int i, vec2 p);                  // depth of sheet i at x,y; may bend (folds, waves)
float sheetSD(int i, vec2 p, bool hq);        // signed distance to paper (<0 on paper), cm.
                                              // hq=false for shadow/haze rays: skip fine detail
Mat sheetMat(int i, vec2 p, float sd);        // what the paper is there
float sheetOpac(int i);                       // how much light it stops (1 card .. 0.5 tissue; 0 for a light box)
```

Materials: `mPaper(col)` (fibrous, translucent, torn deckled edge), `mCard(col)` (opaque, knife cut),
`mFoil(col, gold)` (crinkled foil that catches light selectively), `mGlow(radiance)` (flames,
light boxes, candle flames, torches). Fields: `alb` (linear), `kind` (K_PAPER, K_CARD,
K_GOLD, K_SILVER, K_FABRIC, K_WOOD, K_GLOW, K_INK = wet glossy pitch/ink), `trans`, `tear`, `fuzz`,
`emit`, `bump`, `seed`. Colours are sRGB: wrap them in `lin(vec3(...))`.

Hand tools (GLSL): `torn(sd, p, amt, seed, hq)` (torn edge), `cut(sd, p, seed)` (knife cut),
`ridge(x, base, amp, scale, seed)` (a mountain/hill line), `sdBelow`, `sdBox2`, `sdCircle`, `sdSeg`,
`sdTri`, `sdTaper`, `brush(p, angle, seed)` (brush-stroke wash), `hatch(p, density, scale)`
(charcoal cross-hatching), `inkBleed(p, front)` (ink consuming parchment: coverage and dried rim),
`thumb(...)` (a fingerprint), `cracks(p, scale)` (crack network for gold leaf), `pulp`, `fibres`,
`tooth`, `boil(seed, amt)` (per-step stop-motion jitter; set `u.uBoil.value = Math.floor(t * 12)` in update).

Lights (JavaScript, in `update`): `u.uL.value = packLights([...]); u.uLN.value = n;` with
`{ pos:[x,y,z] | dir:[x,y,z] (toward the light), col: L(r,g,b,k), rad, range, shaft }`. A point light
falls off as 1/(1 + (d/range)^2). `shaft: true` makes it scatter in the air (god rays through the
cut-outs; set `uVol` around 0.01 to 0.05). Other uniforms: `uAmb` and `uFillDir` (a soft fill that
makes every sheet cast a soft drop shadow on the one behind), `uBg` (the void), `uHaze`/`uHazeD`,
`uDust` (motes in the light), `uAper` (lens radius, cm) and `uFocus` (focus distance, cm).

Light makes the look. Use deep blacks and heavy shadows, warm candle and fire light, cold moonlight,
and narrow shafts of divine light passing physically through layers of paper. Put lights *between*
sheets and *behind* cut-outs: backlit parchment glows warm and mottled, cut windows glow, torn edges
catch rim light. Give every scene one clearly lit subject.

## Figures (lib/puppet.js)

`figure(p, figAt(uniformArray), part, lp, shade, hq)` draws an articulated paper puppet in profile;
`figMat(part, lp, shade, fig, robeColour, mantleColour)` paints it. Pose it from JavaScript with
`pose({ x, y, scale, face: 1|-1, lean, head, sh, el, fsh, fel, sway, style })` into a
`uniform float uFig[12]` (styles: 0 veiled woman, 1 old man with long beard and mantle, 2 young man in a
knee tunic with legs (Ehud; `sway` is his stride, about -0.5..0.5), 3 woman with bound hair, 4 rotund
crowned king (Eglon), 5 guard with bronze helmet, short tunic and legs). A figure is about 20 units tall at scale 1. Animate on twos: compute poses from
`stepT(t)` (12 steps a second) so they move like stop-motion; the camera stays smooth.

People: judge them harshly. They must read as handsome, slightly elongated papercraft puppets, never
mannequins, never close-up faces, never scary. Keep faces small and in profile; prefer rim light and
silhouette; if a figure doesn't hold up, show a silhouette or the objects instead.

## Music (lib/sync.js)

`env(t, 'rms'|'low'|'mid'|'high')`, `envSmooth`, `KICKS`, `BEATS`, `slam(t)` (a hit that lands with
a paper bounce), `lastHit`, `hitsSince`. Drum impacts slam paper layers into place, guitar hits rip,
fold or unfold scenery, bass shivers loose fibres and hanging pieces. This is local set motion. Never
shake the whole frame or the camera unless the scene's row in docs/STORYBOARD.md says SHAKE (only s12);
there, keep it to one short damped jolt (gone within 0.3 s) written in that scene's own code. A single
object moving on its own (a door rattling under a knock) is fine: mark that line with a comment
`// ark-shake-ok: <what moves>`.

## Camera

Macro cinematography of a real miniature: shallow depth of field (`uAper` 0.1 to 0.5, `uFocus` on
the subject; rack focus between layers), slow dimensional parallax, pushes through foreground
cut-outs (sheets the camera passes simply fall behind it). Heavier sections move more. Every moment
something moves (camera, flame, dust, a puppet); nothing stops dead after moving fast. Cuts are hard
and already on beats: keep `from`/`to` exactly as film.json gives them.

## Palette

Charcoal black, soot, dirty ivory parchment, weathered brown, dried-blood crimson, muted earth tones,
restrained antique gold (Eglon's crown, the fancy door, the dagger's brass). Cool moonlight and warm
candle/torch light. Never saturated digital colour.

## A scene module

```js
// sNN-name · "lyric" (from-to). What the picture is.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { packLights, flicker, L, stepT } from '/song/lib/paper.js';
import { WORLD_GLSL, WORLD_UNIFORMS } from '/song/lib/x-world.js';
export const kind = 'shader';
export default (P) => ({
  name: 'sNN-name', from: P.from, to: P.to,
  frag: WORLD_GLSL, uniforms: { ...WORLD_UNIFORMS, ... },
  camera: (t) => ({ pos, target, fov, roll }),
  update(t, u) { ... },
  post(t) { return grade(t, { exposure, bloom, threshold, vignette, grain }); },
  finish(t) { return { grade: { shadows, highlights, amount } }; },
});
```

A scene's picture must not draw words. Check it with `npm run still -- --scene <scene> --time <t> --samples 4`
(PNG under out/portable/stills/). Keep a frame under about 0.8 s at 10 samples (the time printed after
the first still).
