"use client";

// Dialog harness: the desk's three windows against a plain desk, for
// looking at them and screenshotting them without a shift.
//
//   ?which=call|glossary|bug|alerts   which window (default call); alerts shows the
//                                     menu-bar alerts strip with the alert cards over it
//   ?dark=1                    the desk's dark theme

import { useEffect, useSyncExternalStore } from "react";
import "../../dashboard/vector/vector.css";
import { IncomingCallModal } from "../../dashboard/components/incoming-call";
import { GlossaryOverlay } from "../../dashboard/components/glossary-overlay";
import { BugReportDialog } from "../../dashboard/components/bug-report-dialog";
import { AlertsStrip } from "../../dashboard/vector/chrome";
import { DeskAlerts, raiseAlert } from "../../dashboard/vector/desk-alerts";
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
  // Two cards on the stack, so the strip and the cards can be seen together.
  useEffect(() => {
    if (which !== "alerts") return;
    const t = window.setTimeout(() => {
      raiseAlert({ tone: "stop", title: "New 999 call", body: "House Fire, Persons Reported — Wythenshawe", assertive: true, ttlMs: 60_000 });
      raiseAlert({ tone: "warn", title: "Patient deteriorating", body: "Child (5) — back bedroom · NEWS2 rising", ttlMs: 60_000 });
    }, 300);
    return () => window.clearTimeout(t);
  }, [which]);
  if (search === null) return null;

  const stations: StationWithAppliances[] = STATIONS.map((s) => ({ ...s, appliances: getStationAppliances(s.id) }));
  const scenario = SCENARIOS.find((s) => s.id === "17") ?? SCENARIOS[0];
  return (
    <div className="cad-application" style={{ position: "fixed", inset: 0, background: "var(--vec-bg)" }}>
      {which === "call" && <IncomingCallModal scenario={scenario} onAnswer={() => {}} onDecline={() => {}} />}
      {which === "glossary" && <GlossaryOverlay open onClose={() => {}} stations={stations} />}
      {which === "alerts" && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ height: 40, background: "var(--vec-bar)", color: "var(--vec-bar-text)", display: "flex", alignItems: "center", padding: "0 12px", fontSize: 12 }}>VECTOR · menu bar</div>
          <AlertsStrip waiting={1} pastStandard={0} unfilled={2} onViewCalls={() => {}} onViewIncidents={() => {}} onTestCall={() => {}} />
          <div style={{ flex: 1 }} />
          <DeskAlerts />
        </div>
      )}
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
