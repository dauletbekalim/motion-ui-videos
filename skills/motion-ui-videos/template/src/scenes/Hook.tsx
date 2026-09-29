/**
 * Showcase, 0–4 s. One plain sentence, then the mess it is about: chat
 * messages, docs, stickies and emails fly in and settle around it.
 */
import { AbsoluteFill } from 'remotion';
import { prog } from '../lib/anim';
import { useCues } from '../lib/cues';
import { Line } from '../lib/text';
import { useMarks, useStage, useTime } from '../lib/time';
import { Backdrop } from '../lib/ui';
import { C } from '../theme';
import { arrival, Scatter, SCATTER_TALL, SCATTER_WIDE } from './common';

export function Hook() {
  const t = useTime();
  const m = useMarks();
  const { W, H, portrait } = useStage();
  // the title steps back a little as the fragments arrive, so they read as around it, not on it
  const back = prog(t, m.fragmentsIn, 1.4);
  // the line: src/captions.json › <cut> › hook. It arrives whole: the blur-rise is saved for the promise and the end headline
  const [line] = useCues().cues;
  return (
    <AbsoluteFill>
      <Backdrop glow={0.2} y={50} />
      <Scatter layout={portrait ? SCATTER_TALL : SCATTER_WIDE} center={{ x: W / 2, y: H / 2 }} fly={(i) => arrival(t, m.fragmentsIn, i)} scale={portrait ? 1.2 : 1.05} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ transform: `scale(${1 - back * 0.04})`, textShadow: `0 10px 60px ${C.bg}` }}>
          {line ? <Line text={line.text} start={line.at} size={portrait ? 92 : 100} weight={600} /> : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
