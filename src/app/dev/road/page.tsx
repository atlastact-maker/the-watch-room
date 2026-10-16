"use client";

// Dev harness for a closed carriageway: the Mobilising screen's road
// banner and the cards' approach chips for the M60 RTC, and the county
// map with the closed section drawn — without a shift or a router. The
// section's lines are drawn straight between the junction anchors and the
// scene here; on the desk they come from the router.
//
//   ?closed=1   the carriageway shut at J17 (else lane 1 still runs)
//   ?auth=1     approaches against the flow authorised from the start
//
// Only served when the server was started with TWR_DEV_HARNESS=1.

import { useEffect, useState } from "react";
import "../../dashboard/vector/vector.css";
import { STATIONS, getStationAppliances } from "@/lib/sim/data";
import { SCENARIOS } from "@/lib/sim/scenarios";
import { trafficState } from "@/lib/sim/traffic";
import { BLUE_LIGHT_FACTOR, haversineMeters, rescaleBlueLightSeconds } from "@/lib/sim/eta";
import { comesFromDownstreamByPosition, isStopped, minutesBlocked, newSection, planApproach, type ClosedSection } from "@/lib/sim/road_closure";
import type { Incident, Task } from "@/lib/sim/incident_types";
import type { PdaRow, ResourceCard } from "../../dashboard/vector/dispatch-tiles";
import { MobScreen, type MobRoad } from "../../dashboard/vector/mob-screen";
import { EmbeddedMap } from "../../dashboard/components/map-panel";
import type { StationWithAppliances } from "../../dashboard/page";
import { typeChip } from "../../dashboard/vector/model";

