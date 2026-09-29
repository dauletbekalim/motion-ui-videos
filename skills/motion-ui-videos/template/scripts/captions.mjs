#!/usr/bin/env node
/**
 * Caption files from the words the video says: src/captions.json (the same
 * lines the scenes draw, through useCues) timed by src/cuts.json, with the
 * sound's clock (sound/timeline.mjs), so every line starts on the frame its
 * picture does.
 *
 *   node scripts/captions.mjs <cut> [textKey]
 *
 * Writes out/<textKey>.srt (YouTube, LinkedIn, X, Facebook), out/<textKey>.vtt
 * (a <track> on a landing page) and out/<textKey>.txt (a plain transcript to
 * publish under the player or in the post text, for screen readers). textKey
 * defaults to the cut: pass another block of captions.json (say
 * "showcase-de") for the same picture in another language.
 *
 * - An event starts on its cue and runs until the next one, the end of its
 *   scene or 7 s, whichever is first, and ends 40 ms before the next starts.
 * - A cue pre-rolled before its scene starts (a hook's "title - 0.12", so
 *   frame 0 already shows the line) starts on the scene's first frame, frame
 *   0 for the opening scene: nothing is on screen before that, so its time
 *   on screen counts from there.
 * - Calm lines keep their `|` breaks; any line over 42 characters is broken
 *   near its middle, after punctuation if there is some close by, into at
 *   most two lines.
 * - Punch blocks ("punch": true) join their short cues until a line has had
 *   its reading time: a track of 1–3-word flashes is unreadable in a
 *   player's caption box.
 * - `*emphasis*` marks are dropped. The end card's name, URL and call to
 *   action come from BRAND in src/theme.ts and are not in the file: put the
 *   URL in the post text or the description.
 * - It warns about any event on screen for less than its reading floor
 *   (words ÷ 3 + 1 s): true information about a fast cut, not a bug in the
 *   file.
 *
 * CAPTIONS=file and CUTS=file read other files (the tests use fixtures);
 * OUT=dir writes somewhere other than out/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { at, getCut, scenesOf } from '../sound/timeline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_LINE = 42;
const MAX_EVENT = 7;
const GAP = 0.04;

/** src/captions.json, or the file CAPTIONS names. */
export function loadCaptions(file = process.env.CAPTIONS ? path.resolve(process.env.CAPTIONS) : path.join(root, 'src', 'captions.json')) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** A cue's `at` in scene seconds: a number as it is, or a mark with an optional ± offset (the same rule as src/lib/cues.ts). */
export function cueTime(atSpec, marks, where = '') {
  if (typeof atSpec === 'number') return atSpec;
  const m = String(atSpec).match(/^\s*([A-Za-z_$][\w$]*)\s*(?:([+-])\s*(\d+(?:\.\d+)?|\.\d+))?\s*$/);
  if (!m) throw new Error(`${where}: "${atSpec}" is not a time. Use seconds (0.3), a mark ("promise") or a mark with an offset ("appsIn + 0.2").`);
  const base = marks[m[1]];
  if (!Number.isFinite(base)) throw new Error(`${where}: no mark "${m[1]}" there (have: ${Object.keys(marks).join(', ') || 'none'})`);
  return m[2] ? base + (m[2] === '-' ? -1 : 1) * Number(m[3]) : base;
}

const words = (s) => s.split(/\s+/).filter(Boolean).length;
/** Reading floor for a line a player shows whole: words ÷ 3 + 1 s. */
export const floorOf = (text) => words(text) / 3 + 1;

/** At most two lines of about 42 characters, broken near the middle, after punctuation when there is some close by. */
export function wrap(s) {
  const lines = s.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1 && lines.every((l) => l.length <= MAX_LINE)) return lines.join('\n');
  const flat = lines.join(' ');
  if (flat.length <= MAX_LINE) return flat;
  const mid = flat.length / 2;
  const cost = (i) => Math.abs(i - mid) - (/[.,?!:;…]/.test(flat[i - 1]) ? mid / 3 : 0);
  const spaces = [...flat.matchAll(/ /g)].map((m) => m.index);
  if (!spaces.length) return flat;
  const k = spaces.sort((a, b) => cost(a) - cost(b))[0];
  return `${flat.slice(0, k)}\n${flat.slice(k + 1)}`;
}

