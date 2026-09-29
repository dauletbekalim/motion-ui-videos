// sound/score.mjs: what sounds where, per cut. Every cue is placed on a mark
// from src/cuts.json (through `at`, which knows each scene's start, the
// crossfades and any warp), so when a moment is re-timed in cuts.json its
// sound moves with it, and picture and sound never drift.
//
// Each cut has a `case` in score(). `byMarks(k, CALM | PUNCH)` scores every
// scene of the cut, in one of two ways:
//
// 1. By hand (SHEETS, below): a cue sheet per scene id, written while looking
//    at the scene's code. It places sounds on the scene's marks and on the
//    moves the scene derives from them (a camera push from `click1 - 0.3` to
//    `typeStart - 0.1`, a fragment landing at its own staggered time), so each
//    sound lands on the frame where its picture happens. A sheet names the
//    marks it needs; a scene missing one is scored by name instead.
// 2. By mark name (RULES, further down): any other scene is scored from the
//    names of its marks (click*, *typeStart … *typeEnd, paletteOpen, cardIn1,
//    ctaIn …). A mark no rule knows stays silent: captions, for one, should
//    never make noise. A new scene has sound from the start this way; give it
//    a sheet once its picture settles.
//
// On top, in each case: `pads(k, …)`, a quiet chord under every scene;
// `transitions(k)` on phone cuts, a whoosh through every cut that has none;
// and `beat(k, { bpm: 120 })` for the reel and the story, a light beat whose
// grid the scene cuts land on. Add a cut's own extra cues in its case, on
// marks nothing else sounds yet (`node sound/design.mjs <cut> --cues` shows
// what is already there).
//
// Taste, from real feedback on a launch film:
// - one thing at a time on a showcase; a reel can stack a hit on a whoosh
// - whooshes carry a move, they never cover a click or a key
// - every whoosh is new (a fresh seed or a fresh growth from the reference):
//   the same whoosh twice in a row sounds like a machine
// - keys land on the frame each character appears; remote typing (a
//   teammate) is quieter and further off than yours
// - pops that land in the same scene stay in that scene's chord
//
// Whooshes: drop a whoosh you like into sound/refs/ (whoosh.wav, .mp3, .ogg,
// .m4a or .flac; the folder is gitignored) and every whoosh grows fresh from
// it (tools/grow.mjs). WHOOSH_REF=path/to/file picks another file. Without
// one they are synthesized; SYNTH_WHOOSH=1 forces that.
//
//   node sound/design.mjs reel --cues   prints every cue this file placed, by time
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { click, key, tick, pop, chime, thump, tone, whoosh, riser, pad, step, kick, hat, snareish, note, beats, place, placePeak, rng } from './engine.mjs';
import { getCut, scenesOf, cutDuration, fpsOf, snap } from './timeline.mjs';
import { profileOf, grow } from './tools/grow.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REFS = path.join(HERE, 'refs');
const SRC = path.join(HERE, '..', 'src');

// What is typed on screen, by cut, scene and typeStart mark: with the text the
// keys land on the exact frame each character appears (Typed's own timing,
// ported below), and a space gets the space bar. Without it, keys run at ~18
// a second between the marks. Copy these from the scenes (sound/test/run.mjs
// fails if one is no longer in src/).
export const TYPED = {
  'showcase/problem/typeStart': 'Q3 launch plan',
  'showcase/how/typeStart': 'Q3 launch plan',
  'showcase/how/paletteTypeStart': 'share',
  'showcase/how/teamTypeStart': 'Draft the launch email',
  'showcase/features/typeStart': 'roadmap',
  'reel/reelProblem/typeStart': 'launch plan',
  'reel/reelPalette/typeStart': 'launch',
  'reel/reelLive/typeStart': 'Draft the launch email',
};

/** Formats watched on phones and in feeds: punchy, and stereo kept narrow (phone speakers are nearly mono). */
const PHONE = new Set(['reel', 'story', 'portrait', 'appstore', 'square']);

/** The reference whoosh: env WHOOSH_REF, else sound/refs/whoosh.*, else none. */
export function refWhoosh() {
  if (process.env.SYNTH_WHOOSH) return null;
  if (process.env.WHOOSH_REF) {
    if (!fs.existsSync(process.env.WHOOSH_REF)) throw new Error(`WHOOSH_REF=${process.env.WHOOSH_REF}: no such file`);
    return process.env.WHOOSH_REF;
  }
  for (const ext of ['wav', 'mp3', 'ogg', 'm4a', 'flac', 'aif', 'aiff']) {
    const f = path.join(REFS, `whoosh.${ext}`);
    if (fs.existsSync(f)) return f;
  }
  return null;
}

/**
 * Styles. Calm (showcases, loops): softer whooshes, no transitions, no beat.
 * Punch (phone cuts): hits, a whoosh on every cut, a fuller and brighter pad.
 * `air` scales every whoosh, `ui` every click, key and pop, `hit` every low
 * thump. Phone speakers barely play a 60 Hz hit, and at -14 LUFS a full one
 * only eats the headroom the clicks need: a phone cut's hits sit lower.
 */
const CALM = { name: 'calm', punch: false, pad: 1, bright: 1, air: 0.6, ui: 0.9, hit: 0.9 };
const PUNCH = { name: 'punch', punch: true, pad: 1.1, bright: 1.3, air: 0.75, ui: 0.9, hit: 0.65 };

/**
 * Place the cues for `cut` into `mix`. `at(scene, markOrSeconds)` gives cut
 * seconds (design.mjs binds it to timeline.mjs's `at` for this cut). Returns
 * a short summary for the log.
 */
export function score(cut, mix, at) {
  const k = kit(cut, mix, at);
  switch (cut) {
    case 'showcase':
      // 16:9, calm: the UI speaks, the pad sits under it, one thing at a time
      byMarks(k, CALM);
      pads(k, CALM);
      break;
    case 'reel':
      // 9:16, punchy: a hit on the first frame, a whoosh on every cut, a beat that drops in on the reveal
      byMarks(k, PUNCH);
      transitions(k);
      pads(k, PUNCH);
      beat(k, { bpm: 120 });
      break;
    case 'story': {
      // 9:16 and short: the beat comes in with the card, on a grid through the title,
      // and ends on the last downbeat at least 1.5 s before the end, so it rings out
      byMarks(k, PUNCH);
      pads(k, PUNCH);
      const title = k.find('story', 'title');
      const card = k.find('story', 'cardIn');
      if (title != null && card != null) beat(k, { bpm: 120, anchor: title, from: card, final: downbeatBefore(k.end - 1.5, title, 120) });
      break;
    }
    case 'loop':
      // loops usually play muted on a page; if this one has sound, the UI only
      byMarks(k, CALM);
      break;
    default: {
      // a cut this file does not know yet: its scenes' sheets and marks, styled by its format
      const style = PHONE.has(k.plan.format) ? PUNCH : CALM;
      byMarks(k, style);
      if (style.punch) transitions(k);
      pads(k, style);
    }
  }
  return k.summary();
}

