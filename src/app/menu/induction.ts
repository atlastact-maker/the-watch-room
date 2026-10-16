"use client";

// The operator induction: the steps a new tester completes before their
// first shift. Two are read from the account (callsign, Discord handle),
// one from the service record (the first shift); the two the site cannot
// see for itself (joining the tester channel, reading the briefing) are
// ticked here, in this browser, when the link is followed or the page is
// opened. Dismissal is remembered the same way.

import { useSyncExternalStore } from "react";

export type InductionFlags = { joined?: boolean; briefing?: boolean; dismissed?: boolean };

const KEY = "twr:induction:v1";
const EVENT = "twr:induction";

function read(): string {
  try { return localStorage.getItem(KEY) ?? ""; } catch { return ""; }
}
function parse(raw: string): InductionFlags {
  if (!raw) return {};
  try { const v = JSON.parse(raw) as InductionFlags | null; return v && typeof v === "object" ? v : {}; } catch { return {}; }
}

export function markInduction(patch: InductionFlags): void {
  if (typeof window === "undefined") return;
  const next = { ...parse(read()), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* no storage: the tick lasts the page */ }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(EVENT, callback); };
}
const serverSnapshot = () => "";

export function useInduction(): InductionFlags {
  return parse(useSyncExternalStore(subscribe, read, serverSnapshot));
}
