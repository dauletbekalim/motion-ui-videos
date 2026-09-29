/**
 * "Send sounds you like. It makes the rest." A sound file drops in, its
 * spectrogram draws as it plays, and three new variants grow out of it, each
 * drawn as it plays. The spectrograms are measured from the very sounds the
 * soundtrack plays here (sound/promo-sounds.mjs → src/promo/spectra.json):
 * a stand-in reference, and variants grown from it with sound/tools/grow.mjs.
 */
import { AbsoluteFill } from 'remotion';
import { clamp, lerp, pop, prog } from '../../lib/anim';
import { useCues } from '../../lib/cues';
import { Captions } from '../../lib/text';
import { useMarks, useStage, useTime } from '../../lib/time';
import { Backdrop } from '../../lib/ui';
import { Icon } from '../../product';
import { Pill, promoLayout, Spectro } from '../../promo/parts';
import spectra from '../../promo/spectra.json';
import { alpha, C, FEATURES, FONT } from '../../theme';

type Spec = { name: string; label: string; dur: number; peak: number; data: number[][] };
const SPECS = spectra as Spec[];
const REF = SPECS[0];
const VARS = SPECS.slice(1);

/** The dropped file, as an attachment chip. */
function FileChip({ size }: { size: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.6, padding: `${size * 0.45}px ${size * 0.9}px ${size * 0.45}px ${size * 0.45}px`, borderRadius: size * 0.7, background: 'linear-gradient(180deg, #1E1E26, #17171D)', boxShadow: `inset 0 0 0 1px ${C.lineStrong}, 0 30px 70px -24px rgba(0,0,0,0.95)`, fontFamily: FONT.ui, fontFeatureSettings: FEATURES }}>
      <div style={{ width: size * 2.1, height: size * 2.1, borderRadius: size * 0.5, display: 'grid', placeItems: 'center', background: alpha(C.accent, 0.14), boxShadow: `inset 0 0 0 1px ${alpha(C.accent, 0.35)}` }}>
        <svg viewBox="0 0 24 24" width={size * 1.2} height={size * 1.2} fill="none" stroke={C.accent} strokeWidth={2.2} strokeLinecap="round">
          {[4, 8, 12, 16, 20].map((x, i) => (
            <path key={x} d={`M${x} ${12 - [3, 6, 9, 5, 2][i]}v${[3, 6, 9, 5, 2][i] * 2}`} />
          ))}
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: size * 0.12 }}>
        <span style={{ fontFamily: FONT.mono, fontSize: size, fontWeight: 600, color: C.text, letterSpacing: '-0.02em' }}>whoosh.wav</span>
        <span style={{ fontSize: size * 0.62, fontWeight: 500, color: C.faint }}>{REF.dur.toFixed(2)} s · 48 kHz · stereo</span>
      </div>
    </div>
  );
}

