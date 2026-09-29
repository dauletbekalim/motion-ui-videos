/**
 * Type that moves. All times are scene seconds (useTime), or drawn seconds
 * when `drawn` is set (for text written straight onto a warped cut).
 *
 * In any text prop, `|` forces a line break and `*words*` are set in the
 * accent colour: "Your notes are *everywhere*."
 */
import { Fragment, useContext, type CSSProperties, type ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { alpha, C, FEATURES, FONT } from '../theme';
import { clamp, EASE, EASINGS, lerp, pop, prog, rand } from './anim';
import { SceneContext, useDrawnTime, useStage, useTime } from './time';

type Align = 'left' | 'center' | 'right';
type Token = { w: string; em: boolean };

/** Split text into lines of words, marking *emphasised* ones. */
function parse(text: string): Token[][] {
  let on = false;
  return text.split('|').map((line) =>
    line
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((raw) => {
        let w = raw;
        let em = on;
        if (w.startsWith('*')) {
          w = w.slice(1);
          em = true;
          on = true;
        }
        const close = w.match(/\*([^\w]*)$/);
        if (close) {
          w = w.slice(0, close.index) + close[1];
          on = false;
        }
        return { w, em };
      }),
  );
}

function useClock(drawn?: boolean): number {
  const scene = useTime();
  const d = useDrawnTime();
  return drawn ? d : scene;
}

type LineProps = {
  text: string;
  start?: number;
  size?: number;
  weight?: number;
  color?: string;
  accent?: string;
  align?: Align;
  maxWidth?: number;
  lineHeight?: number;
  tracking?: number;
  drawn?: boolean;
  style?: CSSProperties;
};

/** The whole-line arrival: opacity 0 → 1 in 0.2 s and a 10 px rise over 0.35 s on EASE. No stagger, no blur. */
export const ARRIVE = { fade: 0.2, rise: 0.35, px: 10 } as const;
/**
 * How a line leaves: a 0.12 s fade with a 6 px lift. The next line starts
 * arriving as this one is gone, so two sentences never sit on each other.
 */
export const LEAVE = { fade: 0.12, px: 6 } as const;

/** Set text (lines by `|`, accent by `*`), with no motion of its own. */
function Text({ text, size = 96, weight = 600, color = C.text, accent = C.accent, align = 'center', maxWidth, lineHeight = 1.06, tracking = -0.035, style }: Omit<LineProps, 'start' | 'drawn'>) {
  return (
    <div style={{ fontFamily: FONT.ui, fontFeatureSettings: FEATURES, fontSize: size, fontWeight: weight, color, lineHeight, letterSpacing: `${tracking}em`, textAlign: align, maxWidth, ...style }}>
      {parse(text).map((words, li) => (
        <div key={li}>
          {words.map((tok, wi) => (
            <Fragment key={wi}>
              <span style={{ color: tok.em ? accent : undefined }}>{tok.w}</span>
              {wi < words.length - 1 ? ' ' : null}
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * A line that arrives whole: it fades in over 0.2 s while rising 10 px over
 * 0.35 s (EASE). Readable the moment it lands, so it is the default for
 * running captions and most titles. Same props as `Words`, minus the stagger.
 */
export function Line({ start = 0, drawn = false, ...props }: LineProps) {
  const t = useClock(drawn);
  const fade = prog(t, start, ARRIVE.fade, EASINGS.linear);
  const rise = prog(t, start, ARRIVE.rise);
  if (fade <= 0) return null;
  return (
    <div style={{ opacity: fade, transform: rise < 1 ? `translateY(${(1 - rise) * ARRIVE.px}px)` : undefined }}>
      <Text {...props} />
    </div>
  );
}

/**
 * A line whose words rise out of a blur one at a time. An effect, not a
 * default: on every line of a film it is the most recognizable template look,
 * so keep it for at most two moments (the promise, the end headline).
 * Keep `step` at 0.05–0.09 s: faster reads as a glitch, slower as a stall.
 */
export function Words({
  text,
  start = 0,
  step = 0.07,
  dur = 0.7,
  size = 96,
  weight = 600,
  color = C.text,
  accent = C.accent,
  align = 'center',
  maxWidth,
  lineHeight = 1.06,
  tracking = -0.035,
  drawn = false,
  style,
}: {
  text: string;
  start?: number;
  step?: number;
  dur?: number;
  size?: number;
  weight?: number;
  color?: string;
  accent?: string;
  align?: Align;
  maxWidth?: number;
  lineHeight?: number;
  tracking?: number;
  drawn?: boolean;
  style?: CSSProperties;
}) {
  const t = useClock(drawn);
  const lines = parse(text);
  let i = 0;
  return (
    <div style={{ fontFamily: FONT.ui, fontFeatureSettings: FEATURES, fontSize: size, fontWeight: weight, color, lineHeight, letterSpacing: `${tracking}em`, textAlign: align, maxWidth, ...style }}>
      {lines.map((words, li) => (
        <div key={li}>
          {words.map((tok, wi) => {
            const p = prog(t, start + i++ * step, dur);
            return (
              <Fragment key={wi}>
                <span
                  style={{
                    display: 'inline-block',
                    color: tok.em ? accent : undefined,
                    opacity: clamp(p * 1.4),
                    transform: `translateY(${(1 - p) * 0.38}em)`,
                    filter: p < 1 ? `blur(${(1 - p) * 0.12 * size}px)` : undefined,
                  }}
                >
                  {tok.w}
                </span>
                {wi < words.length - 1 ? ' ' : null}
              </Fragment>
            );
          })}
        </div>
      ))}
    </div>
  );
}

type Cue = { at: number; text: string };

/**
 * Captions.
 * - calm: one sentence at a time, for showcases. The old line leaves (a
 *   0.12 s fade, 6 px up), and the new one arrives whole as it is gone,
 *   0.12 s after its cue (a 0.2 s fade and a 10 px rise over 0.35 s): never
 *   two lines at once. Hold each at least (words ÷ 3) + 1 s.
 *   `arrival="words"` opts one caption into the per-word blur-rise of
 *   `Words`: at most a couple of moments per film.
 * - punch: 1–3 words at a time, big, for reels. Each chunk lands whole in
 *   the text colour, fully there on its first frame and settling from 0.96
 *   (a calm pop). A cue is a phrase; it is split into chunks of up to three
 *   words (break early with `|`), each shown as it is "said". `lit` also lights each word in turn in the accent: only with a
 *   voiceover or words cut to a beat grid, which the lighting then follows.
 * A cue with empty text clears the line.
 *
 * Defaults: calm at 60 px (68 on a phone), 68% of a wide frame across (the
 * width between equal safe margins on a phone: 780 on a reel), at
 * `safe.top + 30` (landscape) or `+ 40` (portrait); punch at 92 px (72 on a
 * wide frame) in a band above the product, `safe.top + 80` on a phone (330 on
 * a reel) or `+ 40` otherwise, 780 across on a reel.
 */
export function Captions({
  cues,
  variant = 'calm',
  top,
  size,
  maxWidth,
  drawn = false,
  color = C.text,
  arrival = 'line',
  lit = false,
}: {
  cues: Cue[];
  variant?: 'calm' | 'punch';
  top?: number;
  size?: number;
  maxWidth?: number;
  drawn?: boolean;
  color?: string;
  /** calm only: 'line' (the default) or 'words', the per-word blur-rise */
  arrival?: 'line' | 'words';
  /** punch only: light each word in turn (for a voiceover or a beat grid) */
  lit?: boolean;
}) {
  const t = useClock(drawn);
  const { W, safe, portrait } = useStage();
  // when the scene ends, on the same clock as the cues
  const scene = useContext(SceneContext);
  const end = scene ? (drawn || !scene.warp ? scene.seconds : scene.warp(scene.seconds)) : (cues[cues.length - 1]?.at ?? 0) + 2.5;
  if (variant === 'punch') {
    return <Punch cues={cues} t={t} end={end} top={top ?? safe.top + (portrait ? 80 : 40)} size={size ?? (portrait ? 92 : 72)} maxWidth={maxWidth ?? W - 2 * Math.max(safe.left, safe.right)} color={color} lit={lit} />;
  }
  const fontSize = size ?? (portrait ? 68 : 60);
  const y = top ?? safe.top + (portrait ? 40 : 30);
  // a line you take in at a glance: 68% of a wide frame (1,306 px at 1920), the safe width between equal margins on a phone
  const width = maxWidth ?? (portrait ? W - 2 * Math.max(safe.left, safe.right) : Math.round(W * 0.68));
  let i = -1;
  for (let k = 0; k < cues.length; k++) if (t >= cues[k].at) i = k;
  const cur = cues[i];
  const prev = cues[i - 1];
  const out = cur ? prog(t, cur.at, LEAVE.fade, EASINGS.linear) : 0;
  const type = { size: fontSize, weight: 500, tracking: -0.022, color, maxWidth: width, drawn };
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {prev?.text && out < 1 ? (
        <div style={{ position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: 1 - out, transform: `translateY(${-out * LEAVE.px}px)` }}>
          <Text text={prev.text} {...type} />
        </div>
      ) : null}
      {cur?.text ? (
        <div style={{ position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          {/* it starts as the old line is gone: two sentences crossing in one spot read as neither */}
          {arrival === 'words' ? <Words text={cur.text} start={cur.at + LEAVE.fade} step={0.06} dur={0.6} {...type} /> : <Line text={cur.text} start={cur.at + LEAVE.fade} {...type} />}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

/** Lay a cue's words out in time: which chunk is showing and which word is "said". */
function chunkCue(cue: Cue, end: number) {
  const lines = parse(cue.text);
  const words: (Token & { chunk: number })[] = [];
  let chunk = 0;
  for (const line of lines) {
    let n = 0;
    for (const tok of line) {
      if (n === 3) {
        chunk++;
        n = 0;
      }
      words.push({ ...tok, chunk });
      n++;
      if (/[.!?,:;]$/.test(tok.w)) {
        chunk++;
        n = 0;
      }
    }
    if (n > 0) chunk++;
  }
  // spread the words over most of the time the cue has, the last chunk holding to the end
  const per = clamp(((end - cue.at) * 0.8) / Math.max(1, words.length), 0.18, 0.5);
  return { words, per };
}

function Punch({ cues, t, end, top, size, maxWidth, color, lit }: { cues: Cue[]; t: number; end: number; top: number; size: number; maxWidth: number; color: string; lit: boolean }) {
  let i = -1;
  for (let k = 0; k < cues.length; k++) if (t >= cues[k].at) i = k;
  const cue = cues[i];
  if (!cue?.text) return null;
  const { words, per } = chunkCue(cue, cues[i + 1]?.at ?? end);
  const said = Math.min(words.length - 1, Math.floor((t - cue.at) / per));
  const chunk = words[said].chunk;
  const first = words.findIndex((w) => w.chunk === chunk);
  // a calm spring in scale only, no overshoot. No fade: the chunk before it vanishes
  // on this frame, and a fade-in would leave an empty frame between them (a blink at 30 fps)
  const s = pop(t, cue.at + first * per);
  const shown = words.filter((w) => w.chunk === chunk);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            maxWidth,
            textAlign: 'center',
            fontFamily: FONT.ui,
            fontFeatureSettings: FEATURES,
            fontSize: size,
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: '-0.04em',
            color,
            transform: `scale(${lerp(0.96, 1, s)})`,
            textShadow: '0 6px 30px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4)',
          }}
        >
          {shown.map((w, k) => {
            const idx = first + k;
            // lit: the word being said in the accent, the ones still to come at 55%
            const on = lit && idx === said;
            return (
              <Fragment key={k}>
                <span style={{ display: 'inline-block', color: on || w.em ? C.accent : undefined, transform: on ? 'scale(1.04)' : undefined, opacity: lit && idx > said ? 0.55 : 1 }}>{w.w}</span>
                {k < shown.length - 1 ? ' ' : null}
              </Fragment>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

/**
 * When each character of `text` appears: `cps` characters a second with a
 * small deterministic human jitter (±0.175 of a keystroke), never out of order.
 * The sound design spreads its key clicks between the same marks.
 */
export function typedTimes(text: string, start: number, cps: number): number[] {
  return Array.from(text, (_, i) => start + (i + 0.35 * (rand(i * 7 + 11) - 0.5)) / cps);
}

/** A typewriter with a caret. Tie `start` and `cps` to marks: cps = text.length / (typeEnd − typeStart). */
export function Typed({ text, start, cps = 18, caret = true, caretColor, style, drawn = false }: { text: string; start: number; cps?: number; caret?: boolean; caretColor?: string; style?: CSSProperties; drawn?: boolean }) {
  const t = useClock(drawn);
  const blink = useDrawnTime();
  const times = typedTimes(text, start, cps);
  let n = 0;
  while (n < times.length && times[n] <= t) n++;
  const typing = t >= start && n < text.length;
  const on = typing || Math.floor(blink * 2) % 2 === 0;
  return (
    <span style={{ whiteSpace: 'pre', ...style }}>
      {text.slice(0, n)}
      {caret && t >= start - 0.3 ? (
        <span style={{ display: 'inline-block', width: 0, height: '1em', verticalAlign: '-0.12em', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 1, top: '-0.08em', width: 2, height: '1.16em', borderRadius: 1, background: caretColor ?? C.accent, opacity: on ? 1 : 0 }} />
        </span>
      ) : null}
    </span>
  );
}

/** Digits that roll like an odometer from `from` to `to`. */
export function Counter({ from, to, start, dur, format = (n: number) => String(n), style }: { from: number; to: number; start: number; dur: number; format?: (n: number) => string; style?: CSSProperties }) {
  const t = useTime();
  const v = lerp(from, to, prog(t, start, dur, EASINGS.inOut));
  const n = Math.floor(v + 1e-9);
  const frac = v - n;
  const chars = Array.from(format(n));
  let col = 0;
  const cells: ReactNode[] = [];
  for (let i = chars.length - 1; i >= 0; i--) {
    const ch = chars[i];
    if (!/\d/.test(ch)) {
      cells.unshift(<span key={i}>{ch}</span>);
      continue;
    }
    const pow = 10 ** col;
    const lowerAllNine = col === 0 || n % pow === pow - 1;
    const roll = to >= from && lowerAllNine ? frac : 0;
    const d = Number(ch);
    cells.unshift(
      <span key={i} style={{ display: 'inline-block', position: 'relative', overflow: 'hidden', height: '1.1em', verticalAlign: 'top' }}>
        <span style={{ display: 'block', transform: `translateY(${-roll * 1.1}em)` }}>
          <span style={{ display: 'block', height: '1.1em' }}>{d}</span>
          <span style={{ display: 'block', height: '1.1em' }}>{(d + 1) % 10}</span>
        </span>
      </span>,
    );
    col++;
  }
  return <span style={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, display: 'inline-block', ...style }}>{cells}</span>;
}

/**
 * The reel's hook: a big title that lands hard (scale 1.08 → 1, no blur) in
 * 0.26 s, lines 0.06 s apart, so it is readable by 0.3 s. No blur, so it
 * adds no blur family to the hook scene. Lines by `|`, accent by `*`.
 */
export function KineticTitle({ text, start = 0, size = 120, color = C.text, align = 'center', maxWidth, weight = 800 }: { text: string; start?: number; size?: number; color?: string; align?: Align; maxWidth?: number; weight?: number }) {
  const t = useTime();
  const lines = parse(text);
  return (
    <div style={{ fontFamily: FONT.ui, fontFeatureSettings: FEATURES, fontSize: size, fontWeight: weight, lineHeight: 0.98, letterSpacing: '-0.045em', color, textAlign: align, maxWidth }}>
      {lines.map((words, li) => {
        const k = prog(t, start + li * 0.06, 0.26, EASINGS.snappy);
        return (
          <div key={li} style={{ opacity: clamp(k * 3), transform: `scale(${lerp(1.08, 1, k)})`, transformOrigin: align === 'left' ? '0% 50%' : '50% 50%' }}>
            {words.map((tok, wi) => (
              <Fragment key={wi}>
                <span style={{ color: tok.em ? C.accent : undefined }}>{tok.w}</span>
                {wi < words.length - 1 ? ' ' : null}
              </Fragment>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** A marker sweep behind text, left to right, from `start` over `dur`. */
export function Highlight({ start, dur = 0.5, color = C.accent, children }: { start: number; dur?: number; color?: string; children: ReactNode }) {
  const t = useTime();
  const k = prog(t, start, dur, EASE);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span
        style={{
          position: 'absolute',
          left: '-0.12em',
          right: '-0.12em',
          top: '0.1em',
          bottom: '0.02em',
          borderRadius: '0.16em',
          background: alpha(color, 0.3),
          transform: `scaleX(${k}) skewX(-6deg)`,
          transformOrigin: 'left center',
        }}
      />
      <span style={{ position: 'relative' }}>{children}</span>
    </span>
  );
}
