/**
 * The scene registry: `scenes[].id` in src/cuts.json → component. A scene can
 * appear in several cuts; it reads useCut() and useStage() to adapt its
 * captions and layout, and useMarks() for every time a sound lands on.
 *
 * This project keeps the template's Lumen demo (src/scenes/lumen.ts) and adds
 * the skill's own promo (src/scenes/promo/), which plays the Lumen cuts live
 * inside its frames.
 */
import type { ComponentType } from 'react';
import { LUMEN_SCENES } from './lumen';
import { PROMO_SCENES } from './promo';

export const SCENES: Record<string, ComponentType> = {
  ...LUMEN_SCENES,
  ...PROMO_SCENES,
};
