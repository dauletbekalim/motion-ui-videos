// sound/promo-score.mjs: the cue sheets for the skill's own promo (scenes
// pHook … pEnd in src/scenes/promo/), and the two things the promo does that
// the demo does not: a beat that thins out while the timeline scene plays its
// marks, and the template's own soundtrack playing inside the phone and the
// browser of the payoff.
//
// Each sheet mirrors its scene: where the scene times a move off a mark
// (`m.flag + 0.25`), the sheet uses the same expression. The reel's marks sit
// on a 120 bpm grid (every scene starts on a beat), so the hits land on it.
import { SR, createMix, kick, hat, snareish } from './engine.mjs';
import { at as cutAt, cutDuration } from './timeline.mjs';
import { promoSounds } from './promo-sounds.mjs';

/** A spring lands about this long after its mark (as in score.mjs). */
const LAND = 0.04;

/** What the prompt scene types (src/scenes/promo/PPrompt.tsx, ASK). */
export const ASK = 'make a 21 s reel for our app';
/** What Maya types in the timeline scene (src/scenes/promo/PTimeline.tsx, TYPED_TODO). */
export const TODO = 'Record the video';
/**
 * Where the payoff's phone and browser start playing the template's cuts, in their cut seconds
 * (src/scenes/promo/PPayoff.tsx): the reel 0.05 s before its palette scene starts (just before ⌘K),
 * the showcase 1.4 s into its "how" scene. Getters, so they are only looked up when a promo cut is
 * scored (the tests load other cuts), and named by scene so a re-timed template keeps the moment.
 */
export const PAYOFF = {
  get reel() {
    return cutAt('reel', 'reelPalette', 0) - 0.05;
  },
  get showcase() {
    return cutAt('showcase', 'how', 1.4);
  },
};

/** Chords per promo scene: C, F, G, around again, a bright F for the sounds, G into the last C. */
export const PROMO_CHORDS = {
  pHook: 'home', pPrompt: 'warm', pRebuild: 'lift', pTimeline: 'home', pCheck: 'warm',
  pFormats: 'lift', pSounds: 'bright', pPayoff: 'lift', pEnd: 'end',
};

