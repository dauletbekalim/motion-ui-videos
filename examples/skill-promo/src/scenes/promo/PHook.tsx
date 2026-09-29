/**
 * The hook. On a phone: the headline is on frame 0 (pre-rolled), in the
 * caption band over one big window into the template's reel at its own phone
 * size, so the first frame reads as a thumbnail. Then the showcase and the loop slam in over it, one per
 * beat, each cropped to the part that matters (never a whole frame shrunk to a
 * stamp), and on `fan` the three stack into full-width strips, labelled. On
 * 16:9: the headline, then the three formats rise in, big and overlapping,
 * the reel in front. Every window is the template's own cut, playing live
 * (Embed), not a picture of it.
 */
import { AbsoluteFill } from 'remotion';
import { clamp, EASE, EASINGS, lerp, pop, prog } from '../../lib/anim';
import { useCues } from '../../lib/cues';
import { KineticTitle, Words } from '../../lib/text';
import { cutDuration, useDrawnTime, useMarks, useStage, useTime } from '../../lib/time';
import { Backdrop } from '../../lib/ui';
import { CutWindow, Embed, momentOf, type Aim } from '../../promo/Embed';
import { Pill, promoLayout } from '../../promo/parts';
import { alpha, C } from '../../theme';
import type { Rect } from '../common';

type Cut = 'showcase' | 'reel' | 'loop';

/**
 * The three windows of the phone hook: which cut, from which second (cut
 * seconds, at the card's mark), and where each looks: `full` while it fills
 * the frame, `strip` once the three stack. Reel px map 1:1 onto the frame (its
 * UI area, 530–1450 under the caption band, is ours; its own captions stay
 * above the window), the showcase at ×1.18 on the Presence card once its
 * camera has settled, the loop at ×1.5 on the ⌘K palette as "new note" is typed.
 */
const PHONE_CARDS: { cut: Cut; label: string; from: number; full: Aim; strip: Aim }[] = [
  { cut: 'reel', label: '9:16 reel', from: momentOf('reel', 'reelLive', 2.05), full: { x: 540, y: 990, s: 1 }, strip: { x: 540, y: 690, s: 1 } },
  { cut: 'showcase', label: '16:9 showcase', from: momentOf('showcase', 'features', 'focus1', 1.35), full: { x: 960, y: 552, s: 1.18 }, strip: { x: 960, y: 420, s: 1.18 } },
  { cut: 'loop', label: 'UI loop', from: 0.95, full: { x: 700, y: 400, s: 1.5 }, strip: { x: 700, y: 330, s: 1.5 } },
];

/** Which moment of each template cut the 16:9 hook's cards play from (cut seconds): the showcase 1.7 s before its features scene, the reel 0.05 s before its live scene. */
export const HOOK_PLAY = { showcase: momentOf('showcase', 'features', 0, -1.7), reel: momentOf('reel', 'reelLive', 0, -0.05), loop: 2.45 } as const;

const CARDS: { cut: Cut; label: string }[] = [
  { cut: 'showcase', label: '16:9 showcase' },
  { cut: 'reel', label: '9:16 reel' },
  { cut: 'loop', label: 'UI loop' },
];
const ASPECT = { showcase: 1080 / 1920, reel: 1920 / 1080, loop: 1000 / 1600 };

/** A thin progress bar along a window's bottom edge: where in its cut this frame is. It reads as a video, and it is the real position. */
function Scrub({ k, w }: { k: number; w: number }) {
  return (
    <div style={{ position: 'absolute', left: 22, right: 22, bottom: 18, height: 6, borderRadius: 3, background: alpha('#FFFFFF', 0.14) }}>
      <div style={{ width: `${clamp(k) * 100}%`, height: '100%', borderRadius: 3, background: C.accent, boxShadow: `0 0 12px ${alpha(C.accent, 0.7)}` }} />
      <div style={{ position: 'absolute', left: clamp(k) * (w - 44) - 7, top: -4, width: 14, height: 14, borderRadius: 7, background: '#FFF4DC' }} />
    </div>
  );
}

