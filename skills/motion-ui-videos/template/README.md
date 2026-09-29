# video

Motion UI videos as code. A [Remotion](https://www.remotion.dev) project where the picture (React components) and the sound (synthesized in `sound/`) read one timeline, `src/cuts.json`, so they never drift. Every change is an edit and a re-render.

It ships with a demo about a fictional notes app, **Lumen**, in four cuts: a 16:9 showcase, a 9:16 reel, a seamless landing-page loop and a story, plus a reel cover and a YouTube thumbnail. Replace the demo with your product and keep the machinery.

## Quick start

```bash
npm install
npm run render:reel      # sound, then picture → out/reel.mp4
npm run studio           # scrub every cut in the browser
```

Node 18.12 or newer. Nothing else to install: Remotion brings Chrome and ffmpeg. The first render fetches the fonts from Google Fonts, so it needs a connection.

## Commands

| command | what it does |
|---|---|
| `npm run studio` | Remotion Studio: every cut and still, with a scrubber |
| `npm run render:showcase` | 16:9, 60 fps → `out/showcase.mp4` (sound first) |
| `npm run render:reel` | 9:16, 30 fps → `out/reel.mp4` (sound first) |
| `npm run render:story` | 9:16 story → `out/story.mp4` (sound first) |
| `npm run render:loop` | 1600×1000 loop, muted → `out/loop.mp4` |
| `npm run sound` | every cut's soundtrack → `public/sound-<cut>.wav`, with a loudness report |
| `npm run stills -- reel --marks` | a PNG at every mark → `out/stills/` |
| `npm run sheet -- reel` | those PNGs as contact sheets → `out/sheet-reel.png`, and pages of 12 |
| `npm run encode -- instagram out/reel.mp4` | a copy made for a platform (see below) |
| `npm run check -- out/reel.mp4` | length, fps, size, loudness and true peak of a file |
| `npm run captions -- showcase` | caption files → `out/showcase.srt`, `.vtt` and a `.txt` transcript |
| `npm run typecheck` | TypeScript, no output |
| `npm test` | the sound engine's tests, then the scripts' (`scripts/test.mjs`) |
| `node sound/design.mjs reel --cues` | one cut's soundtrack, and its cue sheet: every sound placed, by time, under its scene |
| `node sound/test/run.mjs` | the sound engine's tests, including the clock check below |
| `node sound/test/parity.mjs` | checks that the picture's clock (`src/lib/time.ts`) and the sound's (`sound/timeline.mjs`) agree on every cut |

Stills of the covers: `npx remotion still src/index.ts cover out/cover.png` and `... thumbnail out/thumbnail.png`.

Render one video at a time. Chrome and the encoder are memory-hungry, and two renders at once on a 16 GB machine is how you get a crash halfway through. `remotion.config.ts` already renders 2 frames at a time on a machine with 16 GiB of RAM or less (Remotion's own default, half the CPU threads, above that), and `scripts/stills.mjs` follows the same rule. If a render still runs out of memory, pass `--concurrency=1`.

## Where to edit what

| to change | edit |
|---|---|
| colours, fonts, radii, shadows, name, URL, call to action | `src/theme.ts` (and `src/fonts.ts` for the font files) |
| when anything happens, how long a scene runs, the crossfade | `src/cuts.json` |
| what the video says: every caption and title line, per cut and scene | `src/captions.json` |
| what a scene shows | `src/scenes/<Scene>.tsx` |
| the product's interface | `src/product/` |
| sizes, frame rates, platform safe zones | `src/formats.ts` |
| which sound plays on which moment | `sound/score.mjs` |
| how loud a cut is | `sound/design.mjs` (fixed gain per format) |

`src/Video.tsx` (the player) and `src/lib/` (the motion kit) rarely need edits.

## How it works

**Time is in seconds.** Every duration, mark, crossfade and warp knot is in seconds; frames exist only where the player hands a scene to Remotion. That is why the 60 fps showcase and the 30 fps reel can share scenes, and why the sound engine, which thinks in seconds, reads the same numbers.

**`src/cuts.json` is the timeline.** Each key is a cut, and each cut is one composition:

```jsonc
"reel": {
  "format": "reel",          // size, fps and safe zones from src/formats.ts
  "cross": 0.1,              // crossfade between scenes, seconds
  "sound": true,             // plays public/sound-reel.wav if it exists
  "scenes": [
    { "id": "reelPalette", "seconds": 3.1,
      "marks": { "keys": 0.22, "paletteOpen": 0.4, "typeStart": 0.6, "typeEnd": 1.1, "enter": 1.7, "noteIn": 2.05 } },
    { "id": "reveal", "seconds": 4.1, "marks": { "logo": 0.3 },
      "warp": [[0, 0.22], [0.63, 1.3], [4.1, 5.3]] }   // [drawn s, scene s]
  ]
}
```

- `id` picks the component from `src/scenes/index.ts`. One scene can appear in several cuts and lay itself out for each (`useCut()`, `useStage()`).
- `marks` name the moments sounds land on. Scenes read them with `useMarks()`, never hard-coded numbers, and `sound/score.mjs` places each sound on them. To re-time a moment, change one number; picture and sound both move.
- `warp` plays a scene on a different clock: here the showcase's 5.3 s reveal plays in 4.1 s inside the reel, its opening moves about 1.7× quicker and the hold under the promise near 1:1, so the line still gets its reading time. Ambient motion (idle drift, blinking carets) runs on `useDrawnTime()`, so a warp never makes it shiver.
- Lengths are laid out on the frame grid: each scene and crossfade is rounded to whole frames at the cut's fps, by the player and by the sound alike. Keep them whole frames anyway (one decimal place is exact at 30 and 60 fps), so what you wrote is what plays.

**Every frame is a pure function of time.** No `Math.random()` or `Date` in scenes (use `rand(seed)` from `src/lib/anim.ts`). Renders come out identical, and a still at 3.2 s shows exactly what the video shows at 3.2 s.

**The product is rebuilt, not recorded.** `src/product/` rebuilds the app from theme tokens, with every state (a row arriving, a button pressed, a dialog half open) a number the scene passes in. It stays sharp under any camera push, and a scene can show exactly the state it needs.

## The toolkit

- `src/lib/time.ts`: `useTime`, `useDrawnTime`, `useMarks`, `useCut`, `useStage`, `cutDuration`, `sceneStart`, `warp`
- `src/lib/anim.ts`: `prog`, `pop`, `lerp`, `clamp`, `rand`, `bezier`, `stagger`, `loopT`, `EASE`, `EASINGS`
- `src/lib/text.tsx`: `Line` (a line that arrives whole), `Words` (words rising out of a blur: an effect for at most two moments), `Captions` (`calm` for showcases, `punch` for reels), `Typed`, `Counter`, `KineticTitle`, `Highlight`
- `src/lib/cues.ts`: `useCues()`, this scene's lines from `src/captions.json` with its marks resolved
- `src/lib/ui.tsx`: `Cursor`, `Camera` (with a per-key `ease`, such as `EASINGS.commit`), `Focus`, `Callout`, `Toast`, `Badge`, `Backdrop`, `Grain`, `SafeZones`, `EndCard`
- `src/lib/devices.tsx`: `Browser`, `Window`, `Phone`

## The demo, scene by scene

Keep a table like this for your own video and keep it current: it is the script, the edit and the sound brief in one place.

**showcase** (1920×1080, 60 fps, 47.3 s, calm captions arriving as whole lines; scenes cut into each other, `cross` 0.1)

| scene | s | captions | on screen | sound |
|---|---|---|---|---|
| hook | 4.0 | Your team writes everything down. | the line arrives whole; chats, docs, stickies and emails drift in around it | a low swell; sixteen tiny whooshes, each its own, panned from off-screen to where its card lands, and a tiny pop as each settles |
| problem | 8.2 | Then it ends up in five different apps. / And nobody can find it when it matters. | the fragments sort into five apps; a search for "Q3 launch plan" comes up empty in all of them; the whole product drifts in about 2%, so the holds never freeze | a pop per window; a whoosh per fragment flying to its app and a tick as it lands; keys on the typed frames; a steady beating tone into a low dud |
| reveal | 5.3 | One calm place for your team's notes. | the mark pops, its sun rises (the one bright stage in the film), the name slides out, the promise rises word by word | the film's one riser, into a low hit and a bright chord; a small whoosh as the name slides out |
| how | 14.0 | Start a note in one click. / Do anything from the keyboard. / Share it with your team in two clicks. / Then write it together, live. | the cursor clicks New note, the title is typed, ⌘K opens the palette, Share, Invite team, Copy link; teammates join and write alongside | a whoosh on each camera move; clicks, keys, ⌘K, Enter; pops as the teammates join; a small chime on "Link copied"; Theo's typing quieter and further off |
| features | 11.7 | Made for small teams. / See who's in a note, live. / Find any note, instantly. / Rewind any note to any moment. | three cards; the camera takes each in turn while the others dim | one whoosh and three pops as the cards land; a whoosh per camera move; keys; a tick per history dot the scrubber passes; a small chime on "Restored" |
| end | 4.6 | Lumen · lumen.example · Try Lumen free | the end card | a pop as the mark lands; a pop and a two-note chime on the call to action; a faint glint on the button's shine |

**reel** (1080×1920, 30 fps, 21.1 s, punch captions: each chunk lands whole). A light 120 bpm beat drops in on the reveal's hit and stops on the call to action. From the hit on, every scene cut sits on its grid (those scenes in `cuts.json` start whole beats apart), and so do the note's punch-in, the live punch-in, the payoff's landing and the call to action. The hook and the problem play before the beat comes in, so their lengths are set by their captions' reading time instead (the hook's counted from frame 0, not from its title's 0.12 s pre-roll: five words need 2.67 s, so it runs 2.8 s).

It is laid out for a phone, not shrunk from a desktop: the scenes that show the product (reelProblem, reelPalette, reelLive, reelPayoff) take their frame from `phoneLayout()` in `src/scenes/common.tsx`, which puts the punch captions in a band above the product (`top` 330, where `Captions` puts them by default) and the product under them (x 150–930, y 530–1450). The product UI is scaled so its body text is at least 34 px on the 1080 px frame (the palette ×2.4, the note in the editor's phone layout, `<Editor compact>`, ×2.21, the note list ×2.45), and where the whole window would not fit at that size, a `Crop` with a `Camera` inside shows the part that matters.

| scene | s | captions | on screen | sound |
|---|---|---|---|---|
| reelHook | 2.8 | Your team's notes are everywhere. | the title is on frame 0 over the mess; a zoom punch blows it apart | a hit on frame 0; near silence while the mess creeps closer; a hit and two whooshes flying out left and right |
| reelProblem | 3.8 | Where's the launch plan? / 5 apps. 0 answers. | a search shakes empty, then five apps slam in as a stack, each with 0 results | a whoosh on the cut; keys; a beating tone into a dud; a hit and five falling pops; the reel's one riser, into the reveal |
| reveal | 4.1 | One calm place for your team's notes. | the showcase's reveal through a warp: quicker up to the promise, which then holds long enough to read | the showcase's reveal, and the beat comes in on its hit |
| reelPalette | 3.1 | One shortcut. / Any note. Instantly. | ⌘K as big keys, the palette, Enter, the note punches in | ⌘K on the keycaps' press; keys; Enter; a whoosh and a soft hit as the note punches in |
| reelLive | 3.1 | Share it. / Write together. Live. | one click on Share, the team arrives, a punch-in on them writing | a click; three rising pops; a hit on the punch-in; remote keys; a tick-box click |
| reelPayoff | 2.1 | Everything. One place. | the mess flies into one tidy list | the kick drops out for half a bar while sixteen small whooshes gather, then a landing and a bright chord back on the beat (beat 3 of its bar: the next downbeat is the cut to the end card) |
| end | 2.7 | Lumen · lumen.example · Try Lumen free | the end card, laid out for 9:16 | the mark's pop; the call to action's chime on the beat's last hit |

**loop** (1600×1000, 60 fps, 6 s, no sound): ⌘K, "new note", Enter, a title typed, and back to where it started. The last frame leads into the first with no seam.

**story** (1080×1920, 30 fps, 8 s): headline, the product in one glance, the call to action, and "tap the link" pointing at an empty spot where the story's link sticker goes (placed in the app, not in the video). A beat comes in with the card; the teammates, the call to action and the pointer land on it.

**cover** (1080×1920 still): everything that matters inside the centred 1080×1440, the part a profile grid shows. **thumbnail** (1280×720 still): three words readable at thumbnail size, nothing important in the bottom-right corner where the player prints the length.

## Check your work with stills

You can't watch a video in a terminal, but you can read a contact sheet:

```bash
node scripts/stills.mjs reel --marks         # a still at every mark, 0.2 s after it, and every scene's middle
node scripts/stills.mjs reel --marks --safe  # the same with the platform's safe zones drawn in red
node scripts/stills.mjs reel --at 0,0.3,5.1  # just these seconds
node scripts/sheet.mjs reel                  # → out/sheet-reel.png, and pages of 12 (add --safe for the safe-zone set)
node scripts/stills.mjs cover --safe         # a still: the cover with its 3:4 grid crop
```

The sheet leaves a grey gap between tiles and labels each with its time and mark. The gap matters: tiles that touch merge text from neighbouring frames and show you words that aren't there. A page holds 12 tiles, 4 across for portrait stills and 3 for landscape, so it stays under 1,600 px wide; past 12 stills there are pages (`out/sheet-reel-p1.png`, `-p2`…) beside the whole sheet. Read the pages: a viewer that shrinks one tall sheet to fit shrinks every tile with it. `--cols`, `--tile` and `--per` change the layout.

`stills.mjs` bundles once per run into `out/.bundle`, which it clears and reuses. Run one at a time, and never while a render runs.

Look for clipped or overlapping text, anything a camera push shoves off the frame, captions that are still arriving when the next one comes, fallback fonts, and, with `--safe`, words or buttons inside the red bands. For a loop, compare the first and last stills.

## Sound

`sound/design.mjs` synthesizes every cue in code, places each one on its mark from `src/cuts.json`, masters the mix and writes `public/sound-<cut>.wav`, which the cut plays. The `render:*` scripts run it first, so the soundtrack is always built from the current timing. If the file is missing, the video renders silent instead of failing.

```bash
node sound/design.mjs reel              # one cut → public/sound-reel.wav, and a report
node sound/design.mjs reel --cues       # … and the cue sheet: check each sound sits on its mark
node sound/design.mjs reel -2           # 2 dB quieter, just this once
node sound/design.mjs reel --fit        # the gain that lands on the target (keep it in CUT_GAIN_DB)
ONLY=whoosh node sound/design.mjs reel  # one layer alone (sfx, whoosh, pad, beat) → public/sound-reel-whoosh.wav
node sound/tools/loudness.mjs public/sound-reel.wav public/sound-showcase.wav   # compare two mixes in dB
node sound/tools/spectrogram.mjs public/sound-reel.wav out/sound-reel.png       # see it
```

`sound/score.mjs` holds the score. Each demo scene has a cue sheet written against its code: a click on each click, keys on the frames where each character appears, a pop as a card lands, a whoosh peaking where a camera move is fastest, a chime on a success. A scene without a sheet (yours, at first) is scored from the names of its marks (`click*`, `typeStart`/`typeEnd`, `paletteOpen`, `cardIn1`, `ctaIn`…), so it has sound from the start. Give it a sheet once its picture settles.

Levels are fixed, never normalised: turn one sound down and nothing else moves. The report says where the cut landed against its target (−17 LUFS for a showcase, −14 for phone cuts), how the layers sit (whooshes under the clicks, the beat under the UI), how loud each scene is, and what the soft clip and the limiter did. The WAV's true peak is held at −2 dBTP, so after the AAC encode the delivered file stays under −1.

Have a whoosh you like? Save it as `sound/refs/whoosh.<ext>` (wav, mp3, ogg, m4a, flac or aif; the folder is gitignored, since stock licenses rarely allow sharing the raw files), or point `WHOOSH_REF` at it, and every whoosh the score places grows fresh from it. That one file is the only reference the score reads: anything else in `sound/refs/`, a click or a keyboard, is ignored until you wire it into `sound/score.mjs` yourself. `node sound/tools/analyze.mjs <file>` describes any reference in plain words, and `node sound/tools/grow.mjs <file>` previews variants grown from one in `out/grown/` (nothing plays those files). See the comments at the top of `sound/score.mjs` and `sound/design.mjs`.

The picture and the sound keep two copies of the clock: `src/lib/time.ts` inside Remotion, `sound/timeline.mjs` in plain Node. `node sound/test/parity.mjs` runs the real `time.ts` against `timeline.mjs` for every cut (lengths, scene starts on the frame grid, warps, every mark) and fails on any difference.

## Deliver

```bash
node scripts/encode.mjs instagram out/reel.mp4             # H.264 High, limited-range BT.709, AAC, faststart
node scripts/encode.mjs instagram out/reel.mp4 --max-mb 9  # two-pass, sized to fit an upload cap
node scripts/encode.mjs youtube out/showcase.mp4
node scripts/encode.mjs gif out/loop.mp4                   # 720 px, 15 fps, palette-optimised
node scripts/encode.mjs webm out/loop.mp4 --mute           # for a landing page <video autoplay muted loop>
node scripts/check.mjs out/reel-instagram-9mb.mp4          # what the file really is, and how loud
```

Presets: `instagram`, `tiktok`, `shorts`, `youtube`, `linkedin`, `x`, `gif`, `webm`. Each converts the render's full-range BT.601 to limited-range BT.709 with zscale, which keeps a dark UI's shadows where they were. Check text sharpness on a still from a size-capped copy before posting it. Loudness targets: about −14 LUFS for reels and stories, −16 to −18 for a showcase, true peak at or under −1 dBTP.

### Caption files

```bash
node scripts/captions.mjs showcase               # → out/showcase.srt, out/showcase.vtt, out/showcase.txt
node scripts/captions.mjs showcase showcase-de   # another language's lines from captions.json, over the same timing
```

The lines come from `src/captions.json`, the same data the scenes draw, timed by `src/cuts.json` through the sound's clock, so each one starts on its frame. The `.srt` is for YouTube, LinkedIn, X and Facebook (which wants it renamed `name.en_US.srt`); the `.vtt` is a `<track>` for a landing page; the `.txt` is a transcript for under the player or the post text, since screen readers can't read burned-in words. Punch cues are joined into readable lines, and it warns about any line shorter than its reading time (words ÷ 3 + 1 s). The end card's name, URL and call to action come from `BRAND` and are not in the files.

## Make it yours

1. Put the brand in `src/theme.ts` and `src/fonts.ts` (take the values from the product's own CSS or design tokens).
2. Write the story as captions, one plain sentence per beat, in a table like the one above.
3. Replace the demo without breaking the build. The demo's scenes, their shared `src/scenes/common.tsx`, and `Cover` and `Thumbnail` (both imported by `src/Root.tsx`) import from `src/product/`, and every bundle compiles all of them, `scripts/stills.mjs` included. Either keep the demo compiling and build your UI beside it in `src/product/<name>/` with new scene ids, or remove it in one go:
   1. Delete the demo cuts you won't use from `src/cuts.json`, and their scenes from `src/scenes/index.ts` and `src/scenes/`.
   2. Rewrite `Cover` and `Thumbnail` for your product, or drop their `<Still>`s from `src/Root.tsx`.
   3. Delete demo files in `src/product/` once nothing imports them. `npm run typecheck` says what still does.
   4. In `sound/score.mjs`, delete or rewrite the `SHEETS` entry of any demo scene id you reuse, or give your scene a new id. A demo id plays its demo cue sheet whenever the cut has the marks that sheet `needs` (a new `hook` with `title` and `fragmentsIn` gets sixteen fragment whooshes and pops).
   5. Replace the `TYPED` entries in `sound/score.mjs` with the strings your scenes type (key `'<cut>/<scene>/<typeStartMark>'`). `node sound/test/run.mjs` fails while a demo string is listed that no longer appears in `src/`.
   6. Replace the demo's lines in `src/captions.json` with yours (`node scripts/test.mjs` fails on a block whose scene is not in its cut).
4. Rebuild the screens you need in `src/product/`, from the product's real layout, copy and icons, and write your scenes; add their marks to `src/cuts.json`.
5. Stills, sheet, look. Then sound. Then render, and `node scripts/captions.mjs <cut>` for the caption files.

## Notes

- **Remotion license.** Free for individuals and for companies of up to three people; larger companies need a company license. See [remotion.dev/license](https://www.remotion.dev/license).
- **Fonts.** `@remotion/google-fonts` holds every frame until the fonts arrive, so a render never quietly uses a fallback. For offline renders, put `.woff2` files in `public/fonts` and load them with `@remotion/fonts`.
- **Versions.** All `remotion` and `@remotion/*` packages must be the same exact version. Upgrade them together (`npx remotion upgrade`).
- **Line endings.** The scripts are plain Node. If you commit from Windows with `core.autocrlf=true`, check they still have LF endings, or their `#!/usr/bin/env node` line breaks on macOS and Linux.
