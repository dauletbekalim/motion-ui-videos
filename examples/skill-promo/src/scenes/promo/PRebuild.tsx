/**
 * "It reads your repo and rebuilds your UI." The files are read, one opens,
 * and each line of it builds its part of the interface: the component, its
 * rows, the selected note. The code is the template's real API (NoteList with
 * items and selected), and the list is the real component drawing itself.
 * On 16:9 there is room for the file tree, the theme tokens, and a click
 * that proves the list is live UI and not a picture.
 */
import { AbsoluteFill } from 'remotion';
import { clamp, EASINGS, lerp, pop, prog } from '../../lib/anim';
import { useCues } from '../../lib/cues';
import { Captions } from '../../lib/text';
import { useMarks, useStage, useTime } from '../../lib/time';
import { Backdrop, Cursor } from '../../lib/ui';
import { Icon, NOTELIST, NoteList, NOTES } from '../../product';
import { CODE, CodeCard, Pill, promoLayout, type Tok } from '../../promo/parts';
import { alpha, C, FONT } from '../../theme';
import { Crop, type Rect } from '../common';

const CODE_LINES: Tok[][] = [
  [['<', 'punc'], ['NoteList', 'tag']],
  [['  items', 'attr'], ['={', 'punc'], ['notes', 'plain'], ['}', 'punc']],
  [['  selected', 'attr'], ['=', 'punc'], ['"launch"', 'str']],
  [['/>', 'punc']],
];

const TABS = ['theme.ts', 'NoteList.tsx', 'Editor.tsx'];
const TREE = ['lumen/', '├ src/theme.ts', '├ src/components/Sidebar.tsx', '├ src/components/NoteList.tsx', '├ src/components/Editor.tsx', '└ src/styles/app.css'];
/** the tree row that opens: NoteList.tsx */
const OPENS = 3;

/** The note list, drawn at scale `s` into `rect`, arriving line by line. */
function List({ rect, s, t, m, glide = -1 }: { rect: Rect; s: number; t: number; m: Record<string, number>; glide?: number }) {
  const frame = pop(t, m.line1);
  const rows = NOTES.map((n, i) => ({ note: n, enter: pop(t, m.line2 + i * 0.07) }));
  const sel = t >= m.line3 + 0.04;
  const flash = sel ? Math.exp(-(t - m.line3) * 5) : 0;
  const done = prog(t, m.done, 0.3) * (1 - prog(t, m.done + 0.5, 0.8));
  const lw = rect.w / s;
  const lh = rect.h / s;
  const rowTop = (i: number) => NOTELIST.header + i * NOTELIST.row;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: clamp(frame * 2), transform: `scale(${lerp(0.96, 1, frame)})`, transformOrigin: `${rect.x + rect.w / 2}px ${rect.y + rect.h / 2}px` }}>
      <div style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: 30, boxShadow: `0 0 ${120 * done}px ${alpha(C.accent, 0.35 * done)}` }} />
      <Crop rect={rect} radius={30} fade={110}>
        <div style={{ position: 'absolute', left: rect.x, top: rect.y, width: lw, height: lh, transform: `scale(${s})`, transformOrigin: '0 0' }}>
          <NoteList width={lw} height={lh} items={rows} selected={sel && glide < 0 ? 'launch' : undefined} count={t >= m.line2 ? 24 : ''} />
          {/* the highlight gliding to another row: the list is live, so selection is a prop that can move */}
          {glide >= 0 ? (
            <div style={{ position: 'absolute', left: 10, width: lw - 20, top: lerp(rowTop(0), rowTop(1), glide), height: NOTELIST.row - 4, borderRadius: 12, background: '#FFFFFF0E', boxShadow: `inset 0 0 0 1px ${C.line}` }} />
          ) : null}
          {flash > 0.01 ? <div style={{ position: 'absolute', left: 10, width: lw - 20, top: rowTop(0), height: NOTELIST.row - 4, borderRadius: 12, boxShadow: `inset 0 0 0 ${1.5}px ${alpha(C.accent, 0.8 * flash)}, 0 0 30px ${alpha(C.accent, 0.3 * flash)}` }} /> : null}
        </div>
      </Crop>
    </div>
  );
}

