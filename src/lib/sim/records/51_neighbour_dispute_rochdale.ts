import type { RecordSet } from "../records";

// Records for scenario 51 — neighbour dispute, repeat caller, Kirkholt.
//
// Two households and no vehicles. What this set carries that the others
// do not is the call history: the previous contacts sit on the caller and
// on the address as notes, because that is where the desk would find
// them, and reading them before the car arrives is half the job. Neither
// side is clean and neither side is dangerous on paper, which is the
// point — the risk tonight is in the words, not the markers.
//
// Everyone here is fictional, as are the house numbers and every entry
// in the history. Nothing reveals which way the lighter roll lands.

export const records51: RecordSet = {
  scenarioId: "51",
  people: [
    {
      id: "p51-holroyd-janice",
      name: "HOLROYD, Janice",
      sex: "F",
      age: 58,
      address: "61 Daventry Road, Kirkholt, Rochdale",
      postcode: "OL11 2HY",
      phone: "07700 900174",
      roles: ["caller", "victim"],
      markers: ["REPEAT CALLER"],
      notes: [
        "Tonight — 999: neighbour at 63 shouting over the fence at her husband, stated he would 'burn the pair of you out'. Caller on the line throughout.",
        "Thursday this week, 11:20 — call-back attempted re the Wednesday report. No answer, message left. Not returned.",
        "Wednesday this week, 19:38 — 999: fence panel on the shared boundary kicked through, male at 63 shouting. No injuries, no weapons. Crime recorded (criminal damage). Graded C, central resolution.",
        "Monday this week, 22:14 — 101: loud music from 63 after 22:00. Advice given, passed to the neighbourhood team. Graded C.",
        "Six months ago — 101: vehicle from 63 across the shared dropped kerb. Advice given, closed.",
        "Owner-occupier at 61 for nineteen years with her husband. The household at 63 arrived in February.",
      ],
      scenarioId: "51",
    },
    {
      id: "p51-holroyd-barry",
      name: "HOLROYD, Barry",
      sex: "M",
      age: 61,
      address: "61 Daventry Road, Kirkholt, Rochdale",
      postcode: "OL11 2HY",
      phone: "07700 900175",
      roles: ["victim", "occupant"],
      notes: [
        "Husband of the caller. The person the threat was shouted at; in the back garden when it started, brought in by his wife.",
        "Put up the new fence panel last weekend, which is what the row is about. Says it is on the line; 63 says it is six inches over.",
        "One conviction: s.4A Public Order Act 1986, 2014, arising from a dispute with a neighbour at a previous address in Castleton. Nothing since. Worth knowing before he goes round, which he says he will.",
      ],
      scenarioId: "51",
    },
    {
      id: "p51-duckworth-lee",
      name: "DUCKWORTH, Lee",
      sex: "M",
      age: 44,
      address: "63 Daventry Road, Kirkholt, Rochdale",
      postcode: "OL11 2HY",
      phone: "07700 900418",
      roles: ["suspect", "caller"],
      notes: [
        "Named by the caller at 61 as the male who made the threat. Rings 999 himself during this call — second log, same location — saying he is being filmed over the fence and wants police for that.",
        "Denies the word 'burn'. His account is that he said he would have them 'out of here', meaning through the landlord.",
        "Wednesday this week, 20:05 — 101: reports the occupier of 61 filming his garden and his son. Advice given, closed.",
        "One caution: s.5 Public Order Act 1986, 2019, an argument with a civil enforcement officer in Rochdale town centre. No violence recorded against him.",
        "Housing association tenant at 63 since February. The neighbourhood team has the fence as an open ASB case with the landlord.",
      ],
      scenarioId: "51",
    },
    {
      id: "p51-sutcliffe-kelly",
      name: "SUTCLIFFE, Kelly",
      sex: "F",
      age: 39,
      address: "63 Daventry Road, Kirkholt, Rochdale",
      postcode: "OL11 2HY",
      phone: "07700 900419",
      roles: ["occupant", "witness"],
      notes: [
        "Partner of Lee Duckworth. Inside with the child, per 63; has not come to the phone.",
        "Named by 63 as the person 61's husband called something he will not repeat. Has not spoken to police herself this week.",
      ],
      scenarioId: "51",
    },
    {
      id: "p51-duckworth-mason",
      name: "DUCKWORTH, Mason",
      sex: "M",
      age: 9,
      address: "63 Daventry Road, Kirkholt, Rochdale",
      postcode: "OL11 2HY",
      roles: ["occupant"],
      markers: ["CHILD"],
      notes: [
        "Child at 63, in the house during both calls. Not involved.",
        "The reason 'burn you out' through a party wall is a threat to two houses, and the reason the officer goes to 63's door as well as 61's.",
      ],
      scenarioId: "51",
    },
  ],
  vehicles: [],
  places: [
    {
      id: "pl51-61",
      kind: "premises",
      name: "61 Daventry Road",
      address: "61 Daventry Road, Kirkholt, Rochdale",
      postcode: "OL11 2HY",
      coords: { lat: 53.598, lng: -2.1573 },
      notes: [
        "REPEAT ADDRESS — four contacts in six months, three of them this week, all about no. 63. Nothing attended so far; all graded for central resolution.",
        "Semi-detached, post-war council build, owner-occupied. Adjoins 63 on a party wall; shared rear boundary fence, one panel replaced last weekend and one kicked through Wednesday.",
        "Front door onto a short front garden on Daventry Road, six metres from 63's. Side gate on the north elevation to the rear garden.",
        "Two adults. No known medical or mobility issues.",
      ],
      scenarioId: "51",
    },
    {
      id: "pl51-63",
      kind: "premises",
      name: "63 Daventry Road",
      address: "63 Daventry Road, Kirkholt, Rochdale",
      postcode: "OL11 2HY",
      coords: { lat: 53.5979, lng: -2.1573 },
      notes: [
        "The neighbour's address. One 101 contact this week from the occupier, about being filmed from 61. Housing association tenancy since February.",
        "Two adults and a child of nine at home.",
        "The other half of the semi pair — same party wall, same fence. Side gate on the south elevation.",
        "The neighbourhood team holds the fence as an open ASB case with the landlord. No previous police attendance at this address.",
      ],
      scenarioId: "51",
    },
  ],
};
