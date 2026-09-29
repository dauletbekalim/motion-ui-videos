/**
 * The command palette (⌘K): a query, grouped results, a highlight that slides
 * between them. `open` 0 → 1 opens it; `active` may be fractional so the
 * highlight glides from one row to the next.
 */
import type { ReactNode } from 'react';
import { clamp, lerp } from '../lib/anim';
import { alpha, C, FEATURES, FONT, SHADOW } from '../theme';
import { Kbd } from './atoms';
import { Icon, type IconName } from './icons';
import { LumenMark } from './Mark';

export type PaletteItem = { icon: IconName; label: string; group: string; hint?: string; color?: string };

const INPUT = 60;
const GROUP = 32;
const ROW = 46;

/** Split a label around the first match of `q`, to set the matched part in bold. */
function Label({ text, q }: { text: string; q?: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (!q || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span style={{ color: C.text, fontWeight: 600 }}>{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

export function CommandPalette({
  width = 640,
  query,
  match,
  placeholder = 'Search notes, or type a command…',
  items,
  active = 0,
  open = 1,
  pressed = 0,
}: {
  width?: number;
  /** what is typed (a <Typed/> or a string); empty shows the placeholder */
  query?: ReactNode;
  /** the plain query, to bold the matching part of each result */
  match?: string;
  placeholder?: string;
  items: PaletteItem[];
  active?: number;
  open?: number;
  /** 0 → 1 flash of the active row as Enter is pressed */
  pressed?: number;
}) {
  const k = clamp(open);
  if (k <= 0.001) return null;
  // lay out rows and group labels, remembering where each row sits
  const rows: { y: number; item?: PaletteItem; label?: string }[] = [];
  const rowY: number[] = [];
  let y = 8;
  let group = '';
  for (const it of items) {
    if (it.group !== group) {
      group = it.group;
      rows.push({ y, label: group });
      y += GROUP;
    }
    rowY.push(y);
    rows.push({ y, item: it });
    y += ROW;
  }
  const listH = y + 8;
  const a = clamp(active, 0, Math.max(0, rowY.length - 1));
  const i0 = Math.floor(a);
  const hy = rowY.length ? lerp(rowY[i0], rowY[Math.min(rowY.length - 1, i0 + 1)], a - i0) : 0;
  const hasQuery = query !== undefined && query !== '';
  return (
    <div
      style={{
        width,
        borderRadius: 18,
        background: `linear-gradient(180deg, #1D1D25, ${C.raised})`,
        boxShadow: SHADOW.modal,
        fontFamily: FONT.ui,
        fontFeatureSettings: FEATURES,
        letterSpacing: '-0.01em',
        overflow: 'hidden',
        opacity: clamp(k * 1.8),
        transform: `translateY(${(1 - k) * -10}px) scale(${lerp(0.955, 1, k)})`,
        filter: k < 0.98 ? `blur(${(1 - k) * 4}px)` : undefined,
      }}
    >
      <div style={{ height: INPUT, display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px', borderBottom: `1px solid ${C.line}` }}>
        <Icon name="search" size={20} color={C.dim} />
        <span style={{ flex: 1, fontSize: 18, color: hasQuery ? C.text : C.faint, fontWeight: 400, whiteSpace: 'nowrap' }}>{hasQuery ? query : placeholder}</span>
        <Kbd size={11}>esc</Kbd>
      </div>
      <div style={{ position: 'relative', height: listH }}>
        {rowY.length ? (
          <div
            style={{
              position: 'absolute',
              left: 8,
              right: 8,
              top: hy,
              height: ROW,
              borderRadius: 10,
              background: pressed > 0 ? `rgba(255,255,255,${0.07 + pressed * 0.06})` : '#FFFFFF12',
              boxShadow: `inset 0 0 0 1px ${C.line}`,
            }}
          />
        ) : null}
        {rows.map((r, i) =>
          r.label ? (
            <div key={i} style={{ position: 'absolute', left: 22, top: r.y, height: GROUP, display: 'flex', alignItems: 'center', fontSize: 11.5, fontWeight: 600, color: C.faint, letterSpacing: '0.02em' }}>
              {r.label}
            </div>
          ) : r.item ? (
            <div key={i} style={{ position: 'absolute', left: 8, right: 8, top: r.y, height: ROW, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px' }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: 'grid',
                  placeItems: 'center',
                  background: r.item.color ? alpha(r.item.color, 0.14) : '#FFFFFF0D',
                  boxShadow: `inset 0 0 0 1px ${r.item.color ? alpha(r.item.color, 0.22) : C.line}`,
                }}
              >
                <Icon name={r.item.icon} size={15} color={r.item.color ?? C.dim} />
              </span>
              <span style={{ flex: 1, fontSize: 15, color: '#C9C9D2', fontWeight: 500 }}>
                <Label text={r.item.label} q={match} />
              </span>
              {r.item.hint ? <span style={{ fontSize: 12.5, color: C.faint, fontWeight: 500 }}>{r.item.hint}</span> : null}
            </div>
          ) : null,
        )}
      </div>
      <div style={{ height: 42, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderTop: `1px solid ${C.line}`, background: '#FFFFFF04', fontSize: 12, color: C.faint, fontWeight: 500 }}>
        <LumenMark size={16} />
        <span style={{ flex: 1 }}>Lumen</span>
        <span>Open</span>
        <Kbd icon="enter" size={10.5} />
        <span style={{ width: 8 }} />
        <span>Actions</span>
        <span style={{ display: 'flex', gap: 3 }}>
          <Kbd icon="cmd" size={10.5} />
          <Kbd size={10.5}>K</Kbd>
        </span>
      </div>
    </div>
  );
}

/** How tall the palette is for these items (for centring it or aiming at a row). */
export function paletteHeight(items: PaletteItem[]): number {
  const groups = new Set(items.map((i) => i.group)).size;
  return INPUT + 8 + groups * GROUP + items.length * ROW + 8 + 42;
}
