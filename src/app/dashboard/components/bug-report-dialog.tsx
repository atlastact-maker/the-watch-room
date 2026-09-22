"use client";

import { useEffect, useState, type FormEvent } from "react";
import { submitBugReport } from "@/app/actions/bug-report";
import {
  BUG_CATEGORIES,
  BUG_SEVERITIES,
  DETAIL_MAX,
  SUMMARY_MAX,
  type BugCategory,
  type BugContext,
  type BugSeverity,
} from "@/lib/bug-reports";

// "Report a problem" on the desk. A small modal in the glossary's frame:
// what kind of thing, how bad, one line, and what happened — with what
// the desk already knows (scenario, incident reference, screen, version,
// browser, the tail of the log) shown so the tester can see what goes
// with it. Filed straight to the database; nothing leaves by email.

type Props = {
  open: boolean;
  onClose: () => void;
  context: BugContext;
};

const field =
  "w-full rounded-sm border border-(--color-border) bg-(--color-bg) px-2 py-1.5 font-mono text-[12px] text-(--color-text) placeholder:text-(--color-text-dim) focus:border-(--color-amber) focus:outline-none";
const label = "mt-3 block font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)";

export function BugReportDialog({ open, onClose, context }: Props) {
  const [category, setCategory] = useState<BugCategory>("broken");
  const [severity, setSeverity] = useState<BugSeverity>("minor");
  const [summary, setSummary] = useState("");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function send(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!summary.trim() || !detail.trim()) {
      setResult({ ok: false, text: "Add a one-line summary and what happened." });
      return;
    }
    setBusy(true);
    const r = await submitBugReport({
      category,
      severity,
      summary,
      detail,
      context: {
        ...context,
        page: typeof window !== "undefined" ? window.location.pathname : context.page,
        viewport: typeof window !== "undefined" ? `${window.innerWidth}×${window.innerHeight}` : context.viewport,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : context.userAgent,
      },
    });
    setBusy(false);
    if (r.ok) {
      setResult({ ok: true, text: "Filed. Thank you — it is on the list." });
      setSummary("");
      setDetail("");
    } else {
      setResult({ ok: false, text: r.error });
    }
  }

  const known = [
    ["Scenario", context.scenario],
    ["Incident", context.incidentRef],
    ["Screen", context.screen],
    ["Version", context.version],
  ].filter((row): row is [string, string] => !!row[1]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Report a problem"
      className="fixed inset-0 z-[3000] flex items-start justify-center overflow-y-auto bg-(--color-bg)/95 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form onSubmit={send} className="my-8 w-full max-w-xl px-6 py-6">
        <div className="rounded-sm border border-(--color-amber)/60 bg-(--color-surface) p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">Pre-alpha</div>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-(--color-text)">Report a problem</h1>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-(--color-text-muted)">
                Goes straight to the team with what the desk knows about this moment. Say what you did, what happened, and what you expected.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-(--color-border) px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim) hover:border-(--color-critical) hover:text-(--color-critical)"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="bug-category">What kind of thing</label>
              <select id="bug-category" className={field} value={category} onChange={(e) => setCategory(e.target.value as BugCategory)}>
                {BUG_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="bug-severity">How bad</label>
              <select id="bug-severity" className={field} value={severity} onChange={(e) => setSeverity(e.target.value as BugSeverity)}>
                {BUG_SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <label className={label} htmlFor="bug-summary">One line</label>
          <input id="bug-summary" className={field} value={summary} maxLength={SUMMARY_MAX} placeholder="What should we look at?" onChange={(e) => setSummary(e.target.value)} />

          <label className={label} htmlFor="bug-detail">What happened</label>
          <textarea id="bug-detail" className={field + " min-h-32"} value={detail} maxLength={DETAIL_MAX} placeholder="What you did, what happened, what you expected, and how to make it happen again…" onChange={(e) => setDetail(e.target.value)} />

          {known.length > 0 && (
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-sm border border-(--color-border-subtle) bg-(--color-bg) px-2 py-1.5 font-mono text-[10px] text-(--color-text-muted)">
              {known.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="uppercase tracking-widest text-(--color-text-dim)">{k}</dt>
                  <dd className="truncate">{v}</dd>
                </div>
              ))}
              {context.logTail && context.logTail.length > 0 && (
                <div className="contents">
                  <dt className="uppercase tracking-widest text-(--color-text-dim)">Log</dt>
                  <dd>last {context.logTail.length} lines go with it</dd>
                </div>
              )}
            </dl>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-sm border border-(--color-amber) bg-(--color-amber)/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/25 disabled:opacity-50"
            >
              {busy ? "Filing…" : "File report"}
            </button>
            <button type="button" onClick={onClose} className="font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim) hover:text-(--color-text)">
              {result?.ok ? "Done" : "Cancel"}
            </button>
            {result && (
              <span role="status" className={"font-mono text-[11px] " + (result.ok ? "text-(--color-ok)" : "text-(--color-critical)")}>
                {result.text}
              </span>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