/* ── Typed's timing, ported from src/lib/text.tsx and src/lib/anim.ts ─── */

function rand(seed) {
  let h = Math.imul((seed | 0) ^ 0x9e3779b1, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
/** When each character appears (scene seconds), exactly as Typed draws it. */
export function typedTimes(text, start, cps) {
  return Array.from(text, (_, i) => start + (i + 0.35 * (rand(i * 7 + 11) - 0.5)) / cps);
}

/** A CSS cubic-bezier easing, as Remotion's Easing.bezier: x (time 0 → 1) → y (progress 0 → 1). */
function cubicBezier(x1, y1, x2, y2) {
  const bx = (u) => 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
  const by = (u) => 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  return (x) => {
    let lo = 0, hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (bx(mid) < x) lo = mid;
      else hi = mid;
    }
    return by((lo + hi) / 2);
  };
}
/** EASINGS.inOut in src/lib/anim.ts: cursors, cameras, things travelling. */
const IN_OUT = cubicBezier(0.65, 0, 0.35, 1);
/** The fraction of an eased move's time at which it has covered `k` of its distance. */
function whenEased(ease, k) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (ease(mid) < k) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/* ── layouts read from the picture's source, so a pan follows the frame ── */

/**
 * Numbers or strings from a list literal in a src/ file: `field` of every
 * entry of `export const NAME = [ ... ];`. Returns [] if it can't be read,
 * and the sound then falls back to a neutral spread: a pan is a nicety.
 */
function fromSource(file, name, field) {
  try {
    const src = fs.readFileSync(path.join(SRC, file), 'utf8');
    const body = new RegExp(`export const ${name}\\b[^=]*=\\s*\\[([\\s\\S]*?)\\n\\];`).exec(src)?.[1] ?? '';
    return [...body.matchAll(new RegExp(`\\b${field}:\\s*(-?[\\d.]+|'[^']*')`, 'g'))].map((m) => (m[1][0] === "'" ? m[1].slice(1, -1) : Number(m[1])));
  } catch {
    return [];
  }
}
const LAYOUT = {
  scatterWide: fromSource('scenes/common.tsx', 'SCATTER_WIDE', 'x'),
  scatterTall: fromSource('scenes/common.tsx', 'SCATTER_TALL', 'x'),
  fragmentApp: fromSource('product/Fragments.tsx', 'FRAGMENTS', 'app'),
  apps: fromSource('product/Fragments.tsx', 'APPS', 'id'),
};
const FRAGMENTS = Math.max(LAYOUT.scatterWide.length, 16);
/** A fragment's pan where it sits scattered (its card is ~280 px wide). */
const scatterPan = (i, W = 1920, xs = LAYOUT.scatterWide) => (xs[i] != null ? Math.max(-1, Math.min(1, (xs[i] + 140 - W / 2) / (W / 2))) : ((i * 7) % 5) / 2 - 1);

/* ── the kit: helpers bound to one cut ─────────────────────────────────── */

/** The helpers every sheet and rule uses, bound to one cut and one mix (exported for sound/test/run.mjs). */
export function kit(cut, mix, at) {
  const plan = getCut(cut);
  const scenes = scenesOf(cut);
  const phone = PHONE.has(plan.format);
  const fps = fpsOf(cut);
  const width = plan.format === 'square' ? 0.6 : phone ? 0.35 : 1;
  // every sound gets its own seed: no two are the same, and every render is the same again
  let n = [...cut].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 100000, 7) * 1000;
  const seed = () => ++n;
  const r = rng(n + 1);
  const ref = refWhoosh();
  const prof = ref ? profileOf(ref) : null;
  const scalePan = (p) => (Array.isArray(p) ? p.map((x) => x * width) : (p ?? 0) * width);
  const k = {
    cut, plan, scenes, phone, mix, at, seed, r, fps,
    /** CALM or PUNCH: set by byMarks(k, style) and pads(k, style); every level below leans on it. */
    style: phone ? PUNCH : CALM,
    end: cutDuration(cut),
    byHand: [],
    byRule: [],
    /** Where every whoosh placed so far peaks (cut seconds), so two never stack on one moment. */
    swishes: [],
    /** Where every low hit lands (cut seconds), so a kick never doubles one. */
    hits: [],
    /** Where every riser ends (cut seconds). */
    risers: [],

    /** A scene, bound for a sheet: s.t(markOrSceneSeconds) → cut seconds (null for a missing mark). */
    scene(scene, si) {
      return {
        ...scene,
        si,
        t: (m) => (typeof m === 'string' ? (Number.isFinite(scene.marks[m]) ? at(scene.id, m) : null) : Number.isFinite(m) ? at(scene.id, m) : null),
      };
    },
    /** A mark as cut seconds, or null when the scene doesn't have it. */
    mark(scene, name) {
      return Number.isFinite(scene.marks[name]) ? at(scene.id, name) : null;
    },
    /** The first scene with this id's mark, as cut seconds, or null. */
    find(sceneId, name) {
      const s = scenes.find((x) => x.id === sceneId);
      return s ? k.mark(s, name) : null;
    },
    /** Marks whose names match `re`, earliest first: [{ name, sec (scene), t (cut) }]. */
    marks(scene, re) {
      return Object.entries(scene.marks)
        .filter(([name, sec]) => re.test(name) && Number.isFinite(sec))
        .map(([name, sec]) => ({ name, sec, t: at(scene.id, name) }))
        .sort((a, b) => a.t - b.t);
    },
    put(sound, t, opts = {}) {
      if (t == null) return false;
      return place(mix, sound, t, { ...opts, pan: scalePan(opts.pan) });
    },
    peak(sound, t, opts = {}) {
      if (t == null) return false;
      return placePeak(mix, sound, t, { ...opts, pan: scalePan(opts.pan) });
    },

    /*
     * The palette, at house level × the style. All times in cut seconds, and a
     * null or undefined time (a missing mark, from s.t() or k.mark()) places
     * nothing: every helper returns false before it makes a sound, so a gap in
     * the marks is silence, never a sound at 0 s.
     */
    click(t, { gain = 1, pan = 0, bright = 1 } = {}) {
      if (t == null) return false;
      return k.put(click({ seed: seed(), bright }), t, { gain: gain * k.style.ui, pan });
    },
    key(t, { gain = 1, pan = 0, pitch = 1, space = false, room } = {}) {
      if (t == null) return false;
      return k.put(key({ seed: seed(), pitch, space }), t, { gain: gain * k.style.ui, pan, room });
    },
    tick(t, { gain = 1, pan = 0, tone = 4200 } = {}) {
      if (t == null) return false;
      return k.put(tick({ seed: seed(), tone }), t, { gain: gain * k.style.ui, pan });
    },
    pop(t, name, { gain = 1, pan = 0, from = 1.5, dur = 0.25 } = {}) {
      if (t == null) return false;
      return k.put(pop({ f: note(name), from, dur, seed: seed() }), t, { gain: gain * k.style.ui, pan });
    },
    chime(t, notes, { gain = 1, pan = 0, dur = 1.4, spread = 0.03 } = {}) {
      if (t == null) return false;
      return k.put(chime({ notes, dur, spread }), t, { gain, pan });
    },
    thump(t, { f = 60, dur = 0.5, gain = 1 } = {}) {
      if (t == null) return false;
      k.hits.push(t);
      return k.put(thump({ f, dur, seed: seed() }), t, { gain: gain * k.style.hit });
    },
    /** Steady tension that swells into `t` (loudest at its end): two notes a semitone apart, beating evenly. */
    tension(t, { dur = 0.6, gain = 1, notes = ['D#3'] } = {}) {
      if (t == null) return false;
      return k.peak(tone({ notes, dur }), t, { gain });
    },
    /** A build that ends on `t` (one per moment: a second riser into the same hit is skipped). */
    riser(t, { dur = 1.2, gain = 1 } = {}) {
      if (t == null || k.risers.some((x) => Math.abs(x - t) < 0.1)) return false;
      k.risers.push(t);
      return k.peak(riser({ dur, seed: seed() }), t, { gain: gain * k.style.air });
    },
    step(t, { gain = 1, pan = 0 } = {}) {
      if (t == null) return false;
      return k.put(step({ f: r() < 0.5 ? 900 : 1150, seed: seed() }), t, { gain, pan });
    },
    /**
     * A whoosh loudest at `t`, for a move lasting about `dur` seconds. `size`
     * of what moves: small is higher and quicker, big lower and longer.
     * `rise` sweeps up (things arriving), else down (things leaving).
     */
    swish(t, { dur = 0.6, size = 1, pan = 0, gain = 1, rise = true } = {}) {
      if (t == null) return false;
      k.swishes.push(t);
      const s = seed();
      const jitter = 0.92 + rng(s)() * 0.16;
      const g = gain * k.style.air;
      if (prof) {
        // grown from the reference: stretched toward the move, pitched by size, a little Doppler
        const span = (prof.off - prof.on) * Math.min(1.8, Math.max(0.7, Math.sqrt(dur / 0.4)));
        const tilt = rise ? 1.05 : 0.95;
        return k.peak(grow(prof, { dur: span, pitch: Math.sqrt(1 / size) * jitter, bend: [1 / tilt, tilt], seed: s, trimDb: -1.5 }), t, { gain: g, pan });
      }
      const f0 = ((rise ? 320 : 1500) / Math.sqrt(size)) * jitter;
      const f1 = ((rise ? 1500 : 320) / Math.sqrt(size)) * jitter;
      return k.peak(whoosh({ dur, f0, f1, peak: rise ? 0.55 : 0.35, seed: s }), t, { gain: g, pan });
    },
    /** A whoosh, unless another already peaks within 0.45 s of `t` (two at once is one too many). */
    swishFree(t, opts = {}) {
      if (t == null || k.swishes.some((w) => Math.abs(w - t) < 0.45)) return false;
      return k.swish(t, opts);
    },
    /**
     * The whoosh of an eased move (a camera push, a pan) from scene second
     * `from` to `to`: loudest where the move is fastest, its middle for an
     * in-out ease, lasting about as long as the move.
     */
    move(s, from, to, { size = 1.3, gain = 1, pan = 0, rise = true } = {}) {
      const a = s.t(from), b = s.t(to);
      if (a == null || b == null) return false;
      return k.swish((a + b) / 2, { dur: Math.min(1.6, Math.max(0.4, (b - a) * 1.2)), size, gain, pan, rise });
    },
    /**
     * Laptop keys for text typed from scene second `from` to `to`: on the
     * frame each character of `text` appears (Typed's timing), else ~18 a
     * second. Scene seconds (or mark names), so a warped scene types faster,
     * as it does on screen. `remote`: someone else typing, quieter and further
     * off. A missing `from` or `to` (null, undefined, or arithmetic on a
     * missing mark) types nothing, and a key whose time `at` can't place is
     * skipped: never snap(null), which is 0, a key at the start of the cut.
     */
    typing(s, from, to, { text, pan = -0.08, gain = 0.85, pitch = 1, remote = false } = {}) {
      const toSec = (m) => (typeof m === 'string' ? s.marks?.[m] : m);
      from = toSec(from);
      to = toSec(to);
      if (!Number.isFinite(from) || !Number.isFinite(to)) return false;
      const rr = rng(seed());
      const chars = text ?? 'x'.repeat(Math.max(1, Math.round((to - from) * 18)));
      const times = typedTimes(chars, from, chars.length / Math.max(1e-3, to - from));
      const g = gain * (remote ? 0.55 : 1);
      let placed = false;
      times.forEach((sec, i) => {
        const space = text ? chars[i] === ' ' : i > 1 && rr() < 0.16;
        const t = at(s.id, sec);
        if (t == null || !Number.isFinite(t)) return;
        // the character shows on the first frame at or after its time; so does its key
        if (k.key(fps ? snap(t, fps) : t, { gain: g * (0.85 + rr() * 0.3), pan, pitch: pitch * (remote ? 0.94 : 1), space, room: remote ? 0.3 : undefined })) placed = true;
      });
      return placed;
    },
    summary() {
      const counts = Object.entries(mix.count).map(([b, c]) => `${b} ${c}`).join(' · ');
      const how = [k.byHand.length ? `by hand: ${k.byHand.join(', ')}` : '', k.byRule.length ? `by mark name: ${k.byRule.join(', ')}` : ''].filter(Boolean).join(' · ');
      return `${counts || 'nothing placed'} · ${how}${prof ? ` · whooshes grown from ${path.relative(process.cwd(), ref)}` : ' · synthesized whooshes'}`;
    },
  };
  return k;
}

