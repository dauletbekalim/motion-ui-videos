// sound/design.mjs: render a cut's soundtrack to public/sound-<cut>.wav, sized
// to the cut, then measure it the way the platforms will.
//
//   node sound/design.mjs showcase          one cut
//   node sound/design.mjs --all             every cut with "sound": true
//   node sound/design.mjs reel -2           2 dB under the cut's fixed gain (a quick "a bit quieter")
//   node sound/design.mjs reel --fit        find the gain that lands on the target, use it, and say what it was
//   node sound/design.mjs reel --cues       also print the cue sheet: every sound placed, by time
//   ONLY=whoosh node sound/design.mjs reel  one layer alone (sfx, whoosh, pad, beat; or a list: pad,beat)
//                                           → public/sound-reel-whoosh.wav, the full mix is left alone
//   CUTS=path/to/cuts.json                  read another cuts file
//   OUT=dir                                 write somewhere other than public/
//
// Loudness works on a fixed master gain per format, never a normaliser: turn
// one sound down and nothing else moves, so every change you hear is the change
// you made. The master soft-clips the very tops of transients and a look-ahead
// limiter holds true peak under -2 dBTP. The report says, in dB and plain
// words, where the cut landed against its target, what the clip and the
// limiter did (a shaved click is fine, a held-down chord is not), how the
// layers sit against each other, and how loud each scene is.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMix, master, writeWav, SR, BUSES, MASTER_BASE, dbToGain } from './engine.mjs';
import { loadCuts, getCut, cutDuration, scenesOf, at } from './timeline.mjs';
import { score } from './score.mjs';
import { meter, fmt } from './tools/loudness.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Where each format should land, integrated LUFS. Feeds and short-form play
// loud and on phones: about -14. A showcase or launch film is calmer and
// quieter, -16 to -18. Players that normalise tend to turn loud uploads down
// rather than quiet ones up, so don't go much below -18. The delivered file's
// true peak must stay under -1 dBTP so the platform's own encode doesn't clip
// it; the WAV is held under -2, because AAC itself adds overshoot (measured on
// this template's reel: +0.1 dB at 256 kbps, +0.7 at 192 and 128 kbps).
//
// Why -17 and not -14 for a showcase: a UI-sound film is sparse. Its big
// moments (a hit, a reveal chord) sit 10-12 dB over its average, so at -14 the
// limiter would flatten every one of them. -17 keeps them standing out, with
// the soft clip and the limiter only shaving the tops of transients.
export const TARGET_LUFS = { showcase: -17, loop: -17, reel: -14, story: -14, square: -14, portrait: -14, appstore: -14 };

// Phone formats roll off a little more in the lows: phone speakers barely play
// the lowest lows, and energy there only eats headroom a louder master needs.
const PHONE = new Set(['reel', 'story', 'portrait', 'appstore', 'square']);

// The fixed master gain (dB, on top of the engine's MASTER_BASE) that takes a
// typical score for each format to its target. Calibrated with --fit on the
// template's demo cuts (showcase and reel). A phone cut aims 3 dB louder than a
// showcase on about the same gain: its beat, fuller pad and a whoosh on every
// cut already fill it. A cut whose score is much busier or sparser gets its
// own in CUT_GAIN_DB.
export const FORMAT_GAIN_DB = { showcase: 0.7, loop: 0.7, reel: 0.1, story: 0.1, square: 0.1, portrait: 0.1, appstore: 0.1 };

// Per-cut gain, when a cut needs its own: `node sound/design.mjs <cut> --fit`
// prints the number to put here. Fixed once set, like everything else. The
// demo's story is sparse (one scene, a handful of cues over a beat).
export const CUT_GAIN_DB = { story: 1.3 };

const CEILING_DB = -2;
const CEILING = dbToGain(CEILING_DB); // ≈ 0.79: one dB of room for the AAC encode, one for the platform's

