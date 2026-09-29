/**
 * The brand, as tokens. This is the one file to edit when the video is about
 * your product instead of the demo: colours, type, radii, shadows, and the
 * name/URL/call to action the end card and stills use.
 *
 * Pull these from the product's own CSS (its variables, Tailwind config or
 * design tokens) rather than guessing: the video should look like the app.
 */

export const C = {
  // surfaces, darkest first
  bg: '#07070A', // the stage behind everything
  sidebar: '#0B0B0F',
  app: '#0F0F13', // the product's main background
  panel: '#15151B', // rows, cards, inputs
  raised: '#1A1A21', // popovers and dialogs
  hover: '#FFFFFF0A',
  // hairlines (white with alpha, so they sit on any surface)
  line: '#FFFFFF12',
  lineStrong: '#FFFFFF1F',
  // type
  text: '#EDEDF2',
  dim: '#A1A1AE',
  faint: '#6B6B78',
  // brand: Lumen's warm light, and the colour it fades into
  accent: '#FFB547',
  accent2: '#FF7A59',
  // meaning
  ok: '#4ADE80',
  danger: '#FF5F5F',
  info: '#7AA2FF',
} as const;

/** Identity colours for people (avatars, live cursors, carets), in cast order. Distinct in hue, even in brightness. */
export const PEOPLE_COLORS = ['#FFB547', '#FF7D98', '#5DC7FF', '#7BDB9C', '#B996FF', '#FF9E5E'] as const;

/** Font stacks. The faces themselves are loaded in src/fonts.ts. */
export const FONT = {
  ui: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace",
} as const;

/** Inter's single-storey a and open digits read a little softer and more "product". */
export const FEATURES = "'cv11', 'ss01', 'ss03'";

export const R = { sm: 6, md: 10, lg: 14, xl: 20, xxl: 28, pill: 999 } as const;

export const SHADOW = {
  card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 60px -24px rgba(0,0,0,0.8)',
  modal: '0 1px 0 rgba(255,255,255,0.06) inset, 0 0 0 1px rgba(255,255,255,0.07), 0 40px 120px -20px rgba(0,0,0,0.9), 0 12px 40px -12px rgba(0,0,0,0.6)',
  window: '0 1px 0 rgba(255,255,255,0.05) inset, 0 0 0 1px rgba(255,255,255,0.06), 0 60px 160px -40px rgba(0,0,0,0.95)',
} as const;

/** What the closing card, the cover and the thumbnail say. */
export const BRAND = {
  name: 'Lumen',
  url: 'lumen.example',
  promise: 'One calm place for your team’s notes.',
  cta: 'Try Lumen free',
} as const;

/** `alpha('#FFB547', 0.2)` → '#FFB54733'. Works on 6-digit hex only. */
export function alpha(hex: string, a: number): string {
  const v = Math.round(Math.max(0, Math.min(1, a)) * 255);
  return `${hex.slice(0, 7)}${v.toString(16).padStart(2, '0')}`;
}

/** The brand gradient, for the logo tile and the one button that matters. */
export const GRADIENT = `linear-gradient(135deg, ${C.accent} 0%, ${C.accent2} 100%)`;

/** All of the above as one object, for code that prefers `theme.colors.accent` to `C.accent`. */
export const theme = { colors: { ...C, people: PEOPLE_COLORS }, fonts: FONT, radii: R, shadows: SHADOW, gradient: GRADIENT, brand: BRAND } as const;
