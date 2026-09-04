import type { Scenario } from "../incident_types";

// Scenario 18 — interfacility transfer, Oldham. Category 4.
//
// Nothing happens in this job. That is the job.
//
// A stable patient needs moving between hospitals. It is not urgent, it
// is not dramatic, and it will take an ambulance off the board for the
// best part of an hour of compressed time — longer than any other
// scenario here except the moorland fire. This is how resources actually
// disappear in an ambulance service: not to disasters, but to necessary,
// boring work that somebody has to do.
//
// The decision is whether to commit a DCA to it now, or hold it and let
// the hospital wait. Both are defensible. What is not defensible is
// committing your last ambulance to it and then taking a cardiac arrest.
//
// There is deliberately no scene drama and one informant who is a nurse
// with a clipboard, because the pressure is entirely on the board.
//
// FICTIONAL: the patient, the ward and the nurse. The Royal Oldham and
// Wythenshawe are real hospitals; the transfer is not.

export const scenario18: Scenario = {
  id: "18",
  slug: "18_transfer_oldham",
  title: "Transfer — Royal Oldham to Wythenshawe",
  type: "ambulance_transfer",
  patch: "Eastern",
  severity: "low",
  trigger:
    "Category 4 — planned interfacility transfer. Stable patient, ward to ward, no clinical escort required. Receiving unit expecting them",

  location: {
    address: "Ward 12, The Royal Oldham Hospital, Rochdale Road, Oldham",
    postcode: "OL1 2JH",
    coords: { lat: 53.5478, lng: -2.1123 },
  },

  property: {
    class: "Acute hospital — transfer from a ward, not an emergency department",
    occupants: "Ward staff and the patient. Bed ready at the receiving unit",
    vulnerabilities: [
      "Stable, but the receiving unit has a bed held and it will not be held indefinitely",
      "The journey is the job — Oldham to Wythenshawe across the whole force area",
    ],
    access:
      "Ambulance entrance off Rochdale Road, ward 12 on level 3. Lift access; porter will meet the crew",
    knownHazards: ["None"],
    firstDueStationId: "A-OLD",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — routine hospital transfer.",
      "Ward to ward. No clinical escort required; the crew take the handover from the nurse in charge.",
      "Receiving unit is holding a bed and has been told a crew is coming.",
    ],
  },

  methane: {
    M: "No",
    E: "Ward 12, The Royal Oldham Hospital, OL1 2JH",
    T: "Planned transfer — one stable patient, ward to ward",
    H: "None",
    A: "Ambulance entrance off Rochdale Road; ward 12, level 3, porter to meet",
    N: "One — stable, no escort required",
    emergencyServices: "Ambulance only",
  },

  pda: [
    {
      id: "dca1",
      label: "Ambulance",
      service: "Ambulance",
      requiredApplianceTypes: ["DCA"],
      requiredCapabilities: [],
      preferredStationId: "A-OLD",
      notes:
        "One DCA, and it is gone for the duration. Oldham to Wythenshawe and back is most of what is left of the turn",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "no target — this is not an emergency" },
      { metric: "C4 response", target: "within 180 minutes" },
      {
        metric: "Resource judgement",
        target: "not committed while it would leave the patch without an emergency ambulance",
      },
      {
        metric: "Proportionate response",
        target: "one DCA — no RRV, no HART, nothing on blue lights",
      },
    ],
    lesson:
      "Nothing happens on this job and that is what makes it worth having. It is not urgent and it is not interesting, and it will take an ambulance off your board for the best part of an hour. Resources do not mostly disappear into disasters — they disappear into necessary, boring work. Hold it if the board is thin. Just do not commit your last ambulance to it and then take an arrest.",
  },

  scene: {
    viewBox: { x: -60, y: -40, width: 120, height: 80 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -24, y: -30, w: 52, h: 38 }, kind: "target", label: "Royal Oldham — ward block" },
      { shape: { x: 32, y: -30, w: 24, h: 24 }, kind: "neighbour", label: "Outpatients" },
    ],
    roads: [
      { shape: { x: -30, y: 8, w: 22, h: 12 }, kind: "driveway", label: "Ambulance entrance" },
      { shape: { x: -60, y: 22, w: 120, h: 2 }, kind: "pavement" },
      { shape: { x: -60, y: 24, w: 120, h: 10 }, kind: "road", label: "Rochdale Road" },
    ],
    hydrants: [],
    landmarks: [
      { pos: { x: -20, y: 13 }, kind: "car" },
      { pos: { x: -8, y: 13 }, kind: "car" },
      { pos: { x: 40, y: 28 }, kind: "lamppost" },
    ],
    hazards: [],
    casualties: [
      {
        id: "cas-18-transfer",
        label: "Transfer patient — stable, on ward 12",
        pos: { x: 0, y: -18 },
        severity: "walking",
        discoverAfterMinBa: 0,
      },
    ],
    sectors: [
      { id: 1, label: "Sector 1 · Ambulance entrance", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · Outpatients", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Ward block rear", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · Service road", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "nurse-first",
      atSec: 8,
      text: "Ward 12 at the Royal Oldham. We've a transfer booked to Wythenshawe — he's stable, ready to go, no escort needed. Bed's held at the other end. Any idea on a crew?",
      tone: "info",
    },
    {
      id: "bed-pressure",
      atSec: 300,
      probability: 0.7,
      text: "Just chasing — they're asking at the other end because they want the bed. And I've got somebody in A&E waiting on his once he goes.",
      tone: "info",
    },
    {
      id: "still-waiting",
      atSec: 900,
      probability: 0.6,
      text: "Sorry, me again. He's been sat in the chair with his bag packed since ten. Is anybody coming today?",
      tone: "urgent",
    },
  ],
};
