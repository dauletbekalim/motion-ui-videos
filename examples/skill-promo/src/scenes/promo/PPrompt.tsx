/**
 * "Tell Claude what you're launching." A terminal in the repo: the ask is
 * typed big in the middle of the input box, Enter sends it up into the
 * conversation while the box drops to the bottom, and Claude's first replies
 * arrive: the skill, the repo, the plan. The plan's numbers are the
 * template's own reel (src/cuts.json), the one this ask produces. On 16:9
 * there is time to show that plan as a scene table.
 *
 * On a phone the terminal is the whole UI area (780 × 920) and nothing in it
 * is under 40 px: the ask at 58, the sent message at 48, the replies at 42.
 */
import { AbsoluteFill } from 'remotion';
import { clamp, EASINGS, lerp, pop, prog } from '../../lib/anim';
import { CAPTIONS, useCues } from '../../lib/cues';
import { Captions, Typed } from '../../lib/text';
import { cutDuration, CUTS, useMarks, useStage, useTime } from '../../lib/time';
import { Backdrop } from '../../lib/ui';
import { press } from '../../product';
import { PROMO, promoLayout, Reply, Terminal } from '../../promo/parts';
import { alpha, C, FONT } from '../../theme';

export const ASK = 'make a 21 s reel for our app';

/** The template reel's scene table: what each scene's captions say (its own src/captions.json lines; the end card's name and address). */
const captionOf = (id: string) =>
  id === 'end'
    ? 'Lumen · lumen.example'
    : (CAPTIONS.reel?.[id]?.cues ?? [])
        .map((c) => c.text.replace(/\*/g, '').replace(/\s*\|\s*/g, ' '))
        .join(' ');

