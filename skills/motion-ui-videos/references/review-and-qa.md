# Review and QA: look before you trust

You cannot watch the video or hear it. Everything you believe about it has to come from something you looked at or measured: a scene table the user approved, stills tiled into a contact sheet, loudness numbers per stretch, a spectrogram, and `ffprobe` output of the final file. This reference is the loop that makes that work. Show the work in cheap stages (table, then stills, then a draft render). Check every sheet against the same list. Test motion with strips of stills. Measure sound instead of guessing. Verify the encoded file, not just the source. Translate the user's words into specific edits, change one thing at a time, and report in plain words with numbers. Commands run from the project's `video/` folder. Each tool prints its usage in its header comment; the arguments below follow those.

## Contents

1. [The rule: nothing is done until you have looked](#1-the-rule-nothing-is-done-until-you-have-looked)
2. [Show work early: table, stills, draft, final](#2-show-work-early-table-stills-draft-final)
3. [Stills: which moments to render](#3-stills-which-moments-to-render)
4. [Contact sheets, with gaps](#4-contact-sheets-with-gaps)
5. [What to check in every sheet](#5-what-to-check-in-every-sheet)
6. [Checking motion without watching it](#6-checking-motion-without-watching-it)
7. [Per-format checklists](#7-per-format-checklists)
8. [Audio QA](#8-audio-qa)
9. [Final-file QA](#9-final-file-qa)
10. [Feedback to fix: picture](#10-feedback-to-fix-picture)
11. [Feedback to fix: sound](#11-feedback-to-fix-sound)
12. [Iteration discipline](#12-iteration-discipline)
13. [Reporting changes](#13-reporting-changes)

## 1. The rule: nothing is done until you have looked

Code that typechecks can still clip a caption, render in a fallback font, or park the URL under Instagram's buttons. A time you worked out in your head can be off by a crossfade. So never tell the user something is "fixed" or "done" until you have seen it in a still or measured it with a tool after the change.

Split the work with the user. They judge taste: pacing, feel, whether the whoosh is too much. You judge correctness: clipping, overlap, safe zones, fonts, sync, loudness, file specs. Don't ask the user to hunt for clipped words. Find those yourself and bring them decisions.

Checks, cheapest first. Run the cheap ones on every change and the expensive ones only when the cheap ones pass:

| step | command | cost | catches |
|---|---|---|---|
| 1 | `npm run typecheck` | seconds | broken props, wrong API names |
| 2 | `node scripts/stills.mjs <cut> --marks` + `node scripts/sheet.mjs <cut>` | about a minute (one bundle) | layout, clipping, fonts, safe zones |
| 3 | `node sound/design.mjs <cut>` + `sound/tools/loudness.mjs` | seconds | levels, peaks, missing cues |
| 4 | draft render at half scale | minutes | pacing, for the user to watch |
| 5 | `npm run render:<cut>` + `node scripts/check.mjs` + stills from the encoded file | minutes | the file that actually ships |

Render one thing at a time. Two renders, or a render next to a stills bundle, can run a 16 GB machine out of memory (see [pitfalls](pitfalls.md) §20).

## 2. Show work early: table, stills, draft, final

Each checkpoint goes to the user before you move on. A change at the table costs seconds, a change after stills costs a minute, and a change after a full render costs minutes plus the user's attention. The real launch film this skill came from was 37 s on its first cut, and only very technical viewers understood it. That was a story problem. A table review would have caught it before a single pixel was drawn.

### Checkpoint 1: the scene table (before any scene code)

Write the cut as a table in chat and get a yes:

| # | scene | time (s) | what the viewer sees | caption (exact words) | hold needed | marks | sound |
|---|---|---|---|---|---|---|---|
| 1 | hook | 0.0–3.5 | the title slams in over the empty app | "your team's notes, in one place." | 6 words: 3.0 s | title 0.1 | thump on title |
| 2 | demo | 3.2–12.2 | cursor opens the palette, types "q3 plan" | "press ⌘K and just type." | 5 words: 2.7 s | click 2.1, typeStart 2.6, done 6.8 | click, keys, chime on done |

- **Hold needed**: a sentence gets (words ÷ 3) + 1 s; a punch chunk or short label (1–4 words) gets max(0.5 s, words ÷ 3). Every caption gets at least that before the next one arrives, and the picture finishes its move before the next sentence starts. This rule came from re-pacing that launch film from 37 s to about 62 s. At one plain sentence per beat, it finally worked.
- Scene times overlap by the crossfade (`cross` in `cuts.json`). The total is `cutDuration(cut)`, not the sum of the scenes.

Before showing the table, check it yourself:

- Every beat is one plain sentence. Jargon is replaced by its consequence ("merge conflict" becomes "their changes crash into each other").
- There is a section that shows how the product works, not just "we solve it".
- The framing matches the real audience. A team product shows more than one person, for example "alice's agent" rather than "alice".
- The length suits the format ([formats](formats.md)). Leave room for the how.

Ask at most three questions with it: who is it for, what is the one thing they should remember, and what should they do at the end (URL or CTA).

### Checkpoint 2: a contact sheet of stills

Once the scenes are built, and before any full render, make a sheet (sections 3–5) and show it to the user. They can see images even though you cannot watch video. Number the tiles in your message ("tile 7, 12.4 s: the share dialog") so they can answer with a tile number instead of describing a frame.

### Checkpoint 3: a draft, then the final

Draft renders exist so the user can judge pacing. Make them cheap:

```bash
node sound/design.mjs showcase
npx remotion render src/index.ts showcase out/draft-showcase.mp4 --scale=0.5 --crf 28
```

H.264 needs even dimensions. The App Store format is 886 wide, and half of that is 443, which is odd, so render its drafts at full size. When you share a draft, list two or three timestamps to watch and what to judge at each ("0:11–0:15: is the caption on screen long enough?"). If the user wants to scrub motion themselves between renders, suggest `npm run studio`.

The final is always the npm script (`npm run render:showcase`, `npm run render:reel`…). It runs `sound/design.mjs` first, so picture and sound come from the same `cuts.json`. Then do section 9.

## 3. Stills: which moments to render

```bash
node scripts/stills.mjs reel --marks            # a still at every mark in cuts.json
node scripts/stills.mjs reel --at 0.4,2.1,5.75  # stills at seconds in the cut
node scripts/stills.mjs reel --marks --safe     # same, with the SafeZones overlay drawn
node scripts/sheet.mjs reel                     # → out/sheet-reel.png, plus pages of 12 (-p1, -p2…) past 12 stills
```

Through npm, pass flags after `--`: `npm run stills -- reel --marks`. The script bundles once and renders every still from that bundle. That is why it exists: each separate `npx remotion still` call bundles again (pitfalls, section 21).

Marks are when things start. The frames that fail are usually just after a start: when a caption has finished arriving, when the camera is at its tightest, or halfway through a crossfade. Add those with `--at`:

| moment | time to sample | why |
|---|---|---|
| a calm caption fully arrived | cue + about 0.8 s + 0.07 s per word | the longest line at full width, where wraps and clipping show |
| a punch caption group landed | cue + about 0.3 s | the biggest scale, just after the pop |
| the camera at its tightest | the `Camera` key with the largest `scale`, plus its ease | overflow at the edges |
| the middle of a crossfade | `sceneStart(cut, scene) + cross / 2` | text from two scenes on top of each other |
| frame 0 | 0 | a reel's hook, and what many players show before playback starts |
| the end card settled | end − 0.5 s | URL legible and inside the safe zone |
| the heaviest UI state | e.g. a dialog open over the list | overlap, contrast |
| a loop's wrap | 0, 1/fps and duration − 1/fps | the seam (section 5, item 7) |
| an App Store preview's poster | 5.0 s | Apple's default poster frame |

Compute absolute times from marks with `sound/timeline.mjs`, which uses the same math as the picture. Guessing them by hand misses the crossfade overlaps. Put the helper in a scratch file under `out/` (gitignored). Quoting a multi-line `node -e` differs between bash and PowerShell, and a file works in both:

```js
// out/times.mjs  →  node out/times.mjs   (scene ids from the template's reel; use your cut's)
import { at, sceneStart, loadCuts } from '../sound/timeline.mjs';
const cut = 'reel';
const cross = loadCuts()[cut].cross;
const times = [
  at(cut, 'reelHook', 'title') + 0.3,           // the hook title landed
  sceneStart(cut, 'reelProblem') + cross / 2,   // middle of the hook→problem crossfade
  at(cut, 'reelLive', 'check') + 0.9,           // the checkbox ticked and settled
];
console.log(times.map((t) => t.toFixed(2)).join(','));   // paste into --at
```

To see detail, crop a still at full resolution instead of squinting at a tile. Remotion's ffmpeg has `crop` and `scale`, though not `tile` or `pad` (pitfalls, section 22):

```bash
npx remotion ffmpeg -y -i <still>.png -vf crop=960:540:480:0 out/zoom.png   # crop=w:h:x:y
```

## 4. Contact sheets, with gaps

`scripts/sheet.mjs` tiles stills into one image with a gap between tiles. The gap is not decoration. When tiles touch, the eye reads across the seam, and so do you. The end of one frame's caption runs into the next frame's caption and makes a sentence that isn't in the video. A word clipped at the right edge looks whole because the next tile continues on the same dark background. A panel cut off at the frame edge looks like it carries on. This happened on the real project: touching tiles merged text across frames and hid a clipped caption. A gap in a color the film never uses (mid-gray or white on a dark film) shows exactly where each frame ends, and frame edges are where clipping happens.

Size the sheet for the thing you are checking:

- Keep the smallest text you are checking at about 12 px or more in the sheet. The tile scale is tile width ÷ frame width. A 60 px caption in a 1920-wide frame shown in a 640 px tile is 20 px, which is fine. Four 270 px columns of a 1080-wide reel turn a 64 px caption into 16 px (fine) and 28 px UI text into 7 px (unreadable), so crop for UI detail instead.
- Big images are scaled down before you see them. A sheet much wider than about 1,600 px may reach you shrunk. Prefer more rows to more columns, split into two sheets, or crop.
- Use 8 to 16 tiles per sheet. Beyond that, nothing in it is readable. `scripts/sheet.mjs` defaults to 4 columns of 270 px for portrait stills and 3 of 480 for landscape, 12 tiles a page, so a page stays under 1,600 px wide (1,190 and 1,532 px) and reaches you unshrunk; `--cols`, `--tile` and `--per` change that. With more than 12 stills it also writes pages (`out/sheet-<cut>-p1.png`, `-p2`…): read the pages one at a time, not the full sheet. `--safe` tiles the safe-zone set instead (`out/sheet-<cut>-safe-p1.png`…).
- Keep tiles in time order and say their times in your message. If you shuffle, you will misattribute a problem.
- Name each version you show (`out/sheet-reel-v3.png`) so "v2 was better" is a lookup (section 12).

Look at the sheet with your image-reading tool every time you make one. A sheet you generated but did not open checks nothing.

## 5. What to check in every sheet

Go through the list in order and write down every failure with its tile number before you fix anything. Fixing as you go makes you stop looking after the first problem.

1. **Clipping.** Text or UI cut by the frame edge or by its own container: descenders cut by `overflow: hidden`, a word wrapped onto a third line that falls outside its panel, a `Callout` label running off the frame, `Typed` text wrapping mid-word as it grows. Check the longest caption, not the first one.
2. **Overlap.** A caption over the UI it describes, a `Toast` over captions, a `Callout` over the `Cursor` label, presence avatars over a button the cursor is about to click. Two things fighting for the same pixels means the viewer reads neither.
3. **Camera overflow.** A framing that centers (x, y) at scale s shows a window of the stage W/s × H/s. At 1.3× on a 1920×1080 stage, that is about 1477×831. Anything the caption talks about must sit inside that window. Nothing outside the product layer may show: no bare corners, no end of the backdrop. Keep captions outside `Camera` so push-ins never scale them off the frame.
4. **Readability when a caption has arrived.** Sample at arrival, not at the cue (section 3). Is the text over a busy part of the UI? Give it a quiet area or a scrim. Is it big enough? A 1080-wide vertical frame plays on a phone roughly 375–430 points wide, which is about 2.5–2.9 px of frame per point. So 32 px in the frame is about 11–13 pt on the phone, around Apple's 11 pt minimum: the floor for anything the viewer must read (24 px on a 1920-wide frame). Captions should be far bigger ([captions-and-type](captions-and-type.md) §2–3).
5. **Fonts loaded.** Signs of a fallback font: lines wrap differently from what you expect, the mono text looks like Courier, `a` or `g` has the wrong shape for the brand face, or every weight looks the same (a synthesized bold looks smeared). A fallback never raises an error, so you have to look. Fixes are in pitfalls, sections 6 and 7.
6. **Safe zones.** Run `--safe` stills and check that nothing a viewer must read or tap sits under the overlay. For the reel (top 250, right 150, bottom 450, left 64), the usable box is 866×1220 px starting at (64, 250). For the story (250, 64, 380, 64), it is 952×1290 at (64, 250). Backgrounds and UI chrome may run under the overlay. Words, faces, URLs and the CTA may not.
7. **Loop seam.** If the loop rests at its seam (the template's does: the app sits still for its first and last half second), the first and last frames are identical and that is right. If something moves across the seam, the last frame must be one step before the first, not a copy of it: a copy shows as a one-frame stall at every wrap. Render stills at 0, 1/fps and duration − 1/fps. The jump from the last frame to 0 should look like the jump from 0 to 1/fps. Also check the code: every periodic motion uses `loopT(t, period)` with duration ÷ period a whole number.
8. **Brand accuracy.** The product name is spelled and cased exactly as the brand writes it. The URL is correct and live (open it). Colours come from `theme.ts` and match the brand's hex values. The logo is the official vector, not a soft raster. No third-party logo or "supported by" line appears unless that organization agreed, in their own words. A logo implies endorsement: on the real project, the founder wanted a big company's "supported by" logo after one friendly call with their startup team. Without formal support there is no logo.
9. **Crossfades.** With `fade()`, the outgoing scene stays fully opaque while the incoming one fades in on top. If the incoming scene has no opaque `Backdrop`, the old scene's text shows through and then vanishes when the transition ends (pitfalls, section 13). Also check that no mark sits inside the first `cross` seconds of a scene, where it would be half-transparent.
10. **Dead frames.** Blank or near-black frames at scene starts, which happen when an enter animation from opacity 0 stacks on a crossfade. Also a reel whose first frame is empty. The hook should be visible at frame 0.
11. **Consistency.** The same cursor size, corner radii, type scale and colors in every scene. The same person keeps the same avatar color. UI in the reel matches UI in the showcase.
12. **Honesty.** Every number on screen is true. A waitlist counter with a hidden offset is fake proof: show the real number or none. No feature appears that the product doesn't have.

## 6. Checking motion without watching it

Every frame is a pure function of time, so you can sample motion at any spacing you like.

**Motion strips.** Render 6 to 8 stills across one move at even steps and put them in one row of a sheet. For example, a 0.6 s slide from 3.2 s at 0.1 s steps is `--at 3.2,3.3,3.4,3.5,3.6,3.7,3.8`. The spacing between positions shows the easing:

| what the strip shows | what it means |
|---|---|
| big gaps early, tight gaps at the end | `EASE`, fast out with a long settle. What you want. |
| even gaps all the way | linear. Reads as mechanical for UI; fine for a camera drift. |
| one tile past the final position, then back | one overshoot. The limit (`pop(t, start, { bouncy: true })`). |
| past, back, past again | a wobble. Too many; use `pop` or `prog`. |
| a sudden large gap at one step | a jump. Usually a missing ease, or a value that switches instead of interpolating. |
| two identical tiles in the middle of a move | a duplicated frame, often timing written in frames for another fps |

**One thing at a time.** In a showcase, look at any strip covering 0.5 s and count the major elements whose position changed. More than one is busy. Small secondary motion, like a caret blink or a presence dot, doesn't count.

**Readable while moving?** If text moves more than its own line height between two frames, nobody reads it mid-move. Let it land, then hold it.

**Ambient motion under a warp.** Make a strip at even steps across a stretch with a steep warp. Breathing, idle bobs and pulses should change by about the same amount per step. If they jump in some steps and freeze in others, they are running on warped time. Fix it with `useDrawnTime()` (pitfalls, section 5).

**Caption holds.** Check the hold rule with numbers, on screen time. Under a warp, a cue timed on scene seconds is squeezed by the warp's slope: a 3 s hold under a 1.6× stretch is about 1.9 s on screen. Use the reel's own `drawn` cues or check with `unwarp`:

```js
// out/holds.mjs  →  node out/holds.mjs
// the template's reel plays the showcase's reveal through a warp; its promise line is timed on scene seconds
import { unwarp, loadCuts } from '../sound/timeline.mjs';
const cut = loadCuts().reel;
const scene = cut.scenes.find((s) => s.id === 'reveal');
// cue times written on scene time (not `drawn`) → seconds on screen
const onScreen = (sec) => (scene.warp ? unwarp(scene.warp, sec) : sec);
const cues = [   // copy from the scene file (here: the Words line at the `promise` mark)
  { at: scene.marks.promise, text: 'One calm place for your team’s notes.' },
];
// the last caption holds until the next scene starts fading in over it
const sceneEnd = scene.seconds - cut.cross;
cues.forEach((c, i) => {
  const next = cues[i + 1] ? onScreen(cues[i + 1].at) : sceneEnd;
  const have = next - onScreen(c.at);
  const need = c.text.split(/\s+/).filter(Boolean).length / 3 + 1;
  console.log(`${have >= need ? 'ok   ' : 'SHORT'} ${have.toFixed(1)} of ${need.toFixed(1)} s  "${c.text}"`);
});
```

For cues marked `drawn`, skip `onScreen`: their times are already seconds on screen. On the template's reel this reports the promise line as ok (3.4 of the 3.3 s it needs). It used to report SHORT (about 2 s): the warp squeezed the reveal's pauses, and the words with them. The fix there was the reel's own marks for the reveal, so the promise starts 0.63 s in, and a warp that plays the hold under it near 1:1. The other fix is a reused scene's own, shorter words in the reel.

## 7. Per-format checklists

Run the section 5 list on every format, then the extra items for that format. Numbers come from `FORMATS` in `src/formats.ts`. [delivery-and-platforms](delivery-and-platforms.md) is the authority if they change.

### Reel (1080×1920, 30 fps)

- [ ] Frame 0 already shows the hook (a `KineticTitle`, not a fade up from black), and it can be read by 0.5 s.
- [ ] Something changes about every 2 s: a cut, a camera move, a new caption group or a UI state. Check with a sheet at 2 s steps (`--at 0,2,4,6,…`).
- [ ] One section shows how the product works. When cutting for length, drop the feature list, never the how. A reel that states the problem and then just says "we solve it" explains nothing.
- [ ] Each punch cue is on screen at least max(0.5 s, words ÷ 3), and each full sentence (the end card, a long toast) (words ÷ 3) + 1 s, on drawn time ([captions-and-type](captions-and-type.md) §8). In the real project, a 29 s reel was "too fast" and a 37 s cut that kept the how-it-works section worked.
- [ ] Nothing important outside the 866×1220 box at (64, 250) (`--safe` stills).
- [ ] `Grain` is off. Feed compression smears it.
- [ ] The end card's URL and CTA are held for at least (words ÷ 3) + 1 s and sit inside the safe box.
- [ ] Sound: about −14 LUFS integrated, true peak at or below −1 dBTP, and the hook is not the quietest stretch.
- [ ] If the user's upload tool caps file size (about 10 MB was seen for Instagram tools), make a size-capped copy (`node scripts/encode.mjs instagram out/reel.mp4 --max-mb 9`) and check text sharpness on stills taken from that copy (section 9).
- [ ] The cover is its own still (below).

### Showcase (1920×1080, 60 fps)

- [ ] `Captions` with `variant: 'calm'`: one sentence at a time, each held by the rule, and the picture finishes its move before the next sentence arrives.
- [ ] One thing moves at a time, everything eases (`EASE`), and there is at most one bounce per scene.
- [ ] At every push-in, the thing in the middle of the frame is the thing the caption is talking about.
- [ ] Margins of 54 px top and bottom and 96 px at the sides stay clear of text.
- [ ] `Grain` is on and subtle (the player draws it at 0.05 opacity). If you can see it in a one-third-scale sheet tile, it is too strong.
- [ ] Strips across the fastest move show a smooth ease with no duplicated frames. 60 fps exposes timing written for 30.
- [ ] Sound: about −17 LUFS integrated (−16 to −18), true peak at or below −1 dBTP.

### Loop (1600×1000, 60 fps, muted)

- [ ] It wraps without a seam (section 5, item 7). Periods divide the duration exactly.
- [ ] No caption starts or ends across the wrap.
- [ ] It works at the size the page will show it. If the landing page shows it 800 px wide, check a sheet with 800 px tiles.
- [ ] Rendered `--muted` (`npm run render:loop`). Grain is on by default for landscape formats, but the template's `loop` cut turns it off (`"grain": false` in `cuts.json`); keep it off: noise is the most expensive thing to encode, and a loop has to stay small. The web MP4 and the poster come from the lines in [formats](formats.md) §6, the WebM and GIF from `scripts/encode.mjs`.

### Story (1080×1920)

- [ ] The top 250 px and bottom 380 px are clear of anything to read or tap.
- [ ] There is an empty spot where the link sticker will go, and the video points at it ("tap the link ↓"). Check that the spot is still empty in every tile after the CTA appears.
- [ ] The CTA is on screen early (by about 3 s of an 8 s story) and holds to the end.
- [ ] No fake counts and no invented social proof.

### App Store preview (886×1920, if the project adds an `appstore` cut)

Apple's published rules, not house style (see Sources):

- [ ] 15–30 s long, at most 30 fps, at most 500 MB. H.264 at a target of 10–12 Mbps, with stereo AAC at 256 kbps and 44.1 or 48 kHz.
- [ ] Only content from inside the app: the picture is a real screen capture of the shipping app (App Review Guideline 2.3.4, see [delivery-and-platforms](delivery-and-platforms.md) §9), with captions and highlights on top. Don't use a `Phone` frame, hands, or a `Cursor` (a pointer is not app content). Let the UI's own pressed and selected states show the taps.
- [ ] It plays muted by default, so on-screen text carries the story, stays legible and stays up long enough to read.
- [ ] No prices and no dates or seasonal references.
- [ ] The frame at 5.0 s (the default poster frame) is strong and readable. Render a still there.
- [ ] A stereo audio track is present even if it is silent (render with sound, or add `--enforce-audio-track`).

### Stills: cover, thumbnail, banner

- [ ] **Reel cover** (1080×1920): everything important sits inside the centered 1080×1440 (y 240–1680), because that is what the profile grid shows. Check it the way the grid shows it, cropped and small:
  ```bash
  npx remotion still src/index.ts cover out/cover.png
  npx remotion ffmpeg -y -i out/cover.png -vf "crop=1080:1440:0:240,scale=360:-1" out/cover-grid.png
  ```
- [ ] **Thumbnail** (the 1280×720 still, rendered with `--scale 3` for YouTube's 3840×2160): view it at 320 px wide (`-vf scale=320:-1`). If the words don't read there, there are too many or they are too small. Keep the bottom-right corner free, because players put the duration badge there.
- [ ] **LinkedIn company cover**: 2256×382 (2× the 1128×191 it displays at, above LinkedIn's 1512×256 minimum). Keep the bottom-left clear, because the page logo overlaps it.

## 8. Audio QA

You can't hear. Measure, look at spectrograms, and let the user be the ears. The mix itself is covered in [sound-design](sound-design.md). This section is about checking it.

### Loudness per stretch

```bash
node sound/design.mjs reel     # the whole cut's loudness and true peak, then every scene's mean and loudest 400 ms
node sound/tools/loudness.mjs public/sound-reel.wav --from 6.4 --to 10.2    # any other stretch, one per run
```

The design report already measures each scene between its real start and end (crossfades included). For other stretches, take the times from `node sound/timeline.mjs reel` rather than round numbers, so each number describes one moment.

| cut | integrated | true peak |
|---|---|---|
| reel, story, other social | about −14 LUFS | at or below −1 dBTP |
| showcase, launch film | about −17 LUFS (−16 to −18) | at or below −1 dBTP |
| loop | muted | none |

What to look for:

- **Lurches.** A short-term jump of more than about 6 dB between neighboring stretches is felt as a lurch. Make sure it is intended (a drop, a hit) and not an accident.
- **A weak open.** In a reel, the hook stretch should not be the quietest.
- **Headroom on the final file.** AAC encoding pushes peaks up a little, which is why `design.mjs` masters the WAV to −2 dBTP: the delivered file then stays at or below −1. Check the true peak again on the encoded file (section 9).

### Layer solos

Balance by measuring each layer alone. `ONLY` renders some layers through the same master, at the same fixed gain, into a file of their own, and leaves the full mix alone:

```bash
ONLY=sfx    node sound/design.mjs reel     # → public/sound-reel-sfx.wav
ONLY=whoosh node sound/design.mjs reel     # → public/sound-reel-whoosh.wav
ONLY=pad    node sound/design.mjs reel     # → public/sound-reel-pad.wav
node sound/tools/loudness.mjs public/sound-reel-sfx.wav public/sound-reel-whoosh.wav public/sound-reel-pad.wav --from 2.0 --to 2.6
```

Every full render also prints each layer's loudest 400 ms and whether the whooshes sit at least 3 dB under the UI sounds, so a solo is for the stretch-by-stretch question.

In PowerShell, set and clear the variable explicitly, because it stays set for the whole session: `$env:ONLY='sfx'; node sound/design.mjs reel; Remove-Item Env:ONLY`.

- **Whooshes under clicks and keys.** In stretches where both play, the whoosh layer should measure a few dB below the sfx layer, both momentary max and true peak. Whooshes carry moves; clicks carry meaning.
- **The pad is a bed.** If the full mix's integrated loudness changes by more than about 1 dB with the pad muted, the pad is doing more than a bed should.
- **The master gain is fixed.** Turning one sound down should never turn the rest up. If a level change moves everything else, something is normalizing after the mix.

### Sync

Picture and sound share marks, so sync is correct by construction. Check the construction, not your ears:

- Every cue in `sound/score.mjs` is placed through its scene: `s.t(mark)` or `s.t(sceneSeconds)` in a cue sheet, `at(scene, mark)` or `at(scene, seconds)` in a cut's case, never an absolute number. A quick scan for hard-coded times: `grep -nE "(place|placePeak)\(mix, [^,]+, [0-9.]+|k\.[a-z]+\([0-9.]+|s\.t\([0-9.]+\)" sound/score.mjs` (the template's own score prints nothing).
- Footsteps, keys and hits come from the same event times as the picture. Keys, for example, land on `typedTimes(text, start, cps)`, the times the `Typed` that draws them uses, when the text is listed in `TYPED` in `sound/score.mjs`. `node sound/design.mjs reel --cues` prints every placed sound by time to compare with the marks.
- The WAV is fresh. If you edited `cuts.json` or a mark and did not rerun `sound/design.mjs`, the sound is off by exactly the change (pitfalls, section 27).
- Reference files are read through the engine's `readAudio()`, which resamples them to 48 kHz (pitfalls, section 25).

To read an event's time from the audio itself, make a spectrogram of a short slice around it. Clicks show as thin vertical lines you can read against the time axis:

```bash
node sound/tools/spectrogram.mjs public/sound-reel.wav out/spec-demo.png --from 6 --to 8
```

### Spectrograms

Put your placed sound and the reference or earlier version in one image, and compare shapes instead of guessing:

```bash
node sound/tools/spectrogram.mjs out/sound-reel-v3.wav public/sound-reel.wav out/spec-ab.png --from 2 --to 4
```

| you see | it means | do |
|---|---|---|
| a bright haze above about 8 kHz over long stretches | hiss, the "white-noisy" feel | pink noise, keep the whoosh band under about 2.4 kHz (`whoosh({ f1: 2400 })`), shorter tails |
| identical blobs repeating | one sample reused, which sounds like a machine | a grown variant per use (`sound/tools/grow.mjs`) |
| a thick band below about 40 Hz | rumble that eats headroom and is inaudible on phones | keep the master's high-pass (`hp` 30, or 40 on phone formats, in `design.mjs`), shorten `thump` |
| long smears after every event | the room is washing everything | lower the `room` send (0.12 → 0.05) |
| fat columns where clicks should be thin | dull clicks, or the same cue placed twice | look for double placement |
| event lines away from where the marks say | a sync bug | check that `at()` was used |
| a steady tone that wobbles or crackles | an unstable "electronic" sound | `tone({ notes, dur, beat: true })`: two notes a semitone apart, beating evenly |

### Reference audio from the user

When the user sends sounds they like (keep them in `sound/refs/`, which is gitignored), describe each one back before using it:

```bash
node sound/tools/analyze.mjs sound/refs/whoosh-soft.wav
```

Turn the numbers into plain words ("a 1.2 s airy sweep, loudest at 0.4 s, mostly between 300 Hz and 2 kHz, wide stereo") and confirm that this is what they like about it. Then cast it to moments by character. When you A/B, level-match the new sound to what was there (same momentary max), because a louder version tends to win for the wrong reason. The full method is in [audio-references](audio-references.md).

## 9. Final-file QA

```bash
npm run render:reel
node scripts/check.mjs out/reel.mp4
```

Compare what `check.mjs` reports with what it should be:

| check | expected |
|---|---|
| duration | `cutDuration('reel')`, give or take one frame |
| fps | `FORMATS[format].fps` (30 for reel and story, 60 for showcase and loop) |
| width × height | from `FORMATS` |
| audio | a stream is present, integrated loudness is near the target, true peak is at or below −1 dBTP. About −70 LUFS or "-inf" means the render is silent (pitfalls, section 26). |
| file size | under the platform or upload-tool cap |

Get the expected duration from the same math the picture uses:

```bash
node --input-type=module -e "import { cutDuration } from './sound/timeline.mjs'; console.log(cutDuration('reel').toFixed(3))"
```

**Stills from the encoded file.** A size-capped copy can smear text, band dark gradients into steps, and turn grain into blocks. The source stills never show this. After `scripts/encode.mjs` writes a platform copy, pull frames from that file at the same times as some lossless stills and compare text edges and gradients:

```bash
npx remotion ffmpeg -y -ss 12.5 -i out/<encoded>.mp4 -frames:v 1 out/enc-12.5.png
node scripts/stills.mjs reel --at 12.5
```

If text is soft or dark gradients band, give the copy more bitrate, simplify the gradient, or remove grain from that copy.

**Unexpected silence.** The bundled ffmpeg has `silencedetect`. Any gap it finds that you didn't design is a missing cue or a missing file. `-vn` is required, because this ffmpeg build cannot send video to the null output:

```bash
npx remotion ffmpeg -hide_banner -i out/reel.mp4 -vn -af silencedetect=n=-50dB:d=1.5 -f null -
```

## 10. Feedback to fix: picture

Users describe how the video feels, not what to change. Translate, make the smallest change that could fix it, and check it with the tool in the last column.

| the user says | usually means | first fix | check with |
|---|---|---|---|
| "too fast", "I can't read it" | captions held too briefly, or the next move starts before the sentence lands | hold each caption to the floor for its kind (a sentence (words ÷ 3) + 1 s, a punch chunk max(0.5 s, words ÷ 3)); lengthen that scene's `seconds`; flatten the warp there | the holds script, a sheet at arrival times |
| "too slow", "boring" | pauses with nothing changing | squeeze holds with warp knots (squeeze pauses, not moves); in reels, change something about every 2 s; cut the least essential section | a sheet at 2 s steps |
| "I don't get it", "only engineers will get this" | jargon, or no section that shows how | one plain sentence per beat; jargon becomes its consequence; add or restore the how | the scene table, re-read aloud |
| "looks cheap", "janky" | too much bounce, everything moving at once, mixed easings | at most one overshoot (`pop`); one thing moves at a time; `EASE` everywhere; align to a grid | motion strips |
| "looks like a template", "looks AI-made" | blur on every entrance, words lit one by one with no voice, a dissolve on every join, the same push every time | whole-line captions and static punch chunks ([captions-and-type](captions-and-type.md) §10), cuts on action and layout morphs ([motion-language](motion-language.md) §11), pushes that vary ([motion-language](motion-language.md) §9) | a sheet at arrival times, a strip across each join |
| "too busy", "where do I look?" | several focal points | `Focus` on the subject; fewer elements; one bigger element instead of three small ones | a sheet, one tile per beat |
| "feels flat", "static" | nothing leads the eye | a `Camera` push-in on what the caption names (about 1.0 → 1.15 over about 1.2 s), cursor-led moves | a still at the tightest key |
| "the zoom makes me dizzy" | fast or stacked camera moves | fewer keys, longer eases, scale capped around 1.3 | strips across the move |
| "text is too small" | sized for a monitor, not a phone | bigger type, fewer words; in vertical, stack panels instead of shrinking them | the 32 px floor (section 5) |
| "it looks like a single-user app" | the framing shows one person | presence avatars, several named cursors, labels like "alice's agent" | a sheet of the product scenes |
| "the logo looks off" | a raster, a wrong crop, or the wrong visual weight | the official vector, viewBox cropped to the artwork, sized by visual weight | a crop at full size |
| "the first second is weak" (reel) | a fade-in or an empty frame 0 | `KineticTitle` at t = 0, the hook statement on frame 0 | a still at 0 |
| "the ending is abrupt" | the end card isn't held | hold the `EndCard` for (words ÷ 3) + 1 s or more; let the sound tail out | a still at end − 0.5 s |
| "something flickers" | nondeterminism or an unawaited asset | pitfalls, sections 1, 2 and 9 | stills at neighboring frames |

## 11. Feedback to fix: sound

Every sound complaint, with its usual cause, its first fix and the numbers to report, lives in one table: [sound-design](sound-design.md) §11. Solo layers to find the source, change one thing, and report those numbers with the change (section 13).

## 12. Iteration discipline

- **Change one thing per round when the user is judging taste.** With two changes and one "better" or "worse", you can't tell which change they meant. Batch only mechanical fixes (a clipped word, a typo, a wrong URL), because those aren't taste.
- **"The before version was better" means revert first.** Restore the exact previous version, render it, and confirm it is the one they liked. Only then try a smaller step in a different direction. Don't argue with numbers: numbers explain, and the user decides.
- **Keep every version you showed.** Copy each output to a numbered name (`out/reel-v3.mp4`, `out/sheet-reel-v3.png`, `out/sound-reel-v3.wav`), so "go back to v2" is a copy and not a reconstruction. If the project uses git, ask whether to commit approved versions.
- **Step sizes that are audible and visible.** For sound, move in 2–3 dB steps: 1 dB is hard to hear and 6 dB is a different mix. For holds, move in 0.2–0.5 s steps. For motion durations, change about 20% at a time.
- **Sound-only change? Don't re-render the picture.** Mux the new WAV onto the existing video, then run `check.mjs` on the result:
  ```bash
  node sound/design.mjs reel
  npx remotion ffmpeg -y -i out/reel.mp4 -i public/sound-reel.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest out/reel-v4.mp4
  ```
- **Save the user's taste to memory.** When the user states a preference that will matter next time ("no bounces", "subtle MacBook keys", "whooshes darker", "lowercase captions", "never show that partner's logo"), write it down with its context in the project's `CLAUDE.md` or your memory file. The next video starts from it.
- **Stop at approval.** Don't polish past a yes with changes nobody asked for. Offer them as options instead.

## 13. Reporting changes

Plain words first, numbers second, where to look third. Say what you didn't touch and what you checked. Name the files. Translate every unit the first time you use it ("−14 LUFS, our loudness target for feeds").

```
Two changes in the reel (v4):
- The whooshes are softer and darker: 4 dB quieter, and their sweep now tops out
  around 2.4 kHz instead of 6 kHz, so they no longer hiss. The clicks sit about
  3 dB above them now.
- "Press ⌘K and just type." stays up 2.7 s instead of 1.8 s (5 words; I hold
  each caption words ÷ 3 + 1 seconds).

Overall loudness is unchanged: −14.2 LUFS, peaks at −1.9 dBTP.
Listen at 0:04 (the title whoosh) and watch 0:11–0:14 (the caption).
Not touched: the keys, the pad, every other scene.
Checked: 12-still sheet (no clipping, safe zones clear), check.mjs
(18.4 s, 30 fps, 1080×1920, 7.9 MB).
Files: out/reel-v4.mp4, out/sheet-reel-v4.png

One question: are the whooshes at 0:04 now too faint, or right?
```

End with one focused question, not "let me know what you think". A specific question gets a specific answer, and that answer is the next edit. Match the user's own voice and casing in chat. The structure above is what matters.

## Sources

- Apple, app preview specifications (15–30 s, at most 30 fps, at most 500 MB, 886×1920 portrait, H.264 10–12 Mbps, stereo AAC 256 kbps at 44.1/48 kHz, 5 s default poster frame): https://developer.apple.com/help/app-store-connect/reference/app-preview-specifications
- Apple, app preview guidelines (only content captured within the app, no fingers or devices, muted by default so text must be legible and on screen long enough, no prices or dates, poster frame): https://developer.apple.com/app-store/app-previews/
- Every other platform number in the checklists (the Instagram 3:4 grid crop, YouTube thumbnail and LinkedIn cover sizes, safe zones, upload caps) comes from the Sources of [delivery-and-platforms](delivery-and-platforms.md), checked in September 2026.
