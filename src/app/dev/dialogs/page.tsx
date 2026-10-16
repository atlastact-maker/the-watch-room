"use client";

// Dialog harness: the desk's three windows against a plain desk, for
// looking at them and screenshotting them without a shift.
//
//   ?which=call|glossary|bug   which window (default call)
//   ?dark=1                    the desk's dark theme

import { useEffect, useSyncExternalStore } from "react";
import "../../dashboard/vector/vector.css";
import { IncomingCallModal } from "../../dashboard/components/incoming-call";
import { GlossaryOverlay } from "../../dashboard/components/glossary-overlay";
import { BugReportDialog } from "../../dashboard/components/bug-report-dialog";
import { SCENARIOS } from "@/lib/sim/scenarios";
import { STATIONS, getStationAppliances } from "@/lib/sim/data";
import type { StationWithAppliances } from "../../dashboard/page";

const noop = () => () => {};

export default function DialogsHarness() {
  // The query string, read on the client only, so the server render is
  // empty rather than mismatched.
  const search = useSyncExternalStore(noop, () => window.location.search, () => null);
  const q = new URLSearchParams(search ?? "");
  const which = q.get("which") ?? "call";
  const dark = q.get("dark") === "1";
  useEffect(() => {
    document.documentElement.dataset.cadTheme = dark ? "dark" : "light";
  }, [dark]);
  if (search === null) return null;

  const stations: StationWithAppliances[] = STATIONS.map((s) => ({ ...s, appliances: getStationAppliances(s.id) }));
  const scenario = SCENARIOS.find((s) => s.id === "17") ?? SCENARIOS[0];
  return (
    <div className="cad-application" style={{ position: "fixed", inset: 0, background: "var(--vec-bg)" }}>
      {which === "call" && <IncomingCallModal scenario={scenario} onAnswer={() => {}} onDecline={() => {}} />}
      {which === "glossary" && <GlossaryOverlay open onClose={() => {}} stations={stations} />}
      {which === "bug" && (
        <BugReportDialog
          open
          onClose={() => {}}
          context={{
            scenario: scenario.title,
            incidentRef: "26/289/0001",
            screen: "dispatch",
            version: "0.6.0",
            logTail: ["14:45:02 incident_opened Call received", "14:46:10 mobilised G50-P1 mobile to incident"],
          }}
        />
      )}
    </div>
  );
}
