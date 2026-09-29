// sound/tools/grow.mjs: new whooshes grown from one you like.
//
// A recording can only ever be itself, and the same whoosh thirty times over
// sounds like a machine (real feedback: "the swarm sounds bad, it's the same
// whoosh repeated"). So instead of playing it, measure it: how much energy it
// has in each eighth of an octave, every 2.7 ms, in the middle and at the
// sides. Then grow new ones out of fresh noise with that colour and that rise
// and fall. Never the same sound twice, but always the same family. Each one
// can be stretched to the length of its move, pitched to the size of what
// moves (small = higher), bent in pitch as it passes (Doppler), and panned
// along the path.
//
// Grow noisy sounds (whooshes, swells, air). Model percussive ones (clicks,
// keys, taps) with the engine's voices instead: resynthesized from noise,
// their snap turns to mush.
//
//   node sound/tools/grow.mjs ref.wav [--out dir] --n 5 --dur 0.6
//        [--pitch 1] [--spread 0.1] [--bend 1.06,0.94] [--pan -0.7,0.7] [--peak 0.4] [--seed 1]
//
// writes dir/<name>.profile.json (the measurement), dir/<name>-grown-1..n.wav,
// and dir/<name>-grown.png (the reference and its variants side by side).
// dir defaults to out/grown in the project (gitignored). These files are a
// preview for your ears and eyes: nothing in the score plays them. The score
// grows its own whooshes from sound/refs/whoosh.<ext> (or WHOOSH_REF) as it
// places each one. The input may also be a .profile.json from an earlier run.
//
//   import { measure, grow, profileOf } from './tools/grow.mjs';
//   const p = profileOf('sound/refs/whoosh.wav');         // levelled to house whoosh level
//   place(mix, grow(p, { dur: 0.5, pitch: 1.2, bend: [1.06, 0.94], seed: 7 }), t, { pan: [-0.6, 0.6] });
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SR, fft, rng, readAudio, recording, loudestRms, writeWav, HOUSE } from '../engine.mjs';

const TAU = Math.PI * 2;
const GN = 1024; // grain: 21 ms
const GH = 128; // hop: 2.7 ms
const GWIN = Float64Array.from({ length: GN }, (_, i) => 0.5 - 0.5 * Math.cos((TAU * i) / GN));
const BANDS = 72; // 30 Hz to 20 kHz in 72 steps: about an eighth of an octave each
const B0 = 30;
const B1 = 20000;
const bandAt = (f) => (Math.log(f / B0) / Math.log(B1 / B0)) * (BANDS - 1);

/**
 * Measure a sound ({ l, r } at 48 kHz, or mono): energy per band per hop for
 * its middle and its sides, smoothed over ~13 ms so what is kept is the shape,
 * not this take's grain; and where it starts, peaks and ends (seconds).
 */
export function measure(sound) {
  const l = sound.l ?? sound, r = sound.r ?? sound;
  const mid = [], side = [], total = [];
  for (let c = 0; c < l.length + GN / 2; c += GH) {
    for (const [sign, into] of [[1, mid], [-1, side]]) {
      const re = new Float64Array(GN), im = new Float64Array(GN);
      for (let i = 0; i < GN; i++) {
        const j = c - GN / 2 + i;
        if (j >= 0 && j < l.length) re[i] = ((l[j] + sign * r[j]) / 2) * GWIN[i];
      }
      fft(re, im);
      const e = new Float64Array(BANDS), w = new Float64Array(BANDS);
      let sum = 0;
      for (let k = 1; k < GN / 2; k++) {
        const p = re[k] * re[k] + im[k] * im[k];
        sum += p;
        const b = bandAt((k * SR) / GN);
        if (b < 0 || b > BANDS - 1) continue;
        const b0 = Math.floor(b), f = b - b0;
        e[b0] += p * (1 - f); w[b0] += 1 - f;
        if (b0 + 1 < BANDS) { e[b0 + 1] += p * f; w[b0 + 1] += f; }
      }
      // the lowest bands are narrower than one FFT bin: they take their neighbours' level
      const known = [];
      for (let b = 0; b < BANDS; b++) if (w[b] > 0.05) { e[b] /= w[b]; known.push(b); }
      for (let b = 0, k = 0; b < BANDS; b++) {
        while (k < known.length - 1 && known[k + 1] <= b) k++;
        const lo = known[k], hi = known[Math.min(known.length - 1, k + 1)];
        if (b === lo) continue;
        e[b] = b < lo ? e[lo] : hi === lo ? e[lo] : e[lo] + ((e[hi] - e[lo]) * (b - lo)) / (hi - lo);
      }
      into.push(e);
      if (sign === 1) total.push(sum);
    }
  }
  const smooth = (frames) => frames.map((_, i) => {
    const e = new Float64Array(BANDS);
    let ws = 0;
    for (let d = -2; d <= 2; d++) {
      const f = frames[i + d];
      if (!f) continue;
      const w = 3 - Math.abs(d);
      ws += w;
      for (let b = 0; b < BANDS; b++) e[b] += f[b] * w;
    }
    for (let b = 0; b < BANDS; b++) e[b] /= ws;
    return e;
  });
  const top = Math.max(...total);
  if (!(top > 0)) throw new Error('measure(): the sound is silent');
  const dt = GH / SR;
  const on = total.findIndex((v) => v > top * 3e-5);
  const off = total.length - 1 - [...total].reverse().findIndex((v) => v > top * 3e-5);
  const peak = total.indexOf(top);
  return { version: 1, sr: SR, dt, bands: BANDS, f0: B0, f1: B1, on: on * dt, peak: peak * dt, off: off * dt, rms: loudestRms({ l, r }), mid: smooth(mid), side: smooth(side) };
}

