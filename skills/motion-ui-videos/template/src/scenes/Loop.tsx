/**
 * A seamless 6 s loop for a landing page or docs: ⌘K, "new note", Enter, a
 * title typed, and the note tidied away again. The loop starts and ends on
 * the same still frame (nothing ambient moves at rest), so it can repeat
 * forever without a visible seam. No captions, no sound: it plays muted
 * on a page next to text that explains it.
 */
import { AbsoluteFill } from 'remotion';
import { EASINGS, pop, prog } from '../lib/anim';
import { Window, WINDOW_BAR } from '../lib/devices';
import { Typed, typedTimes } from '../lib/text';
import { useMarks, useTime } from '../lib/time';
import { Backdrop, Focus } from '../lib/ui';
import { CommandPalette, LAUNCH_PLAN, LumenApp, note, NOTES, paletteHeight, press } from '../product';
import { C } from '../theme';
import { Keycaps, launchBlocks, PALETTE_HOME, PALETTE_NEW } from './common';

const WIN = { x: 80, y: 56, w: 1440, h: 888 };
const PW = 600;
// the UI a little bigger than life: a loop is usually shown smaller than the frame
const S = 1.2;
const QUERY = 'new note';
const TITLE = 'Standup, Thursday';

export function Loop() {
  const t = useTime();
  const m = useMarks();
  const cps = QUERY.length / (m.typeEnd - m.typeStart);
  const n = typedTimes(QUERY, m.typeStart, cps).filter((x) => x <= t).length;
  const items = n >= 2 ? PALETTE_NEW : PALETTE_HOME;
  const open = pop(t, m.paletteOpen) * (1 - prog(t, m.paletteClose, 0.18, EASINGS.in));
  const dw = WIN.w / S;
  const pal = { x: (dw - PW) / 2, y: 90 };
  // the new note: in at noteIn, out again at noteOut, so the last frame is the first
  const inNote = pop(t, m.noteIn) * (1 - prog(t, m.noteOut, 0.5, EASINGS.inOut));
  const onNew = t >= m.paletteClose && t < m.noteOut + 0.1;
  const titleCps = TITLE.length / (m.titleEnd - m.titleStart);
  const typed = typedTimes(TITLE, m.titleStart, titleCps).filter((x) => x <= t).length;
  const draft = { ...note('launch'), id: 'new', title: typed ? TITLE.slice(0, typed) : 'Untitled', snippet: 'No content yet', space: 'team', time: 'now', people: [] as never[] };
  const list = [...(inNote > 0.001 ? [{ note: draft, enter: inNote }] : []), ...NOTES.map((x) => ({ note: x }))];
  const editor = onNew
    ? {
        title: t < m.titleStart ? <span style={{ color: C.faint }}>Untitled</span> : <Typed text={TITLE} start={m.titleStart} cps={titleCps} caret={t < m.titleEnd + 0.4} />,
        spaceId: 'team',
        edited: 'Edited just now',
        presence: ['you' as const],
        blocks: [{ kind: 'p' as const, text: <span style={{ color: C.faint }}>Start writing, or press / for blocks</span> }],
      }
    : {
        title: LAUNCH_PLAN.title,
        spaceId: 'launch',
        edited: 'Edited 2m ago',
        presence: ['you' as const, 'maya' as const, 'theo' as const],
        blocks: launchBlocks({ more: true, done: [1, 0, 0] }),
      };
  const rect = { x: WIN.x + pal.x * S, y: WIN.y + WINDOW_BAR + pal.y * S, w: PW * S, h: paletteHeight(items) * S };
  return (
    <AbsoluteFill>
      <Backdrop glow={0.2} y={30} />
      <Focus active={open} rect={rect} radius={18 * S} dim={0.35} blur={3}>
        <div style={{ position: 'absolute', left: WIN.x, top: WIN.y }}>
          <Window title="Lumen" width={WIN.w} height={WIN.h}>
            <LumenApp
              width={WIN.w}
              height={WIN.h - WINDOW_BAR}
              scale={S}
              items={list}
              selected={onNew ? 'new' : 'launch'}
              editor={editor}
              scrim={open}
              overlay={
                <div style={{ position: 'absolute', left: pal.x, top: pal.y }}>
                  <CommandPalette width={PW} open={open} query={n ? <Typed text={QUERY} start={m.typeStart} cps={cps} /> : ''} match={QUERY.slice(0, n)} items={items} pressed={press(t, m.select)} />
                </div>
              }
            />
          </Window>
        </div>
      </Focus>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 90, display: 'flex', justifyContent: 'center' }}>
        <Keycaps keys={['cmd', 'K']} start={m.keys - 0.2} at={m.keys} end={m.paletteOpen + 0.35} size={72} />
      </div>
    </AbsoluteFill>
  );
}