/* ── the demo's cue sheets, by scene id ────────────────────────────────── */

// Each sheet mirrors its scene in src/scenes/: where a scene times a move off
// a mark (`m.click1 - 0.3`), the sheet uses the same expression. Change one,
// change the other. Pops land ~0.04 s after their mark: a spring starts from
// rest, and the eye reads the landing, not the first frame of the move.
const LAND = 0.04;

const SHEETS = {
  /** Showcase 0–4 s: the line, then sixteen fragments fly in from outside the frame. */
  hook: {
    needs: ['title', 'fragmentsIn'],
    cue(k, s) {
      const m = s.marks;
      // a slow, low swell under the first words
      k.swish(s.t(m.title + 0.45), { dur: 1.6, size: 1.8, gain: 0.8 });
      // each fragment is its own tiny whoosh (a swarm, never one sample repeated), panned from
      // off-screen to where it lands, and a tiny pop as it settles. Times: arrival() in common.tsx.
      for (let i = 0; i < FRAGMENTS; i++) {
        const order = Math.floor(rand(i * 13 + 5) * 1000) % 16;
        const start = m.fragmentsIn + ((order + i) % 16) * 0.045;
        const p = scatterPan(i);
        // a calm spring from 1100 px out: it crosses into the frame ~0.15 s in, still fast, and has landed by ~0.35 s
        k.swish(s.t(start + 0.16), { dur: 0.34, size: 0.45, gain: 0.42, pan: [Math.sign(p || 1) * Math.min(1, Math.abs(p) + 0.5), p] });
        k.pop(s.t(start + 0.33), ['A5', 'C6', 'E6', 'B5', 'E5'][i % 5], { gain: 0.13, from: 1.2, dur: 0.1, pan: p });
      }
    },
  },

  /** Showcase: five apps, the fragments sort into them, a search comes up empty everywhere. */
  problem: {
    needs: ['appsIn', 'sort', 'searchIn', 'typeStart', 'typeEnd', 'noResults'],
    cue(k, s) {
      const m = s.marks;
      const appPan = (idx) => [-0.68, -0.34, 0, 0.34, 0.68][idx] ?? 0;
      // five windows pop in, left to right (appsIn + idx × 0.07, bouncy)
      ['A4', 'C5', 'E5', 'A4', 'E4'].forEach((n, idx) => k.pop(s.t(m.appsIn + idx * 0.07 + LAND), n, { gain: 0.42, dur: 0.22, pan: appPan(idx) }));
      // the sort: each fragment travels from where it sat to its app's window, fastest mid-flight
      // (Problem.tsx: flight(i) = prog(t, sort + ((i × 7) % 16) × 0.045, 0.85, inOut)); a tick as it lands in its row
      for (let i = 0; i < FRAGMENTS; i++) {
        const start = m.sort + ((i * 7) % 16) * 0.045;
        const idx = Math.max(0, LAYOUT.apps.indexOf(LAYOUT.fragmentApp[i]));
        k.swish(s.t(start + 0.425), { dur: 0.7, size: 0.6, gain: 0.38, pan: [scatterPan(i), appPan(idx)] });
        k.tick(s.t(start + 0.8), { gain: 0.35, tone: 3000 + (i % 4) * 300, pan: appPan(idx) });
      }
      // the search bar drops in; the query is typed
      k.pop(s.t(m.searchIn + LAND), 'D5', { gain: 0.5, from: 1.3, dur: 0.2 });
      k.typing(s, m.typeStart, m.typeEnd, { text: TYPED[`${k.cut}/${s.id}/typeStart`] });
      // nothing found: a steady beating tone swells into a soft low dud, and each app's miss lands left to right
      k.tension(s.t('noResults'), { dur: 0.5, gain: 0.6 });
      k.pop(s.t(m.noResults), 'G3', { gain: 0.8, from: 1.25, dur: 0.35 });
      ['E4', 'D4', 'C4', 'A3', 'G3'].forEach((n, idx) => k.pop(s.t(m.noResults + idx * 0.06 + LAND), n, { gain: 0.18, from: 1.15, dur: 0.14, pan: appPan(idx) }));
    },
  },

  /** The product arrives: a build, a low hit and a bright chord as the mark pops; the name slides out. Showcase and reel (warped). */
  reveal: {
    needs: ['logo', 'wordmark'],
    cue(k, s) {
      const m = s.marks;
      const hit = s.t('logo');
      const punch = k.style.punch;
      k.riser(hit, { dur: punch ? 1.0 : 1.4, gain: punch ? 1 : 0.7 });
      k.thump(hit, { f: 55, dur: 0.8, gain: punch ? 1 : 0.8 });
      k.chime(hit, ['C5', 'E5', 'G5', 'D6'], { dur: 3.2, spread: 0.018, gain: 0.95 });
      // the wordmark slides out of the mark, fastest at its start (EASE): a small whoosh leaning right
      k.swish(s.t(m.wordmark + 0.12), { dur: 0.5, size: 0.9, gain: 1.1, pan: [-0.1, 0.35] });
    },
  },

  /** Showcase, how it works: a click, a title typed, ⌘K, share, invite, copy, teammates arriving. */
  how: {
    needs: ['click1', 'noteIn', 'typeStart', 'typeEnd', 'listIn', 'keys', 'paletteOpen', 'paletteTypeStart', 'paletteTypeEnd', 'paletteSelect', 'shareOpen', 'click2', 'join1', 'join2', 'join3', 'click3', 'toast', 'shareClose', 'cursorsIn', 'teamTypeStart', 'teamTypeEnd', 'check1'],
    cue(k, s) {
      const m = s.marks;
      // the camera (How.tsx keys): in on the note, out for the palette, a lean to the dialog and back, in on the team
      k.move(s, m.click1 - 0.3, m.typeStart - 0.1, { size: 1.5, gain: 1.1 });
      k.move(s, m.keys - 0.5, m.paletteOpen + 0.1, { size: 1.5, gain: 1, rise: false });
      k.move(s, m.shareClose, m.shareClose + 0.6, { size: 1.3, gain: 0.85, rise: false });
      k.move(s, m.cursorsIn - 0.1, m.cursorsIn + 0.8, { size: 1.5, gain: 1.1 });

      // New note: the click (left, in the sidebar), the row arriving in the list, the title typed
      k.click(s.t('click1'), { pan: -0.45 });
      k.pop(s.t(m.noteIn + LAND), 'E5', { gain: 0.35, dur: 0.2, pan: -0.4 });
      k.typing(s, m.typeStart, m.typeEnd, { text: TYPED[`${k.cut}/${s.id}/typeStart`], pan: -0.15 });
      // the note's first three blocks settle in (listIn, +0.1, +0.2)
      ['C5', 'D5', 'E5'].forEach((n, i) => k.pop(s.t(m.listIn + i * 0.1 + LAND), n, { gain: 0.2, dur: 0.16, pan: -0.05 }));

      // ⌘K: the keycaps press at `keys` and `keys + 0.04` (Keycaps in common.tsx); the palette opens
      k.key(s.t('keys'), { gain: 1.15, pitch: 0.95 });
      k.key(s.t(m.keys + 0.04), { gain: 1.1 });
      k.pop(s.t(m.paletteOpen + LAND), 'G5', { gain: 0.45, from: 1.3, dur: 0.18 });
      k.typing(s, m.paletteTypeStart, m.paletteTypeEnd, { text: TYPED[`${k.cut}/${s.id}/paletteTypeStart`], pan: 0 });
      k.key(s.t('paletteSelect'), { gain: 1.05, pitch: 1.1, space: true });

      // the share dialog opens (with a small camera lean): one soft whoosh and a pop
      k.swish(s.t(m.shareOpen + 0.12), { dur: 0.55, size: 0.9, gain: 1.1 });
      k.pop(s.t(m.shareOpen + LAND), 'D5', { gain: 0.4, from: 1.3, dur: 0.2 });
      // invite: the click, then three teammates pop in, rising
      k.click(s.t('click2'), { pan: 0.2 });
      ['E5', 'G5', 'A5'].forEach((n, i) => k.pop(s.t(m[`join${i + 1}`] + LAND), n, { gain: 0.55, dur: 0.22, pan: -0.15 + i * 0.15 }));
      // copy link: the click and a quiet success
      k.click(s.t('click3'), { pan: 0.15 });
      k.pop(s.t(m.toast + LAND), 'E5', { gain: 0.45, dur: 0.22 });
      k.chime(s.t(m.toast + 0.06), ['B5', 'E6'], { dur: 1.1, spread: 0.07, gain: 0.4 });
      // the dialog closes as the camera leans back: covered by the move above

      // Maya's cursor arrives, Theo types (remote: quieter, further off), Maya ticks a box
      k.pop(s.t(m.cursorsIn + 0.1), 'C6', { gain: 0.2, from: 1.2, dur: 0.14, pan: 0.4 });
      k.typing(s, m.teamTypeStart, m.teamTypeEnd, { text: TYPED[`${k.cut}/${s.id}/teamTypeStart`], pan: -0.2, remote: true });
      k.click(s.t('check1'), { bright: 1.25, gain: 0.85, pan: -0.35 });
      k.pop(s.t(m.check1 + 0.01), 'G6', { gain: 0.3, from: 1.2, dur: 0.12, pan: -0.35 });
    },
  },

  /** Showcase: three feature cards, the camera takes each in turn, then steps back. */
  features: {
    needs: ['cardIn1', 'cardIn2', 'cardIn3', 'focus1', 'focus2', 'focus3', 'typeStart', 'typeEnd', 'scrub', 'restore'],
    cue(k, s) {
      const m = s.marks;
      // three cards rise in (bouncy, 0.15 s apart): one whoosh for the group, a pop each in the scene's chord
      k.swish(s.t(m.cardIn2 + 0.06), { dur: 0.7, size: 1.2, gain: 1.15 });
      ['A4', 'C5', 'E5'].forEach((n, i) => k.pop(s.t(m[`cardIn${i + 1}`] + 0.06), n, { gain: 0.5, dur: 0.24, pan: [-0.5, 0, 0.5][i] }));
      // the camera (Features.tsx keys): in on card 1, across to 2, across to 3; each move 0.8 s from 0.1 s before its mark
      k.move(s, m.focus1 - 0.1, m.focus1 + 0.7, { size: 1.5, gain: 1.05 });
      k.move(s, m.focus2 - 0.1, m.focus2 + 0.7, { size: 1.3, gain: 0.9, pan: [-0.35, 0.35] });
      k.move(s, m.focus3 - 0.1, m.focus3 + 0.7, { size: 1.3, gain: 0.9, pan: [-0.35, 0.35] });
      // search: "roadmap" typed, three results tick in (typeEnd + 0.1 + i × 0.09)
      k.typing(s, m.typeStart, m.typeEnd, { text: TYPED[`${k.cut}/${s.id}/typeStart`], pan: 0 });
      for (let i = 0; i < 3; i++) k.tick(s.t(m.typeEnd + 0.1 + i * 0.09 + 0.03), { gain: 0.5, tone: 3600 - i * 250 });
      // history: the scrubber slides back over three dots (0.8 s, in-out); a tick as it passes each one, lower as it goes back
      [1 / 3, 2 / 3, 1].forEach((kk, i) => k.tick(s.t(m.scrub + 0.8 * whenEased(IN_OUT, kk)), { gain: 0.7, tone: 4400 - i * 500, pan: 0.08 - i * 0.06 }));
      // restored: the badge pops, a small success
      k.pop(s.t(m.restore + LAND), 'C6', { gain: 0.5, dur: 0.2 });
      k.chime(s.t(m.restore + 0.06), ['E5', 'A5'], { dur: 1.0, spread: 0.06, gain: 0.35 });
      // and the camera steps back to all three, which hold until the cut to the end card
      k.move(s, m.restore + 0.4, m.restore + 1.2, { size: 1.6, gain: 1, rise: false });
    },
  },

  /** The end card, showcase and reel: the mark lands, the name and address, the call to action. */
  end: {
    needs: ['logo', 'ctaIn'],
    cue(k, s) {
      const m = s.marks;
      // the mark lands; its whoosh gives way to the camera move or cut that brought us here
      k.swishFree(s.t(m.logo + 0.06), { dur: 0.6, size: 1.1, gain: 1.1 });
      k.pop(s.t(m.logo + LAND), 'G5', { gain: 0.7, dur: 0.3 });
      k.pop(s.t(m.ctaIn + LAND), 'C6', { gain: 0.75, dur: 0.26 });
      k.chime(s.t(m.ctaIn + 0.06), ['G5', 'D6'], { dur: 1.8, spread: 0.06, gain: 0.65 });
      // the shine that crosses the button (EndCard: ctaIn + 0.9, over 0.9 s): a faint glint mid-way
      k.chime(s.t(m.ctaIn + 1.35), ['B6'], { dur: 0.8, gain: 0.12, pan: 0.2 });
    },
  },

  /** Reel 0–2.7 s: the title is on frame 0 (slam), the mess creeps closer, a zoom punch blows it apart. */
  reelHook: {
    needs: ['title', 'burst'],
    cue(k, s) {
      const m = s.marks;
      // the slam: a low hit and a round knock on the very first frame, and a short falling breath after
      k.thump(s.t('title'), { f: 62, dur: 0.55, gain: 0.95 });
      k.pop(s.t('title'), 'A3', { gain: 0.5, from: 2.2, dur: 0.18 });
      k.swish(s.t(m.title + 0.05), { dur: 0.35, size: 0.8, gain: 1, rise: false });
      // the fragments creep toward the lens in near silence (air before a hit makes it land, and
      // the reel's one riser is the reveal's). The burst: a light hit, and the fragments fly out
      // past both edges, accelerating (EASINGS.in, 0.55 s)
      k.thump(s.t('burst'), { f: 66, dur: 0.45, gain: 0.7 });
      k.swish(s.t(m.burst + 0.3), { dur: 0.6, size: 1.2, gain: 1.2, pan: [-0.1, -0.9] });
      k.swish(s.t(m.burst + 0.36), { dur: 0.6, size: 1.1, gain: 1.15, pan: [0.1, 0.9] });
    },
  },

  /** Reel: a search shakes empty, then five apps slam in with a zero each. */
  reelProblem: {
    needs: ['typeStart', 'typeEnd', 'noResults', 'appsIn'],
    cue(k, s) {
      const m = s.marks;
      k.typing(s, m.typeStart, m.typeEnd, { text: TYPED[`${k.cut}/${s.id}/typeStart`] });
      k.tension(s.t('noResults'), { dur: Math.max(0.2, m.noResults - m.typeEnd + 0.05), gain: 0.75 });
      k.pop(s.t('noResults'), 'G3', { gain: 0.9, from: 1.3, dur: 0.35 });
      // the apps slam in as a stack (appsIn + i × 0.05, bouncy), from the left, the right, the left…: one low punch, five pops falling, each from its side
      k.thump(s.t('appsIn'), { f: 60, dur: 0.5, gain: 0.8 });
      ['E5', 'D5', 'C5', 'A4', 'G4'].forEach((n, i) => k.pop(s.t(m.appsIn + i * 0.05 + LAND), n, { gain: 0.45, dur: 0.18, pan: i % 2 ? 0.35 : -0.35 }));
    },
  },

  /** Reel: ⌘K as big keys, the palette, "launch", Enter, and the note punches in. */
  reelPalette: {
    needs: ['keys', 'paletteOpen', 'typeStart', 'typeEnd', 'enter', 'noteIn'],
    cue(k, s) {
      const m = s.marks;
      // the keycaps press at `keys` and `keys + 0.04` (Keycaps in common.tsx); big on screen, so a touch louder
      k.key(s.t('keys'), { gain: 1.3, pitch: 0.95 });
      k.key(s.t(m.keys + 0.04), { gain: 1.25 });
      k.swish(s.t(m.paletteOpen + 0.05), { dur: 0.35, size: 0.6, gain: 1 });
      k.pop(s.t(m.paletteOpen + LAND), 'G5', { gain: 0.5, from: 1.3, dur: 0.18 });
      k.typing(s, m.typeStart, m.typeEnd, { text: TYPED[`${k.cut}/${s.id}/typeStart`], pan: 0 });
      k.key(s.t('enter'), { gain: 1.2, pitch: 1.1, space: true });
      // the note punches in (0.3 s, snappy): a short whoosh, a soft hit, a pop
      k.swish(s.t(m.noteIn + 0.06), { dur: 0.4, size: 1, gain: 1.2 });
      k.thump(s.t('noteIn'), { f: 72, dur: 0.35, gain: 0.55 });
      k.pop(s.t(m.noteIn + LAND), 'E5', { gain: 0.5, dur: 0.22 });
    },
  },

  /** Reel, the "how": a tap on Share, the team arrives, a punch-in on them writing together. */
  reelLive: {
    needs: ['click1', 'join1', 'join2', 'join3', 'punch', 'typeStart', 'typeEnd', 'check'],
    cue(k, s) {
      const m = s.marks;
      k.click(s.t('click1'), { gain: 1.1, pan: 0.3 });
      ['E5', 'G5', 'A5'].forEach((n, i) => k.pop(s.t(m[`join${i + 1}`] + LAND), n, { gain: 0.6, dur: 0.22, pan: 0.2 + i * 0.1 }));
      // the camera punches in (0.18 s): a hit and a short whoosh
      k.thump(s.t('punch'), { f: 64, dur: 0.45, gain: 0.8 });
      k.swish(s.t(m.punch + 0.08), { dur: 0.3, size: 0.9, gain: 1.15 });
      k.typing(s, m.typeStart, m.typeEnd, { text: TYPED[`${k.cut}/${s.id}/typeStart`], pan: 0.1, remote: true });
      k.click(s.t('check'), { bright: 1.25, gain: 0.9, pan: -0.2 });
      k.pop(s.t(m.check + 0.01), 'G6', { gain: 0.35, from: 1.2, dur: 0.12, pan: -0.2 });
    },
  },

  /** Reel, the payoff: the mess flies into one window and lands as tidy notes. */
  reelPayoff: {
    needs: ['gather', 'settle'],
    cue(k, s) {
      const m = s.marks;
      // sixteen fragments fly into the left of the list's rows (ReelPayoff.tsx: land(i), 0.55 s in-out), each its own whoosh
      for (let i = 0; i < FRAGMENTS; i++) {
        const start = m.gather + ((i * 5) % 16) * 0.035;
        k.swish(s.t(start + 0.275), { dur: 0.45, size: 0.55, gain: 0.42, pan: [scatterPan(i, 1080, LAYOUT.scatterTall), -0.3] });
      }
      // the list is phone-sized (×2.45), so only its first four rows are in view as they arrive (gather + 0.35 + i × 0.07)
      for (let i = 0; i < 4; i++) k.tick(s.t(m.gather + 0.35 + i * 0.07 + 0.03), { gain: 0.55, tone: 3200 + i * 250 });
      // everything in one place: a soft landing and a bright little chord
      k.thump(s.t('settle'), { f: 70, dur: 0.4, gain: 0.6 });
      k.chime(s.t(m.settle + 0.02), ['G5', 'B5', 'D6'], { dur: 1.4, spread: 0.035, gain: 0.6 });
    },
  },

  /** An 8 s story: the mark, the headline, the product card, teammates, the call to action, "tap the link". */
  story: {
    needs: ['logo', 'cardIn', 'cursorsIn', 'ctaIn', 'pointer'],
    cue(k, s) {
      const m = s.marks;
      k.pop(s.t(m.logo + LAND), 'G5', { gain: 0.65, dur: 0.28 });
      k.swish(s.t(m.logo + 0.08), { dur: 0.45, size: 0.9, gain: 0.9 });
      // the card rises in (bouncy, rotating flat)
      k.swish(s.t(m.cardIn + 0.1), { dur: 0.6, size: 1.2, gain: 1.2 });
      k.pop(s.t(m.cardIn + LAND), 'E5', { gain: 0.55, dur: 0.24 });
      // two teammates' cursors appear (Maya, then Theo 0.15 s later)
      k.pop(s.t(m.cursorsIn + 0.05), 'C6', { gain: 0.3, from: 1.2, dur: 0.14, pan: -0.4 });
      k.pop(s.t(m.cursorsIn + 0.2), 'E6', { gain: 0.3, from: 1.2, dur: 0.14, pan: 0.4 });
      // the call to action, then the pointer at the link sticker's spot
      k.pop(s.t(m.ctaIn + LAND), 'C6', { gain: 0.7, dur: 0.26 });
      k.chime(s.t(m.ctaIn + 0.06), ['G5', 'D6'], { dur: 1.8, spread: 0.06, gain: 0.6 });
      k.pop(s.t(m.pointer + LAND), 'B5', { gain: 0.5, from: 1.3, dur: 0.2 });
    },
  },
};