/** Seconds → "HH:MM:SS,mmm" (SRT) or "HH:MM:SS.mmm" (VTT). */
export function stamp(sec, sep = ',') {
  const ms = Math.max(0, Math.round(sec * 1000));
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3.6e6))}:${p(Math.floor(ms / 6e4) % 60)}:${p(Math.floor(ms / 1000) % 60)}${sep}${p(ms % 1000, 3)}`;
}

/**
 * The caption events of a cut: [{ start, end, text }] in cut seconds, plus
 * the SRT, VTT and transcript texts and any warnings.
 */
export function buildCaptions(cut, key = cut, captions = loadCaptions()) {
  const text = captions[key];
  if (!text) throw new Error(`no "${key}" in captions.json (have: ${Object.keys(captions).join(', ')})`);
  const plan = getCut(cut);
  const scenes = scenesOf(cut);
  const warnings = [];
  for (const id of Object.keys(text)) if (!scenes.some((s) => s.id === id)) warnings.push(`captions.json › ${key} › ${id}: cut "${cut}" has no scene "${id}"`);
  const cross = plan.cross ?? 0;
  const events = [];
  scenes.forEach((s, i) => {
    const block = text[s.id];
    if (!block?.cues?.length) return;
    // a caption reads until its scene cuts away (the middle of the crossfade)
    const sceneEnd = s.end - (i < scenes.length - 1 ? cross / 2 : 0);
    const merged = [];
    for (const c of block.cues) {
      const where = `captions.json › ${key} › ${s.id}`;
      const sec = cueTime(c.at, s.marks, where);
      // drawn cues are unwarped seconds (as <Captions drawn> reads them); others go through the warp, like the sound.
      // A cue pre-rolled before its scene is first seen on the scene's first frame (frame 0 for the opening one)
      const t = Math.max(s.start, block.drawn ? s.start + sec : at(cut, s.id, sec));
      const line = c.text
        .replace(/\*/g, '')
        .replace(/\s*\|\s*/g, block.punch ? ' ' : '\n')
        .trim();
      const last = merged[merged.length - 1];
      if (block.punch && last?.text && line && t - last.start < floorOf(last.text) && `${last.text} ${line}`.length <= 2 * MAX_LINE) last.text += ` ${line}`;
      else merged.push({ start: t, text: line, sceneEnd });
    }
    events.push(...merged);
  });
  events.sort((a, b) => a.start - b.start);
  const out = [];
  events.forEach((e, i) => {
    if (!e.text) return; // an empty cue only clears the line
    const next = events[i + 1]?.start ?? Infinity;
    let end = Math.min(e.sceneEnd, e.start + MAX_EVENT);
    if (end > next - GAP) end = next - GAP;
    const flat = e.text.replace(/\n/g, ' ');
    if (end - e.start + 1e-6 < floorOf(flat)) warnings.push(`short: "${flat}" is up ${(end - e.start).toFixed(2)} s, needs ${floorOf(flat).toFixed(2)} s`);
    out.push({ start: e.start, end, text: wrap(e.text) });
  });
  const srt = out.map((e, n) => `${n + 1}\n${stamp(e.start)} --> ${stamp(e.end)}\n${e.text}\n`).join('\n');
  const vtt = `WEBVTT\n\n${out.map((e) => `${stamp(e.start, '.')} --> ${stamp(e.end, '.')}\n${e.text}\n`).join('\n')}`;
  const txt = `${out.map((e) => e.text.replace(/\n/g, ' ')).join('\n')}\n`;
  return { events: out, srt, vtt, txt, warnings };
}

function main() {
  const args = process.argv.slice(2);
  const usage = 'usage: node scripts/captions.mjs <cut> [textKey]   (writes out/<textKey>.srt, .vtt and .txt)';
  if (args.includes('--help') || args.includes('-h')) {
    console.log(usage);
    process.exit(0);
  }
  const [cut, key = cut] = args.filter((a) => !a.startsWith('--'));
  if (!cut) {
    console.log(usage);
    process.exit(1);
  }
  let result;
  try {
    result = buildCaptions(cut, key);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  const dir = process.env.OUT ? path.resolve(process.env.OUT) : path.join(root, 'out');
  fs.mkdirSync(dir, { recursive: true });
  for (const ext of ['srt', 'vtt', 'txt']) fs.writeFileSync(path.join(dir, `${key}.${ext}`), result[ext], 'utf8');
  for (const w of result.warnings) console.warn(`  ${w}`);
  const where = path.relative(process.cwd(), path.join(dir, key)).split(path.sep).join('/');
  console.log(`${where}.srt, .vtt and .txt: ${result.events.length} captions`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
