#!/usr/bin/env node
/**
 * Render stills of a cut, to look at instead of watching (you can't watch a
 * video; you can read a contact sheet). Bundles once, opens one browser, and
 * renders a PNG at each time asked for.
 *
 *   node scripts/stills.mjs <cut> [--marks] [--at 1.2,3.4] [--safe] [--keep] [--concurrency N]
 *   node scripts/stills.mjs cover [--safe]          (a <Still>: one frame)
 *
 *   --marks   every mark in src/cuts.json and 0.2 s after it (the moment it
 *             lands, and the moment it has landed), every scene's midpoint,
 *             and the first and last frame. The default when no --at is given.
 *   --at      comma-separated seconds from the start of the cut
 *   --safe    draw the format's safe zones (input prop { safe: true })
 *   --keep    keep this cut's earlier stills instead of clearing them
 *   --concurrency N   stills rendered at once (each is a Chrome tab). Default:
 *             2 on a machine with 16 GiB of RAM or less, else Remotion's own
 *             default (half the CPU threads, up to 8), as in remotion.config.ts.
 *
 * Writes out/stills/<cut>-<seconds>.png (or <cut>-safe-<seconds>.png) and
 * out/stills/<cut>[-safe].json, which labels each still for scripts/sheet.mjs.
 * Then: node scripts/sheet.mjs <cut>
 *
 * The bundle goes to out/.bundle, cleared and reused on every run. bundle()
 * without an outDir makes a new ~50 MB folder in the system temp folder
 * (remotion-webpack-bundle-*) on each call and never removes it: hundreds of
 * runs filled a disk that way. Run one stills.mjs at a time.
 */
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const usage = 'usage: node scripts/stills.mjs <cut|cover|thumbnail> [--marks] [--at 1.2,3.4] [--safe] [--keep] [--concurrency N]';
if (args.includes('--help') || args.includes('-h')) {
  console.log(usage);
  process.exit(0);
}
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const id = args.find((a, i) => !a.startsWith('--') && !['--at', '--concurrency'].includes(args[i - 1]));
if (!id) {
  console.log(usage);
  process.exit(1);
}
const safe = flag('safe');
const outDir = path.join(root, 'out', 'stills');
fs.mkdirSync(outDir, { recursive: true });
// the same rule as remotion.config.ts: 2 at a time on 16 GiB of RAM or less, else Remotion's default
const concurrency = Math.max(1, Math.round(Number(value('concurrency'))) || (os.totalmem() <= 16 * 1024 ** 3 ? 2 : Math.round(Math.min(8, Math.max(1, os.cpus().length / 2)))));

/* ── the same cut math as src/lib/time.ts and sound/timeline.mjs ─────────── */

const cuts = JSON.parse(fs.readFileSync(path.join(root, 'src', 'cuts.json'), 'utf8'));
/** scene seconds → drawn seconds: the inverse of a scene's warp */
function unwarp(knots, s) {
  if (!knots || knots.length === 0) return s;
  const pts = [...knots].sort((a, b) => a[1] - b[1]);
  if (pts.length === 1) return s - pts[0][1] + pts[0][0];
  let i = 0;
  while (i < pts.length - 2 && s > pts[i + 1][1]) i++;
  const [x0, y0] = pts[i];
  const [x1, y1] = pts[i + 1];
  return y1 === y0 ? x1 : x0 + ((s - y0) * (x1 - x0)) / (y1 - y0);
}
function plan(cut) {
  const c = cuts[cut];
  const cross = Math.max(0, c.cross || 0);
  let t = 0;
  return c.scenes.map((s) => {
    const start = t;
    t += s.seconds - cross;
    return { ...s, start };
  });
}

/* ── which times ────────────────────────────────────────────────────────── */

// one fixed folder, cleared first so nothing stale from public/ lingers (retries: Windows may hold a file for a moment)
const bundleDir = path.join(root, 'out', '.bundle');
try {
  fs.rmSync(bundleDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
} catch (e) {
  console.warn(`Could not clear ${path.relative(root, bundleDir)} (${e.code ?? e.message}), bundling over it. Is another stills.mjs running?`);
}
const serveUrl = await bundle({ entryPoint: path.join(root, 'src', 'index.ts'), rootDir: root, outDir: bundleDir, onProgress: () => {} });
const inputProps = safe ? { safe: true } : {};
const composition = await selectComposition({ serveUrl, id, inputProps });
const { fps, durationInFrames } = composition;
const last = (durationInFrames - 1) / fps;

/** @type {{ t: number; label: string }[]} */
let shots = [];
const isCut = Boolean(cuts[id]);
if (!isCut || durationInFrames === 1) {
  shots = [{ t: 0, label: id }];
} else {
  const at = value('at');
  if (at) for (const s of at.split(',').map(Number).filter((x) => !Number.isNaN(x))) shots.push({ t: s, label: '' });
  if (flag('marks') || !at) {
    shots.push({ t: 0, label: 'first frame' }, { t: last, label: 'last frame' });
    for (const s of plan(id)) {
      shots.push({ t: s.start + s.seconds / 2, label: `${s.id} middle` });
      for (const [name, sec] of Object.entries(s.marks || {})) {
        const abs = s.start + unwarp(s.warp, sec);
        shots.push({ t: abs, label: `${s.id} ${name}` }, { t: abs + 0.2, label: `${s.id} ${name} +0.2` });
      }
    }
  }
}
// one still per frame, in time order
const seen = new Map();
for (const s of shots) {
  const frame = Math.min(durationInFrames - 1, Math.max(0, Math.round(s.t * fps)));
  if (!seen.has(frame)) seen.set(frame, { frame, label: s.label });
}
const todo = [...seen.values()].sort((a, b) => a.frame - b.frame);

/* ── render ─────────────────────────────────────────────────────────────── */

const prefix = `${id}${safe ? '-safe' : ''}`;
if (isCut && !flag('keep') && !value('at')) {
  for (const f of fs.readdirSync(outDir)) if (new RegExp(`^${prefix}-\\d+\\.\\d+\\.png$`).test(f)) fs.rmSync(path.join(outDir, f));
}
const browser = await openBrowser('chrome');
const index = {};
const t0 = Date.now();
try {
  // `concurrency` workers, each taking the next still, in one browser (a tab each)
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const { frame, label } = todo[next++];
      const secs = (frame / fps).toFixed(2);
      const name = isCut && durationInFrames > 1 ? `${prefix}-${secs}.png` : `${prefix}.png`;
      await renderStill({ composition, serveUrl, frame, inputProps, output: path.join(outDir, name), imageFormat: 'png', puppeteerInstance: browser, overwrite: true });
      index[name] = isCut ? `${secs} s  ${label}`.trim() : label;
      process.stdout.write(`\r${Object.keys(index).length}/${todo.length}  ${name}      `);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, todo.length) }, worker));
} finally {
  await browser.close({ silent: true });
}
const indexFile = path.join(outDir, `${prefix}.json`);
const old = flag('keep') && fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : {};
// in time order, whichever worker finished first
const all = Object.entries({ ...old, ...index }).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }));
fs.writeFileSync(indexFile, JSON.stringify(Object.fromEntries(all), null, 2));
console.log(`\n${todo.length} still(s) in ${((Date.now() - t0) / 1000).toFixed(1)} s → ${path.relative(root, outDir)}${isCut ? `\nnext: node scripts/sheet.mjs ${id}${safe ? ' --safe' : ''}` : ''}`);
