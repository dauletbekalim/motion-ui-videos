// sound/tools/spectrogram.mjs: a picture of a sound, for when you can't listen.
// Log-frequency axis (30 Hz to 20 kHz, labelled), time in seconds, loudness as
// colour (dark = quiet, yellow = loud). Several files stack on one shared time
// and level scale, so a reference and the sound grown from it can be compared
// side by side at a glance: same colour means same level.
//
//   node sound/tools/spectrogram.mjs file.wav out.png [--from s --to s]
//   node sound/tools/spectrogram.mjs ref.wav grown-1.wav grown-2.wav out.png
//
// Pure JS: the PNG is written here with zlib, nothing to install.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { SR, fft, readAudio } from '../engine.mjs';

/* ── PNG ───────────────────────────────────────────────────────────────── */

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Write an RGB image (Buffer of w*h*3 bytes) as a PNG. Creates the folder. */
export function writePng(file, w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
  return file;
}

/* ── a 3x5 pixel font, for labels ──────────────────────────────────────── */

const GLYPHS = {
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001',
  5: '111100111001111', 6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111',
  a: '010101111101101', b: '110101110101110', c: '011100100100011', d: '110101101101110', e: '111100110100111',
  f: '111100110100100', g: '011100101101011', h: '101101111101101', i: '111010010010111', j: '001001001101010',
  k: '101101110101101', l: '100100100100111', m: '101111111101101', n: '110101101101101', o: '010101101101010',
  p: '110101110100100', q: '010101101110011', r: '110101110101101', s: '011100010001110', t: '111010010010010',
  u: '101101101101111', v: '101101101101010', w: '101101111111101', x: '101101010101101', y: '101101010010010',
  z: '111001010100111', '.': '000000000000010', '-': '000000111000000', _: '000000000000111', ':': '000010000010000',
  '/': '001001010100100', '(': '010100100100010', ')': '010001001001010', '%': '101001010100101', '+': '000010111010000',
  ' ': '000000000000000', '·': '000000010000000', ',': '000000000010100', '=': '000111000111000', '#': '101111101111101',
  '[': '110100100100110', ']': '011001001001011', '?': '111001010000010', '>': '100010001010100', '<': '001010100010001',
};

/** Draw `text` into an RGB image at (x, y), `scale` pixels per font pixel. Returns the width drawn. */
export function drawText(img, W, H, x, y, text, color = [230, 230, 230], scale = 2) {
  let cx = x;
  for (const ch of String(text).toLowerCase()) {
    const g = GLYPHS[ch] ?? GLYPHS['?'];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 3; c++) {
        if (g[r * 3 + c] !== '1') continue;
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const px = cx + c * scale + dx, py = y + r * scale + dy;
            if (px < 0 || py < 0 || px >= W || py >= H) continue;
            img.set(color, (py * W + px) * 3);
          }
        }
      }
    }
    cx += 4 * scale;
  }
  return cx - x;
}

/* ── the spectrogram ───────────────────────────────────────────────────── */

// magma-ish: black → purple → orange → pale yellow
const STOPS = [[0, 0, 4], [28, 16, 68], [79, 18, 123], [129, 37, 129], [181, 54, 122], [229, 80, 100], [251, 135, 97], [254, 194, 135], [252, 253, 191]];
function colour(v) {
  const x = Math.max(0, Math.min(1, v)) * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(x)), f = x - i;
  return STOPS[i].map((c, k) => Math.round(c + (STOPS[i + 1][k] - c) * f));
}

/** Power spectra of mono `x` every `hop` samples: [{ t, p: Float64Array(N/2) }]. */
export function stft(x, N = 2048, hop = 256) {
  const win = Float64Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
  const frames = [];
  for (let s = -N / 2; s < x.length - N / 2 + hop; s += hop) {
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) { const j = s + i; if (j >= 0 && j < x.length) re[i] = x[j] * win[i]; }
    fft(re, im);
    const p = new Float64Array(N / 2);
    for (let k = 0; k < N / 2; k++) p[k] = (re[k] * re[k] + im[k] * im[k]) / ((N * N) / 4);
    frames.push({ t: (s + N / 2) / SR, p });
  }
  return frames;
}

const F0 = 30, F1 = 20000;
const fmtHz = (f) => (f >= 1000 ? `${+(f / 1000).toFixed(f >= 10000 ? 0 : 1)}k` : `${Math.round(f)}`);

/**
 * Draw sounds ({ name, l, r } at 48 kHz) as stacked spectrogram panels on a
 * shared time and level scale, write the PNG, and return a line of numbers per
 * sound: where it is audible (within 30 dB of its peak), when it peaks, and
 * the frequencies under which 10/50/90% of its energy sits.
 */
