/**
 * The "before": what a team's knowledge looks like without the product.
 * Chat messages, doc files, stickies, emails, wiki pages: small cards the
 * hook scatters and the problem scene sorts into five different apps.
 * Specific, slightly messy text ("(final) (2)") sells the problem.
 */
import type { CSSProperties } from 'react';
import { clamp } from '../lib/anim';
import { alpha, C, FEATURES, FONT } from '../theme';
import { Avatar, Checkbox } from './atoms';
import { PEOPLE, type PersonId } from './data';
import { Icon, type IconName } from './icons';

export type AppId = 'chat' | 'docs' | 'mail' | 'wiki' | 'stickies';
export type Frag = { kind: 'chat' | 'doc' | 'sticky' | 'mail' | 'wiki' | 'image' | 'todo' | 'voice'; text: string; sub?: string; who?: PersonId; app: AppId };

export const APPS: { id: AppId; name: string; icon: IconName; color: string }[] = [
  { id: 'chat', name: 'Chat', icon: 'chat', color: '#B996FF' },
  { id: 'docs', name: 'Docs', icon: 'note', color: '#7AA2FF' },
  { id: 'mail', name: 'Email', icon: 'mail', color: '#FF7D98' },
  { id: 'wiki', name: 'Wiki', icon: 'book', color: '#7BDB9C' },
  { id: 'stickies', name: 'Stickies', icon: 'sticky', color: '#F2D27A' },
];
export const app = (id: AppId) => APPS.find((a) => a.id === id) ?? APPS[0];

export const FRAGMENTS: Frag[] = [
  { kind: 'chat', who: 'theo', text: 'where’s the launch doc??', app: 'chat' },
  { kind: 'doc', text: 'Q3 plan (final) (2).docx', sub: 'Edited 3 weeks ago', app: 'docs' },
  { kind: 'sticky', text: 'ask Maya about pricing!!', app: 'stickies' },
  { kind: 'mail', text: 'Fwd: Fwd: notes from Tuesday', sub: 'Maya · Tue', app: 'mail' },
  { kind: 'wiki', text: 'Onboarding (outdated)', sub: 'Wiki · 2023', app: 'wiki' },
  { kind: 'chat', who: 'maya', text: 'I think Sam has the latest?', app: 'chat' },
  { kind: 'image', text: 'whiteboard-photo.jpg', app: 'docs' },
  { kind: 'todo', text: 'send deck to partners', app: 'stickies' },
  { kind: 'voice', text: 'Voice memo', sub: '0:42', app: 'mail' },
  { kind: 'doc', text: 'Pricing v3 FINAL', sub: 'Edited yesterday', app: 'docs' },
  { kind: 'chat', who: 'sam', text: 'pinned it somewhere, one sec', app: 'chat' },
  { kind: 'mail', text: 'Re: launch date?', sub: 'Priya · Mon', app: 'mail' },
  { kind: 'wiki', text: 'Launch process', sub: 'Wiki · 2022', app: 'wiki' },
  { kind: 'sticky', text: 'beta list: ask Ines', app: 'stickies' },
  { kind: 'todo', text: 'update the roadmap', app: 'wiki' },
  { kind: 'chat', who: 'ines', text: 'which doc is the real one', app: 'chat' },
];

const card: CSSProperties = {
  background: 'linear-gradient(180deg, #1B1B22, #15151B)',
  borderRadius: 14,
  boxShadow: `inset 0 0 0 1px ${C.line}, inset 0 1px 0 #FFFFFF0A, 0 18px 40px -18px rgba(0,0,0,0.9)`,
  fontFamily: FONT.ui,
  fontFeatureSettings: FEATURES,
  letterSpacing: '-0.01em',
};

function Tile({ icon, color, size = 30 }: { icon: IconName; color: string; size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: size * 0.28, flex: 'none', display: 'grid', placeItems: 'center', background: alpha(color, 0.14), boxShadow: `inset 0 0 0 1px ${alpha(color, 0.24)}` }}>
      <Icon name={icon} size={size * 0.55} color={color} />
    </span>
  );
}

