// Pre-determined attendance: what the mobilising system sends by default
// to an incident of a given type, before anyone has thought about it.
//
// Two layers. Each scenario carries its own authored attendance
// (Scenario.pda) — the slots that job needs, with notes. Underneath it
// sits a STANDARD attendance per incident type, the way a real CAD holds
// one PDA matrix and proposes it the moment the incident type is keyed.
// Until the sourced tables in data/research/fire/pda.md are transcribed,
// the standard is seeded from the scenarios' own attendances and tagged
// as such — nothing here claims to be a GMFRS figure that is not.
//
// pdaFillState() says which slots are covered by what has been sent;
// proposePda() picks the nearest available unit for each empty slot, so
// the operator can accept the whole attendance in one action or take
// the proposals one at a time.

import type { ApplianceTypeCode } from "./types";
import type { Deployment, Incident, IncidentTypeCode, PdaSlot, Scenario } from "./incident_types";
import { SCENARIOS } from "./scenarios";
import type { StationWithAppliances } from "@/app/dashboard/page";
import { STANDARD_PDA_TEMPLATES, type PdaSource, type PdaTemplate } from "./pda-standard";

export type { PdaSource, PdaTemplate };

/** The standard attendance per incident type: the transcribed, sourced
 *  template from data/research/fire/pda.md where there is one, and the
 *  scenario's own authored slots as a fallback for any type without. */
export const STANDARD_PDA: Partial<Record<IncidentTypeCode, PdaTemplate>> = (() => {
  const out: Partial<Record<IncidentTypeCode, PdaTemplate>> = { ...STANDARD_PDA_TEMPLATES };
  for (const sc of SCENARIOS as Scenario[]) {
    if (out[sc.type]) continue;
    out[sc.type] = {
      type: sc.type,
      label: labelForType(sc.type),
      slots: sc.pda,
      source: "scenario",
      basis: [`Seeded from the authored attendance for "${sc.title}" — no sourced table for this type yet.`],
    };
  }
  return out;
})();

export function labelForType(t: IncidentTypeCode): string {
  switch (t) {
    case "automatic_fire_alarm":
      return "Automatic fire alarm";
    case "dwelling_fire_persons_reported":
      return "Dwelling fire, persons reported";
    case "rtc_entrapment":
      return "RTC, persons trapped";
    case "industrial_fire":
      return "Industrial / commercial fire";
    case "wildfire_moorland":
      return "Moorland / wildfire";
    case "hazmat_chemical_leak":
      return "Hazmat — chemical release";
    case "high_rise_dwelling_fire":
      return "High-rise dwelling fire";
    case "education_premises_fire":
      return "Education premises fire";
    case "special_service_water_rescue":
      return "Water rescue";
    case "healthcare_premises_fire_alarm":
      return "Healthcare premises fire alarm";
    case "police_firearms_incident":
      return "Firearms incident (police-led)";
    case "ambulance_cardiac_arrest":
      return "Cardiac arrest (ambulance-led)";
    default:
      return String(t).replace(/_/g, " ");
  }
}

// ---------------------------------------------------------------------------
// Fill state
// ---------------------------------------------------------------------------

export type SlotFill = {
  slot: PdaSlot;
  /** The appliance covering this slot, if any. */
  applianceId?: string;
  callsign?: string;
};

/** Which slots of the incident's attendance are covered by what has been
 *  sent. Greedy: each sent unit covers the first still-empty slot whose
 *  required types include it, in slot order — so a second pump fills
 *  "Pump 2", not "Pump 1" again. Units that fit no slot are extras. */
export function pdaFillState(
  incident: Incident,
  deployments: Deployment[],
  stations: StationWithAppliances[],
  slots: PdaSlot[] = incident.scenario.pda,
): { fills: SlotFill[]; extras: string[] } {
  const byId = new Map<string, { type: ApplianceTypeCode; callsign: string }>();
  for (const s of stations) for (const a of s.appliances) byId.set(a.id, { type: a.type, callsign: a.callsign });

  const fills: SlotFill[] = slots.map((slot) => ({ slot }));
  const extras: string[] = [];
  for (const d of deployments) {
    if (d.incidentId !== incident.id) continue;
    const a = byId.get(d.applianceId);
    if (!a) continue;
    const empty = fills.find((f) => !f.applianceId && f.slot.requiredApplianceTypes.includes(a.type));
    if (empty) {
      empty.applianceId = d.applianceId;
      empty.callsign = a.callsign;
    } else {
      extras.push(a.callsign);
    }
  }
  return { fills, extras };
}

// ---------------------------------------------------------------------------
// Proposal
// ---------------------------------------------------------------------------

export type PdaProposal = {
  slot: PdaSlot;
  applianceId: string;
  callsign: string;
  stationId: string;
  stationName: string;
  etaSeconds: number;
  routeMeters?: number;
  routeCoords?: [number, number][];
};

/** For each empty slot, the nearest available unit of a required type —
 *  available meaning on the run (status 7), crewed to its minimum, and
 *  not already sent to this or any other job. Slots the fleet cannot
 *  cover right now are returned in `uncovered`. */
export function proposePda(
  incident: Incident,
  deployments: Deployment[],
  stations: StationWithAppliances[],
  etas: Record<string, { seconds: number; meters: number; coords: [number, number][] | null }>,
  slots: PdaSlot[] = incident.scenario.pda,
): { proposals: PdaProposal[]; uncovered: PdaSlot[] } {
  const { fills } = pdaFillState(incident, deployments, stations, slots);
  const used = new Set(deployments.map((d) => d.applianceId));
  const proposals: PdaProposal[] = [];
  const uncovered: PdaSlot[] = [];

  for (const f of fills) {
    if (f.applianceId) continue;
    let best: PdaProposal | null = null;
    for (const s of stations) {
      const eta = etas[s.id];
      if (!eta) continue;
      // A preferred station wins outright if it can cover the slot.
      for (const a of s.appliances) {
        if (used.has(a.id)) continue;
        if (!f.slot.requiredApplianceTypes.includes(a.type)) continue;
        if (a.status !== 7 || a.crew.current < a.crew.min) continue;
        const preferred = f.slot.preferredStationId === s.id;
        const candidate: PdaProposal = {
          slot: f.slot,
          applianceId: a.id,
          callsign: a.callsign,
          stationId: s.id,
          stationName: s.name,
          etaSeconds: eta.seconds,
          routeMeters: eta.meters,
          routeCoords: eta.coords ?? undefined,
        };
        if (
          !best ||
          (preferred && best.stationId !== f.slot.preferredStationId) ||
          (best.stationId !== f.slot.preferredStationId && candidate.etaSeconds < best.etaSeconds)
        ) {
          best = candidate;
        }
      }
    }
    if (best) {
      proposals.push(best);
      used.add(best.applianceId);
    } else {
      uncovered.push(f.slot);
    }
  }
  return { proposals, uncovered };
}
