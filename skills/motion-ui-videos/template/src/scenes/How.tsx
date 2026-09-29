/**
 * Showcase, how it works. The whole product in a browser, driven the way a
 * person would: a click on "New note", a title typed, ⌘K to share, the team
 * invited, a link copied, then teammates arriving and writing alongside you.
 * The camera leans in on whatever the caption is talking about; the focus
 * dims everything else while a dialog is up. Every time comes from a mark.
 */
import { AbsoluteFill } from 'remotion';
import { clamp, EASINGS, lerp, pop, prog } from '../lib/anim';
import { Browser, BROWSER_BAR } from '../lib/devices';
import { useCues } from '../lib/cues';
import { Captions, Typed, typedTimes } from '../lib/text';
import { useMarks, useStage, useTime } from '../lib/time';
import { Backdrop, Callout, Camera, cameraAt, Cursor, Focus, Toast } from '../lib/ui';
import {
  APP,
  CommandPalette,
  EDITOR,
  LAUNCH_PLAN,
  LumenApp,
  note,
  NOTES,
  paletteHeight,
  PEOPLE,
  press,
  RemoteCaret,
  ShareDialog,
  shareGeometry,
  SIDEBAR,
  todoCheckbox,
  type Member,
} from '../product';
import { BRAND, C } from '../theme';
import { CaptionScrim, Keycaps, launchBlocks, PALETTE_HOME, PALETTE_SHARE } from './common';

// the browser on the stage, and the app's scale inside it
const B = { x: 210, y: 172, w: 1500, h: 846 };
const S = 1.15;
const DW = B.w / S; // the app's design width
const PALETTE_W = 600;
const SHARE_W = 540;

/** A point in the app's design coordinates → stage px. */
const at = (x: number, y: number) => ({ x: B.x + x * S, y: B.y + BROWSER_BAR + y * S });

