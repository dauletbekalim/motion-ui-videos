#!/usr/bin/env node
/**
 * Draws the promo's reference whoosh and its three grown variants as data:
 * energy per band over time, measured with sound/tools/grow.mjs's own
 * analysis, written to src/promo/spectra.json for the pSounds scene. Run it
 * again after changing sound/promo-sounds.mjs.
 *
 *   node scripts/promo-spectra.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SR } from '../sound/engine.mjs';
import { measure } from '../sound/tools/grow.mjs';
import { promoSounds, VARIANTS } from '../sound/promo-sounds.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { ref, variants } = promoSounds();
const LOW = 9;
const HIGH = 57;
const FLOOR = -40;
// a little contrast, so the shape reads rather than a wall of orange
const GAMMA = 1.35;
const COLS_PER_SEC = 104;

const sounds = [
  { name: 'whoosh.wav', label: 'reference', s: ref },
  ...variants.map((s, i) => ({ name: `variant ${i + 1}`, label: VARIANTS[i].label, s })),
];
const measured = sounds.map((x) => ({ ...x, m: measure(x.s) }));
let top = 0;
for (const { m } of measured) for (const f of m.mid) for (let b = LOW; b <= HIGH; b++) top = Math.max(top, f[b]);
const out = measured.map(({ name, label, s, m }) => {
  const dur = s.l.length / SR;
  const cols = Math.max(8, Math.round(dur * COLS_PER_SEC));
  const data = [];
  for (let c = 0; c < cols; c++) {
    const a = Math.floor((c / cols) * m.mid.length);
    const z = Math.max(a + 1, Math.floor(((c + 1) / cols) * m.mid.length));
    const col = [];
    for (let b = LOW; b <= HIGH; b++) {
      let e = 0;
      for (let h = a; h < z; h++) e += m.mid[h][b] + 0.5 * m.side[h][b];
      e /= z - a;
      const db = 10 * Math.log10(e / top + 1e-30);
      col.push(Math.round(Math.max(0, Math.min(1, (db - FLOOR) / -FLOOR)) ** GAMMA * 100) / 100);
    }
    data.push(col);
  }
  return { name, label, dur: Math.round(dur * 1000) / 1000, peak: Math.round((s.peakAt ?? dur / 2) * 1000) / 1000, data };
});
const file = path.join(root, 'src', 'promo', 'spectra.json');
fs.writeFileSync(file, `${JSON.stringify(out)}\n`);
console.log(`${path.relative(root, file)}: ${out.map((o) => `${o.name} ${o.dur.toFixed(2)} s ${o.data.length}×${o.data[0].length}`).join(' · ')} (${(fs.statSync(file).size / 1024).toFixed(0)} KB)`);
