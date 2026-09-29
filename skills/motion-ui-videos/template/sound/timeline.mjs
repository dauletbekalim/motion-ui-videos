// sound/timeline.mjs: the cut's clock in seconds, read from the same
// src/cuts.json the picture reads, with the same math as src/lib/time.ts. So a
// sound placed on a mark lands on the frame where the picture draws that mark,
// in every cut, with or without a warp.
//
// - Scenes play in order; each starts `cross` seconds before the previous one
//   ends (the crossfade overlap of a TransitionSeries).
// - On the frame grid, as the player lays them out: each scene's length and
//   the crossfade are rounded to whole frames at the cut's fps (read from
//   src/formats.ts). With lengths that are whole frames (one decimal place at
//   30 or 60 fps) that changes nothing; with ones that aren't, the sound still
//   lands on the frame the picture really starts each scene on, instead of
//   drifting a little further with every scene.
// - A scene's warp is [drawnSec, sceneSec] knots: the picture draws scene time
//   warp(drawn). Marks are written in scene time, so the sound inverts the warp
//   to find when a mark is drawn.
//
//   import { at, cutDuration } from './timeline.mjs';
//   at('reel', 'demo', 'click')  // → seconds from the start of the reel
//   at('reel', 'demo', 2.4)      // scene seconds work too
//
//   node sound/timeline.mjs [cut]   prints every scene and mark in cut time
//
// CUTS=path/to/cuts.json points everything here at another file (tests use it).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_CUTS = path.join(HERE, '..', 'src', 'cuts.json');
export const DEFAULT_FORMATS = path.join(HERE, '..', 'src', 'formats.ts');

const cache = new Map();

/** Every cut in src/cuts.json (or in env CUTS, or in `file`), parsed and checked. Cached per file. */
export function loadCuts(file = process.env.CUTS ? path.resolve(process.env.CUTS) : DEFAULT_CUTS) {
  if (cache.has(file)) return cache.get(file);
  let cuts;
  try {
    cuts = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`could not read cuts from ${file}: ${e.message}`);
  }
  for (const [id, cut] of Object.entries(cuts)) check(id, cut);
  cache.set(file, cuts);
  return cuts;
}

function check(id, cut) {
  const where = `cuts.json › ${id}`;
  if (!Array.isArray(cut.scenes) || cut.scenes.length === 0) throw new Error(`${where}: needs a non-empty "scenes" list`);
  const cross = cut.cross ?? 0;
  if (!(cross >= 0)) throw new Error(`${where}: "cross" must be seconds ≥ 0`);
  for (const s of cut.scenes) {
    if (!s.id) throw new Error(`${where}: every scene needs an "id"`);
    if (!(s.seconds > 0)) throw new Error(`${where} › ${s.id}: "seconds" must be > 0`);
    if (cut.scenes.length > 1 && s.seconds < cross) throw new Error(`${where} › ${s.id}: ${s.seconds} s is shorter than the ${cross} s crossfade`);
    if (s.warp) {
      if (!Array.isArray(s.warp) || s.warp.some((k) => !Array.isArray(k) || k.length !== 2 || !k.every(Number.isFinite))) {
        throw new Error(`${where} › ${s.id}: "warp" must be a list of [drawnSec, sceneSec] knots`);
      }
    }
  }
}

/** One cut's plan: { format, cross, sound, scenes }. Throws with the list of cuts when `cut` is unknown. */
export function getCut(cut) {
  const cuts = loadCuts();
  const plan = cuts[cut];
  if (!plan) throw new Error(`no cut "${cut}" in cuts.json (have: ${Object.keys(cuts).join(', ')})`);
  return plan;
}

let fpsTable = null;
/** Frames per second of each format, read from the picture's own table in src/formats.ts ({} if it can't be read). */
export function formatFps(file = DEFAULT_FORMATS) {
  if (fpsTable) return fpsTable;
  fpsTable = {};
  try {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/(\w+)\s*:\s*\{[^{}]*?\bfps\s*:\s*(\d+(?:\.\d+)?)/g)) fpsTable[m[1]] = Number(m[2]);
  } catch {
    // no src/formats.ts next to sound/: plain seconds, no frame grid
  }
  return fpsTable;
}

/** The frame rate a cut renders at (from its format), or null when unknown. */
export function fpsOf(cut) {
  const plan = getCut(cut);
  return formatFps()[plan.format] ?? null;
}

/** How long a cut runs, in seconds: its scenes, less one crossfade per join (on the player's frame grid). */
export function cutDuration(cut) {
  const s = scenesOf(cut);
  return s[s.length - 1].end;
}

/** Every scene of a cut with where it plays: { id, start, end, seconds, marks, warp }, in cut seconds. */
export function scenesOf(cut) {
  const plan = getCut(cut);
  const fps = fpsOf(cut);
  // lengths in whole frames when the fps is known (as the player rounds them), else plain seconds
  const unit = fps ? (sec) => Math.round(sec * fps) : (sec) => sec;
  const toSec = fps ? (n) => n / fps : (n) => n;
  const cross = plan.cross > 0 ? unit(plan.cross) : 0;
  let end = 0;
  return plan.scenes.map((s, i) => {
    const start = i === 0 ? 0 : end - cross;
    end = start + unit(s.seconds);
    // knots in drawn order, as the picture sorts them; none means no warp
    const knots = s.warp?.length ? [...s.warp].sort((a, b) => a[0] - b[0]) : null;
    return { id: s.id, start: toSec(start), end: toSec(end), seconds: s.seconds, marks: s.marks ?? {}, warp: knots };
  });
}

