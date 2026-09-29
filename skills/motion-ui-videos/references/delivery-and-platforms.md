# Delivery and platforms

This file turns a finished render into files that upload cleanly and look right where they land. It covers each platform's canvas, length and size limits, frame rate, codec, safe zones and cover rules, then the encoding behind `scripts/encode.mjs`, caption files, file names, how to hand the files to the user, and a pre-upload checklist. Every platform number was checked in September 2026 against the sources at the end. Platforms change their apps faster than their help pages, so when a number decides something (an upload cap, the safe zone of a paid ad), tell the user the month you checked and ask them to preview the post in the app before publishing. Where no official figure exists, this file says so and gives a working heuristic instead. This file is the authority on the numbers in `src/formats.ts`; section 2 says where the research agrees with them and where it does not.

## Contents

1. [The short version](#1-the-short-version)
2. [Safe zones and FORMATS](#2-safe-zones-and-formats)
3. [Instagram: Reels, cover and grid, Stories, feed](#3-instagram)
4. [TikTok](#4-tiktok)
5. [YouTube Shorts](#5-youtube-shorts)
6. [YouTube long-form and thumbnail](#6-youtube-long-form-and-thumbnail)
7. [LinkedIn](#7-linkedin)
8. [X](#8-x)
9. [App Store app previews](#9-app-store-app-previews)
10. [Google Play promo video](#10-google-play-promo-video)
11. [Product Hunt](#11-product-hunt)
12. [Landing pages and link previews](#12-landing-pages-and-link-previews)
13. [Slack, Discord, Notion, GitHub](#13-slack-discord-notion-github)
14. [Encoding](#14-encoding)
15. [Caption files: SRT and VTT](#15-caption-files-srt-and-vtt)
16. [File names](#16-file-names)
17. [Delivering to the user](#17-delivering-to-the-user)
18. [Pre-upload checklist](#18-pre-upload-checklist)

## 1. The short version

| destination | canvas (px) | fps | length limit | file limit | cut / format | encode preset |
|---|---|---|---|---|---|---|
| Instagram Reel | 1080×1920 | 30 (IG asks for at least 30) | 20 min; over 3 min is not recommended to non-followers | not published for organic posts | `reel` | `instagram` |
| Instagram Story | 1080×1920 | 30 | 60 s per story | not published | `story` | `instagram` |
| Instagram feed | 1080×1350 (4:5), 1080×1080 | 30 | as Reels | as Reels | `portrait`, `square` | `instagram` |
| TikTok | 1080×1920 | 30 (23–60 accepted) | 60 min upload; 10 min through the API | 4 GB through the API | `reel` | `tiktok` |
| YouTube Shorts | 1080×1920 | 30 | 3 min, square or vertical | 256 GB | `reel` | `shorts` |
| YouTube | 1920×1080 | 60 | 15 min until verified, then up to 12 h | 256 GB | `showcase` | the master, or `youtube` |
| LinkedIn feed | 1920×1080, 1080×1080, 1080×1350 | 30 or 60 (10–60) | 3 s – 15 min | 75 KB – 5 GB | `showcase`, `square`, `portrait` | `linkedin` |
| X | 1920×1080 or 1080×1920 | 30 (API caps at 40) | 140 s on standard accounts | 512 MB | `showcase`, `reel` | `x` |
| App Store preview | 886×1920 (every iPhone from 6.1" up) | 30 max | 15–30 s | 500 MB | `appstore` | by hand (section 9) |
| Google Play | a YouTube link | – | first 30 s autoplay | – | `showcase` or `reel` | upload to YouTube |
| Product Hunt | YouTube link + 1270×760 images | – | – | thumbnail under 3 MB | `showcase` + stills | – |
| Landing hero loop | 1600×1000 or 1920×1080 | 30–60 | 4–10 s (up to ~15 s for a longer flow) | ~2–3 MB (working budget) | `loop` | web MP4 ([formats](formats.md) §6) + `webm` |
| README, docs, chat | GIF 480–800 wide, or MP4 | 12–15 (GIF) | ≤ 8 s (GIF) | GitHub 10 MB, Discord 20 MB (free) | `loop` | `gif` |

Loudness targets are in [sound-design](sound-design.md) §8: about −14 LUFS integrated for social cuts, about −17 for a showcase (the template's target, inside −16 to −18), true peak at or below −1 dBTP everywhere. Measure the delivered file with `node scripts/check.mjs`, not just the WAV.

## 2. Safe zones and FORMATS

`FORMATS[format].safe` is the margin, in px, that a platform may cover with its own UI. `useStage().safe` hands it to scenes, and `node scripts/stills.mjs reel --marks --safe` draws it with `SafeZones()` so you can see what collides. Anything a viewer must read or tap (captions, URL, CTA, logo, the product's key UI) stays inside.

What the research found (September 2026):

| platform | official guidance | measured by third parties (not official) |
|---|---|---|
| Instagram / Facebook Reels ads | keep roughly 14% of the top, 35% of the bottom and 6% of each side free of text and logos (Meta Ads Guide). At 1080×1920: ~269 / 672 / 65 px | – |
| Instagram Stories ads | roughly 14% ("250 pixels") of the top and 20% (340 px) of the bottom (Meta Ads Guide) | third-party guides report that Meta unified Stories and Reels ads on the 14 / 35 / 6 zone in March 2026 |
| TikTok | no pixel numbers; the zone depends on caption length and add-ons, and TikTok publishes downloadable templates instead (TikTok Ads) | CreaMate's measured preset (Aug 2026): top 140, bottom 400, left 60, right 180. Zeely: top band 150–200, right rail ~120, bottom 250–300 plus the CTA |
| YouTube Shorts | Google Ads shows reference images; the action buttons overlay the right side and can't be hidden | guides disagree widely: top 120–380, bottom 300–390, right 96–120 |

What that means for `src/formats.ts`:

- **`reel` { top 250, right 150, bottom 450, left 64 }: keep.** Meta itself turns its 14% top guidance into "250 pixels", and 250 clears every measured top band. A bottom of 450 sits above every measured organic overlay (TikTok's 400, Shorts' ≤ 390). Instagram's caption area grows with the post text, so keep that text to a line or two as well. Right 150 covers the ~120 px action rails. CreaMate's 180 is more cautious, so in the lower half (y > 1000, where the rails sit) keep key text another 30 px in. Left 64 is Meta's 6% (65) to within a pixel.
- **A reel that will run as a paid Meta ad needs a deeper bottom.** The ad CTA sits in the bottom 35% (672 px). Don't squeeze the organic reel. Add a format and a cut, and let scenes re-lay out from `useStage()`:

  ```ts
  // src/formats.ts: a reel that also runs as a Meta ad (Meta: 14% top, 35% bottom, 6% sides)
  reelAd: { width: 1080, height: 1920, fps: 30, safe: { top: 270, right: 150, bottom: 672, left: 65 }, label: '9:16 reel for paid placement' },
  ```

- **`story` { top 250, right 64, bottom 380, left 64 }: keep.** It matches Meta's Stories guidance (250 top, 340 bottom) with 40 px spare for the reply bar. The link sticker needs its own empty spot on top of that (section 3).
- **`square` { 60 all round }: fine for feeds, wrong for the Instagram grid.** The profile grid crops posts to 3:4, which cuts 135 px off each side of a 1080×1080 frame. If a square cut goes to Instagram, set left and right to 150, or at least keep the cover frame's text inside x 135–945. The template's value of 60 is only right for feeds without a grid.
- **`portrait` { 60 all round }: keep.** The 3:4 grid crop takes only ~34 px off each side of 1080×1350.
- **`showcase` { 54, 96, 54, 96 }: keep.** That's the classic 5% action-safe margin. No platform UI covers a 16:9 video while it plays. The player controls appear on hover, and YouTube draws the duration on the thumbnail (section 6).
- **`appstore` and `loop` { 0 }: keep.** Nothing overlays them. For the App Store, still keep text about 48 px from the edges, because the store shows previews with rounded corners (heuristic).

Measure, don't guess: after `node scripts/stills.mjs reel --marks --safe`, look for any caption, URL or button crossing the drawn margin. For a paid ad, also drop a still into the platform's own preview (Meta Ads Manager, TikTok's template) before spending money.

## 3. Instagram

### Reels

| spec | value | why it matters |
|---|---|---|
| canvas | 1080×1920 (9:16); IG accepts 1.91:1 to 9:16 | anything wider than 9:16 gets bars or a crop in the Reels tab |
| frame rate | at least 30 fps; minimum resolution 720 px | render the `reel` format at 30. A size-capped copy spends its bits on half as many frames as at 60 |
| length | up to 20 min; reels over 3 min are not recommended to new audiences | for reach, stay well under 3 min. The real project's reel worked at 37 s |
| codec | MP4, H.264 + AAC (IG re-encodes everything) | upload the `instagram` preset copy: yuv420p, BT.709, 48 kHz audio |
| quality | turn on "upload at highest quality" (profile → menu → Your app and media → Media quality) | otherwise the app may upload a lower-quality version on mobile data |
| captions | no caption-file upload; burned-in captions or IG's auto captions | your `Captions` are already burned in, so leave IG's auto captions off or the text doubles |
| safe zone | `reel` format (section 2) | – |

Upload tools and schedulers can cap files well below what Instagram takes. The real project hit a ~10 MB cap in an Instagram upload tool. When that happens, make a two-pass copy that fits (`node scripts/encode.mjs instagram out/reel.mp4 --max-mb 9` for a 10 MB cap, a megabyte of margin) and check text sharpness on stills pulled from that copy (section 14).

### Reel cover and the 3:4 grid

Since January 2025, Instagram's profile grid shows tall 3:4 tiles (1080×1440) instead of squares. A reel cover is 1080×1920, and the grid shows only its middle 1080×1440, which is **y 240 to 1680**. The Reels tab shows the full 9:16.

- Put everything that matters (headline, product, face, logo) inside x 64–1016 and y 290–1630. That's the grid crop with ~50 px to breathe.
- The tile is shown at about a third of the phone's width, so the headline needs letters at least ~110 px tall at 1080 wide, in 2–5 words (heuristic).
- It shows something that actually happens in the reel. No invented numbers.
- Render it and preview the crop, both from the template:

  ```bash
  npx remotion still src/index.ts cover out/cover.jpg --image-format jpeg --jpeg-quality 92
  npx remotion ffmpeg -y -i out/cover.jpg -vf "crop=1080:1440:0:240,scale=360:-2" out/cover-grid.png   # what the grid tile shows, at tile size
  ```

Instagram takes the custom cover from the phone's photo library when you post. Deliver the cover as a JPEG the user can get onto their phone (AirDrop, email, a synced folder), and say so.

### Stories

- 1080×1920, 30 fps, **60 s per story**. Longer videos have to be split, so keep a CTA story at 5–15 s.
- Safe zone: the `story` format. Also leave one **empty spot for the link sticker**, which the user places in the app after uploading: just above the bottom margin, below the headline, where a thumb reaches (heuristic). The template's story keeps a 520×150 px spot at y 1370–1520; up to about 700×220 gives the user room to move the sticker. Point to it ("tap the link ↓") and check in every still after the CTA appears that nothing drifts into it.
- No fake counts or social proof. The sticker is the proof that the story works.

### Feed posts: 1:1, 4:5, 3:4

- Stills keep their full resolution when they are 1080 wide with an aspect ratio between 1.91:1 and 3:4 (1080×566 to 1080×1440). A 1080×1440 still fills both the feed and the grid tile with no crop, so use it for announcement images and carousel slides.
- Video in the feed: `portrait` (1080×1350, 4:5) takes more screen height than `square`. Both are cropped at the sides in the grid (section 2), so choose the cover frame with that in mind.

## 4. TikTok

| spec | value |
|---|---|
| canvas | 1080×1920; 16:9 and square are accepted but play small |
| frame rate | 23–60 fps (Content Posting API); render 30 |
| length | uploads up to 60 min (TikTok Support); up to 10 min through the Content Posting API |
| file | MP4 + H.264 recommended; up to 4 GB through the API. In-app limits vary by device and are not published |
| captions | no caption-file upload for posts; burn them in |
| safe zone | `reel` format. TikTok says the covered area grows with caption length and add-ons, so keep the post text short |
| cover | pick a frame or upload an image; design it like the Instagram cover, with the important parts in the middle band (heuristic: one cover can serve both) |

Scheduling tools post through the Content Posting API, so its limits (10 min, 4 GB, 23–60 fps) are the ones that bite when the user schedules instead of uploading by hand.

## 5. YouTube Shorts

- Up to **3 minutes**, with a square or vertical aspect ratio. A 16:9 upload becomes a regular video, not a Short.
- 1080×1920 at 30 fps. Upload settings follow YouTube's recommended encoding (section 6); the `shorts` preset gives H.264 High, limited-range BT.709 and fast start. It does not check length, so keep the cut at 180 s or less yourself (`node scripts/check.mjs` prints the duration).
- Custom Shorts thumbnails: 2160×3840 recommended (9:16), set in YouTube Studio on a computer, verified accounts only. Render the `cover` still with `--scale 2` for that.
- Safe zone: the `reel` format. The right-side action buttons can't be hidden, even on ads.

## 6. YouTube long-form and thumbnail

YouTube's recommended upload settings, and what the template does about each:

| YouTube recommends | template |
|---|---|
| MP4, moov atom at the front (fast start), no edit lists | `+faststart` in every MP4 preset |
| AAC-LC (or Opus), 48 kHz, stereo 384 kbps | the sound engine runs at 48 kHz; `youtube` preset: AAC 384k |
| H.264 High Profile, progressive, 2 consecutive B-frames, closed GOP of half the frame rate, CABAC, variable bitrate, 4:2:0 | `youtube` preset: `-profile:v high -bf 2 -g <fps/2> -flags +cgop`, CRF 16 (variable bitrate), yuv420p |
| 1080p SDR: 8 Mbps at 24–30 fps, 12 Mbps at 48–60 fps | `npm run render:showcase` (CRF 16, 320k audio) is usually above that, which is fine |
| BT.709 for SDR | the presets tag BT.709 (section 14) |

- Length: 15 min by default, longer after verification; hard limit 256 GB or 12 hours.
- The master from `npm run render:showcase` can be uploaded as is. YouTube reads its color tags correctly. Use `node scripts/encode.mjs youtube out/showcase.mp4` when the file is awkwardly large to move around.
- Captions: upload the SRT (section 15). YouTube takes `.srt` directly.

**Thumbnail: render at 3840×2160, not 1280×720.** YouTube's help page now asks for **3840×2160** (16:9, minimum width 640), JPG or PNG, under **2 MB when uploaded from a phone** and under 50 MB from a desktop. Custom thumbnails need a verified account. The template's `thumbnail` still is 1280×720, so render it at 3×:

```bash
npx remotion still src/index.ts thumbnail out/thumbnail.jpg --scale 3 --image-format jpeg --jpeg-quality 88   # → 3840×2160
```

If the JPEG is over 2 MB and the user uploads from a phone, drop `--jpeg-quality` to 80. Design rules (2–4 words, one big product moment, nothing in the bottom-right corner where YouTube draws the duration) are in [showcase-16x9](showcase-16x9.md) §11.

## 7. LinkedIn

**Feed video** (LinkedIn Help):

| spec | value |
|---|---|
| file size | 75 KB – 5 GB |
| length | 3 s (2 s from the mobile app) – 15 min |
| resolution | 256×144 to 4096×2304; aspect ratio 1:2.4 to 2.4:1 |
| frame rate / bitrate | 10–60 fps; 192 kbps – 30 Mbps |
| formats | MP4 (also MOV, WebM, MKV and others) |
| captions | SRT, attached while posting, **desktop only** |

1:1 or 4:5 takes the most feed space on both desktop and phone. 16:9 works too, and 9:16 is inside the accepted range (heuristic: pick 4:5 when unsure). The `linkedin` preset keeps the source size and frame rate at CRF 20, which lands a 1080p render far under LinkedIn's 30 Mbps ceiling.

**Company page cover: upload 2256×382.** LinkedIn's help page now lists **1512×256** as the recommended and minimum cover size, PNG or JPEG, up to 3 MB. The page displays it at 1128×191, and all three sizes share the same ~5.9:1 ratio. Rendering at 2× 1128×191 (**2256×382**) is above the minimum at the same ratio, so the real project's practice still holds. Keep the bottom-left corner empty: the page's logo sits over it. The page logo itself is 400×400 (minimum 268×268) and is shown on both light and dark backgrounds, so check it on both.

**Personal profile banner:** **1584×396** (4:1), JPG or PNG, under 8 MB. The profile photo covers part of the lower left, so keep text and faces out of the left third's bottom half (heuristic).

Neither is a template still yet. Add a `<Still>` to `src/Root.tsx` at the exact size (for example `id="linkedin-cover"`, 2256×382) that reuses theme tokens and the `Backdrop`, and render it with `npx remotion still src/index.ts linkedin-cover out/linkedin-cover.png`.

## 8. X

X's developer documentation lists the upload requirements for video posted through the API (scheduling tools use it): **0.5–140 s, up to 512 MB, at most 1280×1024, at most 40 fps**, H.264 High Profile, **4:2:0 (yuv420p) only**, AAC-LC, progressive, no open GOP. The web and app composers take larger frames (third-party guides list 1920×1200 on web). Standard accounts get 2:20; Premium accounts can post much longer videos.

- The `x` preset: H.264 High, yuv420p limited range, BT.709, CRF 20 capped at 16 Mbps, AAC-LC 192k at 48 kHz, at the source's size and frame rate. That suits the web and app composers. If a scheduler uploads through the API, the copy must also be at most 1280×1024 and 40 fps: `--width 1280` handles the size, but the preset keeps the frame rate, so a 60 fps showcase needs the manual line in section 14 with `-r 30` and `scale=1280:-2`.
- The raw Remotion master is full-range `yuvj420p` (section 14), which the API rules don't list. Always post the preset copy.
- Captions: the web composer has "Upload caption file (.srt)" next to "Tag people". One file per video, UTF-8 SRT only.

## 9. App Store app previews

Apple's specifications (App Store Connect Help):

| spec | value |
|---|---|
| length | 15–30 s |
| file | up to 500 MB; `.mov`, `.m4v` or `.mp4` (H.264), or `.mov` (ProRes 422 HQ) |
| video | H.264 High Profile up to Level 4.0, progressive, target 10–12 Mbps, **30 fps max** |
| audio | stereo, AAC 256 kbps, 44.1 or 48 kHz, all tracks enabled |
| poster frame | defaults to the frame at **5 s** |
| count | up to 3 previews per language, per device size |
| playback | muted by default on the product page and in search results |

Accepted resolutions (portrait / landscape):

| device class | devices (examples) | portrait | landscape |
|---|---|---|---|
| iPhone 6.9", 6.5", 6.3", 6.1" | iPhone X and every newer iPhone except SE (including Air, 16e, 17e) | **886×1920** | 1920×886 |
| iPhone 5.5" and 4" | 8 Plus, 7 Plus, 6s Plus; SE (1st gen), 5s | 1080×1920 | 1920×1080 |
| iPhone 4.7" | SE (2nd/3rd gen), 8, 7 | 750×1334 | 1334×750 |
| iPad 13", 11", 10.5" | iPad Pro, iPad Air, iPad, iPad mini | **1200×1600** | 1600×1200 |
| iPad 12.9" (2nd gen) | – | 1200×1600 or 900×1200 | 1600×1200 or 1200×900 |
| iPad 9.7" | older iPad, iPad Air 2, iPad mini 2–5 | 900×1200 | 1200×900 |
| Mac, Apple TV | – | – | 1920×1080 |
| Apple Vision Pro | – | – | 3840×2160 |

The `appstore` format (886×1920, 30 fps) matches the one size that covers every current iPhone. For iPad, add `appstoreIpad: { width: 1200, height: 1600, fps: 30, safe: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'App Store preview (iPad portrait)' }` to `FORMATS`.

**The rule that changes how you build it.** App Review Guideline 2.3.4 says previews "may only use video screen captures of the app itself", with narration and video or text overlays allowed. A UI rebuilt in `src/product/` is right for reels and showcases, but not as the picture of an App Store preview. Record the real app (for example `xcrun simctl io booted recordVideo --codec=h264 capture.mov` in the Simulator), put the file in `public/`, and use the template for what Apple allows on top: captions, highlights, transitions and sound. No hands, no people holding devices, no prices (they vary by region), and no dates.

```jsonc
// src/cuts.json
"appstore": {
  "format": "appstore", "cross": 0.3, "sound": true,
  "scenes": [ { "id": "capture", "seconds": 26, "marks": { "caption1": 0.4, "poster": 5.0, "caption2": 9.0, "caption3": 17.0 } } ]
}
```

```tsx
// src/scenes/Capture.tsx (register it as 'capture' in src/scenes/index.ts)
import { AbsoluteFill, OffthreadVideo, staticFile } from 'remotion';
import { Captions } from '../lib/text';
import { useMarks, useStage } from '../lib/time';

export function Capture() {
  const { W, H } = useStage();
  const m = useMarks();
  return (
    <AbsoluteFill>
      {/* Remotion's own video component; the capture is the whole picture, full-bleed */}
      <OffthreadVideo src={staticFile('capture.mov')} muted style={{ width: W, height: H, objectFit: 'cover' }} />
      <Captions variant="calm" top={120} size={68} maxWidth={W - 160} cues={[   // store pages show previews small: 64–80 px on 886 wide
        { at: m.caption1, text: 'Plan the week in one list.' },
        { at: m.caption2, text: 'Share it with one tap.' },
        { at: m.caption3, text: 'Everyone sees changes live.' },
      ]} />
    </AbsoluteFill>
  );
}
```

Make the frame at 5.0 s (the `poster` mark) the strongest composed moment: that's what people see when autoplay is off. The preview plays muted by default, so the captions carry the story, and the sound is a bonus for people who unmute.

Deliver it with exactly Apple's numbers. There is no `appstore` encode preset, so run it by hand. CRF 18 with a 12 Mbps ceiling keeps the peaks inside Apple's target without one-pass bitrate mode:

```bash
npx remotion render src/index.ts appstore out/appstore.mp4 --codec h264 --crf 16 --enforce-audio-track
npx remotion ffmpeg -y -i out/appstore.mp4 -vf "zscale=matrix=709:range=limited,format=yuv420p" -r 30 \
  -c:v libx264 -profile:v high -level:v 4.0 -preset slow -crf 18 -maxrate 12M -bufsize 24M \
  -x264-params colorprim=bt709:transfer=bt709:colormatrix=bt709 -color_range tv \
  -c:a aac -b:a 256k -ar 48000 -ac 2 -movflags +faststart out/appstore-iphone-886x1920.mp4
node scripts/check.mjs out/appstore-iphone-886x1920.mp4   # 15–30 s, 30 fps, 886×1920, audio present
```

Apple's 10–12 Mbps is a target, not a floor. A flat UI clip at CRF 18 came out near 0.5 Mbps in our test, which looks clean. If App Store Connect ever refuses a file for its bitrate, re-encode it with the two-pass pattern from section 14 at `-b:v 10M`.

A preview with no audio track gets rejected (reported by developers, and Apple's spec lists audio requirements). `--enforce-audio-track` adds a silent track when the cut has no sound. To add one to an existing file with the bundled ffmpeg, which has no `lavfi` input, use the filter instead:

```bash
npx remotion ffmpeg -y -i in.mp4 -filter_complex "anullsrc=channel_layout=stereo:sample_rate=48000[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -shortest out.mp4
```

## 10. Google Play promo video

From Play Console Help:

- The preview video is a **YouTube URL**: one video, not a playlist or channel. It must be public or unlisted, **with ads disabled**, and not age-restricted.
- Show the real app early, within the first 10 s, and keep it short: **only the first 30 s autoplays**. Landscape or portrait both work, so the `showcase` or the `reel` cut can serve.
- A Content ID claim on third-party music can put the claimant's ads on the video, which breaks the "ads disabled" rule. Sound synthesized by the engine is original, so there is nothing for Content ID to match. That's one more reason to use it.
- **Feature graphic: 1024×500**, JPEG or 24-bit PNG with no alpha, focal point toward the center, nothing important near the edges. Add a `<Still>` at exactly 1024×500 and render it as JPEG, which has no alpha by construction.

## 11. Product Hunt

From Product Hunt's help center:

- **Gallery images: 1270×760** (about 5:3). The gallery needs at least 2 images before it shows. Render stills at `--scale 2` (2540×1520, the same ratio) so they stay sharp on high-density screens (heuristic).
- **Video: YouTube links only**, the full URL (short links don't load), and not private. It appears in the gallery like an image. Use the showcase.
- **Thumbnail: 240×240**, square, under **3 MB**. A GIF is allowed but animates only on hover, so its first frame must work as a still. No strobing, quick cuts or unreadable text; the team edits "flashy" GIFs.
- Product Hunt reports that about 53% of products that reached Product of the Day since 2021 included a video.

A square thumbnail GIF from the `loop` cut (1600×1000), cropped to the middle:

```bash
npx remotion ffmpeg -y -i out/loop.mp4 -filter_complex "zscale,format=gbrp,crop=1000:1000:300:0,scale=240:240:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" -r 15 -loop 0 out/ph-thumb-240.gif
```

## 12. Landing pages and link previews

The embed code (hero loop plus the full film with a poster and captions track) is in [showcase-16x9](showcase-16x9.md) §12. What to ship:

- **MP4 H.264 is required; WebM VP9 is optional.** List the WebM `<source>` first and the MP4 second. Browsers take the first they can play, and the MP4 is the one every browser can play (web.dev).
- **Re-encode, never embed the render.** The render is full-range `yuvj420p` (section 14). The web copies are one ffmpeg line each: the loop's in [formats](formats.md) §6, the film's in [showcase-16x9](showcase-16x9.md) §12.
- **`autoplay muted loop playsinline`.** Chrome always allows muted autoplay. WebKit lets a video play without a tap when it is muted or has no audio track, requires `playsinline` to keep it inline on iPhone, and pauses it off-screen. `npm run render:loop` renders `--muted`, so the file has no audio track at all.
- **Fast start.** `-movflags +faststart` puts the index at the front, so playback starts before the download ends. Every MP4 preset does it.
- **Poster.** For a loop, use its first frame, so nothing jumps when it starts. For the film, use a designed frame. Same pixel size as the video, JPEG quality 80–85.
- **Budget.** Hero loop ~2–3 MB (a working budget): H.264 CRF 22–26, and VP9 CRF 31 (Google's 1080p recommendation) to 33 (the `webm` preset uses 32). On a flat dark UI clip we measured VP9 CRF 31 only ~8% smaller than H.264 CRF 22, so measure both and skip the WebM when it saves little.
- **GIF only where video can't play:** email, some docs tools, the Product Hunt thumbnail. web.dev's example: a 3.7 MB GIF became a 551 KB MP4 and a 341 KB WebM. GIF widths: 800 px for a README hero, 600 for docs, 480 for chat (the `gif` preset makes 720, or 400 for portrait; pass `--width` and `--fps` for others). Use 12–15 fps, 8 s at most, and aim for 5 MB or less.
- **Link previews (Open Graph image).** Meta asks for at least **1200×630** (1.91:1, under 8 MB). Most other unfurlers read the same `og:image` (heuristic). Render a `<Still>` at 1200×630 with the product name and one line, not a frame grab with a caption cut in half.

## 13. Slack, Discord, Notion, GitHub

| place | limit | what plays inline | send |
|---|---|---|---|
| Slack | 1 GB per file | MP4 H.264 + AAC plays inline in practice; other containers may need a download | the 1080p preset MP4 |
| Discord | **20 MB** on free accounts since 13 Aug 2026 (was 10 MB); Nitro Basic 50 MB, Nitro 500 MB | MP4 and GIF inline | `--max-mb 19` copy, at 720 wide if the budget is thin |
| Notion | **5 MB** per upload on the Free plan | uploaded MP4 (some encodes don't play); YouTube/Vimeo embeds | a YouTube or unlisted link, or a GIF under 5 MB |
| GitHub (README, issues, PRs) | images and GIFs 10 MB; videos 10 MB (free plans) or 100 MB (paid); `.mp4`, `.mov`, `.webm` | GIFs inline; a video gets a player when uploaded through the web editor | GIF ≤ 5 MB, or MP4 ≤ 10 MB dragged into the editor |

In a README, a relative link to an MP4 in the repo shows as a link, not a player (heuristic from practice). Drag the MP4 into GitHub's web editor, which uploads it and inserts a player link, or use a GIF.

## 14. Encoding

### What `scripts/encode.mjs` does

```bash
node scripts/encode.mjs <preset> <input> [--max-mb N] [--out file] [--width px] [--fps n] [--mute]
node scripts/encode.mjs instagram out/reel.mp4 --max-mb 9      # → out/reel-instagram-9mb.mp4
```

It writes `out/<input name>-<preset>[-<N>mb].<ext>` (or the `--out` path), prints its size, and suggests the `check.mjs` line to run next. Every H.264 preset produces **MP4, H.264 High, yuv420p converted to limited range by zscale and tagged BT.709, `+faststart`, AAC-LC at 48 kHz**, with `aq-mode=3` moving bits toward the dark, flat areas that band first. The sound is copied as it is when the render's AAC is already good enough (48 kHz stereo, at least the preset's bitrate or 128 kbps, which every `render:*` script's output is): a second AAC generation smears it and pushes its true peak up by about half a dB, past the room the −2 dBTP master left. Otherwise it is re-encoded at the preset's bitrate. Without `--max-mb` it encodes at constant quality (CRF). With it, it runs two passes at the bitrate that fits (below) and warns when fewer than 400 kbps are left for the picture. `--width` scales (the height follows), `--mute` drops the audio, and `--fps` applies to the GIF only.

| preset | picture | audio (when it is not copied) |
|---|---|---|
| `instagram` | source size and frame rate, CRF 18 | AAC 192k |
| `tiktok` | source size and frame rate, CRF 18 | AAC 192k |
| `shorts` | source size and frame rate, CRF 18 | AAC 192k |
| `youtube` | source size and frame rate, CRF 16, 2 B-frames, closed GOP of half the frame rate | AAC 384k |
| `linkedin` | source size and frame rate, CRF 20 | AAC 192k |
| `x` | source size and frame rate, CRF 20, at most 16 Mbps | AAC 192k |
| `gif` | 720 wide (400 for portrait), 15 fps, converted to RGB by zscale, a 192-color palette built from what moves, Bayer dither | none |
| `webm` | source size, VP9 CRF 32 with `-b:v 0` | Opus 128k if the source has audio (`--mute` drops it) |

The script checks no platform limits (length, frame rate, pixel size): compare `node scripts/check.mjs` on the copy with section 1. No preset changes the frame rate, so render phone cuts at 30 fps in the first place (the `reel`, `story`, `square` and `portrait` formats already are), and use the manual lines below when a destination needs another rate.

The presets convert color the way the manual lines below do, with `zscale=matrix=709:range=limited,format=yuv420p` (the GIF with `zscale,format=gbrp` before its palette), and resize after it when you pass `--width`. Measured on a dark frame of the demo showcase, the `instagram` copy's dark areas came out 0.15 levels under the source on average, where the swscale conversion the script used before (`scale=out_range=tv:out_color_matrix=bt709`) came out 1.0 level under, up to 2 in the darkest patches; the GIF, 0.5 levels under against 2.7. An untagged input (some screen recordings) gets `matrixin=709` and a `rangein` from its pixel format, so zscale doesn't stop. If the script lacks an option you need (another frame rate, another color path), run the ffmpeg lines below directly.

### Why these settings

- **H.264 High, yuv420p.** It's the one combination every platform, browser and phone decodes. The FFmpeg wiki notes that QuickTime and most players only support 4:2:0 for H.264, and X's API accepts nothing else.
- **Limited range, BT.709 tags.** In the real project's renders (Remotion 4.0.529, default flags), ffprobe showed `yuvj420p`, `color_range=pc`, `color_space=bt470bg`: full range, tagged BT.601. Remotion 4's default color space is the BT.601 equivalent, and Remotion 5 switches the default to BT.709. Some pipelines mishandle full-range files, and dark UI themes are where that shows. Two traps in the bundled ffmpeg, both measured: `-pix_fmt yuv420p` alone leaves the file full range (it still reports `yuvj420p`), and swscale's `scale=out_range=tv:out_color_matrix=bt709` darkened a dark theme's shadows by about 2 levels. **`zscale=matrix=709:range=limited,format=yuv420p`** matched the source to within 1 level. zscale reads the input's tags. If it errors on an untagged file (some screen recordings), add `matrixin=709:rangein=limited`.
- **`+faststart`.** YouTube asks for the moov atom at the front, and browsers need it to start playing before the download ends.
- **AAC-LC at 48 kHz.** The sound engine renders at 48 kHz, YouTube recommends 48 kHz, and Apple accepts it. Resampling to 44.1 would add a step for nothing.
- **30 fps for phones.** Instagram asks for at least 30, X's API caps at 40, and App Store previews cap at 30. Under a size cap, halving the frames doubles the bits per frame.

### What the bundled ffmpeg can and can't do

`npx remotion ffmpeg` is a trimmed build, so users need nothing installed, but it has only these filters: `scale`, `zscale`, `colorspace`, `crop`, `format`, `split`, `palettegen`, `paletteuse`, `hflip`/`vflip`/`transpose`/`rotate`, `trim`, `concat`, `loudnorm`, `silencedetect`, `volume`, `amix`, `anullsrc` and a few more. That has consequences:

| you want | this build | do instead |
|---|---|---|
| change frame rate (`fps=30`) | no `fps` filter | output option `-r 30` (drops frames evenly) |
| silent audio (`-f lavfi -i anullsrc`) | no `lavfi` input | `-filter_complex "anullsrc=…[a]"` (section 9) |
| loudness (`ebur128`) | not built | `node scripts/check.mjs`, or `-vn -af loudnorm=print_format=json -f null -` |
| burn in subtitles (`subtitles`, `drawtext`) | not built | captions are drawn by `Captions` in the render |
| soft subtitles inside the MP4 (`mov_text`) | no encoder | ship the `.srt` beside the video (section 15) |
| WebVTT output | no muxer | write the `.vtt` as text (section 15) |
| `pad`, `tile`, `select`, `fps` | not built | lay out in Remotion or crop instead |

### CRF or two-pass

- **CRF (constant quality)** says how good, not how big. Use it for masters and for every upload with no size cap. 16 for the showcase master, 18 for phone cuts, 22–26 for web loops. Lower is better quality, and 0–51 is the scale for 8-bit x264.
- **Two-pass (target bitrate)** says how big. Use it only when a cap exists. Pass 1 measures the whole video, and pass 2 spends the bits where they are needed, so the file lands just under the target. Never use one-pass bitrate mode: it can't plan ahead and wastes bits on still stretches.

The math. Leave headroom, because "10 MB" can mean 10,000,000 bytes or 10 MiB, two-pass lands a little either side of its target, and the container adds a little. The script keeps 4% back, and takes the audio's bitrate out of the budget: the render's own AAC when it copies it (only while that costs at most a sixth of the budget), else the preset's (192k for `instagram`). The manual line below keeps 5% and uses 128k audio:

```
video kbps = floor(maxMB × 8000 × 0.95 / seconds) − audio kbps
37.9 s reel, 10 MB cap, 128k audio → floor(10 × 8000 × 0.95 / 37.9) − 128 = 1877 kbps
```

Run on the real project's 37.9 s 1080×1920 reel, this gave a 9.65 MB file, in about 20 s per pass on a modest laptop. For a hard 10 MB cap, ask the script for 9 (`--max-mb 9`) and read the size it prints. By hand:

```bash
IN=out/reel.mp4; OUT=out/reel-instagram-1080x1920-10mb.mp4
DUR=$(npx remotion ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
V=$(node -e "console.log(Math.floor(10 * 8000 * 0.95 / $DUR) - 128)")
VF="zscale=matrix=709:range=limited,format=yuv420p"
npx remotion ffmpeg -y -i "$IN" -vf "$VF" -r 30 -c:v libx264 -profile:v high -preset slow -b:v ${V}k -pass 1 -passlogfile out/x264 -an -f null -
npx remotion ffmpeg -y -i "$IN" -vf "$VF" -r 30 -c:v libx264 -profile:v high -preset slow -b:v ${V}k -pass 2 -passlogfile out/x264 \
  -x264-params colorprim=bt709:transfer=bt709:colormatrix=bt709 -color_range tv \
  -c:a aac -b:a 128k -ar 48000 -movflags +faststart "$OUT"
```

When the budget is thin (a working heuristic: under about 1.5 Mbps for 1080×1920 at 30 fps), text edges soften and dark gradients band into steps. Fix it in this order: make sure the copy is 30 fps; drop `Grain` for that cut (noise is expensive); simplify big gradients; then scale the copy to 720 wide (add `,scale=720:-2:flags=lanczos` after the zscale). Every time, pull stills from the encoded file and compare them with lossless stills at the same times ([review-and-qa](review-and-qa.md) §9).

### GIF

A good GIF needs a palette built for this clip. Two lessons from Clément Bœsch's guide: `stats_mode=diff` builds the palette from what moves, not the static background, and `diff_mode=rectangle` keeps dither noise out of the parts that don't change. Bayer dithering at scale 2–3 compresses better than error diffusion.

```bash
npx remotion ffmpeg -y -i out/loop.mp4 -filter_complex "zscale,format=gbrp,scale=800:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" -r 15 -loop 0 out/loop-800.gif
```

`zscale,format=gbrp` converts to RGB with the input's own color tags. Without it, the dark UI we tested came out about 1.5 levels darker in the shadows. A 6 s, 800×450, 15 fps clip of a dark UI came to 2.4 MB. A loop still wraps cleanly as a GIF if duration × GIF fps is a whole number (6 s × 15 = 90 frames). Too big? Cut `max_colors` to 64, the width to 640, or the fps to 12, in that order.

### WebM (VP9)

```bash
npx remotion ffmpeg -y -i out/loop.mp4 -vf "zscale=matrix=709:range=limited,format=yuv420p" -c:v libvpx-vp9 -crf 31 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 -an out/loop.webm
```

`-b:v 0` with `-crf` means constant quality. Google's VOD guide recommends CRF 31 at 1080p and 32 at 720p. `-row-mt 1` lets VP9 use more cores, and `-deadline good -cpu-used 2` trades a little time for size. VP9 is slower to encode than x264 (17 s against 7 s for our 6 s test clip).

### Checking a delivered file

```bash
node scripts/check.mjs out/reel-instagram-1080x1920-10mb.mp4    # duration, fps, size, loudness, true peak
npx remotion ffprobe -v error -show_entries stream=codec_name,profile,pix_fmt,color_range,color_space,r_frame_rate,sample_rate -of compact out/reel-instagram-1080x1920-10mb.mp4
```

Expect `h264`, profile `High` (100), `yuv420p`, `tv`, `bt709`, the preset's frame rate, an `aac` stream at 48000, and a size under the cap.

## 15. Caption files: SRT and VTT

Burned-in `Captions` are always there, and they are the only captions on Instagram and TikTok. A caption file adds real closed captions, which people can turn on and off, and which count for accessibility, where a platform takes one:

| platform | caption file | notes |
|---|---|---|
| YouTube | yes: `.srt` (also `.sbv` and others) | upload in YouTube Studio → Subtitles |
| LinkedIn | yes: `.srt` | desktop only, attached while creating the post |
| X | yes: `.srt` | one file per video, UTF-8 |
| Facebook | yes | – |
| Instagram, TikTok, Threads | no | burn them in (already done) |
| your landing page | `.vtt` in a `<track>` | – |

The template writes them from the words the video says:

```bash
node scripts/captions.mjs showcase               # → out/showcase.srt, out/showcase.vtt, out/showcase.txt
node scripts/captions.mjs showcase showcase-de   # another language's block of src/captions.json, same timing
```

The lines come from `src/captions.json`, the same data the scenes draw through `useCues()`, and each is timed from its scene's marks with the sound engine's clock (`sound/timeline.mjs`), warps included, so the file never drifts from the video. Each cue keeps to at most 2 lines of at most 42 characters and stays up until the next one, the end of its scene or 7 s; punch cues are joined into readable lines, since a closed caption is read, not watched; and the script warns about any line shorter than its reading time (words ÷ 3 + 1 s; Netflix's English style guide asks for at least 5/6 s an event). The `.txt` is the plain transcript for the page or the post text. The end card's name, URL and call to action come from `BRAND` and are not in the files. The details and the format of `captions.json`: [captions-and-type](captions-and-type.md) §15. Open the SRT next to a few stills at cue times and confirm they match.

## 16. File names

`<product>-<cut>-<platform>-<W>x<H>[-<cap>mb][-v<n>].<ext>`, all lowercase, hyphens, no spaces. Spaces break upload tools and shell commands. Sizes in the name stop "which one is the Instagram one?" questions.

```
lumen-showcase-youtube-1920x1080.mp4
lumen-reel-instagram-1080x1920-10mb.mp4
lumen-reel-tiktok-1080x1920.mp4
lumen-reel-cover-1080x1920.jpg
lumen-thumbnail-youtube-3840x2160.jpg
lumen-story-waitlist-1080x1920.mp4
lumen-hero-loop-1600x1000.mp4 / .webm / -poster.jpg
lumen-showcase.en.srt
lumen-linkedin-cover-2256x382.png
```

Add `-v2`, `-v3` only while iterating with the user. Final files drop the version. `out/` is gitignored and every render overwrites it, so never treat it as the delivery folder.

## 17. Delivering to the user

The user is often not a video person. Give them files they can post without asking what each one is.

**1. Pick the set.** The usual set for "a reel and a launch video": the showcase master, the reel as posted (preset copy, capped if their tool needs it), the reel cover, the YouTube thumbnail, the SRT, and the story if one was made. Add the landing loop (MP4 + WebM + poster) and the GIF only if they asked for web use. Offer an SFX-only version only if they will add their own music: `ONLY=sfx,whoosh node sound/design.mjs reel` writes `public/sound-reel-sfx+whoosh.wav` (no pad, no beat) and leaves the full mix alone. Put it under the picture without re-rendering: `npx remotion ffmpeg -y -i out/reel.mp4 -i "public/sound-reel-sfx+whoosh.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest out/reel-sfx.mp4`, then run it through the platform preset like the main reel ([sound-design](sound-design.md) §13).

**2. Send them.** If the host has a tool for sending files to the user, use it for the main deliverables. Show the video and cover inline so they can watch right away, and send the rest as attachments. Send the finished set once, not every intermediate render.

**3. Put copies where they'll find them.** Copy the set into a dated folder in their Downloads, renamed per section 16:

```bash
node --input-type=module <<'EOF'
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
const dir = join(homedir(), 'Downloads', 'lumen-video-2026-09-28');
mkdirSync(dir, { recursive: true });
const files = {                                           // source (as rendered / as encode.mjs printed) → delivery name
  'out/showcase.mp4': 'lumen-showcase-youtube-1920x1080.mp4',
  'out/reel-instagram-9mb.mp4': 'lumen-reel-instagram-1080x1920-10mb.mp4',
  'out/cover.jpg': 'lumen-reel-cover-1080x1920.jpg',
  'out/thumbnail.jpg': 'lumen-thumbnail-youtube-3840x2160.jpg',
  'out/showcase.en.srt': 'lumen-showcase.en.srt',
};
for (const [src, name] of Object.entries(files)) {
  copyFileSync(src, join(dir, name));
  console.log(`${(statSync(src).size / 1e6).toFixed(1).padStart(6)} MB  ${join(dir, name)}`);
}
EOF
```

On Windows, Downloads can be redirected (OneDrive), so confirm the folder exists and tell the user the full path. If the disk is nearly full, say how big the set is before copying masters.

**4. Say what each file is for,** in a short table, in plain words:

| file | what it's for | where it goes | notes |
|---|---|---|---|
| `lumen-reel-instagram-1080x1920-10mb.mp4` | the reel | Instagram Reels (and TikTok) | fits the 10 MB cap; turn on "upload at highest quality" |
| `lumen-reel-cover-1080x1920.jpg` | the reel's cover | pick it as the cover when posting | put it on your phone first; the grid shows only the middle |
| `lumen-showcase-youtube-1920x1080.mp4` | the full product video | YouTube, landing page | upload `lumen-showcase.en.srt` as its subtitles |
| `lumen-thumbnail-youtube-3840x2160.jpg` | YouTube thumbnail | YouTube Studio → thumbnail | needs a verified channel |

Then add one or two things to check before posting: "watch it once on your phone with the sound off, then once with it on", and anything the platform needs from them (the story's link sticker, the Play Console ads switch). If the product belongs to a company of more than 3 people, mention once that Remotion needs a company license for commercial use there.

## 18. Pre-upload checklist

- [ ] **Right canvas and fps** for the destination (section 1). `check.mjs` agrees with `FORMATS`, and `cutDuration(cut)` matches the duration to within a frame.
- [ ] **Under the limits:** length (Reels ≤ 3 min for reach, Shorts ≤ 3 min, X ≤ 140 s, App Store 15–30 s, Stories 60 s per card) and file size (the user's tool cap, Discord 20 MB, GitHub 10 MB, App Store 500 MB).
- [ ] **Safe zones:** `--safe` stills show no caption, URL, CTA or logo crossing the margin. The cover's key content sits in y 240–1680. A square post for Instagram keeps text in x 135–945.
- [ ] **Encoded copy, not the raw master,** for every platform except YouTube: H.264 High, `yuv420p`, `tv`, `bt709`, AAC 48 kHz, fast start (the ffprobe line in section 14).
- [ ] **Stills from the encoded file** at 3–4 text-heavy moments: text sharp, no banding in dark gradients, no grain blocks.
- [ ] **Loudness** measured on the delivered file: about −14 LUFS for social, −16 to −18 for a showcase, true peak ≤ −1 dBTP. An App Store preview has an audio track, silent if need be.
- [ ] **Captions:** burned in for Instagram and TikTok; SRT ready for YouTube, LinkedIn and X; VTT for the site. Spot-check the SRT against stills.
- [ ] **Covers and thumbnails** exist at the right sizes: reel cover 1080×1920, YouTube thumbnail 3840×2160 (under 2 MB if uploaded from a phone), LinkedIn cover 2256×382, Play feature graphic 1024×500 (no alpha), Product Hunt 1270×760 and 240×240 (under 3 MB).
- [ ] **Honesty:** every number on screen is true today, every credited logo agreed to be there, and App Store footage is real screen capture.
- [ ] **Files named** per section 16, **copied** to the user's folder, **sent**, and **explained** in one table.

## Sources

All checked in September 2026. Where a page refused automated reading, its facts were read from the search engine's copy of the page, and that is noted.

Instagram and Meta
- Instagram Help, Record a reel (20 min; over 3 min not recommended to new audiences): https://help.instagram.com/2720958398006062 (search copy)
- Instagram Help, Reel size & aspect ratios (1.91:1–9:16, ≥ 30 fps, ≥ 720 px, highest-quality upload setting): https://help.instagram.com/1038071743007909 (search copy)
- Instagram Help, Image resolution of photos (1080 wide, 1.91:1 to 3:4): https://help.instagram.com/1631821640426723 (search copy)
- Instagram Help, 60-second maximum length (Stories): https://help.instagram.com/270963803047681 (search copy)
- Meta Ads Guide, Instagram Reels video specs (14% top, 35% bottom, 6% sides): https://www.facebook.com/business/ads-guide/update/video/instagram-reels (search copy)
- Meta Business Help, Text overlays and the Safe Zone for Stories and Reels: https://www.facebook.com/business/help/980593475366490 (search copy)
- Meta Ads Guide, Instagram Stories video specs (14% / 250 px top, 20% / 340 px bottom): https://www.facebook.com/business/ads-guide/update/video/instagram-story (search copy)
- Behaviour Digital, report that Meta unified the Reels and Stories safe zones in March 2026 (third party): https://behaviour.digital/post/meta-reels-safe-zone-14-top-35-bottom-6-sides-the-2026-official-guide
- Kapwing, Instagram's new 3:4 grid (January 2025, announced by Adam Mosseri): https://www.kapwing.com/resources/instagrams-new-grid-layout-size-and-dimensions-2025/ (search copy)
- Oktopost, Instagram grid tile 1080×1440: https://www.oktopost.com/blog/instagram-grid-size-guide/ (search copy)
- Meta for Developers, Images in link shares (at least 1200×630, 1.91:1, 8 MB): https://developers.facebook.com/documentation/sharing/webmasters/images (search copy)

TikTok
- TikTok Support, uploading videos (up to 60 min): https://support.tiktok.com/en/using-tiktok/uploading-videos (search copy)
- TikTok for Developers, Content Posting API media transfer guide (MP4/H.264, 23–60 fps, 4 GB, 10 min): https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide (search copy)
- TikTok Ads, Auction In-Feed Ads (safe zone depends on caption and add-ons; templates; ≥ 540×960; ≤ 500 MB): https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads (search copy)
- CreaMate, TikTok safe zone guide (measured preset, reviewed 2026-08, not official): https://creamate.ai/en/blog/tiktok-safe-zone-guide
- Zeely, TikTok safe zones (overlay bands, not official): https://zeely.ai/blog/tiktok-safe-zones/

YouTube and Google
- YouTube Help, Upload YouTube Shorts (up to 3 min, square or vertical): https://support.google.com/youtube/answer/12779649
- YouTube Help, Recommended upload encoding settings: https://support.google.com/youtube/answer/1722171
- YouTube Help, Add video thumbnails (3840×2160, min width 640, 2 MB mobile / 50 MB desktop, Shorts thumbnails): https://support.google.com/youtube/answer/72431
- YouTube Help, Upload videos longer than 15 minutes (256 GB or 12 h): https://support.google.com/youtube/answer/71673
- YouTube Help, Supported subtitle and closed caption files: https://support.google.com/youtube/answer/2734698 (search copy)
- Google Ads Help, YouTube Shorts ads asset specs and best practices: https://support.google.com/google-ads/answer/16041697
- Google Ads Help, Shorts ads FAQ (action buttons overlay the right side; safe-area reference images): https://support.google.com/google-ads/answer/16041383 (search copy)
- Play Console Help, Add preview assets (YouTube URL rules, first 30 s autoplay, feature graphic 1024×500): https://support.google.com/googleplay/android-developer/answer/9866151
- Google, VP9 VOD recommended settings (CRF 31 at 1080p, 32 at 720p): https://developers.google.com/media/vp9/settings/vod

LinkedIn and X
- LinkedIn Help, video specs (75 KB–5 GB, 3 s–15 min, 256×144–4096×2304, 1:2.4–2.4:1, 10–60 fps): https://www.linkedin.com/help/linkedin/answer/a548372
- LinkedIn Help, Image specifications for LinkedIn Pages (cover 1512×256, 3 MB; logo 400×400): https://www.linkedin.com/help/linkedin/answer/a563309
- LinkedIn Help, Add or change the background photo (1584×396, under 8 MB): https://www.linkedin.com/help/linkedin/answer/a566232 (search copy)
- LinkedIn Help, Add closed captions to videos (SRT, desktop): https://www.linkedin.com/help/linkedin/answer/a552177 (search copy)
- X Developer, Media best practices (0.5–140 s, 512 MB, ≤ 1280×1024, ≤ 40 fps, yuv420p, AAC-LC): https://developer.x.com/en/docs/x-api/v1/media/upload-media/uploading-media/media-best-practices (search copy)
- X Help, How to upload a caption (.srt) file: https://help.x.com/en/using-x/upload-caption-srt-file (search copy)
- HeyOrca, X media specs 2026 (2:20, 512 MB; third party): https://www.heyorca.com/blog/x-twitter-media-specs-best-practices-2026

Apple
- App Store Connect Help, App preview specifications: https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications
- Apple, App previews (guidelines, muted autoplay, up to 3, poster frame): https://developer.apple.com/app-store/app-previews/
- App Review Guidelines, 2.3.4 Previews: https://developer.apple.com/app-store/review/guidelines/
- Matteo Mazzarolo, Generating iOS app previews (no audio track gets rejected; silent-track fix): https://mmazzarolo.com/blog/2020-09-07-app-store-previews/

Product Hunt, web, chat tools
- Product Hunt Help, How to post a product (1270×760, 240×240, GIF under 3 MB, YouTube only): https://help.producthunt.com/en/articles/479557-how-to-post-a-product
- Product Hunt, Preparing for launch (53% of Product of the Day since 2021 had a video): https://www.producthunt.com/launch/preparing-for-launch
- web.dev, Replace animated GIFs with video: https://web.dev/articles/replace-gifs-with-videos
- Chrome for Developers, Autoplay policy: https://developer.chrome.com/blog/autoplay
- WebKit, New video policies for iOS: https://webkit.org/blog/6784/new-video-policies-for-ios/
- Slack Help, Add files to Slack (up to 1 GB): https://slack.com/help/articles/201330736-Add-files-to-Slack
- Dexerto, Discord raises free upload limit to 20 MB (13 Aug 2026; Nitro Basic 50 MB, Nitro 500 MB): https://www.dexerto.com/entertainment/discord-raises-free-upload-limit-to-20mb-after-lowering-it-two-years-ago-3398251/
- Discord on X, the announcement: https://x.com/discord/status/2087987317298360489 (search copy)
- Notion Help, Images, files & media (Free plan uploads under 5 MB): https://www.notion.com/help/images-files-and-media
- GitHub Docs, Attaching files (10 MB images/GIFs; videos 10 MB free, 100 MB paid): https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files

Encoding and captions
- FFmpeg wiki, H.264 encoding guide (CRF scale, `+faststart`, yuv420p for QuickTime): https://trac.ffmpeg.org/wiki/Encode/H.264 (search copy)
- Clément Bœsch, High quality GIF with FFmpeg (palettegen/paletteuse, `stats_mode=diff`, `diff_mode=rectangle`, bayer dither): https://blog.pkh.me/p/21-high-quality-gif-with-ffmpeg.html
- Remotion, `npx remotion render` flags (`--color-space`, `--enforce-audio-track`, `--muted`): https://www.remotion.dev/docs/cli/render
- Remotion, v5.0 migration (default color space becomes bt709): https://www.remotion.dev/docs/5-0-migration (search copy)
- Remotion, License FAQ (free up to 3 people, company license beyond): https://www.remotion.dev/docs/license/faq (search copy)
- UC Berkeley Digital Accessibility, Video caption support by platform (updated 16 Mar 2026): https://dap.berkeley.edu/social-media/video-caption-support
- Netflix Partner Help, English (USA) Timed Text Style Guide (42 characters per line, 5/6 s minimum): https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide (search copy)

Measurements marked "measured" or "we measured" in this file were made on the real project's renders with Remotion's bundled ffmpeg n7.1 in September 2026.
