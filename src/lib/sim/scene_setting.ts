// WHERE THE PATIENT IS. The scene behind the patient: a living room, a
// hallway, a kitchen, a pavement, a pitch, a platform, the cab of a lorry,
// the back of the ambulance once they have been brought out. Read off the
// casualty's label first (it usually says), then the premises, then the
// job's title and type. The posture decides the settings that are a
// predicament rather than a place: in the water, on the ledge, in the
// vehicle — and once they are out, the ambulance is the place.

import type { SceneCasualty } from "./scene";
import type { Posture } from "./patient_look";

export type SceneSetting =
  | "lounge" | "hallway" | "bedroom" | "kitchen" | "bathroom" | "stairs"
  | "ward" | "restaurant" | "changing_room" | "shop"
  | "pavement" | "road_urban" | "motorway" | "car" | "lorry"
  | "pitch" | "park" | "moor" | "lakeside"
  | "platform" | "factory" | "site" | "yard"
  | "water" | "height"
  | "ambulance_street" | "ambulance_motorway" | "ambulance_river" | "ambulance_field";

/** The setting in words, for the caption when the label gives none. */
export const SETTING_WORDS: Record<SceneSetting, string> = {
  lounge: "In the front room",
  hallway: "In the hallway",
  bedroom: "In the bedroom",
  kitchen: "In the kitchen",
  bathroom: "In the bathroom",
  stairs: "On the stairs",
  ward: "On the ward",
  restaurant: "In the restaurant",
  changing_room: "In the changing rooms",
  shop: "In the shop",
  pavement: "On the pavement",
  road_urban: "In the road",
  motorway: "On the carriageway",
  car: "In the car",
  lorry: "In the cab",
  pitch: "On the pitch",
  park: "In the park",
  moor: "On the moor",
  lakeside: "By the water",
  platform: "On the platform",
  factory: "On the shop floor",
  site: "On the site",
  yard: "In the yard",
  water: "In the water",
  height: "On the ledge",
  ambulance_street: "At the back of the ambulance",
  ambulance_motorway: "At the ambulance, on the hard shoulder",
  ambulance_river: "At the ambulance, on the bank",
  ambulance_field: "At the ambulance",
};

type Job = { title: string; type: string; property?: { class: string } };

export type SettingOpts = {
  /** Out of the water, off the face, out of the car, carried out of the building. */
  landed?: boolean;
};

const byWords = (text: string): SceneSetting | null => {
  const t = text.toLowerCase();
  if (/\b(stairs|staircase|stairwell|landing)\b/.test(t)) return "stairs";
  if (/\b(hallway|hall floor|hall|porch|vestibule)\b/.test(t)) return "hallway";
  if (/\bkitchen\b/.test(t)) return "kitchen";
  if (/\b(bathroom|bath|toilet|shower|wc)\b/.test(t)) return "bathroom";
  if (/\b(bedroom|in bed|rear room|back room|box room)\b/.test(t)) return "bedroom";
  if (/\b(living room|front room|lounge|sofa|armchair|settee|sitting room)\b/.test(t)) return "lounge";
  if (/\b(ward|hospital|care home|nursing home|hospice|a&e)\b/.test(t)) return "ward";
  if (/\bchanging rooms?\b/.test(t)) return "changing_room";
  // Outside beats the building it is outside of: "on the pavement outside
  // licensed premises" is the pavement; "boating lake with a cafe" the lake.
  if (/\b(pavement|street outside|outside|doorway|kerb)\b/.test(t)) return "pavement";
  if (/\b(lake|boating|shore|waterside|reservoir|pond)\b/.test(t)) return "lakeside";
  if (/\b(platform|railway station|rail station|tram stop|metrolink)\b/.test(t)) return "platform";
  if (/\b(pitch(es)?|mid-match|playing fields?|football|rugby|touchline)\b/.test(t)) return "pitch";
  if (/\b(restaurant|dining room|cafe|café|pub|bar|licensed premises|takeaway)\b/.test(t)) return "restaurant";
  if (/\b(shop|store|stockroom|back office|supermarket|shopping centre|department store|checkout)\b/.test(t)) return "shop";
  if (/\b(moor|moorland|pennine|fell|heath|hillside|summit)\b/.test(t)) return "moor";
  if (/\b(park|bandstand|grass|garden|lawn|cemetery|towpath|allotments?)\b/.test(t)) return "park";
  if (/\b(motorway|m6\d|m60|m62|m56|m66|carriageway|hard shoulder|slip road|lgv|hgv)\b/.test(t)) return "motorway";
  if (/\b(road|a\d{2,4}|junction|lay-by|crossroads|rtc|collision|dual carriageway|crossing)\b/.test(t)) return "road_urban";
  if (/\b(building site|scaffold|construction|site)\b/.test(t)) return "site";
  if (/\b(yard|freight|depot|terminal|loading bay)\b/.test(t)) return "yard";
  if (/\b(factory|warehouse|industrial|unit \d|dispatch office|plant|workshop|moulding|mill)\b/.test(t)) return "factory";
  if (/\b(pavement|street|outside|doorway|precinct|square|locks|car park|forecourt|bus stop|alley|kerb)\b/.test(t)) return "pavement";
  if (/\b(flat|house|home|floor|hmo|bungalow|maisonette|tower|dwelling|terrace|terraced|semi|detached|cottage|townhouse)\b/.test(t)) return "lounge";
  return null;
};

