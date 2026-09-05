import type { RecordSet } from "../records";

// Records for scenario 49 — sudden death, expected, Whitethorn House,
// Sale Moor.
//
// Four people and a building. The deceased is a person record, not a
// casualty: he has notes, a DNACPR on file and a next of kin, and
// nothing on him is for an ambulance to act on. The caller is the night
// manager; the carer who found him is on record because the script
// names her. No vehicles — nobody drove into this job but the police.
//
// Everyone here is fictional. Temple Road is real; the home, its number
// and its residents are not. The Wythenshawe attendance in the deceased's
// history is a fictional event at a real hospital.

export const records49: RecordSet = {
  scenarioId: "49",
  people: [
    {
      id: "p49-halliwell",
      name: "HALLIWELL, Arthur",
      sex: "M",
      age: 89,
      address: "Room 7, Whitethorn House, 41 Temple Road, Sale Moor, Sale",
      postcode: "M33 2FQ",
      roles: ["occupant"],
      markers: ["MEDICAL", "DNACPR"],
      notes: [
        "DECEASED — found in bed on the 04:00 checks, expected. Not a casualty; nothing here is for an ambulance.",
        "DNACPR on file, completed by his GP six weeks ago, with a ReSPECT form. On the end-of-life pathway for three weeks; district nurses visiting in the day. The home's call to their out-of-hours line tonight was passed to the out-of-hours GP service, which is where the four-to-five-hour wait came from.",
        "Own GP saw him on Tuesday. The practice is expected to issue the certificate if the out-of-hours doctor confirms it — that decides whether the coroner is involved at all.",
        "Fall in the home last month; taken to Wythenshawe Hospital for a hip X-ray, nothing broken, discharged the same day. A doctor may raise this as reportable to the coroner.",
        "Widower. Resident at Whitethorn House for four years. Daughter is next of kin — see PRESTWICH, Janet.",
      ],
      scenarioId: "49",
    },
    {
      id: "p49-manager-oyelaran",
      name: "OYELARAN, Grace",
      sex: "F",
      age: 47,
      address: "Whitethorn House, 41 Temple Road, Sale Moor, Sale",
      postcode: "M33 2FQ",
      phone: "0161 496 0417",
      roles: ["caller"],
      notes: [
        "Night manager and the informant. Calm and clear; has rung the out-of-hours GP already and been told four to five hours.",
        "Two care assistants on with her and twenty-three other residents asleep. Has asked, twice, for no blue lights.",
        "Holds the keypad code and the resident's file. Mobile 07700 900584 if the office line is engaged.",
      ],
      scenarioId: "49",
    },
    {
      id: "p49-carer-dutton",
      name: "DUTTON, Kayleigh",
      sex: "F",
      age: 24,
      address: "Whitethorn House, 41 Temple Road, Sale Moor, Sale",
      postcode: "M33 2FQ",
      phone: "07700 900731",
      roles: ["witness"],
      notes: [
        "Care assistant on nights. Found the resident on the 04:00 checks and fetched the night manager; has not touched him or moved anything.",
        "Last saw him alive on the 02:00 checks, asleep and breathing.",
      ],
      scenarioId: "49",
    },
    {
      id: "p49-daughter-prestwich",
      name: "PRESTWICH, Janet",
      sex: "F",
      age: 61,
      address: "Altrincham",
      postcode: "WA14",
      phone: "07700 900226",
      roles: ["occupant"],
      notes: [
        "Daughter and next of kin. Asked the home to ring her whatever the hour; on her way from Altrincham, twenty minutes.",
        "Has asked whether he can go to the funeral director tonight. Answer depends on the doctor, not the officer — she will need telling that kindly.",
      ],
      scenarioId: "49",
    },
  ],
  vehicles: [],
  places: [
    {
      id: "pl49-whitethorn-house",
      kind: "premises",
      name: "Whitethorn House Residential Care Home",
      address: "41 Temple Road, Sale Moor, Sale",
      postcode: "M33 2FQ",
      coords: { lat: 53.4226, lng: -2.3039 },
      notes: [
        "Residential care home, 24 beds, no nursing. Converted Edwardian villa with a single-storey rear extension. Night staffing: one senior and two care assistants; no nurse on site overnight, so nobody on the premises can verify a death.",
        "Front door on Temple Road with a keypad, locked overnight — ring and the night manager opens. Drive takes two cars; residents' parking both sides of the road.",
        "Room 7 is ground floor, rear of the main house, on the corridor between the lounge and the dining room.",
        "Three ambulance attendances in twelve months (two falls, one chest infection). No police history at the address.",
      ],
      scenarioId: "49",
    },
  ],
};
