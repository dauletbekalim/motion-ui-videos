/**
 * Every composition: one per cut in src/cuts.json (size and fps from its
 * format, length computed from its scenes), plus the stills. Add a cut to
 * cuts.json and it shows up here on its own.
 */
import { Composition, Still } from 'remotion';
import './fonts';
import { FORMATS } from './formats';
import { CUTS, cutFrames } from './lib/time';
import { Cover } from './scenes/Cover';
import { Thumbnail } from './scenes/Thumbnail';
import { Video, type VideoProps } from './Video';

export function Root() {
  return (
    <>
      {Object.entries(CUTS).map(([id, cut]) => {
        const f = FORMATS[cut.format];
        if (!f) throw new Error(`Cut "${id}" has format "${cut.format}", which is not in src/formats.ts.`);
        return (
          <Composition
            key={id}
            id={id}
            component={Video}
            durationInFrames={cutFrames(id, f.fps)}
            fps={f.fps}
            width={f.width}
            height={f.height}
            defaultProps={{ cut: id, safe: false } as VideoProps}
          />
        );
      })}
      {/* the reel's cover: 1080×1920, everything that matters inside the centred 1080×1440 */}
      <Still id="cover" component={Cover} width={1080} height={1920} />
      {/* a YouTube thumbnail for the showcase */}
      <Still id="thumbnail" component={Thumbnail} width={1280} height={720} />
    </>
  );
}
