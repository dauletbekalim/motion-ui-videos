/**
 * Lumen's sidebar: workspace, "New note", search, navigation, spaces, you.
 * Fixed geometry (SIDEBAR) so a scene can aim the cursor at a button.
 */
import { alpha, C, FEATURES, FONT, R } from '../theme';
import { Avatar, Kbd, Swatch } from './atoms';
import { SPACES, WORKSPACE } from './data';
import { Icon, type IconName } from './icons';
import { LumenMark } from './Mark';

export const SIDEBAR = {
  width: 232,
  /** the "New note" button, in sidebar coordinates */
  newNote: { x: 12, y: 60, w: 208, h: 36 },
} as const;

function Item({ icon, label, active = false, count, color }: { icon?: IconName; label: string; active?: boolean; count?: number; color?: string }) {
  return (
    <div
      style={{
        height: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 10px',
        borderRadius: 8,
        background: active ? '#FFFFFF0D' : 'transparent',
        boxShadow: active ? `inset 0 0 0 1px ${C.line}` : undefined,
        color: active ? C.text : C.dim,
        fontSize: 13.5,
        fontWeight: active ? 600 : 500,
      }}
    >
      {color ? <span style={{ width: 16, display: 'grid', placeItems: 'center' }}><Swatch color={color} size={9} /></span> : icon ? <Icon name={icon} size={16} color={active ? C.text : C.faint} /> : null}
      <span style={{ flex: 1 }}>{label}</span>
      {count ? <span style={{ fontSize: 11.5, fontWeight: 600, color: C.faint }}>{count}</span> : null}
    </div>
  );
}

export function Sidebar({ height, width = SIDEBAR.width, active = 'all', press = 0, hover = 0 }: { height: number; width?: number; active?: string; press?: number; hover?: number }) {
  const b = SIDEBAR.newNote;
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        flex: 'none',
        background: C.sidebar,
        borderRight: `1px solid ${C.line}`,
        fontFamily: FONT.ui,
        fontFeatureSettings: FEATURES,
        letterSpacing: '-0.01em',
      }}
    >
      {/* workspace */}
      <div style={{ position: 'absolute', left: 14, right: 12, top: 14, height: 34, display: 'flex', alignItems: 'center', gap: 10 }}>
        <LumenMark size={24} />
        <span style={{ fontSize: 14.5, fontWeight: 600, color: C.text }}>{WORKSPACE}</span>
        <Icon name="chevronDown" size={14} color={C.faint} />
        <span style={{ flex: 1 }} />
        <Icon name="sidebar" size={16} color={C.faint} />
      </div>
      {/* new note */}
      <div
        style={{
          position: 'absolute',
          left: b.x,
          top: b.y,
          width: b.w,
          height: b.h,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 10px',
          borderRadius: R.md,
          background: hover > 0 ? `rgba(255,255,255,${0.05 + hover * 0.04})` : '#FFFFFF0A',
          boxShadow: `inset 0 0 0 1px ${hover > 0 ? alpha(C.accent, 0.25 * hover) : C.line}, inset 0 1px 0 #FFFFFF0A`,
          transform: `scale(${1 - press * 0.035})`,
          color: C.text,
          fontSize: 13.5,
          fontWeight: 600,
        }}
      >
        <Icon name="compose" size={16} color={C.accent} />
        <span style={{ flex: 1 }}>New note</span>
        <Kbd>N</Kbd>
      </div>
      {/* search */}
      <div style={{ position: 'absolute', left: 12, right: 12, top: 104, height: 32, display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', color: C.dim, fontSize: 13.5, fontWeight: 500 }}>
        <Icon name="search" size={16} color={C.faint} />
        <span style={{ flex: 1 }}>Search</span>
        <span style={{ display: 'flex', gap: 3 }}>
          <Kbd icon="cmd" />
          <Kbd>K</Kbd>
        </span>
      </div>
      {/* navigation */}
      <div style={{ position: 'absolute', left: 12, right: 12, top: 146, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Item icon="inbox" label="Inbox" count={3} active={active === 'inbox'} />
        <Item icon="note" label="All notes" active={active === 'all'} />
        <Item icon="users" label="Shared with me" active={active === 'shared'} />
        <Item icon="star" label="Favorites" active={active === 'favorites'} />
      </div>
      <div style={{ position: 'absolute', left: 22, top: 300, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.faint }}>Spaces</div>
      <div style={{ position: 'absolute', left: 12, right: 12, top: 322, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {SPACES.map((s) => (
          <Item key={s.id} label={s.name} color={s.color} active={active === s.id} />
        ))}
      </div>
      {/* you */}
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 14, height: 36, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 500, color: C.dim }}>
        <Avatar who="you" size={26} ring={C.sidebar} />
        <span style={{ flex: 1, color: C.text }}>Alex Rivera</span>
        <Icon name="sliders" size={16} color={C.faint} />
      </div>
    </div>
  );
}
