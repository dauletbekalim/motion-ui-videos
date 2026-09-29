// sound/engine.mjs: the sound engine. A small synth palette, a mixer with a
// room, a fixed master gain, a soft clip and a look-ahead limiter, and WAV in
// and out. Pure Node, no dependencies, and deterministic: the same seed gives
// the same sound, sample for sample, so a re-render only changes what you
// changed.
//
// Every voice comes out at its house level. At gain 1 a click, a key, a pop
// and a whoosh already sit right against each other: the levels start from a
// real launch film balanced by ear with its founder (see HOUSE). Lean with
// `gain` (usually 0.5 to 2) instead of rebalancing from scratch.
//
// Taste baked into the defaults, each from real feedback:
// - soft over bright: clicks ring near 3 kHz, whooshes stay under 2.4 kHz,
//   and the master rolls off the very top
// - pink noise, never white: white noise reads as hiss, "too much"
// - whooshes sit under clicks and keys: they carry a move, they never cover it
// - steady tones, not glitches: tension is two notes a semitone apart,
//   beating evenly, not a bit-crushed random buzz
// - keys are subtle laptop keys: a light ~3 kHz tick and a small ~850 Hz tap,
//   no thock, quiet, one per character on the frame it appears
//
//   import { createMix, place, master, writeWav, click, note } from './engine.mjs';
//   const mix = createMix(8);
//   place(mix, click({ seed: 1 }), 1.25, { pan: -0.2 });
//   writeWav('out.wav', master(mix));   // gainDb 0: a busy UI score lands near -17 LUFS
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

export const SR = 48000;
const TAU = Math.PI * 2;

/* ── small tools ───────────────────────────────────────────────────────── */

/** A seeded random stream in [0, 1): the same seed, the same numbers. */
export function rng(seed = 1) {
  let a = (Math.floor(seed * 9973) ^ 0x2545f491) >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** An RBJ biquad with fixed coefficients: 'lp', 'hp' or 'bp' (0 dB peak). Returns x => y. */
export function biquad(type, f, q = 0.707) {
  const w = (TAU * Math.min(f, SR * 0.49)) / SR;
  const cos = Math.cos(w);
  const alpha = Math.sin(w) / (2 * q);
  let b0, b1, b2;
  if (type === 'lp') [b0, b1, b2] = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2];
  else if (type === 'hp') [b0, b1, b2] = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2];
  else if (type === 'bp') [b0, b1, b2] = [alpha, 0, -alpha];
  else throw new Error(`biquad(): unknown type "${type}"`);
  const a0 = 1 + alpha;
  const c0 = b0 / a0, c1 = b1 / a0, c2 = b2 / a0, d1 = (-2 * cos) / a0, d2 = (1 - alpha) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = c0 * x + c1 * x1 + c2 * x2 - d1 * y1 - d2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

/** A state-variable filter whose cutoff may move every sample (for sweeps). */
function svf() {
  let ic1 = 0, ic2 = 0;
  return (x, fc, q = 1) => {
    const g = Math.tan((Math.PI * Math.min(fc, SR * 0.45)) / SR);
    const k = 1 / q;
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = x - ic2;
    const v1 = a1 * ic1 + a2 * v3;
    const v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1;
    ic2 = 2 * v2 - ic2;
    return { lp: v2, bp: v1, hp: x - k * v1 - v2 };
  };
}

/** Pink noise (Paul Kellet's economy filter): equal energy per octave, so it sounds like air, not hiss. */
function pinkNoise(r) {
  let b0 = 0, b1 = 0, b2 = 0;
  return () => {
    const w = r() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 1.0526913;
    return (b0 + b1 + b2 + w * 0.1848) * 0.25;
  };
}

export const dbToGain = (db) => 10 ** (db / 20);
export const gainToDb = (g) => (g > 0 ? 20 * Math.log10(g) : -Infinity);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const buf = (sec) => new Float32Array(Math.max(1, Math.round(sec * SR)));

/** 'A4' → 440. Sharps and flats: 'C#5', 'Eb3'. */
export function note(name) {
  if (typeof name === 'number') return name;
  const m = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(String(name).trim());
  if (!m) throw new Error(`note(): can't read "${name}" (write it like 'A4', 'C#5' or 'Eb3')`);
  const semis = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1].toUpperCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * 2 ** ((semis + (Number(m[3]) - 4) * 12) / 12);
}
const hz = (n) => (typeof n === 'number' ? n : note(n));

/** Beat times in seconds: `count` beats at `bpm`, the first at `offset`. */
export function beats(bpm, count, offset = 0) {
  return Array.from({ length: Math.max(0, Math.floor(count)) }, (_, i) => offset + (i * 60) / bpm);
}

/* ── the palette ───────────────────────────────────────────────────────── */

// House levels: what each voice is scaled to, so that gain 1 is already a
// good balance. The clicks, keys, ticks, whooshes, steps and pad come from the
// launch film this engine grew out of, balanced by ear with its founder. The
// events (pop, thump, chime, tone) sit 2.5 to 5 dB lower than they did there:
// that film was mastered at -21.5 LUFS, and at the -14 to -17 a feed or a
// showcase wants, the events at the old balance would be flattened by the
// limiter (a sound held down also ducks whatever plays with it). The beat kit
// sits under the clicks. `room` is each voice's default send to the reverb.
export const HOUSE = {
  click: { level: 0.3, room: 0.12 },
  key: { level: 0.38, room: 0.1 },
  tick: { level: 0.07, room: 0.05 },
  pop: { level: 0.16, room: 0.22 },
  chime: { level: 0.15, room: 0.4 },
  thump: { level: 0.22, room: 0.2 },
  tone: { level: 0.045, room: 0.15 },
  whoosh: { level: 0.12, room: 0.15 },
  riser: { level: 0.1, room: 0.2 },
  pad: { level: 0.1, room: 0.35 },
  step: { level: 0.2, room: 0.1 },
  kick: { level: 0.1, room: 0.04 },
  hat: { level: 0.04, room: 0.05 },
  snareish: { level: 0.06, room: 0.14 },
};

