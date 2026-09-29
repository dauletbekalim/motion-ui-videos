/**
 * Reel, the problem in two beats: a search comes up empty (shake), then the
 * five apps it was hiding in slam in as a stack, each with its zero (pattern
 * interrupt). Laid out for a phone (phoneLayout): the search and the stack
 * fill the UI area at 44–56 px, under the punch captions.
 */
import { AbsoluteFill } from 'remotion';
import { clamp, EASINGS, lerp, pop, prog } from '../lib/anim';
import { useCues } from '../lib/cues';
import { Captions, Typed } from '../lib/text';
import { useMarks, useStage, useTime } from '../lib/time';
import { Backdrop } from '../lib/ui';
import { APPS, Icon } from '../product';
import { alpha, C, FEATURES, FONT, SHADOW } from '../theme';
import { phoneLayout } from './common';

const QUERY = 'launch plan';
const BAR = 136;
const ROW = 126;
const GAP = 16;

export function ReelProblem() {
  const t = useTime();
  const m = useMarks();
  const stage = useStage();
  const { ui, captionTop } = phoneLayout(stage);
  const since = t - m.noResults;
  const shake = since > 0 ? Math.sin(since * 42) * 18 * Math.exp(-since * 7) : 0;
  const cps = QUERY.length / (m.typeEnd - m.typeStart);
  const bar = pop(t, 0);
  // the search waits in the middle of the UI area, then slides up just ahead of the apps to make room for them
  const lift = prog(t, m.appsIn - 0.14, 0.3, EASINGS.snappy);
  const barY = lerp(ui.y + 300, ui.y, lift);
  const miss = clamp(since * 5);
  const rowsY = ui.y + BAR + 28;
  return (
    <AbsoluteFill>
      <Backdrop glow={0.12} y={32} />
      {APPS.map((a, i) => {
        const k = pop(t, m.appsIn + i * 0.05, { bouncy: true });
        if (k <= 0.001) return null;
        // from alternate sides, so the stack lands left, right, left… (score.mjs pans each pop the same way)
        const side = i % 2 ? 1 : -1;
        return (
          <div
            key={a.id}
            style={{
              position: 'absolute',
              left: ui.x,
              top: rowsY + i * (ROW + GAP),
              width: ui.w,
              height: ROW,
              borderRadius: 30,
              background: 'linear-gradient(180deg, #1C1C24, #15151B)',
              boxShadow: `inset 0 0 0 1px ${C.line}, 0 30px 60px -30px rgba(0,0,0,0.9)`,
              display: 'flex',
              alignItems: 'center',
              gap: 28,
              padding: '0 30px 0 22px',
              opacity: clamp(k * 2),
              transform: `translateX(${(1 - k) * side * 180}px) scale(${0.7 + 0.3 * k}) rotate(${(1 - k) * side * 5}deg)`,
              fontFamily: FONT.ui,
              fontFeatureSettings: FEATURES,
            }}
          >
            <span style={{ width: 84, height: 84, borderRadius: 24, flex: 'none', display: 'grid', placeItems: 'center', background: alpha(a.color, 0.14), boxShadow: `inset 0 0 0 1px ${alpha(a.color, 0.25)}` }}>
              <Icon name={a.icon} size={46} color={a.color} stroke={1.8} />
            </span>
            <span style={{ flex: 1, fontSize: 48, fontWeight: 700, color: C.text, letterSpacing: '-0.03em' }}>{a.name}</span>
            <span style={{ height: 66, padding: '0 26px', borderRadius: 33, display: 'flex', alignItems: 'center', background: alpha(C.danger, 0.14), boxShadow: `inset 0 0 0 2px ${alpha(C.danger, 0.45)}`, color: C.danger, fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              0 results
            </span>
          </div>
        );
      })}
      {/* the search on top, so the stack slides in under it */}
      <div style={{ position: 'absolute', left: ui.x + shake, top: barY, width: ui.w, opacity: clamp(bar * 2), transform: `scale(${0.94 + 0.06 * bar})` }}>
        <div
          style={{
            height: BAR,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            padding: '0 40px',
            borderRadius: 34,
            background: 'linear-gradient(180deg, #20202A, #18181F)',
            boxShadow: since > 0 ? `${SHADOW.modal}, 0 0 0 3px ${alpha(C.danger, 0.55 * miss)}` : SHADOW.modal,
            fontFamily: FONT.ui,
            fontFeatureSettings: FEATURES,
            fontSize: 56,
            fontWeight: 600,
            letterSpacing: '-0.025em',
            color: C.text,
          }}
        >
          <Icon name="search" size={52} color={C.dim} stroke={2} />
          <span style={{ flex: 1, whiteSpace: 'nowrap' }}>
            <Typed text={QUERY} start={m.typeStart} cps={cps} />
          </span>
        </div>
        {/* the verdict, until the apps arrive to say it one by one */}
        <div
          style={{
            height: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT.ui,
            fontSize: 46,
            fontWeight: 700,
            color: C.danger,
            letterSpacing: '-0.02em',
            opacity: miss * (1 - clamp(lift * 3)),
            transform: `translateY(${(1 - miss) * -12}px)`,
          }}
        >
          No results
        </div>
      </div>
      {/* the words: src/captions.json › reel › reelProblem */}
      <Captions {...useCues()} top={captionTop} />
    </AbsoluteFill>
  );
}
