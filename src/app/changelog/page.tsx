import Link from "next/link";
import type { Metadata } from "next";
import { CHANGELOG, formatEntryDate } from "@/lib/changelog";

export const metadata: Metadata = {
  title: "Patch notes · The Watch Room",
  description: "What's changed in The Watch Room, release by release.",
};

export default function ChangelogPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-mono text-lg uppercase tracking-widest text-(--color-amber)">
            Patch notes
          </h1>
          <p className="mt-1 text-sm text-(--color-text-muted)">
            What&apos;s changed, release by release. Pre-alpha — things move
            quickly and some of it will move again.
          </p>
        </div>
        <Link
          href="/menu"
          className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:text-(--color-amber)"
        >
          ← Ops centre
        </Link>
      </div>

      <ol className="mt-8 space-y-8">
        {CHANGELOG.map((entry) => (
          <li
            key={entry.version}
            className="border-l-2 border-(--color-border-subtle) pl-4"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-base font-semibold text-(--color-text)">
                {entry.title}
              </h2>
              <span className="rounded-sm border border-(--color-border-subtle) px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-(--color-text-dim)">
                v{entry.version}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                {formatEntryDate(entry.date)}
              </span>
            </div>
            <ul className="mt-2 space-y-1.5">
              {entry.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-2.5 text-[13px] leading-relaxed text-(--color-text-muted)"
                >
                  <span className="mt-0.5 text-(--color-amber)">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <p className="mt-10 border-t border-(--color-border-subtle) pt-4 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
        The story behind each release goes up in the dev diary on Discord.
      </p>
    </main>
  );
}
