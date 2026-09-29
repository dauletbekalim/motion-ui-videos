/**
 * The payoff: the template's Lumen reel, playing in a phone. It is the real
 * cut, rendered live frame by frame, and so is everything around it. On
 * 16:9 the Lumen showcase plays in a browser beside it.
 */
import { AbsoluteFill } from 'remotion';
import { clamp, EASE, EASINGS, lerp, pop, prog } from '../../lib/anim';
import { Browser, BROWSER_BAR, Phone } from '../../lib/devices';
import { useCues } from '../../lib/cues';
import { Captions } from '../../lib/text';
import { useDrawnTime, useMarks, useStage, useTime } from '../../lib/time';
import { Backdrop } from '../../lib/ui';
import { Embed, momentOf } from '../../promo/Embed';
import { Glow, promoLayout } from '../../promo/parts';
import { BRAND } from '../../theme';

/** Where in the template's reel the phone starts playing (cut seconds): 0.05 s before its palette scene, just before ⌘K. sound/promo-score.mjs (PAYOFF) plays its sounds from the same moment. */
export const PAYOFF_REEL_FROM = momentOf('reel', 'reelPalette', 0, -0.05);
/** Where in the template's showcase the browser starts (16:9 only): 1.4 s into the "how it works" scene. sound/promo-score.mjs (PAYOFF) plays its sounds from the same moment. */
export const PAYOFF_SHOWCASE_FROM = momentOf('showcase', 'how', 1.4);

/** A phone playing the reel full screen (the phone is taller than 9:16, so the reel's sides are cropped a little). */
function ReelPhone({ width, time }: { width: number; time: number }) {
  const h = width * 2.1667;
  const bezel = Math.max(8, width * 0.028);
  const bar = width * 0.12;
  const sh = h - 2 * bezel;
  const sw = width - 2 * bezel;
  const ew = (sh * 1080) / 1920;
  return (
    <Phone width={width}>
      <div style={{ position: 'absolute', left: (sw - ew) / 2, top: -bar }}>
        <Embed cut="reel" time={time} w={ew} />
      </div>
    </Phone>
  );
}

export function PPayoff() {
  const t = useTime();
  const d = useDrawnTime();
  const m = useMarks();
  const stage = useStage();
  const { W } = stage;
  const { portrait, ui, captionTop } = promoLayout(stage);
  const inn = prog(t, m.phoneIn, 0.5, EASE);
  const float = Math.sin(d * 1.1) * 5;
  const cues = useCues();
  if (portrait) {
    // it opens on the reel at its own size, filling the UI area as it did a scene ago in the hook (reel px 1:1 on
    // the frame, so its UI sits exactly in ours), and pulls back to show it is a phone: 640 px wide, from the top of
    // the UI area down past its bottom into a fade. A mask keeps everything above the UI area out of the picture, so
    // the reel's own captions (its band is where ours is) never cross our line.
    const pw = 640;
    const bezel = Math.max(8, pw * 0.028);
    const sh = pw * 2.1667 - 2 * bezel;
    const ks = (sh * 1080) / 1920 / 1080;
    const mid = ui.y + ui.h / 2;
    const anchor = { x: pw / 2, y: bezel + mid * ks };
    const top = ui.y + 6;
    // it holds on the reel a beat, then pulls back, landing on the next beat (phoneIn + 1.0)
    const back = prog(t, m.phoneIn + 0.12, 0.88, EASINGS.inOut);
    const sc = Math.pow(1 / ks, 1 - back);
    const dy = (mid - (top + anchor.y)) * (1 - back);
    const cut = ui.y + ui.h;
    const mask = `linear-gradient(180deg, transparent ${ui.y - 14}px, black ${ui.y - 2}px, black ${cut - 110}px, transparent ${cut}px)`;
    return (
      <AbsoluteFill>
        <Backdrop glow={0.15 + 0.15 * back} y={38} grid />
        <Glow k={back * 0.6} size={1100} style={{ left: W / 2, top: top + anchor.y }} />
        <AbsoluteFill style={{ maskImage: mask, WebkitMaskImage: mask }}>
          <div style={{ position: 'absolute', left: (W - pw) / 2, top: top + float * back, transformOrigin: `${anchor.x}px ${anchor.y}px`, transform: `translateY(${dy}px) scale(${sc})` }}>
            <ReelPhone width={pw} time={PAYOFF_REEL_FROM + t - m.phoneIn} />
          </div>
        </AbsoluteFill>
        {/* the words: src/captions.json › promo-reel › pPayoff */}
        <Captions {...cues} top={captionTop} />
      </AbsoluteFill>
    );
  }
  const bw = 1160;
  const bh = 690;
  const bx = ui.x + 60;
  const by = ui.y + 40;
  const pw = 318;
  const phoneIn = pop(t, m.phoneIn + 0.35, { bouncy: true });
  return (
    <AbsoluteFill>
      <Backdrop glow={0.2} y={44} grid />
      <Glow k={inn * 0.55} size={1300} style={{ left: W / 2, top: by + bh / 2 }} />
      <div style={{ position: 'absolute', left: bx, top: by + float * 0.5, opacity: clamp(inn * 2), transform: `translateY(${(1 - inn) * 80}px)` }}>
        <Browser url={`app.${BRAND.url}`} width={bw} height={bh}>
          <div style={{ position: 'absolute', left: 0, top: (bh - BROWSER_BAR - (bw * 1080) / 1920) / 2 }}>
            <Embed cut="showcase" time={PAYOFF_SHOWCASE_FROM + t - m.phoneIn} w={bw} />
          </div>
        </Browser>
      </div>
      <div style={{ position: 'absolute', left: bx + bw - 90, top: by + 20 - float, opacity: clamp(phoneIn * 2), transform: `translateY(${(1 - phoneIn) * 160}px) rotate(${lerp(6, 2, phoneIn)}deg)` }}>
        <ReelPhone width={pw} time={PAYOFF_REEL_FROM + t - m.phoneIn} />
      </div>
      {/* the words: src/captions.json › promo-showcase › pPayoff */}
      <Captions {...cues} />
    </AbsoluteFill>
  );
}
