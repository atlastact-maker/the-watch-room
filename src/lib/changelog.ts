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
    version: "0.7.1",
    date: "2026-10-16",
    title: "The cardiac arrest, as the crew find it",
    items: [
      "A patient in arrest reads as one: the airway shows unprotected until an adjunct is in, breathing shows the bag, and no saturation or pressure is quoted where there is no pulse to read.",
      "Pre-arrival advice is scored: the key instructions, compressions and the defibrillator on an arrest, count on the debrief alongside the key questions.",
      "A patient whose output came back before the crew arrived is post-ROSC from the first look: the stage says so and the care screen shows the post-ROSC targets.",
      "Hough End: the coach names the same players the records hold.",
      "View as tester shows the closed door too: while the doors are shut it lands on the standing-by page as a tester does, with Admin view to return.",
      "Wythenshawe: the cigarette fire starts in the parents' room, not the boy's, the father down in the hall is found as soon as a team is through the door, and the BA target reads the twelve minutes the fire actually allows.",
      "The reference library is parked for the Pre-Alpha. The operator guide's reference chapter and the desk's own Reference window carry what a shift needs.",
      "The alerts strip in the desk's menu bar, with Test call on it, is back in the bar where it belongs; the alert cards float over the desk on their own.",
      "The Scene units window is gone: the tablet's Resourcing tab lists the committed units and places them, and did the same job better.",
      "Units can be placed before they arrive: pick where a unit still driving will stand and its route changes to take it there. A placed unit can be moved again, en route or on the ground.",
      "Nothing is done to a patient until a clinician has reached them: the walk from the vehicle is drawn, the monitor and its leads wait for it, and nobody is drawn kneeling at a patient they are still crossing the ground to.",
      "Crew to the patient: the care screen's Crew button lists every clinician on scene by name with Send and Stand down, so people from different vehicles work the same patient.",
      "The monitor is the LIFEPAK 15: the Monitor panel opens as the device's face, with the connection keys down the left, the screen in its bezel and the soft keys under it.",
      "Output back, hands off: when ROSC is called the compressions stop and the board says so.",
      "The scene shows the work: a cannula sliding into the back of the hand, a dose pushed through the port or into the thigh, a tablet or spray to the mouth, a nebuliser misting, and the right pouch of the kit bag open while it happens.",
      "The docked tablet keeps its labels: at the narrow width the bottom bars show every button with its name, not icons alone.",
      "Signing in with an emailed code takes the eight digits the message carries.",
      "Starting CPR is in reach: the NO COMPRESSIONS alert on the stage names who can take the chest, and the Crew panel's Compressions group puts someone on it or fits the LUCAS.",
      "Nobody compresses until told to: a crew arriving at an arrest kneels and assesses until the operator puts someone on the chest; the hands pause for the rhythm check and carry on after it.",
      "ROSC keeps the compressor with the chest; a re-arrest puts them straight back on it.",
      "Loading the patient: the board slides under a log-rolled patient, and the trolley, carry chair, carry sheet or vacuum mattress comes in beside them for the lift, then stays under them to the vehicle.",
      "Companion tablet: Windows → Companion tablet… shows a code. On a tablet or another screen, sign in, open /mdt and enter it, and the desk's MDT is on that device, live — everything pressed on it happens on the desk.",
    ],
  },
  {
    version: "0.7.0",
    date: "2026-10-16",
    title: "The operator console",
    items: [
      "The console, the front door, the account pages and administration share one operator-console design: sidebar navigation, the live county plate, and the same panels, chips and type throughout.",
      "Alerts on the desk: a new call, a unit in attendance on the open incident, a patient deteriorating and the stop message are sounded, shown as cards and read to a screen reader. Each channel switches in Help and in Settings.",
      "Keyboard and screen-reader support: a skip link, every control reachable by Tab with its explanation shown on focus, Inline help that writes every hint under its row, and a keyboard section in the reference.",
      "Closed carriageways: the closed section shows on the county map, authorised units approach against the flow, and other incidents divert around the queue.",
      "The incoming call, the reference and Report a problem are windows of the CAD, and every email the site sends is in the console's design.",
    ],
  },
  {
    version: "0.6.3",
    date: "2026-10-15",
    title: "Fire dynamics and the live carriageway",
    items: [
      "The fire burns room by room: growth, ventilation and the water applied decide what is tenable and for how long, and the fireground board shows it.",
      "The RTC carriageway is the operator's job: lane closures and the full block with roads policing, the cordon, and Highways for the diversion. The scene is drawn from above on the junction's aerial photograph.",
      "Crews are modelled figures: they jog in, walk between tasks and leave when nothing follows. The HEMS doctor carries the response pack.",
      "Dynamic deployment: a Resources screen, standby moves that are carried out, and a resourcing page before the shift begins.",
      "Calls arrive on 111, 101 and community lines as well as 999, each with the opening codes to match, and a PNC names enquiry takes the descriptors the real one does.",
    ],
  },
  {
    version: "0.6.2",
    date: "2026-10-14",
    title: "Casualty care, drawn from life",
    items: [
      "The patient scene is drawn from above as a person: kit placed where it goes, ECG leads for the lead set in use, a bag-valve-mask over the face, the LIFEPAK 15 and the Stryker stretcher.",
      "The back of a UK ambulance: stretcher on the nearside, the LUCAS, the ventilator and suction in the saloon. An intubated patient goes on the ventilator.",
      "The crew kneel to the patient, dressed as the ambulance service dresses.",
    ],
  },
  {
    version: "0.6.1",
    date: "2026-10-03",
    title: "Crews on the ground and the tablet",
    items: [
      "The mobile data terminal is a rugged field tablet that boots to a desktop of apps.",
      "Casualty care has a patient board with NEWS2 and trends, the care record, and a patient you can see on the ground the incident is on. Nothing starts until the crew have walked to them.",
      "BA crews walk in through the door and the building shows who is inside; hose lays from the appliance; officers on foot walk to their work.",
      "Mobilising: drag a unit into the attendance slots, with a response map of the units on their way.",
      "SVT and VT with a pulse join the casualty engine. The arrest board needs leads for a rhythm and a compressor for a clock.",
    ],
  },
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