/** Scale a rendered voice to its house level and tag it: which bus it mixes to, where it is loudest, its room send. */
function voice(out, kind, bus, peakAt) {
  const { level, room } = HOUSE[kind];
  for (let i = 0; i < out.length; i++) out[i] *= level;
  out.bus = bus;
  out.peakAt = peakAt;
  out.room = room;
  out.kind = kind;
  return out;
}

/** A UI click: a short bright transient, a tiny tuned ping near 3 kHz, a little body. `bright` scales the ping. */
export function click({ seed = 1, bright = 1 } = {}) {
  const r = rng(seed * 3 + 1);
  const out = buf(0.07);
  const ping = 3000 * bright * (0.95 + r() * 0.1);
  const hp = biquad('hp', Math.min(3000 * bright, 12000), 0.8);
  const lp = biquad('lp', 700);
  const body = 0.35 / Math.sqrt(Math.max(0.25, bright));
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const n = r() * 2 - 1;
    const transient = hp(n) * Math.exp(-t / 0.0011) * Math.min(1, t / 0.00025);
    const ring = Math.sin(TAU * ping * t) * Math.exp(-t / 0.0045) * 0.3;
    const thock = (Math.sin(TAU * 190 * t) * 0.7 + lp(n) * 0.9) * Math.exp(-t / 0.011) * body;
    out[i] = transient + ring + thock;
  }
  return voice(out, 'click', 'sfx', 0.001);
}

/**
 * A keystroke on a low laptop keyboard (MacBook-ish): a short light tick as
 * the cap bottoms out, a small hollow tap from the case, a fainter tick as it
 * comes back up. The space bar is lower and longer, with the little double
 * knock of its stabiliser. Quiet on purpose: under the picture, not on it.
 */
export function key({ seed = 1, pitch = 1, space = false } = {}) {
  const r = rng(seed * 7919 + 5);
  const out = buf(0.08);
  const tick = biquad('bp', (space ? 2100 : 3000) * pitch * (0.9 + r() * 0.2), 1.1);
  const air = biquad('bp', 5600 * pitch * (0.92 + r() * 0.16), 1.6);
  const top = biquad('lp', 9000);
  const f = (space ? 340 : 850) * pitch * (0.92 + r() * 0.16);
  const modes = space ? [[f, 0.012, 1], [f * 1.87, 0.006, 0.5], [f * 3.3, 0.003, 0.25]] : [[f, 0.0045, 1], [f * 2.2, 0.0025, 0.45]];
  const knock = biquad('bp', 1700 * pitch, 1.4);
  const knocks = space ? [0.0028 + r() * 0.0015, 0.0068 + r() * 0.0025] : [];
  const tUp = 0.042 + r() * 0.02;
  const up = biquad('bp', 3500 * pitch * (0.92 + r() * 0.16), 1.3);
  const level = 0.85 + r() * 0.3;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const n = r() * 2 - 1;
    const on = Math.min(1, t / 0.0003);
    let v = top(tick(n) * Math.exp(-t / 0.0016) + air(n) * Math.exp(-t / 0.0006) * 0.35) * on;
    let body = 0;
    for (const [mf, tau, g] of modes) body += Math.sin(TAU * mf * t) * Math.exp(-t / tau) * g;
    v += body * on * (space ? 0.42 : 0.28);
    let k = 0;
    for (const tk of knocks) if (t >= tk) k += Math.exp(-(t - tk) / 0.0007);
    v += knock(n) * k * 0.35;
    if (t >= tUp) v += up(n) * Math.exp(-(t - tUp) / 0.0009) * 0.22;
    out[i] = v * level;
  }
  return voice(out, 'key', 'sfx', 0.001);
}

/** A tick: smaller and brighter than a key, for text that prints itself (terminal output, a log). */
export function tick({ seed = 1, tone = 4800 } = {}) {
  const r = rng(seed * 104729 + 7);
  const out = buf(0.025);
  const hp = biquad('hp', Math.min(tone * 0.9, 12000));
  const f = tone * (0.92 + r() * 0.16);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = hp(r() * 2 - 1) * Math.exp(-t / 0.0009) * 0.9 + Math.sin(TAU * f * t) * Math.exp(-t / 0.0028) * 0.35;
  }
  return voice(out, 'tick', 'sfx', 0.0005);
}

/** Something lands: a soft round sine that drops `from` times its note into `f`, with a tiny tick on top. */
export function pop({ f = 660, from = 1.5, dur = 0.25, seed = 5 } = {}) {
  const out = buf(dur);
  const r = rng(seed * 31 + 11);
  const hp = biquad('hp', 4000);
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const freq = f * (1 + (from - 1) * Math.exp(-t / 0.012));
    phase += (TAU * freq) / SR;
    const env = Math.min(1, t / 0.0015) * Math.exp(-t / (dur * 0.22));
    out[i] = Math.sin(phase) * env + Math.sin(phase * 2) * env * 0.12 + hp(r() * 2 - 1) * Math.exp(-t / 0.0008) * 0.25;
  }
  return voice(out, 'pop', 'sfx', 0.002);
}

/** Glassy success: each note a few clean partials, the high ones fading first. `notes` in Hz or names; `spread` staggers them (seconds). */
export function chime({ notes = ['C6'], dur = 1.4, spread = 0.02 } = {}) {
  const fs0 = notes.map(hz);
  const out = buf(dur + spread * fs0.length);
  fs0.forEach((f, k) => {
    const delay = Math.round(k * spread * SR);
    for (let i = delay; i < out.length; i++) {
      const t = (i - delay) / SR;
      const a = Math.min(1, t / 0.003);
      out[i] +=
        (a *
          (Math.sin(TAU * f * t) * Math.exp(-t / (dur * 0.32)) +
            Math.sin(TAU * f * 2.0 * t) * 0.22 * Math.exp(-t / (dur * 0.12)) +
            Math.sin(TAU * f * 3.01 * t) * 0.08 * Math.exp(-t / (dur * 0.06)))) /
        fs0.length;
    }
  });
  return voice(out, 'chime', 'sfx', 0.004);
}