export const PROMO_SHEETS = {
  /** Frame 0: the headline slams; three formats flash in, one per beat; on `fan` they stack into strips and their labels tick in. */
  pHook: {
    needs: ['title', 'card1', 'card2', 'card3', 'fan'],
    cue(k, s) {
      const m = s.marks;
      const punch = k.style.punch;
      if (punch) {
        // the slam, on the very first frame
        k.thump(s.t('title'), { f: 62, dur: 0.55, gain: 0.9 });
        k.pop(s.t('title'), 'C4', { gain: 0.45, from: 2.2, dur: 0.18 });
        k.swish(s.t(m.title + 0.05), { dur: 0.35, size: 0.8, gain: 0.9, rise: false });
        // each card slams in (0.22 s, snappy): a short rising breath into it, a light hit and a note, rising C, E, G
        ['C5', 'E5', 'G5'].forEach((n, i) => {
          const t = s.t(m[`card${i + 1}`]);
          if (i > 0) {
            k.swish(t - 0.02, { dur: 0.28, size: 0.7, gain: 0.85, pan: i === 1 ? [0.3, 0] : [-0.3, 0] });
            k.thump(t, { f: 70, dur: 0.3, gain: 0.45 });
          }
          k.pop(t + LAND, n, { gain: 0.55, dur: 0.2 });
        });
        // the fan: three windows stack into strips (0.42 s), their labels pop in (fan + 0.15 + i × 0.07, bouncy)
        k.swish(s.t(m.fan + 0.2), { dur: 0.5, size: 1.2, gain: 0.95, pan: [0.2, -0.2] });
        for (let i = 0; i < 3; i++) k.tick(s.t(m.fan + 0.15 + i * 0.07 + 0.12), { gain: 0.4, tone: 3400 + i * 300, pan: [-0.3, 0.4, -0.3][i] });
      } else {
        // 16:9: a low swell under the headline, then each card rises in with a soft pop
        k.swish(s.t(m.title + 0.45), { dur: 1.4, size: 1.7, gain: 0.7 });
        ['C5', 'E5', 'G5'].forEach((n, i) => {
          const t = s.t(m[`card${i + 1}`]);
          k.swish(t + 0.1, { dur: 0.45, size: 1, gain: 0.7, pan: [-0.5, 0, 0.5][i] });
          k.pop(t + 0.08, n, { gain: 0.42, dur: 0.22, pan: [-0.5, 0, 0.5][i] });
        });
      }
    },
  },

  /** The ask is typed, Enter sends it up, three replies arrive (and on 16:9, the scene table). */
  pPrompt: {
    needs: ['termIn', 'typeStart', 'typeEnd', 'enter', 'reply1', 'reply2', 'reply3'],
    cue(k, s) {
      const m = s.marks;
      k.swishFree(s.t(m.termIn + 0.12), { dur: 0.45, size: 1, gain: 0.8 });
      k.typing(s, m.typeStart, m.typeEnd, { text: ASK, pan: 0, gain: 0.75 });
      k.key(s.t('enter'), { gain: 0.85, pitch: 1.08, space: true });
      // the message rises to the top of the conversation (0.42 s, snappy)
      k.swish(s.t(m.enter + 0.1), { dur: 0.35, size: 0.6, gain: 0.7 });
      ['C6', 'E6', 'G6'].forEach((n, i) => k.pop(s.t(m[`reply${i + 1}`] + LAND), n, { gain: 0.26, from: 1.2, dur: 0.12, pan: -0.1 }));
      if (k.style.punch) {
        // the plan's strip: seven scene blocks pop in under the replies (reply3 + 0.15 + i × 0.05)
        for (let i = 0; i < 7; i++) k.tick(s.t(m.reply3 + 0.15 + i * 0.05 + 0.06), { gain: 0.26, tone: 3000 + i * 180, pan: (i - 3) * 0.08 });
      } else {
        // the scene table's seven rows tick in (reply3 + 0.3 + i × 0.12)
        for (let i = 0; i < 7; i++) k.tick(s.t(m.reply3 + 0.3 + i * 0.12 + 0.05), { gain: 0.3, tone: 3000 + i * 180, pan: -0.2 });
      }
    },
  },

  /** Files are read, one opens, each line builds its part of the list: on the beat on the reel. */
  pRebuild: {
    needs: ['scan', 'open', 'line1', 'line2', 'line3', 'done'],
    cue(k, s) {
      const m = s.marks;
      if (k.style.punch) {
        // three tabs read, a tick each (scan + 0.12 + i × 0.13)
        for (let i = 0; i < 3; i++) k.tick(s.t(m.scan + 0.12 + i * 0.13 + 0.05), { gain: 0.45, tone: 3300 + i * 250, pan: [-0.4, 0, 0.4][i] });
      } else {
        // the tree is read row by row (scan + i × 0.14), the tokens pop out of theme.ts
        for (let i = 1; i < 6; i++) k.tick(s.t(m.scan + i * 0.14 + 0.05), { gain: 0.35, tone: 3000 + i * 160, pan: -0.6 });
        for (let i = 0; i < 4; i++) k.pop(s.t(m.scan + 0.14 + 0.1 + i * 0.07 + LAND), ['C6', 'D6', 'E6', 'G6'][i], { gain: 0.14, from: 1.2, dur: 0.1, pan: -0.6 });
      }
      // the file opens
      k.swish(s.t(m.open + 0.08), { dur: 0.35, size: 0.7, gain: 0.8 });
      k.pop(s.t(m.open + LAND), 'G4', { gain: 0.35, dur: 0.18 });
      // line 1: the component's frame; line 2: its rows arrive; line 3: the note is selected; done: it glows
      const pan = k.style.punch ? 0 : 0.5;
      k.pop(s.t(m.line1 + LAND), 'C5', { gain: 0.5, dur: 0.22, pan });
      for (let i = 0; i < 4; i++) k.tick(s.t(m.line2 + i * 0.07 + 0.08), { gain: 0.45, tone: 3200 + i * 220, pan });
      // the reel's is 0.6, not 0.9: it lands on the 8.00 s kick and was driven ~4 dB into the master's
      // soft clip, and the squared-off top overshot to -1.0 dBTP after the AAC encode. At 0.6 it still
      // reaches the ceiling (0.2 dB lower in the WAV), unclipped, and the MP4 peaks at -1.7.
      k.click(s.t(m.line3 + 0.04), { gain: k.style.punch ? 0.6 : 0.9, bright: 1.1, pan });
      k.chime(s.t(m.done + 0.05), ['E5', 'B5'], { dur: 1.2, spread: 0.06, gain: 0.35, pan });
      if (Number.isFinite(m.click)) {
        // 16:9: the cursor clicks another row and the selection glides to it
        k.click(s.t('click'), { gain: 1, pan: 0.5 });
        k.pop(s.t(m.click + 0.2), 'E5', { gain: 0.25, dur: 0.16, pan: 0.5 });
      }
    },
  },

  /** The playhead crosses the marks: a click, a pop, keys, each on its frame. On 16:9: an edit, and a second pass. */
  pTimeline: {
    needs: ['pass1', 'click', 'join', 'typeStart', 'typeEnd'],
    cue(k, s) {
      const m = s.marks;
      const pass = (click, join, ts, te) => {
        k.click(s.t(click), { gain: 1.0, pan: 0.2 });
        // Maya's avatar pops in (bouncy): the pop lands with it
        k.pop(s.t(join + LAND), 'G5', { gain: 0.7, dur: 0.22, pan: 0.15 });
        k.typing(s, ts, te, { text: TODO, pan: -0.1, remote: true, gain: 1.1 });
      };
      pass(m.click, m.join, m.typeStart, m.typeEnd);
      if (Number.isFinite(m.pass2)) {
        // the edit: the old number is selected, "0.90" typed over it, and the join flag slides to its new time
        k.click(s.t('edit'), { gain: 0.6, bright: 0.9 });
        k.typing(s, m.edit + 0.3, m.edit + 0.5, { text: '0.90', pan: -0.4, gain: 0.8 });
        k.swish(s.t(m.edit + 0.5), { dur: 0.45, size: 0.5, gain: 0.55, pan: [0.1, -0.1], rise: false });
        pass(m.click2, m.join2, m.typeStart2, m.typeEnd2);
      }
    },
  },

  /** Tiles pop in, one frame lifts out and is flagged, then fixed. On 16:9 the loudness is measured. */
  pCheck: {
    needs: ['tiles', 'flag', 'fix'],
    cue(k, s) {
      const m = s.marks;
      // one tick per tile as it pops in (tiles + i × 0.05): 3 × 2 on the phone's sheet, 4 × 3 on 16:9 (PCheck.tsx REEL_TIMES, SHOW_TIMES)
      const cols = k.style.punch ? 3 : 4;
      const n = k.style.punch ? 6 : 12;
      for (let i = 0; i < n; i++) k.tick(s.t(m.tiles + i * 0.05 + 0.08), { gain: k.style.punch ? 0.38 : 0.3, tone: 3000 + i * 120, pan: ((i % cols) - (cols - 1) / 2) * 0.35 });
      // the frame lifts out (0.4 s), and the red lands: a steady beating tone swells into a low dud
      k.swish(s.t(m.flag + 0.15), { dur: 0.45, size: 1, gain: 0.8 });
      k.tension(s.t(m.flag + 0.3), { dur: 0.45, gain: 0.55 });
      k.pop(s.t(m.flag + 0.27), 'G3', { gain: 0.75, from: 1.25, dur: 0.3 });
      // fixed: the caption re-wraps, a small bright chord
      k.pop(s.t(m.fix + LAND), 'C6', { gain: 0.5, dur: 0.2 });
      k.chime(s.t(m.fix + 0.06), ['E5', 'G5', 'C6'], { dur: 1.3, spread: 0.04, gain: 0.5 });
      if (Number.isFinite(m.meter)) {
        // 16:9: the frame drops back (fix + 0.9), the meter slides up and fills to the target, the numbers tick in
        k.swish(s.t(m.fix + 1.15), { dur: 0.45, size: 1, gain: 0.55, rise: false });
        k.pop(s.t(m.meter + LAND), 'E5', { gain: 0.35, dur: 0.2 });
        k.riser(s.t(m.meter + 1.15), { dur: 0.9, gain: 0.35 });
        k.tick(s.t(m.meter + 1.2), { gain: 0.5, tone: 3600 });
        k.tick(s.t(m.meter + 1.3), { gain: 0.45, tone: 3900 });
      }
    },
  },

  /** One frame reshapes four times: a whoosh through each morph, a note as it lands, rising. */
  pFormats: {
    needs: ['to2', 'to3', 'to4', 'to5'],
    cue(k, s) {
      const m = s.marks;
      const dur = k.style.punch ? 0.3 : 0.45;
      k.pop(s.t(0.06), 'C5', { gain: 0.35, dur: 0.2 });
      ['D5', 'E5', 'G5', 'C6'].forEach((n, i) => {
        const t = m[`to${i + 2}`];
        const side = i % 2 ? 1 : -1;
        k.swish(s.t(t + dur / 2), { dur: dur * 1.3, size: 0.8, gain: k.style.punch ? 0.85 : 0.7, pan: [side * 0.3, -side * 0.3] });
        k.pop(s.t(t + dur), n, { gain: 0.42, dur: 0.2 });
      });
    },
  },

  /** A file drops in; the reference plays as its spectrogram draws; three grown variants play as theirs do. */
  pSounds: {
    needs: ['drop', 'ref', 'grow1', 'grow2', 'grow3'],
    cue(k, s) {
      const m = s.marks;
      const { ref, variants } = promoSounds();
      // the chip drops in from above (bouncy) and lands
      k.swish(s.t(m.drop + 0.04), { dur: 0.3, size: 0.6, gain: 0.6, rise: false });
      k.pop(s.t(m.drop + 0.1), 'E5', { gain: 0.5, dur: 0.2 });
      // the reference itself, loudest on `ref` (the scene draws it from ref − its peak, over its length)
      k.peak(ref, s.t('ref'), { gain: 0.95 });
      // the grow.mjs pill
      k.tick(s.t(m.grow1 - 0.35 + 0.1), { gain: 0.4, tone: 3600 });
      // each variant plays from the moment its card lands, as its spectrogram draws; a soft pop for the card
      variants.forEach((v, i) => {
        const t = m[`grow${i + 1}`];
        k.pop(s.t(t - 0.14 + 0.1), ['G5', 'A5', 'C6'][i], { gain: 0.22, dur: 0.14 });
        k.put(v, s.t(t), { gain: 0.85, pan: [-0.25, 0.25, 0][i] });
      });
    },
  },

  /** The phone pulls back into view (on 16:9, the browser rises in); what plays in it brings its own sound (see lumenIn). */
  pPayoff: {
    needs: ['phoneIn'],
    cue(k, s) {
      const m = s.marks;
      if (k.style.punch) {
        // the phone: it holds on the reel, pulls back (phoneIn + 0.12 over 0.88 s, inOut) and lands on the beat
        k.swish(s.t(m.phoneIn + 0.56), { dur: 0.8, size: 1.3, gain: 0.8, rise: false });
        k.thump(s.t(m.phoneIn + 1.0), { f: 66, dur: 0.4, gain: 0.5 });
      } else {
        k.swish(s.t(m.phoneIn + 0.22), { dur: 0.55, size: 1.3, gain: 0.8 });
        k.pop(s.t(m.phoneIn + 0.45), 'G4', { gain: 0.3, dur: 0.25 });
      }
    },
  },

  /** The mark, the name, the line, the address. */
  pEnd: {
    needs: ['logo', 'title', 'sub', 'url'],
    cue(k, s) {
      const m = s.marks;
      k.swishFree(s.t(m.logo + 0.06), { dur: 0.55, size: 1.1, gain: 0.95 });
      k.pop(s.t(m.logo + LAND + 0.04), 'G5', { gain: 0.6, dur: 0.3 });
      k.pop(s.t(m.url + LAND + 0.04), 'C6', { gain: 0.7, dur: 0.26 });
      k.chime(s.t(m.url + 0.08), ['G5', 'D6'], { dur: 1.8, spread: 0.06, gain: 0.6 });
      // the shine across the button (url + 0.8, over 0.9 s): a faint glint mid-way
      k.chime(s.t(m.url + 1.25), ['B6'], { dur: 0.8, gain: 0.12, pan: 0.2 });
    },
  },
};

