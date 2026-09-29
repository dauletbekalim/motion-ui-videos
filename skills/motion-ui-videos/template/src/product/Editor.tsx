/**
 * The note editor: a top bar with who is here and a Share button, the title,
 * and blocks (headings, to-dos, paragraphs, a callout). Headings and to-dos
 * have fixed heights (EDITOR) so a scene can aim a teammate's cursor at a
 * checkbox; every block can arrive (`enter` 0 → 1).
 */
import type { ReactNode } from 'react';
import { clamp, lerp } from '../lib/anim';
import { alpha, C, FEATURES, FONT } from '../theme';
import { Avatar, AvatarStack, Button, Checkbox, Swatch } from './atoms';
import { space, type PersonId } from './data';
import { Icon } from './icons';

export const EDITOR = {
  bar: 56,
  padX: 64,
  /** the side margin of the phone layout (`compact`): 16, as a phone app's */
  padXCompact: 16,
  /** top of the title, from the editor's top */
  titleY: 100,
  /** top of the first block */
  blocksY: 206,
  h: 46,
  todo: 38,
} as const;

export type Block =
  | { kind: 'h'; text: ReactNode; enter?: number }
  | { kind: 'todo'; text: ReactNode; done?: number; owner?: PersonId; enter?: number }
  | { kind: 'p'; text: ReactNode; enter?: number }
  | { kind: 'callout'; text: ReactNode; enter?: number };

/** Where the checkbox of to-do `i` sits, if the blocks start with one heading and then the to-dos. */
export function todoCheckbox(i: number, compact = false): { x: number; y: number } {
  return { x: (compact ? EDITOR.padXCompact : EDITOR.padX) + 10, y: EDITOR.blocksY + EDITOR.h + i * EDITOR.todo + EDITOR.todo / 2 };
}

/** The middle of the top bar's Share button in an editor this wide (the phone layout drops the star and the menu after it). */
export function shareButton(width: number, compact = false): { x: number; y: number } {
  const right = compact ? 14 : 18 + 17 + 10 + 17 + 10;
  return { x: width - right - 41, y: EDITOR.bar / 2 };
}

function Enter({ k = 1, height, children }: { k?: number; height?: number; children: ReactNode }) {
  const e = clamp(k);
  if (e <= 0.001) return height ? <div style={{ height: 0 }} /> : null;
  return (
    <div style={{ height: height ? height * Math.min(1, e * 1.4) : undefined, opacity: clamp(e * 1.5 - 0.2), transform: `translateY(${(1 - e) * 10}px)` }}>
      {children}
    </div>
  );
}

function BlockView({ b }: { b: Block }) {
  if (b.kind === 'h') {
    return (
      <Enter k={b.enter} height={EDITOR.h}>
        <div style={{ height: EDITOR.h, display: 'flex', alignItems: 'flex-end', paddingBottom: 10, fontSize: 17, fontWeight: 600, color: C.text, letterSpacing: '-0.015em' }}>{b.text}</div>
      </Enter>
    );
  }
  if (b.kind === 'todo') {
    const done = clamp(b.done ?? 0);
    return (
      <Enter k={b.enter} height={EDITOR.todo}>
        <div style={{ height: EDITOR.todo, display: 'flex', alignItems: 'center', gap: 13 }}>
          <Checkbox done={done} size={19} />
          <span style={{ position: 'relative', fontSize: 15.5, color: lerpColor(done), whiteSpace: 'nowrap' }}>
            {b.text}
            <span style={{ position: 'absolute', left: -2, right: -2, top: '54%', height: 1.5, background: C.faint, transform: `scaleX(${done})`, transformOrigin: 'left center' }} />
          </span>
          <span style={{ flex: 1 }} />
          {b.owner ? <Avatar who={b.owner} size={20} /> : null}
        </div>
      </Enter>
    );
  }
  if (b.kind === 'callout') {
    return (
      <Enter k={b.enter}>
        <div style={{ marginTop: 18, display: 'flex', gap: 12, padding: '14px 18px', borderRadius: 12, background: alpha(C.accent, 0.07), boxShadow: `inset 0 0 0 1px ${alpha(C.accent, 0.16)}`, fontSize: 14.5, lineHeight: 1.6, color: '#E9DFCF' }}>
          <Icon name="bolt" size={17} color={C.accent} style={{ marginTop: 2 }} />
          <span>{b.text}</span>
        </div>
      </Enter>
    );
  }
  return (
    <Enter k={b.enter}>
      <div style={{ fontSize: 15.5, lineHeight: 1.7, color: '#C6C6D0' }}>{b.text}</div>
    </Enter>
  );
}

