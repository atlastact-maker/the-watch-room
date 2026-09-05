# Hospitals, helipads, destination routing and BASICS — research notes

Researched 2026-09-05 with parallel web research and an adversarial check
on every claim. Feeds `gm_hospitals.json`, `src/lib/sim/hospitals.ts`,
`src/lib/sim/basics.ts` and the `A-BASICS` entry in `nwas_stations.json`.
Every field in the hospital file carries its own confidence and note; this
document is the list of what still needs a phone call.

Confidence vocabulary: **confirmed** (primary or trust-side source) ·
**likely** (single or secondary source) · **uncertain** (contradictory or
crowd-sourced) · **unknown** (could not establish — the data file carries
`value: null`, and the sim treats it as *not available*, never as a guess).

## Primary sources

| id | source |
|---|---|
| T1 | GM Major Trauma Network Clinical Management Guidelines v4.0, Aug 2024 — gmccmt.org.uk. The routing document: MTC Collaborative, Trauma Units, Local Emergency Hospitals, and the supplementary Pathfinder. |
| HELP | HELP Appeal key-projects list — helpappeal.org.uk/key-projects. Covers HELP-funded helipads only. |
| GMNISDN | Greater Manchester Neuro-rehabilitation & Integrated Stroke Delivery Network, local stroke units page, dated 12 Jul 2022. Sole source for the District Stroke Centre list. |
| MFT | Manchester University NHS FT helipad pages (Oxford Road campus). |
| NCA | Northern Care Alliance — Salford Royal helipad. |
| NWAA | North West Air Ambulance — fleet and operating pages; Trustees' Annual Report 2024/25. |
| BBA | British Burn Association burn services list, 20 Oct 2017. |
| BASICS | basics.org.uk affiliated-schemes directory; Charity Commission register (1188273, 502386, 702500, 1171932). |

## What the sim now does, and why

**Air conveyance is the exception.** NWAA describes road conveyance with the
HEMS crew aboard the land ambulance as a routine outcome — the aircraft
delivers the clinician, and the pilot repositions solo. MRI's pad has seen
~100 landings a year against a projection of ~300; Salford's ~58 against
~360. Against 1,646 NWAA missions in Greater Manchester in 2025 that is
well under 10%, and London's Air Ambulance — a comparable urban service —
flies back about 4%. The owner chose *operator's choice, helipad-limited*:
the aircraft may convey when the operator picks it, but only to a hospital
with a confirmed pad, by day, and not with a patient in arrest.

**Two pads in patch, not three.** MRI (elevated, Grafton Street car park,
opened 10 May 2021, £3.9m) and Salford Royal (rooftop on the GM Major
Trauma Hospital, £2m HELP). Wythenshawe's "ground-level asphalt pad"
traces to one OurAirports record (GB-0344, last updated 28 June 2016)
republished four ways and copied into OSM; the only landing footage found
is the Children's Air Ambulance, a different charity. It is `unknown` and
not an NWAA destination.

**Destination routing follows the GM Pathfinder.** Penetrating,
thoraco-abdominal, hepatic and pregnant-with-head-injury trauma to MRI;
cranial trauma with GCS under 12 to Salford; every child to RMCH; and the
**RED STANDBY major trauma pit stop** — unmanageable airway, breathing or
haemorrhage goes to the *nearest* trauma-receiving site to be stabilised,
which is what makes Oldham, Stepping Hill and Wigan's Trauma Units matter.
Hyperacute stroke is clock-gated: Fairfield and Stepping Hill 06:45–22:45,
Salford (the CSC, 24/7 thrombectomy since March 2022) at all other hours.

**BASICS is an alert, not a dispatch.** See below.

## The unverified list — in the order it would hurt

1. **Does Wythenshawe have a formal helipad?** One 2016 crowd-sourced
   record, republished. *Close it:* MFT estates, or an FOI to NWAS for its
   designated helicopter landing site register.
2. **Does Wythenshawe's ED take children?** MFT's 2020 notice diverting
   paediatric emergencies to RMCH is still live with no reopening published;
   another MFT page describes a working five-bay children's department. The
   sim excludes it for children and says so in the routing warning. *Close
   it:* phone MFT.
