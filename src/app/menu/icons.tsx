// The operator console's icon set: sixteen-pixel line marks drawn to one stroke
// weight, so the sidebar reads as one family rather than a row of
// whatever glyphs the font happened to have.

import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const Icon = {
  home: (p: P) => <svg {...base} {...p}><path d="M2.5 7.6 8 3l5.5 4.6" /><path d="M4 7v6h3v-3.5h2V13h3V7" /></svg>,
  shift: (p: P) => <svg {...base} {...p}><circle cx="8" cy="8" r="5.5" /><path d="M6.6 5.7v4.6L10.3 8z" fill="currentColor" stroke="none" /></svg>,
  record: (p: P) => <svg {...base} {...p}><path d="M2.5 13.5h11" /><path d="M4 11V8M7 11V5M10 11V7M13 11V3.5" /></svg>,
  guide: (p: P) => <svg {...base} {...p}><path d="M8 4.2C6.9 3.3 5.3 3 2.8 3v9.4c2.5 0 4.1.3 5.2 1.2 1.1-.9 2.7-1.2 5.2-1.2V3c-2.5 0-4.1.3-5.2 1.2z" /><path d="M8 4.2v9.4" /></svg>,
  library: (p: P) => <svg {...base} {...p}><path d="M2.5 3h3v10h-3zM6.5 3h3v10h-3z" /><path d="m10 3.6 2.9-.7 2.1 9.6-2.9.7z" /></svg>,
  briefing: (p: P) => <svg {...base} {...p}><rect x="3" y="3" width="10" height="11" rx="1" /><path d="M6 2.5h4v2H6zM5.5 8h5M5.5 10.5h3.5" /></svg>,
  discord: (p: P) => <svg {...base} {...p}><path d="M3 4.5A10 10 0 0 1 6 3.5l.4.8a8 8 0 0 1 3.2 0l.4-.8a10 10 0 0 1 3 1c1 2.3 1.4 4.6 1.2 7a10 10 0 0 1-3 1.5l-.8-1.2" /><path d="M5.6 11.8 4.8 13a10 10 0 0 1-3-1.5c-.2-2.4.2-4.7 1.2-7" /><circle cx="6.2" cy="8.6" r=".9" fill="currentColor" stroke="none" /><circle cx="9.8" cy="8.6" r=".9" fill="currentColor" stroke="none" /><path d="M5.5 11.3c1.6.6 3.4.6 5 0" /></svg>,
  updates: (p: P) => <svg {...base} {...p}><path d="M8 2.5v11M2.5 8h11" /><path d="m4.3 4.3 1.2 1.2M11.7 4.3l-1.2 1.2M4.3 11.7l1.2-1.2M11.7 11.7l-1.2-1.2" opacity=".55" /></svg>,
  admin: (p: P) => <svg {...base} {...p}><path d="M8 2.5 13 4.3v3.4c0 3-2.1 5.1-5 6.1-2.9-1-5-3.1-5-6.1V4.3z" /><path d="m5.8 8 1.5 1.5 3-3" /></svg>,
  settings: (p: P) => <svg {...base} {...p}><path d="M2.5 5h11M2.5 11h11" /><circle cx="6" cy="5" r="1.7" fill="#101315" /><circle cx="10" cy="11" r="1.7" fill="#101315" /></svg>,
  arrow: (p: P) => <svg {...base} {...p}><path d="M3 8h10M9 4l4 4-4 4" /></svg>,
  external: (p: P) => <svg {...base} {...p}><path d="M6.5 3H3v10h10V9.5" /><path d="M9 3h4v4M13 3 7.5 8.5" /></svg>,
  pause: (p: P) => <svg {...base} {...p}><path d="M5.5 3.5v9M10.5 3.5v9" strokeWidth="2" /></svg>,
  play: (p: P) => <svg {...base} {...p}><path d="M5 3.5v9L12 8z" fill="currentColor" stroke="none" /></svg>,
  clock: (p: P) => <svg {...base} {...p}><circle cx="8" cy="8" r="5.5" /><path d="M8 4.8V8l2.2 1.4" /></svg>,
  check: (p: P) => <svg {...base} {...p}><path d="m3.5 8.5 3 3 6-7" /></svg>,
  eye: (p: P) => <svg {...base} {...p}><path d="M1.8 8s2.3-4.2 6.2-4.2S14.2 8 14.2 8s-2.3 4.2-6.2 4.2S1.8 8 1.8 8z" /><circle cx="8" cy="8" r="2" /></svg>,
  warn: (p: P) => <svg {...base} {...p}><path d="M8 2.8 14 13H2z" /><path d="M8 6.5v3M8 11.3v.2" /></svg>,
  bell: (p: P) => <svg {...base} {...p}><path d="M4.2 11.2V7.5a3.8 3.8 0 0 1 7.6 0v3.7l1.2 1.3H3z" /><path d="M6.6 14.2a1.5 1.5 0 0 0 2.8 0" /><path d="M8 2.3v1.4" /></svg>,
  colleagues: (p: P) => <svg {...base} {...p}><circle cx="6" cy="5.8" r="2.3" /><circle cx="11.2" cy="6.4" r="1.8" /><path d="M2.3 13.2c.2-2.4 1.8-3.9 3.7-3.9s3.5 1.5 3.7 3.9" /><path d="M10.2 12.6c.2-1.6 1.1-2.6 2.3-2.6 1 0 1.8.6 2.2 1.6" /></svg>,
};

export type IconName = keyof typeof Icon;
