// Light CAD palette (grey / red / yellow) — the MDT tablet's look.
// Applied as a design-token override so shared dark-theme bodies render
// as the same light CAD app wherever this style lands (the MDT screen,
// pop-out treatment boxes, …).

export const CAD_VARS = {
  "--color-bg": "#f4f4f5",
  "--color-surface": "#ffffff",
  "--color-surface-raised": "#e7e7ea",
  "--color-border": "#a1a1aa",
  "--color-border-subtle": "#d4d4d8",
  "--color-text": "#18181b",
  "--color-text-dim": "#52525b",
  "--color-text-muted": "#71717a",
  "--color-amber": "#a16207",
  "--color-amber-dim": "#b45309",
  "--color-critical": "#dc2626",
  "--color-ok": "#15803d",
  "--color-info": "#1d4ed8",
} as React.CSSProperties;
