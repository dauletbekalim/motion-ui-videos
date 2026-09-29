/**
 * Pieces several scenes share: the phone layout and its crop card, big
 * keycaps, the scattered-fragment layouts, the palette's result lists, a
 * caption scrim, and the launch plan's blocks.
 */
import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import type { Safe } from '../formats';
import { clamp, lerp, pop, rand } from '../lib/anim';
import { useDrawnTime, useStage, useTime } from '../lib/time';
import { Fragment as FragmentCard, FRAGMENTS, Icon, LAUNCH_PLAN, press, type Block, type IconName, type PaletteItem } from '../product';
import { C, FEATURES, FONT, SHADOW } from '../theme';

/* ── the phone layout ─────────────────────────────────────────────────────── */

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Where things go on a 9:16 frame, so a phone shows the product big: the
 * punch captions in a band above the product (`captionTop`, the same place
 * `Captions` puts them by default: the eye enters the frame high, and the post
 * text and an ad's button grow up from the bottom), and the UI under them
 * (`ui`: 90% of the safe width, the same margin both sides so it stays
 * centred and clear of the right-hand buttons, down to 20 px above the bottom
 * margin). On a reel: captions at 330 (room for two lines at 92 px), ui
 * 150–930 × 530–1450. Size the UI inside `ui` so its body text is at least
 * 34 px, headings more: a crop of the part that matters, not the whole window
 * shrunk to fit.
 */
export function phoneLayout({ W, H, safe }: { W: number; H: number; safe: Safe }): { ui: Rect; captionTop: number } {
  const side = Math.max(safe.left, safe.right);
  const captionTop = safe.top + 80;
  const y = captionTop + 200;
  return { ui: { x: side, y, w: W - 2 * side, h: H - safe.bottom - 20 - y }, captionTop };
}

/**
 * A window onto a UI bigger than it: the children are drawn in stage px and
 * clipped to `rect` (rounded) over a card in the app's background, with a
 * hairline and a shadow. Put a <Camera> inside to push in and pan across the
 * part that matters (aim it with `aimAt`). `fade` (px) melts the bottom edge
 * where the UI runs on past the crop, rather than cutting a line in half;
 * `fadeRight` does the same for lines a push-in cuts at the right edge.
 */
export function Crop({ rect, radius = 36, fade = 0, fadeRight = 0, children }: { rect: Rect; radius?: number; fade?: number; fadeRight?: number; children: ReactNode }) {
  const { W, H } = useStage();
  const box: CSSProperties = { position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: radius, pointerEvents: 'none' };
  return (
    <>
      <div style={{ ...box, background: C.app, boxShadow: SHADOW.window }} />
      <AbsoluteFill style={{ clipPath: `inset(${rect.y}px ${W - rect.x - rect.w}px ${H - rect.y - rect.h}px ${rect.x}px round ${radius}px)` }}>{children}</AbsoluteFill>
      {fadeRight > 0 ? <div style={{ ...box, left: rect.x + rect.w - fadeRight, width: fadeRight, borderRadius: `0 ${radius}px ${radius}px 0`, background: `linear-gradient(90deg, ${C.app}00, ${C.app} 92%)` }} /> : null}
      {fade > 0 ? <div style={{ ...box, top: rect.y + rect.h - fade, height: fade, borderRadius: `0 0 ${radius}px ${radius}px`, background: `linear-gradient(180deg, ${C.app}00, ${C.app} 92%)` }} /> : null}
      <div style={{ ...box, boxShadow: `inset 0 0 0 1px ${C.line}` }} />
    </>
  );
}

/**
 * The reel's note: the Editor's phone layout (`compact`, ~353 px wide) ×2.21
 * fills the 780 px UI area, and its 15.5 px to-dos render at 34 px. ReelPalette
 * ends on this framing and ReelLive opens on it, so the cut between them is seamless.
 */
export const NOTE_S = 2.21;

/**
 * A Camera key that puts stage point (x, y) in the middle of `rect` (a Crop's
 * window) rather than the middle of the frame. At scale 1 on the rect's own
 * centre it is the resting framing.
 */
export function aimAt(t: number, x: number, y: number, scale: number, rect: Rect, W: number, H: number) {
  return { t, x: x - (rect.x + rect.w / 2 - W / 2) / scale, y: y - (rect.y + rect.h / 2 - H / 2) / scale, scale };
}

/* ── keycaps ──────────────────────────────────────────────────────────────── */

/** Big keycaps that pop in at `start`, press at `at`, and leave at `end`. Explains a shortcut without words. */
export function Keycaps({ keys, start, at, end, size = 96, style }: { keys: (IconName | string)[]; start: number; at: number; end: number; size?: number; style?: CSSProperties }) {
  const t = useTime();
  const k = pop(t, start, { bouncy: true }) * (1 - clamp((t - end) / 0.3));
  if (k <= 0.001) return null;
  return (
    <div style={{ display: 'flex', gap: size * 0.16, opacity: clamp(k * 2), transform: `translateY(${(1 - k) * 20}px) scale(${lerp(0.85, 1, k)})`, ...style }}>
      {keys.map((key, i) => {
        const p = press(t, at + i * 0.04);
        const icon = key === 'cmd' || key === 'enter';
        return (
          <div
            key={i}
            style={{
              minWidth: size,
              height: size,
              padding: `0 ${size * 0.22}px`,
              borderRadius: size * 0.22,
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(180deg, #2A2A33, #1B1B22)',
              boxShadow: `inset 0 1px 0 #FFFFFF22, inset 0 0 0 1px #FFFFFF14, 0 ${size * 0.08 * (1 - p)}px 0 #0B0B0F, 0 ${size * 0.3}px ${size * 0.6}px -${size * 0.2}px rgba(0,0,0,0.9)`,
              transform: `translateY(${p * size * 0.06}px)`,
              color: C.text,
              fontFamily: FONT.ui,
              fontFeatureSettings: FEATURES,
              fontWeight: 600,
              fontSize: size * 0.42,
            }}
          >
            {icon ? <Icon name={key as IconName} size={size * 0.44} stroke={2} color={C.text} /> : key}
          </div>
        );
      })}
    </div>
  );
}

/* ── the fragments: where they sit when scattered ──────────────────────────── */

export type Placed = { x: number; y: number; rot: number };

/** Around a centred title on a 1920×1080 frame: a band above it, a band below. */
export const SCATTER_WIDE: Placed[] = [
  { x: 110, y: 190, rot: -4 },
  { x: 520, y: 170, rot: 3 },
  { x: 930, y: 200, rot: -6 },
  { x: 1210, y: 165, rot: 2 },
  { x: 1600, y: 215, rot: -3 },
  { x: 230, y: 345, rot: 2 },
  { x: 1330, y: 290, rot: 5 },
  { x: 660, y: 355, rot: -2 },
  { x: 140, y: 690, rot: 3 },
  { x: 560, y: 790, rot: -3 },
  { x: 990, y: 690, rot: 2 },
  { x: 1450, y: 720, rot: -4 },
  { x: 290, y: 900, rot: -2 },
  { x: 1620, y: 810, rot: 6 },
  { x: 1150, y: 880, rot: 3 },
  { x: 690, y: 935, rot: -2 },
];

/** Around a title in the middle of a 1080×1920 frame. */
export const SCATTER_TALL: Placed[] = [
  { x: 40, y: 150, rot: -5 },
  { x: 560, y: 110, rot: 4 },
  { x: 700, y: 330, rot: -6 },
  { x: 90, y: 360, rot: 3 },
  { x: 610, y: 520, rot: -3 },
  { x: -40, y: 560, rot: 4 },
  { x: 760, y: 1010, rot: 6 },
  { x: 60, y: 1030, rot: -3 },
  { x: 480, y: 1130, rot: 2 },
  { x: 40, y: 1270, rot: 3 },
  { x: 560, y: 1330, rot: -4 },
  { x: 150, y: 1500, rot: -2 },
  { x: 620, y: 1560, rot: 5 },
  { x: 30, y: 1700, rot: 2 },
  { x: 540, y: 1760, rot: -3 },
  { x: 240, y: 1880, rot: 4 },
];

/**
 * The fragments, drawn at their scattered places. `fly(i)` gives each one's
 * arrival 0 → 1 (it flies in from outside the frame, away from the centre);
 * `to(i)` optionally moves it somewhere else with its own 0 → 1.
 */
export function Scatter({ layout, fly, scale = 1, center, to, drift = 1 }: { layout: Placed[]; fly: (i: number) => number; scale?: number; center: { x: number; y: number }; to?: (i: number) => { x: number; y: number; k: number; scale?: number; fade?: number } | null; drift?: number }) {
  const d = useDrawnTime();
  return (
    <AbsoluteFill>
      {FRAGMENTS.map((f, i) => {
        const p = layout[i];
        if (!p) return null;
        const k = fly(i);
        if (k <= 0.001) return null;
        const dx = p.x - center.x;
        const dy = p.y - center.y;
        const len = Math.hypot(dx, dy) || 1;
        const far = 1100;
        let x = lerp(p.x + (dx / len) * far, p.x, k);
        let y = lerp(p.y + (dy / len) * far, p.y, k);
        // idle float on drawn time, so a warped clock never makes it shiver
        y += Math.sin(d * 0.9 + i * 1.7) * 5 * drift;
        x += Math.cos(d * 0.7 + i * 2.3) * 3 * drift;
        let s = scale;
        let o = clamp(k * 2);
        let rot = p.rot * lerp(3, 1, k);
        const go = to?.(i);
        if (go) {
          x = lerp(x, go.x, go.k);
          y = lerp(y, go.y, go.k);
          s = lerp(scale, go.scale ?? scale, go.k);
          rot = lerp(rot, 0, go.k);
          // it fades as it lands (unless fade: 0), handing over to whatever it became
        if ((go.fade ?? 1) > 0) o *= 1 - clamp((go.k - 0.75) * 4);
        }
        if (o <= 0.001) return null;
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, opacity: o, transform: `rotate(${rot}deg) scale(${s})`, transformOrigin: '0 0' }}>
            <FragmentCard f={f} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

/** Each fragment's arrival, in a shuffled order so they do not land left to right. */
export function arrival(t: number, start: number, i: number, each = 0.045): number {
  const order = Math.floor(rand(i * 13 + 5) * 1000) % 16;
  return pop(t, start + ((order + i) % 16) * each);
}

/* ── palette contents ───────────────────────────────────────────────────── */

export const PALETTE_HOME: PaletteItem[] = [
  { group: 'Recent', icon: 'note', label: 'Q3 launch plan', hint: 'Launch', color: '#FFB547' },
  { group: 'Recent', icon: 'note', label: 'Weekly sync, Oct 2', hint: 'Team', color: '#B996FF' },
  { group: 'Actions', icon: 'compose', label: 'New note' },
  { group: 'Actions', icon: 'share', label: 'Share note…' },
  { group: 'Actions', icon: 'users', label: 'Invite a teammate' },
];

export const PALETTE_SHARE: PaletteItem[] = [
  { group: 'Actions', icon: 'share', label: 'Share note…', hint: 'This note', color: C.accent },
  { group: 'Actions', icon: 'link', label: 'Copy share link' },
  { group: 'Go to', icon: 'users', label: 'Shared with me' },
];

export const PALETTE_LAUNCH: PaletteItem[] = [
  { group: 'Notes', icon: 'note', label: 'Q3 launch plan', hint: 'Launch', color: '#FFB547' },
  { group: 'Notes', icon: 'checklist', label: 'Launch checklist', hint: 'Team', color: '#B996FF' },
  { group: 'Spaces', icon: 'hash', label: 'Launch', hint: '12 notes', color: '#FFB547' },
];

export const PALETTE_NEW: PaletteItem[] = [
  { group: 'Actions', icon: 'compose', label: 'New note', hint: 'N', color: C.accent },
  { group: 'Actions', icon: 'checklist', label: 'New checklist' },
  { group: 'Go to', icon: 'note', label: 'Notes shared with me' },
];

/* ── the launch plan ────────────────────────────────────────────────────── */

/** The launch plan's blocks, each arrival and tick a number the scene passes. */
export function launchBlocks({ enter = [1, 1, 1, 1], done = [0, 0, 0], third, more = false }: { enter?: number[]; done?: number[]; third?: Block['text']; more?: boolean } = {}): Block[] {
  const [owner1, owner2, owner3] = LAUNCH_PLAN.owners;
  const blocks: Block[] = [
    { kind: 'h', text: 'This week', enter: enter[0] },
    { kind: 'todo', text: LAUNCH_PLAN.todos[0], done: done[0], owner: owner1, enter: enter[1] },
    { kind: 'todo', text: LAUNCH_PLAN.todos[1], done: done[1], owner: owner2, enter: enter[2] },
    { kind: 'todo', text: third ?? LAUNCH_PLAN.todos[2], done: done[2], owner: owner3, enter: enter[3] },
  ];
  if (more) {
    blocks.push({ kind: 'h', text: 'Goal' }, { kind: 'p', text: LAUNCH_PLAN.goal }, { kind: 'callout', text: LAUNCH_PLAN.decision });
  }
  return blocks;
}

/** A soft dark band under top captions, so they stay readable when the camera fills the frame. */
export function CaptionScrim({ amount, height = 300 }: { amount: number; height?: number }) {
  if (amount <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height,
        background: `linear-gradient(180deg, rgba(7,7,10,${0.97 * amount}) 0%, rgba(7,7,10,${0.94 * amount}) 52%, rgba(7,7,10,${0.5 * amount}) 75%, transparent 100%)`,
      }}
    />
  );
}
