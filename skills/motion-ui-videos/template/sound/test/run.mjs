// sound/test/run.mjs: checks the sound engine end to end.
//
//   node sound/test/run.mjs
//
// The timeline math (crossfade overlaps, warp inversion) against
// fixture-cuts.json; the meter against the EBU reference tone; the limiter;
// every voice rendered into out/voices.wav with its loudness; five whooshes
// grown from one and compared; design.mjs run on the fixture cuts, twice, to
// prove it is deterministic. Writes WAVs and PNGs to sound/test/out/
// (gitignored). Exits non-zero if anything fails.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOUND = path.join(HERE, '..');
const OUT = path.join(HERE, 'out');
const FIXTURE = path.join(HERE, 'fixture-cuts.json');
process.env.CUTS = FIXTURE;
delete process.env.ONLY;
delete process.env.WHOOSH_REF;
delete process.env.SYNTH_WHOOSH;
fs.mkdirSync(OUT, { recursive: true });

const E = await import('../engine.mjs');
const T = await import('../timeline.mjs');
const { meter, loudness, fmt } = await import('../tools/loudness.mjs');
const { spectrogram } = await import('../tools/spectrogram.mjs');
const { analyze, describe } = await import('../tools/analyze.mjs');
const G = await import('../tools/grow.mjs');
const { SR } = E;

