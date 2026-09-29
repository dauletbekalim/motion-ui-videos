/**
 * Plays one of the template's own cuts (the Lumen demo) live inside a promo
 * frame: the real scenes, at their real size, scaled down. Nothing here is a
 * video file or a screenshot; a frame of the embed is exactly the frame the
 * template renders at that second.
 *
 * `<Sequence width height>` hands the embedded scenes their own stage size
 * (useStage reads it), so a 9:16 reel lays itself out as a reel even inside a
 * 16:9 promo, and `<Freeze>` gives them their own clock.
 */
import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Freeze, Sequence, useVideoConfig } from 'remotion';
import { FORMATS } from '../formats';
import { CUTS, CutContext, SceneContext, sceneStart, toFrames, warp } from '../lib/time';
import { LUMEN_SCENES } from '../scenes/lumen';
import { C } from '../theme';

type Size = { W: number; H: number };

/**
 * A moment of a template cut, in cut seconds: `at` (scene seconds, or one of
 * the scene's marks) plus `plus` into scene `scene`. Name a moment this way,
 * not as bare cut seconds, so it stays the same moment when the template is
 * re-timed (a longer scene, another crossfade). A negative result of `plus`
 * reaches back into the scene before. Unwarped scenes only.
 */
export function momentOf(cut: string, scene: string, at: number | string = 0, plus = 0): number {
  const s = CUTS[cut].scenes.find((x) => x.id === scene);
  if (!s) throw new Error(`momentOf: cut "${cut}" has no scene "${scene}"`);
  if (s.warp) throw new Error(`momentOf: "${cut}" › "${scene}" is warped; give cut seconds instead`);
  const sec = typeof at === 'number' ? at : s.marks?.[at];
  if (sec == null) throw new Error(`momentOf: "${cut}" › "${scene}" has no mark "${at}"`);
  return sceneStart(cut, scene) + sec + plus;
}

/** The native size of a template cut (from its format), or of a size given. */
export function cutSize(cut: string): Size {
  const f = FORMATS[CUTS[cut].format];
  return { W: f.width, H: f.height };
}

/**
 * A template cut at `time` seconds (cut time, crossfades included), drawn
 * `w` px wide. With `scene`, only that scene at its own `time` (scene time).
 * `size` renders it at another stage size than its format's (a square from
 * the showcase's scenes, say): the scenes re-lay themselves out for it.
 */
export function Embed({ cut, time, w, scene, size, radius = 0, style }: { cut: string; time: number; w: number; scene?: string; size?: Size; radius?: number; style?: CSSProperties }) {
  const { fps } = useVideoConfig();
  const plan = CUTS[cut];
  const { W, H } = size ?? cutSize(cut);
  const k = w / W;
  const layers: { id: string; local: number; fade: number; info: { id: string; seconds: number; marks: Record<string, number>; warp: ((t: number) => number) | null } }[] = [];
  const infoOf = (s: (typeof plan.scenes)[number]) => ({ id: s.id, seconds: s.seconds, marks: s.marks ?? {}, warp: s.warp ? warp(s.warp) : null });
  if (scene) {
    const s = plan.scenes.find((x) => x.id === scene);
    if (!s) throw new Error(`Embed: cut "${cut}" has no scene "${scene}"`);
    layers.push({ id: s.id, local: time, fade: 1, info: infoOf(s) });
  } else {
    // the player's layout, on the cut's own frame grid: each scene starts `cross` before the previous one ends
    const cf = FORMATS[plan.format].fps;
    const cross = plan.cross > 0 ? toFrames(plan.cross, cf) / cf : 0;
    let start = 0;
    for (const s of plan.scenes) {
      const len = toFrames(s.seconds, cf) / cf;
      if (time >= start && time < start + len) layers.push({ id: s.id, local: time - start, fade: cross > 0 && start > 0 ? Math.min(1, (time - start) / cross) : 1, info: infoOf(s) });
      start += len - cross;
    }
    if (!layers.length) {
      const s = plan.scenes[plan.scenes.length - 1];
      layers.push({ id: s.id, local: s.seconds - 1 / fps, fade: 1, info: infoOf(s) });
    }
  }
  return (
    <div style={{ position: 'relative', width: w, height: H * k, overflow: 'hidden', borderRadius: radius, background: C.bg, ...style }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${k})`, transformOrigin: '0 0' }}>
        {layers.map(({ id, local, fade, info }) => {
          const Scene = LUMEN_SCENES[id];
          return (
            <Sequence key={id} layout="none" width={W} height={H} name={`embed ${cut}/${id}`} showInTimeline={false}>
              <Freeze frame={local * fps}>
                <CutContext.Provider value={cut}>
                  <SceneContext.Provider value={info}>
                    <AbsoluteFill style={{ opacity: fade }}>
                      <Scene />
                    </AbsoluteFill>
                  </SceneContext.Provider>
                </CutContext.Provider>
              </Freeze>
            </Sequence>
          );
        })}
      </div>
    </div>
  );
}

/** Where a window looks into a cut: the point (x, y) in the cut's own px sits at the window's centre, drawn at scale `s`. */
export type Aim = { x: number; y: number; s: number };

/**
 * A window `w` × `h` onto a template cut, cropped to the part that matters
 * rather than the whole frame shrunk to fit: at `aim.s` 1 a reel's UI is at
 * its own phone size (body text 34 px). Rounded, clipped, with a hairline.
 */
export function CutWindow({ cut, time, w, h, aim, scene, radius = 36, style, children }: { cut: string; time: number; w: number; h: number; aim: Aim; scene?: string; radius?: number; style?: CSSProperties; children?: ReactNode }) {
  const { W } = cutSize(cut);
  return (
    <div style={{ position: 'relative', width: w, height: h, borderRadius: radius, overflow: 'hidden', background: C.bg, ...style }}>
      <div style={{ position: 'absolute', left: w / 2 - aim.x * aim.s, top: h / 2 - aim.y * aim.s }}>
        <Embed cut={cut} time={time} w={W * aim.s} scene={scene} />
      </div>
      <div style={{ position: 'absolute', inset: 0, borderRadius: radius, boxShadow: `inset 0 0 0 1px ${C.line}`, pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

/** A still (the cover, the thumbnail) drawn `w` px wide from its native size. */
export function EmbedStill({ W, H, w, children, radius = 0, style }: { W: number; H: number; w: number; children: ReactNode; radius?: number; style?: CSSProperties }) {
  const k = w / W;
  return (
    <div style={{ position: 'relative', width: w, height: H * k, overflow: 'hidden', borderRadius: radius, background: C.bg, ...style }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${k})`, transformOrigin: '0 0' }}>
        <Sequence layout="none" width={W} height={H} showInTimeline={false}>
          <Freeze frame={0}>
            <CutContext.Provider value={null}>{children}</CutContext.Provider>
          </Freeze>
        </Sequence>
      </div>
    </div>
  );
}
