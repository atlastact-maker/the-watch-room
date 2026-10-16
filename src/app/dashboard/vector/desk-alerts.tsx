"use client";

// Alerts: the desk's second and third channels, beside sound. Anything on
// the desk can raise one; this component shows it as a card in the top
// right and reads it into a live region, each under its own preference,
// so an operator who cannot hear the tone sees the card and an operator
// who cannot see the card hears the screen reader.

import { useEffect, useRef, useState } from "react";
import { useDeskPrefs } from "@/lib/desk-prefs";

export type AlertTone = "info" | "go" | "warn" | "stop";
export type DeskAlert = {
  id: string;
  tone: AlertTone;
  title: string;
  body?: string;
  /** Screen readers interrupt for this one (a 999 call), otherwise it waits its turn. */
  assertive?: boolean;
  /** How long the card stays, in milliseconds. Default eight seconds. */
  ttlMs?: number;
  at: number;
};

const EVENT = "twr:desk-alert";
let seq = 0;

/** Raise an alert from anywhere on the desk. Safe to call during render-adjacent effects and in sim ticks. */
export function raiseAlert(alert: Omit<DeskAlert, "id" | "at"> & { id?: string }) {
  if (typeof window === "undefined") return;
  const detail: DeskAlert = { ...alert, id: alert.id ?? `alert:${Date.now()}:${seq++}`, at: Date.now() };
  window.dispatchEvent(new CustomEvent<DeskAlert>(EVENT, { detail }));
}

const TONE_WORD: Record<AlertTone, string> = { info: "", go: "", warn: "Attention. ", stop: "Urgent. " };

export function DeskAlerts() {
  const [prefs] = useDeskPrefs();
  const [alerts, setAlerts] = useState<DeskAlert[]>([]);
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");
  const timers = useRef(new Map<string, number>());

  useEffect(() => {
    const onAlert = (e: Event) => {
      const a = (e as CustomEvent<DeskAlert>).detail;
      setAlerts((list) => [...list.filter((x) => x.id !== a.id), a].slice(-4));
      const ttl = a.ttlMs ?? 8000;
      const t = window.setTimeout(() => {
        setAlerts((list) => list.filter((x) => x.id !== a.id));
        timers.current.delete(a.id);
      }, ttl);
      const old = timers.current.get(a.id);
      if (old) window.clearTimeout(old);
      timers.current.set(a.id, t);
      // The live region: set, then clear, so the same message twice is read twice.
      const text = `${TONE_WORD[a.tone]}${a.title}${a.body ? `. ${a.body}` : ""}`;
      if (a.assertive) { setAssertive(""); window.setTimeout(() => setAssertive(text), 30); }
      else { setPolite(""); window.setTimeout(() => setPolite(text), 30); }
    };
    window.addEventListener(EVENT, onAlert);
    const held = timers.current;
    return () => {
      window.removeEventListener(EVENT, onAlert);
      for (const t of held.values()) window.clearTimeout(t);
      held.clear();
    };
  }, []);

  const dismiss = (id: string) => {
    setAlerts((list) => list.filter((x) => x.id !== id));
    const t = timers.current.get(id);
    if (t) { window.clearTimeout(t); timers.current.delete(id); }
  };

  return (
    <>
      {prefs.visualCues && alerts.length > 0 && (
        <div className="vec-alert-stack" role="region" aria-label="Alerts">
          {alerts.map((a) => (
            <div key={a.id} className={`vec-alert ${a.tone}`}>
              <div>
                <b>{a.title}</b>
                {a.body && <span>{a.body}</span>}
                <small>{new Date(a.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</small>
              </div>
              <button type="button" onClick={() => dismiss(a.id)} aria-label={`Dismiss: ${a.title}`}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div className="vec-sr" aria-live="polite" aria-atomic="true">{prefs.announce ? polite : ""}</div>
      <div className="vec-sr" aria-live="assertive" aria-atomic="true">{prefs.announce ? assertive : ""}</div>
    </>
  );
}
