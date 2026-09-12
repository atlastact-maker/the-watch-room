"use client";

// The desk model — everything the VECTOR tiles and screens show, computed
// from the simulator's own state. One hook, one place to read how a row
// on the board is derived from a deployment, a station or a call.

import { useMemo } from "react";
import type { Deployment, Incident, IncidentOutcome, LogEntry, PdaSlot, Scenario } from "@/lib/sim/incident_types";
import type { Appliance, ApplianceTypeCode, AreaCode, ServiceCode, StatusCode } from "@/lib/sim/types";
import { STATUS_LABELS } from "@/lib/sim/types";
import type { Handover } from "@/lib/sim/handover";
import { slotCoverage } from "@/lib/sim/handover";
import { STANDARD_PDA, labelForType } from "@/lib/sim/pda";
import { HOSPITALS, hasEd24, traumaTier } from "@/lib/sim/hospitals";
import { haversineMeters, rescaleBlueLightSeconds } from "@/lib/sim/eta";
import type { StationWithAppliances } from "../page";
import type { Eta } from "../components/deployment-board";
import type { PendingCall } from "../components/call-stack";
import type { CallRow, CoverRow, HospitalRow, IncidentDetail, IncidentRow, PdaRow, ResourceCard, SceneUnitRow, StandbyRow } from "./dispatch-tiles";
import type { BayRow, MobHead, TurnoutRow } from "./mob-screen";
import { gradeShort, impliedGrade, incidentRef, scenarioService, shortAddress, typeChip, waitState } from "./model";

export type RuntimeLike = {
  outcome: IncidentOutcome | null;
  handover: Handover | null;
  informantLog: { id: string; text: string; tone: "info" | "urgent" | "critical"; firedAt: number }[];
  informantOnCall: boolean;
};

export type DeskInput = {
  incidents: Incident[];
  selectedIncidentId: string | null;
  runtimes: Record<string, RuntimeLike | undefined>;
  deployments: Deployment[];
  applianceById: Map<string, Appliance>;
  stations: StationWithAppliances[];
  etas: Record<string, Eta>;
  now: number;
  pendingCalls: PendingCall[];
  log: LogEntry[];
  coveredServices: ServiceCode[];
  standbySent: Record<string, boolean>;
  commandOptionsFor: (incidentId: string) => { applianceId: string; callsign: string; typeName: string; advice?: string; comfortable?: boolean }[];
  /** Attendance slots added by assistance messages, by incident. */
  extraSlots?: Record<string, PdaSlot[]>;
};

const PUMP_TYPES: ApplianceTypeCode[] = ["WrL", "WrT", "L6P"];
const AREA_LABEL: Record<AreaCode, string> = { Southern: "South", Eastern: "East", Western: "West", ForceWide: "Force-wide" };

function pdaSlotsFor(inc: Incident, extra?: PdaSlot[]): PdaSlot[] {
  const base = STANDARD_PDA[inc.scenario.type]?.slots ?? inc.scenario.pda;
  return extra && extra.length ? [...base, ...extra] : base;
}

function isFree(a: Appliance): boolean {
  return (a.status === 7 || a.status === 6) && a.crew.current >= a.crew.min;
}

