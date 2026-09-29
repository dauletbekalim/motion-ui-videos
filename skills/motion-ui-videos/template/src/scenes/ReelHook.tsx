/**
 * Reel, 0–2.8 s. The hook has to land before the thumb moves: the title is
 * pre-rolled 0.12 s so frame 0 already shows its first line (frame 0 is a
 * thumbnail on some surfaces), all of it is readable by 0.3 s, the mess is on
 * screen and moving from the first frame, and at `burst` a zoom punch blows
 * it apart (the first pattern interrupt). Its reading time counts from frame
 * 0, not the pre-roll: five words need 2.67 s, so the scene is 2.8 s.
 */
import { AbsoluteFill } from 'remotion';
import { EASINGS, lerp, prog } from '../lib/anim';
import { useCues } from '../lib/cues';
import { KineticTitle } from '../lib/text';
import { useMarks, useStage, useTime } from '../lib/time';
import { Backdrop } from '../lib/ui';
import { alpha, C } from '../theme';
import { Scatter, SCATTER_TALL } from './common';

export function ReelHook() {
  const t = useTime();
  const m = useMarks();
  const { W, H, safe } = useStage();
  const cy = safe.top + (H - safe.top - safe.bottom) / 2;
  const hit = prog(t, m.burst, 0.07, EASINGS.linear);
  const settle = prog(t, m.burst + 0.07, 0.5);
  const punch = 1 + 0.09 * hit - 0.05 * settle;
  const flash = t >= m.burst ? 1 - prog(t, m.burst, 0.35) : 0;
  // before the burst the fragments creep toward the lens; after it they fly out past the edges
  const creep = lerp(0.96, 1.02, prog(t, 0, m.burst, EASINGS.linear));
  // the title: src/captions.json › reel › reelHook, pre-rolled 0.12 s so frame 0 already shows its first line
  const [title] = useCues().cues;
  return (
    <AbsoluteFill>
      <Backdrop glow={0.2 + flash * 0.4} y={45} />
      <AbsoluteFill style={{ transform: `scale(${creep * punch})` }}>
        <Scatter
          layout={SCATTER_TALL}
          center={{ x: W / 2, y: cy }}
          fly={() => 1}
          scale={1.25}
          to={(i) => {
            const p = SCATTER_TALL[i];
            const dx = p.x + 140 - W / 2;
            const dy = p.y + 40 - cy;
            const len = Math.hypot(dx, dy) || 1;
            return { x: p.x + (dx / len) * 900, y: p.y + (dy / len) * 900, k: prog(t, m.burst + (i % 4) * 0.02, 0.55, EASINGS.in), scale: 1.6, fade: 0 };
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: alpha(C.accent, 0.12 * flash) }} />
      {/* a soft floor under the title so it reads over the fragments */}
      <AbsoluteFill style={{ pointerEvents: 'none', background: `radial-gradient(ellipse 60% 16% at 50% ${(cy / H) * 100}%, ${alpha(C.bg, 0.7)}, transparent)` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: cy, transform: `translateY(-50%) scale(${punch})`, display: 'flex', justifyContent: 'center', textShadow: `0 10px 50px ${C.bg}, 0 0 20px ${C.bg}` }}>
        {title ? <KineticTitle text={title.text} start={title.at} size={118} maxWidth={W - 2 * Math.max(safe.left, safe.right)} /> : null}
      </div>
    </AbsoluteFill>
  );
}
