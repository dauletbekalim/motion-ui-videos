/**
 * "One source. Every format." One frame reshapes itself: 16:9 showcase, 9:16
 * reel, 1:1 feed, the UI loop, the reel cover. Inside it are the template's
 * own scenes at each size: the same Reveal scene lays itself out for 16:9,
 * 9:16 and 1:1 (re-laid out, never letterboxed), then the loop plays and the
 * cover still sits. The chips under it say which one is on screen.
 */
import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, EASINGS, lerp, pop, prog } from '../../lib/anim';
import { useCues } from '../../lib/cues';
import { Captions } from '../../lib/text';
import { useMarks, useStage, useTime } from '../../lib/time';
import { Backdrop } from '../../lib/ui';
import { Embed, EmbedStill } from '../../promo/Embed';
import { Pill, promoLayout } from '../../promo/parts';
import { alpha, C } from '../../theme';
import { Cover } from '../Cover';

type State = { key: string; chip: string; W: number; H: number; draw: (w: number, since: number) => ReactNode };

// the reveal settled, its promise read: scene second 4.2 in the showcase; in the reel, 3.2 drawn seconds, which its warp plays as scene second 4.26
const STATES: State[] = [
  { key: 'showcase', chip: '16:9', W: 1920, H: 1080, draw: (w) => <Embed cut="showcase" scene="reveal" time={4.2} w={w} /> },
  { key: 'reel', chip: '9:16', W: 1080, H: 1920, draw: (w) => <Embed cut="reel" scene="reveal" time={3.2} w={w} /> },
  { key: 'square', chip: '1:1', W: 1080, H: 1080, draw: (w) => <Embed cut="showcase" scene="reveal" time={4.2} w={w} size={{ W: 1080, H: 1080 }} /> },
  {
    key: 'loop',
    chip: 'loop',
    W: 1600,
    H: 1000,
    // on a phone the loop's frame is too small to read whole: push in ×2 on its ⌘K palette as "new note" is typed
    draw: (w, since) => {
      const z = w < 1000 ? 2 : 1;
      const k = (w / 1600) * z;
      const h = (w * 1000) / 1600;
      return (
        <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: w / 2 - 800 * k, top: h / 2 - (z > 1 ? 400 : 500) * k }}>
            <Embed cut="loop" time={(z > 1 ? 1.35 : 2.45) + since} w={1600 * k} />
          </div>
        </div>
      );
    },
  },
  {
    key: 'cover',
    chip: 'cover',
    W: 1080,
    H: 1920,
    draw: (w) => (
      <EmbedStill W={1080} H={1920} w={w}>
        <Cover />
      </EmbedStill>
    ),
  },
];

/** A box of `aspect` (h / w) as big as fits in maxW × maxH. */
function fit(W: number, H: number, maxW: number, maxH: number) {
  const k = Math.min(maxW / W, maxH / H);
  return { w: W * k, h: H * k };
}

/** Draw a state's content to cover a box (centred, cropped), as a fade layer. */
function Layer({ s, box, opacity, since }: { s: State; box: { w: number; h: number }; opacity: number; since: number }) {
  if (opacity <= 0.001) return null;
  const k = Math.max(box.w / s.W, box.h / s.H);
  const w = s.W * k;
  const h = s.H * k;
  return <div style={{ position: 'absolute', left: (box.w - w) / 2, top: (box.h - h) / 2, width: w, height: h, opacity }}>{s.draw(w, since)}</div>;
}

export function PFormats() {
  const t = useTime();
  const m = useMarks();
  const stage = useStage();
  const { W } = stage;
  const { portrait, ui, captionTop } = promoLayout(stage);
  const marks = [m.to2, m.to3, m.to4, m.to5];
  const dur = portrait ? 0.3 : 0.45;
  // which morph we are in: from state i to i + 1, e = 0 → 1
  let i = 0;
  while (i < marks.length && t >= marks[i]) i++;
  const from = Math.max(0, i - 1);
  const e = i === 0 ? 1 : prog(t, marks[i - 1], dur, EASINGS.inOut);
  const a = STATES[i === 0 ? 0 : from];
  const b = STATES[i];
  // the frame takes the whole UI area less the chips' row: 780 × 842 on a phone, 1640 × 730 on 16:9
  const chipsH = portrait ? 78 : 70;
  const maxW = portrait ? ui.w : 1640;
  const maxH = ui.h - chipsH;
  const sa = fit(a.W, a.H, maxW, maxH);
  const sb = fit(b.W, b.H, maxW, maxH);
  const box = i === 0 ? sb : { w: lerp(sa.w, sb.w, e), h: lerp(sa.h, sb.h, e) };
  const cx = W / 2;
  const cy = ui.y + maxH / 2;
  const enter = pop(t, 0.02);
  const morphing = i > 0 && e < 1 ? Math.sin(Math.PI * e) : 0;
  const chipsY = ui.y + ui.h - (portrait ? 52 : 44);
  const since = (k: number) => t - (k === 0 ? 0 : marks[k - 1]);
  return (
    <AbsoluteFill>
      <Backdrop glow={0.15 + 0.15 * morphing} y={portrait ? 36 : 42} grid />
      <div
        style={{
          position: 'absolute',
          left: cx - box.w / 2,
          top: cy - box.h / 2,
          width: box.w,
          height: box.h,
          borderRadius: portrait ? 30 : 22,
          overflow: 'hidden',
          background: C.bg,
          opacity: clamp(enter * 2),
          transform: `scale(${lerp(0.94, 1, enter)})`,
          boxShadow: `0 0 0 ${1 + morphing * 1.5}px ${morphing > 0.05 ? alpha(C.accent, 0.4 + 0.5 * morphing) : C.lineStrong}, 0 50px 120px -30px rgba(0,0,0,0.95), 0 0 ${90 * morphing}px ${alpha(C.accent, 0.25 * morphing)}`,
        }}
      >
        {/* one layout out, then the next in: never both at once, so no text doubles up mid-morph */}
        {i === 0 ? <Layer s={a} box={box} opacity={1} since={since(0)} /> : null}
        {i > 0 ? <Layer s={a} box={box} opacity={1 - clamp(e * 2.2)} since={since(from)} /> : null}
        {i > 0 ? <Layer s={b} box={box} opacity={clamp(e * 2.2 - 1.2)} since={since(i)} /> : null}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: chipsY, display: 'flex', justifyContent: 'center', gap: portrait ? 12 : 16 }}>
        {STATES.map((s, k) => {
          const on = k === i ? e : k === from && i > 0 ? 1 - e : 0;
          const shown = pop(t, 0.1 + k * 0.05);
          const g = fit(s.W, s.H, portrait ? 32 : 28, portrait ? 32 : 28);
          return (
            <div key={s.key} style={{ opacity: clamp(shown * 2), transform: `translateY(${(1 - shown) * 14}px) scale(${1 + 0.06 * on})` }}>
              <Pill size={portrait ? 28 : 24} color={on > 0.5 ? '#1A0F05' : C.dim} bg={on > 0.5 ? C.accent : '#17171D'} border={on > 0.05 ? alpha(C.accent, 0.9) : C.lineStrong}>
                <span style={{ width: g.w, height: g.h, borderRadius: 3, boxShadow: `inset 0 0 0 2px ${on > 0.5 ? '#1A0F05' : C.faint}` }} />
                {s.chip}
              </Pill>
            </div>
          );
        })}
      </div>
      {/* the words: src/captions.json › <cut> › pFormats (punch on the phone, calm on 16:9) */}
      <Captions {...useCues()} top={portrait ? captionTop : undefined} />
    </AbsoluteFill>
  );
}
