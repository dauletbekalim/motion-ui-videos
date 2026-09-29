/**
 * The list of notes. Each row can be arriving or leaving (`enter` 0 → 1
 * grows it into place), so a scene can add a note and the rows below slide
 * down, the way the real app would.
 */
import type { ReactNode } from 'react';
import { clamp, lerp } from '../lib/anim';
import { C, FEATURES, FONT } from '../theme';
import { AvatarStack, Swatch } from './atoms';
import { space, type Note } from './data';
import { Icon } from './icons';

export const NOTELIST = { width: 324, header: 58, row: 90 } as const;

export type ListItem = { note: Note; enter?: number };

function Row({ note, selected, enter = 1 }: { note: Note; selected: boolean; enter?: number }) {
  const k = clamp(enter);
  const s = space(note.space);
  return (
    // clipped while it grows or shrinks, so a row on its way in or out never draws over its neighbours
    <div style={{ height: NOTELIST.row * k, opacity: clamp(k * 1.6 - 0.4), overflow: k < 0.999 ? 'hidden' : 'visible' }}>
      <div
        style={{
          height: NOTELIST.row - 4,
          margin: '0 10px',
          padding: '13px 14px',
          borderRadius: 12,
          background: selected ? '#FFFFFF0D' : 'transparent',
          boxShadow: selected ? `inset 0 0 0 1px ${C.line}` : undefined,
          transform: `translateY(${(1 - k) * -8}px) scale(${lerp(0.97, 1, k)})`,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flex: 'none' }}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note.title}</span>
          <span style={{ fontSize: 11.5, color: C.faint, fontWeight: 500 }}>{note.time}</span>
        </div>
        <div style={{ flex: 'none', fontSize: 12.5, lineHeight: '17px', color: C.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note.snippet}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 1, flex: 'none' }}>
          <Swatch color={s.color} size={7} />
          <span style={{ flex: 1, fontSize: 11.5, color: C.faint, fontWeight: 500 }}>{s.name}</span>
          {note.people.length ? <AvatarStack people={note.people} size={16} ring={selected ? '#1A1A1F' : C.app} /> : null}
        </div>
      </div>
    </div>
  );
}

export function NoteList({ items, selected, height, width = NOTELIST.width, title = 'All notes', count = 24 }: { items: ListItem[]; selected?: string; height: number; width?: number; title?: string; count?: ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        flex: 'none',
        overflow: 'hidden',
        background: C.app,
        borderRight: `1px solid ${C.line}`,
        fontFamily: FONT.ui,
        fontFeatureSettings: FEATURES,
        letterSpacing: '-0.01em',
      }}
    >
      <div style={{ height: NOTELIST.header, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px 0 24px' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{title}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.faint }}>{count}</span>
        <span style={{ flex: 1 }} />
        <Icon name="filter" size={16} color={C.faint} />
        <Icon name="compose" size={16} color={C.faint} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((it) => (
          <Row key={it.note.id} note={it.note} selected={it.note.id === selected} enter={it.enter} />
        ))}
      </div>
      {/* the list runs on past the window */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, background: `linear-gradient(transparent, ${C.app})` }} />
    </div>
  );
}
