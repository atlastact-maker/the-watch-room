"use client";

// "What's new" card on the ops-centre menu. Tracks the newest entry the
// operator has actually seen, so a returning player is shown what landed
// while they were away rather than the whole changelog.
//
// The seen-marker is read through useSyncExternalStore rather than an
// effect: it gives a null server snapshot (so SSR and the first client
// render agree — no hydration mismatch, no badge flash) and re-renders
// every mounted card when the marker changes, in this tab or another.

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  CHANGELOG,
  LATEST,
  entriesSince,
  formatEntryDate,
} from "@/lib/changelog";

const SEEN_KEY = "twr:changelog-seen:v1";

let listeners: (() => void)[] = [];

function subscribe(onChange: () => void): () => void {
  listeners.push(onChange);
  // Cross-tab changes arrive as storage events.
  window.addEventListener("storage", onChange);
  return () => {
    listeners = listeners.filter((l) => l !== onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

/** Server render (and the first client render) assume nothing is seen —
 *  which renders the card without the "new" badge. */
function getServerSnapshot(): string | null {
  return null;
}

function markSeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, LATEST.date);
  } catch {
    // best-effort
  }
  for (const l of listeners) l();
}

export function ChangelogCard() {
  const seen = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // No marker at all = first visit. Show the card, but don't shout "new"
  // at someone who has never seen any of it.
  const unseen = seen === null ? [] : entriesSince(seen);
  const isNew = unseen.length > 0;

  return (
    <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface)/40 p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
          What&apos;s new · {formatEntryDate(LATEST.date)}
          {isNew && (
            <span className="rounded-sm border border-(--color-amber) bg-(--color-amber)/10 px-1.5 py-0.5 text-[9px] font-bold text-(--color-amber)">
              {unseen.length} new
            </span>
          )}
        </span>
        <Link
          href="/changelog"
          onClick={markSeen}
          className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:text-(--color-amber)"
        >
          All patch notes →
        </Link>
      </div>

      <div className="mt-2.5">
        <div className="text-sm font-semibold text-(--color-text)">
          {LATEST.title}
          <span className="ml-2 font-mono text-[10px] font-normal tracking-widest text-(--color-text-dim)">
            v{LATEST.version}
          </span>
        </div>
        <ul className="mt-1.5 space-y-1">
          {LATEST.items.slice(0, 2).map((item) => (
            <li
              key={item}
              className="flex gap-2 text-[12px] leading-snug text-(--color-text-muted)"
            >
              <span className="text-(--color-amber)">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {(LATEST.items.length > 2 || CHANGELOG.length > 1) && (
          <Link
            href="/changelog"
            onClick={markSeen}
            className="mt-1.5 inline-block font-mono text-[10px] uppercase tracking-widest text-(--color-amber) hover:underline"
          >
            {LATEST.items.length > 2
              ? `+${LATEST.items.length - 2} more in this release`
              : "Read the full notes"}
          </Link>
        )}
      </div>
    </div>
  );
}
