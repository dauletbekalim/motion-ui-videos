/**
 * "It checks its own work." A contact sheet of stills (with gaps, as
 * scripts/sheet.mjs makes them), one frame lifted out because its caption
 * runs off the edge, the safe zones drawn over it, and the fix: the caption
 * wrapped to fit. The tiles are the template's reel and showcase at those
 * seconds. The flagged frame is a staged mistake, the kind the check exists
 * to catch. On 16:9 the loudness is measured too: the numbers are this
 * film's own soundtrack, as sound/design.mjs reported them.
 */
import { AbsoluteFill, Freeze, Sequence } from 'remotion';
import { clamp, EASE, EASINGS, lerp, pop, prog } from '../../lib/anim';
import { useCues } from '../../lib/cues';
import { Captions } from '../../lib/text';
import { CutContext, sceneStart, useMarks, useStage, useTime } from '../../lib/time';
import { Backdrop, SafeZones } from '../../lib/ui';
import { Icon } from '../../product';
import { Embed, momentOf } from '../../promo/Embed';
import { Pill, promoLayout } from '../../promo/parts';
import { FORMATS } from '../../formats';
import { alpha, C, FEATURES, FONT } from '../../theme';
import { phoneLayout } from '../common';

/** What sound/design.mjs measured on this film's own mix (update after a change: node sound/design.mjs promo-showcase). */
export const MEASURED = { file: 'sound-promo-showcase.wav', lufs: -17.0, tp: -2.0, target: -17 };

/**
 * The phone's sheet: 3 × 2 reel frames at the template's own seconds, big enough to read (sound/promo-score.mjs
 * ticks one per tile), named by scene and mark like the showcase's below. The third is the flagged one (FLAGGED_REEL).
 */
const R = (scene: string, at: number | string, plus = 0) => momentOf('reel', scene, at, plus);
export const REEL_TIMES = [R('reelHook', 0.4), R('reelProblem', 'typeEnd', -0.3), -1, R('reelPalette', 1.5), R('reelLive', 1.6), R('reelPayoff', 0.8)];
/**
 * The 16:9 sheet: 4 × 3 showcase frames (sound/promo-score.mjs ticks one per tile), named by scene and mark so
 * a re-timed template still shows the same moments. The third is the flagged one (FLAGGED_SHOW).
 */
const S = (scene: string, at: number | string, plus = 0) => momentOf('showcase', scene, at, plus);
export const SHOW_TIMES = [
  S('hook', 2.2), S('problem', 'searchIn', 0.1), -1, S('how', 2.4), S('how', 4.6), S('how', 6.9),
  S('how', 9.2), S('how', 11.8), S('features', 0.8), S('features', 'focus1', 0.2), S('features', 'typeEnd', 1.0), S('end', 1.4),
];
/** The flagged showcase frame: the reveal, its promise landed. */
const FLAGGED_SHOW = S('reveal', 3.0);
/**
 * The flagged reel frame: the wordmark and promise, 2.5 drawn seconds into the reel's reveal (scene second
 * 3.46 through its warp). momentOf can't name a moment in a warped scene, so this counts from its start.
 */
const FLAGGED_REEL = sceneStart('reel', 'reveal') + 2.5;
const FLAGGED = 2;
/** The sheet's grey, as scripts/sheet.mjs draws it between tiles. */
const SHEET_BG = '#34343B';
const BAD = 'Everyone’s notes, in one place.';
const BAD_WIDE = 'Everyone’s notes, in one place, for the whole team, live.';

