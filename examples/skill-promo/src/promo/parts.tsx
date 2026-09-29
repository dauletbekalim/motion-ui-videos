/**
 * The promo's own pieces: the skill's mark and name, where things go on each
 * frame shape, a code card, a terminal, labels, a spectrogram and a waveform.
 * Everything takes its colours from src/theme.ts, so the promo sits in the
 * same world as the Lumen demo it shows.
 */
import type { CSSProperties, ReactNode } from 'react';
import { clamp, lerp } from '../lib/anim';
import type { Safe } from '../formats';
import { phoneLayout, type Rect } from '../scenes/common';
import { alpha, C, FEATURES, FONT, SHADOW } from '../theme';

/** What the end card, the cover and the social preview say. Nothing here the repo doesn't do. */
export const PROMO = {
  name: 'motion-ui-videos',
  url: 'github.com/dauletbekalim/motion-ui-videos',
  line: 'free & open source · Claude Code skill',
  headline: 'Product videos, written as code.',
} as const;

/* ── layout ───────────────────────────────────────────────────────────────── */

/**
 * Where things go. On a phone (9:16): the template's phone layout, the punch
 * captions in a band at 330 and the UI under them in x 150–930 × y 530–1450
 * (captions-and-type §7: the eye enters high, and the post text and an ad's
 * button grow up from the bottom). On 16:9: calm captions at the top, and the
 * content below them inside the safe margins.
 */
export function promoLayout(stage: { W: number; H: number; safe: Safe; portrait: boolean }): { portrait: boolean; ui: Rect; captionTop: number } {
  const { W, H, safe, portrait } = stage;
  if (portrait) return { portrait, ...phoneLayout(stage) };
  const y = 196;
  return { portrait, ui: { x: safe.left, y, w: W - safe.left - safe.right, h: H - safe.bottom - 22 - y }, captionTop: safe.top + 30 };
}

/* ── the mark ─────────────────────────────────────────────────────────────── */

/**
 * The skill's mark: three clips on a timeline and the playhead crossing them,
 * which is the whole idea (picture and sound on one timeline). `draw` 0 → 1
 * slides the clips in and drops the playhead.
 */
export function SkillMark({ size = 64, draw = 1, glow = 0 }: { size?: number; draw?: number; glow?: number }) {
  const d = clamp(draw);
  const bar = (i: number) => clamp(d * 1.6 - i * 0.25);
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      {glow > 0 ? <div style={{ position: 'absolute', inset: -size * 0.8, background: `radial-gradient(closest-side, ${alpha(C.accent, 0.3 * glow)}, ${alpha(C.accent2, 0.1 * glow)} 55%, transparent)` }} /> : null}
      <svg viewBox="0 0 64 64" width={size} height={size} style={{ position: 'relative', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="pm-tile" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#23232C" />
            <stop offset="1" stopColor="#131318" />
          </linearGradient>
          <linearGradient id="pm-hot" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={C.accent} />
            <stop offset="1" stopColor={C.accent2} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="64" height="64" rx="16" fill="url(#pm-tile)" />
        <rect x="0.5" y="0.5" width="63" height="63" rx="15.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.12" />
        {/* three clips, the middle one lit */}
        <rect x={11} y={16.5} width={21 * bar(0)} height={8} rx={4} fill="#FFFFFF" fillOpacity={0.3} />
        <rect x={20} y={28} width={33 * bar(1)} height={8} rx={4} fill="url(#pm-hot)" />
        <rect x={11} y={39.5} width={31 * bar(2)} height={8} rx={4} fill="#FFFFFF" fillOpacity={0.3} />
        {/* the playhead */}
        <g opacity={clamp(d * 2 - 0.6)} transform={`translate(0 ${(1 - clamp(d * 1.5 - 0.5)) * -6})`}>
          <rect x={37} y={13} width={2.4} height={39} rx={1.2} fill="#FFFDF8" />
          <path d="M33.7 9h9l-4.5 5.2z" fill="#FFFDF8" />
        </g>
      </svg>
    </div>
  );
}

/** The name, set in the mono face: it is a repo, and it reads as one. */
export function SkillName({ size = 48, color = C.text, style }: { size?: number; color?: string; style?: CSSProperties }) {
  return <span style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: size, letterSpacing: '-0.03em', color, lineHeight: 1, whiteSpace: 'nowrap', ...style }}>{PROMO.name}</span>;
}

