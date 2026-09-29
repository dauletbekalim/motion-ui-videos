/**
 * The product's icons, drawn here as plain 24×24 strokes so the demo depends
 * on no icon package and every symbol renders the same on every machine
 * (a ⌘ or ✓ typed as text falls back to whatever font the renderer has).
 *
 * For your own product, copy the icons it really uses (its SVG sprite or
 * icon package) so the video matches the app.
 */
import type { CSSProperties } from 'react';

const PATHS = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  compose: <><path d="M12 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5V12" /><path d="M17.6 3.6a2 2 0 0 1 2.8 2.8L12 14.8l-3.6.8.8-3.6z" /></>,
  inbox: <><path d="M4 13.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4.5" /><path d="M4 13.5 6.6 5.6A2 2 0 0 1 8.5 4.2h7a2 2 0 0 1 1.9 1.4L20 13.5h-4.5l-1.5 2.5h-4l-1.5-2.5z" /></>,
  note: <><path d="M14 3.5H7.5A2.5 2.5 0 0 0 5 6v12a2.5 2.5 0 0 0 2.5 2.5h9A2.5 2.5 0 0 0 19 18V8.5z" /><path d="M14 3.5v5h5M9 13h6M9 16.5h4" /></>,
  users: <><circle cx="9" cy="8.5" r="3.5" /><path d="M3 19.5c.7-3.2 3.1-5 6-5s5.3 1.8 6 5" /><path d="M15.5 5.3a3.5 3.5 0 0 1 0 6.4M17.5 14.8c1.8.7 3.1 2.3 3.5 4.7" /></>,
  star: <path d="M12 3.8l2.5 5.1 5.6.8-4.05 3.95.95 5.6L12 16.6l-5 2.65.95-5.6L3.9 9.7l5.6-.8z" />,
  share: <><path d="M12 3.5v11M8 7.5l4-4 4 4" /><path d="M5 12.5V18a2.5 2.5 0 0 0 2.5 2.5h9A2.5 2.5 0 0 0 19 18v-5.5" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5s1.1-6.1 3.4-8.5z" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  chevronDown: <path d="M7 10l5 5 5-5" />,
  chevronRight: <path d="M10 7l5 5-5 5" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  history: <><path d="M4 12a8 8 0 1 0 2.35-5.65L4 8.7" /><path d="M4 4v4.7h4.7" /><path d="M12 8v4.2l2.8 1.8" /></>,
  cmd: <path d="M9 9h6v6H9zM9 9V6.5A2.5 2.5 0 1 0 6.5 9H9zM15 9V6.5a2.5 2.5 0 1 1 2.5 2.5H15zM9 15v2.5A2.5 2.5 0 1 1 6.5 15H9zM15 15v2.5a2.5 2.5 0 1 0 2.5-2.5H15z" />,
  enter: <><path d="M19 5v7a3 3 0 0 1-3 3H6" /><path d="M9.5 11.5 6 15l3.5 3.5" /></>,
  arrowDown: <path d="M12 5v14M6.5 13.5 12 19l5.5-5.5" />,
  hash: <path d="M9.5 4 7.5 20M16.5 4l-2 16M4.5 9h16M3.5 15h16" />,
  sliders: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  more: <><circle cx="6" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="18" cy="12" r="1.2" fill="currentColor" /></>,
  chat: <path d="M20 11.5a7.5 7.5 0 0 1-11.1 6.6L4 19.5l1.4-4.4A7.5 7.5 0 1 1 20 11.5z" />,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4.5 7 7.5 6 7.5-6" /></>,
  book: <path d="M5 16.5v-11A2.5 2.5 0 0 1 7.5 3H19v13.5H7.5a2.5 2.5 0 0 0 0 5H19" />,
  sticky: <><path d="M5.5 4h13A1.5 1.5 0 0 1 20 5.5V14l-6 6H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4z" /><path d="M14 20v-4.5a1.5 1.5 0 0 1 1.5-1.5H20" /></>,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="m20.5 16-4.5-4.5L6 19.5" /></>,
  filter: <path d="M4 6.5h16M7 12h10M10 17.5h4" />,
  sidebar: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><path d="M9.5 4.5v15" /></>,
  at: <><circle cx="12" cy="12" r="3.5" /><path d="M15.5 12v1.5a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.3 6.7" /></>,
  bolt: <path d="M13 3 5 13.5h6l-1 7.5 8-10.5h-6z" />,
  checklist: <><path d="M11 6.5h9M11 12h9M11 17.5h9" /><path d="m3.5 6.5 1.6 1.6L8 5.2M3.5 12l1.6 1.6L8 10.7M3.5 17.5l1.6 1.6L8 16.2" /></>,
  mic: <><rect x="9" y="3.5" width="6" height="11" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16, color = 'currentColor', stroke = 1.75, style }: { name: IconName; size?: number; color?: string; stroke?: number; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: 'none', display: 'block', color, ...style }}
    >
      {PATHS[name]}
    </svg>
  );
}
