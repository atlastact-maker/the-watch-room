"use client";

// The incident log as a VECTOR tile — the shift's running record,
// timestamped, typed by event, never reordered. Operator entries go in
// from the LOG> line at the bottom.

import { useEffect, useMemo, useRef, useState } from "react";
import type { LogEntry } from "@/lib/sim/incident_types";
import { VectorTile, type TileLayout } from "./tile";
import { hhmmss } from "./model";

function classify(kind: LogEntry["kind"]): { code: string; tone: string } {
  switch (kind) {
    case "incident_opened": return { code: "INC", tone: "var(--vec-stop)" };
    case "mobilised": return { code: "MOB", tone: "var(--vec-warn)" };
    case "in_attendance": return { code: "IA", tone: "var(--vec-go)" };
    case "at_hospital": return { code: "HOSP", tone: "var(--vec-work)" };
    case "offload_complete": return { code: "H/O", tone: "var(--vec-work)" };
    case "casualty_found": case "casualty_deteriorated": case "casualty_expectant": case "casualty_treatment_started": case "casualty_treatment_ended": return { code: "CAS", tone: "var(--vec-work)" };
    case "hazard_confirmed": case "defect": return { code: "HAZ", tone: "var(--vec-stop)" };
    case "hazard_mitigated": return { code: "HAZ", tone: "var(--vec-go)" };
    case "tactical_mode": case "make_pumps": case "commander_assigned": case "sector_assigned": return { code: "CMD", tone: "var(--vec-stop)" };
    case "resolved": return { code: "STOP", tone: "var(--vec-go)" };
    case "returning": case "back_at_station": case "refuel_complete": case "welfare_break": case "welfare_complete": return { code: "AVL", tone: "var(--vec-text-muted)" };
    case "ba_committed": case "ba_withdrawn": return { code: "BA", tone: "var(--vec-stop)" };
    case "task_started": return { code: "TSK", tone: "var(--vec-warn)" };
    case "task_completed": return { code: "TSK", tone: "var(--vec-go)" };
    case "fire_stage": return { code: "FIRE", tone: "var(--vec-stop)" };
    case "setback": return { code: "SET", tone: "var(--vec-stop)" };
    case "annotation": return { code: "OP", tone: "var(--vec-work)" };
    default: return { code: "LOG", tone: "var(--vec-text-muted)" };
  }
}

export function LogTile({ layout, area, log, reference, onClose, onEntry, popped, onPopOut, onDock }: { layout: TileLayout; area: { w: number; h: number }; log: LogEntry[]; reference: string; onClose: () => void; onEntry: (text: string) => void; popped?: boolean; onPopOut?: () => void; onDock?: () => void }) {
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? log.filter((e) => e.message.toLowerCase().includes(q) || classify(e.kind).code.toLowerCase().includes(q)) : log;
  }, [log, filter]);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rows.length]);
  return (
    <VectorTile popped={popped} onPopOut={onPopOut} onDock={onDock} id="log" title="Incident log" count={String(log.length)} layout={layout} area={area} onClose={onClose} minWidth={280} minHeight={180}>
      <div className="vec-tile-sub">
        <strong>Shift log</strong>
        <span>{reference || "All incidents"}</span>
      </div>
      <div style={{ padding: "4px 8px", borderBottom: "1px solid var(--vec-border-subtle)" }}>
        <input className="vec-btn" style={{ width: "100%", textAlign: "left", fontWeight: 400 }} placeholder="Filter — callsign, code, text" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>
      <div ref={scroller} style={{ flex: 1, minHeight: 0, overflow: "auto", fontFamily: "var(--vec-mono)", fontSize: 10 }}>
        {rows.length === 0 ? (
          <div className="vec-tile-empty">{log.length === 0 ? "No traffic yet" : "Nothing matches that filter"}</div>
        ) : (
          rows.map((e) => {
            const c = classify(e.kind);
            return (
              <div key={e.id} style={{ display: "grid", gridTemplateColumns: "58px 36px 1fr", gap: 6, padding: "4px 8px", borderBottom: "1px solid var(--vec-border-subtle)" }}>
                <span style={{ color: "var(--vec-text-muted)" }}>{hhmmss(e.timestamp)}</span>
                <span style={{ color: c.tone, fontWeight: 700 }}>{c.code}</span>
                <span style={{ fontFamily: "var(--vec-sans)", fontSize: 11 }}>{e.message}</span>
              </div>
            );
          })
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderTop: "1px solid var(--vec-border)", fontFamily: "var(--vec-mono)", fontSize: 10 }}>
        <span style={{ color: "var(--vec-text-muted)" }}>LOG&gt;</span>
        <input
          className="vec-btn"
          style={{ flex: 1, textAlign: "left", fontWeight: 400 }}
          placeholder="type entry, ENTER to commit"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || !draft.trim()) return;
            onEntry(draft.trim());
            setDraft("");
          }}
        />
      </div>
    </VectorTile>
  );
}
