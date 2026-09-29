/**
 * The player. One component plays every cut: it reads the cut from
 * src/cuts.json, lays its scenes in a row with crossfades, gives each scene
 * its clock (warp) and marks, and puts the sound, grain and (for checking)
 * the safe-zone overlay on top. You should rarely need to edit this file.
 */
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { useMemo } from 'react';
import { AbsoluteFill, getStaticFiles, Html5Audio, staticFile, useVideoConfig } from 'remotion';
import './fonts';
import { Grain, SafeZones } from './lib/ui';
import { CutContext, CUTS, SceneContext, toFrames, warp } from './lib/time';
import { SCENES } from './scenes';
import { C } from './theme';

export type VideoProps = { cut: string; safe?: boolean; grain?: boolean };

function hasFile(name: string): boolean {
  try {
    return getStaticFiles().some((f) => f.name === name);
  } catch {
    return false;
  }
}

export function Video({ cut, safe = false, grain }: VideoProps) {
  const plan = CUTS[cut];
  const { fps, width, height } = useVideoConfig();
  if (!plan) throw new Error(`No cut "${cut}" in src/cuts.json.`);
  const cross = plan.cross > 0 ? toFrames(plan.cross, fps) : 0;
  const portrait = height > width;
  const showGrain = grain ?? plan.grain ?? !portrait;
  const sound = `sound-${cut}.wav`;
  const playSound = plan.sound === true && hasFile(sound);
  const scenes = useMemo(
    () =>
      plan.scenes.map((s) => {
        if (!SCENES[s.id]) throw new Error(`Cut "${cut}" uses scene "${s.id}", which is not in src/scenes/index.ts.`);
        return { ...s, Scene: SCENES[s.id], info: { id: s.id, seconds: s.seconds, marks: s.marks ?? {}, warp: s.warp ? warp(s.warp) : null } };
      }),
    [plan, cut],
  );
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <CutContext.Provider value={cut}>
        <TransitionSeries>
          {scenes.flatMap(({ Scene, info, seconds }, i) => [
            ...(i > 0 && cross > 0 ? [<TransitionSeries.Transition key={`x-${i}`} presentation={fade()} timing={linearTiming({ durationInFrames: cross })} />] : []),
            <TransitionSeries.Sequence key={`s-${i}`} durationInFrames={toFrames(seconds, fps)} name={info.id}>
              <SceneContext.Provider value={info}>
                <Scene />
              </SceneContext.Provider>
            </TransitionSeries.Sequence>,
          ])}
        </TransitionSeries>
        {/* off for phone cuts by default: feed compression turns grain into mush */}
        {showGrain ? <Grain opacity={0.05} /> : null}
        {safe ? <SafeZones /> : null}
      </CutContext.Provider>
      {/* mastered to the picture already (sound/design.mjs): its own fades, its own level */}
      {playSound ? <Html5Audio src={staticFile(sound)} /> : null}
    </AbsoluteFill>
  );
}