/**
 * A light beat on a grid through `anchor`: kick on 1 and 3, a soft backbeat
 * on 2 and 4, hats on the offbeats. In `thin` stretches only the hats play (so
 * a scene's own clicks and keys are the rhythm), and a short riser builds into
 * the end of each. It stops on `final` with one kick and an open hat. A kick
 * never lands on a hit a sheet already placed.
 */
export function promoBeat(k, { bpm = 120, anchor = 0, from = 0, final, thin = [] }) {
  const e8 = 30 / bpm;
  const onHit = (t) => k.hits.some((h) => Math.abs(h - t) < 0.03);
  const thinAt = (t) => thin.some(([a, b]) => t >= a - e8 / 2 && t < b - e8 / 2);
  const first = Math.ceil((from - anchor) / e8 - 1e-6);
  const last = Math.floor((final - anchor) / e8 - 0.5);
  for (let n = first; n <= last; n++) {
    const t = anchor + n * e8;
    const i = ((n % 8) + 8) % 8;
    if (!thinAt(t)) {
      if ((i === 0 || i === 4) && !onHit(t)) k.put(kick({ seed: k.seed() }), t);
      if (i === 2 || i === 6) k.put(snareish({ seed: k.seed() }), t);
    }
    if (i % 2 === 1) k.put(hat({ seed: k.seed() }), t, { gain: (thinAt(t) ? 0.7 : 0.85) + k.r() * 0.25, pan: 0.15 });
  }
  for (const [, b] of thin) k.riser(b, { dur: 0.9, gain: 0.55 });
  if (!onHit(final)) k.put(kick({ seed: k.seed() }), final);
  k.put(hat({ seed: k.seed(), open: true }), final, { gain: 1.0, pan: 0.15 });
}

