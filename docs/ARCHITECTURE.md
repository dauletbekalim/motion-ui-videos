# Architecture

motion-ui-videos is a Claude Code skill (also installable as a plugin) that makes motion UI videos in code: product reels, launch films, feature clips, UI loops, app-store previews, stories and covers. The picture is React in [Remotion](https://www.remotion.dev); the sound is synthesized and mixed by a small engine in plain Node. Both read one timeline, so they never drift, every change is an edit and a re-render, and Claude can check its own work by rendering stills and measuring loudness instead of watching.

This page is for people changing the repo: how the template is built, its API, and the lessons that shaped it. To use the template, read [its README](../skills/motion-ui-videos/template/README.md). For the guidance Claude follows, read [SKILL.md](../skills/motion-ui-videos/SKILL.md) and its references.

## Contents

1. [The repo](#the-repo)
2. [The core idea: seconds, and one timeline](#the-core-idea-seconds-and-one-timeline)
3. [The template, file by file](#the-template-file-by-file)
4. [Picture API](#picture-api)
5. [Sound API](#sound-api)
6. [Checking without watching](#checking-without-watching)
7. [Delivery](#delivery)
8. [Copies that must agree](#copies-that-must-agree)
9. [Lessons from a real launch](#lessons-from-a-real-launch)

## The repo

```
motion-ui-videos/
├── .claude-plugin/
│   ├── plugin.json             plugin manifest
│   └── marketplace.json        so `/plugin marketplace add dauletbekalim/motion-ui-videos` works
├── skills/motion-ui-videos/
│   ├── SKILL.md                the skill: workflow, and a router to the references by format
│   ├── references/             deep guides Claude loads on demand (formats, reels, showcase,
│   │                           UI recreation, motion, captions, sound, audio refs, brand,
│   │                           delivery, review, pitfalls)
│   └── template/               the Remotion starter, copied into a user's repo as `video/`
├── examples/skill-promo/       the skill's own promo, made from a copy of the template
├── evals/                      test prompts with checkable assertions, and their fixtures
├── media/                      README images and GIFs (media/release/ is gitignored)
└── docs/                       this page
```

Paths inside SKILL.md and the references are relative to `skills/motion-ui-videos/` (`template/`, `references/formats.md`).

The skill's reader is Claude, running in Claude Code for someone who wants a video about their product: a founder, a designer or a developer, often new to video. The template is what makes the guidance real. SKILL.md tells Claude to copy it, render it once to prove the machine works, then replace the demo product with the user's.

## The core idea: seconds, and one timeline

**Time is in seconds.** Every duration, mark, crossfade and warp knot is in seconds. Frames exist only at the boundary, where the player turns seconds into frames with `toFrames(seconds, fps)` (`Math.round(seconds * fps)`). That is why the 60 fps showcase and the 30 fps reel can share scenes and marks, and why the sound engine, which works in seconds, reads the same numbers.

**The frame grid.** Each scene's length and the crossfade are rounded to whole frames at the cut's fps, by the player and by the sound alike. Keep lengths whole frames anyway (one decimal place is exact at 30 and 60 fps), so what you wrote is what plays.

**`src/cuts.json` is the timeline.** Each key is a cut, and each cut is one composition. The shape (`CutSpec` and `SceneSpec` in `src/lib/time.ts`):

```jsonc
{
  "reel": {
    "format": "reel",          // key into FORMATS (src/formats.ts): size, fps, safe zones
    "cross": 0.1,              // crossfade between scenes, seconds (0 = hard cuts)
    "sound": true,             // play public/sound-reel.wav, if it exists
    "grain": false,            // optional; default on for landscape, off for portrait
    "scenes": [
      { "id": "reelPalette", "seconds": 3.1,
        "marks": { "keys": 0.22, "paletteOpen": 0.4, "typeStart": 0.6, "typeEnd": 1.1, "enter": 1.7 } },
      { "id": "reveal", "seconds": 4.1, "marks": { "logo": 0.3, "wordmark": 0.85 },
        "warp": [[0, 0.22], [0.63, 1.3], [4.1, 5.3]] }   // [drawnSec, sceneSec] knots
    ]
  }
}
```

- `id` picks a component from the registry in `src/scenes/index.ts`. One scene can appear in several cuts and lay itself out for each.
- A cut runs for the sum of its scenes less one crossfade per join, on the frame grid. The demo showcase is 47.8 s of scenes with five 0.1 s joins: 47.3 s. The reel is 21.7 s of scenes with six 0.1 s joins: 21.1 s. Both cut on action (0.1 hides a one-frame pop); a longer `cross` is a dissolve, for time passing.
- `marks` name the moments things happen, in the scene's own (warped) seconds. Scenes read them with `useMarks()`, never hard-coded numbers, and `sound/score.mjs` places each sound on them. To re-time a moment, change one number: picture and sound both move.
- `warp` plays a scene on another clock: straight lines between `[drawnSec, sceneSec]` knots, extended past both ends. The reel plays the showcase's 5.3 s reveal in 4.1 s this way, on its own marks: quicker up to the promise, then near 1:1 while the promise is read. Put knots on the scene's pauses and squeeze those hardest; keep the moves near 1:1.

**Every frame is a pure function of time.** No `Math.random()` or `Date` in scenes (use `rand(seed)`). Renders come out identical, a still at 3.2 s shows exactly what the video shows at 3.2 s, and the sound can recompute a "random" layout (where each of sixteen fragments lands) to pan its whooshes.

## The template, file by file

```
template/
├── package.json         remotion and every @remotion/* package at one exact version (4.0.529),
│                        react 19, typescript 5.9, Node >= 18.12
├── remotion.config.ts   jpeg frames at quality 95, overwrite, concurrency 2 on 16 GiB of RAM or
│                        less, else null (Remotion's default: half the threads, up to 8)
├── tsconfig.json        strict, noUnusedLocals, resolveJsonModule, jsx react-jsx
├── .gitignore           node_modules, out/, public/sound-*.wav, sound/test/out/, sound/refs/
├── README.md            how to use the project: commands, where to edit what, the demo scene by scene
├── src/
│   ├── index.ts         registerRoot(Root)
│   ├── Root.tsx         one <Composition> per cut in cuts.json (length from cutFrames), plus the
│   │                    <Still>s: cover (1080×1920) and thumbnail (1280×720)
│   ├── cuts.json        the timeline
│   ├── captions.json    the words: every caption and title line, by cut and scene, timed on marks
│   ├── formats.ts       FORMATS: size, fps, safe margins per format
│   ├── Video.tsx        the player: every cut, its scenes, its sound, grain and the safe-zone overlay
│   ├── theme.ts         brand tokens: C, PEOPLE_COLORS, FONT, FEATURES, R, SHADOW, BRAND, GRADIENT,
│   │                    alpha(), and all of it as `theme`
│   ├── fonts.ts         Inter (400–800) and JetBrains Mono (400–600) from @remotion/google-fonts
│   ├── lib/             the motion kit: time, anim, text, cues, ui, devices
│   ├── product/         the demo product's UI, rebuilt as components
│   └── scenes/          the demo's scenes, their shared pieces (common.tsx), the registry (index.ts)
├── public/              static assets; sound-<cut>.wav is written here by sound/design.mjs
├── sound/
│   ├── engine.mjs       voices, mixer, room, fixed master, soft clip, limiter, WAV in and out
│   ├── timeline.mjs     cuts.json in seconds: the same clock as src/lib/time.ts
│   ├── score.mjs        what sound goes where, per cut
│   ├── design.mjs       entry point: renders public/sound-<cut>.wav and reports on it
│   ├── refs/            the user's reference audio (gitignored)
│   ├── tools/           loudness, spectrogram, analyze, grow
│   └── test/            run.mjs, parity.mjs, fixture-cuts.json (renders go to test/out/, gitignored)
└── scripts/
    ├── stills.mjs       PNGs of a cut at its marks (or chosen seconds), one bundle (out/.bundle,
    │                    reused), one browser
    ├── sheet.mjs        those PNGs as labelled contact sheets with gaps, in pages of 12
    ├── encode.mjs       platform copies: instagram, tiktok, shorts, youtube, linkedin, x, gif, webm
    ├── captions.mjs     .srt, .vtt and a .txt transcript of a cut, from captions.json
    ├── check.mjs        what a rendered file really is, and how loud
    └── test.mjs         the scripts' tests: sheet layout, encode filters, caption export
```

`src/Video.tsx` and `src/lib/` rarely need edits when a user makes their own video. `theme.ts`, `fonts.ts`, `cuts.json`, `captions.json`, `scenes/`, `product/` and `sound/score.mjs` are where their video lives.

### The demo

A fictional notes app for small teams, **Lumen** (its workspace is Northwind), so the demo has no IP problems. `src/product/` rebuilds its UI from theme tokens: sidebar, note list, editor, command palette, share dialog, presence avatars, remote carets, the scattered "fragments" of a team's notes in other apps. Every state (a row arriving, a button pressed, a dialog half open) is a number the scene passes in, so the scene owns the timing and the product components stay pure.

| cut | format | length | scenes |
|---|---|---|---|
| `showcase` | 1920×1080, 60 fps | 47.3 s | hook, problem, reveal, how, features, end |
| `reel` | 1080×1920, 30 fps | 21.1 s | reelHook, reelProblem, reveal (warped), reelPalette, reelLive, reelPayoff, end |
| `loop` | 1600×1000, 60 fps | 6.0 s | loop (muted; the last frame leads into the first) |
| `story` | 1080×1920, 30 fps | 8.0 s | story (with space for a link sticker) |

Plus two stills: `cover` (everything that matters inside the centred 1080×1440 a profile grid shows) and `thumbnail`. `reveal` and `end` appear in both the showcase and the reel and lay themselves out from `useStage().portrait`. The template README has the full scene-by-scene table: captions, what is on screen, what the sound does.

### Formats

`src/formats.ts`. `safe` is the margin in px that the platform's own UI may cover. [delivery-and-platforms.md](../skills/motion-ui-videos/references/delivery-and-platforms.md) is the authority on these numbers: if research shows one is wrong, the reference says so and the template follows.

| key | size | fps | safe (top, right, bottom, left) | for |
|---|---|---|---|---|
| `showcase` | 1920×1080 | 60 | 54, 96, 54, 96 | 16:9 product showcase, launch film |
| `reel` | 1080×1920 | 30 | 250, 150, 450, 64 | 9:16 reel, TikTok, Shorts |
| `story` | 1080×1920 | 30 | 250, 64, 380, 64 | 9:16 story, room for a link sticker |
| `square` | 1080×1080 | 30 | 60 all round | 1:1 feed, feature clip |
| `portrait` | 1080×1350 | 30 | 60 all round | 4:5 feed post |
| `loop` | 1600×1000 | 60 | none | seamless UI loop for a landing page or docs |
| `appstore` | 886×1920 | 30 | none | App Store preview, portrait |

## Picture API

All times are seconds. "Scene seconds" are what `useTime()` returns: drawn time passed through the scene's warp.

### `src/lib/time.ts`

```ts
useTime(): number              // scene seconds, through the warp. Use for everything the story times.
useDrawnTime(): number         // scene seconds as drawn, no warp. Use for ambient motion (idle drift,
                               // blinking carets, grain), so a warp never makes it shiver.
useMarks(): Record<string, number>   // the scene's marks. Reading one the cut lacks throws, naming
                                     // the scene, the cut and the fix, instead of animating at NaN.
useCut(): string               // the cut id, e.g. 'reel', to vary captions or layout per cut
useStage(): { W, H, portrait, format, safe, fps }  // in a <Still>, the format whose size matches, else 'custom'
cutDuration(cutId): number     // seconds, on the frame grid
sceneStart(cutId, sceneId): number   // seconds from the cut's start (the scene's first appearance)
cutFrames(cutId, fps): number  // the cut's length in frames, as the player lays it out
toFrames(seconds, fps): number // the one place a second becomes a frame
warp(knots): (t) => number     // piecewise linear through [drawnSec, sceneSec], extended past both ends
CUTS                           // cuts.json, typed as Record<string, CutSpec>
CutContext, SceneContext       // internal: read them through the hooks above
```

### `src/lib/anim.ts`

```ts
EASE                  // cubic-bezier(0.22, 1, 0.36, 1): fast out, long settle. The house ease.
EASINGS               // out (EASE), inOut (0.65, 0, 0.35, 1) for travel, in (0.55, 0, 1, 0.45) for exits,
                      // snappy (0.2, 0.9, 0.1, 1) for UI state changes, commit (0.45, 0, 0.15, 1)
                      // for a camera push that commits early and settles long, linear
prog(t, start, dur, ease = EASE): number        // 0 → 1, eased and clamped
pop(t, start, { bouncy?, fps? }): number        // a spring 0 → 1, closed form so it is exact at any
                      // warped time. Calm: critically damped, settles in about 0.55 s. bouncy: one
                      // overshoot of about 7%, never a second wobble. fps snaps it to a frame grid.
lerp(a, b, k), clamp(x, lo = 0, hi = 1)
rand(seed): number    // deterministic [0, 1) for an integer seed
bezier(k, p0, p1, p2, p3): [x, y]
stagger(i, each, start = 0): number             // start + i × each
loopT(t, period): number                        // 0 → 1 repeating, for seamless loops
```

### `src/lib/text.tsx`

In any text prop, `|` forces a line break and `*words*` are set in the accent colour.

- `Line({ text, start, size = 96, weight = 600, color, accent, align, maxWidth, lineHeight, tracking, drawn, style })`: a line that arrives whole, a 0.2 s fade and a 10 px rise over 0.35 s on `EASE` (`ARRIVE`), no stagger, no blur. The default for running captions and most titles.
- `Words({ text, start, step = 0.07, dur = 0.7, … same props })`: words rise out of a blur one at a time. An effect, for at most two moments per film (the promise, the end headline): on every line it reads as a template. Keep `step` at 0.05 to 0.09 s: faster reads as a glitch, slower as a stall.
- `Captions({ cues: { at, text }[], variant: 'calm' | 'punch', top?, size?, maxWidth?, drawn?, color?, arrival?: 'line' | 'words', lit? })`. `calm`: one sentence at a time; the old line leaves (`LEAVE`: a 0.12 s fade, 6 px up) and the new one arrives whole (`Line`) as it is gone, 0.12 s after its cue, so two lines never overlap; `arrival="words"` opts one caption into the blur-rise (showcases). `punch`: 1 to 3 words at a time, big, each chunk landing whole in the text colour, fully there on its first frame (no fade, which would blink between chunks) with a calm `pop()` in scale from 0.96 (reels); a cue is split into chunks of up to three words and breaks after punctuation or `|`, paced as if said; `lit` also lights each word in turn, for a voiceover or a beat grid. An empty cue clears the line. Defaults come from the safe area: calm at 60 px (68 on a phone), 68% of a wide frame across (the width between equal safe margins on a phone), at `safe.top + 30` (landscape) or `+ 40` (portrait); punch at 92 px (72 wide), 780 across on a reel, in a band above the product at `safe.top + 80` on a phone (330 on a reel) or `+ 40` otherwise. `drawn` times cues on unwarped time.
- `Typed({ text, start, cps = 18, caret, caretColor, style, drawn })` and `typedTimes(text, start, cps)`: a typewriter with a small deterministic human jitter (±0.175 of a keystroke), never out of order. Tie it to marks: `cps = text.length / (typeEnd − typeStart)`. The sound uses the same times.
- `Counter({ from, to, start, dur, format?, style? })`: digits roll like an odometer.
- `KineticTitle({ text, start = 0, size = 120, color, align, maxWidth, weight = 800 })`: the reel hook. Each line lands hard (scale 1.08 → 1, no blur) in 0.26 s, readable by 0.3 s.
- `Highlight({ start, dur = 0.5, color, children })`: a marker sweep behind text.

### `src/lib/cues.ts`

`src/captions.json` holds the words the video says: `{ "<cut>": { "<scene id>": { "punch"?, "drawn"?, "cues": [{ "at", "text" }] } } }`, where `at` is scene seconds, a mark, or a mark with an offset (`"appsIn + 0.2"`).

```ts
useCues(): { cues: { at, text }[]; variant: 'calm' | 'punch'; drawn: boolean }   // this cut and scene's block,
                                   // marks resolved (a missing one throws); spread it into <Captions>
cueTime(at, marks): number         // the `at` rule; scripts/captions.mjs has a copy
CAPTIONS                           // captions.json, typed
```

### `src/lib/ui.tsx`

- `Cursor({ path: { t, x, y }[], clicks?, label?, color?, scale?, hideAfter? })` and `cursorAt(path, t)`: glides between waypoints on eased segments, each bowed a little like a wrist turning. A click is a quick press (about 0.2 s) and a soft ring (0.55 s). With `label` it is a teammate's cursor, filled in `color` with their name beside it.
- `Camera({ keys: { t, x, y, scale, ease? }[], children })` and `cameraAt(keys, t, W, H)`: each key puts stage point (x, y) in the middle of the frame at that zoom; `{ x: W/2, y: H/2, scale: 1 }` is no camera. The move into a key eases with its `ease` (default `EASINGS.inOut`; `EASINGS.commit` for a hand-keyed push), zoom interpolated in log space so it feels even.
- `Focus({ active: boolean | number, rect, radius = 18, dim = 0.6, blur = 5, children })`: dims and blurs everything but `rect`. It draws its children twice (a dimmed copy, a sharp clipped copy), so they must be pure functions of time.
- `Callout({ at, text, start, side = 'right', color, length = 90 })`: a dot, a line that draws out, a label.
- `Toast({ text, start, end, icon?, bottom = 28 })`, `Badge({ text, color, size = 14 })`.
- `Backdrop({ glow = 0.15, x = 50, y = 38, grid = false })`: the stage. Theme background, a warm light at (x%, y%), a cool counter-light, a vignette, an optional dot grid. Keep `glow` at 0–0.2 so the product carries the colour; the demo raises it only for its reveal.
- `Grain({ opacity = 0.05 })`: film grain redrawn 24 times a second, on drawn time.
- `SafeZones({ margins = true })`: the debug overlay. Red bands on the format's safe margins and, on a 9:16 frame, the centred 3:4 grid crop in dashed blue. The cover passes `margins={false}`: in a profile grid nothing covers it, only the crop matters.
- `EndCard({ title, url, cta, start = 0, logo?, times?: { title?, url?, cta? } })`: logo, name, URL, one call to action with a shine, centred in the safe area. The logo settles in from 0.94 with a calm spring, no blur; the name rises with `Words` (the end headline); the URL is 56 px in both shapes; the name, call to action and gaps are 1.4× bigger on a phone.

### `src/lib/devices.tsx`

`Browser({ url, width, height })`, `Window({ title, width, height })`, `Phone({ width, time = '10:08' })` (height follows at 19.5:9), and the bar heights `BROWSER_BAR` (46) and `WINDOW_BAR` (40). Plain shapes in theme colours, no real device artwork: that is trademarked and dates a video fast.

### Scene helpers, `src/scenes/common.tsx`

Shared by the demo's scenes, and the pattern for a user's own:

- `phoneLayout({ W, H, safe })` → `{ ui, captionTop }`: where things go on a 9:16 frame. Punch captions in a band above the product (`captionTop` 330 on a reel, where `Captions` puts them by default), the UI under them (on a reel, x 150–930 and y 530–1450, the same margin both sides so it clears the right-hand button column).
- `Crop({ rect, radius = 36, fade = 0, fadeRight = 0, children })`: a window onto a UI bigger than it, over a card in the app's background. `fade` melts the bottom edge where the UI runs on past the crop instead of cutting a line in half.
- `aimAt(t, x, y, scale, rect, W, H)`: a `Camera` key that centres stage point (x, y) in a crop's rect rather than the frame. Put a `Camera` inside a `Crop` and aim it with this.
- `NOTE_S` (2.21): the scale at which the editor's phone layout (`<Editor compact>`) fills the reel's 780 px UI area and its 15.5 px to-dos render at 34 px.
- `Keycaps({ keys, start, at, end, size })`: big keys that explain a shortcut without words.
- `SCATTER_WIDE`, `SCATTER_TALL`, `Scatter`, `arrival`: the sixteen fragments, where they sit and when each lands, in a shuffled order.
- `PALETTE_HOME`, `PALETTE_SHARE`, `PALETTE_LAUNCH`, `PALETTE_NEW`, `launchBlocks()`, `CaptionScrim({ amount, height })`.

The rule the phone helpers serve: on a 1080 px wide frame, product body text is at least 34 px. Where a whole window would not fit at that size, crop to the part that matters instead of shrinking it.

### The player, `src/Video.tsx`

Props `{ cut, safe?, grain? }`. It reads `CUTS[cut]`, lays the scenes in a `TransitionSeries` with `fade()` transitions of `cross` (in whole frames, `linearTiming`), and gives each scene a `SceneContext` with its marks and warp. On top: `Grain` at 0.05 when the prop, then the cut's `grain`, then "is it landscape" says so; `SafeZones` when `safe`; and `Html5Audio` playing `public/sound-<cut>.wav` when the cut has `"sound": true` and `getStaticFiles()` lists the file. A missing file renders a silent video instead of failing. The WAV is already mastered to the picture (its own fades and level), so the player adds nothing to it.

`Root.tsx` registers one composition per cut, so a cut added to `cuts.json` appears in the studio on its own. An unknown format or scene id throws with the fix.

### Adding a scene

1. Write the component in `src/scenes/`. Read `useTime()`, `useMarks()`, `useStage()`; take every time from a mark, and its words from `useCues()` (its block in `src/captions.json`).
2. Register it in `SCENES` in `src/scenes/index.ts`.
3. Add it to a cut in `src/cuts.json` with its `seconds` and `marks`.
4. It has sound at once: `score.mjs` scores any scene without a cue sheet from the names of its marks (see below). Write it a sheet once its picture settles.

## Sound API

All of `sound/` is Node ESM with no dependencies, and deterministic: the same seed gives the same sound, sample for sample, so a re-render only changes what you changed. The one outside tool is Remotion's bundled ffmpeg, used only to decode compressed reference files.

### `sound/engine.mjs`

```js
SR = 48000
// voices: mono Float32Array at house level, tagged with their bus, peakAt, room send and kind
click({ seed, bright = 1 })                       // UI click: bright transient, small ping near 3 kHz
key({ seed, pitch = 1, space = false })           // subtle laptop key: ~3 kHz tick + small ~850 Hz tap
tick({ seed, tone = 4800 })                       // text that prints itself
pop({ f = 660, from = 1.5, dur = 0.25, seed })    // something lands (pitch falls from f × from to f)
chime({ notes = ['C6'], dur = 1.4, spread = 0.02 })   // glassy success
thump({ f = 60, dur = 0.4, seed })                // a hit you feel
tone({ notes = ['D#3'], dur = 0.6, beat = true, bright = 1800 })   // steady tension: a semitone beating evenly
whoosh({ dur = 0.6, f0 = 300, f1 = 1400, peak = 0.5, q = 0.8, seed })   // pink-noise band sweep, loudest at `peak`
riser({ dur = 1.5, f0 = 200, f1 = 2000, seed })
pad({ notes = ['C3', 'G3', 'D4', 'E4'], dur = 4, bright = 1200, seed = 77 })   // quiet chord bed
step({ f = 1000, seed })                          // tiny footstep
kick({ f = 55, dur = 0.35, seed }), hat({ seed, open = false }), snareish({ seed })   // a light beat kit
note('A4') → 440,  beats(bpm, count, offset = 0) → seconds

// the mix: buses sfx, whoosh, pad, beat, and a send to a small Freeverb-shaped room
createMix(seconds, { only = env ONLY, cues = false })
place(mix, sound, t, { gain = 1, pan = 0, room, bus })   // pan -1…1 or [from, to]; a null t places nothing
placePeak(mix, sound, t, opts)                    // the sound's loudest moment lands on t
master(mix, { gainDb = 0, ceiling = 0.89, clip = 3, hp = 30, lp = 18000, reverb = true,
              fadeIn = 0.005, fadeOut = 0.25, lookahead = 0.003, release = 0.12 })
       → { l, r, ...what the soft clip and the limiter did }
MASTER_BASE                                       // the fixed master gain at gainDb 0: +17 dB
writeWav(file, { l, r })                          // 16-bit PCM stereo, TPDF dither (deterministic)
readWav(file), readAudio(file)                    // readAudio decodes mp3/ogg/m4a/flac via Remotion's ffmpeg
recording(file, { trimDb = 0, tailDb = -55, bus = 'whoosh' })   // a recording levelled to a house whoosh
// and the small tools: rng, biquad, dbToGain, gainToDb, resample, truePeaks, peakOf, loudestAt,
// envelopePeak, loudestRms, panned, houseWhooshRms, fft, ffmpeg, HOUSE, BUSES
```

**House levels.** Every voice comes out at a level from `HOUSE`, so at gain 1 a click, a key, a pop and a whoosh already sit right against each other. The clicks, keys, ticks, whooshes, steps and pad were balanced by ear with the founder of a real launch film. The events (pop, thump, chime, tone) sit 2.5 to 5 dB lower than they did there: that film was mastered at −21.5 LUFS, and at the −14 to −17 a feed or a showcase wants, the old balance would have the limiter flattening every event. Lean with `gain` (usually 0.5 to 2) rather than rebalancing.

**The master** sums the buses, adds the room, rolls off below `hp` and above `lp`, applies a fixed gain, fades the ends, soft-clips the top `clip` dB of transients, and holds true peak under `ceiling` with a look-ahead limiter that only touches the few biggest hits. It never normalises: turn one sound down and nothing else moves. The engine's default ceiling is 0.89 (about −1 dBTP); `design.mjs` passes −2 dBTP.

### `sound/timeline.mjs`

The picture's clock in plain Node, reading the same `src/cuts.json` (or env `CUTS`) and the fps of each format from `src/formats.ts`.

```js
loadCuts(file)          // parsed and checked: scenes present, cross >= 0, seconds > 0 and >= cross,
                        // warps a list of [drawnSec, sceneSec] pairs. Cached per file.
getCut(cut), fpsOf(cut), formatFps()
cutDuration(cut)        // seconds, on the frame grid
scenesOf(cut)           // [{ id, start, end, seconds, marks, warp }] in cut seconds
sceneStart(cut, scene)
warp(knots)             // drawn → scene seconds, as the picture does it
unwarp(knots, sceneSec) // scene → drawn seconds: the first drawn second that reaches it. A freeze
                        // returns its first drawn second; a jump draws the skipped time at the jump.
at(cut, scene, markOrSeconds)   // absolute cut seconds: unwarp, then add the scene's start
hasMark(cut, scene, mark)
snap(t, fps)            // the first frame at or after t: where the picture shows something at t
```

`node sound/timeline.mjs [cut]` prints every scene and mark in cut time.

### `sound/score.mjs`

`score(cut, mix, at)` places every cue for a cut; `at(scene, markOrSeconds)` is timeline's `at` bound to that cut. Each cut has a case:

| cut | style | layers |
|---|---|---|
| `showcase` | calm | every scene by `byMarks`, a pad under each |
| `reel` | punch | by `byMarks`, a whoosh through every crossfade that has none, pads, a 120 bpm beat |
| `story` | punch | by `byMarks`, pads, a 120 bpm beat from the card to the last downbeat at least 1.5 s before the end |
| `loop` | calm | UI sounds only (loops usually play muted) |
| any other | by format | calm or punch from its format; transitions on punchy cuts; pads |

**Two ways to score a scene.** `byMarks` uses a scene's hand-written cue sheet in `SHEETS` when it has one and the cut has every mark the sheet `needs`. A sheet is written while looking at the scene's code: where the scene times a move off a mark (`m.click1 - 0.3`), the sheet uses the same expression, so each sound lands on the frame where its picture happens. Every demo scene except the loop has a sheet. Any other scene falls back to `byName`, which scores it from the names of its marks through `RULES`: `click*` and `tap*`, `keys`/`shortcut`, `enter`, `*typeStart` with its `*typeEnd`, `paletteOpen`, `*Open`, `*Close`/`*Out`, `cardIn*`, `join*`, `toast*`, `check*`, `select`, `noResults`, `ctaIn*`, `hit`/`punch`/`slam`, `burst*`, `whoosh*`/`swipe*`, `focus*`, `restore`/`back`, `gather*`, `settle*`, `step*`, `done`/`success`, `pointer*`, `*In`, and `title` on a punchy cut's first scene. A mark no rule knows stays silent: captions should never make noise.

**The kit.** Sheets and rules work through helpers bound to the cut: `k.click`, `k.key`, `k.tick`, `k.pop(t, noteName)`, `k.chime`, `k.thump`, `k.tension`, `k.riser`, `k.step`, `k.swish` (a whoosh loudest at `t`, sized, panned, rising or falling), `k.swishFree` (skipped if another whoosh peaks within 0.45 s), `k.move(s, from, to)` (the whoosh of an eased camera move, loudest mid-move), and `k.typing(s, from, to, { text, remote })` (a key on the frame each character appears). Every sound gets its own seed, derived from the cut's name, so no two are alike and every render is the same again. `CALM` and `PUNCH` scale whooshes (`air`), UI sounds (`ui`), hits (`hit`) and the pad. Phone formats also narrow the stereo (width 0.35; 0.6 for square) and set hits lower.

**What the score reads from the picture.** `TYPED` holds the text typed on screen, by `cut/scene/typeStartMark`, so keys land on the exact frames. `typedTimes` and `rand` are ported from `text.tsx` and `anim.ts`, and `EASINGS.inOut` as `IN_OUT`. The scatter layouts and each fragment's app are read out of `scenes/common.tsx` and `product/Fragments.tsx` by regex, so pans follow the frame (a neutral spread if they can't be read).

**Reference whooshes.** Put a whoosh you like at `sound/refs/whoosh.wav` (or .mp3, .ogg, .m4a, .flac, .aif) or point `WHOOSH_REF` at one, and every whoosh grows fresh from it. `SYNTH_WHOOSH=1` forces the synthesized ones.

### `sound/design.mjs`

The entry point. Renders a cut's score, masters it, writes `public/sound-<cut>.wav`, and reports.

```bash
node sound/design.mjs showcase          # one cut
node sound/design.mjs --all             # every cut with "sound": true
node sound/design.mjs reel -2           # 2 dB under the fixed gain, just this once
node sound/design.mjs reel --fit        # find the gain that hits the target and print it
node sound/design.mjs reel --cues       # also print the cue sheet: every sound placed, by time, under its scene
ONLY=whoosh node sound/design.mjs reel  # one layer (sfx, whoosh, pad, beat, or a list) → sound-reel-whoosh.wav
CUTS=path/to/cuts.json  OUT=dir         # read another cuts file, write somewhere else
```

| setting | value | why |
|---|---|---|
| `TARGET_LUFS` | −17 for showcase and loop, −14 for every phone format | feeds play loud on phones; a sparse UI film at −14 would have the limiter flattening every hit, since its big moments sit 10 to 12 dB over its average |
| `FORMAT_GAIN_DB` | +0.7 showcase and loop, +0.1 phone formats | calibrated with `--fit` on the demo; a phone cut's beat, fuller pad and whoosh on every cut already fill it |
| `CUT_GAIN_DB` | `{ story: 1.3 }` | a cut much sparser or busier than typical gets its own fixed gain |
| `CEILING_DB` | −2 dBTP | AAC adds overshoot (measured on the reel: +0.1 dB at 256 kbps, +0.7 at 192 and 128), and the delivered file must stay under −1 |
| high-pass | 40 Hz on phone formats, 30 elsewhere | phone speakers barely play the lowest lows; energy there only eats headroom |

The report says, in dB and plain words: integrated loudness, true peak, loudest 3 s and range; the distance to target and the command that fixes it; what the soft clip and the limiter did (a shaved click is fine, a held-down chord is not, and it names the time); how the layers sit (whooshes at least 3 dB under the UI sounds, the beat under them too); and each scene's mean and loudest 400 ms.

### `sound/tools/`

- `loudness.mjs file.wav [more.wav …] [--from s --to s]`: ITU-R BS.1770 / EBU R128. K-weighted momentary (400 ms), short-term (3 s), integrated with the −70 LUFS and −10 LU gates, loudness range, true peak from 4× oversampling. With several files, how each differs from the first, in dB: the way to report a change.
- `spectrogram.mjs file.wav [more.wav …] out.png [--from s --to s]`: log frequency 30 Hz to 20 kHz, time in seconds, level as colour. Several files stack on one shared time and level scale, so a reference and its variants compare at a glance. Pure JS, PNG written with zlib.
- `analyze.mjs file [more …] [--json]`: a reference in plain words: length, when it starts, peaks and ends, attack and decay, loudness, brightness and whether it moves, energy by band, noisy or tonal (and which notes), stereo width, what it is most like, and whether to grow it or model it.
- `grow.mjs ref.wav [--out dir] --n 5 --dur 0.6 [--pitch --spread --bend --pan --peak --seed]` (`--out` defaults to `out/grown`; a preview, nothing plays it): measure a noisy sound (energy per 1/8-octave band every 2.7 ms, middle and sides, smoothed over about 13 ms) and grow new ones from fresh noise with that colour and that rise and fall, stretched, pitched, Doppler-bent and panned. Writes a profile JSON, the variants, and a side-by-side spectrogram. As a module: `profileOf(file)`, `measure`, `grow(profile, { dur, peak, pitch, bend, width, seed, trimDb })`. Grow noisy sounds (whooshes, swells, air); model percussive ones (clicks, keys, taps) with the engine's voices, because resynthesized from noise their snap turns to mush.

## Checking without watching

Claude cannot watch a video, so the template is built to be checked by reading.

- **Stills.** `node scripts/stills.mjs <cut> [--marks | --at 1.2,3.4] [--safe] [--keep] [--concurrency N]` bundles once into `out/.bundle` (cleared and reused, so nothing piles up in the temp folder), opens one browser, renders 2 stills at a time on 16 GiB of RAM or less (else Remotion's default), and renders a PNG at every mark and 0.2 s after it (the moment it lands and the moment it has landed), every scene's middle, and the first and last frame. `--safe` passes `{ safe: true }` to draw the safe zones. It writes `out/stills/<cut>-<seconds>.png` (with `--safe`, `<cut>-safe-<seconds>.png`) and a label index, `out/stills/<cut>[-safe].json`. A `<Still>` renders one frame: `out/stills/cover.png` or `cover-safe.png`.
- **Contact sheets.** `node scripts/sheet.mjs <cut> [--safe] [--cols N] [--tile px] [--per N]` tiles them with an 18 px gap and a label under each (time and mark), 3 columns of 480 px for landscape and 4 of 270 px for portrait by default, so a page stays under 1,600 px wide. Writes `out/sheet-<cut>.png` (or `-safe.png`) and, past 12 stills, pages of 12 (`-p1.png`, `-p2.png`…). Pure Node with a 5×7 pixel font: Remotion's bundled ffmpeg has no `tile` or `drawtext` filter.
- **The cue sheet.** `node sound/design.mjs <cut> --cues` lists every sound by time under its scene, runs of the same sound folded into one line. Each cue should sit on the mark it belongs to.
- **Loudness and spectrograms.** The design report, `sound/tools/loudness.mjs` to compare mixes in dB, `sound/tools/spectrogram.mjs` to see them.
- **The rendered file.** `node scripts/check.mjs <file> [--target -14]`: length, fps, size, codecs, integrated loudness and true peak (ffmpeg's EBU R128 analysis).
- **Tests.** `node sound/test/run.mjs` checks the timeline against `fixture-cuts.json`, every voice's determinism, panning and `ONLY`, the meter against the EBU reference (a 1 kHz tone at −23 dBFS reads −23.0 LUFS), gating, true peak, the limiter and soft clip, grows five whooshes, runs every tool's CLI, checks the places the sound copies the picture (next section), and runs `design.mjs` twice to prove it is deterministic. `node sound/test/parity.mjs [cuts.json]` transpiles the real `src/lib/time.ts` in memory (with the project's own TypeScript, React and Remotion stubbed) and compares it with `timeline.mjs` on every cut: lengths, scene starts on the frame grid, warps at every frame, and every mark through `unwarp`. `node scripts/test.mjs` checks the picture-side scripts: the sheet's default layout and paging on tiny generated stills, the encode presets' zscale filter strings, and the caption export against fixtures and against the demo's `captions.json`. `npm test` runs both suites. All exit non-zero on any failure.

## Delivery

`node scripts/encode.mjs <preset> <input> [--max-mb N] [--out file] [--width px] [--fps n] [--mute]` re-encodes with Remotion's bundled ffmpeg. Output defaults to `out/<name>-<preset>[-<N>mb].<ext>`. Every preset converts the render's full-range BT.601 with `zscale` (to limited-range BT.709 yuv420p, or to RGB for the GIF), which keeps a dark UI's shadows within a fraction of a level; swscale's `out_range` conversion came out 1 to 2 levels darker.

| preset | what |
|---|---|
| `instagram` | H.264 High, yuv420p, limited-range BT.709, AAC 48 kHz, faststart |
| `tiktok`, `shorts` | H.264 CRF 18, AAC 192k, faststart |
| `youtube` | H.264 CRF 16, closed GOP of half the frame rate, AAC 384k |
| `linkedin` | H.264 CRF 20, AAC 192k, faststart |
| `x` | H.264 CRF 20 capped at 16 Mbps, AAC 192k, faststart |
| `gif` | palette-optimised from a zscale RGB conversion, 720 px wide (400 for portrait), 15 fps, no sound |
| `webm` | VP9 + Opus for a landing-page `<video>` (add `--mute` for loops) |

`--max-mb` makes a two-pass copy at the bitrate that fits, for upload tools that cap size; check text sharpness on stills from it.

`node scripts/captions.mjs <cut> [textKey]` writes `out/<textKey>.srt`, `.vtt` and a `.txt` transcript from `src/captions.json`, each line timed through `sound/timeline.mjs` (warps included), punch cues joined into readable lines, a warning for any line under its reading time. `textKey` picks another block of `captions.json`, such as a translation over the same cut. The sound is copied as it is when the render's AAC is already 48 kHz stereo at a good enough bitrate: a second AAC generation smears it and pushes true peak up about half a dB, past the −1 dBTP the mix left room for.

## Copies that must agree

The picture runs in Remotion and the sound in plain Node, so a few things exist twice. When you change one side, change the other.

| the picture | its copy | what guards it |
|---|---|---|
| `src/lib/time.ts` (lengths, scene starts, frame grid, warp) | `sound/timeline.mjs` | `sound/test/parity.mjs`, also run by `run.mjs` |
| fps in `src/formats.ts` | read by `timeline.mjs` with a regex | parity |
| `typedTimes` in `text.tsx`, `rand` in `anim.ts` | ported in `score.mjs` | `run.mjs` checks the formula and constants are unchanged |
| text typed in scenes | `TYPED` in `score.mjs` | `run.mjs` fails if a string is no longer in `src/` |
| `EASINGS.inOut` | `IN_OUT` in `score.mjs` | nothing: change both |
| `SCATTER_WIDE`, `SCATTER_TALL`, `FRAGMENTS`, `APPS` | read from source by regex in `score.mjs` | falls back to a neutral pan |
| move timings in each demo scene (`arrival()`, camera pushes) | the scene's sheet in `SHEETS` | by hand: `--cues` against stills |
| cut math | a simpler copy in `scripts/stills.mjs`, used only to pick still times | frames are rounded after |
| the cue time rule (`cueTime` in `src/lib/cues.ts`) | `cueTime` in `scripts/captions.mjs` | `scripts/test.mjs` compares the two patterns |
| the template's machinery (`src/lib/`, `Video.tsx`, `formats.ts`, the engine, timeline, tools, tests and scripts) | its own copy in `examples/skill-promo/` | by hand: diff the two after a change |

## Lessons from a real launch

The template's defaults come from making a launch film (16:9 and vertical; about 62 s after the re-pacing below, 65 s in its final cut) and its 38 s Instagram reel for a real product, with its founder. These are the reasons behind the numbers. The references turn them into guidance for Claude; keep the two consistent.

### Story and pacing

- The first cut was 37 s and only very technical people understood it. Re-paced to about 62 s with one plain sentence per beat, it worked. Hold each caption at least (words ÷ 3) + 1 seconds, and let the picture finish its move before the next sentence.
- Replace jargon with its consequence: "merge conflict" became "their changes crash into each other", "merge time" became "untangle it by hand".
- A reel at 29 s was "too fast": viewers couldn't read it. At about 37 s, keeping the "how it works" section, it worked. A reel that states the problem and then says "we solve it" explains nothing; keep one section that shows how.
- For the reel, drop the least essential section (the feature list), never the "how".
- Frame for the real audience. The founder noticed the film made a team product look single-user, and the fix went everywhere: captions, and labels like "alice's agent" instead of "alice".

### Motion and picture

- Showcases get calm, precise motion: one thing moves at a time, everything eases, at most one bounce. That is why `pop` overshoots once at most, and why `EASE` is a fast-out, long-settle curve.
- Vertical is a re-layout, not a letterbox: stack the panels, make the type bigger, keep the timing so the same soundtrack fits. A desktop window shrunk onto a phone reads as noise; rebuild for the phone (`phoneLayout`, `Crop`, `aimAt`) with body text at least 34 px on the 1080 px frame.
- Film grain is off on phone cuts: feed compression smears it into mush.
- A reel can reuse a film's scene through a warped clock, knots squeezing the pauses hardest. Ambient loops (breathing, idle bobs, carets) must run on drawn time, not warped time, or a fast-forward stretch makes them shiver.
- Characters and mascots: cut out with background removal, align every pose on one shared canvas with the feet on one baseline, flip the walk pose for direction, swap poses at the top of a small hop, and waddle with footsteps whose sound lands on each footfall.
- You cannot watch the video, so render stills at key marks and tile them into a contact sheet with gaps: touching tiles merge text across frames and show you words that aren't there. Viewers shrink a tall sheet to fit, shrinking every tile, so long sheets come in pages. Check clipping, anything a camera push shoves off the frame, caption readability, fonts and safe zones.
- For QA of web output, headless Chrome with `--virtual-time-budget` screenshots a page after its animations settle. A very tall window breaks `100vh` layouts.

### Sound

- Sound synthesized and placed in code beat AI-generated music and effects, which were tried and lost clearly.
- "Too white-noisy, overwhelming" → pink noise, lower bands, shorter tails, 3 to 6 dB down.
- "The swarm sounds bad, it's the same whoosh repeated" → never repeat one sample. Grow a unique variant per use from the reference: measure 1/8-octave band energy over time, resynthesize from fresh noise, stretch to the move, pitch by size, bend for Doppler, pan along the path. `k.swish` does this for every whoosh.
- "Stabilize the electronic sound" (a bit-crushed random glitch before an error) → a steady tone: two notes a semitone apart, beating evenly. That is `tone`.
- "Smoother typing", then "subtle MacBook keys" → a light tick near 3 kHz and a small tap near 850 Hz, quiet, no thock, each key on the frame its character appears (`snap` puts it on the first frame at or after the character's time).
- Pops land about 0.04 s after their mark: a spring starts from rest, and the eye reads the landing, not the first frame of the move.
- Whooshes carry moves; they never cover a click or a key. The report checks they sit at least 3 dB under the UI sounds. Two whooshes on one moment is one too many, a second riser into the same hit is skipped, and a kick never doubles a hit.
- A fixed master gain, so turning one sound down never turns the rest up; a look-ahead limiter that only touches the biggest hits; K-weighted loudness per stretch; changes reported in dB and plain words. The user is the ears.
- The founder's method, first-class in the template: send audio files you like, and Claude tailors them to each moment. Analyze the reference and describe it back in plain words, cast references to moments by character, then either play one as recorded (peak aligned to the move, `recording` + `placePeak`) or grow new variants. Model percussive references (clicks, keys) instead of growing them. Level-match to what was there. Show spectrograms side by side.
- Don't redistribute stock audio: most licenses allow using a sound in a video but not sharing the raw file. That is why `sound/refs/` is gitignored.
- Footsteps and hits follow the picture's actual event times, derived from the same marks.
- Mastering: about −14 LUFS for reels, stories and feeds, −16 to −18 for a showcase (the template aims at −17), true peak at or under −1 dBTP in the delivered file, so the WAV is held at −2.

### Brand, credits and honesty

- Credit only organisations that agreed, in their words. The film's founder wanted "supported by" and a big tech company's logo after one friendly call with that company's startup team; with no formal support the logo came out, because under "supported by" it tells every viewer the company backs the product. Another organisation came off the credits later at its own request.
- Prefer official vector logos (check the site's inline SVG or CDN), hash-verify the path data, crop the viewBox to the artwork, and size marks by visual weight. Trace a raster only when no vector exists: upscale 8 to 12×, blur lightly, threshold, find contours with holes, fit straight edges with sharp corners, smooth the curves. Rebuild geometric marks from measured geometry so they can animate.
- Never show inflated numbers. A waitlist counter with a hidden head start is fake proof: show the true number or none.
- Ask before downloading third-party assets.

### Delivery

- Some Instagram upload tools cap files near 10 MB: make a two-pass H.264 copy at the bitrate that fits (`encode.mjs instagram --max-mb`), and check text sharpness on stills from it.
- Reel cover: 1080×1920 with everything important inside the centred 3:4 (1080×1440) the profile grid shows.
- Story: keep the top 250 px and bottom 380 px clear, leave an empty spot for the link sticker and point at it, no fake counts.
- LinkedIn company cover: 1128×191 (render at 2×), with the bottom-left clear where the page logo overlaps.
- A 16:9 showcase for YouTube and the landing page; the same scenes re-laid out 9:16 for phones.

### Engineering

- Everything is a pure function of time. No `Math.random()` or `Date` in scenes; seeded `rand` and seeded voices. Renders are identical, and the sound can recompute "random" layouts.
- Render one video at a time on modest machines. Chrome and bundling are memory-hungry, and two renders at once on a 16 GB machine crash halfway through. The config renders 2 frames at a time on 16 GiB or less.
- `bundle()` without an `outDir` leaves a ~50 MB `remotion-webpack-bundle-*` folder in the system temp folder on every call. A day of stills runs left about 450 of them, 20 GB. `stills.mjs` now bundles into `out/.bundle` and reuses it.
- The sound lays scenes on the player's frame grid. Without that, a length that isn't a whole frame makes the sound drift a little further with every scene.
- A missing mark used to animate at NaN without a word. `useMarks()` now throws with the scene, the cut and the fix.
- Fonts: `@remotion/google-fonts` (or `@remotion/fonts` for local files) holds rendering until the fonts arrive. A render that starts before they load silently uses a fallback. Only the `latin` subset is loaded, so symbols like ⌘, →, ✓ and ↵ are drawn as icons (`src/product/icons.tsx`).
- AAC adds true-peak overshoot, and a second AAC generation adds more: master under −2 dBTP and copy audio through re-encodes when it is already good.
- Windows with `core.autocrlf=true` can ship scripts with CRLF shebangs that break on macOS and Linux. The repo's `.gitattributes` forces LF; check line endings when shipping scripts anyway.
- Every `remotion` and `@remotion/*` package must be the same exact version. Upgrade them together (`npx remotion upgrade`).
- Remotion's license is free for individuals and companies of up to three people; larger companies need a company license. The skill tells the user.
