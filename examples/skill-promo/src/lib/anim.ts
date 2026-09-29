/**
 * Motion math. Every function is pure and every time is in seconds, so a
 * frame is a function of the clock alone: renders are identical, and a scene
 * can be played on a warped clock without changing a number in it.
 *
 * No Math.random() or Date in scenes: use rand(seed).
 */
import { Easing } from 'remotion';

/** Fast out, long settle: the house ease. cubic-bezier(0.22, 1, 0.36, 1). */
export const EASE = Easing.bezier(0.22, 1, 0.36, 1);

export const EASINGS = {
  /** things arriving: fast, then a long settle */
  out: EASE,
  /** things travelling from one place to another (cursor, camera) */
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** things leaving: slow start, quick exit */
  in: Easing.bezier(0.55, 0, 1, 0.45),
  /** UI state changes: a quick, decisive snap */
  snappy: Easing.bezier(0.2, 0.9, 0.1, 1),
  /** a camera operator's push: commits early (fastest ~31% in, 90% there by 62%), settles long */
  commit: Easing.bezier(0.45, 0, 0.15, 1),
  linear: (x: number) => x,
} as const;

export function clamp(x: number, lo = 0, hi = 1): number {
  return Math.min(hi, Math.max(lo, x));
}

export function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}

/** 0 → 1 from `start` over `dur` seconds, eased and clamped. */
export function prog(t: number, start: number, dur: number, ease: (x: number) => number = EASE): number {
  if (dur <= 0) return t >= start ? 1 : 0;
  return ease(clamp((t - start) / dur));
}

/**
 * A spring from `start`, 0 → 1. Calm by default (critically damped, settles
 * in about 0.55 s); `bouncy` overshoots once by about 7% and settles, never
 * wobbling twice. Closed form, so it is exact at any (warped) time.
 * `fps` snaps the clock to that frame grid, for when a spring must match a
 * frame-stepped animation exactly; usually leave it out.
 */
export function pop(t: number, start: number, opts: { bouncy?: boolean; fps?: number } = {}): number {
  let x = t - start;
  if (opts.fps) x = Math.round(x * opts.fps) / opts.fps;
  if (x <= 0) return 0;
  if (!opts.bouncy) {
    const w = 13; // rad/s
    return 1 - Math.exp(-w * x) * (1 + w * x);
  }
  const w = 16;
  const z = 0.65; // damping ratio: one overshoot of e^(-zπ/√(1-z²)) ≈ 7%
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + ((z * w) / wd) * Math.sin(wd * x));
}

/** Deterministic noise in [0, 1) for an integer seed. */
export function rand(seed: number): number {
  let h = Math.imul((seed | 0) ^ 0x9e3779b1, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** A point on a cubic bezier at k (0 → 1). */
export function bezier(k: number, p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number]): [number, number] {
  const u = 1 - k;
  const a = u * u * u;
  const b = 3 * u * u * k;
  const c = 3 * u * k * k;
  const d = k * k * k;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

/** When item i of a staggered group starts: start + i × each. */
export function stagger(i: number, each: number, start = 0): number {
  return start + i * each;
}

/** 0 → 1, repeating every `period` seconds. Ambient motion on loopT(t, 6) is seamless in a 6 s loop. */
export function loopT(t: number, period: number): number {
  return (((t % period) + period) % period) / period;
}
