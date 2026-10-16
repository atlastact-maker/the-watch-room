"use client";

// Resource directory — the glossary's fleet reference. One card per
// appliance type, grouped by service: the vehicle artwork, what it is,
// example callsigns from the modelled fleet, crew, water and the kit it
// actually carries. Built from the same station data the sim runs on,
// so it never drifts from the game.

import type { StationWithAppliances } from "../page";
import type { Appliance, ServiceCode } from "@/lib/sim/types";
import { MAKE_MODEL } from "@/lib/sim/vehicles";
import {
  VEHICLE_SPRITES,
  spriteKeyForType,
} from "./vehicle-sprites";

const SERVICE_ORDER: ServiceCode[] = ["Fire", "Ambulance", "Police"];
const SERVICE_CLASS: Record<ServiceCode, string> = { Fire: "fire", Ambulance: "ambulance", Police: "police" };

export type TypeDigest = {
  type: string;
  typeName: string;
  service: ServiceCode;
  count: number;
  callsigns: string[];
  crewMin: number;
  crewMax: number;
  waterLitres: number;
  kit: string[];
};

export function digestFleet(stations: StationWithAppliances[]): TypeDigest[] {
  const byType = new Map<string, TypeDigest & { _kitBest: number }>();
  for (const s of stations) {
    for (const a of s.appliances as Appliance[]) {
      let d = byType.get(a.type);
      if (!d) {
        d = {
          type: a.type,
          typeName: a.typeName,
          service: a.service,
          count: 0,
          callsigns: [],
          crewMin: a.crew.min,
          crewMax: a.crew.max,
          waterLitres: a.waterLitres,
          kit: a.kit,
          _kitBest: a.kit.length,
        };
        byType.set(a.type, d);
      }
      d.count += 1;
      if (d.callsigns.length < 3 && !d.callsigns.includes(a.callsign)) {
        d.callsigns.push(a.callsign);
      }
      d.crewMin = Math.min(d.crewMin, a.crew.min);
      d.crewMax = Math.max(d.crewMax, a.crew.max);
      d.waterLitres = Math.max(d.waterLitres, a.waterLitres);
      if (a.kit.length > d._kitBest) {
        d.kit = a.kit;
        d._kitBest = a.kit.length;
      }
    }
  }
  return Array.from(byType.values()).sort(
    (a, b) =>
      SERVICE_ORDER.indexOf(a.service) - SERVICE_ORDER.indexOf(b.service) ||
      b.count - a.count ||
      a.typeName.localeCompare(b.typeName),
  );
}

function SpriteBox({ type }: { type: string }) {
  const key = spriteKeyForType(type);
  const sprite = key ? VEHICLE_SPRITES[key] : null;
  if (!sprite) {
    return <div className="vec-dir-sprite pending">Artwork in production</div>;
  }
  return (
    <div className="vec-dir-sprite">
      <div
        style={{ aspectRatio: `${sprite.w} / ${sprite.h}`, height: "100%", maxHeight: "100%" }}
        dangerouslySetInnerHTML={{
          __html: `<svg viewBox="0 0 ${sprite.w} ${sprite.h}" width="100%" height="100%">${sprite.svg}</svg>`,
        }}
      />
    </div>
  );
}

export function ResourceDirectory({
  stations,
  filter,
}: {
  stations: StationWithAppliances[];
  filter: string;
}) {
  const lowered = filter.trim().toLowerCase();
  const all = digestFleet(stations);
  const shown = lowered
    ? all.filter(
        (d) =>
          d.typeName.toLowerCase().includes(lowered) ||
          d.type.toLowerCase().includes(lowered) ||
          d.service.toLowerCase().includes(lowered) ||
          d.callsigns.some((c) => c.toLowerCase().includes(lowered)) ||
          d.kit.some((k) => k.toLowerCase().includes(lowered)),
      )
    : all;

  if (shown.length === 0) {
    return <p className="vec-tile-empty">No resources match &quot;{filter}&quot;</p>;
  }

  return (
    <div className="vec-dir">
      {SERVICE_ORDER.map((svc) => {
        const rows = shown.filter((d) => d.service === svc);
        if (rows.length === 0) return null;
        return (
          <section key={svc} aria-label={svc}>
            <h2 className={SERVICE_CLASS[svc]}>
              {svc} · {rows.reduce((n, d) => n + d.count, 0)} vehicles
            </h2>
            <div className="vec-dir-grid">
              {rows.map((d) => {
                const mm = MAKE_MODEL[d.type as keyof typeof MAKE_MODEL];
                return (
                  <article key={d.type} className="vec-dir-card">
                    <SpriteBox type={d.type} />
                    <div className="vec-dir-body">
                      <div className="vec-dir-head">
                        <h3>{d.typeName}</h3>
                        <span className="n">×{d.count}</span>
                      </div>
                      <p className="vec-dir-meta">
                        {d.type.replace(/_/g, " ")}
                        {mm ? ` · ${mm.make} ${mm.model}` : ""}
                      </p>
                      <p className="vec-dir-meta">Callsigns {d.callsigns.join(" · ")}</p>
                      <p className="vec-dir-meta">
                        Crew {d.crewMin === d.crewMax ? d.crewMin : `${d.crewMin}–${d.crewMax}`}
                        {d.waterLitres > 0 && <> · {d.waterLitres.toLocaleString()} L water</>}
                      </p>
                      {d.kit.length > 0 && (
                        <div className="vec-dir-kit">
                          {d.kit.map((k) => <span key={k}>{k}</span>)}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
