// sound/tools/analyze.mjs: describe a sound in plain words, so a reference
// the user sends can be understood, described back to them ("a soft, warm
// swell that peaks a third of the way in"), and cast to the right moment.
//
//   node sound/tools/analyze.mjs file.wav [more files ...] [--json]
//
// WAV is read directly; mp3, ogg, m4a and flac are decoded with Remotion's
// ffmpeg (npx remotion ffmpeg), so nothing else needs installing.
//
// It reports: length, when it starts, peaks and ends; how fast it rises and
// falls; loudness and true peak; brightness (spectral centroid) and whether
// it moves; energy by band; noisy or tonal (how much energy sits in clear
// pitches), and those notes; stereo width.
// Then what it is most like, and whether to grow it or model it.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SR, fft, readAudio, loudestRms, houseWhooshRms, gainToDb } from '../engine.mjs';
import { loudness, fmt } from './loudness.mjs';

const BANDS = [
  ['sub', 20, 60],
  ['bass', 60, 250],
  ['low mids', 250, 500],
  ['mids', 500, 2000],
  ['upper mids', 2000, 4000],
  ['presence', 4000, 8000],
  ['air', 8000, 20000],
];
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** The nearest note to a frequency: { name: 'A4', cents: +3 }. */
export function noteOf(f) {
  const n = 12 * Math.log2(f / 440) + 57;
  const r = Math.round(n);
  return { name: `${NAMES[((r % 12) + 12) % 12]}${Math.floor(r / 12)}`, cents: Math.round((n - r) * 100) };
}

const kHz = (f) => (f >= 1000 ? `${(f / 1000).toFixed(f >= 10000 ? 0 : 1)} kHz` : `${Math.round(f)} Hz`);
const ms = (s) => (s < 1 ? `${Math.round(s * 1000)} ms` : `${s.toFixed(2)} s`);

/** Average power spectrum of mono `x` between samples a and b with frame size N. */
function spectrum(x, a, b, N) {
  const win = Float64Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
  const p = new Float64Array(N / 2);
  const hop = N / 4;
  let frames = 0;
  for (let s = a - N / 2; s < b - N / 4; s += hop) {
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) { const j = s + i; if (j >= a && j < b) re[i] = x[j] * win[i]; }
    fft(re, im);
    for (let k = 0; k < N / 2; k++) p[k] += re[k] * re[k] + im[k] * im[k];
    frames++;
  }
  if (frames) for (let k = 0; k < p.length; k++) p[k] /= frames;
  return p;
}

function centroid(p, N) {
  let num = 0, den = 0;
  for (let k = 1; k < p.length; k++) { const f = (k * SR) / N; if (f < 20) continue; num += f * p[k]; den += p[k]; }
  return den > 0 ? num / den : 0;
}

