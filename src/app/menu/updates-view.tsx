"use client";

// Release notes and feedback: what changed in recent builds, and the
// reporting form that files a report to the team with the build attached.

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CHANGELOG, LATEST, formatEntryDate } from "@/lib/changelog";
import { submitBugReport } from "@/app/actions/bug-report";
import { BUG_CATEGORIES, BUG_SEVERITIES, isBugCategory, isBugSeverity } from "@/lib/bug-reports";
import { Icon } from "./icons";
import { COMMUNITY } from "./menu-types";
import styles from "./watch-menu.module.css";

const INCOMPLETE = "A summary and details are required.";

function Feedback({ userId }: { userId: string }) {
  const key = `twr:feedback-draft:${userId}`;
  const form = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Drafts are retained in this browser until submitted.");
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved && form.current) for (const name of ["category", "severity", "summary", "details"]) {
        const field = form.current.elements.namedItem(name) as HTMLInputElement | null;
        if (field && typeof saved[name] === "string") field.value = saved[name];
      }
    } catch { /* An unreadable draft leaves the form empty. */ }
  }, [key]);
  function draft() {
    const values = new FormData(form.current!);
    return { category: String(values.get("category")), severity: String(values.get("severity")), summary: String(values.get("summary") || "").trim(), details: String(values.get("details") || "").trim() };
  }
  function saveDraft() {
    try { localStorage.setItem(key, JSON.stringify(draft())); } catch { /* No storage: the draft lives in the form until it is submitted. */ }
  }
  function valid() { const data = draft(); return !!data.summary && !!data.details && form.current!.reportValidity(); }
  function content() { const data = draft(); return `The Watch Room — ${data.category}\n\n${data.summary}\n\n${data.details}\n\nBuild: ${LATEST.version}`; }
  async function file(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!valid()) { setMessage(INCOMPLETE); return; }
    const data = draft();
    setBusy(true);
    const r = await submitBugReport({
      category: isBugCategory(data.category) ? data.category : "broken",
      severity: isBugSeverity(data.severity) ? data.severity : "minor",
      summary: data.summary,
      detail: data.details,
      context: { page: "/menu", version: LATEST.version, viewport: `${window.innerWidth}×${window.innerHeight}`, userAgent: navigator.userAgent },
    });
    setBusy(false);
    if (r.ok) {
      form.current?.reset();
      try { localStorage.removeItem(key); } catch { /* nothing to clear */ }
      setMessage("Filed. The report is with the development team.");
    } else {
      setMessage(r.error);
    }
  }
  async function copy() {
    if (!valid()) { setMessage(INCOMPLETE); return; }
    try { await navigator.clipboard.writeText(content()); setMessage("Copied to clipboard. Paste into the tester channel if the report needs discussion."); }
    catch { setMessage("Clipboard unavailable. Select and copy the text manually."); }
  }
  return (
    <section className={styles.panel}>
      <p className={styles.eyebrow}>Reporting</p>
      <h2 className={styles.panelTitle}>Submit a report</h2>
      <p className={styles.muted}>Defects, realism observations and suggestions. Reports are filed to the development team with the build version attached.</p>
      <form ref={form} className={styles.feedback} onInput={saveDraft} onSubmit={file}>
        <label htmlFor="feedback-category">Report type</label>
        <select id="feedback-category" name="category">{BUG_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
        <label htmlFor="feedback-severity">Severity</label>
        <select id="feedback-severity" name="severity" defaultValue="minor">{BUG_SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
        <label htmlFor="feedback-summary">Summary</label>
        <input id="feedback-summary" name="summary" required maxLength={140} placeholder="One line describing the issue" />
        <label htmlFor="feedback-details">Details</label>
        <textarea id="feedback-details" name="details" required maxLength={4000} placeholder="What happened, what was expected, and the steps to reproduce it." />
        <div className={styles.actions}>
          <button className={styles.primary} type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit report"} <Icon.arrow /></button>
          <button className={styles.button} type="button" onClick={copy}>Copy to clipboard</button>
        </div>
        <p role="status" className={styles.muted}>{message}</p>
        <a href={COMMUNITY} target="_blank" rel="noreferrer" className={styles.inlineLink}>Tester channel on Discord <Icon.external /></a>
      </form>
    </section>
  );
}

export function UpdatesView({ userId }: { userId: string }) {
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Release notes and feedback</p>
          <h1 className={styles.pageTitle}>Release notes and reporting.</h1>
          <p className={styles.lede}>Changes in the current and recent builds, and the reporting form for defects and observations. The pre-alpha is run with advisors who have done the job for real; an observation on realism carries the same weight as a defect.</p>
        </div>
      </header>
      <div className={styles.pageGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Release notes</h2>
            <Link href="/changelog">All releases <Icon.arrow /></Link>
          </div>
          {CHANGELOG.slice(0, 3).map((entry) => (
            <article className={styles.update} key={`${entry.version}-${entry.date}`}>
              <p className={styles.eyebrow}>Build {entry.version} · {formatEntryDate(entry.date)}</p>
              <h3>{entry.title}</h3>
              <ul className={styles.bullets}>{entry.items.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </section>
        <Feedback userId={userId} />
      </div>
    </>
  );
}
