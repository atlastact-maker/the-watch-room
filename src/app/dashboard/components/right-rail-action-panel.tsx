"use client";

// Dark-themed action panel reused inline in the right-rail Committed Crews
// list. Mirrors the AppliancePopup logic but uses Tailwind tokens so it
// matches the rest of the dashboard chrome.

import { useState } from "react";
import type { Appliance, CrewMember } from "@/lib/sim/types";
import {
  CAPABILITIES_BY_TYPE,
  TASK_MIN_CREW,
  hasWaterSupplyChain,
  type HoseType,
  type Incident,
  type KitKind,
  type Task,
  type TaskKind,
} from "@/lib/sim/incident_types";
import { mitigationOptionsFor } from "@/lib/sim/mitigation";

type Pending = {
  kind: TaskKind;
  label: string;
  hydrantId?: string;
  sourceApplianceId?: string;
  hoseType?: HoseType;
  kitKind?: KitKind;
  hazardId?: string;
  mitigationMethod?: string;
};

type StartTaskFn = (args: {
  applianceId: string;
  kind: TaskKind;
  assignedCrewIds: string[];
  hydrantId?: string;
  sourceApplianceId?: string;
  hoseType?: HoseType;
  kitKind?: KitKind;
  hazardId?: string;
  mitigationMethod?: string;
}) => void;

