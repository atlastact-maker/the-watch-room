"use client";

// Unified deployment UI — service tabs (GMFRS / NWAS / GMP) + category chips
// + flat list of available vehicles, with a "Mobilised" strip on top showing
// already-deployed crews and their welfare controls. Reused by both the
// initial-deployment incident panel and the in-shift ground view.

import { Fragment, useEffect, useState } from "react";
import type { Appliance, AreaCode, PodTypeCode, ServiceCode } from "@/lib/sim/types";
import type { Deployment, Incident } from "@/lib/sim/incident_types";
import { pagerDelaySec } from "@/lib/sim/turnout";
import {
  categoryOf,
  categoriesForService,
  SERVICE_LABEL,
  unitNoun,
  type VehicleCategory,
} from "@/lib/sim/categories";
import type { StationWithAppliances } from "../page";
import { rescaleBlueLightSeconds } from "@/lib/sim/eta";

export type Eta = {
  stationId: string;
  meters: number;
  seconds: number;
  source: "ors" | "fallback";
  coords: [number, number][] | null;
};

export type DeployArgs = {
  applianceId: string;
  slotId: string;
  etaSeconds: number;
  routeMeters?: number;
  routeCoords?: [number, number][];
  selectedPodType?: PodTypeCode;
};

export function DeploymentBoard({
  incident,
  stations,
  etas,
  deployments,
  patch,
  onDeploy,
  onStandDownForWelfare,
  onStandDown,
}: {
  incident: Incident;
  stations: StationWithAppliances[];
  etas: Record<string, Eta>;
  deployments: Deployment[];
  /** The operator's patch. Stations outside this patch (and not ForceWide)
   *  are flagged as "Out of patch" specialists so the operator sees at a
   *  glance they're pulling a resource from a neighbouring borough. */
  patch?: AreaCode | null;
  onDeploy: (args: DeployArgs) => void;
  onStandDownForWelfare: (applianceId: string) => void;
  /** Stand the appliance down from this incident and send it back to
   *  station. Works en route (turn around) or at scene (clear the scene). */
  onStandDown?: (applianceId: string) => void;
}) {
  const availableServices: ServiceCode[] = (["Fire", "Ambulance", "Police"] as ServiceCode[]).filter((s) =>
    stations.some((st) => st.service === s && st.appliances.length > 0),
  );
  const [service, setService] = useState<ServiceCode>(availableServices[0] ?? "Fire");
  const [category, setCategory] = useState<VehicleCategory | "all">("all");
  // When the operator mobilises a Prime Mover we first ask which pod to carry.
  const [pmPicker, setPmPicker] = useState<{
    applianceId: string;
    stationId: string;
  } | null>(null);

  useEffect(() => {
    setCategory("all");
  }, [service]);

  const pdaTypes = new Set(incident.scenario.pda.flatMap((s) => s.requiredApplianceTypes));
  const usedIds = new Set(deployments.map((d) => d.applianceId));

  type Row = {
    appliance: Appliance;
    stationName: string;
    stationId: string;
    stationArea: AreaCode;
    staffing?: string;
    outOfPatch: boolean;
    eta?: Eta;
  };
  const rows: Row[] = [];
  for (const st of stations) {
    if (st.service !== service) continue;
    for (const a of st.appliances) {
      if (usedIds.has(a.id)) continue;
      if (category !== "all" && categoryOf(a.type) !== category) continue;
      if (a.status !== 7 || a.crew.current < a.crew.min) continue;
      const outOfPatch = !!patch && st.area !== patch && st.area !== "ForceWide";
      rows.push({
        appliance: a,
        stationName: st.name,
        stationId: st.id,
        stationArea: st.area,
        staffing: st.staffing,
        outOfPatch,
        eta: etas[st.id],
      });
    }
  }
  // Sort in-patch / ForceWide first, then out-of-patch specialists, each
  // group by ETA ascending. Keeps the operator's own ground at the top
  // while still making neighbouring specialists visible and clickable.
  rows.sort((a, b) => {
    if (a.outOfPatch !== b.outOfPatch) return a.outOfPatch ? 1 : -1;
    return (a.eta?.seconds ?? 1e9) - (b.eta?.seconds ?? 1e9);
  });
  const firstOutOfPatchIdx = rows.findIndex((r) => r.outOfPatch);

  const cats = categoriesForService(service);

  const deployedRows = deployments
    .map((d) => ({ d, appliance: findAppliance(stations, d.applianceId) }))
    .filter((r): r is { d: Deployment; appliance: Appliance } => !!r.appliance);

  return (
    <div className="space-y-3">
      {deployedRows.length > 0 && (
        <div className="space-y-1">
          <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
            Mobilised · {deployedRows.length}
          </div>
          <ul className="space-y-1">
            {deployedRows.map(({ d, appliance }) => (
              <li
                key={d.applianceId}
                className="flex items-center justify-between gap-3 rounded-sm border border-(--color-border-subtle) bg-(--color-surface-raised) px-2 py-1.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 text-sm">
                    <span className="font-mono text-(--color-text)">{appliance.callsign}</span>
                    <span className="truncate font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
                      {appliance.typeName}
                    </span>
                  </div>
                </div>
                <DeployedBadge
                  appliance={appliance}
                  deployment={d}
                  onStandDownForWelfare={onStandDownForWelfare}
                  onStandDown={onStandDown}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-stretch overflow-hidden rounded-sm border border-(--color-border-subtle)">
        {availableServices.map((s) => {
          const active = s === service;
          const colour =
            s === "Fire"
              ? "text-(--color-critical)"
              : s === "Ambulance"
                ? "text-(--color-ok)"
                : "text-(--color-info)";
          return (
            <button
              key={s}
              type="button"
              onClick={() => setService(s)}
              className={
                "flex-1 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors " +
                (active
                  ? `${colour} bg-(--color-bg)`
                  : "text-(--color-text-dim) hover:bg-(--color-bg)/50 hover:text-(--color-text)")
              }
            >
              {SERVICE_LABEL[s]}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1">
        <CategoryChip
          label="All"
          active={category === "all"}
          onClick={() => setCategory("all")}
        />
        {cats.map((c) => (
          <CategoryChip
            key={c.key}
            label={c.label}
            active={category === c.key}
            onClick={() => setCategory(c.key)}
          />
        ))}
      </div>

      <ul className="space-y-1">
        {rows.length === 0 && (
          <li className="rounded-sm border border-(--color-border-subtle) px-3 py-3 text-center font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
            No available {unitNoun(service, true)} in this category
          </li>
        )}
        {rows.map((r, idx) => {
          const recommended = pdaTypes.has(r.appliance.type);
          const station = stations.find((s) => s.id === r.stationId);
          const isPm = r.appliance.type === "PM";
          const availablePods = isPm ? (station?.availablePods ?? []) : [];
          const isPickingPod =
            pmPicker !== null && pmPicker.applianceId === r.appliance.id;
          const showOutOfPatchDivider = idx === firstOutOfPatchIdx && firstOutOfPatchIdx > 0;

          function mobilise(selectedPodType?: PodTypeCode) {
            if (!r.eta) return;
            onDeploy({
              applianceId: r.appliance.id,
              slotId: recommended ? `cat:${categoryOf(r.appliance.type)}` : "extra",
              etaSeconds: r.eta.seconds,
              routeMeters: r.eta.meters,
              routeCoords: r.eta.coords ?? undefined,
              selectedPodType,
            });
            setPmPicker(null);
          }

          return (
            <Fragment key={r.appliance.id}>
              {showOutOfPatchDivider && (
                <li className="pt-1">
                  <div className="flex items-center gap-2 px-0.5 pb-0.5 font-mono text-[9px] uppercase tracking-widest text-(--color-info)">
                    <span className="h-px flex-1 bg-(--color-info)/30" aria-hidden />
                    <span>Out-of-patch specialists</span>
                    <span className="h-px flex-1 bg-(--color-info)/30" aria-hidden />
                  </div>
                </li>
              )}
              <li
                className={
                  "rounded-sm border hover:border-(--color-amber-dim) " +
                  (r.outOfPatch
                    ? "border-(--color-info)/30 bg-(--color-info)/5"
                    : "border-(--color-border-subtle)")
                }
              >
                <div className="flex items-center justify-between gap-3 px-2 py-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2 text-sm">
                      <span className="font-mono text-(--color-text)">{r.appliance.callsign}</span>
                      <span className="truncate font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
                        {r.appliance.typeName}
                      </span>
                      {recommended && (
                        <span className="rounded-sm border border-(--color-amber)/50 bg-(--color-amber)/10 px-1 py-0 font-mono text-[9px] uppercase tracking-widest text-(--color-amber)">
                          Recommended
                        </span>
                      )}
                      {r.outOfPatch && (
                        <span
                          className="rounded-sm border border-(--color-info)/50 bg-(--color-info)/10 px-1 py-0 font-mono text-[9px] uppercase tracking-widest text-(--color-info)"
                          title={`Out-of-patch specialist from ${r.stationArea} command`}
                        >
                          Out of patch · {r.stationArea}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                      <span>{r.stationName}</span>
                      <span>·</span>
                      <span className={r.eta ? "text-(--color-amber)" : ""}>
                        {r.eta
                          ? `ETA ${fmtSecs(
                              rescaleBlueLightSeconds(r.eta.seconds, r.appliance.type) +
                                pagerDelaySec(r.staffing, Date.now()),
                            )}`
                          : "ETA …"}
                        {r.eta?.source === "fallback" && " (est)"}
                      </span>
                      {pagerDelaySec(r.staffing, Date.now()) > 0 && (
                        <span
                          className="rounded-sm border border-(--color-amber)/50 bg-(--color-amber)/10 px-1 py-0 font-mono text-[9px] uppercase tracking-widest text-(--color-amber)"
                          title="Day-crewed station — crew respond from home on alerters outside 08:00–18:00; the alerter turnout is included in the ETA shown"
                        >
                          On call
                        </span>
                      )}
                    </div>
                  </div>
                <button
                  type="button"
                  disabled={!r.eta}
                  onClick={() => {
                    if (isPm && availablePods.length > 0) {
                      setPmPicker({ applianceId: r.appliance.id, stationId: r.stationId });
                    } else {
                      mobilise();
                    }
                  }}
                  className="shrink-0 rounded-sm border border-(--color-amber)/50 bg-(--color-amber)/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/20 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Mobilise
                </button>
              </div>
                {isPickingPod && (
                  <div className="border-t border-(--color-border-subtle) bg-(--color-bg)/40 px-2 py-2">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
                      Select pod to carry
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                      {availablePods.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => mobilise(p)}
                          className="rounded-sm border border-(--color-amber)/50 bg-(--color-amber)/10 px-2 py-1.5 text-left font-mono text-[11px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/20"
                        >
                          {podShortLabel(p)}
                          <span className="ml-1 text-[9px] text-(--color-text-muted)">
                            {podFullLabel(p)}
                          </span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setPmPicker(null)}
                        className="col-span-2 rounded-sm border border-(--color-border) px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:border-(--color-text)"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            </Fragment>
          );
        })}
      </ul>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest transition-colors " +
        (active
          ? "border-(--color-amber) bg-(--color-amber)/15 text-(--color-amber)"
          : "border-(--color-border) text-(--color-text-dim) hover:border-(--color-amber-dim) hover:text-(--color-text)")
      }
    >
      {label}
    </button>
  );
}

function DeployedBadge({
  appliance,
  deployment,
  onStandDownForWelfare,
  onStandDown,
}: {
  appliance: Appliance;
  deployment: Deployment;
  onStandDownForWelfare: (applianceId: string) => void;
  onStandDown?: (applianceId: string) => void;
}) {
  const now = Date.now();
  const d = deployment;
  const arrivedBack = d.returnArrivesAt && now >= d.returnArrivesAt;
  const returning =
    d.returnStartedAt && d.returnArrivesAt && now >= d.returnStartedAt && now < d.returnArrivesAt;
  const atHospital =
    d.hospitalArrivesAt && d.offloadEndsAt && now >= d.hospitalArrivesAt && now < d.offloadEndsAt;
  const toHospital =
    d.hospitalLegStartedAt && d.hospitalArrivesAt && now >= d.hospitalLegStartedAt && now < d.hospitalArrivesAt;
  const onWelfare =
    d.welfareStartedAt && d.welfareEndsAt && now >= d.welfareStartedAt && now < d.welfareEndsAt;
  const onScene =
    now >= d.arrivesAt && !d.returnStartedAt && !d.hospitalLegStartedAt && !onWelfare;
  const mobile = now < d.arrivesAt && !d.returnStartedAt;

  const WELFARE_HINT_SEC = 2 * 60 * 60;
  const onSceneSec = onScene ? (now - d.arrivesAt) / 1000 : 0;
  const sinceWelfare = d.lastWelfareAt ? (now - d.lastWelfareAt) / 1000 : onSceneSec;
  const welfareHint = onScene && sinceWelfare > WELFARE_HINT_SEC;
  const canStandDown = !!onStandDown && (mobile || onScene);

  return (
    <div className="flex flex-col items-end gap-1 text-right font-mono text-[10px] uppercase tracking-widest">
      <div className="text-(--color-text)">{appliance.callsign}</div>
      {arrivedBack ? (
        <div className="text-(--color-ok)">Back at station</div>
      ) : returning ? (
        <div className="text-(--color-info)">
          Returning · ETA {fmtSecs(Math.max(0, (d.returnArrivesAt! - now) / 1000))}
        </div>
      ) : atHospital ? (
        <div className="text-(--color-critical)">
          At {d.hospitalName ?? "hospital"} · offload ETA {fmtSecs(Math.max(0, (d.offloadEndsAt! - now) / 1000))}
        </div>
      ) : toHospital ? (
        <div className="text-(--color-critical)">
          → {d.hospitalName ?? "hospital"} · ETA {fmtSecs(Math.max(0, (d.hospitalArrivesAt! - now) / 1000))}
        </div>
      ) : onWelfare ? (
        <div className="text-(--color-info)">
          Welfare · {fmtSecs(Math.max(0, (d.welfareEndsAt! - now) / 1000))}
        </div>
      ) : onScene ? (
        <div className="text-(--color-ok)">
          In attendance · {fmtSecs(onSceneSec)}
        </div>
      ) : (
        <div className="text-(--color-amber)">
          Mobile · ETA {fmtSecs(Math.max(0, (d.arrivesAt - now) / 1000))}
        </div>
      )}
      {onScene && (
        <button
          type="button"
          onClick={() => onStandDownForWelfare(d.applianceId)}
          className={
            "rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-widest " +
            (welfareHint
              ? "border-(--color-amber) bg-(--color-amber)/10 text-(--color-amber) hover:bg-(--color-amber)/20"
              : "border-(--color-border) text-(--color-text-dim) hover:border-(--color-info) hover:text-(--color-info)")
          }
        >
          {welfareHint ? "Welfare recommended" : "Welfare break"}
        </button>
      )}
      {canStandDown && (
        <button
          type="button"
          onClick={() => {
            const verb = mobile ? "turn around and RTB" : "clear the scene and RTB";
            if (
              typeof window !== "undefined" &&
              !window.confirm(`Stand down ${appliance.callsign}? They will ${verb}.`)
            ) {
              return;
            }
            onStandDown!(d.applianceId);
          }}
          className="rounded-sm border border-(--color-critical)/50 px-2 py-0.5 text-[10px] uppercase tracking-widest text-(--color-critical) hover:bg-(--color-critical)/10"
          title={mobile ? "Cancel mobilisation — turn around en route" : "Clear the scene — head back to station"}
        >
          Stand down · RTB
        </button>
      )}
    </div>
  );
}

function findAppliance(
  stations: StationWithAppliances[],
  applianceId: string,
): Appliance | undefined {
  for (const s of stations) {
    const a = s.appliances.find((a) => a.id === applianceId);
    if (a) return a;
  }
  return undefined;
}

function podShortLabel(p: PodTypeCode): string {
  return p;
}
function podFullLabel(p: PodTypeCode): string {
  switch (p) {
    case "EPU":
      return "Environmental Protection";
    case "HVP":
      return "High Volume Pump";
    case "HVHL":
      return "High Volume Hose Layer";
    case "UTC":
      return "USAR Timber Carrier";
    case "MDU":
      return "Mass Decontamination Unit";
  }
}

function fmtSecs(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}m ${r}s`;
}
