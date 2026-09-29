/**
 * The skill's own promo: the story "product videos, written as code", told
 * with the template's machinery and its Lumen demo playing live inside it.
 * Each scene lays itself out for 9:16 (promo-reel) and 16:9 (promo-showcase).
 */
import type { ComponentType } from 'react';
import { PCheck } from './PCheck';
import { PEnd } from './PEnd';
import { PFormats } from './PFormats';
import { PHook } from './PHook';
import { PPayoff } from './PPayoff';
import { PPrompt } from './PPrompt';
import { PRebuild } from './PRebuild';
import { PSounds } from './PSounds';
import { PTimeline } from './PTimeline';

export const PROMO_SCENES: Record<string, ComponentType> = {
  pHook: PHook,
  pPrompt: PPrompt,
  pRebuild: PRebuild,
  pTimeline: PTimeline,
  pCheck: PCheck,
  pFormats: PFormats,
  pSounds: PSounds,
  pPayoff: PPayoff,
  pEnd: PEnd,
};
