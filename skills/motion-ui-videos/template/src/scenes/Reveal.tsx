/**
 * The reveal: the mark pops, its sun rises, the name slides out of it, and
 * one line says what it is. Used by the showcase as written and by the reel
 * through a warp and its own marks (src/cuts.json): the pop, the name and the
 * promise come quicker there, and the promise then holds long enough to read.
 */
import { AbsoluteFill } from 'remotion';
import { clamp, EASE, lerp, pop, prog } from '../lib/anim';
import { useCues } from '../lib/cues';
import { Words } from '../lib/text';
import { useMarks, useStage, useTime } from '../lib/time';
import { Backdrop } from '../lib/ui';
import { LumenMark, Wordmark } from '../product';
import { C } from '../theme';

export function Reveal() {
  const t = useTime();
  const m = useMarks();
  const { H, safe, portrait } = useStage();
  const tile = pop(t, m.logo, { bouncy: true });
  const rise = prog(t, m.rise, 0.9, EASE);
  const slide = prog(t, m.wordmark, 0.8);
  // the whole row eases back from ×1.06 over the showcase's 5.3 s (the reel's warp also ends on scene second 5.3)
  const settle = prog(t, 0, 5.3, (x) => x);
  // on a phone the row nearly fills the 780 px between the side margins: about 735 px at rest,
  // 760 at most while it settles from ×1.06 (at 204/172 its last letter ran 17 px into the reel's button column)
  const size = portrait ? 190 : 168;
  const word = portrait ? 160 : 150;
  // the row is laid out whole; until the name is out, it is shifted so the mark sits in the middle
  const shift = (1 - slide) * ((word * 2.75 + size * 0.28) / 2);
  const cy = portrait ? safe.top + (H - safe.top - safe.bottom) / 2 - 80 : H / 2 - 50;
  // the promise: src/captions.json › <cut> › reveal. One of the film's two blur-rise moments (the other is the end headline)
  const [promise] = useCues().cues;
  return (
    <AbsoluteFill>
      <Backdrop glow={lerp(0.15, 1, rise)} y={portrait ? 42 : 44} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: cy, display: 'flex', justifyContent: 'center', transform: `translateY(-50%) scale(${lerp(1.06, 1, settle)})` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.28, transform: `translateX(${shift}px)` }}>
          <div style={{ opacity: clamp(tile * 2), transform: `scale(${lerp(0.5, 1, tile)})`, filter: tile < 0.98 ? `blur(${(1 - clamp(tile)) * 12}px)` : undefined }}>
            <LumenMark size={size} rise={rise} glow={rise} />
          </div>
          <div style={{ clipPath: `inset(-30% ${(1 - slide) * 100}% -30% 0)` }}>
            <div style={{ transform: `translateX(${(1 - slide) * -80}px)`, opacity: slide }}>
              <Wordmark size={word} color={C.text} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: cy + (portrait ? 170 : 140), display: 'flex', justifyContent: 'center' }}>
        {promise ? <Words text={promise.text} start={promise.at} step={0.07} size={portrait ? 68 : 52} weight={500} tracking={-0.02} color={C.dim} /> : null}
      </div>
    </AbsoluteFill>
  );
}