export function useDeskModel(input: DeskInput) {
  const { incidents, selectedIncidentId, runtimes, deployments, applianceById, stations, etas, now, pendingCalls, log, coveredServices, standbySent, commandOptionsFor, extraSlots } = input;

  const stationById = useMemo(() => new Map(stations.map((s) => [s.id, s])), [stations]);
  const stationOf = (a: Appliance) => stationById.get(a.stationId);
  const selected = incidents.find((i) => i.id === selectedIncidentId) ?? null;
  const refOf = (i: Incident) => incidentRef(i);

  /* ---- calls ---- */
  const calls: CallRow[] = pendingCalls.map((c) => {
    const waited = Math.max(0, (now - c.receivedAt) / 1000);
    const dup = incidents.find((i) => !runtimes[i.id]?.outcome && i.scenario.location.address === c.scenario.location.address);
    return {
      id: c.id,
      service: scenarioService(c.scenario),
      grade: gradeShort(impliedGrade(c.scenario)),
      standardMinutes: impliedGrade(c.scenario)?.standardMinutes ?? null,
      title: c.scenario.title,
      address: c.scenario.location.address,
      waitedSec: waited,
      state: waitState(waited, impliedGrade(c.scenario)),
      duplicateOf: dup ? refOf(dup) : null,
      disposalBasis: c.scenario.disposal?.basis ?? null,
    };
  });

  /* ---- attendance per incident ---- */
  function coverage(inc: Incident) {
    const deps = deployments.filter((d) => d.incidentId === inc.id);
    return slotCoverage(inc, deps, pdaSlotsFor(inc, extraSlots?.[inc.id]), (id) => applianceById.get(id)?.type);
  }

  function pdaRowsFor(inc: Incident | null): PdaRow[] {
    if (!inc) return [];
    const deps = deployments.filter((d) => d.incidentId === inc.id);
    return coverage(inc).map((c, i) => {
      const ap = c.applianceId ? applianceById.get(c.applianceId) : undefined;
      const d = c.applianceId ? deps.find((x) => x.applianceId === c.applianceId) : undefined;
      const onScene = d ? now >= d.arrivesAt : false;
      const anyFree = [...applianceById.values()].some((a) => isFree(a) && c.slot.requiredApplianceTypes.includes(a.type) && !deployments.some((x) => x.applianceId === a.id));
      return {
        n: i + 1,
        slotId: c.slot.id,
        slot: c.slot.label,
        applianceId: c.applianceId,
        callsign: ap?.callsign ?? null,
        from: ap ? stationOf(ap)?.name ?? ap.stationId : "—",
        status: ap ? ap.status : null,
        state: ap ? (onScene ? "In attendance" : "Mobile to incident") : "Slot unfilled",
        etaSec: d && !onScene ? Math.max(0, Math.round((d.arrivesAt - now) / 1000)) : 0,
        why: ap ? "" : anyFree ? "Not yet allocated" : `No ${c.slot.requiredApplianceTypes.join("/")} free`,
      };
    });
  }

  /* ---- live incidents ---- */
  const incidentRows: IncidentRow[] = incidents.map((i) => {
    const rt = runtimes[i.id];
    const deps = deployments.filter((d) => d.incidentId === i.id);
    const cov = coverage(i);
    const h = rt?.handover ?? null;
    return {
      id: i.id,
      ref: refOf(i),
      title: i.scenario.title,
      address: i.scenario.location.address,
      severity: i.scenario.severity,
      elapsedMs: now - i.receivedAt,
      required: cov.length,
      allocated: cov.filter((c) => c.applianceId).length,
      mobile: deps.filter((d) => now < d.arrivesAt).length,
      scene: deps.filter((d) => now >= d.arrivesAt && !d.returnStartedAt && !d.hospitalLegStartedAt).length,
      resolved: !!rt?.outcome,
      command: h ? { callsign: h.callsign, label: now < h.effectiveAtMs ? "designated — takes command on arrival" : "has command · desk clear" } : null,
      commandOptions: rt?.outcome || h ? [] : commandOptionsFor(i.id),
      selected: i.id === selectedIncidentId,
      grade: gradeShort(impliedGrade(i.scenario)),
    };
  });

  /* ---- selected incident detail ---- */
  const detail: IncidentDetail | null = selected
    ? (() => {
        const s = selected.scenario;
        const rt = runtimes[selected.id];
        const addr = shortAddress(s.location.address);
        const lastLog = log.length ? log[log.length - 1].timestamp : selected.receivedAt;
        return {
          ref: refOf(selected),
          title: s.title,
          state: rt?.outcome ? "CLOSED" : rt?.handover ? "DELEGATED" : "OPEN",
          elapsedMs: now - selected.receivedAt,
          sinceUpdateMs: now - lastLog,
          address1: addr.line1,
          address2: addr.line2,
          postcode: s.location.postcode,
          latlng: `${s.location.coords.lat.toFixed(5)} N, ${Math.abs(s.location.coords.lng).toFixed(5)} W`,
          property: [s.property.class, s.property.size, s.property.materials].filter(Boolean).join(" · "),
          access: s.property.access,
          caller: s.trigger,
          callerFlag: s.methane.N || "",
          risks: [...s.property.knownHazards, ...s.pri.items].slice(0, 6),
          informant: (rt?.informantLog ?? []).map((m) => ({ id: m.id, text: m.text, tone: m.tone, at: m.firedAt })),
          onCall: !!rt?.informantOnCall,
        };
      })()
    : null;

  /* ---- scene units ---- */
  const sceneUnits: SceneUnitRow[] = selected
    ? deployments
        .filter((d) => d.incidentId === selected.id && !d.returnStartedAt)
        .map((d) => {
          const a = applianceById.get(d.applianceId);
          const onScene = now >= d.arrivesAt && !d.hospitalLegStartedAt;
          return {
            applianceId: d.applianceId,
            callsign: a?.callsign ?? d.applianceId,
            service: a?.service ?? "Fire",
            status: (a?.status ?? 1) as StatusCode,
            state: STATUS_LABELS[(a?.status ?? 1) as StatusCode],
            placed: !!d.parkingPos,
            etaSec: Math.max(0, Math.round((d.arrivesAt - now) / 1000)),
            onScene,
          };
        })
    : [];

  /* ---- resource cards ---- */
  const unfilledSlots = selected ? coverage(selected).filter((c) => !c.applianceId).map((c) => c.slot) : [];
  const areaFree: Record<string, number> = {};
  for (const st of stations) {
    if (st.service !== "Fire") continue;
    areaFree[st.area] = (areaFree[st.area] ?? 0) + st.appliances.filter((a) => PUMP_TYPES.includes(a.type) && isFree(a) && !deployments.some((d) => d.applianceId === a.id)).length;
  }
  const cards: ResourceCard[] = [];
  for (const st of stations) {
    const stationFreePumps = st.appliances.filter((a) => PUMP_TYPES.includes(a.type) && isFree(a) && !deployments.some((d) => d.applianceId === a.id)).length;
    for (const a of st.appliances) {
      const dep = deployments.find((d) => d.applianceId === a.id);
      const depInc = dep ? incidents.find((i) => i.id === dep.incidentId) : undefined;
      const onThis = !!dep && !!selected && dep.incidentId === selected.id;
      let blocked = "";
      let fit = "";
      if (!selected) blocked = "Select an incident to allocate";
      else if (onThis) blocked = "Already committed to this incident";
      else if (dep) blocked = `Committed to ${depInc ? refOf(depInc) : "another incident"}`;
      else if (!coveredServices.includes(a.service)) blocked = "Not covered from this position";
      else if (a.status === 8) blocked = `Off the run${a.note ? ` — ${a.note}` : ""}`;
      else if (a.crew.current < a.crew.min) blocked = `Under complement — crew ${a.crew.current}/${a.crew.min}`;
      else if (a.status !== 7 && a.status !== 6) blocked = `Not available — ${STATUS_LABELS[a.status]}`;
      else {
        const slot = unfilledSlots.find((s) => s.requiredApplianceTypes.includes(a.type));
        fit = slot ? `Fills ${slot.label}` : unfilledSlots.length ? "Nothing outstanding needs this type — extra attendance" : "Attendance complete — extra attendance";
      }
      const eta = etas[st.id];
      // Before the router answers, a crow-fly estimate — flagged as such.
      const baseSec = eta ? eta.seconds : selected ? (haversineMeters(st.coords, selected.scenario.location.coords) * 1.3) / 13.4 * 0.65 : null;
      const etaSec = baseSec !== null ? Math.round(rescaleBlueLightSeconds(baseSec, a.type)) : null;
      const pump = PUMP_TYPES.includes(a.type);
      const cost: ResourceCard["cost"] =
        pump && stationFreePumps === 1 && !dep && isFree(a)
          ? { text: `Empties ${st.name}`, tone: "stop" }
          : pump && (areaFree[st.area] ?? 0) <= 1
            ? { text: `Last pump in ${AREA_LABEL[st.area]}`, tone: "stop" }
            : etaSec !== null && etaSec > 900
              ? { text: "Long travel", tone: "warn" }
              : { text: "No cover impact", tone: "off" };
      cards.push({
        applianceId: a.id,
        stationId: st.id,
        callsign: a.callsign,
        service: a.service,
        typeCode: typeChip(a.type),
        typeName: a.typeName,
        station: st.name,
        crew: `${a.crew.current}/${a.crew.max}`,
        status: a.status,
        etaSec,
        etaEstimated: !eta || eta.source === "fallback",
        blocked,
        fit,
        compatibleSlotIds: unfilledSlots.filter((s) => s.requiredApplianceTypes.includes(a.type)).map((s) => s.id),
        cost,
        deployed: onThis,
      });
    }
  }
  cards.sort((x, y) => Number(!!x.blocked) - Number(!!y.blocked) || (x.etaSec ?? 1e9) - (y.etaSec ?? 1e9) || x.callsign.localeCompare(y.callsign));
  const freeCount = cards.filter((c) => (c.status === 7 || c.status === 6) && !deployments.some((d) => d.applianceId === c.applianceId)).length;

  /* ---- county cover ---- */
  const cover: CoverRow[] = (["Southern", "Eastern", "Western"] as AreaCode[]).map((area) => {
    const sts = stations.filter((s) => s.service === "Fire" && s.area === area);
    const pumps = sts.flatMap((s) => s.appliances.filter((a) => PUMP_TYPES.includes(a.type)));
    return {
      area: `${AREA_LABEL[area]} · fire`,
      detail: sts.slice(0, 5).map((s) => s.name).join(", ") + (sts.length > 5 ? "…" : ""),
      free: pumps.filter((a) => isFree(a) && !deployments.some((d) => d.applianceId === a.id)).length,
      of: pumps.length,
    };
  });
  for (const [svc, types, label] of [
    ["Ambulance", ["DCA", "RRV"], "Ambulance · DCA / RRV"],
    ["Police", ["Police_Response", "Police_ARV", "Police_RPU"], "Police · response"],
  ] as [ServiceCode, ApplianceTypeCode[], string][]) {
    const units = stations.filter((s) => s.service === svc).flatMap((s) => s.appliances.filter((a) => types.includes(a.type)));
    if (units.length === 0) continue;
    cover.push({
      area: label,
      detail: "County-wide",
      free: units.filter((a) => isFree(a) && !deployments.some((d) => d.applianceId === a.id)).length,
      of: units.length,
    });
  }

  /* ---- standby moves ---- */
  const standby: StandbyRow[] = [];
  for (const st of stations) {
    if (st.service !== "Fire") continue;
    const pumps = st.appliances.filter((a) => PUMP_TYPES.includes(a.type));
    if (pumps.length === 0) continue;
    const inBay = pumps.filter((a) => isFree(a) && !deployments.some((d) => d.applianceId === a.id));
    if (inBay.length > 0) continue;
    const donors = stations
      .filter((s) => s.service === "Fire" && s.id !== st.id)
      .map((s) => ({
        s,
        free: s.appliances.filter((a) => PUMP_TYPES.includes(a.type) && isFree(a) && !deployments.some((d) => d.applianceId === a.id)),
        dist: haversineMeters(s.coords, st.coords),
      }))
      .filter((d) => d.free.length >= 2)
      .sort((a, b) => a.dist - b.dist);
    const donor = donors[0];
    if (!donor) continue;
    const unit = donor.free[donor.free.length - 1];
    const id = `${unit.id}->${st.id}`;
    const committed = pumps.map((a) => a.callsign).join(" and ");
    standby.push({
      id,
      callsign: unit.callsign,
      from: donor.s.name,
      to: st.name,
      travel: `${Math.max(2, Math.round(donor.dist / 1000 / 40 * 60))}m`,
      reason: `Covers ${st.name} while ${committed} ${pumps.length === 1 ? "is" : "are"} committed`,
      sent: !!standbySent[id],
    });
    if (standby.length >= 4) break;
  }

  /* ---- hospitals ---- */
  const origin = selected ? selected.scenario.location.coords : { lat: 53.48, lng: -2.24 };
  const hospitals: HospitalRow[] = HOSPITALS.filter((h) => h.inPatch)
    .map((h) => ({
      id: h.id,
      name: h.name,
      town: h.town,
      postcode: h.postcode,
      distKm: haversineMeters(origin, h.coords) / 1000,
      ed: hasEd24(h) ? "24h" : h.ed.value ? "limited" : "no ED",
      trauma: (() => {
        const t = traumaTier(h);
        return t === "mtc_adult" ? "MTC" : t === "mtc_paediatric" ? "MTC · paeds" : t === "trauma_unit" ? "TU" : t === "local_emergency" ? "LEH" : "—";
      })(),
      helipad: h.helipad.value?.present === "yes",
    }))
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 8);

  /* ---- mobilising ---- */
  const mobHead: MobHead | null = selected
    ? {
        ref: refOf(selected),
        title: selected.scenario.title,
        address: selected.scenario.location.address,
        postcode: selected.scenario.location.postcode,
        severity: selected.scenario.severity,
        latlng: `${selected.scenario.location.coords.lat.toFixed(5)} N, ${Math.abs(selected.scenario.location.coords.lng).toFixed(5)} W`,
        risks: selected.scenario.property.knownHazards,
        typeLabel: labelForType(selected.scenario.type),
      }
    : null;
  const turnouts: TurnoutRow[] = selected
    ? deployments
        .filter((d) => d.incidentId === selected.id && !d.returnStartedAt)
        .sort((a, b) => a.mobilisedAt - b.mobilisedAt)
        .map((d) => {
          const a = applianceById.get(d.applianceId);
          return {
            applianceId: d.applianceId,
            callsign: a?.callsign ?? d.applianceId,
            service: a?.service ?? "Fire",
            station: a ? stationOf(a)?.name ?? a.stationId : "",
            mobilisedAt: d.mobilisedAt,
            arrivesAt: d.arrivesAt,
            status: (a?.status ?? 1) as StatusCode,
            state: STATUS_LABELS[(a?.status ?? 1) as StatusCode],
            turnoutSec: null,
          };
        })
    : [];
  const bays: BayRow[] = stations
    .filter((s) => s.appliances.length > 0 && !s.virtual)
    .map((s) => ({
      stationId: s.id,
      id: s.id,
      name: s.name,
      service: s.service,
      units: s.appliances.map((a) => ({
        applianceId: a.id,
        callsign: a.callsign,
        state: a.status === 8 ? "off" : a.status === 7 && !deployments.some((d) => d.applianceId === a.id) ? "in" : "out",
      })),
    }));

  const unfilledTotal = incidents.reduce((n, i) => (runtimes[i.id]?.outcome ? n : n + coverage(i).filter((c) => !c.applianceId).length), 0);
  const focusUnits = selected
    ? deployments
        .filter((d) => d.incidentId === selected.id && !d.returnStartedAt)
        .map((d) => {
          const a = applianceById.get(d.applianceId);
          const onScene = now >= d.arrivesAt;
          return { id: d.applianceId, label: `${a?.callsign ?? d.applianceId} · ${onScene ? "In attendance" : "Mobile"}` };
        })
    : [];

  return {
    selected,
    calls,
    incidentRows,
    detail,
    sceneUnits,
    pda: pdaRowsFor(selected),
    pdaRowsFor,
    cards,
    freeCount,
    cover,
    standby,
    hospitals,
    mobHead,
    turnouts,
    bays,
    unfilledTotal,
    focusUnits,
    refOf,
  };
}

export type DeskModel = ReturnType<typeof useDeskModel>;

/** Nearest suitable free unit for each unfilled slot — the "Fill
 *  remaining" order. Returns the units to send, in slot order. */
export function proposeFill(model: DeskModel, scenario: Scenario | undefined): { applianceId: string; stationId: string; slotId: string }[] {
  void scenario;
  const picks: { applianceId: string; stationId: string; slotId: string }[] = [];
  const used = new Set<string>();
  for (const row of model.pda) {
    if (row.callsign) continue;
    const c = model.cards.find((k) => !k.blocked && !used.has(k.applianceId) && k.compatibleSlotIds.includes(row.slotId));
    if (c) {
      used.add(c.applianceId);
      picks.push({ applianceId: c.applianceId, stationId: c.stationId, slotId: row.slotId });
    }
  }
  return picks;
}