const byType = (type: string): SceneSetting | null => {
  if (/rtc|vehicle_fire|pursuit|fail_to_stop/.test(type)) return "road_urban";
  if (/wildfire|moorland/.test(type)) return "moor";
  if (/water_rescue/.test(type)) return "water";
  if (/flooding/.test(type)) return "lounge";
  if (/rope_rescue/.test(type)) return "height";
  if (/industrial|agricultural|hazmat|chemical/.test(type)) return "factory";
  if (/healthcare|transfer/.test(type)) return "ward";
  if (/education|lift_release/.test(type)) return "shop";
  if (/firearms|public_order|robbery|assault|fight|night_time/.test(type)) return "pavement";
  if (/police/.test(type)) return "pavement";
  if (/dwelling|hmo|chimney|gas_leak|co_exposure|effecting_entry|fall_elderly|chest_pain|maternity|stroke|breathing|overdose|mental_health|high_rise|automatic_fire_alarm|anaphylaxis|diabetic|seizure|hcp/.test(type)) return "lounge";
  return null;
};

export function sceneSetting(c: SceneCasualty, job: Job | undefined, posture: Posture, opts: SettingOpts = {}): SceneSetting {
  if (posture === "in_water") return "water";
  if (posture === "at_height") return "height";
  const title = (job?.title ?? "").toLowerCase();
  const type = job?.type ?? "";
  const onMotorway = /motorway|m60|m62|m56|m66|carriageway|hard shoulder/.test(title) || /rtc/.test(type) && /\b(m\d\d|motorway)\b/.test(title);
  if (opts.landed) {
    if (c.inWater) return "ambulance_river";
    if (c.atHeight) return "ambulance_field";
    if (c.trappedUntilExtricated || /rtc|vehicle/.test(type)) return onMotorway ? "ambulance_motorway" : "ambulance_street";
    return "ambulance_street";
  }
  if (posture === "in_vehicle") {
    const l = (c.label ?? "").toLowerCase();
    return /\b(lgv|hgv|lorry|truck|van|bus|coach|cab)\b/.test(l) ? "lorry" : "car";
  }
  const fromLabel = byWords(c.label ?? "");
  if (fromLabel) return fromLabel;
  if (job) {
    const fromClass = job.property ? byWords(job.property.class) : null;
    if (fromClass) return fromClass;
    const fromTitle = byWords(job.title);
    if (fromTitle) return fromTitle;
    const fromType = byType(job.type);
    if (fromType) return fromType;
  }
  return "lounge";
}
