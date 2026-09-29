/**
 * The motion kit: a cursor that moves like a hand, a camera that leans in on
 * what the caption talks about, a focus that dims everything else, callouts,
 * toasts, the backdrop, film grain, the safe-zone overlay and the end card.
 * Every component is a pure function of the scene clock (seconds).
 */
import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { alpha, C, FEATURES, FONT, GRADIENT } from '../theme';
import { bezier, clamp, EASE, EASINGS, lerp, pop, prog } from './anim';
import { Words } from './text';
import { useDrawnTime, useStage, useTime } from './time';

/* ── cursor ─────────────────────────────────────────────────────────────── */

type Waypoint = { t: number; x: number; y: number };

/** Where the cursor is at time t: eased segments between waypoints, each bowed a little like a wrist turning. */
export function cursorAt(path: Waypoint[], t: number): { x: number; y: number } {
  if (path.length === 0) return { x: 0, y: 0 };
  if (t <= path[0].t) return path[0];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    if (t > b.t) continue;
    const k = EASINGS.inOut(clamp((t - a.t) / Math.max(1e-6, b.t - a.t)));
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const bow = Math.min(60, len * 0.1);
    const nx = (-dy / len) * bow;
    const ny = (dx / len) * bow;
    const [x, y] = bezier(k, [a.x, a.y], [a.x + dx * 0.3 + nx, a.y + dy * 0.3 + ny], [a.x + dx * 0.75 + nx * 0.5, a.y + dy * 0.75 + ny * 0.5], [b.x, b.y]);
    return { x, y };
  }
  return path[path.length - 1];
}

/**
 * A mouse cursor gliding between waypoints (stage px). A click is a quick
 * press and release with a soft ring. With `label`, it is a teammate's
 * cursor: filled in `color` with their name beside it.
 */
export function Cursor({ path, clicks = [], label, color, scale = 1, hideAfter }: { path: Waypoint[]; clicks?: number[]; label?: string; color?: string; scale?: number; hideAfter?: number }) {
  const t = useTime();
  if (!path.length) return null;
  const show = prog(t, path[0].t - 0.2, 0.2) * (hideAfter !== undefined ? 1 - prog(t, hideAfter, 0.25) : 1);
  if (show <= 0.001) return null;
  const { x, y } = cursorAt(path, t);
  let press = 0;
  let ring = -1;
  for (const c of clicks) {
    const u = (t - c + 0.06) / 0.2;
    if (u > 0 && u < 1) press = Math.max(press, Math.sin(Math.PI * u));
    if (t >= c && t < c + 0.55) ring = (t - c) / 0.55;
  }
  const fill = label ? (color ?? C.accent) : '#FFFFFF';
  const size = 34 * scale;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: show, pointerEvents: 'none', zIndex: 50 }}>
      {ring >= 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: lerp(10, 64, EASE(ring)) * scale,
            height: lerp(10, 64, EASE(ring)) * scale,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: `${2 * scale}px solid ${alpha(label ? fill : '#FFFFFF', 0.6 * (1 - ring))}`,
            background: alpha(label ? fill : '#FFFFFF', 0.12 * (1 - ring)),
          }}
        />
      ) : null}
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ position: 'absolute', left: (-6 / 32) * size, top: (-3 / 32) * size, overflow: 'visible', transformOrigin: `${(6 / 32) * 100}% ${(3 / 32) * 100}%`, transform: `scale(${1 - press * 0.12})`, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.55))' }}
      >
        <path d="M6 3 L6 25 L11.5 19.8 L15.2 28 L19 26.3 L15.4 18.3 L22.8 18.3 Z" fill={fill} stroke={label ? '#FFFFFF' : '#0B0B0F'} strokeWidth={1.7} strokeLinejoin="round" />
      </svg>
      {label ? (
        <div
          style={{
            position: 'absolute',
            left: 16 * scale,
            top: 24 * scale,
            padding: `${4 * scale}px ${10 * scale}px`,
            borderRadius: `${4 * scale}px ${12 * scale}px ${12 * scale}px ${12 * scale}px`,
            background: fill,
            color: 'rgba(8,8,12,0.88)',
            fontFamily: FONT.ui,
            fontWeight: 700,
            fontSize: 14 * scale,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            boxShadow: '0 6px 16px -6px rgba(0,0,0,0.6)',
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}

/* ── camera ─────────────────────────────────────────────────────────────── */

/** A camera key. `ease` shapes the move that ends on this key (default `EASINGS.inOut`). */
type Key = { t: number; x: number; y: number; scale: number; ease?: (x: number) => number };

/** The framing at time t: eased between keys, zoom interpolated in log space so it feels even. */
export function cameraAt(keys: Key[], t: number, W: number, H: number): Key {
  if (!keys.length) return { t, x: W / 2, y: H / 2, scale: 1 };
  if (t <= keys[0].t) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t > b.t) continue;
    const k = (b.ease ?? EASINGS.inOut)(clamp((t - a.t) / Math.max(1e-6, b.t - a.t)));
    return { t, x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), scale: Math.exp(lerp(Math.log(a.scale), Math.log(b.scale), k)) };
  }
  return keys[keys.length - 1];
}

