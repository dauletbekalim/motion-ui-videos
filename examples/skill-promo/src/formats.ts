/**
 * Every shape a cut can take. A cut in src/cuts.json names one of these keys
 * as its `format`; the player takes the size and frame rate from here, and
 * scenes read `safe` (through useStage) to keep words and buttons clear of
 * the platform's own UI.
 *
 * `safe` is the margin, in px, that the platform may cover: the reel's right
 * edge has the like/comment/share column, its bottom has the caption and the
 * audio line, a story's top has the progress bars and the account name.
 * skills/motion-ui-videos/references/delivery-and-platforms.md explains each number.
 */
export type Safe = { top: number; right: number; bottom: number; left: number }; // px kept clear of platform UI
export type Format = { width: number; height: number; fps: number; safe: Safe; label: string };

export const FORMATS: Record<string, Format> = {
  showcase: { width: 1920, height: 1080, fps: 60, safe: { top: 54, right: 96, bottom: 54, left: 96 }, label: '16:9 product showcase / launch film' },
  reel: { width: 1080, height: 1920, fps: 30, safe: { top: 250, right: 150, bottom: 450, left: 64 }, label: '9:16 reel / TikTok / Shorts' },
  story: { width: 1080, height: 1920, fps: 30, safe: { top: 250, right: 64, bottom: 380, left: 64 }, label: '9:16 story (leave room for a link sticker)' },
  square: { width: 1080, height: 1080, fps: 30, safe: { top: 60, right: 60, bottom: 60, left: 60 }, label: '1:1 feed / feature clip' },
  portrait: { width: 1080, height: 1350, fps: 30, safe: { top: 60, right: 60, bottom: 60, left: 60 }, label: '4:5 feed post' },
  loop: { width: 1600, height: 1000, fps: 60, safe: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'seamless UI loop for landing pages / docs' },
  appstore: { width: 886, height: 1920, fps: 30, safe: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'App Store preview (portrait)' },
};
