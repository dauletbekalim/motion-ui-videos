// sound/promo-sounds.mjs: the promo's "send sounds you like" moment, as real
// sound. A stand-in for a whoosh a user might send (synthesized here, so the
// repo ships no stock audio), measured and grown into three variants with
// sound/tools/grow.mjs, exactly as the skill does with a real reference.
// The same sounds are drawn (scripts/promo-spectra.mjs → src/promo/spectra.json)
// and played (sound/score.mjs, scene pSounds), so what you see is what you hear.
import { SR, whoosh } from './engine.mjs';
import { measure, grow } from './tools/grow.mjs';

/** The stand-in reference: a low body sweeping up, and air on top arriving a little late, wider. */
export function referenceWhoosh() {
  const body = whoosh({ dur: 0.95, f0: 200, f1: 1250, peak: 0.58, q: 0.7, seed: 41 });
  const airL = whoosh({ dur: 0.78, f0: 800, f1: 2300, peak: 0.66, q: 1.1, seed: 42 });
  const airR = whoosh({ dur: 0.78, f0: 800, f1: 2300, peak: 0.66, q: 1.1, seed: 43 });
  const n = body.length;
  const off = Math.round(0.12 * SR);
  const l = new Float32Array(n), r = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const j = i - off;
    const al = j >= 0 && j < airL.length ? airL[j] * 0.5 : 0;
    const ar = j >= 0 && j < airR.length ? airR[j] * 0.5 : 0;
    l[i] = body[i] + al;
    r[i] = body[i] + ar;
  }
  return { l, r, bus: 'whoosh', room: 0.15, kind: 'reference whoosh (stand-in)', peakAt: 0.58 * 0.95 };
}

/** Three variants grown from it: stretched, pitched, bent. The labels are what the screen says. */
export const VARIANTS = [
  { dur: 0.55, pitch: 1.3, bend: [1.06, 0.94], seed: 11, label: '0.55 s · higher' },
  { dur: 0.9, pitch: 0.8, bend: [0.96, 1.04], seed: 12, label: '0.90 s · lower' },
  { dur: 0.38, pitch: 1.6, bend: [1.08, 0.93], seed: 13, label: '0.38 s · quicker' },
];

let cache = null;
/** The reference, its measured profile, and the three grown variants (computed once). */
export function promoSounds() {
  if (!cache) {
    const ref = referenceWhoosh();
    const profile = measure(ref);
    const variants = VARIANTS.map((v) => grow(profile, { dur: v.dur, pitch: v.pitch, bend: v.bend, seed: v.seed }));
    cache = { ref, profile, variants };
  }
  return cache;
}
