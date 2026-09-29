---
name: motion-ui-videos
description: Makes rendered videos about a software product in code with Remotion, with its real UI rebuilt as components, a cursor working it, captions, and sound synthesized on the exact frame. Covers 9:16 reels, TikToks and Shorts built for retention; 16:9 launch films and showcases; feature and changelog clips; seamless UI loops (mp4, webm, gif) for landing pages and READMEs; App Store and Play previews; and stories. Use whenever someone wants any video of their app, site, SaaS or dev tool (promo, launch video, teaser, demo, animated walkthrough) or a cover or thumbnail for one; asks for an "Apple-style", "After Effects style" or "Product Hunt" video; or wants click, whoosh or typing sounds for such a video, including from audio they send, even if they never say Remotion. Not for editing existing footage (Premiere, Resolve, CapCut), animations in a live web app (CSS, Framer Motion) or a Figma prototype, AI-generated clips, audio-only work like a podcast intro, videos not about software, or a chart as a GIF.
compatibility: Node 18.12+ and npm. Remotion brings Chrome Headless Shell and ffmpeg (on Linux, install Chrome's shared libraries first); the first render downloads Chrome (about 270 MB on disk) and fetches Google Fonts, so it needs a connection. Optional Python 3 with numpy and opencv-python-headless for tracing raster logos, and Pillow for mascot cutouts and logo diffs.
---

# Motion UI videos

This skill makes videos about software using nothing but the software itself: its interface rebuilt as components so every part can move, a cursor that works it the way a person would, a camera that leans in on what matters, captions that say what is happening, and sound synthesized in code with every click, key and whoosh on the frame its moment happens.

Everything is code, picture and sound alike. That gives you three things no editor timeline does: any change is an edit and a re-render; picture and sound read the same timeline (`src/cuts.json`) so they cannot drift; and you can check your own work by rendering stills and measuring loudness, which matters because you cannot watch or hear the result.

The template in `template/` is a working project: copy it, render it, then replace the demo product with the user's.

## What good looks like

There are three bars, and a video has to clear the one its format demands:

- **Comprehension (every format, first).** Someone who has never heard of the product gets it on the first watch. Films made by people who know the product pass too fast and lean on jargon. The launch film this skill comes from started at 37 s and only very technical viewers followed it. Re-paced to 62 s, with one plain sentence per beat, it worked.
- **Retention (reels, shorts, stories).** The feed decides in the first second. Motion in frame one, the payoff or a specific claim up front, text on screen by 0.3 s, something new every 2 s or so. But speed never beats reading: a 29 s reel of that same film was "too fast", and 37 s with the how-it-works kept was right.
- **Taste (always).** Calm, precise motion: one thing moves at a time, everything eases, at most one bounce. Sound that is soft and crisp, never hissy or repetitive, sitting under the picture. You would only notice it if it were gone.

## Pick the format

| the user says | make | start from | read first |
|---|---|---|---|
| "reel", "tiktok", "shorts", "something for instagram" | 9:16 reel, 15–40 s, retention-first. The how sets the length: one step shown ≈ 15–20 s, two ≈ 22–30 s, three or more ≈ 30–40 s | cut `reel` | [reels-retention §2](references/reels-retention.md#2-the-first-second), [§10](references/reels-retention.md#10-the-reading-floor), [§11](references/reels-retention.md#11-length-choices-and-honest-tradeoffs) |
| "launch video", "product video", "for youtube", "product hunt" | 16:9 showcase, 45–120 s, comprehension-first | cut `showcase` | [showcase-16x9 §2](references/showcase-16x9.md#2-the-story-spine), [§4](references/showcase-16x9.md#4-the-pacing-rule) |
| "for our landing page" | the film behind a play button, and offer a muted hero loop above it | cuts `showcase` + `loop` | [showcase-16x9 §12](references/showcase-16x9.md#12-landing-page-poster-muted-loop-the-full-film) |
| "show off this feature", "changelog", "what's new" | feature clip, 8–20 s, 16:9 or 1:1 | a new cut on the `square` or `showcase` format, reusing one scene | [formats §5](references/formats.md#5-feature-spotlight-changelog-clip) |
| "hero animation", "loop for the site/docs", "gif for the README", "dribbble shot" | seamless UI loop, 4–10 s (up to about 15 s for a longer flow), muted | cut `loop` | [formats §6](references/formats.md#6-ui-micro-interaction-loop) |
| "story", "link in story", "waitlist story" | 9:16 story, 5–15 s, CTA + link-sticker space | cut `story` | [formats §9](references/formats.md#9-916-story-with-a-cta-and-link-sticker) |
| "app store preview", "play store video" | app preview, 15–30 s: real screen recordings, no cursor, no device frame | a new cut on the `appstore` format | [formats §7](references/formats.md#7-app-store-and-google-play-previews) |
| "cover", "thumbnail", "banner", "og image" | stills | the `cover` and `thumbnail` stills, plus new `<Still>`s | [formats §14](references/formats.md#14-stills-covers-thumbnails-banners-og-images) |
| anything else: a feed post, tutorial, teaser, metrics, event, investor demo, or "all of it" (showcase + reel + story + stills) | see the full router | | [formats §1](references/formats.md#1-router-what-they-ask-for-what-you-make) |

When in doubt, ask one question: where will this be posted? The answer picks the format, and the format picks the rules.

Only a script, storyboard or caption list? Do steps 1–2, deliver the scene table (scene, seconds, captions, what's on screen, key sounds), and stop. Don't set up the project until they ask for the video.

## Workflow

1. Brief: what, for whom, where, how long
2. Learn the product, write the story as captions
3. Set up the project from `template/`
4. Build the scenes
5. Look at stills before trusting anything
6. Sound in code, from the user's references if they have any
7. Iterate on what the user sees and hears
8. Derive the other cuts
9. Render, check, deliver

Show work early and often: a scene table, then stills, then a first render. Early looks are cheap to change and late ones are not. The user may want to steer every step or may say "do all of it"; either way the scene table and a contact sheet are worth showing before a full render.

Loops are the exception: no captions, no sound, no end card. Skip the captions in step 2 and all of step 6, and prove the machine with `npm run render:loop` instead of the reel.

The references are long (5–12k words each). Each opens with a Contents list (pitfalls, with a table by symptom), and most say which section to read for which job. Read the section a step names, not the whole file. Open a whole reference only when the job is mostly that topic (a sound-only pass, a platform-spec question).

### 1. Brief

Get the few answers that change the video, and default the rest:

- **Where it will be posted** (sets format, length, captions and loudness). Default: a 16:9 showcase plus a 9:16 reel cut.
- **Who watches** (developers, buyers, investors, the general public). Default: someone who has never heard of the product.
- **The one thing a viewer should remember**, and the call to action (sign up, waitlist, download, star).
- **Brand material**: the repo, the landing page, a deck, logos, fonts. Read before asking.
- **Sound references.** Say this early: "If you have sounds you like (a whoosh, a click, a keyboard, a mood), send them as files and I'll make the video's sounds from them." A recording they love beats any description. See [audio-references](references/audio-references.md).
- **Partners or supporters to credit**: only with their consent (see Honesty below).

### 2. Learn the product and write the story

Read what exists before inventing anything: the product's repo (UI components, strings, design tokens, fonts, icons), its landing page, any deck, its brand files. Pull out the one-line promise, the problem it solves, how it works step by step, a few features, and the call to action. How to read a repo for this: [ui-recreation §2](references/ui-recreation.md#2-read-the-products-repo-first).

Write the video as captions, one plain sentence per beat. The spine that works for products:

| beat | job | example |
|---|---|---|
| hook | the payoff, shown in the product's own UI with the hook sentence over it; or the world as it is now | "Your team writes everything down." |
| problem | shown in 2–4 short sentences, not told | "Then it ends up in five different apps." / "And nobody can find it when it matters." |
| reveal | name plus one-line promise | Lumen: "One calm place for your team's notes." |
| how it works | the product's own UI, step by step | "Start a note in one click." / "Share it with your team in two clicks." / "Then write it together, live." |
| features | one at a time (drop these first in a reel) | "See who's in a note, live." / "Find any note, instantly." |
| close | headline, URL, call to action | Lumen · lumen.example · "Try Lumen free" |

The examples are the template demo's own lines: its showcase in `template/src/captions.json`, and the close from `BRAND` in `template/src/theme.ts`.

- Get the product on screen in the first seconds. A cold open on its payoff is the default for anything that autoplays to skimmers; open on the problem only when the value makes no sense without the pain first ([showcase-16x9 §2](references/showcase-16x9.md#2-the-story-spine)).
- Replace jargon with its consequence: "merge conflict" becomes "their changes crash into each other", and "merge time" becomes "untangle it by hand".
- Match the brand's voice and casing exactly.
- Frame for the real audience. One founder saw their film made a team product look single-user and had every label changed ("alice's agent", not "alice"). Check who the product is for before you write.
- **Pacing:** a sentence (calm captions, an end card, a toast of 5+ words) holds at least (words ÷ 3) + 1 s. A punch chunk or short label (1–4 words) holds at least max(0.5 s, words ÷ 3). A reel carries at most 2.5 words per second in total. Let the picture finish its move before the next caption arrives: viewers read and track the cursor with the same eyes. When unsure, go slower. Full table: [captions-and-type §8](references/captions-and-type.md#8-reading-time).

Put the plan in the project's README as a scene table (scene, seconds, captions, what's on screen, key sounds) and keep it current. The lines themselves go in `src/captions.json`, by cut and scene, timed on marks: the scenes draw them from there (`useCues()`), and `scripts/captions.mjs` turns the same lines into caption files.

### 3. Set up the project

Copy `template/` into the user's repo as `video/`, its own npm package outside the product's build. Leave out what a copy of the skill may carry from earlier runs: `node_modules/`, `out/`, `sound/test/out/` and `public/sound-*.wav` can add up to more than a gigabyte, and the demo's renders and WAVs look like deliverables.

```bash
rsync -a --exclude node_modules --exclude out --exclude 'public/sound-*.wav' <skill dir>/template/ video/   # macOS, Linux ("out" also covers sound/test/out)
robocopy "<skill dir>\template" video /E /XD node_modules out /XF sound-*.wav                             # Windows
```

Run every command below from `video/`. Check free disk space, then `npm install`. `remotion.config.ts` renders 2 frames at a time on a machine with 16 GiB of RAM or less, and Remotion's default (half the CPU threads) above that. Then prove the toolchain with a 3-second render before changing anything: `npm run render:reel -- --frames=0-89` exercises Chrome, ffmpeg, fonts and the sound pass in about a minute. Then read `video/README.md`: its "where to edit what" table is the fastest map of the project.

- **Time is in seconds.** Every duration, mark, crossfade and warp knot is in seconds. Frames exist only at the boundary, so a 60 fps showcase and a 30 fps reel share scenes and marks, and the sound engine reads the same numbers.
- **`src/cuts.json` is the timeline.** Each cut (composition) has a format, a crossfade, and scenes with `seconds`, named `marks`, and an optional `warp`. Scenes read their times with `useMarks()`, and the sound engine places sounds on the same marks. To re-time a moment, edit one number.
- **`src/theme.ts` and `src/fonts.ts` are the brand.** Put the product's colors, radii and fonts there. Load real fonts: a render that starts before fonts load silently uses a fallback. A brand font that isn't on Google Fonts: `npx remotion add @remotion/fonts`, files in `public/fonts/`, see [brand-and-assets §2](references/brand-and-assets.md#2-brand-tokens-into-themets-and-fontsts).
- **Every frame is a pure function of time.** No `Math.random()` or `Date` in scenes; use `rand(seed)`. Renders are then identical, and the sound engine can recompute the same "random" layout.
- **Formats** live in `src/formats.ts` (size, fps, safe zones). `useStage()` tells a scene its frame shape and safe margins, so one scene can lay itself out for 16:9 and 9:16.
- **Licensing:** Remotion is free for individuals and companies of up to three people. Bigger companies need a company license, so mention it.

### 4. Build the scenes

**Replace the demo without breaking the build.** The demo's scenes, their shared `src/scenes/common.tsx`, and `Cover` and `Thumbnail` (both imported by `src/Root.tsx`) import from `src/product/`, and every bundle, `scripts/stills.mjs` included, compiles all of them. So either keep the demo compiling and build the user's UI beside it in `src/product/<name>/`, with new scene ids, or remove it in one go:

1. Delete the demo cuts you won't use from `src/cuts.json`, and their scenes from `src/scenes/index.ts` and `src/scenes/`.
2. Rewrite `Cover` and `Thumbnail` for the new product (or drop their `<Still>`s from `src/Root.tsx`).
3. Delete demo files in `src/product/` once nothing imports them. `npm run typecheck` says what still does.
4. In `sound/score.mjs`, delete or rewrite the `SHEETS` entry of any demo scene id you reuse, or give your scene a new id. A demo id plays its demo cue sheet whenever the cut has the marks that sheet `needs` (a new `hook` with `title` and `fragmentsIn` gets sixteen fragment whooshes and pops).
5. Replace the `TYPED` entries with the strings your scenes type (key `'<cut>/<scene>/<typeStartMark>'`). `node sound/test/run.mjs` fails while demo strings are listed that no longer appear in `src/`.
6. Replace the demo's lines in `src/captions.json`. `node scripts/test.mjs` fails on a block whose scene is not in its cut.

Rebuild the product's interface as components in `src/product/`, from its real layout, strings and tokens, not screenshots. Components move, stay sharp under a camera push-in, and can show states the real app rarely shows at once. Use real screen recordings (`<OffthreadVideo>`) only when the product can't be rebuilt, such as complex canvases or real data flows, and for App Store previews, which must be real captures. See [ui-recreation](references/ui-recreation.md), and [§8](references/ui-recreation.md#8-cursor-choreography) for the cursor.

The vocabulary, with numbers, is in [motion-language](references/motion-language.md) ([§1](references/motion-language.md#1-the-short-version) is the short version). In short:

- `Cursor` glides on eased curves between waypoints, slows into its target, presses and releases on a click, and never teleports.
- `Typed` types at a human rate with seeded jitter; keystroke sounds land on each character.
- `Camera` pushes in on the subject (about 1.0 → 1.1 over 1.2 s) and pulls back between beats. `Focus` dims everything else.
- `pop()` springs settle with at most one overshoot. Stagger groups by 40–90 ms.
- `Captions` carry the narration: `calm` for showcases, one sentence at a time, each arriving as a whole line (`Line`); `punch` for reels, 1–3 words at a time, big, each chunk landing whole, in a band above the product. Two effects are opt-in, because on every line they read as a template: the per-word blur-rise (`Words`, or `arrival="words"` on a caption), for at most two moments, the promise and the end headline; and word-by-word lighting (`lit`), only with a voiceover or words cut to a beat. See [captions-and-type §10](references/captions-and-type.md#10-calm-and-punch-captions).
- Scenes join with a hard cut on action by default (`cross` 0–0.1 in `cuts.json`). Inside a scene, a layout morph (a row growing into the editor) beats any transition. Save a dissolve for time passing ([motion-language §11](references/motion-language.md#11-transitions)).
- `KineticTitle` is the reel's first-frame slam. `Counter`, `Highlight`, `Callout`, `Toast` and `EndCard` cover the rest.
- Ambient loops (breathing, idle bobs) run on `useDrawnTime()`, so a warped clock never makes them shiver.

Name every event a sound or another scene depends on as a mark in `cuts.json` (`click1`, `typeStart`, `reveal`, `cardIn2`…).

### 5. Look at stills before trusting anything

You cannot watch the video, so look at it frame by frame:

```bash
node scripts/stills.mjs reel --marks                    # a still at every mark and scene midpoint
node scripts/stills.mjs reel --marks --safe             # the same, with the platform's safe zones drawn
node scripts/sheet.mjs reel                             # tile them, with gaps, in pages of 12
node scripts/sheet.mjs reel --safe                      # tile the safe-zone set
```

Then read the pages one at a time: `out/sheet-reel-p1.png`, `-p2`… (`out/sheet-reel-safe-p1.png`… for the safe set), or `out/sheet-reel.png` when there are 12 stills or fewer. A whole sheet of 60-odd tiles reaches you shrunk until no caption is readable; a page (4 portrait or 3 landscape tiles across) stays under 1,600 px wide. Tiles must have gaps between them, because touching tiles merge text from neighbouring frames into one line and fool you. Check for clipped or overlapping text, anything a `Camera` push pushes off-frame, captions readable at the moment they finish arriving, fonts loaded, logos crisp, captions and buttons clear of platform UI, and the seam of a loop (first frame = last frame). Do it again after every layout or timing change. The full list: [review-and-qa §5](references/review-and-qa.md#5-what-to-check-in-every-sheet).

### 6. Sound in code

`sound/design.mjs` synthesizes every sound, places it on a mark from `cuts.json`, and masters to `public/sound-<cut>.wav`, which the composition plays. Code beats a sound library here because each sound lands on its exact frame, follows every edit, and can be tuned by measurement. On the real film, the founder preferred the coded score to an AI re-score; treat generated music as a reference to analyze unless the user prefers it.

- **Placement.** Every cue sits on a mark (`sound/score.mjs`). A scene without a cue sheet is scored from its mark names (`click1`, `typeStart`, `cardIn2`…), so it has sound from the start; write its sheet once the picture settles. A demo scene id keeps its demo cue sheet: rewrite it or rename the scene. Palette and placement: [sound-design §3–4](references/sound-design.md#3-the-palette).
- **Taste, from real feedback:** soft over bright, a fresh variant for every use, steady tones over glitches, subtle keys, whooshes under clicks and keys, one sound per event, and few pitched sounds (a pop on every arrival sounds like a mobile game). Why each: [sound-design §10](references/sound-design.md#10-taste-rules-and-the-feedback-behind-them).
- **Targets:** reels about −14 LUFS, showcases −16 to −18 (the template aims at −17), true peak ≤ −1 dBTP in the delivered file (the WAV is held at −2, so the AAC encode stays under).
- **You cannot hear, so measure.** Solo a layer (`ONLY=sfx node sound/design.mjs reel`; in PowerShell `$env:ONLY='sfx'; node sound/design.mjs reel; Remove-Item Env:ONLY`), then use `sound/tools/loudness.mjs` and `sound/tools/spectrogram.mjs`, and report changes in dB and plain words. The user is the ears: they can scrub and listen in `npm run studio` (refresh after each `node sound/design.mjs <cut>`) or play `public/sound-<cut>.wav` directly. Close Studio before a final render on a small machine.
- **Reels and music:** deliver the full mix and an SFX-only version, since people add trending audio in the app. In-app audio or a licensed track makes the better music layer; the engine's beat is a quiet tempo guide and a fallback ([sound-design §13](references/sound-design.md#13-music-strategy)).

**When the user sends audio they like**, it becomes the brief. Keep the files in `sound/refs/` (gitignored: most stock licenses forbid sharing the raw files) and follow these steps:
1. Analyze each file (`node sound/tools/analyze.mjs`, a spectrogram) and describe it back in plain words.
2. Cast each reference to the moments whose character it fits.
3. For a whoosh: save it as `sound/refs/whoosh.<ext>` (wav, mp3, ogg, m4a, flac, aif) or point `WHOOSH_REF` at it, run `node sound/design.mjs <cut>`, and confirm the report's `placed` line says whooshes were grown from that file. That one file drives every whoosh the score places. Under any other name it is ignored.
4. Everything else stays synthesized until you wire it in: play a recording as itself with its peak on the move (right for one or two uses), grow variants for a second family of moves, and model percussive references (keys, clicks) from their measured bands ([audio-references §6–8](references/audio-references.md#6-play-as-recorded-peak-on-the-move)). `sound/tools/grow.mjs` on the command line only previews variants (in `out/grown/`); nothing plays its files.
5. Level-match to what was there, show the reference and the result as spectrograms side by side, tell the user which sounds changed and which are still synthesized, and ask them to listen.

### 7. Iterate on what the user sees and hears

Feedback arrives as feelings. Translate it, change one thing at a time, and report what changed in numbers.

| they say | usually means | try |
|---|---|---|
| "too fast", "couldn't read it" | captions under the reading floor | raise holds to the floor for their kind (a sentence (words ÷ 3) + 1 s, a punch chunk max(0.5 s, words ÷ 3)); cut a section before speeding up the how |
| "I don't get what it does" | the "how" is told, not shown | add or restore the how-it-works scene in the product's UI |
| "boring", "slow start" (reel) | no payoff in the first second | lead with the outcome or a specific claim; a KineticTitle in frame one |
| "looks like a template", "looks AI-made" | blur on every entrance, words lit one by one with no voice, a dissolve on every join, a pop on every arrival | whole-line captions, static punch chunks, cuts on action, one sound per group |
| "too much", "overwhelming" (sound) | one layer too loud, long or bright; or the whole mix too loud | solo to find it: that layer −3 to −6 dB, shorter tails, a darker band; the whole mix: the cut's fixed gain (`--fit`) |
| "it's the same sound repeated" | one sample reused | grow a unique variant for every use |
| "glitchy", "unstable" | random gating, crushed noise | steady tones, even rhythm |
| "the before version was better" | the change lost something | revert first, then change one thing at a time |

Every sound complaint and its fix: [sound-design §11](references/sound-design.md#11-feedback-to-fix). If you have a memory, save the user's taste (pace, sound, type). It carries into their next video.

### 8. Derive the other cuts

One project should serve every platform. Three ways, in order of preference:

- **Re-layout** for another shape: scenes read `useStage()` and stack panels, enlarge type, and move captions into the safe zone. Same timing, same soundtrack. Vertical is a re-layout, never a letterbox. Leave film grain off on phone cuts, because feed compression smears it.
- **Reel-native scenes** reusing the product components: faster, bigger, a pattern interrupt every ~2 s, punch captions. This is the right default for a reel.
- **Warp** a showcase scene onto a faster clock (a `warp` on the scene in `cuts.json`), squeezing pauses hardest and key moments least. The sound follows by inverting the warp. Keep the section that shows how the product works. A reel that states the problem and then just says "we solve it" explains nothing.

### 9. Render, check, deliver

```bash
npm run render:showcase                          # sound, then the film
npm run render:reel
npm run render:loop                              # muted, no sound pass
node scripts/check.mjs out/reel.mp4              # duration, fps, size, loudness, true peak
node scripts/encode.mjs instagram out/reel.mp4   # a clean copy per platform: H.264 High, limited-range BT.709
# add --max-mb N only when an upload path caps the size (a ~10 MB upload tool: 9; GitHub 10 MB; Discord 20 MB),
# then check text sharpness on stills pulled from that copy
node scripts/encode.mjs webm out/loop.mp4 --mute # for a landing page <video>
node scripts/encode.mjs gif out/loop.mp4         # palette GIF for docs/README
node scripts/captions.mjs showcase               # .srt (YouTube, LinkedIn), .vtt and a .txt transcript from src/captions.json
```

The loop's web MP4, its poster and the embed: [formats §6](references/formats.md#6-ui-micro-interaction-loop). Render one video at a time: Chrome plus bundling uses a lot of memory, and parallel renders can take a small machine down. Check a few stills from the final file, not just the preview. Deliver with whatever file-sending tool you have. Say what each file is for (the reel, the SFX-only version, the cover), and put copies where the user will find them. Platform sizes, safe zones, covers and encoding presets: [delivery-and-platforms §1](references/delivery-and-platforms.md#1-the-short-version).

## Honesty and consent

- **Credit only organisations that agreed**, in the words they agreed to. "Supported by" plus a logo tells viewers they formally back the product. A friendly call with someone who works there is not that, so leave them out or ask them first.
- **No fake proof.** Don't show invented counters, metrics, testimonials or customer logos. A waitlist counter with a hidden head start is fake proof: show the true number or none.
- **Logos as their owners draw them:** official vectors, their colors, not redrawn. See [brand-and-assets](references/brand-and-assets.md).
- **Downloading third-party assets** (logos, fonts, stock audio) is the user's call. Ask first.
- **Generated imagery** is fine for textures and backgrounds. Never fake the product itself.

## Working on modest machines

Render one video or stills batch at a time, prefer stills and contact sheets over full renders while iterating, and keep generated files out of git. `remotion.config.ts` and `scripts/stills.mjs` render 2 frames at a time on 16 GiB of RAM or less (Remotion's default is half the CPU threads); close Studio during renders. Check free disk space before the first render and before long ones: Chrome, the renders and their temp files all land on disk, and a script that calls Remotion's `bundle()` without an `outDir` leaves about 50 MB in the temp folder every run. Crashes and full disks: [pitfalls §20](references/pitfalls.md#20-crashes-freezes-or-a-full-disk) and [§34](references/pitfalls.md#34-the-disk-fills-up-with-remotion-webpack-bundle-folders). On Windows, watch paths with spaces and CRLF line endings in scripts.

## Reference files

Open each when:

- [formats](references/formats.md): the ask isn't a plain reel or showcase, or one project must serve several platforms. Start at §1, the router.
- [reels-retention](references/reels-retention.md): any 9:16 cut. §2 and §10 before writing; §14 is a worked 18 s reel.
- [showcase-16x9](references/showcase-16x9.md): a 16:9 film, a voiceover, or a landing-page embed. §2–§4 before writing.
- [ui-recreation](references/ui-recreation.md): rebuilding the product's screens, fake data, cursor paths, screen recordings.
- [motion-language](references/motion-language.md): timing a scene, or a sheet that looks busy or stiff. §1 first.
- [captions-and-type](references/captions-and-type.md): writing or placing any caption, or text that is hard to read on a still.
- [sound-design](references/sound-design.md): anything about the soundtrack: placing cues, levels, music, voiceover, stems.
- [audio-references](references/audio-references.md): the user sent audio files.
- [brand-and-assets](references/brand-and-assets.md): logos, fonts, colours, mascots, partner credits, stock or generated media.
- [delivery-and-platforms](references/delivery-and-platforms.md): a platform number decides something (size cap, safe zone, codec, cover). §1 first.
- [review-and-qa](references/review-and-qa.md): checking stills, motion, sound or the final file, and turning feedback into edits.
- [pitfalls](references/pitfalls.md): anything errors, flickers, drifts or renders silent. Start at its symptom table.
- `template/`: the working starter project (see its README for commands).