/** A hit you feel more than hear: a sine that falls into its low note, with a puff of low noise. */
export function thump({ f = 60, dur = 0.4, seed = 9 } = {}) {
  const out = buf(dur);
  const r = rng(seed * 13 + 3);
  const lp = biquad('lp', 240);
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    phase += (TAU * f * (1 + 1.2 * Math.exp(-t / 0.03))) / SR;
    out[i] = (Math.sin(phase) * Math.exp(-t / (dur * 0.3)) + lp(r() * 2 - 1) * Math.exp(-t / 0.02) * 0.6) * Math.min(1, t / 0.0008);
  }
  return voice(out, 'thump', 'sfx', 0.01);
}

/**
 * Steady tension: a clean electronic tone (odd harmonics, rolled off above
 * `bright` before they get harsh) that swells in and holds. With `beat` and one
 * note, a second note a semitone up joins it and the two beat evenly (about 9
 * times a second at D#3): the sound of two things in the same place. Loudest
 * at its end, so `placePeak` lands the end on the hit that resolves it.
 */
export function tone({ notes = ['D#3'], dur = 0.6, beat = true, bright = 1800 } = {}) {
  let fs0 = notes.map(hz);
  if (beat && fs0.length === 1) fs0 = [fs0[0], fs0[0] * 2 ** (1 / 12)];
  const out = buf(dur);
  for (const f of fs0) {
    const parts = [];
    for (let k = 1; k * f < 6000; k += 2) parts.push([(TAU * k * f) / SR, 1 / k / (1 + ((k * f) / bright) ** 2)]);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      let v = 0;
      for (const [w, a] of parts) v += Math.sin(w * i) * a;
      const swell = Math.min(1, t / 0.08) ** 2 * (0.6 + 0.4 * (t / dur));
      out[i] += v * swell * Math.min(1, (dur - t) / 0.015);
    }
  }
  return voice(out, 'tone', 'sfx', dur - 0.015);
}

// Whooshes are soft on purpose: pink noise, one band kept under WHOOSH_TOP and
// low-passed, a smooth rise and fall, every one brought to the same modest
// peak. The first version of this (white noise up to 6.5 kHz, an extra "air"
// band) swamped the clicks and keys, and the feedback was "overwhelming".
const WHOOSH_TOP = 2400;

/** Air moving: pink noise through a band sweeping f0 → f1, loudest `peak` of the way through. */
export function whoosh({ dur = 0.6, f0 = 300, f1 = 1400, peak = 0.5, q = 0.8, seed = 1 } = {}) {
  const out = buf(dur);
  const r = rng(seed * 31337 + 1);
  const pink = pinkNoise(r);
  const f = svf();
  const lp = biquad('lp', 2800);
  const a = Math.min(f0, WHOOSH_TOP), b = Math.min(f1, WHOOSH_TOP);
  const pk = clamp(peak, 0.02, 0.98);
  let top = 0;
  for (let i = 0; i < out.length; i++) {
    const x = i / out.length;
    const fc = a * (b / a) ** x;
    // half a sine from silence to the top and back, reaching the top at `peak`
    const phase = x < pk ? (x / pk) * 0.5 : 0.5 + ((x - pk) / (1 - pk)) * 0.5;
    const env = Math.sin(Math.PI * phase) ** 1.6;
    out[i] = lp(f(pink(), fc, q).bp) * env;
    top = Math.max(top, Math.abs(out[i]));
  }
  if (top > 0) for (let i = 0; i < out.length; i++) out[i] *= 0.5 / top;
  return voice(out, 'whoosh', 'whoosh', pk * dur);
}

/** A build before a hit: pink noise sweeping up with a quiet rising tone under it, loudest at its very end. */
export function riser({ dur = 1.5, f0 = 200, f1 = 2000, seed = 1 } = {}) {
  const out = buf(dur);
  const r = rng(seed * 4099 + 17);
  const pink = pinkNoise(r);
  const f = svf();
  const lp = biquad('lp', 4000);
  let phase = 0, top = 0;
  const n = out.length;
  for (let i = 0; i < n; i++) {
    const x = i / n;
    const fc = f0 * (f1 / f0) ** (x ** 1.4);
    phase += (TAU * fc * 0.5) / SR;
    const env = x ** 2.2 * Math.min(1, (n - 1 - i) / (0.02 * SR));
    out[i] = (lp(f(pink(), fc, 1.2).bp) + Math.sin(phase) * 0.06) * env;
    top = Math.max(top, Math.abs(out[i]));
  }
  if (top > 0) for (let i = 0; i < n; i++) out[i] *= 0.5 / top;
  return voice(out, 'riser', 'whoosh', dur - 0.03);
}

/**
 * A quiet chord bed: each note three slightly detuned voices with a few soft
 * harmonics, rolled off above `bright` (Hz), swelling slowly. It fades in over
 * up to 0.9 s and rings 1.2 s past `dur`. Notes in Hz or names.
 */
export function pad({ notes = ['C3', 'G3', 'D4', 'E4'], dur = 4, bright = 1200, seed = 77 } = {}) {
  const fs0 = notes.map(hz);
  const release = 1.2;
  const attack = clamp(dur * 0.3, 0.05, 0.9);
  const out = buf(dur + release);
  const r = rng(seed);
  const parts = [];
  for (const f0 of fs0) {
    for (const d of [1 - 0.0022, 1, 1 + 0.0019]) {
      const ph = r() * TAU;
      for (let k = 1; k <= 4; k++) {
        const f = f0 * d * k;
        if (f > SR * 0.45) continue;
        const w = (TAU * f) / SR;
        parts.push({ cw: Math.cos(w), sw: Math.sin(w), c: Math.cos(ph * k), s: Math.sin(ph * k), a: 1 / (1 + (f / bright) ** 2) / (k * k) });
      }
    }
  }
  const lfo = 0.07 + r() * 0.08;
  const norm = 1 / Math.max(1, fs0.length * 3);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let v = 0;
    for (const p of parts) {
      v += p.s * p.a;
      const c = p.c * p.cw - p.s * p.sw;
      p.s = p.s * p.cw + p.c * p.sw;
      p.c = c;
    }
    if ((i & 4095) === 0) for (const p of parts) { const m = 1 / Math.hypot(p.c, p.s); p.c *= m; p.s *= m; }
    const env = Math.min(1, t / attack) * (t > dur ? Math.max(0, 1 - (t - dur) / release) : 1);
    out[i] = v * norm * env * (0.85 + 0.15 * Math.sin(TAU * lfo * t));
  }
  return voice(out, 'pad', 'pad', attack);
}