/**
 * Push-ins and pans. Each key says: at time t, put stage point (x, y) in the
 * middle of the frame at this zoom. { x: W/2, y: H/2, scale: 1 } is no camera.
 * The move into a key eases with its `ease` (default EASINGS.inOut, which
 * starts and ends at rest); `ease: EASINGS.commit` gives a push that commits
 * fast and settles long, like a hand on a real camera.
 * Lean in on what the caption is about; one move at a time; hold still while
 * something is read.
 */
export function Camera({ keys, children }: { keys: Key[]; children: ReactNode }) {
  const t = useTime();
  const { W, H } = useStage();
  const c = cameraAt(keys, t, W, H);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${W / 2 - c.x * c.scale}px, ${H / 2 - c.y * c.scale}px) scale(${c.scale})` }}>{children}</div>
    </AbsoluteFill>
  );
}

/* ── focus ──────────────────────────────────────────────────────────────── */

type Rect = { x: number; y: number; w: number; h: number };

/**
 * Dims and blurs everything but `rect`. `active` may be a number 0 → 1 to
 * fade the effect in and out. The children are drawn twice (a dimmed copy and
 * a sharp copy clipped to the rect), so keep them pure functions of time.
 */
export function Focus({ active, rect, children, radius = 18, dim = 0.6, blur = 5 }: { active: boolean | number; rect: Rect; children: ReactNode; radius?: number; dim?: number; blur?: number }) {
  const k = clamp(typeof active === 'number' ? active : active ? 1 : 0);
  if (k <= 0.001) return <AbsoluteFill>{children}</AbsoluteFill>;
  const { x, y, w, h } = rect;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: `blur(${k * blur}px) brightness(${1 - dim * k}) saturate(${1 - 0.35 * k})` }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(${y}px calc(100% - ${x + w}px) calc(100% - ${y + h}px) ${x}px round ${radius}px)` }}>{children}</AbsoluteFill>
      <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: radius, boxShadow: `0 0 90px ${alpha(C.accent, 0.1 * k)}`, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
}

/* ── callout ────────────────────────────────────────────────────────────── */

