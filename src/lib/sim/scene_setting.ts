// WHERE THE PATIENT IS. The scene behind the patient: a living room, a
// kitchen, a pavement, a pitch, a platform. Read off the casualty's
// label first (it usually says), then the job's title and type, then
// the premises. The posture decides the three settings that are not a
// place but a predicament: in the water, at height, in a vehicle.

import type { SceneCasualty } from "./scene";
import type { Posture } from "./patient_look";

export type SceneSetting =
  | "home" | "kitchen" | "bathroom" | "stairs" | "ward" | "venue"
  | "street" | "road" | "vehicle" | "grass" | "platform" | "workplace"
  | "water" | "height";

/** The setting in words, for the caption when the label gives none. */
export const SETTING_WORDS: Record<SceneSetting, string> = {
  home: "In the house",
  kitchen: "On the kitchen floor",
  bathroom: "In the bathroom",
  stairs: "On the stairs",
  ward: "On the ward",
  venue: "In the premises",
  street: "On the pavement",
  road: "In the road",
  vehicle: "In the vehicle",
  grass: "On the grass",
  platform: "On the platform",
  workplace: "On the shop floor",
  water: "In the water",
  height: "At height",
};

type Job = { title: string; type: string; property?: { class: string } };

const byWords = (text: string): SceneSetting | null => {
  const t = text.toLowerCase();
  if (/\b(stairs|staircase|landing)\b/.test(t)) return "stairs";
  if (/\bkitchen\b/.test(t)) return "kitchen";
  if (/\b(bathroom|bath|toilet|shower|wc)\b/.test(t)) return "bathroom";
  if (/\b(ward|care home|nursing home|hospital|hospice|bed(room)?)\b/.test(t)) return "ward";
  if (/\b(platform|railway|rail station|tram stop|metrolink)\b/.test(t)) return "platform";
  if (/\b(pitch(es)?|playing fields?|parks?|gardens?|lawns?|grass|fields?|moors?|moorland|golf|cemetery|towpath|allotments?)\b/.test(t)) return "grass";
  if (/\b(carriageway|motorway|m6\d|m60|m62|m56|a\d{2,4}|junction|hard shoulder|rtc|collision|road blocked|slip road)\b/.test(t)) return "road";
  if (/\b(car|vehicle|driver|passenger|cab|van|lorry)\b/.test(t)) return "vehicle";
  if (/\b(factory|warehouse|industrial|unit \d|workshop|plant|site|building site|yard|depot|terminal|freight|farm)\b/.test(t)) return "workplace";
  if (/\b(restaurant|pub|bar|cafe|café|shop|store|supermarket|centre|precinct|premises|lobby|foyer|office|school|classroom|gym|club)\b/.test(t)) return "venue";
  if (/\b(pavement|street|outside|car park|forecourt|bus stop|doorway|alley|gardens|square|locks)\b/.test(t)) return "street";
  if (/\b(flat|house|home|lounge|living room|sofa|chair|hallway|hall|floor|hmo|maisonette|bungalow)\b/.test(t)) return "home";
  return null;
};

const byType = (type: string): SceneSetting | null => {
  if (/rtc|vehicle_fire/.test(type)) return "road";
  if (/wildfire|moorland/.test(type)) return "grass";
  if (/water_rescue|flooding/.test(type)) return "water";
  if (/rope_rescue/.test(type)) return "height";
  if (/industrial|agricultural|hazmat|chemical/.test(type)) return "workplace";
  if (/healthcare|transfer/.test(type)) return "ward";
  if (/education|lift_release|firearms|public_order|robbery|assault/.test(type)) return "venue";
  if (/police/.test(type)) return "street";
  if (/dwelling|hmo|chimney|gas_leak|co_exposure|effecting_entry|fall_elderly|chest_pain|maternity|stroke|breathing|overdose|mental_health|high_rise|automatic_fire_alarm|anaphylaxis|diabetic|seizure/.test(type)) return "home";
  return null;
};

export function sceneSetting(c: SceneCasualty, job: Job | undefined, posture: Posture): SceneSetting {
  if (posture === "in_water") return "water";
  if (posture === "at_height") return "height";
  if (posture === "in_vehicle") return "vehicle";
  const fromLabel = byWords(c.label ?? "");
  if (fromLabel && fromLabel !== "vehicle") return fromLabel;
  if (job) {
    const fromTitle = byWords(job.title);
    if (fromTitle && fromTitle !== "vehicle") return fromTitle;
    const fromType = byType(job.type);
    if (fromType && fromType !== "vehicle" && fromType !== "water" && fromType !== "height") return fromType;
    const fromClass = job.property ? byWords(job.property.class) : null;
    if (fromClass && fromClass !== "vehicle") return fromClass;
  }
  return posture === "sitting" ? "home" : "home";
}
