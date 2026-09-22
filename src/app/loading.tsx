"use client";

import { useEffect, useState } from "react";

// Streams out ahead of any page that is still waiting on its gate — the
// login check, the role lookup, the station build — so the browser has
// something on screen other than a blank tab. The page replaces it in
// place when it is ready.
//
// The line underneath the spinner is control-room business, a different
// one each time and turning over while you wait. The first one is fixed
// so the server and the browser agree on the first paint; the rest are
// drawn at random once the page is live.
const PHRASES = [
  "Booking on",
  "Raising the incident log",
  "Reading the handover",
  "Checking the PDA",
  "Testing the alerters",
  "Waking the MDTs",
  "Tuning to talkgroup one",
  "Polling the radio",
  "Ringing round the stations",
  "Counting the appliances",
  "Checking the hydrant book",
  "Loading the gazetteer",
  "Syncing the clock",
  "Lighting the status board",
  "Pulling the shift pattern",
  "Opening the ANPR feed",
  "Warming the printers",
  "Filling the tea urn",
  "Finding the good headset",
  "Signing for the keys",
  "Clearing the overnight tickets",
  "Checking the weather",
  "Walking the patch",
  "Reading the standing orders",
  "Testing the 999 lines",
  "Plotting the hospitals",
  "Charging the pagers",
  "Rolling the call stack",
  "Wiping the whiteboard",
  "Checking who is on the run",
  "Setting the clocks to the second",
  "Marking up the map",
  "Finding a pen that works",
  "Turning the lights on in the watch room",
];

export default function Loading() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const next = () =>
      setIndex((i) => {
        let n = Math.floor(Math.random() * PHRASES.length);
        if (n === i) n = (n + 1) % PHRASES.length;
        return n;
      });
    const first = window.setTimeout(next, 500);
    const id = window.setInterval(next, 2200);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "#0b141c",
        color: "#9fb3c3",
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        fontSize: 12,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
      }}
    >
      <div style={{ display: "grid", gap: 10, justifyItems: "center" }}>
        <div
          aria-hidden="true"
          style={{
            width: 28,
            height: 28,
            border: "2px solid #23384a",
            borderTopColor: "#4aa3df",
            borderRadius: "50%",
            animation: "twr-spin 0.9s linear infinite",
          }}
        />
        <span key={index} style={{ animation: "twr-fade 0.4s ease-out" }}>
          {PHRASES[index]}
        </span>
      </div>
      <style>{`@keyframes twr-spin { to { transform: rotate(360deg); } } @keyframes twr-fade { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}