/** A dot on a point, a line that draws out from it, and a label at its end. */
export function Callout({ at, text, start, side = 'right', color = C.accent, length = 90 }: { at: { x: number; y: number }; text: string; start: number; side?: 'left' | 'right' | 'top' | 'bottom'; color?: string; length?: number }) {
  const t = useTime();
  const dot = pop(t, start, { bouncy: true });
  const line = prog(t, start + 0.12, 0.35);
  const label = pop(t, start + 0.35);
  if (dot <= 0.001) return null;
  const dir = { right: [1, 0], left: [-1, 0], top: [0, -1], bottom: [0, 1] }[side];
  const ex = at.x + dir[0] * length;
  const ey = at.y + dir[1] * length;
  const anchor: CSSProperties =
    side === 'right'
      ? { left: ex + 10, top: ey, transform: 'translateY(-50%)' }
      : side === 'left'
        ? { left: ex - 10, top: ey, transform: 'translate(-100%, -50%)' }
        : side === 'top'
          ? { left: ex, top: ey - 10, transform: 'translate(-50%, -100%)' }
          : { left: ex, top: ey + 10, transform: 'translate(-50%, 0)' };
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
        <line x1={at.x} y1={at.y} x2={lerp(at.x, ex, line)} y2={lerp(at.y, ey, line)} stroke={color} strokeWidth={2} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', left: at.x - 7, top: at.y - 7, width: 14, height: 14, borderRadius: '50%', background: color, transform: `scale(${dot})`, boxShadow: `0 0 0 6px ${alpha(color, 0.2)}` }} />
      <div
        style={{
          position: 'absolute',
          ...anchor,
          opacity: clamp(label * 1.5),
          padding: '8px 14px',
          borderRadius: 10,
          background: '#1D1D25',
          boxShadow: `inset 0 0 0 1px ${alpha(color, 0.4)}, 0 12px 30px -12px rgba(0,0,0,0.8)`,
          color: C.text,
          fontFamily: FONT.ui,
          fontFeatureSettings: FEATURES,
          fontWeight: 600,
          fontSize: 20,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}

/* ── toast and badge ────────────────────────────────────────────────────── */

/** A confirmation that slides up at `start` and away at `end`. Absolutely positioned: bottom centre of its parent. */
export function Toast({ text, start, end, icon, bottom = 28 }: { text: string; start: number; end: number; icon?: ReactNode; bottom?: number }) {
  const t = useTime();
  const k = pop(t, start) * (1 - prog(t, end, 0.3, EASINGS.in));
  if (k <= 0.001) return null;
  return (
    <div style={{ position: 'absolute', left: '50%', bottom, transform: `translate(-50%, ${(1 - k) * 18}px) scale(${lerp(0.96, 1, k)})`, opacity: clamp(k * 1.5) }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 18px 10px 11px',
          borderRadius: 12,
          background: '#202029',
          boxShadow: `inset 0 0 0 1px ${C.lineStrong}, 0 20px 50px -16px rgba(0,0,0,0.9)`,
          fontFamily: FONT.ui,
          fontFeatureSettings: FEATURES,
          fontSize: 14.5,
          fontWeight: 600,
          color: C.text,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center', background: alpha(C.ok, 0.16) }}>
          {icon ?? (
            <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke={C.ok} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          )}
        </span>
        {text}
      </div>
    </div>
  );
}

export function Badge({ text, color = C.accent, size = 14 }: { text: string; color?: string; size?: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: size * 1.9,
        padding: `0 ${size * 0.75}px`,
        borderRadius: 999,
        background: alpha(color, 0.14),
        boxShadow: `inset 0 0 0 1px ${alpha(color, 0.3)}`,
        color,
        fontFamily: FONT.ui,
        fontWeight: 600,
        fontSize: size,
        letterSpacing: '-0.005em',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}

/* ── backdrop and grain ─────────────────────────────────────────────────── */

/**
 * The stage: theme background, a soft warm light at (x%, y%), a cool
 * counter-light, a vignette. `glow` 0 → 1, default 0.15: keep it at 0–0.2 so
 * the product carries the colour (a strong glow under every scene is the
 * generic "dark SaaS gradient"), and raise it only for a lighting moment
 * such as a reveal.
 */
export function Backdrop({ glow = 0.15, x = 50, y = 38, grid = false }: { glow?: number; x?: number; y?: number; grid?: boolean }) {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(ellipse 55% 45% at ${x}% ${y}%, ${alpha(C.accent, 0.11 * glow)}, transparent 70%)`,
            `radial-gradient(ellipse 50% 40% at ${100 - x * 0.6}% ${Math.min(95, y + 45)}%, ${alpha(C.info, 0.07 * glow)}, transparent 70%)`,
            'linear-gradient(180deg, rgba(255,255,255,0.018), transparent 35%)',
          ].join(', '),
        }}
      />
      {grid ? (
        <AbsoluteFill
          style={{
            background: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1.2px, transparent 0) 0 0 / 28px 28px',
            maskImage: `radial-gradient(ellipse 60% 55% at ${x}% ${y}%, black, transparent 75%)`,
            WebkitMaskImage: `radial-gradient(ellipse 60% 55% at ${x}% ${y}%, black, transparent 75%)`,
          }}
        />
      ) : null}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 120% 95% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
    </AbsoluteFill>
  );
}

/** Film grain, redrawn 24 times a second. Off on phone cuts: feed compression smears it into mush. */
export function Grain({ opacity = 0.05 }: { opacity?: number }) {
  const t = useDrawnTime();
  const seed = Math.floor(t * 24) % 97;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'overlay', opacity }}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
}

/* ── safe zones ─────────────────────────────────────────────────────────── */

/**
 * Debug overlay: the margins the platform may cover (red), and on a 9:16
 * frame the centred 3:4 crop a profile grid shows (dashed blue). Rendered by
 * the player only when the `safe` input prop is true (scripts/stills.mjs --safe).
 * A cover still passes `margins={false}`: in the grid nothing covers it, and
 * only the 3:4 crop matters.
 */
export function SafeZones({ margins = true }: { margins?: boolean }) {
  const { W, H, safe, format } = useStage();
  const band: CSSProperties = { position: 'absolute', background: 'repeating-linear-gradient(135deg, rgba(255,60,60,0.30) 0 10px, rgba(255,60,60,0.16) 10px 20px)' };
  const label: CSSProperties = { position: 'absolute', fontFamily: FONT.mono, fontSize: 20, color: '#FFD0D0', background: 'rgba(120,0,0,0.75)', padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' };
  const tall = Math.abs(H / W - 16 / 9) < 0.01;
  const crop = tall ? { top: (H - (W * 4) / 3) / 2, h: (W * 4) / 3 } : null;
  const shade: CSSProperties = { position: 'absolute', left: 0, right: 0, background: 'rgba(0,40,70,0.55)' };
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 1000 }}>
      {margins && safe.top > 0 ? <div style={{ ...band, left: 0, right: 0, top: 0, height: safe.top }} /> : null}
      {margins && safe.bottom > 0 ? <div style={{ ...band, left: 0, right: 0, bottom: 0, height: safe.bottom }} /> : null}
      {margins && safe.left > 0 ? <div style={{ ...band, left: 0, top: safe.top, bottom: safe.bottom, width: safe.left }} /> : null}
      {margins && safe.right > 0 ? <div style={{ ...band, right: 0, top: safe.top, bottom: safe.bottom, width: safe.right }} /> : null}
      {margins ? <div style={{ position: 'absolute', left: safe.left, top: safe.top, right: safe.right, bottom: safe.bottom, border: '2px dashed rgba(255,120,120,0.9)' }} /> : null}
      {crop && !margins ? <div style={{ ...shade, top: 0, height: crop.top }} /> : null}
      {crop && !margins ? <div style={{ ...shade, bottom: 0, height: crop.top }} /> : null}
      {crop ? <div style={{ position: 'absolute', left: 0, right: 0, top: crop.top, height: crop.h, border: '3px dashed rgba(90,200,255,0.9)' }} /> : null}
      {/* labels on opposite sides, so they never sit on each other */}
      {crop ? <div style={{ ...label, right: 12, top: crop.top + 8, color: '#D0F0FF', background: 'rgba(0,70,110,0.8)' }}>3:4 grid crop</div> : null}
      {margins ? (
        <div style={{ ...label, left: safe.left + 8, top: safe.top + 8 }}>
          {safe.top + safe.right + safe.bottom + safe.left > 0 ? `${format} safe area · ${W}×${H}` : `${W}×${H} · no platform margins`}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

/* ── end card ───────────────────────────────────────────────────────────── */

/**
 * The closing card: logo, product name, URL and one call to action. The
 * pieces arrive from `start` (or at `times`, e.g. marks from cuts.json).
 * Laid out in the middle of the safe area. On a phone the name, the call to
 * action and the gaps are ×1.4 (a 174 px name, a 45 px call to action), so
 * the card reads as boldly as the phone-native scenes before it. The URL is
 * 56 px in both shapes: it is the line people type later, and a 16:9 film
 * in a phone feed shrinks 1920 px to about 390 pt, where 56 px is ~11 pt.
 * The logo settles in from 0.94 with a calm spring (no blur); the name is
 * the film's end headline, so it keeps the `Words` blur-rise.
 */
export function EndCard({
  title,
  url,
  cta,
  start = 0,
  logo,
  times = {},
}: {
  title: string;
  url: string;
  cta: string;
  start?: number;
  logo?: ReactNode;
  times?: { title?: number; url?: number; cta?: number };
}) {
  const t = useTime();
  const { W, H, safe, portrait } = useStage();
  const tTitle = times.title ?? start + 0.2;
  const tUrl = times.url ?? start + 0.7;
  const tCta = times.cta ?? start + 1.1;
  const s = pop(t, start);
  const u = pop(t, tUrl);
  const c = pop(t, tCta, { bouncy: true });
  const shine = prog(t, tCta + 0.9, 0.9, EASINGS.inOut);
  const cy = safe.top + (H - safe.top - safe.bottom) / 2;
  const k = portrait ? 1.4 : 1;
  const maxWidth = W - 2 * Math.max(safe.left, safe.right);
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: cy, transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {logo ? (
          <div style={{ opacity: clamp(s * 2), transform: `scale(${lerp(0.94, 1, s)})`, marginBottom: 30 * k }}>{logo}</div>
        ) : null}
        <Words text={title} start={tTitle} step={0.06} size={124 * k} weight={700} tracking={-0.045} maxWidth={maxWidth} />
        <div style={{ marginTop: 14 * k, opacity: clamp(u * 1.5), transform: `translateY(${(1 - u) * 16}px)`, fontFamily: FONT.ui, fontFeatureSettings: FEATURES, fontSize: 56, fontWeight: 500, letterSpacing: '-0.02em', color: C.dim }}>{url}</div>
        <div
          style={{
            marginTop: 46 * k,
            position: 'relative',
            overflow: 'hidden',
            opacity: clamp(c * 2),
            transform: `scale(${lerp(0.85, 1, c)})`,
            padding: `${20 * k}px ${44 * k}px`,
            borderRadius: 999,
            background: GRADIENT,
            boxShadow: `inset 0 1px 0 #FFFFFF66, 0 20px 60px -20px ${alpha(C.accent2, 0.9)}`,
            color: '#1A0F05',
            fontFamily: FONT.ui,
            fontFeatureSettings: FEATURES,
            fontSize: 32 * k,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {cta}
          {shine > 0 && shine < 1 ? (
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${lerp(-40, 130, shine)}%`, width: '30%', transform: 'skewX(-20deg)', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }} />
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
}