/* ── scored by mark name: any scene without a sheet ────────────────────── */

const RISING = ['G4', 'B4', 'D5', 'G5', 'B5', 'D6'];
const ordinal = (name) => Math.max(0, (Number(/(\d+)$/.exec(name)?.[1]) || 1) - 1);

// [pattern, cue]: the first pattern that matches a mark's name places its cue.
// A cue gets (k, t, c): the kit, the cut time, and { name, scene, si, style, problem }.
const RULES = [
  [/type(start|end)/i, () => {}], // typing is placed in pairs, below
  [/^(click|tap)/i, (k, t) => k.click(t, { pan: (k.r() - 0.5) * 0.4 })],
  // a two-key shortcut (⌘K), pressed as Keycaps draws it: the second key 0.04 s after the first
  [/^(keys|shortcut)$/i, (k, t) => {
    k.key(t, { pitch: 0.95, pan: -0.1 });
    k.key(t + 0.04, { pan: -0.05 });
  }],
  [/^(enter|return|submit)$/i, (k, t) => k.key(t, { space: true, pitch: 1.1, gain: 1.1 })],
  [/^reveal/i, (k, t, c) => reveal(k, t, c.style)],
  [/^logo/i, (k, t, c) => {
    if (/reveal/i.test(c.scene.id) && !Number.isFinite(c.scene.marks.reveal)) return reveal(k, t, c.style);
    k.swish(t, { dur: 0.5, size: 0.8 });
    k.pop(t, 'G5', { dur: 0.3, gain: 0.8 });
  }],
  [/^wordmark/i, (k, t) => k.swish(t, { dur: 0.5, size: 0.9 })],
  [/^paletteOpen/i, (k, t) => {
    k.swish(t, { dur: 0.35, size: 0.6, gain: 1.1 });
    k.pop(t, 'A5', { from: 1.3, dur: 0.18, gain: 0.6 });
  }],
  [/Open$/, (k, t) => {
    k.swish(t, { dur: 0.4, size: 0.8 });
    k.pop(t, 'D5', { from: 1.3, dur: 0.2, gain: 0.5 });
  }],
  [/(Close|Out)$/, (k, t) => k.swish(t, { dur: 0.35, size: 0.8, gain: 0.8, rise: false })],
  [/^cardIn/i, (k, t, c) => {
    const i = ordinal(c.name);
    const pan = [-0.5, 0, 0.5][i % 3];
    k.swish(t, { dur: 0.4, size: 0.7, pan });
    k.pop(t, RISING[i % RISING.length], { pan });
  }],
  [/^join/i, (k, t, c) => {
    const i = ordinal(c.name);
    k.pop(t, RISING[(i + 2) % RISING.length], { dur: 0.22, gain: 0.75, pan: [-0.4, 0, 0.4][i % 3] });
  }],
  [/^toast/i, (k, t) => {
    k.pop(t, 'E5', { dur: 0.22, gain: 0.6 });
    k.chime(t + 0.03, ['B5', 'E6'], { dur: 1.1, spread: 0.07, gain: 0.45 });
  }],
  [/^check/i, (k, t) => {
    k.click(t, { bright: 1.25, gain: 0.8 });
    k.pop(t + 0.01, 'C6', { from: 1.2, dur: 0.12, gain: 0.35 });
  }],
  [/^select$|Select$/, (k, t) => k.click(t, { bright: 0.9, gain: 0.8 })],
  [/^(noResults|error|fail)/i, (k, t) => k.pop(t, 'G3', { from: 1.25, dur: 0.35, gain: 0.8 })],
  [/^ctaIn/i, (k, t) => {
    k.pop(t, 'G5', { dur: 0.3 });
    k.chime(t + 0.02, ['G5', 'D6'], { dur: 1.8, spread: 0.06, gain: 0.7 });
  }],
  [/^(hit|punch|slam)/i, (k, t, c) => {
    // one low hit; on a punchy cut a little higher, so phone speakers still get some of it
    k.thump(t, { f: c.style.punch ? 62 : 50, dur: 0.8, gain: 0.9 });
    // trouble, held steady: two notes a semitone apart, beating evenly, until it breaks
    if (c.problem) k.tension(t, { dur: 0.9, gain: 0.75 });
  }],
  [/^burst/i, (k, t) => {
    k.swish(t, { dur: 0.5, size: 1.2, gain: 1.2 });
    k.thump(t, { f: 66, dur: 0.45, gain: 0.6 });
  }],
  [/^(whoosh|swipe)/i, (k, t, c) => k.swish(t, { dur: 0.6, gain: 1.3, rise: !/out|leave|exit/i.test(c.name) })],
  [/^focus/i, (k, t) => k.swish(t, { dur: 0.9, size: 1.4 })],
  [/^(restore|back)/i, (k, t) => k.swish(t, { dur: 0.5, size: 1.1, rise: false })],
  [/^gather/i, (k, t) => k.swish(t, { dur: 0.7, size: 1.2, gain: 1.1 })],
  [/^settle/i, (k, t) => k.thump(t, { f: 72, dur: 0.35, gain: 0.45 })],
  [/^step/i, (k, t) => k.step(t)],
  [/^(done|success)/i, (k, t) => k.chime(t, ['E5', 'B5'], { dur: 1.4, spread: 0.075, gain: 0.8 })],
  [/^pointer/i, (k, t) => k.pop(t, 'B5', { from: 1.3, dur: 0.2, gain: 0.6 })],
  [/In$/, (k, t) => k.swish(t, { dur: 0.45, size: 0.8, gain: 0.8 })],
  [/^title$/, (k, t, c) => {
    // a punchy cut's first frame: the hook title slams in, and so does the sound
    if (c.si !== 0 || !c.style.punch) return;
    k.thump(t, { f: 62, dur: 0.5, gain: 0.9 });
    k.swish(t, { dur: 0.3, size: 0.7, gain: 1.05, rise: false });
  }],
];

