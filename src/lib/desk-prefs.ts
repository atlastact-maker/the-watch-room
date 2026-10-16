// Operator preferences for how the desk gets their attention and how
// much it explains itself. Device-local, like the audio mute. Audio stays
// where it is (lib/audio/sim-audio); these are the other two channels and
// the inline help, so an operator who needs sound, sight or a screen
// reader can have whichever they need.

import { useSyncExternalStore } from "react";

export type DeskPrefs = {
  /** Toast cards for events: a new call, a unit on scene, a patient change. */
  visualCues: boolean;
  /** The same events read into a screen-reader live region. */
  announce: boolean;
  /** Explanations shown under every option on the treatment and tasking screens, not only on hover. */
  inlineHelp: boolean;
};

export const DESK_PREFS_KEY = "twr:desk-prefs:v1";
const EVENT = "twr:desk-prefs";
const DEFAULTS: DeskPrefs = { visualCues: true, announce: true, inlineHelp: false };

function read(): string {
  try { return localStorage.getItem(DESK_PREFS_KEY) ?? ""; } catch { return ""; }
}
function parse(raw: string): DeskPrefs {
  if (!raw) return DEFAULTS;
  try {
    const v = JSON.parse(raw) as Partial<DeskPrefs> | null;
    return { ...DEFAULTS, ...(v && typeof v === "object" ? v : {}) };
  } catch {
    return DEFAULTS;
  }
}

export function loadDeskPrefs(): DeskPrefs {
  if (typeof window === "undefined") return DEFAULTS;
  return parse(read());
}

export function saveDeskPrefs(patch: Partial<DeskPrefs>): DeskPrefs {
  const next = { ...loadDeskPrefs(), ...patch };
  try { localStorage.setItem(DESK_PREFS_KEY, JSON.stringify(next)); } catch { /* no storage: the change lasts the page */ }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
  return next;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(EVENT, callback); };
}
const serverSnapshot = () => "";

/** The preferences, live: any tab or panel that changes them re-renders every reader. */
export function useDeskPrefs(): [DeskPrefs, (patch: Partial<DeskPrefs>) => void] {
  const raw = useSyncExternalStore(subscribe, read, serverSnapshot);
  return [parse(raw), saveDeskPrefs];
}
