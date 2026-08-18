// Realistic mitigation options per hazard kind, used by both the right-rail
// action panel and the in-map hazard popup.

export type MitigationOption = {
  method: string;
  durationSec: number;
  needsBA?: boolean;
};

export const MITIGATION_OPTIONS: Record<string, MitigationOption[]> = {
  gas: [
    { method: "Isolate at meter (BA)", durationSec: 90, needsBA: true },
    { method: "Notify Cadent emergency line", durationSec: 30 },
    { method: "Evacuate gas-risk zone (50 m)", durationSec: 180 },
  ],
  electrical: [
    { method: "Isolate at consumer unit", durationSec: 60 },
    { method: "Request DNO isolation (3rd party)", durationSec: 600 },
    { method: "CO₂ / dry powder only — no water", durationSec: 30 },
  ],
  cylinders: [
    { method: "Cool with water (continuous)", durationSec: 600 },
    { method: "Move to safe distance", durationSec: 240 },
    { method: "200 m BLEVE cordon + withdraw", durationSec: 60 },
  ],
  chemical: [
    { method: "EPU bunding + drain mats", durationSec: 300 },
    { method: "Foam blanket (BFU)", durationSec: 240 },
    { method: "Vapour suppression mist", durationSec: 180 },
  ],
  structural: [
    { method: "USAR shoring", durationSec: 900 },
    { method: "Withdraw to safe distance + cordon", durationSec: 60 },
    { method: "Cordon + LA demolition request", durationSec: 300 },
  ],
};

export function mitigationOptionsFor(kind: string): MitigationOption[] {
  return MITIGATION_OPTIONS[kind] ?? [{ method: "Mitigate", durationSec: 180 }];
}
