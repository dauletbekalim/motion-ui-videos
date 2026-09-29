# skill-promo

The motion-ui-videos skill's own promo, made the way the skill makes any video: a copy of `skills/motion-ui-videos/template/`, with new scenes, new cuts and a new cue sheet. It renders a 27 s Instagram reel, a 50 s 16:9 showcase, a reel cover, a GitHub social preview and the README's grid of formats.

The template's Lumen demo is still here, untouched, because the promo shows it: every phone, browser and card in the promo plays the template's own cuts live (`src/promo/Embed.tsx`), frame for frame what `npm run render:reel` would draw at that second. No screen recordings, no video files.

## Commands

```bash
npm install
npm run render:promo-reel        # sound, then picture → out/promo-reel.mp4 (9:16, 30 fps, 27.0 s)
npm run render:promo-showcase    # sound, then picture → out/promo-showcase.mp4 (16:9, 60 fps, 50.0 s)
node scripts/stills.mjs promo-cover       # the reel cover (add --safe for the 3:4 grid crop)
node scripts/stills.mjs promo-social      # GitHub social preview, 1280×640
node scripts/stills.mjs formats-grid      # every template format, labelled
node scripts/encode.mjs instagram out/promo-reel.mp4 --max-mb 8
node scripts/encode.mjs youtube out/promo-showcase.mp4
node scripts/encode.mjs gif out/promo-reel.mp4 --width 360 --fps 10 --out ../../media/demo.gif   # the README's GIF, about 4 MB
node scripts/captions.mjs promo-showcase  # out/promo-showcase.srt, .vtt, .txt (also promo-reel)
npm test                                  # the sound tests and the script tests
node scripts/promo-spectra.mjs            # redraw src/promo/spectra.json after changing sound/promo-sounds.mjs
```

Render one video at a time. Everything else is as in the template's README (studio, stills, sheets, check).

The template's machinery here (`src/lib/`, `Video.tsx`, `formats.ts`, the demo scenes and product, `scripts/`, the sound engine, timeline, tools and tests) is a copy that must agree with `skills/motion-ui-videos/template/`; diff the two after a template change. The promo's own files are `src/scenes/promo/`, `src/promo/`, `src/scenes/lumen.ts`, the promo blocks of `src/cuts.json` and `src/captions.json`, `sound/promo-*.mjs`, `scripts/promo-spectra.mjs`, and the promo wiring in `Root.tsx`, `scenes/index.ts`, `sound/score.mjs` and `sound/design.mjs` (`CUT_GAIN_DB`).

## Where things are

| what | where |
|---|---|
| the timeline of both cuts | `src/cuts.json` (`promo-reel`, `promo-showcase`) |
| every caption and title line, by cut and scene (drawn with `useCues()`, exported by `scripts/captions.mjs`) | `src/captions.json` (`promo-reel`, `promo-showcase`) |
| the scenes, each laid out for 9:16 and 16:9 | `src/scenes/promo/` |
| the stills | `src/scenes/promo/Stills.tsx` |
| playing a template cut inside a frame, whole (`Embed`) or cropped to the part that matters (`CutWindow`); naming a moment of it by scene and mark (`momentOf`) | `src/promo/Embed.tsx` |
| the skill's mark, code card, terminal, spectrogram, waveform | `src/promo/parts.tsx` |
| the cue sheets, the beat, the payoff's borrowed sound | `sound/promo-score.mjs` (wired in from `sound/score.mjs`) |
| the reference whoosh and its grown variants | `sound/promo-sounds.mjs` |

## The reel (`promo-reel`, 27.0 s, −14 LUFS)

Every scene starts on a beat of a 120 bpm grid, and the marks inside them sit on it too, so the hits land on the beat. Captions are punch captions: chunks of up to three words, each cue on screen at least max(0.5 s, words ÷ 3) (captions-and-type §8). Each chunk lands whole in the text colour with a calm settle, no word lighting: `lit` is for a voiceover or words cut to the beat grid, and these cues are paced by the component rather than placed on the beats (captions-and-type §10, reels-retention §7). The only accent words are the hook's and the end card's.

It is laid out for a phone the way the template's reel is (`phoneLayout()` in `src/scenes/common.tsx`): every caption sits in one band above the product, `top` 330 (the eye enters the frame high, and the post text and an ad's button grow up from the bottom), each chunk one line of at most 16 characters at 92 px, starting as the scene's 0.1 s crossfade ends so two scenes' words never overlap; every scene's UI fills x 150–930 × y 530–1450 under it (90% of the safe width, 920 px tall). Code and terminal text is at least 40 px, UI body text at least 34 px; where a whole frame would be too small to read, a window crops into the part that matters (`CutWindow` in `src/promo/Embed.tsx`, a `Crop` around the list, the flagged frame's caption band).