function sceneOf(cut, scene) {
  const all = scenesOf(cut);
  const s = all.find((x) => x.id === scene);
  if (!s) throw new Error(`no scene "${scene}" in cut "${cut}" (have: ${all.map((x) => x.id).join(', ')})`);
  return s;
}

/** When a scene starts, in seconds from the start of the cut (its first appearance): `cross` before the previous one ends. */
export function sceneStart(cut, scene) {
  return sceneOf(cut, scene).start;
}

/** Drawn seconds → scene seconds through [drawnSec, sceneSec] knots: straight lines between them, extended past both ends (as the picture's warp). */
export function warp(knots) {
  const pts = [...knots].sort((a, b) => a[0] - b[0]);
  if (pts.length === 0) return (t) => t;
  if (pts.length === 1) return (t) => t - pts[0][0] + pts[0][1];
  return (drawn) => {
    let k = 1;
    while (k < pts.length - 1 && drawn > pts[k][0]) k++;
    const [x0, y0] = pts[k - 1];
    const [x1, y1] = pts[k];
    return x1 === x0 ? y1 : y0 + ((drawn - x0) * (y1 - y0)) / (x1 - x0);
  };
}

/**
 * Scene seconds → the drawn second the picture reaches them: the inverse of
 * the warp. Where the warp holds still (a freeze), the first drawn second of
 * the hold; where it jumps (two knots at one drawn second), the scene time it
 * skips is drawn at the jump; before the first knot and after the last, the
 * end segments carry on in a straight line. The first drawn second that
 * reaches `sceneSec` wins.
 */
export function unwarp(knots, sceneSec) {
  if (!knots || knots.length === 0) return sceneSec;
  const pts = [...knots].sort((a, b) => a[0] - b[0]);
  if (pts.length === 1) return sceneSec - pts[0][1] + pts[0][0];
  const n = pts.length;
  for (let k = 1; k < n; k++) {
    const [x0, y0] = pts[k - 1];
    const [x1, y1] = pts[k];
    const lo = Math.min(y0, y1), hi = Math.max(y0, y1);
    const first = k === 1, last = k === n - 1;
    // the first segment also covers everything before it, the last everything after
    const before = first && (y1 >= y0 ? sceneSec < lo : sceneSec > hi);
    const after = last && (y1 >= y0 ? sceneSec > hi : sceneSec < lo);
    if (!(sceneSec >= lo && sceneSec <= hi) && !before && !after) continue;
    if (y1 === y0) return x0;
    return x0 + ((sceneSec - y0) * (x1 - x0)) / (y1 - y0);
  }
  return sceneSec;
}

/** Whether a scene of a cut has a mark by this name. */
export function hasMark(cut, scene, mark) {
  const s = scenesOf(cut).find((x) => x.id === scene);
  return !!s && Number.isFinite(s.marks[mark]);
}

/**
 * When something in a scene happens, in seconds from the start of the cut.
 * `markOrSeconds` is a mark's name from cuts.json, or scene seconds (in the
 * scene's own, written time). The warp is inverted and the scene's start added.
 */
export function at(cut, scene, markOrSeconds) {
  const s = sceneOf(cut, scene);
  let sec = markOrSeconds;
  if (typeof markOrSeconds === 'string') {
    sec = s.marks[markOrSeconds];
    if (!Number.isFinite(sec)) {
      const have = Object.keys(s.marks);
      throw new Error(`no mark "${markOrSeconds}" in ${cut} › ${scene} (have: ${have.length ? have.join(', ') : 'none'})`);
    }
  }
  if (!Number.isFinite(sec)) throw new Error(`at(): expected a mark name or seconds, got ${markOrSeconds}`);
  return s.start + unwarp(s.warp, sec);
}

/** The first frame at or after `t` seconds: where the picture actually shows something that happens at `t`. */
export function snap(t, fps) {
  return Math.ceil(t * fps - 1e-6) / fps;
}

/* ── node sound/timeline.mjs [cut]: print the timeline ─────────────────── */

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('usage: node sound/timeline.mjs [cut]   (every scene and mark in cut time; CUTS=path/to/cuts.json reads another file)');
    process.exit(0);
  }
  const want = args[0];
  const cuts = loadCuts();
  const f = (x) => x.toFixed(2).padStart(6);
  for (const id of want ? [want] : Object.keys(cuts)) {
    const plan = getCut(id);
    console.log(`${id} · ${plan.format ?? '?'} · ${cutDuration(id).toFixed(2)} s · crossfade ${plan.cross ?? 0} s · sound ${plan.sound ? 'on' : 'off'}`);
    for (const s of scenesOf(id)) {
      console.log(`  ${f(s.start)} – ${f(s.end)}  ${s.id}${s.warp ? `  (warped: ${s.seconds} s drawn, ${warp(s.warp)(s.seconds).toFixed(2)} s of scene)` : ''}`);
      const marks = Object.entries(s.marks).sort((a, b) => a[1] - b[1]);
      for (const [name, sec] of marks) console.log(`  ${f(at(id, s.id, name))}      · ${name} (scene ${sec} s)`);
    }
  }
}
