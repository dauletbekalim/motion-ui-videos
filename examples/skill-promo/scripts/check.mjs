#!/usr/bin/env node
/**
 * What a rendered file really is: length, frame rate, size, codecs, and how
 * loud it is (integrated loudness in LUFS and true peak in dBTP, measured by
 * ffmpeg's EBU R128 loudnorm analysis). Uses Remotion's bundled ffprobe/ffmpeg.
 *
 *   node scripts/check.mjs <file> [--target -14]
 *
 * Targets this project mixes to (sound/design.mjs): about −14 LUFS for
 * reels/stories/social, −16 to −18 LUFS for a calm showcase, true peak at or
 * below −1 dBTP everywhere.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const cli = path.join(path.dirname(require.resolve('@remotion/cli/package.json')), 'remotion-cli.js');
const run = (name, args) => spawnSync(process.execPath, [cli, name, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const args = process.argv.slice(2);
const usage = 'usage: node scripts/check.mjs <file> [--target -14]';
if (args.includes('--help') || args.includes('-h')) {
  console.log(usage);
  process.exit(0);
}
const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--target');
const ti = args.indexOf('--target');
const target = ti >= 0 ? Number(args[ti + 1]) : undefined;
if (!file || !fs.existsSync(file)) {
  console.log(file ? `No such file: ${file}
${usage}` : usage);
  process.exit(1);
}

const p = run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file]);
if (p.status !== 0) {
  console.error(p.stderr);
  process.exit(1);
}
const info = JSON.parse(p.stdout);
const v = info.streams.find((s) => s.codec_type === 'video');
const a = info.streams.find((s) => s.codec_type === 'audio');
const bytes = fs.statSync(file).size;
const duration = Number(info.format.duration);
const rate = (r) => {
  const [n, d] = String(r || '0/1').split('/').map(Number);
  return d ? n / d : n;
};
const rows = [
  ['file', path.basename(file)],
  ['duration', `${duration.toFixed(2)} s`],
  ['size', `${(bytes / 1e6).toFixed(2)} MB (${Math.round((bytes * 8) / duration / 1000)} kbps overall)`],
];
if (v) {
  const profile = { 66: 'Baseline', 77: 'Main', 100: 'High' }[v.profile] ?? v.profile ?? '';
  const range = v.color_range === 'pc' || /^yuvj/.test(v.pix_fmt ?? '') ? 'full range' : v.color_range === 'tv' ? 'limited range' : '';
  rows.push(['video', `${v.codec_name} ${profile} ${v.pix_fmt ?? ''} ${range} ${v.color_space && v.color_space !== 'unknown' ? v.color_space : ''}`.replace(/\s+/g, ' ').trim()]);
  rows.push(['resolution', `${v.width}×${v.height} (${v.width > v.height ? 'landscape' : v.width < v.height ? 'portrait' : 'square'})`]);
  rows.push(['fps', `${rate(v.r_frame_rate).toFixed(3).replace(/\.?0+$/, '')}`]);
}
const notes = [];
if (a) {
  rows.push(['audio', `${a.codec_name} ${a.sample_rate} Hz ${a.channels} ch${a.bit_rate ? ` ${Math.round(a.bit_rate / 1000)} kbps` : ''}`]);
  const l = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-']);
  const json = (l.stderr || '').match(/\{[\s\S]*?"input_i"[\s\S]*?\}/);
  if (json) {
    const m = JSON.parse(json[0]);
    const I = Number(m.input_i);
    const TP = Number(m.input_tp);
    rows.push(['loudness', `${I.toFixed(1)} LUFS integrated, ${Number(m.input_lra).toFixed(1)} LU range`]);
    rows.push(['true peak', `${TP.toFixed(1)} dBTP`]);
    if (TP > -1) notes.push(`true peak ${TP.toFixed(1)} dBTP is above −1: platforms' encoders may clip it. Lower the master in sound/design.mjs.`);
    if (target !== undefined && Math.abs(I - target) > 1) notes.push(`${I.toFixed(1)} LUFS is ${Math.abs(I - target).toFixed(1)} LU ${I > target ? 'louder' : 'quieter'} than the ${target} target.`);
    if (I < -60) notes.push('the audio is (nearly) silent.');
  } else {
    rows.push(['loudness', 'could not measure']);
  }
} else {
  rows.push(['audio', 'none']);
}
if (v && (v.width % 2 || v.height % 2)) notes.push('odd width or height: H.264 players may refuse it.');
if (v && v.pix_fmt && v.pix_fmt !== 'yuv420p' && info.format.format_name.includes('mp4')) notes.push(`${v.pix_fmt} is full-range: fine to watch locally, but run scripts/encode.mjs (limited-range BT.709 yuv420p) before uploading.`);
if (bytes > 10e6 && v && v.height > v.width) notes.push('over 10 MB: some Instagram upload tools refuse it. node scripts/encode.mjs instagram <file> --max-mb 9');

const w = Math.max(...rows.map((r) => r[0].length));
for (const [k, val] of rows) console.log(`${k.padEnd(w)}  ${val}`);
for (const n of notes) console.log(`note: ${n}`);