/** A tiny footstep: a small square tick, low-passed so it is cute rather than harsh. */
export function step({ f = 1000, seed = 1 } = {}) {
  const out = buf(0.04);
  const lp = biquad('lp', 3200);
  const r = rng(seed * 57 + 29);
  const f1 = f * (0.96 + r() * 0.08);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = lp(Math.sign(Math.sin(TAU * f1 * t))) * Math.exp(-t / 0.007) * 0.6;
  }
  return voice(out, 'step', 'sfx', 0.001);
}

/* ── the beat kit, for reels cut to a beat: minimal, soft, under the UI ── */

/** A soft kick: a sine dropping into `f`, and a short beater click on top so it still reads on phone speakers. */
export function kick({ f = 55, dur = 0.35, seed = 1 } = {}) {
  const out = buf(dur);
  const r = rng(seed * 211 + 5);
  const lp = biquad('lp', 3000);
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    phase += (TAU * f * (1 + 1.6 * Math.exp(-t / 0.025))) / SR;
    const body = Math.sin(phase) * Math.exp(-t / (dur * 0.35));
    const beater = lp(r() * 2 - 1) * Math.exp(-t / 0.0018) * 0.45;
    out[i] = (body + beater) * Math.min(1, t / 0.0005) * Math.min(1, (out.length - 1 - i) / 48);
  }
  return voice(out, 'kick', 'beat', 0.004);
}

/** A closed hat: a short breath of high noise, rolled off at 12 kHz so it ticks rather than hisses. */
export function hat({ seed = 1, open = false } = {}) {
  const dur = open ? 0.25 : 0.06;
  const out = buf(dur);
  const r = rng(seed * 353 + 9);
  const hp = biquad('hp', 6500, 0.7);
  const bp = biquad('bp', 9000 * (0.95 + r() * 0.1), 0.9);
  const lp = biquad('lp', 12000);
  const tau = open ? 0.09 : 0.018;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const n = r() * 2 - 1;
    out[i] = lp(hp(n) * 0.6 + bp(n) * 0.8) * Math.exp(-t / tau) * Math.min(1, t / 0.0004);
  }
  return voice(out, 'hat', 'beat', 0.001);
}

/** A soft snare-ish backbeat: a short tuned body and a band of pink noise, closer to a rim-clap than a crack. */
export function snareish({ seed = 1 } = {}) {
  const out = buf(0.22);
  const r = rng(seed * 499 + 13);
  const pink = pinkNoise(r);
  const bp = biquad('bp', 1900 * (0.95 + r() * 0.1), 0.7);
  const lp = biquad('lp', 7000);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const body = (Math.sin(TAU * 185 * t) * 0.8 + Math.sin(TAU * 330 * t) * 0.35) * Math.exp(-t / 0.045);
    const snare = lp(bp(pink()) * 4) * Math.exp(-t / 0.075);
    out[i] = (body + snare) * Math.min(1, t / 0.0006);
  }
  return voice(out, 'snareish', 'beat', 0.003);
}

/* ── the mix ───────────────────────────────────────────────────────────── */

/** The layers a mix keeps apart, so one can be rendered or measured alone (ONLY=sfx, ONLY=pad,beat...). */
export const BUSES = ['sfx', 'whoosh', 'pad', 'beat'];

function parseOnly(only) {
  if (!only) return null;
  const set = new Set(String(only).split(',').map((s) => s.trim()).filter(Boolean));
  for (const b of set) if (!BUSES.includes(b)) throw new Error(`ONLY=${only}: unknown layer "${b}" (use ${BUSES.join(', ')})`);
  return set.size ? set : null;
}

/**
 * An empty stereo mix `seconds` long: a stereo bus per layer and a send to the
 * room. `only` keeps some layers (default: env ONLY). `cues: true` also keeps
 * a list of everything placed ({ t, kind, bus, gain, pan }), for a cue sheet.
 */
export function createMix(seconds, { only = process.env.ONLY, cues = false } = {}) {
  if (!(seconds > 0)) throw new Error(`createMix(): length must be > 0 seconds, got ${seconds}`);
  const len = Math.round(seconds * SR);
  return { seconds, len, sr: SR, buses: {}, sendL: new Float32Array(len), sendR: new Float32Array(len), only: parseOnly(only), count: {}, cues: cues ? [] : null };
}

function busOf(mix, name) {
  return (mix.buses[name] ??= { l: new Float32Array(mix.len), r: new Float32Array(mix.len) });
}

/**
 * Mix `sound` in starting at `t` seconds. `sound` is a mono Float32Array or
 * a stereo { l, r }. `pan` is -1 … 1, or [from, to] to travel across the
 * stereo field over the sound's length. `room` is the reverb send (default:
 * the voice's own, else 0.12). `bus` overrides the layer (default: the
 * voice's own, else 'sfx'). A null `t` places nothing, so a missing mark can
 * be passed straight through. Returns whether anything was placed.
 */
