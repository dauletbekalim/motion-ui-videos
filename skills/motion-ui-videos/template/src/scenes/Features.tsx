/**
 * Showcase, three features as three cards, each one moving. The camera takes
 * them one at a time (the others dim), each with a plain sentence, then steps
 * back to show all three. The reel drops this section: a feature list is the
 * least essential part of a short cut; "how it works" is never dropped.
 */
import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { bezier, clamp, EASINGS, pop, prog } from '../lib/anim';
import { useCues } from '../lib/cues';
import { Captions, Highlight, Typed } from '../lib/text';
import { useDrawnTime, useMarks, useStage, useTime } from '../lib/time';
import { Backdrop, Badge, Camera, Cursor, Focus } from '../lib/ui';
import { AvatarStack, Icon, PEOPLE, RemoteCaret, type IconName } from '../product';
import { alpha, C, FEATURES, FONT } from '../theme';

const CARD = { w: 520, h: 544, gap: 40, y: 290 };
const ZOOM = 1.25;

function Card({ i, icon, label, title, sub, children }: { i: number; icon: IconName; label: string; title: string; sub: string; children: ReactNode }) {
  const t = useTime();
  const m = useMarks();
  const p = pop(t, [m.cardIn1, m.cardIn2, m.cardIn3][i], { bouncy: true });
  return (
    <div
      style={{
        width: CARD.w,
        height: CARD.h,
        padding: 28,
        borderRadius: 28,
        background: 'linear-gradient(180deg, #17171E, #111116)',
        boxShadow: `inset 0 0 0 1px ${C.line}, inset 0 1px 0 #FFFFFF0C, 0 50px 120px -50px rgba(0,0,0,0.95)`,
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        opacity: clamp(p * 1.6),
        transform: `translateY(${(1 - p) * 120}px) rotateX(${(1 - p) * 18}deg)`,
        fontFamily: FONT.ui,
        fontFeatureSettings: FEATURES,
        letterSpacing: '-0.01em',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 600, color: C.dim }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: alpha(C.accent, 0.12), boxShadow: `inset 0 0 0 1px ${alpha(C.accent, 0.22)}` }}>
          <Icon name={icon} size={16} color={C.accent} />
        </span>
        {label}
      </div>
      <div style={{ position: 'relative', height: 336, borderRadius: 18, background: C.app, boxShadow: `inset 0 0 0 1px ${C.line}`, overflow: 'hidden' }}>{children}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', color: C.text }}>{title}</div>
        <div style={{ fontSize: 18, lineHeight: 1.5, color: C.dim }}>{sub}</div>
      </div>
    </div>
  );
}

/** Lines of a document, drawn as soft bars. */
function Lines({ top = 64, rows = [0.8, 0.95, 0.6, 0.88, 0.7] }: { top?: number; rows?: number[] }) {
  return (
    <>
      {rows.map((w, i) => (
        <div key={i} style={{ position: 'absolute', left: 28, top: top + i * 34, width: `${w * 78}%`, height: 10, borderRadius: 5, background: i === 0 ? '#FFFFFF2A' : '#FFFFFF14' }} />
      ))}
    </>
  );
}

function Presence() {
  const d = useDrawnTime();
  // two teammates' cursors wandering over the page, on drawn time: ambient, never warped
  const a = (Math.sin(d * 0.8) + 1) / 2;
  const b = (Math.sin(d * 0.65 + 2) + 1) / 2;
  const [ax, ay] = bezier(a, [60, 250], [180, 90], [300, 260], [380, 120]);
  const [bx, by] = bezier(b, [300, 230], [420, 160], [150, 110], [240, 200]);
  return (
    <>
      <div style={{ position: 'absolute', left: 28, top: 22, right: 24, display: 'flex', alignItems: 'center' }}>
        <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: C.text }}>Q3 launch plan</span>
        <AvatarStack people={['maya', 'theo', 'ines', 'sam']} size={28} live />
      </div>
      <Lines />
      <div style={{ position: 'absolute', left: 28, top: 64 + 5 * 34 - 6, fontSize: 16, color: C.dim }}>
        Ship the beta to design partners
        <RemoteCaret who="ines" size={14} />
      </div>
      <Cursor label="Maya" color={PEOPLE.maya.color} path={[{ t: -1, x: ax, y: ay }]} scale={0.85} />
      <Cursor label="Theo" color={PEOPLE.theo.color} path={[{ t: -1, x: bx, y: by }]} scale={0.85} />
    </>
  );
}

