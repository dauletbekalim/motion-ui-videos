// sound/tools/loudness.mjs: loudness the way the platforms measure it
// (ITU-R BS.1770 / EBU R128): K-weighted, momentary (400 ms), short-term
// (3 s), integrated with the -70 LUFS and -10 LU gates, loudness range, and a
// true-peak estimate from 4x oversampling. For a whole file or a stretch of it.
//
//   node sound/tools/loudness.mjs file.wav [more.wav ...] [--from s --to s]
//
// With several files it also says how each differs from the first, in dB,
// which is how a change should be reported: "the whooshes are 2.5 dB quieter".
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SR, readAudio, truePeaks, gainToDb } from '../engine.mjs';

/** K-weighting (BS.1770 pre-filter + RLB high-pass) for any sample rate; at 48 kHz these are the standard's coefficients. */
function kFilter(sr) {
  // stage 1: a high shelf, +4 dB above ~1.7 kHz (the head's acoustic effect)
  let f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196;
  let K = Math.tan((Math.PI * f0) / sr);
  const Vh = 10 ** (G / 20), Vb = Vh ** 0.4996667741545416;
  let a0 = 1 + K / Q + K * K;
  const s1 = { b: [(Vh + (Vb * K) / Q + K * K) / a0, (2 * (K * K - Vh)) / a0, (Vh - (Vb * K) / Q + K * K) / a0], a: [(2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0] };
  // stage 2: a high-pass near 38 Hz (the ear cares little for the lowest lows)
  f0 = 38.13547087602444; Q = 0.5003270373238773;
  K = Math.tan((Math.PI * f0) / sr);
  a0 = 1 + K / Q + K * K;
  const s2 = { b: [1, -2, 1], a: [(2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0] };
  return [s1, s2];
}

/** A channel K-weighted (Float64Array). */
export function kWeight(x, sr = SR) {
  const y = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = x[i];
  for (const { b, a } of kFilter(sr)) {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < y.length; i++) {
      const v = y[i];
      const o = b[0] * v + b[1] * x1 + b[2] * x2 - a[0] * y1 - a[1] * y2;
      x2 = x1; x1 = v; y2 = y1; y1 = o;
      y[i] = o;
    }
  }
  return y;
}

const LUFS = (power) => (power > 0 ? -0.691 + 10 * Math.log10(power) : -Infinity);

/**
 * A meter over channels (an array of Float32Arrays, or { l, r }, or a mono
 * array): K-weights them and finds their true peaks once, then measures any
 * stretch. The K-weighting runs over the whole file, so a stretch is measured
 * as it sounds in context. `truePeak: false` skips the oversampling (the
 * reported true peak is then the sample peak).
 *
 *   const m = meter(mix); m({ from: 2, to: 4.5 }).integrated
 */
export function meter(input, { sr = SR, truePeak = true } = {}) {
  const chans = Array.isArray(input) ? input : input.l ? (input.r && input.r !== input.l ? [input.l, input.r] : [input.l]) : [input];
  const n = chans[0].length;
  // running sum of K-weighted power, summed over channels (weight 1 each for L and R)
  const cum = new Float64Array(n + 1);
  for (const c of chans) {
    const k = kWeight(c, sr);
    let s = 0;
    for (let i = 0; i < n; i++) { s += k[i] * k[i]; cum[i + 1] += s; }
  }
  // true peak costs more than the rest together; skip it when only loudness is wanted
  const peaks = truePeak ? chans.map((c) => truePeaks(c)) : chans.map((c) => Float32Array.from(c, Math.abs));
  return ({ from = 0, to = Infinity } = {}) => measure(chans, peaks, cum, sr, from, to);
}

/**
 * Measure channels between `from` and `to` seconds. Returns, in LUFS / LU /
 * dB: { integrated, momentaryMax, shortTermMax, range, mean, truePeak,
 * samplePeak, seconds, momentary (every 100 ms) }.
 */
export function loudness(input, { sr = SR, from = 0, to = Infinity } = {}) {
  return meter(input, { sr })({ from, to });
}

function measure(chans, peaks, cum, sr, from, to) {
  const n = chans[0].length;
  const a = Math.max(0, Math.round(from * sr));
  const b = Math.min(n, Math.round(Math.min(to, n / sr) * sr));
  if (b <= a) throw new Error(`nothing to measure between ${from} and ${to} s`);
  const power = (i, j) => (cum[j] - cum[i]) / (j - i);
  const blocks = (win, step) => {
    const W = Math.round(win * sr), S = Math.round(step * sr), out = [];
    if (b - a < W) return [power(a, b)]; // shorter than one block: the stretch as one block
    for (let i = a; i + W <= b; i += S) out.push(power(i, i + W));
    return out;
  };
  const momentary = blocks(0.4, 0.1);
  const short = blocks(3, 0.1);
  // integrated: 400 ms blocks every 100 ms, gated at -70 LUFS, then 10 LU under their mean
  const abs = momentary.filter((p) => LUFS(p) > -70);
  let integrated = -Infinity;
  if (abs.length) {
    const rel = LUFS(abs.reduce((s, p) => s + p, 0) / abs.length) - 10;
    const kept = abs.filter((p) => LUFS(p) > rel);
    if (kept.length) integrated = LUFS(kept.reduce((s, p) => s + p, 0) / kept.length);
  }
  // loudness range (EBU Tech 3342): short-term, gated at -70 and 20 LU under their mean, 10th to 95th percentile
  let range = 0;
  const sAbs = short.filter((p) => LUFS(p) > -70);
  if (sAbs.length > 1) {
    const rel = LUFS(sAbs.reduce((s, p) => s + p, 0) / sAbs.length) - 20;
    const kept = sAbs.filter((p) => LUFS(p) > rel).map(LUFS).sort((x, y) => x - y);
    if (kept.length > 1) range = kept[Math.round(0.95 * (kept.length - 1))] - kept[Math.round(0.1 * (kept.length - 1))];
  }
  let tp = 0, sp = 0;
  chans.forEach((c, ci) => {
    for (let i = a; i < b; i++) {
      if (peaks[ci][i] > tp) tp = peaks[ci][i];
      const v = Math.abs(c[i]);
      if (v > sp) sp = v;
    }
  });
  const top = (xs) => xs.reduce((m, v) => (v > m ? v : m), 0);
  return {
    seconds: (b - a) / sr,
    integrated,
    momentaryMax: LUFS(top(momentary)),
    shortTermMax: LUFS(top(short)),
    range,
    mean: LUFS(power(a, b)),
    truePeak: gainToDb(tp),
    samplePeak: gainToDb(sp),
    momentary: momentary.map(LUFS),
  };
}

/** A number of LUFS/dB, readable: -14.2, or "silent". */
export const fmt = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : 'silent');

