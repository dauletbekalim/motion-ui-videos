/**
 * Lumen's logo, rebuilt as geometry so it can animate: a warm tile with a
 * sun rising over a horizon. `rise` 0 → 1 lifts the sun into place.
 *
 * For a real brand, use the official vector (see references/brand-and-assets.md):
 * crop its viewBox to the artwork, and rebuild geometric parts like this only
 * when you need them to move.
 */
import { useId } from 'react';
import { alpha, C, FONT } from '../theme';

export function LumenMark({ size = 64, rise = 1, glow = 0 }: { size?: number; rise?: number; glow?: number }) {
  const id = useId().replace(/:/g, '');
  const sunY = 40 + (1 - rise) * 17;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      {glow > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: -size * 0.9,
            background: `radial-gradient(closest-side, ${alpha(C.accent, 0.38 * glow)}, ${alpha(C.accent2, 0.12 * glow)} 55%, transparent)`,
          }}
        />
      ) : null}
      <svg viewBox="0 0 64 64" width={size} height={size} style={{ position: 'relative', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFC766" />
            <stop offset="1" stopColor={C.accent2} />
          </linearGradient>
          <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
            <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`c${id}`}>
            <rect x="0" y="0" width="64" height="40" />
          </clipPath>
        </defs>
        <rect x="0" y="0" width="64" height="64" rx="18" fill={`url(#g${id})`} />
        <rect x="0" y="0" width="64" height="64" rx="18" fill={`url(#s${id})`} />
        <rect x="0.5" y="0.5" width="63" height="63" rx="17.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.25" />
        <g clipPath={`url(#c${id})`}>
          <circle cx="32" cy={sunY} r="12.5" fill="#FFFDF8" />
        </g>
        <rect x="13" y="42.5" width="38" height="4.5" rx="2.25" fill="#FFFDF8" />
      </svg>
    </div>
  );
}

export function Wordmark({ size = 48, color = C.text }: { size?: number; color?: string }) {
  return <span style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: size, letterSpacing: '-0.045em', color, lineHeight: 1 }}>Lumen</span>;
}

/** Mark and name side by side, as the product's header shows them. */
export function Logo({ size = 40, rise = 1 }: { size?: number; rise?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.32 }}>
      <LumenMark size={size} rise={rise} />
      <Wordmark size={size * 0.82} />
    </span>
  );
}
