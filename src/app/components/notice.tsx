// The one notice. Every "done", "received", "not yet" and "that didn't
// work" on the account pages is this: a coloured rule down the left, a
// plain heading, a sentence or two. Same shape whether it is a form's
// success state or a standing panel, so the site reads as one voice.

const TONES = {
  ok: "border-(--color-ok) bg-(--color-ok)/8",
  amber: "border-(--color-amber) bg-(--color-amber)/8",
  critical: "border-(--color-critical) bg-(--color-critical)/8",
  info: "border-(--color-info) bg-(--color-info)/8",
  neutral: "border-(--color-border) bg-(--color-surface)/60",
} as const;

export function Notice({
  tone = "neutral",
  title,
  children,
  className = "",
}: {
  tone?: keyof typeof TONES;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-r-sm border-l-2 px-4 py-3 ${TONES[tone]} ${className}`}>
      <p className="text-sm font-semibold text-(--color-text)">{title}</p>
      {children && <div className="mt-1 space-y-2 text-sm leading-relaxed text-(--color-text-muted)">{children}</div>}
    </div>
  );
}
