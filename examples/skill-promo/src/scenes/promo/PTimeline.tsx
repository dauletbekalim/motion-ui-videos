/**
 * "Picture and sound share one timeline." The marks on screen are this
 * scene's real marks from src/cuts.json (read with useMarks), relative to
 * the playhead's start. As the playhead crosses each one, the UI does its
 * thing and the sound engine's cue lands on the same frame: a click, a pop,
 * keys. On 16:9 one number is edited and the second pass moves the moment,
 * picture and sound together.
 */
import { AbsoluteFill } from 'remotion';
import { clamp, EASINGS, lerp, pop, prog } from '../../lib/anim';
import { useCues } from '../../lib/cues';
import { Captions, Typed } from '../../lib/text';
import { useMarks, useStage, useTime } from '../../lib/time';
import { Backdrop, Cursor } from '../../lib/ui';
import { AvatarStack, Button, Checkbox, press, RemoteCaret, shareButton, Swatch } from '../../product';
import { CodeCard, Pill, promoLayout, Wave, type Tok } from '../../promo/parts';
import { alpha, C, FEATURES, FONT } from '../../theme';
import { Crop, type Rect } from '../common';

export const TYPED_TODO = 'Record the video';

type Pass = { start: number; click: number; join: number; ts: number; te: number };
const fmt = (s: number) => s.toFixed(2);

