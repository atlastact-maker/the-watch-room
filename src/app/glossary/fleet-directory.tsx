"use client";

// The resource directory as console cards: one per appliance type,
// grouped by service, from the same fleet digest the desk's overlay uses.

import { useMemo } from "react";
import { digestFleet } from "@/app/dashboard/components/resource-directory";
import { VEHICLE_SPRITES, spriteKeyForType } from "@/app/dashboard/components/vehicle-sprites";
import type { StationWithAppliances } from "@/app/dashboard/page";
import { SERVICE_TINT, serviceName, unitsWord } from "@/app/menu/menu-types";
import styles from "@/app/menu/watch-menu.module.css";
import type { ServiceCode } from "@/lib/sim/types";
import { MAKE_MODEL } from "@/lib/sim/vehicles";

const ORDER: ServiceCode[] = ["Fire", "Ambulance", "Police"];

function Sprite({ type }: { type: string }) {
  const key = spriteKeyForType(type);
  const sprite = key ? VEHICLE_SPRITES[key] : null;
  if (!sprite) return <div className={styles.sprite}><small>Artwork in production</small></div>;
  return (
    <div className={styles.sprite}>
      <div style={{ aspectRatio: `${sprite.w} / ${sprite.h}` }} dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 ${sprite.w} ${sprite.h}" width="100%" height="100%">${sprite.svg}</svg>` }} />
    </div>
  );
}

export function FleetDirectory({ stations, filter }: { stations: StationWithAppliances[]; filter: string }) {
  const all = useMemo(() => digestFleet(stations), [stations]);
  const shown = filter
    ? all.filter((d) => d.typeName.toLowerCase().includes(filter) || d.type.toLowerCase().includes(filter) || d.service.toLowerCase().includes(filter) || d.callsigns.some((c) => c.toLowerCase().includes(filter)) || d.kit.some((k) => k.toLowerCase().includes(filter)))
    : all;

  if (shown.length === 0) {
    return (
      <section className={`${styles.panel} ${styles.empty}`}>
        <p className={styles.eyebrow}>No matches</p>
        <strong>No resources match &ldquo;{filter}&rdquo;.</strong>
        <p>Try an appliance type, a callsign or an item of equipment.</p>
      </section>
    );
  }

  return (
    <>
      {ORDER.map((svc) => {
        const rows = shown.filter((d) => d.service === svc);
        if (rows.length === 0) return null;
        const total = rows.reduce((n, d) => n + d.count, 0);
        return (
          <section key={svc}>
            <h2 className={styles.serviceHead}><b style={{ background: SERVICE_TINT[svc] }} />{serviceName(svc)} · {total} {unitsWord(svc)} · {rows.length} types</h2>
            <div className={styles.fleet}>
              {rows.map((d) => {
                const mm = MAKE_MODEL[d.type as keyof typeof MAKE_MODEL];
                return (
                  <article key={d.type} className={styles.fleetCard}>
                    <Sprite type={d.type} />
                    <div>
                      <h3>{d.typeName}<span>×{d.count}</span></h3>
                      <p>{d.type.replace(/_/g, " ")}{mm ? ` · ${mm.make} ${mm.model}` : ""}</p>
                      <p>Callsigns {d.callsigns.join(" · ")}</p>
                      <p>Crew {d.crewMin === d.crewMax ? d.crewMin : `${d.crewMin}–${d.crewMax}`}{d.waterLitres > 0 ? ` · ${d.waterLitres.toLocaleString()} L water` : ""}</p>
                      {d.kit.length > 0 && <div className={styles.kit}>{d.kit.map((k) => <span key={k}>{k}</span>)}</div>}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}
