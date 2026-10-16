// The Pre-Alpha programme as announced to testers: the dates, the way in,
// the scenarios it opens with, the systems in the build and what is asked
// of a tester. One source, quoted by the briefing page, the standby page
// and the tester emails, so every surface gives the same account. Pure
// constants: safe to import from client components and email templates.

import type { ServiceCode } from "@/lib/sim/types";

/** The announced release: access opens to every accepted tester at once. */
export const PREALPHA_RELEASE_AT = Date.parse("2026-10-30T09:00:00+00:00");
export const PREALPHA_RELEASE_LABEL = "Friday 30 October";
export const PREALPHA_REVIEW_LABEL = "Friday 16 October";

export type KeyDate = { when: string; at: number | null; body: string };

/** Dated entries carry the moment they take effect; undated ones are standing. */
export const PREALPHA_KEY_DATES: readonly KeyDate[] = [
  { when: "Thursday 15 October", at: Date.parse("2026-10-16T00:00:00+01:00"), body: "Tester applications closed." },
  { when: PREALPHA_REVIEW_LABEL, at: Date.parse("2026-10-16T00:00:01+01:00"), body: "Review of tester applications begins. Successful applicants are emailed confirmation of their place on the tester list." },
  { when: PREALPHA_RELEASE_LABEL, at: PREALPHA_RELEASE_AT, body: "Pre-Alpha release. Access opens to every accepted tester at the same time, and each is notified by email." },
  { when: "Every Friday", at: null, body: "Progress updates and development diaries, by email and on the Discord server." },
  { when: "Throughout the Pre-Alpha", at: null, body: "Further scenarios for each service, released individually once they have been reviewed and approved." },
];

export const PREALPHA_ACCESS_STEPS = [
  { title: "Confirmation of acceptance", body: "Each application is reviewed individually, and successful applicants receive an email confirming their place on the tester list." },
  { title: "Access notification", body: `Access opens to all accepted testers on ${PREALPHA_RELEASE_LABEL}, and a second email confirms when the simulator is available.` },
  { title: "Pre-Alpha briefing", body: "Sign in on a laptop or desktop computer and read this briefing, which sets out the scenarios available and the scope of the current build." },
  { title: "Your first shift", body: "Open the operator console and select Start shift, then choose the services under your command and the call volume. Calls begin once the resourcing page has been completed." },
] as const;

export type OpeningScenario = {
  service: ServiceCode;
  /** The name the programme uses for it. */
  title: string;
  /** The scenario's title in the desk's data, to tell when it is released. */
  scenarioTitle: string;
  brief: string;
  feedback: string;
};

/** One scenario per service at release. */
export const PREALPHA_OPENING_SCENARIOS: readonly OpeningScenario[] = [
  {
    service: "Fire",
    title: "House Fire, Persons Reported — Wythenshawe",
    scenarioTitle: "House Fire, Persons Reported — Wythenshawe",
    brief: "A neighbour reports smoke and shouting from the adjoining property. Mobilise an appropriate attendance, commit crews in breathing apparatus, establish whether anyone remains inside and coordinate an ambulance for any casualty brought out.",
    feedback: "Whether the incident ground behaves realistically: BA, water supply and rescue timings, and whether the radio messages read as they would operationally.",
  },
  {
    service: "Ambulance",
    title: "Cardiac Arrest — Chorlton",
    scenarioTitle: "Cardiac Arrest — Hough End Playing Fields, Chorlton",
    brief: "A football coach reports that a player has collapsed during a match and is not breathing normally. Guide bystanders through CPR until the first resource arrives, then manage the patient through monitoring, the decision on critical care support and the pre-alert to hospital.",
    feedback: "Whether the patient responds realistically, and whether the vital signs change as a clinician would expect.",
  },
  {
    service: "Police",
    title: "Road Traffic Stop — Sale",
    scenarioTitle: "Vehicle stop — no insurance, wanted driver, Sale",
    brief: "A patrol has stopped a vehicle at the roadside. Carry out checks on the vehicle and driver, including PNC checks, a roadside breath test and a drug wipe, before deciding on the appropriate outcome.",
    feedback: "Whether the stop runs as it would at the roadside, and whether the checks and options are those an officer would expect, in the order they would expect them.",
  },
];

/** The systems in this build, and what is to be tested in each. */
export const PREALPHA_FOCUS = [
  {
    title: "999 call handling",
    body: "Scripted callers who respond to the questions asked, opening codes (NICL, IRS and AMPDS), call grading, and pre-arrival advice delivered while resources are en route.",
    test: "Whether the call reads as a genuine call: the questions available, and whether the grade reached is the correct one.",
  },
  {
    title: "Mobilising and mapping",
    body: "The county board with real stations and appliances, routing on the real road network, crews deployed on foot at the scene, and the mobile data terminal for managing each incident.",
    test: "Whether the attendances are correct for the call, and whether the drive times are credible for Greater Manchester.",
  },
  {
    title: "Fire ground control",
    body: "Sectorisation, the BA board and entry control, water supplies from hydrants and relays, jets, tactical mode, and informative and stop messages.",
    test: "Whether the fireground behaves as one: BA, water and rescue timings, and whether the messages read as they would over the radio.",
  },
  {
    title: "Casualty care",
    body: "A live vital signs monitor, triage sieve, airway and breathing management, oxygen and medication orders, packaging, hospital pre-alerts and conveyance.",
    test: "Whether the patient responds as a patient would: the clarity of the care pathway, and whether the vitals move as a clinician would expect.",
  },
  {
    title: "Police ground control",
    body: "Containment and cordons, arrest and search, PNC checks on people and vehicles, roadside breath and drug testing, domestic abuse risk assessment, custody and transport.",
    test: "Whether the incident runs as one would: the checks and options an officer would expect, in the order they would expect them.",
  },
  {
    title: "Debrief and service record",
    body: "Every shift is assessed on mobilisation time, attendance, advice given and decisions made at the scene. The service record retains every shift, and Pre-Alpha testers keep their records into the wider release, with a tester mark against the callsign.",
    test: "Whether the assessment is fair, and whether it explains itself.",
  },
] as const;

export const PREALPHA_ASKS = [
  { title: "Regular testing", body: "Where possible, one or two shifts each week. A shift lasts between twenty minutes and an hour." },
  { title: "Fault reporting", body: "Report faults through Help, then Report a problem, available on every screen. Each report carries the screen, the incident and the final minute of the incident log; add a short note of what you expected to happen." },
  { title: "Confidentiality", body: "No footage, screenshots or reviews in public until public access has been announced. Discussion is welcome in the private tester channel on Discord." },
  { title: "Honest feedback", body: "Where something does not reflect how the role is carried out in practice, that feedback is as valuable as any fault report." },
] as const;

export const PREALPHA_NOT_YET = [
  { title: "The full scenario library", body: "A limited set of scenarios is available at release; the remainder are being reviewed individually." },
  { title: "Multiplayer", body: "The current build supports a single operator." },
  { title: "Mobile devices", body: "A laptop or desktop computer is required. Tablet views are intended for a second screen." },
  { title: "Final balancing", body: "Timings and grading continue to be refined as the advisors report." },
] as const;
