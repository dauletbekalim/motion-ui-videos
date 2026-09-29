/**
 * The template's demo scenes (Lumen, the fictional notes app), on their own so
 * the promo's Embed can play them inside its frames without importing the
 * whole registry (which also holds the promo scenes that import Embed).
 */
import type { ComponentType } from 'react';
import { End } from './End';
import { Features } from './Features';
import { Hook } from './Hook';
import { How } from './How';
import { Loop } from './Loop';
import { Problem } from './Problem';
import { ReelHook } from './ReelHook';
import { ReelLive } from './ReelLive';
import { ReelPalette } from './ReelPalette';
import { ReelPayoff } from './ReelPayoff';
import { ReelProblem } from './ReelProblem';
import { Reveal } from './Reveal';
import { Story } from './Story';

export const LUMEN_SCENES: Record<string, ComponentType> = {
  // showcase (16:9)
  hook: Hook,
  problem: Problem,
  reveal: Reveal, // also in the reel, through a warp
  how: How,
  features: Features,
  end: End, // also in the reel, laid out for 9:16
  // reel (9:16)
  reelHook: ReelHook,
  reelProblem: ReelProblem,
  reelPalette: ReelPalette,
  reelLive: ReelLive,
  reelPayoff: ReelPayoff,
  // landing-page loop and story
  loop: Loop,
  story: Story,
};