/**
 * The template's own soundtrack for `cut`, from `from` for `dur` seconds,
 * mixed in at `t` (cut seconds of this mix): the UI sounds of what plays in
 * the payoff's phone or browser, on the frames they play. Only its sfx and
 * whoosh layers (its pad and beat would fight this cut's), at `gain`, with
 * short fades at both ends.
 */
export function lumenIn(k, scoreFn, { cut, from, dur, t, gain = 0.8, fadeIn = 0.04, fadeOut = 0.2 }) {
  const layers = ['sfx', 'whoosh'].filter((b) => !k.mix.only || k.mix.only.has(b));
  if (!layers.length) return;
  const sub = createMix(cutDuration(cut), { only: layers.join(',') });
  scoreFn(cut, sub, (scene, mk) => cutAt(cut, scene, mk));
  const i0 = Math.round(from * SR);
  const n = Math.min(Math.round(dur * SR), sub.len - i0);
  const o = Math.round(t * SR);
  const fi = Math.round(fadeIn * SR), fo = Math.round(fadeOut * SR);
  const env = (j) => gain * Math.min(1, j / Math.max(1, fi), (n - 1 - j) / Math.max(1, fo));
  const add = (dst, src) => {
    for (let j = 0; j < n; j++) {
      const d = o + j;
      if (d >= 0 && d < k.mix.len) dst[d] += src[i0 + j] * env(j);
    }
  };
  for (const b of layers) {
    const s = sub.buses[b];
    if (!s) continue;
    const d = (k.mix.buses[b] ??= { l: new Float32Array(k.mix.len), r: new Float32Array(k.mix.len) });
    add(d.l, s.l);
    add(d.r, s.r);
    k.mix.count[b] = (k.mix.count[b] ?? 0) + (sub.count[b] ?? 0);
  }
  add(k.mix.sendL, sub.sendL);
  add(k.mix.sendR, sub.sendR);
  k.mix.cues?.push({ t, kind: `${cut} ${from.toFixed(2)}–${(from + dur).toFixed(2)} s (the template's own sound)`, bus: 'sfx', gain, pan: 0 });
}
