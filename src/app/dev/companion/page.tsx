"use client";

// Companion harness: the tablet's end against a desk harness open in
// another tab of this browser (/dev/mdt?s=12&unit=dca&pair=1), carried by
// a BroadcastChannel rather than Supabase Realtime.
//
//   ?code=DEVTESTA   the code to join (the desk harness shares as DEVTESTA)

import { useSyncExternalStore } from "react";
import { CompanionClient } from "../../mdt/companion-client";

const noop = () => () => {};

export default function CompanionHarness() {
  const code = useSyncExternalStore(noop, () => new URLSearchParams(window.location.search).get("code") ?? "DEVTESTA", () => "");
  if (!code) return null;
  return <CompanionClient initialCode={code} local />;
}
