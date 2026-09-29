#!/usr/bin/env node
/**
 * Tile a cut's stills into one contact sheet, with gaps between the tiles
 * and a label under each (time and mark). Gaps matter: tiles that touch
 * merge text across frames and fool you into seeing things that aren't there.
 *
 *   node scripts/sheet.mjs <cut> [--safe] [--cols N] [--tile px] [--per N]
 *
 * Reads out/stills/<cut>-<seconds>.png (from scripts/stills.mjs), writes
 * out/sheet-<cut>.png (or out/sheet-<cut>-safe.png). When there are more
 * than --per stills, it also writes pages of that many (sheet-<cut>-p1.png,
 * -p2.png…): an image viewer that shrinks a very tall sheet to fit shrinks
 * every tile with it, and a page keeps each tile big enough to read.
 *
 * Defaults keep a page under 1,600 px wide, so it reaches you unshrunk:
 * portrait stills 4 columns of 270 px (1,190 px wide), landscape and square
 * 3 of 480 (1,532 px), 12 tiles a page.
 * Pure Node (zlib only): Remotion's bundled ffmpeg has no tile or drawtext
 * filter, and this keeps the sheet dependency-free on every platform.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const usage = 'usage: node scripts/sheet.mjs <cut> [--safe] [--cols N] [--tile px] [--per N]';
if (args.includes('--help') || args.includes('-h')) {
  console.log(usage);
  process.exit(0);
}
const value = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const cut = args.find((a, i) => !a.startsWith('--') && !['--cols', '--tile', '--per'].includes(args[i - 1]));
if (!cut) {
  console.log(usage);
  process.exit(1);
}
const dir = path.join(root, 'out', 'stills');
/** A prefix's stills (out/stills/<prefix>-<seconds>.png), in time order. */
const stillsOf = (prefix) => {
  const pattern = new RegExp(`^${prefix}-(\\d+\\.\\d+)\\.png$`);
  return fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .map((f) => ({ f, m: f.match(pattern) }))
        .filter((x) => x.m)
        .sort((a, b) => Number(a.m[1]) - Number(b.m[1]))
    : [];
};
let prefix = `${cut}${args.includes('--safe') ? '-safe' : ''}`;
let files = stillsOf(prefix);
// only the safe-zone set was rendered (stills.mjs --safe): tile that rather than stop
if (!files.length && !args.includes('--safe') && stillsOf(`${cut}-safe`).length) {
  prefix = `${cut}-safe`;
  files = stillsOf(prefix);
  console.log(`No plain stills for "${cut}"; tiling the --safe set.`);
}
if (!files.length) {
  console.log(`No stills for "${prefix}" in out/stills. Run: node scripts/stills.mjs ${cut}${prefix.endsWith('-safe') ? ' --safe' : ''}`);
  process.exit(1);
}
const labels = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, `${prefix}.json`), 'utf8'));
  } catch {
    return {};
  }
})();

/* ── PNG in and out ─────────────────────────────────────────────────────── */

function decodePng(buf) {
  let p = 8;
  let width = 0;
  let height = 0;
  let type = 0;
  let depth = 8;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const kind = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (kind === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      type = data[9];
      if (data[12] !== 0) throw new Error('interlaced PNGs are not supported');
    } else if (kind === 'IDAT') idat.push(data);
    else if (kind === 'IEND') break;
    p += 12 + len;
  }
  if (depth !== 8) throw new Error(`only 8-bit PNGs are supported (got ${depth}-bit)`);
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[type];
  if (!channels) throw new Error(`unsupported PNG colour type ${type}`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(width * height * 3);
  let prev = Buffer.alloc(stride);
  const line = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? line[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      let v = src[i];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const pp = a + b - c;
        const pa = Math.abs(pp - a);
        const pb = Math.abs(pp - b);
        const pc = Math.abs(pp - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      line[i] = v & 255;
    }
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 3;
      const s = x * channels;
      if (channels >= 3) {
        out[o] = line[s];
        out[o + 1] = line[s + 1];
        out[o + 2] = line[s + 2];
      } else {
        out[o] = out[o + 1] = out[o + 2] = line[s];
      }
    }
    prev = Buffer.from(line);
  }
  return { width, height, rgb: out };
}

