// sound/test/parity.mjs: the picture's clock and the sound's clock, side by side.
//
//   node sound/test/parity.mjs [path/to/cuts.json]
//
// The picture lays scenes out with src/lib/time.ts (TypeScript, inside
// Remotion); the sound with sound/timeline.mjs (plain Node). They must agree
// to the sample, or a click lands a frame early. This runs the real time.ts
// (transpiled in memory with the project's own TypeScript, React and Remotion
// stubbed out, since only the pure math is called) against timeline.mjs for
// every cut, and checks:
//
// - cutDuration and every scene's start agree
// - the warp: time.ts's warp and timeline.mjs's warp give the same scene time
//   at every frame, and time.ts's warp of timeline.mjs's unwarp(mark) is the
//   mark again (the sound inverts exactly the clock the picture plays)
// - the frame grid: the player (src/Video.tsx) rounds each scene and each
//   crossfade to whole frames; the sound must start every scene on the frame
//   the player starts it on, or it drifts a little further with each scene.
//   Lengths that aren't whole frames are noted (they play rounded).
//
// Exits non-zero on any mismatch. sound/test/run.mjs runs it too.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');

/** Load src/lib/time.ts (and src/formats.ts) as plain functions, with `cuts` in place of src/cuts.json. */
export function loadTimeTs(cuts) {
  const require = createRequire(path.join(ROOT, 'package.json'));
  const ts = require('typescript');
  const compile = (file) =>
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText;
  const run = (code, deps) => {
    const module = { exports: {} };
    const req = (name) => {
      if (name in deps) return deps[name];
      throw new Error(`parity: time.ts imports "${name}", which this check does not stub; add it to the deps`);
    };
    new Function('require', 'module', 'exports', code)(req, module, module.exports);
    return module.exports;
  };
  const formats = run(compile(path.join(ROOT, 'src', 'formats.ts')), {});
  const stubs = {
    react: { createContext: () => ({}), useContext: () => null },
    remotion: { useCurrentFrame: () => 0, useVideoConfig: () => ({ width: 0, height: 0, fps: 30 }) },
    '../cuts.json': cuts,
    '../formats': formats,
  };
  return { time: run(compile(path.join(ROOT, 'src', 'lib', 'time.ts')), stubs), FORMATS: formats.FORMATS };
}

/** Compare both clocks on every cut of `cutsFile`. Returns { rows, problems }. */
export async function parity(cutsFile = path.join(ROOT, 'src', 'cuts.json')) {
  const T = await import('../timeline.mjs');
  const before = process.env.CUTS;
  process.env.CUTS = cutsFile;
  try {
    return compare(T, cutsFile);
  } finally {
    if (before === undefined) delete process.env.CUTS;
    else process.env.CUTS = before;
  }
}

function compare(T, cutsFile) {
  const cuts = JSON.parse(fs.readFileSync(cutsFile, 'utf8'));
  const { time, FORMATS } = loadTimeTs(cuts);
  const problems = [];
  const rows = [];
  const EPS = 1e-9;
  for (const [id, cut] of Object.entries(cuts)) {
    const fps = FORMATS[cut.format]?.fps ?? 30;
    const a = time.cutDuration(id);
    const b = T.cutDuration(id);
    if (Math.abs(a - b) > EPS) problems.push(`${id}: cutDuration ${a} (time.ts) vs ${b} (timeline.mjs)`);
    const frames = time.cutFrames(id, fps);
    const drift = frames / fps - b;
    if (Math.abs(drift) > 1e-6) problems.push(`${id}: the player makes it ${frames} frames (${(frames / fps).toFixed(4)} s), the sound ${b.toFixed(4)} s`);
    rows.push({ id, fps, seconds: b, frames, drift });
    const whole = (sec) => Math.abs(sec * fps - Math.round(sec * fps)) < 1e-6;
    if (cut.cross > 0 && !whole(cut.cross)) rows.push({ id, note: `cross ${cut.cross} s is ${(cut.cross * fps).toFixed(2)} frames at ${fps} fps: it plays as ${Math.round(cut.cross * fps)}` });
    const crossF = cut.cross > 0 ? time.toFrames(cut.cross, fps) : 0;
    let startF = 0;
    const seen = new Set();
    for (const s of cut.scenes) {
      const first = !seen.has(s.id);
      seen.add(s.id);
      const sound = T.scenesOf(id).find((x, i) => x.id === s.id && cut.scenes[i] === s);
      if (first) {
        const pa = time.sceneStart(id, s.id);
        const pb = T.sceneStart(id, s.id);
        if (Math.abs(pa - pb) > EPS) problems.push(`${id} › ${s.id}: sceneStart ${pa} (time.ts) vs ${pb} (timeline.mjs)`);
      }
      // the frame this scene really starts on, as the TransitionSeries lays it out
      const d = startF / fps - sound.start;
      if (Math.abs(d) > 1e-6) problems.push(`${id} › ${s.id}: starts on frame ${startF} (${(startF / fps).toFixed(4)} s) but the sound puts it at ${sound.start.toFixed(4)} s (${(d * 1000).toFixed(1)} ms, ${(d * fps).toFixed(2)} frames)`);
      if (!whole(s.seconds)) rows.push({ id, note: `${s.id}: ${s.seconds} s is ${(s.seconds * fps).toFixed(2)} frames at ${fps} fps, so it plays ${Math.round(s.seconds * fps)} (both clocks round it the same way)` });
      startF += time.toFrames(s.seconds, fps) - crossF;
      if (s.warp) {
        const pic = time.warp(s.warp);
        const snd = T.warp(s.warp);
        for (let f = 0; f <= Math.round(s.seconds * fps); f++) {
          const t = f / fps;
          if (Math.abs(pic(t) - snd(t)) > 1e-9) {
            problems.push(`${id} › ${s.id}: warp(${t.toFixed(3)}) is ${pic(t)} in time.ts, ${snd(t)} in timeline.mjs`);
            break;
          }
        }
        for (const [name, sec] of Object.entries(s.marks ?? {})) {
          const drawn = T.unwarp(s.warp, sec);
          if (Math.abs(pic(drawn) - sec) > 1e-6) problems.push(`${id} › ${s.id} › ${name}: the sound draws it at ${drawn.toFixed(4)} s, where the picture's clock reads ${pic(drawn).toFixed(4)}, not ${sec}`);
        }
      }
    }
  }
  return { rows, problems };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('usage: node sound/test/parity.mjs [path/to/cuts.json]   (default: src/cuts.json)');
    process.exit(0);
  }
  const file = path.resolve(args[0] ?? path.join(ROOT, 'src', 'cuts.json'));
  const { rows, problems } = await parity(file);
  console.log(`time.ts vs timeline.mjs on ${path.relative(process.cwd(), file) || file}`);
  for (const r of rows) {
    if (r.note) console.log(`    note  ${r.note}`);
    else console.log(`  ${r.id.padEnd(10)} ${r.seconds.toFixed(3).padStart(8)} s · ${String(r.frames).padStart(5)} frames at ${r.fps} fps`);
  }
  if (problems.length) {
    console.log(`\n${problems.length} mismatch${problems.length > 1 ? 'es' : ''}:`);
    for (const p of problems) console.log(`  ${p}`);
    process.exit(1);
  }
  console.log('\nsame clock: every cut length, scene start, warp and mark agrees');
}
