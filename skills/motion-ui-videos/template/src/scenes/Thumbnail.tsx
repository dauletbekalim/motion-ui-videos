/**
 * A YouTube thumbnail for the showcase, 1280×720. Three words you can read
 * at 200 px wide, the product at an angle, and nothing that matters in the
 * bottom-right corner (the player draws the video length there; --safe marks it).
 */
import { AbsoluteFill } from 'remotion';
import { Browser, BROWSER_BAR } from '../lib/devices';
import { KineticTitle } from '../lib/text';
import { Backdrop, Cursor, SafeZones } from '../lib/ui';
import { LumenApp, LumenMark, NOTES, PEOPLE, Wordmark } from '../product';
import { BRAND, C, FEATURES, FONT } from '../theme';
import { launchBlocks } from './common';

export function Thumbnail({ safe = false }: { safe?: boolean }) {
  const bw = 1000;
  const bh = 640;
  const s = 0.72;
  return (
    <AbsoluteFill>
      <Backdrop glow={1} x={70} y={40} grid />
      <div style={{ position: 'absolute', left: 690, top: 118, width: bw, height: bh, perspective: 1400 }}>
        <div style={{ transform: 'rotateY(-18deg) rotateX(6deg) rotateZ(1deg)', transformOrigin: '0% 50%' }}>
          <Browser url={`app.${BRAND.url}`} width={bw} height={bh}>
            <LumenApp
              width={bw}
              height={bh - BROWSER_BAR}
              scale={s}
              items={NOTES.map((n) => ({ note: n }))}
              selected="launch"
              editor={{ title: 'Q3 launch plan', spaceId: 'launch', edited: 'Edited just now', presence: ['you', 'maya', 'theo'], blocks: launchBlocks({ more: true, done: [1, 0, 0] }) }}
            />
          </Browser>
          <Cursor label="Maya" color={PEOPLE.maya.color} path={[{ t: -1, x: 470, y: 390 }]} scale={1.3} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 64, top: 60, display: 'flex', alignItems: 'center', gap: 14 }}>
        <LumenMark size={52} />
        <Wordmark size={44} />
      </div>
      <div style={{ position: 'absolute', left: 60, top: 170, textShadow: `0 8px 40px ${C.bg}` }}>
        <KineticTitle text="Team notes, | finally | *calm.*" start={-1} size={112} align="left" />
      </div>
      <div style={{ position: 'absolute', left: 66, top: 560, fontFamily: FONT.ui, fontFeatureSettings: FEATURES, fontSize: 30, fontWeight: 500, color: C.dim, letterSpacing: '-0.02em' }}>A quick product tour</div>
      {safe ? (
        <>
          <SafeZones />
          <div style={{ position: 'absolute', right: 8, bottom: 8, width: 110, height: 44, border: '2px dashed rgba(255,120,120,0.9)', background: 'rgba(255,60,60,0.25)', display: 'grid', placeItems: 'center', fontFamily: FONT.mono, fontSize: 14, color: '#FFD0D0' }}>length</div>
        </>
      ) : null}
    </AbsoluteFill>
  );
}