const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(kind, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(kind, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}
function encodePng(width, height, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0;
    rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))]);
}

/** Area-average downscale (each output pixel is the mean of the source pixels it covers). */
function resize(img, w, h) {
  const { width: W, height: H, rgb } = img;
  const weights = (n, m) => {
    const s = n / m;
    return Array.from({ length: m }, (_, o) => {
      const a = o * s;
      const b = a + s;
      const list = [];
      for (let i = Math.floor(a); i < Math.min(n, Math.ceil(b)); i++) list.push([i, (Math.min(b, i + 1) - Math.max(a, i)) / s]);
      return list;
    });
  };
  const wx = weights(W, w);
  const wy = weights(H, h);
  const tmp = new Float32Array(w * H * 3);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < w; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (const [i, k] of wx[x]) {
        const s = (y * W + i) * 3;
        r += rgb[s] * k;
        g += rgb[s + 1] * k;
        b += rgb[s + 2] * k;
      }
      const o = (y * w + x) * 3;
      tmp[o] = r;
      tmp[o + 1] = g;
      tmp[o + 2] = b;
    }
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (const [j, k] of wy[y]) {
        const s = (j * w + x) * 3;
        r += tmp[s] * k;
        g += tmp[s + 1] * k;
        b += tmp[s + 2] * k;
      }
      const o = (y * w + x) * 3;
      out[o] = Math.round(r);
      out[o + 1] = Math.round(g);
      out[o + 2] = Math.round(b);
    }
  return { width: w, height: h, rgb: out };
}

/* ── a 5×7 pixel font for the labels ────────────────────────────────────── */

const GLYPHS = {
  0: '.###.#...##..###.#.###..##...#.###.', 1: '..#...##....#....#....#....#...###.', 2: '.###.#...#....#...#...#...#...#####',
  3: '####.....#....#.###.....#....#####.', 4: '...#...##..#.#.#..#.#####...#....#.', 5: '######....####.....#....##...#.###.',
  6: '..##..#...#....####.#...##...#.###.', 7: '#####....#...#...#...#....#....#...', 8: '.###.#...##...#.###.#...##...#.###.',
  9: '.###.#...##...#.####....#...#..##..', a: '...........###.....#.#####...#.####', b: '#....#....####.#...##...##...#####.',
  c: '...........###.#....#....#...#.###.', d: '....#....#.#####...##...##...#.####', e: '...........###.#...#######.....###.',
  f: '..##..#..#.#...###...#....#....#...', g: '......#####...##...#.####....#.###.', h: '#....#....#.##.##..##...##...##...#',
  i: '..#........##....#....#....#...###.', j: '...#........##....#....#.#..#..##..', k: '#....#....#..#.#.#..##...#.#..#..#.',
  l: '.##....#....#....#....#....#...###.', m: '..........##.#.#.#.##.#.##...##...#', n: '..........#.##.##..##...##...##...#',
  o: '...........###.#...##...##...#.###.', p: '..........####.#...#####.#....#....', q: '...........##.##..##.####....#....#',
  r: '..........#.##.##..##....#....#....', s: '...........#####.....###.....#####.', t: '.#....#...###...#....#....#..#..##.',
  u: '..........#...##...##...##..##.##.#', v: '..........#...##...##...#.#.#...#..', w: '..........#...##...##.#.##.#.#.#.#.',
  x: '..........#...#.#.#...#...#.#.#...#', y: '..........#...##...#.####....#.###.', z: '..........#####...#...#...#...#####',
  '.': '..........................##...##..', '-': '...............#####...............', ':': '......##...##........##...##.......',
  '+': '.......#....#..#####..#....#.......', '/': '....#...#....#...#...#....#...#....', ' ': '...................................',
};
function drawText(img, text, x0, y0, color, scale = 2) {
  let x = x0;
  for (const ch of text.toLowerCase()) {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 5; c++) {
        if (g[r * 5 + c] !== '#') continue;
        for (let dy = 0; dy < scale; dy++)
          for (let dx = 0; dx < scale; dx++) {
            const px = x + c * scale + dx;
            const py = y0 + r * scale + dy;
            if (px < 0 || py < 0 || px >= img.width || py >= img.height) continue;
            const o = (py * img.width + px) * 3;
            img.rgb[o] = color[0];
            img.rgb[o + 1] = color[1];
            img.rgb[o + 2] = color[2];
          }
      }
    x += 6 * scale;
  }
}

