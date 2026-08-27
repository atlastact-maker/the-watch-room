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

/** Alert → mobile from home on a pager: ~5 minutes on top of a turnout
 *  that is effectively zero when the crew are sat in the station. */
export const PAGER_TURNOUT_SEC = 300;

export function isDayCrewed(staffing: string | undefined | null): boolean {
  return !!staffing && /day crewed/i.test(staffing);
}

/** Extra turnout seconds for this station at this moment — 0 for
 *  wholetime stations and for day-crewed stations during crewed hours. */
export function pagerDelaySec(
  staffing: string | undefined | null,
  at: number,
): number {
  if (!isDayCrewed(staffing)) return 0;
  const h = new Date(at).getHours();
  return h >= DAY_CREW_START_HOUR && h < DAY_CREW_END_HOUR
    ? 0
    : PAGER_TURNOUT_SEC;
}
