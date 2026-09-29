/**
 * The whole app: sidebar, note list and editor, with a layer on top for the
 * palette, dialogs and toasts. It is laid out at design size (width / scale)
 * and scaled up as one piece, so type stays crisp and a scene can push the
 * UI bigger for a phone without re-laying it out.
 *
 * appPoint() turns a point in the app's design coordinates into pixels in
 * the box the app is drawn in: that is how a scene aims a cursor at a button.
 */
import type { ReactNode } from 'react';
import { alpha, C } from '../theme';
import { Editor, type Block } from './Editor';
import { NoteList, NOTELIST, type ListItem } from './NoteList';
import { Sidebar, SIDEBAR } from './Sidebar';
import type { PersonId } from './data';

export type EditorState = {
  title: ReactNode;
  spaceId?: string;
  edited?: string;
  presence?: PersonId[];
  presencePops?: number[];
  blocks: Block[];
  sharePress?: number;
};

export const APP = {
  list: SIDEBAR.width,
  editor: SIDEBAR.width + NOTELIST.width,
} as const;

/** A point in the app's design coordinates → pixels inside the app's box. */
export function appPoint(x: number, y: number, scale: number): { x: number; y: number } {
  return { x: x * scale, y: y * scale };
}

export function LumenApp({
  width,
  height,
  scale = 1,
  sidebar = true,
  list = true,
  active = 'all',
  newNotePress = 0,
  newNoteHover = 0,
  items = [],
  selected,
  editor,
  scrim = 0,
  overlay,
}: {
  width: number;
  height: number;
  scale?: number;
  sidebar?: boolean;
  list?: boolean;
  active?: string;
  newNotePress?: number;
  newNoteHover?: number;
  items?: ListItem[];
  selected?: string;
  editor: EditorState;
  /** 0 → 1 darkening behind a modal, as the real app does */
  scrim?: number;
  /** drawn above everything, in design coordinates */
  overlay?: ReactNode;
}) {
  const dw = width / scale;
  const dh = height / scale;
  const sideW = sidebar ? SIDEBAR.width : 0;
  const listW = list ? NOTELIST.width : 0;
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', background: C.app }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: dw, height: dh, transform: `scale(${scale})`, transformOrigin: '0 0', display: 'flex' }}>
        {sidebar ? <Sidebar height={dh} active={active} press={newNotePress} hover={newNoteHover} /> : null}
        {list ? <NoteList items={items} selected={selected} height={dh} /> : null}
        <Editor width={dw - sideW - listW} height={dh} {...editor} />
        {scrim > 0 ? <div style={{ position: 'absolute', inset: 0, background: alpha('#000000', 0.45 * scrim) }} /> : null}
        {overlay ? <div style={{ position: 'absolute', inset: 0 }}>{overlay}</div> : null}
      </div>
    </div>
  );
}