/** Whoosh into a low thump and a bright chord: the product arrives. */
function reveal(k, t, style) {
  k.swish(t, { dur: 0.9, size: 1.5, gain: 1.3 });
  k.thump(t, { f: 55, dur: 0.7, gain: style.punch ? 1 : 0.9 });
  k.chime(t, ['C5', 'E5', 'G5', 'D6'], { dur: 3.2, spread: 0.018, gain: 1 });
}

/** When the product is revealed in this cut: a `reveal` mark, else `logo` in a reveal scene. */
function revealAt(k) {
  for (const s of k.scenes) {
    const t = k.mark(s, 'reveal') ?? (/reveal/i.test(s.id) ? k.mark(s, 'logo') : null);
    if (t != null) return t;
  }
  return null;
}

/**
 * Score every scene of the cut in `style`: from its cue sheet when it has one
 * (and the cut has every mark the sheet needs), else by its marks' names.
 */
function byMarks(k, style = k.style) {
  k.style = style;
  k.scenes.forEach((scene, si) => {
    const s = k.scene(scene, si);
    const sheet = SHEETS[scene.id];
    const missing = sheet ? sheet.needs.filter((n) => !Number.isFinite(scene.marks[n])) : [];
    if (sheet && !missing.length) {
      sheet.cue(k, s);
      k.byHand.push(scene.id);
    } else {
      byName(k, s);
      k.byRule.push(sheet ? `${scene.id} (its sheet needs ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '…' : ''})` : scene.id);
    }
  });
}

