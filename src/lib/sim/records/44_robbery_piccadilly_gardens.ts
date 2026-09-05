import type { RecordSet } from "../records";

// Records for scenario 44 — knife-point robbery, Piccadilly Gardens.
//
// Everyone here is FICTIONAL, and so is the phone. Piccadilly Gardens,
// Market Street, Parker Street and the streets the people live on are
// real; there are no house numbers, and the IMEI is made up. Phone
// numbers sit in Ofcom's reserved drama ranges.
//
// The phone is not a record type of its own — it lives in the victim's
// notes, IMEI and all, which is where a desk would find it: the PNC
// property check is a person check first.
//
// The scenario location (the gardens at the Market Street corner) is
// derived from the scenario file by buildRecordIndex(). The places below
// are the two other spots the job touches: where CCTV has him, and where
// the second robbery happened.

export const records44: RecordSet = {
  scenarioId: "44",

  people: [
    // The victim — and the 999 caller, on his friend's phone.
    {
      id: "p44-victim-rowe",
      name: "ROWE, Callum",
      sex: "M",
      age: 24,
      address: "Ladybarn Lane, Fallowfield, Manchester",
      postcode: "M14",
      phone: "07700 900418",
      roles: ["victim", "caller"],
      scenarioId: "44",
      notes: [
        "Victim of the robbery at the Market Street corner of Piccadilly Gardens. Phone taken at knife-point; calling 999 on his friend's handset (MENSAH, Tayo — 07700 900523). The number above is the stolen phone's.",
        "PROPERTY — Apple iPhone 14, black, cracked screen, clear case. IMEI 354829116703248 (fictional). Find My shows it on Market Street near the Arndale at the time of the call, moving.",
        "Injury: cut across the right palm from grabbing at the blade, bleeding all but stopped. Declined an ambulance. Dressing on scene; walk-in centre if it needs closing.",
        "Willing to give a statement at scene and to attend a street identification. Nothing recorded against.",
      ],
    },

    // His friend — the phone the call is on, and a second pair of eyes.
    {
      id: "p44-witness-mensah",
      name: "MENSAH, Tayo",
      sex: "M",
      age: 23,
      address: "Wilmslow Road, Fallowfield, Manchester",
      postcode: "M14",
      phone: "07700 900523",
      roles: ["witness"],
      scenarioId: "44",
      notes: [
        "Friend of the victim, with him throughout. The 999 call is on this number.",
        "Saw the offender run towards Market Street and can describe the jacket and the bag. Did not see the knife.",
        "Has the victim's Find My logged in on his own handset — the live position of the stolen phone is on it.",
      ],
    },

    // The offender. The caller gives a description, not a name; the name
    // is what the desk gets back if he is stopped and identifies himself.
    {
      id: "p44-suspect-whelan",
      name: "WHELAN, Kieran",
      sex: "M",
      age: 19,
      address: "Rochdale Road, Collyhurst, Manchester",
      postcode: "M40",
      roles: ["suspect"],
      markers: ["WEAPONS", "WANTED"],
      scenarioId: "44",
      notes: [
        "WANTED — circulated for a knife-point robbery of a mobile phone on Oldham Street, 21/08/26. Same method: approach from behind at a crowd edge, small folding knife shown, phone demanded, off on foot into the Northern Quarter.",
        "WEAPONS marker from a stop-search on Tib Street 03/2026 — lock knife recovered, charged with possession of a bladed article. Case outstanding.",
        "Description tonight: white male, 18-20, 5ft 10 to 5ft 11, black puffer jacket with hood up, snood over the lower face, black cap, grey tracksuit bottoms, black trainers, small black cross-body bag. Knife in the right jacket pocket.",
        "Known to use the trams from Piccadilly Gardens and Market Street to leave the city centre.",
      ],
    },

    // The second victim — the link that makes it a series.
    {
      id: "p44-victim-hayes",
      name: "HAYES, Rebecca",
      sex: "F",
      age: 31,
      address: "Stockport Road, Levenshulme, Manchester",
      postcode: "M19",
      phone: "07700 900871",
      roles: ["victim", "caller"],
      scenarioId: "44",
      notes: [
        "Second 999 caller. Phone taken at knife-point at the Parker Street bus stands about twenty minutes before the Piccadilly Gardens robbery. Rang from the landline of a shop on Parker Street (0161 496 0347). The number above is the stolen phone's.",
        "PROPERTY — Samsung Galaxy A54, lilac, in a wallet case with two bank cards inside. Cards being cancelled by her from the shop.",
        "Description given independently matches: black puffer, snood, small silver knife, ran towards Piccadilly. Not injured. Shaken; has asked whether she has to stay.",
        "Needs a statement tonight and to be linked to the Piccadilly Gardens log before she goes home.",
      ],
    },
  ],

  // The offender is on foot and nobody's car is part of this job.
  vehicles: [],

  places: [
    {
      id: "pl44-market-street-arndale",
      kind: "landmark",
      name: "Market Street outside the Arndale — CCTV sighting / detention point",
      address: "Market Street at the Arndale entrance, Manchester",
      postcode: "M4 3AQ",
      coords: { lat: 53.4826, lng: -2.2401 },
      scenarioId: "44",
      notes: [
        "Where CCTV picks the offender up walking outbound, and where he is stopped on the runs he is stopped. Pedestrianised, with trams along this stretch — no vehicle gets closer than the Piccadilly kerb or High Street.",
        "High Street junction is where the camera trail ends on the other runs: north into the Northern Quarter, or into the Arndale by the High Street doors.",
        "City-centre CCTV covers the length of Market Street. Preserve the footage from the first sighting onwards.",
      ],
    },
    {
      id: "pl44-parker-street-stands",
      kind: "landmark",
      name: "Parker Street bus stands — second robbery",
      address: "Parker Street, Piccadilly Gardens, Manchester",
      postcode: "M1 1RG",
      coords: { lat: 53.4803, lng: -2.2358 },
      scenarioId: "44",
      notes: [
        "Bus stands on the south side of the gardens. The second victim was approached here at a crowd edge, twenty minutes before the first call.",
        "Bus operator CCTV on the stands and on the buses that were loading — a second angle on the offender if the council cameras miss him.",
        "The shop the second victim rang from is on this side; a statement can be taken there.",
      ],
    },
  ],
};
