import type { Scenario } from "../incident_types";

// Scenario 24 — electric vehicle fire on a driveway, Sale.
//
// A petrol car fire is fifteen minutes and one pump. A lithium battery
// fire is neither. Thermal runaway does not go out because you have put
// water on it — it goes out when the pack has finished, and it can
// re-ignite hours later on the back of a recovery truck. So the tactic is
// cooling, in volume, for a long time, and the resource question is not
// "how do I put this out" but "how long am I prepared to leave a pump
// here".
//
// It is on a driveway against a house, which is what makes it a building
// fire risk rather than a car park curiosity, and it is charging, which
// means there is a supply to isolate before anybody does anything.
//
// FICTIONAL: the vehicle, the household and the address. Northenden Road
// is a real Sale road; the property is not.

export const scenario24: Scenario = {
  id: "24",
  slug: "24_ev_fire_sale",
  title: "Electric vehicle fire — driveway, Sale",
  type: "vehicle_fire_ev",
  patch: "Southern",
  severity: "high",
  trigger:
    "Electric car alight on a driveway while charging. Fire is against the front of the house. Occupants out",

  location: {
    address: "58 Northenden Road, Sale",
    postcode: "M33 2DH",
    coords: { lat: 53.4249, lng: -2.3208 },
  },

  property: {
    class: "Semi-detached house with a driveway — vehicle alight against the front elevation",
    occupants: "Family of four, all out and on the pavement",
    vulnerabilities: [
      "Vehicle is against the house, under a uPVC porch and a bedroom window",
      "Charge point live on the house supply until it is isolated",
    ],
    access: "Driveway off Northenden Road. Vehicle blocks the drive; the appliance works from the road",
    knownHazards: [
      "Lithium traction battery — thermal runaway, toxic vapour, re-ignition hours later",
      "Charge point and the house supply live until isolated",
      "uPVC porch and window directly above the vehicle",
    ],
    firstDueStationId: "G11",
  },

  pri: {
    hasFormalPri: false,
    items: [
      "No PRI — private dwelling.",
      "Wall-mounted charge point on the house supply. Isolation at the consumer unit inside, or the cut-out.",
      "A battery fire is a cooling job, not an extinguishing one. Expect a long commitment and a re-ignition risk after handover to recovery.",
    ],
  },

  methane: {
    M: "No",
    E: "58 Northenden Road, Sale, M33 2DH",
    T: "Electric vehicle alight on a driveway, fire against the house",
    H: "Lithium battery — thermal runaway, toxic vapour, re-ignition. Live charge point",
    A: "Driveway off Northenden Road; appliance works from the road",
    N: "None — family of four out on the pavement",
    emergencyServices: "Fire; ambulance for smoke exposure if required",
  },

  pda: [
    {
      id: "pump1",
      label: "Pump 1",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      preferredStationId: "G11",
      notes: "First pump — BA, and a great deal of water over a long time",
    },
    {
      id: "pump2",
      label: "Pump 2",
      service: "Fire",
      requiredApplianceTypes: ["WrL", "WrT"],
      requiredCapabilities: ["BA"],
      notes:
        "Water supply and relief. One pump's tank does not cool a traction battery — this is measured in thousands of litres",
    },
    {
      id: "officer",
      label: "Station Manager",
      service: "Fire",
      requiredApplianceTypes: ["FIRE_SM"],
      requiredCapabilities: ["Command"],
      notes: "Prolonged commitment against a dwelling, with a re-ignition risk after the stop",
    },
  ],

  evaluation: {
    targets: [
      { metric: "Time-to-mobilise", target: "< 90 seconds" },
      { metric: "First attendance", target: "< 8 minutes" },
      {
        metric: "Water",
        target: "second pump and a hydrant supply — a tank of water will not do it",
      },
      {
        metric: "Commitment",
        target: "attendance held well beyond the fire going out — re-ignition is the risk",
      },
    ],
    lesson:
      "You are not putting this out, you are cooling it until it stops. A traction battery in runaway consumes water in quantities a tank does not hold, and it can light again hours after the stop, on the back of the recovery truck. The decision is not tactics — it is how long you are prepared to leave a pump on a driveway in Sale.",
  },

  scene: {
    viewBox: { x: -40, y: -35, width: 80, height: 70 },
    compassNorth: "up",
    buildings: [
      { shape: { x: -14, y: -26, w: 22, h: 24 }, kind: "target", label: "No. 58" },
      { shape: { x: 10, y: -26, w: 20, h: 24 }, kind: "neighbour", label: "No. 60" },
      { shape: { x: -36, y: -26, w: 20, h: 24 }, kind: "neighbour", label: "No. 56" },
    ],
    roads: [
      { shape: { x: -8, y: -2, w: 10, h: 14 }, kind: "driveway", label: "Drive" },
      { shape: { x: -40, y: 12, w: 80, h: 2 }, kind: "pavement" },
      { shape: { x: -40, y: 14, w: 80, h: 10 }, kind: "road", label: "Northenden Road" },
    ],
    hydrants: [{ label: "H1", coords: { lat: 53.4253, lng: -2.3216 }, street: "Northenden Road" }],
    landmarks: [
      { pos: { x: -3, y: 2 }, kind: "car", label: "Vehicle involved" },
      { pos: { x: 20, y: 18 }, kind: "car" },
      { pos: { x: -30, y: 20 }, kind: "lamppost" },
    ],
    fireSeat: {
      pos: { x: -3, y: 1 },
      radiusM: 2,
      growthRateMpm: 0.3,
      // Cooling, not extinguishing — water does far less here than it
      // does on contents, and that is the whole scenario.
      suppressionPerBaMpm: 0.18,
      maxRadiusM: 7,
      material: "electrical",
    },
    hazards: [
      {
        id: "traction-battery",
        pos: { x: -3, y: 0 },
        kind: "electrical",
        label: "Lithium traction battery — runaway, toxic vapour, re-ignition risk",
        knownFromPri: true,
      },
      {
        id: "charge-point",
        pos: { x: -10, y: -4 },
        kind: "electrical",
        label: "Charge point live on the house supply until isolated",
        knownFromPri: true,
      },
      {
        id: "porch",
        pos: { x: -6, y: -6 },
        kind: "structural",
        label: "uPVC porch and bedroom window directly above the vehicle",
        discoverAfterMinOnScene: 1,
      },
    ],
    casualties: [],
    sectors: [
      { id: 1, label: "Sector 1 · Northenden Road / drive", face: "front", bearingDeg: 180 },
      { id: 2, label: "Sector 2 · No. 60 side", face: "right", bearingDeg: 90 },
      { id: 3, label: "Sector 3 · Rear garden", face: "rear", bearingDeg: 0 },
      { id: 4, label: "Sector 4 · No. 56 side", face: "left", bearingDeg: 270 },
    ],
  },

  informantScript: [
    {
      id: "occupant-first",
      atSec: 5,
      text: "Our car's on fire on the drive — it's the electric one, it was on charge. There's flames underneath it and it's right up against the front of the house. We're all out, all four of us.",
      tone: "critical",
    },
    {
      id: "charging",
      atSec: 45,
      text: "It's still plugged in. The charger's on the wall by the front door. I don't know if I should pull it out or not — I've not touched it.",
      tone: "urgent",
    },
    {
      id: "hissing",
      atSec: 150,
      probability: 0.8,
      text: "It's making an awful noise — hissing and popping, and there's this thick white smoke coming out from under it that smells horrible. It's not like a normal car fire.",
      tone: "urgent",
    },
    {
      id: "porch-caught",
      atSec: 260,
      probability: 0.45,
      text: "The porch has caught now — the plastic bit round the front door is burning and dripping. It's going up towards the bedroom window.",
      tone: "critical",
      effect: { pulseCritical: true },
    },
  ],
};
