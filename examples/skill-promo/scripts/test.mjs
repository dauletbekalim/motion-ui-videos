#!/usr/bin/env node
// scripts/test.mjs: checks the picture-side scripts without rendering.
//
//   node scripts/test.mjs
//
// Contact-sheet defaults (a page stays under 1,600 px wide, 12 tiles a page,
// stale pages removed), the encode presets' colour filter (zscale, never
// swscale's out_range), the caption export (timing through the warp, punch
// cues joined, pre-rolls counted from frame 0, SRT/VTT stamps, wrapping)
// against fixtures, and the demo's
// src/captions.json against src/cuts.json. Writes a few tiny PNGs under
// out/stills/ and removes them. Exits non-zero if anything fails.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const FIXTURE_CUTS = path.join(ROOT, 'sound', 'test', 'fixture-cuts.json');

let passed = 0;
let failed = 0;
async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok    ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL  ${name}\n        ${String(e.message).split('\n').join('\n        ')}`);
  }
}
const section = (title) => console.log(`\n${title}`);
const node = (args, env = {}) => execFileSync(process.execPath, args, { cwd: ROOT, env: { ...process.env, ...env }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/* ── a tiny PNG writer and a header reader ─────────────────────────────── */

const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
const chunk = (kind, data) => {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(kind, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
};
/** A solid-grey 8-bit RGB PNG. */
function png(width, height, grey = 40) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc((width * 3 + 1) * height, grey);
  for (let y = 0; y < height; y++) raw[y * (width * 3 + 1)] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const size = (file) => {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

/* ── contact sheets ─────────────────────────────────────────────────────── */

section('sheet.mjs defaults');
{
  const stills = path.join(ROOT, 'out', 'stills');
  const out = path.join(ROOT, 'out');
  fs.mkdirSync(stills, { recursive: true });
  const cleanup = () => {
    for (const d of [stills, out]) for (const f of fs.readdirSync(d)) if (f.includes('zz-sheettest')) fs.rmSync(path.join(d, f), { force: true });
  };
  cleanup();
  try {
    // 5 portrait stills (9:16) and 14 landscape ones (16:9), tiny: the sheet scales them to its tile size
    for (let i = 0; i < 5; i++) fs.writeFileSync(path.join(stills, `zz-sheettest-p-${i}.00.png`), png(54, 96, 30 + i * 20));
    for (let i = 0; i < 14; i++) fs.writeFileSync(path.join(stills, `zz-sheettest-l-${i}.00.png`), png(96, 54, 30 + i * 10));
    // a page left over from an earlier, longer run
    fs.writeFileSync(path.join(out, 'sheet-zz-sheettest-l-p3.png'), png(4, 4));

    await check('portrait: 4 columns of 270 px (1,190 px wide), one sheet for 5 stills', () => {
      node([path.join(HERE, 'sheet.mjs'), 'zz-sheettest-p']);
      assert.deepEqual(size(path.join(out, 'sheet-zz-sheettest-p.png')), { w: 28 * 2 + 4 * 270 + 3 * 18, h: 28 * 2 + 2 * (480 + 26) + 18 });
      assert.ok(!fs.existsSync(path.join(out, 'sheet-zz-sheettest-p-p1.png')), 'no pages for 12 stills or fewer');
    });
    await check('landscape: 3 columns of 480 px (1,532 px wide), pages of 12, stale pages removed', () => {
      node([path.join(HERE, 'sheet.mjs'), 'zz-sheettest-l']);
      const p1 = size(path.join(out, 'sheet-zz-sheettest-l-p1.png'));
      assert.deepEqual(p1, { w: 28 * 2 + 3 * 480 + 2 * 18, h: 28 * 2 + 4 * (270 + 26) + 3 * 18 });
      assert.ok(p1.w < 1600, `a page is ${p1.w} px wide`);
      assert.deepEqual(size(path.join(out, 'sheet-zz-sheettest-l-p2.png')), { w: 28 * 2 + 2 * 480 + 18, h: 28 * 2 + 270 + 26 });
      assert.ok(!fs.existsSync(path.join(out, 'sheet-zz-sheettest-l-p3.png')), 'the stale p3 is gone');
    });
    await check('--cols and --per still win', () => {
      node([path.join(HERE, 'sheet.mjs'), 'zz-sheettest-l', '--cols', '2', '--per', '8']);
      assert.equal(size(path.join(out, 'sheet-zz-sheettest-l-p1.png')).w, 28 * 2 + 2 * 480 + 18);
      assert.ok(fs.existsSync(path.join(out, 'sheet-zz-sheettest-l-p2.png')) && !fs.existsSync(path.join(out, 'sheet-zz-sheettest-l-p3.png')), '14 stills in pages of 8 are 2 pages');
    });
  } finally {
    cleanup();
  }
}

/* ── encode presets ─────────────────────────────────────────────────────── */

section('encode.mjs colour conversion');
{
  const { videoFilter, gifFilter, zscaleIn } = await import('./encode.mjs');
  const render = { pix_fmt: 'yuvj420p', color_range: 'pc', color_space: 'bt470bg' };
  await check('a Remotion render: zscale to limited-range BT.709 yuv420p, reading its own tags', () => {
    assert.equal(videoFilter({ stream: render }), 'zscale=matrix=709:range=limited,format=yuv420p');
  });
  await check('--width resizes after the conversion, lanczos, even height', () => {
    assert.equal(videoFilter({ width: 720, stream: render }), 'zscale=matrix=709:range=limited,format=yuv420p,scale=720:-2:flags=lanczos');
  });
  await check('an untagged file gets input tags instead of stopping zscale', () => {
    assert.deepEqual(zscaleIn({ pix_fmt: 'yuv420p' }), ['matrixin=709', 'rangein=limited']);
    assert.deepEqual(zscaleIn({ pix_fmt: 'yuvj420p', color_space: 'unknown' }), ['matrixin=709', 'rangein=full']);
    assert.equal(videoFilter({ stream: { pix_fmt: 'yuv420p' } }), 'zscale=matrix=709:range=limited:matrixin=709:rangein=limited,format=yuv420p');
  });
  await check('the GIF goes to RGB through zscale before its palette', () => {
    const f = gifFilter({ width: 400, stream: render });
    assert.ok(f.startsWith('[0:v]zscale,format=gbrp,scale=400:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p]'), f);
  });
  await check('no preset converts range with swscale (out_range darkened shadows 1–2 levels)', () => {
    const src = fs.readFileSync(path.join(HERE, 'encode.mjs'), 'utf8');
    const code = src.slice(src.indexOf('import '));
    assert.ok(!/out_range|out_color_matrix/.test(code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')), 'swscale range conversion is back in encode.mjs');
  });
}

/* ── caption export ─────────────────────────────────────────────────────── */

section('captions.mjs');
{
  process.env.CUTS = FIXTURE_CUTS;
  const C = await import('./captions.mjs');
  const fixture = {
    showcase: {
      hook: { cues: [{ at: 'title', text: 'A calm | line.' }, { at: 'sub + 0.1', text: '*Two* words here now.' }] },
      problem: { cues: [{ at: 1.2, text: '' }] },
      nope: { cues: [{ at: 0, text: 'not in the cut' }] },
    },
    reel: {
      demo: { punch: true, cues: [{ at: 'click', text: 'One.' }, { at: 'paletteOpen', text: 'Two | three.' }] },
      end: { drawn: true, cues: [{ at: 0.5, text: 'Drawn time.' }] },
    },
  };
  await check('calm cues: on their marks (± offsets), | kept as a line break, * dropped, 40 ms gaps, scene ends', () => {
    const r = C.buildCaptions('showcase', 'showcase', fixture);
    assert.equal(r.events.length, 2, 'the empty cue only clears the line');
    assert.deepEqual(r.events[0], { start: 0.3, end: 1.5 - 0.04, text: 'A calm\nline.' });
    // hook runs 0–4 s and cuts away in the middle of the 0.4 s crossfade
    assert.equal(r.events[1].text, 'Two words here now.');
    assert.ok(Math.abs(r.events[1].start - 1.5) < 1e-9 && Math.abs(r.events[1].end - 3.8) < 1e-9, JSON.stringify(r.events[1]));
    assert.ok(r.srt.startsWith('1\n00:00:00,300 --> 00:00:01,460\nA calm\nline.\n\n2\n00:00:01,500 --> 00:00:03,800\nTwo words here now.\n'), r.srt);
    assert.ok(r.vtt.startsWith('WEBVTT\n\n00:00:00.300 --> 00:00:01.460\n'), r.vtt);
    assert.equal(r.txt, 'A calm line.\nTwo words here now.\n');
    assert.ok(r.warnings.some((w) => w.includes('has no scene "nope"')), r.warnings.join('\n'));
    assert.ok(r.warnings.some((w) => w.startsWith('short: "A calm line."')), 'a line under its reading floor is named');
  });
  await check('punch cues: timed through the warp, joined until readable; drawn cues skip the warp', () => {
    const r = C.buildCaptions('reel', 'reel', fixture);
    // demo starts at 5.0 s in the reel (2.4 + 3 − 2 × 0.2); click (scene 1.0 s) is drawn at 1.0 × 2/3 through the warp
    assert.equal(r.events[0].text, 'One. Two three.');
    assert.ok(Math.abs(r.events[0].start - (5 + 2 / 3)) < 1e-6, String(r.events[0].start));
    // end, after demo (6 s) and reveal (3 s), starts at 13.6 s; 0.5 drawn seconds in
    assert.ok(Math.abs(r.events[1].start - 14.1) < 1e-6, String(r.events[1].start));
  });
  await check('a pre-rolled cue counts from the first frame its scene is on screen (frame 0 for the opening scene)', () => {
    // hook runs 0–2.4 s and cuts away at 2.3 (the middle of the 0.2 s crossfade); its cue is 0.3 s before frame 0.
    // Four words need 2.33 s: counted from the pre-roll they would pass (2.6 s), but only 2.3 s are on screen
    const hook = { punch: true, cues: [{ at: 'title - 0.4', text: 'Four words right here.' }] };
    const r = C.buildCaptions('reel', 'reel', { reel: { hook } });
    assert.equal(r.events[0].start, 0);
    assert.ok(r.srt.startsWith('1\n00:00:00,000 --> 00:00:02,300\n'), r.srt);
    assert.ok(r.warnings.includes('short: "Four words right here." is up 2.30 s, needs 2.33 s'), r.warnings.join('\n'));
    // a later scene's pre-roll starts where that scene does (problem, at 2.2 s), and the line before it gives way there
    const r2 = C.buildCaptions('reel', 'reel', { reel: { hook, problem: { cues: [{ at: -0.5, text: 'Early.' }] } } });
    assert.ok(Math.abs(r2.events[1].start - 2.2) < 1e-9, String(r2.events[1].start));
    assert.ok(Math.abs(r2.events[0].end - (2.2 - 0.04)) < 1e-9, String(r2.events[0].end));
  });
  await check('another text key reads its own words over the same timing', () => {
    const r = C.buildCaptions('showcase', 'showcase-de', { 'showcase-de': { hook: { cues: [{ at: 'title', text: 'Eine ruhige Zeile.' }] } } });
    assert.deepEqual(r.events.map((e) => e.text), ['Eine ruhige Zeile.']);
  });
  await check('wrap: two lines of at most 42 characters, near the middle, after punctuation when close', () => {
    const w = C.wrap('Every note your team writes, in one calm place, found in a second.');
    const lines = w.split('\n');
    assert.equal(lines.length, 2);
    assert.ok(lines.every((l) => l.length <= 42), w);
    assert.ok(/,$/.test(lines[0]), `breaks after the comma: ${w}`);
    assert.equal(C.wrap('Short line.'), 'Short line.');
  });
  await check('stamps and times: SRT comma, VTT dot; bad times fail with the fix', () => {
    assert.equal(C.stamp(3661.5), '01:01:01,500');
    assert.equal(C.stamp(0.04, '.'), '00:00:00.040');
    assert.equal(C.cueTime('keys - 0.3', { keys: 4.6 }), 4.3);
    assert.equal(C.cueTime(' promise ', { promise: 1.9 }), 1.9);
    assert.throws(() => C.cueTime('keys * 2', { keys: 1 }), /not a time/);
    assert.throws(() => C.cueTime('nokey', { keys: 1 }), /no mark "nokey"/);
  });
  await check("the time rule matches src/lib/cues.ts (the picture's copy)", () => {
    const pick = (file) => fs.readFileSync(file, 'utf8').match(/match\((\/\^.*?\$\/)\)/)[1];
    assert.equal(pick(path.join(HERE, 'captions.mjs')), pick(path.join(ROOT, 'src', 'lib', 'cues.ts')));
  });
  delete process.env.CUTS;
  await check('the demo: every block of src/captions.json is a scene of its cut, and every cue resolves', () => {
    const captions = C.loadCaptions();
    const cuts = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'cuts.json'), 'utf8'));
    for (const key of Object.keys(captions)) {
      if (!cuts[key]) continue; // a translation over another cut's timing
      const r = C.buildCaptions(key, key, captions);
      assert.ok(r.events.length > 0, `${key}: no captions`);
      assert.deepEqual(r.warnings.filter((w) => !w.startsWith('short:')), [], key);
    }
  });
  await check('CLI writes .srt, .vtt and .txt (to OUT here), and --help exits 0', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'captions-test-'));
    try {
      const o = node([path.join(HERE, 'captions.mjs'), 'story'], { OUT: dir });
      assert.match(o, /story\.srt, \.vtt and \.txt: 1 captions/);
      for (const ext of ['srt', 'vtt', 'txt']) assert.ok(fs.existsSync(path.join(dir, `story.${ext}`)), ext);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    for (const script of ['captions.mjs', 'encode.mjs', 'sheet.mjs', 'stills.mjs', 'check.mjs']) assert.match(node([path.join(HERE, script), '--help']), /^usage: node scripts\//, script);
  });
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
