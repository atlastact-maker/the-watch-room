"use client";

// What this browser knows about the player: a shift saved part-way through, the
// last debrief, and the career record the desk keeps locally between
// syncs. Read through useSyncExternalStore so the server render and the
// first client render agree, and re-read when another tab writes.

import { useMemo, useSyncExternalStore } from "react";
import { SHIFT_SAVE_KEY } from "@/lib/sim/save";
import { menuPlayerState } from "@/lib/sim/menu-state";
import { emptyStats, type CareerStats, type Grade } from "@/lib/sim/stats";

const CAREER_KEY = "twr:career-stats:v1";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("focus", callback);
  const timer = window.setInterval(callback, 60000);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("focus", callback); window.clearInterval(timer); };
}
function getSnapshot() {
  try { return JSON.stringify([localStorage.getItem(SHIFT_SAVE_KEY), localStorage.getItem("twr:last-shift:v1"), localStorage.getItem(CAREER_KEY), Math.floor(Date.now() / 60000) * 60000]); }
  catch { return "unavailable"; }
}
const serverSnapshot = () => null;

/** The local career record, tolerant of an older or partial shape. */
function parseCareer(raw: string | null): CareerStats | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<CareerStats> | null;
    if (!v || typeof v !== "object") return null;
    const base = emptyStats();
    const grades = { ...base.grades, ...(v.grades ?? {}) } as Record<Grade, number>;
    return { ...base, ...v, grades, byType: v.byType ?? {} };
  } catch {
    return null;
  }
}

export function usePlayerRecord() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  return useMemo(() => {
    if (raw === null || raw === "unavailable") return { loaded: raw !== null, unavailable: raw === "unavailable", now: 0, save: null, last: null, career: null as CareerStats | null };
    const [save, last, career, now] = JSON.parse(raw) as [string | null, string | null, string | null, number];
    return { loaded: true, unavailable: false, now, ...menuPlayerState(save, last, now), career: parseCareer(career) };
  }, [raw]);
}