function Search() {
  const t = useTime();
  const m = useMarks();
  const q = 'roadmap';
  const cps = q.length / (m.typeEnd - m.typeStart);
  const rows = [
    { pre: 'Product ', hit: 'roadmap', post: ', H2', where: 'Product', icon: 'note' as const },
    { pre: '', hit: 'Roadmap', post: ' review notes', where: 'Team', icon: 'note' as const },
    { pre: 'Q3 launch plan', hit: '', post: '', where: 'mentions “roadmap”', icon: 'hash' as const },
  ];
  return (
    <>
      <div style={{ position: 'absolute', left: 20, right: 20, top: 20, height: 52, borderRadius: 12, background: C.panel, boxShadow: `inset 0 0 0 1px ${C.lineStrong}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', fontSize: 19, color: C.text }}>
        <Icon name="search" size={19} color={C.dim} />
        {t < m.typeStart ? <span style={{ color: C.faint }}>Search every note</span> : <Typed text={q} start={m.typeStart} cps={cps} />}
      </div>
      {rows.map((r, i) => {
        const k = pop(t, m.typeEnd + 0.1 + i * 0.09);
        return (
          <div key={i} style={{ position: 'absolute', left: 20, right: 20, top: 90 + i * 70, height: 60, borderRadius: 12, background: i === 0 ? '#FFFFFF0C' : 'transparent', display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', opacity: clamp(k * 2), transform: `translateY(${(1 - k) * 12}px)` }}>
            <Icon name={r.icon} size={18} color={C.faint} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 16.5, fontWeight: 600, color: C.text }}>
                {r.pre}
                {r.hit ? <Highlight start={m.typeEnd + 0.35 + i * 0.1}>{r.hit}</Highlight> : null}
                {r.post}
              </span>
              <span style={{ fontSize: 13.5, color: C.faint }}>{r.where}</span>
            </div>
          </div>
        );
      })}
    </>
  );
}

function History() {
  const t = useTime();
  const m = useMarks();
  const dots = 7;
  const at = 1 - prog(t, m.scrub, 0.8, EASINGS.inOut) * (3 / (dots - 1));
  const restored = pop(t, m.restore, { bouncy: true });
  const old = at < 0.75;
  return (
    <>
      <div style={{ position: 'absolute', left: 28, top: 24, right: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: C.text }}>{old ? 'Version from Tue, 4:12 PM' : 'Current version'}</span>
        {restored > 0.01 ? (
          <span style={{ transform: `scale(${restored})` }}>
            <Badge text="Restored" color={C.ok} size={13} />
          </span>
        ) : null}
      </div>
      <div style={{ position: 'absolute', left: 28, right: 28, top: 70, fontSize: 16, lineHeight: 2, color: C.dim }}>
        <div>Launch date</div>
        <div style={{ position: 'relative', color: old ? C.ok : C.text, background: old ? alpha(C.ok, 0.1) : 'transparent', borderRadius: 6, padding: '0 8px', marginLeft: -8 }}>{old ? '+ Beta opens Sep 12 to 40 teams' : 'Beta opens Oct 3 to everyone'}</div>
        <div style={{ color: old ? alpha(C.danger, 0.8) : C.faint, textDecoration: old ? 'line-through' : undefined }}>{old ? 'Beta opens Oct 3 to everyone' : 'Pricing: free for up to 5 people'}</div>
      </div>
      <div style={{ position: 'absolute', left: 36, right: 36, bottom: 60, height: 4, borderRadius: 2, background: '#FFFFFF14' }}>
        <div style={{ width: `${at * 100}%`, height: '100%', borderRadius: 2, background: alpha(C.accent, 0.8) }} />
        {Array.from({ length: dots }, (_, i) => (
          <div key={i} style={{ position: 'absolute', left: `${(i / (dots - 1)) * 100}%`, top: -4, width: 12, height: 12, marginLeft: -6, borderRadius: '50%', background: i / (dots - 1) <= at + 0.001 ? C.accent : '#2A2A33' }} />
        ))}
        <div style={{ position: 'absolute', left: `${at * 100}%`, top: -11, width: 26, height: 26, marginLeft: -13, borderRadius: '50%', background: C.text, boxShadow: `0 0 0 6px ${alpha(C.accent, 0.25)}, 0 6px 16px rgba(0,0,0,0.6)` }} />
      </div>
      <div style={{ position: 'absolute', left: 30, right: 30, bottom: 22, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.faint }}>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Now</span>
      </div>
    </>
  );
}

export function Features() {
  const t = useTime();
  const m = useMarks();
  const { W, H } = useStage();
  const x0 = (W - (3 * CARD.w + 2 * CARD.gap)) / 2;
  const cx = (i: number) => x0 + i * (CARD.w + CARD.gap) + CARD.w / 2;
  const cy = CARD.y + CARD.h / 2;
  const wide = { x: W / 2, y: H / 2 + 20, scale: 1 };
  const on = (i: number) => ({ x: cx(i), y: cy - 10, scale: ZOOM });
  const f = [m.focus1, m.focus2, m.focus3];
  const keys = [
    { t: 0, ...wide },
    { t: f[0] - 0.1, ...wide },
    { t: f[0] + 0.7, ...on(0) },
    { t: f[1] - 0.1, ...on(0) },
    { t: f[1] + 0.7, ...on(1) },
    { t: f[2] - 0.1, ...on(1) },
    { t: f[2] + 0.7, ...on(2) },
    { t: m.restore + 0.4, ...on(2) },
    { t: m.restore + 1.2, ...wide },
  ];
  // which card is in focus, and how much; the focus lets go between cards so its frame can move
  let which = 0;
  for (let i = 0; i < 3; i++) if (t >= f[i]) which = i;
  const next = f[which + 1] ?? m.restore + 0.7;
  const amount = t < f[0] ? 0 : prog(t, f[which] + 0.2, 0.5) * (1 - prog(t, next - 0.3, 0.3));
  const rect = { x: x0 + which * (CARD.w + CARD.gap) - 8, y: CARD.y - 8, w: CARD.w + 16, h: CARD.h + 16 };
  return (
    <AbsoluteFill>
      <Backdrop glow={0.2} y={50} grid />
      <Camera keys={keys}>
        <Focus active={amount} rect={rect} radius={34} dim={0.55} blur={4}>
          <AbsoluteFill style={{ perspective: 2000 }}>
            <div style={{ position: 'absolute', left: x0, top: CARD.y, display: 'flex', gap: CARD.gap }}>
              <Card i={0} icon="users" label="Presence" title="See who’s here." sub="Live cursors and faces, so nobody edits in the dark.">
                <Presence />
              </Card>
              <Card i={1} icon="search" label="Search" title="Find anything." sub="Every note and every word, one keystroke away.">
                <Search />
              </Card>
              <Card i={2} icon="history" label="History" title="Rewind any note." sub="Every change is kept. Go back to any moment.">
                <History />
              </Card>
            </div>
          </AbsoluteFill>
        </Focus>
      </Camera>
      {/* the words: src/captions.json › showcase › features */}
      <Captions {...useCues()} />
    </AbsoluteFill>
  );
}
