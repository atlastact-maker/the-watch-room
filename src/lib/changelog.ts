// Patch notes — the single source for every changelog surface: the menu
// card, the /changelog page and the landing-page "recently shipped" line.
//
// Adding an entry: put it at the TOP of the array. `date` is ISO
// (YYYY-MM-DD) and drives ordering, the "new since your last visit"
// badge, and what the landing page shows.

export type ChangelogEntry = {
  version: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  title: string;
  /** Short, player-facing lines. State what changed, not how. */
  items: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.6.0",
    date: "2026-08-25",
    title: "Crash Recovery System",
    items: [
      "Vehicle based incidents now carry a CRS tab on the MDT — a datasheet schematic of every vehicle involved, with batteries, airbags, SRS units, fuel tanks and reinforced pillars plotted where they actually sit.",
      "Make-safe actions run as real tasks: isolate the 12V, foam blanket a ruptured tank, restrain tailgate struts, stabilise, glass management. Assign crew, and the kit they need is enforced.",
      "Make every vehicle safe and the extrication runs faster. Cut early and the log says so.",
    ],
  },
  {
    version: "0.5.0",
    date: "2026-08-25",
    title: "Every shift plays differently",
    items: [
      "Alarms can genuinely be false — the Trafford Centre AFA and the Royal Bolton ward alarm now roll their reality per run, and the fire bar no longer gives the answer away.",
      "Persons reported is a roll, not a certainty: the family might already be out on the pavement, and a slow attendance can send a father back in after his son.",
      "The seat of fire moves — kitchen, lounge or upstairs — changing what's burning and how you fight it.",
      "Let a house fire run and it goes through the party wall into the neighbour. The debrief will mention it.",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-08-25",
    title: "Ground view and BA discipline",
    items: [
      "Pre-selected BA crews rig en route, stage at the entry point on arrival, and go in on your commit order — never automatically.",
      "Patient treatment opens in its own window, and you can work several casualties side by side.",
      "Only a DCA or the air ambulance can convey to hospital. An RRV brings the clinician, not the ride.",
      "The inbound console moved onto the MDT, leaving the map clean.",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-08-24",
    title: "Fleet and station view",
    items: [
      "Fire and police vehicles drawn in for ground view, with working emergency lighting — a proper wig-wag bar on a 999 response and steady rear reds at scene.",
      "Stations open into their bays. Fuel, tank water and condition drain as units work; refuel, refill or send a vehicle to the workshops.",
      "Crews returning from a heavy job go off the run for refuel and rehab before they show available again.",
    ],
  },
];

export const LATEST = CHANGELOG[0];

/** Entries newer than the given ISO date (exclusive). */
export function entriesSince(iso: string | null): ChangelogEntry[] {
  if (!iso) return [];
  return CHANGELOG.filter((e) => e.date > iso);
}

export function formatEntryDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
