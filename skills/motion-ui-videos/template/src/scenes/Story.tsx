/**
 * An 8 s story with one job: get the tap. The headline, the product in one
 * glance, the call to action, and "tap the link" pointing at an empty spot
 * where the story's link sticker goes (placed in the app, not in the video).
 * Everything sits between the story's top bar (250 px) and reply bar (380 px).
 * No counters or claims: a story with fake numbers is worse than none.
 *
 * The glance is sized for a phone: the note in its phone layout ×2.25, cropped
 * to its title and first two to-dos, so the to-dos read at 35 px, not a whole
 * window shrunk to 20 px text.
 */
import { AbsoluteFill } from 'remotion';
import { clamp, lerp, pop } from '../lib/anim';
import { useCues } from '../lib/cues';
import { Words } from '../lib/text';
import { useDrawnTime, useMarks, useStage, useTime } from '../lib/time';
import { Backdrop, Cursor } from '../lib/ui';
import { Editor, Icon, LAUNCH_PLAN, LumenMark, PEOPLE, Wordmark, type Block } from '../product';
import { C, FEATURES, FONT, SHADOW } from '../theme';

// 860 wide: 90% of the story's 952 px safe width
const CARD = { w: 860, h: 490, y: 622 };
const S = 2.25;
/** the crop starts this far down the note (design px), just above its title */
const TOP = 24;

// the title and two to-dos: all the glance needs, and nothing cut off at the card's edge
const BLOCKS: Block[] = LAUNCH_PLAN.todos.slice(0, 2).map((text, i) => ({ kind: 'todo', text, done: i === 0 ? 1 : 0, owner: LAUNCH_PLAN.owners[i] }));

export function Story() {
  const t = useTime();
  const d = useDrawnTime();
  const m = useMarks();
  const { W, H, safe } = useStage();
  const logo = pop(t, m.logo, { bouncy: true });
  const card = pop(t, m.cardIn, { bouncy: true });
  const cta = pop(t, m.ctaIn);
  const tap = pop(t, m.pointer);
  const bob = Math.max(0, Math.sin((d - m.pointer) * 5)) * 10 * tap;
  const x = (W - CARD.w) / 2;
  // the headline: src/captions.json › story › story
  const [title] = useCues().cues;
  const dw = CARD.w / S;
  // teammates' cursors wander over the card once they are in
  const a = (Math.sin(d * 0.9) + 1) / 2;
  const b = (Math.sin(d * 0.7 + 2.2) + 1) / 2;
  const spot = { top: H - safe.bottom - 170, h: 150 };
  return (
    <AbsoluteFill>
      <Backdrop glow={0.2} y={46} grid />
      <div style={{ position: 'absolute', left: 0, right: 0, top: safe.top + 30, display: 'flex', justifyContent: 'center', opacity: clamp(logo * 2), transform: `translateY(${(1 - logo) * 16}px)` }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <LumenMark size={68} />
          <Wordmark size={58} />
        </span>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: safe.top + 140, display: 'flex', justifyContent: 'center' }}>
        {title ? <Words text={title.text} start={title.at} step={0.07} size={94} weight={700} lineHeight={1.02} tracking={-0.045} /> : null}
      </div>
      <div style={{ position: 'absolute', left: x, top: CARD.y, width: CARD.w, height: CARD.h, perspective: 1800 }}>
        <div
          style={{
            position: 'relative',
            width: CARD.w,
            height: CARD.h,
            borderRadius: 34,
            overflow: 'hidden',
            background: C.app,
            boxShadow: SHADOW.window,
            opacity: clamp(card * 2),
            transform: `translateY(${(1 - card) * 80}px) rotateX(${lerp(22, 4, card)}deg) rotateZ(-1.5deg)`,
          }}
        >
          <div style={{ position: 'absolute', left: 0, top: -TOP * S, width: dw, height: CARD.h / S + TOP, transform: `scale(${S})`, transformOrigin: '0 0' }}>
            <Editor compact bar={false} width={dw} height={CARD.h / S + TOP} title={LAUNCH_PLAN.title} spaceId="launch" edited="Edited just now" blocks={BLOCKS} />
          </div>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 34, boxShadow: `inset 0 0 0 1px ${C.line}`, pointerEvents: 'none' }} />
        </div>
        {/* in the note's empty right-hand side, so their name tags never sit on the words */}
        <Cursor label="Maya" color={PEOPLE.maya.color} path={[{ t: m.cursorsIn, x: 480 + a * 200, y: 196 + b * 40 }]} scale={1.8} />
        <Cursor label="Theo" color={PEOPLE.theo.color} path={[{ t: m.cursorsIn + 0.15, x: 590 + b * 150, y: 66 + a * 44 }]} scale={1.8} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: spot.top - 205, display: 'flex', justifyContent: 'center', opacity: clamp(cta * 2), transform: `translateY(${(1 - cta) * 20}px)` }}>
        <span style={{ fontFamily: FONT.ui, fontFeatureSettings: FEATURES, fontSize: 72, fontWeight: 700, letterSpacing: '-0.035em', color: C.text }}>Try it free with your team</span>
      </div>
      {/* the pointer, and under it the empty spot the link sticker is placed on */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: spot.top - 105, display: 'flex', justifyContent: 'center', opacity: clamp(tap * 2), transform: `translateY(${bob}px)` }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT.ui, fontFeatureSettings: FEATURES, fontSize: 50, fontWeight: 600, color: C.accent, letterSpacing: '-0.02em' }}>
          tap the link
          <Icon name="arrowDown" size={54} stroke={2.4} color={C.accent} />
        </span>
      </div>
      <div style={{ position: 'absolute', left: W / 2 - 260, top: spot.top, width: 520, height: spot.h, borderRadius: 40, background: `radial-gradient(closest-side, rgba(255,181,71,${0.1 * tap}), transparent)` }} />
    </AbsoluteFill>
  );
}