export function place(mix, sound, t, { gain = 1, pan = 0, room, bus } = {}) {
  if (t == null) return false;
  if (!Number.isFinite(t)) throw new Error(`place(): time must be seconds, got ${t}`);
  const name = bus ?? sound.bus ?? 'sfx';
  if (!BUSES.includes(name)) throw new Error(`place(): unknown bus "${name}" (use ${BUSES.join(', ')})`);
  if (mix.only && !mix.only.has(name)) return false;
  const send = room ?? sound.room ?? 0.12;
  const out = busOf(mix, name);
  const stereo = sound.l !== undefined && sound.r !== undefined;
  const len = stereo ? sound.l.length : sound.length;
  const start = Math.round(t * SR);
  const [p0, p1] = Array.isArray(pan) ? pan : [pan, pan];
  const i0 = Math.max(0, -start);
  const i1 = Math.min(len, mix.len - start);
  for (let i = i0; i < i1; i++) {
    const j = start + i;
    const p = clamp(p0 + (p1 - p0) * (i / len), -1, 1);
    let vl, vr;
    if (stereo) {
      // a stereo sound keeps its own image; pan leans it (balance law)
      vl = sound.l[i] * gain * Math.min(1, 1 - p);
      vr = sound.r[i] * gain * Math.min(1, 1 + p);
    } else {
      // a mono sound pans with equal power
      const v = sound[i] * gain;
      const ang = ((p + 1) * Math.PI) / 4;
      vl = v * Math.cos(ang);
      vr = v * Math.sin(ang);
    }
    out.l[j] += vl;
    out.r[j] += vr;
    mix.sendL[j] += vl * send;
    mix.sendR[j] += vr * send;
  }
  mix.count[name] = (mix.count[name] ?? 0) + 1;
  mix.cues?.push({ t, kind: sound.kind ?? (stereo ? 'stereo sound' : 'sound'), bus: name, gain, pan });
  return true;
}

/** Where a sound is loudest (seconds): its own `peakAt` if it has one, else where its envelope peaks. */
export function peakOf(sound) {
  return sound.peakAt ?? envelopePeak(sound);
}

/** Mix `sound` in so that its loudest moment lands on `t`: a whoosh peaks on the move, a riser ends on the hit. */
export function placePeak(mix, sound, t, opts = {}) {
  if (t == null) return false;
  return place(mix, sound, t - peakOf(sound), opts);
}

/** The centre of the loudest `win`-second stretch of a mono or { l, r } sound, in seconds. */
export function loudestAt(sound, win = 0.02) {
  const l = sound.l ?? sound, r = sound.r ?? sound;
  const hop = Math.max(1, Math.round(win * SR));
  const step = Math.max(1, hop >> 1);
  let best = -1, at = 0;
  for (let i = 0; i + hop <= l.length; i += step) {
    let e = 0;
    for (let j = i; j < i + hop; j++) e += (l[j] * l[j] + r[j] * r[j]) / 2;
    if (e > best) { best = e; at = i + hop / 2; }
  }
  if (best < 0) return l.length / 2 / SR;
  return at / SR;
}

/**
 * Where a sound's envelope peaks, in seconds: RMS every 5 ms, smoothed over
 * `win` (at most a quarter of the sound), so a noisy swell peaks where it
 * swells, not on whichever 20 ms of noise happened to be loudest.
 */
export function envelopePeak(sound, win = 0.06) {
  const l = sound.l ?? sound, r = sound.r ?? sound;
  const hop = Math.round(0.005 * SR);
  const env = [];
  for (let i = 0; i < l.length; i += hop) {
    let e = 0;
    const j1 = Math.min(l.length, i + hop);
    for (let j = i; j < j1; j++) e += (l[j] * l[j] + r[j] * r[j]) / 2;
    env.push(e / Math.max(1, j1 - i));
  }
  const w = Math.max(0, Math.min(Math.round(win / 0.005 / 2), Math.floor(env.length / 8)));
  let best = -1, at = 0;
  for (let i = 0; i < env.length; i++) {
    let e = 0;
    for (let d = -w; d <= w; d++) e += env[Math.max(0, Math.min(env.length - 1, i + d))];
    if (e > best) { best = e; at = i; }
  }
  return (at + 0.5) * 0.005;
}

/** The RMS of the loudest `win` seconds of a mono or { l, r } sound. */
export function loudestRms(sound, win = 0.02) {
  const l = sound.l ?? sound, r = sound.r ?? sound;
  const hop = Math.max(1, Math.round(win * SR));
  let best = 0;
  for (let i = 0; i + hop <= l.length; i += Math.max(1, hop >> 1)) {
    let e = 0;
    for (let j = i; j < i + hop; j++) e += ((l[j] + r[j]) / 2) ** 2;
    best = Math.max(best, Math.sqrt(e / hop));
  }
  return best;
}

/** A mono sound spread to stereo along a pan (-1 … 1, or [from, to]), as `place` would pan it. */
export function panned(sound, pan = 0) {
  if (sound.l) return sound;
  const l = new Float32Array(sound.length), r = new Float32Array(sound.length);
  const [p0, p1] = Array.isArray(pan) ? pan : [pan, pan];
  for (let i = 0; i < sound.length; i++) {
    const ang = ((clamp(p0 + (p1 - p0) * (i / sound.length), -1, 1) + 1) * Math.PI) / 4;
    l[i] = sound[i] * Math.cos(ang);
    r[i] = sound[i] * Math.sin(ang);
  }
  return { l, r, bus: sound.bus, peakAt: sound.peakAt, room: sound.room };
}

/* ── the room: a small warm reverb in Freeverb's shape ─────────────────── */

function room(input, spread) {
  const scale = SR / 44100;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => ({ b: new Float32Array(Math.round((d + spread) * scale)), i: 0, store: 0 }));
  const alls = [556, 441, 341, 225].map((d) => ({ b: new Float32Array(Math.round((d + spread) * scale)), i: 0 }));
  const feedback = 0.8, damp = 0.28;
  const out = new Float32Array(input.length);
  const pre = Math.round(0.018 * SR);
  for (let n = 0; n < input.length; n++) {
    const x = (n >= pre ? input[n - pre] : 0) * 0.015;
    let y = 0;
    for (const c of combs) {
      const o = c.b[c.i];
      c.store = o * (1 - damp) + c.store * damp;
      c.b[c.i] = x + c.store * feedback;
      if (++c.i === c.b.length) c.i = 0;
      y += o;
    }
    for (const a of alls) {
      const o = a.b[a.i];
      a.b[a.i] = y + o * 0.5;
      if (++a.i === a.b.length) a.i = 0;
      y = o - y;
    }
    out[n] = y;
  }
  return out;
}

/* ── true peak: 4x oversampling, as the loudness meters estimate it ────── */