function param(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

const FRONT: Record<string, string[]> = { Fire: ["WrL", "WrT", "L6P"], Police: ["Police_Response", "Police_RPU"], Ambulance: ["DCA"] };

export default function RoadHarness() {
  const [now, setNow] = useState(0);
  const [auth, setAuth] = useState(false);
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 1000);
    // The query string is read on the first tick, off the effect body.
    const first = setTimeout(() => {
      setAuth(param("auth") === "1");
      setClosed(param("closed") === "1");
      tick();
    }, 0);
    return () => { clearInterval(id); clearTimeout(first); };
  }, []);
  if (!now) return null;

  const scenario = SCENARIOS.find((s) => s.id === "03") ?? SCENARIOS[0];
  const cw = scenario.scene?.carriageway;
  const seed = cw ? newSection("inc-1", cw, scenario.location.coords) : null;
  if (!cw || !seed) return <div style={{ padding: 40 }}>Scenario 03 has no carriageway with junctions.</div>;
  const scene = scenario.location.coords;
  const section: ClosedSection = {
    ...seed,
    approach: [[seed.upstream.lat, seed.upstream.lng], [scene.lat, scene.lng]],
    approachMeters: haversineMeters(seed.upstream, scene) * 1.1,
    exit: [[scene.lat, scene.lng], [seed.downstream.lat, seed.downstream.lng]],
    exitMeters: haversineMeters(scene, seed.downstream) * 1.1,
    legalFromDownstreamSec: 480,
  };
  const tasks: Task[] = closed
    ? [{ id: "t-junction", applianceId: "rpu", kind: "carriageway_closure", state: "completed", startedAt: now - 600_000, durationSec: 420, completesAt: now - 180_000, assignedCrewIds: [], junction: cw.upstream } as unknown as Task]
    : [];
  const traffic = trafficState(cw, tasks, now, null);
  const incident: Incident = { id: "inc-1", scenarioId: scenario.id, scenario, receivedAt: now - 9 * 60_000 };
  const stations: StationWithAppliances[] = STATIONS.filter((s) => !s.virtual && s.service !== "Ambulance").map((s) => ({ ...s, appliances: getStationAppliances(s.id) }));

  // Cards priced off the crow-fly, the way the desk prices them before
  // the router answers; which side each comes from, from where it stands.
  const cards: ResourceCard[] = [];
  for (const st of stations) {
    for (const a of st.appliances) {
      if (!FRONT[st.service]?.includes(a.type)) continue;
      // A unit on the far side cannot drive the crow-fly line: its legal
      // way is round by J17, as the router would price it.
      const crow = (m: number) => (m * 1.3) / 13.4 * BLUE_LIGHT_FACTOR;
      const fromDownstream = comesFromDownstreamByPosition(st.coords, section);
      const toDown = crow(haversineMeters(st.coords, seed.downstream));
      const legal = fromDownstream ? toDown + crow(haversineMeters(seed.downstream, seed.upstream) + haversineMeters(seed.upstream, scene)) : crow(haversineMeters(st.coords, scene));
      const legalSec = Math.round(rescaleBlueLightSeconds(legal, a.type));
      const plan = planApproach({
        legalSec,
        toDownstreamSec: rescaleBlueLightSeconds(toDown, a.type),
        fromDownstream,
        section,
        traffic,
        authorised: auth,
        minutesSinceBlocked: minutesBlocked(incident.receivedAt, now),
      });
      cards.push({
        applianceId: a.id,
        stationId: st.id,
        callsign: a.callsign,
        service: a.service,
        typeCode: typeChip(a.type),
        typeName: a.typeName,
        station: st.name,
        crew: `${a.crew.current}/${a.crew.max}`,
        status: 7,
        etaSec: Math.round(plan.etaSec),
        etaEstimated: true,
        blocked: "",
        fit: "Extra attendance",
        compatibleSlotIds: [],
        cost: { text: "No cover impact", tone: "off" },
        deployed: false,
        approach: plan.kind === "direct" ? undefined : { kind: plan.kind, chip: plan.chip, tone: plan.tone, detail: plan.detail },
      });
    }
  }
  cards.sort((x, y) => (x.etaSec ?? 1e9) - (y.etaSec ?? 1e9));
  const pda: PdaRow[] = scenario.pda.map((s, i) => ({ n: i + 1, slotId: s.id, slot: s.label, applianceId: null, callsign: null, from: "", status: null, state: "Unfilled", etaSec: 0, why: "" }));
  const road: MobRoad = {
    name: cw.name,
    headline: traffic.headline,
    detail: traffic.detail,
    level: traffic.level,
    stopped: isStopped(traffic),
    upstream: cw.upstream,
    downstream: cw.downstream,
    authorised: auth,
    authorisedBy: auth ? "the desk" : null,
    offers: cards.filter((c) => c.approach?.kind === "contraflow_offer" || c.approach?.kind === "contraflow").length,
    using: 0,
  };
  return (
    <div className="cad-application" data-screen="mob" style={{ display: "grid", gridTemplateRows: "minmax(0, 1fr) 380px", height: "100vh" }}>
      <div style={{ minHeight: 0, overflow: "hidden", position: "relative" }}>
        <MobScreen
          head={{ ref: "GM-0001", title: scenario.title, address: scenario.location.address, postcode: scenario.location.postcode, severity: scenario.severity, latlng: `${scene.lat.toFixed(5)} N, ${Math.abs(scene.lng).toFixed(5)} W`, coords: scene, risks: scenario.property.knownHazards, typeLabel: "RTC · persons trapped" }}
          pda={pda}
          cards={cards}
          turnouts={[]}
          bays={[]}
          standby={[]}
          now={now}
          freeCount={cards.length}
          onMobilise={(id) => console.log("mobilise", id)}
          onStandDown={() => {}}
          onPick={() => {}}
          onFillRemaining={() => {}}
          onSendStandby={() => {}}
          onOpenBays={() => {}}
          onTrack={() => {}}
          road={road}
          onSetContraflow={(on) => setAuth(on)}
        />
      </div>
      <div style={{ position: "relative", borderTop: "1px solid var(--vec-border)" }} data-testid="county-map">
        <EmbeddedMap
          stations={stations}
          activeIncident={incident}
          deployments={[]}
          patch="GreaterManchester"
          onSelectAppliance={() => {}}
          showBasemapToggle={false}
          closures={[{ id: incident.id, name: section.name, level: traffic.level, stopped: isStopped(traffic), approach: section.approach, exit: section.exit, upstream: section.upstream, downstream: section.downstream, contraflow: auth, headline: traffic.headline }]}
          focus={{ lat: scene.lat, lng: scene.lng, zoom: 13, key: 1 }}
        />
        <div style={{ position: "absolute", top: 8, left: 8, zIndex: 1000, display: "flex", gap: 6 }}>
          <button type="button" className="vec-btn mini" onClick={() => setClosed((c) => !c)}>{closed ? "Reopen at J17" : "Close at J17"}</button>
          <button type="button" className="vec-btn mini" onClick={() => setAuth((a) => !a)}>{auth ? "Withdraw contraflow" : "Authorise contraflow"}</button>
        </div>
      </div>
    </div>
  );
}
