# UI recreation: the product's real interface, rebuilt to move

The best product videos show the product itself, not an illustration of it. This reference covers how to rebuild a product's real UI as small React components in `src/product/` so scenes can animate it: read the product's repo first (tokens, components, strings, fonts, icons, seed data), map its tokens into `src/theme.ts`, fill it with believable fictional data, frame it with `Browser`, `Phone` or `Window`, give it the states the story needs, and drive it with a cursor whose every target is computed from layout constants. It also covers when a real screen recording is the better choice, how to use one safely, and the rules that keep every frame a pure function of time. Read it before building the "how it works" scenes of any cut.

## Contents

1. [Rebuild or record?](#1-rebuild-or-record)
2. [Read the product's repo first](#2-read-the-products-repo-first)
3. [Map the tokens into theme.ts](#3-map-the-tokens-into-themets)
4. [Structure src/product/ so scenes can compose it](#4-structure-srcproduct-so-scenes-can-compose-it)
5. [Fictional data that feels real](#5-fictional-data-that-feels-real)
6. [Device frames and scale](#6-device-frames-and-scale)
7. [The states the story needs](#7-the-states-the-story-needs)
8. [Cursor choreography](#8-cursor-choreography)
9. [Typing](#9-typing)
10. [Scrolling lists](#10-scrolling-lists)
11. [Modals, menus and command palettes](#11-modals-menus-and-command-palettes)
12. [Continuity between scenes](#12-continuity-between-scenes)
13. [Everything a pure function of time](#13-everything-a-pure-function-of-time)
14. [Real screen recordings](#14-real-screen-recordings)
15. [Checks and common failures](#15-checks-and-common-failures)

## 1. Rebuild or record?

Default to rebuilding. A rebuilt UI is a set of components whose every property is a number you control, which gives you four things a screenshot or recording cannot:

- **It moves.** A new row can open in, a counter can roll, a toast can land on the beat, a dialog can rise out of the button that opened it. In a screenshot the only thing that can move is the whole picture.
- **It stays sharp under `Camera`.** Text and vectors are re-rasterized at the final scale every frame, so a push-in to 1.6× on a button label is as crisp as the wide shot. A 1× screenshot is visibly soft past about 1.2×, and even a 2× capture runs out of detail at about 2×.
- **It shows states at once.** Empty, typing, loading, success and conflict can follow each other in six seconds, two people's screens can sit side by side on one clock, and a before/after can split the frame. A recording needs a take per state and still cannot put two sessions on one timeline.
- **It re-lays out and re-times.** The same components serve the 16:9 showcase, the 9:16 reel (stacked, bigger), the loop and the cover still. Changing a label, a name or a color is an edit, not a re-shoot.

Record instead (section 14) when the pixels are the product and faking them would take days or look fake: a 3D or video editor, a design canvas, maps, dense data visualizations, generated images, a game. Also record when credibility is the message ("this is the real thing, unedited"), for example a developer tool whose audience distrusts mockups. A hybrid is often best: a real recording inside a rebuilt `Browser` frame, with a rebuilt `Cursor`, `Callout` and captions on top.

Whichever you choose, the video is a promise. Never show a feature, screen or behavior the product does not have. If the user wants to show something unreleased, ask them to confirm it and label it ("coming soon") in the video.

## 2. Read the product's repo first

Before drawing anything, spend ten minutes reading. Code gives you the structure, the tokens and the words; the running app or its landing page gives you the proportions. Both beat guessing.

What to look for, and where:

| what | where it usually lives | search for |
|---|---|---|
| color, radius, spacing tokens | `:root { --... }` in `globals.css` / `styles.css`; `tailwind.config.{js,ts}` (`theme.extend`); Tailwind v4 `@theme { --color-... }`; `theme.ts`, `tokens.json`; MUI `createTheme`, Chakra `extendTheme`; React Native `constants/Colors.ts`; Flutter `ThemeData`; iOS `Assets.xcassets` color sets | `--`, `colors:`, `@theme`, `createTheme` |
| fonts | `next/font/google` calls in `app/layout.tsx`; `@font-face` + `.woff2` in `public/fonts`; a Google Fonts `<link>` in `index.html`; `fontFamily` in the Tailwind config | `@font-face`, `next/font`, `fonts.googleapis`, `fontFamily` |
| icons | `lucide-react`, `@heroicons/react`, `@phosphor-icons/react`, `@radix-ui/react-icons`, an `icons/` folder of SVGs | the import lines of the screens you will show |
| components | the screens the story passes through: the shell (sidebar, top bar), the main list, the editor or detail view, the dialog or palette the demo opens | `export function`, `export default` in `components/` |
| real strings | button labels, placeholders, empty-state copy, toasts, error messages, keyboard shortcuts; `locales/en.json` or `messages/en.json` if the app is translated | `placeholder=`, `toast(`, `aria-label=`, `⌘`, `Ctrl+` |
| fictional data | `seed.ts`, `fixtures/`, `__mocks__/`, Storybook `*.stories.tsx`, Playwright fixtures, a `/demo` mode | `seed`, `fixture`, `stories`, `demo` |

Storybook stories and demo modes are the richest sources. Stories list every state the designers cared about, with fake data already written in the product's voice. The real project this skill comes from had a `/demo` mode with a made-up team working on a made-up checkout app; its names, file paths and task lines went straight into the film. Still read seed data critically: fixtures sometimes contain copied production rows or teammates' real emails.

Then write a short inventory for yourself before building: the 3–6 surfaces the story passes through, their tokens, the fonts, the 5–10 icons on screen, and the exact strings. Show the user the list of surfaces with one line each on what happens there, since it is cheap to correct now.

Rebuild only what the camera sees, and spend detail where the story happens:

- **Hero surfaces** (where the caption is pointing): full fidelity. Real strings, real icons, the product's hover and selected states, its exact radii and borders.
- **Surrounding surfaces** (sidebar, top bar, other panels): silhouette fidelity. Right proportions, right colors, a few real labels, no interactions.
- **Off-screen:** nothing.

Trim clutter the product has but the story does not need (a banner, a settings gear, a fourth toolbar button). The UI should still read as the product at a glance, and it will read faster. Removing clutter is fine; adding things the product lacks is not.

If there is no repo (closed source, a Figma file, only a live site), take screenshots of the real screens, sample colors from them, and match fonts by comparing distinctive glyphs (`g`, `a`, `R`, `1`). Say in your report which values are measured and which are estimated.

## 3. Map the tokens into theme.ts

`src/theme.ts` is the one file that carries the brand. Keep the export names the template's `theme.ts` already uses (`C` for colors, `PEOPLE_COLORS`, `FONT`, `FEATURES`, `R` for radii, `SHADOW`, `BRAND`, `GRADIENT`, and the `alpha()` helper) and change the values, because every product component and scene reads them. The same values are also grouped as `theme` (`theme.colors.accent` is `C.accent`) for code that prefers that shape. Map semantic roles (background, panel, line, text, dim, accent, danger), not the raw palette, so product components never hard-code a hex value.

The product's `app/globals.css` (shadcn-style HSL tokens):

```css
:root {
  --background: 240 10% 4%;  --card: 240 6% 8%;   --border: 240 4% 16%;
  --foreground: 0 0% 98%;    --muted-foreground: 240 5% 65%;
  --primary: 262 83% 66%;    --destructive: 0 72% 60%;   --radius: 0.625rem;
}
```

The video's `src/theme.ts`, same keys as the template, the product's values:

```ts
// values from the product's app/globals.css; the comment names each source token
export const C = {
  bg: '#09090B',      // --background  hsl(240 10% 4%) (the stage; lift it a step if it bands, see brand-and-assets)
  app: '#09090B',     // --background: the app's own surface
  panel: '#131316',   // --card        hsl(240 6% 8%)
  line: '#27272A',    // --border      hsl(240 4% 16%)
  text: '#FAFAFA',    // --foreground
  dim: '#A1A1AA',     // --muted-foreground
  accent: '#9560F0',  // --primary
  danger: '#E25050',  // --destructive
  // …and every other key the template's C has (sidebar, raised, hover, lineStrong, faint, accent2, ok, info),
  // each from the product's tokens or derived from the ones above
} as const;

export const PEOPLE_COLORS = ['#F5B83D', '#6EA8FE', '#5CC8A8', '#F07F6B'] as const; // the product's avatar palette, same order
export const R = { sm: 6, md: 10, lg: 14, xl: 20, xxl: 28, pill: 999 } as const;   // --radius 0.625rem = 10 px at a 16 px root
```

Rules that save time later:

- **Convert to hex, with a one-line Node script, not by eye.** Scenes add transparency with `alpha(C.accent, 0.2)` from `theme.ts`, which appends two hex digits and so only works on 6-digit hex. Keep the original value in a comment so a diff against the product stays easy.
- **Copy the product's own logic for identity colors.** If the app hashes a user's name to one of eight avatar colors, use the same palette and order, so "Maya" has the same color in the video as in the app. Color is identity: that person's avatar, cursor, selection and presence ring all share it.
- **Keep the product's mode.** A light-mode app stays light. It sits well on a dark `Backdrop` (a light panel on a dark stage reads instantly) or on a light one. Flipping it dark makes it look like a different product. If the marketing brand and the app differ (a dark site, a light app), keep both sets in `theme.ts`, named for where they are used, and let product components read only the app's.
- **Fonts go in `src/fonts.ts`.** Use `@remotion/google-fonts` when the product uses a Google font, or `loadFont` from `@remotion/fonts` with `staticFile()` for the product's own `.woff2` files (add that package at the same version as the template's `remotion`, and check the font's license allows video use; if unsure, ask the user or use the nearest Google font). A render that starts before the font loads silently uses a fallback, so check a still for the product's distinctive glyphs.
- **Icons are inline SVG.** Copy the path data of the 5–10 icons on screen into one small `icons.tsx` with a size and color prop. It adds no dependency, and strokes scale with the product. Lucide (ISC), Heroicons, Phosphor and Radix Icons (MIT) allow this. Check the license of anything else.

## 4. Structure src/product/ so scenes can compose it

The template's `src/product/` rebuilds its demo app (sidebar, note list, editor, command palette, share dialog, presence avatars) from theme tokens, and keeps each component's geometry next to it (`SIDEBAR.newNote`, `NOTELIST.row`, `EDITOR`, `shareGeometry()`, `todoCheckbox()`, `appPoint()`), which `src/scenes/How.tsx` uses to aim the cursor, the camera and the focus. When you replace it with the user's product, either keep that pattern or gather the geometry in one file, like this:

```
src/product/
├── layout.ts        # every size and position a camera, cursor, focus or callout aims at; one set per layout (wide, tall)
├── data.ts          # the fictional cast and content, and one fixed "now"
├── icons.tsx        # inline SVG paths copied from the product's icon set
├── AppShell.tsx     # the app's frame: sidebar + top bar + main area, composed from the parts below
├── Sidebar.tsx  NoteList.tsx  Editor.tsx  CommandPalette.tsx  ShareDialog.tsx  Avatars.tsx
└── index.ts         # re-exports
```

Three rules make this work.

**Components are views: props in, pixels out.** Every state the story needs is a prop: `hover`, `pressed`, `selected`, `query`, `open` (0→1), `insert` (0→1), `scroll` (px). Product components do not read the scene clock and hold no state. The scene owns time, so the same `NoteList` serves a 16:9 scene, a 9:16 scene, the loop and the cover still, each with its own timing, and a still can render any state without a clock. The one exception is purely ambient motion (a caret blink, a spinner, a live dot's pulse), which may read `useDrawnTime()` so a warped reel never makes it shiver.

**Build at the product's real CSS pixels, then scale the whole app once.** Row height 44, sidebar 248, body text 14: the numbers match the codebase, so porting a component is copying its CSS. One factor `k` per layout turns product pixels into frame pixels (a 1280-wide app at `k = 1.25` fills 1600 px of a 1920 frame). Readability is judged on final pixels, product px × `k` × camera scale (section 6).

**Every target comes from `layout.ts`.** The cursor's click point, a `Focus` rect, a `Camera` framing and a `Callout` anchor are computed from the same constants the components use to lay themselves out. Never type a coordinate you read off a still: it breaks the moment a label changes or the reel re-lays out. Do not measure the DOM (`getBoundingClientRect`, layout effects) either, because a measurement arrives a frame late and differs between render tabs. Use fixed row heights and explicit positions for anything that is a target. Flexbox is fine inside a component for things nobody aims at.

```ts
// src/product/layout.ts
import { BROWSER_BAR as BAR } from '../lib/devices';   // the Browser frame's top bar, 46 frame px (Window's is WINDOW_BAR, 40)
export { BAR };

export type Rect = { x: number; y: number; w: number; h: number };
export const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
export const ROW_H = 44;

const wide = {
  k: 1.25,                                   // product px → frame px: 1280 × 1.25 = 1600
  device: { x: 160, y: 180 },                // where the scene places the Browser, frame px (bottom edge at 1026)
  app: { w: 1280, h: 640 },                  // the app viewport, product px
  handoff: { x: 640, y: 420 },               // where the cursor rests at this scene's cuts (section 12)
  newNote: { x: 16, y: 14, w: 216, h: 32 },
  share: { x: 1168, y: 12, w: 96, h: 32 },
  dialog: { x: 400, y: 110, w: 480, h: 340 },
  row: (i: number): Rect => ({ x: 256, y: 64 + i * ROW_H, w: 304, h: ROW_H - 4 }),
};
// tall: the product's real mobile layout if it has one; otherwise the hero surface alone, cropped and enlarged.
// 390 × 2.2 = 858 px wide and 440 × 2.2 + BAR = 1014 px tall: inside the reel's safe zone (x 64–930, y 250–1470)
const tall: typeof wide = { ...wide, k: 2.2, device: { x: 64, y: 420 }, app: { w: 390, h: 440 },
  handoff: { x: 195, y: 300 }, share: { x: 290, y: 12, w: 88, h: 32 }, dialog: { x: 20, y: 90, w: 350, h: 300 },
  row: (i: number): Rect => ({ x: 8, y: 64 + i * ROW_H, w: 374, h: ROW_H - 4 }) };

export const LAYOUT = { wide, tall };
export type Layout = typeof wide;

/** A product-space point in frame px, for Camera keys (the camera wraps the whole device). */
export const toFrame = (L: Layout, p: { x: number; y: number }) =>
  ({ x: L.device.x + p.x * L.k, y: L.device.y + BAR + p.y * L.k });
```

The scene picks the layout with `useStage().portrait`, exactly as the real launch film kept a `wide` and a `tall` geometry per scene. The same cursor code then hits the right button in both cuts.

A product component, as a pure view:

```tsx
// src/product/NoteList.tsx
import { alpha, C, FONT, R } from '../theme';
import { CAST, type Note } from './data';
import { ROW_H } from './layout';

export function NoteList({ notes, selected, hover, insert = 1, scroll = 0 }: {
  notes: Note[]; selected?: string; hover?: string;
  insert?: number;  // 0→1: the first row opens in ("a new note appears")
  scroll?: number;  // product px scrolled
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ transform: `translateY(${-scroll}px)` }}>
        {notes.map((n, i) => {
          const open = i === 0 ? insert : 1;
          const who = CAST.find((p) => p.id === n.by)!;
          return (
            <div key={n.id} style={{ height: ROW_H * open, opacity: open, overflow: 'hidden', padding: '0 8px' }}>
              <div style={{ height: ROW_H - 4, display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px',
                borderRadius: R.md, fontFamily: FONT.ui, fontSize: 14, color: C.text,
                background: n.id === selected ? C.panel : n.id === hover ? alpha(C.text, 0.05) : 'transparent' }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: who.color }} />
                <span style={{ flex: 1 }}>{n.title}</span>
                <span style={{ color: C.dim, fontSize: 12 }}>{n.edited}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## 5. Fictional data that feels real

Viewers pause videos and read the rows. Lorem ipsum, "Test 1" and "John Doe" say "mockup" at once. Real user data is never acceptable: no customer names, emails, messages, avatars or figures from production, and no teammate's name or face without their consent. A video is public and permanent.

- **Names.** Short (4–6 letters fits tags and avatars), varied in origin, plausible, never a celebrity or a joke. First name plus last initial or a short surname. Keep one cast across every cut so "Maya's note" stays Maya's from the showcase to the reel.
- **Frame for the real audience.** A team product needs a visible team: several avatars, presence, "Maya and 3 others". The real launch film first made a team product look single-user; the founder caught it and every label changed ("alice's agent", not "alice"). Check who the product is for before writing a single row.
- **Companies, domains, phone numbers, cards.** Invent a company name, then do a quick web search so it is not a real company in the same space. Use reserved domains for emails and URLs of the fictional customer: `maya@fernway.example`, `docs.example.com` (RFC 2606 reserves `.example`, `.test` and `example.com/.net/.org`). North American phone numbers: 555-0100 to 555-0199, the range reserved for fiction. Card numbers: Stripe's test card 4242 4242 4242 4242. The product's own name and domain are fine, it is their video.
- **Content.** Write the notes, messages and task names in the product's domain and in the story's voice: "Launch checklist", "Customer interviews: week 3", "Pricing page copy, v2". Rows should hint at a working team, not at the video ("Amazing feature!").
- **Numbers.** Plausible and uneven (1,284, not 1,000; $64.20, not $50.00). Never fake proof: invented usage counters, "10,000 teams" or real customers' logos imply things that are not true. A metrics dashboard with clearly fictional sample data inside a fictional workspace is fine; presenting it as real customer results is not.
- **Time.** Fix one story clock in `data.ts` (`NOW = '10:42'`) and age everything relative to it: the note edited in this scene says "just now", the others "12 min ago", "yesterday". Pick working hours, not 00:00. Phone status bars conventionally show 9:41, full signal and full battery.
- **Avatars.** Initials on the person's identity color is the default: clean, license-free, and readable at small sizes. Simple illustrated avatars are fine. Avoid photos of real people. Avoid AI-generated faces by default, since they can resemble real people and look uncanny when a camera pushes in.
- **Density.** 5–8 rows in a visible list reads as "in use"; 1–2 reads as empty; 20 tiny rows reads as noise. If you need many rows (a scroll), generate them deterministically from short lists with `rand(seed)`, never `Math.random()`.

```ts
// src/product/data.ts: a fictional team. Nothing here comes from real users.
import { PEOPLE_COLORS } from '../theme';

export const NOW = '10:42'; // the story's clock; never Date.now()
export const TEAM = { name: 'Fernway', domain: 'fernway.example' };
export const CAST = [
  { id: 'maya', name: 'Maya Chen', color: PEOPLE_COLORS[0] },
  { id: 'jonas', name: 'Jonas Weber', color: PEOPLE_COLORS[1] },
  { id: 'ade', name: 'Ade Okafor', color: PEOPLE_COLORS[2] },
  { id: 'priya', name: 'Priya Nair', color: PEOPLE_COLORS[3] },
] as const;

export type Note = { id: string; title: string; by: (typeof CAST)[number]['id']; edited: string };
export const NOTES: Note[] = [
  { id: 'launch', title: 'Launch checklist', by: 'maya', edited: 'just now' },
  { id: 'interviews', title: 'Customer interviews: week 3', by: 'ade', edited: '12 min ago' },
  { id: 'pricing', title: 'Pricing page copy, v2', by: 'jonas', edited: '1 h ago' },
  { id: 'retro', title: 'Sprint 14 retro', by: 'priya', edited: 'yesterday' },
  { id: 'onboarding', title: 'Onboarding emails', by: 'maya', edited: 'Mon' },
  { id: 'hiring', title: 'Design hire: interview loop', by: 'ade', edited: 'Mon' },
];
```

## 6. Device frames and scale

`src/lib/devices.tsx` has three frames, all theme-colored and free of real Apple artwork:

- `Browser({ url, width, height, children })` for web apps. Put the product's real app URL in the bar, with a fictional workspace in the path (`app.yourproduct.com/fernway/launch-checklist`). It also teaches viewers the URL.
- `Window({ title, width, height, children })` for desktop apps, terminals and editors.
- `Phone({ width, children })` for mobile apps. Build the screen at the phone's point size (about 390 × 844) and scale it; keep content clear of the status bar (about 50 pt) and the home indicator (about 34 pt).

Do not put a desktop web app in a `Phone` frame to make a vertical cut. If the product has no mobile layout, that is a lie. For 9:16, either show the product's real responsive layout, or drop the frame and float the hero surface (the editor card, the palette, the dialog) as a panel at a large `k`. The browser chrome costs about 10% of the width, and the reel needs every pixel.

Sizes that work:

| format | device | frame size | product `k` |
|---|---|---|---|
| showcase 1920×1080 | `Browser` 1440–1600 px wide, centered, room for a caption line above or below | 1600 × 852 | 1.1–1.25 for a 1280-wide app |
| reel 1080×1920 | frameless panel or `Phone`, inside the safe zone (x 64–930, y 250–1470) | up to 866 wide | 2.0–2.4 for a 360–430-wide crop |
| story 1080×1920 | the same, with the story's safe zone (x 64–1016, y 250–1540) and an empty spot for the link sticker | up to 952 wide | 2.0–2.4 |
| square / portrait | `Browser` or panel | 960–1000 wide | 1.5–2.0 on a crop |
| loop 1600×1000 | `Browser` or `Window` filling most of the frame | 1400–1500 wide | 1.1–1.2 |

Readability is judged on the final frame. Any text the viewer must read should be at least 24 px in the final 1920×1080 frame and at least 32 px in a 1080×1920 reel, the floors in [captions-and-type](captions-and-type.md) §2 (a label the caption points at is better at 28–32 px and 36–40 px). Everything else (other rows, the sidebar) can be smaller, since it is texture, not content. A 14 px product label at `k = 1.25` is 17.5 px, so the showcase needs a `Camera` read-in (1.4–1.8×) on the thing the caption is about. The same label at `k = 2.2` in the reel is 31 px, just under the floor, so the reel crops tighter or pushes in too. Camera scale is covered in [motion-language](motion-language.md) §9: a drift adds 2–6% over a shot, a lean-in goes to 1.08–1.2, and a "read this" framing is as tight as the text needs.

Give the hero device's first entrance a little depth, once per film (tilted back 10–14° and rising 120–180 px, settling to flat over about 0.8 s with `EASE`), and have every later window enter flat, with a translate and a fade. Keep it flat while anything is being read. Text on a tilted plane is harder to read and shimmers. A large soft shadow (`0 60px 140px -50px rgba(0,0,0,0.9)`) lifts the frame off the `Backdrop` without a visible edge.

## 7. The states the story needs

Before animating a scene, write its state table: which state is on screen when, each change keyed to a mark in `cuts.json`. Every state is a prop value, so the table maps straight to code.

| state | what it shows | how long on screen | notes |
|---|---|---|---|
| empty | the product's real empty-state copy and illustration | 1–2 s | a strong "before" frame |
| hover | the target's hover color, as the product draws it | from the cursor's arrival to just after the click | makes the click legible |
| pressed | darker or 0.97 scale for about 0.1 s | 0.08–0.12 s | lands with the `Cursor` press and the `click()` sound |
| typing | partial text, caret, field focus ring | at the reading rate (section 9) | the focus ring appears on the click, before the first key |
| loading | skeleton or spinner | 0.3–0.6 s | real latency reads as lag in video; only show it long if slowness is the problem being told |
| success | the product's toast, check or new row | hold ≥ 1 s | one `pop()` overshoot at most, a `chime()` or `pop()` sound on the mark |
| conflict / error | the product's real error copy, danger color | hold until the caption about it has been read | a short shake: a decaying sine, about 16 px, gone in about 0.25 s |
| populated | the list with 5–8 rows | as needed | the "after" frame |

Animate the change between states the way the product does: UI micro-interactions at product speed (0.12–0.3 s), because that is how the app feels in the hand. Save the slow, cinematic motion (0.6–1.2 s) for the camera, the device's entrance and the captions. A dialog that takes 0.8 s to open reads as a slow app.

Numbers that change inside the UI (a balance, a count of people, a progress figure) roll with `Counter({ from, to, start, dur, format })` instead of jumping, formatted exactly as the product formats them.

Effects follow their cause. Put the result 0.08–0.15 s after the click, not on the same frame (it reads as pre-empting the click) and not more than about 0.3 s later (it reads as lag, unless it is a real loading moment).

Rebuilt UI can show states at once, so use it: two people's screens side by side on one clock (Maya types, Jonas sees it appear), a before/after split, or three states of one card in a feature row.

## 8. Cursor choreography

`Cursor({ path, clicks, label, color })` glides along eased curves between `{ t, x, y }` waypoints (scene seconds) and presses and releases at each time in `clicks`. Your job is the route, the timing and the UI's response.

**Put the cursor in product space.** Render `Cursor` inside the scaled product container, next to the components, so its coordinates are product pixels from `layout.ts`, it scales with `k` (bigger in the reel, where phone viewers need it), and it zooms with the `Camera` the way a real pointer does in a screen recording. Put `Focus` and `Callout` there too. The `Camera` wraps the whole device, so its keys are in frame pixels via `toFrame()`.

**Aim like a person.** People click near the label, not the geometric center: offset the target 6–12 px toward the start of the label, with a small seeded variation (`rand(seed)`) so repeated clicks do not land on identical pixels.

**Travel time grows with distance.** Start from `0.25 + distance / 1800` seconds (distance in frame px), clamped to 0.3–0.9 s in a showcase; reels can run about 25% faster. A fixed 0.5 s for every move makes short hops sluggish and long ones frantic.

**One waypoint per place the hand goes.** `Cursor` already curves and eases each segment, so give it a waypoint where the hand starts, where it pauses (hovering a menu item, reading a row) and where it clicks. Extra waypoints mid-flight make it hesitate.

**Hover, then click, then result.** Arrive, dwell 0.25–0.4 s with the hover state visible, click, and show the result 0.1 s later. Turn hover on 0.05–0.1 s before the arrival waypoint, because the eased approach enters the button's rect slightly before it stops. The dwell gives the viewer's eye time to catch up with the pointer. Without it, a click is invisible.

**The cursor never teleports.** It enters from where it was in the previous scene (section 12) or from the edge of the viewport, and between clicks it travels. During a hold longer than about 1.2 s, either give it a small drift (one extra waypoint 6–10 px away, over the hold) or fade it out over 0.2 s by wrapping it in a div with opacity, as screen-recording tools hide an idle pointer. A pointer frozen for 3 s looks like a screenshot.

**Labels are for people.** In a multiplayer product, give each person's cursor their `label` and identity `color`. A single-user demo gets no label.

**Sound follows the same marks.** `sound/score.mjs` places a `click()` on the same mark the `Cursor` uses. A scene with a cue sheet (every demo scene has one) pans it to where the click happens on screen; a scene without one is scored by the naming rules, which click on every mark whose name starts with `click`, panned a little at random. To pan your own scene's clicks, give it a sheet ([sound-design](sound-design.md) §4 and §5).

A complete scene, with the marks in `cuts.json`:

```jsonc
{ "id": "share", "seconds": 6, "marks": { "arrive": 1.55, "click": 1.9, "typeStart": 2.5, "sent": 4.3 } }
```

```tsx
// src/scenes/Share.tsx
import { AbsoluteFill } from 'remotion';
import { useMarks, useStage, useTime } from '../lib/time';
import { clamp, pop, rand } from '../lib/anim';
import { Captions } from '../lib/text';
import { Backdrop, Camera, Cursor } from '../lib/ui';
import { Browser } from '../lib/devices';
import { AppShell } from '../product';           // your product's shell, as in section 4
import { NOTES } from '../product/data';
import { BAR, LAYOUT, center, toFrame } from '../product/layout';

export function Share() {
  const t = useTime();
  const m = useMarks();
  const { W, H, portrait } = useStage();
  const L = portrait ? LAYOUT.tall : LAYOUT.wide;

  // the route: from where the last scene left the cursor to the Share label, timed by distance
  const btn = center(L.share);
  const aim = { x: btn.x - 8 - 4 * rand(11), y: btn.y + 2 };          // near the label, not dead center
  const dist = Math.hypot(aim.x - L.handoff.x, aim.y - L.handoff.y) * L.k;  // frame px
  const leave = m.arrive - clamp(0.25 + dist / 1800, 0.3, 0.9);

  // the UI's response, all from the same marks the sound uses
  const hover = t >= m.arrive - 0.08 && t < m.click + 0.2;
  const pressed = t >= m.click && t < m.click + 0.1;
  const dialog = pop(t, m.click + 0.1);                               // the effect follows the click by 0.1 s
  const cam = toFrame(L, center(L.dialog));

  return (
    <AbsoluteFill>
      <Backdrop />
      <Camera keys={[
        { t: 0, x: W / 2, y: H / 2, scale: 1 },
        { t: m.arrive - 0.3, x: W / 2, y: H / 2, scale: 1 },
        { t: m.click + 0.7, x: cam.x, y: cam.y, scale: 1.4 },          // lean in on the dialog as it opens
      ]}>
        <div style={{ position: 'absolute', left: L.device.x, top: L.device.y }}>
          <Browser url="lumen.example/fernway/launch-checklist" width={L.app.w * L.k} height={L.app.h * L.k + BAR}>
            <div style={{ position: 'relative', width: L.app.w, height: L.app.h, transform: `scale(${L.k})`, transformOrigin: '0 0' }}>
              <AppShell notes={NOTES} selected="launch" shareHover={hover} sharePressed={pressed} dialog={dialog} />
              <Cursor path={[{ t: leave, ...L.handoff }, { t: m.arrive, ...aim }]} clicks={[m.click]} />
            </div>
          </Browser>
        </div>
      </Camera>
      <Captions variant={portrait ? 'punch' : 'calm'} cues={[{ at: 0.3, text: 'share a note in one click.' }]} />
    </AbsoluteFill>
  );
}
```

## 9. Typing

`Typed({ text, start, cps, caret })` types with deterministic human jitter. Tie it to two marks: `start` is the `typeStart` mark and `cps` is `text.length ÷ (typeEnd − typeStart)`, so the keys the score places between those marks land on the characters.

- **Rate.** 12–18 cps for a person typing (real people type slower, but nobody wants to watch that), 25–40 cps for machine output, an AI answer or a paste that streams.
- **Length.** Type 10–25 characters live. Longer input should autocomplete, paste or cut away after the first words. Nobody watches 60 characters appear one by one.
- **Order.** The cursor clicks the field, the focus ring and caret appear, then after 0.2–0.4 s the first key. macOS hides the mouse pointer while you type, so fade the `Cursor` out on the first key and back in when it moves again.
- **Sound.** `sound/score.mjs` places one `key()` per character between each `*typeStart` and `*typeEnd` mark pair (`k.typing()` in a scene's cue sheet, or the naming rules for a scene without one). Add the typed text to `TYPED` at the top of that file (keyed `cut/scene/markName`, for example `'showcase/how/paletteTypeStart': 'share'`) and each key lands on the moment its character appears, with the space bar on spaces. See [sound-design](sound-design.md) §4.

When other UI depends on the count (a command palette filtering its results, a character counter, a button enabling once the field is not empty), count the characters with the same function `Typed` uses, `typedTimes(text, start, cps)` from `src/lib/text.tsx`, so the text, the filter and the key sounds cannot disagree. The template's `How` scene filters its palette this way:

```tsx
import { Typed, typedTimes } from '../lib/text';

const query = 'share';
const cps = query.length / (m.paletteTypeEnd - m.paletteTypeStart);
const n = typedTimes(query, m.paletteTypeStart, cps).filter((x) => x <= t).length;   // characters showing now
const items = n >= 2 ? SHARE_RESULTS : ALL_RESULTS;                                  // the palette filters on them
// in the palette: <Typed text={query} start={m.paletteTypeStart} cps={cps} />
```

`sound/score.mjs` carries an identical port of `typedTimes` for the keys. `at()` takes scene seconds and inverts the warp, so the keys stay on the characters in a warped reel too.

## 10. Scrolling lists

Scroll is a `translateY` on the list's content inside an `overflow: hidden` viewport, computed from time. Model it as flings: each one starts fast and settles, like a trackpad, over 0.6–1.0 s with `EASINGS.out`. A constant-speed scroll looks like end credits.

```ts
// src/product/scroll.ts
import { EASINGS, prog } from '../lib/anim';
export type Fling = { at: number; by: number; dur?: number };  // scene seconds, product px
export const scrollY = (t: number, flings: Fling[]) =>
  flings.reduce((y, f) => y + f.by * prog(t, f.at, f.dur ?? 0.7, EASINGS.out), 0);
```

The same `scrollY` feeds the list (`<NoteList scroll={scrollY(t, FLINGS)} />`) and every target inside it. A cursor aiming at row 9 aims at `L.row(9).y - scrollY(m.arrive, FLINGS)`. Let the fling finish before the cursor arrives, since a target that is still moving is hard to hit and hard to watch.

- **Speed.** Fast motion strobes, because Remotion renders sharp frames with no motion blur. Keep text moving under about 40 px per frame at 30 fps (about 1200 px/s) and under about 50 px per frame at 60 fps. Past that, cut instead of scrolling.
- **Stop to read.** Stop where the caption points, and hold the row at least as long as the caption's reading time.
- **Many rows.** For more than about 100 rows, render only the visible range: `first = Math.floor(scroll / ROW_H)`, plus one screenful.
- **Scrollbar.** Show one only if the product does. An overlay scrollbar appears while scrolling and fades about 0.6 s after it stops.

## 11. Modals, menus and command palettes

- **Render overlays inside the product tree, never through a portal.** Radix, Headless UI and most dialog libraries portal to `document.body`, which escapes the `Browser` frame, the `k` scale and the `Camera`. The rebuilt `ShareDialog` is a child of `AppShell` with `position: absolute`.
- **Opening.** Drive everything from one `open` value (0→1, from `pop()` without bounce, about 0.25 s). The scrim goes to 0.4–0.5 black; the dialog goes from opacity 0, scale 0.96 and 8 px low to rest. Closing takes about 0.15 s, faster than opening, as in real apps.
- **Origin.** A menu or popover grows from the button that opened it (set `transformOrigin` to the trigger's position from `layout.ts`). A dialog opens centered.
- **Focus.** A dialog's own scrim already directs attention. Use `Focus` for a region of a busy screen with no overlay of its own.
- **Command palette.** Show the shortcut as a key chip (a `Badge` with "⌘K" or "Ctrl K", matching the product's platform) that pops 0.15 s before the palette opens, since a keystroke has no visible cause otherwise. The query types with `Typed`, and the results filter on the characters actually showing, counted with `typedTimes` (section 9): `items.filter((x) => match(x, query.slice(0, n)))`. The first result is highlighted; an arrow-key move steps the highlight at a mark (optionally with its own key chip); Enter closes the palette in 0.15 s and the action's result appears 0.1 s after.
- **Toasts.** If the product has its own toast, rebuild it in `src/product/` so it looks like the product. The template's `Toast({ text, start, end })` is for products that have none.

## 12. Continuity between scenes

Scenes join over `cross` seconds (0.1 for a cut that hides a one-frame pop, a few tenths for a dissolve; see `cross` in `cuts.json`), and during that time both scenes are drawn on top of each other. Anything that exists on both sides of the cut must be still and in the same place at the cut, or it shows as a ghosted double.

- **Match cuts.** If scene A ends with the palette open and scene B starts with it, put the palette's rect in `layout.ts` and render it at `open = 1` in both. The crossfade then changes the world around it while it stays solid. Keep the device frame at the same position and size across consecutive scenes unless moving it is the point.
- **Move within a scene, cut when still.** A card flying from the list into the editor belongs inside one scene, ideally as a layout morph, where the row's box grows into the editor in one shot ([motion-language](motion-language.md) §8). Across a crossfade both halves of the flight would be visible at once.
- **Hand the cursor over.** Give each layout in `layout.ts` a `handoff` point. Scene A's last waypoint and scene B's first waypoint both use it, and the cursor is still there at the cut. Otherwise hide the cursor for the cut.
- **Keep the data consistent.** The same note title, the same people, and timestamps that move forward ("just now" in scene 3 must not become "2 h ago" in scene 4).
- **Re-layout, same timing.** The 9:16 cut uses the same components with `LAYOUT.tall`. Keep the marks the same, so the same soundtrack fits both cuts. When one cut needs different words (shorter captions, a bigger label), branch on `useCut()` inside the scene, not inside the product components.

## 13. Everything a pure function of time

Remotion renders frames out of order, across several browser tabs that share no state, and screenshots each one. A component must draw the same pixels every time it is asked for a given moment. Anything driven by wall-clock time flickers or drifts. This is also what lets `sound/score.mjs` recompute the same "random" layout the picture used.

| do not | do instead |
|---|---|
| CSS `transition`, `@keyframes`, `animation` | values computed from `useTime()` with `prog`, `pop`, `lerp` |
| `:hover`, `:focus`, `:active` styles | `hover`, `focused`, `pressed` props set from marks |
| `Math.random()` | `rand(seed)` |
| `Date.now()`, `new Date()`, relative-time helpers that read the clock | `NOW` and fixed strings in `data.ts` |
| `useState` / `useEffect` / timers driving motion | derive every state from `t` and the marks |
| `fetch`, data stores (Redux, Zustand, React Query), the router | static arrays in `data.ts` |
| measuring the DOM in an effect | constants in `layout.ts` |
| portals to `document.body` | overlays inside the product tree |
| `useCurrentFrame()` in scenes | `useTime()` (follows the warp) or `useDrawnTime()` (ambient loops) |
| animation libraries that run their own clock (Framer Motion, GSAP timelines, Lottie in autoplay) | Remotion-driven values |

Importing the product's real components directly is tempting and usually costs more than it saves. They pull in providers, routing, data fetching, i18n, CSS transitions and a build setup (Tailwind, CSS modules) the video package does not have. Copy the markup and the styles of the view layer, translate class names into inline styles on theme tokens (about ten minutes per component), and leave the behavior behind.

A quick determinism check: render the same moment twice and compare the two images. Both runs write `out/stills/showcase-3.20.png`, so copy the first aside: `node scripts/stills.mjs showcase --at 3.2`, copy the PNG to `out/first.png`, run it again, and compare. Any difference means something is reading a clock or a random number.

## 14. Real screen recordings

When recording is the right call (section 1), prepare the take like a set:

- **Record at 2×.** A Retina Mac records at 2× natively. On Windows or Linux, set display scaling to 200% or start Chrome with `--force-device-scale-factor=2`. Size the window to the frame's shape: about 1440 × 900 CSS px (2880 × 1800 pixels) for a 16:9 `Browser`. The extra pixels are what let a `Camera` push-in stay sharp.
- **Constant frame rate, at the cut's fps.** Screen recorders often write variable frame rate, which stutters when a renderer steps through it frame by frame. Convert first, with Remotion's bundled ffmpeg: `npx remotion ffmpeg -i take.mov -r 60 -c:v libx264 -crf 12 -pix_fmt yuv420p public/rec/take.mp4` (`-r 30` for the 30 fps cuts).
- **Hide private data before recording, not after.** Use a demo account seeded with the fictional data from section 5. Close other tabs, hide the bookmarks bar and extensions, turn on do-not-disturb, clear the address bar's history suggestions, and check tab titles, avatars and any API keys or tokens on screen. Blur and pixelation are not reliable redaction. If something slipped through, re-record it or cover it with a solid rebuilt patch.
- **Hide the recorder's pointer** and draw `Cursor` on top, matched to the recording. Find the frame where the UI reacts to each click (render stills around it) and set the click 0.1 s before. A real pointer is jittery and small. A drawn one is smooth, sized for the format and on the same marks as the sound.
- **Keep recordings out of git.** Put them in `public/rec/` and add that folder to `.gitignore`: they are large, and they may still show something private.

```tsx
import { OffthreadVideo, staticFile } from 'remotion';
import { useStage } from '../lib/time';
import { Browser, BROWSER_BAR } from '../lib/devices';

export function EditorTake() {
  const { fps } = useStage();
  return (
    // a 1440 × 900 take fills the viewport 1:1 (plus the bar), inside the showcase's safe zone
    <Browser url="app.example.com/canvas" width={1440} height={900 + BROWSER_BAR}>
      {/* trimBefore is in frames at the composition's fps: skip the first 3.2 s of the take */}
      <OffthreadVideo src={staticFile('rec/canvas-2x.mp4')} trimBefore={Math.round(3.2 * fps)} muted
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </Browser>
  );
}
```

`<OffthreadVideo>` comes with `remotion` itself, so it needs no new package. Remotion's docs now also point to `<Video>` from `@remotion/media` for new projects. Use it if the user's project already has that package. A recording plays on real time: a scene `warp` does not reach inside it. So do not warp scenes that contain recordings; speed a take up with `playbackRate` (for example 1.5) or cut it into shorter pieces. Mute the take's audio (`muted`) and let the sound engine make the clicks and keys, so they share the mix and the marks.

## 15. Checks and common failures

Before showing the user anything, render stills at the marks and read them as a contact sheet:

```bash
node scripts/stills.mjs showcase --marks        # a still at every mark
node scripts/stills.mjs reel --marks --safe     # the reel, with its safe zones drawn
node scripts/sheet.mjs reel                     # out/sheet-reel.png, tiles with gaps
node scripts/stills.mjs showcase --at 14.9,15.0 # frames around one click (cut seconds): is the tip inside the button?
```

Check that:

- at every click mark, the cursor tip is inside the target in both layouts, and the hover state is visible;
- text is crisp at the camera's tightest framing and at least 24 px (showcase) or 32 px (reel) where it must be read;
- the product's font is showing, not a fallback (compare the `g`, `a`, `R`, `1` glyphs);
- no real names, emails or photos appear, and no lorem ipsum or "Test" rows;
- nothing important sits outside the safe zone in the reel;
- things that cross a cut are still and in the same place on both sides.

| symptom | cause | fix |
|---|---|---|
| the click lands beside the button in the reel only | the target was typed as numbers for the wide layout | compute targets from `LAYOUT[portrait ? 'tall' : 'wide']` |
| text goes soft during a push-in | a screenshot asset, or `will-change: transform` / a `filter` on a zoomed parent freezing its raster | rebuild the asset as components; remove `will-change` and filters from zoomed containers |
| a dialog appears outside the device, unscaled | it portals to `document.body` | render it inside the product tree |
| a hover or fade flickers on random frames | a CSS `:hover`, `transition` or `@keyframes` | state props computed from time |
| the font is slightly wrong | a fallback rendered before the font loaded | load it in `src/fonts.ts`; check glyphs on a still |
| palette results do not match the typed query | `Typed` and the filter count characters differently | count with `typedTimes`, the function `Typed` uses (section 9) |
| keystroke sounds drift from the characters | `Typed`'s `cps` isn't text length ÷ (typeEnd − typeStart), or the text in `TYPED` (`sound/score.mjs`) differs from the scene's | tie `cps` to the marks; copy the exact string into `TYPED` |
| a spinner or pulse shivers in the reel | ambient motion on warped time | `useDrawnTime()` for ambient loops |
| a recording drifts against captions in the reel | warps do not apply inside `<OffthreadVideo>` | no warp on that scene; `playbackRate` or shorter takes |
| a ghosted double image at a cut | an element moved or was still moving at the crossfade | match rects across the cut; move within a scene |
| the product looks single-user | the data shows one person | a visible team: avatars, presence, names on cursors |

## Sources

- Remotion, flickering and why frames must not depend on render order or randomness: https://www.remotion.dev/docs/flickering
- Remotion, don't use CSS animations: https://www.remotion.dev/docs/troubleshooting/css-animations
- Remotion, `<OffthreadVideo>` props (`trimBefore` in frames, `playbackRate`, `muted`) and the note on `<Video>` from `@remotion/media`: https://www.remotion.dev/docs/offthreadvideo
- RFC 2606, reserved top-level and example domains: https://www.rfc-editor.org/rfc/rfc2606
- 555-0100 to 555-0199 reserved for fictional use: https://en.wikipedia.org/wiki/555_(North_American_Numbering_Plan)
- Stripe test card numbers: https://docs.stripe.com/testing
