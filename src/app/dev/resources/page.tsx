"use client";

// Dev harness for the Resources screen: the county's stations with a
// fixture board — a few units committed, one station emptied, a cover
// move under way — so the screen can be looked at without a shift.
// Only served when the server was started with TWR_DEV_HARNESS=1.

import { useEffect, useMemo, useState } from "react";
import "../../dashboard/vector/vector.css";
import { STATIONS, getStationAppliances } from "@/lib/sim/data";
import type { Deployment } from "@/lib/sim/incident_types";
import type { StandbyMove } from "@/lib/sim/standby";
import { standbyPosition } from "@/lib/sim/standby";
import { ResourcesScreen } from "../../dashboard/vector/resources-screen";
import { buildResourcePicture, FRONT_LINE } from "../../dashboard/vector/resources-model";
import type { StationWithAppliances } from "../../dashboard/page";

export default function ResourcesHarness() {
  const [moves, setMoves] = useState<Record<string, StandbyMove>>({});
  const [moveCount, setMoveCount] = useState(0);
  // The clock, ticked from an effect so nothing impure runs in render.
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 1000);
    const first = setTimeout(tick, 0);
    return () => { clearInterval(id); clearTimeout(first); };
  }, []);
  const stations = useMemo<StationWithAppliances[]>(() => STATIONS.map((s) => ({ ...s, appliances: getStationAppliances(s.id) })), []);
  // Empty a few stations by committing their front line; the timestamps
  // hang off the clock so the fixture reads the same on every tick.
  const empties = stations.filter((s) => !s.virtual && s.appliances.some((a) => FRONT_LINE[s.service].includes(a.type))).filter((s, i) => (s.service === "Fire" && i % 9 === 0) || (s.service === "Ambulance" && i % 13 === 0)).slice(0, 4);
  const deployments: Deployment[] = empties.flatMap((s) => s.appliances.filter((a) => FRONT_LINE[s.service].includes(a.type)).map((a) => ({ id: `dep-${a.id}`, incidentId: "inc-1", applianceId: a.id, slotId: "x", mobilisedAt: now - 20 * 60_000, etaSeconds: 300, arrivesAt: now - 15 * 60_000 }) as unknown as Deployment));
  const coverSince: Record<string, number> = Object.fromEntries(buildResourcePicture({ stations, deployments, standbyMoves: {}, now }).gaps.map((g) => [g.stationId, now - 12 * 60_000]));
  if (!now) return null;
  const picture = buildResourcePicture({ stations, deployments, standbyMoves: moves, now, coverSince, positionOf: (m) => standbyPosition(m, now) });
  const send = (applianceId: string, stationId: string, reason: string) => {
    const home = stations.find((s) => s.appliances.some((a) => a.id === applianceId));
    const dest = stations.find((s) => s.id === stationId);
    if (!home || !dest) return;
    const startedAt = Date.now();
    setMoves((prev) => ({ ...prev, [applianceId]: { applianceId, fromStationId: home.id, home: home.coords, from: home.coords, to: { stationId: dest.id, lat: dest.coords.lat, lng: dest.coords.lng, label: dest.name }, startedAt, arrivesAt: startedAt + 8 * 60_000, reason } }));
    setMoveCount((n) => n + 1);
  };
  return (
    <div className="cad-application" data-screen="resources">
      <ResourcesScreen
        picture={picture}
        now={now}
        covered={["Fire", "Ambulance", "Police"]}
        stats={{ moves: moveCount, gapMinutes: 12 * picture.gaps.length }}
        onSendStandby={(id) => { const s = picture.suggestions.find((x) => x.id === id); if (s) send(s.applianceId, s.toStationId, s.reason); }}
        onMoveToStandby={(applianceId, stationId) => send(applianceId, stationId, "Sent by the desk")}
        onRecallStandby={(applianceId) => setMoves((prev) => { const m = prev[applianceId]; if (!m) return prev; return { ...prev, [applianceId]: { ...m, recalledAt: Date.now(), recalledFrom: { lat: m.to.lat, lng: m.to.lng }, homeArrivesAt: Date.now() + 6 * 60_000 } }; })}
        onPick={(id) => console.log("pick", id)}
        onOpenBays={(id) => console.log("bays", id)}
      />
    </div>
  );
}
