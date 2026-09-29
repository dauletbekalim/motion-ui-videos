# Showcase 16:9: the product film

How to make a 45–120 s, 1920×1080, 60 fps film that someone who has never heard of the product understands on the first watch. It lives on YouTube, on the landing page, in a launch post, on a conference screen. Comprehension comes first; a showcase keeps people by being clear, not by being fast. Before writing, read §2 (the spine, with its cold open), §3 (timings) and §4 (the pacing rule). Read §5 for a voiceover, §6–7 while timing scenes, §9–10 for a complete 60 s plan and a worked scene, §11 for YouTube, and §12 for a landing page (web copies, posters, the embed). §13 is the checklist.

## Contents

1. [What a showcase is for](#1-what-a-showcase-is-for)
2. [The story spine](#2-the-story-spine)
3. [Timings: 30, 60, 90 and 120 s](#3-timings-30-60-90-and-120-s)
4. [The pacing rule](#4-the-pacing-rule)
5. [Calm captions or voiceover](#5-calm-captions-or-voiceover)
6. [Camera language for UI](#6-camera-language-for-ui)
7. [One moving thing at a time](#7-one-moving-thing-at-a-time)
8. [The scene table in the README](#8-the-scene-table-in-the-readme)
9. [Example: a 60 s film, scene by scene](#9-example-a-60-s-film-scene-by-scene)
10. [Worked scene: "decide", in TSX and sound](#10-worked-scene-decide-in-tsx-and-sound)
11. [YouTube: chapters, thumbnail, upload](#11-youtube-chapters-thumbnail-upload)
12. [Landing page: poster, muted loop, the full film](#12-landing-page-poster-muted-loop-the-full-film)
13. [Checklist before you call it done](#13-checklist-before-you-call-it-done)
14. [Sources](#sources)

## 1. What a showcase is for

A reel wins or loses in the first second of a feed. A showcase is usually chosen: someone clicked play on a landing page, a YouTube link or a launch post. The viewer gives you a minute, and in return they expect to leave knowing three things:

1. **What problem this solves**, in their own words.
2. **How it works**, seen in the product's real interface, not described.
3. **Where to get it**: the URL and the one thing to do next.

Everything in the film serves one of those three. Mood, logo animation and feature lists are only there to carry them.

Two consequences shape every choice below:

- **You are teaching, so the viewer needs time.** They are reading captions, finding the part of the UI you mean, and building a model of the product all at once. The people who made the product always think the film is too slow. First-time viewers almost never do.
- **Expect half the audience to leave by the middle.** Wistia's 2026 data (13M+ videos) puts average engagement for videos under a minute at 52%, and for 1–5 minute videos it finds most viewers drop off around the halfway point. So show the product in the first seconds, and put the promise and the first "how it works" step in the first half. The close still matters, because the viewers who stay are the ones who act.

Default specs come from the `showcase` format in `src/formats.ts`: 1920×1080, 60 fps, safe margins 54 px top and bottom and 96 px left and right. 60 fps is worth its cost here. UI is full of 1 px borders and small text, and during a camera pan at 30 fps those edges step visibly. At 60 fps the same move is half the distance per frame and reads as smooth.

## 2. The story spine

This order works for almost every software product. Write it as captions first (one plain sentence per beat) before building any scene. If the story does not work as a list of sentences, no amount of motion will save it.

| # | beat | its one job | length (60 s film) |
|---|---|---|---|
| 1 | **hook: the payoff, cold** | the product doing its one job, with the hook sentence over it | 4–5 s, one sentence |
| 2 | **problem, shown** | the pain as 2–3 short sentences, each with a picture | 6–7 s (9–12 s in a problem-first film) |
| 3 | **reveal** | the name, then a one-line promise | 4.5–5 s |
| 4 | **how it works** | the product's own UI, step by step, one action per caption | ⅓ of the film |
| 5 | **features** | 2–4 extras, one at a time | 9–11 s |
| 6 | **proof** | only if real: a dated number, a quote given with consent | 0–4 s |
| 7 | **close** | the headline, the URL, the call to action | 6–8 s |
| 8 | **credits** | only organisations that agreed, in their words | 0–4 s |

### 1. Hook: the payoff, cold

Open on the product already doing the thing it is for, with the hook sentence over it: the search that finds last week's decision, under "every decision your team makes, one search away." The viewer sees what the product is before anyone explains it. Autoplaying embeds and feeds (the landing page, LinkedIn, X, Product Hunt) show the first seconds to people who haven't decided to watch yet, and a film whose product first appears at 20 s loses exactly the viewers most likely to leave. Motion and text on screen by 0.3 s, the name and promise by about 12–13 s, the how from about 15 s.

**Problem-first, the option.** Open on something the viewer recognises about their life right now ("your team decides things in chat now.") when the value only makes sense after the pain: a new category, a problem people don't know they have. It earns a nod before asking for attention and tells the viewer who the film is for. Keep the problem under about 10 s so the product still arrives by about 20 s.

Avoid:

- **"Introducing X"**: the name means nothing until the viewer has a problem it solves.
- **Abstract futures**: "the future of collaboration" is a promise with no picture.
- **A logo sting at 0 s**: spend the first five seconds on the viewer, not the brand.

### 2. Problem, shown in 2–4 sentences

Show the failure happening, one sentence per step, ending on its cost:

- "so when someone asks what you decided,"
- "the answer is buried in a thread."
- "and the same question comes back next week."

Rules that came out of a real film:

- **Replace jargon with its consequence.** "Merge conflict" became "their changes crash into each other" and "merge time" became "untangle it by hand". The viewer may not know the term, but everyone understands the consequence.
- **Show a generic "before" world.** Use plain chat bubbles and a plain doc, never a real competitor's UI or logo.
- **Frame it for the real audience.** A founder noticed his film made a team product look single-user, and every label changed ("alice's agent", not "alice"). If the product is for teams, show more than one person in the problem.

### 3. Reveal: name and one-line promise

- **Mark and name.** The mark draws or pops in (the one bounce you are allowed, `pop(t, m.logo, { bouncy: true })`). The name slides out of it around 0.6 s later.
- **Promise.** The promise rises word by word with `Words` about 0.5 s after the name. Keep it to 10 words or fewer. Use the landing page's own promise when it is good, so the film and the page say the same thing.
- **Length.** The whole beat is 4.5–5.5 s. It needs no caption above it, because it *is* the text.

### 4. How it works, in the product's own UI

This is the film. Give it about a third of the runtime and never cut it, not even in a 30 s version. A reel that stated the problem and then said "we solve it" explained nothing, and the same is true here.

- **Rebuild the real interface.** Rebuild the real screens as components (see [ui-recreation](ui-recreation.md)), with real labels and real flow order. Show only features that exist.
- **One step per caption.** Each step gets a caption, a camera move to where it happens, one action (click, type, drag), and the result held long enough to see.
- **Keep continuity.** The UI state carries from step to step: the note typed in step 1 is still there in step 2. A film that resets the app between steps feels staged.
- **Show the outcome, not only the clicks.** "The team sees it pinned" is the point; the click that pins it is just how you got there.
- **Team products need a second person.** Show a second avatar, cursor or name somewhere in this section.

### 5. Features, one at a time

- **How many.** Two to four, each with one caption of 10 words or fewer and one short moving demo (3–5 s).
- **Layout.** A good layout is the grid-then-focus pattern: all cards land (staggered 40–90 ms), then the camera or `Focus` takes each in turn, then pulls back to all of them.
- **Cut order.** Features are the first thing you cut when the film must be shorter.

### 6. Proof: only real

Proof is optional, and fake proof is worse than none:

- **Numbers.** Use real numbers with a date ("12 teams use it daily, since june"), taken from the user's own dashboard on the day you render. Ask the user where the number comes from.
- **Quotes.** Quotes need the person's written consent, with their name and role as they want them shown.
- **Customer logos.** These need written consent too. A logo implies they endorse the product.
- **No offsets.** A counter with a hidden offset (a waitlist that starts above zero) is fake proof. Show the true number or nothing.
- **When there is nothing real.** Cut the beat and give its seconds to "how it works". A clear demo of the real product is proof.

### 7. Close: headline, URL, call to action

- **Headline.** Arrives first with `Words`, 110–146 px. Then it lifts and shrinks to make room.
- **End card.** `EndCard({ title, url, cta, start })` brings in the name, the URL (at least 56 px, which is what `EndCard` draws: a 16:9 film in a phone feed shrinks it to about 11 pt) and the call to action as a button-like pill.
- **Hold.** Keep the URL on screen at least 4 s, so people can read it or pause on it. Fade to the backdrop over the last 0.3–0.5 s.
- **Same words everywhere.** Use the same headline and call to action as the landing page (`BRAND` in `src/theme.ts` holds them). Two different CTAs split the click.

### 8. Credits: only with consent

Credit only organisations that agreed, in the words they agreed to. "Supported by" with a logo tells viewers the organisation formally backs the product. One founder wanted a big company's logo after a single friendly call with its startup team. That is not support, so the logo stays out unless they say yes in writing. Another partner asked to be removed after launch, so keep credits easy to cut: a separate scene at the end, 3–4 s, never mixed into the close.

## 3. Timings: 30, 60, 90 and 120 s

Net seconds on screen per section (crossfades included), and roughly how much text each version can carry at the reading rule in section 4:

| section | 30 s | 60 s | 90 s | 120 s |
|---|---|---|---|---|
| hook: the payoff, cold | 3 | 4.5 | 5 | 6 |
| problem | 4 (1–2 sentences) | 7 (2) | 9 (2–3) | 12 (3–4) |
| reveal | 3.5 | 4.5 | 5 | 5.5 |
| how it works | 13 (one flow) | 21 (2 steps) | 34 (3 steps) | 46 (4 steps) |
| features | none | 11 (2) | 20 (3) | 30 (4) |
| proof (only real) | none | 0–4 | 8 | 12 |
| close | 6.5 | 8 | 9 | 8.5 |
| credits (consent only) | +3–4 s, outside the budget | same | same | same |
| caption words, total | ~50 | ~100 | ~150 | ~200 |
| voiceover words, total (≈75% of the runtime at 150 wpm) | ~55 | ~110 | ~170 | ~225 |

A problem-first film (§2) spends longer before the product: at 60 s, hook 5 · problem 10.5 · reveal 5 · how 19 · features 9.5 · proof 0–4 · close 7.

How to move between versions:

- **Shorter:** cut features first, then proof, then shorten the problem to two sentences. Never cut how it works; shorten it to one flow instead.
- **Longer:** add a how-it-works step or a real feature. Don't stretch the hook or the reveal, since longer there only reads as slower.
- **Over 90 s** the film needs chapters (section 11) and a reason to exist at that length, usually a genuinely multi-step workflow.
- **The 30 s version** is not a reel. It is still 16:9, still captions a person can read, still one how-it-works flow. For a feed, make a reel ([reels-retention](reels-retention.md)).

Each cut in `src/cuts.json` is its own composition, so the 60 s and 30 s versions can be two cuts that reuse the same scenes: fewer scenes and shorter `seconds` in the short one, with captions varied through `useCut()`.

## 4. The pacing rule

**Hold each caption at least (words ÷ 3) + 1 seconds, and let the picture finish its move before the next sentence arrives.**

Where the numbers come from:

- **Three words a second** is 180 words per minute, the top of the BBC's subtitle reading rate (160–180 wpm, about 0.33 s per word). Netflix allows adult English subtitles up to 20 characters per second, a little faster. The showcase rule sits at the careful end on purpose.
- **The extra second** is for what subtitles don't ask of a viewer: finding the caption, reading it, and finding the part of the UI it talks about, while that UI is moving.

| words | minimum hold |
|---|---|
| 4 | 2.3 s |
| 6 | 3.0 s |
| 8 | 3.7 s |
| 10 | 4.3 s |
| 12 | 5.0 s (too long: split it) |

For 8 words or more, a calm caption takes longer than a second just to arrive, so the exact floor is a little higher (4.6 s at 10 words); [captions-and-type](captions-and-type.md) §8 has the formula and a guard that throws.

**The lesson behind the rule.** The first cut of a real launch film was 37 s. Its makers loved it, and only very technical viewers understood it. The fix was not new scenes. The same film was re-paced to about 62 s, with one plain sentence per beat, each held to this rule, and the camera leaning in on whatever the sentence was about. First-time viewers got it. Length was never the problem; being unreadable was. When someone says a showcase is "too long", check whether they already know the product. The people it is for usually don't.

Working rules around it:

- **One sentence per caption, 10 words or fewer.** At 60 px with a 1300 px `maxWidth`, a line holds about 40 characters, so 10 words make one full line or two short ones. A longer sentence becomes two beats.
- **Lead the action.** The caption lands 0.1–0.4 s before the move it describes, so the eye reads first and then watches. A caption that arrives after the action makes the viewer re-watch in their head.
- **Don't change the caption mid-move.** The next caption waits until the current move has settled (at least 0.6 s after it ends).
- **Scene transitions count.** A scene's last caption must hold into the next scene: the next scene's first caption arrives at (this scene's seconds − `cross` + its own first `at`).

A small development guard helps. Paste it into a scene while you are timing it:

```ts
// warns in the Studio console / render log when a caption is cut short
function paced(cues: { at: number; text: string }[], until: number) {
  cues.forEach((c, i) => {
    const shown = (cues[i + 1]?.at ?? until) - c.at;
    const need = c.text.trim().split(/\s+/).length / 3 + 1;
    if (shown < need - 1e-6) console.warn(`"${c.text}" shows ${shown.toFixed(2)} s, needs ${need.toFixed(2)} s`);
  });
  return cues;
}
// until = when the next caption arrives, in this scene's seconds:
// seconds - cross + (next scene's first cue at), e.g. 10 - 0.1 + 0.3 = 10.2
const CUES = paced([{ at: 0.3, text: 'type a slash to turn any line into a decision.' }], 10.2);
```

## 5. Calm captions or voiceover

### Pick by where it plays

| where it plays | default | why |
|---|---|---|
| landing page, autoplaying hero | captions-free muted loop (section 12) | browsers only autoplay muted video |
| landing page, click to play | calm captions; voiceover optional | a visitor may have sound off; captions must carry the story alone |
| YouTube | voiceover works well, with a subtitle file | people choose to watch with sound; captions are one click away |
| LinkedIn, X and other feeds | calm captions, no reliance on sound | LinkedIn plays feed videos automatically without sound |
| conference screen, booth | calm captions plus sound design | rooms are loud; nobody hears a voice |

When unsure, make the captions-first version. It works everywhere. Add a voiceover cut when the user wants one or the film lives mainly on YouTube.

### Calm captions

`Captions({ cues, variant: 'calm' })` shows one sentence at a time, and the old one lifts away as the new one arrives:

- **Position:** top-centre, `top` about 84–120 px on a 1080 frame (inside the 54 px safe margin; the fallback is 84, the examples here use 104), above the product window. The eye reads, then drops to the UI where the action is. Top placement also keeps captions clear of YouTube's player controls and of the subtitles people turn on, both of which sit at the bottom.
- **Size:** 56–64 px (pass `size`: the fallback, 50, is under that), with `maxWidth` about 1300, one line if possible. Match the brand's voice and casing exactly, including all-lowercase if that is the brand.
- **Keep them out of `Camera`.** Captions sit outside it, so a push-in never scales or crops them.

### Voiceover

A voiceover cut is its own cut in `cuts.json` (for example `"showcase-vo"`), reusing the same scenes. The scenes read `useCut()` to swap captions for labels, and the sound engine mixes the voice into that cut's soundtrack and ducks the rest under it.

**Script rate: 140–160 words per minute** (2.3–2.7 words a second). The US average speaking rate is about 150 wpm, and audiobook and podcast narration runs 150–160 wpm. For a first-time audience that is also watching UI, stay near 140–150. Fill only about 75% of the runtime with speech, because the pauses are where the viewer looks at what just happened.

Estimate each line before recording: seconds ≈ words ÷ 2.5. Write the script as a table, one line per beat, keyed to the scene marks it starts on:

| file (`sound/vo/`) | scene · mark | words | ≈ seconds | text |
|---|---|---|---|---|
| `hook-1.wav` | hook · vo1 | 8 | 3.2 | "Your team makes its decisions in chat now." |
| `problem-1.wav` | problem · vo1 | 14 | 5.6 | "So when someone asks what you decided, the answer is buried in a thread." |
| `decide-1.wav` | decide · vo1 | 11 | 4.4 | "In Lumen, type a slash, and any line becomes a decision." |

Write for the ear:

- Short sentences, contractions, one idea each.
- No parentheses, slashes or symbols. Say "mention Maya", not "at-maya".
- Spell numbers the way they are said.
- Keep the voiceover's words close to the captions' meaning, so a muted viewer and a listening viewer get the same film.

**On-screen text under a voiceover.** Don't print the full sentence the voice is saying. Mayer's redundancy principle holds that narration plus identical on-screen text tends to hurt understanding. But Mayer and Johnson (2008) found that 2–3 printed words from the narration, placed next to the part of the picture they describe, improved retention. So in the voiceover cut, replace the top caption with a `Callout` of 2–3 words at the UI element ("type /", "pinned for everyone"). Then ship a real subtitle file for accessibility: upload it to YouTube, or add it as a `<track>` on the landing page (timing and SRT format are in [captions-and-type](captions-and-type.md) §15; the WebVTT a `<track>` needs comes from the script in [delivery-and-platforms](delivery-and-platforms.md) §15).

```tsx
{useCut() === 'showcase-vo'
  ? <Callout at={{ x: 420, y: 592 }} text="type /" start={m.typeStart - 0.2} side="right" />
  : <Captions variant="calm" cues={CUES} top={104} size={60} maxWidth={1300} />}
```

**Who speaks.** Either the user records it or you use a TTS voice the user chooses:

- **The user records.** One file per line, three takes each. Record in a small furnished room (a closet full of clothes is better than a bare office), 15–20 cm from the mic, slightly off to the side to avoid pops, with 0.5 s of silence before and after. Put the chosen takes in `sound/vo/` as `decide-1.wav` and so on. `readAudio()` reads WAV directly and decodes MP3 or M4A with Remotion's ffmpeg.
- **TTS.** Let the user pick the voice by listening to two or three candidates reading the same line. They confirm the voice's license covers commercial use. Never imitate a real person's voice without that person's consent; the user's own voice, with their say-so, is fine.

**The voice sets the timing.** Once the lines exist, measure them and set the marks from the real lengths, not the estimates:

```bash
npx remotion ffprobe -v error -show_entries format=duration -of csv=p=0 sound/vo/decide-1.wav
node sound/tools/loudness.mjs sound/vo/decide-1.wav sound/vo/decide-2.wav   # compare line levels, in dB
```

```jsonc
// src/cuts.json, the voiceover cut: its own seconds and marks, same scene ids
// (the hook and problem scenes, with their own vo1 and vo1End marks, come before this one)
"showcase-vo": {
  "format": "showcase", "cross": 0.1, "sound": true,
  "scenes": [
    { "id": "decide", "seconds": 10.6,
      "marks": { "vo1": 0.3, "vo1End": 4.7, "vo2": 6.2, "vo2End": 9.6,
                 "push": 0.9, "whooshIn": 1.45, "cursor": 2.1, "click": 2.8,
                 "typeStart": 3.1, "typeEnd": 3.32, "paletteOpen": 3.2, "enter": 4.1,
                 "typeStart2": 4.4, "typeEnd2": 5.68, "typeStart3": 6.6, "typeEnd3": 6.93,
                 "pull": 7.2, "whooshOut": 7.7, "done": 8.2, "unfocus": 9.8 } }
  ]
}
```

Mix each line into the soundtrack on its mark, in the voiceover cut's case of `score()`. The voice then goes through the same fixed master as every other sound, the design report measures it with them, and the render carries one mastered track. Duck the rest under it with `duck()` from [sound-design](sound-design.md) §14, which turns chosen layers down while the voice speaks, starting just before each phrase:

```js
// sound/score.mjs: add readAudio to the engine import, and duck() from sound-design §14 (fs, path and HERE are already there).
// Lines start on marks vo1, vo2… of each scene; the takes are sound/vo/<scene>-<n>.wav.
const VO = { hook: ['vo1'], problem: ['vo1'], decide: ['vo1', 'vo2'] };   // scene → its lines, in order

// in the switch of score():
case 'showcase-vo':
  byMarks(k, CALM);
  pads(k, { ...CALM, bright: 0.5 });                    // darker chords: 2–4 kHz, where consonants live, is the voice's
  for (const [scene, marks] of Object.entries(VO)) marks.forEach((mark, i) => {
    const file = path.join(HERE, 'vo', `${scene}-${i + 1}.wav`);
    if (!fs.existsSync(file)) return;                   // a missing take never breaks the render
    const line = readAudio(file), t = at(scene, mark);
    duck(mix, line, t, { layers: ['pad', 'beat'], depthDb: 9 });
    duck(mix, line, t, { layers: ['whoosh'], depthDb: 7 });
    duck(mix, line, t, { layers: ['sfx'], depthDb: 3 }); // before the voice goes onto sfx, so it is not ducked itself
    place(mix, line, t, { room: 0.03 });
  });
  break;
```

Two details matter here:

- **Read voiceover marks only in the voiceover cut.** `useMarks()` throws on a mark the cut doesn't define, and so does `at()` in the score, which is what you want, since it catches typos.
- **Re-run the sound after every new take.** `node sound/design.mjs showcase-vo` rebuilds `public/sound-showcase-vo.wav`; the Studio plays it after a refresh.

Voiceover belongs to unwarped scenes. Speech can't be squeezed through a `warp` without sounding broken, so a reel gets its own lines or none ([reels-retention](reels-retention.md) §8 covers a voice in a reel). Raw takes need a processing chain before they sit next to clean synthesized sounds ([sound-design](sound-design.md) §14).

Starting points for the duck (heuristics; the user's ears decide):

| layer | under the voice | why |
|---|---|---|
| pad / bed | −8 to −10 dB, chords about half as bright | leaves the 2–4 kHz region, where consonants live, to the voice |
| whooshes, risers | −6 to −8 dB, or move them into gaps | broadband noise masks speech more than anything else |
| chimes, pops | move to the gaps between lines (they sit on `sfx`, so otherwise they get its −3 dB) | tonal hits compete with the pitch of the voice |
| clicks, keys | −3 dB | short and synced to the picture; they help the voice feel real |

Measure the result, not the parts. After rendering the voiceover cut, `node scripts/check.mjs out/showcase-vo.mp4` reports its integrated loudness and true peak. Aim for the showcase target, about −17 LUFS integrated (−16 to −18) with true peak at −1 dBTP or below. With a voice, the voice dominates that number, so adjust the lines' `gain` in `place()` in 2 dB steps (0.8 is about −2 dB), then run `node sound/design.mjs showcase-vo --fit` for the cut's fixed gain, and report changes in dB.

## 6. Camera language for UI

The camera's job is to answer "where should I look?" before the viewer has to ask. `Camera({ keys })` moves between keyed framings `{ t, x, y, scale }` (the stage point to put in the middle, and the zoom). It eases every segment with `EASINGS.inOut` and interpolates zoom in log space, so you choose only the framings and their times. Put the product window, the `Cursor` and any `Focus` inside it, and keep captions outside. [motion-language](motion-language.md) §9 has `frameOn()`, which computes a framing that fits a rect into the safe area, and a recipe for pushes that commit fast and settle long. A film of identical symmetric pushes all the same length feels machine-made: vary each push with its distance.

| move | scale | duration | use it when |
|---|---|---|---|
| lean-in | 1.0 → 1.1–1.15 | 0.8–1.4 s, longer for a longer move | the caption names a region ("the sidebar") |
| read-in | → 1.3–1.8 | 1.0–1.4 s | the viewer must read UI text smaller than about 24 px |
| pull-back | → 1.0 | 0.9–1.2 s | between beats, before moving to another part of the app |
| pan | same scale | 0.8–1.2 s | two subjects in the same area; over about 60% of the frame, pull back and push in instead |
| drift | +2–3% over the whole scene | two keys spanning the scene; the cuts hide its slow ends | a static frame that would otherwise feel dead |
| focus by dimming | none | 0.3–0.5 s fade of `Focus`'s `active` | the subject is small but where it sits matters |

The grammar behind the table:

- **Push in on the subject.** Lean in when the caption starts talking about something and hold while it happens. Hold means still: no drift stacked on a held push.
- **Pull back between beats.** Returning to 1.0 re-orients the viewer ("we're in the editor again") before the next idea. Skipping it and panning at zoom from one detail to another loses people.
- **Focus by dimming** (`Focus({ active, rect })`) when zooming would hide context. It dims and blurs everything but `rect`, so the viewer sees both what and where. Use it for a feature card in a grid, a toolbar button, a sidebar item. Use a read-in when the detail itself (text, numbers) is the point.
- **One tilt per film.** The hero device's first entrance may tilt back (rotateX 10–14°), settling to 0 before any text must be read. Later windows enter flat, with an `EASE` translate and opacity. A tilted entrance in every section is the stock-mockup look. Never roll the camera over UI: rolling a flat screen reads as a gimmick and blurs text.
- **Legibility sets the zoom.** A desktop UI at 13–14 px fills a 1920 frame at roughly 1×, which is too small to read in a YouTube player. Rebuild the UI with 20–24 px body text (see [ui-recreation](ui-recreation.md)), or read-in to 1.3–1.8 when text matters.

## 7. One moving thing at a time

The eye tracks one motion at a time, and in a showcase it is also reading. If the camera, the cursor and a popover all move at once, the viewer follows none of them. Ambient motion doesn't count against this: a slow drift, a breathing avatar or a blinking caret can run under one primary move. Run ambient motion on `useDrawnTime()` so a warped cut never makes it shiver.

The beat grammar, in order:

| step | when | why |
|---|---|---|
| caption lands | 0 | the viewer learns what to watch for |
| camera moves (if needed) | +0.2–0.4 s | the eye comes back from the caption to a moving frame |
| camera settles | +1.0–1.2 s | don't start the action on a moving frame |
| cursor travels | 0.5–0.8 s | slows into its target; never teleports |
| click, then the UI responds | +0.08–0.15 s | real software answers fast, and a lag reads as broken |
| result holds | ≥ 0.6 s | the new state has to be seen, not just flashed |
| next caption | ≥ words/3 + 1 s after the last | the reading floor |

Lists and groups are one "thing": stagger their items 40–90 ms (`stagger(i, 0.06, m.cardsIn)`), and they read as a single arrival. `pop()` is calm by default; use `{ bouncy: true }` once per scene at most, for the moment that deserves it (the logo, a success state).

## 8. The scene table in the README

Keep the plan as a table in the project's `README.md`, and update it whenever `cuts.json` changes. It is how the user reviews the film without watching it, how they point at a moment ("scene 5, the second caption"), and how you keep picture, captions and sound consistent across sessions. Show it to the user before building scenes, and again with the first contact sheet.

Columns that earn their place:

| column | what goes in it |
|---|---|
| # | scene order |
| scene | the `id` in `cuts.json` |
| s | `seconds` in `cuts.json` |
| starts | seconds from the start of the cut (computed, below) |
| captions | each cue's `at` and text |
| on screen | what moves, in order |
| camera | the framing keys in words ("lean-in on the editor 0.7→1.8, pull back 7.0→8.0") |
| sound | the cues and the marks they sit on |

Compute the start column instead of adding it up by hand (run from `video/`):

```bash
node --input-type=module -e "
import { loadCuts, sceneStart, cutDuration } from './sound/timeline.mjs';
const cut = process.argv[1] ?? 'showcase';
for (const s of loadCuts()[cut].scenes) console.log(s.id.padEnd(10), sceneStart(cut, s.id).toFixed(2).padStart(6), 's  +', s.seconds);
console.log('total', cutDuration(cut).toFixed(2), 's');
" showcase
```

`node sound/timeline.mjs showcase` prints every scene and mark in cut time, which fills in the sound column.

## 9. Example: a 60 s film, scene by scene

The template's demo product is Lumen, a notes app for small teams. The template's own `showcase` cut is a shorter film (47.3 s, with a single `how` scene). Here is how the same product would be planned at 60 s, to the rules above. It opens cold on the product's payoff (§2), and scenes cut into each other (`cross` 0.1, as in the template's demo), so each scene starts at previous start + previous seconds − 0.1. Every caption is checked against the reading rule, and a scene's last caption counts only until `seconds − cross`, when the next scene takes over. The product is on screen from frame 0, the promise has landed by about 13.4 s, and the halfway point (30.0 s) falls in the second how-it-works step.

| # | scene | s | starts | captions (`at` → text) | on screen, in order | camera | sound |
|---|---|---|---|---|---|---|---|
| 1 | `open` | 4.4 | 0.0 | 0.3 → "every decision your team makes, one search away." (8 w, holds 4.0 s) | the product mid-action on frame 0: the search palette open over the note list, "beta" already typed; the decision "ship the beta on may 12" lands as the top result 0.2; its byline "decided by maya · may 3" lights up 1.6 | a drift from 1.04 to 1.0, its first key before 0, so frame 0 already moves | `done`: a soft success chime as the byline lights; the scene's pad |
| 2 | `problem` | 7.0 | 4.3 | 0.3 → "decisions get made in chat," / 3.0 → "and a week later, nobody can find them." | a chat thread settles on "ship the beta may 12?" "yes, may 12." 0.4; a "1 week later" tag 3.1; search types "beta" 4.2 and shows 214 results 4.6, the list scrolls and blurs 4.8→5.4; "@sam what did we decide about the beta date?" pops in 6.2 | lean-in on the search 3.3→4.1; pull back 5.4→6.1 | keys on `typeStart…typeEnd`, a `hit` on the repeated question (a steady beating tone swells into it, since this is the problem scene) |
| 3 | `reveal` | 4.7 | 11.2 | promise `Words` 1.1 → "notes your team writes, and finds again." (7 w) | the mark pops (bouncy, the film's one bounce) 0.2, the name slides out 0.6, the promise rises 1.1 | slow scale 1.06 → 1.0 over the scene | `reveal`: whoosh, low thump and a bright chord |
| 4 | `decide` | 10.0 | 15.8 | 0.3 → "type a slash to turn any line into a decision." / 6.0 → "mention someone. the team sees it pinned." | section 10, step by step | lean/read-in 0.7→1.8 at 1.3×, pull back 7.0→8.0, `Focus` on the pinned bar 8.0→9.4 | section 10 |
| 5 | `find` | 11.0 | 25.7 | 0.3 → "a week later, anyone on the team can find it." / 5.2 → "with who decided it, and when." | a "1 week later" tag with the caption; ⌘K opens search 1.8, "beta" types 2.2, the decision is the top result 2.8, Enter opens it 3.4; the byline lights up 6.6 and holds | read-in on the palette 0.6→1.6; pan to the byline 5.5→6.5; pull back 8.8→9.6 | `paletteOpen`, keys, the `enter` return key, `done` chime on the byline |
| 6 | `features` | 11.0 | 36.6 | 0.3 → "see who's in a note, live." / 5.0 → "share any note with a link, even outside the team." | two cards land 0.5 (staggered 80 ms); `Focus` card 1 (live cursors of two teammates) 1.1→4.6; `Focus` card 2 (share dialog, "link copied" `Toast` 7.2) 5.2→9.8; restore | none: `Focus` does the pointing | `cardIn1`/`cardIn2`: the rules give each card a whoosh and a pop; a sheet with one sound for the pair is calmer; `clickCopy` |
| 7 | `proof` | 4.3 | 47.5 | 0.3 → "12 teams have used it daily since june." | a `Counter` rolls 0 → 12 with a small "since june" | none | soft `tick`s on the digits (by hand) |
| 8 | `end` | 8.3 | 51.7 | headline `Words` 0.3 → "your team's decisions, in one place." | headline lands, lifts and shrinks at 2.0; `EndCard` from 2.4 (URL 2.4, CTA 2.8); fade to the backdrop 7.8→8.3 | none | `ctaIn`: a pop and a two-note chime; the last pad rings out |

Scene 7 exists only if the number is real and the user can point to where it comes from. Otherwise delete the scene, and add its 4.2 s to `decide` and `find`.

With `cross` at 0.1 the joins are cuts, so each one is designed in the scenes: the cold open's palette and the problem's chat window share a place on screen, the problem's pull-back ends on the plain backdrop the reveal starts from, and `find` opens in the editor `decide` ends in ([motion-language](motion-language.md) §8 and §11). The problem-first version of this film opens on "your team decides things in chat now." over fragments flying in, and shows the product's UI first at about 20 s.

Scene ids that match a demo scene (`problem`, `reveal`, `features`, `end`) pick up that scene's cue sheet in `sound/score.mjs` whenever the cut has every mark the sheet `needs`. None of them does here (the demo's `end` sheet, for one, needs a `logo` mark), so every scene is scored by its mark names ([sound-design](sound-design.md) §4). When you rebuild a scene under a demo id, rewrite its sheet to match, or give the scene a new id. That is why the cold open is `open`, not `hook`: with the demo's `title` and `fragmentsIn` marks, a `hook` would play sixteen fragment whooshes.

The cut in `cuts.json` (marks beyond the worked scene abbreviated):

```jsonc
"showcase": {
  "format": "showcase", "cross": 0.1, "sound": true,
  "scenes": [
    { "id": "open",     "seconds": 4.4,  "marks": { "result": 0.2, "done": 1.6 } },
    { "id": "problem",  "seconds": 7.0,  "marks": { "chatIn": 0.4, "later": 3.1, "push": 3.3, "typeStart": 4.2, "typeEnd": 4.42, "results": 4.6, "scroll": 4.8, "pull": 5.4, "hit": 6.2 } },
    { "id": "reveal",   "seconds": 4.7,  "marks": { "reveal": 0.2, "wordmark": 0.6, "promise": 1.1 } },
    { "id": "decide",   "seconds": 10.0, "marks": { "push": 0.7, "whooshIn": 1.25, "cursor": 1.9, "click": 2.6,
                                                    "typeStart": 2.9, "typeEnd": 3.12, "paletteOpen": 3.0, "enter": 3.9,
                                                    "typeStart2": 4.2, "typeEnd2": 5.48, "typeStart3": 6.4, "typeEnd3": 6.73,
                                                    "pull": 7.0, "whooshOut": 7.5, "done": 8.0, "unfocus": 9.4 } },
    { "id": "find",     "seconds": 11.0, "marks": { "later": 0.3, "push": 0.6, "paletteOpen": 1.8, "typeStart": 2.2, "typeEnd": 2.42, "result": 2.8, "enter": 3.4, "pan": 5.5, "done": 6.6, "pull": 8.8 } },
    { "id": "features", "seconds": 11.0, "marks": { "cardIn1": 0.5, "cardIn2": 0.58, "focus1": 1.1, "focus2": 5.2, "clickCopy": 7.1, "toast": 7.2, "restore": 9.8 } },
    { "id": "proof",    "seconds": 4.3,  "marks": { "count": 0.4 } },
    { "id": "end",      "seconds": 8.3,  "marks": { "title": 0.3, "lift": 2.0, "url": 2.4, "ctaIn": 2.8 } }
  ]
}
```

Scene seconds add up to 60.7. With seven cuts of 0.1 s, the cut runs 60.0 s.

## 10. Worked scene: "decide", in TSX and sound

The scene's one idea is that a slash turns a line into a decision, and a mention pins it for the team. The order of motion never overlaps:

1. The caption lands.
2. The camera reads in.
3. The cursor travels and clicks.
4. "/dec" types, the palette opens, and Enter makes a decision block.
5. The decision types, then the mention types.
6. The camera pulls back, the decision pins, and `Focus` dims everything else.

The product UI is kept inline here to be self-contained. In a real project it lives in `src/product/`.

```tsx
// src/scenes/Decide.tsx: register it as `decide` in src/scenes/index.ts
import { AbsoluteFill } from 'remotion';
import { EASINGS, pop, prog } from '../lib/anim';
import { Browser, BROWSER_BAR } from '../lib/devices';
import { Captions, Typed } from '../lib/text';
import { useDrawnTime, useMarks, useStage, useTime } from '../lib/time';
import { Backdrop, Badge, Camera, Cursor, Focus } from '../lib/ui';
import { C, FONT, R, SHADOW } from '../theme';

// layout, in stage px on the 1920×1080 frame; every cursor and focus target derives from these
const WIN = { x: 220, y: 190, w: 1480, h: 820 };
const PAGE = { x: WIN.x, y: WIN.y + BROWSER_BAR }; // top-left of Browser's page area, under its 46 px address bar
const PIN = { x: 40, y: 24, w: WIN.w - 80, h: 64 }; // page px
const LINE = { x: 120, y: 330 }; // page px: the empty line the cursor clicks
const stage = (p: { x: number; y: number }) => ({ x: PAGE.x + p.x, y: PAGE.y + p.y });

const CUES = [
  { at: 0.3, text: 'type a slash to turn any line into a decision.' }, // 10 words: holds ≥ 4.3 s
  { at: 6.0, text: 'mention someone. the team sees it pinned.' }, // 7 words: holds ≥ 3.3 s, into the next scene at 9.9
];

export function Decide() {
  const t = useTime();
  const m = useMarks();
  const { W, H } = useStage();
  const breathe = 1 + Math.sin(useDrawnTime() * 2.2) * 0.03; // ambient, on drawn time

  const line = stage(LINE);
  const home = { x: W / 2, y: H / 2, scale: 1 };
  const read = { x: line.x + 360, y: line.y + 60, scale: 1.3 };
  const keys = [
    { t: 0, ...home },
    { t: m.push, ...home },
    { t: m.push + 1.1, ...read }, // read-in: settles before the cursor moves
    { t: m.pull, ...read },
    { t: m.pull + 1.0, ...home }, // pull back before the pin
  ];
  const path = [
    { t: 0, x: 1560, y: 950 },
    { t: m.cursor, x: 1560, y: 950 },
    { t: m.cursor + 0.6, x: line.x + 6, y: line.y + 20 },
  ];

  const palette = t >= m.paletteOpen && t < m.enter ? pop(t, m.paletteOpen) : 0;
  const decided = t >= m.enter;
  const block = pop(t, m.enter);
  const pinned = pop(t, m.done, { bouncy: true }); // the scene's one bounce

  return (
    <AbsoluteFill>
      <Backdrop glow={0.05} />
      <Camera keys={keys}>
        <Focus active={t >= m.done && t < m.unfocus} rect={{ ...stage(PIN), w: PIN.w, h: PIN.h }}>
          <div style={{ position: 'absolute', left: WIN.x, top: WIN.y }}>
            <Browser url="lumen.example/launch-plan" width={WIN.w} height={WIN.h}>
              <div style={{ position: 'relative', height: '100%', background: C.app, fontFamily: FONT.ui, color: C.text, fontSize: 26 }}>
                {/* the pinned bar: empty until the decision lands in it */}
                <div style={{ position: 'absolute', left: PIN.x, top: PIN.y, width: PIN.w, height: PIN.h, borderRadius: R.lg, background: C.panel, display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px' }}>
                  <span style={{ color: C.faint, fontSize: 20 }}>pinned</span>
                  {pinned > 0.01 ? (
                    <span style={{ display: 'flex', gap: 12, alignItems: 'center', opacity: Math.min(1, pinned * 1.5), transform: `translateY(${(1 - pinned) * 14}px)` }}>
                      <Badge text="decision" color={C.accent} /> ship the beta on may 12 · maya
                    </span>
                  ) : null}
                  <span style={{ marginLeft: 'auto', width: 34, height: 34, borderRadius: '50%', background: C.info, transform: `scale(${breathe})` }} />
                </div>
                <div style={{ position: 'absolute', left: LINE.x, top: 150, fontSize: 44, fontWeight: 600 }}>launch plan</div>
                <div style={{ position: 'absolute', left: LINE.x, top: 230, color: C.dim }}>beta scope is frozen. docs are in review.</div>
                {/* the line: "/dec" until Enter, then a decision block */}
                <div style={{ position: 'absolute', left: LINE.x, top: LINE.y, minHeight: 48, display: 'flex', alignItems: 'center', gap: 14, paddingLeft: decided ? 18 : 0, borderLeft: decided ? `4px solid ${C.accent}` : 'none', transform: decided ? `scale(${0.96 + 0.04 * block})` : undefined, transformOrigin: 'left center' }}>
                  {decided ? (
                    <>
                      <Badge text="decision" color={C.accent} />
                      <Typed text="ship the beta on may 12" start={m.typeStart2} caret={t < m.typeStart3} />
                      <Typed text=" @maya" start={m.typeStart3} caret={t >= m.typeStart3 && t < m.pull} />
                    </>
                  ) : (
                    <Typed text="/dec" start={m.typeStart} caret={t >= m.click} />
                  )}
                </div>
                {/* the slash palette */}
                {palette > 0.01 ? (
                  <div style={{ position: 'absolute', left: LINE.x, top: LINE.y + 60, width: 380, padding: 8, borderRadius: R.lg, background: C.raised, boxShadow: SHADOW.modal, opacity: palette, transform: `translateY(${(1 - palette) * -10}px) scale(${0.97 + 0.03 * palette})`, transformOrigin: 'top left' }}>
                    {['decision', 'task', 'heading'].map((row, i) => (
                      <div key={row} style={{ padding: '10px 14px', borderRadius: R.md, background: i === 0 ? C.hover : 'transparent', color: i === 0 ? C.text : C.dim }}>{row}</div>
                    ))}
                  </div>
                ) : null}
              </div>
            </Browser>
          </div>
        </Focus>
        {/* the pointer hides while you type, as it does on a real Mac */}
        <div style={{ opacity: 1 - prog(t, m.typeStart - 0.05, 0.15, EASINGS.linear) }}>
          <Cursor path={path} clicks={[m.click]} />
        </div>
      </Camera>
      <Captions variant="calm" cues={CUES} top={104} size={60} maxWidth={1300} />
    </AbsoluteFill>
  );
}
```

Why it's built this way:

- **Every coordinate derives from a few constants.** The cursor target and the focus rect can't drift from the UI they point at. After any layout change, render `node scripts/stills.mjs showcase --at 17.7,18.5,22.4,24.8` (cut seconds: the scene starts at 15.8) and check the pointer tip sits on the line and the focus rect frames the pinned bar.
- **The camera waits for the caption.** It moves at 0.7 s, after the caption lands at 0.3. It settles at 1.8, before the cursor moves at 1.9. It pulls back at 7.0, after the mention finishes typing at 6.73, and the pin lands at 8.0, after the pull-back ends.
- **`Focus` comes after the pull-back.** At 1.0× the whole app is visible, and dimming shows where the pinned bar sits in it.
- **Only one thing uses a clock that isn't the story's.** That is the avatar's breathing, on `useDrawnTime()`, so a warped reel version of this scene stays smooth.

`decide` is a new scene with no cue sheet, so its sound comes from the mark names. The naming rules are `RULES` in `sound/score.mjs` (and the table in [sound-design](sound-design.md) §4):

- `click` gets a click.
- `paletteOpen` gets a small whoosh and a light pop.
- `enter` gets the bigger return key.
- Each `typeStart…typeEnd` pair (then `typeStart2…typeEnd2` and so on) gets one laptop key per character, spread between the two marks with `Typed`'s own timing. List the typed text in `TYPED` at the top of `score.mjs` (`'showcase/decide/typeStart2': 'ship the beta on may 12'`) and each key lands on the moment its character appears, with the space bar on spaces.
- `whooshIn` and `whooshOut` get a whoosh, loudest on the mark, rising or falling.
- `done` gets a soft success chime.
- Every scene gets a quiet pad chord.

That is why the marks in section 9 are named the way they are:

- **`typeEnd` times.** The score spreads the keys from `typeStart` to `typeEnd`, and `Typed` shows `cps` characters a second from `typeStart`. They agree when cps = characters ÷ (typeEnd − typeStart). These scenes keep `Typed`'s default of 18, so each `typeEnd` is `typeStart + characters ÷ 18` ("/dec" is 4 characters, so 0.22 s). To type at another rate, pass that `cps` to `Typed` and move `typeEnd` to match.
- **Whoosh marks.** They sit where each camera move is fastest, not where it starts. `Camera` eases every move with `EASINGS.inOut`, which is fastest in the middle, so `whooshIn` sits halfway through the 1.1 s read-in (0.55 s after `push`) and `whooshOut` halfway through the 1.0 s pull-back.

Once the scene's picture settles, give it a sheet of its own (`SHEETS.decide`), so each sound sits on the frame its move happens rather than only on its mark. Add by hand only what the conventions don't know, in the scene's sheet or in the `showcase` case of `score()` after `byMarks(k, CALM)`. In this film, that is the proof counter's ticks (`count` matches no rule):

```js
// sound/score.mjs (tick and place are already imported there), in the showcase's case of score().
// `at(scene, secondsOrMark)` is already bound to the cut; engine voices come out at house level, so gain 1 is balanced.
const inOut = (x) => x * x * (3 - 2 * x);                   // a stand-in for EASINGS.inOut, which the Counter rolls on
const count = k.scenes.find((s) => s.id === 'proof').marks.count, dur = 1.2;   // the Counter's start and dur
let shown = 0;
for (let s = 0; s <= dur + 1e-9; s += 1 / 60) {             // step the Counter's clock frame by frame
  const n = Math.floor(12 * inOut(Math.min(1, s / dur)));
  if (n > shown) { shown = n; place(mix, tick({ seed: 80 + n }), at('proof', count + s), { gain: 0.8, pan: 0.2 }); }
}
```

Render one stretch and measure it before touching levels: `node sound/design.mjs showcase --cues` (which also prints every cue it placed, by time), then `node sound/tools/loudness.mjs public/sound-showcase.wav --from 15.8 --to 25.8`. Report the result to the user in dB and plain words ("the keys are 3 dB under the click").

## 11. YouTube: chapters, thumbnail, upload

### Chapters

YouTube builds chapters from timestamps in the description. The first timestamp must be `00:00`, there must be at least three in ascending order, and each chapter must be at least 10 s long. That makes chapters useful from about 90 s up. In a 60 s film, the close is shorter than 10 s, so it has to merge with the section before it.

Name chapters as the viewer's questions, in plain words: "why it exists", "how it works", "sharing", "get it". Generate them from the cut, so they follow every re-timing:

```bash
node --input-type=module -e "
import { sceneStart, cutDuration } from './sound/timeline.mjs';
const cut = 'showcase';
const CH = [['open', 'what it does'], ['decide', 'how it works'], ['features', 'what else it does'], ['end', 'get it']];
const t = CH.map(([s], i) => (i === 0 ? 0 : Math.floor(sceneStart(cut, s))));
const mmss = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
CH.forEach(([, name], i) => {
  const len = (t[i + 1] ?? cutDuration(cut)) - t[i];
  console.log(mmss(t[i]) + ' ' + name + (len < 10 ? '    <- only ' + len.toFixed(1) + ' s: merge it' : ''));
});
"
```

### Thumbnail

YouTube's help page now asks for 3840×2160 custom thumbnails (16:9, at least 640 px wide), as JPG or PNG. The file limit is 2 MB when uploading from mobile and 50 MB on desktop. The template's `thumbnail` still is 1280×720, so render it at 3×:

```bash
npx remotion still src/index.ts thumbnail out/thumbnail.jpg --scale 3 --image-format jpeg --jpeg-quality 88
npx remotion ffmpeg -y -i out/thumbnail.jpg -vf scale=320:-1 out/thumbnail-320.png   # the size people actually see
```

Then read both images. What makes a showcase thumbnail work (working rules, not measured facts):

- **One product moment, big.** Show the "after" state (the pinned decision, the finished result), cropped tight, from the real UI components so it matches the film.
- **2–4 words of text, never the video title repeated.** Text should still read at 320 px wide; at 1280 that means letters at least ~90 px tall.
- **High contrast against the theme background**, and nothing important in the bottom-right corner, where YouTube draws the duration.
- **Honest.** It shows something that happens in the film. No fake UI states and no invented numbers.

YouTube's "Test & compare" can run up to three thumbnails against each other and picks a winner by watch-time share. It is desktop only, in YouTube Studio. Make three variants by adding two more `<Still>`s to `src/Root.tsx` that reuse the thumbnail's component with a different moment or headline.

### Upload file

`npm run render:showcase` gives an H.264 MP4 at CRF 16 with 320 kbps audio, above what YouTube recommends for 1080p60 SDR (H.264, 12 Mbps, AAC 384 kbps stereo at 48 kHz). Upload that. Use `node scripts/encode.mjs youtube out/showcase.mp4` only if the file is awkwardly large. Always run `node scripts/check.mjs out/showcase.mp4` first for duration, fps, size, loudness and true peak. With a voiceover or a second language, upload a subtitle file too: `node scripts/captions.mjs showcase` writes `out/showcase.srt` from the film's own lines ([captions-and-type](captions-and-type.md) §15).

## 12. Landing page: poster, muted loop, the full film

A landing page needs two videos, not one:

1. **A hero loop** that plays by itself: muted, looping, 4–10 s for one interaction (up to about 15 s when it shows a longer flow), no captions, no logo, no end card. The page's headline is already doing the talking, and a visitor can arrive at any frame of a loop, so there is no start for a caption to count from. Show the product doing its one thing.
2. **The full film**, click to play, with sound and a poster frame.

Browsers enforce the first rule for you. Chrome always allows muted autoplay, and modern browsers block autoplay with sound. Safari on iOS autoplays video that is `muted` or has no audio track, plays it inline only with `playsinline`, starts it only when it is visible, and pauses it if it gains sound.

### The loop cut

Add it as another cut, reusing the how-it-works scene. Use `loop` format (1600×1000) for a 16:10 slot, or `showcase` for a 16:9 one. Scenes lay themselves out from `useStage()`:

```jsonc
"hero": {
  "format": "loop", "cross": 0, "sound": false,
  "scenes": [ { "id": "decide", "seconds": 10.0,
                "marks": { "push": 0.7, "cursor": 1.9, "click": 2.6, "typeStart": 2.9, "paletteOpen": 3.0, "enter": 3.9,
                           "typeStart2": 4.2, "typeStart3": 6.4, "pull": 7.0, "done": 8.0, "unfocus": 9.4 } } ]
}
```

In the scene, drop captions when `useCut() === 'hero'`. The loop should end on its first frame: bring the app back to its opening state, the way the template's `loop` cut does. When that is impossible, dip to the backdrop for 0.3 s at the seam. A clean dip reads as intentional, and a jump reads as a glitch.

```bash
npx remotion render src/index.ts hero out/hero.mp4 --codec h264 --crf 16 --muted                   # the master, with no audio track at all
# the web copy: limited-range BT.709 (delivery-and-platforms §14), CRF 22, index first so it starts before the download ends
npx remotion ffmpeg -y -i out/hero.mp4 -vf "zscale=matrix=709:range=limited,format=yuv420p" -c:v libx264 -profile:v high -preset slow -crf 22 -x264-params colorprim=bt709:transfer=bt709:colormatrix=bt709 -color_range tv -an -movflags +faststart out/hero-web.mp4
node scripts/encode.mjs webm out/hero.mp4 --out out/hero-web.webm                                  # a smaller copy for browsers that take it
npx remotion still src/index.ts hero out/hero-poster.jpg --frame 0 --image-format jpeg --jpeg-quality 85
node scripts/check.mjs out/hero-web.mp4                                                            # size: aim for ~2–3 MB (a working budget)
```

The loop's poster is its first frame, so nothing jumps when playback starts. The full film's poster should be a designed frame instead: the reveal with the name and promise landed, or the best how-it-works moment, rather than whatever frame 0 happens to be. Pick the time from the scene table and convert it at the boundary: frame = seconds × 60.

The film behind the play button gets a web copy too. The raw render is full-range `yuvj420p` and large (CRF 16), and every destination except YouTube should get an encoded copy ([delivery-and-platforms](delivery-and-platforms.md) §18). The same color fix at CRF 20, with the sound copied as it is:

```bash
npx remotion ffmpeg -y -i out/showcase.mp4 -vf "zscale=matrix=709:range=limited,format=yuv420p" -c:v libx264 -profile:v high -preset slow -crf 20 -x264-params colorprim=bt709:transfer=bt709:colormatrix=bt709 -color_range tv -c:a copy -movflags +faststart out/showcase-web.mp4
npx remotion still src/index.ts showcase out/showcase-poster.jpg --frame 918 --image-format jpeg --jpeg-quality 85   # 15.3 s: the promise has landed
```

### The embed

```html
<!-- hero: silent, loops, starts on its own; a pause button, because it runs longer than 5 s -->
<figure class="hero-video">
  <video id="hero" autoplay muted loop playsinline preload="auto"
         poster="/media/hero-poster.jpg" width="1600" height="1000"
         aria-label="Lumen: a slash turns a line into a decision, pinned for the team">
    <source src="/media/hero-web.webm" type="video/webm">
    <source src="/media/hero-web.mp4" type="video/mp4">
  </video>
  <button type="button" id="hero-toggle" aria-pressed="false">pause</button>
</figure>

<!-- the film: nothing downloads until someone presses play -->
<video controls playsinline preload="none" poster="/media/showcase-poster.jpg" width="1920" height="1080">
  <source src="/media/showcase-web.mp4" type="video/mp4">
  <track kind="captions" src="/media/showcase-vo.vtt" srclang="en" label="English">   <!-- only for a voiceover cut -->
</video>
<!-- a caption-only film: the captions as text, for screen readers and search (out/showcase.txt from node scripts/captions.mjs showcase) -->
<details><summary>read the captions</summary>
  <p>every decision your team makes, one search away. decisions get made in chat, and a week later, nobody can find them. …</p>
</details>

<style>video { width: 100%; height: auto; display: block; }</style>
<script>
  const v = document.getElementById('hero'), b = document.getElementById('hero-toggle');
  const set = () => { b.textContent = v.paused ? 'play' : 'pause'; b.setAttribute('aria-pressed', String(v.paused)); };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) v.pause();   // they asked for less motion
  b.addEventListener('click', () => { v.paused ? v.play() : v.pause(); set(); });
  v.addEventListener('play', set); v.addEventListener('pause', set); set();
</script>
```

Why each piece is there:

- **`muted` and `playsinline`.** They are what make autoplay work, on desktop and iOS alike.
- **`width` and `height`.** They reserve the box, so the page doesn't jump when the video loads.
- **`preload="none"` on the film.** Visitors who never press play don't pay for it. The HTML spec advises `metadata` as the default hint, and `autoplay` overrides `preload` anyway on the hero.
- **The pause button.** WCAG 2.2.2 (Pause, Stop, Hide, level A) requires one for moving content that starts automatically, lasts more than 5 s and sits beside other content.
- **The `prefers-reduced-motion` check.** It respects people who asked their device for less motion.
- **WebM before MP4.** Browsers take the first source they can play.
- **The transcript.** Burned-in captions are pixels, so a screen reader gets nothing from a caption-only film. The captions as text under the player fix that: `node scripts/captions.mjs showcase` writes them to `out/showcase.txt` (and a `.vtt` for a `<track>`) from the same `src/captions.json` the picture draws ([captions-and-type](captions-and-type.md) §15–16).
- **Faststart.** Moving the MP4 index to the front (`+faststart`) lets playback begin before the file finishes downloading. YouTube recommends the same for uploads.

If the film is hosted on YouTube instead, embed it behind its poster, and load the iframe only on click, from `youtube-nocookie.com`. The page stays fast, and visitors who never play it load nothing from YouTube.

## 13. Checklist before you call it done

Story and pacing:

- [ ] The captions alone, read as a list, tell the whole story: the payoff (or the world now), problem, name and promise, how, features, where to get it.
- [ ] The product is on screen within the first 4–5 s, unless the film deliberately opens on the problem.
- [ ] Every caption holds at least (words ÷ 3) + 1 s, across scene boundaries too.
- [ ] No jargon a first-time viewer would stumble on; each term is replaced by its consequence.
- [ ] How it works is shown in the real UI, is about a third of the runtime, and starts before the midpoint.
- [ ] Proof is real and dated, or absent. Credits are only for organisations that agreed, in their words.

Picture:

- [ ] Stills at every mark (`node scripts/stills.mjs showcase --marks`) and a contact sheet with gaps (`node scripts/sheet.mjs showcase`) read cleanly: no clipped text, nothing pushed off-frame by a `Camera` key, captions clear of the product window, safe zones respected (`--safe`).
- [ ] One primary move at a time. Every camera move settles before the action starts. At most one bounce per scene.
- [ ] UI text you expect people to read is at least ~24 px on screen, or has a read-in.

Sound:

- [ ] Every click, key and pop sits on the mark of its event. Whooshes sit under clicks and keys.
- [ ] `node scripts/check.mjs out/showcase.mp4`: about −17 LUFS integrated (−16 to −18), true peak ≤ −1 dBTP. With a voiceover, the voice is clear over everything and the bed ducks.

Deliverables:

- [ ] `out/showcase.mp4` (and `out/showcase-vo.mp4` plus its subtitle file if there is a voiceover).
- [ ] Chapters text, if the film is 90 s or more.
- [ ] Thumbnail at 3840×2160 (under 2 MB if the user uploads from a phone), checked at 320 px wide.
- [ ] Hero loop (`hero-web.mp4`, `.webm`), its poster, the film's web copy (`showcase-web.mp4`) and poster, the embed snippet, and the transcript for a caption-only film.
- [ ] The README scene table matches `cuts.json`.

## Sources

Checked September 2026.

- Wistia, "How to Choose the Right Marketing Video Length for Any Goal" (engagement by length from the 2026 State of Video data, 13M+ videos: 52% under a minute; for 1–5 minute videos, "most viewers usually drop off around the halfway point"): https://wistia.com/learn/marketing/optimal-video-length
- BBC Subtitle Guidelines (160–180 wpm, about 0.33–0.375 s per word): https://www.bbc.co.uk/accessibility/forproducts/guides/subtitles/. The BBC page could not be fetched directly; figures as quoted by Clevercast, "BBC Subtitling Guidelines": https://www.clevercast.com/bbc-subtitling-guidelines/
- Netflix, "English (USA) Timed Text Style Guide" (adult reading speed up to 20 characters per second, 42 characters per line): https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide
- VirtualSpeech, "Average Speaking Rate and Words per Minute" (about 150 wpm US conversational average per the National Center for Voice and Speech; audiobooks and podcasts 150–160 wpm): https://virtualspeech.com/blog/average-speaking-rate-words-per-minute
- Mayer, R. E. & Johnson, C. I. (2008), "Revising the Redundancy Principle in Multimedia Learning", Journal of Educational Psychology 100(2), 380–386 (2–3 printed words from the narration next to the diagram improved retention): https://eric.ed.gov/?id=EJ796353
- E-Learning Essentials, "Redundancy Principle" (graphics plus narration versus graphics plus narration plus identical text): https://pressbooks.pub/elearning2020/chapter/redundancy-principle/
- LinkedIn Help, "Disabling Autoplay of Videos" ("Some videos on LinkedIn may play automatically without sound as you scroll through your feed"): https://www.linkedin.com/help/linkedin/answer/a565326
- YouTube Help, "Video chapters" (first timestamp 00:00, at least three, each chapter at least 10 s): https://support.google.com/youtube/answer/9884579
- YouTube Help, "Add video thumbnails" (3840×2160 for videos, minimum width 640 px, JPG or PNG, 2 MB on mobile / 50 MB on desktop, 16:9): https://support.google.com/youtube/answer/72431
- YouTube Help, "Test & compare thumbnails and titles" (up to 3 variants, winner by watch-time share, desktop only): https://support.google.com/youtube/answer/13861714
- YouTube Help, "YouTube recommended upload encoding settings" (MP4 with moov atom at the front, H.264, 1080p at 48–60 fps SDR 12 Mbps, AAC-LC 384 kbps stereo at 48 kHz): https://support.google.com/youtube/answer/1722171
- Chrome for Developers, "Autoplay policy in Chrome" ("Muted autoplay is always allowed"): https://developer.chrome.com/blog/autoplay
- WebKit, "New `<video>` Policies for iOS" (muted or audio-less video may autoplay; `playsinline`; plays only when visible; pauses if it becomes unmuted): https://webkit.org/blog/6784/new-video-policies-for-ios/
- MDN, `<video>`: the Video Embed element (`poster`, `preload` values and the `metadata` default hint, `playsinline`, autoplay and muted): https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video
- MDN, `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- W3C, "Understanding Success Criterion 2.2.2: Pause, Stop, Hide" (WCAG 2.2, level A): https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- Remotion docs, `npx remotion still` (`--scale`, `--frame`, `--image-format`, `--jpeg-quality`): https://www.remotion.dev/docs/cli/still
