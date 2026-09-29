/**
 * The end card: the mark, the name, what it is, and where to get it. One
 * call to action (the address), set as the one button that matters, at
 * caption size like EndCard's URL (56 px on 16:9; on a phone 52 px on two
 * lines, since one line would run past the safe width). On a phone the card
 * fills the UI area and "Free & open source." lands in the caption band,
 * where every other scene's words were. The mark settles in from 0.94 with
 * a calm spring and no blur, as EndCard's logo does.
 */
import { AbsoluteFill } from 'remotion';
import { clamp, EASINGS, lerp, pop, prog } from '../../lib/anim';
import { useCues } from '../../lib/cues';
import { KineticTitle } from '../../lib/text';
import { useMarks, useStage, useTime } from '../../lib/time';
import { Backdrop } from '../../lib/ui';
import { PROMO, promoLayout, SkillMark, SkillName } from '../../promo/parts';
import { alpha, C, FEATURES, FONT, GRADIENT } from '../../theme';

export function PEnd() {
  const t = useTime();
  const m = useMarks();
  const { H, safe, portrait, W } = useStage();
  const logo = pop(t, m.logo);
  const draw = prog(t, m.logo, 0.7, EASINGS.out);
  const name = pop(t, m.title);
  const sub = pop(t, m.sub);
  const url = pop(t, m.url, { bouncy: true });
  const shine = prog(t, m.url + 0.8, 0.9, EASINGS.inOut);
  const glow = prog(t, m.logo, 1.2);
  const stage = useStage();
  const { ui, captionTop } = promoLayout(stage);
  // the line: src/captions.json › promo-reel › pEnd (none on 16:9)
  const [line] = useCues().cues;
  const [host, repo] = [PROMO.url.slice(0, PROMO.url.lastIndexOf('/') + 1), PROMO.url.slice(PROMO.url.lastIndexOf('/') + 1)];
  const cy = portrait ? ui.y + ui.h / 2 + 10 : safe.top + (H - safe.top - safe.bottom) / 2;
  const k = portrait ? 1 : 1.05;
  return (
    <AbsoluteFill>
      <Backdrop glow={0.15 + glow * 0.35} y={40} grid />
      <div style={{ position: 'absolute', left: 0, right: 0, top: cy, transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ opacity: clamp(logo * 2), transform: `scale(${lerp(0.94, 1, logo)})` }}>
          <SkillMark size={(portrait ? 250 : 136) * k} draw={draw} glow={glow} />
        </div>
        <div style={{ marginTop: (portrait ? 56 : 36) * k, opacity: clamp(name * 2), transform: `translateY(${(1 - name) * 24}px)` }}>
          <SkillName size={(portrait ? 84 : 92) * k} />
        </div>
        <div style={{ marginTop: (portrait ? 26 : 22) * k, opacity: clamp((portrait ? pop(t, m.title + 0.12) : sub) * 2), transform: `translateY(${(1 - (portrait ? pop(t, m.title + 0.12) : sub)) * 16}px)`, fontFamily: FONT.ui, fontFeatureSettings: FEATURES, fontSize: (portrait ? 46 : 38) * k, fontWeight: 500, letterSpacing: '-0.02em', color: C.dim, whiteSpace: 'nowrap' }}>
          {portrait ? 'Claude Code skill' : PROMO.line}
        </div>
        <div
          style={{
            marginTop: (portrait ? 70 : 52) * k,
            position: 'relative',
            overflow: 'hidden',
            opacity: clamp(url * 2),
            transform: `scale(${lerp(0.85, 1, url)})`,
            padding: portrait ? '22px 34px' : `${20 * k}px ${44 * k}px`,
            borderRadius: portrait ? 40 : 999,
            textAlign: 'center',
            lineHeight: 1.12,
            background: GRADIENT,
            boxShadow: `inset 0 1px 0 #FFFFFF66, 0 20px 60px -20px ${alpha(C.accent2, 0.9)}`,
            color: '#1A0F05',
            fontFamily: FONT.ui,
            fontFeatureSettings: FEATURES,
            fontSize: portrait ? 52 : 56,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {portrait ? (
            <>
              <div>{host}</div>
              <div>{repo}</div>
            </>
          ) : (
            PROMO.url
          )}
          {shine > 0 && shine < 1 ? <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${lerp(-40, 130, shine)}%`, width: '30%', transform: 'skewX(-20deg)', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }} /> : null}
        </div>
      </div>
      {portrait && line ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: captionTop, display: 'flex', justifyContent: 'center' }}>
          <KineticTitle text={line.text} start={line.at} size={92} maxWidth={W - 2 * Math.max(safe.left, safe.right)} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
