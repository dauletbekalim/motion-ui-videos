/**
 * Frames around product UI: a browser, a desktop window, a phone. Plain
 * shapes in theme colours (no real device artwork, which is trademarked and
 * dates a video fast). `width`/`height` are the outer size in stage px; the
 * children fill the content area below the chrome.
 */
import type { ReactNode } from 'react';
import { alpha, C, FEATURES, FONT, SHADOW } from '../theme';

const DOTS = (
  <div style={{ display: 'flex', gap: 8 }}>
    {[0, 1, 2].map((i) => (
      <span key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFFFFF1C', boxShadow: 'inset 0 0 0 1px #FFFFFF10' }} />
    ))}
  </div>
);

export const BROWSER_BAR = 46;
export const WINDOW_BAR = 40;

export function Browser({ url, width, height, children }: { url: string; width: number; height: number; children: ReactNode }) {
  return (
    <div style={{ width, height, borderRadius: 16, overflow: 'hidden', background: C.app, boxShadow: SHADOW.window, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: BROWSER_BAR, flex: 'none', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 18, background: '#0C0C10', borderBottom: `1px solid ${C.line}` }}>
        {DOTS}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: Math.min(460, width * 0.4),
              height: 28,
              borderRadius: 8,
              background: '#FFFFFF0A',
              boxShadow: `inset 0 0 0 1px ${C.line}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontFamily: FONT.ui,
              fontFeatureSettings: FEATURES,
              fontSize: 13,
              fontWeight: 500,
              color: C.dim,
            }}
          >
            <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke={C.faint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
              <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
            </svg>
            {url}
          </div>
        </div>
        <div style={{ width: 52 }} />
      </div>
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

export function Window({ title, width, height, children }: { title: string; width: number; height: number; children: ReactNode }) {
  return (
    <div style={{ width, height, borderRadius: 14, overflow: 'hidden', background: C.app, boxShadow: SHADOW.window, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', height: WINDOW_BAR, flex: 'none', display: 'flex', alignItems: 'center', padding: '0 16px', background: '#0C0C10', borderBottom: `1px solid ${C.line}` }}>
        {DOTS}
        <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: FONT.ui, fontFeatureSettings: FEATURES, fontSize: 13, fontWeight: 600, color: C.dim, letterSpacing: '-0.01em' }}>{title}</div>
      </div>
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

/** A generic phone: rounded body, thin bezel, a camera pill, a status bar. Height follows the width (19.5:9). */
export function Phone({ width, children, time = '10:08' }: { width: number; children: ReactNode; time?: string }) {
  const height = width * 2.1667;
  const bezel = Math.max(8, width * 0.028);
  const r = width * 0.15;
  const bar = width * 0.12;
  return (
    <div style={{ position: 'relative', width, height, borderRadius: r, padding: bezel, background: 'linear-gradient(160deg, #2A2A31, #121216 40%, #1C1C22)', boxShadow: `inset 0 0 0 1.5px #FFFFFF1A, 0 60px 140px -40px rgba(0,0,0,0.95)` }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: r - bezel, overflow: 'hidden', background: C.app }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: bar, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${width * 0.09}px`, fontFamily: FONT.ui, fontFeatureSettings: FEATURES, fontSize: width * 0.04, fontWeight: 600, color: C.text, zIndex: 2 }}>
          <span>{time}</span>
          <span style={{ display: 'flex', gap: width * 0.012, alignItems: 'flex-end' }}>
            {[0.35, 0.55, 0.75, 1].map((h, i) => (
              <span key={i} style={{ width: width * 0.012, height: width * 0.03 * h, borderRadius: 1, background: C.text }} />
            ))}
            <span style={{ marginLeft: width * 0.015, width: width * 0.06, height: width * 0.028, borderRadius: width * 0.008, boxShadow: `inset 0 0 0 1.5px ${alpha(C.text, 0.6)}`, padding: 2 }}>
              <span style={{ display: 'block', width: '70%', height: '100%', borderRadius: 2, background: C.text }} />
            </span>
          </span>
        </div>
        <div style={{ position: 'absolute', left: '50%', top: width * 0.03, width: width * 0.28, height: width * 0.075, transform: 'translateX(-50%)', borderRadius: 999, background: '#000', zIndex: 3 }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: bar, bottom: 0 }}>{children}</div>
      </div>
    </div>
  );
}
