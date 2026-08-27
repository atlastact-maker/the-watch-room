# Greater Manchester Fire & Rescue Service — Station, Callsign & Fleet Reference

Source: user-supplied callsign list. Transcribed as-is; corrections and suspected errors are flagged in
the **Notes** column and in [Data caveats](#data-caveats) rather than silently fixed.

## How to read / parse this file

- **Section 3** is the master table: one row per physical vehicle or pod.
- Cell values `n/a` = not applicable (e.g. a demountable pod has no VRM); `unknown` = missing from source.
- `Category` is a normalised enum (see Section 2) intended for switch/filter logic in code.
- `Station Code` is the `Gnn` prefix of the callsign and is the stable join key to Section 1.
- VRMs are normalised to `XXNN XXX` spacing.
- Some callsigns legitimately appear twice (a carrier vehicle and the asset it transports share a callsign).
  Do **not** treat `Callsign` as a unique primary key — use `Callsign + VRM`, or `Callsign + Make & Model`.

---

## 1. Stations

| Station Code | Station | Crewing | Notes |
|---|---|---|---|
| G10 | Stretford | Wholetime | National Resilience host station |
| G11 | Sale | Wholetime | |
| G12 | Altrincham | Wholetime | |
| G13 | Moss Side | Wholetime | |
| G14 | Withington | Wholetime | |
| G15 | Wythenshawe | Wholetime | |
| G16 | Manchester Central | Wholetime | |
| G17 | Blackley | Wholetime | |
| G18 | Phillips Park | Wholetime | |
| G19 | Gorton | Wholetime | |
| G20 | Whitehill | Wholetime | Currently also hosting G21 |
| G21 | Stockport Central | Wholetime | Temporarily based at Whitehill (G20) due to station rebuild |
| G22 | Cheadle | Wholetime | |
| G23 | Offerton | Wholetime | |
| G24 | Marple | Day crewed | |
| G30 | Rochdale | Wholetime | |
| G31 | Littleborough | Day crewed | |
| G32 | Heywood | Wholetime | |
| G33 | Oldham | Wholetime | |
| G34 | Hollins | Wholetime | |
| G35 | Chadderton | Wholetime | |
| G36 | Bury | Wholetime | National Resilience host station |
| G37 | Whitefield | Wholetime | |
| G38 | Ramsbottom | Day crewed | |
| G39 | Ashton-under-Lyne | Wholetime | Enhanced Rescue / USAR host station |
| G40 | Stalybridge | Wholetime | ATV / beavertail host station |
| G41 | Mossley | Day crewed | |
| G42 | Hyde | Wholetime | Command support host station |
| G50 | Bolton Central | Wholetime | National Resilience host station |
| G51 | Bolton North | Wholetime | ATV / beavertail host station |
| G52 | Horwich | Day crewed | |
| G53 | Farnworth | Wholetime | National Resilience host station (MDU, USAR pod) |
| G54 | Wigan | Wholetime | |
| G55 | Hindley | Wholetime | |
| G56 | Atherton | Wholetime | Command support host station |
| G57 | Leigh | Wholetime | Enhanced Rescue host station |
| G57-R | Leigh Technical Services Centre | Support site | Workshops, support fleet and reserve fleet |
| G58 | Salford | Wholetime | |
| G59 | Broughton | Wholetime | |
| G60 | Agecroft | Wholetime | |
| G61 | Eccles | Wholetime | |
| G62 | Irlam | Day crewed | |
| G80 | Headquarters | Support site | Drone Unit |

> Crewing is only stated in the source for the day-crewed stations; all others are marked `Wholetime` by
> inference and should be verified before use as fact.

---

## 2. Callsign convention

Format: `G` + station number + type letter + sequence number, e.g. `G50P2` = Bolton Central, pump, 2.

| Letter | Category | Observed meaning |
|---|---|---|
| P | `PUMP` | Pumping appliance (some marked UHPL — Ultra High Pressure Lance) |
| A | `AERIAL` | Turntable ladder / hydraulic platform |
| R | `RESCUE` | Enhanced Rescue Unit / USAR |
| C | `COMMAND` | Command Unit / Command Support Unit |
| B | `WATER_RESCUE` | Water Incident Unit |
| W | `HOSE` | Hose Laying / Hose Retrieval Unit |
| M | `OFF_ROAD` | Wildfire vans, beavertails, Hagglunds, Polaris |
| T | `PRIME_MOVER` | National Resilience prime mover |
| N | `POD` | Demountable pod / National Resilience asset |
| S | `SUPPORT` | Specialist support (foam, BA, welfare, catering, forklift) |
| H | `HAZMAT` | Detection, Identification & Monitoring |

> This decoder is inferred from the pattern in the list, not stated in the source. Treat as a working
> assumption.

---

## 3. Fleet — master table

| Callsign | Station | Station Code | Category | Role / Description | Year | Make & Model | VRM | Notes |
|---|---|---|---|---|---|---|---|---|
| G10P1 | Stretford | G10 | PUMP | Pump — UHPL | 2018 | Volvo FL Crew Cab | PO68 WCF | |
| G10A3 | Stretford | G10 | AERIAL | 32m Turntable Ladder | 2018 | Volvo FL | PO68 WLV | |
| G10T6 | Stretford | G10 | PRIME_MOVER | Prime Mover — National Resilience | 2004 | MAN TG-A | WX54 VLR | Fleet no. PM007 |
| G10N981 | Stretford | G10 | POD | High Volume Pump / Single Box Hose Layer — National Resilience | unknown | unknown | n/a | Demountable pod |
| G10N991 | Stretford | G10 | POD | Double Hose Box — National Resilience | unknown | unknown | n/a | Demountable pod |
| unknown | Stretford | G10 | SUPPORT | Fire Investigation Unit | 2007 | Iveco Daily | unknown | Callsign redacted in source as `G10*****` |
| G11P1 | Sale | G11 | PUMP | Pump | 2019 | Volvo FL Crew Cab | PK69 FLC | |
| G11S2 | Sale | G11 | SUPPORT | Foam Unit | 2009 | Volvo FM Crew Cab | PN09 JUO | Shares callsign with the forklift below |
| G11S2 | Sale | G11 | SUPPORT | Forklift | 2011 | Moffett Mounty | KS60 JYT | Shares callsign with the Foam Unit above |
| G12P1 | Altrincham | G12 | PUMP | Pump | 2023 | Volvo FL Crew Cab | PF23 OPZ | |
| G12S1 | Altrincham | G12 | SUPPORT | Breathing Apparatus Unit | 2007 | Volvo FL Crew Cab | PN57 AOW | |
| G13P1 | Moss Side | G13 | PUMP | Pump — UHPL | 2019 | Volvo FL Crew Cab | PK69 FLE | |
| G13P2 | Moss Side | G13 | PUMP | Pump — UHPL | 2011 | Volvo FL Crew Cab | PO11 AVG | |
| G14P1 | Withington | G14 | PUMP | Pump | 2023 | Volvo FL Crew Cab | PF23 OPT | |
| G15P1 | Wythenshawe | G15 | PUMP | Pump — UHPL | 2019 | Volvo FL Crew Cab | PK69 FKW | |
| G15P2 | Wythenshawe | G15 | PUMP | Pump — UHPL | 2011 | Volvo FL Crew Cab | PO11 AVD | |
| G16P1 | Manchester Central | G16 | PUMP | Pump — UHPL | 2018 | Volvo FL Crew Cab | PO68 WCE | |
| G16P2 | Manchester Central | G16 | PUMP | Pump — UHPL | 2011 | Volvo FL Crew Cab | PO11 AVJ | |
| G16A3 | Manchester Central | G16 | AERIAL | 42m Turntable Ladder | 2018 | Volvo FL | PO68 WLW | Off the run (broken); G20A3 reserving |
| G16S6 | Manchester Central | G16 | SUPPORT | GMFRS / British Red Cross vehicle | 2013 | Fiat Tribute | LF63 OSM | |
| G17P1 | Blackley | G17 | PUMP | Pump — UHPL | 2021 | Volvo FL Crew Cab | PJ21 OVB | |
| G18P1 | Phillips Park | G18 | PUMP | Pump — UHPL | 2019 | Volvo FL Crew Cab | PK69 FLF | |
| G19P1 | Gorton | G19 | PUMP | Pump — UHPL | 2021 | Volvo FL Crew Cab | PJ21 OWK | |
| G19P2 | Gorton | G19 | PUMP | Pump | 2011 | Volvo FL Crew Cab | PO11 AVB | |
| G20P1 | Whitehill | G20 | PUMP | Pump | 2018 | Volvo FL Crew Cab | PO68 WCG | |
| G20A3 | Whitehill | G20 | AERIAL | 42m Turntable Ladder | 2021 | Volvo FL | PN21 KFT | Currently reserving for G16A3 |
| G21P1 | Stockport Central | G21 | PUMP | Pump | 2021 | Volvo FL Crew Cab | PJ21 OVC | Temporarily based at Whitehill (G20) |
| G22P1 | Cheadle | G22 | PUMP | Pump | 2023 | Volvo FL Crew Cab | PF23 OPV | |
| G22W2 | Cheadle | G22 | HOSE | Hose Laying Unit / Hose Retrieval Unit | 2015 | Volvo FL Crew Cab | PJ15 OGM | |
| G23P1 | Offerton | G23 | PUMP | Pump | 2023 | Volvo FL Crew Cab | PF23 OPW | |
| G24P1 | Marple | G24 | PUMP | Pump | 2023 | Volvo FL Crew Cab | PF23 OPO | Day crewed station |
| G30P1 | Rochdale | G30 | PUMP | Pump — UHPL | 2018 | Volvo FL Crew Cab | PO68 WWP | |
| G30P2 | Rochdale | G30 | PUMP | Pump — UHPL | 2011 | Volvo FL Crew Cab | PO11 AVM | |
| G30C1 | Rochdale | G30 | COMMAND | Command Unit | 2010 | Volvo FL Crew Cab | PO60 DWF | |
| G31P1 | Littleborough | G31 | PUMP | Pump | 2011 | Volvo FL Crew Cab | PO11 AVV | Day crewed station |
| G31M6 | Littleborough | G31 | OFF_ROAD | Wildfire Van / Wildfire Burns Team | 2017 | Mercedes-Benz Sprinter | PO17 CJY | VRM clashes with G41M2 — see caveats |
| G32P1 | Heywood | G32 | PUMP | Pump — UHPL | 2018 | Volvo FL Crew Cab | PO68 WWS | |
| G32B2 | Heywood | G32 | WATER_RESCUE | Water Incident Unit | 2007 | Iveco Daily | MX07 GYY | |
| G33P1 | Oldham | G33 | PUMP | Pump | 2018 | Volvo FL Crew Cab | PO68 WCK | |
| G33A1 | Oldham | G33 | AERIAL | Hydraulic Platform | 2004 | Volvo FL | PN05 UVJ | Year/plate mismatch — 05 plate suggests 2005 |
| G34P1 | Hollins | G34 | PUMP | Pump | 2023 | Volvo FL Crew Cab | PF23 OPP | |
| G35P1 | Chadderton | G35 | PUMP | Pump — UHPL | 2019 | Volvo FL Crew Cab | PK69 FKS | |
| G35W2 | Chadderton | G35 | HOSE | Hose Laying Unit / Hose Retrieval Unit | 2015 | Volvo FL Crew Cab | PJ15 OGN | |
| G35S4 | Chadderton | G35 | SUPPORT | Salvation Army Incident Ground Catering Unit | 2013 | Iveco Daily | PO13 FLL | |
| G36P1 | Bury | G36 | PUMP | Pump | 2023 | Volvo FL Crew Cab | PF23 OPU | |
| G36T6 | Bury | G36 | PRIME_MOVER | Prime Mover — National Resilience | 2004 | MAN TG-A | WX54 VKG | Fleet no. PM038 |
| G36N851 | Bury | G36 | POD | Environmental Protection Unit — Environment Agency | unknown | unknown | n/a | Demountable pod |
| G37P1 | Whitefield | G37 | PUMP | Pump — UHPL | 2018 | Volvo FL Crew Cab | PO68 WWR | |
| G38P1 | Ramsbottom | G38 | PUMP | Pump — UHPL | 2011 | Volvo FL Crew Cab | PO11 AVF | Day crewed station |
| G38H8 | Ramsbottom | G38 | HAZMAT | Detection, Identification & Monitoring | 2024 | Iveco Daily | MW24 RLY | Fleet no. DIM 018 |
| G39P1 | Ashton-under-Lyne | G39 | PUMP | Pump | 2023 | Volvo FL Crew Cab | PF23 ORA | |
| G39R2 | Ashton-under-Lyne | G39 | RESCUE | Enhanced Rescue Unit | 2018 | Rosenbauer Volvo FL Crew Cab | PO18 TVW | |
| G39R4 | Ashton-under-Lyne | G39 | RESCUE | Enhanced Rescue Unit | 2017 | Mercedes-Benz Sprinter | PO67 CJX | |
| G39R6 | Ashton-under-Lyne | G39 | RESCUE | Enhanced Rescue Unit — Urban Search & Rescue | 2008 | Volvo FL Crew Cab | PO58 LFR | Also shown as SR11 |
| G40P1 | Stalybridge | G40 | PUMP | Pump | 2023 | Volvo FL Crew Cab | PF23 OPS | |
| G40M1 | Stalybridge | G40 | OFF_ROAD | Beavertail carrying Hagglund | 2021 | DAF LF Beavertail | DV71 MTJ | Carrier for K258 KNT |
| G40M1 | Stalybridge | G40 | OFF_ROAD | All-terrain vehicle | unknown | Hagglund BV206 | K258 KNT | Carried on DV71 MTJ |
| G40M3 | Stalybridge | G40 | OFF_ROAD | Beavertail carrying Polaris | 2014 | DAF LF Beavertail | AV64 OPK | Carrier for PE72 JMU |
| G40M3 | Stalybridge | G40 | OFF_ROAD | All-terrain vehicle | 2022 | Polaris Ranger | PE72 JMU | Carried on AV64 OPK |
| G41P1 | Mossley | G41 | PUMP | Pump | 2024 | Volvo FL Crew Cab | PK24 LFG | Day crewed station |
| G41M2 | Mossley | G41 | OFF_ROAD | Wildfire Van | 2017 | Mercedes-Benz Sprinter | PO17 CJY | VRM clashes with G31M6 — see caveats |
| G42P1 | Hyde | G42 | PUMP | Pump — UHPL | 2019 | Volvo FL Crew Cab | unknown | VRM missing from source |
| G42C2 | Hyde | G42 | COMMAND | Command Support Unit | 2004 | Volvo FL | MV54 AVT | |
| G42S3 | Hyde | G42 | SUPPORT | Command Support Welfare Vehicle | 2014 | Peugeot Boxer | YJ64 JBE | |
| G50P1 | Bolton Central | G50 | PUMP | Pump — UHPL | 2018 | Volvo FL Crew Cab | PO68 WCJ | |
| G50P2 | Bolton Central | G50 | PUMP | Pump — UHPL | 2011 | Volvo FL Crew Cab | PO11 AVC | |
| G50A3 | Bolton Central | G50 | AERIAL | 32m Turntable Ladder | 2021 | Volvo FL | PJ22 XGM | Year/plate mismatch — 22 plate suggests 2022 |
| G50T6 | Bolton Central | G50 | PRIME_MOVER | Prime Mover — National Resilience | 2004 | MAN TG-A | WX54 VNT | Fleet no. PM089 |
| G50T7 | Bolton Central | G50 | PRIME_MOVER | Prime Mover — National Resilience | 2004 | MAN TG-A | WX54 VTF | Fleet no. PM187 |
| G50N982 | Bolton Central | G50 | POD | High Volume Pump / Single Box Hose Layer — National Resilience | unknown | unknown | n/a | Demountable pod |
| G50N992 | Bolton Central | G50 | POD | Double Hose Box — National Resilience | unknown | unknown | n/a | Demountable pod |
| G51P1 | Bolton North | G51 | PUMP | Pump | 2023 | Volvo FL Crew Cab | PF23 OPX | |
| G51M1 | Bolton North | G51 | OFF_ROAD | Beavertail carrying Hagglund | 2021 | DAF LF Beavertail | DY71 PFO | Carrier for K257 FNT |
| G51M1 | Bolton North | G51 | OFF_ROAD | All-terrain vehicle | unknown | Hagglund BV206 | K257 FNT | Carried on DY71 PFO |
| G51M3 | Bolton North | G51 | OFF_ROAD | Beavertail carrying Polaris | 2014 | DAF LF Beavertail | AV64 OPJ | Carrier for PE72 JMV |
| G51M3 | Bolton North | G51 | OFF_ROAD | All-terrain vehicle | 2022 | Polaris Ranger | PE72 JMV | Carried on AV64 OPJ |
| G52P1 | Horwich | G52 | PUMP | Pump — UHPL | 2011 | Volvo FL Crew Cab | PO11 AVK | Day crewed station |
| G52M2 | Horwich | G52 | OFF_ROAD | Wildfire Van | 2017 | Mercedes-Benz Sprinter | PO67 CJZ | |
| G53P1 | Farnworth | G53 | PUMP | Pump | 2019 | Volvo FL Crew Cab | PK69 FLB | |
| G53P2 | Farnworth | G53 | PUMP | Pump — UHPL | 2011 | Volvo FL Crew Cab | PO60 KWV | |
| G53S2 | Farnworth | G53 | SUPPORT | Foam Unit | 2009 | Volvo FM Crew Cab | PN09 JUK | Shares callsign with the forklift below |
| G53S2 | Farnworth | G53 | SUPPORT | Forklift | 2010 | Moffett Mounty | KX60 JYS | Shares callsign with the Foam Unit above |
| G53T7 | Farnworth | G53 | PRIME_MOVER | Prime Mover — National Resilience | 2004 | MAN TG-A | WX54 VUA | Fleet no. PM186; callsign G53T7 duplicates G50T7 |
| G53N591 | Farnworth | G53 | POD | Mass Decontamination Unit | unknown | unknown | n/a | Fleet no. MDU 005 |
| G53N755 | Farnworth | G53 | POD | USAR shoring pod | unknown | unknown | n/a | Source reads "Shawing Pod" — likely "Shoring" |
| G54P1 | Wigan | G54 | PUMP | Pump — UHPL | 2019 | Volvo FL Crew Cab | PK69 FKX | |
| G54P2 | Wigan | G54 | PUMP | Pump — UHPL | 2011 | Volvo FL Crew Cab | PO60 KWU | |
| G55P1 | Hindley | G55 | PUMP | Pump — UHPL | 2021 | Volvo FL Crew Cab | PJ21 OWG | |
| G56P1 | Atherton | G56 | PUMP | Pump | 2024 | Volvo FL Crew Cab | PK24 LFD | |
| G56C2 | Atherton | G56 | COMMAND | Command Support Unit | 2004 | Volvo FL | MV54 AYW | |
| G56S3 | Atherton | G56 | SUPPORT | Command Support Welfare Vehicle | 2014 | Peugeot Boxer | YJ64 JBO | |
| G57P1 | Leigh | G57 | PUMP | Pump | 2023 | Volvo FL Crew Cab | PF23 OPY | |
| G57R2 | Leigh | G57 | RESCUE | Enhanced Rescue Unit | 2018 | Rosenbauer Volvo FL Crew Cab | PO18 TVV | |
| G57R4 | Leigh | G57 | RESCUE | Enhanced Rescue Unit | 2017 | Mercedes-Benz Sprinter | PO67 CJU | |
| G57A1 | Leigh | G57 | AERIAL | Hydraulic Platform | 2004 | Volvo FL | MV04 AWX | Recall to duty |
| G58P1 | Salford | G58 | PUMP | Pump — High Reach Extendable Turret | 2019 | Volvo FL Crew Cab | SJ69 CKD | |
| G58P2 | Salford | G58 | PUMP | Pump — UHPL | 2011 | Volvo FL Crew Cab | PO11 AVN | |
| G59P1 | Broughton | G59 | PUMP | Pump — UHPL | 2021 | Volvo FL Crew Cab | PJ21 OWH | |
| G60P1 | Agecroft | G60 | PUMP | Pump | 2023 | Volvo FL Crew Cab | PF23 OPR | |
| G61P1 | Eccles | G61 | PUMP | Pump — UHPL | 2021 | Volvo FL Crew Cab | PJ21 OWM | |
| G61B2 | Eccles | G61 | WATER_RESCUE | Water Incident Unit | 2007 | Iveco Daily | MX07 GYZ | |
| G62P1 | Irlam | G62 | PUMP | Pump — UHPL | 2011 | Volvo FL Crew Cab | PO11 AUY | Day crewed station |
| G62M2 | Irlam | G62 | OFF_ROAD | Wildfire Van | 2017 | Mercedes-Benz Sprinter | PO17 EOZ | |
| G62S7 | Irlam | G62 | SUPPORT | Welfare Unit | 2007 | Iveco Daily | PN07 ERJ | Tows the welfare trailer below |
| G62S7 | Irlam | G62 | SUPPORT | Welfare Trailer | unknown | unknown | n/a | Towed by PN07 ERJ |
| — | Leigh Technical Services Centre | G57-R | SUPPORT | Recovery Truck | 2008 | Volvo FM-340 | unknown | Callsign redacted in source as `G57**` |
| — | Leigh Technical Services Centre | G57-R | SUPPORT | Equipment Support | 2013 | Iveco ML75E16/P | unknown | Callsign redacted in source as `G57**` |
| — | Leigh Technical Services Centre | G57-R | SUPPORT | Community Vehicle | 2012 | Iveco ML80E18/FP | PO12 BFX | Callsign redacted in source |
| G61B2 / G32B2 | Leigh TSC — Reserve Fleet | G57-R | WATER_RESCUE | Reserve Water Incident Unit | 2014 | Iveco Daily | PK14 LFH | Reserves for either Eccles or Heywood |
| — | Leigh TSC — Reserve Fleet | G57-R | PUMP | Reserve Pump — UHPL | 2011 | Volvo FL Crew Cab | PO60 KWR | No standing callsign |
| — | Leigh TSC — Reserve Fleet | G57-R | PUMP | Reserve Pump | 2008 | Volvo FL Crew Cab | PF08 SNX | No standing callsign |
| — | Leigh TSC — Reserve Fleet | G57-R | PUMP | Reserve Pump | 2010 | Volvo FL Crew Cab | PO60 KWZ | Noted against "MCR Central Incident" |
| G80N861 | Headquarters | G80 | SUPPORT | GMFRS Drone Unit | 2020 | Ford Ranger | BP70 XTK | |

---

## 4. Data caveats

Flagging these rather than guessing, since they'll trip up any importer:

1. **Duplicate VRM `PO17 CJY`** — listed against both `G31M6` (Littleborough) and `G41M2` (Mossley). One of
   the two is wrong in the source. Note the neighbouring Sprinters run `PO17 EOZ`, `PO67 CJX`, `PO67 CJU`
   and `PO67 CJZ`, so the pattern doesn't resolve it either way.
2. **Duplicate callsign `T7`** — `G50T7` (WX54 VTF, PM187) and `G53T7` (WX54 VUA, PM186) are distinct
   vehicles at different stations, so this is only a collision if you key on the type letter alone.
3. **Shared callsigns by design** — foam unit + forklift (`G11S2`, `G53S2`), beavertail + carried ATV
   (`G40M1`, `G40M3`, `G51M1`, `G51M3`), welfare unit + trailer (`G62S7`).
4. **Missing VRM** — `G42P1` (Hyde) has none listed.
5. **Redacted callsigns** — the Stretford Fire Investigation Unit and the three Leigh TSC support vehicles
   were masked with asterisks in the source.
6. **Year/plate mismatches** — `G33A1` (2004 vs 05 plate), `G50A3` (2021 vs 22 plate), `G53P2` and the
   `PO60`/`KW` pumps (2011 vs 60 plate). Registration year is usually the more reliable of the two.
7. **`G53N755` "Shawing Pod"** — almost certainly a typo for a USAR **shoring** pod.
8. **Availability states are point-in-time** — `G16A3` broken with `G20A3` reserving, `G57A1` on recall to
   duty, and `G21` displaced to Whitehill are all transient and will go stale.
9. **Crewing** — only the six day-crewed stations are stated in the source. Everything else marked
   `Wholetime` is inference.

---

## 5. Counts

| Category | Count |
|---|---|
| PUMP | 47 |
| AERIAL | 6 |
| RESCUE | 4 |
| COMMAND | 3 |
| OFF_ROAD | 11 |
| POD | 7 |
| PRIME_MOVER | 5 |
| HOSE | 2 |
| WATER_RESCUE | 3 |
| SUPPORT | 13 |
| HAZMAT | 1 |
| **Total rows** | **102** |

Stations: 43 fire stations + 2 support sites (Leigh TSC, HQ).