/** One scene, scored by the names of its marks (RULES). */
function byName(k, s) {
  const problem = /problem|pain|before|conflict|chaos|mess/i.test(s.id);
  for (const { name, t } of k.marks(s, /./)) {
    const rule = RULES.find(([re]) => re.test(name));
    if (rule) rule[1](k, t, { name, scene: s, si: s.si, style: k.style, problem });
  }
  // typing: every *typeStart with its *typeEnd (typeStart/typeEnd, paletteTypeStart/paletteTypeEnd…)
  for (const { name, sec } of k.marks(s, /typestart/i)) {
    const endName = name.replace(/start/i, (m) => (m[0] === 'S' ? 'End' : 'end'));
    const end = s.marks[endName];
    const text = TYPED[`${k.cut}/${s.id}/${name}`];
    k.typing(s, sec, Number.isFinite(end) ? end : sec + (text ? text.length / 18 : 1.2), { text });
  }
}

/** Punchy cuts: a whoosh through the middle of every crossfade, alternating direction, unless a cue already whooshes there. */
function transitions(k) {
  const cross = k.plan.cross ?? 0;
  k.scenes.slice(1).forEach((scene, i) => {
    const t = scene.start + cross / 2;
    if (k.swishes.some((w) => Math.abs(w - t) < 0.45)) return;
    const side = i % 2 ? 1 : -1;
    k.swish(t, { dur: Math.max(0.35, cross * 1.6), size: 1.1, gain: 1.4, pan: [side * 0.6, -side * 0.6] });
  });
}

