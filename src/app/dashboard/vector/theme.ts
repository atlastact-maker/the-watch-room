"use client";

// Light / dark for the VECTOR shell. Remembered per browser under the same
// key the prototype used, and stamped on <html> so pop-outs and portals
// that live outside the shell still pick it up. localStorage is the store
// of record; React subscribes to it rather than copying it into state.

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type VectorTheme = "light" | "dark";
const KEY = "vector-theme";
const EVENT = "vector-theme-change";

function read(): VectorTheme {
  try {
    return window.localStorage.getItem(KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, cb);
  };
}

export function useVectorTheme(): { theme: VectorTheme; toggle: () => void } {
  const theme = useSyncExternalStore(subscribe, read, () => "light" as VectorTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.cadTheme = theme;
    return () => {
      delete root.dataset.cadTheme;
    };
  }, [theme]);

  const toggle = useCallback(() => {
    const next = read() === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* best effort — the switch still applies for this page */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { theme, toggle };
}
