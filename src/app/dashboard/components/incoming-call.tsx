"use client";

// Incoming 999 call. When a scenario is triggered the desk holds it in
// `pendingCall` and raises this window instead of opening the incident
// directly. Answer accepts and starts the job; Decline drops it. Drawn as
// a window of the CAD, in the desk's own tokens.

import { useEffect, useState } from "react";
import { CHANNEL_LABEL, channelOf, type Scenario } from "@/lib/sim/incident_types";

const SEVERITY_LABEL: Record<Scenario["severity"], string> = {
  low: "Low severity",
  moderate: "Moderate severity",
  high: "High severity",
  major: "Major incident",
};

export function IncomingCallModal({
  scenario,
  onAnswer,
  onDecline,
}: {
  scenario: Scenario;
  onAnswer: () => void;
  onDecline: () => void;
}) {
  // Ring-time counter so the window reads as live.
  const [ringSec, setRingSec] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setRingSec((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Keyboard: Enter or A answers, Esc or D declines.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        onAnswer();
      } else if (e.key === "Escape" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        onDecline();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAnswer, onDecline]);

  return (
    <div className="vec-scrim center top" role="dialog" aria-modal="true" aria-labelledby="incoming-call-title" aria-describedby="incoming-call-type">
      <div className="vec-dialog narrow vec-call">
        <div className="vec-dialog-bar">
          <span className="dot" aria-hidden="true" />
          <span id="incoming-call-title">Incoming {CHANNEL_LABEL[channelOf(scenario)]} call</span>
          <span className="spacer" />
          <span className="meta">Ringing {fmtClock(ringSec)}</span>
        </div>
        <div className="vec-dialog-body">
          <div>
            <span className="lbl">Caller line</span>
            <p className="quote">“{scenario.trigger}”</p>
          </div>
          <dl className="facts">
            <dt>Type</dt>
            <dd id="incoming-call-type">
              {scenario.title}
              <span className={`sev ${scenario.severity}`}>{SEVERITY_LABEL[scenario.severity]}</span>
            </dd>
            <dt>Location</dt>
            <dd>
              {scenario.location.address}
              <span className="pc">{scenario.location.postcode}</span>
            </dd>
            <dt>Hazards</dt>
            <dd>{scenario.methane.H || "Not yet reported"}</dd>
            <dt>Casualties</dt>
            <dd>{scenario.methane.N || "Unknown"}</dd>
            <dt>Services</dt>
            <dd>{scenario.methane.emergencyServices}</dd>
          </dl>
          <div className="buttons">
            <button type="button" className="vec-btn stop" onClick={onDecline} aria-label="Decline call">
              Decline
              <small>Esc or D</small>
            </button>
            <button type="button" className="vec-btn go" onClick={onAnswer} aria-label="Answer call" autoFocus>
              Answer
              <small>Enter or A</small>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
