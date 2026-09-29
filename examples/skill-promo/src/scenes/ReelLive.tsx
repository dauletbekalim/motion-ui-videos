/**
 * Reel, the "how": one tap on Share and the team is in the note, then a
 * camera punch-in on them writing together. Shows the mechanism rather than
 * claiming it, which is the part of a reel people remember.
 *
 * Phone-sized: the note in its phone layout fills the UI area at the framing
 * ReelPalette ended on (body 34 px), and the punch-in crops to the to-dos
 * (39 px) with a Camera inside a Crop, instead of shrinking the whole window.
 */
import { AbsoluteFill } from 'remotion';
import { pop, prog } from '../lib/anim';
import { useCues } from '../lib/cues';
import { Captions, Typed } from '../lib/text';
import { useMarks, useStage, useTime } from '../lib/time';
import { Backdrop, Camera, Cursor } from '../lib/ui';
import { Editor, LAUNCH_PLAN, PEOPLE, press, RemoteCaret, shareButton, todoCheckbox } from '../product';
import { aimAt, Crop, launchBlocks, NOTE_S, phoneLayout } from './common';

/** the punch-in: ×1.15 on the to-dos (design px of the note) */
const ZOOM = 1.15;
const TODOS = { x: 158, y: 330 };

export function ReelLive() {
  const t = useTime();
  const m = useMarks();
  const stage = useStage();
  const { W, H } = stage;
  const { ui, captionTop } = phoneLayout(stage);
  const ew = ui.w / NOTE_S;
  // the note runs on below the crop, for the punch-in to find
  const eh = ui.h / NOTE_S + 160;
  /** a point in the note's design px → stage px */
  const at = (p: { x: number; y: number }) => ({ x: ui.x + p.x * NOTE_S, y: ui.y + p.y * NOTE_S });
  const share = at(shareButton(ew, true));
  const box1 = at(todoCheckbox(0, true));
  const focus = at(TODOS);
  const third = LAUNCH_PLAN.todos[2];
  const cps = third.length / (m.typeEnd - m.typeStart);
  const joins = [m.join1, m.join2, m.join3];
  const rest = { x: ui.x + ui.w / 2, y: ui.y + ui.h / 2 };
  const keys = [
    aimAt(0, rest.x, rest.y, 1, ui, W, H),
    aimAt(m.punch - 0.02, rest.x, rest.y, 1, ui, W, H),
    aimAt(m.punch + 0.16, focus.x, focus.y, ZOOM, ui, W, H),
    aimAt(m.typeEnd + 0.6, focus.x, focus.y, ZOOM * 1.03, ui, W, H),
  ];
  return (
    <AbsoluteFill>
      <Backdrop glow={0.2} y={36} grid />
      {/* the push-in cuts the longest lines at the right edge: melt them rather than slice letters */}
      <Crop rect={ui} fade={120} fadeRight={64 * prog(t, m.punch, 0.16)}>
        <Camera keys={keys}>
          <div style={{ position: 'absolute', left: ui.x, top: ui.y, width: ew, height: eh, transform: `scale(${NOTE_S})`, transformOrigin: '0 0' }}>
            <Editor
              compact
              width={ew}
              height={eh}
              title={LAUNCH_PLAN.title}
              spaceId="launch"
              edited="Edited 2m ago"
              presence={['you', 'maya', 'theo', 'ines']}
              presencePops={[1, ...joins.map((j) => pop(t, j, { bouncy: true }))]}
              sharePress={press(t, m.click1)}
              blocks={launchBlocks({
                enter: [1, 1, 1, pop(t, m.typeStart - 0.3)],
                done: [prog(t, m.check, 0.3), 0, 0],
                more: true,
                third: (
                  <>
                    <Typed text={third} start={m.typeStart} cps={cps} caret={false} />
                    <RemoteCaret who="theo" show={pop(t, m.typeStart - 0.25)} />
                  </>
                ),
              })}
            />
          </div>
        </Camera>
      </Crop>
      {/* the cursors ride the same camera, outside the crop, so they can come in from beyond the card's edge */}
      <Camera keys={keys}>
        <Cursor path={[{ t: -0.2, x: share.x + 110, y: share.y + 320 }, { t: m.click1 - 0.03, ...share }, { t: m.click1 + 0.6, x: share.x - 60, y: share.y + 380 }]} clicks={[m.click1]} scale={1.8} hideAfter={m.punch} />
        {/* Maya ticks the first to-do, then drifts up and away, clear of the line Theo is typing */}
        <Cursor label="Maya" color={PEOPLE.maya.color} path={[{ t: m.join1, x: box1.x + 540, y: box1.y - 170 }, { t: m.check - 0.04, ...box1 }, { t: m.check + 0.8, x: box1.x + 470, y: box1.y - 110 }]} clicks={[m.check]} scale={1.5} />
      </Camera>
      {/* the words: src/captions.json › reel › reelLive */}
      <Captions {...useCues()} top={captionTop} />
    </AbsoluteFill>
  );
}
