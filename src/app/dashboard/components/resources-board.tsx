"use client";

import { useEffect, useState } from "react";
import { STATUS_LABELS, type Appliance, type ServiceCode, type StatusCode } from "@/lib/sim/types";
import { categoryOf, categoriesForService, SERVICE_LABEL, unitNoun, type VehicleCategory } from "@/lib/sim/categories";
import type { StationWithAppliances } from "../page";
import { rescaleBlueLightSeconds } from "@/lib/sim/eta";

const SERVICE_ORDER: ServiceCode[] = ["Fire", "Ambulance", "Police"];

const SERVICE_COLOUR: Record<ServiceCode, string> = {
  Fire: "text-(--color-critical)",
  Ambulance: "text-(--color-ok)",
  Police: "text-(--color-info)",
};

export function ResourcesBoard({
  stations,
  onSelectAppliance,
  deployedIds,
  etas,
  incidentActive,
  onMobilise,
}: {
  stations: StationWithAppliances[];
  onSelectAppliance: (applianceId: string) => void;
  /** When an incident is active the operator can mobilise directly from
   *  this list instead of going through the separate incident panel. */
  deployedIds?: Set<string>;
  etas?: Record<string, { stationId: string; seconds: number; meters: number; source: "ors" | "fallback"; coords: [number, number][] | null }>;
  incidentActive?: boolean;
  onMobilise?: (args: {
    applianceId: string;
    stationId: string;
  }) => void;
}) {
  // Only show services that have any vehicles in this patch.
  const availableServices = SERVICE_ORDER.filter((s) =>
    stations.some((st) => st.service === s && st.appliances.length > 0),
  );
  const [service, setService] = useState<ServiceCode>(availableServices[0] ?? "Fire");
  const [category, setCategory] = useState<VehicleCategory | "all">("all");

  // Reset category when service changes so we don't keep an irrelevant chip.
  useEffect(() => {
    setCategory("all");
  }, [service]);

  const allForService: { appliance: Appliance; stationName: string; stationId: string }[] = [];
  for (const st of stations) {
    if (st.service !== service) continue;
    for (const a of st.appliances) {
      allForService.push({ appliance: a, stationName: st.name, stationId: st.id });
    }
  }

  const visible =
    category === "all"
      ? allForService
      : allForService.filter((row) => categoryOf(row.appliance.type) === category);

  // Ready first, then by status code, then by callsign.
  visible.sort((a, b) => {
    const aReady = isReady(a.appliance) ? 0 : 1;
    const bReady = isReady(b.appliance) ? 0 : 1;
    if (aReady !== bReady) return aReady - bReady;
    if (a.appliance.status !== b.appliance.status) return a.appliance.status - b.appliance.status;
    return a.appliance.callsign.localeCompare(b.appliance.callsign);
  });

  const cats = categoriesForService(service);

  return (
    <section className="flex h-full w-full flex-col overflow-hidden">
      {/* Service tabs */}
      <div className="flex items-stretch border-b border-(--color-border-subtle) bg-(--color-surface-raised)">
        {availableServices.map((s) => {
          const active = s === service;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setService(s)}
              className={
                "relative flex-1 px-4 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors " +
                (active
                  ? `${SERVICE_COLOUR[s]} bg-(--color-bg)`
                  : "text-(--color-text-dim) hover:bg-(--color-bg)/40 hover:text-(--color-text)")
              }
            >
              {SERVICE_LABEL[s]}
              {active && (
                <span
                  className={
                    "absolute inset-x-2 bottom-0 h-0.5 " +
                    (s === "Fire"
                      ? "bg-(--color-critical)"
                      : s === "Ambulance"
                        ? "bg-(--color-ok)"
                        : "bg-(--color-info)")
                  }
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1 border-b border-(--color-border-subtle) px-3 py-2">
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

      {/* Vehicle list */}
      <ul className="flex-1 divide-y divide-(--color-border-subtle) overflow-y-auto">
        {visible.length === 0 && (
          <li className="px-4 py-6 text-center font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
            No {unitNoun(service, true)} in this category
          </li>
        )}
        {visible.map((row) => {
          const deployed = deployedIds?.has(row.appliance.id) ?? false;
          const eta = etas?.[row.stationId];
          const canMobilise =
            !!incidentActive &&
            !!onMobilise &&
            !deployed &&
            isReady(row.appliance);
          return (
            <VehicleRow
              key={row.appliance.id}
              appliance={row.appliance}
              stationName={row.stationName}
              deployed={deployed}
              eta={eta}
              canMobilise={canMobilise}
              onSelect={() => onSelectAppliance(row.appliance.id)}
              onMobilise={
                canMobilise
                  ? () => onMobilise!({ applianceId: row.appliance.id, stationId: row.stationId })
                  : undefined
              }
            />
          );
        })}
      </ul>
    </section>
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

function VehicleRow({
  appliance,
  stationName,
  deployed,
  eta,
  canMobilise,
  onSelect,
  onMobilise,
}: {
  appliance: Appliance;
  stationName: string;
  deployed: boolean;
  eta?: { seconds: number; source: "ors" | "fallback" };
  canMobilise: boolean;
  onSelect: () => void;
  onMobilise?: () => void;
}) {
  return (
    <li
      onClick={onSelect}
      className="grid cursor-pointer grid-cols-[2.25rem_1fr_auto] items-center gap-3 px-3 py-2 hover:bg-(--color-surface-raised)"
    >
      <StatusBadge status={appliance.status} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-semibold text-(--color-text)">{appliance.callsign}</span>
          <span className="truncate font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
            {appliance.typeName}
          </span>
        </div>
        <div className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
          {stationName}
          {eta && (
            <span className="ml-2 text-(--color-amber)">
              ETA {fmtSec(rescaleBlueLightSeconds(eta.seconds, appliance.type))}
              {eta.source === "fallback" && " (est)"}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
          Crew {appliance.crew.current}/{appliance.crew.min}
        </div>
        {deployed && (
          <span className="rounded-sm border border-(--color-ok)/50 bg-(--color-ok)/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-ok)">
            Mobilised
          </span>
        )}
        {canMobilise && onMobilise && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMobilise();
            }}
            className="rounded-sm border border-(--color-amber)/50 bg-(--color-amber)/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/20"
          >
            Mobilise
          </button>
        )}
      </div>
    </li>
  );
}

function fmtSec(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

function StatusBadge({ status }: { status: StatusCode }) {
  const palette: Record<number, string> = {
    1: "bg-(--color-amber)/20 text-(--color-amber) border-(--color-amber)/40",
    2: "bg-(--color-critical)/20 text-(--color-critical) border-(--color-critical)/40",
    3: "bg-(--color-info)/20 text-(--color-info) border-(--color-info)/40",
    4: "bg-(--color-info)/20 text-(--color-info) border-(--color-info)/40",
    5: "bg-(--color-info)/20 text-(--color-info) border-(--color-info)/40",
    6: "bg-(--color-info)/20 text-(--color-info) border-(--color-info)/40",
    7: "bg-(--color-ok)/20 text-(--color-ok) border-(--color-ok)/40",
    8: "bg-(--color-text-dim)/20 text-(--color-text-dim) border-(--color-border)",
  };
  return (
    <span
      title={STATUS_LABELS[status]}
      className={
        "inline-flex h-7 w-9 items-center justify-center rounded-sm border font-mono text-sm font-semibold " +
        palette[status]
      }
    >
      {status}
    </span>
  );
}

function isReady(a: Appliance): boolean {
  return a.status === 7 && a.crew.current >= a.crew.min;
}
