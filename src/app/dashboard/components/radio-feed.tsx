"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LogEntry } from "@/lib/sim/incident_types";

/**
 * Radio comms feed — Airwave-style textual channel view.
 *
 * Shows a running transcript of radio traffic for the active incident,
 * synthesised from the existing SITREP log + task events. Three virtual
 * talk-groups (TGs) are modelled:
 *
 *   • TG · Main       — control ↔ crews, mobilising / status checks
 *   • TG · Command    — IC ↔ control, tactical mode, make-pumps, SITREPs
 *   • TG · Ops        — between crews on scene (BA, hose, kit)
 *
 * The operator is "Control". Each message reads like real UK radio
 * protocol: "[Callsign] from [Callsign], [message], over."
 *
 * Purely presentational — the transcript is derived from `log` on every
 * render with zero side effects.
 */

type TalkGroup = "main" | "command" | "ops";

const TG_LABEL: Record<TalkGroup, string> = {
  main: "TG · MAIN SCHEME",
  command: "TG · COMMAND",
  ops: "TG · OPS",
};

const TG_TONE: Record<TalkGroup, string> = {
  main: "text-(--color-amber)",
  command: "text-(--color-critical)",
  ops: "text-(--color-info)",
};

type RadioMessage = {
  id: string;
  ts: number;
  tg: TalkGroup;
  from: string;
  to: string;
  text: string;
};

export function RadioFeed({
  log,
  collapsed,
  onToggleCollapsed,
}: {
  log: LogEntry[];
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const messages = useMemo(() => synthesiseRadio(log), [log]);
  const [filter, setFilter] = useState<TalkGroup | "all">("all");
  const filtered = filter === "all" ? messages : messages.filter((m) => m.tg === filter);
  const latest = filtered.slice(-40).reverse();

  // Audible "click" suggestion — a low-intensity pulse on new traffic.
  const [justPulsed, setJustPulsed] = useState(false);
  const lastIdRef = useRef<string | null>(null);
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    if (lastIdRef.current === last.id) return;
    lastIdRef.current = last.id;
    setJustPulsed(true);
    const id = setTimeout(() => setJustPulsed(false), 500);
    return () => clearTimeout(id);
  }, [messages]);

  if (collapsed) {
    return (
      <footer className="flex items-center justify-between bg-(--color-surface-raised) px-4 py-1">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
          <span className={"dot-live size-1.5 rounded-full " + (justPulsed ? "bg-(--color-critical)" : "bg-(--color-amber)")} />
          <span>Radio feed</span>
          <span className="text-(--color-text-dim)">· {messages.length} calls</span>
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="rounded-sm border border-(--color-border) px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:border-(--color-amber-dim) hover:text-(--color-amber)"
        >
          Expand
        </button>
      </footer>
    );
  }

  return (
    <footer className="flex h-full min-h-0 flex-col bg-(--color-surface-raised)">
      <header className="flex items-center justify-between border-b border-(--color-border-subtle) px-4 py-1">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
          <span
            className={
              "dot-live size-1.5 rounded-full " +
              (justPulsed ? "bg-(--color-critical)" : "bg-(--color-amber)")
            }
          />
          <span>Radio feed</span>
          <span className="text-(--color-text-dim)">· {messages.length} calls</span>
        </div>
        <div className="flex items-center gap-1">
          {(["all", "main", "command", "ops"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                "rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest " +
                (f === filter
                  ? "border-(--color-amber) bg-(--color-amber)/10 text-(--color-amber)"
                  : "border-(--color-border) text-(--color-text-dim) hover:border-(--color-amber-dim)")
              }
            >
              {f === "all" ? "All" : TG_LABEL[f].split(" · ")[1]}
            </button>
          ))}
          {onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="ml-2 rounded-sm border border-(--color-border) px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:border-(--color-amber-dim) hover:text-(--color-amber)"
              title="Collapse"
            >
              —
            </button>
          )}
        </div>
      </header>

      <ol className="flex-1 space-y-0.5 overflow-y-auto px-4 py-2 font-mono text-[11px] leading-snug">
        {latest.length === 0 && (
          <li className="text-(--color-text-dim)">Channel quiet.</li>
        )}
        {latest.map((m) => (
          <li key={m.id} className="flex gap-3">
            <span className="shrink-0 text-[10px] uppercase tracking-widest text-(--color-text-dim)">
              {fmtTime(m.ts)}
            </span>
            <span className={"shrink-0 text-[9px] uppercase tracking-widest " + TG_TONE[m.tg]}>
              {TG_LABEL[m.tg]}
            </span>
            <span className="text-(--color-text)">
              <span className="text-(--color-text-muted)">
                &#9658; {m.from} → {m.to}:
              </span>{" "}
              &ldquo;{m.text}&rdquo;
            </span>
          </li>
        ))}
      </ol>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Log → radio-message synthesis
// ---------------------------------------------------------------------------

function synthesiseRadio(log: LogEntry[]): RadioMessage[] {
  const out: RadioMessage[] = [];
  for (const e of log) {
    const msgs = radioFor(e);
    for (const m of msgs) out.push(m);
  }
  return out;
}

