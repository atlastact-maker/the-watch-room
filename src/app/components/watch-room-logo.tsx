// The Watch Room mark — a six-pane window with one pane lit.
//
// Drawn rather than imported as a bitmap so it stays crisp at any size,
// and so it can take the surrounding theme: the frame and panes read off
// the design tokens, which means the same component sits correctly on
// the dark ops chrome and on the light CAD bar without two versions.
//
// The lit pane is the point of the mark — one window in the building
// still has somebody in it — so it always takes the amber token rather
// than a token that might resolve to something quiet.

export function WatchRoomLogo({
  className = "",
  title,
}: {
  className?: string;
  /** Give it a title only where it is standing in for the product name;
   *  beside the words "The Watch Room" it is decorative and should stay
   *  out of the accessibility tree. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 118 78"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {/* Frame */}
      <rect width="118" height="78" fill="var(--color-border-subtle)" />
      {/* Top row */}
      <rect x="6.5" y="6.5" width="31" height="29.5" fill="var(--color-surface)" />
      <rect x="43.5" y="6.5" width="31" height="29.5" fill="var(--color-surface)" />
      <rect x="80.5" y="6.5" width="31" height="29.5" fill="var(--color-surface)" />
      {/* Bottom row — the lit pane sits bottom-left */}
      <rect x="6.5" y="42" width="31" height="29.5" fill="var(--color-amber)" />
      <rect x="43.5" y="42" width="31" height="29.5" fill="var(--color-surface)" />
      <rect x="80.5" y="42" width="31" height="29.5" fill="var(--color-surface)" />
    </svg>
  );
}