const TP_TAPS = 16;
const TP_PHASES = (() => {
  // windowed-sinc taps for the values a quarter, half and three quarters of the way to the next sample
  const phases = [];
  for (const frac of [0.25, 0.5, 0.75]) {
    const h = [];
    let sum = 0;
    for (let j = -TP_TAPS / 2 + 1; j <= TP_TAPS / 2; j++) {
      const u = j - frac;
      const sinc = u === 0 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u);
      const w = 0.5 + 0.5 * Math.cos((Math.PI * u) / (TP_TAPS / 2));
      h.push(sinc * w);
      sum += sinc * w;
    }
    phases.push(h.map((v) => v / sum));
  }
  return phases;
})();

/** Per sample, the largest magnitude between it and the next sample, 4x oversampled. */
export function truePeaks(x) {
  const n = x.length;
  const out = new Float32Array(n);
  const lo = -TP_TAPS / 2 + 1;
  for (let i = 0; i < n; i++) {
    let m = Math.abs(x[i]);
    for (const h of TP_PHASES) {
      let y = 0;
      for (let k = 0; k < TP_TAPS; k++) {
        const j = i + lo + k;
        if (j >= 0 && j < n) y += x[j] * h[k];
      }
      const a = Math.abs(y);
      if (a > m) m = a;
    }
    out[i] = m;
  }
  return out;
}

/* ── master: room, filters, fixed gain, look-ahead limiter ─────────────── */

/**
 * The master's fixed gain at gainDb 0. It never moves with the mix: turning
 * one sound down never turns the rest up (a normaliser would, and then every
 * change sounds like three changes). The voices are quiet on purpose, so a
 * score can stack dozens of them; at this gain a UI score as busy as the
 * template's showcase (a click, key or whoosh most seconds, a pad under it)
 * lands near -17 LUFS. design.mjs sets each format's gainDb from there.
 */
export const MASTER_BASE = dbToGain(17);

/**
 * Sum the layers, add the room, roll off below `hp` and above `lp` Hz, apply
 * the fixed gain plus `gainDb`, fade the ends, soft-clip the top `clip` dB of
 * transients (0 turns it off), and hold true peaks under `ceiling` (0.89 ≈
 * -1 dBTP) with a look-ahead limiter that only touches the few biggest hits.
 * `reverb` is true, false, or a wet level (1 = house).
 * Returns { l, r }, what the soft clip did: { clipped (fraction of samples
 * it bent), clipDb (the most it took off a sample), clipAt }, and what the
 * limiter did: { limited (fraction of
 * samples it touched), heavy (fraction held down by more than 1 dB),
 * deepestDb, deepestAt (seconds), transients (short peaks shaved),
 * transientDb (deepest shave), sustainedSec (seconds a longer sound was
 * held down by more than 1 dB), sustainedDb, sustainedAt }.
 */
export function master(mix, { gainDb = 0, ceiling = 0.89, clip = 3, hp = 30, lp = 18000, reverb = true, fadeIn = 0.005, fadeOut = 0.25, lookahead = 0.003, release = 0.12 } = {}) {
  const n = mix.len;
  const L = new Float32Array(n), R = new Float32Array(n);
  for (const b of Object.values(mix.buses)) {
    for (let i = 0; i < n; i++) { L[i] += b.l[i]; R[i] += b.r[i]; }
  }
  if (reverb) {
    const wet = (reverb === true ? 1 : Number(reverb)) * 2.2;
    const wl = room(mix.sendL, 0), wr = room(mix.sendR, 23);
    for (let i = 0; i < n; i++) { L[i] += wl[i] * wet; R[i] += wr[i] * wet; }
  }
  const chain = () => {
    const h = hp ? biquad('hp', hp) : (x) => x;
    const l = lp && lp < SR * 0.49 ? biquad('lp', lp) : (x) => x;
    return (x) => l(h(x));
  };
  const fl = chain(), fr = chain();
  const g = MASTER_BASE * dbToGain(gainDb);
  const fi = Math.max(1, Math.round(fadeIn * SR)), fo = Math.max(1, Math.round(fadeOut * SR));
  // soft clip: the top `clip` dB under the ceiling bends smoothly into it. It
  // has no memory, so it shaves only the few samples at the top of a click or
  // a key and never rides the level of the pad or anything else under them.
  const knee = clip > 0 ? ceiling * dbToGain(-clip) : Infinity;
  const room0 = ceiling - knee;
  const soft = (x) => {
    const a = Math.abs(x);
    return a <= knee ? x : Math.sign(x) * (knee + room0 * Math.tanh((a - knee) / room0));
  };
  let clipped = 0, clipDeepest = 1, clipAt = 0;
  for (let i = 0; i < n; i++) {
    const fade = Math.min(1, i / fi, (n - 1 - i) / fo);
    const l = fl(L[i]) * g * fade, r = fr(R[i]) * g * fade;
    L[i] = soft(l);
    R[i] = soft(r);
    if (Math.abs(l) > knee || Math.abs(r) > knee) {
      clipped++;
      const k = Math.min(Math.abs(L[i]) / Math.abs(l || 1e-9), Math.abs(R[i]) / Math.abs(r || 1e-9));
      if (k < clipDeepest) { clipDeepest = k; clipAt = i / SR; }
    }
  }
  return { l: L, r: R, clipped: clipped / n, clipDb: gainToDb(clipDeepest), clipAt, ...limit(L, R, ceiling, lookahead, release) };
}

/**
 * Look-ahead limiter, in place. The gain may only be as high as the ceiling
 * allows at the loudest true peak within the next `lookahead` seconds (and the
 * last 12 ms, so a low note's cycles don't wobble it). After a short over (a
 * click's snap, a pop) it lets go in ~15 ms, so the keys and pad around it are
 * never ducked; after a long one (a thump's body) it lets go over `release`,
 * so the low end doesn't distort. Every fall is smoothed across the
 * look-ahead, so the gain is already down when a hit arrives and never steps.
 */