/** Render one cut and report. `extraDb` is the command line's gain; `fit` finds the gain that hits the target. */
export function design(cut, { extraDb = 0, fit = false, cues = false, only = process.env.ONLY, out = process.env.OUT ? path.resolve(process.env.OUT) : path.join(HERE, '..', 'public') } = {}) {
  const plan = getCut(cut);
  const seconds = cutDuration(cut);
  const target = TARGET_LUFS[plan.format] ?? -14;
  const base = CUT_GAIN_DB[cut] ?? FORMAT_GAIN_DB[plan.format] ?? 0;
  const t0 = Date.now();

  const mix = createMix(seconds, { only, cues });
  const summary = score(cut, mix, (scene, m) => at(cut, scene, m));

  const hp = PHONE.has(plan.format) ? 40 : 30;
  let gainDb = base + extraDb;
  let mastered = master(mix, { gainDb, ceiling: CEILING, hp });
  let m = meter(mastered);
  let whole = m();
  // fitting one layer to the whole mix's target would mean nothing
  if (fit && !mix.only && Number.isFinite(whole.integrated)) {
    // two passes: the limiter holds back a little more as the level rises
    for (let pass = 0; pass < 2; pass++) {
      gainDb += target - whole.integrated;
      mastered = master(mix, { gainDb, ceiling: CEILING, hp });
      m = meter(mastered);
      whole = m();
    }
  }

  const layers = mix.only ? [...mix.only].join('+') : null;
  const file = path.join(out, layers ? `sound-${cut}-${layers}.wav` : `sound-${cut}.wav`);
  writeWav(file, mastered);

  const line = (label, text) => console.log(`  ${label.padEnd(9)} ${text}`);
  console.log(`${cut} · ${plan.format} · ${seconds.toFixed(2)} s · target ${target} LUFS, true peak ≤ ${CEILING_DB} dBTP${layers ? ` · ONLY ${layers}` : ''}`);
  if (!plan.sound) line('note', 'cuts.json has "sound": false for this cut, so the video will not play this file');
  line('placed', summary);
  line('gain', `${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(1)} dB (${CUT_GAIN_DB[cut] != null ? `this cut's own` : `${plan.format} default`} ${base >= 0 ? '+' : ''}${base}${extraDb ? `, ${extraDb >= 0 ? '+' : ''}${extraDb} from the command line` : ''}${fit ? ', fitted' : ''})`);
  line('loudness', `integrated ${fmt(whole.integrated)} LUFS · true peak ${fmt(whole.truePeak)} dBTP · loudest 3 s ${fmt(whole.shortTermMax)} · range ${fmt(whole.range)} LU`);
  if (!layers) {
    const d = whole.integrated - target;
    if (!Number.isFinite(d)) line('target', 'silent: nothing was placed (check the marks in cuts.json)');
    else if (Math.abs(d) <= 1) line('target', `${Math.abs(d).toFixed(1)} dB ${d < 0 ? 'under' : 'over'} ${target}: on target`);
    else line('target', `${Math.abs(d).toFixed(1)} dB ${d < 0 ? 'quieter' : 'louder'} than ${target}: try \`node sound/design.mjs ${cut} ${d < 0 ? '+' : '-'}${Math.abs(d).toFixed(1)}\`, or --fit to find it exactly`);
    if (fit && !mix.only) line('keep it', `put  ${JSON.stringify(cut)}: ${gainDb.toFixed(1)},  in CUT_GAIN_DB in sound/design.mjs so the gain stays fixed from here on`);
  }
  if (whole.truePeak > CEILING_DB + 0.2) line('peak', `true peak ${fmt(whole.truePeak)} dBTP is over ${CEILING_DB}: after AAC it may pass -1, and the platform's encode may clip it`);
  const lim = mastered;
  const parts = [];
  if (lim.transients) parts.push(`shaved ${lim.transients} transient peak${lim.transients > 1 ? 's' : ''} (clicks, keys, pops) by up to ${(-lim.transientDb).toFixed(1)} dB`);
  if (lim.sustainedDb < -0.5) parts.push(`held longer sounds down ${(-lim.sustainedDb).toFixed(1)} dB at most (at ${lim.sustainedAt.toFixed(2)} s), over 1 dB for ${lim.sustainedSec.toFixed(2)} s in all`);
  line('clip', lim.clipped > 0 ? `soft-clipped the tops of transients on ${(lim.clipped * 100).toFixed(2)}% of samples, at most ${(-lim.clipDb).toFixed(1)} dB (at ${lim.clipAt.toFixed(2)} s)` : 'untouched');
  if (lim.clipped > 0.01) line('', 'that is a lot of bending: something long and loud is hitting it; find it in the scenes below and bring it down in the score');
  line('limiter', parts.length ? parts.join(' · ') : 'untouched');
  // a shaved transient is masked by the transient itself; a held-down chord or hit is heard, and it ducks what plays with it
  if (lim.sustainedDb < -3 || lim.sustainedSec > seconds * 0.03) {
    line('', `that is squashing whatever plays at ${lim.sustainedAt.toFixed(2)} s: bring that cue down in the score, not the whole mix`);
  }

  // how the layers sit against each other, at the master's gain (dry, before the room)
  const present = BUSES.filter((b) => mix.buses[b]);
  if (present.length > 1) {
    const g = MASTER_BASE * dbToGain(gainDb);
    const top = {};
    for (const b of present) {
      const { l, r } = mix.buses[b];
      const sl = new Float32Array(l.length), sr = new Float32Array(r.length);
      for (let i = 0; i < l.length; i++) { sl[i] = l[i] * g; sr[i] = r[i] * g; }
      top[b] = meter([sl, sr], { truePeak: false })().momentaryMax;
    }
    line('layers', `loudest 400 ms: ${present.map((b) => `${b} ${fmt(top[b])}`).join(' · ')} LUFS`);
    if (top.whoosh != null && top.sfx != null) {
      const gap = top.sfx - top.whoosh;
      line('', gap >= 3 ? `whooshes sit ${gap.toFixed(1)} dB under the UI sounds: good` : `whooshes are within ${gap.toFixed(1)} dB of the UI sounds: bring them down ${(3 - gap).toFixed(1)} dB or more, they should carry moves, not cover clicks`);
    }
    if (top.beat != null && top.sfx != null && top.beat > top.sfx) line('', `the beat is ${(top.beat - top.sfx).toFixed(1)} dB louder than the UI sounds: bring it down so the clicks and keys still read`);
  }

  // each scene: where it plays, its average and its loudest moment
  for (const [i, s] of scenesOf(cut).entries()) {
    const sm = m({ from: s.start, to: s.end });
    line(i === 0 ? 'scenes' : '', `${s.id.padEnd(12)} ${s.start.toFixed(2).padStart(6)}–${s.end.toFixed(2).padEnd(6)} mean ${fmt(sm.mean).padStart(6)} · loudest 400 ms ${fmt(sm.momentaryMax).padStart(6)} LUFS`);
  }
  const shown = path.relative(process.cwd(), file);
  line('wrote', `${shown.startsWith('..') ? file : shown} (${(mastered.l.length / SR).toFixed(2)} s, ${((Date.now() - t0) / 1000).toFixed(1)} s to render)`);
  if (cues) printCues(cut, mix.cues);
  return { file, gainDb, ...whole, limited: mastered.limited };
}

/**
 * The cue sheet: every sound placed, by time, under the scene it plays in.
 * Runs of the same sound less than 0.25 s apart (typing, a beat) fold into
 * one line. This is how to check the sound without hearing it: each cue
 * should sit on the mark it belongs to.
 */
function printCues(cut, cues) {
  const scenes = scenesOf(cut);
  const sorted = [...cues].sort((a, b) => a.t - b.t);
  const runs = [];
  for (const c of sorted) {
    const last = runs.findLast((r) => r.kind === c.kind && r.bus === c.bus);
    if (last && c.t - last.to < 0.25 && c.kind !== 'pad') { last.to = c.t; last.n++; }
    else runs.push({ ...c, from: c.t, to: c.t, n: 1 });
  }
  runs.sort((a, b) => a.from - b.from);
  console.log(`  cues      ${cues.length} sounds`);
  let scene = null;
  for (const r of runs) {
    const s = scenes.findLast((x) => x.start <= r.from + 1e-9) ?? scenes[0];
    if (s !== scene) { scene = s; console.log(`            ${s.id} (${s.start.toFixed(2)} s)`); }
    const when = r.n > 1 ? `${r.from.toFixed(2)}–${r.to.toFixed(2)}` : r.from.toFixed(2);
    const pan = Array.isArray(r.pan) ? `${r.pan[0].toFixed(2)}→${r.pan[1].toFixed(2)}` : Number(r.pan).toFixed(2);
    console.log(`              ${when.padStart(11)}  ${`${r.kind}${r.n > 1 ? ` ×${r.n}` : ''}`.padEnd(20)} ${r.bus.padEnd(7)} gain ${r.gain.toFixed(2)}  pan ${pan}`);
  }
}

/* ── CLI ───────────────────────────────────────────────────────────────── */

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const usage = (cuts) => `usage: node sound/design.mjs <cut>|--all [gain dB] [--fit] [--cues]${cuts ? `   (cuts: ${Object.keys(cuts).join(', ')})` : ''}`;
  if (args.includes('--help') || args.includes('-h')) {
    let cuts = null;
    try { cuts = loadCuts(); } catch { /* the usage still helps without the list of cuts */ }
    console.log(usage(cuts));
    process.exit(0);
  }
  const extraDb = Number(args.find((a) => /^[+-]?\d+(\.\d+)?$/.test(a)) ?? 0);
  const fit = args.includes('--fit');
  const cues = args.includes('--cues');
  const all = args.includes('--all');
  const named = args.filter((a) => !a.startsWith('--') && !/^[+-]?\d+(\.\d+)?$/.test(a));
  try {
    const cuts = loadCuts();
    const list = all ? Object.keys(cuts).filter((id) => cuts[id].sound) : named;
    if (!list.length) {
      console.log(all ? 'no cut has "sound": true in cuts.json' : usage(cuts));
      process.exit(all ? 0 : 1);
    }
    for (const cut of list) {
      design(cut, { extraDb, fit, cues });
      if (list.length > 1) console.log('');
    }
  } catch (e) {
    console.error(`sound/design.mjs: ${e.message}`);
    process.exit(1);
  }
}
