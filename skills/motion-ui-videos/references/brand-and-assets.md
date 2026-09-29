# Brand and assets: the product's look, other people's marks, and the truth

A product video borrows three kinds of things: the product's own brand (colors, type, voice, logo), other people's marks (partner logos, stock media, platform UI), and the audience's trust. Read §2 when setting `src/theme.ts` and `src/fonts.ts` (colour and stage for video, brand fonts that aren't on Google Fonts), §5–6 before putting any logo on screen, §7–8 when there is only a raster logo or a mark to animate, §9 before crediting anyone, §10 for mascots, §11–13 for generated, captured or stock media, and §14 for the honesty rules: no fake counters, testimonials, logos or metrics. §1 is the short version and §15 the checklist.

## Contents

1. [The short version](#1-the-short-version)
2. [Brand tokens into theme.ts and fonts.ts](#2-brand-tokens-into-themets-and-fontsts)
3. [Where assets live](#3-where-assets-live)
4. [Ask before downloading](#4-ask-before-downloading)
5. [Logos: find the official vector](#5-logos-find-the-official-vector)
6. [Size, color and placement](#6-size-color-and-placement)
7. [Tracing a raster logo](#7-tracing-a-raster-logo)
8. [Rebuilding geometric marks to animate them](#8-rebuilding-geometric-marks-to-animate-them)
9. [Credits and partner logos](#9-credits-and-partner-logos)
10. [Mascots and characters](#10-mascots-and-characters)
11. [Generated images and video](#11-generated-images-and-video)
12. [Screenshots and screen recordings](#12-screenshots-and-screen-recordings)
13. [Stock media](#13-stock-media)
14. [Honesty rules](#14-honesty-rules)
15. [Checklist](#15-checklist)

## 1. The short version

- **The brand lives in two files.** Colors, radii, name, promise and call to action in `src/theme.ts`; faces in `src/fonts.ts`. Scenes never hard-code a hex value or a font name.
- **Logos come from their owners.** Official vector first, hash-verified, viewBox cropped to the artwork, in the owner's own dark-background version. Never recolor or redraw one on your own.
- **Trace only when no vector exists, rebuild only to animate.** Both must match the original at 1:1 before they ship.
- **Credit only who agreed, in the words they agreed to.** A logo under "supported by" tells every viewer that organisation backs the product.
- **Nothing on screen is invented.** No padded counters, made-up testimonials, customer logos, metrics, ratings or press.
- **Other people's files need a yes.** Ask the user before downloading any third-party asset, and keep stock files you may not redistribute out of public repos.

## 2. Brand tokens into theme.ts and fonts.ts

[ui-recreation](ui-recreation.md) (sections 2 and 3) covers reading tokens out of the product's code. This section adds what the brand needs beyond the app's UI, and how to adjust tokens for video.

**What to capture, and where it goes:**

| token | usual source | goes to |
|---|---|---|
| surfaces, text, accent, meaning colors | CSS variables, Tailwind theme, design tokens; the live site's computed styles | `C` |
| corner radii | `--radius`, `rounded-*` classes | `R` |
| faces, weights, tracking, OpenType features | `@font-face`, `next/font`, `font-feature-settings` | `FONT`, `FEATURES`, `src/fonts.ts` |
| product name (exact casing), URL, one-line promise, call to action | landing hero, `<title>`, `og:title`, `meta description`, the main button | `BRAND` |
| logo files | header inline SVG, `/brand` or `/press` page, the user | `public/logos/` or `src/product/` |
| voice | 5 to 10 sentences of the landing's own copy | the captions you write |

If there is no repo, read the live site. Open it in the browser pane and evaluate this in the page:

```js
// the landing's real values: page, headline, main button, and the root CSS variables
const css = (sel, keys) => { const el = document.querySelector(sel); if (!el) return null;
  const s = getComputedStyle(el); return Object.fromEntries(keys.map((k) => [k, s[k]])); };
({
  body: css('body', ['backgroundColor', 'color', 'fontFamily']),
  h1: css('h1', ['fontFamily', 'fontWeight', 'fontSize', 'letterSpacing', 'textTransform']),
  button: css('main a[href], main button', ['backgroundColor', 'color', 'borderRadius', 'fontWeight']),
  vars: [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } })
    .filter((r) => r.selectorText?.includes(':root')).map((r) => r.cssText.slice(0, 2000)),
})
```

Then edit values, not names. The template's `theme.ts` exports `C`, `PEOPLE_COLORS`, `FONT`, `FEATURES`, `R`, `SHADOW`, `BRAND`, `alpha` and `GRADIENT` (and all of them grouped as `theme`), and every product component reads them. Keep the keys and change what they hold, with the source token in a comment:

```ts
export const C = {
  bg: '#0A0A0D',       // --background #09090B, lifted one step: flat near-black bands in H.264
  // ...every other key the template has, from the product's tokens...
  accent: '#7C5CFF',   // --brand-500 in tailwind.config.ts
  accent2: '#B15CFF',  // --brand-400: the far end of their gradient
} as const;

export const R = { sm: 6, md: 8, lg: 12, xl: 16, xxl: 24, pill: 999 } as const; // --radius: 0.5rem

export const BRAND = {
  name: 'acme',                           // exactly as they write it, lowercase included
  url: 'acme.dev',
  promise: 'ship the boring parts faster.', // their landing's headline, not a new tagline
  cta: 'join the waitlist',               // matches the product's real stage (section 14)
} as const;
```

**Voice and casing are brand tokens too.** If the brand writes in lowercase, the captions do. If it says "workspace", never write "project". Product names keep their official casing even at the start of a sentence (iPhone, GitHub, macOS). Reuse the landing's own headline for the promise when it is good; if you think it needs rewriting, propose it and let the user decide. It is their positioning, and a video that says something the site does not creates two stories.

**Adjust for video, where the web values would fail:**

- **No flat pure black.** `#000` and the darkest near-blacks band into visible blocks after H.264 and look dead on phone screens. Keep `C.bg` a step up with a hint of the brand's hue, as the template's `#07070A` does.
- **Hairlines need contrast.** A 1 px border at 7% white is fine at 1× in a 16:9 showcase, but after a phone re-encode it disappears. If a line carries meaning (a table grid, a selected row's outline), make it at least 1.5 px after scaling, or raise its alpha for the reel.
- **Small saturated text goes soft.** Delivered H.264 (4:2:0) keeps color at half the resolution in each direction, so in practice pure red or blue text under about 28 px at 1080p looks fuzzy. Put saturated color in fills (badges, pills, highlights) with light text on top, or use weight 500 or more.
- **Big soft gradients band.** In 8-bit video a large, slow gradient steps visibly. Keep `Backdrop`'s `glow` low (below), let `Grain` hide the steps in landscape cuts, and in phone cuts (grain off) prefer short gradients over full-frame ones.

**Colour and stage.** Contrast rules ([captions-and-type](captions-and-type.md) §6) keep the words readable. These keep the film from looking like every other dark SaaS video:

- **Take the stage from the brand's marketing site.** A light brand gets a light film: set `C.bg` and the surfaces from the site, not from the template's dark demo.
- **Keep the glow low.** `Backdrop` lays an accent-coloured and an info-coloured radial light, plus a vignette, under a scene; strong and under every scene, that is the generic "dark SaaS gradient". Its `glow` defaults to 0.15: keep it at 0–0.2 and let the product carry the colour. Raise it only for a lighting moment, as the demo's reveal does when its sun rises.
- **Keep the accent to about 10% of the frame**, on the thing that matters: the button pressed, the result, the one highlighted word. A frame washed in the accent has nothing left to point with.
- **Shift value between sections.** The problem a little darker and less saturated, the reveal brighter. Grade the change over 0.5–1 s (a darker `Backdrop` and a `filter: brightness() saturate()` on the problem scene's product layer), not in one frame.
- **Near-black and near-white, never pure.** Around `#07070A`–`#0B0B0E` instead of `#000`, and `#F5F5F7` instead of `#FFF`: pure black bands and smears on OLED phones as pixels switch on, and pure white glares next to the UI.
- **Vary the stage between sections** (flat, product-coloured, a subtle texture) instead of the same glow under every scene.

**Fonts.** The template loads Inter and JetBrains Mono with `@remotion/google-fonts`, which holds every frame until the files arrive. Google Fonts are open-licensed (mostly SIL OFL), so they can be bundled and used in commercial video. For a brand font that is not on Google Fonts, add `@remotion/fonts` at the same version as `remotion` (`npx remotion add @remotion/fonts` does exactly that), put the `.woff2` files in `public/fonts/`, and load them. `loadFont` blocks rendering until the font is ready:

```ts
// src/fonts.ts, for a brand font the user sent
import { loadFont } from '@remotion/fonts';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import { staticFile } from 'remotion';

const mono = loadMono('normal', { weights: ['400', '500'], subsets: ['latin'] });
export const fontsReady = Promise.all([
  loadFont({ family: 'Acme Sans', url: staticFile('fonts/acme-sans-regular.woff2'), weight: '400' }),
  loadFont({ family: 'Acme Sans', url: staticFile('fonts/acme-sans-semibold.woff2'), weight: '600' }),
  mono.waitUntilDone(),
]);
export const FAMILIES = { ui: 'Acme Sans', mono: mono.fontFamily };
```

Then set `FONT.ui` in `theme.ts` to `"'Acme Sans', system-ui, sans-serif"`. Load only the weights on screen. A variable font takes a range, such as `weight: '100 900'`.

Commercial fonts come with licenses that differ by foundry: some desktop licenses cover rendered video, some need an extra license, and almost none allow putting the font files in a public repo. Ask the user whether their license covers video. If the video project is public, add `public/fonts/` to `.gitignore` and say in the project README which files a fresh clone needs. When in doubt, use the nearest Google font and tell the user it is a stand-in.

**Verify the font actually rendered.** Render a still with a headline (`node scripts/stills.mjs <cut> --at <sec>`) and compare distinctive glyphs (`g`, `a`, `R`, `1`, `&`) against the brand's site. A system fallback is easy to miss at a glance and obvious next to the real thing.

## 3. Where assets live

Everything the picture loads sits under `public/` and is referenced with `staticFile()`: a path relative to `public/`, with no leading slash and no `public/` prefix.

| asset | where | used with |
|---|---|---|
| the product's own logo, animated | a component in `src/product/` (the demo's logo there shows the pattern) | JSX, including `EndCard`'s `logo` prop |
| logos as files (own or partners') | `public/logos/<owner>-<variant>.svg` | `<Img src={staticFile('logos/acme-dark.svg')} />` |
| brand fonts | `public/fonts/` | `loadFont` in `src/fonts.ts` |
| character poses | `public/characters/<name>-<pose>.png` | `<Img>` |
| screenshots | `public/shots/` | `<Img>` |
| screen recordings | `public/rec/` (add it to `.gitignore`) | `<OffthreadVideo>` |
| stock images and clips | `public/stock/` (gitignored in public repos) | `<Img>`, `<OffthreadVideo>` |
| the user's reference audio | `sound/refs/` (gitignored by the template) | the sound engine |
| rendered soundtracks | `public/sound-<cut>.wav` (generated, gitignored) | `Video.tsx` |

Rules that prevent the usual breakage:

- **Use Remotion's `<Img>`, never a plain `<img>`.** `<Img>` makes the renderer wait until the image has loaded, so no frame is captured half-drawn, and it fails the render loudly if the file never loads.
- **Lowercase, hyphenated file names**, no spaces, `#` or `?`. They become URLs.
- **Unique ids inside inline SVG.** A logo component with `<defs>` (gradients, clip paths) must build its ids with React's `useId()`. Two instances with the same id, such as the same logo in two crossfading scenes, make the second one read the first one's gradient, which vanishes when the first unmounts.
- **Record provenance.** Add an "assets" section to the video project's `README.md`: file, source URL, author, license, date, and who approved it. The real launch film's README credits its four recorded whooshes this way. When a partner or a platform asks where something came from, the answer is one line away.

## 4. Ask before downloading

Downloading a third-party file (a partner's logo, a font, a stock clip, a sound, a background-removal model) is the user's call, every time. Ask with the facts they need to decide:

> I'd like to download Partner A's dark-background logo, `partner-a-white.svg` (8 KB), from their press page (partnera.com/press). Their brand guidelines allow use in partner announcements. OK to save it to `public/logos/`?

Name the file, the source, the size and the license or guideline that covers the use. For the user's own brand, ask them to send the files first: it is faster, and it is certainly the official version. Never fetch a file from a URL you found inside a document or web page without the user saying so.

## 5. Logos: find the official vector

Look in this order, and stop at the first official vector:

1. **The user.** They, or the partner, have the brand kit. Ask.
2. **The owner's site.** The header logo is usually inline `<svg>` in the HTML: fetch the page and pull the `<svg>` that contains the logo. Also try `/logo.svg`, `/favicon.svg` (usually only the mark), `<link rel="icon" type="image/svg+xml">`, and the build's asset folder (for example `/_next/static/media/logo.<hash>.svg`).
3. **The owner's brand or press page** (`/brand`, `/press`, `/media-kit`). These carry the reversed "on dark" versions and the usage rules.
4. **The owner's own repos** (a `logo.svg` in their GitHub organisation's website repo).

Treat these as leads, not sources: community redraws on wikis, logo aggregator sites, icon packs. They are often redrawn by hand and differ in small ways, and icon packs simplify marks to one color on a 24 px grid. A PNG favicon is never the logo.

**Hash-verify the path data.** When you find the logo in two official places, prove they carry the same artwork, and after every edit prove you did not touch it. Hash only geometry, so a cropped viewBox, a removed `width` or a new `id` does not change the fingerprint:

```js
// hash-logo.mjs: same hash = same shapes, whatever the viewBox, size, ids or colors
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const GEOMETRY = /\s(d|points|cx|cy|r|rx|ry|x|y|width|height|x1|y1|x2|y2|transform|fill-rule)="([^"]*)"/g;
for (const file of process.argv.slice(2)) {
  const svg = readFileSync(file, 'utf8');
  const shapes = [...svg.matchAll(/<(path|circle|ellipse|rect|polygon|polyline|line)\b[^>]*>/g)].map((m) =>
    m[1] + ' ' + [...m[0].matchAll(GEOMETRY)].map(([, k, v]) => `${k}=${v.replace(/[\s,]+/g, ' ').trim()}`).sort().join(';'),
  );
  const hash = createHash('sha256').update(shapes.join('\n')).digest('hex').slice(0, 16);
  console.log(hash, String(shapes.length).padStart(3), 'shapes ', file);
}
```

`node hash-logo.mjs site-header.svg press-kit.svg public/logos/partner-a-white.svg` should print one hash three times. A different hash means different artwork: a redraw, an older logo, or an optimizer (SVGO) that rounded coordinates. In that case render both at 1:1 and compare them before choosing, and prefer the one straight from the owner. The hash ignores `fill`, so a white variant can match the colored original's geometry; check colors separately against the owner's list.

**Crop the viewBox to the artwork.** Official files often include clear-space padding or sit off-center on a square canvas, which breaks centering and optical sizing. Measure the artwork's box in a browser: serve the folder (`python -m http.server 8765`, stopped afterwards), open `http://127.0.0.1:8765/logo.svg` in the browser pane, and evaluate:

```js
const b = document.querySelector('svg').getBBox();   // in viewBox units, child transforms included
[b.x, b.y, b.width, b.height].map((v) => +v.toFixed(2)).join(' ')
```

`getBBox()` ignores stroke width (Chrome also ignores the `{ stroke: true }` option), so for a stroked logo grow the box by half the widest stroke on every side. Write the result into `viewBox`, remove the root `width` and `height` so it scales, leave every shape untouched, and re-run the hash to prove it. The aspect ratio for sizing is the new viewBox width divided by its height.

## 6. Size, color and placement

**Size by visual weight, not by width.** Two logos at the same width do not look the same size: a long wordmark looks small next to a compact mark, and a solid mark looks heavier than an outline. Start from equal box area, then nudge by eye: width = √(area × ratio) × nudge and height = width ÷ ratio, where ratio is the cropped viewBox's width over its height (`logoBox` in section 9).

Starting values at 1920×1080: about 46,000 px² per logo for a row of two (a 4.8:1 wordmark comes out near 470×98 px), 30,000 to 35,000 px² for a row of three or four. For a stacked phone layout at 1080×1920, about twice the area (1.4× the width), because the stack has room and phones are small. Then nudge 5 to 15%: dense, solid marks down, thin or airy marks up. The real film's two partner logos ended at 440 and 450 px wide on 16:9 and 600 and 660 px stacked on 9:16. Judge the result on a contact sheet (`node scripts/sheet.mjs <cut>`), not in the studio, where the preview is scaled.

**Use the owner's dark-background version.** Many brand kits ship one ("reverse", "on dark", "white"). If there is none:

1. If their guidelines allow a one-color white version (many do), use white `#FFFFFF`.
2. Otherwise put the full-color logo on a light plate: a rounded rectangle in their light background color, padded by at least half the logo's height.
3. Any other color change needs the owner's okay. Lifting a dark blue so it reads on black is still a recolor. So is tinting a partner logo to match your palette, inverting it, or adding a glow in your accent color.

**Clear space and company.** Keep at least the owner's stated clear space around each logo (guidelines usually define it from the mark's height; without one, use half the logo's height), and never let captions, `Grain` or a `Callout` cross it. Animate how a logo arrives (a rise into focus, or a rebuilt mark drawing itself in, section 8), then let it rest in its official form. Never squash, skew, rotate or stretch it for a transition.

## 7. Tracing a raster logo

Trace only after asking for a vector and getting none: the user does not have one, the owner's site and press page do not either. Say in your report that it is a trace, and that an official SVG would beat it. The real film traced a partner's lettering from a 383 px PNG and flagged that an official SVG would replace the trace the day one turned up.

**Start from the largest, cleanest raster there is**: a press-kit PNG, the `og:image`, an app-store icon at 1024 px. Never a favicon, and avoid JPEGs (their ringing becomes lumps). Then:

1. **Upscale ×8 to ×12** with cubic interpolation. Contours are found on pixel centers; at ×10 they follow the edge to a tenth of a source pixel instead of stair-stepping.
2. **Blur lightly** (a Gaussian of 0.3 × the scale factor, 3 px at ×10). It melts the staircase without eating thin features. The corners it softens are restored in step 5.
3. **Threshold at half** of the ink, not by eye. Antialiased edge pixels sit halfway between background and ink, so 50% puts the edge where the designer drew it.
4. **Find every contour, holes included.** Retrieval that keeps only outer contours fills the counter of every "o", "a" and "e". Write all contours into one path with `fill-rule="evenodd"`.
5. **Fit, don't just simplify.** Find corners (a turn of more than 35° within about one source pixel) and keep them sharp by putting each back where the straight runs on either side meet, because the blur rounded them. Keep straight edges exactly straight. Fit everything else with smooth cubic curves whose tangents follow the contour. Plain polygon simplification gets none of these right: curves turn faceted, corners turn round.

This script does all of it (`opencv-python-headless` and `numpy`; if they are missing, ask before `pip install opencv-python-headless numpy`, a few tens of MB). Save it as a scratch file, not in the video project:

```python
"""Trace a raster logo into one SVG path: straight edges straight, corners sharp, curves smooth.
usage: python trace.py logo.png logo.svg [--scale 10] [--color "#4561b8"] [--fill "#ffffff"]
needs: opencv-python-headless, numpy. Writes logo.svg (viewBox cropped to the artwork, units =
source pixels) and logo.svg.check.png (white = both agree, blue = path only, yellow = image only).
"""
import argparse, cv2, numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--scale', type=int, default=10)  # 8-12: trace below the pixel grid
ap.add_argument('--color')                        # trace one color layer of a multi-color logo
ap.add_argument('--fill', default='#ffffff')      # the color the path is written with
ap.add_argument('--corner', type=float, default=35)  # degrees of turn within ~1 source px that make a corner
a = ap.parse_args(); S = a.scale

img = cv2.imread(a.src, cv2.IMREAD_UNCHANGED)
if img.ndim == 2: img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGRA)
elif img.shape[2] == 3: img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
bgr, alpha = img[..., :3].astype(np.float32), img[..., 3].astype(np.float32) / 255
hex2bgr = lambda s: np.array([int(s[i:i + 2], 16) for i in (5, 3, 1)], np.float32)
if alpha.min() < 1:                                # transparent PNG: alpha is the shape
    ink = alpha * (np.linalg.norm(bgr - hex2bgr(a.color), axis=2) < 60) if a.color else alpha
else:                                              # opaque: how far each pixel is from the background
    bg = np.median(np.concatenate([bgr[0], bgr[-1], bgr[:, 0], bgr[:, -1]]), axis=0)
    d = (hex2bgr(a.color) if a.color else bgr.reshape(-1, 3)[np.linalg.norm(bgr - bg, axis=2).argmax()]) - bg
    t = np.clip(((bgr - bg) @ d) / (d @ d), 0, 1)  # antialiased edge pixels land between 0 and 1
    resid = np.linalg.norm((bgr - bg) - t[..., None] * d, axis=2)
    ink = t * (resid < 0.25 * np.linalg.norm(d))   # other colors of the logo drop out

h, w = ink.shape  # 1. upscale, 2. blur lightly, 3. threshold at half
big = cv2.GaussianBlur(cv2.resize(ink, (w * S, h * S), interpolation=cv2.INTER_CUBIC), (0, 0), 0.3 * S)
mask = (big > 0.5).astype(np.uint8)
# 4. every contour, holes included (RETR_EXTERNAL would fill the counter of every 'o')
contours, _ = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)

def unit(v): return v / max(np.linalg.norm(v), 1e-9)
def chord_dist(p, a_, b_):
    d = b_ - a_; n = np.linalg.norm(d)
    if n < 1e-9: return np.linalg.norm(p - a_, axis=1)
    return np.abs(d[0] * (p[:, 1] - a_[1]) - d[1] * (p[:, 0] - a_[0])) / n

def rdp(p, eps):  # Douglas-Peucker, returns kept indices
    keep, stack = {0, len(p) - 1}, [(0, len(p) - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1: continue
        dd = chord_dist(p[i + 1:j], p[i], p[j]); m = int(dd.argmax())
        if dd[m] > eps: keep.add(i + 1 + m); stack += [(i, i + 1 + m), (i + 1 + m, j)]
    return sorted(keep)

def find_corners(p, k):  # sharp turns: a big angle over +-k points, strongest first, one per 2k points
    n = len(p); idx = np.arange(n)
    v1, v2 = p - p[(idx - k) % n], p[(idx + k) % n] - p
    ang = np.degrees(np.abs(np.arctan2(v1[:, 0] * v2[:, 1] - v1[:, 1] * v2[:, 0], (v1 * v2).sum(1))))
    out = []
    for i in np.argsort(-ang):
        if ang[i] < a.corner: break
        if all(min(abs(i - c), n - abs(i - c)) > k for c in out): out.append(int(i))
    return sorted(out), ang

def handles(P, t1, t2):  # least-squares handle lengths for fixed ends and tangent directions
    V0, V3 = P[0], P[-1]; L = np.linalg.norm(V3 - V0)
    u = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]; u = u / max(u[-1], 1e-9)
    b = [(1 - u) ** 3, 3 * (1 - u) ** 2 * u, 3 * (1 - u) * u ** 2, u ** 3]
    A1, A2 = b[1][:, None] * t1, b[2][:, None] * t2
    R = P - V0 * (b[0] + b[1])[:, None] - V3 * (b[2] + b[3])[:, None]
    C = np.array([[(A1 * A1).sum(), (A1 * A2).sum()], [(A1 * A2).sum(), (A2 * A2).sum()]])
    try: a1, a2 = np.linalg.solve(C, [(A1 * R).sum(), (A2 * R).sum()])
    except np.linalg.LinAlgError: a1 = a2 = L / 3
    if not (0.05 * L < a1 < L and 0.05 * L < a2 < L): a1 = a2 = L / 3   # degenerate: fall back
    return V0 + t1 * a1, V3 + t2 * a2

def meet(a1, d1, a2, d2):  # where two lines cross (None if nearly parallel)
    x = d1[0] * d2[1] - d1[1] * d2[0]
    if abs(x) < 0.17: return None
    s = ((a2 - a1)[0] * d2[1] - (a2 - a1)[1] * d2[0]) / x
    return a1 + s * d1

def tls(P):  # best-fit line through points: center and direction
    c = P.mean(0); return c, np.linalg.eigh(np.cov((P - c).T))[1][:, 1]

def fit(p):  # one closed contour -> start point, [('L', end) | ('C', c1, c2, end)]
    n = len(p); p = p.astype(float); at = lambda i: p[i % n]
    cs, ang = find_corners(p, S) if n > 4 * S else ([], None)
    # the blur rounds each corner off over about r points either side, more for sharper corners
    rin = {c: int(0.8 * S / max(np.cos(np.radians(ang[c]) / 2), 0.3)) for c in cs}; rout = dict(rin)
    run_in = lambda c: (at(c - rin[c]), unit(at(c - rin[c]) - at(c - rin[c] - S)))    # the run arriving
    run_out = lambda c: (at(c + rout[c]), unit(at(c + rout[c] + S) - at(c + rout[c])))  # the run leaving
    k = 0  # one sharp tip can read as two corners: merge a pair when the run into the first
    while len(cs) > 1 and k < len(cs):  # and the run out of the second meet right there
        c, d = cs[k], cs[(k + 1) % len(cs)]; gap = (d - c) % n; h = meet(*run_in(c), *run_out(d))
        if gap < 3 * S and h is not None and max(np.linalg.norm(h - at(c)), np.linalg.norm(h - at(d))) < 2.5 * S:
            rout[c] = gap + rout[d]; cs.remove(d); k = min(k, len(cs) - 1) if d > c else 0
        else: k += 1
    if cs:  # start the walk at a corner
        c0 = cs[0]; p = np.roll(p, -c0, axis=0)
        rin = {(c - c0) % n: v for c, v in rin.items()}; rout = {(c - c0) % n: v for c, v in rout.items()}
        cs = sorted((c - c0) % n for c in cs)
    q = np.vstack([p, p[:1]])
    idx, corner = [], []
    stops = (cs or [0]) + [n]; rin[n] = rin.get(0, 0)
    for s0, s1 in zip(stops, stops[1:]):           # simplify each corner-to-corner run on its own
        lo, hi = (s0 + rout[s0], s1 - rin[s1]) if cs else (s0, s1)
        inner = [lo + i for i in rdp(q[lo:hi + 1], 0.25 * S)][1:-1] if hi - lo > 2 else []
        idx += [s0] + inner; corner += [bool(cs)] + [False] * len(inner)
    m = len(idx); nx = lambda j: (j + 1) % m; end_ = lambda j: idx[j + 1] if j + 1 < m else n
    raw = [q[idx[j] + (rout[idx[j]] if corner[j] else 0): end_(j) - (rin[end_(j)] if corner[nx(j)] else 0) + 1] for j in range(m)]
    line = [(corner[j] and corner[nx(j)]) or (len(raw[j]) > 3 * S and chord_dist(raw[j], raw[j][0], raw[j][-1]).max() < 0.12 * S)
            for j in range(m)]
    for j in range(m):  # two 'lines' meeting at a smooth vertex at a shallow angle are really a gentle curve
        if not corner[j] and line[j - 1] and line[j] and not (corner[j - 1] and corner[nx(j)]):
            d1, d2 = unit(q[idx[j]] - q[idx[j - 1]]), unit(q[end_(j)] - q[idx[j]])
            if d1 @ d2 > np.cos(np.radians(12)): line[j - 1] = line[j] = False
    data_t = lambda i: unit(at(i + S) - at(i - S))  # the contour's own direction at a point
    off = lambda d, i: d @ data_t(i) < np.cos(np.radians(8))
    for j in range(m):  # a short line must leave a smooth vertex along the contour, or it is a chord of a curve
        k = nx(j); d = q[end_(j)] - q[idx[j]]
        if line[j] and not (corner[j] and corner[k]) and np.linalg.norm(d) < 6 * S:
            if (not corner[j] and off(unit(d), idx[j])) or (not corner[k] and off(unit(d), end_(j))): line[j] = False
    fitl = [tls(raw[j]) if line[j] and len(raw[j]) > 2 else None for j in range(m)]
    V = []
    for j in range(m):  # corners go back where the runs either side meet: sharp, not blurred round
        if not corner[j]: V.append(q[idx[j]]); continue
        a_ = fitl[j - 1] or run_in(idx[j]); b_ = fitl[j] or run_out(idx[j])
        h = meet(*a_, *b_); V.append(h if h is not None and np.linalg.norm(h - q[idx[j]]) < 2 * S else q[idx[j]])
    P = [np.vstack([V[j], raw[j], V[nx(j)]]) for j in range(m)]
    def smooth_t(j):  # tangent at a smooth vertex: a neighbouring line's, else the points' own
        if line[j - 1]: return unit(V[j] - V[j - 1])
        if line[j]: return unit(V[nx(j)] - V[j])
        return unit(P[j][min(S, len(P[j]) - 1)] - P[j - 1][max(len(P[j - 1]) - 1 - S, 0)])
    segs = []
    for j in range(m):
        k = nx(j)
        if line[j]: segs.append(('L', V[k])); continue
        t1 = run_out(idx[j])[1] if corner[j] else smooth_t(j)
        t2 = -run_in(end_(j))[1] if corner[k] else -smooth_t(k)
        c1, c2 = handles(P[j], t1, t2)
        segs.append(('C', c1, c2, V[k]))
    return V[0], segs

def fmt(pt): x, y = (pt + 0.5) / S; return f'{x:.2f} {y:.2f}'   # big-pixel centers -> source units
parts, polys = [], []
for c in contours:
    if len(c) < 3 * S: continue                    # specks smaller than ~1 source px
    start, segs = fit(c.reshape(-1, 2))
    d = [f'M{fmt(start)}']; poly = [start]; prev = start
    for s in segs:
        if s[0] == 'L': d.append(f'L{fmt(s[1])}'); poly.append(s[1])
        else:
            d.append(f'C{fmt(s[1])} {fmt(s[2])} {fmt(s[3])}')
            for t in np.linspace(0, 1, 17)[1:]:
                poly.append((1 - t) ** 3 * prev + 3 * (1 - t) ** 2 * t * s[1] + 3 * (1 - t) * t * t * s[2] + t ** 3 * s[3])
        prev = s[-1]
    parts.append(' '.join(d) + 'Z'); polys.append(np.round(np.array(poly)).astype(np.int32))

ys, xs = np.nonzero(mask)                          # viewBox cropped tight to the artwork
x0, y0, x1, y1 = xs.min() / S, ys.min() / S, (xs.max() + 1) / S, (ys.max() + 1) / S
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.2f} {y0:.2f} {x1 - x0:.2f} {y1 - y0:.2f}">'
       f'<path fill="{a.fill}" fill-rule="evenodd" d="{" ".join(parts)}"/></svg>\n')
open(a.out, 'w').write(svg)
# 5. check: redraw the path and compare it with the thresholded image
redraw = np.zeros_like(mask); cv2.fillPoly(redraw, polys, 1)
iou = (redraw & mask).sum() / max((redraw | mask).sum(), 1)
print(f'{len(parts)} contours, {sum(p.count("L") + p.count("C") for p in parts)} segments, IoU {iou:.4f} (want > 0.98)')
cv2.imwrite(a.out + '.check.png', np.dstack([redraw * 255, mask * 255, mask * 255]))
```

**Check the trace before using it.** Aim for an IoU above 0.98 for solid marks and lettering. Then read `logo.svg.check.png` at full size: blue or yellow slivers along an edge mean that edge is off. Render the SVG at 1:1 next to the source and at 4× the size you will use it, looking for lumps on curves, rounded corners that should be sharp, and wobbly straight lines. For a multi-color logo, trace each color with `--color` and its own `--fill`. The paths share coordinates (source pixels), so merge them into one SVG with the union of their viewBoxes.

Thin line art (outlines, lattices, rings) scores lower, around 0.9, because its edges are most of its area, and the trace wobbles where it matters most. Rebuild those marks from geometry instead (section 8).

## 8. Rebuilding geometric marks to animate them

When a mark is made of circles, arcs, straight strokes and regular shapes, draw it from numbers instead of pasting it. The rebuilt mark is exact at any size, and its parts can move on their own: arcs draw themselves in, rings turn into place in 3D, a dome's arches rise from the ground. The real film did this for two partner marks: a ring mark built as an outline plus three great circles described by their normals, and a dome whose inner lattice turned out to be one circle shifted along the ground to five feet.

**Find the rule behind the shape.** Fewer numbers means an exact result. Look for repeats (the same circle moved, the same stroke width, even spacing) before measuring each part on its own.

**Measure from the largest raster or the official SVG.** For a ring seen at an angle, fit an ellipse to its pixels. The ellipse's axes give the circle's radius and its tilt, which is all a great circle needs:

```python
# one ring's pixels (picked by color) -> circle center, radius, unit normal and stroke width, in image px
import cv2, numpy as np
im = cv2.imread('mark.png').astype(float); ring = np.array([224, 140, 107.])   # that ring's BGR
ink = (np.linalg.norm(im - ring, axis=2) < 60).astype(np.uint8)
cs, _ = cv2.findContours(ink, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
(cx, cy), (w, h), ang = cv2.fitEllipse(np.vstack(cs))        # both edges at once: the stroke's midline
a, b = max(w, h) / 2, min(w, h) / 2
phi = np.radians(ang if w < h else ang + 90)                 # the normal leans along the minor axis
nz = b / a; n = [np.sqrt(1 - nz ** 2) * np.cos(phi), np.sqrt(1 - nz ** 2) * np.sin(phi), nz]
per = np.pi * (3 * (a + b) - np.sqrt((3 * a + b) * (a + 3 * b)))   # the ellipse's length
print('center', (cx, cy), 'r', a, 'normal', np.round(n, 3), 'stroke', ink.sum() / per)
```

Store the result as a small TypeScript module of constants, in the source image's units, with a comment saying what was measured from what. For a dome or arch, fit circles to each arc's pixels the same way and measure stroke widths as ink area divided by length.

**Draw strokes in with `pathLength`.** Setting `pathLength={1}` makes the dash math independent of the path's real length:

```tsx
/** A stroke that draws itself from its first point to its last as p goes 0 → 1. */
function DrawIn({ d, p, width, color = '#FFFFFF' }: { d: string; p: number; width: number; color?: string }) {
  if (p <= 0) return null; // butt caps, and nothing before it starts: a round cap would show as a dot
  return <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p}
    fill="none" stroke={color} strokeWidth={width} strokeLinecap="butt" />;
}

// in the scene: the outer arch, then the inner arches from the middle outward
// (GEO is your module of measured constants: viewBox size, path data, stroke widths)
const t = useTime();
const m = useMarks(); // cuts.json: { "mark": 0.3 }
<svg viewBox={`0 0 ${GEO.w} ${GEO.h}`} width={640} style={{ overflow: 'visible' }}>
  <DrawIn d={GEO.outer} p={prog(t, m.mark, 0.77)} width={GEO.outerWidth} />
  {GEO.inner.map((arch, i) => (
    <DrawIn key={i} d={arch.d} p={prog(t, stagger(arch.order, 0.1, m.mark + 0.17), 0.67)} width={GEO.innerWidth} />
  ))}
</svg>
```

Letters that belong to the mark rise into focus about 0.23 s after the strokes start: opacity, a 16 px lift and an 8 px blur, driven by `pop(t, m.mark + 0.23)`.

**Turn rings in 3D by turning their normals.** A great circle seen straight on is an ellipse whose short axis is its normal's direction on screen, with half-length r·|nz|. Start each normal turned away and let it settle exactly on the measured value:

```tsx
type V3 = [number, number, number];
/** A unit normal turned about x, then about y (radians). */
function turn([x, y, z]: V3, rx: number, ry: number): V3 {
  const y1 = y * Math.cos(rx) - z * Math.sin(rx);
  const z1 = y * Math.sin(rx) + z * Math.cos(rx);
  return [x * Math.cos(ry) + z1 * Math.sin(ry), y1, -x * Math.sin(ry) + z1 * Math.cos(ry)];
}

// each ring as its unit normal (x right, y down, z toward the viewer), measured from the logo
const RINGS: { n: V3; color: string; width: number }[] = [
  { n: [0.30, -0.55, 0.78], color: '#5B7BE0', width: 0.05 }, // colors straight from the owner's SVG
  { n: [0.62, 0.20, 0.76], color: '#9DB6FF', width: 0.06 },
];

function RingMark({ r, start }: { r: number; start: number }) {
  const t = useTime();
  return (
    <svg width={r * 2.1} height={r * 2.1} viewBox={`${-r * 1.05} ${-r * 1.05} ${r * 2.1} ${r * 2.1}`}>
      {RINGS.map((ring, i) => {
        const p = prog(t, start + i * 0.08, 1.2);
        const [nx, ny, nz] = turn(ring.n, (1 - p) * 0.9, (1 - p) * -2.3); // like a gyroscope settling
        return <ellipse key={i} rx={r * Math.max(Math.abs(nz), 0.004)} ry={r}
          transform={`rotate(${(Math.atan2(ny, nx) * 180) / Math.PI})`}
          fill="none" stroke={ring.color} strokeWidth={r * ring.width} opacity={Math.min(1, p * 2.5)} />;
      })}
    </svg>
  );
}
```

Timings that worked in the real film: the outline draws in over 1 s, rings turn in over 1.2 s staggered by 0.08 s, the outer arch of the dome draws in 0.77 s and the inner arches 0.67 s each, 0.1 s apart. Then the mark holds still. Put a soft `chime` or `pop` from the sound engine on the mark's settle, keyed to the same mark (see [sound-design](sound-design.md)).

**The last frame must be the logo.** Render a still after the animation settles and compare it with the official artwork at the same size: in Python, a Pillow `ImageChops.difference` of the two should show no visible edges anywhere. The motion is yours; the resting state is the owner's.

## 9. Credits and partner logos

**Consent first.** Put an organisation in the credits only when it has agreed to be credited, in words it agreed to. The real film's founder wanted to close with "supported by" and a big tech company's logo after one friendly call with that company's startup team. There was no formal support, only that one call, so the logo came out: under "supported by" it would have told every viewer that the company backs the product, which was not true and was not the founder's to claim. Another organisation came off the credits later on request. When one asks to be removed, remove it everywhere (every cut, cover and thumbnail) and re-render.

Before building a credits scene, ask the user: "Which of these organisations agreed to appear, and with what wording? Do you have it in writing?" If the answer is unclear, leave them out. Their name as plain text implies the same endorsement as their logo.

**The words mean specific things:**

| wording | what it claims | needs |
|---|---|---|
| supported by | formal support: a grant, a program, credits, a mentorship with an agreement | their okay, often their exact wording |
| backed by | investors | only actual investors, with their okay |
| partner / in partnership with | a partnership agreement | the agreement |
| member of / part of | membership in a named program or cohort | acceptance, and the program's own naming rules |
| built with / powered by | technology the product uses | true, and allowed by that company's brand rules; many forbid implying partnership |
| trusted by / customers | paying customers | each customer's okay to be named |
| as seen in | press coverage | an article that exists; link it in the post |

**Equal visual weight.** Co-credited partners appear as equals unless an agreement says otherwise: the same optical size (section 6), the same move, the same hold, in the order agreed or alphabetical. The real film's credit: "supported by" words in at 0.2 s, the logos rise into focus from 0.6 s one after the other 0.37 s apart, hold about 3 s, then lift away together.

```tsx
// src/scenes/Credits.tsx; register it in src/scenes/index.ts, marks in cuts.json: { "label": 0.2, "logos": 0.6 }
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { lerp, pop, stagger } from '../lib/anim';
import { Line } from '../lib/text';
import { useMarks, useStage, useTime } from '../lib/time';
import { Backdrop } from '../lib/ui';
import { C } from '../theme';

// ratio = cropped viewBox width / height; nudge = optical correction, judged on a contact sheet
const PARTNERS = [
  { file: 'logos/partner-a-white.svg', name: 'Partner A', ratio: 4.83, nudge: 1 },
  { file: 'logos/partner-b-white.svg', name: 'Partner B', ratio: 1.32, nudge: 0.94 }, // solid mark: a touch smaller
];

function logoBox(ratio: number, area: number, nudge = 1) {
  const width = Math.sqrt(area * ratio) * nudge;
  return { width, height: width / ratio };
}

export function Credits() {
  const t = useTime();
  const m = useMarks();
  const { portrait } = useStage();
  const area = portrait ? 92000 : 46000; // px² per logo: a row on 16:9, a stack on 9:16
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: portrait ? 80 : 56 }}>
        <Line text="supported by" start={m.label} size={portrait ? 46 : 40} weight={400} tracking={0} color={C.dim} />
        <div style={{ display: 'flex', flexDirection: portrait ? 'column' : 'row', alignItems: 'center', gap: portrait ? 96 : 140 }}>
          {PARTNERS.map((p, i) => {
            const k = pop(t, stagger(i, 0.37, m.logos)); // same move, same size, one after the other
            return (
              <div key={p.file} style={{ opacity: Math.min(1, k * 1.4), transform: `translateY(${(1 - k) * 26}px) scale(${lerp(0.96, 1, k)})`, filter: k < 0.99 ? `blur(${(1 - k) * 10}px)` : undefined }}>
                <Img src={staticFile(p.file)} alt={p.name} style={{ display: 'block', ...logoBox(p.ratio, area, p.nudge) }} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
```

**Send the frame for approval.** Render the credit frame (`node scripts/stills.mjs <cut> --marks`) and suggest the user sends it to each partner before publishing. Partners care how they appear, and a still is easy to approve.

## 10. Mascots and characters

Characters make a product video warmer, and they are easy to get subtly wrong: poses that jump when they swap, feet that slide, a figure that floats. The real film walked three robot characters through a room; these are the rules it arrived at.

**Get clean source art.** Best: the user's own renders, all poses from one setup (same camera, light and scale), on a plain light-grey background, large (the real renders were 1600×2000). You need at least a standing pose and a mid-stride walking pose facing one way. If the user generates characters with an image tool, generate every pose in one session from one reference so the identity holds.

**Remove the background with a tool the user approves.** Options include an open-source model such as `rembg` (it downloads a segmentation model well over 100 MB on first run), a background-removal action in an image connector the user already has (the real project used one), or the built-in subject cutout in macOS, iOS, Windows Photos or Photoshop. Uploading unreleased character art to a web service is the user's decision. Then check the cutout on a dark background at 2×: light fringes left from the grey backdrop show up as a halo on a dark stage. Re-cut with a tighter edge rather than painting over it.

**Put every pose on one shared canvas**: the same canvas size and scale, the feet on one baseline, the torso on one vertical axis. Then swapping `front.png` for `walk.png` changes the pose, not the position. Center on the torso, not the bounding box: a stride pushes one foot forward and moves the box, and the character would lurch sideways at every swap.

```python
"""Put every pose of a character on one shared canvas: one scale, feet on one baseline, torso on one axis.
usage: python align.py out_dir stand.png walk.png [more poses...]   (cutouts, transparent background)
The first file sets the scale; poses from the same render setup then keep their true proportions.
"""
import sys, os, numpy as np
from PIL import Image

W, H, FEET, FIG = 720, 864, 844, 792   # canvas, baseline y, standing figure height: 2x what you draw
out, files = sys.argv[1], sys.argv[2:]
os.makedirs(out, exist_ok=True)
k = None
for f in files:
    im = Image.open(f).convert('RGBA')
    solid = np.asarray(im)[..., 3] > 128             # ignore soft fringes and leftover shadow
    ys, xs = np.nonzero(solid); top, bottom = ys.min(), ys.max() + 1
    if k is None: k = FIG / (bottom - top)           # scale from the standing pose, then keep it
    band = solid[top + (bottom - top) * 3 // 10: top + (bottom - top) * 6 // 10]
    cx = np.nonzero(band)[1].mean()                  # the torso's center, not the box's: a stride moves the box
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    canvas.paste(im, (round(W / 2 - cx * k), round(FEET - bottom * k)))
    canvas.save(os.path.join(out, os.path.basename(f)))
    print(f'{os.path.basename(f)}: feet at {FEET}, torso at x {W // 2}, {bottom - top} px tall -> {round((bottom - top) * k)}')
```

**Pivot at the feet.** Set `transformOrigin` at the baseline, so breathing, tilting and squash grow out of the ground instead of lifting the feet off it.

**Swap poses at the top of a hop.** A pose change on the ground reads as a glitch. A small hop (14% of the height, 0.32 s) that peaks exactly on the mark hides it: the eye reads the jump as the reason for the change. Stretch 6% up and narrow by the same volume in the air, and shrink and fade the shadow while airborne.

**Flip for direction, carefully.** A horizontal flip turns a right-facing walk into a left-facing one for free, but it also flips every asymmetric detail: a headset moves to the other ear, a logo on a shirt reads backwards. If the character carries text or a one-sided prop, ask for a left-facing render instead.

**Waddle with footfalls, and put a footstep on each one.** A walk is a lift of |sin(π·phase)| × 4.5% of the height plus a 5° tilt, with a footfall at every whole phase, where the lift touches zero. One footfall every 0.25 s reads as a small character's quick step. Move at constant speed while walking: eased travel makes the feet skate.

**Glow and contact shadow.** A soft radial glow in the character's hue behind it (about 19% alpha) and a dark ellipse under the feet (60% of the height wide, 10% tall) seat a cutout in the scene. Without the shadow, cutouts float.

**Idle motion runs on drawn time.** Breathing (1.2% every 2.5 s) and swaying (1.2° every 6 s) use `useDrawnTime()`, offset per character so they never breathe in unison. On the warped clock, a fast-forward stretch in the reel would make them shiver.

```tsx
// a character component next to the scenes that use it (src/scenes/)
import { Img, staticFile } from 'remotion';
import { clamp } from '../lib/anim';
import { useDrawnTime } from '../lib/time';
import { alpha } from '../theme';

const CANVAS = { w: 720, h: 864, feet: 844, fig: 792 }; // the numbers align.py used

/** A hop from `start`, `dur` s long: height 0 → 1 → 0, and whether it is past its top (swap poses there). */
export function hopAt(t: number, start: number, dur = 0.32) {
  const x = clamp((t - start) / dur);
  return { hop: Math.sin(Math.PI * x), past: x >= 0.5 };
}

type Props = { name: string; pose: string; height: number; hue: string; phase?: number | null; facing?: 1 | -1; hop?: number; seed?: number };

/** Stands with its feet on the point it is placed at. `phase` (walking) counts footfalls; null = standing. */
export function Character({ name, pose, height, hue, phase = null, facing = 1, hop = 0, seed = 0 }: Props) {
  const idle = useDrawnTime() + seed * 0.7;
  const k = height / CANVAS.fig;
  let lift = 0, tilt = 0, breathe = 1;
  if (phase !== null) {
    const s = Math.sin(Math.PI * phase); // 0 at every whole phase: a foot lands
    lift = Math.abs(s) * height * 0.045;
    tilt = s * 5;
  } else {
    breathe = 1 + Math.sin(idle * 2.5) * 0.012;
    tilt = Math.sin(idle * 1.05) * 1.2;
  }
  lift += hop * height * 0.14;
  const stretch = 1 + hop * 0.06; // taller and thinner in the air, same volume
  return (
    <div style={{ position: 'absolute', left: (-CANVAS.w * k) / 2, top: -CANVAS.feet * k, width: CANVAS.w * k, height: CANVAS.feet * k }}>
      <div style={{ position: 'absolute', left: '50%', top: '40%', width: height * 1.05, height: height * 1.05, transform: 'translate(-50%, -50%)', background: `radial-gradient(closest-side, ${alpha(hue, 0.19)}, transparent)` }} />
      <div style={{ position: 'absolute', left: '50%', top: '100%', width: height * 0.6 * (1 - hop * 0.3), height: height * 0.1, transform: 'translate(-50%, -50%)', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(0,0,0,0.65), transparent)', opacity: 1 - hop * 0.4 }} />
      <Img src={staticFile(`characters/${name}-${pose}.png`)} style={{
        position: 'absolute', left: 0, top: 0, width: CANVAS.w * k, height: CANVAS.h * k,
        transformOrigin: `50% ${(CANVAS.feet / CANVAS.h) * 100}%`,
        transform: `translateY(${-lift}px) rotate(${tilt}deg) scale(${facing / Math.sqrt(stretch)}, ${breathe * stretch})`,
      }} />
    </div>
  );
}
```

In the scene, the walk runs on `useTime()` (the scene's clock), because its footfalls must line up with the sound:

```tsx
const t = useTime();
const m = useMarks();            // cuts.json: { "walkStart": 1.2, "walkEnd": 3.2 }
const STRIDE = 0.25;             // a footfall every 0.25 s; sound/score.mjs uses the same number
const on = hopAt(t, m.walkStart - 0.16), off = hopAt(t, m.walkEnd - 0.16); // hops peak on the marks
const walking = on.past && !off.past;
const x = lerp(420, 1500, prog(t, m.walkStart, m.walkEnd - m.walkStart, EASINGS.linear));
<div style={{ position: 'absolute', left: x, top: 820 }}>
  <Character name="pip" pose={walking ? 'walk' : 'front'} height={300} hue={C.accent}
    phase={walking ? Math.max(0, t - m.walkStart) / STRIDE : null} hop={on.hop + off.hop} />
</div>
```

And the footsteps, from the same marks, so a warp or a re-timed mark moves picture and sound together:

```js
// sound/score.mjs (it already imports place, step and getCut): call footsteps(mix, at, cut, 'walk') in the cut's case of score()
const STRIDE = 0.25; // same as the scene

export function footsteps(mix, at, cut, scene) {
  const m = getCut(cut).scenes.find((s) => s.id === scene).marks;
  const n = Math.floor((m.walkEnd - m.walkStart) / STRIDE);
  for (let k = 1; k <= n; k++) {
    const sceneSec = m.walkStart + k * STRIDE; // phase k: a foot lands
    // `at` is score()'s own, bound to the cut: scene seconds in, the warp inverted, cut seconds out
    place(mix, step({ f: k % 2 ? 900 : 1150, seed: 500 + k }), at(scene, sceneSec), {
      pan: -0.45 + 0.9 * (k / n), room: 0.1, // left, right, left; the pan follows the walk
    });
  }
}
```

For a short walk you can skip the function: name each footfall a mark (`step1`, `step2`…) and, in a scene without a cue sheet, the score's naming rules put a footstep on each (in a sheet, `k.step(s.t('step1'))`).

## 11. Generated images and video

Generated media is a good fit for what surrounds the product, and a bad one for the product itself.

**Good uses:** abstract textures and backgrounds, atmospheric b-roll (a desk at night, a city, hands on a keyboard), a mascot the user designed with an image tool, concept frames for a storyboard.

**Keep out of generated media:**

- **The product's UI.** Generated interfaces have garbled text, invented layouts and features the product does not have, and they cannot be edited, re-timed or kept sharp under a `Camera` push. Rebuild the UI in code ([ui-recreation](ui-recreation.md)). A generated "screenshot" of the product is a fake product.
- **Logos, partners' or the user's own.** Always the official artwork.
- **People presented as users or customers.** A generated face saying "this saved our team hours" is a fake testimonial (section 14).
- **Text.** Put all type on top in code: it stays crisp, uses the brand's font, and can be edited.

**Practical notes.** Generated clips are often 24 fps and 720p or 1080p. In a 30 or 60 fps cut, use them for slow ambient layers where judder does not show, never push a `Camera` in past 1.0× on them (a 720p clip is already soft at 1.0× in a 1080p frame), and put a dark scrim (`Backdrop`, or a gradient) under any caption on top. The real project tried generated music and sound effects too; they lost clearly to sound made in code ([sound-design](sound-design.md)).

**Disclose where platforms require it.** YouTube requires creators to disclose realistic altered or synthetic content, such as a realistic scene that did not happen, but not clearly unrealistic or animated content or production help. TikTok requires a label on AI-generated content with realistic images, audio or video. Meta requires its disclosure tool for photorealistic video or realistic-sounding audio that was digitally created or altered, and shows an "AI info" label. A motion-graphics product video with a rebuilt UI usually needs no label. Photoreal generated b-roll or a generated person may. When unsure, tell the user and let them choose the setting at upload.

## 12. Screenshots and screen recordings

Rebuilt UI is the default, and [ui-recreation](ui-recreation.md) section 14 covers when and how to record the real product. As assets, screenshots and recordings bring the same three risks: they go soft, they leak data, and they show things that belong to other people.

**Resolution.** Source pixels must cover the frame at the largest `Camera` scale: source width ≥ on-screen width × max scale. A screenshot shown 1440 px wide in a showcase that pushes in to 1.5× needs at least 2160 px, so capture at 2× device pixel ratio. Headless Chrome or Edge (`chrome`, `google-chrome`, or the full path to `chrome.exe` / `msedge.exe` on Windows) takes a clean one after the page's animations settle:

```sh
chrome --headless=new --hide-scrollbars --force-device-scale-factor=2 --window-size=1440,900 \
  --virtual-time-budget=5000 --screenshot=public/shots/landing-2x.png https://example.com
```

Keep the window a normal viewport height. A very tall window to grab a full page stretches every `100vh` section into a giant block; capture viewport-sized shots and move between them instead.

**Private data.** Use a demo account with fictional data. Check every corner of the frame: tab titles, bookmarks, avatars, notification badges, email addresses, API keys. Blur is not redaction.

**Other people's content.** A recording of a real team's workspace, a customer's document or a stranger's profile needs their permission, and fictional data avoids the question. A real post praising the product (a tweet, a review) can appear only as it was written, credited, with the author's okay, and with unrelated personal details cropped out. Don't show a competitor's real UI in an "old way" scene: use a generic, unbranded stand-in. Their interface is theirs, and a strawman version of it is unfair to them and misleading to viewers.

## 13. Stock media

Free stock libraries allow use inside your own video, and that is roughly where their permission ends:

- **Pixabay:** free, no attribution needed, can be modified. You cannot sell or distribute the content on a standalone basis, and content showing recognizable trademarks, logos or brands cannot be used commercially.
- **Unsplash:** free, including commercially. Images cannot be sold without significant modification, and you cannot compile them to replicate a similar service.
- **Pexels:** free. Don't redistribute on other stock platforms, don't show identifiable people in a bad light, and don't imply that the people or brands in the imagery endorse your product.

What this means in practice:

- **Don't redistribute raw files.** A stock clip inside a rendered video is fine. The same clip committed to a public repo is redistribution. Keep stock files in `public/stock/` (and reference audio in `sound/refs/`, which the template already ignores), add the folder to `.gitignore` in public repos, and list each file's source in the project README so a fresh clone can fetch them again.
- **Stock people are not customers.** A smiling model at a laptop next to the product's logo implies an endorsement they never gave, and Pexels' license forbids exactly that. Use stock people for mood, never next to a claim.
- **Check the specific item.** Some items carry their own restrictions (editorial only, a visible brand, a recognizable building). Read the item page, not only the site-wide license.
- **Music** has its own rules: a song's in-app license on a platform does not cover a file you render. See [audio-references](audio-references.md) and [sound-design](sound-design.md).

## 14. Honesty rules

A product video is an ad, and every number, name and quote in it is a claim. Viewers cannot check them, so they believe them. Keep them true.

**No fake counters.** A real project's waitlist counter started from a hidden head start set on the server, so the public number was several times the real sign-ups. A counter with a hidden offset is fake proof. An "illustrative" number is no better: on screen, viewers cannot tell it from a real one. Show the true number, or none. When you use `Counter`, both ends must be real, with the source and date in a comment beside it and a date on screen if the number will age ("412 teams, march 2026"). A video is frozen, so avoid anything that looks "live".

```tsx
{/* the true count, from the admin dashboard on 2026-09-26; re-check it before every re-render */}
<Counter from={0} to={412} start={m.count} dur={1.4} />
```

**No invented social proof.** No made-up testimonials, reviewers or quotes. No "trusted by" logos of companies that are not customers and did not agree. No star ratings, review counts, download numbers or "as seen in" press that do not exist. In the US the FTC's rule on consumer reviews and testimonials (in effect since October 2024) bans fake reviews and testimonials, including AI-generated ones, testimonials from people who never used the product, and fake social media indicators such as bot followers or views.

**No invented metrics.** "10× faster", "saves 5 hours a week" and "99.9% uptime" need a measurement the user can point to. If they have one, cite it in the post. If not, show the product doing the thing and let viewers judge.

**Demo data is fine, claims are not.** Fictional names, notes and numbers inside the rebuilt UI are expected and read as a demo. The same numbers in a caption ("1,248 teams joined this week") are a claim. Keep counts in UI chrome plausible and small, and never repeat them as facts.

**Show only what ships.** Every screen and behavior must exist. An unreleased feature needs the user's confirmation and a "coming soon" label. The call to action matches the product's stage: an in-development product says "join the waitlist", not "install now".

**Say when time is compressed.** A warp that turns a 40 s build into 3 s is editing, but if the speed is the point ("results in seconds"), add a small "sped up" label or show the real duration.

**Frame for the real audience.** If the product is for teams, show a team. The real film first made a team product look single-user, and the founder caught it. Fix framing everywhere: captions, labels, the cover.

When the user asks for something on this list, explain the risk in one or two sentences (it misleads viewers, it can break platform rules or consumer law, a partner can object), offer the honest version, and let them decide about anything that is theirs to decide.

## 15. Checklist

- [ ] `C`, `R`, `FONT`, `BRAND` hold the product's real values, each commented with its source token
- [ ] brand fonts load, and a still's `g`, `a`, `R`, `1` match the site; the font license covers video
- [ ] every logo is official, hash-matched to its source, viewBox cropped, in the owner's dark version, not recolored
- [ ] traces score above 0.98 IoU and are noted as traces; rebuilt marks end on the exact official artwork
- [ ] co-credited logos have equal optical weight, the same move and hold, in agreed order
- [ ] every credited organisation agreed to appear, in the wording shown; the user was asked
- [ ] characters share one canvas and baseline; pose swaps happen at hop tops; footsteps sit on footfalls
- [ ] no product UI, logo, person-as-customer or text in generated media; disclosure flagged where needed
- [ ] screenshots and recordings are 2× or more, show no private or third-party data
- [ ] stock files are out of public repos and listed in the project README with their licenses
- [ ] every number, quote, logo and claim on screen is true, sourced and current; the CTA matches the product's stage

## Sources

- YouTube Help, disclosing altered or synthetic content: https://support.google.com/youtube/answer/14328491
- TikTok Support, AI-generated content labels: https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content
- Meta, disclosure required for photorealistic video and realistic audio: https://about.fb.com/news/2024/02/labeling-ai-generated-images-on-facebook-instagram-and-threads/
- Meta, the "AI info" label: https://about.fb.com/news/2024/04/metas-approach-to-labeling-ai-generated-content-and-manipulated-media/
- FTC, final rule banning fake reviews and testimonials (August 2024): https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials
- Pixabay Content License summary: https://pixabay.com/service/license-summary/
- Unsplash License: https://unsplash.com/license
- Pexels License: https://www.pexels.com/license/
- Google Fonts FAQ (open-source licenses, commercial use): https://developers.google.com/fonts/faq
- Remotion `<Img>` (waits for load, fails loudly): https://www.remotion.dev/docs/img
- Remotion `loadFont()` from `@remotion/fonts` (blocks the render until ready): https://www.remotion.dev/docs/fonts-api/load-font
- Remotion `npx remotion add` (installs packages at the matching version): https://www.remotion.dev/docs/cli/add