export function RightRailActionPanel({
  appliance,
  allOnSceneAppliances,
  tasks,
  incident,
  visibleHazards,
  isCommander,
  crewAir,
  busyCrewIds,
  onStartTask,
  onAbortTask,
}: {
  appliance: Appliance;
  allOnSceneAppliances: Appliance[];
  tasks: Task[];
  incident: Incident;
  visibleHazards: { id: string; label: string; kind: string }[];
  isCommander: boolean;
  crewAir: Record<string, number>;
  busyCrewIds: Set<string>;
  onStartTask: StartTaskFn;
  onAbortTask: (taskId: string) => void;
}) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [pickedCrew, setPickedCrew] = useState<string[]>([]);

  const ownActive = tasks.filter((t) => t.applianceId === appliance.id && t.state === "active");
  const ownCompleted = tasks.filter((t) => t.applianceId === appliance.id && t.state === "completed");
  const has = (k: TaskKind) =>
    ownActive.some((t) => t.kind === k) || ownCompleted.some((t) => t.kind === k);
  const isActive = (k: TaskKind) => ownActive.some((t) => t.kind === k);

  const caps = CAPABILITIES_BY_TYPE[appliance.type] ?? [];
  const isBA = caps.includes("BA");
  const isFire = appliance.service === "Fire";
  const isAmbulance = appliance.service === "Ambulance";
  const isPolice = appliance.service === "Police";
  const hydrants = incident.scenario.scene?.hydrants ?? [];
  // Count active connections per hydrant id. UK doctrine caps two pumps
  // per hydrant (primary + secondary outlets) — a third pump trying to
  // tap the same point wouldn't get enough pressure to deliver, so the
  // sim refuses the connection.
  const hydrantConnectCount = new Map<string, number>();
  for (const t of tasks) {
    if (t.kind !== "connect_hydrant" || t.state === "aborted" || !t.hydrantId) continue;
    hydrantConnectCount.set(t.hydrantId, (hydrantConnectCount.get(t.hydrantId) ?? 0) + 1);
  }
  const HYDRANT_MAX_PUMPS = 2;
  const hasSupplyChain = hasWaterSupplyChain(appliance.id, tasks);
  // Scene-global: once ANY appliance has completed gain_entry, every subsequent
  // BA team can commit without re-forcing the door. Real doctrine — the door
  // stays open, entry control just logs additional wearers at the board.
  const entryCompleteGlobal = tasks.some(
    (t) => t.kind === "gain_entry" && t.state === "completed",
  );
  const entryCompletedByOther =
    entryCompleteGlobal && !ownCompleted.some((t) => t.kind === "gain_entry");

  const kitAvailable: { kind: KitKind; label: string }[] = [];
  if (appliance.kit.some((k) => /AED|Defib/i.test(k))) kitAvailable.push({ kind: "aed", label: "AED" });
  if (appliance.kit.some((k) => /First|Paramedic kit|Oxygen/i.test(k)))
    kitAvailable.push({ kind: "first_aid", label: "First aid" });
  if (appliance.kit.some((k) => /Trauma|Critical care/i.test(k)))
    kitAvailable.push({ kind: "trauma", label: "Trauma bag" });
  if (appliance.kit.some((k) => /Extinguisher/i.test(k)))
    kitAvailable.push({ kind: "extinguisher", label: "Extinguisher" });
  if (kitAvailable.length === 0 && appliance.service === "Fire") {
    kitAvailable.push({ kind: "extinguisher", label: "Extinguisher" });
  }

  const relayCandidates = allOnSceneAppliances.filter(
    (a) => a.id !== appliance.id && hasWaterSupplyChain(a.id, tasks),
  );

  function startAssign(p: Pending) {
    setPending(p);
    setPickedCrew([]);
  }
  function cancelAssign() {
    setPending(null);
    setPickedCrew([]);
  }
  function togglePick(id: string) {
    setPickedCrew((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function confirmAssign() {
    if (!pending) return;
    if (pickedCrew.length < TASK_MIN_CREW[pending.kind]) return;
    onStartTask({
      applianceId: appliance.id,
      kind: pending.kind,
      assignedCrewIds: pickedCrew,
      hydrantId: pending.hydrantId,
      sourceApplianceId: pending.sourceApplianceId,
      hoseType: pending.hoseType,
      kitKind: pending.kitKind,
      hazardId: pending.hazardId,
      mitigationMethod: pending.mitigationMethod,
    });
    cancelAssign();
  }

  const candidates = pending?.kind === "ba_sar"
    ? appliance.crewMembers.filter((c) => /Firefighter|Paramedic|HART/.test(c.role))
    : appliance.crewMembers;

  return (
    <div className="space-y-2 text-xs">
      {ownActive.length > 0 && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber-dim)">
            Active tasks
          </div>
          <ul className="mt-1 space-y-1">
            {ownActive.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2 rounded-sm border border-(--color-border-subtle) bg-(--color-surface) px-2 py-1"
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text)">
                  {t.kind.replace(/_/g, " ")}
                  {t.hydrantId ? ` · ${t.hydrantId}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => onAbortTask(t.id)}
                  className="rounded-sm border border-(--color-critical)/50 px-1.5 py-0 font-mono text-[10px] uppercase tracking-widest text-(--color-critical) hover:bg-(--color-critical)/10"
                >
                  abort
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!pending && (
        <div className="space-y-2">
          <ActionGrid>
            <ActionBtn
              label={has("survey") ? "✓ 360 survey" : "360 survey · 60s"}
              disabled={has("survey")}
              onClick={() => startAssign({ kind: "survey", label: "360 survey · 60s" })}
            />
            <ActionBtn
              label={isCommander ? "✓ IC assigned" : "Scene commander"}
              disabled={isCommander}
              onClick={() => startAssign({ kind: "commander", label: "Scene commander" })}
            />
            {isBA && (
              <ActionBtn
                label={
                  has("gain_entry")
                    ? "✓ Entry made"
                    : entryCompletedByOther
                      ? "✓ Entry already made"
                      : "Gain entry · 60–180s"
                }
                disabled={has("gain_entry") || entryCompletedByOther}
                title={entryCompletedByOther ? "Another BA team has already forced entry — you can commit BA directly" : undefined}
                onClick={() => startAssign({ kind: "gain_entry", label: "Gain entry · 60–180s" })}
              />
            )}
            {isFire && appliance.waterLitres > 0 && (
              <ActionBtn
                label={isActive("hose_attack") ? "✓ Hose attack on" : "Hose attack"}
                disabled={isActive("hose_attack") || !hasSupplyChain}
                title={!hasSupplyChain ? "Needs water supply (hydrant or relay)" : undefined}
                onClick={() => startAssign({ kind: "hose_attack", label: "Hose attack" })}
              />
            )}
          </ActionGrid>

          {isFire && appliance.waterLitres > 0 && hydrants.length > 0 && (
            <SubGroup title="Connect hydrant">
              {hydrants.map((h) => {
                const count = hydrantConnectCount.get(h.label) ?? 0;
                const full = count >= HYDRANT_MAX_PUMPS;
                const label = full
                  ? `${h.label} (${count}/${HYDRANT_MAX_PUMPS} full)`
                  : count > 0
                    ? `${h.label} (${count}/${HYDRANT_MAX_PUMPS}) · 120s`
                    : `${h.label} · 120s`;
                return (
                  <ActionBtn
                    key={h.label}
                    label={label}
                    disabled={full || has("connect_hydrant")}
                    title={full ? `Hydrant already serving ${HYDRANT_MAX_PUMPS} pumps` : undefined}
                    onClick={() =>
                      startAssign({
                        kind: "connect_hydrant",
                        label: `Connect ${h.label} · 120s`,
                        hydrantId: h.label,
                      })
                    }
                  />
                );
              })}
            </SubGroup>
          )}

          {isFire && appliance.waterLitres > 0 && relayCandidates.length > 0 && (
            <SubGroup title="Relay hose from">
              {relayCandidates.map((src) => {
                const alreadyRelay = tasks.some(
                  (t) =>
                    t.kind === "relay_hose" &&
                    t.state !== "aborted" &&
                    t.applianceId === appliance.id &&
                    t.sourceApplianceId === src.id,
                );
                return (
                  <ActionBtn
                    key={src.id}
                    label={alreadyRelay ? `${src.callsign} (linked)` : `${src.callsign} · 70mm · 180s`}
                    disabled={alreadyRelay}
                    onClick={() =>
                      startAssign({
                        kind: "relay_hose",
                        label: `Relay 70mm from ${src.callsign} · 180s`,
                        sourceApplianceId: src.id,
                        hoseType: "70mm",
                      })
                    }
                  />
                );
              })}
            </SubGroup>
          )}

          {!isPolice && kitAvailable.length > 0 && (
            <SubGroup title="Grab kit">
              {kitAvailable.map((k) => {
                const already = tasks.some(
                  (t) =>
                    t.kind === "kit_grab" &&
                    t.state !== "aborted" &&
                    t.applianceId === appliance.id &&
                    t.kitKind === k.kind,
                );
                return (
                  <ActionBtn
                    key={k.kind}
                    label={already ? `✓ ${k.label}` : `${k.label} · 30s`}
                    disabled={already}
                    onClick={() =>
                      startAssign({
                        kind: "kit_grab",
                        label: `Grab ${k.label} · 30s`,
                        kitKind: k.kind,
                      })
                    }
                  />
                );
              })}
            </SubGroup>
          )}

          {isFire && visibleHazards.length > 0 && (
            <SubGroup title="Mitigate hazard">
              {visibleHazards.map((h) => {
                const already = tasks.some(
                  (t) =>
                    t.kind === "mitigate_hazard" &&
                    t.state !== "aborted" &&
                    t.hazardId === h.id,
                );
                const opts = mitigationOptionsFor(h.kind);
                return opts.map((opt) => (
                  <ActionBtn
                    key={`${h.id}:${opt.method}`}
                    label={already ? `✓ ${h.id}` : `${h.id}: ${opt.method}`}
                    title={h.label}
                    disabled={already}
                    onClick={() =>
                      startAssign({
                        kind: "mitigate_hazard",
                        label: `${h.label} · ${opt.method}`,
                        hazardId: h.id,
                        mitigationMethod: opt.method,
                      })
                    }
                  />
                ));
              })}
            </SubGroup>
          )}

          {isBA && (
            <SubGroup title="BA search & rescue">
              <ActionBtn
                label={has("ba_sar") ? "✓ BA team under air" : "Commit BA team"}
                disabled={!entryCompleteGlobal || has("ba_sar")}
                title={!entryCompleteGlobal ? "Gain entry first" : undefined}
                onClick={() =>
                  startAssign({ kind: "ba_sar", label: "BA SAR · ongoing" })
                }
              />
            </SubGroup>
          )}

          {isPolice && (
            <SubGroup title="Police actions">
              <ActionBtn
                label={has("cordon") ? "✓ Cordon" : "Cordon · 180s"}
                disabled={has("cordon")}
                onClick={() => startAssign({ kind: "cordon", label: "Cordon · 180s" })}
              />
              <ActionBtn
                label={isActive("traffic_mgmt") ? "✓ Traffic mgmt on" : "Traffic management"}
                disabled={isActive("traffic_mgmt")}
                onClick={() => startAssign({ kind: "traffic_mgmt", label: "Traffic management" })}
              />
              <ActionBtn
                label={isActive("scene_preservation") ? "✓ Scene preserved" : "Scene preservation"}
                disabled={isActive("scene_preservation")}
                onClick={() => startAssign({ kind: "scene_preservation", label: "Scene preservation" })}
              />
            </SubGroup>
          )}

          {isAmbulance && (
            <SubGroup title="Ambulance actions">
              <ActionBtn
                label={has("triage_sieve") ? "✓ Triage sieve" : "Triage sieve · 240s"}
                disabled={has("triage_sieve")}
                title="MCI primary triage sweep. Treatment interventions use the Treatment tab on individual casualties."
                onClick={() => startAssign({ kind: "triage_sieve", label: "Triage sieve · 240s" })}
              />
            </SubGroup>
          )}
        </div>
      )}

      {pending && (
        <div className="rounded-sm border border-(--color-amber)/40 bg-(--color-amber)/5 p-2">
          <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber-dim)">
            Assign crew · {pending.label}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
            Need {TASK_MIN_CREW[pending.kind]}+ · selected {pickedCrew.length}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {candidates.map((m) => {
              const picked = pickedCrew.includes(m.id);
              const busy = busyCrewIds.has(m.id) && !picked;
              return (
                <CrewChip
                  key={m.id}
                  member={m}
                  picked={picked}
                  busy={busy}
                  air={pending.kind === "ba_sar" ? crewAir[m.id] : undefined}
                  onToggle={() => !busy && togglePick(m.id)}
                />
              );
            })}
            {candidates.length === 0 && (
              <div className="col-span-2 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                No suitable crew
              </div>
            )}
          </div>
          <div className="mt-2 flex gap-1.5">
            <ActionBtn
              label={
                pickedCrew.length >= TASK_MIN_CREW[pending.kind]
                  ? "Confirm assignment"
                  : `Need ${TASK_MIN_CREW[pending.kind] - pickedCrew.length} more`
              }
              disabled={pickedCrew.length < TASK_MIN_CREW[pending.kind]}
              onClick={confirmAssign}
            />
            <ActionBtn label="Cancel" onClick={cancelAssign} />
          </div>
        </div>
      )}
    </div>
  );
}

function ActionGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-1.5">{children}</div>;
}

function SubGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber-dim)">
        {title}
      </div>
      <div className="mt-1 grid grid-cols-2 gap-1.5">{children}</div>
    </div>
  );
}

function ActionBtn({
  label,
  disabled,
  onClick,
  title,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={
        "rounded-sm border px-2 py-1 text-left font-mono text-[10px] uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-40 " +
        (disabled
          ? "border-(--color-border) text-(--color-text-dim)"
          : "border-(--color-amber)/50 bg-(--color-amber)/10 text-(--color-amber) hover:bg-(--color-amber)/20")
      }
    >
      {label}
    </button>
  );
}

function CrewChip({
  member,
  picked,
  busy,
  air,
  onToggle,
}: {
  member: CrewMember;
  picked: boolean;
  busy: boolean;
  air?: number;
  onToggle: () => void;
}) {
  const showAir = air !== undefined;
  const airPct = air ?? 100;
  const airColour =
    airPct < 30 ? "text-(--color-critical)" : airPct < 50 ? "text-(--color-amber)" : "text-(--color-ok)";
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy}
      title={`${member.name} · ${member.role}`}
      className={
        "flex flex-col items-stretch gap-0.5 rounded-sm border px-1.5 py-1 text-left disabled:cursor-not-allowed " +
        (picked
          ? "border-(--color-amber) bg-(--color-amber)/15 text-(--color-amber)"
          : busy
            ? "border-(--color-border) text-(--color-text-dim)"
            : "border-(--color-border) text-(--color-text) hover:border-(--color-amber-dim) hover:text-(--color-amber)")
      }
    >
      <div className="flex items-center justify-between gap-1 font-mono text-[10px]">
        <span className="truncate">{member.name}</span>
        {showAir ? (
          <span className={`font-mono text-[9px] ${airColour}`}>{Math.round(airPct)}%</span>
        ) : busy ? (
          <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-critical)">busy</span>
        ) : null}
      </div>
      <div className="font-mono text-[8px] uppercase tracking-widest text-(--color-text-dim)">
        {member.role}
      </div>
    </button>
  );
}
