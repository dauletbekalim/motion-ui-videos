#!/usr/bin/env node
/**
 * Re-encode a render for where it is going, with Remotion's bundled ffmpeg
 * (nothing else to install).
 *
 *   node scripts/encode.mjs <preset> <input> [--max-mb N] [--out file] [--width px] [--fps n] [--mute]
 *
 * presets
 *   instagram  H.264 High, yuv420p, AAC 48 kHz, faststart. --max-mb N makes a
 *              two-pass copy at the bitrate that fits (some upload tools cap
 *              at about 10 MB); check text sharpness on stills from it.
 *   tiktok     H.264, CRF 18, AAC 192k, faststart
 *   shorts     H.264, CRF 18, AAC 192k, faststart
 *   youtube    H.264, CRF 16, closed GOP of half the frame rate, AAC 384k
 *   linkedin   H.264, CRF 20, AAC 192k, faststart
 *   x          H.264, CRF 20 capped at 16 Mbps, AAC 192k, faststart
 *   gif        palette-optimised GIF (720 px wide, 400 for portrait; 15 fps; no sound)
 *   webm       VP9 + Opus, for a landing page <video> (muted loops: add --mute)
 *
 * The picture: Remotion writes full-range BT.601 (yuvj420p); every preset
 * converts it to limited-range BT.709 with zscale, which reads the input's
 * tags, and tags the copy so. swscale's `scale=out_range=tv` did the same job
 * but darkened a dark UI's shadows by 1–2 levels (measured on the demo
 * showcase: zscale lands within a fraction of a level of the source).
 *
 * The sound is copied as it is when the render's AAC is already good enough
 * (48 kHz stereo, at least the preset's bitrate or 128 kbps): a second AAC
 * generation smears it and pushes its true peak up by about half a dB, past
 * the -1 dBTP the mix was mastered to leave room for. Otherwise, and when
 * --max-mb needs the room, it is re-encoded at the preset's bitrate.
 *
 * --max-mb works with every H.264 preset. Output defaults to
 * out/<name>-<preset>.<ext>. Numbers behind each preset:
 * skills/motion-ui-videos/references/delivery-and-platforms.md
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

export const PRESETS = ['instagram', 'tiktok', 'shorts', 'youtube', 'linkedin', 'x', 'gif', 'webm'];

/**
 * zscale's input options for a probed video stream. A Remotion render is
 * tagged (bt470bg, full range) and needs none. An untagged file (some screen
 * recordings) makes zscale stop, so assume what an untagged HD file usually
 * is: BT.709, full range only when its pixel format says so (yuvj*).
 */
export function zscaleIn(stream = {}) {
  const opts = [];
  if (!stream.color_space || stream.color_space === 'unknown') opts.push('matrixin=709');
  if (!stream.color_range || stream.color_range === 'unknown') opts.push(`rangein=${String(stream.pix_fmt).startsWith('yuvj') ? 'full' : 'limited'}`);
  return opts;
}

/** The -vf chain for every video preset: limited-range BT.709 yuv420p by zscale, then an optional resize. */
export function videoFilter({ width = 0, stream = {} } = {}) {
  const z = ['matrix=709', 'range=limited', ...zscaleIn(stream)].join(':');
  return `zscale=${z},format=yuv420p${width ? `,scale=${width}:-2:flags=lanczos` : ''}`;
}

/** The GIF's -filter_complex: RGB by zscale (the input's own tags), resized, a palette built from what moves, Bayer dither. */
export function gifFilter({ width, colors = 192, stream = {} }) {
  const z = zscaleIn(stream);
  return `[0:v]zscale${z.length ? `=${z.join(':')}` : ''},format=gbrp,scale=${width}:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=${colors}:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`;
}

