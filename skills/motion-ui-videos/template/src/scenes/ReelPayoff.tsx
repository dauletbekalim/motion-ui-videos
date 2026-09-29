/**
 * Reel, the payoff: the mess from the hook flies into one list and lands as
 * tidy notes, the count rolling up as they arrive. The hook's promise, kept
 * on screen. The list is the app's own note list at phone size (×2.45: note
 * titles 34 px), filling the UI area under the captions.
 */
import { AbsoluteFill } from 'remotion';
import { clamp, EASINGS, lerp, pop, prog } from '../lib/anim';
import { useCues } from '../lib/cues';
import { Captions, Counter } from '../lib/text';
import { useMarks, useStage, useTime } from '../lib/time';
import { Backdrop } from '../lib/ui';
import { NOTELIST, NoteList, NOTES } from '../product';
import { alpha, C } from '../theme';
import { Crop, phoneLayout, Scatter, SCATTER_TALL } from './common';

/** the list's scale: its 14 px note titles become 34 px */
const S = 2.45;

export function ReelPayoff() {
  const t = useTime();
  const m = useMarks();
  const stage = useStage();
  const { W, H, safe } = stage;
  const { ui, captionTop } = phoneLayout(stage);
  const win = pop(t, 0);
  const land = (i: number) => prog(t, m.gather + ((i * 5) % 16) * 0.035, 0.55, EASINGS.inOut);
  const glow = prog(t, m.settle, 0.3) * (1 - prog(t, m.settle + 0.3, 0.9));
  const cy = safe.top + (H - safe.top - safe.bottom) / 2;
  const lw = ui.w / S;
  const lh = ui.h / S;
  // where a fragment lands: the left of one of the rows in view (score.mjs pans their whooshes there)
  // The mess starts where the hook left it, except in the caption band: a card (the yellow sticky
  // above all) under a punch chunk eats its letters, so those start 400 px lower, over the empty list.
  // Only y moves, so the whooshes' pans (score.mjs, from x) still match.
  const layout = SCATTER_TALL.map((p) => (p.y > captionTop - 60 && p.y < captionTop + 140 ? { ...p, y: p.y + 400 } : p));
  const rowY = (i: number) => ui.y + (NOTELIST.header + (i % 3) * NOTELIST.row + 14) * S;
  return (
    <AbsoluteFill>
      <Backdrop glow={0.2 + glow * 0.8} y={36} />
      <AbsoluteFill style={{ opacity: clamp(win * 2), transform: `scale(${lerp(0.94, 1, win) * (1 + glow * 0.012)})`, transformOrigin: `${ui.x + ui.w / 2}px ${ui.y + ui.h / 2}px` }}>
        <div style={{ position: 'absolute', left: ui.x, top: ui.y, width: ui.w, height: ui.h, borderRadius: 36, boxShadow: `0 0 ${140 * glow}px ${alpha(C.accent, 0.4 * glow)}` }} />
        <Crop rect={ui}>
          <div style={{ position: 'absolute', left: ui.x, top: ui.y, width: lw, height: lh, transform: `scale(${S})`, transformOrigin: '0 0' }}>
            <NoteList
              width={lw}
              height={lh}
              title="All notes"
              count={
                <span style={{ fontSize: 14, fontWeight: 700, color: C.accent, background: alpha(C.accent, 0.12), borderRadius: 7, padding: '2px 8px' }}>
                  <Counter from={0} to={24} start={m.gather} dur={m.settle - m.gather} />
                </span>
              }
              items={NOTES.map((n, i) => ({ note: n, enter: pop(t, m.gather + 0.35 + i * 0.07) }))}
              selected={t >= m.settle ? 'launch' : undefined}
            />
          </div>
        </Crop>
      </AbsoluteFill>
      <Scatter
        layout={layout}
        center={{ x: W / 2, y: cy }}
        fly={() => 1}
        scale={1.2}
        drift={0.6}
        to={(i) => ({ x: ui.x + 40, y: rowY(i), k: land(i), scale: 0.8 })}
      />
      {/* the words: src/captions.json › reel › reelPayoff */}
      <Captions {...useCues()} top={captionTop} />
    </AbsoluteFill>
  );
}