/** Measure a sound ({ l, r } at 48 kHz). Returns the numbers; `describe` turns them into words. */
export function analyze(sound, { name = 'sound' } = {}) {
  const { l, r } = sound;
  const n = l.length;
  const mid = new Float32Array(n);
  for (let i = 0; i < n; i++) mid[i] = (l[i] + r[i]) / 2;
  // envelope: RMS every 10 ms, in dB under the loudest 10 ms
  const hop = Math.round(0.01 * SR);
  const env = [];
  for (let i = 0; i < n; i += hop) {
    let e = 0;
    const j1 = Math.min(n, i + hop);
    for (let j = i; j < j1; j++) e += (l[j] * l[j] + r[j] * r[j]) / 2;
    env.push(Math.sqrt(e / Math.max(1, j1 - i)));
  }
  const top = Math.max(...env);
  if (!(top > 0)) return { name, seconds: n / SR, silent: true };
  const db = env.map((v) => gainToDb(v / top));
  const pk = db.indexOf(0);
  const first = (lvl) => db.findIndex((v) => v > lvl);
  const lastAbove = (lvl) => db.length - 1 - [...db].reverse().findIndex((v) => v > lvl);
  const start = first(-40), end = lastAbove(-40);
  const rise20 = first(-20);
  let fall20 = pk, fall40 = pk;
  while (fall20 < db.length - 1 && db[fall20 + 1] > -20) fall20++;
  while (fall40 < db.length - 1 && db[fall40 + 1] > -40) fall40++;
  const t = (i) => (i * hop) / SR;
  const a = Math.round(t(start) * SR), b = Math.min(n, Math.round(t(end + 1) * SR));

  // spectrum over the audible part: centroid, bands, flatness, clear notes
  const N = 8192;
  const p = spectrum(mid, a, b, N);
  const cent = centroid(p, N);
  const bandE = BANDS.map(([, lo, hi]) => { let s = 0; for (let k = Math.ceil((lo * N) / SR); k < Math.min(p.length, (hi * N) / SR); k++) s += p[k]; return s; });
  const bandTot = bandE.reduce((s, v) => s + v, 0) || 1;
  let lg = 0, ar = 0, cnt = 0;
  for (let k = Math.ceil((100 * N) / SR); k < (10000 * N) / SR; k++) { lg += Math.log(p[k] + 1e-30); ar += p[k]; cnt++; }
  const flatness = cnt && ar > 0 ? Math.exp(lg / cnt) / (ar / cnt) : 0;
  const pdb = Array.from(p, (v) => 10 * Math.log10(v + 1e-30));
  const peaks = [];
  for (let k = Math.ceil((40 * N) / SR); k < Math.min(p.length - 1, (12000 * N) / SR); k++) {
    if (!(pdb[k] > pdb[k - 1] && pdb[k] >= pdb[k + 1])) continue;
    // stand out 12 dB over the median of the third of an octave around it
    const lo = Math.max(1, Math.floor(k / 1.12)), hi = Math.min(p.length - 1, Math.ceil(k * 1.12));
    const around = pdb.slice(lo, hi + 1).sort((x, y) => x - y);
    const med = around[around.length >> 1];
    if (pdb[k] - med > 12) peaks.push({ f: (k * SR) / N, db: pdb[k], over: pdb[k] - med });
  }
  // how much of the energy sits in those narrow peaks: near 0 for noise (even band-passed noise), near 1 for a chime
  let inPeaks = 0, all = 0;
  for (let k = Math.ceil((40 * N) / SR); k < Math.min(p.length, (12000 * N) / SR); k++) all += p[k];
  for (const q of peaks) { const k = Math.round((q.f * N) / SR); for (let d = -2; d <= 2; d++) inPeaks += p[k + d] ?? 0; }
  const tonal = all > 0 ? Math.min(1, inPeaks / all) : 0;
  peaks.sort((x, y) => y.db - x.db);
  const maxDb = Math.max(...pdb);
  const notes = peaks.filter((q) => q.db > maxDb - 30).slice(0, 5).sort((x, y) => x.f - y.f).map((q) => ({ f: q.f, ...noteOf(q.f) }));

  // brightness over time: the centroid at a quarter, half and three quarters of the audible part
  const cAt = (q) => {
    const c = Math.round(a + (b - a) * q), w = Math.max(1024, Math.round((b - a) * 0.2));
    return centroid(spectrum(mid, Math.max(0, c - w / 2), Math.min(n, c + w / 2), 2048), 2048);
  };
  const moves = [cAt(0.2), cAt(0.5), cAt(0.8)];

  // stereo
  let lr = 0, ll = 0, rr = 0, mm = 0, ss = 0;
  for (let i = a; i < b; i++) {
    lr += l[i] * r[i]; ll += l[i] * l[i]; rr += r[i] * r[i];
    mm += ((l[i] + r[i]) / 2) ** 2; ss += ((l[i] - r[i]) / 2) ** 2;
  }
  const corr = ll > 0 && rr > 0 ? lr / Math.sqrt(ll * rr) : 1;
  const width = mm > 0 ? Math.sqrt(ss / mm) : 0;

  const loud = loudness(sound.mono ? [l] : [l, r], { from: t(start), to: t(end + 1) });
  return {
    name,
    seconds: n / SR,
    mono: !!sound.mono,
    start: t(start),
    peak: t(pk) + 0.005,
    end: t(end + 1),
    attack: Math.max(0, t(pk) - t(Math.max(0, rise20))),
    fall20: t(fall20 + 1) - t(pk),
    fall40: t(fall40 + 1) - t(pk),
    endLevel: db[end] ?? -40,
    loudness: loud,
    hotterThanHouse: gainToDb(loudestRms(sound) / houseWhooshRms()),
    centroid: cent,
    centroidMoves: moves,
    bands: BANDS.map(([label, lo, hi], i) => ({ label, lo, hi, share: bandE[i] / bandTot })),
    flatness,
    tonal,
    notes,
    stereo: { corr, width, balance: ll > 0 && rr > 0 ? 10 * Math.log10(ll / rr) : 0 },
    envelope: db.slice(start, end + 1).filter((_, i) => i % 5 === 0).map((v) => Math.round(v)),
  };
}