/* ── the pad: a quiet chord under each scene ───────────────────────────── */

// Open, soft voicings from a real launch film, in C major / A minor: the hook
// and the problem darker, the reveal brightest, a lift before the end.
const CHORDS = {
  dark: { notes: ['A2', 'E3', 'B3', 'C4'], bright: 700, level: 0.8 },
  tense: { notes: ['A2', 'E3', 'F3', 'B3'], bright: 600, level: 0.85 },
  bright: { notes: ['F2', 'C3', 'A3', 'E4', 'G4'], bright: 2200, level: 1 },
  home: { notes: ['C3', 'G3', 'D4', 'E4'], bright: 1500, level: 0.9 },
  warm: { notes: ['F2', 'C3', 'E3', 'A3'], bright: 1500, level: 0.9 },
  lift: { notes: ['G2', 'D3', 'A3', 'B3'], bright: 1800, level: 0.9 },
  end: { notes: ['C3', 'G3', 'B3', 'D4', 'E4'], bright: 2600, level: 1 },
};
// the demo's scenes; any other scene is matched by its name below
const SCENE_CHORD = {
  hook: 'dark', problem: 'tense', reveal: 'bright', how: 'home', features: 'warm', end: 'end',
  reelHook: 'dark', reelProblem: 'tense', reelPalette: 'home', reelLive: 'warm', reelPayoff: 'lift', story: 'end', loop: 'home',
};
function chordFor(id, i) {
  if (SCENE_CHORD[id]) return CHORDS[SCENE_CHORD[id]];
  if (/hook|intro|open/i.test(id)) return CHORDS.dark;
  if (/problem|pain|before|conflict|chaos|mess/i.test(id)) return CHORDS.tense;
  if (/reveal|logo|brand|meet|launch/i.test(id)) return CHORDS.bright;
  if (/payoff|result|after/i.test(id)) return CHORDS.lift;
  if (/feature|benefit|grid|card/i.test(id)) return CHORDS.warm;
  if (/end|cta|close|outro|story|sign/i.test(id)) return CHORDS.end;
  return i % 2 ? CHORDS.warm : CHORDS.home;
}

