"use client";

// SEND A CLINICIAN TO A CASUALTY. The menu a right-click on a casualty
// opens, on the desk's map and on the tablet's ground view: every
// ambulance-service crew member on scene, by vehicle, with what they are
// doing now — free, with this casualty already, with another, or busy on
// a job — and one click sends them (they walk over) or stands them down.

import { useEffect } from "react";
import type { Appliance } from "@/lib/sim/types";
import type { Deployment, Task } from "@/lib/sim/incident_types";
import { scopeOfApplianceType } from "@/lib/sim/incident_types";
import { busyOn, crewSent } from "@/lib/sim/crew_assign";

export type AssignMember = {
  id: string;
  name: string;
  role: string;
  status: "free" | "here" | "other" | "busy";
  /** Where they are instead, when with another casualty or on a job. */
  where?: string;
};

export type AssignRow = { applianceId: string; callsign: string; scope: string; members: AssignMember[] };

export type AssignCrewFn = (applianceId: string, crewId: string, casualtyId: string | null) => void;

/** A casualty's label cut to who they are, for a plate or a status:
 *  "Kia driver (F, ~34) — scalp laceration, ?C-spine" → "Kia driver". */
export function casualtyShortLabel(label: string | undefined, id: string): string {
  const who = (label ?? id).split(" — ")[0].replace(/\s*\([^)]*\)\s*$/, "").trim();
  return who || id;
}

/** Everyone a clinician could be sent from: the ambulance-service vehicles
 *  on scene, their crews less the pilots, each with what they are on. */
export function assignRowsFor(
  onScene: { deployment: Deployment; appliance: Appliance }[],
  tasks: Task[],
  casualtyId: string,
  casualtyLabel: (id: string) => string,
): AssignRow[] {
  const rows: AssignRow[] = [];
  for (const { deployment: d, appliance: a } of onScene) {
    if (a.service !== "Ambulance") continue;
    const scope = scopeOfApplianceType(a.type);
    if (scope === "none") continue;
    if (d.hospitalLegStartedAt) continue;
    const members: AssignMember[] = [];
    const sentTo = new Map(crewSent(d, a.crewMembers, busyOn(tasks, a.id)).map((s) => [s.member.id, s.casualtyId]));
    for (const m of a.crewMembers) {
      if (/pilot/i.test(m.role)) continue;
      const job = tasks.find((t) => t.state === "active" && t.applianceId === a.id && t.assignedCrewIds.includes(m.id) && t.kind !== "commander");
      const on = sentTo.get(m.id);
      if (job) members.push({ id: m.id, name: m.name, role: m.role, status: "busy", where: job.kind.replace(/_/g, " ") });
      else if (on === casualtyId) members.push({ id: m.id, name: m.name, role: m.role, status: "here" });
      else if (on) members.push({ id: m.id, name: m.name, role: m.role, status: "other", where: casualtyLabel(on) });
      else members.push({ id: m.id, name: m.name, role: m.role, status: "free" });
    }
    if (members.length) rows.push({ applianceId: a.id, callsign: a.callsign, scope, members });
  }
  return rows;
}

export function CrewAssignMenu({ casualty, rows, x, y, host, onAssign, onClose }: {
  casualty: { id: string; label: string };
  rows: AssignRow[];
  /** Where the click was, in the container's own pixels. */
  x: number;
  y: number;
  /** The container's size, to keep the menu inside it. */
  host?: { w: number; h: number };
  onAssign: AssignCrewFn;
  onClose: () => void;
}) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  // Kept inside the container: shifted up or left when the click was near an edge.
  const estH = 46 + (rows.length ? Math.min(328, rows.reduce((h, r) => h + 20 + r.members.length * 38, 8)) : 34);
  const left = Math.max(8, host ? Math.min(x - 8, host.w - 268) : x - 8);
  const top = Math.max(8, host ? Math.min(y - 8, host.h - estH - 8) : y - 8);
  return (
    <>
      <div className="absolute inset-0 z-[1390]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        className="pointer-events-auto absolute z-[1400] w-[260px] rounded-sm border border-(--color-amber)/60 bg-(--color-bg)/95 shadow-lg"
        style={{ left, top }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="border-b border-(--color-border-subtle) px-3 py-2">
          <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-amber)">Send a clinician to</div>
          <div className="text-[13px] text-(--color-text)">{casualty.label}</div>
        </div>
        {rows.length === 0 ? (
          <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">No ambulance crew on scene yet.</p>
        ) : (
          <div className="max-h-[320px] overflow-y-auto py-1">
            {rows.map((r) => (
              <div key={r.applianceId} className="px-2 py-1">
                <div className="px-1 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">{r.callsign} · {r.scope.toUpperCase()}</div>
                {r.members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    disabled={m.status === "busy"}
                    onClick={() => { onAssign(r.applianceId, m.id, m.status === "here" ? null : casualty.id); onClose(); }}
                    className={`mt-0.5 flex w-full items-center justify-between gap-2 rounded-sm border px-2 py-1 text-left ${m.status === "here" ? "border-(--color-ok)/50 bg-(--color-ok)/10" : m.status === "busy" ? "border-(--color-border-subtle) opacity-50" : "border-(--color-border-subtle) bg-(--color-surface-raised) hover:border-(--color-amber)/60"}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] text-(--color-text)">{m.name}</span>
                      <span className="block font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">{m.role}{m.status === "other" ? ` · with ${m.where}` : m.status === "busy" ? ` · ${m.where}` : ""}</span>
                    </span>
                    <span className={`shrink-0 font-mono text-[9px] uppercase tracking-widest ${m.status === "here" ? "text-(--color-critical)" : m.status === "busy" ? "text-(--color-text-dim)" : "text-(--color-amber)"}`}>
                      {m.status === "here" ? "Stand down" : m.status === "busy" ? "Busy" : m.status === "other" ? "Move here" : "Send"}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