export function PHook() {
  const t = useTime();
  const d = useDrawnTime();
  const m = useMarks();
  const stage = useStage();
  const { W, safe } = stage;
  const { portrait, ui, captionTop } = promoLayout(stage);
  const at = [m.card1, m.card2, m.card3];
  // the headline: src/captions.json › <cut> › pHook
  const [title] = useCues().cues;

  if (portrait) {
    const gap = 20;
    const sh = (ui.h - 2 * gap) / 3;
    const fan = prog(t, m.fan, 0.42, EASE);
    // each later card is a hit: the stage punches and flashes a touch (not on frame 0: that one stays clean for the thumbnail)
    const hit = [m.card2, m.card3].reduce((acc, a) => acc + (t >= a ? Math.exp(-(t - a) * 9) : 0), 0);
    return (
      <AbsoluteFill>
        <Backdrop glow={0.15 + 0.3 * clamp(hit)} y={36} grid />
        <AbsoluteFill style={{ transform: `scale(${1 + 0.012 * clamp(hit)})` }}>
          {PHONE_CARDS.map((c, i) => {
            // the first card is pre-rolled like the headline, so frame 0 already shows it, sharp
            const pre = i === 0 ? 0.3 : 0.001;
            if (t < at[i] - pre) return null;
            const k = prog(t, at[i] - pre, 0.22, EASINGS.snappy);
            const strip: Rect = { x: ui.x, y: ui.y + i * (sh + gap), w: ui.w, h: sh };
            const r: Rect = { x: lerp(ui.x, strip.x, fan), y: lerp(ui.y, strip.y, fan), w: ui.w, h: lerp(ui.h, strip.h, fan) };
            const aim: Aim = { x: lerp(c.full.x, c.strip.x, fan), y: lerp(c.full.y, c.strip.y, fan), s: c.full.s };
            const time = c.from + t - at[i];
            const label = pop(t, m.fan + 0.15 + i * 0.07, { bouncy: true });
            // the one on screen carries a warm edge; it cools as the three stack
            const warm = (1 - fan) * (i === 2 || t < at[i + 1] ? 1 : 0);
            return (
              <div key={c.cut} style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, zIndex: i + 1, opacity: clamp(k * 3), transform: `scale(${lerp(1.1, 1, k)})`, filter: k < 1 ? `blur(${(1 - k) * 10}px)` : undefined }}>
                <CutWindow
                  cut={c.cut}
                  time={time}
                  w={r.w}
                  h={r.h}
                  aim={aim}
                  radius={lerp(36, 28, fan)}
                  style={{ boxShadow: `0 0 0 ${lerp(1, 2, warm)}px ${warm > 0.01 ? alpha(C.accent, 0.55 * warm) : C.lineStrong}, 0 0 ${80 * warm}px ${alpha(C.accent, 0.2 * warm)}, 0 40px 90px -30px rgba(0,0,0,0.95)` }}
                >
                  <Scrub k={time / cutDuration(c.cut)} w={r.w} />
                  {label > 0.001 ? (
                    <div style={{ position: 'absolute', right: 18, top: 18, opacity: clamp(label * 2), transform: `scale(${lerp(0.7, 1, label)})`, transformOrigin: '100% 0' }}>
                      <Pill size={30} color={C.text} bg="#101014EE">
                        {c.label}
                      </Pill>
                    </div>
                  ) : null}
                </CutWindow>
              </div>
            );
          })}
        </AbsoluteFill>
        <AbsoluteFill style={{ background: alpha('#FFFFFF', 0.05 * clamp(hit)), pointerEvents: 'none' }} />
        {/* the headline in the caption band, where every later scene's words land (two lines at 96 px, a little
            higher than a one-line chunk so it clears the window by ~35 px); a shadow lifts it off a card still landing */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: captionTop - 26, display: 'flex', justifyContent: 'center', textShadow: `0 8px 40px ${C.bg}` }}>
          {title ? <KineticTitle text={title.text} start={title.at} size={96} maxWidth={W - 2 * Math.max(safe.left, safe.right)} /> : null}
        </div>
      </AbsoluteFill>
    );
  }

  // 16:9: the headline, then the three formats rise in, big and overlapping: the reel in front, the wide ones behind it
  const cy = ui.y + ui.h / 2 + 24;
  const place: Record<Cut, { w: number; cx: number; cy: number; rot: number; z: number }> = {
    showcase: { w: 900, cx: ui.x + 450, cy: cy + 10, rot: -2, z: 1 },
    reel: { w: 420, cx: W / 2 + 10, cy, rot: 1.5, z: 3 },
    loop: { w: 800, cx: ui.x + ui.w - 400, cy: cy + 18, rot: 2, z: 2 },
  };
  const settle = prog(t, m.fan, 1.6, EASINGS.inOut);
  const float = (i: number) => Math.sin(d * 0.8 + i * 2) * 4 * settle;
  return (
    <AbsoluteFill>
      <Backdrop glow={0.2} y={44} grid />
      {/* the film's one blur-rise (captions-and-type §10 allows two: this and an end headline) */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: safe.top + 30, display: 'flex', justifyContent: 'center' }}>
        {title ? <Words text={title.text} start={title.at} size={96} weight={700} tracking={-0.04} /> : null}
      </div>
      {CARDS.map((c, i) => {
        const p = place[c.cut];
        const h = p.w * ASPECT[c.cut];
        const k = pop(t, at[i], { bouncy: true });
        if (k <= 0.001) return null;
        const label = prog(t, at[i] + 0.25, 0.5);
        const push = 1 + 0.02 * settle;
        return (
          <div key={c.cut} style={{ position: 'absolute', left: p.cx - p.w / 2, top: p.cy - h / 2 + float(i), width: p.w, height: h, zIndex: p.z, opacity: clamp(k * 2), transform: `translateY(${(1 - k) * 70}px) rotate(${p.rot * settle}deg) scale(${lerp(0.94, 1, k) * push})` }}>
            <Embed cut={c.cut} time={HOOK_PLAY[c.cut] + t - at[i]} w={p.w} radius={c.cut === 'reel' ? 24 : 16} style={{ boxShadow: `0 0 0 1px ${C.lineStrong}, 0 50px 110px -30px rgba(0,0,0,0.95)` }} />
            <div style={{ position: 'absolute', left: 16, top: 16, opacity: clamp(label * 2) }}>
              <Pill size={22} color={C.text} bg="#101014E6">
                {c.label}
              </Pill>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