/** The staged mistake: a caption set on one line, running off both edges; `fix` 0 → 1 wraps it to fit. */
function Flagged({ portrait, w, fix, safe }: { portrait: boolean; w: number; fix: number; safe: number }) {
  const W = portrait ? 1080 : 1920;
  const H = portrait ? 1920 : 1080;
  const k = w / W;
  const cut = portrait ? 'reel' : 'showcase';
  const time = portrait ? FLAGGED_REEL : FLAGGED_SHOW;
  const size = portrait ? 88 : 60;
  // where each cut's own captions go: the reel's punch band above its product, the showcase's calm band at the top
  const top = portrait ? phoneLayout({ W, H, safe: FORMATS.reel.safe }).captionTop : 84;
  return (
    <div style={{ position: 'relative', width: w, height: H * k, overflow: 'hidden', background: C.bg }}>
      <Embed cut={cut} time={time} w={w} />
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${k})`, transformOrigin: '0 0' }}>
        {/* before: one line, wider than the frame */}
        <div style={{ position: 'absolute', left: -600, right: -600, top, display: 'flex', justifyContent: 'center', opacity: 1 - clamp(fix * 2) }}>
          <span style={{ whiteSpace: 'nowrap', fontFamily: FONT.ui, fontFeatureSettings: FEATURES, fontWeight: 800, fontSize: size * (portrait ? 1.15 : 1.5), letterSpacing: '-0.04em', color: C.text }}>{portrait ? BAD : BAD_WIDE}</span>
        </div>
        {/* after: wrapped inside the safe width */}
        <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', opacity: clamp(fix * 2 - 1), transform: `translateY(${(1 - fix) * 12}px)` }}>
          <span style={{ maxWidth: portrait ? 780 : 1200, textAlign: 'center', fontFamily: FONT.ui, fontFeatureSettings: FEATURES, fontWeight: 800, fontSize: size, lineHeight: 1.02, letterSpacing: '-0.04em', color: C.text }}>{portrait ? BAD : BAD_WIDE}</span>
        </div>
        {safe > 0.01 ? (
          <div style={{ position: 'absolute', inset: 0, opacity: safe }}>
            <Sequence layout="none" width={W} height={H} showInTimeline={false}>
              <Freeze frame={0}>
                <CutContext.Provider value={cut}>
                  <SafeZones />
                </CutContext.Provider>
              </Freeze>
            </Sequence>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PCheck() {
  const t = useTime();
  const m = useMarks();
  const stage = useStage();
  const { W } = stage;
  const { portrait, ui } = promoLayout(stage);
  const cues = useCues();
  if (portrait) return <PhoneCheck />;
  // 4 × 3 frames filling the area under the caption; the meter later slides up over the last row
  const cols = 4;
  const gap = 20;
  const rowGap = 12;
  const label = 28;
  const tw = 410;
  const th = (tw * 9) / 16;
  const left = ui.x + (ui.w - (cols * tw + (cols - 1) * gap)) / 2;
  const top = ui.y;
  const times = portrait ? REEL_TIMES : SHOW_TIMES;
  const lift = prog(t, m.flag, 0.4, EASE) * (portrait ? 1 : 1 - prog(t, m.fix + 0.9, 0.5, EASINGS.inOut));
  const fix = prog(t, m.fix, 0.35);
  const bad = prog(t, m.flag + 0.25, 0.25);
  const slot = (i: number) => ({ x: left + (i % cols) * (tw + gap), y: top + Math.floor(i / cols) * (th + label + rowGap) });
  const big = portrait ? { w: 520, cx: ui.x + ui.w / 2, cy: ui.y + ui.h / 2 + 22 } : { w: 1060, cx: W / 2, cy: ui.y + 330 };
  const fs = slot(FLAGGED);
  const fw = lerp(tw, big.w, lift);
  const fx = lerp(fs.x, big.cx - big.w / 2, lift);
  const fy = lerp(fs.y, big.cy - (big.w * (th / tw)) / 2, lift);
  const meter = portrait ? 0 : pop(t, m.meter);
  const fill = portrait ? 0 : prog(t, m.meter + 0.2, 1.0, EASINGS.inOut);
  const lo = -30;
  const mx = (v: number) => clamp((v - lo) / (0 - lo));
  return (
    <AbsoluteFill>
      <Backdrop glow={0.15} y={portrait ? 34 : 40} grid />
      {times.map((sec, i) => {
        if (i === FLAGGED) return null;
        const k = pop(t, m.tiles + i * 0.05);
        if (k <= 0.001) return null;
        const s = slot(i);
        return (
          <div key={i} style={{ position: 'absolute', left: s.x, top: s.y, width: tw, opacity: clamp(k * 2) * (1 - 0.65 * lift) * (i >= 2 * cols ? 1 - 0.8 * meter : 1), transform: `scale(${lerp(0.9, 1, k)})` }}>
            <Embed cut="showcase" time={sec} w={tw} radius={6} />
            <div style={{ height: label, display: 'flex', alignItems: 'center', fontFamily: FONT.mono, fontSize: 19, color: C.faint }}>{sec.toFixed(2)} s</div>
          </div>
        );
      })}
      {(() => {
        const k = pop(t, m.tiles + FLAGGED * 0.05);
        if (k <= 0.001) return null;
        return (
          <div style={{ position: 'absolute', left: fx, top: fy, width: fw, opacity: clamp(k * 2), transform: `scale(${lerp(0.9, 1, k)})`, zIndex: 5 }}>
            <div style={{ borderRadius: lerp(6, 18, lift), overflow: 'hidden', boxShadow: `0 0 0 ${lerp(0, 3, lift)}px ${fix > 0.5 ? alpha(C.ok, 0.9) : alpha(C.danger, 0.9 * bad + 0.001)}, 0 50px 120px -30px rgba(0,0,0,0.95)` }}>
              <Flagged portrait={portrait} w={fw} fix={fix} safe={0.75 * bad * (1 - 0.6 * fix)} />
            </div>
            {lift < 0.5 ? <div style={{ height: label, display: 'flex', alignItems: 'center', fontFamily: FONT.mono, fontSize: portrait ? 19 : 17, color: C.faint, opacity: 1 - lift * 2 }}>{(portrait ? FLAGGED_REEL : FLAGGED_SHOW).toFixed(2)} s</div> : null}
            {/* the verdict, pinned to the frame's top edge */}
            {lift > 0.3 ? (
              <div style={{ position: 'absolute', left: 0, right: 0, top: -30, display: 'flex', justifyContent: 'center', opacity: clamp((lift - 0.3) * 3) }}>
                {fix < 0.5 ? (
                  <Pill size={portrait ? 30 : 24} color="#FFD6D6" bg="#3A1418" border={alpha(C.danger, 0.8)} style={{ transform: `scale(${1 + 0.06 * Math.exp(-(t - m.flag - 0.25) * 6) * (t > m.flag + 0.25 ? 1 : 0)})` }}>
                    <Icon name="close" size={portrait ? 28 : 22} stroke={2.6} color={C.danger} />
                    caption runs off the frame
                  </Pill>
                ) : (
                  <Pill size={portrait ? 30 : 24} color="#D6FFE2" bg="#10301C" border={alpha(C.ok, 0.8)}>
                    <Icon name="check" size={portrait ? 28 : 22} stroke={2.8} color={C.ok} />
                    fixed: wrapped to fit
                  </Pill>
                )}
              </div>
            ) : null}
          </div>
        );
      })()}
      {!portrait && meter > 0.001 ? (
        <div style={{ position: 'absolute', left: ui.x, top: ui.y + ui.h - 150, width: ui.w, height: 136, borderRadius: 22, background: 'linear-gradient(180deg, #15151B, #111116)', boxShadow: `inset 0 0 0 1px ${C.line}, 0 30px 80px -30px rgba(0,0,0,0.9)`, display: 'flex', alignItems: 'center', gap: 40, padding: '0 40px', opacity: clamp(meter * 2), transform: `translateY(${(1 - meter) * 30}px)`, fontFamily: FONT.mono }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 360 }}>
            <span style={{ fontSize: 18, color: C.faint }}>node sound/design.mjs</span>
            <span style={{ fontSize: 22, color: C.text }}>{MEASURED.file}</span>
          </div>
          <div style={{ position: 'relative', flex: 1, height: 64 }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 14, height: 18, borderRadius: 9, background: '#FFFFFF10' }} />
            <div style={{ position: 'absolute', left: 0, width: `${mx(MEASURED.lufs) * fill * 100}%`, top: 14, height: 18, borderRadius: 9, background: `linear-gradient(90deg, ${alpha(C.accent2, 0.7)}, ${C.accent})`, boxShadow: `0 0 24px ${alpha(C.accent, 0.5)}` }} />
            <div style={{ position: 'absolute', left: `${mx(MEASURED.target) * 100}%`, top: 4, width: 2, height: 38, background: C.text }} />
            <div style={{ position: 'absolute', left: `${mx(MEASURED.target) * 100}%`, top: 44, transform: 'translateX(-50%)', fontSize: 16, color: C.dim, whiteSpace: 'nowrap' }}>target {MEASURED.target} LUFS</div>
            {[-30, -20, -10, 0].map((v) => (
              <div key={v} style={{ position: 'absolute', left: `${mx(v) * 100}%`, top: 44, transform: v === 0 ? 'translateX(-100%)' : v === -30 ? 'none' : 'translateX(-50%)', fontSize: 15, color: C.faint, opacity: Math.abs(v - MEASURED.target) < 4 ? 0 : 1 }}>
                {v}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 330, fontSize: 22, color: C.text, opacity: prog(t, m.meter + 1.1, 0.3) }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="check" size={22} stroke={2.8} color={C.ok} />
              {MEASURED.lufs.toFixed(1)} LUFS integrated
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="check" size={22} stroke={2.8} color={C.ok} />
              {MEASURED.tp.toFixed(1)} dBTP true peak
            </span>
          </div>
        </div>
      ) : null}
      {/* the words: src/captions.json › promo-showcase › pCheck */}
      <Captions {...cues} />
    </AbsoluteFill>
  );
}

/**
 * The phone's check: the sheet fills the UI area (3 columns of the reel's
 * stills, their seconds under them), then the flagged frame grows out of it
 * into the whole window, cropped to its upper part where the caption runs off
 * both edges past the red safe zones: legible (73 px) rather than a stamp.
 * Then the fix: the caption wraps inside the frame.
 */
function PhoneCheck() {
  const t = useTime();
  const m = useMarks();
  const stage = useStage();
  const { ui, captionTop } = promoLayout(stage);
  const pad = 22;
  const gap = 14;
  const cols = 3;
  const label = 36;
  const tw = (ui.w - 2 * pad - (cols - 1) * gap) / cols;
  const th = (tw * 16) / 9;
  const slot = (i: number) => ({ x: ui.x + pad + (i % cols) * (tw + gap), y: ui.y + pad + Math.floor(i / cols) * (th + label + gap) });
  const lift = prog(t, m.flag, 0.4, EASE);
  const fix = prog(t, m.fix, 0.35);
  const bad = prog(t, m.flag + 0.25, 0.25);
  const panel = pop(t, m.tiles);
  // the lifted frame: from its tile to the whole UI area; inside, the reel frame grows from the tile's width to the
  // window's (×0.72, both side edges still in view) and the view slides up to the caption band and the top safe zone
  const fs = slot(FLAGGED);
  const box = { x: lerp(fs.x, ui.x, lift), y: lerp(fs.y, ui.y, lift), w: lerp(tw, ui.w, lift), h: lerp(th, ui.h, lift) };
  const fw = lerp(tw, ui.w, lift);
  const k = fw / 1080;
  const aimY = lerp(960, 640, lift);
  const flagK = pop(t, m.tiles + FLAGGED * 0.05);
  return (
    <AbsoluteFill>
      <Backdrop glow={0.15} y={34} grid />
      <div style={{ position: 'absolute', left: ui.x, top: ui.y, width: ui.w, height: ui.h, borderRadius: 32, overflow: 'hidden', background: SHEET_BG, boxShadow: `inset 0 0 0 1px ${C.lineStrong}, 0 50px 120px -30px rgba(0,0,0,0.95)`, opacity: clamp(panel * 3), transform: `scale(${lerp(0.97, 1, panel)})` }} />
      <AbsoluteFill style={{ clipPath: `inset(${ui.y}px ${1080 - ui.x - ui.w}px ${1920 - ui.y - ui.h}px ${ui.x}px round 32px)` }}>
        {REEL_TIMES.map((sec, i) => {
          if (i === FLAGGED) return null;
          const kk = pop(t, m.tiles + i * 0.05);
          if (kk <= 0.001) return null;
          const s = slot(i);
          return (
            <div key={i} style={{ position: 'absolute', left: s.x, top: s.y, width: tw, opacity: clamp(kk * 2) * (1 - 0.6 * lift), transform: `scale(${lerp(0.9, 1, kk)})` }}>
              <Embed cut="reel" time={sec} w={tw} />
              <div style={{ height: label, display: 'flex', alignItems: 'center', fontFamily: FONT.mono, fontSize: 24, color: '#E6E6EC' }}>{sec.toFixed(2)} s</div>
            </div>
          );
        })}
        {!lift ? (
          <div style={{ position: 'absolute', left: fs.x, top: fs.y + th, height: label, display: 'flex', alignItems: 'center', fontFamily: FONT.mono, fontSize: 24, color: '#E6E6EC', opacity: clamp(flagK * 2) }}>{FLAGGED_REEL.toFixed(2)} s</div>
        ) : null}
      </AbsoluteFill>
      {flagK > 0.001 ? (
        <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: lerp(0, 32, lift), overflow: 'hidden', background: C.bg, zIndex: 5, opacity: clamp(flagK * 2), transform: `scale(${lerp(0.9, 1, flagK)})`, boxShadow: `0 0 0 ${lerp(0, 3, lift)}px ${fix > 0.5 ? alpha(C.ok, 0.9) : alpha(C.danger, 0.9 * bad + 0.001)}, 0 50px 120px -30px rgba(0,0,0,0.95)` }}>
          <div style={{ position: 'absolute', left: box.w / 2 - 540 * k, top: box.h / 2 - aimY * k }}>
            <Flagged portrait w={fw} fix={fix} safe={0.8 * bad * (1 - 0.55 * fix)} />
          </div>
          {/* the verdict, pinned to the window's top edge */}
          {lift > 0.3 ? (
            <div style={{ position: 'absolute', left: 0, right: 0, top: 26, display: 'flex', justifyContent: 'center', opacity: clamp((lift - 0.3) * 3) }}>
              {fix < 0.5 ? (
                <Pill size={32} color="#FFD6D6" bg="#3A1418" border={alpha(C.danger, 0.8)} style={{ transform: `scale(${1 + 0.06 * Math.exp(-(t - m.flag - 0.25) * 6) * (t > m.flag + 0.25 ? 1 : 0)})` }}>
                  <Icon name="close" size={30} stroke={2.6} color={C.danger} />
                  caption runs off the frame
                </Pill>
              ) : (
                <Pill size={32} color="#D6FFE2" bg="#10301C" border={alpha(C.ok, 0.8)}>
                  <Icon name="check" size={30} stroke={2.8} color={C.ok} />
                  fixed: wrapped to fit
                </Pill>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
      {/* the words: src/captions.json › promo-reel › pCheck */}
      <Captions {...useCues()} top={captionTop} />
    </AbsoluteFill>
  );
}
