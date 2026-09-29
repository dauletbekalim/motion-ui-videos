/**
 * Settings for the `remotion` CLI (studio and render). scripts/stills.mjs uses
 * the Node APIs directly and sets the same things itself.
 */
import os from 'node:os';
import { Config } from '@remotion/cli/config';

// jpeg frames are faster to hand to the encoder than png, and at 95 nobody can tell
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
// Chrome and the encoder are memory-hungry: every concurrent frame is a Chrome
// tab holding the page. On 16 GiB of RAM or less, render 2 frames at a time
// (two renders at once, or a render with Remotion's default, is how a 16 GB
// laptop crashes halfway through). With more, null lets Remotion pick: half
// the CPU threads, up to 8. A --concurrency flag on the command line wins.
Config.setConcurrency(os.totalmem() <= 16 * 1024 ** 3 ? 2 : null);