function lerpColor(done: number): string {
  // from C.text to C.faint as a to-do is ticked off
  const a = [0xed, 0xed, 0xf2];
  const b = [0x6b, 0x6b, 0x78];
  const c = a.map((v, i) => Math.round(lerp(v, b[i], done)));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function Editor({
  width,
  height,
  title,
  spaceId = 'launch',
  edited = 'Edited just now',
  presence = [],
  presencePops,
  blocks,
  sharePress = 0,
  bar = true,
  compact = false,
}: {
  width: number;
  height: number;
  title: ReactNode;
  spaceId?: string;
  edited?: string;
  presence?: PersonId[];
  presencePops?: number[];
  blocks: Block[];
  sharePress?: number;
  bar?: boolean;
  /**
   * The phone layout: 16 px margins, and a top bar with only the space, who
   * is here and Share. For a phone-sized frame, where the editor is about
   * 350 px wide and scaled up ×2.2 so its body text is 34 px on a 1080 px reel.
   */
  compact?: boolean;
}) {
  const s = space(spaceId);
  const top = bar ? 0 : -EDITOR.bar;
  const padX = compact ? EDITOR.padXCompact : EDITOR.padX;
  return (
    <div style={{ position: 'relative', width, height, flex: 'none', overflow: 'hidden', background: C.app, fontFamily: FONT.ui, fontFeatureSettings: FEATURES, letterSpacing: '-0.01em' }}>
      {bar ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: EDITOR.bar, display: 'flex', alignItems: 'center', gap: 10, padding: compact ? `0 14px 0 ${padX}px` : '0 18px 0 24px', borderBottom: `1px solid ${C.line}` }}>
          <Swatch color={s.color} size={8} />
          <span style={{ fontSize: 13, color: C.dim, fontWeight: 500 }}>{s.name}</span>
          {compact ? null : (
            <>
              <Icon name="chevronRight" size={13} color={C.faint} />
              <span style={{ fontSize: 13, color: C.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>{title}</span>
            </>
          )}
          <span style={{ flex: 1 }} />
          <AvatarStack people={presence} pops={presencePops} size={26} live />
          <span style={{ width: 4 }} />
          <Button icon="share" press={sharePress}>
            Share
          </Button>
          {compact ? null : (
            <>
              <Icon name="star" size={17} color={C.faint} />
              <Icon name="more" size={17} color={C.faint} />
            </>
          )}
        </div>
      ) : null}
      <div style={{ position: 'absolute', left: padX, right: padX, top: EDITOR.titleY + top }}>
        <div style={{ height: 46, fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', color: C.text, lineHeight: '46px', whiteSpace: 'nowrap' }}>{title}</div>
        <div style={{ marginTop: 14, height: 24, display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: C.faint, fontWeight: 500 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '3px 10px', borderRadius: 999, background: alpha(s.color, 0.1), color: s.color, fontWeight: 600, fontSize: 12.5 }}>
            <Swatch color={s.color} size={7} />
            {s.name}
          </span>
          <span>{edited}</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: padX, right: padX, top: EDITOR.blocksY + top, display: 'flex', flexDirection: 'column' }}>
        {blocks.map((b, i) => (
          <BlockView key={i} b={b} />
        ))}
      </div>
    </div>
  );
}
