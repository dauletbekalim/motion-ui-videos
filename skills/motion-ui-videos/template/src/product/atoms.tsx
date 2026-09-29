/**
 * The product's smallest parts: avatars, keycaps, checkboxes, buttons and the
 * coloured caret a teammate types with. Every state is a number the scene
 * passes in (0 → 1), so the scene owns the timing and these stay pure.
 */
import type { CSSProperties, ReactNode } from 'react';
import { clamp, lerp } from '../lib/anim';
import { alpha, C, FONT, GRADIENT } from '../theme';
import { PEOPLE, type PersonId } from './data';
import { Icon, type IconName } from './icons';

export function Avatar({ who, size = 24, ring = C.app, style }: { who: PersonId; size?: number; ring?: string; style?: CSSProperties }) {
  const p = PEOPLE[who];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flex: 'none',
        display: 'grid',
        placeItems: 'center',
        background: `linear-gradient(145deg, ${p.color}, ${alpha(p.color, 0.72)})`,
        boxShadow: `0 0 0 ${Math.max(1.5, size * 0.08)}px ${ring}`,
        color: 'rgba(8,8,12,0.82)',
        fontFamily: FONT.ui,
        fontWeight: 700,
        fontSize: size * 0.4,
        letterSpacing: '-0.02em',
        ...style,
      }}
    >
      {p.initials}
    </div>
  );
}

/** Overlapping avatars. `pops` (0 → 1 each) lets people arrive one by one. */
export function AvatarStack({ people, size = 24, pops, ring = C.app, live = false, overlap = 0.2 }: { people: PersonId[]; size?: number; pops?: number[]; ring?: string; live?: boolean; overlap?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {people.map((who, i) => {
        const k = pops ? (pops[i] ?? 1) : 1;
        if (k <= 0.001) return null;
        return (
          <div key={who} style={{ position: 'relative', marginLeft: i === 0 ? 0 : -size * overlap * clamp(k * 1.4), transform: `scale(${k})`, opacity: clamp(k * 2), zIndex: people.length - i }}>
            <Avatar who={who} size={size} ring={ring} />
            {live ? (
              <div style={{ position: 'absolute', right: -1, bottom: -1, width: size * 0.26, height: size * 0.26, borderRadius: '50%', background: C.ok, boxShadow: `0 0 0 ${Math.max(1.5, size * 0.07)}px ${ring}` }} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** A keycap. Pass an icon name for symbols (⌘, ↵) so they never fall back to another font. */
export function Kbd({ children, icon, size = 11, style }: { children?: ReactNode; icon?: IconName; size?: number; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: size * 0.2,
        minWidth: size * 1.75,
        height: size * 1.75,
        padding: `0 ${size * 0.4}px`,
        borderRadius: size * 0.42,
        background: '#FFFFFF0D',
        boxShadow: `inset 0 0 0 1px ${C.line}, inset 0 -1px 0 #FFFFFF08`,
        color: C.dim,
        fontFamily: FONT.ui,
        fontSize: size,
        fontWeight: 500,
        lineHeight: 1,
        ...style,
      }}
    >
      {icon ? <Icon name={icon} size={size * 1.05} stroke={2} /> : null}
      {children}
    </span>
  );
}

/** A to-do checkbox. `done` 0 → 1 fills it and draws the tick. */
export function Checkbox({ done = 0, size = 18, color = C.accent }: { done?: number; size?: number; color?: string }) {
  const k = clamp(done);
  return (
    <div
      style={{
        width: size,
        height: size,
        flex: 'none',
        borderRadius: size * 0.3,
        boxShadow: `inset 0 0 0 1.5px ${k > 0.01 ? color : '#FFFFFF33'}`,
        background: k > 0.01 ? alpha(color, k) : 'transparent',
        display: 'grid',
        placeItems: 'center',
        transform: `scale(${1 + Math.sin(Math.PI * k) * 0.12})`,
      }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.78} height={size * 0.78} fill="none" stroke={C.bg} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp(k * 1.3 - 0.3)} />
      </svg>
    </div>
  );
}

/** A teammate's caret with their name flag, as it sits at the end of what they are typing. */
export function RemoteCaret({ who, size = 15, show = 1 }: { who: PersonId; size?: number; show?: number }) {
  const p = PEOPLE[who];
  if (show <= 0.001) return null;
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 0, height: '1em', verticalAlign: '-0.12em', opacity: clamp(show * 2) }}>
      <span style={{ position: 'absolute', left: 1, top: '-0.18em', width: 2, height: '1.36em', borderRadius: 1, background: p.color }} />
      <span
        style={{
          position: 'absolute',
          left: 1,
          bottom: '1.12em',
          transform: `translateY(${(1 - show) * 6}px)`,
          background: p.color,
          color: 'rgba(8,8,12,0.88)',
          fontFamily: FONT.ui,
          fontSize: size * 0.72,
          fontWeight: 700,
          lineHeight: `${size * 1.25}px`,
          padding: `0 ${size * 0.4}px`,
          borderRadius: `${size * 0.3}px ${size * 0.3}px ${size * 0.3}px 2px`,
          whiteSpace: 'nowrap',
          letterSpacing: '-0.01em',
        }}
      >
        {p.first}
      </span>
    </span>
  );
}

export function Button({ children, icon, primary = false, press = 0, size = 13, style }: { children: ReactNode; icon?: IconName; primary?: boolean; press?: number; size?: number; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.5,
        height: size * 2.35,
        padding: `0 ${size * 0.95}px`,
        borderRadius: size * 0.62,
        fontFamily: FONT.ui,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
        color: primary ? '#1A0F05' : C.text,
        background: primary ? GRADIENT : '#FFFFFF0B',
        boxShadow: primary ? `inset 0 1px 0 #FFFFFF55, 0 6px 20px -8px ${alpha(C.accent2, 0.8)}` : `inset 0 0 0 1px ${C.line}`,
        transform: `scale(${lerp(1, 0.94, clamp(press))})`,
        filter: press > 0 ? `brightness(${1 + press * 0.15})` : undefined,
        ...style,
      }}
    >
      {icon ? <Icon name={icon} size={size * 1.15} stroke={2} /> : null}
      {children}
    </span>
  );
}

/** A small coloured square: a space's colour in lists and chips. */
export function Swatch({ color, size = 8 }: { color: string; size?: number }) {
  return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: size * 0.3, background: color, flex: 'none' }} />;
}

/** A button's momentary press around a click time: 0 → 1 → 0 in about 0.2 s. */
export function press(t: number, at: number): number {
  const x = (t - at + 0.05) / 0.22;
  return x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x);
}
