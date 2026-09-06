// The CAD palette the desk's panels are painted in.
//
// Every panel sets these as inline design-token overrides so the shared
// dark-theme bodies render as the light CAD app wherever the style lands
// (the MDT screen, pop-out treatment boxes, …). Since the VECTOR shell
// took over the on-shift screen the values are no longer fixed: each one
// reads the shell's --vec-* token, so the same panel follows the light /
// dark switch on the navigation bar. The fallbacks are the original light
// palette, for anywhere a panel renders outside the shell.

export const CAD_VARS = {
  "--color-bg": "var(--vec-surface, #f4f4f5)",
  "--color-surface": "var(--vec-surface, #ffffff)",
  "--color-surface-raised": "var(--vec-surface-raised, #e7e7ea)",
  "--color-border": "var(--vec-border, #a1a1aa)",
  "--color-border-subtle": "var(--vec-border-subtle, #d4d4d8)",
  "--color-text": "var(--vec-text, #18181b)",
  "--color-text-dim": "var(--vec-text-dim, #52525b)",
  "--color-text-muted": "var(--vec-text-muted, #71717a)",
  "--color-amber": "var(--vec-warn, #a16207)",
  "--color-amber-dim": "var(--vec-warn, #b45309)",
  "--color-critical": "var(--vec-stop, #dc2626)",
  "--color-ok": "var(--vec-go, #15803d)",
  "--color-info": "var(--vec-work, #1d4ed8)",
} as React.CSSProperties;