/* ── lay out the sheet ──────────────────────────────────────────────────── */

const first = decodePng(fs.readFileSync(path.join(dir, files[0].f)));
const portrait = first.height > first.width;
const tileW = Number(value('tile')) || (portrait ? 270 : 480);
const tileH = Math.round((first.height / first.width) * tileW);
const cols = Number(value('cols')) || (portrait ? 4 : 3);
const per = Number(value('per')) || 12;
const gap = 18;
const margin = 28;
const labelH = 26;

// every tile, shrunk once
const tiles = files.map(({ f, m }, n) => {
  const img = n === 0 ? first : decodePng(fs.readFileSync(path.join(dir, f)));
  process.stdout.write(`\r${n + 1}/${files.length}`);
  const label = (labels[f] ?? `${m[1]} s`).replace(/[^a-z0-9.:+/\- ]/gi, ' ');
  return { img: resize(img, tileW, tileH), label };
});

/** One sheet of `list` tiles, written to `file`. */
function write(list, file) {
  const rows = Math.ceil(list.length / cols);
  const n = Math.min(cols, list.length);
  const W = margin * 2 + n * tileW + (n - 1) * gap;
  const H = margin * 2 + rows * (tileH + labelH) + (rows - 1) * gap;
  const sheet = { width: W, height: H, rgb: Buffer.alloc(W * H * 3) };
  // a mid grey between tiles, so dark frames never read as one picture
  for (let i = 0; i < W * H; i++) {
    sheet.rgb[i * 3] = 58;
    sheet.rgb[i * 3 + 1] = 58;
    sheet.rgb[i * 3 + 2] = 64;
  }
  list.forEach(({ img, label }, k) => {
    const x0 = margin + (k % cols) * (tileW + gap);
    const y0 = margin + Math.floor(k / cols) * (tileH + labelH + gap);
    for (let y = 0; y < tileH; y++) img.rgb.copy(sheet.rgb, ((y0 + y) * W + x0) * 3, y * tileW * 3, (y + 1) * tileW * 3);
    for (let y = y0 + tileH; y < y0 + tileH + labelH; y++) sheet.rgb.fill(24, (y * W + x0) * 3, (y * W + x0 + tileW) * 3);
    const maxChars = Math.floor((tileW - 12) / 12);
    drawText(sheet, label.length > maxChars ? label.slice(0, maxChars) : label, x0 + 6, y0 + tileH + 6, [235, 235, 240]);
  });
  fs.writeFileSync(file, encodePng(W, H, sheet.rgb));
  return `${path.relative(root, file)} (${W}×${H})`;
}

const out = path.join(root, 'out', `sheet-${prefix}.png`);
// pages from an earlier, longer run would otherwise linger and mislead
for (const f of fs.readdirSync(path.dirname(out))) if (new RegExp(`^sheet-${prefix}-p\\d+\\.png$`).test(f)) fs.rmSync(path.join(path.dirname(out), f));
console.log(`\n${files.length} stills → ${write(tiles, out)}`);
if (tiles.length > per) {
  for (let p = 0; p * per < tiles.length; p++) {
    const page = path.join(root, 'out', `sheet-${prefix}-p${p + 1}.png`);
    console.log(`  page ${p + 1}: ${write(tiles.slice(p * per, (p + 1) * per), page)}`);
  }
}
