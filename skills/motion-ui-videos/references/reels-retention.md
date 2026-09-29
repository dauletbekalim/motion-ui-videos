# Reels: built for retention

How to edit a 9:16 reel (1080×1920, 30 fps, for Instagram Reels, TikTok and YouTube Shorts) so people stop, stay and understand. Nobody chose to watch it, so it is edited the opposite way to a showcase: the payoff or a specific claim first, something visibly changing every 1.5–3 s, and an ending that loops into the start. Before any reel, read §2 (the first second), §10 (the reading floor) and §11 (the length). Read §3 when writing hooks, §5–6 when cutting to a rhythm or a beat, §7 for punch captions, §8–9 for sound, voice and music, §12 for the ending and the call to action, §13 when the user shares retention analytics, and §14 for a complete worked 18 s reel. §1 is the evidence behind the rules, and §15 is the checklist. One rule sits above all of it: speed must never beat reading. A 29 s cut of the launch reel this skill comes from was "too fast", and the ~37 s version that kept the how-it-works section was right.

## Contents

1. [What the platforms reward](#1-what-the-platforms-reward)
2. [The first second](#2-the-first-second)
3. [Three hooks, then test them](#3-three-hooks-then-test-them)
4. [Curiosity gaps and open loops](#4-curiosity-gaps-and-open-loops)
5. [Rhythm: something changes every 1.5–3 s](#5-rhythm-something-changes-every-153-s)
6. [Cutting to a beat grid](#6-cutting-to-a-beat-grid)
7. [Punch captions](#7-punch-captions)
8. [Sound off and sound on](#8-sound-off-and-sound-on)
9. [Music: in-app audio, licensed tracks, the synthesized bed](#9-music-in-app-audio-licensed-tracks-the-synthesized-bed)
10. [The reading floor](#10-the-reading-floor)
11. [Length: choices and honest tradeoffs](#11-length-choices-and-honest-tradeoffs)
12. [Payoff, call to action, and the loop](#12-payoff-call-to-action-and-the-loop)
13. [Reading retention analytics](#13-reading-retention-analytics)
14. [Worked example: an 18 s product reel](#14-worked-example-an-18-s-product-reel)
15. [Pre-publish retention checklist](#15-pre-publish-retention-checklist)
16. [Sources](#sources)

## 1. What the platforms reward

The three platforms say similar things in public. Build for these, not for folklore. What it means for the edit comes first, and the evidence is under it. The ad studies quoted here date from 2016–2021: use them for direction, not as 2026 benchmarks.

- **The first 3 seconds decide whether the rest counts.** Instagram's skip rate and Shorts' "swiped away" both measure exactly that window.
- **Watch time and finishing matter, so every second must earn the next one.** A replay adds watch time and, on all three platforms, another view. A clean loop is worth building (section 12).
- **Sends are the growth signal.** Make at least one moment that a viewer would send to a specific person ("this is what I meant about our notes"). Don't ask for it with bait. Meta has demoted posts that goad people into likes, shares and comments since December 2017.
- **Original, clean files.** In 2021 Instagram said it would make Reels "visibly recycled from other apps" (a TikTok watermark, say) less discoverable. Its April 2026 rules add that watermarks, minor crops and basic reposts are unlikely to count as original. Export a separate clean file per platform with `scripts/encode.mjs`, and never re-upload a file downloaded from another app.

**Instagram.** Adam Mosseri said in early 2025 that "the top three signals that matter most for ranking are watch time, likes and sends", and that "likes are slightly more important for connected content, and sends are slightly more important for unconnected content". Unconnected means people who don't follow you yet, which is where a product reel has to grow. Instagram's own ranking explainer says the most important predictions for Reels are how likely you are to reshare it, watch it all the way through, like it, and go to its audio page. In August 2025 Reels insights gained a skip rate (the share of views that skipped during the first 3 seconds) and a retention graph. Mosseri's own advice to creators opens with "the first three seconds of a reel are super important."

**TikTok.** TikTok's explainer of the For You feed gives one example of a strong signal: "whether a user finishes watching a longer video from beginning to end" carries more weight than weak signals such as the viewer and creator being in the same country.

**YouTube Shorts.** Shorts analytics show "Shown in feed" (how often the Short appeared) and "Viewed vs. swiped away" (how often people chose to watch rather than scroll past). Since 31 March 2025 a Shorts view counts every time a Short starts to play or replay, with no minimum watch time. The older, stricter count lives on as "Engaged views", which is what monetization uses. eMarketer reported the change as bringing Shorts in line with how TikTok and Instagram count.

**Ads research points the same way.** Meta and Nielsen found (2016, feed video ads) that up to 47% of a video campaign's value was delivered in the first three seconds, and up to 74% in the first ten. TikTok's ad guidance, citing Kantar, says 90% of ad recall impact is captured in the first six seconds, and advises introducing the value proposition in the first three.

## 2. The first second

At 30 fps the first second is 30 frames. Spend them like this:

| time | what must be true | why |
|---|---|---|
| frame 0 | something is already moving; the frame reads as a picture on its own | the feed shows frame 0 as the viewer lands; a still or black frame looks like a loading error |
| by 0.3 s (frame 9) | text on screen, readable | in a 2019 Verizon Media and Publicis survey (self-reported, US adults), 69% said they watch video with the sound off in public. The hook has to be read. |
| by 0.5 s | the payoff is visible, or a bold specific claim is fully on screen | the swipe decision is being made now; promise the reward before asking for attention |
| by 1.0 s | a second change (second title line, a highlight, a camera punch) | proves the video moves, not just the first frame |
| by 3.0 s | the first piece of the promised payoff has been delivered | this is the window the skip rate and "swiped away" measure |

How to get there with the template:

- **Motion in frame 1.** Start the scene partway through a move. `Camera` eases every segment with `EASINGS.inOut`, which starts from rest, so put its first key before 0 (`{ t: -0.5, …, scale: 1.12 }` easing to 1.0 at `t: 1.0`): frame 0 is then a third of the way in, near full speed. Stagger UI elements in from slightly negative start times with `stagger()` and `pop()` for the same reason. Never fade in from black: a fade spends 0.3–0.5 s showing nothing.
- **Payoff or claim up front.** Show the finished result (the answer found, the dashboard filled, the file shipped) and put the claim on it in a `KineticTitle` at mark `title: 0`. A specific claim ("every decision, one search away") beats a generic one ("the best notes app"), because only a specific claim can be checked, and so believed. Every claim must be true of the user's product. No invented numbers.
- **No logo intro.** A logo sting spends the decision window on something the viewer doesn't care about yet. The brand is already there in frame 0: the product's own UI, colors and type. The logo belongs on the `EndCard`.
- **Frame 0 works as a thumbnail.** Some surfaces show it before playback starts. It needs the product, a readable word or two, and no half-faded element. If `KineticTitle` is still invisible on frame 0 in the still, start it a hair earlier (`start={m.title - 0.05}`).
- **Sound on frame 1.** Put a hit on 0.0 (`thump` plus the beat's first `kick`), so the swipe lands on a downbeat. Keep it felt rather than loud: Meta found (2016, feed video ads) that 80% of people react negatively when a feed video ad plays loudly when they don't expect it.

Check it before anything else:

```bash
node scripts/stills.mjs reel --at 0,0.3,0.5,1,2 --safe
node scripts/sheet.mjs reel
```

Read the sheet: is frame 0 a picture you would stop for? Is the claim readable by 0.3 s? Is it inside the safe zone?

## 3. Three hooks, then test them

Nobody, you included, can predict which hook wins. Write three that differ in kind, not in wording, and let the platform decide. Keep everything after the hook identical, so the test measures the hook and nothing else.

Hook kinds that work for products:

| kind | frame 0 shows | example (a notes app) |
|---|---|---|
| payoff + claim | the finished result, with the claim on it | "every decision / one search away" over the found note |
| pain question | the problem at its most recognizable | "where did we / decide that?" over a pile of chat bubbles |
| contrarian / specific | an unexpected statement about the viewer's world | "your notes app / is a graveyard" over a list of stale notes greying out |
| before/after | a split: the messy way, then the product's way | "3 tools / or 1" |
| number | a true, surprising number from the product | only if it is true and you can show it |

Rules for all three: at most 3–4 words per line, two lines at most, a verb or a question, the viewer's language (the consequence, not the feature name), and nothing that the next 3 seconds can't start to deliver.

**Build variants as cuts, not copies.** Copy the `reel` entry in `cuts.json` to `reel-b` and `reel-c`, identical except for the id. Each becomes its own composition. The hook scene picks its words with `useCut()`:

```tsx
const HOOKS: Record<string, [string, string]> = {
  reel: ['every decision', 'one search away'],
  'reel-b': ['where did we', 'decide that?'],
  'reel-c': ['your notes app', 'is a graveyard'],
};
const [line1, line2] = HOOKS[useCut()] ?? HOOKS.reel;
```

In `sound/score.mjs`, stack the new ids on the reel's case in the switch of `score()` (`case 'reel-b': case 'reel-c': case 'reel':`), so all three get the same score. Then render them one at a time. Parallel renders can take a small machine down.

```bash
node sound/design.mjs --all
npx remotion render src/index.ts reel-b out/reel-b.mp4 --codec h264 --crf 18 --audio-bitrate 256k
npx remotion render src/index.ts reel-c out/reel-c.mp4 --codec h264 --crf 18 --audio-bitrate 256k
```

**How to test:**

- **Instagram:** post the variants as trial reels. Trial reels are shown to non-followers first. Insights (views, likes, comments, shares) arrive about 24 hours later, and you can let Instagram share a trial with followers automatically if it performs well on views in its first 72 hours. Compare skip rate and average watch time.
- **TikTok and Shorts:** post variants a few days apart, at the same time of day, or run them as a paid split test. Compare the first 3 s of TikTok's retention graph, and "Viewed vs. swiped away" on Shorts.
- **Working heuristics, not platform rules:** wait at least 48 hours before judging, don't compare variants with under ~1,000 views each, and treat differences of a few points as noise. Keep the winner's hook kind for the next reel. That is how you learn the audience.

## 4. Curiosity gaps and open loops

Loewenstein's information-gap theory describes curiosity as the feeling of a gap between what you know and what you want to know. It also says a small dose of information makes curiosity stronger, not weaker. A reel uses both halves:

- **Open the gap with a partial answer.** The hook shows that the product found the decision, but not how. The viewer now wants the "how". That "how" is your middle section, which is why a reel must never drop it.
- **Close every loop you open, and close the main one by ~70% of the runtime.** In an 18 s reel, the "how" is answered by about 6.5 s and the payoff lands by 12 s. A loop that never closes feels like clickbait: people leave, and they don't trust the next reel.
- **One main loop, at most one small one inside it.** A `Badge` counting "1/3" steps, or a `Callout` pointing at something that will change later, carries attention through the middle. Two big loops at once split attention.
- **Deliver the first installment by 3 s.** If the hook promises "one search", the search box should appear inside 3 s. A promise kept too late reads as a bait-and-switch, and it shows up as a cliff at 3–6 s (section 13).

Devices in the template: a result shown blurred under `Focus` and sharpened at the payoff; a `Counter` that stops short and finishes at the payoff (true numbers only); a `Callout` saying "watch this" on the element that is about to change; `Typed` text that stops mid-word before a cut.

## 5. Rhythm: something changes every 1.5–3 s

A working heuristic, not a platform rule: in a product reel, something visibly changes every 1.5–3 s, and never more than 3 s passes without a change. Front-load the density. The hook can change every 0.5 s, and the payoff can breathe at 2–3 s.

Don't make it a metronome. Cutting, DeLong and Nothelfer analyzed 150 Hollywood films (1935–2005) and found that shots became more correlated in length with their neighbors over time, with patterns approaching 1/f, like the rhythms of human attention. Vary the spacing in phrases (2, 2, 1, 1, 0.5, 0.5, 2) instead of a flat grid, and group fast changes around the moments that matter.

Pattern interrupts, in the order to reach for them:

| interrupt | in the template | when |
|---|---|---|
| a new element arrives | `Toast`, `Badge`, `Callout`, a `Cursor` entering, a panel popping in with `pop()` | first choice: it is also product information |
| camera punch-in | `Camera` keys: a jump from 1.0 to 1.15–1.3 on a beat, the second key one frame after the first (a cut, not a move); or a fast push of at least 0.2 s (6 frames) with blur tied to its speed. Hold, then ease back in 0.4 s | to point at what the caption names |
| scale-jump cut | the next scene starts at scale 1.15 and settles to 1 with `pop()` | on scene cuts |
| caption style change | a single word at 110 px after a run of 3-word lines | at story turns ("gone.") |
| speed ramp | a `warp` segment going from 2.5× to 0.75× | inside a reused showcase scene |
| light or color change | a `Backdrop` glow shift, or a 0.1 s accent flash | sparingly, at most one per 2 s |
| sound drop | remove the beat for 0.5–1 s | once per reel, just before the product answers |

A punch-in on a beat reads as a cut without cutting. Anything between one frame and 5 frames reads as neither: a 0.15 s zoom at 30 fps is 4.5 frames, under the 5-frame floor ([motion-language](motion-language.md) §3), and with no motion blur it stutters.

```tsx
const { W, H, fps } = useStage();
const keys = [
  { t: 0, x: W / 2, y: H / 2, scale: 1 },
  { t: m.hit, x: W / 2, y: H / 2, scale: 1 },
  { t: m.hit + 1 / fps, x: target.x, y: target.y, scale: 1.25 }, // the jump: one frame, reads as a cut
  { t: m.hit + 1.2, x: target.x, y: target.y, scale: 1.25 },     // hold while the caption reads
  { t: m.hit + 1.6, x: W / 2, y: H / 2, scale: 1 },              // out, slower
];
// a fast push instead: the third key at m.hit + 0.2 (6 frames at 30 fps), with blur of about a quarter
// of the pixels moved per frame, capped at 12 px, as in the whip recipe (motion-language §11)
```

Flashes have a hard limit: WCAG 2.3.1 says nothing should flash more than three times in any one second, unless the flash stays below the general and red flash thresholds. Keep an accent flash to one 0.1 s pulse at 30% opacity, never saturated red, and never repeat it within 2 s:

```tsx
const flash = t >= m.hit ? 0.3 * (1 - prog(t, m.hit, 0.1, EASINGS.linear)) : 0;
// <AbsoluteFill style={{ background: C.accent, opacity: flash }} />
```

## 6. Cutting to a beat grid

Picture and sound in this template read the same numbers, so a reel can be cut to a beat exactly. Choose the tempo first, then place marks on the grid.

**Pick a tempo that lands on frames.** At 30 fps, a beat is a whole number of frames at 90 BPM (20 frames), 100 (18), 120 (15), 150 (12) and 180 (10). 120 BPM is the default: a beat every 0.5 s and a 4-beat bar every 2 s, which matches the 1.5–3 s change rhythm. Tempos like 128 BPM put beats between frames. That is harmless (a cut can only land on a frame anyway), but choose a clean tempo when you can.

**The rules:**

- **Scene cuts land on beats**, and the big section changes on downbeats (0, 2, 4… s at 120 BPM).
- **The biggest hits go on downbeats**: the hook slam, the reveal, the payoff chime, the end card.
- **Product events ride the beats in between**, and in the "how" section the UI sounds can play the backbeat instead of the snare (the example in section 14 does this).
- **The beat serves the picture.** If pinning a mark to a downbeat would make typing run at 2.5×, pin it to the nearest beat instead. Nobody notices a click on beat 3. Everybody notices superhuman typing.

**Put marks on the grid.** For reel-native scenes, write marks at multiples of 0.5 in `cuts.json`, and set scene lengths so scene starts land on beats. With `cross: 0.1`, each scene starts `seconds − 0.1` after the previous one, so a 2 s slot is `"seconds": 2.1`. Print the result to check every mark in cut time:

```bash
node sound/timeline.mjs reel
```

**Pin a reused scene's marks to beats with warp knots.** A warp knot is `[drawnSec, sceneSec]`. To make a showcase mark land on a reel beat, put a knot at `[beatTimeInScene, markSec]`. The sound follows automatically, because `at()` inverts the warp. Worked numbers are in section 14.

**The beat bed.** The template's reel already has one: `beat(k, { bpm: 120 })` in the reel's case of `score()` puts a kick on 1 and 3, a soft backbeat on 2 and 4 and hats on the eighths between. Its grid runs through the reveal's hit. The demo's hook and problem play without it (each on its own hits), and it drops in on the reveal; with two bars or more before the reveal, it would groove from the second scene and drop out for the bar before the reveal while a riser builds into it. It rests half a bar before every `settle` mark, so the payoff lands as the beat comes back (in the demo on beat 3; the cut to the end card is the downbeat), and stops on `ctaIn` with a last kick and an open hat. Change the tempo there, or pass `anchor`, `from`, `to`, `rests` or `final` ([sound-design](sound-design.md) §12). To write your own bed (a different drop, a bed from frame 0), replace that call, never add to it; the hand-built version is in [sound-design](sound-design.md) §12:

```js
// sound/score.mjs, in the reel's case, instead of beat(k, { bpm: 120 }); beats, kick, hat and snareish are already imported
beats(120, 36).forEach((t, i) => {             // 0, 0.5 … 17.5: every beat of an 18 s reel
  const n = i % 4;                              // 0 = downbeat
  if (n === 0 || n === 2) place(mix, kick({ seed: i }), t, { gain: n === 0 ? 1 : 0.7 });
  if (n === 1 || n === 3) place(mix, snareish({ seed: i }), t, { gain: 0.8 });
  place(mix, hat({ seed: i }), t + 0.25, { gain: 0.8, pan: 0.2 });   // off-beat eighths
});
```

The kit is voiced to sit under the clicks at gain 1, so the UI sounds stay on top, and the design report warns when the beat layer gets louder than the UI sounds. Keep it that way.

## 7. Punch captions

`Captions` with `variant: 'punch'` shows 1–3 words at a time, big, each chunk landing whole in the text color with a calm settle from 0.96. It is the reel's narrator. With `lit` it also lights each word in turn in the accent, karaoke style. That fits a reel with a voiceover (word times from its transcript, section 8) or words cut to a beat grid (section 6). Without either there is nothing for the lit word to follow, and it reads as auto-captions from an editing app, one of the clearest "generated reel" signals, which is why it is off by default.

These numbers are working defaults for 1080 px wide, not platform rules:

| property | value | why |
|---|---|---|
| words per cue | 1–3 | readable in one fixation, no eye travel |
| size | 84–110 px; 92 is the component's fallback; 110 for a single word | big enough to read at a glance while the thumb moves; below about 84 px a punch chunk starts to look like UI text ([captions-and-type](captions-and-type.md) §2) |
| weight | 800 (the component's) | thin strokes break up under feed compression |
| emphasis | the whole chunk in the text color; at most one accent word per two or three cues (`*word*`), chosen by meaning | a lit word per beat is karaoke; without a voice to sync to, it is noise, and it spends the accent on every cue |
| line length | ≤ 14–16 characters at 92 px on one line | avoids wrapping mid-phrase |
| `maxWidth` | 780 (the fallback) | 150 px clear on both sides: clears the right-rail buttons and keeps the caption centred |
| vertical position | a band above the product (`top` about 300–480; the component's fallback is 330, and the demo's `phoneLayout()` puts the product under it); the lower band (`top` about 1140) only when the caption ends above y ≈ 1250 | the eye enters the frame high, and the post text and any ad CTA grow up from the bottom; inside the reel safe zone (`FORMATS.reel.safe`) either way |
| contrast | light text on a dark scene, or a soft dark shadow behind it | captions sit over moving UI |

For a reel with a voice or a beat grid, `<Captions variant="punch" lit … />` turns the word lighting on; the words are paced over the cue as they are without it (see [captions-and-type](captions-and-type.md) §8), so put cue times on the voice's or the grid's marks.

Keep the caption band in one place for a whole scene. Eyes learn where to look, and a moving caption costs reading time. Move it only as a deliberate interrupt, or when the UI needs the space.

In a showcase scene reused in the reel, give the reel its own block in `src/captions.json`, and time its cues on drawn time with `drawn`. The scene stays one line, because `useCues()` reads the block of the cut being played:

```jsonc
// src/captions.json
"reel": {
  "search": { "punch": true, "drawn": true, "cues": [   // seconds as drawn in the reel, not the scene's warped seconds
    { "at": 0.2, "text": "search once" },
    { "at": 1.5, "text": "there it is" },
    { "at": 2.5, "text": "with your team" }
  ] }
},
"showcase": {
  "search": { "cues": [{ "at": "searchIn", "text": "Search every note at once." }] }
}
```

```tsx
<Captions {...useCues()} />   // punch in the reel (upper band, 92 px, 780 wide), calm in the showcase (60 px, top 84)
```

If the reel may be boosted as an ad, design to the stricter zone from the start. Meta's guidance for Reels ads is to keep roughly the top 14%, the bottom 35% and 6% on each side free of text and logos. At 1080×1920 that is 269 px, 672 px and 65 px, so captions stay between y ≈ 270 and y ≈ 1248.

Two more rules:

- **Burned-in captions replace auto-captions.** Tell the user to leave the platform's auto-captions off for this post, or the viewer gets the same words twice.
- **Check symbol glyphs on a still.** Web fonts are often subset, and ⌘, → or ✓ can silently fall back to another font. Spell it out ("search once") or check the still.

Deeper type rules (scale per format, localization, SRT) are in [captions-and-type](captions-and-type.md).

## 8. Sound off and sound on

Design both, because both audiences are large, and they are often the same person at different times.

- **Sound off is the floor.** Verizon Media and Publicis (2019 survey, self-reported, 5,616 US adults) found that 69% watch video with sound off in public and 25% even in private, and that 80% are more likely to watch a whole video when it has captions. In Meta's own tests (2016, feed video ads), captioned video ads increased view time by 12% on average, and in one study 41% of video ads were basically meaningless without sound.
- **Sound on is where TikTok lives.** In a Kantar study for TikTok (2021, TikTok users), 88% said sound is essential to the experience, and 73% said they would stop and look at an ad with audio.

What that means in practice:

- **The contact sheet must tell the story as a comic strip.** Render `node scripts/stills.mjs reel --marks` and `node scripts/sheet.mjs reel`, then read only the sheet. If the story doesn't come through, a muted viewer won't get it either.
- **Nothing essential lives only in the sound.** No claim that is only spoken, no reveal that is only heard.
- **Sound confirms what the picture shows.** A click lands on the frame the button presses, a key on the frame each character appears, a chime when the result is found. With sound on, the product feels responsive, and that is the point of UI sound. See [sound-design](sound-design.md).
- **Loudness.** Master reels to about −14 LUFS integrated with true peak at or below −1 dBTP in the delivered file (the template's defaults: it holds the WAV at −2 dBTP to leave room for the AAC encode). Check the rendered file with `node scripts/check.mjs out/reel.mp4`.

### A voice in the reel

In a 2026 feed, a motion-only product reel reads as an ad next to creator content. A voice, or a face, is the most common way pros change that, and it changes the edit:

- **Pace.** 160–190 words per minute, faster than a showcase's 140–160, with the first word within 0.3 s. Silence at the start is a reason to swipe.
- **Say what the screen doesn't.** The spoken hook complements the on-screen hook instead of reading it out: text "every decision, one search away", voice "you know that thing you decided last week?"
- **Captions follow the voice.** With speech, punch captions may light word by word (`lit`), on word times from a transcript of the take (any speech-to-text tool that writes word timestamps; ask before installing one). Put those times on marks, so words, keys and voice share one clock.
- **A face in the first 2 s** (the founder talking to camera, or over the UI) is worth offering when the user can record one: 2–3 s, then cut to the product.
- **Text-to-speech.** Audition 2–3 voices that aren't the tool's default, direct the pacing with punctuation (commas for breaths, full stops for weight), and prefer the founder's own voice when they'll record. Never clone a voice without its owner's consent, and when a real person's voice is cloned, check each platform's rules for labelling synthetic media (YouTube and TikTok both ask creators to disclose realistic AI-generated content).
- **Mix.** The voice leads, the bed ducks under it, and raw takes go through a processing chain first ([sound-design](sound-design.md) §14). A voice can't go through a `warp`, so a reel with a voice gets its own unwarped scenes or its own lines.

## 9. Music: in-app audio, licensed tracks, the synthesized bed

There are three ways to put music under a reel. Each needs a different export.

**1. Platform audio added in the app (trending sounds).** Many creators add a trending sound for reach. Using a platform sound also links the reel to that sound's audio page, and Instagram lists "go to the audio page" among its most important Reels predictions. Two catches:

- **Business accounts are restricted.** On TikTok, business accounts only get the Commercial Music Library, because the general library isn't cleared for commercial use. Instagram also limits which music business accounts can use. Ask the user which account type they post from before planning around a trending song.
- **Export a version without music.** Render the SFX-only layers, so the in-app track doesn't fight a second beat. A solo run writes its own file and leaves the full mix alone, so put it under the finished render instead of rendering the picture again:

```bash
ONLY=sfx,whoosh node sound/design.mjs reel     # → public/sound-reel-sfx+whoosh.wav: no beat, no pad
npx remotion ffmpeg -y -i out/reel.mp4 -i "public/sound-reel-sfx+whoosh.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest out/reel-sfx.mp4
node scripts/check.mjs out/reel-sfx.mp4
```

The master gain is fixed, so the SFX-only file keeps exactly the levels it had in the full mix. Only the music is gone, and the file measures a couple of dB under the full mix, which is right: the added song goes on top. In the app, the user lowers the added track until the clicks still read. In PowerShell, set and clear the variable in one line: `$env:ONLY='sfx,whoosh'; node sound/design.mjs reel; Remove-Item Env:ONLY`.

**Cut to the song you will add.** Find its tempo, set `beats(bpm, …)` and the marks to that grid, and put its first downbeat at 0.0. In the app, the user picks the section of the song that starts on a downbeat. The alignment will be close, not frame-exact, and that is fine: the SFX carry the exact hits.

**2. A licensed track the user owns.** Check that the license covers social posts (and ads, if the reel will be boosted). Set the grid to the track's tempo and mix it under the SFX, as described in [sound-design](sound-design.md). On YouTube, Shorts longer than a minute have extra music limits: most songs are limited to 30 or 60 seconds, and some can run up to 90 seconds in a Short of up to 3 minutes. Keep licensed-music Shorts under a minute unless the user has checked.

**3. The synthesized bed (a tempo guide and a fallback).** `kick`, `hat`, `snareish` and `pad` from the engine, on `beats()`. There are no licensing questions, it follows every edit, and it can drop out for a sound interrupt. But a minimal coded kit on its own can read as a placeholder loop, so recommend options 1 or 2 as the music layer, and keep the kit quiet under the UI sounds (the hand-built kit in [sound-design](sound-design.md) §12 at gain 0.5 or under). The worked example uses it so it is complete. Deliver both files: the full mix, and the SFX-only version for in-app audio.

## 10. The reading floor

This is the lesson this skill was built on. The launch film's first reel was cut to 29 s and felt "too fast": viewers couldn't read it. At about 37 s, with the how-it-works section kept, it worked. A second failure mode came up in the same project: a reel that states the problem and then just says "we solve it" explains nothing. Speed that kills comprehension also kills retention, because confused viewers either leave or scrub back. YouTube reads a rewatch spike as either interest or confusion.

The floors:

- **Punch cue or short label** (1–4 words: a caption chunk, a toast, a badge the viewer must read): on screen for at least max(0.5 s, 0.33 s × words). One word gets 0.5 s, three words 1.0 s, and a 4-word toast 1.33 s. This follows the BBC subtitle rate of 160–180 words per minute (about 0.33–0.375 s per word). The 0.5 s minimum is a working heuristic: the eye needs time to land before it reads.
- **A sentence** (5 words or more: calm captions, an end card, a UI line the viewer must read): at least (words ÷ 3) + 1 s, the skill's rule from the launch film. The extra second is for finding the text and looking back at the picture.
- **Dense text** (URLs, code, numbers): count characters too. Netflix caps adult subtitles at 20 characters per second. Treat that as a ceiling, not a target.
- **Word budget:** total words on screen ≤ 2.5 × seconds. That is a working heuristic: 3 words/s is the reading ceiling, and the viewer also has to look at the product. An 18 s reel carries at most ~45 words. Aim for 30–40.

```ts
// quick check for a scene's punch cues: every cue must hold at least its floor
const floor = (text: string) => Math.max(0.5, text.trim().split(/\s+/).length / 3);
cues.forEach((c, i) => {
  const hold = (cues[i + 1]?.at ?? sceneSeconds) - c.at;
  if (hold < floor(c.text)) console.warn(`"${c.text}" holds ${hold.toFixed(2)} s, needs ${floor(c.text).toFixed(2)} s`);
});
```

When the words don't fit the time, fix it in this order: cut words, then cut a section (the feature list goes first), then add seconds. Never speed up the "how".

Then check with your eyes: render a still at the last frame of each caption (`--at`). If you can't read it aloud in the time it is on screen, it's too fast.

## 11. Length: choices and honest tradeoffs

Platform limits are no longer the constraint: YouTube Shorts accept up to 3 minutes (since October 2024), and Instagram takes reels far longer than that, though it says reels over 3 minutes aren't recommended to people who don't follow you ([delivery-and-platforms](delivery-and-platforms.md) §3). The question is how long this idea needs.

| length | what fits | tradeoff |
|---|---|---|
| 6–10 s | one visual payoff, often a loop: a micro-interaction, a before/after | the highest share of viewers finish and replay, but there's no room to explain; works for a known product or one feature, not an introduction |
| 15–20 s | one idea, one "how" step shown, one payoff (section 14) | the length for a one-step how; ~30–40 words of captions |
| 22–30 s | two "how" steps | needs a turn or a new question around the midpoint |
| 30–40 s | a mechanism that needs 3–4 steps shown | fewer finish, more total watch time; needs a re-hook (a new question or turn) every ~8–10 s. The launch reel this skill comes from landed at ~37 s. |
| 45–90 s | a mini tutorial or a founder story | needs a voice or a strong story; the curve will slope; best for people who already care |
| 1–3 min | long explainers | rarely right for a product reel; on Shorts, music limits apply past a minute |

How to choose honestly:

- **The "how" sets the length, not the platform.** Count the steps the viewer must see to believe it works: one step fits in 15–20 s, two in 22–30 s, three or more in 30–40 s. Past 40 s is tutorial territory.
- **Shorter is not automatically better.** TikTok names finishing a longer video as a strong signal. A 37 s reel that people finish and understand beats a 20 s reel they skip at second 8.
- **When in doubt, make two cuts.** Make a tight version and a complete one, from the same scenes (`reel` and `reel-long` in `cuts.json`), and test them the way you test hooks.

## 12. Payoff, call to action, and the loop

**The payoff lands by ~70% of the runtime.** In an 18 s reel that means about 12 s: the moment the problem from the hook is visibly solved, with its sound (a chime, the one bounce of the scene). Everything after it is a bonus for the viewers who stay.

**The call to action comes after the payoff, never before.** "Follow for more" or a URL at the start is a reason to swipe. At the end, one short card is enough: `EndCard` with the product name, the URL and one action, held 2.5–3.5 s (5–7 words is a sentence, so (words ÷ 3) + 1 s). Retention always drops at an end card, because it signals "over". Keep it short. Show the URL small during the payoff too, and say it in words people can remember ("lumen.example", "link in bio").

A URL in a reel can't be tapped, so make the call to action something the platform can do:

- **Instagram:** "link in bio", or a DM keyword ("dm me 'notes'") if the user runs keyword replies. Never "comment YES"-style bait, which Meta demotes (section 1).
- **TikTok:** "search <product name>".
- **YouTube Shorts:** set the Short's related video to the full showcase, and say that the full demo is linked.
- **Stories:** the link sticker ([formats](formats.md) §9).

**Or skip the end card.** A small name + URL lockup that appears with the payoff and stays to the last frame (inside the safe box), with the call to action in the post text or a pinned comment, avoids the "it's over" signal and keeps the loop running into the replay.

**Endings that loop.** A finished short usually replays on its own. If the last frame flows into the first, the replay feels like a continuation, and viewers stay for part of a second pass. Ways to build it:

- **Match cut:** the last 0.6–0.8 s rebuilds frame 0's composition (the end card lifts away, and the app rises into the exact hook layout). The hook's title then slams in again on the replay.
- **Motion continuity:** the camera move at the end continues into frame 0's move, at the same speed and direction.
- **Sound bridge:** a rising swell that peaks on the last frame (a `whoosh` with `peak: 0.95`, about 6 dB under the UI sounds), resolved by the hook's `thump` at 0.0. A `riser` works too, but a film gets about one riser, so spend it on its biggest build. The engine's `master()` fades the last 0.25 s out by default, so for a looping cut turn that fade off, or the swell dies before the thump: `sound/design.mjs` calls `master(mix, { gainDb, ceiling: CEILING, hp })` in two places, and both need `fadeOut: 0` for that cut (for example `fadeOut: cut === 'reel' ? 0 : undefined`).
- **Ambient elements:** anything idle (a breathing glow, a blinking caret) runs on `useDrawnTime()` with `loopT(t, period)`, and the period must divide the reel's length, so the last frame matches the first.

Check the seam on stills: `node scripts/stills.mjs reel --at 0,17.96` (the last frame of an 18 s reel at 30 fps is at 17.967 s), then put them side by side in a sheet. Apart from the title, which re-slams, they should match.

## 13. Reading retention analytics

Read the graph the platform gives you. Map the second where people leave to the mark at that second. Fix that one moment, and post again.

**Where to look:**

- **Instagram:** open the reel, then View insights. Look at skip rate (views that skipped in the first 3 s), average watch time, the retention graph, and sends/shares and likes against reach. Mosseri's advice is to watch average watch time, likes per reach and sends per reach. On the retention graph, Instagram's guidance is that the line always slopes down, but the flatter it is, the more engaged the audience.
- **TikTok:** TikTok Studio, then Analytics, then Content, then the video. Look at average watch time, watched full video, total play time, the retention graph, and traffic sources (For You versus Following versus Search).
- **YouTube Shorts:** YouTube Studio, then Content, then Shorts, then Analytics. Look at "Shown in feed", "Viewed vs. swiped away", views versus engaged views, and audience retention. Replays can push retention past 100%. YouTube's key-moments definitions describe the shapes: spikes are moments rewatched or shared, dips are moments skipped or where viewers stopped watching, a flat line means people watched that part from start to finish, and a gradual decline means interest fading over time.

Compare against the account's own history, not internet benchmarks. Audiences, topics and account sizes differ too much for a universal "good" number.

**From a second to a cause:** print the timeline (`node sound/timeline.mjs reel`), find the mark at or just before the drop, render that moment (`node scripts/stills.mjs reel --at 8.4,8.6`), name what the viewer sees there, and change that one thing.

| the curve | usually means | change |
|---|---|---|
| cliff in 0–3 s (high skip rate, low "viewed") | the first frame didn't earn the stop: a still open, a logo, a fade from black, vague words, text arriving late | payoff or claim in frame 0; motion from frame 1; text by 0.3 s; test the other hook kinds (section 3) |
| good first 3 s, then a cliff at 3–6 s | the hook's promise isn't kept fast enough, or a slow setup follows | deliver the first piece of the payoff by 3 s; cut the setup; make beat 2 answer beat 1 |
| a dip at one specific second | a dead spot: a pause, an unreadable caption, a confusing jump, a frame that looks like an ending | fix that moment; add a new element 0.3–0.5 s before it |
| a spike at one moment | delight or confusion | if it's a dense caption or a fast move, slow it to the reading floor; if it's delight, put a version of it in the hook |
| an even slope all the way down | nothing pulls the viewer forward | open a loop in the hook and close it by ~70%; add a re-hook at the midpoint; cut 10–20% of the length |
| a drop just before the end card | viewers sense the ending | land the payoff later; shorten the card to ≤ 3 s; show the URL during the payoff; build the loop |
| the curve ends high, or average watch time is over 100% | the loop works | keep it; try a shorter version |
| strong retention, few sends | watchable, but not useful to anyone in particular | make one moment about one person's specific pain; no "share this" bait |
| strong hook metrics, low reach | a distribution problem, not a craft problem | clean per-platform export (no other app's watermark), check the account type's music rules, check the platform's account status page |

Change one thing per repost, and write down what you changed and what moved. After three or four reels, that log is worth more than any benchmark.

## 14. Worked example: an 18 s product reel

The product is the template's fictional notes app for small teams (`BRAND` in `src/theme.ts`: Lumen, "One calm place for your team's notes."). There is one idea (find any decision), one "how" (search, find, share), and one payoff (the whole team sees the same answer). It runs 18.0 s, 1080×1920 at 30 fps, on a 120 BPM grid: a beat every 0.5 s, a bar every 2 s, nine bars.

This is a plan for a new reel in the user's project. The scene ids `searchHook`, `chatChaos` and `teamPayoff` are new scenes written to these marks. `how` and `end` are the showcase's scenes, reused. The template's own `reel` cut is another finished reel of the same shape, with its own scenes and marks. Print it with `node sound/timeline.mjs reel` before you edit it.

### The cut

```json
"reel": {
  "format": "reel",
  "cross": 0.1,
  "sound": true,
  "scenes": [
    { "id": "searchHook", "seconds": 2.1, "marks": { "title": 0.0, "line2": 0.5, "answer": 1.0, "push": 1.5 } },
    { "id": "chatChaos", "seconds": 3.1, "marks": { "bubble1": 0.0, "bubble2": 0.5, "bubble3": 1.0, "pile": 1.5, "search": 2.0, "typeStart": 2.1, "typeEnd": 2.5, "none": 2.6 } },
    {
      "id": "how",
      "seconds": 5.1,
      "marks": {
        "click1": 2.0, "noteIn": 2.1, "typeStart": 2.7, "typeEnd": 3.7, "listIn": 3.9,
        "keys": 4.6, "paletteOpen": 4.8, "paletteTypeStart": 5.3, "paletteTypeEnd": 5.8, "paletteSelect": 6.1, "shareOpen": 6.6,
        "click2": 8.3, "join1": 8.6, "join2": 8.8, "join3": 9.0, "click3": 9.8, "toast": 9.9, "shareClose": 10.6,
        "cursorsIn": 11.3, "teamTypeStart": 11.9, "check1": 12.6, "teamTypeEnd": 13.1
      },
      "warp": [[0, 4.2], [0.5, 4.8], [1.5, 6.1], [2.5, 8.6], [3.5, 9.8], [5.1, 11.0]]
    },
    { "id": "teamPayoff", "seconds": 4.1, "marks": { "pull": 0.0, "cursors": 0.5, "check": 2.0, "promise": 2.5 } },
    { "id": "end", "seconds": 4.0, "marks": { "logo": 0.2, "title": 0.35, "url": 0.8, "ctaIn": 1.1, "loop": 3.2 } }
  ]
}
```

The arithmetic: with `cross: 0.1` (3 frames, which reads as a hard cut but hides a one-frame pop), scenes start at 0.0, 2.0, 5.0, 10.0 and 14.0. The total is 18.4 − 4 × 0.1 = 18.0 s. The section changes at 0, 2, 10 and 14 are downbeats. The cut into `how` at 5.0 is on beat 3, which is allowed: every cut lands on a beat.

The `how` entry copies the showcase entry's whole `marks` object. The scene component reads all of them, and `useMarks()` throws on a mark the cut doesn't define. The warp plays scene seconds 4.2–11.0 (⌘K, the palette, and sharing the note with the team) in 5.1 drawn seconds, and pins four marks to beats:

| mark | scene s | drawn s | cut s | segment speed |
|---|---|---|---|---|
| `paletteOpen` | 4.8 | 0.5 | 5.5 (beat) | 1.2× from 4.2 |
| `paletteSelect` | 6.1 | 1.5 | 6.5 (beat) | 1.3×: typing stays human ("share", 5 characters in 0.39 s) |
| `join1` | 8.6 | 2.5 | 7.5 (beat) | 2.5×: squeezes the pause while the cursor travels to "Invite team" |
| `click3` | 9.8 | 3.5 | 8.5 (beat) | 1.2×: the three avatars ripple in 0.17 s apart |
| end | 11.0 | 5.1 | 10.1 | 0.75×: slows the end so the toast and the joined team hold 1.47 s before the cut |

The template's `How` scene is laid out for 16:9 only, draws calm captions and shows an 8-word toast ("Link copied. Anyone at Northwind can open it.", whose floor is 3.7 s). Before reusing it in a 9:16 cut, give it a portrait layout from `useStage()` (the editor and the dialog stacked and bigger, not the whole browser), punch captions for reel cuts (section 7), and a 2-word toast in the reel ("Link copied."), the way `Reveal` and `End` already lay themselves out for both shapes.

Two lessons are in that table. `paletteSelect` is on beat 3, not a downbeat, because pinning it to 6.0 would make the typing run at 2.6×. And the last segment runs slower than real time: a warp can also stretch a hold when the reading floor needs it.

One trap: marks outside the warped window still resolve, by extending the end segments. `node sound/timeline.mjs reel` prints `click1` (scene 2.0 s) at cut 3.17 s, which is inside `chatChaos`, and `check1` at 12.23 s, inside `teamPayoff`. For a reused scene, the score may only place sounds on marks between the first and last knot's scene seconds (here 4.2–11.0).

### Second by second

| cut s | scene · mark | picture | caption | sound | beat |
|---|---|---|---|---|---|
| 0.00 | searchHook · `title` | frame 0: the Lumen `Window`, palette open, three results staggering in (0.05 s apart); `Camera` already mid-move, 1.12 → 1.0; `KineticTitle` "every decision" slams in at y ≈ 310 | (the title) | `thump` + `kick` | bar 1 · 1 |
| 0.50 | · `line2` | `KineticTitle` "one search away" slams in below it, y ≈ 440 | (the title) | `pop` A5 | 2 |
| 1.00 | · `answer` | `Highlight` sweeps the top result: "Pricing: free for up to 5 people" | | soft `click` | 3 |
| 1.50 | · `push` | `Camera` punch-in 1.0 → 1.12 in 0.3 s onto the result | | short `whoosh`, under | 4 |
| 2.00 | chatChaos · `bubble1` | cut: a chat bubble "did we decide pricing?" pops in at scale 1.2 → 1 | "we decided it" | `kick` + a `tick` | bar 2 · 1 |
| 2.50 | · `bubble2` | a bubble "thursday call?" | | a `tick` | 2 |
| 3.00 | · `bubble3` | a bubble "check the doc?" | "lost in chat" | a `tick` | 3 |
| 3.50 | · `pile` | six more bubbles pile in 0.06 s apart, slightly tilted | | one short `whoosh` for the whole pile | 4 |
| 4.00 | · `search` | cut to a grey search field; `Typed` "pricing" (2.1–2.5) | | the beat drops out; a `key` per character | bar 3 · 1 |
| 4.60 | · `none` | "No results" fades up; colors desaturate; the only still moment | "gone." (110 px) | `tone` D#3, beating | |
| 5.00 | how · drawn 0.0 | cut to Lumen at 1.2× speed: the note, the camera easing back out | "one shortcut" (0.2) | `kick` back in | 3 |
| 5.33 | · `keys` | ⌘K pressed, shown as big keycaps | | two `key`s | |
| 5.50 | · `paletteOpen` | the palette pops open | | `pop` A5 | 4 |
| 5.88–6.27 | · `paletteTypeStart` → `End` | "share" types and the list filters | | a `key` per character | |
| 6.50 | · `paletteSelect` | "Share note" is picked | "share it" | `click` | bar 4 · 2 |
| 6.70 | · `shareOpen` | the share dialog opens (at 2.5×) | | | |
| 7.38 | · `click2` | the cursor clicks "Invite team" | | `click` | |
| 7.50–7.83 | · `join1`–`join3` | three avatars pop in, 0.17 s apart (the one bounce is saved for 12.0) | "with your team" | one `pop` (A5) for the group, on the first | 4 |
| 8.50 | · `click3`, `toast` 8.63 | "Copy link" is clicked; `Toast` "Link copied." | | `click` | bar 5 · 2 |
| 9.57 | · `shareClose` | the dialog closes; the note holds | | | |
| 10.00 | teamPayoff · `pull` | `Camera` pulls back from 1.3 to 1.0: the whole app | "whole team" (0.2) | `whoosh` falling, under; `kick` | bar 6 · 1 |
| 10.50 | · `cursors` | three `Cursor`s labelled "maya", "theo", "ines" glide in, 0.25 s apart | | one soft `tick` as the first enters | |
| 11.40 | | | "same answer" | | |
| 12.00 | · `check` | a `Badge` "decided" lands on the note: the reel's one bounce | | `chime` E6 + B6 | bar 7 · 1 |
| 12.50 | · `promise` | the pad swells | "one calm place" | `pad` | |
| 14.20 | end · `logo` | `EndCard`: "Lumen", "lumen.example", "Try Lumen free" | (the card) | `kick` + `pop` E5 | bar 8 · 1 (card at 14.2) |
| 15.10 | · `ctaIn` | the CTA button lands | | `click` | |
| 17.00 | | | | a rising swell (`whoosh`, `peak: 0.95`), 1.0 s, 6 dB under, peaking at 18.0 | bar 9 · 3 |
| 17.20 | · `loop` | the end card lifts away; the app with the open palette rises into frame 0's layout | | | |
| 18.00 | = 0.00 | the replay: the title slams in again on the `thump`, which resolves the swell | | | |

Rhythm check: the longest stretches without a change are 12.5 → 14.2 (1.7 s) and 15.1 → 17.2 (2.1 s). Both are under 3 s.

Sound check: the pitched sounds are the hook's pop (0.5), the palette's pop (5.5), the team's pop (7.5), the payoff chime (12.0) and the end card's pop (14.2), about one every 2–4 s, with the chime the only one on the payoff. Everything else is a click, a tick, a key or air. A pop on every bubble, avatar and toast would make it sound like a mobile game.

Reading check: the title and captions total 5 + 3 + 3 + 1 + 2 + 2 + 3 + 2 + 2 + 3 words, plus the 2-word toast and ~5 words on the end card. That is about 33 words in 18 s, under the 45-word budget. Every punch cue holds at least its floor ("gone." holds 0.5 s, and each 3-word cue holds ≥ 1.0 s).

This fits in 18 s only because the "how" is one step. The launch reel this skill comes from needed ~37 s, because its mechanism took several steps to show. Don't force another product into 18 s.

### The hook scene

```tsx
// src/scenes/SearchHook.tsx: register it as `searchHook` in src/scenes/index.ts
import { AbsoluteFill } from 'remotion';
import { pop, stagger } from '../lib/anim';
import { Window } from '../lib/devices';
import { Highlight, KineticTitle } from '../lib/text';
import { useCut, useMarks, useStage, useTime } from '../lib/time';
import { Backdrop, Camera } from '../lib/ui';
import { alpha, C, FONT, R } from '../theme';

const HOOKS: Record<string, [string, string]> = {
  reel: ['every decision', 'one search away'],
  'reel-b': ['where did we', 'decide that?'],
  'reel-c': ['your notes app', 'is a graveyard'],
};
const RESULTS = ['Pricing: free for up to 5 people', 'Beta goes to 40 partners first', 'Demo moved to Friday'];
const WIN = { x: 90, y: 700, w: 900, h: 620 }; // the UI may pass under the right rail; captions may not

export function SearchHook() {
  const t = useTime();
  const m = useMarks();
  const { W, H, safe } = useStage();
  const [line1, line2] = HOOKS[useCut()] ?? HOOKS.reel;
  const result = { x: WIN.x + 330, y: WIN.y + 150 };
  const camera = [
    { t: -0.5, x: W / 2, y: H / 2, scale: 1.12 }, // a key before 0: frame 0 is a third into the move, near full speed
    { t: 1.0, x: W / 2, y: H / 2, scale: 1.0 },
    { t: m.push, x: W / 2, y: H / 2, scale: 1.0 },
    { t: m.push + 0.3, x: result.x, y: result.y, scale: 1.12 }, // the punch-in on beat 4
  ];
  return (
    <AbsoluteFill>
      <Backdrop glow={0.08} />
      <Camera keys={camera}>
        <div style={{ position: 'absolute', left: WIN.x, top: WIN.y }}>
          <Window title="Lumen" width={WIN.w} height={WIN.h}>
            <div style={{ padding: 28, fontFamily: FONT.ui, fontSize: 34, color: C.text }}>
              {RESULTS.map((r, i) => {
                // pre-rolled: the stagger starts at −0.25 s, so frame 0 already shows the rows arriving
                const k = pop(t, stagger(i, 0.05, -0.25));
                return (
                  <div key={r} style={{ padding: '18px 20px', borderRadius: R.lg, background: i === 0 ? C.panel : 'transparent', opacity: k, transform: `translateY(${(1 - k) * 24}px)` }}>
                    {i === 0 ? <Highlight start={m.answer} dur={0.35} color={alpha(C.accent, 0.35)}>{r}</Highlight> : r}
                  </div>
                );
              })}
            </div>
          </Window>
        </div>
      </Camera>
      <div style={{ position: 'absolute', top: safe.top + 60, width: W, textAlign: 'center' }}>
        <KineticTitle text={line1} start={m.title} size={96} />
      </div>
      <div style={{ position: 'absolute', top: safe.top + 190, width: W, textAlign: 'center' }}>
        <KineticTitle text={line2} start={m.line2} size={96} />
      </div>
    </AbsoluteFill>
  );
}
```

Why it's built this way:

- Negative start times make frame 0 a mid-motion frame: the rows are already 60–85% arrived, and the first `Camera` key sits half a second before 0, so the push-out is near its fastest on frame 0 (every `Camera` segment eases in and out, so a key at exactly 0 would start from rest). A start at exactly 0 would give an empty or still first frame.
- The hook is two titles, each ≤ 15 characters at 96 px (about 750 px wide), so each fits in the 780 px caption width on one line.
- There are three changes in 1.5 s (the second line, the highlight, the punch-in), each on a beat.
- The words come from `useCut()`, so three hook variants share one scene and one score.

### The score

This reel places every cue by hand instead of through `byMarks()`, because its reused `how` scene has marks outside the warped window (the trap above), and the `how` cue sheet (or the naming rules) would sound them over the neighbouring scenes.

```js
// sound/score.mjs: replace the body of the reel's case in the switch of score() with this block.
// Everything here is already imported or defined in the file.
case 'reel-b':
case 'reel-c':
case 'reel': {
  const between = (t, a, b) => t >= a - 1e-6 && t < b - 1e-6;
  const mark = (scene, name) => k.scenes.find((s) => s.id === scene).marks[name];   // scene seconds, from cuts.json
  // the bed: 120 BPM, 36 beats. It drops out for "no results", and in the how the UI plays the backbeat.
  beats(120, 36).forEach((t, i) => {
    const n = i % 4;
    if (between(t, 4, 5)) return;
    if (n === 0 || n === 2) place(mix, kick({ seed: i }), t, { gain: n === 0 ? 1 : 0.7 });
    if ((n === 1 || n === 3) && !between(t, 5, 10)) place(mix, snareish({ seed: i }), t, { gain: 0.8 });
    if (t >= 0.5) place(mix, hat({ seed: i }), t + 0.25, { gain: 0.8, pan: 0.2 });
  });
  // a key on the frame each character appears: typedTimes() in this file is Typed's own timing,
  // and at() takes scene seconds and inverts the warp
  const typeKeys = (scene, text, from, to, seed) =>
    typedTimes(text, mark(scene, from), text.length / (mark(scene, to) - mark(scene, from))).forEach((sec, i) =>
      place(mix, key({ seed: seed + i, space: text[i] === ' ' }), at(scene, sec), { gain: 0.8 }));

  // hook: the swipe lands on a hit
  place(mix, thump({ f: 55 }), at('searchHook', 'title'), { gain: 0.9 });
  place(mix, pop({ f: note('A5'), seed: 2 }), at('searchHook', 'line2'), { gain: 0.6 });
  place(mix, click({ seed: 3, bright: 0.7 }), at('searchHook', 'answer'));
  place(mix, whoosh({ dur: 0.35, f0: 300, f1: 900, peak: 0.3, seed: 4 }), at('searchHook', 'push'), { gain: 0.6 });
  // problem: a tick per bubble, one whoosh for the pile (a group gets one sound), then one steady tone in the silence
  ['bubble1', 'bubble2', 'bubble3'].forEach((mk, i) =>
    place(mix, tick({ seed: 10 + i, tone: [3800, 4200, 4600][i] }), at('chatChaos', mk), { gain: 0.9, pan: [-0.3, 0.3, 0][i] }));
  placePeak(mix, whoosh({ dur: 0.4, f0: 400, f1: 1200, peak: 0.5, seed: 20 }), at('chatChaos', mark('chatChaos', 'pile') + 0.15), { gain: 0.5 });
  typeKeys('chatChaos', 'pricing', 'typeStart', 'typeEnd', 30);
  place(mix, tone({ notes: [note('D#3')], dur: 0.9 }), at('chatChaos', 'none'));
  // how: at() inverts the warp, so every sound follows the fast-forward; offsets go in scene seconds
  place(mix, key({ seed: 40 }), at('how', 'keys'));
  place(mix, key({ seed: 41, pitch: 1.1 }), at('how', mark('how', 'keys') + 0.05));
  place(mix, pop({ f: note('A5'), seed: 42 }), at('how', 'paletteOpen'), { gain: 0.8 });
  typeKeys('how', 'share', 'paletteTypeStart', 'paletteTypeEnd', 50);
  place(mix, click({ seed: 43 }), at('how', 'paletteSelect'));
  place(mix, click({ seed: 44 }), at('how', 'click2'));
  place(mix, pop({ f: note('A5'), seed: 45 }), at('how', 'join1'), { gain: 0.7 });   // one pop for the three avatars
  place(mix, click({ seed: 48 }), at('how', 'click3'));                              // the toast rides on the click: no chime
  // payoff
  place(mix, whoosh({ dur: 0.7, f0: 900, f1: 250, peak: 0.4, seed: 60 }), at('teamPayoff', 'pull'), { gain: 0.6 });
  place(mix, tick({ seed: 61 }), at('teamPayoff', 'cursors'), { pan: -0.5 });   // one tick as the first cursor enters
  place(mix, chime({ notes: [note('E6'), note('B6')], dur: 1.4, spread: 0.05 }), at('teamPayoff', 'check'), { gain: 0.9 });
  place(mix, pad({ notes: [note('E3'), note('B3'), note('F#4'), note('G#4')], dur: 5.5 }), at('teamPayoff', 'promise'), { gain: 0.8 });
  // end card, then a rising swell whose peak lands on the last frame, 6 dB under (with fadeOut: 0 in design.mjs, section 12)
  place(mix, pop({ f: note('E5'), seed: 70 }), at('end', 'logo'), { gain: 0.8 });
  place(mix, click({ seed: 71 }), at('end', 'ctaIn'));
  placePeak(mix, whoosh({ dur: 1.0, f0: 250, f1: 1400, peak: 0.95, seed: 72 }), k.end, { gain: 0.5 });
  break;
}
```

The `end` scene is shared with the showcase, so it lifts the card at `loop` only when `useCut()` is a reel cut. Read `m.loop` inside that branch only, because the showcase's `end` entry has no such mark.

### Build order

1. Write the cut into `cuts.json` and run `node sound/timeline.mjs reel`. Confirm the scene starts (0, 2, 5, 10, 14) and the pinned marks (5.5, 6.5, 7.5, 8.5).
2. Build the three new scenes. Then render `node scripts/stills.mjs reel --marks --safe` and `node scripts/sheet.mjs reel`, and read the sheet as a comic strip with the sound off.
3. Run `node sound/design.mjs reel`. Solo the bed with `ONLY=beat` to hear that the grid lands, and measure it with `sound/tools/loudness.mjs`.
4. Render: `npm run render:reel`, then `node scripts/check.mjs out/reel.mp4` (18.0 s, 30 fps, about −14 LUFS, true peak ≤ −1 dBTP).
5. Render the SFX-only version (section 9), then the hook variants `reel-b` and `reel-c`, one at a time.
6. Make the cover still and the per-platform encodes ([delivery-and-platforms](delivery-and-platforms.md)).

## 15. Pre-publish retention checklist

The first second:
- [ ] Frame 0 shows the product already moving. No black, no fade-in, no logo.
- [ ] Text is on screen and readable by 0.3 s (check the still at 0.3).
- [ ] The payoff or a specific, true claim is visible by 0.5 s.
- [ ] A second change happens by 1.0 s. The first piece of the payoff is delivered by 3 s.
- [ ] A felt hit (`thump` + `kick`) lands on 0.0, and it isn't the loudest moment of the reel.

Story and pacing:
- [ ] One idea, one "how" shown in the product's UI, one payoff. The "how" was not cut to save time.
- [ ] Every punch cue and short label holds at least max(0.5 s, 0.33 s × words), and every sentence of 5+ words (words ÷ 3) + 1 s.
- [ ] Total words ≤ 2.5 × seconds.
- [ ] The hook's loop closes by ~70% of the runtime. The payoff lands before the end card.
- [ ] Jargon is replaced by its consequence, and claims and numbers are true.

Rhythm:
- [ ] Something changes at least every 3 s. The spacing varies instead of ticking like a metronome.
- [ ] Cuts land on beats, and the biggest hits on downbeats. No typing runs faster than ~1.5× to hit a beat.
- [ ] Flashes: at most one short accent flash per 2 s, and never 3 or more in a second.

Captions and safe zones:
- [ ] Punch captions are 84–110 px and 1–3 words, `maxWidth` 780, each chunk landing whole (words lit in turn only with a voiceover or a beat grid), with at most one accent word per two or three cues.
- [ ] The caption band sits above the product, or ends above y ≈ 1250 if it sits below.
- [ ] Every caption and the key UI sit inside y 250–1470, clear of the right 150 px (`--safe` stills), or inside y 270–1248 if the reel will run as an ad.
- [ ] Symbols and fonts render correctly on the stills. The user knows to turn off platform auto-captions for this post.

Sound:
- [ ] The contact sheet tells the story with the sound off.
- [ ] Every click, key and pop lands on its mark. Whooshes sit under clicks and keys.
- [ ] Pitched sounds are rare: about one per 2 s outside the payoff, one sound per staggered group, about one riser per film.
- [ ] About −14 LUFS integrated, true peak ≤ −1 dBTP (`node scripts/check.mjs out/reel.mp4`).
- [ ] There is an SFX-only version if the user will add in-app audio, and the account type allows the music planned.

Ending and delivery:
- [ ] The end card holds 2.5–3.5 s with the name, URL and one action (or a lockup stays from the payoff to the end). The URL also appears during the payoff.
- [ ] The call to action is something the platform can do: link in bio, a search, the Short's related video, the story's link sticker.
- [ ] The loop seam matches (stills at 0 and at the last frame). The master doesn't fade the bridge sound out.
- [ ] Three hook variants are rendered and a test plan is agreed (trial reels on Instagram).
- [ ] A clean encode for each platform, with no other app's watermark, plus a cover still with everything important in the middle 1080×1440.

## Sources

Checked September 2026. Pages marked "not fetched directly" refused automated access; their figures are as quoted in search results and the secondary sources listed.

- Social Media Today, "Instagram Shares Algorithm Insights To Inform Strategy" (Mosseri, early 2025: "The top three signals that matter most for ranking are watch time, likes and sends"; likes weigh more for connected content, sends for unconnected): https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/
- Instagram, "Instagram Ranking Explained" (Reels: the most important predictions are how likely you are to reshare, watch all the way through, like, and go to the audio page; not fetched directly): https://about.instagram.com/blog/announcements/instagram-ranking-explained
- Social Media Today, "Instagram Adds Retention Metrics for Reels" (24 August 2025: skip rate is the share of views that skip during the first 3 seconds; a flatter retention line means a more engaged audience): https://www.socialmediatoday.com/news/instagram-adds-retention-insights-reels/758464/
- Adam Mosseri on Instagram, "The first three seconds of a reel are super important" (not fetched directly): https://www.instagram.com/mosseri/reel/DA0ua3-yuDg/
- Meta, "Trial Reels: Try Content With Non-Followers First" (10 December 2024: shown to non-followers first, insights after about 24 hours, optional auto-share based on views in the first 72 hours): https://about.fb.com/news/2024/12/trial-reels-try-content-non-followers-first-see-what-perfoms-best/
- MediaNama, "Instagram Extends Reels To 3 Minutes" (January 2025): https://www.medianama.com/2025/01/223-instagram-reels-3-minutes-us-tiktok-ban/
- TikTok Newsroom, "How TikTok recommends videos #ForYou" (18 June 2020; not fetched directly): https://newsroom.tiktok.com/en-us/how-tiktok-recommends-videos-for-you, quoted in Social Media Today ("whether a user finishes watching a longer video from beginning to end, would receive greater weight"): https://www.socialmediatoday.com/news/how-tiktoks-algorithm-works-as-explained-by-tiktok/580153/
- YouTube Help, "Content tab analytics tips: Shorts" ("Shown in feed"; "How many chose to view": viewed versus swiped away): https://support.google.com/youtube/answer/12942217?hl=en&co=YOUTUBE._YTVideoType%3Dshorts
- YouTube Help, "What's new in Studio Content Manager" (from 31 March 2025 a Shorts view counts each start or replay; the previous method becomes "Engaged views", used for YPP): https://support.google.com/youtube/answer/9082582
- eMarketer, "YouTube Shorts changes view count rules to match TikTok, Instagram": https://emarketer.com/content/youtube-shorts-changes-view-count-rules-match-tiktok--instagram
- YouTube Blog, "Tall updates coming to Shorts" (Shorts up to 3 minutes from 15 October 2024): https://blog.youtube/news-and-events/tall-updates-coming-to-shorts/
- YouTube Help, "Understand three-minute YouTube Shorts" (most songs limited to 30 or 60 seconds, some up to 90 seconds in a Short of up to 3 minutes; from 24 September 2026 claimed Shorts of 1–3 minutes are no longer automatically blocked): https://support.google.com/youtube/answer/15424877
- YouTube Help, "Measure key moments for audience retention" (intro, spikes = rewatched or shared, dips = skipped or stopped watching, flat line, gradual decline): https://support.google.com/youtube/answer/9314415
- Meta for Business, "Capture Attention with Updated Features for Video Ads" (with Nielsen: up to 47% of campaign value in the first 3 seconds, up to 74% in the first 10; captioned video ads +12% view time; 41% of video ads meaningless without sound; 80% react negatively to unexpectedly loud feed video ads; not fetched directly): https://www.facebook.com/business/news/updated-features-for-video-ads
- TikTok for Business, "Creative Best Practices for TikTok Ads" (introduce the value proposition in the first 3 seconds; 90% of ad recall impact within the first six seconds, citing Kantar; not fetched directly): https://ads.tiktok.com/business/en-US/blog/creative-best-practices-top-performing-ads
- Social Media Today, "TikTok Shares New Insights Into the Importance of Sound" (9 June 2021, Kantar for TikTok: 88% say sound is essential; 73% would stop and look at ads with audio): https://www.socialmediatoday.com/news/tiktok-shares-new-insights-into-the-importance-of-sound-for-marketing-promo/601569/
- Streaming Media, "80% of Video Caption Users Aren't Hearing Impaired, Finds Verizon" (69% watch with sound off in public, 25% in private): https://www.streamingmedia.com/Articles/ReadArticle.aspx?ArticleID=131860
- 3Play Media, "Verizon Media and Publicis Media Find Viewers Want Captions" (5,616 US adults aged 18–54, April 2019; 80% more likely to watch an entire video with captions): https://www.3playmedia.com/blog/verizon-media-and-publicis-media-find-viewers-want-captions/
- Meta for Business, Instagram Reels video ad specs (keep roughly the top 14%, bottom 35% and 6% on each side free of text and logos; not fetched directly): https://www.facebook.com/business/ads-guide/update/video/instagram-reels
- Meta, "News Feed FYI: Fighting Engagement Bait on Facebook" (18 December 2017: posts that goad people into likes, shares and comments are demoted): https://about.fb.com/news/2017/12/news-feed-fyi-fighting-engagement-bait-on-facebook/
- Tubefilter, "Instagram Will Begin Making Reels Including A TikTok Watermark 'Less Discoverable'" (February 2021): https://www.tubefilter.com/2021/02/10/instagram-reels-with-tiktok-watermark-less-discoverable/
- PetaPixel, "New Instagram Policies Target Reposted Content" (30 April 2026: "Watermarks, minor crops, or basic reposts are unlikely to qualify as 'original'"): https://petapixel.com/2026/04/30/new-instagram-policies-target-reposted-content/
- TikTok Help Center, "Commercial use of music on TikTok" (business accounts use the Commercial Music Library; the general library isn't cleared for commercial use; not fetched directly): https://support.tiktok.com/en/business-and-creator/creator-and-business-accounts/commercial-use-of-music-on-tiktok
- Instagram Help Center, "Access to the licensed music library on Instagram" (not fetched directly): https://help.instagram.com/402084904469945/; business-account limits as explained by Tripepi Smith, "Navigating the Use of Music in Instagram Reels for Business Accounts": https://tripepismith.com/insights/music-in-reels-business-accounts/
- TikTok Creator Academy, "Understanding TikTok Analytics for Creators" (average watch time, watched full video, retention; not fetched directly): https://www.tiktok.com/creator-academy/en/article/tool-analytics-intro
- BBC Subtitle Guidelines (160–180 words per minute, about 0.33–0.375 s per word; not fetched directly): https://www.bbc.co.uk/accessibility/forproducts/guides/subtitles/, as quoted by Clevercast, "BBC Subtitling Guidelines": https://www.clevercast.com/bbc-subtitling-guidelines/
- Netflix, "English (USA) Timed Text Style Guide" (adult programs up to 20 characters per second): https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide
- W3C, "Understanding Success Criterion 2.3.1: Three Flashes or Below Threshold": https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- Cutting, J. E., DeLong, J. E. & Nothelfer, C. E. (2010), "Attention and the Evolution of Hollywood Film", Psychological Science 21(4) (150 films, 1935–2005: shot lengths increasingly correlated with their neighbors, approaching 1/f): https://pubmed.ncbi.nlm.nih.gov/20424081/
- Loewenstein, G. (1994), "The Psychology of Curiosity: A Review and Reinterpretation", Psychological Bulletin 116(1) (curiosity as a response to an information gap; a small priming dose of information increases it): https://www.cmu.edu/dietrich/sds/docs/loewenstein/PsychofCuriosity.pdf
