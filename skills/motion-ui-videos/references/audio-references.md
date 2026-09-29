# Audio references: make the video's sounds from sounds the user likes

A recording the user loves is a better brief than any description of it. Words like "warm", "punchy" or "clean" mean different things to different people; a file means exactly one thing. So early in every project, invite the user to send audio they like, then treat it as the brief: analyze each file, describe it back in plain words, cast each one to the moments whose character it fits, and for each moment either play it as recorded with its peak on the move, grow fresh variants from it, or model it in code. Level-match the result to what was there, show the reference and the result as spectrograms side by side, and let the user be the ears. This is the method the founder of the launch film this skill comes from used, and it produced the sounds they liked best. For the engine, mixing and loudness targets, see [sound-design](sound-design.md).

## Contents

1. [Ask for references](#1-ask-for-references)
2. [Store them, and respect their licenses](#2-store-them-and-respect-their-licenses)
3. [Decode and extract](#3-decode-and-extract)
4. [Analyze and describe back in plain words](#4-analyze-and-describe-back-in-plain-words)
5. [Cast references to moments](#5-cast-references-to-moments)
6. [Play as recorded, peak on the move](#6-play-as-recorded-peak-on-the-move)
7. [Grow variants for anything used more than a few times](#7-grow-variants-for-anything-used-more-than-a-few-times)
8. [Model percussive references](#8-model-percussive-references)
9. [Level-match with short and long windows](#9-level-match-with-short-and-long-windows)
10. [Verify with spectrograms side by side](#10-verify-with-spectrograms-side-by-side)
11. [Report, then let the user listen](#11-report-then-let-the-user-listen)
12. [Save the user's taste](#12-save-the-users-taste)
13. [Sources](#sources)

## 1. Ask for references

Say it early, in the first round of questions, in these words or close to them:

> If you have sounds you like (a whoosh, a click, a keyboard, a "success" sound, or a video whose sound you love), send them as files and I'll make the video's sounds from them. Short single sounds work best. A recording you like beats any description.

What helps most, in order:

1. **Single sounds**, 0.2–3 s each: a whoosh, a click, a keystroke or a few, a pop, a hit. One file per character of sound.
2. **A recording of their own product or keyboard.** A founder's own MacBook typing is the perfect key reference.
3. **A reel or film whose sound they like.** Use it for character only (tempo, brightness, density, how dry or roomy it is). Its audio is almost certainly someone else's copyright: analyze it, never put it in the mix.
4. **A music track for mood.** Take its tempo, key and brightness to choose the pad's chord and the reel's BPM. Do not sample it.

If they send links instead of files, ask before downloading anything: downloading third-party files is the user's call, and many sites' terms forbid scripted downloads. The simplest path is that they download the files themselves and drop them in `sound/refs/`.

If they have no references, go ahead with the engine's defaults, and offer again after the first render: people often only know what they want once they hear what they do not.

## 2. Store them, and respect their licenses

Keep every reference in `sound/refs/`. The template's `.gitignore` already excludes that folder, and it must stay excluded: most stock audio licenses let you use a sound inside a video but not share the raw file. Pixabay's license, for example, forbids distributing content "on a standalone basis", unchanged from how it is on their site. A public repo with the WAV in it is exactly that.

- **Write down where each file came from** (site, author, license) in the project README, next to the sound notes. The files stay private; the provenance does not.
- **Check the license fits a product video.** Freesound files each carry their own Creative Commons license: CC0 needs nothing, CC BY needs a credit in the video's description or credits, and CC BY-NC forbids commercial use, which rules it out for a product promo.
- **The score must survive the refs being absent.** A teammate who clones the repo has no `sound/refs/`. Every place that uses a reference falls back to a synthesized voice when the file is missing (section 6), so `npm run render:showcase` still works on first try.
- **Profiles are measurements, not audio.** `grow.mjs` saves a `.profile.json` (energy per band over time). It cannot be played back as the original, which makes it far safer to keep than the file, but ask the user before committing one.

## 3. Decode and extract

The tools and the engine read MP3, OGG, M4A and FLAC directly: `readAudio()` decodes them with Remotion's bundled ffmpeg, so nothing else needs installing. You only need ffmpeg yourself to make a WAV copy, cut a piece out, or pull the audio out of a video:

```bash
# a 48 kHz stereo WAV copy of an MP3 (the engine's rate)
npx remotion ffmpeg -i sound/refs/whoosh.mp3 -ar 48000 -ac 2 -c:a pcm_s16le sound/refs/whoosh.wav

# the audio of a video they sent, for analysis only
npx remotion ffmpeg -i sound/refs/liked-reel.mp4 -vn -ar 48000 -ac 2 -c:a pcm_s16le sound/refs/liked-reel.wav

# one keystroke out of a typing recording: 120 ms starting at 1.204 s
npx remotion ffmpeg -ss 1.204 -t 0.12 -i sound/refs/typing.wav -c:a pcm_s16le sound/refs/key-1.wav
```

To find where the individual hits are in a longer file, draw it first (`node sound/tools/spectrogram.mjs sound/refs/typing.wav out/typing.png`): each keystroke is a thin vertical line.

## 4. Analyze and describe back in plain words

```bash
node sound/tools/analyze.mjs sound/refs/*.mp3
node sound/tools/spectrogram.mjs sound/refs/whoosh-a.mp3 sound/refs/whoosh-b.mp3 out/refs.png
```

`analyze.mjs` reports, per file: length; when it becomes audible, peaks and ends; how fast it rises and how long it takes to fall 20 and 40 dB; loudness and true peak, and how much hotter or quieter it is than a house-level whoosh; brightness (spectral centroid) and whether it moves; energy per band; whether it is noise or tone, with its clear pitches; stereo width and balance; and what it is most like, with whether to play, grow or model it. `--json` gives the raw numbers. Read the spectrogram PNG too: it shows what the numbers summarize.

Then describe each file back to the user in their words, not yours. Numbers become words like this:

| measure | words |
|---|---|
| centroid under 500 Hz / 500–1500 / 1.5–3 k / 3–5 k / over 5 k | dark / warm / balanced / bright / very bright, close to hiss |
| rises to full level within 15 ms, falls 20 dB within 150 ms | a hit: click, tap, knock |
| rises over 15–150 ms | a quick swell |
| rises over more than 150 ms | a slow swell |
| peak in the first 30% of its length | an arrival: it hits, then trails away |
| peak between 30 and 70% | a pass-by: something flies past |
| peak after 70% | a build: it grows into its end (a riser) |
| brightness climbs / drops across it | rising, opening / falling, closing |
| mostly noise / clear pitches | air, breath / a tone, a chime |
| L/R correlation above 0.97 / side-to-mid under 0.35 / over 0.7 | mono / narrow / wide |

Descriptions the user can check by ear, written from `analyze.mjs` output on the four stock whooshes the launch film's founder sent:

> **whoosh-long** (2.1 s file): a dark, soft swell, moderately wide. Audible for about 1.4 s, it rises over a third of a second to its loudest a little before the middle, then falls away over half a second, getting darker as it goes. Nearly all its energy is low (centroid 265 Hz). A big, soft pass-by: something large moving through.
>
> **whoosh-swell** (2.4 s audible): darker still and slower. It takes 0.6 s to rise, is loudest 40% of the way in, and needs a full second to fade. Nine tenths of it is below 250 Hz, and it is narrow. A slow arrival: a panel sliding into place, the camera leaning in.
>
> **whoosh-drop** (0.9 s audible): at full level within 170 ms, loudest a quarter of the way in, gone within half a second. Almost all sub-bass, and very wide, partly out of phase: on a single phone speaker part of it cancels. A drop: something falling hard.
>
> **whoosh-short** (0.24 s audible): warm and quick, at full level within 20 ms, gone 40 dB down within 180 ms, nearly all its energy between 500 Hz and 2 kHz, narrow. A small, fast pass-by.

Two things analysis catches that ears on laptop speakers miss. Stock whooshes are often mastered loud (these four peaked at 0 to −2.5 dBTP, 25–34 dB hotter than a house-level whoosh), so never place one raw: `recording()` levels it. And a reference whose energy is nearly all sub-bass is a felt rumble on headphones but close to silent on a phone speaker, so for phone cuts prefer references with energy in the mids, or pair them with a mid-range sound.

If a description surprises the user ("no, that one is punchy, not soft"), you have learned what their words mean. Write it down (section 12).

## 5. Cast references to moments

Match each reference's character to the moments that need that character. Work from the scene table and the marks in `cuts.json`.

| moment | character it wants | typical treatment |
|---|---|---|
| a big entrance: logo, title, the reveal | long (0.8–2 s), warm, wide, early peak | as recorded, peak on the landing |
| a panel sliding in, a camera push-in | a slow swell, darker, peak where the move is fastest | as recorded, or grown and stretched to the move |
| a drop: an error hitting, a pull-back, the problem landing | fast attack, falling colour, wide | as recorded, with a `thump` under it |
| small UI moves: a menu, a tooltip, a card shifting | short (0.2–0.5 s), mid-bright, pass-by | grown, a fresh one each time |
| many things moving at once: a swarm, particles, a list flying in | short pass-bys | grown, one per object |
| clicks, keys, taps, toggles | a hit | modelled (section 8) |
| mood, a track they like | tempo, key, brightness | choose the pad's chord and the reel's BPM from it; never sample it |

The rule of thumb: **a recording plays as itself at most two or three times in a film. Anything needed more often is grown.** One recording heard thirty times sounds like a machine.

The real casting, from the launch film, of the four whooshes described above:

- **whoosh-long** took the big moves: the opening, the reveal, the close. A few plays, as recorded.
- **whoosh-swell** took the panel arriving and the camera leaning in. As recorded.
- **whoosh-drop** took the drops: the error landing, the pull-back. As recorded, with a `thump` under the error.
- **whoosh-short** was needed for thirty-odd small moves and sixteen arrows in the hook, so it was never played as recorded: every use was grown fresh from it.

Send the descriptions and the casting in one message, then build. The user corrects by ear after the first render, which is faster than debating a casting table in the abstract.

## 6. Play as recorded, peak on the move

For a reference used once or twice. `recording()` in `engine.mjs` loads any audio file and gets it ready: it levels the loudest 20 ms to a house-level synthesized whoosh (so it sits where a whoosh would, before any `gain`), cuts the tail once it has fallen 55 dB under the peak (with a 30 ms fade), and finds `peakAt`. `placePeak()` then lands that loudest moment on the mark.

Every sound in `score.mjs` is placed by a small function: a scene's cue sheet (`SHEETS`, one per demo scene) or, for scenes without one, a naming rule (the `RULES` list, and `reveal()` for a reveal). So a recording goes into the sheet or rule that sounds its moment, with the synthesized sound as the fallback:

```js
// sound/score.mjs, near the top: add `recording` to the engine import (fs, path, REFS and whoosh are already there).
// The user's references; each falls back to a synthesized sound when its file is missing (a fresh clone has no refs).
const ref = (name, opts) => {
  const file = path.join(REFS, name);
  return fs.existsSync(file) ? recording(file, opts) : null;
};
const ARRIVAL = ref('whoosh-long.mp3');                       // decoded once, when the score loads: decoding runs ffmpeg
const DROP = ref('whoosh-drop.mp3', { trimDb: 1.5, tailDb: -50 });

// in SHEETS.reveal's cue(), showcase and reel alike: the recording lands on the hit instead of the synthesized riser
const hit = s.t('logo');
if (ARRIVAL) k.peak(ARRIVAL, hit, { gain: 1.5, pan: [-0.3, 0.3], room: 0.2 });
else k.riser(hit, { dur: punch ? 1.0 : 1.4, gain: punch ? 1 : 0.7 });
// …the thump, the chord and the wordmark's whoosh stay as they are

// in SHEETS.problem's cue(): the sheet puts a beating tone and a soft dud on noResults; add the drop under them
k.peak(DROP ?? whoosh({ dur: 0.5, f0: 2400, f1: 700, peak: 0.1, seed: 8 }), s.t('noResults'), { gain: 1.4 });
```

For a scene without a sheet, the same swap goes in its rule: `reveal()` is the cue every reveal scored by name gets.

- **Align the peak, not the start.** A recording's loudest moment is rarely at its start. `placePeak` puts it on the mark, which for a move is where the motion is fastest or where the object lands.
- **Keep its own stereo, within reason.** A stereo recording keeps its image; `pan` only leans it. Pass `[from, to]` to lean it along the move. A very wide or out-of-phase reference (`analyze.mjs` says "check it in mono") should be narrowed for phone cuts, since pan scaling does not touch a recording's own width:

  ```js
  // fold a stereo sound toward mono: width 1 keeps it, 0 is mono
  const narrow = (s, width = 0.4) => {
    for (let i = 0; i < s.l.length; i++) {
      const m = (s.l[i] + s.r[i]) / 2, d = ((s.l[i] - s.r[i]) / 2) * width;
      s.l[i] = m + d; s.r[i] = m - d;
    }
    return s;
  };
  const DROP_PHONE = DROP && narrow(recording(path.join(REFS, 'whoosh-drop.mp3'), { trimDb: 1.5 }));
  ```

  (Narrow a fresh copy, as here: `recording()` returns new arrays, while the 16:9 cut keeps the wide one.) Grown sounds take `width` directly: `grow(profile, { width: 0.4 })`.
- **Trim to taste with `trimDb` and `tailDb`**, not by editing the file: a hissy tail cut at −45 dB instead of −55 dB is often all "too long, too noisy" needs.
- **Log fallbacks.** If `ARRIVAL` is null, say so in the design output or your report, so nobody mistakes the synthesized fallback for the approved sound.

## 7. Grow variants for anything used more than a few times

`sound/tools/grow.mjs` measures a reference instead of playing it: energy in 72 bands from 30 Hz to 20 kHz (about an eighth of an octave each), every 2.7 ms, separately for the middle and the sides of the stereo image, smoothed over about 13 ms so what is kept is the sound's shape rather than this one take's grain. From that profile it grows new sounds out of fresh noise: the same colour and the same rise and fall, never the same sound twice. Each variant can be stretched to the length of its move, pitched, bent in pitch as it passes, widened or narrowed, and it comes out as loud at its loudest 20 ms as the reference.

Grow noisy sounds: whooshes, swells, air, risers. Do not grow clicks and keys; resynthesized from noise, their snap turns to mush (section 8).

**The quickest path: one whoosh for the whole film.** Save the reference as `sound/refs/whoosh.mp3` (or `.wav`, `.ogg`, `.m4a`, `.flac`, `.aif`) and re-run `node sound/design.mjs <cut>`. The template's score then grows every whoosh it places from that file: stretched toward the length of each move, pitched by the size of what moves, tilted a little in pitch as it passes, 1.5 dB under the reference. The report's "placed" line confirms it ("whooshes grown from sound/refs/whoosh.mp3"). The score looks for that name only: a file saved as `liked-whoosh.mp3` is ignored, and every whoosh stays synthesized. It also drives only whooshes: risers, clicks, keys and pops stay synthesized until you wire a reference into their sheets (sections 6 and 8). `WHOOSH_REF=path/to/file` picks another file for a run; `SYNTH_WHOOSH=1` goes back to the synthesized ones. Without the file, the score falls back to synthesized whooshes by itself, so a fresh clone still renders.

Try the tool from the command line first, to hear and see what it grows. It writes the variants, a `.profile.json`, and a PNG of the reference above its variants:

```bash
node sound/tools/grow.mjs sound/refs/whoosh-short.mp3 --n 5 --dur 0.6 --bend 1.06,0.94 --pan -0.7,0.7   # → out/grown/
```

Options: `--out` a folder (default `out/grown/`; these files are a preview, nothing in the score plays them), `--dur` seconds from first breath to last (default: the reference's), `--peak` where it is loudest (0–1, default: where the reference was), `--pitch` and `--spread` (random pitch spread, default ±10%), `--bend` pitch at the start and end relative to the peak, `--pan` travel, `--seed`.

In the score, `profileOf(file)` measures a reference once per run (levelled to house whoosh level, so `gain: 1` means the same as for `whoosh()`), and `grow(profile, { dur, peak, pitch, bend, width, seed, trimDb })` returns a stereo sound with its `peakAt`, ready for `placePeak`.

```js
// sound/score.mjs: profileOf, grow and whoosh are already imported there.
// A second reference, for one family of moves (the quickest path above covers the rest); null without the file.
const AIR_FILE = path.join(REFS, 'whoosh-short.mp3');
const AIR = fs.existsSync(AIR_FILE) ? profileOf(AIR_FILE) : null;

// in SHEETS.problem's cue(), in the loop that sorts the fragments into their apps, instead of its k.swish(…):
// a fresh whoosh per fragment, a different seed and pitch every time (the synthesized one without the file)
const air = AIR ? grow(AIR, { dur: 0.45, pitch: 1.08 * (0.92 + k.r() * 0.16), seed: k.seed(), trimDb: -1.5 }) : whoosh({ dur: 0.7, seed: k.seed() });
k.peak(air, s.t(start + 0.425), { gain: 0.38 * k.style.air, pan: [scatterPan(i), appPan(idx)] });
```

`trimDb: -1.5` is there because a grown whoosh usually lasts a little longer than its reference, so it sits 1.5 dB lower to sound as loud.

**The swarm: sixteen arrows, sixteen whooshes.** In the launch film's hook, sixteen arrows fly across the screen. The first version played one recorded whoosh sixteen times, and the founder's note was: "the swarm sounds bad since it's just the whoosh effect repeated many times". The fix gave every arrow its own whoosh, grown from that recording:

- **length from its path**: a slower crossing gets a longer whoosh (a quarter of the travel time plus 0.15 s);
- **loudest where it crosses the middle** of the frame, the closest it gets to the viewer;
- **pitch by size**: smaller arrows are higher (pitch × √(1 / scale)), with ±8% at random so no two match;
- **a Doppler bend**: 7% sharp approaching, 7% flat leaving (`bend: [1.07, 0.93]`);
- **panned along its path**, from where it is when its whoosh starts to where it is when it ends;
- **quieter for small arrows**, and arrows that cross after the scene has faded out get no sound at all.

The template's own hook does the same for its sixteen fragments (`SHEETS.hook` in `score.mjs`: a whoosh each, panned from off-screen to where its card lands, and a tiny pop as it settles). The scene lays the swarm out with seeded `rand`, so the score recomputes the same layout and knows each arrow's times and positions:

```js
// sound/score.mjs: add SR to the engine import. placePeak, scenesOf, profileOf and grow are already imported, and
// the file already has rand(), a line-for-line port of rand() in src/lib/anim.ts: the score sees the layout the scene draws.
// Call swarm(k.cut, k.mix, k.at, AIR) from the scene's sheet, or swarm(cut, mix, at, AIR) in the cut's case of score().
function swarm(cut, mix, at, AIR) {
  const hook = scenesOf(cut).find((s) => s.id === 'hook');
  const W = 1920;
  for (let i = 0; i < 16; i++) {
    // the scene's numbers for arrow i (scene seconds, px): when it starts, how long it takes, its size, its side
    const start = hook.marks.swarm + i * 0.08 + rand(i * 7 + 3) * 0.17;
    const travel = 1.6 + rand(i * 7 + 4) * 0.66;
    const scale = 0.55 + rand(i * 7 + 6) * 0.45;
    const fromRight = i % 3 === 1;
    const middle = start + travel / 2;                          // it crosses the centre here: loudest
    if (middle > hook.seconds - 0.4) continue;                  // crosses after the scene has faded: no sound
    const x = (s) => { const k = (s - start) / travel; return fromRight ? W + 100 - (W + 200) * k : -100 + (W + 200) * k; };
    const pan = (s) => Math.max(-0.85, Math.min(0.85, ((x(s) - W / 2) / (W / 2)) * 1.3));
    const w = grow(AIR, {
      dur: 0.25 * travel + 0.15,
      peak: 0.45,
      pitch: Math.sqrt(1 / scale) * (0.92 + rand(1000 + i) * 0.16),
      bend: [1.07, 0.93],
      seed: 40 + i,
    });
    const from = middle - w.peakAt, to = from + w.l.length / SR;
    placePeak(mix, w, at('hook', middle), { gain: 0.6 * (0.6 + (0.4 * (scale - 0.55)) / 0.45), pan: [pan(from), pan(to)], room: 0.08 });
  }
}
```

The numbers in the layout lines must be the scene's own. If the scene changes its layout, the score changes with it: they are one design written twice, so put a comment in each pointing at the other.

## 8. Model percussive references

Clicks, keys, taps and knocks live in their first few milliseconds. Growing them from noise smears exactly that, and playing one recording for every keystroke is the repeated-sample problem again. So model them: measure the parts of the sound, then build a voice from those parts with a fresh seed per hit.

**Measure one hit.** Cut a single keystroke or click out of the recording (section 3), then:

```bash
node sound/tools/analyze.mjs sound/refs/key-1.wav
node sound/tools/spectrogram.mjs sound/refs/key-1.wav out/key-1.png
```

Read off:

| part | where to find it | the engine's `key()`, for comparison |
|---|---|---|
| **click band**: the burst of noise at the moment of contact | the brightest part of the vertical line in the first 1–3 ms; the band with the most energy | 3 kHz, Q 1.1, plus a faint 5.6 kHz edge |
| **body resonances**: the short ring of the key cap, case or button | "Clear pitches" in `analyze.mjs`; short horizontal lines lasting 3–20 ms after the burst | 850 Hz and 1.9 kHz (2.2×) |
| **decay** of each part | `analyze.mjs` "falls 20 dB in ..." and the length of each line in the spectrogram; a decay time τ ≈ (time to fall 20 dB) ÷ 2.3, or (time to fall 40 dB) ÷ 4.6 | burst τ 1.6 ms, body τ 4.5 and 2.5 ms |
| **release**: the key coming back up | a second, fainter vertical line some 40–80 ms after the first | 42–62 ms later, about 13 dB under |
| **level spread** between hits | compare a few hits' loudest 20 ms | about ±1.3 dB |

**First, try the engine's voice.** `key()` is a tick near 3 kHz plus a tap near 850 Hz plus a key-up, which is already the shape of most laptop keys; `pitch` scales both. If the reference's click band is at 3.4 kHz and its body near 960 Hz, `key({ pitch: 1.13 })` may be all it takes. `click({ bright })` moves a click's ping the same way.

**When the parts do not scale together, write a voice from the numbers.** The engine exports `SR`, `rng` and `biquad` for this:

```js
// sound/score.mjs: a keystroke modelled on the user's reference (numbers from analyze.mjs and the spectrogram).
// Add SR, biquad and loudestRms to the engine import (rng and key are already there).

const REF_KEY = {
  click: 3400, clickQ: 1.2, clickTau: 0.0012,          // the burst: 3.4 kHz band, 1.2 ms decay
  body: [[720, 0.006, 1], [1580, 0.003, 0.4]],         // resonances: [Hz, decay s, level]
  bodyLevel: 0.3,
  upAt: 0.055, upTau: 0.0008, upLevel: 0.2,             // the key coming back up, 55 ms later, 14 dB down
};

function refKey({ seed = 1 } = {}) {
  const M = REF_KEY;
  const r = rng(seed * 7919 + 3);
  const out = new Float32Array(Math.round(0.09 * SR));
  const burst = biquad('bp', M.click * (0.94 + r() * 0.12), M.clickQ);   // every key a little different
  const up = biquad('bp', M.click * 1.1, 1.3);
  const upAt = M.upAt * (0.85 + r() * 0.3);
  const level = 0.85 + r() * 0.3;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR, n = r() * 2 - 1;
    let v = burst(n) * Math.exp(-t / M.clickTau);
    for (const [f, tau, g] of M.body) v += Math.sin(2 * Math.PI * f * t) * Math.exp(-t / tau) * g * M.bodyLevel;
    if (t >= upAt) v += up(n) * Math.exp(-(t - upAt) / M.upTau) * M.upLevel;
    out[i] = v * level * Math.min(1, t / 0.0003);                          // 0.3 ms onset: no click from a hard start
  }
  // bring it to the house key's level, so gain 1 means what it means for key()
  const k = loudestRms(key({ seed: 1 })) / loudestRms(out);
  for (let i = 0; i < out.length; i++) out[i] *= k;
  out.bus = 'sfx'; out.peakAt = 0.001; out.room = 0.1;
  return out;
}
```

Then use it wherever `key()` goes: swap `refKey` in for `key` inside the kit's `key()` in `score.mjs` (the one `k.typing()` and the sheets' shortcut presses call), and every typed character gets one, on the moment it appears, with a fresh `seed` each ([sound-design](sound-design.md) §4).

The launch film's keys went through three rounds by description alone: "a smoother, more pleasant typing sound" turned the first key sound into a soft, deep "thock"; the founder then asked for "subtle MacBook keyboard sounds", which is what `key()` is now: a short light tick near 3 kHz, a small tap near 850 Hz, quiet, no thock. A recording of the keyboard they had in mind would have got there in one round, which is why you ask for one.

## 9. Level-match with short and long windows

A new sound replacing an old one should arrive at the loudness of what was there, so the only thing that changes is its character. Measure both, in the window that fits the sound:

- **Hits (clicks, keys, pops)**: the loudest 20 ms (`loudestRms()` in code), or a 0.1 s stretch around the hit with `loudness.mjs --from --to`.
- **Swells (whooshes, risers, recordings)**: the loudest 400 ms of a stretch around the move, with the layer soloed.
- **Sections**: the loudest 3 s or the mean over the scene, to be sure the change did not tip the balance of the whole passage.

Check a short and a long window both. A replacement can match on its loudest moment and still carry more energy because it lasts longer; that is why grown whooshes sit 1.5 dB under their reference.

```bash
ONLY=whoosh node sound/design.mjs showcase && cp public/sound-showcase-whoosh.wav out/whoosh-before.wav
# ...swap in the grown or recorded sound...
ONLY=whoosh node sound/design.mjs showcase && cp public/sound-showcase-whoosh.wav out/whoosh-after.wav
node sound/tools/loudness.mjs out/whoosh-before.wav out/whoosh-after.wav --from 10.2 --to 11.4
node sound/design.mjs showcase      # the full mix, with its report: whooshes still ≥ 3 dB under the UI sounds?
```

Aim for the same loudness as before in that stretch, or 1–1.5 dB under for a sound that repeats. Never louder unless the user asked for it: whooshes especially stay where the user approved them, under the clicks and keys.

## 10. Verify with spectrograms side by side

Show the reference and the result on one scale, one above the other. Same colour means same level. `grow.mjs` already writes this picture for its variants. To compare a reference with what the film plays at a mark, slice the film at that moment and draw both:

```js
// out/compare.mjs, a throwaway (out/ is gitignored); run `node out/compare.mjs` from the video folder
import { SR, readAudio } from '../sound/engine.mjs';
import { at } from '../sound/timeline.mjs';
import { spectrogram } from '../sound/tools/spectrogram.mjs';

const ref = readAudio('sound/refs/whoosh-long.mp3');
const film = readAudio('out/whoosh-after.wav');                        // an ONLY=whoosh render of the cut
const t = at('showcase', 'reveal', 'logo');
const part = (s, a, b) => ({ l: s.l.slice(Math.round(a * SR), Math.round(b * SR)), r: s.r.slice(Math.round(a * SR), Math.round(b * SR)) });
const lines = spectrogram([{ name: 'reference', ...ref }, { name: 'the film at the logo', ...part(film, t - 1, t + 1.5) }], 'out/compare.png');
console.log(lines.join('\n'));
```

Read the PNG and the printed lines, and compare:

- **where the energy sits**: the printed 10/50/90% frequencies should be close (within about a third of an octave) unless you shifted pitch on purpose;
- **the envelope**: same rise, same peak position relative to the move, similar tail;
- **the top end**: no new bright band above 5 kHz that the reference did not have;
- **the transients** of modelled hits: thin and sharp, not smeared into a blob.

If you describe a difference to the user, describe it in the same words you used in section 4.

## 11. Report, then let the user listen

You cannot hear. The user can. End every round with a short report in plain words and numbers, and exactly where to listen:

> I used your four whooshes. The long one plays as recorded on the reveal and the end card, peaking as the logo lands. The dark swell is on the panel and the push-in. The short one is never repeated: each of the 31 small moves gets a fresh whoosh grown from it, pitched to the size of what moves. All of them sit at the level the old whooshes had (within 0.5 dB), under the clicks. The film is −17.1 LUFS, true peak −2.0 dBTP. The spectrogram of each reference next to what plays is in out/compare.png. Listen at 0:08 (the reveal) and 0:14–0:20 (the small moves): do the grown ones still feel like the file you sent?

Say which sounds now come from their files and which are still synthesized, so they know what they are judging. Then change one thing at a time from what they say, using the feedback table in [sound-design](sound-design.md) §11.

## 12. Save the user's taste

Taste carries from one video to the next. When the user reacts to sounds, record it where your next session will find it:

- in your memory, if you have one (Claude Code's memory, a `CLAUDE.md` note, or whatever the environment provides);
- in a short "sound notes" section of the project README.

What to write: the references they sent and where each was cast; what they liked, with their words ("subtle MacBook keyboard sounds", "a smoother, more pleasant typing sound"); what they rejected, with their words ("too white-noisy", "the same whoosh repeated", "the before version was a lot better"); level decisions ("whooshes never louder than the approved mix"); and what their words turned out to mean ("smoother" meant quieter and lighter, not deeper). For example:

> Sound taste (from the launch film): synthesized sound over AI music (AI re-score was rejected). Likes soft pink-noise whooshes and four whoosh files in sound/refs (free stock, license: no raw redistribution): long for big moves, dark swell for panels and push-ins, fast wide drop for hits, short one grown fresh per small move. Keys: subtle MacBook-style, quiet, no thock. Dislikes hiss ("too white-noisy"), repeated samples, glitchy electronics ("stabilize the electronic sound"). Never raise whooshes above the approved mix.

Next time, start from those references and rules instead of the defaults, and say so.

## Sources

Checked in September 2026.

- Pixabay, "Content License Summary": content may not be sold or distributed "on a standalone basis", where no creative effort has been applied. https://pixabay.com/service/license-summary/
- Freesound, "Frequently Asked Questions": each sound carries CC0, CC BY (credit required, commercial use allowed) or CC BY-NC (no commercial use). https://freesound.org/help/faq/