function limit(L, R, ceiling, lookahead, release) {
  const n = L.length;
  const target = ceiling * 0.995;
  const la = Math.max(1, Math.round(lookahead * SR));
  const hold = Math.round(0.012 * SR);
  const tl = truePeaks(L), tr = truePeaks(R);
  const want = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const lvl = Math.max(tl[i], tr[i]);
    want[i] = lvl > target ? target / lvl : 1;
  }
  // the lowest `want` in [i, i + W): a sliding minimum over a monotonic queue
  const W = la + hold;
  const fwd = new Float32Array(n);
  const q = new Int32Array(n);
  let head = 0, tail = 0;
  for (let i = n - 1; i >= 0; i--) {
    while (tail > head && want[q[tail - 1]] >= want[i]) tail--;
    q[tail++] = i;
    while (q[head] >= i + W) head++;
    fwd[i] = want[q[head]];
  }
  // shifted back by the hold, so each sample sees [i - hold, i + la)
  const m = new Float32Array(n);
  for (let i = 0; i < n; i++) m[i] = fwd[Math.max(0, i - hold)];
  const fast = Math.exp(-1 / (0.015 * SR));
  const slow = Math.exp(-1 / (release * SR));
  const short = Math.round(0.04 * SR);
  const oneDb = dbToGain(-1);
  // what it did, in two kinds: transient peaks shaved (masked by the transient
  // itself), and longer sounds held down (audible, so worth reporting)
  const stats = { transients: 0, transientDb: 0, sustainedSec: 0, sustainedDb: 0, sustainedAt: 0 };
  let g = 1, over = 0, ep = null;
  const close = () => {
    const db = gainToDb(ep.min);
    if (over >= short) {
      stats.sustainedSec += ep.heavy / SR;
      if (db < stats.sustainedDb) { stats.sustainedDb = db; stats.sustainedAt = ep.at / SR; }
    } else {
      stats.transients++;
      stats.transientDb = Math.min(stats.transientDb, db);
    }
    ep = null;
    over = 0;
  };
  for (let i = 0; i < n; i++) {
    if (m[i] < 0.9999) over++;
    if (m[i] < g) g = m[i];
    else g = m[i] + (g - m[i]) * (over < short ? fast : slow);
    if (g < 0.9999) {
      ep ??= { min: 1, at: i, heavy: 0 };
      if (g < ep.min) { ep.min = g; ep.at = i; }
      if (g < oneDb) ep.heavy++;
    } else if (ep) close();
    m[i] = g;
  }
  if (ep) close(); // still holding when the mix ends
  let acc = la; // the box average starts from unity gain
  let limited = 0, heavy = 0, deepest = 1, deepestAt = 0;
  const hist = new Float32Array(la).fill(1);
  for (let i = 0; i < n; i++) {
    acc += m[i] - hist[i % la];
    hist[i % la] = m[i];
    const s = Math.min(1, acc / la);
    if (s < 0.999) limited++;
    if (s < oneDb) heavy++;
    if (s < deepest) { deepest = s; deepestAt = i / SR; }
    L[i] *= s;
    R[i] *= s;
  }
  return { limited: limited / n, heavy: heavy / n, deepestDb: gainToDb(deepest), deepestAt, ...stats };
}

/* ── WAV in and out ────────────────────────────────────────────────────── */

/** Write { l, r } as a 16-bit PCM stereo WAV at 48 kHz (TPDF-dithered, deterministic). Creates the folder. */
export function writeWav(file, { l, r }) {
  const n = l.length;
  const pcm = Buffer.alloc(n * 4);
  const d = rng(424242);
  for (let i = 0; i < n; i++) {
    const a = Math.round(clamp(l[i], -1, 1) * 32767 + (d() - d()));
    const b = Math.round(clamp((r ?? l)[i], -1, 1) * 32767 + (d() - d()));
    pcm.writeInt16LE(clamp(a, -32768, 32767), i * 4);
    pcm.writeInt16LE(clamp(b, -32768, 32767), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28);
  h.writeUInt16LE(4, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(pcm.length, 40);
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([h, pcm]));
  return file;
}

/** Parse a WAV (PCM 8/16/24/32-bit or float 32/64, plain or extensible) into float channels at its own rate. */
export function parseWav(b) {
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE') throw new Error('not a WAV file');
  let p = 12, fmt = null, data = null;
  while (p + 8 <= b.length) {
    const id = b.toString('ascii', p, p + 4);
    let size = b.readUInt32LE(p + 4);
    if (size > b.length - p - 8) size = b.length - p - 8; // streamed WAVs say 0xFFFFFFFF
    if (id === 'fmt ') {
      let format = b.readUInt16LE(p + 8);
      if (format === 0xfffe && size >= 40) format = b.readUInt16LE(p + 8 + 24);
      fmt = { format, channels: b.readUInt16LE(p + 10), sr: b.readUInt32LE(p + 12), bits: b.readUInt16LE(p + 22) };
    }
    if (id === 'data') { data = b.subarray(p + 8, p + 8 + size); break; }
    p += 8 + size + (size % 2);
  }
  if (!fmt || !data) throw new Error('WAV has no fmt or data chunk');
  const { format, channels, bits } = fmt;
  const bytes = bits / 8;
  const n = Math.floor(data.length / bytes / channels);
  const ch = Array.from({ length: channels }, () => new Float32Array(n));
  const read =
    format === 3 && bits === 32 ? (o) => data.readFloatLE(o)
    : format === 3 && bits === 64 ? (o) => data.readDoubleLE(o)
    : format === 1 && bits === 16 ? (o) => data.readInt16LE(o) / 32768
    : format === 1 && bits === 24 ? (o) => data.readIntLE(o, 3) / 8388608
    : format === 1 && bits === 32 ? (o) => data.readInt32LE(o) / 2147483648
    : format === 1 && bits === 8 ? (o) => (data[o] - 128) / 128
    : null;
  if (!read) throw new Error(`unsupported WAV encoding (format ${format}, ${bits}-bit)`);
  for (let i = 0; i < n; i++) for (let c = 0; c < channels; c++) ch[c][i] = read((i * channels + c) * bytes);
  return { ch, sr: fmt.sr };
}

/** A WAV file as float channels at its own rate: { ch: Float32Array[], sr }. */
export function readWav(file) {
  return parseWav(fs.readFileSync(file));
}

/** Change sample rate with a windowed-sinc interpolator (low-passed when going down). */
export function resample(x, from, to) {
  if (from === to) return x;
  const ratio = from / to;
  const n = Math.floor(x.length / ratio);
  const out = new Float32Array(n);
  const cut = Math.min(1, to / from);
  const half = Math.ceil(16 / cut);
  for (let i = 0; i < n; i++) {
    const t = i * ratio;
    const c = Math.floor(t);
    let y = 0, ws = 0;
    for (let k = c - half + 1; k <= c + half; k++) {
      if (k < 0 || k >= x.length) continue;
      const u = (t - k) * cut;
      const s = u === 0 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u);
      const w = 0.5 + 0.5 * Math.cos((Math.PI * (t - k)) / half);
      y += x[k] * s * w;
      ws += s * w;
    }
    out[i] = ws ? y / ws : 0;
  }
  return out;
}