/** One line in plain words for a measurement. */
export function describe(m) {
  const parts = [`integrated ${fmt(m.integrated)} LUFS`, `true peak ${fmt(m.truePeak)} dBTP`, `loudest 3 s ${fmt(m.shortTermMax)} LUFS`, `loudest 400 ms ${fmt(m.momentaryMax)} LUFS`, `range ${fmt(m.range)} LU`];
  return parts.join(' · ');
}

/* ── CLI ───────────────────────────────────────────────────────────────── */

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const usage = 'usage: node sound/tools/loudness.mjs file.wav [more.wav ...] [--from s --to s]';
  if (args.includes('--help') || args.includes('-h')) {
    console.log(usage);
    process.exit(0);
  }
  const opt = (name) => { const i = args.indexOf(name); if (i < 0) return undefined; const v = Number(args[i + 1]); args.splice(i, 2); return v; };
  const from = opt('--from') ?? 0;
  const to = opt('--to') ?? Infinity;
  if (!args.length) {
    console.log(usage);
    process.exit(1);
  }
  let first = null;
  for (const file of args) {
    const m = loudness(readAudio(file), { from, to });
    const span = from || to !== Infinity ? ` (${from}–${Number.isFinite(to) ? to : 'end'} s)` : '';
    console.log(`${file}${span} · ${m.seconds.toFixed(2)} s`);
    console.log(`  ${describe(m)}`);
    if (m.truePeak > -1) console.log(`  true peak is above -1 dBTP: platforms may clip it when they transcode`);
    if (!first) first = m;
    else {
      const d = m.integrated - first.integrated;
      const word = Math.abs(d) < 0.5 ? 'about as loud as' : d > 0 ? `${d.toFixed(1)} dB louder than` : `${(-d).toFixed(1)} dB quieter than`;
      console.log(`  ${word} ${args[0]} (loudest 400 ms ${(m.momentaryMax - first.momentaryMax >= 0 ? '+' : '')}${(m.momentaryMax - first.momentaryMax).toFixed(1)} dB)`);
    }
  }
}
