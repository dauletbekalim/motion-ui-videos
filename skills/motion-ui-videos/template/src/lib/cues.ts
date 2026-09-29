/**
 * The words the video says, as data: src/captions.json holds every caption
 * and title line, by cut and scene, so the picture draws them and
 * scripts/captions.mjs turns the same lines into .srt, .vtt and a transcript.
 *
 *   { "<cut>": { "<scene id>": { "punch"?: true, "drawn"?: true, "cues": [{ "at": …, "text": "…" }] } } }
 *
 * `at` is scene seconds (0.3), a mark ("promise"), or a mark with an offset
 * ("appsIn + 0.2", "keys - 0.3"), so a re-timed mark moves its caption too.
 * With "drawn": true the cues are timed on drawn (unwarped) seconds: give
 * plain numbers there. "punch": true marks a block the scene shows as punch
 * captions; the export joins its short chunks into readable lines.
 */
import { useContext } from 'react';
import captions from '../captions.json';
import { SceneContext, useCut, useMarks } from './time';

export type CueSpec = { at: number | string; text: string };
export type CueBlock = { punch?: boolean; drawn?: boolean; cues: CueSpec[] };
export const CAPTIONS = captions as unknown as Record<string, Record<string, CueBlock>>;

/** A cue's `at` in scene seconds: a number as it is, or a mark name with an optional ± offset. */
export function cueTime(at: number | string, marks: Record<string, number>): number {
  if (typeof at === 'number') return at;
  const m = at.match(/^\s*([A-Za-z_$][\w$]*)\s*(?:([+-])\s*(\d+(?:\.\d+)?|\.\d+))?\s*$/);
  if (!m) throw new Error(`src/captions.json: "${at}" is not a time. Use seconds (0.3), a mark ("promise") or a mark with an offset ("appsIn + 0.2").`);
  const base = marks[m[1]];
  return m[2] ? base + (m[2] === '-' ? -1 : 1) * Number(m[3]) : base;
}

/**
 * This scene's cues in the current cut, with marks resolved to scene seconds
 * (a mark the cut lacks throws, like useMarks). Spread it into <Captions>:
 * `<Captions {...useCues()} top={…} />`, or take a title line from `cues[0]`.
 * No block for this cut and scene: no cues.
 */
export function useCues(): { cues: { at: number; text: string }[]; variant: 'calm' | 'punch'; drawn: boolean } {
  const cut = useCut();
  const scene = useContext(SceneContext);
  const marks = useMarks();
  const block = scene ? CAPTIONS[cut]?.[scene.id] : undefined;
  return {
    cues: (block?.cues ?? []).map((c) => ({ at: cueTime(c.at, marks), text: c.text })),
    variant: block?.punch ? 'punch' : 'calm',
    drawn: Boolean(block?.drawn),
  };
}