/**
 * Grow a new sound from profile `m`, `dur` seconds from its first breath to
 * its last (default: the reference's), loudest `peak` of the way through
 * (default: where the reference was), pitched by `pitch`, bending from
 * bend[0] to 1 at the loudest moment and on to bend[1] (a Doppler pass is
 * about [1.06, 0.94]), `width` times the reference's stereo spread. As loud at
 * its loudest 20 ms as the reference, plus `trimDb`. Returns { l, r, peakAt }.
 */
export function grow(m, { dur, peak, pitch = 1, bend = [1, 1], width = 1, seed = 1, trimDb = 0 } = {}) {
  const span = dur ?? m.off - m.on;
  const pk = Math.max(0.03, Math.min(0.97, peak ?? (m.peak - m.on) / Math.max(1e-6, m.off - m.on)));
  const r = rng(seed * 7717 + 13);
  const n = Math.max(GN, Math.round(span * SR));
  const P = pk * span;
  const M = new Float64Array(n + GN), S = new Float64Array(n + GN);
  const bandOfBin = new Float64Array(GN / 2);
  for (let c = 0; c <= n; c += GH) {
    const tau = c / SR;
    // map the new clock onto the reference's: its rise onto our rise, its fall onto our fall
    const rt = tau < P ? m.on + (m.peak - m.on) * (tau / P) : m.peak + (m.off - m.peak) * ((tau - P) / Math.max(1e-6, span - P));
    const fi = rt / m.dt;
    const i0 = Math.floor(fi), fr = fi - i0;
    if (i0 < 0 || i0 + 1 >= m.mid.length) continue;
    const shift = pitch * (tau < P ? bend[0] + (1 - bend[0]) * (tau / P) : 1 + (bend[1] - 1) * ((tau - P) / Math.max(1e-6, span - P)));
    for (let k = 1; k < GN / 2; k++) bandOfBin[k] = bandAt((k * SR) / GN / shift);
    for (const [bands, out, g] of [[m.mid, M, 1], [m.side, S, width]]) {
      const a = bands[i0], b = bands[i0 + 1];
      const re = new Float64Array(GN), im = new Float64Array(GN);
      for (let k = 1; k < GN / 2; k++) {
        const band = bandOfBin[k];
        if (band < 0 || band >= BANDS - 1) continue;
        const b0 = Math.floor(band), bf = band - b0;
        const e = (a[b0] * (1 - bf) + a[b0 + 1] * bf) * (1 - fr) + (b[b0] * (1 - bf) + b[b0 + 1] * bf) * fr;
        const amp = Math.sqrt(e) * g;
        const ph = r() * TAU;
        re[k] = amp * Math.cos(ph); im[k] = amp * Math.sin(ph);
        re[GN - k] = re[k]; im[GN - k] = -im[k];
      }
      fft(re, im); // a spectrum mirrored like this comes back real
      for (let i = 0; i < GN; i++) out[c + i] += re[i] * GWIN[i];
    }
  }
  const l = new Float32Array(n), rr = new Float32Array(n);
  const edge = Math.round(0.004 * SR);
  for (let i = 0; i < n; i++) {
    const e = Math.min(1, i / edge, (n - 1 - i) / edge);
    l[i] = (M[i + GN / 2] + S[i + GN / 2]) * e;
    rr[i] = (M[i + GN / 2] - S[i + GN / 2]) * e;
  }
  const k = (m.rms / (loudestRms({ l, r: rr }) || 1)) * 10 ** (trimDb / 20);
  for (let i = 0; i < n; i++) { l[i] *= k; rr[i] *= k; }
  // loudest where it was grown to be loudest (measuring it would land on a random grain of noise)
  return { l, r: rr, peakAt: P, bus: 'whoosh', room: HOUSE.whoosh.room, kind: 'grown whoosh' };
}