/** The little UI the marks drive: the note's top bar (Share, who is here) and one to-do. */
function MiniUI({ rect, s, t, p, cursorFrom }: { rect: Rect; s: number; t: number; p: Pass; cursorFrom: { x: number; y: number } }) {
  const dw = rect.w / s;
  const dh = rect.h / s;
  const joined = pop(t, p.join, { bouncy: true });
  const cps = TYPED_TODO.length / (p.te - p.ts);
  const share = shareButton(dw, true);
  const sx = rect.x + share.x * s;
  const sy = rect.y + share.y * s;
  return (
    <>
      <Crop rect={rect} radius={28}>
        <div style={{ position: 'absolute', left: rect.x, top: rect.y, width: dw, height: dh, transform: `scale(${s})`, transformOrigin: '0 0', background: C.app, fontFamily: FONT.ui, fontFeatureSettings: FEATURES, letterSpacing: '-0.01em' }}>
          <div style={{ height: 56, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px 0 16px', borderBottom: `1px solid ${C.line}` }}>
            <Swatch color={C.accent} size={8} />
            <span style={{ fontSize: 13, color: C.dim, fontWeight: 500 }}>Launch</span>
            <span style={{ flex: 1 }} />
            <AvatarStack people={['you', 'maya']} pops={[1, joined]} size={26} live />
            <span style={{ width: 4 }} />
            <Button icon="share" press={press(t, p.click)}>
              Share
            </Button>
          </div>
          <div style={{ padding: '18px 16px 0' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.03em' }}>Q3 launch plan</div>
            <div style={{ marginTop: 12, height: 38, display: 'flex', alignItems: 'center', gap: 13 }}>
              <Checkbox size={19} />
              <span style={{ fontSize: 15.5, color: C.text, whiteSpace: 'nowrap' }}>
                <Typed text={TYPED_TODO} start={p.ts} cps={cps} caret={false} />
                <RemoteCaret who="maya" show={pop(t, p.ts - 0.2) * (1 - prog(t, p.te + 0.5, 0.3))} />
              </span>
            </div>
          </div>
        </div>
      </Crop>
      <Cursor path={[{ t: p.start - 0.1, ...cursorFrom }, { t: p.click - 0.03, x: sx, y: sy }, { t: p.click + 0.7, x: sx - 90, y: sy + 150 }]} clicks={[p.click]} scale={1.6} />
    </>
  );
}

export function PTimeline() {
  const t = useTime();
  const m = useMarks();
  const stage = useStage();
  const { portrait, ui, captionTop } = promoLayout(stage);
  const p1: Pass = { start: m.pass1, click: m.click, join: m.join, ts: m.typeStart, te: m.typeEnd };
  const p2: Pass | null = portrait ? null : { start: m.pass2, click: m.click2, join: m.join2, ts: m.typeStart2, te: m.typeEnd2 };
  const p = p2 && t >= p2.start - 0.05 ? p2 : p1;
  const span = p1.te - p1.start + 0.4;
  const head = clamp((t - p.start) / span);
  // the edit (16:9): the join mark's number is changed, and its flag and its spike slide to the new time
  const edit = p2 ? prog(t, m.edit + 0.3, 0.45, EASINGS.inOut) : 0;
  const rel = {
    click: p1.click - p1.start,
    join: lerp(p1.join - p1.start, p2 ? p2.join - p2.start : 0, edit),
    ts: p1.ts - p1.start,
    te: p1.te - p1.start,
  };
  const litAt = (at: number) => (t >= at ? Math.exp(-(t - at) * 3.2) : 0);
  const lits = { click: litAt(p.click), join: litAt(p.join), type: t >= p.ts && t <= p.te + 0.1 ? 1 : litAt(p.te + 0.1) };
  const selecting = p2 ? prog(t, m.edit, 0.15) * (1 - prog(t, m.edit + 0.3, 0.05)) : 0;
  const retyped = p2 && t >= m.edit + 0.3;
  const joinVal = retyped ? fmt(p2!.join - p2!.start) : fmt(p1.join - p1.start);
  const joinFlash = retyped ? Math.exp(-(t - m.edit - 0.3) * 4) : 0;
  const lines: Tok[][] = [
    [['"click"', 'key'], [': ', 'punc'], [fmt(rel.click), 'num'], [',', 'punc']],
    [['"join"', 'key'], [': ', 'punc'], [joinVal, 'num'], [',', 'punc']],
    [['"type"', 'key'], [': ', 'punc'], [fmt(rel.ts), 'num']],
  ];
  const card = pop(t, 0);
  const cardSize = portrait ? 44 : 34;

  // phone: the marks (44 px), the timeline, the UI they drive (×2.3: the to-do at 36 px), top to bottom in the UI area.
  // 16:9: the timeline across the top, the marks and the UI side by side under it.
  const strip = portrait ? { x: ui.x + 22, y: ui.y + 292, w: ui.w - 44, h: 250 } : { x: ui.x + 24, y: ui.y + 26, w: ui.w - 48, h: 300 };
  const codeTop = portrait ? ui.y : ui.y + 380;
  const mini: Rect = portrait ? { x: ui.x, y: ui.y + 580, w: ui.w, h: ui.h - 580 } : { x: ui.x + 680, y: ui.y + 380, w: ui.w - 680, h: ui.h - 380 };
  const S = portrait ? 2.3 : 2.2;
  const ruler = portrait ? 46 : 44;
  const flagsH = portrait ? 66 : 60;
  const waveY = strip.y + ruler + flagsH;
  const waveH = strip.h - ruler - flagsH;
  const X = (u: number) => strip.x + (u / span) * strip.w;
  const flags = [
    { name: 'click', at: rel.click, lit: lits.click },
    { name: 'join', at: rel.join, lit: Math.max(lits.join, joinFlash) },
    { name: 'type', at: rel.ts, lit: lits.type },
  ];
  const stripIn = prog(t, 0.05, 0.4);
  // ticks every half second, none so close to the end that its label would hang off the strip
  const ticks = Array.from({ length: Math.floor((span - 0.2) / 0.5) + 1 }, (_, i) => i * 0.5);

  return (
    <AbsoluteFill>
      <Backdrop glow={0.15} y={portrait ? 34 : 38} grid />
      {/* cuts.json: this scene's marks, as the playhead sees them */}
      <div style={{ position: 'absolute', left: ui.x, top: codeTop, opacity: clamp(card * 2), transform: `translateY(${(1 - card) * 20}px)` }}>
        <CodeCard
          file="cuts.json"
          header={!portrait}
          size={cardSize}
          pad={portrait ? 36 : 30}
          width={portrait ? ui.w : 640}
          lines={portrait ? lines : [[['"marks"', 'key'], [': {', 'punc']], ...lines.map((l) => [['  ', 'plain'] as Tok, ...l]), [['}', 'punc']]]}
          lit={portrait ? [lits.click, Math.max(lits.join, joinFlash), lits.type] : [0, lits.click, Math.max(lits.join, joinFlash, selecting), lits.type, 0]}
        />
        {portrait ? (
          <div style={{ position: 'absolute', right: 24, top: 22 }}>
            <Pill mono size={26} color={C.dim}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: alpha(C.info, 0.8) }} />
              cuts.json
            </Pill>
          </div>
        ) : null}
        {selecting > 0.01 ? (
          // the old number selected, about to be typed over
          <div style={{ position: 'absolute', left: 30 + cardSize * 1.5 + cardSize * 0.6 * 10, top: cardSize * 1.7 + 18 + cardSize * 1.55 * 2 + cardSize * 0.2, width: cardSize * 0.6 * 4 + 4, height: cardSize * 1.15, background: alpha(C.info, 0.35 * selecting), borderRadius: 4 }} />
        ) : null}
      </div>
      {/* the timeline: a ruler, the marks as flags, the sound as a waveform, the playhead */}
      <div style={{ position: 'absolute', left: strip.x - 20, top: strip.y - 16, width: strip.w + 40, height: strip.h + 32, borderRadius: 24, background: alpha('#FFFFFF', 0.025), boxShadow: `inset 0 0 0 1px ${C.line}`, opacity: stripIn }} />
      <div style={{ position: 'absolute', left: 0, top: 0, opacity: stripIn }}>
        {ticks.map((s) => (
          <div key={s} style={{ position: 'absolute', left: X(s), top: strip.y, height: ruler - 12, borderLeft: `1px solid ${alpha(C.text, 0.18)}`, paddingLeft: 8, fontFamily: FONT.mono, fontSize: portrait ? 26 : 22, color: C.faint, whiteSpace: 'nowrap' }}>
            {s.toFixed(1)}
          </div>
        ))}
        {flags.map((f) => {
          const x = X(f.at);
          return (
            <div key={f.name}>
              <div style={{ position: 'absolute', left: x - 1, top: strip.y + ruler + 44, width: 2, height: flagsH - 44 + waveH, background: alpha(f.lit > 0.05 ? C.accent : C.text, 0.25 + 0.6 * f.lit) }} />
              <div style={{ position: 'absolute', left: x, top: strip.y + ruler, transform: `translateX(-50%) scale(${1 + 0.12 * f.lit})` }}>
                <Pill mono size={portrait ? 30 : 26} color={f.lit > 0.3 ? '#1A0F05' : C.text} bg={f.lit > 0.3 ? C.accent : '#1D1D25'} border={f.lit > 0.05 ? alpha(C.accent, 0.8) : C.lineStrong} style={{ height: portrait ? 50 : 44 }}>
                  {f.name}
                </Pill>
              </div>
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: strip.x, top: waveY }}>
          <Wave
            width={strip.w}
            height={waveH}
            head={head}
            bars={portrait ? 90 : 180}
            events={[
              { x: rel.click / span, kind: 'click', lit: lits.click },
              { x: rel.join / span, kind: 'pop', lit: Math.max(lits.join, joinFlash) },
              { x: rel.ts / span, kind: 'keys', lit: lits.type, len: (rel.te - rel.ts) / span },
            ]}
          />
        </div>
        {t >= p.start - 0.1 ? (
          <div style={{ position: 'absolute', left: X(head * span) - 1.5, top: strip.y - 6, width: 3, height: strip.h + 12, borderRadius: 2, background: '#FFF4DC', boxShadow: `0 0 18px ${alpha(C.accent, 0.9)}` }}>
            <div style={{ position: 'absolute', left: -8, top: -10, width: 0, height: 0, borderLeft: '9.5px solid transparent', borderRight: '9.5px solid transparent', borderTop: '12px solid #FFF4DC' }} />
          </div>
        ) : null}
      </div>
      <MiniUI rect={mini} s={S} t={t} p={p} cursorFrom={{ x: mini.x + mini.w * 0.35, y: mini.y + mini.h + 60 }} />
      {/* the words: src/captions.json › <cut> › pTimeline (punch on the phone, calm on 16:9) */}
      <Captions {...useCues()} top={portrait ? captionTop : undefined} />
    </AbsoluteFill>
  );
}