3. **Night landing at MRI and Salford.** Genuinely unknown. The "24-hour
   access" phrasing that circulates refers to the link bridge, not night
   flying. The HELP Appeal itemised "helipad lighting" in what it funded at
   Preston and named none at Salford. OSM's `lit=no` on Salford deserves
   near-zero weight.
4. **Does NWPCCC actually respond in Greater Manchester, and how often?**
   BASICS' directory says Warrington/Appleton; the Cheshire & Merseyside
   trauma network says it covers Manchester. The ~384 incidents in 2024
   rests on the charity's social output. *Close it:* NWPCCC's filed accounts
   (charity 502386) — never fetched, and the one document with headcount,
   geography and volume.
5. **The callsign prefixes.** `MX` = BASICS doctor is one clinician's
   description of his own callsign in one blog post. `MA` = MERIT has no
   corroboration at all. Both remain in `data.ts`.
6. **Off-site designated landing sites for the seven pad-less hospitals.**
   Unknown. NWAS and the trusts hold the registers. All seven carry
   `offSiteHls: unknown`.
7. **Is primary PCI genuinely 24/7 at MRI and Wythenshawe?** Stated in
   catheter-lab recruitment adverts, not a service specification. A 2017
   Royal Oldham protocol described an in-hours rota with a 17:30 handover
   and is nine years stale. Both are `likely`. No hotline numbers shipped.
8. **The GM major trauma designation is provisional.** Four peer reviews
   2014–2024 found GM non-compliant; a site-selection study to pick a single
   specialist site is running and undecided. `network.underReview: true`.
9. **Salford's helipad operational date** (June 2024) is press inference
   from "117 landings in two years" reported 1 June 2026.
10. **NWAA Helimed callsign ↔ registration mapping** is spotter data and
    not used.

## BASICS — what was corrected

- `abbreviations.md` said "BASICS North West is the regional branch" and
  marked it Confirmed. **Wrong.** BASICS North West (charity 702500) is a
  dormant shell: £60 income, £288 expenditure FYE 31 Dec 2025, website 503,
  absent from BASICS' own directory. Corrected in place.
- The scheme whose area reaches GM is the **North West Pre-hospital
  Critical Care Charity** (NWPCCC, 502386), Unit 8 Asher Court, Appleton,
  Warrington WA4 4ST. Doctors and enhanced-care paramedics; two response
  cars (TS1 BMW X5, TS2 Land Rover Discovery) or own vehicles.
- **ER:LAM** (1171932): reporting overdue ~1,164 days, absent from the
  directory — almost certainly not operational. **SMART** (1987) became
  UK-Med in 1995. Neither is modelled.
- **Alerting is a text, then a phone call** — "we receive a text about any
  high acuity call within a 20 mile radius of the handset … the Incident
  Hub of NWAS will phone us, check availability and then despatch us"
  (NWPCCC clinician, Aug 2023). Not a pager. Airwave radio with a personal
  callsign; Airwave remains the network in 2026.
- **MERIT is not BASICS.** NWAS MERIT (March 2014) is a 24-hour on-call
  *medical advisor* capability for command and casualty distribution at a
  declared major incident. `SCOPE_BY_TYPE` still maps `MERIT → "basics"`;
  it is not offered as a BASICS candidate, but the mapping is a category
  error left for a later pass.

## Every number in `basics.ts` is a judgement

No North West scheme publishes activation-to-scene times or answer rates.
The probabilities (per responder: 0.20 within 15 km, 0.08 to 20 miles,
× 0.6 overnight) and timings (hub 30–90 s, answer 30–120 s, 4-minute
timeout, 4–10 min turnout) are calibrated only against NWPCCC's ~384/yr
across four counties and BEEP Doctors' 183 callouts with 13 doctors in
Cumbria. The roster of three (Warrington, Altrincham, Stockport) is a
judgement too; NWPCCC's accounts would give the real headcount. The
harness (`npm run check:hospitals`) pins the *shape* — south Manchester a
little under half by day, the northern band around one in seven, night
quieter — not the figures.
