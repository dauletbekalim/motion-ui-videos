/**
 * Time, in seconds. Every duration, mark, crossfade and warp knot in this
 * project is in seconds; frames exist only at the boundary, where the player
 * turns seconds into frames with the composition's fps. That is why a 60 fps
 * showcase and a 30 fps reel can share scenes and marks, and why the sound
 * engine (sound/timeline.mjs, same math as this file) can read the same numbers.
 *
 * src/cuts.json is the one timeline both picture and sound read.
 */
import { createContext, useContext } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import cutsJson from '../cuts.json';
import { FORMATS, type Safe } from '../formats';

export type SceneSpec = {
  /** key into the scene registry, src/scenes/index.ts */
  id: string;
  /** how long the scene is on screen in this cut (drawn seconds) */
  seconds: number;
  /** named moments in the scene's own (warped) seconds; sound lands on these */
  marks?: Record<string, number>;
  /** optional [drawnSec, sceneSec] knots: play the scene faster or slower */
  warp?: number[][];
};

export type CutSpec = {
  /** key into FORMATS */
  format: string;
  /** crossfade between scenes, seconds (0 = hard cuts) */
  cross: number;
  /** play public/sound-<cut>.wav (written by sound/design.mjs) */
  sound?: boolean;
  /** film grain; defaults to on for landscape, off for portrait */
  grain?: boolean;
  scenes: SceneSpec[];
};

export const CUTS = cutsJson as unknown as Record<string, CutSpec>;

export type SceneInfo = {
  id: string;
  seconds: number;
  marks: Record<string, number>;
  warp: ((t: number) => number) | null;
};

/** The cut being played (its id in cuts.json). Internal: read it with useCut(). */
export const CutContext = createContext<string | null>(null);
/** The scene being played. Internal: read it with useTime(), useMarks(). */
export const SceneContext = createContext<SceneInfo | null>(null);

/** Scene seconds as drawn: no warp. Use for ambient loops (breathing, idle bobs, blinking carets). */
export function useDrawnTime(): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
}

/** Scene seconds, through the scene's warp if this cut has one. Use for everything the story times. */
export function useTime(): number {
  const drawn = useDrawnTime();
  const scene = useContext(SceneContext);
  return scene?.warp ? scene.warp(drawn) : drawn;
}

/**
 * The scene's marks (scene seconds). Reading a mark that the cut does not
 * define throws with the fix, instead of quietly animating at NaN.
 */
export function useMarks(): Record<string, number> {
  const scene = useContext(SceneContext);
  const cut = useContext(CutContext);
  const marks = scene?.marks ?? {};
  return new Proxy(marks, {
    get(target, key) {
      if (typeof key !== 'string' || key in target) return Reflect.get(target, key);
      if (key === 'toJSON' || key === 'then' || key === '$$typeof') return undefined;
      throw new Error(`Scene "${scene?.id ?? '?'}" in cut "${cut ?? '?'}" reads mark "${key}", but src/cuts.json has no such mark there. Add it to that scene's "marks".`);
    },
  });
}

/** The current cut id, e.g. 'reel'. Scenes use it to vary captions and layout per cut. */
export function useCut(): string {
  return useContext(CutContext) ?? '';
}

const NO_SAFE: Safe = { top: 0, right: 0, bottom: 0, left: 0 };

/** The frame: size, orientation, format key, safe margins and fps. */
export function useStage(): { W: number; H: number; portrait: boolean; format: string; safe: Safe; fps: number } {
  const { width: W, height: H, fps } = useVideoConfig();
  const cut = useContext(CutContext);
  // inside a cut, its format; in a still (cover, thumbnail), whichever format has this size
  const format = (cut && CUTS[cut]?.format) || Object.keys(FORMATS).find((k) => FORMATS[k].width === W && FORMATS[k].height === H) || 'custom';
  return { W, H, portrait: H > W, format, safe: FORMATS[format]?.safe ?? NO_SAFE, fps };
}

function plan(cutId: string): CutSpec {
  const c = CUTS[cutId];
  if (!c) throw new Error(`No cut "${cutId}" in src/cuts.json. Cuts: ${Object.keys(CUTS).join(', ')}`);
  return c;
}

/** The cut's frame rate, from its format. */
function fpsOf(c: CutSpec): number {
  return FORMATS[c.format]?.fps ?? 30;
}

/**
 * How long a cut runs, in seconds: its scenes, less the overlap of each
 * crossfade. Counted on the frame grid the player lays scenes out on, so it
 * is exactly the rendered length (Σ seconds − cross × joins whenever those are
 * whole frames). sound/timeline.mjs does the same sum.
 */
export function cutDuration(cutId: string): number {
  const c = plan(cutId);
  return cutFrames(cutId, fpsOf(c)) / fpsOf(c);
}

/**
 * When a scene starts, in seconds from the start of the cut (its first
 * appearance): on the frame the player starts it, each scene `cross` before
 * the previous one ends.
 */
export function sceneStart(cutId: string, sceneId: string): number {
  const c = plan(cutId);
  const fps = fpsOf(c);
  const cross = c.cross > 0 ? toFrames(c.cross, fps) : 0;
  let f = 0;
  for (const s of c.scenes) {
    if (s.id === sceneId) return f / fps;
    f += toFrames(s.seconds, fps) - cross;
  }
  throw new Error(`Cut "${cutId}" has no scene "${sceneId}".`);
}

/** Seconds → whole frames. The one place a second becomes a frame. */
export function toFrames(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}

/** The cut's length in frames, rounded exactly as the player lays its scenes out. */
export function cutFrames(cutId: string, fps: number): number {
  const c = plan(cutId);
  const cross = c.cross > 0 ? toFrames(c.cross, fps) : 0;
  return c.scenes.reduce((s, x) => s + toFrames(x.seconds, fps), 0) - cross * Math.max(0, c.scenes.length - 1);
}

/**
 * A clock through [drawnSec, sceneSec] knots: straight lines between them,
 * extended past both ends. [[0,0],[2,4]] plays the first 4 s of a scene in 2 s.
 * Put knots on the scene's pauses and squeeze those hardest; keep moves near 1:1.
 */
export function warp(knots: number[][]): (t: number) => number {
  const pts = [...knots].sort((a, b) => a[0] - b[0]);
  if (pts.length === 0) return (t) => t;
  if (pts.length === 1) return (t) => t - pts[0][0] + pts[0][1];
  return (t) => {
    let i = 0;
    while (i < pts.length - 2 && t > pts[i + 1][0]) i++;
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    return x1 === x0 ? y1 : y0 + ((t - x0) * (y1 - y0)) / (x1 - x0);
  };
}