/* ── code ─────────────────────────────────────────────────────────────────── */

export type Kind = 'tag' | 'attr' | 'str' | 'num' | 'key' | 'punc' | 'plain' | 'dim';
export type Tok = [string, Kind?];

export const CODE: Record<Kind, string> = {
  tag: '#7AA2FF',
  attr: '#C9A7FF',
  str: '#86E0A6',
  num: C.accent,
  key: '#8FB8FF',
  punc: '#7C7C8A',
  plain: '#D8D8E0',
  dim: '#5C5C68',
};

/**
 * A code file: a tab with its name, then lines of coloured tokens. `lit` (one
 * 0 → 1 per line) washes a line in the accent as it is read; `shown` (0 → 1
 * per line) types it in.
 */
export function CodeCard({ file, lines, size = 32, width, lit = [], shown, pad = 30, numbers = true, style, header = true }: { file: string; lines: Tok[][]; size?: number; width: number; lit?: number[]; shown?: number[]; pad?: number; numbers?: boolean; style?: CSSProperties; header?: boolean }) {
  const lh = size * 1.55;
  return (
    <div style={{ width, borderRadius: size * 0.7, overflow: 'hidden', background: 'linear-gradient(180deg, #121217, #0E0E12)', boxShadow: SHADOW.window, fontFamily: FONT.mono, ...style }}>
      {header ? (
        <div style={{ height: size * 1.7, display: 'flex', alignItems: 'flex-end', padding: `0 ${pad * 0.6}px`, background: '#0B0B0E', borderBottom: `1px solid ${C.line}` }}>
          <div style={{ height: size * 1.35, display: 'flex', alignItems: 'center', gap: size * 0.35, padding: `0 ${size * 0.6}px`, borderRadius: `${size * 0.35}px ${size * 0.35}px 0 0`, background: '#121217', boxShadow: `inset 0 1px 0 ${C.line}, inset 1px 0 0 ${C.line}, inset -1px 0 0 ${C.line}`, fontSize: size * 0.62, fontWeight: 500, color: C.dim }}>
            <span style={{ width: size * 0.3, height: size * 0.3, borderRadius: '50%', background: alpha(C.info, 0.8) }} />
            {file}
          </div>
        </div>
      ) : null}
      <div style={{ position: 'relative', padding: `${pad * 0.6}px 0 ${pad * 0.7}px` }}>
        {lines.map((line, i) => {
          const s = shown ? clamp(shown[i] ?? 0) : 1;
          const l = clamp(lit[i] ?? 0);
          return (
            <div key={i} style={{ position: 'relative', height: lh, display: 'flex', alignItems: 'center', paddingLeft: pad, paddingRight: pad, fontSize: size, fontWeight: 500, letterSpacing: '-0.02em', whiteSpace: 'pre' }}>
              {l > 0.001 ? <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, background: alpha(C.accent, 0.13 * l), boxShadow: `inset ${4 * l}px 0 0 ${alpha(C.accent, l)}` }} /> : null}
              {numbers ? <span style={{ position: 'relative', width: size * 1.5, color: l > 0.5 ? alpha(C.accent, 0.9) : CODE.dim, fontSize: size * 0.8 }}>{i + 1}</span> : null}
              <span style={{ position: 'relative', opacity: clamp(s * 2), transform: `translateX(${(1 - s) * -10}px)` }}>
                {line.map(([text, kind = 'plain'], j) => (
                  <span key={j} style={{ color: CODE[kind] }}>
                    {text}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── terminal ─────────────────────────────────────────────────────────────── */

/** A terminal window: three dots, a title, a dark body. The children are its lines. */
export function Terminal({ width, height, title, size = 30, children, style }: { width: number; height?: number; title: string; size?: number; children: ReactNode; style?: CSSProperties }) {
  const bar = size * 1.6;
  return (
    <div style={{ width, height, borderRadius: size * 0.75, overflow: 'hidden', background: 'linear-gradient(180deg, #111115, #0C0C0F)', boxShadow: SHADOW.window, fontFamily: FONT.mono, display: 'flex', flexDirection: 'column', ...style }}>
      <div style={{ position: 'relative', height: bar, flex: 'none', display: 'flex', alignItems: 'center', padding: `0 ${size * 0.6}px`, background: '#0A0A0D', borderBottom: `1px solid ${C.line}` }}>
        <div style={{ display: 'flex', gap: size * 0.28 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: size * 0.4, height: size * 0.4, borderRadius: '50%', background: '#FFFFFF1C' }} />
          ))}
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: FONT.ui, fontFeatureSettings: FEATURES, fontSize: size * 0.56, fontWeight: 600, color: C.faint, letterSpacing: '-0.01em' }}>{title}</div>
      </div>
      <div style={{ position: 'relative', flex: 1, padding: `${size * 0.9}px ${size * 1.0}px`, fontSize: size, color: '#D8D8E0', letterSpacing: '-0.02em' }}>{children}</div>
    </div>
  );
}

/** A reply line in the terminal: a dot and the words. `k` 0 → 1 brings it in. */
export function Reply({ k, dot = C.accent, children, size, style }: { k: number; dot?: string; children: ReactNode; size: number; style?: CSSProperties }) {
  if (k <= 0.001) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: size * 0.55, opacity: clamp(k * 2), transform: `translateY(${(1 - k) * 12}px)`, ...style }}>
      <span style={{ width: size * 0.36, height: size * 0.36, borderRadius: '50%', flex: 'none', background: dot, transform: `translateY(${-size * 0.08}px)`, boxShadow: `0 0 ${size * 0.4}px ${alpha(dot, 0.5)}` }} />
      <span>{children}</span>
    </div>
  );
}

