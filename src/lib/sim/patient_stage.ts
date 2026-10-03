// THE PATIENT'S STAGE. Where this patient is on the arc from found to
// handed over, the way the fireground has its development stages. The
// clinical part is read off NEWS2 and the resuscitation record; the
// logistics part off the treatment record and the casualty's progression.
// One place decides it, so the board, the alerts and the sound agree.

import type { PatientTreatmentState } from "./incident_types";
import type { ResusState } from "./resus";
import type { CasualtyStage } from "./incident_sim";
import type { News2 } from "./news2";

export type PatientStageKey =
  | "unassessed"
  | "stable"
  | "deteriorating"
  | "peri_arrest"
  | "arrest"
  | "rosc"
  | "packaged"
  | "en_route"
  | "handed_over"
  | "life_extinct";

export type Tone = "go" | "warn" | "stop" | "";

export type PatientStage = {
  key: PatientStageKey;
  label: string;
  /** One line under the label: why, and what it asks for. */
  detail: string;
  tone: Tone;
  /** Index on the track, or -1 for the two off-track states. */
  index: number;
};

/** The track as drawn: the clinical arc, then the logistics. */
export const PATIENT_TRACK: { key: PatientStageKey; label: string; short: string }[] = [
  { key: "stable", label: "Stable", short: "Stable" },
  { key: "deteriorating", label: "Deteriorating", short: "Worsening" },
  { key: "peri_arrest", label: "Peri-arrest", short: "Peri-arr." },
  { key: "arrest", label: "Cardiac arrest", short: "Arrest" },
  { key: "rosc", label: "ROSC", short: "ROSC" },
  { key: "packaged", label: "Packaged", short: "Packaged" },
  { key: "en_route", label: "En route", short: "En route" },
];

export type PatientStageInput = {
  tx: PatientTreatmentState | null | undefined;
  resus?: ResusState;
  progression: CasualtyStage;
  score: News2 | null;
  /** NEWS2 total five minutes ago, when known — a rising score is
   *  deterioration before the band says so. */
  scoreBefore?: number | null;
  now: number;
};

const idx = (k: PatientStageKey) => PATIENT_TRACK.findIndex((s) => s.key === k);

export function patientStage(i: PatientStageInput): PatientStage {
  const { tx, resus, progression, score } = i;
  const arrestOn = !!resus && resus.roscAt === undefined && resus.roleAt === undefined;

  if (progression === "expectant" || resus?.roleAt !== undefined) {
    return { key: "life_extinct", label: "Life extinct", detail: resus?.roleAt !== undefined ? "Resuscitation stopped — the scene is the police's now" : "Expectant — beyond what the scene can do", tone: "stop", index: -1 };
  }
  if (arrestOn) {
    const cycle = resus!.cycle + 1;
    const noOne = resus!.cyclePausedAt !== undefined;
    return { key: "arrest", label: "Cardiac arrest", detail: noOne ? `Cycle ${cycle} · nobody on the chest` : `Cycle ${cycle} · ${resus!.shocks} shock${resus!.shocks === 1 ? "" : "s"} · ${resus!.adrenalineDoses} adrenaline`, tone: "stop", index: idx("arrest") };
  }
  if (progression === "at_hospital") return { key: "handed_over", label: "Handed over", detail: tx?.chosenDestination ? `At ${tx.chosenDestination.name}` : "At hospital", tone: "go", index: PATIENT_TRACK.length };
  if (progression === "conveying") return { key: "en_route", label: "En route", detail: tx?.chosenDestination ? `To ${tx.chosenDestination.name}${tx.atmistSentAt ? " · pre-alerted" : " · no pre-alert"}` : "Destination not recorded", tone: resus?.roscAt !== undefined ? "warn" : "go", index: idx("en_route") };

  const packaged = progression === "extricated" || (tx && Object.keys(tx.egress).length > 0) || (tx?.moveEndsAt !== undefined && i.now < tx.moveEndsAt);
  if (packaged) return { key: "packaged", label: tx?.moveEndsAt !== undefined && i.now < tx.moveEndsAt ? "On the move" : "Packaged", detail: tx?.chosenDestination ? `For ${tx.chosenDestination.name}` : "Choose a destination and pre-alert", tone: resus?.roscAt !== undefined || (score && score.band === "high") ? "warn" : "go", index: idx("packaged") };

  if (resus?.roscAt !== undefined) {
    return { key: "rosc", label: "ROSC", detail: `Output back ${Math.max(0, Math.round((i.now - resus.roscAt) / 60000))} min ago · twelve-lead, airway, sats 94–98 %, then move`, tone: "warn", index: idx("rosc") };
  }
  if (!tx?.surveyCompletedAt || !score) {
    return { key: "unassessed", label: "Not yet assessed", detail: tx?.surveyStartedAt ? "Primary survey under way" : "Primary survey first", tone: "", index: -1 };
  }
  const rising = i.scoreBefore != null && score.total - i.scoreBefore >= 2;
  if (score.band === "high") return { key: "peri_arrest", label: "Peri-arrest", detail: `NEWS2 ${score.total} · ${score.response}`, tone: "stop", index: idx("peri_arrest") };
  if (score.band === "medium" || score.band === "low_medium" || rising) {
    return { key: "deteriorating", label: rising && score.band === "low" ? "Going off" : "Deteriorating", detail: rising ? `NEWS2 ${score.total}, up ${score.total - (i.scoreBefore ?? 0)} in five minutes` : `NEWS2 ${score.total} · ${score.response}`, tone: "warn", index: idx("deteriorating") };
  }
  return { key: "stable", label: "Stable", detail: `NEWS2 ${score.total} · ${score.response}`, tone: "go", index: idx("stable") };
}
