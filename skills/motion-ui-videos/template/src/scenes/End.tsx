/**
 * The end card, in every cut: name, address, one call to action. The same
 * scene lays itself out for 16:9 and 9:16; each cut times it with its own marks.
 */
import { AbsoluteFill } from 'remotion';
import { prog } from '../lib/anim';
import { useMarks, useStage, useTime } from '../lib/time';
import { Backdrop, EndCard } from '../lib/ui';
import { LumenMark } from '../product';
import { BRAND } from '../theme';

export function End() {
  const t = useTime();
  const m = useMarks();
  const { portrait } = useStage();
  const glow = prog(t, m.logo, 1.2);
  return (
    <AbsoluteFill>
      <Backdrop glow={0.15 + glow * 0.35} y={portrait ? 42 : 40} grid />
      <EndCard
        title={BRAND.name}
        url={BRAND.url}
        cta={BRAND.cta}
        start={m.logo}
        times={{ title: m.title, url: m.url, cta: m.ctaIn }}
        logo={<LumenMark size={portrait ? 180 : 128} glow={glow} />}
      />
    </AbsoluteFill>
  );
}
