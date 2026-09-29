/**
 * Showcase, 3.9–12.1 s. The fragments sort themselves into five different apps,
 * then someone searches for the one thing they need and every app comes up
 * empty. Two plain sentences, each held long enough to read. The product
 * drifts in, about 2% over the scene: between the last fragment landing and
 * the search (2 s) and after "No results", nothing else moves, and a frame
 * held dead still reads as a stall.
 */
import { AbsoluteFill } from 'remotion';
import { clamp, EASINGS, pop, prog } from '../lib/anim';
import { useCues } from '../lib/cues';
import { Captions, Typed } from '../lib/text';
import { useDrawnTime, useMarks, useStage, useTime } from '../lib/time';
import { Backdrop, Badge } from '../lib/ui';
import { APPS, APPWIN, AppWindow, appWindowHeight, FRAGMENTS, Icon, type AppId } from '../product';
import { C, FEATURES, FONT, SHADOW } from '../theme';
import { Scatter, SCATTER_TALL, SCATTER_WIDE } from './common';

const QUERY = 'Q3 launch plan';

// each fragment's row in its app's window
const ROW: number[] = [];
{
  const n: Record<string, number> = {};
  FRAGMENTS.forEach((f, i) => {
    ROW[i] = n[f.app] ?? 0;
    n[f.app] = ROW[i] + 1;
  });
}
const appIndex = (id: AppId) => APPS.findIndex((a) => a.id === id);
/** the most fragments any one app holds: the windows are all this tall */
const ROWS = Math.max(...ROW) + 1;

export function Problem() {
  const t = useTime();
  const m = useMarks();
  const { W, H, portrait, safe } = useStage();
  // five windows in a row across the safe width (on a phone: two rows), each a
  // 200 px window scaled ×1.65 so its messages read at 21 px on the 1080p frame
  const S = portrait ? 1.5 : 1.65;
  const winW = 200;
  const winH = appWindowHeight(ROWS);
  const perRow = portrait ? 3 : 5;
  const gap = portrait ? 24 : (W - safe.left - safe.right - perRow * winW * S) / (perRow - 1);
  // the search (84 px, then a 40 px gap) and the windows, centred between the caption (ends ~150) and the bottom margin
  const top = portrait ? 720 : (150 + H - safe.bottom + 124 - winH * S) / 2;
  const place = (idx: number) => {
    const r = Math.floor(idx / perRow);
    const inRow = r === 0 ? Math.min(perRow, APPS.length) : APPS.length - perRow;
    const w = inRow * winW * S + (inRow - 1) * gap;
    return { x: (W - w) / 2 + (idx % perRow) * (winW * S + gap), y: top + r * (winH * S + gap) };
  };
  const flight = (i: number) => prog(t, m.sort + ((i * 7) % 16) * 0.045, 0.85, EASINGS.inOut);
  const cps = QUERY.length / (m.typeEnd - m.typeStart);
  const bar = pop(t, m.searchIn);
  const since = t - m.noResults;
  const shake = since > 0 ? Math.sin(since * 42) * 16 * Math.exp(-since * 7) : 0;
  const barW = portrait ? 860 : 900;
  const barY = portrait ? 480 : top - 124;
  // the drift: +0.25% a second (about 2% over the showcase's 8.2 s), about the middle of the
  // search and the windows. Ambient, so on drawn time; the caption stays outside it
  const drift = 1 + 0.0025 * useDrawnTime();
  const cy = (barY + place(APPS.length - 1).y + winH * S) / 2;
  return (
    <AbsoluteFill>
      <Backdrop glow={0.12} y={55} />
      <AbsoluteFill style={{ transform: `scale(${drift})`, transformOrigin: `${W / 2}px ${cy}px` }}>
        {APPS.map((a, idx) => {
          const p = place(idx);
          const k = pop(t, m.appsIn + idx * 0.07, { bouncy: true });
          const rows = FRAGMENTS.map((f, i) => ({ f, i })).filter(({ f }) => f.app === a.id).map(({ f, i }) => ({ f, k: clamp((flight(i) - 0.7) / 0.3) }));
          return (
            <div key={a.id} style={{ position: 'absolute', left: p.x, top: p.y, transform: `scale(${S})`, transformOrigin: '0 0' }}>
              <div style={{ opacity: clamp(k * 2), transform: `translateY(${(1 - k) * 24}px) scale(${0.9 + 0.1 * k})` }}>
                <AppWindow id={a.id} rows={rows} width={winW} height={winH} miss={pop(t, m.noResults + idx * 0.06)} />
              </div>
            </div>
          );
        })}
        <Scatter
          layout={portrait ? SCATTER_TALL : SCATTER_WIDE}
          center={{ x: W / 2, y: H / 2 }}
          fly={() => 1}
          scale={portrait ? 1.2 : 1.05}
          to={(i) => {
            const p = place(appIndex(FRAGMENTS[i].app));
            return { x: p.x + APPWIN.pad * S, y: p.y + (APPWIN.header + APPWIN.pad + ROW[i] * (APPWIN.row + APPWIN.gap)) * S, k: flight(i), scale: portrait ? 0.8 : 0.9 };
          }}
        />
        {bar > 0.001 ? (
          <div style={{ position: 'absolute', left: (W - barW) / 2 + shake, top: barY, width: barW, opacity: clamp(bar * 2), transform: `translateY(${(1 - bar) * -24}px)` }}>
            <div
              style={{
                height: 84,
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: '0 28px',
                borderRadius: 18,
                background: 'linear-gradient(180deg, #1F1F27, #18181F)',
                boxShadow: SHADOW.modal,
                fontFamily: FONT.ui,
                fontFeatureSettings: FEATURES,
                fontSize: 31,
                fontWeight: 500,
                letterSpacing: '-0.015em',
                color: C.text,
              }}
            >
              <Icon name="search" size={30} color={C.dim} />
              <span style={{ flex: 1 }}>
                <Typed text={QUERY} start={m.typeStart} cps={cps} />
              </span>
              {since > 0 ? (
                <span style={{ opacity: clamp(since * 5), transform: `scale(${0.9 + 0.1 * clamp(since * 5)})` }}>
                  <Badge text="0 results in 5 apps" color={C.danger} size={19} />
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </AbsoluteFill>
      {/* the words: src/captions.json › showcase › problem */}
      <Captions {...useCues()} />
    </AbsoluteFill>
  );
}