function pads(k, style = k.style) {
  k.style = style;
  k.scenes.forEach((scene, i) => {
    const c = chordFor(scene.id, i);
    const from = Math.max(0, scene.start - 0.1);
    // the last chord lets go 0.8 s before the end, so its release rings out with the picture
    const last = i === k.scenes.length - 1;
    const dur = Math.max(0.5, (last ? k.end - 0.8 : scene.end - 0.1) - from);
    k.put(pad({ notes: c.notes, dur, bright: c.bright * k.style.bright, seed: 77 + i }), from, { gain: c.level * k.style.pad });
  });
}

/* ── the beat: kick on 1 and 3, a soft backbeat on 2 and 4, hats between ── */

/** The last downbeat (bar start) at or before `t` on a grid through `anchor`. */
function downbeatBefore(t, anchor, bpm = 120) {
  const bar = 240 / bpm;
  return anchor + Math.floor((t - anchor) / bar + 1e-6) * bar;
}

/**
 * A light beat: kick on 1 and 3, a soft backbeat on 2 and 4, hats on the
 * offbeats, under the UI. By default it is planned from the cut:
 *
 * - its grid runs through the reveal's hit (a `reveal` mark, or `logo` in a
 *   scene named reveal), else through the middle of the first scene cut, so
 *   scene lengths that are whole beats apart put every cut on a beat
 * - with two bars or more before the reveal it grooves from the second scene
 *   and drops out for the bar before the reveal while a riser builds into it
 *   (the reveal's own, when its sheet already placed one: a film gets about
 *   one riser); with less, the hook and the problem play without it and it
 *   comes in on the hit
 * - it rests for half a bar before every `settle` mark, with no riser: the
 *   drop itself is the build, and the landing brings the beat back (on
 *   whichever beat `settle` sits: beat 3 of its bar in the demo reel)
 * - it stops on the call to action (`ctaIn`) with one last kick and an open hat
 *
 * Any of it can be given instead, in cut seconds: `anchor` (a downbeat of the
 * grid), `from`, `to`, `rests` ([from, to] stretches), `build` (where a riser
 * into a rest lands, null for none), `final` (null for no last hit). A kick
 * never lands on a hit a sheet already placed there.
 */
function beat(k, { bpm = 120, anchor, from, to, rests, build, final } = {}) {
  const e8 = 30 / bpm;
  const bar = 240 / bpm;
  const reveal = revealAt(k);
  const second = k.scenes.length > 1 ? k.scenes[1].start + (k.plan.cross ?? 0) / 2 : 0;
  const groove = anchor === undefined && reveal != null && reveal - second >= 2 * bar;
  anchor ??= reveal ?? second;
  from ??= groove ? anchor - Math.floor((anchor - second) / (bar / 4) + 1e-6) * (bar / 4) : anchor;
  if (final === undefined) {
    final = k.scenes.map((s) => k.mark(s, 'ctaIn')).find((t) => t != null && t > from) ?? null;
  }
  to ??= final ?? k.end - 1;
  if (rests === undefined) {
    rests = groove ? [[reveal - bar, reveal]] : [];
    for (const s of k.scenes) {
      for (const { t } of k.marks(s, /^settle/i)) if (t > from + bar / 2 && t < to) rests.push([t - bar / 2, t]);
    }
  }
  const first = Math.ceil((from - anchor) / e8 - 1e-6);
  const last = Math.floor((to - anchor) / e8 + 1e-6);
  // a rest covers the grid steps from its start up to (not including) its end, give or take half a step
  const resting = (t) => rests.some(([a, b]) => t >= a - e8 / 2 && t < b - e8 / 2);
  const onHit = (t) => k.hits.some((h) => Math.abs(h - t) < 0.03);
  for (let n = first; n <= last; n++) {
    const t = anchor + n * e8;
    if (t < 0 || t > k.end || (final != null && t > final - e8 / 2)) continue;
    const i = ((n % 8) + 8) % 8;
    if (!resting(t)) {
      if ((i === 0 || i === 4) && !onHit(t)) k.put(kick({ seed: k.seed() }), t);
      if (i === 2 || i === 6) k.put(snareish({ seed: k.seed() }), t);
    }
    if (i % 2 === 1) k.put(hat({ seed: k.seed() }), t, { gain: 0.8 + k.r() * 0.3, pan: 0.15 });
  }
  // one riser, into the reveal the beat drops out for (skipped when the reveal's sheet placed one there)
  if (build === undefined) build = groove ? reveal : null;
  if (build != null) k.riser(build, { dur: bar, gain: 0.8 });
  if (final != null) {
    if (!onHit(final)) k.put(kick({ seed: k.seed() }), final);
    k.put(hat({ seed: k.seed(), open: true }), final, { gain: 1.1, pan: 0.15 });
  }
}