export function spectrogram(sounds, out, { from = 0, to = Infinity, range = 70 } = {}) {
  const mids = sounds.map((s) => {
    const a = Math.round(from * SR), b = Math.min(s.l.length, Math.round(Math.min(to, s.l.length / SR) * SR));
    const m = new Float32Array(Math.max(0, b - a));
    for (let i = 0; i < m.length; i++) m[i] = (s.l[a + i] + (s.r ?? s.l)[a + i]) / 2;
    return m;
  });
  const maxDur = Math.max(0.05, ...mids.map((m) => m.length / SR));
  const pxPerSec = Math.min(800, 1400 / maxDur);
  const hop = Math.max(16, Math.round(SR / pxPerSec));
  const N = hop < 200 ? 1024 : 2048;
  const specs = mids.map((m) => stft(m, N, hop));
  let top = -Infinity;
  for (const fr of specs) for (const f of fr) for (let k = 1; k < f.p.length; k++) top = Math.max(top, 10 * Math.log10(f.p[k] + 1e-30));
  const PH = 240, LABEL = 20, AXIS = 16, LEFT = 44, RIGHT = 10, GAP = 10;
  const plotW = Math.max(200, ...specs.map((s) => s.length));
  const W = LEFT + plotW + RIGHT;
  const panelH = LABEL + PH + AXIS;
  const H = panelH * sounds.length + GAP * (sounds.length - 1);
  const img = Buffer.alloc(W * H * 3, 0);
  for (let i = 0; i < W * H; i++) img.set([22, 22, 26], i * 3);
  const lines = [];
  specs.forEach((fr, p) => {
    const y0 = p * (panelH + GAP);
    // the plot
    for (let x = 0; x < fr.length; x++) {
      const { p: pw } = fr[x];
      for (let y = 0; y < PH; y++) {
        const f = F0 * (F1 / F0) ** (1 - y / (PH - 1));
        const kf = (f * N) / SR;
        const k0 = Math.max(1, Math.min(N / 2 - 2, Math.floor(kf))), fk = Math.max(0, Math.min(1, kf - k0));
        const pow = pw[k0] * (1 - fk) + pw[k0 + 1] * fk;
        const db = 10 * Math.log10(pow + 1e-30);
        img.set(colour((db - (top - range)) / range), ((y0 + LABEL + y) * W + LEFT + x) * 3);
      }
    }
    // frequency grid and labels
    for (const f of [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]) {
      const y = Math.round((1 - Math.log(f / F0) / Math.log(F1 / F0)) * (PH - 1));
      const major = f === 100 || f === 1000 || f === 10000;
      for (let x = 0; x < fr.length; x += major ? 2 : 6) img.set([110, 110, 120], ((y0 + LABEL + y) * W + LEFT + x) * 3);
      drawText(img, W, H, 2, y0 + LABEL + Math.max(0, Math.min(PH - 10, y - 5)), fmtHz(f), major ? [220, 220, 230] : [140, 140, 150]);
    }
    // time ticks: every 0.1, 0.5, 1, 2 or 5 s, whichever gives room
    const dur = fr.length * (hop / SR);
    const every = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30].find((e) => (e * SR) / hop >= 60) ?? 60;
    for (let t = 0; t <= dur + 1e-9; t += every) {
      const x = Math.round((t * SR) / hop);
      if (x >= fr.length) break;
      for (let y = 0; y < PH; y += 3) img.set([90, 90, 100], ((y0 + LABEL + y) * W + LEFT + x) * 3);
      const label = `${+(t + from).toFixed(2)}s`;
      drawText(img, W, H, LEFT + x - (x > 0 ? 8 : 0), y0 + LABEL + PH + 3, label, [170, 170, 180]);
    }
    // numbers
    const e = fr.map((f) => f.p.reduce((s, v) => s + v, 0));
    const peak = e.indexOf(Math.max(...e));
    const loud = (v) => v > e[peak] * 1e-3;
    const on = Math.max(0, e.findIndex(loud));
    const off = e.length - 1 - Math.max(0, [...e].reverse().findIndex(loud));
    const avg = new Float64Array(N / 2);
    for (let x = on; x <= off; x++) for (let k = 0; k < N / 2; k++) avg[k] += fr[x].p[k];
    const pct = (q) => {
      const tot = avg.reduce((s, v) => s + v, 0);
      let c = 0;
      for (let k = 0; k < avg.length; k++) { c += avg[k]; if (c >= tot * q) return (k * SR) / N; }
      return SR / 2;
    };
    const t = (x) => (fr[x]?.t ?? 0) + from;
    const line = `${sounds[p].name}: ${(mids[p].length / SR).toFixed(2)} s · audible ${t(on).toFixed(2)}–${t(off).toFixed(2)} s · peak ${t(peak).toFixed(2)} s · energy 10/50/90% under ${fmtHz(pct(0.1))}/${fmtHz(pct(0.5))}/${fmtHz(pct(0.9))} Hz`;
    lines.push(line);
    drawText(img, W, H, 4, y0 + 5, `${sounds[p].name}  ·  peak ${t(peak).toFixed(2)}s  ·  half the energy under ${fmtHz(pct(0.5))} hz`, [240, 240, 245]);
  });
  writePng(out, W, H, img);
  return lines;
}

/* ── CLI ───────────────────────────────────────────────────────────────── */

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const usage = 'usage: node sound/tools/spectrogram.mjs file.wav [more.wav ...] out.png [--from s --to s]';
  if (args.includes('--help') || args.includes('-h')) {
    console.log(usage);
    process.exit(0);
  }
  const opt = (name) => { const i = args.indexOf(name); if (i < 0) return undefined; const v = Number(args[i + 1]); args.splice(i, 2); return v; };
  const from = opt('--from') ?? 0;
  const to = opt('--to') ?? Infinity;
  const out = args.find((a) => /\.png$/i.test(a));
  const files = args.filter((a) => a !== out);
  if (!out || !files.length) {
    console.log(usage);
    process.exit(1);
  }
  const sounds = files.map((f) => ({ name: path.basename(f), ...readAudio(f) }));
  for (const line of spectrogram(sounds, out, { from, to })) console.log(line);
  console.log(`wrote ${out}`);
}
