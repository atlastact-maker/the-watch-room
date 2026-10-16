// The county's headline numbers and the station marks for the plate,
// counted from the same data the desk runs on. Called on the server
// (and by the dev harness), so the station tables never ship to the
// operator console's client bundle.

import { STATIONS, getStationAppliances } from "@/lib/sim/data";
import { SCENARIO_META } from "@/lib/sim/scenarios/meta";
import type { ServiceCode } from "@/lib/sim/types";
import type { PlateStation } from "./county-plate";
import type { CountyFacts } from "./menu-types";

export function countyFacts(): CountyFacts {
  const by = new Map<ServiceCode, { stations: number; appliances: number }>();
  for (const s of STATIONS) {
    if (s.virtual) continue;
    const row = by.get(s.service) ?? { stations: 0, appliances: 0 };
    row.stations += 1;
    row.appliances += getStationAppliances(s.id).length;
    by.set(s.service, row);
  }
  return {
    services: (["Fire", "Ambulance", "Police"] as ServiceCode[]).map((service) => ({ service, ...(by.get(service) ?? { stations: 0, appliances: 0 }) })),
    scenarios: SCENARIO_META.length,
  };
}

export function plateStations(): PlateStation[] {
  return STATIONS.filter((s) => !s.virtual).map((s) => ({ lat: s.coords.lat, lng: s.coords.lng, service: s.service }));
}