/* ── labels ───────────────────────────────────────────────────────────────── */

/** A small label pill: a format name, a file, a verdict. */
export function Pill({ children, size = 22, color = C.dim, bg = '#1A1A21', border = C.lineStrong, mono = false, style }: { children: ReactNode; size?: number; color?: string; bg?: string; border?: string; mono?: boolean; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.4,
        height: size * 1.8,
        padding: `0 ${size * 0.7}px`,
        borderRadius: 999,
        background: bg,
        boxShadow: `inset 0 0 0 1px ${border}, 0 10px 30px -12px rgba(0,0,0,0.8)`,
        color,
        fontFamily: mono ? FONT.mono : FONT.ui,
        fontFeatureSettings: FEATURES,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: mono ? '-0.02em' : '-0.01em',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ── spectrogram ──────────────────────────────────────────────────────────── */

/** Energy 0 → 1 as a warm colour: the stage, wine, the brand's orange, amber, near white. */
export function heat(v: number): string {
  const stops: [number, number[]][] = [
    [0, [15, 15, 19]],
    [0.3, [52, 24, 40]],
    [0.58, [255, 122, 89]],
    [0.82, [255, 181, 71]],
    [1, [255, 244, 220]],
  ];
  const x = clamp(v);
  let i = 0;
  while (i < stops.length - 2 && x > stops[i + 1][0]) i++;
  const [a, ca] = stops[i];
  const [b, cb] = stops[i + 1];
  const k = (x - a) / (b - a);
  const c = ca.map((v0, j) => Math.round(lerp(v0, cb[j], k)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/**
 * A spectrogram from measured data: `data[column][row]` 0 → 1, time left to
 * right, low bands at the bottom. `reveal` 0 → 1 draws it in from the left
 * (a playhead at its edge); `glow` lifts it.
 */
export function Spectro({ data, width, height, reveal = 1, radius = 14, playhead = true, style }: { data: number[][]; width: number; height: number; reveal?: number; radius?: number; playhead?: boolean; style?: CSSProperties }) {
  const cols = data.length;
  const rows = data[0]?.length ?? 1;
  const cw = width / cols;
  const rh = height / rows;
  const shown = clamp(reveal) * cols;
  return (
    <div style={{ position: 'relative', width, height, borderRadius: radius, overflow: 'hidden', background: '#0F0F13', boxShadow: `inset 0 0 0 1px ${C.line}`, ...style }}>
      <svg width={width} height={height} style={{ display: 'block', filter: `blur(${Math.max(1, Math.min(cw, rh) * 0.8)}px)`, transform: 'scale(1.02)' }}>
        {data.map((col, i) =>
          i < shown
            ? col.map((v, j) =>
                v > 0.08 ? <rect key={`${i}-${j}`} x={i * cw} y={height - (j + 1) * rh} width={cw + 0.6} height={rh + 0.6} fill={heat(v * clamp(shown - i))} /> : null,
              )
            : null,
        )}
      </svg>
      {playhead && reveal > 0.001 && reveal < 0.999 ? <div style={{ position: 'absolute', top: 0, bottom: 0, left: clamp(reveal) * width - 1, width: 2, background: '#FFF4DC', boxShadow: `0 0 16px ${alpha(C.accent, 0.9)}` }} /> : null}
    </div>
  );
}

/* ── waveform ─────────────────────────────────────────────────────────────── */

export type WaveEvent = { x: number; kind: 'click' | 'pop' | 'keys'; lit: number; len?: number };

/**
 * A waveform whose spikes are the sounds placed on the marks: a click is a
 * sharp spike, a pop a rounder one, typing a run of small ones. Between them,
 * the quiet bed. Drawn as mirrored bars; bars left of `head` (0 → 1) are
 * played and brighter.
 */
export function Wave({ events, width, height, head = 0, bars = 120, seed = 3 }: { events: WaveEvent[]; width: number; height: number; head?: number; bars?: number; seed?: number }) {
  const bw = width / bars;
  const amp = (u: number) => {
    let a = 0.07 + 0.035 * Math.sin(u * 37 + seed) + 0.03 * Math.sin(u * 91 + seed * 2);
    let lit = 0;
    for (const e of events) {
      const d = u - e.x;
      let v = 0;
      if (e.kind === 'click') v = d >= -0.004 ? Math.exp(-Math.max(0, d) * 90) * 0.95 : 0;
      else if (e.kind === 'pop') v = d >= -0.006 ? Math.exp(-Math.max(0, d) * 38) * 0.78 * Math.min(1, (d + 0.006) / 0.012) : 0;
      else {
        const len = e.len ?? 0.2;
        if (d >= 0 && d <= len) {
          const n = 9;
          const ph = (d / len) * n;
          v = 0.42 * Math.exp(-(ph % 1) * 5) * (0.8 + 0.2 * Math.sin(ph * 2.3));
        }
      }
      if (v > a) {
        a = v;
        lit = e.lit;
      }
    }
    return { a, lit };
  };
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      {Array.from({ length: bars }, (_, i) => {
        const u = (i + 0.5) / bars;
        const { a, lit } = amp(u);
        const h = Math.max(3, a * height * 0.94);
        const played = u <= head;
        const col = lit > 0.01 ? `rgba(255,${Math.round(lerp(200, 181, lit))},${Math.round(lerp(200, 71, lit))},${lerp(played ? 0.75 : 0.35, 1, lit)})` : played ? 'rgba(237,237,242,0.72)' : 'rgba(237,237,242,0.26)';
        return <rect key={i} x={i * bw + bw * 0.18} y={(height - h) / 2} width={bw * 0.64} height={h} rx={Math.min(bw * 0.32, 3)} fill={col} />;
      })}
    </svg>
  );
}

/** A soft glow behind something that just happened. */
export function Glow({ k, color = C.accent, size = 400, style }: { k: number; color?: string; size?: number; style?: CSSProperties }) {
  if (k <= 0.001) return null;
  return <div style={{ position: 'absolute', width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, borderRadius: '50%', background: `radial-gradient(closest-side, ${alpha(color, 0.35 * k)}, transparent)`, pointerEvents: 'none', ...style }} />;
}