export function PRebuild() {
  const t = useTime();
  const m = useMarks();
  const stage = useStage();
  const { W, H } = stage;
  const { portrait, ui, captionTop } = promoLayout(stage);
  const marks = [m.line1, m.line2, m.line3, m.done];
  // the line being read is lit; the highlight moves on to the next, and leaves nothing behind
  const lit = marks.map((a, i) => prog(t, a, 0.15) * (1 - prog(t, marks[i + 1] ?? m.done + 0.6, 0.25)));
  const shown = CODE_LINES.map((_, i) => prog(t, m.open + i * 0.05, 0.3));
  const open = pop(t, m.open);
  const cues = useCues();

  if (portrait) {
    // one card: first the files being read (a row each, ticked as it is read), then NoteList.tsx opens in it at
    // 44 px; under it, the list that code builds, at ×2.7 (note titles 38 px)
    const card = pop(t, m.scan - 0.1);
    const rowsOut = prog(t, m.open - 0.08, 0.16);
    const lh = 44 * 1.55;
    const listY = ui.y + 4 * lh + 36 * 1.3 + 26;
    const rect: Rect = { x: ui.x, y: listY, w: ui.w, h: ui.y + ui.h - listY };
    return (
      <AbsoluteFill>
        <Backdrop glow={0.15} y={34} grid />
        <div style={{ position: 'absolute', left: ui.x, top: ui.y, opacity: clamp(card * 2), transform: `translateY(${(1 - card) * 20}px)` }}>
          <CodeCard file="NoteList.tsx" header={false} lines={CODE_LINES} size={44} width={ui.w} lit={lit} shown={shown} pad={36} style={{ boxShadow: `0 0 0 ${1.5 * open}px ${alpha(C.accent, 0.35 * (1 - prog(t, m.open + 0.3, 0.4)))}, 0 40px 90px -30px rgba(0,0,0,0.9)` }} />
          {/* the files, read one by one; NoteList.tsx is the one that opens */}
          {rowsOut < 1 ? (
            <div style={{ position: 'absolute', inset: 0, padding: `${36 * 0.6}px 36px`, borderRadius: 44 * 0.7, background: 'linear-gradient(180deg, #121217, #0E0E12)', opacity: 1 - rowsOut, fontFamily: FONT.mono, fontSize: 42, letterSpacing: '-0.02em' }}>
              {TABS.map((name, i) => {
                const k = pop(t, m.scan + i * 0.06);
                const read = prog(t, m.scan + 0.12 + i * 0.13, 0.15);
                const active = i === 1 ? prog(t, m.open - 0.2, 0.15) : 0;
                return (
                  <div key={name} style={{ height: lh, display: 'flex', alignItems: 'center', gap: 22, opacity: clamp(k * 2), transform: `translateX(${(1 - k) * -16}px)`, color: active > 0.5 ? C.text : read > 0.5 ? '#B8B8C4' : C.faint }}>
                    <span style={{ color: CODE.dim, fontSize: 34 }}>src/</span>
                    <span style={{ flex: 1 }}>{name}</span>
                    {read > 0.01 ? <Icon name="check" size={40} stroke={2.6} color={active > 0.5 ? C.accent : C.ok} style={{ opacity: read }} /> : null}
                  </div>
                );
              })}
            </div>
          ) : null}
          <div style={{ position: 'absolute', right: 22, top: 20 }}>
            <Pill mono size={26} color={C.dim}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: alpha(open > 0.5 ? C.accent : C.info, 0.8) }} />
              {t < m.open ? 'reading' : 'NoteList.tsx'}
            </Pill>
          </div>
        </div>
        {/* where the UI will be built: an empty frame the list fills from line 1 */}
        <div style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: 30, border: `2px dashed ${alpha(C.text, 0.2)}`, background: alpha('#FFFFFF', 0.02), opacity: clamp(card * 2) * (1 - prog(t, m.line1, 0.2)) }} />
        <List rect={rect} s={2.7} t={t} m={m} />
        {/* the words: src/captions.json › promo-reel › pRebuild */}
        <Captions {...cues} top={captionTop} />
      </AbsoluteFill>
    );
  }

  // 16:9: the tree, the tokens and the code down the left, the list it builds big on the right
  const col = { x: ui.x, w: 700 };
  const tree = { x: col.x, y: ui.y + 10, w: col.w, row: 48 };
  const tokensY = tree.y + 18 * 2 + TREE.length * tree.row + 22;
  const codeY = tokensY + 70;
  const rect: Rect = { x: col.x + col.w + 40, y: ui.y + 10, w: W - stage.safe.right - (col.x + col.w + 40), h: ui.h - 20 };
  const s = 2.4;
  const rowRead = (i: number) => m.scan + i * 0.14;
  const scanRow = clamp((t - m.scan) / 0.14, 0, TREE.length - 1);
  const onTree = prog(t, m.scan - 0.2, 0.3) * (1 - prog(t, m.open + 0.2, 0.3));
  const barY = t < m.open ? scanRow : lerp(scanRow, OPENS, prog(t, m.open - 0.15, 0.3));
  const tokens = [
    { label: '#0F0F13', swatch: C.app },
    { label: '#FFB547', swatch: C.accent },
    { label: 'Inter', swatch: '' },
    { label: 'radius 14', swatch: '' },
  ];
  const glide = t >= m.click - 0.02 ? prog(t, m.click, 0.28, EASINGS.snappy) : -1;
  const rowCenter = (i: number) => ({ x: rect.x + 150 * s * 0.9, y: rect.y + (NOTELIST.header + i * NOTELIST.row + 44) * s });
  const r2 = rowCenter(1);
  return (
    <AbsoluteFill>
      <Backdrop glow={0.15} y={40} grid />
      <div style={{ position: 'absolute', left: tree.x, top: tree.y, width: tree.w, borderRadius: 18, background: 'linear-gradient(180deg, #121217, #0E0E12)', boxShadow: `inset 0 0 0 1px ${C.line}, 0 40px 90px -40px rgba(0,0,0,0.9)`, padding: '18px 0', fontFamily: FONT.mono, fontSize: 25, opacity: clamp(pop(t, m.scan - 0.3) * 2) }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 18 + barY * tree.row, height: tree.row, background: alpha(C.accent, 0.12 * Math.max(onTree, t >= m.open ? 1 : 0)), boxShadow: `inset 3px 0 0 ${alpha(C.accent, Math.max(onTree, t >= m.open ? 1 : 0))}` }} />
        {TREE.map((row, i) => {
          const read = i > 0 ? prog(t, rowRead(i), 0.15) : 0;
          return (
            <div key={row} style={{ position: 'relative', height: tree.row, display: 'flex', alignItems: 'center', gap: 10, padding: '0 26px', color: i === 0 ? C.faint : i === OPENS && t >= m.open ? C.text : read > 0.5 ? '#B8B8C4' : C.faint, whiteSpace: 'pre' }}>
              <span style={{ flex: 1 }}>{row}</span>
              {read > 0.01 ? <Icon name="check" size={24} stroke={2.6} color={C.ok} style={{ opacity: read }} /> : null}
            </div>
          );
        })}
      </div>
      {/* what theme.ts gave: the brand as tokens */}
      <div style={{ position: 'absolute', left: tree.x, top: tokensY, width: tree.w, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {tokens.map((tk, i) => {
          const k = pop(t, rowRead(1) + 0.1 + i * 0.07, { bouncy: true });
          if (k <= 0.001) return null;
          return (
            <div key={tk.label} style={{ opacity: clamp(k * 2), transform: `scale(${lerp(0.8, 1, k)})` }}>
              <Pill mono size={24} color={C.text}>
                {tk.swatch ? <span style={{ width: 22, height: 22, borderRadius: 5, background: tk.swatch, boxShadow: `inset 0 0 0 1px ${C.lineStrong}` }} /> : tk.label === 'Inter' ? <span style={{ fontFamily: FONT.ui, fontWeight: 700, color: C.accent }}>Aa</span> : null}
                {tk.label}
              </Pill>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: col.x, top: codeY, opacity: clamp(open * 2), transform: `translateY(${(1 - open) * 30}px)` }}>
        <CodeCard file="NoteList.tsx" lines={CODE_LINES} size={36} width={col.w} lit={lit} shown={shown} pad={34} />
      </div>
      {/* where the UI will be built: an empty frame the list fills from line 1 */}
      <div style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: 30, border: `2px dashed ${alpha(C.text, 0.16)}`, background: alpha('#FFFFFF', 0.015), opacity: clamp(pop(t, m.scan - 0.2) * 2) * (1 - prog(t, m.line1, 0.2)) }} />
      <List rect={rect} s={s} t={t} m={m} glide={glide} />
      <Cursor path={[{ t: m.click - 1.0, x: rect.x + rect.w + 60, y: H + 40 }, { t: m.click - 0.03, ...r2 }, { t: m.click + 0.8, x: r2.x + 120, y: r2.y + 150 }]} clicks={[m.click]} scale={1.5} />
      {/* the words: src/captions.json › promo-showcase › pRebuild */}
      <Captions {...cues} />
    </AbsoluteFill>
  );
}
