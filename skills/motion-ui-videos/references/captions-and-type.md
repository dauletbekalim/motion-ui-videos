# Captions and type: words people can read on a moving picture

Most people meet a product video with the sound off, on a phone, for a second or two before they decide to stay. The words on screen carry the story, so they have to be big enough, on screen long enough, clear of the platform's buttons, and written in plain language. Before the first caption of any cut, read §8 (reading time: a sentence holds (words ÷ 3) + 1 s, a punch chunk max(0.5 s, words ÷ 3)) and §10 (calm and punch, and the two effects to keep rare). Read §2 and §7 for sizes and placement, §4 when a line wraps badly, §6 when a still shows text that is hard to read, §9 while writing, §11 for titles and hooks, §13 for other languages, §14–15 for caption files, and §16 for accessibility. §17 is the checklist.

"Captions" here means the words drawn into the video. The text field under a post, which Instagram also calls a caption, is "post text" in this file.

## Contents

1. [The numbers on one card](#1-the-numbers-on-one-card)
2. [Type scale per format](#2-type-scale-per-format)
3. [Minimum sizes on a phone](#3-minimum-sizes-on-a-phone)
4. [Line length and line breaks](#4-line-length-and-line-breaks)
5. [Weight, tracking, leading and case](#5-weight-tracking-leading-and-case)
6. [Contrast on busy pictures](#6-contrast-on-busy-pictures)
7. [Placement and safe zones](#7-placement-and-safe-zones)
8. [Reading time](#8-reading-time)
9. [Writing captions](#9-writing-captions)
10. [Calm and punch captions](#10-calm-and-punch-captions)
11. [Kinetic type patterns](#11-kinetic-type-patterns)
12. [Emphasis color, sparingly](#12-emphasis-color-sparingly)
13. [Localization](#13-localization)
14. [Burned-in captions and platform captions](#14-burned-in-captions-and-platform-captions)
15. [Exporting SRT from your cues](#15-exporting-srt-from-your-cues)
16. [Accessibility](#16-accessibility)
17. [Checklist before you render](#17-checklist-before-you-render)

## 1. The numbers on one card

| | showcase, 1920×1080 (`calm`) | reel, 1080×1920 (`punch`) |
|---|---|---|
| caption size | 56–64 px (52 px floor); the fallback is 60 | 84–110 px (fallback 92); 64–72 px for calm sentences in 9:16 (fallback 68) |
| words at once | one sentence, 4–10 words | one phrase per cue, shown 1–3 words at a time |
| characters per line | ≤ ~40 | ≤ ~16 per chunk (one line), ≤ ~24 for calm sentences |
| lines | 1, at most 2 | 1 per chunk, at most 3 for a calm sentence |
| `maxWidth` | ~1300 px (68% of the width; the fallback, 1,306) | 780 px, centered (the fallback) |
| where | a band above the product, `top` ≈ 84–120 px (fallback 84) | a band above the product (`top` ≈ 300–480; the fallback is 330); the lower band (`top` ≈ 1140) only if the caption ends above y ≈ 1250 |
| hold | ≥ words ÷ 3 + 1 s | ≥ max(0.5 s, words ÷ 3) per cue, so each word gets ≥ 0.27 s |
| weight | 500 (the component's) | 800 (the component's) |
| motion | the old line fades up and away, then the new one arrives whole (§10) | each chunk lands whole; words lit in turn (`lit`) only with a voiceover or a beat grid (§10) |
| contrast | ≥ 7:1 against what is behind it | ≥ 7:1, with a scrim where it crosses bright UI |

Every number below has its reason next to it. When a number and a still disagree, trust the still: render it (`node scripts/stills.mjs <cut> --marks --safe`) and look.

## 2. Type scale per format

Sizes are in pixels of the composition. The same px size reads very differently per format, because a 1920-wide frame and a 1080-wide frame are both squeezed onto the same few inches of screen.

| role | showcase 1920×1080 | reel / story 1080×1920 | square 1080×1080, portrait 1080×1350 | loop 1600×1000 |
|---|---|---|---|---|
| hook title (`KineticTitle`, big `Words`) | 120–160 | 110–180 | 110–150 | rarely any |
| headline (reveal line, end card title) | 96–146 | 96–120 | 88–110 | 64–96 |
| calm caption (`Captions` `calm`) | 56–64 | 64–72 | 60–68 | none |
| punch caption (`Captions` `punch`) | not used | 84–110 | 80–100 | none |
| secondary line (promise under the name, subline) | 44–52 | 52–60 | 48–56 | 36–44 |
| labels in the scene (cursor tags, `Callout`, `Badge`) | 22–32 | 30–40 | 28–36 | 20–28 |
| URL on the end card (`EndCard` draws 56) | 56–64 | 52–60 | 48–56 | 40–48 |
| small print (credits, a legal line) | 28–36 | 36–44 | 34–40 | 24–30 |
| floor for anything a viewer must read | 24 | 32 | 30 | 20 |

Where these come from. The launch film this skill is distilled from used 58–64 px calm captions and a 146 px closing headline at 1920×1080, a 52 px weight-400 promise line under the product name, and 22 px mono eyebrows. Its vertical cut used 64–72 px captions, 96–104 px headlines and a 36 px "tap the link" line at 1080×1920. The BBC's subtitle guidelines land in the same place from the other direction: a line height of 7–8% of the frame height for 16:9 (about 76–86 px at 1080 tall) and 3.9–4.5% for 9:16 (about 75–86 px at 1920 tall). That is a 62–72 px font at a normal line height, the calm-caption size for vertical, and a little above the showcase size because broadcast subtitles are read across a room.

`Captions` falls back to 60 px (calm, 16:9 and square), 68 px (calm, 9:16) and 92 px (punch, 9:16) when you pass no `size`, inside the table's ranges. Pass `size` when a cut needs another step, and pass the same one in every scene (below).

Two end-card numbers sit outside their rows on purpose. The URL gets caption size, not small-print size: it is the one line a viewer may type later, and a 16:9 film in a phone feed shrinks 56 px to about 11 pt, Apple's floor (§3). And the product's name is a one-word wordmark rather than a sentence, so `EndCard` sets it bigger than a headline: 124 px, 174 on a phone.

Two rules sit on top of the table:

- **One size per role per video.** If captions are 60 px in one scene and 68 px in the next, the eye notices the jump and reads it as a mistake. Pick the size once per cut (from `useStage()`) and pass it everywhere.
- **UI text is not caption text.** The product's own 13–15 px interface text is unreadable in any video. Make the words a caption talks about readable by scale: frame the UI bigger (`Browser`, `Phone`, `Window` at a larger `width`) or lean in with `Camera` so the label in question is at least the "labels" size above at the moment the caption names it. Everything else in the UI may stay small; it reads as texture.

## 3. Minimum sizes on a phone

Apple's typography guidance puts the default iOS text size at 17 pt and the minimum at 11 pt, and says to avoid Ultralight, Thin and Light weights because they are hard to see at small sizes. Convert that into video pixels:

- A phone shows a full-screen 1080-wide reel about 390 points wide (a working figure for current phones; small ones are ~360, large ones ~430). So one video pixel is about **0.36 pt**. The 11 pt floor is **~30 px**, and comfortable 17 pt body text is **~47 px**. That is why the reel floor above is 32 px and why captions start at 64 px: captions are read in a glance, while the thumb is moving, over a moving picture.
- A 16:9 video played in a feed on a phone held upright is also about 390 pt wide, but now 1920 px are squeezed into it: one pixel is about **0.2 pt**. A 56 px caption becomes ~11 pt, right at Apple's floor, and 24 px UI labels become ~5 pt, which nobody can read. If a showcase will mostly be watched in a phone feed (LinkedIn, X), use 64–72 px captions and bigger UI framing, or better, derive a 1:1, 4:5 or 9:16 cut.
- On a laptop the same 1920 frame plays around 1200–1400 CSS px wide, so 56–64 px captions land around 35–47 CSS px: comfortable. Showcase sizes assume that viewer.

Weight moves the floor. A 400-weight caption at 64 px on a 1080-wide reel is fine; a 300-weight one is not, and feed compression (section 5) makes it worse.

## 4. Line length and line breaks

### How many characters fit

For Inter, the template's default face, lowercase sentences with spaces average about **0.48 em per character at weight 400 and 0.50 em at weight 800** (measured from the font's advance widths). All caps run about **0.59 em**, so a caps line fits roughly 20% fewer characters. The working estimate:

```
characters per line ≈ maxWidth ÷ (0.5 × size)        // lowercase Inter; use 0.6 × size for caps
```

| format | `size` | `maxWidth` | fits about | aim for |
|---|---|---|---|---|
| showcase calm (the fallbacks) | 60 | 1306 | 43 chars | ≤ 40 (Netflix caps subtitle lines at 42) |
| reel sentence (the fallbacks) | 68 | 780 | 23 chars | ≤ 24 (the BBC's guide: about 25 characters across 90% of a 9:16 frame) |
| reel punch | 92–96 | 780 | 16–17 chars | ≤ 14–16 per chunk, so a chunk never wraps |
| reel punch, big | 110 | 780 | 14 chars | ≤ 12 |
| hook title | 160 | 780 | 9–10 chars | 2 short lines, or fewer words |

For another font, measure instead of guessing: render one still with the longest caption and look at where it wraps.

Why keep punch chunks on one line: the `top` of a caption block stays put while its height changes, so a chunk that wraps to two lines pushes its second line down into a different spot than the one-line chunks around it. The eye has to hunt for the words. One line per chunk keeps the reading spot still.

### Where to break

Use `|` in `Words` and `Captions` text to force a break, and break where a speaker would pause. The BBC and Netflix subtitle guides agree on the rules:

- Break after punctuation, or before a conjunction ("and", "but", "so") or a preposition.
- Never split an article from its noun ("the | note"), an adjective from its noun, a first name from a last name, or a pronoun from its verb ("it | finds").
- For a two-line calm caption, prefer a bottom-heavy shape (the second line longer): Netflix's guide asks for a "bottom-heavy pyramid" when there is a choice.
- No single-word last line. "Your notes live in five different | apps." is worse than "Your notes live | in five different apps."
- One sentence per caption. If a sentence needs three lines in a showcase, it is two captions or a shorter sentence.

For type you set yourself (a label, an end-card line, a still), `textWrap: 'balance'` evens out the lines without manual breaks. Chromium balances blocks of up to 6 lines, which covers any caption, and Remotion renders in a pinned Chrome Headless Shell recent enough to have it.

```tsx
<div style={{ fontSize: 96, fontWeight: 700, maxWidth: 780, textAlign: 'center', textWrap: 'balance' }}>
  One calm place for your team’s notes.
</div>
```

## 5. Weight, tracking, leading and case

| size | weight | tracking (`letterSpacing`) | line height |
|---|---|---|---|
| ≥ 120 px titles | 600–800 | −0.03 to −0.045 em | 0.95–1.0 |
| 80–120 px headlines, punch | 600–800 | −0.02 to −0.04 em | 1.0–1.06 |
| 52–72 px captions | 500–600 | −0.01 to −0.015 em | 1.1–1.2 |
| 28–48 px secondary | 400–500 | 0 | 1.25–1.35 |
| ≤ 28 px labels, mono, eyebrows | 500–700 | +0.02 to +0.06 em | 1.2 |
| any size in ALL CAPS | one step heavier | +0.04 to +0.08 em | as above |

Why these values:

- **Big type needs negative tracking.** Fonts are spaced for reading sizes; at 100+ px the gaps between letters look like holes and the word falls apart. The launch film used −0.03 em at 96–146 px and −0.01 em at 52 px.
- **Nothing lighter than 400.** Apple's guidance says to avoid Ultralight, Thin and Light weights, and video makes it worse: H.264 as platforms deliver it stores color at half resolution (4:2:0 chroma subsampling) and re-encodes your upload at a lower bitrate, so hairline strokes and colored text edges smear first. Light text on a dark ground also looks a little heavier than it is, so 500 on dark reads like 600 on light. On the template's dark theme, 500–600 is the caption sweet spot.
- **Tight leading for display, open leading for sentences.** Multi-line titles at line height 1.0 read as one shape; captions at 1.1–1.2 keep ascenders and descenders from touching when they wrap.
- **Tabular figures for anything that counts.** Digits in a proportional font change width as they roll, so the number shivers. `Counter` already sets `fontVariantNumeric: 'tabular-nums'`; do the same for any timer, price or count you set yourself.

Where these apply: `Words` takes `weight`, `tracking` (in em, default −0.035) and `lineHeight` (default 1.06) as props, so set them from this table when a line is smaller or larger than a headline (the demo's 52 px promise line uses weight 500 and tracking −0.02). `Captions` and `KineticTitle` set their own: calm captions weight 500 at −0.022 em, punch weight 800 at −0.04 em, `KineticTitle` weight 800 at −0.045 em with line height 0.98. For type you set yourself (labels, the end card, stills), use the table.

**Case follows the brand.** If the product writes lowercase headlines, the captions are lowercase too (the launch film did this); if it writes sentence case, use sentence case. Keep proper nouns, product names, acronyms and code exactly as their owners write them (GitHub, iOS, API, `npm install`). Avoid ALL CAPS sentences: the BBC's guide notes that large chunks of text in caps are hard to read. Caps are for one or two words of a punch, a label, or a button.

**Real typography.** Curly apostrophes and quotes (’ “ ”), a real ellipsis (…), en dashes for ranges. They are in the Latin subset `src/fonts.ts` loads. Symbols outside it (⌘, →, ✓ and most arrows and emoji) fall back to some other font silently; draw them as icons or check them on a still.

**Fonts.** The product's own typeface first; then one sans for display and captions plus one mono, both loaded in `src/fonts.ts`. A third family almost always looks like an accident.

## 6. Contrast on busy pictures

### The target

WCAG 2.2 asks for a contrast ratio of at least 4.5:1 for text and 3:1 for large text (18 pt, or 14 pt bold); 7:1 is the enhanced level. Every caption in this skill counts as "large", so 3:1 is the legal floor. Aim for **7:1 for captions and 4.5:1 for anything secondary**, because video eats contrast: compression softens edges, motion blurs them, phone screens get used outdoors at low brightness, and the ground behind a caption changes from frame to frame.

Check a pair of colors with a one-liner (WCAG's relative-luminance formula):

```bash
node -e "const L=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};const [a,b]=process.argv.slice(1).map(L).sort((x,y)=>y-x);console.log(((a+.05)/(b+.05)).toFixed(2)+':1')" "#EDEDF2" "#07070A"
```

With the template's demo theme this gives: body text `C.text` on `C.bg` about 17:1, `C.dim` about 7.9:1 (fine for secondary lines), `C.faint` about 3.8:1 (decoration only, never words someone must read), the accent on `C.bg` about 11:1, dark text on an accent fill about 11:1, and white text on the accent fill about 1.8:1 (never do that). Run the check for the user's own brand colors when you set `src/theme.ts`.

### The toolkit, in order of preference

1. **Layout first.** Give captions their own calm band (dark backdrop, no UI behind them) and put the product below or above it. This is why the showcase puts captions at the top over `Backdrop` and the product under them: nothing to fight.
2. **A dim layer (scrim).** When the product has to run behind the words, darken only the caption band with a gradient, not the whole frame. Over bright UI (around `#F4F4F6`), white text under a 50% black scrim is only about 4.3:1; 60% gives about 6:1 and 75% about 11:1. Use 60–75% where captions cross light UI.
3. **A soft shadow.** A tight shadow for the edge plus a wide soft one for the ground: `0 2px 4px rgba(0,0,0,0.55), 0 6px 24px rgba(0,0,0,0.45)`. It lifts text off mid-tones; it will not rescue white text on white UI.
4. **A backing plate.** A rounded rectangle behind the line, 70–85% opaque, padded about 0.5 em on each side (the BBC extends its subtitle background 0.5 em past each end of a line). Fade the plate in with the words, never before them: an empty box looks like a bug. Plates suit dense UI and user-generated-looking reels; on a calm showcase they look heavy.
5. **`Focus`.** When the caption is about one part of the UI, `Focus` dims and blurs the rest, which also quiets the ground behind the caption.

```tsx
// calm captions over a product that runs behind them: a scrim under the band only, and a shadow on the words
function CaptionBand({ cues }: { cues: { at: number; text: string }[] }) {
  const { W, portrait, safe } = useStage();
  const top = portrait ? safe.top + 60 : 104;
  return (
    <>
      <AbsoluteFill
        style={{ background: `linear-gradient(to bottom, rgba(0,0,0,0.7) 0px, rgba(0,0,0,0.7) ${top + 180}px, rgba(0,0,0,0) ${top + 360}px)` }}
      />
      <AbsoluteFill style={{ textShadow: '0 2px 4px rgba(0,0,0,0.55), 0 6px 24px rgba(0,0,0,0.45)' }}>
        <Captions cues={cues} variant="calm" top={top} size={portrait ? 68 : 60} maxWidth={portrait ? W - 2 * Math.max(safe.left, safe.right) : 1300} />
      </AbsoluteFill>
    </>
  );
}
```

`text-shadow` inherits in CSS, and calm captions set none of their own, so the wrapper reaches the words. Punch captions already carry a shadow (`0 6px 30px` plus `0 2px 6px`, black at 40–55%), so they need only the scrim. `Captions` also takes a `color` prop when the band's ground is light. Avoid `-webkit-text-stroke` outlines: the stroke is centered on the glyph edge, so it eats into the letters and closes up counters at caption sizes.

## 7. Placement and safe zones

`src/formats.ts` holds each format's `safe` margins, the pixels the platform may cover with its own UI (the delivery-and-platforms reference explains each number). Read them through `useStage()` and never hard-code a caption position that ignores them.

| format | safe (top, right, bottom, left) | text box that stays clear | where captions go |
|---|---|---|---|
| `showcase` 1920×1080 | 54, 96, 54, 96 | x 96–1824, y 54–1026 | top band, `top` ≈ 84–120 (calm fallback 84), product below; or a bottom band ending by y ≈ 990 |
| `reel` 1080×1920 | 250, 150, 450, 64 | x 64–930, y 250–1470 | a band above the product by default (y ≈ 290–640; calm fallback `top` 290, punch fallback 330); below it (`top` ≈ 1140) only when the caption ends above y ≈ 1250, because the post text and an ad's CTA grow up from the bottom |
| `story` 1080×1920 | 250, 64, 380, 64 | x 64–1016, y 250–1540 | upper half; keep the link-sticker spot empty and point at it |
| `square` / `portrait` | 60 on every side | inset 60 | top band, `top` ≈ 80–110 |
| `loop` 1600×1000 | none | whole frame | usually no captions: a loop is re-watched, so words get re-read every cycle |
| cover still (1080×1920) | middle 3:4 | y 240–1680 | everything that matters inside the centered 1080×1440 the profile grid shows |

Rules that matter more than the exact band:

- **Keep both edges inside the safe zone.** `Captions` centers its block on the frame. The reel's right margin (150 px, the like/comment/share column) is wider than its left (64 px), so a centered block with `maxWidth` 866 would run to x 973, under the buttons. Keep `maxWidth ≤ W − 2 × max(safe.left, safe.right)`, which is 780 for the reel. On a phone both fallbacks use exactly this.
- **One caption position per video.** The eye learns where the words are after the first caption; moving them makes it hunt. Change the band only when the layout forces it (a full-screen product moment), and move it at a scene cut, not mid-sentence.
- **Never cover the thing the caption names.** If the caption says "Type what you remember", the search field must be visible while it is on screen. Check the frames where `Camera` is pushed in: a push-in can slide the subject under the caption band.
- **Captions stay outside `Camera`.** Put `Captions` after the `Camera` element, not inside it, so a push-in scales the product and not the words. Words that zoom while you read them are hard to read.
- **Vertical subtitles sit a little higher.** The BBC's guide notes that in 9:16 video subtitles usually sit a little higher, still in the lower third, and a reel's bottom 450 px is platform UI anyway. In product reels, "above the product" is usually the better band because the eye enters the frame near the top.

```tsx
// one place per cut, computed from the format
export function useCaptionBox() {
  const { W, portrait, safe, format } = useStage();
  const maxWidth = portrait ? W - 2 * Math.max(safe.left, safe.right) : Math.round(W * 0.68);
  const top = portrait ? safe.top + 60 : Math.max(safe.top + 42, 96);
  const size = format === 'reel' ? 96 : portrait ? 68 : 60;
  return { top, maxWidth, size };
}
```

Check the result with the safe zones drawn: `node scripts/stills.mjs reel --marks --safe`, then `node scripts/sheet.mjs reel` and read the sheet. The sheet has gaps between tiles on purpose: tiles that touch merge captions from neighbouring frames into one fake line.

## 8. Reading time

### The rule

**Hold each caption at least (words ÷ 3) + 1 seconds, and let the picture finish its move before the next caption arrives.**

- The words ÷ 3 part is a reading speed of 180 words per minute. The BBC's subtitle guidelines recommend 160–180 words per minute (0.33–0.375 s per word) and suggest about 0.3 s per word as the minimum time on screen, and their viewers are not also watching a cursor fly across a product.
- The + 1 s pays for finding the line and for its arrival. Calm `Captions` start a line 0.12 s after its cue and it has landed 0.35 s later, about 0.5 s in, however long it is. The blur-rise (`arrival="words"`) takes longer, and longer with every word: a 10-word line needs 0.12 + 0.06 × 9 + 0.6 ≈ 1.26 s just to land, so its floor is `words ÷ 3 + max(1, 0.72 + 0.06 × (words − 1))`.
- The picture competes with the words. Eyes cannot read and track a moving cursor at the same time, so a caption shown during a big move needs longer, and the next caption should wait until the move settles.

| words in the cue | calm floor | punch floor (cue length) |
|---|---|---|
| 1 | 1.3 s | 0.5 s |
| 2 | 1.7 s | 0.67 s |
| 3 | 2.0 s | 1.0 s |
| 4 | 2.3 s | 1.33 s |
| 6 | 3.0 s | 2.0 s |
| 8 | 3.7 s | 2.67 s |
| 10 | 4.3 s | split it |
| 12 | 5.0 s | split it |

**Punch captions: at least words ÷ 3 seconds per cue, and never under 0.5 s.** That is the same three-words-a-second rate as the calm rule, without the extra second, and the same floor [reels-retention](reels-retention.md) §10 uses. A punch cue is a phrase. The component cuts it into chunks of up to three words and paces them as if said: it spreads the words over 80% of the time until the next cue, clamped to 0.18–0.5 s per word, and each chunk lands whole on its first word's time. So a cue of n words lasting D seconds gives each word 0.8 × D ÷ n seconds: at the floor, about 0.27 s a word, just under the BBC's 0.3 s per word minimum, which the huge, still chunk makes up for. Below 0.225 s per word of cue the clamp kicks in and the last chunk never appears before the next cue replaces it. (With `lit`, each word also lights as it is said: §10.) Punch runs faster than calm because each chunk is short, huge and in the same spot, and the phrase is simple; the whole reel still has to leave time to read (below).

These are the floors that turned the skill's launch film from a confusing 37 s cut into a 62 s film that worked, and its unreadable 29 s reel into a 37 s one that kept the how-it-works section.

### Things that quietly steal reading time

- **Warped scenes.** A cue timed on scene seconds in a scene the reel plays through a `warp` is on screen for less time than written: a 4 s hold squeezed 2× shows for 2 s. In any warped scene, give the reel its own shorter cues on drawn time (`drawn` on `Captions`), so the times you write are the times the viewer gets. The launch film's reel did exactly this, with its own shorter sentences.
- **The crossfade.** The last caption of a scene loses the cut's `cross` seconds at its end, because the next scene fades in over it. Count the scene's `seconds − cross` as the last caption's time.
- **A late arrival.** If the caption waits for a mark (say, `noteIn`), its time starts there, not at the scene start.

### The whole-cut budget

Add up the floors of every caption in a cut. If the sum is more than the cut minus the moments that need the viewer's eyes on the picture alone (a reveal, the hook's first second), you have too many words, not too little time: cut words or a whole section. For a reel, drop the feature list before the how-it-works; a reel that states the problem and then only says "we solve it" explains nothing.

### A guard that fails loudly

Paste this into a scene while you tune it. It throws during stills and renders (you will see the message in the terminal) when a caption is shorter than its floor. It assumes cues on drawn time, which they are in any unwarped scene and whenever you pass `drawn`.

```tsx
import cuts from '../cuts.json';

type Cue = { at: number; text: string };
const PLAN = cuts as unknown as Record<string, { cross?: number; scenes: { id: string; seconds: number }[] }>;

/** Throws when a caption is on screen for less than its reading floor. Cue times must be drawn seconds. */
export function checkCues(cutId: string, sceneId: string, cues: Cue[], variant: 'calm' | 'punch') {
  const cut = PLAN[cutId];
  const i = cut.scenes.findIndex((s) => s.id === sceneId);
  const end = cut.scenes[i].seconds - (i < cut.scenes.length - 1 ? cut.cross ?? 0 : 0);
  cues.forEach((c, k) => {
    const n = c.text.replace(/\|/g, ' ').split(/\s+/).filter(Boolean).length;
    if (n === 0) return;
    const shown = (cues[k + 1]?.at ?? end) - c.at;
    const floor = variant === 'punch' ? Math.max(0.5, n / 3) : n / 3 + 1; // with arrival="words": n / 3 + Math.max(1, 0.72 + 0.06 * (n - 1))
    if (shown + 1e-6 < floor) throw new Error(`${cutId} › ${sceneId}: "${c.text}" shows ${shown.toFixed(2)} s, needs ${floor.toFixed(2)} s`);
  });
}
```

## 9. Writing captions

The captions are the script. Write them before you build a scene, one plain sentence per beat, and put them in the scene table in the project README.

**Plain words.** Write for someone who has never heard of the product and is half paying attention. If a word needs a definition, it needs replacing.

**Consequence, not jargon.** Say what happens to the person, not what the system does. The launch film's turning point was replacing "merge conflict" with "their changes crash into each other", and "merge time" with "untangle it by hand".

| jargon | consequence |
|---|---|
| merge conflict | their changes crash into each other. |
| real-time CRDT sync | everyone sees each edit as it happens. |
| SSO and SCIM provisioning | new people get access on their first day. |
| role-based access control | people see only what they should. |
| semantic search | find a note by what it means, not the exact words. |
| offline-first | it works on the plane, too. |

**One idea per caption.** "Lumen syncs instantly, works offline and has AI search." is three captions, or better, one feature you picked. A viewer keeps one thing per beat.

**Say why; let the picture show how.** The caption and the picture should add up, not repeat each other. If the picture shows the cursor typing "roadmap" into search, the caption is "Type what you remember.", not "The user types roadmap into the search box."

**The brand's own voice and casing.** Copy how the product talks on its site: lowercase or sentence case, "you" or "your team", dry or warm. Use its real product nouns (the thing it calls a "space" is not a "workspace" in the video). The launch film was lowercase because its brand was; the template's demo brand writes sentence case, so its examples here do too.

**Frame for the real audience.** A founder watching the launch film noticed it made a team product look single-user. The fix touched every caption and label: "alice’s agent", not "alice"; "your team", not "you". Before writing, check who uses the product and make them visible in the words.

**Present tense, active voice, short.** Subject, verb, object. Calm captions 4–10 words; punch cues 2–6 words, which the component shows 1–3 at a time.

**Only true numbers.** A caption or `Counter` that says "10× faster" or "4,000 teams" must be something the user can stand behind. If it is not true today, leave it out. Inflated proof is worse than none.

**Punctuation.** Calm captions end with a period: it gives the eye a place to stop, and it reads as calm. In punch cues punctuation is also timing, because a period, comma or question mark ends a chunk: "5 apps. | 0 answers." lands as two chunks. Use a full stop for weight ("Found.").

The same beats written both ways, for the template's demo product (a notes app for small teams):

| beat | calm (showcase) | punch (reel), one cue per row |
|---|---|---|
| problem | Your notes live in five different apps. | `Where’s \| that note?` then `Not in chat. \| Not in docs.` |
| reveal | One calm place for your team’s notes. | `One place. \| Every note.` |
| how | Type what you remember, and it’s there. | `Just type \| what you remember.` |
| team | Your whole team edits the same note at once. | `Everyone. \| Same note. \| Same time.` |
| close | Lumen. Try it free at lumen.example | `Try it free.` |

## 10. Calm and punch captions

| | `calm` | `punch` |
|---|---|---|
| use in | showcases, launch films, feature clips, stories | reels, TikTok, Shorts, the hook of anything vertical |
| unit | one full sentence per cue | one short phrase per cue, shown in chunks of up to 3 words |
| arrival | the old line leaves with a 0.12 s fade and a 6 px lift; as it is gone, 0.12 s after the cue, the new line arrives whole: a 0.2 s fade and a 10 px rise over 0.35 s on `EASE`, no stagger, no blur. Never two sentences on screen at once: crossing in one spot, they read as neither | each chunk lands whole in the text color, fully there on its first frame, with a calm `pop()` in scale from 0.96, no overshoot, no fade (the chunk before it vanishes on that frame, so a fade-in blinks an empty frame between them); with `lit`, its words light in turn (below) |
| size | 56–64 px at 1920 wide, 64–72 at 1080 wide | 84–110 px at 1080 wide |
| weight | 500 | 800 |
| rhythm | follows the story's beats, 3–6 s each | follows the edit or the beat grid, each word paced 0.27–0.5 s |
| emphasis | rarely; at most one `Highlight` or `*word*` per scene | one `*word*` in two or three cues, chosen by meaning; with word lighting (a voice or a beat grid), the lit word and nothing on top |
| why | comprehension: a first-time viewer follows the argument | retention: something new lands every beat and the eye never has to search |

### Two effects to keep rare

The template's `Captions` bring running captions in as whole lines and land punch chunks whole, because two popular effects read as a template, or as AI-made, once every caption has them. Both are still there, opt-in:

- **The blur-rise.** `Words` brings a line in word by word out of a blur. On every caption of a film it is the most recognizable template look of 2024–26. It also stacks a blur on top of any `Focus` or whip in the scene ([motion-language](motion-language.md) §17: one blur family per scene), and it costs reading time: a 10-word line needs about 1.26 s just to arrive. Keep it for at most two moments per film, the reveal's promise and the end headline: `Words` for a title line, or `arrival="words"` on one `Captions`. The demo does exactly that (the promise in `Reveal`, the name in `EndCard`); its hook line uses `Line`, the whole-line arrival as a component.
- **Word lighting.** Karaoke lighting follows speech. With a voiceover (word times from its transcript) or words cut to a beat grid, pass `lit` to punch captions: each word lights in the accent as it is "said" and the ones to come wait at 55%. Without either, there is nothing for the lit word to follow, and a lit word in every cue is the auto-caption look of editing apps. So by default each chunk lands whole in the text color, with at most one accent word (`*word*`) per two or three cues.

### Calm, on marks

Time calm cues on the scene's marks, so a re-timed moment in `cuts.json` moves its caption and its sound together. The template keeps the words in `src/captions.json`, by cut and scene, and a scene draws its own with `useCues()` (`src/lib/cues.ts`), which resolves each `at` (seconds, a mark, or a mark with an offset) against the scene's marks. This uses the demo showcase's `problem` scene (8.2 s, marks `appsIn: 0.4`, `searchIn: 4.4`, `cross` 0.1).

```jsonc
// src/captions.json (plain JSON: drop the comments)
{
  "showcase": {
    "problem": {
      "cues": [
        { "at": "appsIn", "text": "Your notes live in five different apps." }, // 7 words: floor 3.33 s, shown 4.4 − 0.4 = 4.0 s
        { "at": "searchIn", "text": "And search finds nothing." }             // 4 words: floor 2.33 s, shown 8.2 − 0.1 − 4.4 = 3.7 s
      ]
    }
  }
}
```

```tsx
import { AbsoluteFill } from 'remotion';
import { useCues } from '../lib/cues';
import { Captions } from '../lib/text';
import { Backdrop } from '../lib/ui';

export function Problem() {
  return (
    <AbsoluteFill>
      <Backdrop />
      {/* the product UI, below the caption band */}
      <Captions {...useCues()} />   {/* calm fallbacks: 60 px, 1,306 px wide, top 84 on 16:9; 68 px, 780 wide, top 290 on a phone */}
    </AbsoluteFill>
  );
}
```

A block with `"punch": true` makes `useCues()` return `variant: 'punch'`; `"drawn": true` makes it return `drawn`, for cues on a warped scene's drawn seconds (give plain numbers there). A title drawn with `Words`, `Line` or `KineticTitle` takes its line the same way, `const [title] = useCues().cues`, so the caption files carry it too (§15).

### Punch, on drawn time

Punch cues belong to the reel's own clock. Add marks for them in the reel scene, or write drawn seconds directly (with `drawn`) when the scene is warped. Each cue is a short phrase; you shape its chunks with punctuation and `|`.

```jsonc
// src/cuts.json, reel › a new reel-native problem scene (its own id: the template's reelProblem reads other marks)
{ "id": "reelWhere", "seconds": 3.6, "marks": { "q": 0.1, "nope": 1.5 } }

// src/captions.json, reel › reelWhere
"reelWhere": { "punch": true, "cues": [
  { "at": "q", "text": "Where’s | that note?" },          // 3 words in 1.4 s (floor 1.0): 0.37 s a word. Chunks: "Where’s" / "that note?"
  { "at": "nope", "text": "Not in chat. | Not in docs." } // 6 words in 3.6 − 0.1 − 1.5 = 2.0 s (floor 2.0): 0.27 s a word
] }
```

```tsx
<Captions {...useCues()} />   // fallbacks on a reel: the upper band (top 330), 92 px, 780 px wide; the lower band is top ≈ 1140
```

How the component chunks a cue, and how to write for it:

- A chunk ends after three words, after any word ending in `. ! ? , : ;`, and at every `|`. Put `|` where a speaker would take a breath, so chunks are phrases: keep article + noun, adjective + noun and verb + particle together ("sign up", not "sign | up").
- End each chunk on its strongest word; that is the one the eye lands on.
- Digits, not number words: "5 apps" scans faster than "five apps" at punch speed (the demo reel's "5 apps. | 0 answers.").
- ≤ 14–16 characters per chunk at 92–96 px so it never wraps (section 4).
- Chunks land whole in the text color, and `*word*` gives the one accent word in two or three cues its color. With `lit`, words still to come sit at 55% opacity and the word being said is in the accent.
- On a reel cut to a beat, start a cue on a beat and size it so its words land on the beats that follow: at 120 bpm (0.5 s a beat), a 4-word cue lasting 2.5 s paces a word every 0.5 s, which `lit` makes visible. Take the beat times from the grid the score uses (the template's `beat()` runs its grid through the reveal's hit; [sound-design](sound-design.md) §12 has a script that prints how far each mark sits from the grid), and put cue times on marks, so words and beat cannot drift.

Mixing the two in one reel is normal: `KineticTitle` for the first second, punch captions through the body, and a calm `Words` line on the end card, where the viewer who stayed has time to read a full sentence and a URL.

## 11. Kinetic type patterns

Moving type is for the moments where the words are the picture: the hook, the promise, a number. Everywhere else, text should arrive and then hold still while it is read.

| pattern | component | fits | avoid |
|---|---|---|---|
| slam | `KineticTitle({ text, start, size })` | the reel's first 0.5 s: a claim or question that stops the thumb | showcases (too loud), more than once per video, anything over ~5 words |
| line reveal | no component: each line rises 100% of its height from behind an `overflow: hidden` box, 0.4–0.5 s `EASE`, lines 60–80 ms apart (code below) | titles, the reveal's promise, the end-card headline: the preferred title entrance, readable the moment it lands | text that must be read while it moves; mixing it with a second title style in one video |
| blur-rise | `Words({ text, start, step, dur, size, weight, color, align, maxWidth })` | at most two moments per film (the reveal's promise, the end headline), or every line of a teaser where type is the whole picture | running captions, fast punch beats (too soft and slow), a scene that already blurs (a whip, `Focus`) |
| marker sweep | `Highlight({ start, dur, color, children })` | the one phrase that carries the promise, once per scene | every caption, whole sentences, text still arriving |
| digit roll | `Counter({ from, to, start, dur, format })` | a true number that changes on screen: saved hours, a live count | invented or rounded-up numbers, numbers nobody asked about |
| typing | `Typed({ text, start, cps, caret })` | text inside the product: a search query, a prompt, a note | narration (captions are read, not watched being typed) |

Numbers that work:

- **`KineticTitle`**: each line lands over 0.26 s (lines 0.06 s apart), so it is readable by about 0.3 s; start it at 0 to 0.1 s so frame one already moves. It scales down from 1.08 with no blur: sharp from its first frame, and no blur family added to the hook scene. 2–5 words, lines set with `|`, one `*accent*` word at most, `size` 110–180 at 1080 wide with `maxWidth` 780 (the demo reel's hook is "Your team’s | notes are | *everywhere.*" at 118 px). Hold at least ~1.2 s after it lands. Name its mark `title` in the first scene: on a punchy cut, the naming rules in `sound/score.mjs` land a `thump` and a short whoosh on it (the demo's `reelHook` cue sheet does the same by hand, plus a round knock).
- **`Words`**: `step` 0.05–0.09 s, `dur` 0.6–0.8 s (defaults 0.07 and 0.7). Faster steps feel jittery; slower ones feel like a slideshow. One line at a time; start the next line only after the first has landed. Set `weight`, `tracking` and `lineHeight` from section 5 when the line is not headline-sized, and `drawn` when it sits in a warped scene.
- **`Highlight`**: start 0.2–0.3 s after the highlighted words have landed (sweeping text that is still arriving looks like a glitch), `dur` 0.35–0.6 s. Pass a solid color (the accent is the default); the component paints it at 30% alpha behind the words and sweeps it left to right. Check the words' contrast on the swept color.
- **`Counter`**: `dur` 0.8–1.6 s. It eases in and out, rolls each digit column like an odometer, and uses tabular figures. `format` receives the whole number, so a locale formatter is all it needs. Hold the final value at least 1 s. A few soft `tick`s during the roll and a `pop` or `chime` on the landing, all quieter than the UI clicks.
- **`Typed`**: 12–20 characters per second for a person (the default 18 is right for most), with a `key` sound landing on the frame each character appears.

```tsx
// a line reveal: each line rises from behind its own mask, with no blur, so it reads the moment it lands
const t = useTime(), m = useMarks();
const LINES = ['One calm place', 'for your team’s notes.'];
<div style={{ fontSize: 96, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, textAlign: 'center' }}>
  {LINES.map((line, i) => {
    const p = prog(t, m.promise + i * 0.07, 0.45);                          // EASE, lines 70 ms apart
    return (
      <div key={i} style={{ overflow: 'hidden', paddingBottom: '0.08em' }}>   {/* the padding keeps descenders inside the mask */}
        <div style={{ transform: `translateY(${(1 - p) * 110}%)` }}>{line}</div>
      </div>
    );
  })}
</div>
```

```tsx
const m = useMarks();
// the promise, with one phrase swept after the line has landed
<div style={{ fontSize: 88, fontWeight: 700, letterSpacing: '-0.03em', textAlign: 'center', maxWidth: 780 }}>
  Every note, <Highlight start={m.promise + 0.9} dur={0.45}>one place.</Highlight>
</div>

// a true number rolling, formatted for the viewer's locale
<div style={{ fontSize: 120, fontWeight: 700 }}>
  <Counter from={0} to={1284} start={m.count} dur={1.2} format={(n) => new Intl.NumberFormat('en-US').format(n)} />
</div>
```

Patterns to leave out: per-letter bounces, words that spin or fly across the frame while they should be read, a typewriter for narration, more than one kinetic effect on screen at once, and shaking text for "error" (a steady color change and a `tone` say it better).

## 12. Emphasis color, sparingly

Color is the loudest thing type can do, so it runs out fast.

In the template, wrapping words in asterisks sets them in the accent in any `Words`, `Captions` or `KineticTitle` text: `'Your notes are *everywhere.*'`. `Highlight` is the louder version, a swept marker behind the words. Both are easy to overuse, so:

- **One emphasis color per video**, the brand accent. Meaning colors (`ok`, `danger`) are for states in the product UI, and they must mean the same thing every time they appear.
- **At most one emphasized word or phrase per caption, and not in every caption.** A working rule: no more than one caption in three carries emphasis. If everything is highlighted, nothing is.
- **Emphasize the new information**: the promise, the payoff, the one number. Never the product name in every line.
- **Punch captions with word lighting** (a voice or a beat grid) already emphasize the lit word; adding a `Highlight`, a `*word*` or a second color on top makes two things fight. Without lighting, one `*word*` in two or three cues is the emphasis.
- **Never color alone.** Some viewers cannot tell your accent from white on a dim phone, and some cannot tell red from green at all. Pair color with weight, a `Highlight` shape, or position.
- **Check the emphasized word's contrast separately.** A mid-saturation accent that passes on the dark backdrop can fail on a light UI card.

The BBC's guide is a useful mirror here: it stresses a word with capitals only occasionally, and warns that text sprinkled with emphasis is hard to read.

## 13. Localization

Build one project, render one cut per language. A localized burned-in video is its own cut in `cuts.json` (say `reel-de`) that reuses the same scenes, because translated captions change the timing, and the timing is data.

### Longer lines and longer words

- **Translations are longer, and short strings grow most.** IBM's guideline, quoted by the W3C, expects English strings of 11–20 characters to come back at 180–200% of their length in European languages, 21–30 characters at 160–180%, and strings over 70 characters at 130%. A 16-character punch chunk can double. Leave headroom: write English that fits in about 60% of the line, or plan a smaller `size` for other languages.
- **German compounds cannot wrap.** "Eingabeverarbeitungsfunktionen" is one 30-letter word; in Inter at weight 800 it is about 16.5 em wide, so it fits the reel's 780 px only at about 47 px. Rewrite ("Funktionen für die Eingabe"), or place a soft hyphen (`\u00AD` in a JS string, `&shy;` in markup) where a break is allowed. Don't rely on `hyphens: 'auto'`: browsers only hyphenate when `lang` is set and a dictionary for that language is available, and you cannot see which dictionaries a headless render has.
- **Reading speed is per language.** For languages with long words (German, Finnish, Russian), check both words ÷ 3 + 1 and characters ÷ 15 + 1, and use the larger (a working heuristic; Netflix allows up to 17 characters per second for German adult subtitles, so 15 leaves a margin for motion). Plan for a German cut to run longer than the English one; re-check every floor rather than scaling the English timing.
- **Scene logic keys on the format, not the cut name.** A scene that checks `useCut() === 'reel'` for its layout breaks in `reel-de`. Use `useStage()` (`portrait`, `format`) for layout and the cut id only to pick text.

### Fonts

`src/fonts.ts` loads only the `latin` subset. That covers English, German, French, Spanish and Portuguese, but not Cyrillic, Greek or Vietnamese, and not the Latin Extended letters of Polish, Czech or Turkish. Missing glyphs fall back to a system font without any error, and the render looks subtly wrong.

```ts
// src/fonts.ts: add the subsets the captions need
const inter = loadInter('normal', { weights: ['400', '500', '600', '700', '800'], subsets: ['latin', 'latin-ext', 'cyrillic'] });
```

For scripts Inter does not cover, load a matching Noto face with `@remotion/google-fonts` and put it in the font stack: `NotoSansJP` (subset `japanese`), `NotoSansSC` (`chinese-simplified`), `NotoSansKR`, `NotoSansArabic` (`arabic`), `NotoSansHebrew` (`hebrew`). Load only the weights you use; CJK fonts are large and arrive in many files. Check a still for every language: fallback glyphs are easy to spot when you look and impossible to spot when you don't.

### Chinese, Japanese and Korean

- **Count characters, not words.** Netflix caps Japanese subtitles at 13 full-width characters per line and 4 characters per second; Simplified Chinese at 16 per line and 9 per second; Korean at 16 per line (Latin letters, spaces and punctuation count half) and 12 per second. So the reading floor becomes characters ÷ 4 + 1 s for Japanese, ÷ 9 + 1 s for Chinese, ÷ 12 + 1 s for Korean.
- **Break at phrase boundaries yourself.** Chinese and Japanese have no spaces, so a browser may wrap in the middle of a word, and the text components split words on spaces, so a whole spaceless line rises (or, in a punch cue, lights up) as one unit. Put `|` at natural phrase boundaries (bunsetsu, in Japanese) to control the lines; in punch cues each `|` also starts a new chunk, so write 2–6-character chunks separated by `|`.
- **Let Chrome help.** `wordBreak: 'keep-all'` stops breaks inside Korean words (Korean does use spaces). For Japanese, Chrome 119+ supports `word-break: auto-phrase`, which wraps at natural phrase boundaries when the text is marked `lang="ja"`; Remotion's pinned Chrome is newer than that. `lineBreak: 'strict'` applies the strictest rules for where CJK punctuation may start or end a line.
- **Set `lang`.** Chinese and Japanese share many code points but draw some differently; the `lang` attribute and the matching Noto face make Chrome pick the right shapes.
- **No negative tracking** on CJK, and a more open line height (1.3–1.4). Tracking values in section 5 are for Latin letters.

```tsx
<AbsoluteFill lang="ja" style={{ wordBreak: 'auto-phrase', lineBreak: 'strict' }}>
  <Captions cues={cuesJa} variant="calm" top={104} size={56} maxWidth={1300} />
</AbsoluteFill>
```

### Right-to-left (Arabic, Hebrew, Persian)

- Set `dir="rtl"` and `lang` on a wrapper around the captions. `direction` inherits, so the words run right to left and line starts align right.
- Never animate Arabic letter by letter: its letters join, and splitting a word into separately animated letters breaks the joins. Word-by-word (`Words`) is fine, and `Typed` is fine because it reveals a growing string, which reshapes the way real typing does.
- Mirror anything directional in the type. `Highlight` always sweeps left to right, which reads backwards in RTL, so use `*word*` accent color for emphasis instead; an arrow pointing "forward" points left.
- A Latin brand name or URL inside an RTL sentence is a bidirectional run; check its position on a still.

### Numbers

Format with `Intl.NumberFormat(locale)` in `Counter`'s `format`: "1,284" in English is "1.284" in German and "1 284" in French. Dates likewise with `Intl.DateTimeFormat`.

## 14. Burned-in captions and platform captions

Burned-in (open) captions are pixels in the video; platform (closed) captions are a text track the player draws, which viewers switch on or off.

**Burn in by default.** These videos are usually sound design and music with no voice, and platform auto-captions come from speech recognition (YouTube, Instagram and TikTok all generate them from the audio's speech), so a video without speech gets nothing. The story only survives sound-off viewing if the words are in the picture. On how common sound-off viewing is: a 2019 Verizon Media and Publicis Media survey of 5,616 US adults aged 18–54 reported that 69% watch video with the sound off in public places, 25% do so even in private, and 80% are more likely to finish a video when captions are available. It is old, self-reported and US-only; the direction matters more than the digits.

| | burned-in (open) | platform track (closed, SRT) |
|---|---|---|
| who sees it | everyone, always | viewers who turn captions on |
| looks like | your design: type, placement, motion | the player's style (fixed font, usually white on a dark box) |
| languages | one per render | one file per language, same video |
| needs speech | no | auto-captions do; an uploaded SRT does not |
| screen readers | cannot read pixels | neither reads captions aloud; put the key sentence in the post text |
| changes after posting | re-render and re-upload | depends on the platform |

Where a caption file goes, as of the check in September 2026:

- **YouTube** accepts SubRip (`.srt`) uploads: basic SubRip only, plain UTF-8, no styling markup.
- **LinkedIn** takes an `.srt` attached to the video in the post composer before you post.
- **X** has a help page for uploading an `.srt` caption file to a post.
- **Facebook** needs the file named `filename.[language]_[COUNTRY].srt`, for example `launch.en_US.srt`, or the upload fails.
- **Instagram and TikTok** generate captions from speech, and creators can edit them. No caption-file upload for regular reels and posts turned up in their help pages or in search results in September 2026, so treat burned-in text as the only text you control there.

When to also ship an SRT:

- **There is a voice-over** and the burned-in captions are a summary rather than every spoken word. The SRT carries the full narration, timed to speech onset (the BBC's guide: subtitles should appear as the speech starts).
- **You want other languages** on YouTube without re-rendering: one SRT per language over the same picture (section 15).
- **Skip it** when the burned-in captions already show every word. A viewer with captions on would see each line twice, once in your design and once in the player's box.

## 15. Exporting SRT from your cues

The template keeps every line the video says in `src/captions.json` (cut → scene → cues; §10), so the caption files come from the same data the picture draws:

```bash
node scripts/captions.mjs showcase               # → out/showcase.srt, out/showcase.vtt, out/showcase.txt
node scripts/captions.mjs showcase showcase-de   # the "showcase-de" block's words over the showcase's timing
```

It times each cue with the sound engine's clock (`sound/timeline.mjs`): a cue on scene time goes through the scene's warp and its start, a `drawn` cue only through its start, so the SRT lines up with the render exactly. Another language is one more top-level block in `captions.json` with the same scene ids; it needs a matching cut in `cuts.json` only for a burned-in render in that language.

```jsonc
// src/captions.json: text only, for a German SRT over the English picture
"showcase-de": {
  "problem": { "cues": [{ "at": "appsIn + 0.2", "text": "Dann landet alles in fünf Apps." }, { "at": "searchIn", "text": "Und keiner findet es, wenn es zählt." }] }
}
```

Why it is built this way:

- **SRT timecodes are `HH:MM:SS,mmm --> HH:MM:SS,mmm`** with a comma before the milliseconds, the format YouTube documents; the `.vtt` uses a dot and starts with `WEBVTT`. Seconds from `cuts.json` convert exactly; there are no frames to round.
- **Each event runs until the next one, its scene's cut (the middle of the crossfade) or 7 s, whichever comes first, and ends 40 ms before the next starts**, so no player shows two at once. 7 s is Netflix's maximum for one subtitle event.
- **A warning for any event shorter than its reading floor**, plain words ÷ 3 + 1, without the arrival term of section 8, because a player shows the whole line at once. On a fast reel it will warn; that is true information about the reel, not a bug in the file. The time counts from when the line is on screen: a hook pre-rolled so frame 0 already shows it (`"title - 0.12"`) starts at frame 0, not 0.12 s before it, so its scene must hold the whole floor from frame 0.
- **Punch cues are joined** until the line has had its reading time (and stays within two 42-character lines), and their `|` chunk breaks become spaces. A caption track of short flashes is unreadable in a player's caption box, and Netflix's minimum per event is 5/6 of a second.
- **Line breaks survive for calm captions** (`|` becomes a new line); a longer line is broken near its middle, after punctuation when there is some close by, for at most 2 lines of about 42 characters, the limits from section 4. `*emphasis*` marks are dropped.
- **The `.txt` is a transcript**, one caption a line, for under the player or the post text (section 16).
- **The end card is not in it.** Its name, URL and call to action come from `BRAND` in `src/theme.ts`; put the URL in the post text or the description.
- **A translated SRT cannot change the picture's timing.** When `node scripts/captions.mjs showcase showcase-de` warns that a German line is short, shorten the German wording; don't stretch the English cut to fit it.
- For Facebook, rename the file to the `name.de_DE.srt` pattern before uploading.

## 16. Accessibility

- **Contrast**: at least 4.5:1 for anything with words, 7:1 for captions, measured against the actual pixels behind them (section 6). Check the frames where bright UI passes behind the caption band.
- **No flashing.** WCAG 2.3.1: nothing flashes more than three times in any one second, unless the flash stays under the general and red flash thresholds. A flash is a pair of opposite luminance changes of 10% or more of the maximum, and the threshold area is a quarter of a 10° visual field (WCAG estimates the 10° field as a 341×256 px rectangle at typical viewing distance); saturated red counts separately. In practice: a full-frame white or accent flash on every beat at 120 bpm with eighth notes is 4 per second and fails; a single flash for an error moment is fine; punch words swapping on a steady background are not flashes; avoid red flashes entirely.
- **Respect reading speed**: the floors in section 8 are the minimum for a general audience, not a target to squeeze toward. When in doubt, go slower, or cut words.
- **Text holds still while it is read.** Arrive, hold, leave. Words that drift, zoom (inside `Camera`) or shake while on screen are harder to read for everyone and uncomfortable for people sensitive to motion.
- **Words are not only pixels.** Screen readers cannot read burned-in text. Put the one-line promise and the call to action in the post text, the YouTube description, or the page around an embedded loop, and give an embedded video an accessible label. For a caption-only film (no voiceover) the captions are the whole script, so publish them as a text transcript under the player: `node scripts/captions.mjs <cut>` writes it to `out/<cut>.txt` from the same lines the picture draws (a collapsible `<details>`: [showcase-16x9](showcase-16x9.md) §12). For a reel, put the full caption script in the post text or the first comment.
- **Don't carry meaning in color alone** (section 12), and don't carry meaning in sound alone: if an error buzz matters to the story, the picture or a caption shows the error too.
- **Legible weights and sizes**: nothing a viewer must read below the floors in section 2, nothing lighter than weight 400.

## 17. Checklist before you render

Render stills at the marks with safe zones (`node scripts/stills.mjs <cut> --marks --safe`), tile them (`node scripts/sheet.mjs <cut>`), and check each item:

- [ ] Every caption fits its line budget, wraps where you meant, and has no one-word last line.
- [ ] Every caption and every button-like element sits inside the safe box; reel captions are ≤ 780 px wide.
- [ ] Caption size, weight and position are the same in every scene of the cut.
- [ ] Contrast holds on every still, including frames where UI passes behind the words.
- [ ] Each caption's hold meets its floor (the `checkCues` guard, or the export script's warnings), counting the crossfade and any warp.
- [ ] The picture finishes its move before the next caption arrives.
- [ ] The thing each caption names is visible while the caption is up.
- [ ] Captions are plain words in the brand's casing and voice, one idea each, with no untrue numbers.
- [ ] At most one emphasized phrase per caption, and emphasis in no more than about one caption in three.
- [ ] Running calm captions arrive as whole lines, the blur-rise is kept to at most two moments, and punch chunks land whole unless a voice or a beat grid drives the word lighting.
- [ ] Fonts loaded for every script in the captions; no fallback glyphs (curly quotes, accents, CJK, symbols).
- [ ] No full-frame flashing faster than three times a second.
- [ ] If there is a voice-over, a second language or a transcript to publish: `node scripts/captions.mjs <cut>` run and its files checked against a few stills; the post text carries the key sentence.

## Sources

Checked in September 2026.

- BBC Subtitle Guidelines (reading rate 160–180 wpm and 0.33–0.375 s per word; about 0.3 s per word minimum; line length 68% of a 16:9 frame and 90% of a 9:16 frame, about 25 characters in 9:16; at most 2 lines in 16:9 and 3 in 9:16; line height 7–8% of frame height for 16:9 and 3.9–4.5% for 9:16; white on black with the background extended 0.5 em per side; vertical subtitles a little higher; line-break rules; capitals for stress used sparingly; subtitles appear with speech onset): https://www.bbc.co.uk/accessibility/forproducts/guides/subtitles/
- Netflix, Timed Text Style Guide: General Requirements (minimum 5/6 s and maximum 7 s per event, at most 2 lines, line-break rules): https://partnerhelp.netflixstudios.com/hc/en-us/articles/215758617-Timed-Text-Style-Guide-General-Requirements
- Netflix, English (USA) Timed Text Style Guide (42 characters per line; up to 20 characters per second for adult programs, 17 for children's; bottom-heavy pyramid): https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide
- Netflix, German Timed Text Style Guide (42 characters per line, up to 17 characters per second for adult programs): https://partnerhelp.netflixstudios.com/hc/en-us/articles/217351587-German-Timed-Text-Style-Guide
- Netflix, Japanese Timed Text Style Guide (13 full-width characters per horizontal line, up to 4 characters per second): https://partnerhelp.netflixstudios.com/hc/en-us/articles/215767517-Japanese-Timed-Text-Style-Guide
- Netflix, Chinese (Simplified) Timed Text Style Guide (16 characters per line, up to 9 characters per second): https://partnerhelp.netflixstudios.com/hc/en-us/articles/215986007-Chinese-Simplified-Timed-Text-Style-Guide
- Netflix, Korean Timed Text Style Guide (16 characters per line with Latin letters, spaces and punctuation counting half; up to 12 characters per second): https://partnerhelp.netflixstudios.com/hc/en-us/articles/216001127-Korean-Timed-Text-Style-Guide
- W3C, Understanding WCAG 2.2 SC 1.4.3 Contrast (Minimum) (4.5:1, 3:1 for large text of 18 pt or 14 pt bold; 7:1 at level AAA): https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- W3C, Understanding WCAG 2.2 SC 2.3.1 Three Flashes or Below Threshold (three flashes per second, general and red flash thresholds, 341×256 px estimate of a 10° field): https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- Apple Human Interface Guidelines, Typography (iOS default 17 pt, minimum 11 pt; avoid Ultralight, Thin and Light weights): https://developer.apple.com/design/human-interface-guidelines/typography
- W3C Internationalization, Text size in translation (IBM's expansion table by source length; German compound example): https://www.w3.org/International/articles/article-text-size.en
- Chrome for Developers, Introducing four new international features in CSS (`word-break: auto-phrase` in Chrome 119, needs `lang="ja"`): https://developer.chrome.com/blog/css-i18n-features
- MDN, `word-break` (`keep-all` for CJK): https://developer.mozilla.org/en-US/docs/Web/CSS/word-break
- MDN, `line-break` (`strict` CJK line-break rules): https://developer.mozilla.org/en-US/docs/Web/CSS/line-break
- MDN, `text-wrap` (`balance` limited to 6 lines in Chromium): https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap
- MDN, `hyphens` (automatic hyphenation needs `lang` and an available dictionary): https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens
- Remotion, Chrome Headless Shell (Remotion renders in a pinned Chrome Headless Shell it installs itself): https://www.remotion.dev/docs/miscellaneous/chrome-headless-shell
- YouTube Help, Supported subtitle and closed caption files (basic SubRip, plain UTF-8, no styling; timecode format): https://support.google.com/youtube/answer/2734698
- YouTube Help, Use automatic captioning (captions generated with speech recognition; may not be ready at upload): https://support.google.com/youtube/answer/6373554
- LinkedIn Help, Add closed captions to videos on LinkedIn (attach an SRT in the composer before posting): https://www.linkedin.com/help/linkedin/answer/a552177/add-closed-captions-to-videos-on-linkedin
- X Help, How to upload caption (.srt) file to Posts (seen via search; the page did not load directly): https://help.x.com/en/using-x/upload-caption-srt-file
- Facebook Help, What is the naming convention for SubRip (.srt) files? (`filename.[language code]_[country code].srt`; seen via search; the page did not load directly): https://www.facebook.com/help/1528795707381162
- Instagram Help, Manage closed captions for your reels on Instagram (seen via search; the page did not load directly): https://help.instagram.com/7487270478066359/
- TikTok Newsroom, Introducing auto captions (auto-generated from speech, editable by creators, switchable by viewers; seen via search): https://newsroom.tiktok.com/introducing-auto-captions?lang=en
- 3Play Media, summary of the Verizon Media and Publicis Media study (5,616 US adults, April 2019; 80% more likely to watch an entire video with captions): https://www.3playmedia.com/blog/verizon-media-and-publicis-media-find-viewers-want-captions/
- Streaming Media, report on the same study (May 2019; 69% watch with the sound off in public, 25% even in private; 5,616 US adults aged 18–54): https://www.streamingmedia.com/Articles/ReadArticle.aspx?ArticleID=131860
