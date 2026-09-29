# Sound design

Every sound in the video is made or placed by code: `sound/engine.mjs` synthesizes the voices, `sound/score.mjs` puts each one on a mark from `src/cuts.json`, and `sound/design.mjs` masters the result to `public/sound-<cut>.wav` at a fixed loudness for where the video will play. This file covers why the sound is code, what each voice is for, how to place and pan sounds, how to mix and master to platform targets, how to measure when you cannot listen, the taste rules and the real feedback behind each one, reels cut to a beat, music, voiceover and stems. When the user sends audio they like, follow [audio-references](audio-references.md) as well.

## Contents

1. [Why the sound is code](#1-why-the-sound-is-code)
2. [How the pieces fit](#2-how-the-pieces-fit)
3. [The palette](#3-the-palette)
4. [Placing sounds on marks](#4-placing-sounds-on-marks)
5. [Stereo: pan to where it happens](#5-stereo-pan-to-where-it-happens)
6. [Layers and solo renders](#6-layers-and-solo-renders)
7. [Mixing and mastering](#7-mixing-and-mastering)
8. [Loudness targets by platform](#8-loudness-targets-by-platform)
9. [Measuring: you cannot hear, so measure](#9-measuring-you-cannot-hear-so-measure)
10. [Taste rules and the feedback behind them](#10-taste-rules-and-the-feedback-behind-them)
11. [Feedback to fix](#11-feedback-to-fix)
12. [Reels: beat grids and cutting to music](#12-reels-beat-grids-and-cutting-to-music)
13. [Music strategy](#13-music-strategy)
14. [Voiceover and ducking](#14-voiceover-and-ducking)
15. [Stems and deliverables](#15-stems-and-deliverables)
16. [Sources](#sources)

## 1. Why the sound is code

A UI video's sound is mostly small events: a click when the cursor presses, a key per character, a pop when a card lands, air when a panel slides. Code does four things for those that a library, an editor timeline or a generator cannot:

- **It lands on the exact frame.** A click placed at `at('how', 'click1')` plays at the second the `Cursor` presses, because both read the same mark. Nobody nudges clips.
- **It follows every edit.** Change a mark or a scene length in `cuts.json` and the next `node sound/design.mjs` moves every sound with it. In a warped reel the sound inverts the warp, so it lands where the picture draws the mark, not where the showcase had it.
- **It can be tuned by measurement.** Every sound has a gain, every stretch can be measured in LUFS, and a change is a number: "whooshes −3 dB" means exactly that. Since you cannot hear, this is the only way you can do sound well.
- **It is deterministic.** Every voice takes a `seed`; the same seed gives the same samples. A re-render changes only what you changed, so before/after comparisons are real.

Synthesized sounds also carry no license: nothing to clear, credit or get claimed.

**AI music lost, on one real film.** The launch film this skill is distilled from had a synthesized score. It was re-scored with AI-generated music and AI sound effects cut into single hits. The founder's verdict: "the before version was a lot better". It was reverted. That is one founder on one film, not a law, but the likely reasons are worth saying to a user who asks for AI music: generated audio does not know the picture, so hits land near events instead of on them; you cannot turn one hit down 2 dB without regenerating everything; a generated bed has its own arc that fights the edit; and its textures smear under the clicks and keys that carry a UI video. If the user prefers generated music, it can be the bed, placed like a licensed track (section 13); otherwise treat what they generate as a reference to analyze ([audio-references](audio-references.md)).

What code is not for: songs, vocals, realistic acoustic instruments. For those use a licensed track, or leave music to the platform (section 13).

## 2. How the pieces fit

| file | what it does |
|---|---|
| `sound/engine.mjs` | the voices (`click`, `key`, `whoosh`...), `createMix`, `place`, `placePeak`, `master`, `writeWav`, plus `readAudio` and `recording` for audio files |
| `sound/timeline.mjs` | reads `src/cuts.json` with the same math as `src/lib/time.ts`: `at(cut, scene, markOrSeconds)`, `sceneStart`, `cutDuration`, `unwarp`, `scenesOf`, `snap(t, fps)` |
| `sound/score.mjs` | `score(cut, mix, at)`: the cues for each cut, every one on a mark |
| `sound/design.mjs` | the entry: renders a cut's score, masters it at the format's fixed gain, writes `public/sound-<cut>.wav`, and prints a report (loudness against target, true peak, limiter, layer balance, each scene) |
| `sound/tools/loudness.mjs` | K-weighted loudness of a file or a stretch: integrated, loudest 3 s, loudest 400 ms, range, true peak |
| `sound/tools/spectrogram.mjs` | a PNG of one or more sounds on a shared scale, plus where each one's energy sits |
| `sound/tools/analyze.mjs`, `grow.mjs` | for the user's reference audio: see [audio-references](audio-references.md) |

`src/Video.tsx` plays `public/sound-<cut>.wav` when the cut has `"sound": true` and the file exists.

```bash
node sound/design.mjs showcase            # one cut → public/sound-showcase.wav, then a loudness report
node sound/design.mjs --all               # every cut with "sound": true
node sound/design.mjs reel -2             # 2 dB under the cut's fixed gain, for a quick "a bit quieter"
node sound/design.mjs reel --fit          # find the gain that lands on the target, and print it to keep
node sound/design.mjs reel --cues         # also print the cue sheet: every sound placed, by time, under its scene
ONLY=whoosh node sound/design.mjs reel    # one layer alone → public/sound-reel-whoosh.wav (sfx, whoosh, pad, beat; or pad,beat)
OUT=out/stems node sound/design.mjs reel  # write somewhere other than public/
node sound/timeline.mjs reel              # every scene and mark of a cut, in cut seconds
npm run render:reel                       # sound first, then the picture
```

`ONLY` writes its own file and leaves the full mix alone. In PowerShell set the variable first and clear it in the same line: `$env:ONLY='whoosh'; node sound/design.mjs reel; Remove-Item Env:ONLY`. A leftover `ONLY` makes the next `npm run render:reel` write only the solo file, and the film quietly plays a stale mix.

After a sound change you only re-run `design.mjs`; refresh the Remotion Studio to hear the new WAV. The picture does not need re-rendering until the final export.

## 3. The palette

Each voice comes out at a **house level** (`HOUSE` in `engine.mjs`): at `gain: 1` a click, a key, a pop and a whoosh already sit right against each other, because the levels come from a film balanced by ear with its founder. Lean with `gain` (0.5 to 2, which is −6 to +6 dB) instead of rebalancing from scratch. Give every use its own `seed`, so no two clicks are sample-identical.

| voice | what it is | use it for | notes |
|---|---|---|---|
| `click({ seed, bright })` | 1 ms bright transient, a tiny ping near 3 kHz, a little 190 Hz body | cursor clicks, toggles, buttons, a checkbox | `bright` 0.8 for a soft, dark UI; 1.2 for tiny controls |
| `key({ seed, pitch, space })` | light ~3 kHz tick, small ~850 Hz tap, fainter key-up 40–60 ms later | typing, one per character | `space: true` for spaces; give each typist a `pitch` (0.9, 1, 1.05) so two people sound like two keyboards |
| `tick({ seed, tone })` | 25 ms high tick | text that prints itself: logs, terminal output, streamed AI text; the default arrival sound for small things (a bubble, a row, an avatar) | at 50+ characters a second this is texture, not events; keep it at house level or under, skip spaces |
| `pop({ f, from, dur, seed })` | a round sine dropping from `from`× its note into `f` | the hero arrival and the payoff: the card the caption is about, the badge that says it worked | take `f` from the scene's chord; a group gets one pop, not a rising arpeggio (section 10) |
| `chime({ notes, dur, spread })` | glassy partials, highs fading first | success: done, sent, it worked | 2–4 notes, `spread` 0.02–0.075 s; at most one per section or it turns into a slot machine |
| `thump({ f, dur })` | a low sine falling into `f` (the demo uses 50–72 Hz), with a puff of low noise | a hit you feel: the problem landing, the reveal, the end card | phone speakers barely play its fundamental, so pair it with a pop or chime on key moments |
| `tone({ notes, dur, beat })` | a steady odd-harmonic tone; one note gets a partner a semitone up and the two beat evenly (~9 Hz at D#3) | tension: a conflict, an error building | place with `placePeak` so its loudest point, its end, lands on the hit that resolves it |
| `whoosh({ dur, f0, f1, peak, q, seed })` | pink noise through a band sweeping `f0` → `f1`, kept under 2.4 kHz | motion: panels sliding, camera pushes, scene changes | rising (`f0 < f1`) for in/up/open, falling for out/away; `placePeak` on the move's fastest moment |
| `riser({ dur, f0, f1, seed })` | noise and a quiet tone building to its end | the 1–2 s before a reveal | about one per film, on its biggest build; `placePeak` puts its end on the hit; follow it with a `thump` |
| `pad({ notes, dur, bright, seed })` | quiet chord bed, three detuned voices per note, rolled off above `bright` Hz, up to 0.9 s in, 1.2 s out | under a whole scene or section: mood and glue | dark for the problem (`bright` 600–800), open for the reveal and close (2000–2600) |
| `step({ f, seed })` | tiny square tick, low-passed | footsteps of a mascot, a stepper advancing | alternate `f` 1150 / 900 for left and right feet |
| `kick`, `hat`, `snareish` | minimal soft beat kit | reels cut to a beat (section 12) | always under the UI sounds |
| `note('C#5')`, `beats(bpm, count, offset)` | helpers | note names to Hz; beat times in seconds | |

Relative levels that worked on the real film, as `gain` against house level:

- foreground events (the click the caption talks about): 1
- background activity (someone else typing off in a corner): 0.3, about −10 dB, so the foreground reads
- many small repeated moves (16 arrows crossing): 0.5–0.7 each, since they overlap
- the one or two biggest hits in the film: 1.5–2 (+4 to +6 dB), and nothing else that loud

## 4. Placing sounds on marks

Name every moment a sound depends on as a mark in `cuts.json`. `byMarks()` in `score.mjs` then scores each scene of a cut in one of two ways:

- **By hand, from a cue sheet.** `SHEETS` holds one sheet per scene id, written while looking at that scene's code. It places sounds on the scene's marks and on the moves the scene derives from them (a camera push from `click1 - 0.3`, a card landing on its own staggered time), so each sound lands on the frame where its picture happens. Every scene of the demo has one. A sheet lists the marks it `needs`; in a cut that lacks one of them, the scene is scored by name instead.
- **By mark name**, for any scene without a sheet (yours, at first). `byName()` sounds each mark through the `RULES` list, so a new scene has sound as soon as its marks are named. Give it a sheet once its picture settles.

The main naming rules (the full list is `RULES` in `sound/score.mjs`; the first rule that matches a name wins):

| mark name | sound |
|---|---|
| `click…`, `tap…` (`click1`, `clickShare`) | a UI click, a new seed each, panned a little at random |
| `*typeStart` … `*typeEnd` (`typeStart`, `paletteTypeStart`, `typeStart2`…) | one laptop key per character between them (below) |
| `keys`, `shortcut` / `enter`, `return`, `submit` | a two-key shortcut (⌘K) / the bigger return key |
| `paletteOpen` / other `…Open` | a small quick whoosh and a light high pop / a small whoosh and a soft pop |
| `…Close`, `…Out` / other `…In` (`noteIn`, `appsIn`) | a small falling whoosh / a small quiet whoosh |
| `reveal` (or `logo` in a scene whose id contains `reveal`) | a whoosh into a low thump and a bright chord |
| `logo`, `wordmark` | a pop and a small whoosh / a small whoosh |
| `cardIn1`, `cardIn2`… | a small whoosh and a pop per card, rising in pitch, panned left, centre, right |
| `join…`, `toast`, `check…`, `select` | a rising pop per person / a pop and a quiet chime / a bright little click / a soft click |
| `noResults`, `error…`, `fail…` | a soft low dud |
| `ctaIn` | a pop and a two-note chime |
| `hit…`, `punch…`, `slam…` | a low hit (a little higher on punchy cuts, so phone speakers get some of it); in a problem scene a steady beating tone swells into it |
| `whoosh…`, `swipe…` / `focus…` / `restore…`, `back…` / `gather…` | a whoosh loudest on the mark (falling if the name has out, leave or exit) / a slow low whoosh / a falling whoosh / a rising whoosh |
| `burst`, `settle…`, `pointer` | a whoosh and a light hit / a soft low landing / a small high pop |
| `step…` | a footstep |
| `done…`, `success…` | a soft success chime |
| `title` in a punchy cut's first scene | a hit and a short whoosh as the hook title slams in |

The rules sound each arrival by itself (a pop per card, a rising pop per person). That suits a sparse scene; for a group, or a busy scene, write a sheet that gives the group one sound (section 10).

On top of the scenes' cues, the showcase, the reel and the story get a quiet pad chord per scene (`pads()`: darker for scene ids like `problem`, brightest for `reveal`), punchy cuts get a whoosh through every scene change that has none (`transitions()`), and the reel and the story get a soft beat (`beat()`, section 12). A mark no rule knows stays silent (captions, for instance, should make no noise).

**Writing a sheet.** A sheet is a `needs` list and a `cue(k, s)` function. `s.marks` are the scene's marks in scene seconds, and `s.t(markOrSceneSeconds)` turns a mark name, or scene seconds such as `m.click1 + 0.15`, into cut seconds (null for a missing mark, which places nothing). The kit `k` places each voice at house level times the cut's style (calm or punch): `k.click`, `k.key`, `k.tick`, `k.pop(t, 'E5', …)`, `k.chime(t, notes, …)`, `k.thump`, `k.tension` (a beating tone that swells into `t`), `k.riser` (a build that ends on `t`), `k.step`, `k.swish(t, { dur, size, pan, rise })` (a whoosh loudest at `t`, pitched by the size of what moves), `k.move(s, from, to)` (the whoosh of an eased move between two scene seconds) and `k.typing(s, from, to, { text })`. A sheet is keyed by scene id, so it serves every cut the scene appears in; branch on `k.style.punch` or `k.cut` where the cuts differ.

```js
// sound/score.mjs, in SHEETS: a sheet for your own scene (its id in cuts.json), used in every cut it appears in
invite: {
  needs: ['click1', 'dialogIn', 'join1', 'toast'],
  cue(k, s) {
    const m = s.marks;
    k.click(s.t('click1'), { pan: 0.3 });                                 // the Invite button sits right of centre
    k.swish(s.t(m.dialogIn + 0.1), { dur: 0.5, size: 0.9 });              // loudest where the dialog moves fastest
    k.pop(s.t(m.dialogIn + LAND), 'D5', { gain: 0.4, from: 1.3, dur: 0.2 });
    // three avatars on the scene's own stagger (join1 + i × 0.15): a pop each, rising
    ['E5', 'G5', 'A5'].forEach((n, i) => k.pop(s.t(m.join1 + i * 0.15 + LAND), n, { gain: 0.5, dur: 0.22 }));
    k.chime(s.t(m.toast + 0.06), ['B5', 'E6'], { dur: 1.1, spread: 0.07, gain: 0.4 });
  },
},
```

`LAND` (0.04 s) is defined above the sheets: a pop lands a hair after its mark, because a spring starts from rest and the eye reads the landing.

Cues that belong to the cut rather than to one scene (a sting over a scene change, a drop before the payoff) go in that cut's `case` of `score()`, on moments nothing else sounds yet (`node sound/design.mjs <cut> --cues` shows what is already there; a second cue on `click1` would double the click). A `case` replaces the defaults, so it starts with `byMarks(k, CALM)` or `byMarks(k, PUNCH)` and `pads(k, …)`. Inside `score(cut, mix, at)`, the `at` you are handed is bound to the cut being rendered: `at(scene, markOrSeconds)` returns seconds from the cut's start, with the scene's start added and its warp inverted. From other scripts, `at` in `timeline.mjs` takes the cut first: `at('reel', 'reveal', 'logo')`.

Rules that keep sound and picture together:

- **Place on marks, never on hand-typed seconds.** `s.t(2.0)` and `at('how', 2.0)` work (scene seconds are accepted) but the next re-time breaks them. If a sound needs a moment, the moment deserves a name.
- **Offsets belong in scene time.** For "0.15 s after the click, as the scene draws it", read the mark and add in scene seconds: `s.t(m.click1 + 0.15)` in a sheet, `at('how', marks.click1 + 0.15)` elsewhere. Adding 0.15 to the result of `s.t()` or `at()` adds cut seconds, which is wrong inside a warped scene. Outside a sheet, read marks from the kit (`k.scenes.find((s) => s.id === 'how').marks`) or with `scenesOf(cut)` from `timeline.mjs`.
- **Land the loudest moment, not the start.** A whoosh's energy peaks partway through; a riser peaks at its end. `placePeak(mix, sound, t)` shifts the sound so its loudest moment (`peakAt`) lands on `t`. Use `place` for sounds that start with their hit (clicks, keys, pops, thumps).
- **Snap to the frame the picture shows it.** Sound lives in seconds, but the picture only changes on frames. A character typed at 2.717 s appears on the next frame, 2.733 s at 60 fps. For a hand-placed cue that must not lead its picture, `snap(t, fps)` from `timeline.mjs` gives that frame's time. Viewers notice sound that arrives before its picture sooner than sound that arrives late (the broadcast detectability thresholds are about 45 ms early versus 125 ms late, from ITU-R BT.1359), so round up, never down. Sheets and rules place on the exact mark, less than one frame early at most, which is well inside that window, and typed keys are snapped to their frame.
- **Keys land on the moment each character appears.** `k.typing()` places one key per character between two scene seconds; the demo's sheets call it, and the naming rules call it for every `*typeStart` … `*typeEnd` pair. With the typed text listed in `TYPED` at the top of `score.mjs`, each key lands on the frame `Typed` shows its character (the file carries a line-for-line port of `typedTimes()` from `src/lib/text.tsx`), and spaces get the space bar. Without an entry it places about 18 keys a second between the marks, which is enough for small or fast typing. Either way the scene's `Typed` must run at cps = text length ÷ (typeEnd − typeStart), starting at `typeStart`. `node sound/test/run.mjs` fails when a `TYPED` string no longer appears in `src/`, so the list cannot quietly go stale:

  ```js
  // sound/score.mjs: 'cut/scene/markName' → the exact string the scene types
  export const TYPED = {
    'showcase/how/typeStart': 'Q3 launch plan',
    'showcase/how/paletteTypeStart': 'share',
    // …add a line for every Typed in your scenes
  };
  ```

  On a 30 fps reel several characters can share a frame; they read as a quick burst.
- **Movement sounds follow the picture's actual events.** A mascot's footsteps land on each footfall of its walk cycle, computed from the same mark and step period the scene uses; a stagger's pops land on `stagger(i, each, start)` of the same numbers. When the scene lays things out with seeded `rand`, recompute the same layout in the score (`score.mjs` already has a line-for-line port of `rand()` from `src/lib/anim.ts`) so each sound knows where and when its object moves.
- **A scene that is not in this cut has no cues.** Sheets only run for the scenes a cut contains. `at()` throws for a scene the cut does not contain, which is what you want: place per cut (its `case`) or loop over `k.scenes`. A missing mark also throws; `hasMark(cut, scene, mark)` from `timeline.mjs` checks first, and the kit's `k.mark(scene, name)` and a sheet's `s.t(name)` return null, which places nothing.
- **One sound per event.** A click does not also need a pop and a whoosh. Layering three sounds on one event is the fastest way to make a UI video sound cheap.

To see every mark of a cut in cut seconds (handy when a sound seems misplaced): `node sound/timeline.mjs reel`. To see every sound the score placed, by time and under its scene: `node sound/design.mjs reel --cues`.

## 5. Stereo: pan to where it happens

Pan each sound to where its event is on screen, subtly. A click on the left sidebar sits a little left; a toast in the bottom right sits a little right. It makes the picture feel physical without anyone noticing why.

The demo's sheets pan each click to where it is on screen (the `how` sheet puts the sidebar's New note click at −0.45); the naming rules, for scenes without a sheet, pan clicks a little at random. To put one where it happens, place it in the scene's sheet:

```js
// screen x (px) → pan, for a stage W px wide; 0.7 keeps it subtle, never hard left or right
const panAt = (x, W = 1920) => Math.max(-0.8, Math.min(0.8, ((x - W / 2) / (W / 2)) * 0.7));
k.click(s.t('click2'), { pan: panAt(1460) });   // in the scene's sheet; the kit narrows the pan on phone formats
```

- **Keep it within ±0.8.** Hard-panned UI sounds feel like they are in one ear on headphones and vanish on a single phone speaker.
- **In 9:16 pan less**: the picture is narrow, phone speakers are nearly mono, and wide panning on a narrow picture sounds detached. The template's score scales every pan it places by 0.35 on phone formats (reel, story, portrait, App Store) and 0.6 on square. Place through the kit (`k.put`, `k.peak`) and it does that for you; a bare `place` call does not.
- **Moving things move in the stereo field.** `pan` accepts `[from, to]` and travels across the sound's length: a panel sliding in from the left gets `pan: [-0.6, -0.1]`; an object crossing the frame gets the pan of its start and end positions. Stereo sounds (recordings, grown whooshes) keep their own image, and `pan` leans it.
- **Keep the low and the important in the middle.** Thumps, kicks, pads, voiceover and the one click the caption is about stay near 0. Phones often play mono or from one speaker.
- **Check mono.** `analyze.mjs` reports L/R correlation for any WAV, including a rendered mix; a correlation near 0 or negative means parts may cancel on a mono phone speaker.

## 6. Layers and solo renders

The mix keeps four layers apart (`BUSES` in `engine.mjs`): `sfx` (clicks, keys, pops, chimes, thumps, tones, steps), `whoosh` (whooshes, risers, recordings, grown sounds), `pad` (the chord bed, or a music track placed with `bus: 'pad'`), and `beat` (the kit). Each voice knows its own layer; `place(..., { bus })` overrides it.

`ONLY` renders some layers alone through the same master, at the same fixed gain, into its own file:

```bash
ONLY=sfx node sound/design.mjs reel          # → public/sound-reel-sfx.wav
ONLY=whoosh node sound/design.mjs reel       # → public/sound-reel-whoosh.wav
ONLY=pad,beat node sound/design.mjs reel     # → public/sound-reel-pad+beat.wav
```

The full mix, `public/sound-reel.wav`, is left as it was. Every full render also prints each layer's loudest 400 ms, so you often do not need to solo at all. Use solo files to find what "too much" means (which layer is loud where), to balance one layer against another over the same stretch, and to make stems (section 15). Because the master gain is fixed (and the room and filters are linear), a layer measured alone is exactly as loud as it is inside the full mix, apart from whatever the soft clip and the limiter did.

## 7. Mixing and mastering

The chain in `master(mix, opts)`:

1. **Sum the layers**, then add the **room**: a small, warm reverb (Freeverb's shape, 18 ms pre-delay) fed by each sound's `room` send. Close UI sounds use little (clicks 0.12, keys 0.1, ticks 0.05); things that ring use more (pops 0.22, chimes 0.4, the pad 0.35). The room glues separate synthesized sounds into one space. Too much turns a desk into a hall: past about 0.5 on anything, it is too much.
2. **High-pass at `hp`** (30 Hz; `design.mjs` uses 40 on phone formats): removes rumble that no phone plays but that eats headroom and drives the limiter.
3. **Low-pass at `lp`** (18 kHz): a click's noise reaches all the way to the top of the band, where it only adds peaks between samples. If true peak runs high on a click-heavy reel, pass `lp: 15000` to the `master()` call in `design.mjs` (the same goes for `hp`).
4. **Fixed gain**: `MASTER_BASE` plus the cut's `gainDb`. It never moves with the mix, so turning one sound down never turns the rest up. A normalizer would, and then every change sounds like three changes to the user. A UI score as busy as the template's showcase lands near −17 LUFS at `gainDb: 0`, which is the `showcase` target. `sound/design.mjs` holds the numbers: `TARGET_LUFS` per format, `FORMAT_GAIN_DB` per format (calibrated with `--fit` on the demo: +0.7 dB for `showcase` and `loop`, +0.1 for the phone formats, whose beat, fuller pad and cut whooshes already fill them), and `CUT_GAIN_DB` for a cut that needs its own (the demo's sparse story has +1.3). When a cut's sound is nearly done, run `node sound/design.mjs <cut> --fit` once: it finds the gain that lands on the target and prints the line to put in `CUT_GAIN_DB`. From then on the gain is fixed. For quick trials, `node sound/design.mjs reel +1.5` adds dB for one render.
5. **Fades**: 5 ms in and 0.25 s out by default (`fadeIn`, `fadeOut`), so the file never starts or ends on a click. A looping reel whose last sound must reach the last frame needs `fadeOut: 0` ([reels-retention](reels-retention.md) §12).
6. **Soft clip, then a look-ahead limiter.** The top 3 dB under the ceiling (`clip`) bend smoothly into it, which shaves only the tips of clicks and keys. Then the limiter looks 3 ms ahead at the true peak, so its gain is already down when a hit arrives; it lets go of a short peak in about 15 ms and of a long one over `release` (120 ms). `design.mjs` passes a ceiling of −2 dBTP (`CEILING_DB`), so the WAV's true peak stays under −2: the AAC encode adds overshoot of its own (measured on the template's reel: +0.1 dB at 256 kbps, +0.7 dB at 192 and 128 kbps), and the spare dB keeps the delivered file under −1. (`master()` called on its own defaults to `ceiling: 0.89`, about −1 dBTP.) Each render reports both: how many transient peaks were shaved and by how much (fine), and whether a longer sound was held down (heard, and it ducks whatever plays with it). `design.mjs` warns when more than 1% of samples were soft-clipped, when a longer sound was held down more than 3 dB or for more than 3% of the cut, or when the true peak ends up more than 0.2 dB over the ceiling. The fix is a quieter big hit in the score, not a harder limiter or a lower master.

`writeWav` writes 16-bit, 48 kHz stereo with deterministic TPDF dither.

A mix that works, from the real film: the pad is felt more than heard; clicks and keys are the clearest things in it; whooshes sit under the clicks and keys around them; one thump and one chime mark the reveal; the loudest moment of the film is a single, deliberate hit.

## 8. Loudness targets by platform

| where it plays | integrated | true peak | why |
|---|---|---|---|
| Instagram Reels, TikTok, YouTube Shorts, stories | −14 LUFS | ≤ −1 dBTP | Neither Instagram nor TikTok publishes a playback target; practitioners measure and recommend around −14 (a conservative convention is −16). A reel competes with loud neighbours in the feed, and phone speakers are small, so aim at the top of the range. |
| YouTube, 16:9 | −16 to −17 LUFS | ≤ −1 dBTP | YouTube turns content louder than about −14 LUFS down and does not turn quieter content up, so a film at −17 plays 3 dB quieter than a video mastered at −14 next to it. A sparse UI film gains little from going louder: its big moments sit 10–12 dB over its average, and at −14 the limiter would flatten every one. |
| landing page, pitch, conference screen, email | −16 to −18 LUFS | ≤ −1 dBTP | No normalization; people set the volume. A calm, sparse SFX-led film keeps its transients crisp there instead of being squeezed. |
| one showcase file for both web and YouTube | −17 LUFS | ≤ −1 dBTP | the template's default for the `showcase` format: the compromise |
| UI loop | muted | | it autoplays silently on the page anyway |
| broadcast TV (rare) | −23 LUFS (EBU R 128) | −1 dBTP | the broadcast standard, if the film goes to air |

`TARGET_LUFS` in `sound/design.mjs` holds these per format: −14 for `reel`, `story`, `square`, `portrait` and `appstore`, −17 for `showcase` and `loop`. Change a number there, then `--fit`, when a cut lives somewhere else.

Why −1 dBTP: the MP4 carries AAC audio, and lossy encoding can create peaks between samples that clip on playback. Spotify, which documents its pipeline, recommends −1 dBTP, and −2 dBTP for masters louder than −14 LUFS. Treat that as the rule for every delivered file. That is why `design.mjs` masters the WAV to −2 dBTP: the extra dB is room for the AAC encode's own overshoot. `scripts/encode.mjs` helps too: it copies the render's AAC untouched when it is good enough (48 kHz stereo, at least the preset's bitrate), because a second AAC generation pushes the true peak up by about another half a dB. Measure the final MP4 with `node scripts/check.mjs out/reel.mp4`, not only the WAV: if it still reads above −1, lower `CEILING_DB` in `design.mjs` to −2.5 or −3 and render again.

For context, the reference numbers: Spotify normalizes to −14 LUFS by default (−11 loud, −19 quiet setting); Apple Music to about −16; the AES recommendation for streaming (TD1008) is −18 LUFS for speech and assorted content and −16 for music. Loudness is measured per ITU-R BS.1770 / EBU R 128: K-weighted, momentary over 400 ms, short-term over 3 s, integrated over the whole programme with a −70 LUFS absolute gate and a gate 10 LU under the programme's own level.

## 9. Measuring: you cannot hear, so measure

You cannot listen to the result. Never say a change "sounds better". Say what changed, in dB and plain words, and ask the user to listen. The user is the ears; you are the meter.

**Read the design report first.** Every `node sound/design.mjs <cut>` ends with one:

```
reel · reel · 21.10 s · target -14 LUFS, true peak ≤ -2 dBTP
  placed    sfx 75 · whoosh 28 · pad 7 · beat 48 · by hand: reelHook, reelProblem, reveal, reelPalette, reelLive, reelPayoff, end · synthesized whooshes
  gain      +0.1 dB (reel default +0.1)
  loudness  integrated -14.4 LUFS · true peak -2.0 dBTP · loudest 3 s -12.4 · range 2.6 LU
  target    0.4 dB under -14: on target
  clip      soft-clipped the tops of transients on 0.70% of samples, at most 7.1 dB (at 12.10 s)
  limiter   shaved 8 transient peaks (clicks, keys, pops) by up to 1.8 dB
  layers    loudest 400 ms: sfx -8.3 · whoosh -17.6 · pad -15.4 · beat -16.3 LUFS
            whooshes sit 9.4 dB under the UI sounds: good
  scenes    reelHook       0.00–2.80   mean  -16.1 · loudest 400 ms  -12.5 LUFS
            reelProblem    2.70–6.50   mean  -15.0 · loudest 400 ms  -11.6 LUFS
            ...
  wrote     public/sound-reel.wav (21.10 s, 3.5 s to render)
```

(That is the template's own reel at one point in its tuning; your numbers will differ.) It says how many sounds went on each layer, which scenes were scored by hand from a sheet and which by mark name (a scene whose sheet is missing a mark says which), and whether whooshes were grown from a reference; where the cut landed against its target and, when it is off, the exact command to fix it; what the soft clip and the limiter did; how the layers sit against each other (whooshes should be at least 3 dB under the UI sounds, and the beat under them too; it warns otherwise); and each scene's average and loudest moment, which is how you spot a hook that is weaker than the payoff. Add `--cues` to also print every sound placed, by time, under its scene: the way to check placement without hearing it.

**Then measure what the question needs.** `sound/tools/loudness.mjs` measures a file, or a stretch of it:

```bash
cp public/sound-reel.wav out/before.wav        # keep the approved version
# ...change the score...
node sound/design.mjs reel
node sound/tools/loudness.mjs out/before.wav public/sound-reel.wav --from 6.5 --to 7.4
```

For each file it prints integrated loudness, true peak, the loudest 3 s and the loudest 400 ms, and the loudness range; for the second file it adds how much louder or quieter it is than the first. Pick the window that fits the question:

| question | measure |
|---|---|
| is the whole cut on target? | integrated (whole file), true peak |
| is the hook as strong as the payoff? are sections even? | loudest 3 s over each section (`--from/--to` per scene; `node sound/timeline.mjs` gives the times) |
| is this whoosh, swell or voice phrase too loud? | loudest 400 ms over a stretch around it, with that layer soloed (`ONLY=`) |
| is this one click audible? | a stretch of 0.1 s around it (`--from t --to t+0.1`); a stretch shorter than one 400 ms block is measured as one block |

Compare like with like. Layer against layer, the report's 400 ms comparison is right, because the loudest UI moments are pops, chimes and thumps. Single sound against single sound, it misleads: a 70 ms click averaged over 400 ms reads far quieter than it sounds, so a whoosh "beats" it in 400 ms windows while sitting under it to the ear. Measured through the master at house level, a click's loudest 100 ms is about 3.5 dB above a whoosh's, and that is the relationship to keep. Better still, compare each stretch with the approved version of itself.

`sound/tools/spectrogram.mjs` draws sounds as stacked panels on one time and level scale (dark is quiet, yellow is loud; 100 Hz, 1 kHz and 10 kHz lines marked) and prints where each one's energy sits:

```bash
cp public/sound-showcase-whoosh.wav out/whoosh-before.wav      # the approved whoosh layer, soloed earlier
ONLY=whoosh node sound/design.mjs showcase                      # → public/sound-showcase-whoosh.wav
node sound/tools/spectrogram.mjs out/whoosh-before.wav public/sound-showcase-whoosh.wav out/whoosh.png --from 3 --to 9
```

Read the PNG. What to look for: a bright band above 5–6 kHz is hiss (the thing users call "white noisy"); a smear after a hit that fades slowly is a long tail; tall thin vertical lines are transients (clicks, keys) and should be crisp, not blurred; two sounds occupying the same band at the same moment are masking each other.

After encoding, `node scripts/check.mjs out/reel.mp4` reports duration, fps, size, integrated loudness and true peak of the delivered file.

Report every sound change like this:

> Whooshes in the hook are 4 dB quieter (loudest 400 ms, soloed: −27.1 → −31.1 LUFS), so they sit under the clicks again. Nothing else changed. The reel measures −14.2 LUFS integrated, true peak −2.0 dBTP. Listen at 0:02–0:05 and tell me if the arrows still feel busy.

Numbers first, then what it means, then exactly where to listen.

## 10. Taste rules and the feedback behind them

Each of these came from a real note the founder gave on the film. The quoted words are the feedback; the rule is what fixed it.

1. **Soft over bright.** "Too white-noisy", "a bit too overwhelming". The first whooshes were white noise up to 6.5 kHz with an extra air band. Fix: pink noise (equal energy per octave, so it reads as air instead of hiss), one band kept under 2.4 kHz and low-passed, shorter tails, and 3–6 dB less. The engine's `whoosh` has this built in. When a user's recording is hissy, cut its tail sooner (`recording(file, { tailDb: -45 })`) and trim it down.
2. **Never repeat one sample.** "The swarm sounds bad since it's just the whoosh effect repeated many times." Sixteen arrows crossing the screen all used one recording. Fix: every arrow got its own whoosh grown from that recording, stretched to its path, pitched by its size, bent like a Doppler pass, and panned along its path ([audio-references](audio-references.md)). For synthesized voices, the same rule is a fresh `seed` per use.
3. **Steady, not glitchy.** "Stabilize the electronic sound." Before an error there was a bit-crushed random glitch. Fix: a steady tone, two notes a semitone apart beating evenly (`tone`). Tension should feel like pressure, not like a broken speaker. Random gating and crushed noise read as a bug in the video.
4. **Subtle keys.** "A smoother, more pleasant typing sound", then, after a first fix made the keys a soft, deep "thock", "subtle MacBook keyboard sounds". Fix: `key`: a short light tick near 3 kHz, a small tap near 850 Hz, quiet, no thock, one key on the frame each character appears. "Smoother" meant quieter, lighter and less mechanical, not deeper. When typing feedback is vague, ask for a recording of a keyboard they like.
5. **Whooshes sit under clicks and keys.** A whoosh carries a move; it never covers the event at the end of it. When raising anything in the whoosh layer, measure it against the clicks around it, and never let whooshes get louder than the version the user approved unless they ask.
6. **Sound follows the picture's real events.** A mascot's footsteps landed on its footfalls, derived from the same step period the animation used, and they moved across the stereo field with it. Sounds placed "about when" something happens read as sloppy even when nobody can say why.
7. **Revert first.** "The before version was a lot better." When a change loses, go back to the approved version, then change one thing at a time. Keep the approved WAV aside (`out/before.wav`) so you can always measure against it.

Working heuristics (practice, not measured facts):

- **Leave air.** 0.3–0.5 s of near silence before the reveal makes the hit land. Constant sound is flat sound.
- **Pitch follows meaning.** Things arriving rise (a pop from the chord, when an arrival earns a pitched sound at all); things leaving fall (a falling whoosh, a lower pop); success is a consonant chord in the pad's key; trouble is a semitone.
- **Few pitched sounds.** A pitched pop on every bubble, avatar and card, rising arpeggios on groups, chimes and risers: that is the mobile-game texture of amateur and AI-made UI videos, and it breaks "one sound per event" and "few big moments" at once. Outside the payoff, allow about one pitched sound per 2 s. A staggered group gets one sound, on its first or last item. Small arrivals get a short non-tonal `tick` or `click` (20–40 ms); pitched pops are for the hero arrival and the payoff, and a film gets about one `riser`. The template's reel has one, the reveal's (`SHEETS.reveal`): its hook builds to the burst in near silence, and `beat()` rests before the payoff without one, the drop itself being the build.
- **Tonal sounds share a key.** Take pop and chime notes from the chord of the pad underneath, so the film sounds composed rather than assembled.
- **Few big moments.** One or two hits at +4 to +6 dB per film. If everything is emphasized, nothing is.
- **Background at −10 dB.** Activity that is not the point of the shot (other people typing, a counter ticking) sits about 10 dB under the foreground.

## 11. Feedback to fix

Feedback arrives as feelings. Solo layers to find the source, change one thing, and report in numbers. Every row here is the one table for sound feedback; most came up for real on the launch film this skill was distilled from.

| they say | usually means | try | numbers to report |
|---|---|---|---|
| "too much", "overwhelming", "busy" | one layer too loud, tails too long, or too many events | solo layers to find it; −3 to −6 dB on that layer; shorter `dur`; drop events that are not the point of the shot | which layer, the dB change |
| "too loud", "too quiet" (the whole thing) | the cut's level, not one sound | the cut's fixed gain, never per-sound trims: `node sound/design.mjs <cut> -2` to try, then `--fit` or `CUT_GAIN_DB` in `design.mjs` to keep it | integrated LUFS before and after |
| "too quiet on my phone" | integrated under target | check with `scripts/check.mjs`; `node sound/design.mjs <cut> --fit`; watch the limiter share | integrated LUFS, true peak |
| "hissy", "white noise", "harsh", "too white-noisy" | energy above 5 kHz | pink noise, whoosh `f1` ≤ 2400; recordings: `tailDb: -45` and trim; `lp: 15000` on the master | the band top before and after, dB |
| "same sound over and over", "sounds like a machine" | one sample reused | a fresh seed per use; grow a variant per use from a recording, stretched to the move, pitched by size, bent like a Doppler pass, panned along the path | how many variants, the pan range |
| "glitchy", "unstable", "stabilize the electronic sound" | random gating, crushed noise | `tone({ notes, dur, beat: true })`: two notes a semitone apart beating evenly; even rhythms | the notes used |
| "typing is annoying", "clacky", "should be smoother" | keys too loud, too low or too many | `gain` 0.5–0.7, `pitch` 1.05–1.1 (lighter); one key per character, on its frame; keys only for the typing the caption is about | keys per second, level against the clicks |
| "subtle MacBook keys" | a light key, not a thock | `key()`: a short tick near 3 kHz plus a small tap near 850 Hz, quiet, no thock | level against the clicks |
| "I can't hear the clicks" | masked by a whoosh or the pad at that moment | lower the whoosh or pad there by 2–3 dB before raising the click (the master stays fixed); `bright: 1.2` | layer levels from the solos |
| "sounds like a mobile game", "too many dings" | a pitched pop on every arrival, rising arpeggios, chimes | ticks for small arrivals, one sound per group, pitched sounds for the hero arrival and the payoff (section 10) | pitched sounds per 10 s, before and after |
| "the music is distracting" | the bed too loud or bright | pad −3 dB, darker (`pad({ bright })` from 1200 down to about 800), fewer notes | dB, brightness |
| "muddy", "boomy" | too much low end | shorter thumps, pad notes above C3, `hp: 40` on the master | dB |
| "thin", "cheap", "the hits feel weak" | no weight under big moments | a `thump` around 55–65 Hz under the reveal and end card, a pad note an octave lower, a touch more room on pops and chimes | true peak before and after |
| "echoey", "washy" | the room washes everything | a lower `room` send per cue (0.12 → 0.05), or `reverb: false` in `design.mjs`'s `master()` call for one A/B | send amounts |
| "distorted", "crackly" | limiter working hard, or true peak over −1 after encoding | lower the gain; `CEILING_DB` −2.5 in `design.mjs`; check the MP4, not only the WAV | true peak of the MP4 |
| "it's late", "out of sync" | placed at the start of a sound whose peak comes later, placed before the frame shows it, a stale WAV, or a reference at the wrong rate | `placePeak`; `snap(t, fps)`; check that `at()` was used, the WAV is fresh and references go through `readAudio()` | the mark time against the event time |
| "music fights the voice or captions" | bed in the speech band | duck 6–10 dB under speech (section 14); darker pad | duck depth |
| "boring", "flat" | no contrast | near silence before the reveal, then `thump` + `chime`; one `riser` into it | the section loudness before and after |
| "it sounds AI-generated", "generic" | stock-like textures: pops and chimes on everything, a placeholder beat | fewer pitched sounds; the user's own references ([audio-references](audio-references.md)); in-app or licensed music instead of the kit | pitched sounds per 10 s |
| "can you make it sound like this?" + a file | a reference | analyze, describe it back, cast it to moments; play it as recorded (peak on the move) or grow variants; model percussive references (clicks, keys) instead of growing them | the plain-words description and the level match |
| "the before version was better" | the change lost something | revert, then one change at a time | none: go back to the approved WAV |

## 12. Reels: beat grids and cutting to music

A reel cut to a beat feels deliberate. Cuts, captions and big moves land on beats; the small UI sounds still land on their marks.

**Pick a tempo whose beat is a whole number of frames**, so cuts land exactly on beats instead of drifting by a fraction of a frame per bar:

| fps | BPM with whole-frame beats |
|---|---|
| 30 (reel, story) | 90 (20 frames), 100 (18), 120 (15), 150 (12), 180 (10) |
| 60 (showcase) | 90 (40), 100 (36), 120 (30), 144 (25), 150 (24) |

120 BPM is the easy default for a 30 fps reel: a beat is 0.5 s, a bar is 2 s, which is also a good rhythm for a pattern interrupt (see [reels-retention](reels-retention.md)).

**The template's reel already has a beat.** In the reel's case of `score.mjs`, `beat(k, { bpm: 120 })` lays a kick on 1 and 3, a soft backbeat on 2 and 4 and hats on the offbeats, under the UI, and plans itself from the cut:

- its grid runs through the reveal's hit (a `reveal` mark, or `logo` in a scene whose id contains `reveal`), else through the middle of the first scene cut;
- with two bars or more between the second scene and the reveal, it grooves from the second scene and drops out for the bar before the reveal while a `riser` builds into it; with less, as in the demo reel (the hit lands at 6.45 s, 3.7 s after the second scene starts), the hook and the problem play without it and it comes in on the hit;
- it rests for half a bar before every `settle` mark, with no riser (the drop is the build), so the landing brings the beat back (the demo's payoff lands on beat 3 of its bar; the next downbeat is the cut to the end card);
- it stops on the call to action (`ctaIn`) with one last kick and an open hat;
- a kick never lands on a hit a sheet already placed there.

Any of that can be given instead, in cut seconds: `anchor` (a downbeat of the grid), `from`, `to`, `rests` (`[from, to]` stretches), `build` (where the one riser into a rest lands, null for none) and `final` (null for no last hit). The story's case does this: its beat comes in with the card on a grid through the title, and ends on the last downbeat at least 1.5 s before the end, so it rings out. Change the tempo with `bpm`.

**Put scene cuts on beats.** A scene starts `cross` seconds before the previous one ends, and a cut reads in the middle of its crossfade, so with a tiny crossfade (the demo reel uses 0.1 s) choose scene lengths as whole beats plus `cross`: at 120 BPM, `"seconds": 2.6` (5 beats) or `3.1` (6 beats). The demo reel's reveal warp puts the hit 0.05 s into its scene, the middle of the crossfade, so the hit and every later cut share one grid. Then check it:

```js
// out/beatgrid.mjs, a throwaway (out/ is gitignored); run `node out/beatgrid.mjs` from the video folder
import { getCut, scenesOf, at } from '../sound/timeline.mjs';
const cut = 'reel', bpm = 120, spb = 60 / bpm;
const anchor = at(cut, 'reveal', 'logo');                        // the template's beat runs through the reveal's hit
const off = (t) => Math.round((t - anchor - Math.round((t - anchor) / spb) * spb) * 1000);
const cross = getCut(cut).cross ?? 0;
for (const [i, s] of scenesOf(cut).entries()) {
  const cutAt = i ? s.start + cross / 2 : s.start;              // a cut reads mid-crossfade
  console.log(`${s.id.padEnd(12)} cut at ${cutAt.toFixed(3)} s  ${off(cutAt)} ms off the beat`);
  for (const m of Object.keys(s.marks)) console.log(`   ${m.padEnd(10)} ${at(cut, s.id, m).toFixed(3)} s  ${off(at(cut, s.id, m))} ms`);
}
```

On the demo reel every scene cut from the reveal on, the note's punch-in (`noteIn`), the live punch-in (`punch`), the payoff's `settle` and `ctaIn` come out within 3 ms of a beat. The cut from the hook into the problem doesn't (about 0.2 s off): no beat plays yet there, so the problem scene is as long as its caption needs to be read. Aim for scene cuts and the marks of big moves (a panel landing, the payoff) within one frame (33 ms at 30 fps) of a beat. Small UI marks (each key, each click) stay where the interaction puts them; forcing typing onto a grid makes it robotic.

**The minimal kit by hand**, for another cut or a different drop, kept under the UI sounds:

```js
// sound/score.mjs (place, beats, kick, hat and snareish are already imported there).
// In the reel's case of score(), instead of beat(k, { bpm: 120 }), never as well as it; the braces keep
// these names inside this case (a bare `const beat` in a case would shadow the beat() function for every case).
case 'reel': {
  byMarks(k, PUNCH);
  transitions(k);
  pads(k, PUNCH);
  const bpm = 120, spb = 60 / bpm;
  const start = at('reveal', 'logo'), end = at('end', 'ctaIn');     // in on the reveal's hit, out on the call to action
  const drop = at('reelPayoff', 'settle');                          // the payoff lands on a beat
  const silent = (b) => b > drop - spb - 0.01 && b < drop - 0.01;   // a beat of silence before it
  beats(bpm, Math.round((end - start) / spb) + 1, start).forEach((b, n) => {
    if (silent(b)) return;
    if (n % 2 === 0) place(mix, kick({ seed: n }), b, { gain: 0.5 });   // beats 1 and 3
    else place(mix, snareish({ seed: n }), b, { gain: 0.6 });           // beats 2 and 4
  });
  beats(bpm * 2, Math.round((end - start) / (spb / 2)), start).forEach((b, n) => {
    if (!silent(b)) place(mix, hat({ seed: n }), b, { gain: n % 2 ? 0.5 : 0.8, pan: 0.15 });
  });
  break;
}
```

Start a hand-placed kit at `gain` 0.5 and raise it only if the beat disappears under the UI: the kick is the loudest voice in the palette and will otherwise drive the limiter on every downbeat. The design report warns when the beat layer is louder than the UI sounds. Two drops work reliably: a bar without the beat while a `riser` builds into the reveal, or a short rest before the payoff, then a `thump` and a `chime` on its downbeat (above). The template's `beat()` does the first when the reveal comes late enough, and the second, half a bar long, before every `settle` mark.

If the user supplies a track, measure its tempo first (a spectrogram of its first bars shows the kick as regular vertical lines; `beats()` with that BPM and offset should line up with them) and cut to its grid the same way.

## 13. Music strategy

Decide per cut, and ask the user where the reel will be posted and from what kind of account, because the answer changes what music is allowed.

| situation | do this |
|---|---|
| reel where the user will add trending audio in the app | export an SFX-only version (below); cut to that song's tempo if they tell you which one |
| user has a licensed track (with a license that covers this use and platform) | put it in `sound/refs/`, cut to its beat, mix the SFX over it |
| showcase, launch film, landing page | a `pad` per section with SFX on top (no license needed), or a licensed track with stems (below) when 60–120 s of pads and SFX feels sterile |
| reel with no in-app or licensed music | SFX and a pad, with the kit as a quiet tempo guide (gain 0.5 or under); tell the user that in-app audio or a licensed track would lift it |

**In-app music is licensed for that app only.** Business accounts get a smaller, commercially cleared library: Instagram and Facebook business accounts are limited to Meta's Sound Collection for Reels, and TikTok business accounts see only the Commercial Music Library, whose licenses cover TikTok and not a YouTube or Instagram copy of the same video. YouTube Shorts can use most songs from the Shorts audio library for up to 90 seconds in a Short of up to 3 minutes, and some tracks are limited to 60 or 30 seconds. So a song added inside TikTok cannot be baked into the file you post to Instagram. That is why the SFX-only version exists.

**SFX-only version**, for music added in the app:

```bash
ONLY=sfx,whoosh node sound/design.mjs reel        # → public/sound-reel-sfx+whoosh.wav (no pad, no beat)
npx remotion ffmpeg -y -i out/reel.mp4 -i "public/sound-reel-sfx+whoosh.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest out/reel-sfx.mp4
node scripts/check.mjs out/reel-sfx.mp4
```

This swaps the audio of the finished render, so the picture is not rendered a second time. The gain stays as it is: the SFX-only mix measures a few dB under the full mix, which is right, because the added song goes on top and most apps let the poster balance original audio against the added track. Deliver both files and say which is which.

**A licensed track in the mix:**

```js
// sound/score.mjs: add SR, readAudio and dbToGain to the engine import (place, cutDuration, path and REFS are already there).
// In this cut's case of score(), after byMarks(k, …), and without pads() or beat(): the song is the bed.
const song = readAudio(path.join(REFS, 'track.mp3'));          // decoded with Remotion's ffmpeg, 48 kHz stereo
if (song.r === song.l) song.r = song.l.slice();                 // a mono file shares one array: split it before editing
const end = Math.min(song.l.length, Math.round(cutDuration(cut) * SR)), fade = Math.round(1.5 * SR);
for (let i = end - fade; i < song.l.length; i++) {              // fade out over the cut's last 1.5 s
  const k = Math.max(0, (end - i) / fade);
  song.l[i] *= k; song.r[i] *= k;
}
place(mix, song, 0, { bus: 'pad', gain: dbToGain(-10), room: 0 });   // a record has its own space: no room
```

Start 10 dB down and bring it up until the song leads between events and the clicks still read on top: in the busy stretches, the song sits 6–8 dB under the UI sounds. Keep third-party music in `sound/refs/` (gitignored) and write where it came from and its license in the project README.

**Cut the film to the track's phrases.** Music moves in 4- and 8-bar phrases (8 s and 16 s at 120 bpm). Measure the tempo, set scene lengths so sections change on phrase boundaries, and put the reveal on a phrase's downbeat. With stems (drums, bass, the rest), drop the drums under the how-it-works section so the clicks and keys lead, and bring them back for the payoff.

**Sound on or off?** Plan for both. TikTok reported from a 2021 Kantar study that 88% of its users say sound is essential to the experience, while a 2019 Verizon Media / Publicis Media survey found 69% of US adults watch video with sound off in public. Meta's creative guidance puts it as "build for sound off, delight with sound on". The picture and captions must tell the story alone; the sound makes it land. Never put information only in the audio.

## 14. Voiceover and ducking

If the film has a voiceover, it leads, and everything else makes room.

- **Get clean takes.** Mono WAV, 48 kHz, no music under it, one file per line or paragraph. Keep the takes next to the score, in `sound/vo/`, named `<scene>-<n>.wav`. If the voice is synthesized, the user must have the rights to it. A voice in a reel (pace, the spoken hook, TTS): [reels-retention](reels-retention.md) §8.
- **Process the takes before they go in.** A raw take recorded in a closet sounds boomy, sibilant, uneven and noisy next to clean synthesized sounds, an obvious amateur tell. The chain, in order: a high-pass at 80 Hz; noise reduction only if the noise floor between phrases sits above −60 dBFS, and gently; a de-esser at 5–8 kHz; compression at 2–4:1 for 3–6 dB of gain reduction; a light presence lift around 3 kHz, and a cut around 200–300 Hz if the voice is boomy; mouth clicks removed and breaths pulled down about 10 dB. Then level-match the lines to within ±1 LU on their loudest 3 s (`node sound/tools/loudness.mjs sound/vo/*.wav`). Remotion's bundled ffmpeg has none of these filters apart from `volume`, and the engine has only high-, low- and band-pass biquads, so run the chain where the user recorded (their recording app, Audacity, a DAW), or ask before installing a full ffmpeg. The high-pass alone can run in the score:

  ```js
  // sound/score.mjs: add biquad to the engine import. A mono file shares one array between l and r: filter it once.
  const highpass = (s, f = 80) => {
    for (const ch of s.r === s.l ? [s.l] : [s.l, s.r]) { const hp = biquad('hp', f); for (let i = 0; i < ch.length; i++) ch[i] = hp(ch[i]); }
    return s;
  };
  ```
- **Place lines on marks.** Give each line a mark in `cuts.json`, place it with `readAudio`, and time the captions from the same marks so the words on screen arrive with the voice.
- **Level.** Speech is the anchor: the voice should be the loudest continuous thing in the mix, with the bed 12–18 LU under it while it speaks (a working heuristic). Check it on a spoken stretch: solo the `sfx` and `pad` layers and measure both files with `loudness.mjs --from --to` over the same seconds. The AES streaming recommendation for speech-led programmes is −18 LUFS; a reel still goes to −14 integrated with `--fit` as usual. Report the voice on its spoken stretches: in a −17 LUFS showcase it measures about −16 LUFS short-term (the loudest 3 s over a line).
- **Keep sounds out of the words.** Drop keys and clicks under speech to `gain` 0.5–0.7; move whooshes into the gaps between phrases; no chimes on top of a sentence.
- **Duck the bed** 6–10 dB under speech, starting 80 ms before a phrase and coming back over about 400 ms after it. Because the engine knows the whole voice file in advance, it can duck before the first syllable, which a live compressor cannot.

The voice goes on the `sfx` bus (the engine's layers are `sfx`, `whoosh`, `pad`, `beat`). Ducking edits the bed's layers after they are placed; a mix's layers are plain arrays in `mix.buses[name].l / .r`:

```js
// sound/score.mjs: add SR, readAudio, loudestRms and dbToGain to the engine import (place is already there).

/** Turn `layers` down by depthDb under `voice` placed at `t`, from `attack` s before each phrase to `release` s after it. Call after placing the bed. */
export function duck(mix, voice, t, { layers = ['pad', 'beat'], depthDb = 8, attack = 0.08, release = 0.4 } = {}) {
  const hop = Math.round(0.01 * SR);
  const floor = loudestRms(voice) * dbToGain(-30);             // quieter than this is a gap between words
  const talking = [];
  for (let i = 0; i + hop <= voice.l.length; i += hop) {
    let e = 0;
    for (let j = i; j < i + hop; j++) e += ((voice.l[j] + voice.r[j]) / 2) ** 2;
    talking.push(Math.sqrt(e / hop) > floor);
  }
  const pre = Math.ceil(attack / 0.01), post = Math.ceil(release / 0.01);
  const down = dbToGain(-depthDb);
  const cDown = Math.exp(-1 / ((attack / 3) * SR)), cUp = Math.exp(-1 / ((release / 3) * SR));
  for (const name of layers) {
    const bus = mix.buses[name];
    if (!bus) continue;                                          // layer empty, or left out by ONLY
    let g = 1;
    for (let k = -pre; k < talking.length + post; k++) {
      let on = false;
      for (let d = -post; d <= pre && !on; d++) on = !!talking[k + d];
      const target = on ? down : 1;
      for (let i = 0; i < hop; i++) {
        const j = Math.round(t * SR) + k * hop + i;
        if (j < 0 || j >= mix.len) continue;
        g = target + (g - target) * (target < g ? cDown : cUp);
        bus.l[j] *= g; bus.r[j] *= g;
      }
    }
  }
}

// in the cut's case of score(): the bed first, then the duck, then the line
const line = highpass(readAudio(path.join(HERE, 'vo', 'how-1.wav')));   // highpass() from the chain above
duck(mix, line, at('how', 'vo1'));                              // pad and beat 8 dB down while it speaks
place(mix, line, at('how', 'vo1'), { room: 0.03 });
```

To duck the `sfx` layer too (clicks and keys −3 dB under speech), call `duck(mix, line, t, { layers: ['sfx'], depthDb: 3 })` before placing the line, since the voice itself goes on `sfx`. [showcase-16x9](showcase-16x9.md) §5 has the whole voiceover cut.

The room send of the pad is not ducked, so its faint reverb stays under the voice; that is usually fine and sounds natural.

## 15. Stems and deliverables

Some users will finish the sound in an editor, or hand it to someone who will. Give them stems: one WAV per layer, same length, same start, same master gain, so they line up and sum to the mix.

```bash
for layer in sfx whoosh pad beat; do OUT=out/stems ONLY=$layer node sound/design.mjs reel; done
OUT=out/stems node sound/design.mjs reel
# → out/stems/sound-reel-sfx.wav, -whoosh, -pad, -beat, and the full mix sound-reel.wav
```

Stems sum to the full mix except where the limiter worked, which on a healthy mix is a few percent of the samples by a dB or two. Skip a stem the cut does not use (the report's "placed" line lists what each layer holds). A voiceover rides in the `sfx` stem; if the editor needs it separate, give them the original takes too.

What to deliver with a finished video:

- the full mix inside the MP4, at the platform's target (section 8), checked with `scripts/check.mjs`;
- for reels that will get in-app music: an SFX-only MP4 as well;
- stems if the user asked for them or will edit elsewhere;
- a note in the project README of any third-party audio used (source and license), even when the files themselves stay in `sound/refs/`.

## Sources

Checked in September 2026.

- Spotify for Artists, "Loudness normalization": −14 LUFS default (−11 loud, −19 quiet), ITU-R BS.1770 measurement, keep masters below −1 dBTP, below −2 dBTP when louder than −14 LUFS. https://support.spotify.com/us/artists/article/loudness-normalization/
- iZotope, "How to master for streaming platforms" (July 2025): reference levels per platform; YouTube −14 LUFS and does not turn quiet content up; Apple Music −16 LUFS. https://www.izotope.com/community/blog/mastering-for-streaming-platforms
- Production Advice, "YouTube Stats for Nerds": reading "content loudness" in the player; YouTube does not turn quieter videos up. https://productionadvice.co.uk/stats-for-nerds/
- Critical Listening Lab, "Social Media Audio Loudness": TikTok and Instagram normalization is undocumented; about −14 LUFS observed; recommends −14 LUFS with −1 dBTP. https://www.criticallisteninglab.com/en/learn/loudness/social-media
- APU Software, "Social Media (TikTok/Reels) Loudness Target": TikTok and Instagram publish no official target; −16 LUFS / −1 dBTP as a conservative convention. https://apu.software/tiktok-instagram-reels-loudness/
- Production Advice, "Streaming Loudness: AES recommendations 2021" (AES TD1008): −18 LUFS for speech and assorted content, −16 LUFS for music. https://productionadvice.co.uk/td1008/ and https://aes.org/community/technical-council/technical-document-aestd1008/
- EBU Tech 3341, "Loudness metering: EBU mode": momentary 400 ms, short-term 3 s, integrated with gating. https://tech.ebu.ch/docs/tech/tech3341.pdf
- EBU R 128: broadcast programmes normalized to −23 LUFS. https://tech.ebu.ch/docs/r/r128.pdf
- Wikipedia, "Audio-to-video synchronization": ITU-R BT.1359 detectability thresholds of about +45 ms (audio early) to −125 ms (audio late). https://en.wikipedia.org/wiki/Audio-to-video_synchronization
- Social Media Today, "TikTok Shares New Insights Into the Importance of Sound" (June 2021): Kantar study, 88% of TikTok users say sound is essential. https://www.socialmediatoday.com/news/tiktok-shares-new-insights-into-the-importance-of-sound-for-marketing-promo/601569/
- Streaming Media, "80% of Video Caption Users Aren't Hearing Impaired, Finds Verizon" (May 2019): 69% watch with sound off in public, 25% even in private; survey of 5,616 US adults. https://www.streamingmedia.com/Articles/ReadArticle.aspx?ArticleID=131860
- Meta for Business, "Want to Make Better Video Ads for Mobile?": "Build for sound off. Delight with sound on." https://www.facebook.com/business/news/want-to-better-video-ads-for-mobile-well-show-you-how
- Instagram Help Center, "Access to the licensed music library on Instagram" (https://help.instagram.com/402084904469945/) and Tripepi Smith, "Navigating the use of music in Instagram Reels for business accounts" (updated July 2025): business accounts are limited to Meta's Sound Collection. https://tripepismith.com/insights/music-in-reels-business-accounts/
- TikTok for Business, "About the Commercial Music Library" (https://ads.tiktok.com/help/article/commercial-music-library) and Soundstripe, "TikTok Music Library for Creators and Brands" (updated September 2026): business accounts see only the Commercial Music Library; its licenses cover TikTok only. https://www.soundstripe.com/blogs/tiktok-music-library-explained
- YouTube Help, "Understand three-minute YouTube Shorts": most Shorts audio library songs usable for up to 90 s in a Short up to 3 minutes, some limited to 60 or 30 s. https://support.google.com/youtube/answer/15424877
