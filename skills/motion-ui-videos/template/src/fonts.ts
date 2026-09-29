/**
 * Loads the faces theme.ts names. @remotion/google-fonts holds every frame
 * until the files have arrived, so a render never silently falls back to a
 * system font. (It fetches from Google Fonts, so renders need a connection;
 * for offline work, put .woff2 files in public/fonts and use @remotion/fonts.)
 *
 * Only the `latin` subset is loaded. Symbols outside it (⌘, →, ✓, ↵) fall back
 * to another font, so the product UI draws them as icons (src/product/icons.tsx).
 */
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';

const inter = loadInter('normal', { weights: ['400', '500', '600', '700', '800'], subsets: ['latin'] });
const mono = loadMono('normal', { weights: ['400', '500', '600'], subsets: ['latin'] });

export const fontsReady = Promise.all([inter.waitUntilDone(), mono.waitUntilDone()]);
export const FAMILIES = { ui: inter.fontFamily, mono: mono.fontFamily };
