/**
 * The reel's cover, a still. 1080×1920, but the profile grid shows only the
 * centred 1080×1440 (y 240–1680), so everything that matters sits inside it:
 * the promise in big type, the product in a phone, the name.
 * Check it with `node scripts/stills.mjs cover --safe` (draws the 3:4 crop).
 */
import { AbsoluteFill } from 'remotion';
import { Phone } from '../lib/devices';
import { KineticTitle } from '../lib/text';
import { Backdrop, SafeZones } from '../lib/ui';
import { AvatarStack, CommandPalette, LumenMark, NoteList, NOTES, Wordmark } from '../product';
import { C } from '../theme';
import { PALETTE_LAUNCH } from './common';

const PHONE_W = 380;

export function Cover({ safe = false }: { safe?: boolean }) {
  const inner = PHONE_W - 2 * Math.max(8, PHONE_W * 0.028);
  const scale = inner / 330;
  return (
    <AbsoluteFill>
      <Backdrop glow={0.9} y={55} grid />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 290, display: 'flex', justifyContent: 'center', gap: 16, alignItems: 'center' }}>
        <LumenMark size={64} />
        <Wordmark size={54} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 400, display: 'flex', justifyContent: 'center' }}>
        <KineticTitle text="Your team’s notes, | finally in | *one place.*" start={-1} size={108} />
      </div>
      <div style={{ position: 'absolute', left: (1080 - PHONE_W) / 2, top: 790 }}>
        <Phone width={PHONE_W}>
          <div style={{ width: 330, height: 1000, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
            <NoteList width={330} height={1000} items={NOTES.map((n) => ({ note: n }))} selected="launch" />
          </div>
        </Phone>
      </div>
      {/* the palette floating over the phone, the product's signature move */}
      <div style={{ position: 'absolute', left: 110, top: 1092, width: 560, transform: 'scale(1.5) rotate(-3deg)', transformOrigin: '0 0' }}>
        <CommandPalette width={560} query="launch" match="launch" items={PALETTE_LAUNCH.slice(0, 2)} />
      </div>
      <div style={{ position: 'absolute', right: 120, top: 900, padding: '12px 16px', borderRadius: 999, background: '#1D1D25', boxShadow: `inset 0 0 0 1px ${C.lineStrong}, 0 20px 50px -20px rgba(0,0,0,0.9)`, transform: 'rotate(4deg)' }}>
        <AvatarStack people={['maya', 'theo', 'ines', 'sam']} size={52} ring="#1D1D25" live overlap={-0.08} />
      </div>
      {safe ? <SafeZones margins={false} /> : null}
    </AbsoluteFill>
  );
}
