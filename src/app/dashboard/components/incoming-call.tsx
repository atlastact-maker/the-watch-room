"use client";

// Incoming 999 call modal. When the operator picks a scenario from the
// header menu we hold it in `pendingCall` and raise this modal instead of
// opening the incident directly. Green phone accepts and starts the shift;
// red phone declines and the scenario is dropped.

import { useEffect, useState } from "react";
import type { Scenario } from "@/lib/sim/incident_types";

export function IncomingCallModal({
  scenario,
  onAnswer,
  onDecline,
}: {
  scenario: Scenario;
  onAnswer: () => void;
  onDecline: () => void;
}) {
  // Ring-time counter so the modal feels live.
  const [ringSec, setRingSec] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setRingSec((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Keyboard shortcuts — Enter / A answers, Esc / D declines.
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

  const severityLabel = {
    low: "Low severity",
    moderate: "Moderate severity",
    high: "High severity",
    major: "Major incident",
  }[scenario.severity];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <style>{`
        @keyframes ring-shake { 0%, 100% { transform: rotate(0deg); } 10%, 30%, 50%, 70%, 90% { transform: rotate(-12deg); } 20%, 40%, 60%, 80% { transform: rotate(12deg); } }
        @keyframes ring-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.7); } 50% { box-shadow: 0 0 0 16px rgba(52,211,153,0); } }
        .phone-shake { animation: ring-shake 1.2s ease-in-out infinite; }
        .phone-pulse { animation: ring-pulse 1.5s ease-out infinite; }
      `}</style>

      <div className="w-[min(560px,92vw)] overflow-hidden rounded-lg border border-(--color-amber)/60 bg-(--color-surface) shadow-2xl shadow-black/80">
        {/* Ringing strip */}
        <header className="flex items-center justify-between gap-3 border-b border-(--color-amber)/40 bg-(--color-amber)/10 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="dot-live size-2 rounded-full bg-(--color-critical)" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber)">
              Incoming 999 call
            </span>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-(--color-text-muted)">
            {fmtClock(ringSec)}
          </span>
        </header>

        {/* Caller info */}
        <div className="px-6 py-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
            Caller line
          </p>
          <p className="mt-1 text-sm italic text-(--color-text-muted)">“{scenario.trigger}”</p>

          <dl className="mt-5 grid grid-cols-[6rem_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
              Type
            </dt>
            <dd className="text-(--color-text)">
              {scenario.title}
              <span className="ml-2 rounded-sm border border-(--color-critical)/50 bg-(--color-critical)/10 px-1.5 py-0 font-mono text-[9px] uppercase tracking-widest text-(--color-critical)">
                {severityLabel}
              </span>
            </dd>

            <dt className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
              Location
            </dt>
            <dd className="text-(--color-text)">
              {scenario.location.address}
              <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                {scenario.location.postcode}
              </span>
            </dd>

            <dt className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
              Hazards
            </dt>
            <dd className="text-(--color-text)">
              {scenario.methane.H || "Not yet reported"}
            </dd>

            <dt className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
              Casualties
            </dt>
            <dd className="text-(--color-text)">
              {scenario.methane.N || "Unknown"}
            </dd>

            <dt className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
              Services
            </dt>
            <dd className="text-(--color-text)">
              {scenario.methane.emergencyServices}
            </dd>
          </dl>
        </div>

        {/* Phone buttons */}
        <div className="grid grid-cols-2 gap-0 border-t border-(--color-border-subtle) bg-(--color-bg)/40">
          <button
            type="button"
            onClick={onDecline}
            aria-label="Decline call"
            className="group flex flex-col items-center gap-2 border-r border-(--color-border-subtle) px-6 py-5 transition-colors hover:bg-(--color-critical)/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-(--color-critical)"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-(--color-critical) text-white shadow-lg shadow-(--color-critical)/40">
              <PhoneIcon decline />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-critical)">
              Decline
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
              (Esc)
            </span>
          </button>

          <button
            type="button"
            onClick={onAnswer}
            aria-label="Answer call"
            autoFocus
            className="group flex flex-col items-center gap-2 px-6 py-5 transition-colors hover:bg-(--color-ok)/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-(--color-ok)"
          >
            <span className="phone-pulse flex size-14 items-center justify-center rounded-full bg-(--color-ok) text-white shadow-lg shadow-(--color-ok)/40">
              <span className="phone-shake flex items-center justify-center">
                <PhoneIcon />
              </span>
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-ok)">
              Answer
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
              (Enter)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PhoneIcon({ decline = false }: { decline?: boolean }) {
  // Standard phone handset glyph. When declining we rotate it 135° so it
  // reads as "put the phone down" like the red button on an iOS call screen.
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: decline ? "rotate(135deg)" : "rotate(0deg)" }}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
