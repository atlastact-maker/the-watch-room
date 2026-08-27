// Day-crewed turnout. Six GMFRS stations (G24 Marple, G31 Littleborough,
// G38 Ramsbottom, G41 Mossley, G52 Horwich, G62 Irlam) are crewed on
// station through the day only; outside those hours the crew respond
// from home on alerters, drive to the station, and turn out from there.
// That is real minutes, and the sim owes the operator the difference:
// mobilise a day-crewed pump at 02:00 and the alerter delay lands on top
// of the drive time.
//
// The shift runs in real time, so "after hours" is the operator's own
// wall clock — the same clock every other timestamp in the game reads.

/** On-station hours for a day-crewed station: 08:00–18:00. */
export const DAY_CREW_START_HOUR = 8;
export const DAY_CREW_END_HOUR = 18;

/** Alert → mobile from home on a pager: 4–7 minutes on top of a
 *  turnout that is effectively zero when the crew are sat in the
 *  station. The exact figure is rolled once per appliance per day —
 *  "how quick the crew are tonight" — deterministically, so the ETA the
 *  deployment board promises is the ETA the mobilisation delivers. */
export const PAGER_MIN_SEC = 240;
export const PAGER_MAX_SEC = 420;

function seededUnit(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  }
  // Avalanche finalizer (murmur3 fmix32). Without it, consecutive dates
  // differ in the last character only, the hash moves by ±1, and every
  // "night" rolls nearly the same figure — jitter in name only.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

export function isDayCrewed(staffing: string | undefined | null): boolean {
  return !!staffing && /day crewed/i.test(staffing);
}

/** Extra turnout seconds for this appliance at this moment — 0 for
 *  wholetime stations and for day-crewed stations during crewed hours,
 *  else tonight's roll for this appliance in the 4–7 minute band. */
export function pagerDelaySec(
  staffing: string | undefined | null,
  at: number,
  applianceId?: string,
): number {
  if (!isDayCrewed(staffing)) return 0;
  const d = new Date(at);
  const h = d.getHours();
  if (h >= DAY_CREW_START_HOUR && h < DAY_CREW_END_HOUR) return 0;
  // Seed on the duty NIGHT, not the calendar date — a night runs through
  // midnight, and the roll must not change identity at 00:00 between the
  // board promising an ETA and the operator clicking mobilise. Shifting
  // the clock back by the evening boundary lands 18:00 → 07:59 on one
  // date.
  const n = new Date(at - DAY_CREW_END_HOUR * 3600 * 1000);
  const seed = `${applianceId ?? "crew"}:${n.getFullYear()}-${n.getMonth()}-${n.getDate()}`;
  return Math.round(
    PAGER_MIN_SEC + seededUnit(seed) * (PAGER_MAX_SEC - PAGER_MIN_SEC),
  );
}