/** Save a profile as JSON (energies in dB, 0.1 dB steps, so it stays small). */
export function saveProfile(file, m) {
  const db = (frames) => frames.map((e) => Array.from(e, (v) => Math.round(10 * Math.max(-200, 10 * Math.log10(v + 1e-30))) / 10));
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ ...m, mid: db(m.mid), side: db(m.side) }));
  return file;
}

/** Load a profile saved by saveProfile. */
export function loadProfile(file) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (j.version !== 1 || j.bands !== BANDS) throw new Error(`${file}: not a grow.mjs profile`);
  const lin = (frames) => frames.map((e) => Float64Array.from(e, (v) => (v <= -199.9 ? 0 : 10 ** (v / 10))));
  return { ...j, mid: lin(j.mid), side: lin(j.side) };
}

const profiles = new Map();
/**
 * The profile of a reference recording, levelled to house whoosh level (so
 * what grows from it sits where a synthesized whoosh would), measured once
 * per run. Accepts audio files or a saved .profile.json.
 */
export function profileOf(file) {
  const key = path.resolve(file);
  if (!profiles.has(key)) profiles.set(key, /\.json$/i.test(file) ? loadProfile(file) : measure(recording(file)));
  return profiles.get(key);
}

/* ── CLI ───────────────────────────────────────────────────────────────── */

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const usage = 'usage: node sound/tools/grow.mjs ref.wav [--out dir (default out/grown)] --n 5 --dur 0.6 [--pitch 1] [--spread 0.1] [--bend 1.06,0.94] [--pan -0.7,0.7] [--peak 0.4] [--seed 1]';
  if (args.includes('--help') || args.includes('-h')) {
    console.log(usage);
    process.exit(0);
  }
  const opt = (name, parse = Number) => { const i = args.indexOf(name); if (i < 0) return undefined; const v = parse(args[i + 1]); args.splice(i, 2); return v; };
  const pair = (s) => s.split(',').map(Number);
  // out/grown in the project, wherever it is run from: out/ is gitignored
  const out = opt('--out', String) ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'out', 'grown');
  const rel = (f) => path.relative(process.cwd(), f);
  const n = opt('--n') ?? 5;
  const dur = opt('--dur');
  const pitch = opt('--pitch') ?? 1;
  const spread = opt('--spread') ?? 0.1;
  const bend = opt('--bend', pair) ?? [1, 1];
  const pan = opt('--pan', pair);
  const peak = opt('--peak');
  const seed = opt('--seed') ?? 1;
  const file = args[0];
  if (!file) {
    console.log(usage);
    process.exit(1);
  }
  const name = path.basename(file).replace(/(\.profile)?\.[^.]+$/, '');
  let ref = null, m;
  if (/\.json$/i.test(file)) m = loadProfile(file);
  else {
    ref = readAudio(file);
    m = measure(ref);
    saveProfile(path.join(out, `${name}.profile.json`), m);
  }
  console.log(`${name}: audible ${m.on.toFixed(2)}–${m.off.toFixed(2)} s, loudest at ${m.peak.toFixed(2)} s (${Math.round(((m.peak - m.on) / (m.off - m.on)) * 100)}% of the way through)`);
  const pick = rng(seed * 101 + 7);
  const sounds = ref ? [{ name: `${name} (reference)`, l: ref.l, r: ref.r }] : [];
  for (let i = 1; i <= n; i++) {
    const p = pitch * (1 + spread * (pick() * 2 - 1));
    const g = grow(m, { dur, peak, pitch: p, bend, seed: seed * 1000 + i });
    if (pan) {
      // travel along the path (balance law, as place() pans a stereo sound)
      for (let j = 0; j < g.l.length; j++) {
        const q = pan[0] + (pan[1] - pan[0]) * (j / g.l.length);
        g.l[j] *= Math.min(1, 1 - q);
        g.r[j] *= Math.min(1, 1 + q);
      }
    }
    const f = path.join(out, `${name}-grown-${i}.wav`);
    writeWav(f, g);
    console.log(`  ${rel(f)}: ${(g.l.length / SR).toFixed(2)} s, loudest at ${g.peakAt.toFixed(2)} s, pitch ×${p.toFixed(2)}${bend[0] !== 1 || bend[1] !== 1 ? `, bending ×${bend[0]} → ×${bend[1]}` : ''}${pan ? `, panning ${pan[0]} → ${pan[1]}` : ''}`);
    sounds.push({ name: `${name}-grown-${i}`, l: g.l, r: g.r });
  }
  const { spectrogram } = await import('./spectrogram.mjs');
  const png = path.join(out, `${name}-grown.png`);
  spectrogram(sounds, png);
  console.log(`  ${rel(png)}: the reference and its variants, side by side`);
}