/** Run Remotion's bundled ffmpeg (so nothing else needs installing): the template's own copy, else `npx remotion`. Returns stdout. */
export function ffmpeg(args) {
  const runs = [];
  if (process.env.REMOTION_CLI) runs.push([process.execPath, [process.env.REMOTION_CLI, 'ffmpeg', ...args], {}]);
  try {
    const pkg = createRequire(import.meta.url).resolve('@remotion/cli/package.json');
    runs.push([process.execPath, [path.join(path.dirname(pkg), 'remotion-cli.js'), 'ffmpeg', ...args], {}]);
  } catch {
    // not installed next to this file
  }
  // npx is a .cmd on Windows, which needs a shell, which needs quoted arguments
  const win = process.platform === 'win32';
  const quote = (a) => (win && /[\s"&|<>^]/.test(a) ? `"${a.replace(/"/g, '""')}"` : a);
  runs.push(['npx', ['--no', 'remotion', 'ffmpeg', ...args].map(quote), { shell: win }]);
  let last;
  for (const [cmd, argv, extra] of runs) {
    try {
      return execFileSync(cmd, argv, { maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'pipe'], ...extra });
    } catch (e) {
      last = e;
    }
  }
  throw new Error(`could not decode with Remotion's ffmpeg (run npm install in the video project, or convert the file to WAV): ${String(last?.stderr ?? last?.message ?? '').trim().split('\n')[0]}`);
}

/**
 * Any audio file as stereo floats at 48 kHz: { l, r, mono, seconds, file }.
 * WAV is read here; mp3, ogg, m4a, flac and the rest are decoded with
 * Remotion's ffmpeg (npx remotion ffmpeg).
 */
export function readAudio(file) {
  if (!fs.existsSync(file)) throw new Error(`no such file: ${file}`);
  let ch, sr;
  if (/\.wave?$/i.test(file)) ({ ch, sr } = readWav(file));
  else {
    const args = (codec) => ['-v', 'error', '-i', file, '-vn', '-f', 'wav', '-c:a', codec, '-ar', String(SR), '-'];
    let b;
    try { b = ffmpeg(args('pcm_s24le')); } catch { b = ffmpeg(args('pcm_s16le')); }
    ({ ch, sr } = parseWav(b));
  }
  const l0 = resample(ch[0], sr, SR);
  const r0 = ch.length > 1 ? resample(ch[1], sr, SR) : l0;
  let mono = ch.length === 1;
  if (!mono) {
    mono = true;
    for (let i = 0; i < l0.length; i++) if (Math.abs(l0[i] - r0[i]) > 1e-6) { mono = false; break; }
  }
  return { l: l0, r: mono ? l0 : r0, mono, seconds: l0.length / SR, file };
}

/**
 * A recorded sound, ready to place as recorded: levelled so its loudest 20 ms
 * matches a house-level synthesized whoosh (level-match to what was there),
 * plus `trimDb`, its tail cut once it has fallen `tailDb` under its loudest
 * moment, and its `peakAt` found, so `placePeak` lands that on the move.
 * Keep recordings in sound/refs/ (gitignored): most stock licenses let you
 * use a sound in a video but not share the raw file.
 */
export function recording(file, { trimDb = 0, tailDb = -55, bus = 'whoosh' } = {}) {
  const a = readAudio(file);
  const hop = Math.round(0.02 * SR);
  let best = 0, lastLoud = a.l.length;
  const rms = [];
  for (let i = 0; i + hop <= a.l.length; i += hop) {
    let e = 0;
    for (let j = i; j < i + hop; j++) e += ((a.l[j] + a.r[j]) / 2) ** 2;
    const v = Math.sqrt(e / hop);
    rms.push([i, v]);
    best = Math.max(best, v);
  }
  const floor = best * dbToGain(tailDb);
  for (const [i, v] of rms) if (v > floor) lastLoud = i + hop;
  const end = Math.min(a.l.length, lastLoud);
  const k = best > 0 ? (houseWhooshRms() / best) * dbToGain(trimDb) : 1;
  const fade = Math.min(end, Math.round(0.03 * SR));
  const cut = (x) => {
    const y = x.slice(0, end);
    for (let i = 0; i < y.length; i++) y[i] *= k;
    for (let i = 0; i < fade; i++) y[y.length - 1 - i] *= i / fade;
    return y;
  };
  const out = { l: cut(a.l), r: cut(a.r), bus, room: HOUSE.whoosh.room, kind: `recording ${path.basename(file)}` };
  out.peakAt = envelopePeak(out);
  return out;
}

let houseRms = 0;
/** Loudest-20-ms RMS of a default whoosh at house level, the yardstick recordings are levelled to. */
export function houseWhooshRms() {
  // measured centre-panned, as place() would put it, so a recording lands at the level a synthesized whoosh plays at
  if (!houseRms) houseRms = loudestRms(panned(whoosh({ seed: 1 }), 0));
  return houseRms;
}

/* ── analysis ──────────────────────────────────────────────────────────── */

/** In-place radix-2 FFT of re/im (length a power of two). */
export function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -TAU / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < half; k++) {
        const a = i + k, b = a + half;
        const br = re[b] * cr - im[b] * ci;
        const bi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - br; im[b] = im[a] - bi;
        re[a] += br; im[a] += bi;
        const t = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = t;
      }
    }
  }
}