export function How() {
  const t = useTime();
  const m = useMarks();
  const { W, H } = useStage();

  /* the note being written */
  const created = t >= m.click1;
  const titleCps = LAUNCH_PLAN.title.length / (m.typeEnd - m.typeStart);
  const titleN = typedTimes(LAUNCH_PLAN.title, m.typeStart, titleCps).filter((x) => x <= t).length;
  const draft = { ...note('launch'), title: titleN ? LAUNCH_PLAN.title.slice(0, titleN) : 'Untitled', snippet: t >= m.listIn ? 'This week: finalize the pricing page copy…' : 'No content yet', time: 'now', people: [] as never[] };
  const items = [...(created ? [{ note: draft, enter: pop(t, m.noteIn) }] : []), ...NOTES.filter((n) => n.id !== 'launch').map((n) => ({ note: n }))];
  const thirdText = LAUNCH_PLAN.todos[2];
  const teamCps = thirdText.length / (m.teamTypeEnd - m.teamTypeStart);
  const editor = created
    ? {
        title: t < m.typeStart ? <span style={{ color: C.faint }}>Untitled</span> : <Typed text={LAUNCH_PLAN.title} start={m.typeStart} cps={titleCps} caret={t < m.listIn} />,
        spaceId: 'launch',
        edited: 'Edited just now',
        presence: ['you', 'maya', 'theo', 'ines'] as const,
        presencePops: [1, pop(t, m.join1, { bouncy: true }), pop(t, m.join2, { bouncy: true }), pop(t, m.join3, { bouncy: true })],
        blocks: launchBlocks({
          enter: [pop(t, m.listIn), pop(t, m.listIn + 0.1), pop(t, m.listIn + 0.2), pop(t, m.teamTypeStart - 0.35)],
          done: [prog(t, m.check1, 0.35), 0, 0],
          third: (
            <>
              <Typed text={thirdText} start={m.teamTypeStart} cps={teamCps} caret={false} />
              <RemoteCaret who="theo" show={pop(t, m.teamTypeStart - 0.3) * (1 - prog(t, m.teamTypeEnd + 0.6, 0.3))} />
            </>
          ),
        }),
      }
    : {
        title: 'Weekly sync, Oct 2',
        spaceId: 'team',
        edited: 'Edited 48m ago',
        presence: ['you'] as const,
        blocks: [
          { kind: 'h' as const, text: 'Agenda' },
          { kind: 'todo' as const, text: 'Pricing page ships Thursday', done: 1, owner: 'sam' as const },
          { kind: 'todo' as const, text: 'Move the customer demo to Friday', owner: 'maya' as const },
          { kind: 'p' as const, text: 'Ines is out next week. Sam covers support until she is back.' },
        ],
      };

  /* the palette and the share dialog */
  // the dialog opens over the palette, and the palette fades out behind it: there is never a frame with neither
  const paletteOpen = pop(t, m.paletteOpen) * (1 - prog(t, m.shareOpen + 0.1, 0.2));
  const query = 'share';
  const queryCps = query.length / (m.paletteTypeEnd - m.paletteTypeStart);
  const typedN = typedTimes(query, m.paletteTypeStart, queryCps).filter((x) => x <= t).length;
  const paletteItems = typedN >= 2 ? PALETTE_SHARE : PALETTE_HOME;
  const pal = { x: (DW - PALETTE_W) / 2, y: 92, w: PALETTE_W, h: paletteHeight(paletteItems) };
  const shareOpen = pop(t, m.shareOpen) * (1 - prog(t, m.shareClose, 0.3, EASINGS.in));
  const members: Member[] = [
    { who: 'you', role: 'Owner' },
    { who: 'maya', role: 'Can edit', enter: pop(t, m.join1) },
    { who: 'theo', role: 'Can edit', enter: pop(t, m.join2) },
    { who: 'ines', role: 'Can edit', enter: pop(t, m.join3) },
  ];
  const g = shareGeometry(members, SHARE_W);
  const dlg = { x: (DW - SHARE_W) / 2, y: 96 };
  const invite = at(dlg.x + g.invite.x + g.invite.w / 2, dlg.y + g.invite.y + g.invite.h / 2);
  const copy = at(dlg.x + g.copy.x + g.copy.w / 2, dlg.y + g.copy.y + g.copy.h / 2);

  /* where the pointer goes */
  const newNote = at(SIDEBAR.newNote.x + SIDEBAR.newNote.w / 2 - 30, SIDEBAR.newNote.y + SIDEBAR.newNote.h / 2);
  const box1 = at(APP.editor + todoCheckbox(0).x, todoCheckbox(0).y);
  const titleAt = at(APP.editor + EDITOR.padX, EDITOR.titleY);

  /* the camera: in on the note while it is written, back out for the palette, a lean toward the dialog, in again on the team */
  const wide = { x: W / 2, y: H / 2, scale: 1 };
  const onNote = { x: titleAt.x + 300, y: titleAt.y + 160, scale: 1.42 };
  const onTeam = { x: box1.x + 290, y: box1.y - 58, scale: 1.5 };
  const keys = [
    { t: 0, ...wide },
    { t: m.click1 - 0.3, ...wide },
    { t: m.typeStart - 0.1, ...onNote },
    { t: m.keys - 0.5, ...onNote },
    { t: m.paletteOpen + 0.1, ...wide },
    { t: m.shareOpen, ...wide },
    { t: m.shareOpen + 0.7, x: W / 2, y: H / 2 + 60, scale: 1.1 },
    { t: m.shareClose, x: W / 2, y: H / 2 + 60, scale: 1.1 },
    { t: m.shareClose + 0.6, ...wide },
    { t: m.cursorsIn - 0.1, ...wide },
    { t: m.cursorsIn + 0.8, ...onTeam },
    { t: m.teamTypeEnd + 1, ...onTeam, scale: onTeam.scale * 1.04 },
  ];
  const zoom = cameraAt(keys, t, W, H).scale;

  // one dimming from the palette opening to the dialog closing: it never lifts between the two,
  // and its clear window glides from the palette to the dialog instead of jumping
  const dimmed = pop(t, m.paletteOpen) * (1 - prog(t, m.shareClose, 0.3, EASINGS.in));
  const hand = prog(t, m.shareOpen, 0.3, EASINGS.inOut);
  const palRect = { ...at(pal.x, pal.y), w: PALETTE_W * S, h: pal.h * S };
  const dlgRect = { ...at(dlg.x, dlg.y), w: SHARE_W * S, h: g.height * S };
  const focusRect = { x: lerp(palRect.x, dlgRect.x, hand), y: lerp(palRect.y, dlgRect.y, hand), w: lerp(palRect.w, dlgRect.w, hand), h: lerp(palRect.h, dlgRect.h, hand) };

  const enter = pop(t, 0);
  const calloutOn = clamp(1 - prog(t, m.click2 - 0.25, 0.2));

  return (
    <AbsoluteFill>
      <Backdrop glow={0.2} y={45} grid />
      <Camera keys={keys}>
        <Focus active={dimmed} rect={focusRect} radius={18 * S} dim={0.35} blur={4}>
          <div style={{ position: 'absolute', left: B.x, top: B.y, transform: `translateY(${(1 - enter) * 40}px)`, opacity: enter }}>
            <Browser url={`app.${BRAND.url}/northwind`} width={B.w} height={B.h}>
              <LumenApp
                width={B.w}
                height={B.h - BROWSER_BAR}
                scale={S}
                items={items}
                selected={created ? 'launch' : 'sync'}
                newNotePress={press(t, m.click1)}
                newNoteHover={prog(t, m.click1 - 0.5, 0.2) * (1 - prog(t, m.click1 + 0.3, 0.3))}
                editor={{ ...editor, presence: [...editor.presence] }}
                scrim={dimmed}
                overlay={
                  <>
                    <div style={{ position: 'absolute', left: pal.x, top: pal.y }}>
                      <CommandPalette
                        width={PALETTE_W}
                        open={paletteOpen}
                        query={typedN ? <Typed text={query} start={m.paletteTypeStart} cps={queryCps} /> : ''}
                        match={query.slice(0, typedN)}
                        items={paletteItems}
                        pressed={press(t, m.paletteSelect)}
                      />
                    </div>
                    <div style={{ position: 'absolute', left: dlg.x, top: dlg.y }}>
                      <ShareDialog title={LAUNCH_PLAN.title} width={SHARE_W} open={shareOpen} members={members} invitePress={press(t, m.click2)} copyPress={press(t, m.click3)} copied={t >= m.click3 + 0.05 ? 1 : 0} />
                    </div>
                  </>
                }
              />
            </Browser>
          </div>
        </Focus>
        {calloutOn > 0 ? (
          <div style={{ opacity: calloutOn }}>
            <Callout at={{ x: invite.x + 72, y: invite.y }} text="Everyone, in one click" start={m.shareOpen + 0.6} side="right" length={70} />
          </div>
        ) : null}
        <Cursor
          path={[
            { t: 0.8, x: 1250, y: 1180 },
            { t: m.click1 - 0.05, ...newNote },
            // out of the way while the keyboard does the work
            { t: m.click1 + 0.9, x: 1480, y: 800 },
            { t: m.shareOpen + 0.5, x: 1500, y: 810 },
            { t: m.click2 - 0.05, ...invite },
            { t: m.click3 - 0.05, ...copy },
            { t: m.shareClose + 0.3, x: copy.x + 40, y: copy.y + 60 },
          ]}
          clicks={[m.click1, m.click2, m.click3]}
          hideAfter={m.shareClose + 0.3}
        />
        <Cursor
          label="Maya"
          color={PEOPLE.maya.color}
          path={[
            { t: m.cursorsIn, x: box1.x + 520, y: box1.y + 320 },
            { t: m.check1 - 0.05, x: box1.x, y: box1.y },
            { t: m.check1 + 0.9, x: box1.x + 400, y: box1.y + 190 },
          ]}
          clicks={[m.check1]}
        />
      </Camera>
      {/* the shortcut, shown as keys, over the picture rather than in it */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 70, display: 'flex', justifyContent: 'center' }}>
        <Keycaps keys={['cmd', 'K']} start={m.keys - 0.25} at={m.keys} end={m.paletteOpen + 0.5} size={92} />
      </div>
      {/* the toast sits over the picture, below the dialog, where the eye already is */}
      <Toast text="Link copied. Anyone at Northwind can open it." start={m.toast} end={m.shareClose + 0.9} bottom={62} />
      <CaptionScrim amount={clamp((zoom - 1) / 0.2)} />
      {/* the words: src/captions.json › showcase › how */}
      <Captions {...useCues()} />
    </AbsoluteFill>
  );
}