export function PPrompt() {
  const t = useTime();
  const m = useMarks();
  const stage = useStage();
  const { W } = stage;
  const { portrait, ui, captionTop } = promoLayout(stage);
  const reel = CUTS.reel;
  const cps = ASK.length / (m.typeEnd - m.typeStart);
  const win = pop(t, m.termIn);
  const sent = prog(t, m.enter, 0.12);
  const up = prog(t, m.enter, 0.42, EASINGS.snappy);
  const hit = press(t, m.enter);

  // sizes: the chrome, the ask while typed, the ask once sent, the replies, the empty box after
  const S = portrait
    ? { tw: ui.w, th: ui.h, chrome: 40, ask: 58, msg: 48, reply: 42, box: 44, shell: 34, gap: 30 }
    : { tw: 1520, th: ui.h - 10, chrome: 30, ask: 62, msg: 36, reply: 32, box: 34, shell: 26, gap: 16 };
  const bar = S.chrome * 1.6;
  const padY = S.chrome * 0.9;
  const bodyH = S.th - bar - 2 * padY;
  const lines = portrait ? 2 : 1;
  const box0 = { h: S.ask * 1.3 * lines + (portrait ? 52 : 40) };
  const box1 = { h: S.box * 1.3 + (portrait ? 44 : 34) };
  // before Enter the box sits in the middle, big; after it, at the bottom, empty and small
  const boxY = lerp((bodyH - box0.h) / 2, bodyH - box1.h, up);
  const boxH = lerp(box0.h, box1.h, up);
  const promptSize = lerp(S.ask, S.box, up);
  const replies = [
    { at: m.reply1, dot: C.accent, text: <>Using <span style={{ color: C.text, fontWeight: 600 }}>{PROMO.name}</span></> },
    { at: m.reply2, dot: C.info, text: <>Reading src/, theme.ts</> },
    { at: m.reply3, dot: C.ok, text: portrait ? <>Plan: {reel.scenes.length} scenes · {cutDuration('reel').toFixed(1)} s</> : <>Plan: {reel.scenes.length} scenes · {cutDuration('reel').toFixed(1)} s · 9:16</> },
  ];
  const rows = portrait ? [] : reel.scenes;
  return (
    <AbsoluteFill>
      <Backdrop glow={0.15} y={portrait ? 34 : 40} grid />
      <div style={{ position: 'absolute', left: (W - S.tw) / 2, top: portrait ? ui.y : ui.y + 4, opacity: clamp(win * 2), transform: `translateY(${(1 - win) * 40}px) scale(${0.96 + 0.04 * win})` }}>
        <Terminal width={S.tw} height={S.th} title="~/lumen — claude" size={S.chrome}>
          {/* where you started it: the repo, then claude */}
          <div style={{ position: 'absolute', left: S.chrome, top: padY, fontSize: S.shell, color: C.faint, opacity: 1 - up, whiteSpace: 'pre' }}>
            ~/lumen <span style={{ color: C.dim }}>$ claude</span>
          </div>
          {/* the conversation: the sent ask, then the replies */}
          {up > 0.001 ? (
            <div style={{ position: 'absolute', left: S.chrome, right: S.chrome, top: padY, opacity: clamp(up * 2), transform: `translateY(${(1 - up) * ((bodyH - box0.h) / 2)}px)` }}>
              <div style={{ display: 'flex', gap: S.msg * 0.5, padding: portrait ? '18px 24px' : '12px 18px', borderRadius: 16, background: '#FFFFFF0D', fontSize: S.msg, lineHeight: 1.3, color: '#E6E6EC', fontWeight: 500 }}>
                <span style={{ color: C.faint }}>&gt;</span>
                <span style={{ whiteSpace: 'pre-wrap' }}>{ASK}</span>
              </div>
              <div style={{ marginTop: portrait ? 44 : 26, display: 'flex', flexDirection: 'column', gap: S.gap, fontSize: S.reply, color: '#B4B4C0', lineHeight: 1.3 }}>
                {replies.map((r, i) => (
                  <Reply key={i} k={pop(t, r.at)} dot={r.dot} size={S.reply}>
                    {r.text}
                  </Reply>
                ))}
              </div>
              {portrait ? (
                // the plan as a strip: the template reel's seven scenes, each as long as it runs
                <div style={{ marginTop: 34, marginLeft: S.reply * 0.91, display: 'flex', gap: 6 }}>
                  {reel.scenes.map((sc, i) => {
                    const k = pop(t, m.reply3 + 0.15 + i * 0.05);
                    return (
                      <div key={sc.id} style={{ flex: sc.seconds, height: 66, borderRadius: 12, display: 'grid', placeItems: 'center', background: alpha(i % 2 ? C.info : C.accent, 0.16), boxShadow: `inset 0 0 0 1.5px ${alpha(i % 2 ? C.info : C.accent, 0.5)}`, fontSize: 26, color: C.text, opacity: clamp(k * 2), transform: `scaleY(${lerp(0.4, 1, k)})` }}>
                        {sc.seconds.toFixed(1)}
                      </div>
                    );
                  })}
                </div>
              ) : null}
              {rows.length ? (
                <div style={{ marginTop: 22, marginLeft: S.reply * 0.9, padding: '14px 22px', borderRadius: 14, boxShadow: `inset 0 0 0 1px ${C.line}`, fontSize: 26, lineHeight: 1.62, fontFamily: FONT.mono }}>
                  {rows.map((s, i) => {
                    const k = pop(t, m.reply3 + 0.3 + i * 0.12);
                    return (
                      <div key={s.id} style={{ display: 'flex', gap: 26, opacity: clamp(k * 2), transform: `translateX(${(1 - k) * -14}px)`, color: '#9A9AA8' }}>
                        <span style={{ width: 210, color: C.text }}>{s.id}</span>
                        <span style={{ width: 70, color: C.accent, textAlign: 'right' }}>{s.seconds.toFixed(1)}</span>
                        <span style={{ width: 16 }} />
                        <span>{captionOf(s.id)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
          {/* the input box, as Claude Code draws it: a rounded frame and a prompt */}
          <div style={{ position: 'absolute', left: S.chrome, right: S.chrome, top: padY + boxY, height: boxH, padding: portrait ? `${lerp(26, 22, up)}px 28px` : `${lerp(20, 17, up)}px 24px`, borderRadius: 20, boxShadow: `inset 0 0 0 ${lerp(2.5, 1.5, up)}px ${alpha(up < 0.5 ? C.accent : C.text, lerp(0.55, 0.14, up) + 0.25 * hit)}, 0 0 ${60 * (1 - up)}px ${alpha(C.accent, 0.12 * (1 - up))}`, background: alpha('#FFFFFF', 0.03 + 0.05 * hit), fontSize: promptSize, lineHeight: 1.3, display: 'flex', gap: promptSize * 0.5 }}>
            <span style={{ color: C.accent, fontWeight: 600 }}>&gt;</span>
            <span style={{ flex: 1, color: C.text, fontWeight: 500, opacity: 1 - sent }}>
              <Typed text={ASK} start={m.typeStart} cps={cps} caret={t < m.enter} style={{ whiteSpace: 'pre-wrap' }} />
            </span>
            {up > 0.5 ? <span style={{ position: 'absolute', left: portrait ? 28 + S.box * 1.1 : 24 + S.box * 1.1, top: portrait ? 22 : 17, width: 3, height: S.box * 1.2, borderRadius: 2, background: C.accent, opacity: Math.floor(t * 2.4) % 2 ? 0 : 0.9 }} /> : null}
          </div>
        </Terminal>
      </div>
      {/* the words: src/captions.json › <cut> › pPrompt (punch on the phone, calm on 16:9) */}
      <Captions {...useCues()} top={portrait ? captionTop : undefined} />
    </AbsoluteFill>
  );
}
