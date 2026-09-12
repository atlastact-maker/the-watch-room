"use client";

import { useMemo, useSyncExternalStore } from "react";
import { SHIFT_SAVE_KEY } from "@/lib/sim/save";
import { menuPlayerState } from "@/lib/sim/menu-state";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("focus", callback);
  const timer = window.setInterval(callback, 60000);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("focus", callback); window.clearInterval(timer); };
}
function getSnapshot() {
  try { return JSON.stringify([localStorage.getItem(SHIFT_SAVE_KEY), localStorage.getItem("twr:last-shift:v1"), Math.floor(Date.now() / 60000) * 60000]); }
  catch { return "unavailable"; }
}
const serverSnapshot = () => null;

export function usePlayerRecord() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  return useMemo(() => {
    if (raw === null || raw === "unavailable") return { loaded: raw !== null, unavailable: raw === "unavailable", now: 0, save: null, last: null };
    const [save, last, now] = JSON.parse(raw) as [string | null, string | null, number];
    return { loaded: true, unavailable: false, now, ...menuPlayerState(save, last, now) };
  }, [raw]);
}
