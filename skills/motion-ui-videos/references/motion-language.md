# Motion language

This is the motion vocabulary for every video the skill makes: which curve, how long, how springy, what moves when, how the camera behaves, how scenes join, how a cursor travels, and how all of it shifts between a calm 16:9 showcase and a punchy 9:16 reel. The numbers come from sampling the template's own curves (`EASINGS` and `pop()` in `src/lib/anim.ts`) and from shipping a real launch film and its reel. Read it before you time a scene, and again when a contact sheet looks busy or a reel feels slow. Everything here uses the template API: scene time in seconds from `useTime()`, beats as marks in `src/cuts.json`, helpers from `src/lib/anim.ts`, components from `src/lib/ui.tsx` and `src/lib/text.tsx`.

## Contents

1. [The short version](#1-the-short-version)
2. [Easing](#2-easing)
3. [Durations](#3-durations)
4. [Springs: pop()](#4-springs-pop)
5. [Stagger](#5-stagger)
6. [One thing moves at a time](#6-one-thing-moves-at-a-time)
7. [Anticipation, follow-through and settle](#7-anticipation-follow-through-and-settle)
8. [Continuity across cuts](#8-continuity-across-cuts)
9. [Camera](#9-camera)
10. [Focus](#10-focus)
11. [Transitions](#11-transitions)
12. [Cursor paths](#12-cursor-paths)
13. [Ambient motion and loops](#13-ambient-motion-and-loops)
14. [Frame rate, judder and motion blur](#14-frame-rate-judder-and-motion-blur)
15. [Where sound lands on a move](#15-where-sound-lands-on-a-move)
16. [The energy dial](#16-the-energy-dial)
17. [Anti-patterns](#17-anti-patterns)
18. [Checking motion you cannot watch](#18-checking-motion-you-cannot-watch)

## 1. The short version

1. **Arrivals use `EASE`**, cubic-bezier(0.22, 1, 0.36, 1). It covers 90% of the distance in the first 37% of the time, so a 0.6 s move looks "there" at about 0.22 s and spends the rest settling. That long settle is what makes UI motion feel expensive.
2. **One primary move at a time.** The next may start when the current one is in its settle (about 40% into an `EASE` move), not before.
3. **Durations:** micro UI 0.15–0.25 s, cards and panels 0.4–0.7 s, camera 0.9–1.6 s. Reels run at 0.7–0.8× of that, and nothing that must be seen lasts under 5 frames.
4. **`pop()` is critically damped by default.** At most one visible overshoot (`bouncy: true`) per scene, on the hero arrival.
5. **Stagger siblings 40–90 ms apart** and cap the whole stagger at about 0.5 s.
6. **Camera:** lean in 1.0 → 1.08–1.2 over 0.8–1.6 s (longer for a longer move), hold while the caption reads, pull back to 1.0 before the next beat. `Camera` eases every segment with a symmetric `inOut` unless a key says otherwise; a push that commits fast and settles long (`ease: EASINGS.commit` on the key it arrives at) feels hand-keyed (§9). Captions live outside the `Camera`.
7. **Joins:** cut on action by default (`cross` 0–0.1). Inside a scene, a layout morph beats any transition (§8). A dissolve is for time passing, not for every beat (§11).
8. **Picture first, then words.** Let a move finish before the next caption arrives.
9. **Linear only for motion with no visible start or end:** drifts, tickers, timers.
10. **Ambient loops run on `useDrawnTime()`**, never on the warped `useTime()`.
11. **Check with stills** at marks and at the peak of every move. You cannot watch the video.

## 2. Easing

`EASE` and `EASINGS` live in `src/lib/anim.ts`. Each maps 0→1 to 0→1 and is passed as the last argument of `prog(t, start, dur, ease)`, which uses `EASE` when you leave it out. The shapes below were measured by sampling each curve.

| curve | what it does (measured) | use it for |
|---|---|---|
| `EASE` = `EASINGS.out`, cubic-bezier(0.22, 1, 0.36, 1), easeOutQuint | 50% of the way at 13% of the time, 90% at 37%, 99% at 65%. Top speed is 4.5× the average, on the first frame | everything that arrives or lands: panels, cards, caption lines, dialogs, state changes. The house curve |
| `EASINGS.snappy`, cubic-bezier(0.2, 0.9, 0.1, 1) | 90% at 31% of the time; top speed about 5× the average, just after the start | crisp UI responses (a toggle, a check, a selection), reel arrivals, hook text. Too abrupt for the camera |
| `EASINGS.inOut`, cubic-bezier(0.65, 0, 0.35, 1) | symmetric; top speed 2.9× the average, at the middle | camera moves, pans, and anything that goes from one resting place to another while already on screen (a panel that repositions, a slider thumb, loop segments) |
| `EASINGS.in`, cubic-bezier(0.55, 0, 1, 0.45), easeInCirc | half the distance only at 87% of the time, then a very steep finish | exits, and moves that run into a cut (whips, zoom-throughs), where the steep finish is the point. Never entrances |
| `EASINGS.linear` | constant speed | only motion whose start and end are never seen: a drift across a whole shot, a progress bar tied to a timer, a ticker, a clock hand, a countdown fuse |

Why ease-out for arrivals: the eye notices the start of motion, and a fast start says "something happened". The long settle then lets the eye land with the object. An ease-in entrance does the opposite: it creeps in and hits hard at the end, which reads as a collision. Nielsen Norman Group's guidance for interface animation also names ease-out as the curve you want most often.

Why linear looks wrong everywhere else: nothing physical starts at full speed and stops dead. A linear move has a visible jerk at both ends, and viewers read it as "animated by a machine".

**Opacity finishes early, transform settles long.** If both end together, the element seems to fade in place while sliding, which looks muddy. Let opacity reach 1 at 40–60% of the move:

```tsx
import { EASE, lerp, prog } from '../lib/anim';
import { useMarks, useTime } from '../lib/time';

const t = useTime();
const m = useMarks();                              // { panel: 1.4 }
const p = prog(t, m.panel, 0.6, EASE);
const style = {
  opacity: Math.min(1, p * 1.6),                   // fully visible early
  transform: `translateY(${(1 - p) * 32}px) scale(${lerp(0.96, 1, p)})`,
};
```

This matters more at 30 fps. Because `EASE` is fastest on its first frame, a 0.6 s move at 30 fps (18 frames) is already about a quarter of the way on frame one. With opacity ramping up at the same time, that jump reads as an arrival. Without it, it reads as a glitch.

**Exits** are shorter than entrances (0.6–0.75× the entrance), travel less (8–16 px), and use `EASINGS.in` or a plain fade. Nobody needs to follow something that is leaving.

## 3. Durations

The duration you pass to `prog()` is the nominal one. With `EASE`, the move looks finished at about 40% of it, so a 0.6 s `EASE` move feels like 0.25 s of motion plus a settle.

Video is not an app. In an app, the user is waiting, so interface guidance keeps most animations at 100–500 ms (NN/g). In a video, the viewer has nothing to do but watch and must actually see the change, so the small end runs a bit longer and camera moves run much longer.

| what moves | showcase (16:9, 60 fps) | reel (9:16, 30 fps) | curve |
|---|---|---|---|
| press, hover, toggle, checkbox | 0.15–0.25 s | 0.17–0.2 s | `snappy` or `EASE` |
| tooltip, badge, toast, dropdown | 0.25–0.4 s | 0.2–0.3 s | `EASE` or `pop()` |
| card, panel, dialog, sheet | 0.4–0.7 s | 0.3–0.5 s | `EASE` or `pop()` |
| screen change inside the app | 0.5–0.8 s | 0.35–0.55 s | `inOut` if it moves across, `EASE` if it arrives |
| device or window arriving on stage | 0.8–1.2 s | 0.5–0.8 s | `pop()` or `EASE` |
| camera push-in, pan, pull-back | 0.9–1.6 s | 0.6–1.0 s | `inOut`, or `commit` for a push that should feel hand-keyed |
| title words (`Words` `step`) | 0.06–0.08 s per word | 0.05–0.06 s per word | `EASE` |
| scene join (`cross` in `cuts.json`) | 0 or 0.1 s: a cut, with 0.1 hiding a one-frame pop; 0.4–0.6 s only when the cut's joins are time jumps. Keep it on a 0.1 s grid ([pitfalls](pitfalls.md) §15) | 0–0.1 s | linear fade |
| exit | 0.6–0.75× the entrance | same | `in`, or a fade |

A dialog that takes 0.8 s to open makes the product look slow. Keep UI state changes at product speed and save the slow, cinematic timing for the camera, the device's entrance and the captions.

**Distance.** Longer travel needs more time, but not in proportion: a big move at a fixed duration looks violent, and at a proportional one it looks sluggish. This curve matches the table for panel-sized moves:

```ts
import { clamp } from '../lib/anim';
// seconds for a move of `px` frame pixels (×0.75 for reels)
const moveDur = (px: number) => clamp(0.3 + 0.01 * Math.sqrt(px), 0.3, 0.9);
// 100 px → 0.40 s · 400 px → 0.50 s · 1000 px → 0.62 s · 1920 px → 0.74 s
```

**Size.** Elements larger than half the frame get about 20% more time. Mass reads as weight, and a full-screen panel snapping like a checkbox looks weightless.

**The 5-frame floor.** Anything the viewer must see takes at least 5 frames: 0.17 s at 30 fps, 0.083 s at 60 fps. A 0.15 s move at 30 fps is 4.5 frames and reads as a jump. Because time in this template is in seconds, the same scene at 60 and 30 fps has the same timing, but short moves lose their in-between frames at 30. Time micro-interactions for the slower cut.

**Holds.** After a move lands, give the result time to be seen. A caption holds at least (words ÷ 3) + 1 seconds (see [captions-and-type](captions-and-type.md)). A state change with no words holds 0.6–1.0 s in a showcase and 0.4–0.6 s in a reel before the next move.

## 4. Springs: pop()

`pop(t, start, { bouncy })` returns a spring from 0 to 1. It is a closed-form spring rather than a frame-by-frame simulation, so it is exact at any time, including the fractional times a warped clock produces. Measured:

| call | spring | 50% | 90% | overshoot | within 1% of rest |
|---|---|---|---|---|---|
| `pop(t, s)` | critically damped, ω = 13 rad/s | 0.13 s | 0.30 s | none | 0.51 s |
| `pop(t, s, { bouncy: true })` | ω = 16 rad/s, damping ratio 0.65 | 0.09 s | 0.16 s | one: first reaches 1 at 0.19 s, peaks +6.8% at 0.26 s; the dip after it is 0.5%, invisible | 0.40 s |
| Remotion's `spring()` with its default config (avoid) | damping 10, stiffness 100, mass 1 (damping ratio 0.5) | 0.13 s | 0.21 s | +16%, then a visible dip to 0.97: two bounces | 0.93 s |

The last row is here because Remotion's own `spring()` bounces twice unless you raise its damping. If you call it directly, pass `config: { damping: 200 }` for a no-bounce spring.

**`pop` or `prog`?** Use `pop()` for things with weight that arrive: cards, badges, avatars, a check, a dialog. Use `prog()` for things that travel on a schedule between known places (the camera, a panel sliding by an exact distance) and for anything that must end at an exact time, since a spring's end is fuzzy. Never use a spring inside a loop: it never lands exactly on 1, so the seam shows.

**Bouncy rules.**
- At most one bouncy arrival per scene, on the hero. Small confirmations (a check, a count badge) may also bounce, if nothing else in the scene does.
- Bounce scale and small translations only. Not opacity (it clamps at 1, so the overshoot becomes a stall). Not the camera. Not text being read. Not large panels: +6.8% of a 140 px rise is a 10 px wobble, but of a 1200 px slide it is 82 px.
- Keep the scale range small. 0.85 → 1 with `bouncy` peaks at 1.01, which is felt more than seen. That is the right amount.

```tsx
import { lerp, pop } from '../lib/anim';
import { useMarks, useTime } from '../lib/time';
import { Badge } from '../lib/ui';
import { C } from '../theme';

const t = useTime();
const m = useMarks();                              // { card: 0.8, done: 3.2 }
const card = pop(t, m.card);                       // settles, no overshoot
const check = pop(t, m.done, { bouncy: true });    // the one bounce in this scene
<div style={{ opacity: Math.min(1, card * 1.6), transform: `translateY(${(1 - card) * 40}px)` }}>
  {/* … */}
  <div style={{ transform: `scale(${lerp(0.6, 1, check)})`, opacity: Math.min(1, check * 2) }}>
    <Badge text="Shared" color={C.ok} />
  </div>
</div>
```

For a faster calm spring (reels, or small UI that should snap into place), use the same closed form as `pop()` with a higher ω. It reaches 90% at 3.9 / ω seconds, and stays exact on a warped clock:

```ts
// critically damped, 0 → 1 from `start`; pop() uses ω = 13 (90% at 0.30 s), ω = 18 gives 90% at 0.22 s
const settle = (t: number, start: number, w = 18) => {
  const x = Math.max(0, t - start);
  return 1 - Math.exp(-w * x) * (1 + w * x);
};
```

## 5. Stagger

`stagger(i, each, start)` returns `start + i * each`.

- **Spacing:** 40–50 ms for many small things (avatars, grid cells, more than 6 rows), 60–70 ms for list rows and cards, 80–90 ms for 2–4 large tiles.
- **Cap the total.** The last item should start within about 0.5 s of the first in a showcase, 0.35 s in a reel. A list that takes 2 s to finish arriving has lost the viewer by its last row. For n items: `each = Math.min(0.09, 0.5 / (n - 1))`.
- **Order** follows reading (top to bottom, left to right) or radiates from the cause (the button clicked, where the cursor is). Random order only for texture, such as a swarm, and then from seeded `rand()`.
- **Stagger siblings of one kind only.** Different kinds of things are separate beats.
- **Past about 8 items**, or items that start offscreen, stagger groups instead of items.

```tsx
const each = Math.min(0.09, 0.5 / Math.max(1, rows.length - 1));
{rows.map((row, i) => {
  const p = pop(t, stagger(i, each, m.list));
  return (
    <div key={row.id} style={{ opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 18}px)` }}>
      {row.title}
    </div>
  );
})}
```

`Words` already staggers per word (`step` 0.07 s by default). Don't stagger single letters in product UI. Save letter-level motion for a reel's hook title, and even there `KineticTitle` usually does more with less.

## 6. One thing moves at a time

The eye can follow one moving thing. Two simultaneous moves split attention, the viewer takes in neither, and the frame reads as busy. The calm of the launch film came from this rule more than from any curve.

Sort every motion in a scene into three layers:

| layer | what | how much | when |
|---|---|---|---|
| primary | the thing the caption is about | the full move | one at a time |
| secondary | what responds to it: its shadow, a count, a highlight, its contents | at most ⅓ of the primary's travel | 0.05–0.15 s behind, overlapping the primary's settle |
| ambient | idle life: breathing, a live dot, a caret | at most 2% scale or 6 px | always, on drawn time (section 13) |

**Overlap in the settle, not before.** Start the next primary move when the current one has covered about 90% of its distance: about 40% into an `EASE` move, about 0.3 s into a calm `pop()`, about 0.2 s into a bouncy one. Waiting for the nominal end makes a sequence drag. Starting earlier makes moves collide.

```ts
const panelIn = m.open;                   // prog(t, panelIn, 0.6)
const listIn = panelIn + 0.6 * 0.4;       // the panel is at 90%: the list may start
const pushIn = listIn + 0.5;              // the camera waits until the list has landed
```

**The camera is a primary move.** Don't push in while a panel flies in. Land the panel, then push, or push first and bring the panel in once the camera is still.

**Picture first, then words.** A caption that arrives while the camera is still moving makes the viewer choose between reading and looking. Start the next caption 0.2–0.4 s after the move reaches 90%. Captions that set up a move ("watch the sidebar.") come first, and the move follows 0.4–0.6 s after, once the sentence is read.

**Text is still while it is read.** Drift of up to 1.03 scale is fine. Anything more and the viewer chases the words.

## 7. Anticipation, follow-through and settle

These come from Disney's principles of animation, scaled down for UI. In product video they should be small. If the viewer notices them as effects, they are too big.

- **Press, then act.** A button scales to 0.96–0.97 for 0.08–0.1 s on the click and springs back on release. `Cursor` draws the pointer's own press. The thing the click opens starts on the release, 0.08–0.15 s after the click mark: on the same frame it looks as if the UI knew in advance, and more than 0.3 s later it looks like lag.
- **Grow from the source.** A menu or popover scales from 0.96, never from 0, with `transformOrigin` at the trigger. Scaling from 0 looks cartoonish, and text flashes through unreadable sizes on the way.
- **Wind-up, reels only.** Before a card flies off, it dips to 0.97 or moves 6–10 px the other way for 0.1 s. Skip it in a showcase, where it reads as fussy.
- **Follow-through.** Children lag their parent by 0.03–0.06 s: the panel lands, then its contents settle the last 4–8 px. This is a second `pop()` started a little later.
- **Settle with one detail.** 0.1–0.2 s after a state change, one small thing resolves it: a check pops, a count rolls (`Counter`), a highlight sweeps (`Highlight`). That is the viewer's "done" signal, and usually where the sound goes.

```tsx
const m = useMarks();                                      // { click: 2.1 }
const press = prog(t, m.click, 0.09) * (1 - prog(t, m.click + 0.09, 0.12));
const open = pop(t, m.click + 0.1);                         // on the release
const inner = pop(t, m.click + 0.15);                       // the contents follow
<button style={{ transform: `scale(${1 - 0.035 * press})` }}>Share</button>
<div style={{ transformOrigin: '88% 0%', opacity: Math.min(1, open * 1.8), transform: `scale(${lerp(0.96, 1, open)})` }}>
  <div style={{ transform: `translateY(${(1 - inner) * 8}px)` }}>{/* dialog contents */}</div>
</div>
```

For emphasis without adding motion, reach for `Highlight`, a color change or `Focus` before a scale bump. They point at a thing without making it jump.

## 8. Continuity across cuts

`Video.tsx` joins scenes with Remotion's `fade()`. By default it fades the incoming scene in on top of the outgoing one, which stays fully opaque underneath. Two consequences:

1. Anything drawn identically in both scenes during the overlap stays pixel-stable. That is how shared elements work.
2. During the `cross` seconds, the incoming scene's clock runs 0 → `cross` while the outgoing scene's runs from `seconds - cross` to `seconds`.

**Shared elements.** Render the same component with the same props at the same place in the last `cross` seconds of scene A and the first `cross` seconds of scene B. Scene A brings it to rest at the hand-off spot by `seconds - cross`. Scene B starts it there and keeps it still until at least `t = cross`, then moves it. The world dissolves around it and the element seems to persist: the logo from the reveal becomes the app's header logo, a note card from the list stays put as the editor fades in around it. Keep hand-off rects in `src/product/layout.ts` (see [ui-recreation](ui-recreation.md)) so both scenes read the same numbers.

**Match cuts.** The element doesn't need to be identical, only its shape, place and size: a round avatar becomes a round presence dot; a card becomes a window of the same proportions. Keep the center within about 40 px and the size within about 10% across the cut.

**Screen direction.** Decide which way "forward" goes and keep it. If steps, time or progress move left to right, every "next" enters from the right and leaves to the left, and the cursor travels the same way. Reversing mid-sequence reads as going back.

**Carry speed through a cut.** A move that slows to a stop right at the cut makes the cut feel like a stumble. For a whip or a zoom-through, accelerate into the cut and decelerate out of it:

- The outgoing move uses `EASINGS.in`, or its final `Camera` key sits after the scene's end, so the cut lands mid-move.
- The incoming scene is already moving the same way at a similar speed, then settles with `EASE`. A first `Camera` key at a negative time does this: the scene begins partway through the move.

**Zoom-through.** The camera flies into an element until its surface fills the frame. The next scene begins "inside" it. Once per film, into the product, is plenty.

```tsx
// scene A, 6 s long, cross 0.4. The note card is 360×220 frame px, centered on (1180, 560).
<Camera keys={[
  { t: 0,   x: 960,  y: 540, scale: 1 },
  { t: 4.8, x: 960,  y: 540, scale: 1 },
  { t: 6.5, x: 1180, y: 560, scale: 6.5 },   // past the scene's end: at the cut (6 s) the camera is at
                                              // about 5.4×, the card fills the frame, and it is still moving
]}>
  {/* the app */}
</Camera>

// scene B, the open note, arriving from inside the card
<Camera keys={[
  { t: -0.4, x: 960, y: 540, scale: 1.3 },   // before the scene starts: already moving at t = 0
  { t: 0.9,  x: 960, y: 540, scale: 1 },
]}>
  {/* the editor */}
</Camera>
```

Two conditions make it work. By the middle of the crossfade, the outgoing frame must be mostly the card's plain surface, with little text left in frame to ghost through the incoming scene. And the incoming scene's background must be close to that surface's color, or the fade flashes. Render stills at the start, middle and end of the cross to check both. This is the one place where zooming text out of frame is right: during the push into a cut, while no caption is being read.

**Layout morph: one shot instead of a cut.** The signature move of the best product films: a list row grows into the full editor, a button grows into the dialog it opens, in one continuous shot inside one scene. Nothing cuts, so nothing has to dissolve, and the viewer never loses the object they were watching.

- **Animate the box, not a scale.** Interpolate x, y, width, height and `borderRadius` from the source rect to the target rect (both from `layout.ts`) over 0.5–0.7 s, with `EASE`, or `inOut` when both ends rest on screen. A morph changes the aspect ratio, and `scale()` would squash the text inside; sizing the box lets each state lay out at its real font size and stay crisp.
- **Swap the content in the middle.** The old content fades out over 0.25–0.45 of the move and the new content fades in over 0.35–0.65, each drawn at its own final size inside the growing box (`overflow: hidden` clips it).
- **Everything else holds still** and dims 20–30% while the morph runs, so the box is the one thing that moves.
- **The sound** is one whoosh, loudest where the move is fastest: its first frames with `EASE`, its middle with `inOut` (`k.move(s, m.open, m.open + 0.6)` in the scene's sheet does the `inOut` case).

```tsx
// a note row grows into the editor; ROW and EDITOR are stage-px rects from layout.ts
const t = useTime(), m = useMarks();
const k = prog(t, m.open, 0.6, EASINGS.inOut);                  // both ends rest on screen
const r = { x: lerp(ROW.x, EDITOR.x, k), y: lerp(ROW.y, EDITOR.y, k), w: lerp(ROW.w, EDITOR.w, k), h: lerp(ROW.h, EDITOR.h, k) };
const rowOut = 1 - clamp((k - 0.25) / 0.2);                     // the old content is gone by 0.45
const editorIn = clamp((k - 0.35) / 0.3);                       // the new content arrives from 0.35
<>
  {/* the rest of the app, still */}
  <AbsoluteFill style={{ background: '#000', opacity: 0.25 * Math.sin(Math.PI * k) }} />   {/* dims it while the box moves */}
  <div style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: lerp(8, 16, k), overflow: 'hidden', background: C.panel }}>
    <div style={{ opacity: rowOut }}><NoteRow note={NOTE} width={ROW.w} /></div>
    <div style={{ position: 'absolute', inset: 0, opacity: editorIn }}><Editor note={NOTE} width={EDITOR.w} /></div>
  </div>
</>
// <NoteRow /> and <Editor /> stand for your product components in src/product/
```

## 9. Camera

`Camera({ keys, children })` moves between keyed framings. Each key says: at scene time `t`, put the point (`x`, `y`) of the content at the center of the frame, at zoom `scale`. `{ x: W / 2, y: H / 2, scale: 1 }` is the plain, unmoved frame. Keys are in frame pixels. For a target inside the scaled product, convert it first: the template's demo uses `appPoint()` from `src/product/App.tsx`, and [ui-recreation](ui-recreation.md) §4 has a `toFrame()` for a `layout.ts` of your own.

Two things are built in. Every segment between keys eases, by default with `EASINGS.inOut`, so a move starts and ends at rest; a key's own `ease` shapes the move into it. And zoom is interpolated in log space, so 1 → 2 feels like the same amount of zoom as 2 → 4 and a big push doesn't seem to speed up at the end. Before the first key the camera holds the first framing, and after the last it holds the last. That is what makes keys at negative times, or after the scene ends, useful (section 8).

**Pushes that feel hand-keyed.** The same symmetric `inOut` push of the same 1.2 s, all film long, is part of why coded videos feel alike. A camera operator commits fast and settles long. Give the key a push arrives at `ease: EASINGS.commit` (`cubic-bezier(0.45, 0, 0.15, 1)`; measured: fastest at 31% of the move, halfway at 35%, 90% there at 62%):

```tsx
import { EASINGS } from '../lib/anim';

<Camera keys={[
  { t: 0, ...home },
  { t: m.push, ...home },
  { t: m.push + 1.1, ...near, ease: EASINGS.commit },   // commits early, settles long
  { t: m.pull, ...near },                                // a hold: its segment doesn't move, whatever the ease
  { t: m.pull + 0.9, ...home, ease: EASINGS.commit },
]}>…</Camera>
```

Keep plain keys (`inOut`) for loops and for pans between two resting framings. Vary each push's length with its distance, 0.8–1.6 s, instead of 1.2 s for every move. The whoosh of a `commit` push peaks about 0.31 × its length in, so place it by hand (`k.swish(s.t(m.push + 0.31 * 1.1), { dur: 1.1 })` in the scene's sheet): `k.move()` assumes `inOut` and puts it in the middle.

The camera does three jobs, and they use different scales:

| job | scale | over |
|---|---|---|
| **drift**: life in a static shot | +0.02–0.06 across the whole shot, plus 20–40 px | two keys spanning the whole shot; its slow ends are hidden by the cuts |
| **lean in**: "look at this" | 1.0 → 1.08–1.2 | 1.0–1.6 s (showcase), 0.6–0.9 s (reel) |
| **read this**: small text made legible | as tight as the text needs, usually 1.3–1.8, from `frameOn()` below | 1.0–1.4 s |

Beyond about 2×, cut to a closer scene or lay the UI out bigger instead. Rebuilt UI stays crisp at any scale, but content with 3D transforms (`perspective`, `rotateX`) can be rastered once and stretched, which softens text. Screenshots and recordings go soft past about 1.2×. Check a still at the tightest framing.

**Push, hold, pull back.** Hold the push for as long as the caption needs. Then return to 1.0 over 0.9–1.2 s before the next beat. The pull-back re-orients the viewer ("we're back at the whole thing"). Push → push → push without returning loses the viewer's map of the screen. Pan at the zoomed scale only between neighbours less than half a frame apart. For anything farther, pull back and push in again.

**Punch-in, reels only.** A jump between two framings with no move in between, for example 1.0 to 1.15 on the element as a word lands or on a beat. It works as a pattern interrupt without a transition: two keys one frame apart. Use at most one every 2 s or so.

```tsx
const stage = useStage();
const { W, H, fps } = stage;
<Camera keys={[
  { t: 0,                x: W / 2, y: H / 2, scale: 1 },
  { t: m.punch,          x: W / 2, y: H / 2, scale: 1 },
  { t: m.punch + 1 / fps, ...frameOn(target, stage, 1.15) },   // the jump
]}>
```

**Captions stay outside the `Camera`.** They must not scale, drift or leave frame with the push. Only the product goes inside. The same goes for the `EndCard`, and for any `Callout` whose text must stay a fixed size.

**Never push text out of frame: compute the framing.** The right push-in is not guessed. This framing puts a rect at the middle of the safe area, as large as fits with a little air, capped:

```ts
import type { Safe } from '../formats';
type Rect = { x: number; y: number; w: number; h: number };

/** A Camera key that centres `r` (frame px) in the safe area, as large as fits, never above `cap`. */
export function frameOn(r: Rect, stage: { W: number; H: number; safe: Safe }, cap = 1.2) {
  const { W, H, safe } = stage;
  const boxW = W - safe.left - safe.right;
  const boxH = H - safe.top - safe.bottom;
  const scale = Math.max(1, Math.min(cap, 0.92 * Math.min(boxW / r.w, boxH / r.h)));
  const dx = safe.left + boxW / 2 - W / 2;       // safe-area centre, relative to frame centre
  const dy = safe.top + boxH / 2 - H / 2;
  return { x: r.x + r.w / 2 - dx / scale, y: r.y + r.h / 2 - dy / scale, scale };
}
```

Pass a `safe` with the caption band added (for example `{ ...stage.safe, top: stage.safe.top + 160 }` when calm captions sit at the top), so the target never slides under the words. The reel's safe area is not centered (250 px clear at the top, 450 px at the bottom), which is why the framing shifts toward the safe center instead of the frame center. If `frameOn` returns scale 1 for something you meant to push in on, the rect is already as big as the frame allows. Change the layout, not the camera.

A full beat, lean in and back out:

```tsx
import { prog } from '../lib/anim';
import { useMarks, useStage, useTime } from '../lib/time';
import { Camera, Focus } from '../lib/ui';
import { Captions } from '../lib/text';

const t = useTime();
const stage = useStage();
const { W, H } = stage;
const m = useMarks();                                // { push: 3.0, pull: 6.4 }
const dialog = { x: 1060, y: 300, w: 560, h: 380 };  // frame px, from layout.ts
const near = frameOn(dialog, { ...stage, safe: { ...stage.safe, top: stage.safe.top + 160 } });

<>
  <Camera keys={[
    { t: 0, x: W / 2, y: H / 2, scale: 1 },
    { t: m.push, x: W / 2, y: H / 2, scale: 1 },
    { t: m.push + 1.2, ...near },
    { t: m.pull, ...near },
    { t: m.pull + 1.0, x: W / 2, y: H / 2, scale: 1 },
  ]}>
    <Focus active={prog(t, m.push - 0.3, 0.4) * (1 - prog(t, m.pull, 0.4))} rect={dialog}>
      {/* the device and the product */}
    </Focus>
  </Camera>
  <Captions variant="calm" cues={[{ at: m.push + 1.3, text: 'share it with the whole team.' }]} />
</>
```

## 10. Focus

`Focus({ active, rect, children, radius, dim, blur })` dims, blurs and desaturates everything but `rect`. Use it when the frame holds several things that could be read and the caption is about one of them. A dialog with its own scrim already focuses attention, and a scene with one element needs no focus.

- **Fade it, don't switch it.** `active` takes a boolean or a number from 0 to 1. A boolean snaps on in one frame, which reads as a glitch. Pass a value that ramps over 0.3–0.5 s: `prog(t, m.focus, 0.4) * (1 - prog(t, m.unfocus, 0.4))`.
- **Strength:** the defaults (`dim` 0.6, so the rest sits at 40% brightness, and `blur` 5 px) suit a busy dashboard. Go lighter (`dim` 0.4, `blur` 3) when the surroundings are context the viewer should still recognize.
- **Order:** focus 0.2–0.3 s before the push starts, so the eye knows where to look before the frame moves. Release it as the pull-back begins.
- **Rect:** pad 12–24 px around the element, and match `radius` to the element's corner radius. A rect that hugs its edges looks like a cut-out.
- **Coordinates:** `rect` is in the coordinates of wherever `Focus` sits. Inside the `Camera`, as above, the lit area moves with the push.
- **One or the other at high zoom.** Past about 1.3× most of the dimmed area is out of frame anyway. Pick the push or the focus.
- **Several items in turn:** move the rect between them only when they are neighbours (interpolate its x, y, w, h with `prog`, 0.5 s, `inOut`). Otherwise release, then focus the next one, as the camera does.
- **Cost:** `Focus` draws its children twice (a dimmed copy and a sharp, clipped one), so a heavy scene renders slower while it is active, and its children must be pure functions of time.

## 11. Transitions

`Video.tsx` uses one `fade()` of `cross` seconds for every join in a cut (`cross: 0` gives hard cuts throughout). Build any other transition inside the scenes: the out-move at the end of scene A, the in-move at the start of scene B, with the short fade hiding the swap. That keeps `cuts.json` the one timeline and keeps sound on marks.

| transition | how | length | showcase (calm) | reel (energetic) |
|---|---|---|---|---|
| hard cut | `cross: 0`, or 0.1 s, which still reads as a cut but hides a one-frame pop | 0 | the default: cut on action (mid-move, the next shot continuing it), or on a caption change | the default: cut on a beat, or on action |
| layout morph | one element's box grows into the next state's layout, in one continuous shot (section 8) | 0.5–0.7 s / 0.35–0.5 s | the best join inside a scene | the best join inside a scene |
| shared element, match cut | the same thing drawn in both scenes through the cut (section 8) | = `cross` | the best join between scenes | good when the product has a hero object |
| dissolve | `cross` in `cuts.json` (one value for every join of the cut), or for a single join, a dip through the backdrop built in the two scenes (last row) | 0.4–0.6 s | only for time passing ("a week later") or a chapter break, 1–2 per film. On every join it reads as a slideshow and ghosts the text of both scenes | avoid |
| zoom-through | `Camera` flies into an element; the next scene starts inside it | 0.6–1.0 s push | once, into the product | 0.4–0.6 s push |
| slide / push | in-scene `translateX` of the content by `W`, `inOut` | 0.5–0.7 s / 0.3–0.45 s | sequential steps: onboarding, pages | carousels, step 1 → 2 → 3 |
| mask, wipe, iris | animated `clipPath` on the incoming content | 0.5–0.8 s / 0.3–0.5 s | revealing a result: before/after, a screen opening from its button | revealing a result |
| whip | out with `EASINGS.in` plus blur, in with `EASE`, the cut at peak speed | 0.25–0.35 s | not at all, or once | joins between sections, with a whoosh peaking at the cut |
| fade through background | out to the backdrop, a beat, then in | 0.6–1.0 s | chapter breaks, before the end card | avoid: dead frames lose viewers |

**Wipe and iris.** A linear `inset()` wipe is fine for a before/after split. An iris from the click point ties the new screen to its cause:

```tsx
const w = prog(t, m.reveal, 0.6, EASINGS.inOut);
<div style={{ clipPath: `inset(0 ${(1 - w) * 100}% 0 0)` }}>{after}</div>          // wipe from the left

const r = prog(t, m.click + 0.1, 0.5, EASE);                                        // on the release
<div style={{ clipPath: `circle(${r * 2300}px at ${click.x}px ${click.y}px)` }}>{next}</div>  // 2300 > the 1920×1080 diagonal
```

**Whip.** Scene A (5 s long, reel cut, `cross` 0.1) leaves to the left, accelerating. Scene B arrives from the right at full speed and settles. Similar travel and duration on both sides give similar speeds at the cut, so the eye reads one continuous move:

```tsx
// end of scene A
const { W, fps } = useStage();
const xA = (s: number) => -W * prog(s, 4.75, 0.25, EASINGS.in);
const vA = Math.abs(xA(t) - xA(t - 1 / fps));                      // px moved this frame
<AbsoluteFill style={{ transform: `translateX(${xA(t)}px)`, filter: `blur(${Math.min(24, vA / 4)}px)` }}>…</AbsoluteFill>

// start of scene B
const xB = (s: number) => W * (1 - prog(s, 0, 0.3, EASE));
const vB = Math.abs(xB(t) - xB(t - 1 / fps));
<AbsoluteFill style={{ transform: `translateX(${xB(t)}px)`, filter: `blur(${Math.min(24, vB / 4)}px)` }}>…</AbsoluteFill>
```

Blur tied to speed (about a quarter of the pixels moved per frame) mimics what a film camera's shutter would smear. Section 14 covers the cost.

## 12. Cursor paths

`Cursor({ path, clicks, label, color, scale, hideAfter })` glides between `{ t, x, y }` waypoints and presses and releases at each time in `clicks`. [ui-recreation](ui-recreation.md) covers where to render it (inside the product, in product pixels), aiming, hover and typing. This section covers how the path moves.

What the component already does, so you don't do it twice:

- **Every segment eases in and out** (`EASINGS.inOut`): the pointer leaves a waypoint gently, is fastest mid-way and slows into the next one. So each waypoint is a place where the hand stops.
- **Every segment bows** sideways by 10% of its length, at most 60 px, like a wrist turning. Straight-line moves come out as arcs on their own.
- **It fades in** over the 0.2 s before the first waypoint's time, and fades out over 0.25 s after `hideAfter`.
- **A click** is a press of about 0.2 s centered just after the click time, plus a ring that spreads over 0.55 s.

Your part:

- **One waypoint per stop.** Put waypoints only where a person's hand would stop: the start, each target, the resting place after a click. A waypoint in mid-air makes the pointer slow down in mid-air, which looks like hesitation. The bow already gives you the arc.
- **Travel time grows with distance.** Fitts's law: pointing time grows with distance and shrinks with target size. Use `0.25 + distance / 1800` seconds (frame px), clamped to 0.3–0.9 s in a showcase, about 25% faster in a reel. Give small targets the top of that range.
- **Dwell, then click.** Arrive 0.25–0.4 s before the click in a showcase, 0.15–0.25 s in a reel. The viewer needs that beat to see where the click will land. Holding still is a repeated waypoint: the same x, y at a later t.
- **Get off the result.** 0.3–0.5 s after the click, move 60–120 px away, usually down and to the right, so the pointer doesn't sit on the change it caused.
- **Never freeze, never teleport.** A pointer still for more than about 1.2 s looks like a screenshot: add a waypoint 6–10 px away over the hold, or end it with `hideAfter`. It enters from the frame edge or from where it was at the end of the previous scene.
- **Size for the format.** The default arrow is 34 px in whatever space it sits in. Inside a product scaled by `k`, it scales with the UI. In a reel, make sure it ends up at least 40–50 px on screen (`scale`), since it is watched on a phone.
- **Stay out of the words.** Route around captions and the text being read, and keep it inside the format's safe area. In a reel, nothing the pointer does should happen in the bottom 450 px.
- **One pointer per person.** Show two only when the story is about two people, labelled and in their identity colors.

```tsx
const m = useMarks();                           // { click: 2.1, typeStart: 2.6 }
<Cursor
  path={[
    { t: 1.15, x: 1020, y: 640 },               // enters low right (fades in from 0.95 s); 640 px to go: 0.65 s
    { t: m.click - 0.3, x: 1206, y: 30 },       // on the Share label, 0.3 s early; the segment bows on its own
    { t: m.click + 0.4, x: 1206, y: 30 },       // holds through the press and release
    { t: m.click + 0.8, x: 1270, y: 120 },      // steps off the dialog it opened
  ]}
  clicks={[m.click]}
  hideAfter={m.typeStart}                       // gone once typing starts, as the OS hides it
/>
```

## 13. Ambient motion and loops

Ambient motion is idle life: a breathing mascot, bobbing avatars, a pulsing "live" dot, a blinking caret, a slow glow in the `Backdrop`.

- **Run it on `useDrawnTime()`.** A reel that reuses a showcase scene through a `warp` squeezes pauses 2–9× harder than moves, and changes speed at every knot. An idle bob on the warped clock speeds up and slows down at each knot, which reads as shivering. On drawn time it keeps its own steady rhythm.
- **Keep it small:** scale ±1–2%, translate ±3–6 px, rotation ±1°, a pulse between 0.5 and 1 opacity.
- **Periods:** 2–4 s for breathing and bobbing, 1–1.2 s for a caret blink, 1.5–2.5 s for a live dot.
- **Desync siblings** with a seeded phase, so three avatars don't bob in lockstep.
- **Damp it while the element is primary.** Nothing should bob while it is being clicked or read.

```tsx
const d = useDrawnTime();
const bob = Math.sin((d / 3.2 + rand(i)) * 2 * Math.PI) * 4;                      // ±4 px, 3.2 s, own phase
const live = 0.5 + 0.5 * (0.5 + 0.5 * Math.cos(loopT(d, 2) * 2 * Math.PI));         // 0.5 … 1, every 2 s
```

**Loops** (the `loop` format, and any clip meant to repeat) must end where they begin:

- Every periodic value uses `loopT(t, period)` with a period that divides the loop length. For a 6 s loop: 1, 1.5, 2, 3 or 6 s.
- The story returns to its start state: rest → open → act → close → rest. Put 0.4–0.6 s of the rest state at both ends, so the join lands in stillness.
- Moves inside a loop use `inOut`, since they start and end at rest.
- No springs across the seam (they never land exactly), and no linear drift unless it is periodic.
- Check the seam: `node scripts/stills.mjs loop --at 0,5.983` for a 6 s loop at 60 fps. The two stills should be nearly identical.

## 14. Frame rate, judder and motion blur

**60 or 30.** The showcase and loop formats run at 60 fps, where camera moves, cursor glides and scrolling look like a real screen and each frame moves half as far. The phone formats run at 30 fps: half the frames, half the render time, a smaller file at the same quality (platform details in [delivery-and-platforms](delivery-and-platforms.md)). Because time is in seconds, the same scene keeps its timing at either rate. Never write a frame count in a scene. At 30 fps, respect the 5-frame floor, keep sustained moves slower, and prefer cuts to long pans.

**Judder.** A rendered frame has no motion blur. It is as sharp as a camera with its shutter open for no time at all, so steady motion strobes sooner than filmed motion does. RED's rule of thumb for 24 fps film with a normal shutter is to pan no faster than one image width every 7 seconds. Treat that as the ceiling for sustained motion (drifts, long pans, conveyor-like scrolling) at 30 fps: about 150 px/s across a 1080-wide reel, about 275 px/s across a 1920-wide frame, and roughly double at 60 fps. Brief eased moves under about 0.8 s can be much faster, because the eye follows the settle, not the peak. A scroll fling is one of those brief moves: its peak can be high, but keep text under about 40 px per frame, or cut instead of scrolling.

**Motion blur, cheapest first:**

1. **Don't need it.** Keep the fast part of a move short (`EASE` already does this) and let opacity carry the first frames.
2. **Fake it on the one element that moves fast**, from its own speed, as in the whip recipe (section 11): blur of about a quarter of the pixels moved per frame, capped at 24 px, plus a slight stretch along the motion (`scaleX(1 + Math.min(0.12, v / 1500))`). CSS `blur()` smears in every direction. For a horizontal-only smear, reference an inline SVG filter with `<feGaussianBlur stdDeviation="16 0" />` through `filter: url(#id)`. Blur large layers only while they move fast (over about 8 px per frame), because filters on big areas slow every frame of the render.
3. **Real blur.** Remotion has a separate `@remotion/motion-blur` package (not in the template) whose `<CameraMotionBlur>` renders `samples` copies of the scene per frame (10 by default) and averages them. The render gets slower roughly in proportion, and averaging washes out color. Use it only on a 1–2 s shot that can't be faked, render nothing else at the same time, and never wrap a whole film in it.

**Warps change speed.** In a reel that reuses a scene through `warp`, each knot segment multiplies the speed of everything in it by its slope. In the real reel, moves ran at about 1.2× while one long hold was squeezed about 9×. Keep moves at slopes of 1.0–1.4, squeeze the holds, and put knots where nothing moves: a slope change in the middle of a move shows as a kink.

## 15. Where sound lands on a move

Picture and sound read the same marks, so the motion curve decides where on a move each sound goes. Inside `score(cut, mix, at)` in `sound/score.mjs`, `at(scene, markOrSeconds)` turns a mark (or scene seconds) into seconds from the start of the cut being scored; [sound-design](sound-design.md) covers the voices and levels.

| move | sound | lands at |
|---|---|---|
| a click | `click()` | the click mark (the press) |
| an `EASE` arrival, `dur` long | `pop()` or `tick()` | start + about 0.35 × `dur` (90% there) |
| a calm `pop()` arrival | `pop()` or `tick()` | start + 0.2–0.3 s (80–90% there) |
| a bouncy `pop()` | `pop()` | start + 0.19 s, when it first reaches its place |
| a camera push or pan (`inOut`) | `whoosh()` with `peak: 0.5`, as long as the move | the move's start, so it is loudest in the middle, where the move is fastest |
| a push on its own curve (section 9) | `whoosh()`, placed with `placePeak` | the curve's fastest point: 0.31 × the length in, for `EASINGS.commit` |
| a whip or zoom-through | `whoosh()` | loudest at the cut |
| a typed character | `key()` | the frame the character appears |

The score already sounds many moves: every demo scene from its cue sheet, which follows the scene's own move timings (a whoosh peaking mid-push, a pop as each card lands), and any scene without a sheet by its mark names (a `paletteOpen`, a `cardIn2`, a `focus1` push; both are in [sound-design](sound-design.md) §4). For a move neither covers, add it to the scene's sheet, or place it by hand in the cut's case of `score()`:

```js
// sound/score.mjs, in the cut's case of score(cut, mix, at), after byMarks(k, …).
// (In a scene's sheet the same two cues are k.pop(s.t(m.open + 0.2), 'A5') and k.move(s, m.push, m.push + 1.2).)
// Engine voices come out at house level: gain 1 is already balanced, and whooshes already sit under clicks.
const m = k.scenes.find((s) => s.id === 'demo').marks;                  // scene seconds, from cuts.json
place(mix, pop({ f: 880, seed: 7 }), at('demo', m.open + 0.2), { gain: 0.8 });   // the 0.6 s EASE dialog is 90% there
place(mix, whoosh({ dur: 1.2, peak: 0.5, seed: 8 }), at('demo', 'push'));          // loudest mid-push, where inOut is fastest
```

Put offsets inside `at()`, in scene seconds, as above: `at()` then inverts the scene's warp for you. An offset added after `at()` is in cut seconds, which is only right for an unwarped scene. Or make the moment a mark of its own.

## 16. The energy dial

The same vocabulary covers a calm launch film and a punchy reel. What changes is a handful of settings. Pick the level from the format, then keep every scene in the cut at that level.

| | 1. loop | 2. showcase | 3. feature clip | 4. reel | 5. hook |
|---|---|---|---|---|---|
| where | landing hero, docs | 16:9 launch film, YouTube | 1:1 or 4:5 feed, changelog | 9:16 reel, TikTok, Shorts | the first 1–2 s of a reel |
| shot length | one shot | 4–9 s per beat | 2.5–4 s | 1.5–3 s | 0.5–1.5 s |
| durations (× section 3) | 1.1 | 1.0 | 0.85 | 0.7–0.8, never under 5 frames | 0.5 |
| arrivals | `inOut` | `EASE` | `EASE`, `snappy` for UI | `snappy`, `EASE` | `snappy` |
| springs | calm | calm, one bounce per scene | calm, bounce on confirmations | `settle()` at ω 18, bounce on hero pops | bouncy title |
| camera | drift | lean in 1.08–1.2 over 0.8–1.6 s by distance, pull back | lean in 1.1–1.2 over 0.8–1.0 s | lean in 1.12–1.3 over 0.6–0.9 s, punch-ins | punch-in |
| joins | none (`cross: 0`) | cuts on action (`cross` 0–0.1), shared elements, layout morphs, one zoom-through; a dissolve only for time passing | cuts, layout morphs, slides | `cross` 0–0.1 s, whips, masks | hard cut |
| something new | per loop | per sentence | about every 3 s | about every 2 s | within 0.5 s (`KineticTitle`) |

Two things never change on the dial:

- **Reading time.** Energy comes from motion speed, cut rate and interrupts, never from shortening how long a sentence stays up: the launch film's reel was unreadable at 29 s and worked at 37 s.
- **One thing at a time.** A level-4 reel is faster, not busier. Its interrupts are sequential: a cut, then a punch-in, then a pop, each on its own beat.

**Reel-specific motion.** Move along the long axis: stack panels vertically, scroll vertically, enter from below. Use bigger travel for the bigger relative scale (40–80 px entrances instead of 16–40). Keep everything that moves inside the reel's safe margins (250 px top, 450 px bottom, 150 px right). What counts as a pattern interrupt, and how often, is in [reels-retention](reels-retention.md).

## 17. Anti-patterns

| you see | why it hurts | fix |
|---|---|---|
| everything bounces | a bounce is emphasis; everywhere, it is noise and looks cheap | calm `pop()` by default, one `bouncy` per scene |
| several things move at once | the eye can follow one; the frame reads as busy | sequence them; overlap only in settles (section 6) |
| linear moves that start and stop on screen | a jerk at both ends; looks machine-made | `EASE` for arrivals, `inOut` for repositioning |
| ease-in entrances | creeps in, then crashes | ease-out in, ease-in out |
| spinning logos, 3D flips, 360° turns | says nothing, looks like a template | build the logo up: draw its strokes in, assemble its parts, reveal it with a mask; rotation under 10–15° only as part of an arrival |
| scaling from 0 | cartoonish; text flashes through unreadable sizes | 0.94–0.98 → 1 with opacity |
| a camera that never rests | seasick, nothing to read | push, hold, pull back; drift at most +6% per shot |
| text pushed out of frame, captions inside the `Camera` | the viewer loses the words | `frameOn()`; captions outside the `Camera` |
| a stagger that takes seconds | the last item arrives after attention has moved on | cap the total at about 0.5 s |
| idle loops on `useTime()` | shiver in a warped reel | `useDrawnTime()` |
| text moving while it is read | nobody can read a moving line | text still during its hold |
| shake as decoration | shake means impact; repeated, it means nothing | only on an impact (below) |
| moves under 5 frames at 30 fps | read as glitches | at least 0.17 s |
| a move that stops right at a cut | the cut feels like a stumble | carry speed through (section 8) |
| blur on every entrance, plus `Words` blur, plus transition blur | mushy frames, slow renders, and the template look | one blur family per scene. The template's own components count: `Words` (and `Captions` with `arrival="words"`) rise out of a blur, and so does `EndCard`'s name, so a scene with any of them already has its blur. Calm `Captions`, `Line`, `KineticTitle` and `EndCard`'s logo arrive without one ([captions-and-type](captions-and-type.md) §10) |
| a dissolve between every beat | reads as a slideshow; text from both scenes ghosts through each overlap | cut on action, match cuts, layout morphs; a dissolve only for time passing (section 11) |
| the same symmetric push, the same length, every time | a machine-made rhythm | vary the length with the distance; commit fast and settle long (section 9) |
| tilt and parallax on every card | busy; pulls the eye from the UI; the stock-mockup look | 3D only on the hero device's first entrance, once per film (tilted back 10–14°, settling to 0 before any text is read) |

The one shake worth having, from the launch film's "their changes crash" moment: a decaying jolt of about ±16 px that halves every 0.2 s and is under 2 px by 0.5 s.

```tsx
const { fps } = useStage();
const k = t - m.crash;
const shake = k < 0 ? 0 : (rand(Math.floor(t * fps)) - 0.5) * 32 * Math.exp(-k / 0.27);
<div style={{ transform: `translateX(${shake}px)` }}>{/* the editor */}</div>
```

## 18. Checking motion you cannot watch

You can't play the video, so make motion visible in stills:

- **Name the peaks.** Add marks for moments you want to check (`pushed`, `landed`, `midWhip`). Marks are just names in `cuts.json`, so a QA-only mark costs nothing. Then `node scripts/stills.mjs <cut> --marks`.
- **Any moment:** `--at` takes seconds from the start of the cut. For a scene-local time, add `sceneStart(cut, scene)`.
- **Tile them** with `node scripts/sheet.mjs <cut>`. Gaps between tiles matter: touching tiles merge text across frames and fool you.
- **At every push peak**, with `--safe`: the target and its text inside the safe area, nothing important cut off, text crisp.
- **Mid-transition** (halfway through `cross`): no flash from mismatched backgrounds, no ghosted double of an element that should have been shared.
- **Count what is in motion.** In any single still, count the elements caught partway: partial opacity, blur, off their resting place. More than one primary means simultaneous moves.
- **Stagger midpoints:** the order reads the way you meant it.
- **Motion strips** show a curve: 6–8 stills at even steps across one move, in one row. `EASE` bunches the positions toward the end, `inOut` bunches them at both ends, linear spaces them evenly, and one tile past the final position means one overshoot.
- **Loops:** the first and last frames match.

The full review routine and per-format checklists are in [review-and-qa](review-and-qa.md).

## Sources

- Nielsen Norman Group, "Executing UX Animations: Duration and Motion Characteristics": https://www.nngroup.com/articles/animation-duration/
- easings.net, easing curves and their cubic-bezier values: https://easings.net/ (source data: https://github.com/ai/easings.net/blob/master/src/easings.yml)
- Remotion, `spring()`: https://www.remotion.dev/docs/spring
- Remotion, `fade()` presentation (the exiting scene is not faded by default): https://www.remotion.dev/docs/transitions/presentations/fade
- Remotion, `<CameraMotionBlur>`: https://www.remotion.dev/docs/motion-blur/camera-motion-blur
- RED Digital Cinema, "Panning Speed Best Practices" (the 7-second rule): https://www.reddigitalcinema.com/red-101/camera-panning-speed
- Twelve basic principles of animation (Thomas and Johnston, *The Illusion of Life*, 1981): https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation
- Fitts's law: https://en.wikipedia.org/wiki/Fitts%27s_law