export function PSounds() {
  const t = useTime();
  const m = useMarks();
  const stage = useStage();
  const { portrait, ui, captionTop } = promoLayout(stage);
  const drop = pop(t, m.drop, { bouncy: true });
  // the reference plays with its loudest moment on `ref` (score.mjs), so it is drawn from ref − peak over its length
  const refStart = m.ref - REF.peak;
  const refCard = pop(t, refStart - 0.2);
  const refSweep = prog(t, refStart, REF.dur, (x) => x);
  const grows = [m.grow1, m.grow2, m.grow3];
  const tool = pop(t, m.grow1 - 0.35);
  const chipSize = portrait ? 40 : 34;

  // phone: the file, the reference (780 × 250), grow.mjs, three variants (124 px each), down the UI area; 16:9: reference left, variants right
  const refRect = portrait ? { x: ui.x, y: ui.y + 146, w: ui.w, h: 250 } : { x: ui.x, y: ui.y + 170, w: 880, h: 470 };
  const varX = portrait ? ui.x : ui.x + 1010;
  const varW = portrait ? ui.w : ui.w - 1010;
  const varTop = portrait ? ui.y + 510 : ui.y + 8;
  const varH = portrait ? 124 : 250;
  const varGap = portrait ? 14 : 22;
  const specMax = portrait ? 520 : 500;
  const specH = portrait ? 94 : 190;
  return (
    <AbsoluteFill>
      <Backdrop glow={0.15} y={portrait ? 34 : 40} grid />
      {/* the file arrives, as if dragged into the chat */}
      <div style={{ position: 'absolute', left: portrait ? 0 : ui.x, right: portrait ? 0 : undefined, top: ui.y + (portrait ? 10 : 20), display: 'flex', justifyContent: portrait ? 'center' : 'flex-start', opacity: clamp(drop * 3), transform: `translateY(${(1 - drop) * -140}px) rotate(${(1 - drop) * -4}deg)` }}>
        <FileChip size={chipSize} />
      </div>
      {/* the reference, drawn as it plays */}
      {refCard > 0.001 ? (
        <div style={{ position: 'absolute', left: refRect.x, top: refRect.y, width: refRect.w, opacity: clamp(refCard * 2), transform: `translateY(${(1 - refCard) * 24}px)` }}>
          <Spectro data={REF.data} width={refRect.w} height={refRect.h} reveal={refSweep} radius={portrait ? 22 : 18} style={{ boxShadow: `inset 0 0 0 1px ${C.line}, 0 40px 90px -40px rgba(0,0,0,0.9)` }} />
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontSize: portrait ? 26 : 24, color: C.dim }}>
            <span>reference · what you sent</span>
            <span>{REF.dur.toFixed(2)} s</span>
          </div>
        </div>
      ) : null}
      {/* the tool that grows them */}
      {tool > 0.001 ? (
        <div style={{ position: 'absolute', left: portrait ? 0 : refRect.x + refRect.w + 4, right: portrait ? 0 : undefined, width: portrait ? undefined : 126, top: portrait ? ui.y + 456 : refRect.y + refRect.h / 2 - 50, display: 'flex', flexDirection: portrait ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: clamp(tool * 2) }}>
          <Icon name={portrait ? 'arrowDown' : 'chevronRight'} size={portrait ? 34 : 40} stroke={2.2} color={C.accent} />
          <Pill mono size={portrait ? 26 : 24} color={C.text}>
            grow.mjs
          </Pill>
        </div>
      ) : null}
      {/* the slots the grown variants will land in, waiting from the moment the reference plays */}
      {VARS.map((v, i) => {
        const show = clamp(refCard * 2) * (1 - clamp(pop(t, grows[i] - 0.14, { bouncy: true }) * 2));
        if (show <= 0.001) return null;
        return <div key={`slot-${v.name}`} style={{ position: 'absolute', left: varX, top: varTop + i * (varH + varGap), width: varW, height: varH, borderRadius: portrait ? 20 : 18, border: `2px dashed ${alpha(C.text, 0.16)}`, background: alpha('#FFFFFF', 0.015), opacity: show }} />;
      })}
      {VARS.map((v, i) => {
        const at = grows[i];
        const k = pop(t, at - 0.14, { bouncy: true });
        if (k <= 0.001) return null;
        const sweep = prog(t, at, v.dur, (x) => x);
        const sw = specMax * (v.dur / REF.dur);
        const y = varTop + i * (varH + varGap);
        const playing = sweep > 0 && sweep < 1 ? 1 : 0;
        const [secs, word] = v.label.split(' · ');
        return (
          <div key={v.name} style={{ position: 'absolute', left: varX, top: y, width: varW, height: varH, borderRadius: portrait ? 20 : 18, background: 'linear-gradient(180deg, #16161C, #121217)', boxShadow: `inset 0 0 0 1px ${playing ? alpha(C.accent, 0.45) : C.line}, 0 30px 70px -36px rgba(0,0,0,0.9)`, opacity: clamp(k * 2), transform: `translateX(${(1 - k) * (portrait ? 0 : -60)}px) translateY(${portrait ? (1 - k) * -40 : 0}px) scale(${lerp(0.94, 1, k)})`, display: 'flex', alignItems: 'center', padding: `0 ${portrait ? 20 : 24}px`, gap: 26 }}>
            <div style={{ position: 'relative', width: specMax, flex: 'none' }}>
              {/* the reference's length, for scale: each variant is stretched to its own move */}
              <div style={{ position: 'absolute', left: 0, top: 0, width: specMax, height: specH, borderRadius: 10, border: `1.5px dashed ${alpha(C.text, 0.12)}` }} />
              <Spectro data={v.data} width={sw} height={specH} reveal={sweep} radius={10} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: FONT.mono, color: C.dim }}>
              <span style={{ fontSize: portrait ? 38 : 36, fontWeight: 600, color: C.text }}>{secs}</span>
              <span style={{ fontSize: portrait ? 28 : 26, color: C.dim }}>{word}</span>
            </div>
          </div>
        );
      })}
      {/* the words: src/captions.json › <cut> › pSounds (punch on the phone, calm on 16:9) */}
      <Captions {...useCues()} top={portrait ? captionTop : undefined} />
    </AbsoluteFill>
  );
}