/** One scattered piece of knowledge, as a card. */
export function Fragment({ f, style }: { f: Frag; style?: CSSProperties }) {
  if (f.kind === 'sticky') {
    return (
      <div style={{ width: 170, minHeight: 130, padding: '16px 16px', borderRadius: 6, background: 'linear-gradient(170deg, #F6E3A1, #EACF78)', boxShadow: '0 18px 40px -16px rgba(0,0,0,0.9)', fontFamily: FONT.ui, fontWeight: 600, fontSize: 17, lineHeight: 1.3, color: '#3B3217', letterSpacing: '-0.01em', ...style }}>
        {f.text}
      </div>
    );
  }
  if (f.kind === 'chat') {
    return (
      <div style={{ ...card, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start', maxWidth: 300, ...style }}>
        <Avatar who={f.who ?? 'maya'} size={28} ring="transparent" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>
            {PEOPLE[f.who ?? 'maya'].first} <span style={{ color: C.faint, fontWeight: 500 }}>· 4:12 PM</span>
          </span>
          <span style={{ fontSize: 15, color: '#D4D4DC', whiteSpace: 'nowrap' }}>{f.text}</span>
        </div>
      </div>
    );
  }
  if (f.kind === 'image') {
    return (
      <div style={{ ...card, padding: 8, width: 200, ...style }}>
        <div style={{ height: 104, borderRadius: 8, background: 'linear-gradient(135deg, #3A3A44, #26262E)', position: 'relative', overflow: 'hidden' }}>
          {[18, 36, 54, 72].map((y, i) => (
            <div key={y} style={{ position: 'absolute', left: 16 + (i % 2) * 20, top: y, width: 90 + ((i * 37) % 60), height: 5, borderRadius: 3, background: i === 1 ? alpha('#7AA2FF', 0.7) : '#FFFFFF33' }} />
          ))}
        </div>
        <div style={{ padding: '8px 4px 2px', fontSize: 12.5, color: C.dim, fontWeight: 500 }}>{f.text}</div>
      </div>
    );
  }
  if (f.kind === 'todo') {
    return (
      <div style={{ ...card, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center', ...style }}>
        <Checkbox size={17} />
        <span style={{ fontSize: 15, color: '#D4D4DC', whiteSpace: 'nowrap' }}>{f.text}</span>
      </div>
    );
  }
  if (f.kind === 'voice') {
    return (
      <div style={{ ...card, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center', ...style }}>
        <Tile icon="mic" color="#FF7D98" size={30} />
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 26 }}>
          {Array.from({ length: 18 }, (_, i) => (
            <span key={i} style={{ width: 3, borderRadius: 2, height: 6 + ((i * 7) % 11) * 1.8, background: '#FFFFFF55' }} />
          ))}
        </div>
        <span style={{ fontSize: 13, color: C.faint, fontWeight: 500 }}>{f.sub}</span>
      </div>
    );
  }
  const a = app(f.app);
  const icon: IconName = f.kind === 'mail' ? 'mail' : f.kind === 'wiki' ? 'book' : 'note';
  return (
    <div style={{ ...card, padding: '11px 14px 11px 11px', display: 'flex', gap: 11, alignItems: 'center', ...style }}>
      <Tile icon={icon} color={a.color} size={34} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>{f.text}</span>
        {f.sub ? <span style={{ fontSize: 12, color: C.faint, fontWeight: 500 }}>{f.sub}</span> : null}
      </div>
    </div>
  );
}

/**
 * An app window's geometry (design px): its header, its padding, and rows
 * tall enough for two lines, so a narrow window wraps a long message instead
 * of cutting it off with an ellipsis. A scene aims a fragment at row i with
 * `APPWIN.header + APPWIN.pad + i * (APPWIN.row + APPWIN.gap)`.
 */
export const APPWIN = { header: 52, pad: 10, row: 58, gap: 6 } as const;

/** How tall an app window is with room for `rows` rows. */
export const appWindowHeight = (rows: number) => APPWIN.header + 2 * APPWIN.pad + rows * APPWIN.row + (rows - 1) * APPWIN.gap;

/** A fragment as a compact row inside an app window: up to two lines. */
export function FragmentRow({ f }: { f: Frag }) {
  const a = app(f.app);
  return (
    <div style={{ height: APPWIN.row, display: 'flex', alignItems: 'center', gap: 9, padding: '0 10px', borderRadius: 9, background: '#FFFFFF06', boxShadow: `inset 0 0 0 1px ${C.line}` }}>
      {f.kind === 'chat' ? <Avatar who={f.who ?? 'maya'} size={20} ring="transparent" /> : <Icon name={f.kind === 'sticky' || f.kind === 'todo' ? 'sticky' : a.icon} size={16} color={a.color} />}
      <span style={{ fontSize: 13, lineHeight: '17px', color: '#CFCFD8', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{f.text}</span>
    </div>
  );
}

/**
 * One of the five apps knowledge gets lost in: a small window with its rows.
 * `miss` 0 → 1 marks it "no results" for the search. About 200 px wide is
 * enough (scale it up to be read); height from appWindowHeight(rows).
 */
export function AppWindow({ id, rows, width = 300, height = 360, miss = 0 }: { id: AppId; rows: { f: Frag; k: number }[]; width?: number; height?: number; miss?: number }) {
  const a = app(id);
  return (
    <div style={{ ...card, width, height, overflow: 'hidden', position: 'relative', boxShadow: `inset 0 0 0 1px ${miss > 0 ? alpha(C.danger, 0.35 * miss) : C.line}, 0 30px 60px -30px rgba(0,0,0,0.9)` }}>
      <div style={{ height: APPWIN.header, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', borderBottom: `1px solid ${C.line}` }}>
        <Tile icon={a.icon} color={a.color} size={28} />
        <span style={{ fontSize: 15, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>{a.name}</span>
        <span style={{ flex: 1 }} />
        {miss > 0.01 ? (
          <span style={{ fontSize: 12.5, fontWeight: 600, color: C.danger, whiteSpace: 'nowrap', opacity: clamp(miss * 2), transform: `translateY(${(1 - miss) * 6}px)` }}>No results</span>
        ) : null}
      </div>
      <div style={{ padding: APPWIN.pad, display: 'flex', flexDirection: 'column', gap: APPWIN.gap, opacity: 1 - miss * 0.45 }}>
        {rows.map(({ f, k }) =>
          k > 0.001 ? (
            <div key={f.text} style={{ opacity: clamp(k * 2), transform: `translateY(${(1 - k) * -10}px) scale(${0.96 + 0.04 * k})` }}>
              <FragmentRow f={f} />
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
