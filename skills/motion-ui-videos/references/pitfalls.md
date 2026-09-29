# Pitfalls: symptom, cause, fix

A catalog of what goes wrong when making motion videos in code with this template, and how to fix it. Each entry starts from what you (or the user) will actually see — a flicker, a silent file, a caption that shivers, an error message — then gives the cause and the fix, with a command or a few lines of code where that is faster than words. Most of these were hit for real while shipping a launch film and its reel; the rest are the Remotion and Windows traps that sit right next to them. Find the symptom in the index, jump to the entry, and fix the cause rather than the symptom (raising a timeout, for example, usually hides a slow asset). Commands run from the project's `video/` folder.

## Find it by symptom

| you see | entry |
|---|---|
| things jitter or change between renders | [1](#1-things-jitter-flicker-or-differ-between-renders) |
| motion plays in Studio, frozen or random in the render | [2](#2-motion-works-in-studio-but-is-frozen-or-random-in-the-render) |
| the reel runs slower or faster than the showcase | [3](#3-the-reel-runs-at-a-different-speed-from-the-showcase) |
| one element out of step in a warped cut | [4](#4-one-element-is-out-of-step-in-a-warped-cut) |
| idle motion shivers, time runs backwards | [5](#5-idle-motion-shivers-or-time-runs-backwards-under-a-warp) |
| wrong font, text width jumps | [6](#6-the-wrong-font-or-text-that-changes-width) |
| one character is a box or in another font | [7](#7-one-character-is-a-box-or-in-another-font) |
| "delayRender() … was called but not cleared after 28000ms" | [8](#8-a-delayrender-was-never-cleared-timeout) |
| an image blank in some frames, "Error loading image" | [9](#9-an-image-is-blank-in-some-frames) |
| a screen recording stutters or drifts | [10](#10-a-screen-recording-stutters-or-drifts) |
| `staticFile()` throws, or 404 | [11](#11-staticfile-throws-or-the-asset-404s) |
| "…Sequence /> must not be shorter than … Transition />" | [12](#12-a-sequence-shorter-than-its-transition) |
| old text shows through a crossfade, a scene starts faded | [13](#13-old-text-shows-through-a-crossfade) |
| sound later and later with each scene | [14](#14-sound-drifts-later-with-every-scene) |
| black last frame, end card a frame short | [15](#15-a-black-last-frame-or-a-frame-missing-at-the-end) |
| wobbly springs, overshoot past the edge | [16](#16-a-spring-wobbles-or-overshoots-out-of-its-box) |
| push-in clips text, shows edges, softens type | [17](#17-a-camera-push-in-clips-text-shows-edges-or-softens-type) |
| vertical cut shows half the UI | [18](#18-the-vertical-cut-shows-half-the-ui) |
| renders crawl | [19](#19-renders-crawl) |
| "Target closed", crashes, freezes, ENOSPC | [20](#20-crashes-freezes-or-a-full-disk) |
| long "Bundling…" before every still | [21](#21-a-long-wait-before-every-still-or-render) |
| `npx remotion ffmpeg`: "No option name near …" | [22](#22-npx-remotion-ffmpeg-cannot-find-a-filter-or-format) |
| Windows: spaces, `ERR_UNSUPPORTED_ESM_URL_SCHEME`, env vars, case | [23](#23-windows-paths-imports-env-vars-and-case) |
| Windows: "Failed to launch the browser process! spawn … chrome-headless-shell.exe ENOENT" | [23](#23-windows-paths-imports-env-vars-and-case) |
| `env: 'node\r': No such file or directory` | [24](#24-crlf-shebangs) |
| a reference sound plays sharp, short or as static | [25](#25-a-reference-sound-plays-sharp-short-or-as-static) |
| the render is silent | [26](#26-the-render-is-silent) |
| sound off by exactly what you just changed | [27](#27-sound-off-by-exactly-what-you-just-changed) |
| a sound change doesn't reach the render | [28](#28-a-sound-change-doesnt-reach-the-render) |
| crackles, squashed hits, pumping | [29](#29-crackles-squashed-hits-or-pumping) |
| push rejected, huge repo | [30](#30-big-files-in-git) |
| "can we use this at work?" | [31](#31-remotion-license) |
| web screenshots mid-animation, giant hero | [32](#32-web-page-screenshots-caught-mid-animation-or-with-a-giant-hero) |
| a still that freezes a later frame shows the first one | [33](#33-a-still-that-freezes-a-later-frame-shows-frame-0) |
| the disk fills up; hundreds of `remotion-webpack-bundle-*` folders in the temp folder | [34](#34-the-disk-fills-up-with-remotion-webpack-bundle-folders) |

---

## Time and determinism

### 1. Things jitter, flicker or differ between renders

- **Symptom:** particles, sparkles or "random" layouts jump every frame; two renders of the same cut differ; a still from `scripts/stills.mjs` doesn't match the same moment in the video; the sound's "random" choices don't line up with what's on screen.
- **Cause:** `Math.random()`, `Date.now()`, `new Date()` or `performance.now()` in a scene or product component. Remotion renders every frame on its own, in several browser tabs at once and in no fixed order, so anything not derived from time is different per frame and per tab.
- **Fix:** seeded `rand(seed)` from `src/lib/anim.ts`, keyed on something stable. Vary it with time only on purpose, and only in steps:

  ```tsx
  const t = useTime();
  const { W } = useStage();
  const x = rand(i * 7 + 1) * W;                         // fixed per particle, same every render
  const shimmer = rand(i * 31 + Math.floor(t * 12));     // changes 12×/s, still identical each render
  ```

  Fake the clock: the product's UI shows times from the story's data (`'9:41'`, `'2 min ago'`), never the machine's. Seeds also let `sound/score.mjs` recompute the same "random" layout (a pan per particle, say) with the same numbers, so sound follows picture.

### 2. Motion works in Studio but is frozen or random in the render

- **Symptom:** a hover transition, a spinner, a CSS `@keyframes`, a counter driven by `setInterval`, a `useState` flipped in `useEffect` — fine-ish while previewing, but in the render it sits at its first state, lands at a random point, or flickers.
- **Cause:** rendering seeks to a frame and screenshots it. CSS transitions and animations, timers, `requestAnimationFrame` and self-advancing state all run on wall-clock time, not on the frame.
- **Fix:** every visual value comes from `useTime()` (or `useDrawnTime()` for ambient loops) during render. Strip `transition` and `animation` from any real product CSS you port into `src/product/`. Replace state with comparisons against marks:

  ```tsx
  const t = useTime();
  const { click } = useMarks();
  const open = t >= click;                                        // not useState + onClick
  const spin = `rotate(${loopT(useDrawnTime(), 0.8) * 360}deg)`;  // not a CSS keyframe
  ```

### 3. The reel runs at a different speed from the showcase

- **Symptom:** the same scene plays twice as slow in the 30 fps reel as in the 60 fps showcase (or twice as fast the other way): typing, springs, slides — everything.
- **Cause:** timing written in frames: `useCurrentFrame()`, `interpolate(frame, [0, 30], …)`, a raw `spring({ frame, fps: 60 })`. Thirty frames is 0.5 s at 60 fps and 1 s at 30.
- **Fix:** seconds everywhere — `useTime()`, `prog(t, start, dur)`, `pop(t, start)` (already in seconds; its optional `fps` only snaps the clock to a frame grid). Find the offenders: `grep -rnE "useCurrentFrame|interpolate\(|spring\(" src/scenes src/product`.

### 4. One element is out of step in a warped cut

- **Symptom:** in the reel, the cursor arrives after the button already reacted; a caption lands before the thing it names; keys sound early against the text.
- **Cause:** mixed clocks. The warp only applies to `useTime()`. Parts of the scene on `useDrawnTime()` or `useCurrentFrame()` run unwarped, so they slide against the rest.
- **Fix:** anything the story depends on — clicks, typing, UI state, `Cursor`, `Camera`, showcase captions — uses `useTime()`. Only ambient loops (breathing, idle bobs, pulses, a blinking caret, grain) use `useDrawnTime()`. Captions written for the reel directly on screen time use `Captions` with `drawn`. The sound follows automatically because `at()` inverts the same warp.

### 5. Idle motion shivers, or time runs backwards, under a warp

- **Symptom:** a breathing avatar or pulsing dot speeds up and snaps back in stretches of the reel; in worse cases an element rewinds, or keeps animating past where the scene used to end.
- **Cause:** three different mistakes. (a) Ambient loops on warped time: a stretch with slope 2.5 plays the loop 2.5× fast, then snaps back at the next knot — that is the shiver. (b) Knots not increasing in both columns: a negative slope runs time backwards. (c) The last knot's drawn value isn't the scene's `seconds`: `warp()` extends past its ends, so the scene's clock runs beyond the part that was designed.
- **Fix:** `useDrawnTime()` for ambient loops, and a quick lint of every warp in `cuts.json`:

  ```js
  // out/knots.mjs  →  node out/knots.mjs
  import { loadCuts } from '../sound/timeline.mjs';
  for (const [id, cut] of Object.entries(loadCuts())) for (const s of cut.scenes) {
    if (!s.warp) continue;
    s.warp.slice(1).forEach(([d, v], i) => {
      const [d0, v0] = s.warp[i];
      if (!(d > d0 && v > v0)) return console.log(`${id}/${s.id}: knot ${i + 1} does not increase`);
      const k = (v - v0) / (d - d0);
      if (k > 2) console.log(`${id}/${s.id}: ${d0}–${d}s plays ${k.toFixed(1)}× fast (fine for a pause, frantic for a move)`);
    });
    const last = s.warp.at(-1)[0];
    if (last !== s.seconds) console.log(`${id}/${s.id}: last knot at ${last}s, scene is ${s.seconds}s`);
  }
  ```

  Squeeze pauses hardest and moves least; a motion strip across each steep stretch (review-and-qa, section 6) shows whether it reads.

## Assets and loading

### 6. The wrong font, or text that changes width

- **Symptom:** the type looks generic; lines wrap differently from what you planned; the first frames use a fallback and then the text jumps in width; every weight looks the same (synthesized bold looks smeared). No error anywhere.
- **Causes and fixes:**
  - `src/fonts.ts` isn't imported, so nothing is loaded. It must be imported from the tree that renders (the template does this; a new font goes in `fonts.ts`, nowhere else).
  - `theme.ts` names a family that isn't the one loaded (`'Inter Variable'` vs `'Inter'`). Use the `fontFamily` the loader returns rather than typing the name.
  - A weight you use isn't loaded. Asking for 700 when only 600 is loaded makes Chrome fake a bold.
  - A font installed on your machine, not loaded in code: fine locally, fallback on the user's machine or CI. Always load through `@remotion/google-fonts` or `@remotion/fonts`; their `loadFont` holds rendering until the font is ready.
  - Loading every weight and subset of a Google font means dozens of requests per render tab and slower starts (and entry 8). Load only what you use.
  - Measuring text (to size a `Highlight` or a layout) before the font arrives gives fallback widths. Measure after the font is ready, or avoid measuring with fixed sizes.

  ```ts
  // src/fonts.ts
  import { loadFont } from '@remotion/google-fonts/Inter';
  import { loadFont as loadLocal } from '@remotion/fonts';
  import { staticFile } from 'remotion';

  export const SANS = loadFont('normal', { weights: ['400', '500', '600'], subsets: ['latin'] }).fontFamily;
  loadLocal({ family: 'Brand Display', url: staticFile('fonts/brand-display.woff2'), weight: '600' });
  ```

  The template ships `@remotion/google-fonts`. For a local font file, add `@remotion/fonts` at exactly the same version as `remotion` (mismatched Remotion packages break in odd ways; `npx remotion versions` lists them and flags mismatches).

  Check with a still: a line of the brand face and a line of the mono face side by side make a fallback obvious.

### 7. One character is a box or in another font

- **Symptom:** `→`, `✓`, `⌘` or an emoji renders as `□` or in a visibly different face — maybe only on another machine.
- **Cause:** the glyph isn't in the loaded font or subset, so Chrome falls back per character to whatever system font has it; a machine without a symbol or emoji font draws a box. Google Fonts' `latin` subset covers the basics and common punctuation, not every arrow or symbol.
- **Fix:** draw icons and arrows as inline SVG (they are UI anyway, and crisper under `Camera`); load the subset that contains the glyph; don't put emoji in rendered text. List every non-ASCII character in scenes and product UI: `grep -rnP "[^\x00-\x7F]" src/scenes src/product`. Typographic quotes and dashes are normally fine.

### 8. A delayRender was never cleared (timeout)

- **Symptom:** a render or still aborts with `A delayRender() "…" was called but not cleared after 28000ms` (the default timeout is 30 s; Remotion fires 2 s early), often at the same frame each time. The quoted label says what was being waited for, e.g. `Loading <Img> with src=…`.
- **Cause:** something never finished loading: a font or image URL that 404s or is slow; a `fetch()` in a component; a `delayRender()` whose `continueRender()` is skipped on an error path; too many parallel tabs starving each other (high concurrency, big videos, many font files).
- **Fix:** read the label and fix that asset. Put data in the repo and import it — no loading step at all:

  ```tsx
  import stats from '../data/stats.json';   // bundled; nothing to wait for
  ```

  Lower `--concurrency` if it only happens under load. Raise the limit (`--timeout=60000`) only after you know why it's slow — a longer timeout hides a slow asset that slows every frame.

### 9. An image is blank in some frames

- **Symptom:** a logo, avatar or screenshot is missing in random frames of the render (fine in Studio), or the render stops with `Error loading image with src: …`.
- **Cause:** a raw `<img>`, CSS `background-image: url(…)` or `mask-image: url(…)` isn't awaited, so some screenshots happen before it loads. The error means `<Img>` retried (twice by default) and gave up: the path is wrong (entry 11).
- **Fix:** `<Img src={staticFile('logos/brand.svg')} />` from `remotion` waits for the load. Replace background images with an `<Img>` using `objectFit: 'cover'` in an absolutely positioned box. Better still for logos and icons: inline SVG in JSX, which needs no loading and animates (draw-ins, per-part motion).

### 10. A screen recording stutters or drifts

- **Symptom:** a real recording inside `Browser` jumps, freezes, shows the wrong moment, or drifts against the captions, and it differs between renders.
- **Cause:** a raw `<video>` (or `Html5Video`) plays on its own clock and is only roughly seeked. Screen recorders and phones often write variable frame rate, which makes it worse. A scene's warp does not reach inside a video.
- **Fix:** `<OffthreadVideo src={staticFile('rec/demo.mp4')} muted />`, which extracts the exact frame outside the browser. Re-encode recordings to a constant frame rate first (the bundled ffmpeg has no `fps` filter; the `-r` option works):

  ```bash
  npx remotion ffmpeg -i "raw/screen recording.mov" -r 60 -c:v libx264 -crf 14 -pix_fmt yuv420p -an public/rec/demo.mp4
  ```

  Don't warp a scene that holds a recording; trim the take instead. Keep raw footage out of `public/` and out of git (entries 21 and 30).

### 11. staticFile() throws or the asset 404s

| message or symptom | cause | fix |
|---|---|---|
| `staticFile() does not support relative paths` | `'./logo.svg'` or `'../public/logo.svg'` | the path inside `public/`: `staticFile('logo.svg')` |
| `staticFile() does not support remote URLs` | an `https://…` URL | pass the URL to `<Img src>` directly — or better, ask the user, then save the file into `public/` |
| 404 for `staticFile('public/logo.svg')` | the path is already relative to `public/` | drop the `public/` prefix |
| a file you just added is not found | the bundle was made before the file existed (`stills.mjs` bundles once at start; `getStaticFiles()` lists files as of the bundle) | run it again; reload Studio |
| works on Windows and macOS, 404 on Linux | `staticFile('Logo.svg')` for `logo.svg`; only Linux is case-sensitive | lowercase file names, match case exactly |
| ffmpeg or a shell script chokes on the file | spaces, `#`, `?` or non-ASCII in the name (`staticFile` encodes them, the shell doesn't) | rename to lowercase-kebab-case ASCII |

`import shot from './shot.png'` also works for files inside `src/`, but the sound engine and scripts can't see them. Keep brand assets in `public/` and use `staticFile`.

## Timing and transitions

### 12. A sequence shorter than its transition

- **Symptom:** `The duration of a <TransitionSeries.Sequence /> must not be shorter than the duration of the next <TransitionSeries.Transition />` (or "…previous…").
- **Cause:** a scene shorter than `cross`. A scene also shares its first and last `cross` seconds with its neighbors, so it is only alone on screen for `seconds − 2 × cross`.
- **Fix:** keep every scene at least `2 × cross` plus the time it needs alone (with `cross: 0.4`, nothing under about 1.2 s), or lower `cross` for that cut. The total is `Σ seconds − cross × (scenes − 1)`, which is what `cutDuration(cut)` returns: five scenes of 4 + 9 + 6 + 8 + 5 = 32 s with a 0.4 s cross run 32 − 4 × 0.4 = 30.4 s.

### 13. Old text shows through a crossfade

- **Symptom:** during a transition, the outgoing scene's caption shows under the incoming scene and then vanishes at once when the transition ends; or a title timed at 0.1 s into a scene looks washed out in its still.
- **Cause:** `fade()` fades only the incoming scene in, over an outgoing scene that stays fully opaque. If the incoming scene has no opaque background, whatever was behind it stays visible until the transition ends, then disappears. And every scene after the first starts its clock at the start of its fade-in, so its first `cross` seconds are partly transparent.
- **Fix:** every scene draws `<Backdrop />` first. Put a scene's first mark at or after `cross`, and finish anything that must be read before `seconds − cross`.

### 14. Sound drifts later with every scene

- **Symptom:** clicks line up in the first scene, sit about 0.3 s late in the second, 0.7 s in the third…
- **Cause:** absolute times computed by adding up scene lengths without subtracting the crossfades (or hard-coded seconds in `sound/score.mjs`). Each boundary adds one `cross` of error.
- **Fix:** place every cue through its mark in `score.mjs`: `s.t(mark)` in a scene's cue sheet, `at(scene, mark)` in a cut's case. Anywhere else, use `sceneStart(cut, scene)` plus unwarped local time, or `at(cut, scene, mark)` from `sound/timeline.mjs` — both subtract crossfades and invert warps.

### 15. A black last frame, or a frame missing at the end

- **Symptom:** the final frame is black or blank, or the end card is one frame short; `check.mjs` reports a duration a frame off `cutDuration(cut)`; late cues are a frame off.
- **Cause:** seconds become frames by rounding, and rounding the total is not the same as rounding each scene and each crossfade. `0.33 × 30 = 9.9` frames rounds to 10 — harmless once, but roundings add up over many boundaries, and any code that rounds differently from the player disagrees by a frame.
- **Fix:** keep scene `seconds` and `cross` on values that are whole frames at every fps you render: one decimal place is 3 frames at 30 fps and 6 at 60, so `cross: 0.3` or `0.4` and scene lengths like `8.5` are exact. (Marks are not rounded by the player: a mark between frames shows on the next frame, and its sound lands less than a frame early, well inside what viewers notice.) Compute any duration through `cutDuration` / `sceneStart` rather than by hand, and compare with `check.mjs` after the render.

## Motion and layout

### 16. A spring wobbles or overshoots out of its box

- **Symptom:** a card bounces three or four times (it looks cheap); a title scaled with a spring pokes past its panel or the safe zone for a few frames; a blur flickers off at the peak, or an element flips.
- **Cause:** a raw `spring()` with low damping, or overshoot (values above 1) fed into properties that must stay within 0–1. `blur(${(1 - p) * 12}px)` goes negative when `p > 1`, which is invalid, so the filter drops out for those frames; `scale(1 - p)` flips.
- **Fix:** `pop(t, start)` settles without overshoot; `pop(t, start, { bouncy: true })` overshoots at most once. Let overshoot reach only scale and position; clamp everything else:

  ```tsx
  const t = useTime();
  const marks = useMarks();
  const p = pop(t, marks.card, { bouncy: true });
  const style = {
    transform: `scale(${lerp(0.92, 1, p)})`,       // may overshoot a little: fine
    opacity: clamp(p),                              // never above 1
    filter: `blur(${(1 - clamp(p)) * 8}px)`,        // never negative
  };
  ```

  Leave room for the bounce near edges: a 1.05 overshoot on a 900 px title adds 45 px. Check with a motion strip (review-and-qa, section 6).

### 17. A camera push-in clips text, shows edges or softens type

- **Symptom:** at the tightest framing, the caption or the thing it names is cut off; a bare strip or corner appears; text looks soft while zoomed.
- **Cause:** captions placed inside `Camera` get scaled with the product; a framing near the product's edge looks past it; `will-change: transform` on the zoomed content makes Chrome rasterize once and scale the bitmap. 3D tilt (`rotateX`/`rotateY` with perspective) also softens type.
- **Fix:** captions are siblings of `Camera`, never children. A framing centered on (x, y) at scale s shows x ± W/2s and y ± H/2s; keep that window inside the stage and the product layer:

  ```tsx
  <AbsoluteFill>
    <Backdrop />
    {/* at 1.25× centered on x 1150: 1150 ± 768 = 382…1918, inside the 1920 stage.
        centered on 1180 it would reach 1948 and show a strip past the edge. */}
    <Camera keys={[{ t: 0, x: 960, y: 540, scale: 1 }, { t: 2.4, x: 1150, y: 470, scale: 1.25 }]}>
      <Browser url="lumen.example/notes" width={1500} height={880}>{/* product UI */}</Browser>
    </Camera>
    <Captions cues={cues} variant="calm" />
  </AbsoluteFill>
  ```

  Keep lean-ins around 1.1–1.2× so context stays on screen, and read-ins at 1.8× or less ([motion-language](motion-language.md) §9). Remove `will-change` from zoomed content. While text must be read, flatten tilts to 3° or less (the real film's panel settled from 18° to about 5°, and flatter reads better).

### 18. The vertical cut shows half the UI

- **Symptom:** in the 1080-wide reel, panels are cut off at the right, text is tiny, and there are empty bands top and bottom.
- **Cause:** landscape coordinates hard-coded in the scene (`left: 1400`), or a 16:9 layout letterboxed into 9:16.
- **Fix:** vertical is a re-layout, not a letterbox. Read `useStage()`, keep a wide and a tall geometry table, stack panels, use bigger type, and keep the same timing so the same sound fits. Grain stays off on phone cuts.

  ```tsx
  const { portrait } = useStage();
  const g = portrait ? TALL : WIDE;   // stacked panels vs side by side; same marks either way
  ```

## Performance and memory

### 19. Renders crawl

- **Symptom:** a few frames per second or fewer; one scene much slower than the rest; fans at full speed.
- **Cause:** expensive paint on every frame — `filter: blur()` on large layers (worst when the radius animates), `backdrop-filter`, huge soft `box-shadow`s, full-frame `mix-blend-mode`, SVG turbulence grain at full size, stacks of large gradients, big images scaled down every frame.
- **Fix:** measure before changing anything. Render two seconds of the suspect scene and of a calm one, then compare:

  ```bash
  npx remotion render src/index.ts showcase out/perf.mp4 --frames=600-719 --log=verbose
  ```

  Then: blur only while something moves (set `filter` to `undefined` once it settles, as `Words` does); replace blurred shapes with radial gradients; bake static glows into a PNG; pre-scale big images to the size shown; shrink shadows; turn `Grain` off where it isn't wanted (portrait cuts, loops, drafts — pass `--props=out/nograin.json` containing `{"cut":"showcase","grain":false}`; a props file avoids JSON quoting trouble in PowerShell). On a machine with a GPU, try `--gl=angle` and compare the timings.

### 20. Crashes, freezes or a full disk

- **Symptom:** `Target closed`, `Page crashed`, `Protocol error`, a Node heap error, the whole machine swapping or freezing, or `ENOSPC`.
- **Cause:** every concurrent render tab is a Chrome renderer holding the page and its images. Remotion defaults to half your CPU threads, up to 8. A second render, Studio, or a `stills.mjs` bundle running at the same time doubles the load. `OffthreadVideo` adds a frame cache. Renders also write temporary files to the system temp folder, so a nearly full system drive fails late, and a script that bundles without an `outDir` fills it a little more every run (entry 34).
- **Fix:** one render or bundle at a time, always — never parallel renders, and close Studio during final renders on small machines. The template's `remotion.config.ts` already renders 2 frames at a time on 16 GiB of RAM or less, and `scripts/stills.mjs` renders 2 stills at a time by the same rule; if a render still crashes, pass `--concurrency=1`. On a bigger machine, `npx remotion benchmark` on a short cut finds the fastest stable value. For recording-heavy cuts, cap `--offthreadvideo-cache-size-in-bytes`. Free disk space before long renders.

### 21. A long wait before every still or render

- **Symptom:** every `npx remotion still` or `remotion render` spends tens of seconds on "Bundling…" before the first frame.
- **Cause:** each CLI call bundles the project and copies `public/` into the bundle. Large files in `public/` (raw recordings, reference audio, old renders) make every bundle slower.
- **Fix:** use `scripts/stills.mjs` — one bundle (into `out/.bundle`, reused), many stills — instead of looping `npx remotion still`. Keep `public/` to what the video uses: reference audio in `sound/refs/`, raw footage outside `public/` until trimmed, renders in `out/`.

## Tools and platform

### 22. `npx remotion ffmpeg` cannot find a filter or format

- **Symptom:** `No option name near '15'` / `Error parsing a filter description` for a command that works with a normal ffmpeg; `Automatic encoder selection failed … wrapped_avframe` when measuring; `Invalid data found when processing input` for an `.aiff` file.
- **Cause:** Remotion's bundled ffmpeg (n7.1) is a trimmed build: filters are disabled except an allowlist. Present: `crop`, `scale`, `zscale`, `trim`, `hflip`, `vflip`, `transpose`, `rotate`, `format`, `split`, `concat`, `palettegen`, `paletteuse`, `colorspace`, `tonemap`, and audio `loudnorm`, `silencedetect`, `volume`, `pan`, `amix`, `amerge`, `adelay`, `atrim`, `apad`, `atempo`, `aresample`, `aformat`, `asetrate`. Missing: `tile`, `pad`, `hstack`/`vstack`, `overlay`, `drawtext`, `fps`, `ebur128`, `blackdetect`, `showspectrumpic` and more. A missing filter fails to parse instead of saying "no such filter". Encoders are limited to the ones video needs (x264, x265, VP8/9, AV1, ProRes, GIF, PNG, AAC, Opus, MP3, PCM), so there is none for the `null` output's video. There is no AIFF demuxer.
- **Fix:**

  | you wanted | use instead |
  |---|---|
  | `-vf fps=15` | the output option `-r 15` |
  | a `tile`/`pad` contact sheet | `node scripts/sheet.mjs <cut>` |
  | `ebur128` | `-vn -af loudnorm=print_format=json -f null -` (prints `input_i`, `input_tp`, `input_lra`), or `node scripts/check.mjs` |
  | `-f null -` on a video file | add `-vn` to drop the video first |
  | `blackdetect` | stills at every scene start |
  | `drawtext` labels | draw them in a Remotion `Still` |
  | an `.aiff` reference | ask for WAV or MP3; on macOS, `afconvert -f WAVE -d LEI16@48000 in.aiff out.wav` |

### 23. Windows: paths, imports, env vars and case

- **Paths with spaces** (`comp programming`, `My Videos`): quote every path in shell commands. npm scripts use relative paths and run from `video/`, so keep your own commands relative too.
- **Long paths.** Every render and still fails before the first frame with `Error: Failed to launch the browser process! spawn …\node_modules\.remotion\chrome-headless-shell\win64\chrome-headless-shell-win64\chrome-headless-shell.exe ENOENT`, although the file exists. The full path to Chrome is past Windows' 260-character limit (MAX_PATH): Chrome sits 105 characters below the project folder, so a `video/` folder whose own path is longer than about 150 characters breaks it. Reinstalling doesn't help. Measure the path (`(Get-Location).Path.Length` in PowerShell, `pwd -W | awk '{print length}'` in Git Bash), then have the user move the repo closer to the drive root (`C:\code\<app>`). Deep monorepos and OneDrive folders are the usual cause.
- **Dynamic import of an absolute path** fails with `ERR_UNSUPPORTED_ESM_URL_SCHEME … Received protocol 'c:'`. Convert first:

  ```js
  import { pathToFileURL } from 'node:url';
  const mod = await import(pathToFileURL(absPath).href);
  ```

- **Inline env vars** (`ONLY=sfx node …`) are bash syntax. In PowerShell: `$env:ONLY='sfx'; node sound/design.mjs reel; Remove-Item Env:ONLY` — it stays set for the whole session until removed (entry 28). In cmd: `set ONLY=sfx&& node sound/design.mjs reel`, then `set ONLY=`.
- **Flags through npm** need `--`: `npm run stills -- reel --marks`.
- **Case:** Windows and macOS ignore case in file names, Linux doesn't — `Logo.svg` vs `logo.svg` works locally and breaks elsewhere (entry 11).
- **Drive letters in ffmpeg filter arguments:** the colon in `C:/…` is an option separator inside a filtergraph. Keep paths out of filter strings, or relative.

### 24. CRLF shebangs

- **Symptom:** a script works on Windows but on macOS or Linux fails with `env: 'node\r': No such file or directory` (or `bad interpreter`).
- **Cause:** Windows line endings in a file with a `#!/usr/bin/env node` line. With `core.autocrlf=true`, git can publish CRLF files.
- **Fix:** add LF rules to `.gitattributes` (append; don't overwrite rules the repo already has):

  ```
  * text=auto eol=lf
  *.png binary
  *.wav binary
  *.mp4 binary
  *.woff2 binary
  ```

  Then renormalize, and check what the index holds (the `i/` column is what gets published), not just your working copy:

  ```bash
  git add --renormalize .
  git ls-files --eol scripts sound | grep "i/crlf"   # nothing printed = fixed
  ```

## Sound

### 25. A reference sound plays sharp, short or as static

- **Symptom:** a user's whoosh placed in the mix is higher and shorter than the original, or comes out as loud noise.
- **Cause:** the file was read by something other than the engine's own loader, say a hand-written WAV reader in a scratch script, or raw samples copied between buffers. The engine runs at 48 kHz (`SR`): a 44.1 kHz file taken as 48 kHz plays 8.8% fast and about 1.5 semitones sharp (48000 ÷ 44100 = 1.088), and a 24-bit or float WAV taken as 16-bit is noise. `readAudio()`, `recording()` and `profileOf()` handle all of that: they read 8/16/24/32-bit and float WAV, decode MP3, OGG, M4A and FLAC with Remotion's ffmpeg, and resample to 48 kHz.
- **Fix:** load every reference through them. `node sound/tools/analyze.mjs <file>` prints the length it read, so compare that with the file's real length. AIFF is the exception: the bundled ffmpeg can't decode it (entry 22), so convert it or ask for WAV. A clean name helps the shell too:

  ```bash
  npx remotion ffmpeg -i "sound/refs/Soft Whoosh 03.mp3" -ar 48000 -ac 2 -c:a pcm_s16le sound/refs/soft-whoosh.wav
  ```

### 26. The render is silent

- **Symptom:** `check.mjs` shows no audio stream, or about −70 LUFS / `-inf`. The render reported no error.
- **Cause:** `Video.tsx` plays `sound-<cut>.wav` only if it exists (it checks `getStaticFiles()`), so a missing file never breaks a render — and never warns. Usual reasons: rendered with `npx remotion render` directly, without `node sound/design.mjs <cut>` first; `"sound": false` for that cut in `cuts.json`; the WAV was written after the bundle was made; `--muted`.
- **Fix:** render with `npm run render:<cut>`, which designs the sound first, and run `check.mjs` after every render.

### 27. Sound off by exactly what you just changed

- **Symptom:** after re-timing a scene or a mark, every cue after it is early or late by exactly that amount.
- **Cause:** a stale WAV. `public/sound-<cut>.wav` was made from the old `cuts.json`; a direct CLI render or Studio preview used it.
- **Fix:** rerun `node sound/design.mjs <cut>` after any timing edit (the npm render scripts do it for you); reload Studio after regenerating.

### 28. A sound change doesn't reach the render

- **Symptom:** you changed the score and rendered with `npm run render:<cut>`, and the video still plays the old mix; the design report's first line ends in `· ONLY sfx` (or another layer) and it wrote `public/sound-<cut>-sfx.wav`.
- **Cause:** `ONLY` left set after a solo — in PowerShell it persists for the session. A solo run writes its own file and leaves `public/sound-<cut>.wav` alone, so the render plays whatever full mix was there before. (Copying a solo file over `public/sound-<cut>.wav` by hand gives the other symptom: a render with only some layers.)
- **Fix:** `Remove-Item Env:ONLY` (PowerShell) or `unset ONLY` (bash), then `node sound/design.mjs <cut>` again, and check that the report's first line names no `ONLY`.

### 29. Crackles, squashed hits or pumping

- **Symptom:** distortion on the loudest hits, or the whole mix ducks each time a `thump` lands.
- **Cause:** a few cues stacked on one moment (voices placed with `gain` above 1, a thump on a kick on a chime) make one peak that the soft clip bends hard and the limiter then holds down, ducking everything under it; or the cut's gain is pushed so the limiter works on many hits instead of only the biggest. The design report says which: its `clip` line (share of samples bent, and where) and its `limiter` line (transients shaved, and longer sounds held down, with the time).
- **Fix:** go to the time the report names and turn down the one loud cue in the score rather than the whole mix. If the whole cut is too hot, lower its gain 2–3 dB (`node sound/design.mjs <cut> -2`, then keep it in `CUT_GAIN_DB`) and check that the WAV's true peak stays at the −2 dBTP ceiling and the delivered file's (`check.mjs`) at or below −1. Measure the stretch around the hit with `sound/tools/loudness.mjs --from … --to …` before and after.

## Repo and legal

### 30. Big files in git

- **Symptom:** a push is rejected, the repo takes minutes to clone, or the README GIF is 30 MB.
- **Facts:** GitHub warns about files above 50 MiB and blocks files above 100 MiB.
- **Fix:** the template's `.gitignore` covers `node_modules`, `out/`, `public/sound-*.wav` and `sound/refs/`. Keep raw recordings and renders out as well. Look at `git status --short` and the size of new files before every commit. A big file removed in a later commit still lives in history — ask the user before any history rewrite. Keep reference audio out of the repo for another reason too: most stock-audio licenses forbid redistributing the raw files. README media should be small, optimized GIFs or short MP4s.

### 31. Remotion license

Remotion is free for individuals, for-profit organizations with up to 3 employees, non-profits, and for evaluation. A for-profit company with more than 3 employees needs a company license (remotion.pro). Tell the user once, early — before they build a campaign on it — and link the license rather than interpreting it.

## Web QA

### 32. Web page screenshots caught mid-animation, or with a giant hero

Useful for checking web output around the video: the landing page the end card points to, a page embedding the loop, an HTML end card. If your environment has a browser tool, use it. Otherwise Remotion already downloaded a headless Chrome into `node_modules/.remotion/chrome-headless-shell/<platform>/…/chrome-headless-shell` (`.exe` on Windows):

```bash
"<path to chrome-headless-shell>" --screenshot=out/site.png --window-size=1440,900 --hide-scrollbars --virtual-time-budget=5000 https://example.com
```

- **Symptom: a blank hero or half-faded elements.** Without `--virtual-time-budget`, Chrome captures before timers and entrance animations have run. The flag fast-forwards the page's virtual time by that many milliseconds before the capture.
- **Symptom: a gigantic hero and huge gaps.** A very tall window (1440×6000 to "get the whole page") makes every `100vh` section 6000 px tall. Shoot at real viewport sizes — 1440×900 for desktop, 390×844 for a phone — and reach lower sections with anchors (`/#pricing`) instead.

## Stills

### 33. A still that freezes a later frame shows frame 0

- **Symptom:** a cover or thumbnail made as a `<Still>` wraps a scene, or the whole cut, in `<Freeze frame={90}>` to show the moment 3 s in, and renders the very start instead: an empty stage, nothing arrived yet. No error, no warning.
- **Cause:** `useCurrentFrame()` clamps the frame to the composition it runs in, 0 to `durationInFrames − 1` (`clampFrameToCompositionRange` in Remotion's `timeline-position-state.js`). A `<Still>` is a composition one frame long, so every frame inside it, a `<Freeze>`'s included, becomes 0. The template's `useTime()` and `useDrawnTime()` read `useCurrentFrame()`, so every scene clock sees 0 too.
- **Fix:** render the still as a one-frame render of a longer `<Composition>`, at least one frame longer than the frame it freezes:

  ```tsx
  // src/Root.tsx: a <Composition>, not a <Still>, so that frame 90 exists
  <Composition id="cover-live" component={CoverLive} width={1080} height={1920} fps={30} durationInFrames={91} />

  // src/scenes/CoverLive.tsx: the reel's own frame at 3 s, frozen, with the cover's title on top
  import { AbsoluteFill, Freeze } from 'remotion';
  import { KineticTitle } from '../lib/text';
  import { Video } from '../Video';

  export function CoverLive() {
    return (
      <AbsoluteFill>
        <Freeze frame={90}><Video cut="reel" /></Freeze>
        <div style={{ position: 'absolute', top: 380, width: '100%', textAlign: 'center' }}>
          <KineticTitle text="Your team’s | notes, *found.*" start={-1} size={118} />
        </div>
      </AbsoluteFill>
    );
  }
  ```

  ```bash
  npx remotion still src/index.ts cover-live out/cover-live.png   # frame 0 of the composition; the Freeze inside shows frame 90
  node scripts/stills.mjs cover-live                              # the same through the one-bundle script (an id that isn't a cut gets one still, at frame 0)
  ```

  The composition's size and fps must match the cut's format, because `Video` lays the cut out from them. For a plain frame of a cut, skip the wrapper: `npx remotion still src/index.ts reel out/frame.png --frame 90` renders the cut's own frame 90. Keep `<Still>` for designs that never read the clock.

### 34. The disk fills up with remotion-webpack-bundle folders

- **Symptom:** free space on the system drive falls by gigabytes over a day of iterating, then a render or `npm install` fails with `ENOSPC`. The system temp folder (`%TEMP%` on Windows, usually `C:\Users\<you>\AppData\Local\Temp`; `$TMPDIR` or `/tmp` on macOS and Linux) holds hundreds of `remotion-webpack-bundle-<random>` folders of about 50 MB each. One session of stills runs left about 450 of them, 20 GB.
- **Cause:** `bundle()` from `@remotion/bundler`, called without an `outDir`, bundles into a fresh temp folder every time and never deletes it. The Remotion CLI (`remotion render`, `remotion still`) cleans up its own bundle when it finishes, but a script that calls `bundle()` itself does not, and a stills script runs dozens of times while you iterate. A render killed halfway can leave one behind too.
- **Fix:** the template's `scripts/stills.mjs` bundles into `out/.bundle`, which it clears and reuses, so it holds one bundle at most. Any script of your own that calls `bundle()` should do the same: pass `outDir` to a fixed folder in `out/` (clear it first), or remove the folder in a `finally`. Then clean up what is already there, with no render or stills run going:

  ```bash
  # macOS, Linux, Git Bash: see what's there, then remove it
  du -sch "${TMPDIR:-/tmp}"/remotion-webpack-bundle-* 2>/dev/null | tail -1
  rm -rf "${TMPDIR:-/tmp}"/remotion-webpack-bundle-*
  ```

  ```powershell
  # PowerShell
  Get-ChildItem $env:TEMP -Directory -Filter 'remotion-webpack-bundle-*' | Measure-Object | Select-Object Count
  Get-ChildItem $env:TEMP -Directory -Filter 'remotion-webpack-bundle-*' | Remove-Item -Recurse -Force
  ```

  Git Bash mounts `/tmp` on the Windows temp folder, so the bash lines work there too. Another agent, Studio or a render may be bundling on the same machine: delete only folders older than your own session (`find "${TMPDIR:-/tmp}" -maxdepth 1 -name 'remotion-webpack-bundle-*' -mmin +60` in bash, or filter on `LastWriteTime` in PowerShell).

## Sources

- Remotion license (free for individuals, for-profits up to 3 employees, non-profits and evaluation; company license otherwise): https://github.com/remotion-dev/remotion/blob/main/LICENSE.md
- Remotion, flickering (render tabs don't share state; use `<Img>`, `<OffthreadVideo>`; avoid `background-image` and `mask-image`; no CSS animations): https://www.remotion.dev/docs/flickering
- Remotion, delayRender timeouts (30 s default, `--timeout`, concurrency as a cause): https://www.remotion.dev/docs/timeout
- GitHub, large files (warning above 50 MiB, block above 100 MiB): https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
- Verified against Remotion 4.0.529's installed source: default concurrency `Math.round(Math.min(8, Math.max(1, cpus / 2)))` (`@remotion/renderer/dist/get-concurrency.js`); the delayRender message and its 2 s margin (`remotion/dist/cjs/delay-render.js`); `staticFile()` errors (`remotion/dist/cjs/static-file.js`); `fade()` leaving the exiting scene opaque unless `shouldFadeOutExitingScene` (`@remotion/transitions/dist/presentations/fade.js`); the TransitionSeries duration error (`@remotion/transitions/dist/TransitionSeries.js`); the bundled ffmpeg's filter, encoder and demuxer lists (`npx remotion ffmpeg -filters` and `-version`).