function radioFor(e: LogEntry): RadioMessage[] {
  const base = (tg: TalkGroup, from: string, to: string, text: string): RadioMessage => ({
    id: `r:${e.id}:${from}->${to}`,
    ts: e.timestamp,
    tg,
    from,
    to,
    text,
  });

  // Pull a callsign out of the message if present — most log entries
  // lead with the callsign ("G50-P1 — ...").
  const callsign = extractCallsign(e.message) ?? "All units";

  switch (e.kind) {
    case "incident_opened":
      return [
        base(
          "main",
          "Control",
          "All units",
          `Standby, incident opening — ${stripCallsignPrefix(e.message)}, over.`,
        ),
      ];
    case "mobilised":
      return [
        base("main", "Control", callsign, `${callsign} from Control, mobilise to incident, acknowledge over.`),
        base("main", callsign, "Control", `${callsign}, received, mobile over.`),
      ];
    case "in_attendance":
      return [
        base("main", callsign, "Control", `${callsign}, Status 2, in attendance over.`),
      ];
    case "at_hospital":
      return [
        base("main", callsign, "Control", `${callsign}, Status 5, at hospital offloading over.`),
      ];
    case "offload_complete":
      return [
        base("main", callsign, "Control", `${callsign}, offload complete, available Status 6 over.`),
      ];
    case "returning":
      return [
        base("main", callsign, "Control", `${callsign}, Status 4, returning to station over.`),
      ];
    case "back_at_station":
      return [
        base("main", callsign, "Control", `${callsign}, Status 7, at station over.`),
      ];
    case "refuel_complete":
      return [
        base("main", callsign, "Control", `${callsign}, refuelling complete, back on the run over.`),
      ];
    case "welfare_break":
      return [
        base("ops", callsign, "Control", `${callsign}, standing down for welfare, 15 minutes over.`),
      ];
    case "welfare_complete":
      return [
        base("ops", callsign, "Control", `${callsign}, welfare complete, resuming duties over.`),
      ];
    case "defect":
      return [
        base("main", callsign, "Control", `${callsign}, priority message — ${stripCallsignPrefix(e.message)} over.`),
      ];
    case "tactical_mode":
      return [
        base(
          "command",
          callsign !== "All units" ? callsign : "IC",
          "Control",
          `IC declaring ${stripCallsignPrefix(e.message)}, over.`,
        ),
        base("command", "Control", "All units", `All units, ${stripCallsignPrefix(e.message)}, acknowledge over.`),
      ];
    case "make_pumps":
      return [
        base("command", callsign, "Control", `${callsign}, priority — ${stripCallsignPrefix(e.message)} over.`),
      ];
    case "sector_assigned":
      return [
        base("command", "IC", callsign, `${callsign} from IC, ${stripCallsignPrefix(e.message)} over.`),
      ];
    case "commander_assigned":
      return [
        base("command", "Control", "All units", `Scene command assigned — ${stripCallsignPrefix(e.message)}, over.`),
      ];
    case "hazard_confirmed":
      return [
        base("command", "IC", "Control", `IC to Control, ${stripCallsignPrefix(e.message)}, over.`),
      ];
    case "casualty_found":
      return [
        base("ops", callsign !== "All units" ? callsign : "BA", "IC", stripCallsignPrefix(e.message) + ", over."),
      ];
    case "casualty_deteriorated":
    case "casualty_expectant":
      return [
        base(
          "ops",
          "Ambulance",
          "IC",
          stripCallsignPrefix(e.message) + ", over.",
        ),
      ];
    case "casualty_treatment_started":
    case "casualty_treatment_ended":
      return [
        base("ops", callsign, "Control", stripCallsignPrefix(e.message) + ", over."),
      ];
    case "ba_committed":
      return [
        base("ops", callsign, "IC", stripCallsignPrefix(e.message) + ", over."),
      ];
    case "ba_withdrawn":
      return [
        base("ops", callsign, "IC", stripCallsignPrefix(e.message) + ", over."),
      ];
    case "task_started":
    case "task_completed":
      return [
        base("ops", callsign, "IC", stripCallsignPrefix(e.message) + ", over."),
      ];
    case "hydrant_connected":
      return [
        base("ops", callsign, "Control", stripCallsignPrefix(e.message) + ", over."),
      ];
    case "relay_connected":
      return [
        base("ops", callsign, "IC", stripCallsignPrefix(e.message) + ", over."),
      ];
    case "kit_deployed":
      return [
        base("ops", callsign, "IC", stripCallsignPrefix(e.message) + ", over."),
      ];
    case "hazard_mitigated":
      return [
        base("ops", callsign, "IC", stripCallsignPrefix(e.message) + ", over."),
      ];
    case "fire_stage":
      return [
        base("command", "IC", "Control", stripCallsignPrefix(e.message) + ", over."),
      ];
    case "setback":
      return [
        base("ops", callsign !== "All units" ? callsign : "IC", "Control", "Priority — " + stripCallsignPrefix(e.message) + ", over."),
      ];
    case "resolved":
      return [
        base("command", "IC", "Control", `Stop message — ${stripCallsignPrefix(e.message)} over.`),
      ];
    case "annotation":
      return [
        base("main", "Control", callsign, stripCallsignPrefix(e.message) + ", over."),
      ];
  }
}

function extractCallsign(msg: string): string | null {
  // Match the very first token if it looks like a callsign (letters,
  // digits, dashes, spaces for HELIMED 72, etc.).
  const m = msg.match(/^([A-Z][A-Z0-9 \-]{1,14})(?:[\s·—-])/);
  return m ? m[1].trim() : null;
}

function stripCallsignPrefix(msg: string): string {
  return msg.replace(/^[A-Z][A-Z0-9 \-]{1,14}[\s·—-]+/, "");
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}
