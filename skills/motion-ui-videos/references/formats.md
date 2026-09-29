# Formats: the catalog and the router

Which format to make and what shape to give it. Read §1 (the router) whenever the ask isn't a plain reel or showcase, then only the section of the format you picked: each one has who it is for, the platform numbers (checked September 2026, sources at the end), beats in seconds, pacing and captions, sound, how to build it from the template, and the mistakes that keep happening. Read §2 before adding a cut of your own, and §16 when one project must serve several platforms. [delivery-and-platforms](delivery-and-platforms.md) is the authority on platform specs.

## Contents

1. [Router: what they ask for, what you make](#1-router-what-they-ask-for-what-you-make)
2. [From a format to a cut](#2-from-a-format-to-a-cut)
3. [9:16 reel, TikTok, YouTube Shorts](#3-916-reel-tiktok-youtube-shorts)
4. [16:9 product showcase, launch film](#4-169-product-showcase-launch-film)
5. [Feature spotlight, changelog clip](#5-feature-spotlight-changelog-clip)
6. [UI micro-interaction loop](#6-ui-micro-interaction-loop)
7. [App Store and Google Play previews](#7-app-store-and-google-play-previews)
8. [1:1 and 4:5 feed posts](#8-11-and-45-feed-posts)
9. [9:16 story with a CTA and link sticker](#9-916-story-with-a-cta-and-link-sticker)
10. [Tutorial, walkthrough, onboarding](#10-tutorial-walkthrough-onboarding)
11. [Kinetic-typography announcement or teaser](#11-kinetic-typography-announcement-or-teaser)
12. [Data and metrics motion](#12-data-and-metrics-motion)
13. [Event promo: feed post, story, QR card](#13-event-promo-feed-post-story-qr-card)
14. [Stills: covers, thumbnails, banners, OG images](#14-stills-covers-thumbnails-banners-og-images)
15. [Investor and demo-day product demo](#15-investor-and-demo-day-product-demo)
16. [One source, many cuts](#16-one-source-many-cuts)
17. [Sources](#sources)

## 1. Router: what they ask for, what you make

| they ask for | make | start from | length | read next |
|---|---|---|---|---|
| "a reel", "tiktok", "shorts", "something for instagram" | 9:16 reel (§3) | `reel` cut | 15–40 s: the how sets it (§3) | [reels-retention](reels-retention.md), [captions-and-type](captions-and-type.md) |
| "launch video", "product video", "for youtube / the landing page", "product hunt video" | 16:9 showcase (§4) | `showcase` cut | 45–120 s | [showcase-16x9](showcase-16x9.md), [ui-recreation](ui-recreation.md) |
| "show off this feature", "changelog", "what's new", "release clip" | feature spotlight (§5) | `square` / `portrait` / `showcase` key, one scene from `showcase` | 8–20 s | §5, [motion-language](motion-language.md) |
| "hero animation", "loop for the docs", "dribbble shot", "gif for the README" | UI micro-interaction loop (§6) | `loop` cut | 4–10 s (up to ~15 s for a longer flow) | §6, [motion-language](motion-language.md) §13 |
| "app store preview", "play store video" | app previews (§7) | `appstore` key, new cut | 15–30 s | §7, [delivery-and-platforms](delivery-and-platforms.md) |
| "linkedin post", "a video for x", "instagram carousel" | 1:1 or 4:5 feed clip (§8) | `square` / `portrait` key | 15–45 s | §8, [captions-and-type](captions-and-type.md) |
| "story", "link in story", "waitlist story" | 9:16 story (§9) | `story` cut | 5–15 s | §9 |
| "tutorial", "walkthrough", "onboarding", "how-to", "docs video" | tutorial (§10) | `showcase` key, one cut per task | 20–60 s per task, 1–5 min total | §10, [showcase-16x9](showcase-16x9.md) §5 (voiceover) |
| "teaser", "announcement", "coming soon", "kinetic type" | kinetic-type teaser (§11) | `reel` / `square` / `showcase` key | 6–20 s | §11, [captions-and-type](captions-and-type.md) |
| "animate our numbers", "growth chart", "year in review" | data motion (§12) | any key | 8–30 s | §12, [brand-and-assets](brand-and-assets.md) (honesty) |
| "we'll be at [event]", "come see us", "a QR code" | event set (§13) | `portrait` + `story` + a QR still | stills, or 8 s | §13 |
| "cover", "thumbnail", "banner", "og image", "feature graphic" | stills (§14) | `cover`, `thumbnail` stills + new `<Still>`s | none | §14, [delivery-and-platforms](delivery-and-platforms.md) |
| "demo day", "investor demo", "pitch video" | investor demo (§15) | `showcase` key | fit the slot: 30–120 s | §15, [showcase-16x9](showcase-16x9.md) |
| "all of it", "a launch kit", "for every platform" | one source, many cuts (§16) | `showcase` + `reel` + `story` + stills | per cut | §16 |

When the ask is ambiguous, one question settles it: **where will this be posted?** Then apply these defaults:

- **"For Instagram" means a 9:16 reel**, not a 4:5 post. Since July 2022, every new Instagram video under 15 minutes is shared as a reel [5], so a video is a reel whatever shape you give it. Vertical is the shape that fills the screen.
- **"For our landing page" means two videos**: the full film behind a play button (§4), and a muted hero loop (§6) to offer alongside it. [showcase-16x9](showcase-16x9.md) §12 has the web copies, the posters and the embed.
- **"For LinkedIn" means muted-first.** LinkedIn autoplays video without sound [22], so the words must be on screen (§8). Post the 16:9 film only if it already carries captions.
- **"For the App Store" is its own format with Apple's rules** (§7). It is not a reel. A cursor, a phone frame or hands in it break those rules.
- **If they can't say, make the launch kit**: showcase, reel, story, cover and thumbnail from one project (§16). That covers the landing page, YouTube and the three short-video apps.

Then settle two more things before writing a line:

- **Does the viewer know the product?** New viewers get a problem beat and a "how it works" beat. Existing users (changelog, tutorial) skip straight to the thing.
- **Sound on or off?** Feeds and stores autoplay muted (LinkedIn [22], the App Store [18], Google Play's first 30 s [19]). In a 2019 survey of 5,616 US adults (self-reported), 69% said they watch video with the sound off in public [15]. Design every social cut to work muted, then make the sound reward the people who turn it on.

## 2. From a format to a cut

A format is a `FORMATS` key (size, fps, safe margins). A cut is an entry in `src/cuts.json` that names a format and lists scenes. `src/Root.tsx` registers one composition per cut and computes its duration, so a new cut is a new composition with no other wiring. The steps:

1. **Pick or add a `FORMATS` key** in `src/formats.ts`. A new shape is one line:

```ts
// src/formats.ts: add shapes the template doesn't ship with
feed34: { width: 1080, height: 1440, fps: 30, safe: { top: 60, right: 60, bottom: 60, left: 60 }, label: '3:4 feed post (shows uncropped on the Instagram grid)' },
appstoreIpad: { width: 1200, height: 1600, fps: 30, safe: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'App Store preview, iPad portrait' },
play: { width: 1080, height: 1920, fps: 30, safe: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'Google Play promo video, portrait (uploaded to YouTube)' },
```

2. **Add the cut** to `src/cuts.json`. Scene `id`s key into the registry in `src/scenes/index.ts`, so a new scene component must be registered there under the same id.
3. **Give it sound**: set `"sound": true`. `score()` in `sound/score.mjs` already sounds any cut: each scene from its cue sheet in `SHEETS` when it has one (every demo scene does, so a demo scene reused in a new cut brings its cues along, as long as the cut has the marks the sheet needs), and from its mark names when it has none. A cut with no `case` of its own gets the calm or punchy defaults of its format. Sheets and naming rules are in [sound-design](sound-design.md) §4. Add a `case '<cut>':` only to change the cut-wide layer. A case replaces the defaults, so start it with `byMarks(k, CALM)` or `byMarks(k, PUNCH)` and `pads(k, …)`, then add your own `place(mix, …, at(scene, mark))` calls. Every cue sits on a mark, so the sound follows every re-timing.
4. **Look before rendering**: `node scripts/stills.mjs <cut> --marks --safe`, then `node scripts/sheet.mjs <cut> --safe` (pages of 12, 4 portrait or 3 landscape tiles across), then read the pages one at a time (`out/sheet-<cut>-safe-p1.png`, `-p2`…; a single `out/sheet-<cut>-safe.png` when there are 12 stills or fewer).
5. **Render**, one video at a time: `node sound/design.mjs <cut> && npx remotion render src/index.ts <cut> out/<cut>.mp4 --codec h264 --crf 18 --audio-bitrate 256k`. Add a `render:<cut>` script to `package.json` if the user will run it again.
6. **Deliver**: `node scripts/check.mjs out/<cut>.mp4`, then `node scripts/encode.mjs <preset> out/<cut>.mp4` for the platform (`instagram`, `tiktok`, `shorts`, `youtube`, `linkedin`, `x`, `gif`, `webm`).

Scenes adapt to the cut with two hooks: `useStage()` for the frame's shape and safe margins, `useCut()` for anything else that differs (caption wording, which steps to show). Keep the branches small. A scene that is really two scenes should be two scenes.

### Calm or punch

Every format sits on one side of this dial. The reading rate is the same on both sides (three words a second), because energy comes from motion and cut rate, never from shortening how long words stay up.

| | calm | punch |
|---|---|---|
| formats | showcase, tutorial, investor demo, 16:9 feature clip | reel, story, teaser, muted feed clip |
| `Captions` variant | `'calm'`: one sentence at a time, the old one lifts away; running captions arrive as whole lines ([captions-and-type](captions-and-type.md) §10) | `'punch'`: 1–3 words at a time, each chunk landing whole, in a band above the product; words lit one by one (`lit`) only with a voiceover or a beat grid |
| caption size (working range) | 56–64 px on a 1920-wide frame | 84–110 px on a 1080-wide frame |
| something new | once per sentence, every 3–6 s | about every 2 s: a cut, a punch-in, a new caption group, a UI state |
| `cross` in cuts.json | 0–0.1 s: cut on action and build joins in the scenes; a 0.4–0.6 s dissolve only for time passing or a chapter break ([motion-language](motion-language.md) §11) | 0–0.1 s |
| reading floor | each sentence held (words ÷ 3) + 1 s | each punch cue held max(0.5 s, words ÷ 3); a full sentence (end card, a long toast) (words ÷ 3) + 1 s |

The floor is the rule that re-paced the skill's launch film from a confusing 37 s to a 62 s film that worked. Three words a second is below the 238 words per minute adults average when reading prose silently [33] and inside Netflix's 20 characters per second cap for adult subtitles [32]. The extra second on a sentence pays for finding the caption and then the part of the UI it talks about. Full table: [captions-and-type](captions-and-type.md) §8.

## 3. 9:16 reel, TikTok, YouTube Shorts

**For.** Strangers scrolling a feed, often with the sound off, who owe you nothing. The job is to stop the thumb, get understood, and earn a send, a follow or a link tap. Retention decides distribution. Instagram names its top Reels predictions as whether you will reshare it, watch it to the end, like it, and open its audio page [1]. Adam Mosseri said in January 2025 that the top three signals are watch time, likes and sends [2].

**Specs.** 1080×1920 at 30 fps (`reel`). Instagram takes reels up to 20 minutes, but says reels over 3 minutes aren't recommended to people who don't follow you [3]. YouTube counts square or vertical videos up to 3 minutes as Shorts [7][8]. TikTok takes uploads up to 60 minutes [13]. Those are ceilings, not targets. **The how sets the length:** one step shown fits in 15–20 s, two in 22–30 s, three or more in 30–40 s; go past 40 s only for a tutorial ([reels-retention](reels-retention.md) §11). On the real project, a 29 s reel was "too fast" and viewers couldn't read it. A cut of about 37 s that kept the "how it works" section worked. Safe box: the template keeps 250 px top, 150 px right, 450 px bottom and 64 px left clear (an 866×1220 box at 64, 250). Meta's ad guidance, as reported in 2026, is stricter for paid placements: 14% top, 35% bottom and 6% at the sides [16]. If the reel will also run as an ad, keep the words above y ≈ 1250.

**Why the first second matters.** TikTok's ad guidance (circa 2021) reports that over 63% of its highest click-through videos show their key message or product within the first 3 s [12]. Facebook and Nielsen found up to 47% of a video campaign's value arrives in the first 3 s (2016, ads) [14]. So frame 0 must already say something. The feed autoplays from frame 0, and a fade up from black spends your best second on nothing.

**Beats (30 s product reel).**

| seconds | beat | on screen |
|---|---|---|
| 0.0–0.5 | hook lands | `KineticTitle` already on frame 0: the payoff or a specific, true claim, 6 words or fewer, with the product visible behind it |
| 0.5–3.0 | hook proof | the "after" state in the product's UI, big, one punch-in |
| 3.0–8.0 | problem | two short sentences, each shown in the UI (the failed search, the messy thread) |
| 8.0–10.0 | reveal | logo and promise, one pop |
| 10.0–23.0 | how it works | 2–3 steps in the product's UI, with something new about every 2 s |
| 23.0–26.5 | payoff | the result: the state or the true number that matters |
| 26.5–30.0 | end card | name, URL, CTA, inside the safe box, held at least to the reading floor |

The template's `reel` cut is a 21 s version of this spine. When you cut for length, drop the feature list, never the how. A reel that states the problem and then just says "we solve it" explains nothing.

**Pacing and captions.** `punch`. Keep caption groups inside the safe box (y 250–1470), by default in a band above the product (`top` about 300–480; the component's fallback is 330): the eye enters high, and the post text and any ad CTA grow up from the bottom. Use the lower band (`top` about 1140) only when the caption ends above y ≈ 1250. The right edge holds the like/comment/share column. Cut hard (`cross` 0–0.1). Move along the long axis: stack panels, scroll vertically, enter from below. Grain is off on phone cuts, because feed compression smears it. Hooks, interrupts and a worked 18 s storyboard: [reels-retention](reels-retention.md).

**Sound.** Make two files. The full mix goes to about −14 LUFS integrated with true peak at or below −1 dBTP. The **SFX-only** version lets the user add trending audio in the app. `ONLY=sfx,whoosh node sound/design.mjs reel` writes `public/sound-reel-sfx+whoosh.wav` (no pad, no beat) and leaves the full mix alone, so swap it under the finished render instead of rendering again: `npx remotion ffmpeg -y -i out/reel.mp4 -i "public/sound-reel-sfx+whoosh.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest out/reel-sfx.mp4` ([sound-design](sound-design.md) §13). Never make the hook the quietest stretch. If the reel is cut to a beat, pick a tempo whose beat is a whole number of frames (120 bpm = 0.5 s = 15 frames at 30 fps), put scene cuts on beats, and let the template's beat bed (`beat(k, { bpm })` in the reel's case of `score()`) run under the clicks ([reels-retention](reels-retention.md) §6). If the user brings licensed music to YouTube Shorts: from 24 September 2026, new Shorts of 1–3 minutes with an active Content ID claim are no longer blocked automatically, but the claim still applies [8].

**Build.**

```jsonc
// src/cuts.json, the template's reel with three of its seven scenes shown (print the current
// version with `node sound/timeline.mjs reel`): reel-native scenes, plus the showcase's reveal on a warped clock
"reel": {
  "format": "reel", "cross": 0.1, "sound": true,
  "scenes": [
    { "id": "reelHook", "seconds": 2.8, "marks": { "title": 0.0, "burst": 1.2 } },
    { "id": "reveal", "seconds": 4.1, "marks": { "logo": 0.3, "rise": 0.6, "wordmark": 0.85, "promise": 1.3 },
      "warp": [[0, 0.22], [0.63, 1.3], [4.1, 5.3]] },
    { "id": "end", "seconds": 2.7, "marks": { "logo": 0.05, "title": 0.2, "url": 0.6, "ctaIn": 1.05 } }
  ]
}
```

```tsx
// a minimal hook scene: frame 0 already reads (the template's src/scenes/ReelHook.tsx adds the scattered notes and a zoom punch)
import { AbsoluteFill } from 'remotion';
import { useMarks } from '../lib/time';
import { KineticTitle } from '../lib/text';
import { Backdrop } from '../lib/ui';

export function Hook() {
  const m = useMarks();
  return (
    <AbsoluteFill>
      <Backdrop glow={0.1} />
      {/* 3 words: the punch floor is 1.0 s, and the scene holds it 2.8 s from frame 0; starting 0.12 s early puts it on frame 0 */}
      <KineticTitle text="stop losing notes." start={m.title - 0.12} size={128} />
    </AbsoluteFill>
  );
}
```

**Classic mistakes.**
- A fade from black or a logo on frame 0. Open on the claim and the product.
- A 16:9 film letterboxed into 9:16. Vertical is a re-layout: stack panels and enlarge type (§16).
- Words under the bottom 450 px or behind the right 150 px column.
- Cutting the "how" to hit a length. Cut the features instead.
- Uploading a TikTok export with its watermark to Instagram. Instagram deprioritizes reels that carry other apps' watermarks [1][2]. Encode each platform's file from the master render.
- Music baked into the only file. Always ship the SFX-only version too.
- No designed cover. The grid shows the cover, not frame 0 (§14).

## 4. 16:9 product showcase, launch film

**For.** Someone who clicked play: on the landing page, YouTube, a launch post, Product Hunt, a conference screen. They give you a minute and expect to leave knowing what the product is, how it works and what to do next. Comprehension comes first. The full playbook is [showcase-16x9](showcase-16x9.md). This section is the summary you route from.

**Specs.** 1920×1080 at 60 fps (`showcase`), 45–120 s. For 1080p60 SDR, YouTube recommends H.264 at 12 Mbps with AAC-LC audio at 48 kHz [9]. `npm run render:showcase` (CRF 16, 320 kbps) is above that, so upload it as is. YouTube chapters need a first timestamp at `00:00`, at least three timestamps, and chapters of 10 s or more [11], so they only pay off from about 90 s up. Product Hunt only takes YouTube links for video, recommends 1270×760 gallery images and a 240×240 thumbnail (GIF allowed) under 3 MB. It reports that about 53% of products that reached Product of the Day since 2021 had a video [30].

**Beats (60 s).** Cold open on the product's payoff 0–4.5 · problem 4.5–11.5 · reveal 11.5–16 · how it works 16–37 · features 37–48 · proof (only if real) 48–52 · close 52–60. With no real proof, give its 4 s to the how. The problem-first spine and the 30/90/120 s versions are in [showcase-16x9](showcase-16x9.md) §2–3.

**Pacing and captions.** `calm`. One sentence per beat, held to the floor, and the picture finishes its move before the next sentence arrives. One thing moves at a time, everything eases (`EASE`), at most one bounce per scene. The `Camera` leans in (about 1.0 → 1.1 over 1.2 s) on whatever the caption is talking about. `cross` 0–0.1, with joins built in the scenes (the template's demo still uses 0.4; see [motion-language](motion-language.md) §11). `Grain` on, subtle.

**Sound.** About −17 LUFS integrated (the template's target for the `showcase` format, in the middle of the −16 to −18 range), quieter and calmer than social. A `pad` bed, `click`s and `key`s on their marks, whooshes that sit under the clicks, one `chime` on the payoff. A voiceover, if there is one, runs at about 150 wpm and sets the timing ([showcase-16x9](showcase-16x9.md) §5).

**Build.** The template's `showcase` cut is the starting point. A 30 s version is a second cut that reuses the scenes with fewer of them and shorter `seconds`, with captions varied through `useCut()`.

**Classic mistakes.**
- Paced for people who already know the product. If someone says it's "too long", check whether they know it already.
- Jargon. Replace it with its consequence: "merge conflict" becomes "their changes crash into each other".
- Features before the how, or instead of it.
- Proof that isn't real: invented counters, logos of companies that never agreed, "supported by" after one friendly call.
- No poster frame. The film's first frame is usually a dark hook fading in. Pick a designed frame for the embed.

## 5. Feature spotlight, changelog clip

**For.** People who already know the product: followers, users, the changelog page, release notes, a docs page. One new thing, shown working. Skip the problem beat, since they already have it.

**Specs.** 8–20 s. Pick the shape by where it goes: `square` (1080×1080, 30 fps) for LinkedIn and X feeds, `portrait` (1080×1350) for Instagram carousels and LinkedIn, `showcase` (1920×1080, 60 fps) for the changelog page, docs and YouTube. For a docs page that autoplays it inline, render a second copy with `--muted`.

**Beats (12 s).**

| seconds | beat | on screen |
|---|---|---|
| 0.0–1.8 | label | `Badge` "new" + the feature's name in 2–4 words, over the product already on screen |
| 1.8–9.0 | the feature, one flow | `Cursor` → click → the result appears; `Camera` leans in to the result |
| 9.0–10.2 | hold the result | nothing moves: this is the frame people screenshot |
| 10.2–12.0 | sign-off | product name, "available now" or the version, URL |

**Pacing and captions.** Calm-to-punch: durations about 0.85× the showcase's, something new about every 3 s. One caption sentence per step, burned in. Feeds play it muted.

**Sound.** Only the flow's own sounds: a `click` or two, `key`s under any typing, one `chime` on the result. `sound/design.mjs` masters by format: −14 LUFS for `square` and `portrait`, −17 for `showcase`.

**Build.** Reuse the showcase's how-it-works scene and play only the part you need. A warp whose first knot is not zero starts the scene partway in. `[[0, 6.2], [7.5, 13.7]]` plays scene seconds 6.2–13.7 at 1:1:

```jsonc
"feature-share": {
  "format": "square", "cross": 0.1, "sound": true,
  "scenes": [
    { "id": "featureTitle", "seconds": 1.8, "marks": { "badge": 0.1, "title": 0.3 } },
    { "id": "how", "seconds": 7.5, "warp": [[0, 6.2], [7.5, 13.7]],
      "marks": { "click1": 2.0, "noteIn": 2.1 /* … and every other mark of the showcase's "how" scene */ } },
    { "id": "end", "seconds": 2.6, "marks": { "logo": 0.2, "title": 0.35, "url": 0.8, "ctaIn": 1.1 } }
  ]
}
```

The template's `How` scene is laid out for 16:9 only, so give it a square layout from `useStage()` first (the panel the feature lives in, scaled up, as in §8), or make this clip on the `showcase` key. Copy the scene's whole `marks` object from the showcase. `useMarks()` throws on a mark the cut doesn't define, and that throw is what you want. The score sounds this cut like any other (with every mark copied, the `how` scene keeps its cue sheet), but `at()` for a mark before the trim point returns a time before the `how` scene starts (the warp's first segment extends backward), so those cues would play over the title card. Move them off the timeline:

```js
// sound/score.mjs: the first lines of score(cut, mix, at), before `const k = kit(cut, mix, at)`.
// The how scene starts 6.2 s in, so its earlier marks happen off screen: move them a minute before the cut, where none of it plays.
if (cut === 'feature-share') {
  const from = scenesOf(cut).find((s) => s.id === 'how').start;
  const full = at;
  at = (scene, m) => { const t = full(scene, m); return scene === 'how' && t < from - 1e-6 ? -60 : t; };
}
```

**Classic mistakes.**
- Re-explaining the whole product. The viewer knows it, so show the one thing.
- The full desktop window squeezed into 1080×1080. The app's 13 px text renders at about 7 px. Show the one panel the feature lives in, scaled up (§8).
- No held frame on the result. It happens and is gone.
- "New" with no version or date. Changelog readers want to know when.

## 6. UI micro-interaction loop

**For.** Landing-page heroes, docs, READMEs, Dribbble. Visitors arrive at any frame, with no sound, often while reading something else. It shows one interaction, perfectly, forever.

**Specs.** 1600×1000 at 60 fps (`loop`), 4–10 s for one interaction (a hero loop can run to about 15 s when the page shows a longer flow), no audio track. Deliver a web MP4 (limited-range BT.709 with faststart: the render itself is full range, so re-encode it), a poster JPEG of the first frame, a WebM where it saves real bytes, and a GIF where video isn't allowed. The build block below has every command. GitHub caps images and GIFs at 10 MB, and videos at 10 MB on free plans and 100 MB on paid ones [29]. A README GIF should come in well under that: 2–5 MB is a good working budget, because it loads on every visit. Dribbble takes MP4 or MOV up to 20 MB, recommends at least 1600 px wide, and no longer forces 4:3 [28], so `loop` fits as is. For a 16:9 slot, use a cut with the `showcase` key instead.

**Beats (6 s, the template's `loop` cut).**

| seconds | beat |
|---|---|
| 0.0–0.6 | rest: the app's start state, still |
| 0.7–0.9 | trigger: keys pressed, the palette opens |
| 1.2–2.3 | act: typing, selecting |
| 2.4–3.7 | result: the note appears and gets its title |
| 4.4–5.2 | return: everything goes back to the start state |
| 5.2–6.0 | rest: identical to 0.0, so the seam lands in stillness |

**Pacing and captions.** No captions: a visitor can land at any frame, so a caption has no start to count from. Moves use `EASINGS.inOut`, since they start and end at rest. No springs across the seam, because they never land exactly. Every periodic value uses `loopT(t, period)` with a period that divides the loop's length (for 6 s: 1, 1.5, 2, 3 or 6). No logo, no end card. The page's headline does the talking.

**Sound.** None: `"sound": false`, rendered `--muted` (`npm run render:loop`). With no audio track the file is smaller, and iOS Safari autoplays a video that has no audio or is muted ([showcase-16x9](showcase-16x9.md) §12).

**Build.**

```bash
npm run render:loop                           # → out/loop.mp4, full range, no audio track
node scripts/stills.mjs loop --at 0,5.983     # the seam: both frames sit in the rest state, so they should match
# the web copy: limited-range BT.709, CRF 22, index first (works with the bundled ffmpeg)
npx remotion ffmpeg -y -i out/loop.mp4 -vf "zscale=matrix=709:range=limited,format=yuv420p" -c:v libx264 -profile:v high -preset slow -crf 22 -x264-params colorprim=bt709:transfer=bt709:colormatrix=bt709 -color_range tv -an -movflags +faststart out/loop-web.mp4
npx remotion still src/index.ts loop out/loop-poster.jpg --frame 0 --image-format jpeg --jpeg-quality 85
node scripts/encode.mjs webm out/loop.mp4 --mute   # → out/loop-webm.webm
node scripts/encode.mjs gif out/loop.mp4      # → out/loop-gif.gif
node scripts/check.mjs out/loop-web.mp4       # size: aim for ~2–3 MB
```

The embed (`autoplay muted loop playsinline`, a pause button, the poster, WebM before MP4) is in [showcase-16x9](showcase-16x9.md) §12.

GIFs have 256 colors per frame. Soft gradients and glows band, and `Grain` becomes crawling dither. Keep loop backgrounds flat, and keep `Grain` off (the template's `loop` cut sets `"grain": false`).

**Classic mistakes.**
- A jump at the seam. Check the two stills. When the state truly can't return, dip to the backdrop for 0.3 s: a dip reads as intentional, a jump as a glitch.
- An idle bob whose period doesn't divide the loop, so it hitches once per cycle.
- Captions, a logo or an end card. They make a loop feel like an ad that restarted.
- Too much in one loop. One interaction. A second one is a second loop.
- A 30 MB hero. Check the size with `node scripts/check.mjs` before handing it over.

## 7. App Store and Google Play previews

**For.** Someone on a store page deciding whether to install. The video autoplays muted in the App Store's product page and search results [18]. On Google Play, only the first 30 s autoplay, muted, depending on the device [19]. These are the strictest formats: the stores publish rules, and breaking them gets the preview rejected.

**App Store specs (Apple [17][18]).**

| | |
|---|---|
| length | 15–30 s; up to 3 previews per localization |
| frame rate | 30 fps |
| video | H.264 at 10–12 Mbps VBR, High Profile up to Level 4.0, `.mov`/`.m4v`/`.mp4`; or ProRes 422 HQ |
| audio | 256 kbps AAC stereo, 44.1 or 48 kHz |
| file | up to 500 MB |
| iPhone 6.9", 6.5", 6.3", 6.1" | 886×1920 portrait, 1920×886 landscape (`appstore` key) |
| iPhone 5.5" | 1080×1920 / 1920×1080 |
| iPad 13", 11" | 1200×1600 / 1600×1200 (add an `appstoreIpad` key, §2) |
| Mac, Apple TV | 1920×1080 |
| poster frame | the frame at 5 s by default |

Apple's content rules shape the whole design. **Show only what is inside the app**: no people, no over-the-shoulder shots, no fingers tapping [18]. That rules out the template's `Cursor` and `Phone` frame. Let the UI's own pressed and selected states show the taps. Text overlays and narration are allowed, but text must stay up long enough to read. Avoid dates and seasonal references that age the video [18]. App Review Guideline 2.3.4 goes further: previews "may only use video screen captures of the app itself" [35]. So the picture is a real screen recording of the shipping app, played through Remotion's `<OffthreadVideo>`, and the template supplies what Apple allows on top: captions, highlights, transitions and sound ([delivery-and-platforms](delivery-and-platforms.md) §9 has the scene; [ui-recreation](ui-recreation.md) §14 has recording tips). A UI rebuilt in `src/product/` is right for every other format here, not for this one.

**Google Play specs (Play Console [19]).** The video is a YouTube URL: not a playlist or channel, public or unlisted, ads disabled, not age-restricted, embeddable. Show the real in-app experience, with the core features in the first 10 s. Google suggests 80% or more of the video should be real app use, with few title screens and logos. Add captions, and avoid people using devices. Pick the orientation that matches the app, and never add black bars to a portrait video. The store listing also needs a 1024×500 feature graphic (§14).

**Beats (25 s, first App Store preview = the overview [18]).**

| seconds | beat |
|---|---|
| 0.0–2.0 | the app's core screen mid-action; a 3–6 word overlay with the benefit |
| 2.0–5.0 | first flow begins |
| 5.0 | **poster frame**: the app's most recognizable screen, fully laid out, overlay landed |
| 5.0–12.0 | first flow completes, result held 1 s |
| 12.0–19.0 | second flow |
| 19.0–25.0 | third flow or the result; hold the app's best screen (no URL, no price) |

Use the second and third previews for other features. Apple asks that each one shows something new [18].

**Pacing and captions.** Calm. Previews render small on a store page, so overlays run 64–80 px on the 886-wide frame (a working range). Shrinking the app's screen to about 80% with a plain caption band above it is common and keeps the UI unobscured, but use no device frame.

**Sound.** Quiet UI sounds and an optional `pad`. Most people see it muted. Always include a stereo audio track, even a silent one (render with sound, or add `--enforce-audio-track`), so the file matches Apple's audio spec.

**Build.** Add an `appstore` cut on the `appstore` key (the scene and its `cuts.json` entry are in [delivery-and-platforms](delivery-and-platforms.md) §9), then:

```bash
node sound/design.mjs appstore
npx remotion render src/index.ts appstore out/appstore.mp4 --codec h264 --crf 16 --enforce-audio-track
# then the Apple encode from delivery-and-platforms §9: H.264 High, Level 4.0, limited-range BT.709, 30 fps, AAC 256k
npx remotion still src/index.ts appstore out/appstore-poster.png --frame 150   # 5.0 s × 30 fps: the poster frame
```

For Google Play, make a second cut from the same scenes on the `play` key (1080×1920, §2), or on `showcase` for a landscape app or game. Keep it at 30 s or less so all of it autoplays. Note that YouTube treats a vertical upload of 3 minutes or less as a Short [8].

**Classic mistakes.**
- A `Cursor`, a `Phone` frame or hands. Apple rejects these [18].
- 60 fps, over 30 s, or under 15 s.
- A weak frame at 5.0 s. It is the poster whenever autoplay is off.
- "New for fall", a date, or a price in the overlay.
- A rebuilt or mocked-up UI instead of a screen capture, or a capture of a build that differs from the one in review. Previews show the shipping app.
- On Play: ads left on, a private video, or a logo intro eating the first 10 s.

## 8. 1:1 and 4:5 feed posts

**For.** LinkedIn, X, the Facebook feed, Instagram carousels. Desk-bound scrollers, muted by default. LinkedIn video ads autoplay muted, and LinkedIn strongly recommends captions [22]. The post text shows above the video, so the video doesn't need to repeat the headline.

**Specs.** `square` 1080×1080 or `portrait` 1080×1350, 30 fps, 15–45 s. On LinkedIn Pages, video runs 3 s to 10 minutes, 75 KB to 5 GB, at aspect ratios from 1:2.4 to 2.4:1 and 10–60 fps [20]. Members can upload up to 15 minutes from desktop [21]. LinkedIn video ads take 4:5, 9:16, 16:9 and 1:1 [22]. On X, non-Premium accounts can post up to 140 s and 512 MB (as reported in 2026) [25]. Instagram's profile grid crops every tile to 3:4 [4]. A 4:5 post loses about 34 px on each side there. A 3:4 post (1080×1440, the `feed34` key from §2) shows uncropped.

**Beats (20 s).**

| seconds | beat |
|---|---|
| 0.0–2.0 | the claim plus the product already on screen (it autoplays mid-scroll, muted) |
| 2.0–6.0 | the problem in one line |
| 6.0–16.0 | one how-it-works flow, UI big |
| 16.0–20.0 | end card: name, URL, CTA |

**Pacing and captions.** Feature-clip energy: something new about every 3 s, and captions always burned in. Punch for a young audience (Instagram, X), at 80–100 px; calm for LinkedIn, one short sentence at a time at 60–68 px on a 1080 frame ([captions-and-type](captions-and-type.md) §2).

**Sound.** SFX and a light bed at −14 LUFS. Everything that matters must also be on screen.

**Build.** Re-lay out the showcase's scenes with `useStage()`. Square is the hardest re-layout. A 16:9 window doesn't fit, so show the one panel the step is about, bigger:

```tsx
// in a showcase scene: wide shows the window, square and 4:5 show the panel the step is about
const { W, H, format, safe } = useStage();
const wide = format === 'showcase';
const panelScale = (W - safe.left - safe.right) / 720;   // 720 = the panel's width inside the app
return (
  <AbsoluteFill>
    <Backdrop />
    {wide ? (
      <Browser url={BRAND.url} width={1500} height={900}><App /></Browser>
    ) : (
      <div style={{ position: 'absolute', left: safe.left, top: safe.top + 180, transform: `scale(${panelScale})`, transformOrigin: 'top left' }}>
        <SharePanel />
      </div>
    )}
    <Captions variant={wide ? 'calm' : 'punch'} top={wide ? H - 170 : safe.top + 20} cues={CUES} />
  </AbsoluteFill>
);
// <App /> and <SharePanel /> stand for your product components in src/product/
```

Then encode with `node scripts/encode.mjs linkedin out/<cut>.mp4` (or `x`).

**Classic mistakes.**
- Posting the 16:9 film with black bars above and below. It fills a third of the feed tile.
- A full desktop UI at 1080 wide. Nothing is readable. Crop to a panel.
- Relying on sound or voiceover without captions.
- Key text near the side edges of a 4:5 post, where the Instagram grid crops it.

## 9. 9:16 story with a CTA and link sticker

**For.** Followers tapping through stories. The job is one tap on a link: the waitlist, a launch page, a signup. It is closer to a moving poster than a film.

**Specs.** 1080×1920 at 30 fps (`story`). Each Instagram story segment can run up to 60 s [6]. Aim for 5–15 s (the template's is 8 s). Keep the top 250 px clear (progress bars, account name) and the bottom 380 px (reply bar). The link sticker is added in the app and placed by hand, so leave an empty spot for it just above the bottom margin and point at it. The template's story keeps a 520×150 px spot at y 1370–1520; go up to about 700×220 if the layout allows, so the user has room to move the sticker.

**Beats (8 s, the template's `story` cut).**

| seconds (about) | mark | beat |
|---|---|---|
| 0.05 | `logo` | brand arrives |
| 0.3 | `title` | the headline, via `Words` (2–3 short lines) |
| 1.3–2.3 | `cardIn`, `cursorsIn` | one product visual: a card, the product in use |
| 3.3 | `ctaIn` | the ask, in plain words: "join the waitlist" |
| 3.8 | `pointer` | "tap the link ↓" above the empty sticker spot, bobbing gently |
| 3.8–8.0 | | hold: everything settled, the CTA readable |

**Pacing and captions.** No running captions: a headline and a CTA, both with `Words`. The CTA is on screen by about 3.5 s and stays to the end.

**Sound.** Soft, about −14 LUFS. Many people tap through stories muted. The template scores the story from its cue sheet (`SHEETS.story` in `sound/score.mjs`): a pop and a small whoosh on `logo`, a whoosh and a pop as the card rises in, a small pop for each teammate's cursor, a pop and a two-note chime on `ctaIn`, and a small high pop on `pointer`. Its case lays a soft 120 bpm beat that comes in with the card, on a grid through the title, and ends on the last downbeat at least 1.5 s before the end so it rings out. Drop `beat(k, …)` from the story's case in `score()` if the user wants it quieter still.

**Build.** The pointer's bob runs on drawn time, so it keeps a steady rhythm:

```tsx
const t = useTime(), d = useDrawnTime(), m = useMarks();
const shown = prog(t, m.pointer, 0.4);
const hop = Math.abs(Math.sin((d / 1.2) * Math.PI)) * 8 * shown;   // a small hop every 1.2 s
// <div style={{ position: 'absolute', top: 1240 - hop, opacity: shown, … }}>tap the link ↓</div>
```

**Classic mistakes.**
- The CTA under the reply bar, or the sticker's spot covering the headline.
- Fake counts ("1,200 people joined today"). Say the true number or none.
- Too much text. It is a poster: one headline, one ask.
- A story that ends before the CTA has been readable for 2 s.

## 10. Tutorial, walkthrough, onboarding

**For.** People who already chose the product and want to do one thing with it: trial users, new customers, docs readers. They want to follow along, so the video must be slow enough to copy and must match the current UI exactly.

**Specs.** `showcase` (1920×1080, 60 fps, for smooth cursor and scroll). **One task per video, 20–60 s**, for docs and in-app onboarding. A walkthrough can run 1–5 minutes, with chapters. Wistia's 2026 data puts average engagement at 52% for videos under a minute, and finds that most viewers of 1–5 minute videos drop off around the halfway point [31]. That is the argument for short per-task clips with the core up front. YouTube chapters need a first timestamp at `00:00`, at least three, and 10 s or more each [11].

**Beats (45 s task).**

| seconds | beat |
|---|---|
| 0–3 | the outcome first: the finished state, and "share a note with your team in 3 steps" |
| 3–8 | the starting point: where in the app you begin, shown wide so viewers can find it |
| 8–38 | steps 1–3, 8–10 s each: numbered caption → `Camera` leans to the control → `Cursor` moves (0.8–1.2 s) → click → result held 1 s |
| 38–45 | recap in one line, and where to go next |

**Pacing and captions.** Calm, and slower than a showcase: the viewer is copying. Number the steps in the captions ("2. pick your team"). Show keyboard shortcuts as `Badge`s ("⌘K") at the moment they're pressed. Label controls with `Callout` rather than long sentences. Pull the camera back to show where you are before pushing in on what to press.

**Sound.** −16 to −18 LUFS. Clicks and keys on their marks. No music under a voiceover, or duck it well below. Voiceover pacing and recording: [showcase-16x9](showcase-16x9.md) §5. With a voiceover, ship an SRT too ([captions-and-type](captions-and-type.md)).

**Build.** One cut per task (`tut-share`, `tut-search`), all reusing the product components. Because the UI is rebuilt in code, a UI change is an edit and a re-render, not a re-shoot. That is the biggest win of this format. Generate chapters from `sceneStart()` so they follow every re-timing ([showcase-16x9](showcase-16x9.md) §11 has the script).

**Classic mistakes.**
- Skipping the starting state, so the viewer can't find where you are.
- A cursor that teleports or moves in under 0.5 s. Viewers lose it.
- Zoomed out too far to read labels, or zoomed in too far to know where you are.
- A tutorial that shows last quarter's UI.
- One 10-minute video instead of short task clips people can find.

## 11. Kinetic-typography announcement or teaser

**For.** Announcing a launch date, funding, a rename, "coming soon", a big release. Type is the picture. The audience is followers and the curious, and the job is to make one line land and be remembered.

**Specs.** `reel` for Instagram and TikTok, `square` for LinkedIn and X, `showcase` for YouTube and the site. 6–20 s. Type sizes (working ranges): `KineticTitle` at 140–200 px for 1–3 words and `Words` at 96–120 px on a 1080-wide frame; 120–180 px on 1920.

**Beats (12 s, on a 120 bpm grid: a beat every 0.5 s).**

| seconds | mark | beat |
|---|---|---|
| 0.0 | `slam` | first words slam in (`KineticTitle`) on the downbeat |
| 1.0–6.0 | `line1`…`line3` | three short lines, one at a time, each held to the floor (3 words = 2 s) |
| 6.5 | `reveal` | the line that matters; `Highlight` sweeps behind its key word |
| 9.0–12.0 | `date` | the date, URL or logo, held at least 2.5 s |

**Pacing and captions.** Punch energy, one idea per screen, 6 words or fewer at a time. Pick one entrance style (a line rising from behind a mask, or `Words` rising out of blur) and use it for every line. Make only the reveal different. A teaser is the one place where the blur-rise may carry every line: the type is the whole picture, and nothing else in the scene blurs. Never flash words for under 5 frames: nobody reads them.

**Sound.** This is where a beat earns its place. Put marks and scene `seconds` on the beat grid, `cross: 0`. The score's conventions already fit this beat sheet: `slam` gets a low hit, `reveal` a whoosh into a thump and a bright chord, and `beat()` lays the soft kit on a grid through `reveal`, drops out for the bar before it while a riser builds into it, and comes back in on it (with less than two bars before `reveal`, it simply comes in on it). So the teaser's case is three lines:

```js
// sound/score.mjs, in the switch of score()
case 'teaser':
  byMarks(k, PUNCH);
  pads(k, PUNCH);
  beat(k, { bpm: 120 });
  break;
```

```tsx
// src/scenes/Teaser.tsx, inside <AbsoluteFill> over a <Backdrop /> (C comes from '../theme')
const m = useMarks();
<KineticTitle text="something new" start={m.slam} size={180} />
<Words text="for teams | who write | everything down." start={m.line1} step={0.5} size={112} />  {/* a word per beat: slower than the usual 0.05–0.09 s step on purpose */}
<Highlight start={m.reveal} dur={0.5} color={C.accent}><span>calm</span></Highlight>
```

**Classic mistakes.**
- Hype with no information: no date, no URL, no name.
- Every line in a different animation style.
- Words cut faster than the floor because "it's a teaser".
- A beat louder than everything else. The kit sits under the words' hits.

## 12. Data and metrics motion

**For.** Showing real results: growth, a benchmark, before and after, a year in review. The audience is investors, customers and followers, and every one of them will trust the product less if a number turns out to be padded.

**Honesty first.** These rules outrank every visual choice:
- **Real numbers only**, supplied by the user, with where they came from and when. Put "as of September 2026" on screen.
- **No offsets and no padding.** A waitlist counter with a hidden head start is fake proof. Say the true number or none.
- **Bars start at zero.** Compared series share one scale. Say "total" when the curve is cumulative.
- **Round honestly.** Round to the nearest, never up past a milestone ("1,460", not "1.5k+").
- **Name benchmark setups** (hardware, dataset, versions), or don't show the benchmark.
- **Small numbers are fine.** If they're not impressive yet, show a quote with permission or the product itself, not a stretched axis.

**Specs.** Any format, 8–30 s.

**Beats (15 s, one metric).**

| seconds | beat |
|---|---|
| 0–2 | the question in plain words: "time to find a note, before and after" |
| 2–3 | axes and labels draw (0.4 s) |
| 3–5 | bars grow or the line draws (1.2–2 s, `EASE`); `Counter` rolls with them |
| 5–11 | the number that matters, big; `Highlight` on it; held to the floor |
| 11–15 | the source line and date, then out |

**Pacing and captions.** One number per beat. Counters roll for 1.0–1.8 s. Let the chart finish before the caption changes. Never bounce a number: an overshoot shows a value that isn't true, so use `prog` with `EASE`, not `pop` with `bouncy`.

**Build.**

```tsx
const t = useTime(), m = useMarks();
const k = prog(t, m.bars, 1.4);                              // 0 → 1, eased
const bar = (v: number) => (v / MAX) * 640 * k;              // bars from zero, one shared scale
<div style={{ height: bar(1460), background: C.accent, borderRadius: 8 }} />
<Counter from={0} to={1460} start={m.bars} dur={1.4} format={(n) => Math.round(n).toLocaleString('en-US')} />
```

**Sound.** `tick`s while the counter rolls, spaced the way the ease spaces the values, then a `chime` when it lands. No naming rule sounds `bars`, so place these by hand, in the scene's sheet or in the cut's case:

```js
// sound/score.mjs (tick, chime and place are already imported there), in the metric cut's case after byMarks(k, …):
// equal value steps come further apart as the ease slows
const n = 12, t0 = at('metric', 'bars'), dur = 1.4;
for (let i = 1; i <= n; i++) {
  const k = 1 - Math.cbrt(1 - i / n);        // when an ease-out reaches i/n (a cubic stand-in for EASE)
  place(mix, tick({ seed: 40 + i }), t0 + k * dur, { gain: 0.8, pan: 0.2 });
}
place(mix, chime({ notes: ['E6', 'B6'] }), t0 + dur, { gain: 0.5 });
```

**Classic mistakes.**
- An axis that doesn't start at zero, making a 10% gain look like 3×.
- Percentages with no base ("+300%" from 3 users to 12).
- Five series at once. One story per chart.
- Axis labels unreadable at phone size. On a 1080-wide phone frame, labels need 32 px or more ([captions-and-type](captions-and-type.md) §2).

## 13. Event promo: feed post, story, QR card

**For.** Telling people where to find the team at an event, and getting demos booked. Make three pieces from one layout: a feed post (still or 8 s), a story, and a QR card shown on a phone in person.

**Honesty.** Say where and when, never a promise you can't keep. "See you in [city], [dates]" is safe. "Visit our booth B12" is only safe if that booth is confirmed. Use the event's logo only as its press kit allows, and credit supporters only with their consent, in their words.

**Specs.**

| piece | size | key |
|---|---|---|
| feed post | 1080×1350 (or 1080×1440 for an uncropped Instagram grid tile) | `portrait` / `feed34` |
| story | 1080×1920; top 250 and bottom 380 px clear, a link-sticker spot | `story` |
| QR card for a phone | 1080×1920, shown full-screen at full brightness | a `<Still>` |

**Layout (one system for all three).** The headline ("see you in berlin."), a quieter line with the event name and dates, one product visual, a plain ask ("want a 5-minute demo? message us."), the logo and URL. On the QR card, the code takes 60–70% of the width (650–750 px on 1080, a working size), dark modules on white, with a quiet zone of 4 modules on every side (the QR standard's margin [34]) and the URL printed under it for people who'd rather type.

**Build.** The template has no QR component. Ask the user before adding a dependency, then draw the code as SVG rects so it stays crisp at any size:

```tsx
// npm i qrcode @types/qrcode   (ask first)
import { create } from 'qrcode';

export function Qr({ url, size }: { url: string; size: number }) {
  const { modules } = create(url, { errorCorrectionLevel: 'M' });
  const n = modules.size, q = 4;                                      // 4-module quiet zone
  const cells = Array.from({ length: n * n }, (_, i) => [i % n, Math.floor(i / n)] as const)
    .filter(([x, y]) => modules.get(y, x))
    .map(([x, y]) => <rect key={`${x}-${y}`} x={x + q} y={y + q} width={1.02} height={1.02} />);
  return (
    <svg viewBox={`0 0 ${n + 2 * q} ${n + 2 * q}`} width={size} height={size} style={{ background: '#fff', borderRadius: 24 }}>
      <g fill="#000">{cells}</g>
    </svg>
  );
}
```

```tsx
// src/Root.tsx, next to the cover and thumbnail stills
<Still id="event-feed" component={EventFeed} width={1080} height={1350} />
<Still id="event-story" component={EventStory} width={1080} height={1920} />
<Still id="event-qr" component={EventQr} width={1080} height={1920} />
```

Render with `npx remotion still src/index.ts event-qr out/event-qr.png`. You can't scan it yourself, so ask the user to scan the PNG from a second screen before the event.

**Classic mistakes.**
- A QR code that is too small, low-contrast or inverted, or has a logo punched through the middle. Plain black on white scans everywhere.
- The wrong date, or a date without the city.
- A promised booth, talk or time that isn't confirmed.
- The event's logo recolored or stretched.

## 14. Stills: covers, thumbnails, banners, OG images

Stills are made with the same components and tokens as the video, so the set reads as one thing. The template ships `cover` and `thumbnail` as `<Still>`s in `src/Root.tsx`. Add others the same way.

| still | size | keep clear, and the rule |
|---|---|---|
| reel cover | 1080×1920 | everything important inside the centered 3:4, 1080×1440 (y 240–1680), which is what the profile grid shows [4] |
| YouTube thumbnail | template 1280×720; YouTube asks for 3840×2160, 16:9, at least 640 px wide, JPG or PNG, 2 MB from mobile, 50 MB from desktop [10] | bottom-right corner (the duration badge); must read at 320 px wide |
| Shorts thumbnail | 9:16, up to 2160×3840 [10] | reuse the reel cover |
| OG / link preview | 1200×630 (1.91:1), 8 MB max [26] | X's large card is 2:1 [27], so keep content inside the central 1200×600 |
| X header | 1500×500 [25] | bottom-left, where the profile photo overlaps |
| LinkedIn company cover | 1512×256, PNG or JPEG, 3 MB max [23]; render at 2× | bottom-left, where the Page logo overlaps. The older 1128×191 has the same ratio, so a design made for it scales. |
| LinkedIn profile background | 1584×396, under 8 MB [24] | bottom-left third, where the profile photo sits |
| Google Play feature graphic | 1024×500, JPEG or 24-bit PNG without alpha [19] | keep focal points centered, away from the edges |
| Product Hunt gallery / thumbnail | 1270×760 / 240×240, GIF allowed, under 3 MB [30] | the thumbnail must read at 240 px: mark only, no words |
| poster frame | the video's size | a designed moment (the promise landed), not frame 0 |

```bash
npx remotion still src/index.ts cover out/cover.png
npx remotion ffmpeg -y -i out/cover.png -vf "crop=1080:1440:0:240,scale=360:-1" out/cover-grid.png     # the grid tile, as seen
npx remotion still src/index.ts thumbnail out/thumbnail.jpg --scale 3 --image-format jpeg --jpeg-quality 88
npx remotion ffmpeg -y -i out/thumbnail.jpg -vf scale=320:-1 out/thumbnail-320.png                     # as seen in a list
```

Rules for every still:
- **One idea.** A headline of 2–6 words, one product moment, the mark.
- **Check at the size people see it**: the grid tile at about 360 px, the thumbnail at 320 px, Product Hunt at 240 px. Read those images, not the full-size ones.
- **Honest.** Show a moment that exists in the video and a UI state the product has. No invented numbers.

**Classic mistakes:** words in the reel cover's top or bottom 240 px, a thumbnail with a sentence on it, a banner whose headline sits under the logo overlap, and an OG image with text at the edges that X's 2:1 crop cuts off.

## 15. Investor and demo-day product demo

**For.** Investors, who are smart, pressed for time and not specialists. The job is to make them believe the product is real, works end to end, and has users. It plays inside a live pitch (often on a projector), on a demo-day page, or as a link in a follow-up email.

**Specs.** `showcase` (1920×1080). Ask for the slot's length and the venue before anything else. Inside a live pitch: 30–60 s. Standalone: 60–120 s. For a projector, go bigger: calm captions at 72 px or more on 1920 (a working minimum). Rooms are wide and screens are far.

**Beats (60 s standalone).**

| seconds | beat |
|---|---|
| 0–5 | who it's for and the pain, in one sentence |
| 5–40 | the product doing the job end to end: one real flow, not a feature tour |
| 40–50 | proof: real usage with dates, or a customer quote with permission; skip the beat if there is none |
| 50–60 | name, one-line promise, URL and contact |

**Pacing and captions.** Calm, and slower than a launch film, because the room is also listening to the founder. If the founder narrates live, render a caption-free, muted cut (`--muted`) and let them talk over it. If it's sent as a link, burn in captions.

**Sound.** About −17 LUFS (the `showcase` format's target), no big whooshes (rooms are echoey), and the muted cut as a second file.

**Build.** A `demo` cut reusing the showcase's how-it-works scene, plus a `demoProof` scene if there is real proof. Vary captions with `useCut()`, and drop them in the muted cut.

**Classic mistakes.**
- A feature tour instead of one job done completely.
- Unlabeled roadmap: a feature that doesn't exist yet shown as working. Label it "coming" or leave it out. Investors check.
- Undated or padded metrics, or "used by" logos without permission.
- Too long for the slot. The founder ends up talking over the end card.
- A soundtrack that fights the founder's voice.

## 16. One source, many cuts

One project, with one theme, one set of product components and one `src/cuts.json`, should serve every platform. There are three ways to derive a cut. Pick per cut:

| method | what it is | when | watch out for |
|---|---|---|---|
| **re-layout** | the same scenes and timing on another `FORMATS` key; scenes branch on `useStage()` to stack panels, enlarge type and move captions into the safe box | the story already works and only the shape changes: a vertical film for phones, a square LinkedIn cut | every scene needs a layout per shape; same scenes and marks means the same cue sheets, so the soundtrack follows on its own; give the cut a `case` in `score()` with the source's style (`byMarks(k, CALM)`, `pads(k, CALM)` for a vertical film), or it gets its format's punchy defaults |
| **warp** | the same scenes on a faster clock: `warp` knots per scene in `cuts.json`, squeezing pauses hardest and moves least (slopes 1.0–1.4); a first knot above zero trims the start (§5) | a shorter cut of the same story (reel from the film), or one scene trimmed into a clip | ambient motion on `useDrawnTime()` or it shivers; knots where nothing moves; the sound follows through `at()`, which inverts the warp |
| **reel-native** | new scenes built for the reel's rhythm, reusing the product components | the default for reels, stories and teasers: they need their own hook and rhythm | keep the "how it works" section; keep the reading floor |

**The delivery matrix for a launch kit:**

| deliverable | key | built from | method | length | sound | captions | deliver |
|---|---|---|---|---|---|---|---|
| launch film | `showcase` | its own scenes | source | 45–120 s | full mix, about −17 LUFS | calm | `npm run render:showcase`, `youtube` preset if large |
| vertical film | `reel` | the showcase scenes | re-layout | same as the film | the film's cues | calm, bigger | `instagram` |
| reel | `reel` | product components + one warped scene | reel-native + warp | 15–40 s (the how sets it) | own mix at −14 LUFS, plus SFX-only | punch | `instagram` / `tiktok` / `shorts`, `--max-mb` if the upload tool caps size |
| story | `story` | reveal and end-card pieces | reel-native | 8 s | soft | headline + CTA | `instagram` |
| feature clips (2–3) | `square` / `portrait` | the how scene | warp (trim) | 10–15 s each | own cues | burned in | `linkedin` / `x` |
| hero loop | `loop` | the how scene's core interaction | new cut, no captions | 4–10 s (up to ~15 s) | none (`--muted`) | none | `render:loop`, the web MP4 and poster (§6), `webm`, `gif` |
| feed post | `portrait` / `square` | showcase scenes | re-layout + warp | 20–45 s | −14 LUFS | burned in | `linkedin` / `x` |
| app previews | `appstore` (+ iPad) | product components | reel-native, in-app only | 15–30 s | quiet, track present | overlays | custom render (§7) |
| stills | `cover`, `thumbnail` + new | scene components | `<Still>`s | none | none | none | `npx remotion still` |

**Order of work.**
1. **The showcase first**, at calm pace. It proves the story is understood. Every other cut is a compression or a reshaping of something that already works. Even for a reel-only request, write the story at calm pace in the scene table first, then compress it.
2. **A contact sheet of the showcase**, shown to the user before any other cut.
3. **The reel**, then the **cover and thumbnail**, which carry the reel and the film.
4. **The rest**, cheapest first: story, feature clips, loop, feed posts, previews.

**Rendering the set.** Render one at a time. Chrome plus bundling uses a lot of memory, and parallel renders can take a small machine down. Check each file before starting the next:

```bash
for c in showcase reel story; do npm run render:$c && node scripts/check.mjs out/$c.mp4 || break; done
npm run render:loop
```

Hand the files over with a line each saying what it is for: "reel.mp4: Instagram and TikTok", "reel-sfx.mp4: the same without music, for trending audio", "cover.png: the reel's cover", "showcase.mp4: YouTube and the landing page". The user shouldn't have to guess which file goes where.

## Sources

Checked in September 2026. Platform numbers change, so re-check before a launch, and treat [delivery-and-platforms](delivery-and-platforms.md) as the authority when it differs.

1. Instagram, "Instagram Ranking Explained" (Reels predictions: reshare, watch to the end, like, audio page; watermarked and low-resolution content not recommended): https://about.instagram.com/blog/announcements/instagram-ranking-explained
2. Mosseri's January 2025 statement on watch time, likes and sends, and third-party watermarks, as reported by Dataslayer and Buffer: https://www.dataslayer.ai/blog/instagram-algorithm-2025-complete-guide-for-marketers · https://buffer.com/resources/instagram-algorithms/
3. Instagram Help, "Record a reel" (reels up to 20 minutes; over 3 minutes not recommended to new audiences; read from a search copy, see [delivery-and-platforms](delivery-and-platforms.md)): https://help.instagram.com/2720958398006062 · Engadget, Instagram extends Reels to three minutes and moves to a rectangular profile grid (January 2025): https://www.engadget.com/social-media/instagram-swoops-in-with-3-minute-reels-and-rectangular-profile-grids-as-the-tiktok-ban-gets-real-201316339.html
4. Instagram's 3:4 profile grid (1080×1440 tiles): Social Media Today https://www.socialmediatoday.com/news/instagram-rolls-out-vertically-aligned-profile-grid/737777/ · Kapwing https://www.kapwing.com/resources/instagrams-new-grid-layout-size-and-dimensions-2025/
5. TechCrunch, Instagram video posts shorter than 15 minutes are now shared as Reels (July 2022): https://techcrunch.com/2022/07/21/instagram-video-posts-shorter-than-15-minutes-now-shared-reels/
6. Instagram Help Center, stories' 60-second maximum per segment: https://help.instagram.com/270963803047681
7. YouTube Official Blog, "Tall updates coming to Shorts" (Shorts up to 3 minutes from 15 October 2024): https://blog.youtube/news-and-events/tall-updates-coming-to-shorts/
8. YouTube Help, "Understand three-minute YouTube Shorts" (square or vertical up to 3 minutes; Content ID change from 24 September 2026): https://support.google.com/youtube/answer/15424877
9. YouTube Help, recommended upload encoding settings: https://support.google.com/youtube/answer/1722171
10. YouTube Help, custom thumbnails: https://support.google.com/youtube/answer/72431
11. YouTube Help, video chapters: https://support.google.com/youtube/answer/9884579
12. TikTok for Business, "9 Creative Tips to drive performance" (63% of highest-CTR videos show the key message or product in the first 3 s), as quoted by Wpromote: https://ads.tiktok.com/business/library/Auction_Ads_Creative_Tips.pdf · https://www.wpromote.com/blog/social/tiktok-creative-best-practices/
13. TikTok length limits (10 min recorded in-app, uploads up to 60 min), via Sociality.io: https://sociality.io/blog/tiktok-video-length/
14. TechCrunch, Facebook and Nielsen: 47% of a video campaign's value in the first three seconds (2016): https://techcrunch.com/2016/02/18/facebook-video-metrics
15. Verizon Media and Publicis Media survey (2019, 5,616 US adults): 69% watch with sound off in public: https://www.forbes.com/sites/tjmccue/2019/07/31/verizon-media-says-69-percent-of-consumers-watching-video-with-sound-off/ · https://www.3playmedia.com/blog/verizon-media-and-publicis-media-find-viewers-want-captions/
16. Meta Business Help Centre, text overlays and the safe zone for Stories and Reels ads, with the 14% / 35% / 6% margins as reported by Billo (2026): https://www.facebook.com/business/help/980593475366490/ · https://billo.app/blog/meta-ads-safe-zones/
17. Apple, App Store Connect, app preview specifications: https://developer.apple.com/help/app-store-connect/reference/app-preview-specifications/
18. Apple, App previews (guidance: in-app content only, muted autoplay, up to 3 per language, no dated references): https://developer.apple.com/app-store/app-previews/
19. Google Play Console Help, "Add preview assets to showcase your app" (preview video rules, feature graphic 1024×500): https://support.google.com/googleplay/android-developer/answer/9866151
20. LinkedIn Help, video specifications for LinkedIn Pages: https://www.linkedin.com/help/linkedin/answer/a1311816
21. LinkedIn Help, share videos on LinkedIn: https://www.linkedin.com/help/linkedin/answer/a7174587
22. LinkedIn Marketing Solutions, video ads (muted autoplay, captions, 4:5 / 9:16 / 16:9 / 1:1): https://business.linkedin.com/advertise/ads/sponsored-content/video-ads
23. LinkedIn Help, image specifications for Pages (cover 1512×256, 3 MB): https://www.linkedin.com/help/linkedin/answer/a563309
24. LinkedIn Help, profile background photo (1584×396, under 8 MB): https://www.linkedin.com/help/linkedin/answer/a568217
25. X video limits (140 s and 512 MB for non-Premium) and header size (1500×500), via Clideo and PostFast: https://clideo.com/resources/twitter-video-specs · https://postfa.st/sizes/x
26. Meta for Developers, images in link shares (1200×630, 1.91:1, 8 MB): https://developers.facebook.com/documentation/sharing/webmasters/images
27. X `summary_large_image` card, 2:1, via OpenGraph+: https://opengraphplus.com/consumers/twitter/images
28. Dribbble Help, creating shots (video: MOV or MP4 up to 20 MB, 1600 px wide recommended, no fixed ratio): https://help.dribbble.com/en/articles/11062601-creating-dribbble-shots
29. GitHub Docs, attaching files (10 MB images and GIFs; videos 10 MB free, 100 MB paid): https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files
30. Product Hunt, "Prepare for your Product Hunt launch" (gallery 1270×760, thumbnail 240×240, under 3 MB, YouTube links only, 53% of Products of the Day since 2021 had a video): https://www.producthunt.com/launch/preparing-for-launch
31. Wistia, optimal video length (2026 State of Video: 52% average engagement under 1 minute): https://wistia.com/learn/marketing/optimal-video-length
32. Netflix, English (USA) Timed Text Style Guide (20 characters per second for adult programs): https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide
33. Brysbaert (2019), "How many words do we read per minute?", Journal of Memory and Language (238 wpm for non-fiction): https://doi.org/10.1016/j.jml.2019.104047
34. QR quiet zone of four modules (ISO/IEC 18004), via QR Code Kit: https://qrcodekit.com/guides/quiet-zone-requirements-for-qr-codes/
35. Apple, App Review Guidelines 2.3.4 (previews "may only use video screen captures of the app itself"): https://developer.apple.com/app-store/review/guidelines/