/** The numbers as a few sentences a person can check by ear. */
export function describe(m) {
  if (m.silent) return `${m.name}: silent.`;
  const out = [];
  const bright = m.centroid < 500 ? 'dark' : m.centroid < 1500 ? 'warm' : m.centroid < 3000 ? 'balanced, mid-weighted' : m.centroid < 5000 ? 'bright' : 'very bright, close to hiss';
  const noisy = m.tonal < 0.15 ? 'noisy (air or breath, no clear pitch)' : m.tonal < 0.5 ? 'part noise, part tone' : 'tonal (clear pitches)';
  const [c0, , c2] = m.centroidMoves;
  const motion = c2 > c0 * 1.25 ? `rising: its brightness climbs from ${kHz(c0)} to ${kHz(c2)}` : c2 < c0 / 1.25 ? `falling: its brightness drops from ${kHz(c0)} to ${kHz(c2)}` : 'steady in colour';
  const percussive = m.attack < 0.015 && m.fall20 < 0.15;
  out.push(`${m.name}: ${m.seconds.toFixed(2)} s, ${m.mono ? 'mono' : 'stereo'}.`);
  out.push(`Audible from ${m.start.toFixed(2)} s to ${m.end.toFixed(2)} s. ${percussive ? `Hits hard: at full level within ${ms(m.attack)}` : `Rises to its loudest over ${ms(m.attack)}`}, at ${m.peak.toFixed(2)} s (${Math.round(((m.peak - m.start) / Math.max(1e-6, m.end - m.start)) * 100)}% of the way through), then falls 20 dB in ${ms(m.fall20)} and 40 dB in ${ms(m.fall40)}.`);
  const L = m.loudness;
  out.push(`Loudness: ${m.seconds >= 0.4 ? `${fmt(L.integrated)} LUFS integrated, ` : ''}loudest 400 ms ${fmt(L.momentaryMax)} LUFS, true peak ${fmt(L.truePeak)} dBTP. Its loudest moment is ${Math.abs(m.hotterThanHouse).toFixed(1)} dB ${m.hotterThanHouse >= 0 ? 'hotter' : 'quieter'} than a house-level whoosh (recording() levels it for you).`);
  out.push(`Colour: ${bright} (centroid ${kHz(m.centroid)}), ${noisy}, ${motion}.`);
  const bands = m.bands.filter((b) => b.share >= 0.02).sort((x, y) => y.share - x.share);
  out.push(`Energy: ${bands.map((b) => `${Math.round(b.share * 100)}% ${b.label} (${kHz(b.lo)}–${kHz(b.hi)})`).join(', ')}.`);
  if (m.notes.length) out.push(`Clear pitches: ${m.notes.map((q) => `${Math.round(q.f)} Hz (${q.name}${q.cents ? `${q.cents > 0 ? '+' : ''}${q.cents}c` : ''})`).join(', ')}.`);
  if (!m.mono) {
    const s = m.stereo;
    const w = s.corr > 0.97 ? 'almost mono' : s.width < 0.35 ? 'narrow' : s.width < 0.7 ? 'moderately wide' : s.width < 1.05 ? 'wide' : 'very wide, partly out of phase (check it in mono)';
    const bal = Math.abs(s.balance) < 1 ? 'centred' : `leaning ${s.balance > 0 ? 'left' : 'right'} by ${Math.abs(s.balance).toFixed(1)} dB`;
    out.push(`Stereo: ${w} (L/R correlation ${s.corr.toFixed(2)}, side/mid ${s.width.toFixed(2)}), ${bal}.`);
  }
  // what it is like, and what to do with it
  let cast;
  if (percussive && m.centroid < 300) cast = 'a low hit. Model it with thump() (or kick() on a beat); tune f to its lowest clear pitch.';
  else if (percussive && m.tonal >= 0.5 && m.notes.length) cast = 'a struck, pitched sound: a pop or a chime. Model it with pop() or chime() on its notes; do not grow it.';
  else if (percussive) cast = 'a click, tap or key. Model it with click(), key() or tick() and match its brightness; growing it from noise would smear the snap.';
  else if (m.tonal >= 0.5 && m.seconds > 1.5) cast = 'a sustained tone or chord: pad() or tone() territory. Match its notes and brightness.';
  else if (m.centroidMoves[2] > m.centroidMoves[0] * 1.25 && m.peak > m.start + 0.7 * (m.end - m.start)) cast = 'a riser: it builds to its end. Place it with placePeak() so its top lands on the hit, or grow variants with grow.mjs.';
  else if (m.tonal < 0.5) cast = `a noise swell: a whoosh. Play it as recorded with its peak on the move (recording() + placePeak()), or grow fresh variants with grow.mjs when it is needed more than a couple of times${m.seconds > 2 ? ' (long: trim or stretch it to the move)' : ''}.`;
  else cast = 'a tonal effect. Place it as recorded (recording() + placePeak()), or rebuild it from chime()/tone() if it must change per use.';
  out.push(`Most like: ${cast}`);
  return out.join('\n  ');
}

/* ── CLI ───────────────────────────────────────────────────────────────── */

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const usage = 'usage: node sound/tools/analyze.mjs file.wav|mp3|ogg|m4a [more ...] [--json]';
  if (args.includes('--help') || args.includes('-h')) {
    console.log(usage);
    process.exit(0);
  }
  const json = args.includes('--json');
  const files = args.filter((x) => x !== '--json');
  if (!files.length) {
    console.log(usage);
    process.exit(1);
  }
  for (const f of files) {
    const m = analyze(readAudio(f), { name: path.basename(f) });
    if (json) console.log(JSON.stringify({ ...m, loudness: { ...m.loudness, momentary: undefined } }, null, 2));
    else console.log(`${describe(m)}\n`);
  }
}
