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

// "Report a problem" on the desk. A small window in the desk's own
// chrome: what kind of thing, how bad, one line, and what happened, with
// what the desk already knows (scenario, incident reference, screen,
// version, browser, the tail of the log) shown so the tester can see
// what goes with it. Filed straight to the database; nothing leaves by
// email.

type Props = {
  open: boolean;
  onClose: () => void;
  context: BugContext;
};

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
      setResult({ ok: false, text: "A summary and an account of what happened are both needed." });
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
      setResult({ ok: true, text: "Filed. Thank you; it is on the list." });
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
      className="vec-scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bug-report-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form onSubmit={send} className="vec-dialog narrow">
        <div className="vec-dialog-bar">
          <span id="bug-report-title">Pre-Alpha · Report a problem</span>
          <span className="spacer" />
          <button type="button" className="vec-dialog-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="vec-dialog-body">
          <p className="lead">Filed to the team with what the desk knows about this moment. State what you did, what happened, and what you expected instead.</p>

          <div className="grid2">
            <div>
              <label className="lbl" htmlFor="bug-category">Category</label>
              <select id="bug-category" value={category} onChange={(e) => setCategory(e.target.value as BugCategory)}>
                {BUG_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl" htmlFor="bug-severity">Severity</label>
              <select id="bug-severity" value={severity} onChange={(e) => setSeverity(e.target.value as BugSeverity)}>
                {BUG_SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="lbl" htmlFor="bug-summary">Summary</label>
            <input id="bug-summary" type="text" value={summary} maxLength={SUMMARY_MAX} placeholder="One line: what should be looked at?" onChange={(e) => setSummary(e.target.value)} />
          </div>

          <div>
            <label className="lbl" htmlFor="bug-detail">What happened</label>
            <textarea id="bug-detail" value={detail} maxLength={DETAIL_MAX} placeholder="What you did, what happened, what you expected, and how to make it happen again." onChange={(e) => setDetail(e.target.value)} />
          </div>

          {known.length > 0 && (
            <dl className="facts" aria-label="Attached automatically">
              {known.map(([k, v]) => (
                <div key={k} style={{ display: "contents" }}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              {context.logTail && context.logTail.length > 0 && (
                <div style={{ display: "contents" }}>
                  <dt>Log</dt>
                  <dd>Last {context.logTail.length} lines attached</dd>
                </div>
              )}
            </dl>
          )}

          <div className="actions">
            <button type="submit" className="vec-btn solid" disabled={busy}>{busy ? "Filing…" : "File report"}</button>
            <button type="button" className="vec-btn" onClick={onClose}>{result?.ok ? "Done" : "Cancel"}</button>
            {result && (
              <span role="status" className={`status ${result.ok ? "go" : "stop"}`}>{result.text}</span>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