let passed = 0, failed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok    ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL  ${name}\n        ${String(e.message).split('\n').join('\n        ')}`);
  }
}
const near = (got, want, tol, what = '') => assert.ok(Math.abs(got - want) <= tol, `${what} expected ${want} ± ${tol}, got ${got}`);
const section = (title) => console.log(`\n${title}`);
const node = (args, env = {}) => execFileSync(process.execPath, args, { cwd: path.join(SOUND, '..'), env: { ...process.env, ...env }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/* ── timeline ──────────────────────────────────────────────────────────── */

section('timeline (fixture-cuts.json)');
check('loadCuts reads the CUTS file', () => assert.deepEqual(Object.keys(T.loadCuts()), ['showcase', 'reel']));
check('cutDuration = scenes minus one crossfade per join', () => {
  near(T.cutDuration('showcase'), 32 - 5 * 0.4, 1e-9, 'showcase');
  near(T.cutDuration('reel'), 17.4 - 4 * 0.2, 1e-9, 'reel');
});
check('sceneStart: each scene starts `cross` before the previous one ends', () => {
  const want = { hook: 0, problem: 3.6, reveal: 8.2, demo: 11.8, features: 20.4, end: 26 };
  for (const [id, t] of Object.entries(want)) near(T.sceneStart('showcase', id), t, 1e-9, id);
  const reel = { hook: 0, problem: 2.2, demo: 5.0, reveal: 10.8, end: 13.6 };
  for (const [id, t] of Object.entries(reel)) near(T.sceneStart('reel', id), t, 1e-9, `reel ${id}`);
});
check('crossfades overlap by exactly `cross`, and the last scene ends at cutDuration', () => {
  for (const cut of ['showcase', 'reel']) {
    const s = T.scenesOf(cut), cross = T.getCut(cut).cross;
    for (let i = 1; i < s.length; i++) near(s[i - 1].end - s[i].start, cross, 1e-9, `${cut} ${s[i - 1].id}→${s[i].id}`);
    near(s.at(-1).end, T.cutDuration(cut), 1e-9, `${cut} end`);
  }
});
check('at() without a warp: scene start + mark', () => {
  near(T.at('showcase', 'demo', 'click'), 11.8 + 1.0, 1e-9);
  near(T.at('showcase', 'end', 'ctaIn'), 26 + 1.0, 1e-9);
  near(T.at('showcase', 'demo', 2.5), 11.8 + 2.5, 1e-9, 'seconds');
});
const K = [[0, 0], [2, 3], [4, 6.5], [6, 9]];
check('unwarp inverts each segment of the warp', () => {
  near(T.unwarp(K, 0), 0, 1e-12);
  near(T.unwarp(K, 3), 2, 1e-12);
  near(T.unwarp(K, 1.5), 1, 1e-12);
  near(T.unwarp(K, 6.2), 2 + (3.2 * 2) / 3.5, 1e-12);
  near(T.unwarp(K, 9), 6, 1e-12);
});
check('unwarp extends the end segments past the knots, as the picture does', () => {
  near(T.unwarp(K, 10), 6 + 1 * (2 / 2.5), 1e-12, 'after');
  near(T.unwarp(K, -1.5), -1, 1e-12, 'before');
  near(T.warp(K)(7), 9 + 2.5 / 2, 1e-12, 'warp after');
});
check('warp(unwarp(s)) = s everywhere', () => {
  const w = T.warp(K);
  for (let s = -2; s <= 11; s += 0.137) near(w(T.unwarp(K, s)), s, 1e-9, `s=${s.toFixed(3)}`);
});
check('unwarp of a freeze returns the first drawn second that reaches it', () => {
  const F = [[0, 0], [1, 1], [2, 1], [3, 2]];
  near(T.unwarp(F, 1), 1, 1e-12);
  near(T.unwarp(F, 1.5), 2.5, 1e-12);
  near(T.unwarp(F, 0.5), 0.5, 1e-12);
});
check('one-knot warps shift time; a jump (two knots at one drawn second) skips scene time', () => {
  near(T.unwarp([[1, 3]], 5), 3, 1e-12, 'one knot');
  near(T.warp([[1, 3]])(3), 5, 1e-12, 'one knot forward');
  const J = [[0, 0], [1, 1], [1, 4], [2, 5]];
  near(T.warp(J)(1.5), 4.5, 1e-12, 'after the jump');
  near(T.unwarp(J, 2.5), 1, 1e-12, 'skipped scene time is drawn at the jump');
  near(T.unwarp(J, 4.5), 1.5, 1e-12, 'after the jump, inverted');
  near(T.unwarp([[2, 3], [0, 0], [4, 6.5], [6, 9]], 6.2), 2 + (3.2 * 2) / 3.5, 1e-12, 'knots in any order');
});
check('at() through a warp: marks land where the picture draws them', () => {
  near(T.at('reel', 'demo', 'click'), 5.0 + 1.0 * (2 / 3), 1e-9, 'click');
  near(T.at('reel', 'demo', 'done'), 5.0 + 2 + (3.2 * 2) / 3.5, 1e-9, 'done');
  near(T.at('reel', 'reveal', 'reveal'), 10.8 + 0.5, 1e-9, 'unwarped scene after a warped one');
});
check('a warped scene plays its marks in the same order, faster', () => {
  const names = ['click', 'paletteOpen', 'typeStart', 'typeEnd', 'click2', 'done'];
  const full = names.map((n) => T.at('showcase', 'demo', n) - T.sceneStart('showcase', 'demo'));
  const fast = names.map((n) => T.at('reel', 'demo', n) - T.sceneStart('reel', 'demo'));
  for (let i = 1; i < names.length; i++) assert.ok(fast[i] > fast[i - 1], `order at ${names[i]}`);
  for (let i = 0; i < names.length; i++) assert.ok(fast[i] < full[i], `${names[i]} earlier in the warped cut`);
});
check('missing marks and scenes fail loudly; hasMark says so quietly', () => {
  assert.throws(() => T.at('reel', 'demo', 'nope'), /no mark "nope" in reel › demo \(have: click, paletteOpen/);
  assert.throws(() => T.at('reel', 'features', 'cardIn1'), /no scene "features" in cut "reel"/);
  assert.throws(() => T.cutDuration('square'), /no cut "square"/);
  assert.equal(T.hasMark('reel', 'demo', 'click'), true);
  assert.equal(T.hasMark('reel', 'demo', 'nope'), false);
});
check('snap() moves a time onto the first frame that shows it', () => {
  near(T.snap(1.001, 30), 31 / 30, 1e-12);
  near(T.snap(1, 30), 1, 1e-12);
});

/* ── engine basics ─────────────────────────────────────────────────────── */

section('engine');
check('note() and beats()', () => {
  near(E.note('A4'), 440, 1e-9);
  near(E.note('C4'), 261.6256, 1e-3);
  near(E.note('Eb3'), E.note('D#3'), 1e-9);
  assert.deepEqual(E.beats(120, 4, 1), [1, 1.5, 2, 2.5]);
  assert.throws(() => E.note('H2'));
});
check('every voice is deterministic: same seed, same samples; new seed, new sound', () => {
  for (const [name, f] of [['click', E.click], ['key', E.key], ['tick', E.tick], ['whoosh', E.whoosh], ['hat', E.hat], ['snareish', E.snareish]]) {
    const a = f({ seed: 3 }), b = f({ seed: 3 }), c = f({ seed: 4 });
    assert.deepEqual(a, b, `${name} seed 3 twice`);
    assert.notDeepEqual(a, c, `${name} seeds 3 and 4`);
  }
});
check('place(): mono pans with equal power, stereo keeps its image, null time places nothing', () => {
  const mix = E.createMix(1);
  const imp = new Float32Array([1]);
  E.place(mix, imp, 0.5, { room: 0 });
  const i = Math.round(0.5 * SR);
  near(mix.buses.sfx.l[i], Math.SQRT1_2, 1e-6, 'centre L');
  near(mix.buses.sfx.r[i], Math.SQRT1_2, 1e-6, 'centre R');
  E.place(mix, imp, 0.25, { pan: -1, room: 0 });
  near(mix.buses.sfx.l[Math.round(0.25 * SR)], 1, 1e-6, 'hard left');
  assert.equal(E.place(mix, imp, null), false);
  assert.equal(E.place(mix, { l: new Float32Array([1]), r: new Float32Array([0.5]) }, 0.75, { room: 0 }), true);
  near(mix.buses.sfx.r[Math.round(0.75 * SR)], 0.5, 1e-6, 'stereo R');
  assert.throws(() => E.place(mix, imp, NaN), /time must be seconds/);
});
check('ONLY keeps just the named layers', () => {
  const mix = E.createMix(1, { only: 'whoosh' });
  assert.equal(E.place(mix, E.click({ seed: 1 }), 0.1), false);
  assert.equal(E.place(mix, E.whoosh({ seed: 1 }), 0.1), true);
  assert.throws(() => E.createMix(1, { only: 'drums' }), /unknown layer "drums"/);
});
check('placePeak lands the loudest moment on the time given', () => {
  const w = E.whoosh({ dur: 0.8, peak: 0.25, seed: 2 });
  const mix = E.createMix(2);
  E.placePeak(mix, w, 1.0, { room: 0 });
  // noise is lumpy: its single loudest 20 ms can sit a little off the swell's top, its envelope does not
  near(E.envelopePeak(mix.buses.whoosh), 1.0, 0.04, 'envelope peak at');
});
check('writeWav → readWav round-trips (16-bit)', () => {
  const l = Float32Array.from({ length: 4800 }, (_, i) => 0.5 * Math.sin(i / 7));
  const r = Float32Array.from({ length: 4800 }, (_, i) => 0.25 * Math.cos(i / 5));
  const f = path.join(OUT, 'roundtrip.wav');
  E.writeWav(f, { l, r });
  const back = E.readWav(f);
  assert.equal(back.sr, SR);
  for (let i = 0; i < l.length; i += 97) { near(back.ch[0][i], l[i], 1e-4); near(back.ch[1][i], r[i], 1e-4); }
});
check('resample keeps pitch (44.1 kHz → 48 kHz)', () => {
  const x = Float32Array.from({ length: 44100 }, (_, i) => Math.sin((2 * Math.PI * 1000 * i) / 44100));
  const y = E.resample(x, 44100, SR);
  near(y.length, 48000, 1);
  let crossings = 0;
  for (let i = 1000; i < 47000; i++) if (y[i - 1] < 0 && y[i] >= 0) crossings++;
  near(crossings, 1000 * (46000 / SR), 2, 'zero crossings');
});

/* ── meter and limiter ─────────────────────────────────────────────────── */

section('loudness and limiter');
check('meter: EBU reference, stereo 1 kHz sine at -23 dBFS reads -23.0 LUFS', () => {
  const a = 10 ** (-23 / 20);
  const x = Float32Array.from({ length: SR * 10 }, (_, i) => a * Math.sin((2 * Math.PI * 1000 * i) / SR));
  const m = loudness([x, x]);
  near(m.integrated, -23, 0.1, 'integrated');
  near(m.momentaryMax, -23, 0.1, 'momentary');
  near(m.shortTermMax, -23, 0.1, 'short-term');
  near(m.range, 0, 0.1, 'range');
});
check('meter: gating ignores silence (-23 tone, then 10 s of nothing)', () => {
  const a = 10 ** (-23 / 20);
  const x = Float32Array.from({ length: SR * 20 }, (_, i) => (i < SR * 10 ? a * Math.sin((2 * Math.PI * 1000 * i) / SR) : 0));
  near(loudness([x, x]).integrated, -23, 0.1);
});
check('meter: true peak sees the peak between samples (sample peak -3 dB, true peak 0 dB)', () => {
  const x = Float32Array.from({ length: SR }, (_, i) => Math.sin((Math.PI * i) / 2 + Math.PI / 4));
  const m = loudness([x]);
  near(m.samplePeak, -3.01, 0.05, 'sample peak');
  near(m.truePeak, 0, 0.3, 'true peak');
});
check('limiter alone holds true peak under -1 dBTP, and says a long sound was held down', () => {
  const mix = E.createMix(3);
  for (let i = 0; i < 5; i++) E.place(mix, E.thump({ f: 50, dur: 0.5 }), 0.3 + i * 0.5, { gain: 6 });
  const out = E.master(mix, { gainDb: -3, clip: 0 });
  const m = loudness(out);
  assert.ok(m.truePeak <= -0.95, `true peak ${m.truePeak.toFixed(2)} dBTP`);
  assert.ok(out.limited > 0 && out.sustainedDb < -3, `held down ${out.sustainedDb.toFixed(1)} dB`);
});
check('a click only gets its transient shaved, fast, and a quiet mix is left alone', () => {
  const mix = E.createMix(2);
  E.place(mix, E.click({ seed: 1 }), 0.5, { gain: 4 });
  const out = E.master(mix, { gainDb: 0, clip: 0 });
  assert.ok(out.transients >= 1 && out.sustainedDb > -0.5, `transients ${out.transients}, sustained ${out.sustainedDb}`);
  const quiet = E.createMix(2);
  E.place(quiet, E.click({ seed: 1 }), 0.5);
  const q = E.master(quiet, { gainDb: -12 });
  assert.equal(q.limited, 0, 'limiter untouched');
  assert.equal(q.clipped, 0, 'clip untouched');
});
check('soft clip bends only what is over its knee, and never past the ceiling', () => {
  const mix = E.createMix(1);
  const x = Float32Array.from({ length: SR / 2 }, (_, i) => Math.sin((2 * Math.PI * 440 * i) / SR) * (i < SR / 4 ? 0.02 : 0.4));
  E.place(mix, x, 0.25, { room: 0, pan: -1 });
  const g = 3 / E.MASTER_BASE;
  const out = E.master(mix, { gainDb: 20 * Math.log10(g), reverb: false, hp: 0, lp: 0, fadeOut: 0.001 });
  let quiet = 0;
  for (let i = Math.round(0.3 * SR); i < Math.round(0.45 * SR); i++) quiet = Math.max(quiet, Math.abs(out.l[i]));
  near(quiet / 0.06, 1, 0.01, 'quiet part untouched');
  let loud = 0;
  for (let i = Math.round(0.55 * SR); i < Math.round(0.7 * SR); i++) loud = Math.max(loud, Math.abs(out.l[i]));
  assert.ok(loud <= 0.89 && loud > 0.8, `loud part ${loud.toFixed(3)}`);
  assert.ok(out.clipped > 0);
});

/* ── every voice, into voices.wav ──────────────────────────────────────── */

section('voices → sound/test/out/voices.wav');
{
  const list = [
    ['click', [E.click({ seed: 1 })]],
    ['click bright 1.4', [E.click({ seed: 2, bright: 1.4 })]],
    ['key x8 (typing)', Array.from({ length: 8 }, (_, i) => E.key({ seed: 10 + i, space: i === 4 }))],
    ['tick x10', Array.from({ length: 10 }, (_, i) => E.tick({ seed: 30 + i }))],
    ['pop G5', [E.pop({ f: E.note('G5'), seed: 1 })]],
    ['chime C5 E5 G5 D6', [E.chime({ notes: ['C5', 'E5', 'G5', 'D6'], dur: 2.4, spread: 0.018 })]],
    ['thump', [E.thump({})]],
    ['tone D#3 (beating)', [E.tone({ notes: ['D#3'], dur: 0.9 })]],
    ['whoosh up', [E.whoosh({ seed: 1 })]],
    ['whoosh down', [E.whoosh({ f0: 1500, f1: 320, peak: 0.35, seed: 2 })]],
    ['riser', [E.riser({ seed: 1 })]],
    ['pad Cadd9', [E.pad({ notes: ['C3', 'G3', 'D4', 'E4'], dur: 3 })]],
    ['step x4', Array.from({ length: 4 }, (_, i) => E.step({ f: i % 2 ? 900 : 1150, seed: i }))],
    ['kick', [E.kick({})]],
    ['hat x2', [E.hat({ seed: 1 }), E.hat({ seed: 2, open: true })]],
    ['snareish', [E.snareish({ seed: 1 })]],
    ['beat bar 120 bpm', null],
  ];
  // lay them end to end with a gap, repeated sounds at their natural pace
  let t = 0.3;
  const spans = [];
  const places = [];
  for (const [name, sounds] of list) {
    const start = t;
    if (sounds) {
      const pace = name.startsWith('key') ? 1 / 14 : name.startsWith('tick') ? 1 / 40 : name.startsWith('step') ? 0.25 : 0.3;
      sounds.forEach((s, i) => { places.push([s, t + i * pace]); });
      t += (sounds.length - 1) * pace + Math.max(...sounds.map((s) => s.length / SR));
    } else {
      E.beats(240, 8, t).forEach((b, i) => {
        places.push([E.kick({ seed: i }), i % 4 === 0 ? b : null]);
        places.push([E.snareish({ seed: i }), i % 4 === 2 ? b : null]);
        places.push([E.hat({ seed: i }), i % 2 === 1 ? b : null]);
      });
      t += 2;
    }
    spans.push([name, start, t]);
    t += 0.4;
  }
  const mix = E.createMix(t + 0.3);
  for (const [s, at] of places) E.place(mix, s, at);
  const out = E.master(mix, { gainDb: -7 });
  E.writeWav(path.join(OUT, 'voices.wav'), out);
  const m = meter(out);
  console.log(`  ${'voice'.padEnd(22)} ${'loudest 400 ms'.padStart(15)} ${'true peak'.padStart(10)}`);
  for (const [name, a, b] of spans) {
    const v = m({ from: a, to: b });
    console.log(`  ${name.padEnd(22)} ${`${fmt(v.momentaryMax)} LUFS`.padStart(15)} ${`${fmt(v.truePeak)} dBTP`.padStart(10)}`);
  }
  const all = m();
  console.log(`  ${'all voices'.padEnd(22)} integrated ${fmt(all.integrated)} LUFS · true peak ${fmt(all.truePeak)} dBTP · clip ${(out.clipped * 100).toFixed(2)}% · limiter ${(out.limited * 100).toFixed(2)}%`);
  spectrogram([{ name: 'voices.wav', ...out }], path.join(OUT, 'voices.png'));
  const top = (name) => m({ from: spans.find((s) => s[0] === name)[1], to: spans.find((s) => s[0] === name)[2] }).momentaryMax;
  check('house levels: whooshes sit under clicks, keys stay subtle, the beat sits under the UI', () => {
    assert.ok(top('whoosh up') < top('click') - 3, `whoosh ${fmt(top('whoosh up'))} vs click ${fmt(top('click'))}`);
    assert.ok(top('key x8 (typing)') < top('click'), 'keys under a click');
    assert.ok(top('kick') <= top('thump') + 1, 'kick no louder than a thump');
  });
  check('voices.wav true peak ≤ -1 dBTP', () => assert.ok(all.truePeak <= -0.95, `${all.truePeak}`));
  console.log('  wrote sound/test/out/voices.wav and voices.png');
}

/* ── grow: five fresh whooshes from one ────────────────────────────────── */

section('grow → sound/test/out/grown-*.wav');
{
  // the "reference": a stereo whoosh, two noises leaning left and right
  const a = E.whoosh({ dur: 0.9, f0: 400, f1: 2000, peak: 0.4, seed: 5 });
  const b = E.whoosh({ dur: 0.9, f0: 420, f1: 1900, peak: 0.4, seed: 6 });
  const ref = { l: a.map((v, i) => (0.8 * v + 0.3 * b[i]) * 4), r: a.map((v, i) => (0.3 * v + 0.8 * b[i]) * 4) };
  const refFile = E.writeWav(path.join(OUT, 'ref-whoosh.wav'), ref);
  const prof = G.measure(ref);
  const pf = G.saveProfile(path.join(OUT, 'ref-whoosh.profile.json'), prof);
  const refA = analyze(ref, { name: 'ref' });
  const variants = [];
  for (let i = 1; i <= 5; i++) {
    const g = G.grow(prof, { dur: 0.6, pitch: 0.9 + 0.05 * (i - 1), bend: [1.05, 0.95], seed: i });
    E.writeWav(path.join(OUT, `grown-${i}.wav`), g);
    variants.push(g);
  }
  const corr = (x, y) => { let xy = 0, xx = 0, yy = 0; for (let i = 0; i < Math.min(x.length, y.length); i++) { xy += x[i] * y[i]; xx += x[i] * x[i]; yy += y[i] * y[i]; } return xy / Math.sqrt(xx * yy); };
  check('each variant is the length asked for, peaks where the reference peaks, as loud as it', () => {
    const frac = (prof.peak - prof.on) / (prof.off - prof.on);
    for (const g of variants) {
      near(g.l.length / SR, 0.6, 0.002, 'length');
      near(g.peakAt, 0.6 * frac, 1e-9, 'peakAt');
      near(E.envelopePeak(g), 0.6 * frac, 0.12, 'where it actually swells');
      near(20 * Math.log10(E.loudestRms(g) / prof.rms), 0, 1, 'level dB');
    }
  });
  check('no two variants are the same sound (|correlation| < 0.3)', () => {
    for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) assert.ok(Math.abs(corr(variants[i].l, variants[j].l)) < 0.3, `${i + 1} vs ${j + 1}: ${corr(variants[i].l, variants[j].l).toFixed(2)}`);
  });
  check('all of them are the same family: colour within 40% of the reference, still a whoosh', () => {
    for (const g of variants) {
      const v = analyze(g, { name: 'v' });
      near(v.centroid / refA.centroid, 1, 0.4, 'centroid ratio');
      assert.match(describe(v), /whoosh/);
    }
  });
  check('pitch moves the colour: higher pitch, brighter', () => {
    const lo = analyze(G.grow(prof, { dur: 0.6, pitch: 0.8, seed: 9 })).centroid;
    const hi = analyze(G.grow(prof, { dur: 0.6, pitch: 1.25, seed: 9 })).centroid;
    assert.ok(hi > lo * 1.2, `${lo.toFixed(0)} → ${hi.toFixed(0)} Hz`);
  });
  check('a saved profile grows the same sound as the measured one', () => {
    const back = G.loadProfile(pf);
    const x = G.grow(prof, { dur: 0.5, seed: 42 }), y = G.grow(back, { dur: 0.5, seed: 42 });
    assert.ok(corr(x.l, y.l) > 0.99, `correlation ${corr(x.l, y.l).toFixed(3)}`);
  });
  check('the variants stay stereo like the reference', () => {
    for (const g of variants) assert.ok(corr(g.l, g.r) < 0.95, `L/R correlation ${corr(g.l, g.r).toFixed(2)}`);
  });
  spectrogram([{ name: 'reference', ...ref }, ...variants.map((g, i) => ({ name: `grown-${i + 1}`, ...g }))], path.join(OUT, 'grown.png'));
  console.log(`  ${describe(refA).split('\n').join('\n  ')}`);
  console.log('  wrote sound/test/out/ref-whoosh.wav, grown-1..5.wav and grown.png');
  check('recording(): levelled to a house whoosh, tail trimmed, peak found', () => {
    const rec = E.recording(refFile);
    near(20 * Math.log10(E.loudestRms(rec) / E.houseWhooshRms()), 0, 0.2, 'level dB');
    near(rec.peakAt, E.envelopePeak(ref), 0.03, 'peakAt');
    assert.ok(rec.l.length <= ref.l.length);
    const mix = E.createMix(2);
    E.placePeak(mix, rec, 1.2);
    near(E.envelopePeak(mix.buses.whoosh), 1.2, 0.03, 'placed peak');
  });
  check('grow.mjs CLI: 3 variants, a profile and a side-by-side spectrogram', () => {
    const o = node([path.join(SOUND, 'tools', 'grow.mjs'), refFile, '--out', path.join(OUT, 'cli'), '--n', '3', '--dur', '0.5', '--bend', '1.06,0.94', '--pan', '-0.6,0.6']);
    for (const f of ['ref-whoosh.profile.json', 'ref-whoosh-grown-1.wav', 'ref-whoosh-grown-3.wav', 'ref-whoosh-grown.png']) assert.ok(fs.existsSync(path.join(OUT, 'cli', f)), f);
    assert.match(o, /panning -0.6 → 0.6/);
  });
}

/* ── the other CLIs ────────────────────────────────────────────────────── */

section('tools');
check('loudness.mjs CLI, with a stretch and a comparison', () => {
  const o = node([path.join(SOUND, 'tools', 'loudness.mjs'), path.join(OUT, 'voices.wav'), path.join(OUT, 'ref-whoosh.wav'), '--from', '0', '--to', '3']);
  assert.match(o, /integrated -?\d+\.\d LUFS · true peak/);
  assert.match(o, /dB (quieter|louder) than|about as loud as/);
});
check('analyze.mjs CLI describes a reference in words', () => {
  const o = node([path.join(SOUND, 'tools', 'analyze.mjs'), path.join(OUT, 'ref-whoosh.wav')]);
  assert.match(o, /Most like: a noise swell: a whoosh/);
});
check('spectrogram.mjs CLI writes a PNG', () => {
  node([path.join(SOUND, 'tools', 'spectrogram.mjs'), path.join(OUT, 'grown-1.wav'), path.join(OUT, 'grown-2.wav'), path.join(OUT, 'cli-spec.png')]);
  const b = fs.readFileSync(path.join(OUT, 'cli-spec.png'));
  assert.equal(b.toString('latin1', 1, 4), 'PNG');
});
check('timeline.mjs CLI prints marks in cut time', () => {
  const o = node([path.join(SOUND, 'timeline.mjs'), 'reel']);
  assert.match(o, /5\.67\s+· click \(scene 1 s\)/);
});
check('--help and -h print usage and exit 0 (never read as a file or a cut)', () => {
  const clis = [['tools', 'loudness.mjs'], ['tools', 'analyze.mjs'], ['tools', 'grow.mjs'], ['tools', 'spectrogram.mjs'], ['design.mjs'], ['timeline.mjs'], ['test', 'parity.mjs']];
  for (const cli of clis) {
    for (const flag of ['--help', '-h']) {
      // execFileSync throws on a non-zero exit, so getting output back means exit 0
      const o = node([path.join(SOUND, ...cli), flag]);
      assert.match(o, /^usage: node sound\//, `${cli.join('/')} ${flag}: ${o.trim().split('\n')[0]}`);
    }
  }
});
{
  // decoding compressed audio through Remotion's ffmpeg: only when it is installed
  let ok = false;
  try { E.ffmpeg(['-version']); ok = true; } catch { /* not installed */ }
  if (ok) {
    check('readAudio decodes mp3 through Remotion ffmpeg, and analyze.mjs reads it', () => {
      const mp3 = path.join(OUT, 'ref-whoosh.mp3');
      E.ffmpeg(['-y', '-v', 'error', '-i', path.join(OUT, 'ref-whoosh.wav'), '-c:a', 'libmp3lame', '-b:a', '192k', mp3]);
      const a = E.readAudio(mp3);
      near(a.seconds, 0.9, 0.08, 'seconds');
      assert.equal(a.mono, false);
      const o = node([path.join(SOUND, 'tools', 'analyze.mjs'), mp3]);
      assert.match(o, /Most like: a noise swell: a whoosh/);
    });
  } else console.log('  skip  readAudio of compressed files (Remotion is not installed here; npm install in the template enables it)');
}

/* ── the picture's code, where the sound mirrors it ────────────────────── */

section('matches the picture');
{
  const src = (f) => path.join(SOUND, '..', 'src', 'lib', f);
  if (fs.existsSync(src('text.tsx')) && fs.existsSync(src('anim.ts'))) {
    const { typedTimes } = await import('../score.mjs');
    check("score.mjs types on Typed's frames (same formula as src/lib/text.tsx)", () => {
      const text = fs.readFileSync(src('text.tsx'), 'utf8').replace(/\s+/g, ' ');
      assert.ok(text.includes('start + (i + 0.35 * (rand(i * 7 + 11) - 0.5)) / cps'), 'typedTimes in text.tsx changed: update typedTimes in sound/score.mjs to match');
      const anim = fs.readFileSync(src('anim.ts'), 'utf8').replace(/\s+/g, ' ');
      for (const bit of ['0x9e3779b1', '0x85ebca6b', 'h >>> 13', '0xc2b2ae35', 'h >>> 16', '4294967296']) assert.ok(anim.includes(bit), `rand in anim.ts changed (${bit}): update rand in sound/score.mjs`);
      const t = typedTimes('abc', 1, 10);
      assert.equal(t.length, 3);
      assert.ok(t[0] > 0.98 && t[0] < 1.02 && t[2] > 1.18 && t[2] < 1.22, t.join(', '));
    });
  } else console.log('  skip  (no src/lib next to sound/)');
  const srcDir = path.join(SOUND, '..', 'src');
  if (fs.existsSync(srcDir)) {
    const { TYPED } = await import('../score.mjs');
    check('every text in TYPED (score.mjs) is still typed somewhere in src/', () => {
      const all = [];
      const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (/\.(tsx?|json)$/.test(f.name)) all.push(fs.readFileSync(p, 'utf8')); } };
      walk(srcDir);
      const text = all.join(' ');
      for (const [where, typed] of Object.entries(TYPED)) assert.ok(text.includes(`'${typed}'`) || text.includes(`"${typed}"`), `${where}: "${typed}" is no longer in src/, update TYPED in sound/score.mjs`);
    });
  }
  const timeTs = path.join(SOUND, '..', 'src', 'lib', 'time.ts');
  if (fs.existsSync(timeTs)) {
    // the real src/lib/time.ts, transpiled and run, against timeline.mjs (sound/test/parity.mjs)
    const { parity } = await import('./parity.mjs');
    for (const file of [path.join(SOUND, '..', 'src', 'cuts.json'), FIXTURE]) {
      const { problems } = await parity(file);
      check(`timeline.mjs and src/lib/time.ts agree on ${path.basename(file)} (lengths, scene starts on the frame grid, warps, marks)`, () => {
        assert.deepEqual(problems, []);
      });
    }
  }
}

/* ── the score's kit: a missing mark is silence ────────────────────────── */

section('score.mjs kit (fixture-cuts.json)');
{
  const S = await import('../score.mjs');
  const kitFor = (cut, at = (scene, m) => T.at(cut, scene, m)) => {
    const mix = E.createMix(T.cutDuration(cut), { cues: true });
    return { mix, k: S.kit(cut, mix, at) };
  };
  const placed = (mix) => mix.cues.map((c) => `${c.kind} at ${c.t.toFixed(3)} s`).join(', ');
  check('every kit helper places nothing for a null or undefined time', () => {
    const { mix, k } = kitFor('showcase');
    for (const t of [null, undefined]) {
      const helpers = {
        click: () => k.click(t), key: () => k.key(t), tick: () => k.tick(t), pop: () => k.pop(t, 'G5'),
        chime: () => k.chime(t, ['G5', 'D6']), thump: () => k.thump(t), tension: () => k.tension(t), riser: () => k.riser(t),
        step: () => k.step(t), swish: () => k.swish(t), swishFree: () => k.swishFree(t),
        put: () => k.put(E.click({ seed: 1 }), t), peak: () => k.peak(E.whoosh({ seed: 1 }), t),
      };
      for (const [name, f] of Object.entries(helpers)) assert.equal(f(), false, `${name}(${t})`);
    }
    const s = k.scene(k.scenes.find((x) => x.id === 'demo'), 3);
    const m = s.marks;
    assert.equal(k.move(s, m.nope, m.click), false, 'move from a missing mark');
    assert.equal(k.typing(s, m.typeStart, m.nope, { text: 'launch plan' }), false, 'typing to a missing mark');
    assert.equal(k.typing(s, m.nope, m.typeEnd), false, 'typing from a missing mark');
    assert.equal(k.typing(s, null, m.typeEnd), false, 'typing from null');
    assert.equal(k.typing(s, m.nope + 0.1, m.typeEnd), false, 'typing from arithmetic on a missing mark');
    assert.equal(k.typing(s, 'typeStart', 'nope'), false, 'typing to a missing mark, by name');
    assert.equal(mix.cues.length, 0, `placed ${placed(mix)}`);
    assert.deepEqual([k.hits, k.swishes, k.risers], [[], [], []], 'nothing remembered as a hit, a whoosh or a riser');
  });
  check('typing skips a key whose time the cut cannot place, instead of putting it at 0 s', () => {
    // an `at` that returns null for the first half of the typing (it used to become snap(null) = 0 s)
    const cutoff = 2.9;
    const { mix, k } = kitFor('showcase', (scene, m) => (typeof m === 'number' && m < cutoff ? null : T.at('showcase', scene, m)));
    const s = k.scene(k.scenes.find((x) => x.id === 'demo'), 3);
    const text = 'launch plan';
    const want = S.typedTimes(text, s.marks.typeStart, text.length / (s.marks.typeEnd - s.marks.typeStart)).filter((x) => x >= cutoff).length;
    assert.ok(want > 0 && want < text.length, `the test types across the cutoff (${want} of ${text.length})`);
    assert.equal(k.typing(s, s.marks.typeStart, s.marks.typeEnd, { text }), true);
    assert.equal(mix.cues.length, want, `placed ${placed(mix)}`);
    const from = T.at('showcase', 'demo', cutoff);
    for (const c of mix.cues) assert.ok(c.t >= from - 1e-9, `a key at ${c.t.toFixed(3)} s, before ${from.toFixed(3)} s`);
  });
  check('typing between two marks, by value or by name, puts one key per character on its frame', () => {
    const { mix, k } = kitFor('reel');
    const s = k.scene(k.scenes.find((x) => x.id === 'demo'), 2);
    const text = 'share';
    assert.equal(k.typing(s, 'typeStart', 'typeEnd', { text }), true);
    assert.equal(mix.cues.length, text.length);
    const fps = T.fpsOf('reel');
    const a = T.at('reel', 'demo', 'typeStart'), b = T.at('reel', 'demo', 'typeEnd');
    for (const c of mix.cues) {
      near(c.t * fps, Math.round(c.t * fps), 1e-6, 'on a frame');
      assert.ok(c.t > a - 0.1 && c.t < b + 0.1, `${c.t.toFixed(3)} s is between the marks (${a.toFixed(3)}–${b.toFixed(3)})`);
    }
  });
}

/* ── design.mjs on the fixture cuts ────────────────────────────────────── */

section('design.mjs → sound/test/out/sound-*.wav');
const design = (args, env = {}) => node([path.join(SOUND, 'design.mjs'), ...args], { CUTS: FIXTURE, OUT, ...env });
const lufs = {};
{
  const o = design(['--all']);
  console.log(o.trimEnd().split('\n').map((l) => `  │ ${l}`).join('\n'));
  for (const cut of ['showcase', 'reel']) {
    const file = path.join(OUT, `sound-${cut}.wav`);
    check(`${cut}: WAV sized to the cut (${T.cutDuration(cut).toFixed(2)} s)`, () => {
      const { ch, sr } = E.readWav(file);
      assert.equal(sr, SR);
      assert.equal(ch.length, 2);
      assert.equal(ch[0].length, Math.round(T.cutDuration(cut) * SR));
    });
    const m = loudness(E.readAudio(file));
    lufs[cut] = m;
    const target = cut === 'reel' ? -14 : -17;
    check(`${cut}: ${fmt(m.integrated)} LUFS (target ${target} ± 1.5), true peak ${fmt(m.truePeak)} dBTP (≤ -1)`, () => {
      near(m.integrated, target, 1.5, 'integrated');
      assert.ok(m.truePeak <= -0.95, 'true peak');
    });
  }
  check('design is deterministic: the same cut renders to the same bytes', () => {
    const hash = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
    const first = hash(path.join(OUT, 'sound-reel.wav'));
    design(['reel']);
    assert.equal(hash(path.join(OUT, 'sound-reel.wav')), first);
  });
  check('ONLY=whoosh renders that layer alone, beside the full mix', () => {
    const o2 = design(['reel'], { ONLY: 'whoosh' });
    assert.match(o2, /ONLY whoosh/);
    const w = loudness(E.readAudio(path.join(OUT, 'sound-reel-whoosh.wav')));
    assert.ok(w.integrated < lufs.reel.integrated - 3, `whoosh layer ${fmt(w.integrated)} vs full ${fmt(lufs.reel.integrated)}`);
  });
  check('a gain argument moves the level by about that many dB (the clip and limiter give a little back)', () => {
    design(['showcase', '-3'], { OUT: path.join(OUT, 'quieter') });
    const q = loudness(E.readAudio(path.join(OUT, 'quieter', 'sound-showcase.wav')));
    near(q.integrated, lufs.showcase.integrated - 3, 0.6, 'dB');
  });
  check('--fit lands on the target', () => {
    const o3 = design(['reel', '--fit'], { OUT: path.join(OUT, 'fit') });
    assert.match(o3, /in CUT_GAIN_DB/);
    near(loudness(E.readAudio(path.join(OUT, 'fit', 'sound-reel.wav'))).integrated, -14, 0.3, 'fitted');
  });
  check('WHOOSH_REF grows every whoosh from a reference', () => {
    const o4 = design(['showcase'], { OUT: path.join(OUT, 'grown-design'), WHOOSH_REF: path.join(OUT, 'ref-whoosh.wav') });
    assert.match(o4, /whooshes grown from/);
    console.log(o4.trimEnd().split('\n').filter((l) => /loudness|layers|whooshes sit/.test(l)).map((l) => `        ${l.trim()}`).join('\n'));
  });
  spectrogram([{ name: 'sound-reel.wav', ...E.readAudio(path.join(OUT, 'sound-reel.wav')) }], path.join(OUT, 'sound-reel.png'));
  spectrogram([{ name: 'sound-showcase.wav', ...E.readAudio(path.join(OUT, 'sound-showcase.wav')) }], path.join(OUT, 'sound-showcase.png'));
  console.log('  wrote sound/test/out/sound-showcase.wav, sound-reel.wav and their spectrograms');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