| s | scene | caption | on screen | sound |
|---|---|---|---|---|
| 0.0 | pHook | Product videos, written as code. | headline on frame 0 in the caption band, over a window into the template reel at its own size (the first frame is the thumbnail); the showcase and the loop slam in over it, cropped to their Presence card and ⌘K palette, one per beat; on `fan` the three stack into labelled full-width strips | a hit on frame 0, a light hit and a rising note per card, a whoosh and three label ticks on the stack |
| 3.0 | pPrompt | Tell Claude what you're launching. | a full-height terminal: "make a 21 s reel for our app" typed at 58 px in the middle, sent to the top, three replies with the template reel's real plan (7 scenes, 21.1 s) and its seven scenes as a strip | keys on each character, Enter, three soft pops, a tick per scene block |
| 6.0 | pRebuild | It reads your repo, rebuilds your UI. | three files read in one card, which opens as `<NoteList items selected />` at 44 px; each line builds its part of the real list in the empty frame below (×2.7), one line per beat | a tick per file, a pop, ticks for rows, a click for the selection |
| 9.5 | pTimeline | Picture, sound, one timeline. | this scene's own marks from cuts.json; a playhead crosses them and the UI clicks, joins, types | the click, pop and keys on those marks; the beat thins to hats so they are the rhythm |
| 12.5 | pCheck | It checks its work. | a contact sheet filling the UI area (3 × 2 reel stills); the flagged frame grows out of it into the whole window, cropped to its caption band, where the caption runs off both edges past the red safe zones, then wrapped to fit | a tick per tile, a beating tone into a low dud, a small chord |
| 15.0 | pFormats | One source. Every format. | one frame, as big as the UI area allows, reshapes: 16:9, 9:16, 1:1, loop (pushed in ×2 on its palette), cover, each the template's scene at that size | a whoosh per morph, a rising note as it lands |
| 17.5 | pSounds | Send sounds you like. It makes the rest. | whoosh.wav drops in, its spectrogram draws as it plays, three grown variants land in the slots waiting under it and draw as they play | the reference and the three variants themselves |
| 21.5 | pPayoff | Rendered, not recorded. | the template reel at its own size (masked above the UI area, so its own captions stay out of ours), pulling back to show it playing in a phone 640 px wide | the template reel's own UI sounds, on its frames; a whoosh through the pull-back and a hit as it lands on the beat |
| 24.0 | pEnd | Free & open source. | mark, name, "Claude Code skill", github.com/dauletbekalim/motion-ui-videos as a 52 px button on two lines; the line in the caption band | a pop, a chord, the last kick |

## The showcase (`promo-showcase`, 50.0 s, −17 LUFS)

The same story, calm captions, more time on how it works: the scene table after the prompt, the file tree and theme tokens, a click that proves the list is live UI, a second pass of the timeline after one number is edited ("Move a mark, and its sound moves too."), and a loudness meter showing this film's own measured mix. No beat; the UI sounds and a quiet pad. Calm captions at the template's defaults (60 px, at most 1,306 px wide, `top` 84), each held at least (words ÷ 3) + 1 s; the hook's headline is the film's one blur-rise, and the end card's URL is 56 px.

Each scene fills the frame under the caption: the hook's three formats big and overlapping, a 1520 px terminal, the tree, tokens and code down the left with the list big on the right, the timeline across the top with the marks and the UI they drive under it, a 4 × 3 contact sheet, a 1312 × 738 format frame.

## Honesty notes

- The whoosh.wav in the sounds scene is a stand-in synthesized in `sound/promo-sounds.mjs` (the repo ships no stock audio). The variants really are grown from it with `sound/tools/grow.mjs`, and the spectrograms are measured from the exact sounds that play.
- The clipped caption in the check scene is a staged mistake, drawn over a real frame of the template reel, to show what the check catches.
- The loudness numbers on screen (`MEASURED` in `src/scenes/promo/PCheck.tsx`) are what `node sound/design.mjs promo-showcase` reports. Update them after changing the score.
- The windows in the hook, the formats scene and the payoff are crops of the template's own frames at that second (the reel at its own size, the showcase ×1.18, the loop ×1.5 or ×2), pushed in rather than shrunk; nothing in them is redrawn for the promo. The template moments are named by scene and mark (`momentOf`), so they stay the same moments when the template is re-timed. The reel's reveal is the one exception: it is warped, so its frames are counted in drawn seconds from the scene's start, and they move if its warp changes.
- Lumen, Northwind and everyone in them are fictional.
