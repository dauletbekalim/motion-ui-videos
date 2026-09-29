/**
 * Reel, the product moment: the shortcut as big keys, the palette opening,
 * "launch" typed, Enter, and a zoom punch into the note it found. The same
 * product components as the showcase, sized for a phone: the palette ×2.4
 * (its rows 36 px on the 1080 px frame), the note in its phone layout ×2.2
 * (body 34 px, title 75 px), both in the UI area under the captions.
 */
import { AbsoluteFill } from 'remotion';
import { clamp, EASINGS, lerp, pop, prog } from '../lib/anim';
import { useCues } from '../lib/cues';
import { Captions, Typed, typedTimes } from '../lib/text';
import { useMarks, useStage, useTime } from '../lib/time';
import { Backdrop } from '../lib/ui';
import { CommandPalette, Editor, LAUNCH_PLAN, paletteHeight, press } from '../product';
import { Crop, Keycaps, launchBlocks, NOTE_S, PALETTE_HOME, PALETTE_LAUNCH, phoneLayout } from './common';

const QUERY = 'launch';
/** the palette's scale: its 15 px rows become 36 px */
const PS = 2.4;

export function ReelPalette() {
  const t = useTime();
  const m = useMarks();
  const stage = useStage();
  const { ui, captionTop } = phoneLayout(stage);
  const cps = QUERY.length / (m.typeEnd - m.typeStart);
  const n = typedTimes(QUERY, m.typeStart, cps).filter((x) => x <= t).length;
  const open = pop(t, m.paletteOpen) * (1 - prog(t, m.noteIn - 0.1, 0.2, EASINGS.in));
  // three rows before the query, three after it, so the palette keeps its height as the results change
  const items = n >= 2 ? PALETTE_LAUNCH : PALETTE_HOME.slice(0, 3);
  const pw = ui.w / PS;
  const ph = paletteHeight(items) * PS;
  // the note arrives as a zoom punch: fast in, then a slow settle
  const note = prog(t, m.noteIn, 0.3, EASINGS.snappy);
  const drift = prog(t, m.noteIn, 1.4, EASINGS.linear);
  const ew = ui.w / NOTE_S;
  return (
    <AbsoluteFill>
      <Backdrop glow={0.2} y={34} grid />
      <div style={{ position: 'absolute', left: 0, right: 0, top: ui.y + ui.h / 2 - 110, display: 'flex', justifyContent: 'center' }}>
        {/* `keys` is the press itself, so the key sounds land on it */}
        <Keycaps keys={['cmd', 'K']} start={m.keys - 0.22} at={m.keys} end={m.paletteOpen} size={220} />
      </div>
      <div style={{ position: 'absolute', left: ui.x, top: ui.y + (ui.h - ph) / 2, width: pw, transform: `scale(${PS})`, transformOrigin: '0 0' }}>
        <CommandPalette
          width={pw}
          open={open}
          placeholder="Search notes…"
          query={n ? <Typed text={QUERY} start={m.typeStart} cps={cps} /> : ''}
          match={QUERY.slice(0, n)}
          items={items}
          pressed={press(t, m.enter)}
          active={0}
        />
      </div>
      {note > 0.001 ? (
        <AbsoluteFill style={{ opacity: clamp(note * 3), transform: `scale(${lerp(0.7, 1, note) * lerp(1, 1.03, drift)})`, transformOrigin: `${ui.x + ui.w / 2}px ${ui.y + ui.h / 2}px` }}>
          <Crop rect={ui} fade={150}>
            <div style={{ position: 'absolute', left: ui.x, top: ui.y, width: ew, height: ui.h / NOTE_S, transform: `scale(${NOTE_S})`, transformOrigin: '0 0' }}>
              <Editor
                compact
                width={ew}
                height={ui.h / NOTE_S}
                title={LAUNCH_PLAN.title}
                spaceId="launch"
                edited="Edited 2m ago"
                presence={['you']}
                blocks={launchBlocks({ enter: [1, 1, 1, 0], more: true })}
              />
            </div>
          </Crop>
        </AbsoluteFill>
      ) : null}
      {/* the words: src/captions.json › reel › reelPalette */}
      <Captions {...useCues()} top={captionTop} />
    </AbsoluteFill>
  );
}