/** Run Remotion's ffmpeg or ffprobe. */
function tool(name, args, { quiet = false } = {}) {
  const cli = path.join(path.dirname(require.resolve('@remotion/cli/package.json')), 'remotion-cli.js');
  const r = spawnSync(process.execPath, [cli, name, ...args], { encoding: 'utf8', stdio: quiet ? 'pipe' : ['ignore', 'inherit', 'inherit'], maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    if (quiet) process.stderr.write(r.stderr || '');
    throw new Error(`${name} failed (exit ${r.status})`);
  }
  return r;
}

function main() {
  const args = process.argv.slice(2);
  const usage = `usage: node scripts/encode.mjs <${PRESETS.join('|')}> <input> [--max-mb N] [--out file] [--width px] [--fps n] [--mute]`;
  if (args.includes('--help') || args.includes('-h')) {
    console.log(usage);
    process.exit(0);
  }
  const value = (name) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const positional = args.filter((a, i) => !a.startsWith('--') && !['--max-mb', '--out', '--width', '--fps'].includes(args[i - 1]));
  const [preset, input] = positional;
  if (!PRESETS.includes(preset) || !input) {
    console.log(usage);
    process.exit(1);
  }
  if (!fs.existsSync(input)) {
    console.error(`No such file: ${input}`);
    process.exit(1);
  }

  const probe = JSON.parse(tool('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', input], { quiet: true }).stdout);
  const video = probe.streams.find((s) => s.codec_type === 'video');
  const hasAudio = probe.streams.some((s) => s.codec_type === 'audio') && !args.includes('--mute');
  const duration = Number(probe.format.duration);
  const [num, den] = (video?.r_frame_rate || '30/1').split('/').map(Number);
  const fps = num / (den || 1);

  const ext = preset === 'gif' ? 'gif' : preset === 'webm' ? 'webm' : 'mp4';
  const out = value('out') ?? path.join(root, 'out', `${path.basename(input, path.extname(input))}-${preset}${value('max-mb') ? `-${value('max-mb')}mb` : ''}.${ext}`);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const srcAudio = probe.streams.find((s) => s.codec_type === 'audio');
  const srcKbps = Number(srcAudio?.bit_rate ?? 0) / 1000;
  // the render's own AAC, if it is good enough to pass through untouched (see the header)
  const copyable = (kbps) => hasAudio && srcAudio.codec_name === 'aac' && Number(srcAudio.sample_rate) === 48000 && srcAudio.channels === 2 && srcKbps >= Math.min(kbps, 128) - 8;
  const aac = (kbps, copy = copyable(kbps)) => (!hasAudio ? ['-an'] : copy ? ['-c:a', 'copy'] : ['-c:a', 'aac', '-b:a', `${kbps}k`, '-ar', '48000', '-ac', '2']);
  const h264 = ['-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-movflags', '+faststart'];
  // Phones and feeds expect limited-range BT.709, tagged as such, or blacks lift and colours shift a little after
  // upload. aq-mode=3 moves bits toward dark, flat areas: dark UI with soft gradients bands and blocks first.
  const bt709 = ['-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv:aq-mode=3'];
  const vf = ['-vf', videoFilter({ width: Number(value('width')) || 0, stream: video })];

  const t0 = Date.now();
  if (preset === 'gif') {
    // small enough to embed: 720 px wide for landscape, 400 for portrait
    const width = Number(value('width')) || (video && video.height > video.width ? 400 : 720);
    const rate = Number(value('fps')) || 15;
    // one pass: build a palette from the clip itself, then map every frame onto it
    tool('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', input, '-filter_complex', gifFilter({ width, stream: video }), '-r', String(rate), '-loop', '0', out]);
  } else if (preset === 'webm') {
    tool('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-stats', '-i', input, ...vf, '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-pix_fmt', 'yuv420p', ...(hasAudio ? ['-c:a', 'libopus', '-b:a', '128k'] : ['-an']), out]);
  } else {
    const audioKbps = { instagram: 192, tiktok: 192, shorts: 192, youtube: 384, linkedin: 192, x: 192 }[preset];
    const extra = {
      instagram: [],
      tiktok: [],
      shorts: [],
      youtube: ['-g', String(Math.round(fps / 2)), '-bf', '2', '-flags', '+cgop'],
      linkedin: [],
      x: ['-maxrate', '16M', '-bufsize', '32M'],
    }[preset];
    const maxMb = Number(value('max-mb'));
    if (maxMb > 0) {
      // two passes at the average bitrate that fits: bits available ÷ seconds, less the sound, less 4% for the container
      const totalKbps = (maxMb * 1e6 * 8 * 0.96) / duration / 1000;
      // keep the render's sound when it costs at most a sixth of the budget, else re-encode it at the preset's rate
      const copy = copyable(audioKbps) && srcKbps <= totalKbps / 6;
      const videoKbps = Math.floor(totalKbps - (hasAudio ? (copy ? srcKbps : audioKbps) : 0));
      if (videoKbps < 400) console.warn(`Only ${videoKbps} kbps left for picture: text will smear. Shorten the video or allow more MB.`);
      const log = path.join(os.tmpdir(), `encode-${process.pid}`);
      const common = ['-i', input, ...vf, ...h264, ...bt709, ...extra, '-b:v', `${videoKbps}k`, '-maxrate', `${Math.round(videoKbps * 1.5)}k`, '-bufsize', `${videoKbps * 2}k`, '-passlogfile', log];
      console.log(`two-pass H.264 at ${videoKbps} kbps to fit ${maxMb} MB (${duration.toFixed(2)} s), sound ${!hasAudio ? 'off' : copy ? `copied (${Math.round(srcKbps)} kbps)` : `re-encoded at ${audioKbps} kbps`}`);
      try {
        tool('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...common, '-pass', '1', '-an', '-f', 'null', '-']);
        tool('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-stats', ...common, '-pass', '2', ...aac(audioKbps, copy), out]);
      } finally {
        // the pass logs, even when a pass fails
        for (const f of fs.readdirSync(os.tmpdir())) if (f.startsWith(`encode-${process.pid}`)) fs.rmSync(path.join(os.tmpdir(), f), { force: true });
      }
    } else {
      const crf = { instagram: 18, tiktok: 18, shorts: 18, youtube: 16, linkedin: 20, x: 20 }[preset];
      tool('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-stats', '-i', input, ...vf, ...h264, ...bt709, ...extra, '-crf', String(crf), ...aac(audioKbps), out]);
    }
  }

  const mb = fs.statSync(out).size / 1e6;
  console.log(`\n${path.relative(process.cwd(), out)}  ${mb.toFixed(2)} MB  (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  const cap = Number(value('max-mb'));
  if (cap && mb > cap) console.warn(`Over the ${cap} MB cap by ${(mb - cap).toFixed(2)} MB: run again with a smaller --max-mb.`);
  console.log(`next: node scripts/check.mjs ${path.relative(process.cwd(), out)}`);
}

// run as a command; imported (scripts/test.mjs), it only lends its filter builders
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
