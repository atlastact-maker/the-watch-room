import raw from "@/../data/research/ambulance/gm_hospitals.json";
import type { HospitalDestinationType, PatientRedFlag } from "./scene";

// ---------------------------------------------------------------------------
// Evidence. Every fact about a hospital that dispatch routes on is wrapped
// in one of these, so the data file can say "we do not know" instead of
// quietly defaulting to false. `unknown` is a shipping value: the router
// treats it as "not available", never as a guess either way.
// ---------------------------------------------------------------------------

export type Confidence = "confirmed" | "likely" | "uncertain" | "unknown";

/** Three-way presence. `no_evidence` means we looked — the HELP Appeal
 *  list, OSM, targeted search — and found nothing, which is not the same
 *  as knowing there is nothing. Render it as "not recorded", not "no". */
export type Presence = "yes" | "no_evidence" | "unknown";

export type Ev<T> = {
  /** null only when confidence is "unknown". */
  value: T | null;
  confidence: Confidence;
  sources: string[];
  note?: string;
  asOf?: string;
};

export type TraumaTier =
  | "mtc_adult"        // a site of the GM two-site MTC Collaborative
  | "mtc_paediatric"   // RMCH — the North West Children's network
  | "trauma_unit"
  | "local_emergency"
  | "none";

export type Hospital = {
  id: string;
  name: string;
  address: string;
  town: string;
  postcode: string;
  coords: { lat: number; lng: number };
  /** false = a conveyance destination at the network edge, not a patch
   *  hospital. Never dispatched to by default. */
  inPatch: boolean;
  trust: string;
  sharedCampusWith?: string;

  ed: Ev<{
    open24h: boolean;
    /** 16 where the record says "16 years or over". */
    adultAgeFloor: number | null;
    paediatric: Presence;
    paediatricNote?: string;
  }>;
  trauma: Ev<{
    tier: TraumaTier;
    pathfinderRole?: "penetrating_vascular" | "cranial_gcs_lt12" | null;
    ttlPreAlert?: string | null;
  }>;
  ppci: Ev<{ receiving: boolean; hours: "24_7" | "in_hours" | "unknown" }>;
  stroke: Ev<{
    role: "csc" | "asc" | "dsc" | "none";
    hours: string | null;
    thrombectomy: "24_7" | "none";
    remoteCoverAfter?: string | null;
    catchment?: string[];
  }>;
  burns: Ev<{
    adult: "burn_centre" | "none";
    paediatric: "burn_centre" | "burn_service" | "none";
  }>;
  neuro: Ev<{ adultNeurosurgery: boolean; paediatricNeurosurgery: boolean }>;
  vascular: Ev<{ role: "gm_hub" | "mft_site" | "none" }>;
  cardiothoracic: Ev<{ surgery: boolean; transplant: boolean; ecmo: boolean }>;
  helipad: Ev<{
    present: Presence;
    kind: "elevated_rooftop" | "rooftop" | "ground" | "none" | "unknown";
    /** Near-universally unknown. Nobody publishes night clearance. */
    nightUse: Presence;
    servesSites?: string[];
    openedOn?: string | null;
    /** Calibration only — never a mechanic. */
    landingsPerYear?: number | null;
    outOfService?: { from: string; to: string; temporaryHls?: string } | null;
    physicalLimits?: { maxRotorM: number; maxWeightT: number } | null;
  }>;
  offSiteHls: Ev<{ present: Presence; name: string | null; approxDistanceM: number | null }>;
  otherOperatorLandingsObserved?: boolean;
};

// The JSON's inferred type has string where the model has unions; the
// harness (npm run check:hospitals) is what enforces the shape.
export const HOSPITALS: Hospital[] = raw.hospitals as unknown as Hospital[];

/** The network-level facts: one MTC function over two sites, under review. */
export const HOSPITAL_NETWORK = raw.network as unknown as {
  mtcModel: string;
  note: string;
  underReview: boolean;
  reviewNote: string;
  confidence: Confidence;
  traumaAdultAgeFloor: number;
  rmchEdAgeCeiling: number;
};

/** GMMTN is explicit that 16 is hard for trauma: 15 and under go to RMCH
 *  regardless of what else is nearer. */
export const TRAUMA_ADULT_AGE_FLOOR = HOSPITAL_NETWORK.traumaAdultAgeFloor;

export function hospitalById(id: string): Hospital | undefined {
  return HOSPITALS.find((h) => h.id === id);
}

function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function nearestOf(list: Hospital[], coords: { lat: number; lng: number }): Hospital | null {
  let best: Hospital | null = null;
  let bestDist = Infinity;
  for (const h of list) {
    const d = haversineMeters(coords, h.coords);
    if (d < bestDist) {
      best = h;
      bestDist = d;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Capability predicates. Each reads the evidence record and treats
// "unknown" as "not available" — a child is not routed to a department
// the trust's own pages disagree about.
// ---------------------------------------------------------------------------

/** A 24-hour emergency department that will take this patient's age. */
export function hasEd24(h: Hospital, ageYears?: number): boolean {
  const ed = h.ed.value;
  if (!ed || !ed.open24h) return false;
  if (ed.adultAgeFloor !== null && ageYears !== undefined && ageYears < ed.adultAgeFloor) {
    return ed.paediatric === "yes";
  }
  return true;
}

export function hasPaedEd(h: Hospital): boolean {
  return h.ed.value?.paediatric === "yes";
}

export function traumaTier(h: Hospital): TraumaTier {
  return h.trauma.value?.tier ?? "none";
}

export function isMtc(h: Hospital, ageYears?: number): boolean {
  const tier = traumaTier(h);
  if (ageYears !== undefined && ageYears < TRAUMA_ADULT_AGE_FLOOR) return tier === "mtc_paediatric";
  return tier === "mtc_adult";
}

export function isTraumaReceiving(h: Hospital): boolean {
  const tier = traumaTier(h);
  return tier === "mtc_adult" || tier === "mtc_paediatric" || tier === "trauma_unit";
}

export function hasPpci(h: Hospital): boolean {
  return h.ppci.value?.receiving === true;
}

/** Hyperacute stroke at this hour. The two ASCs take admissions
 *  06:45–22:45; outside that, every GM hyperacute stroke goes to the CSC
 *  at Salford. Thrombectomy-eligible patients go to the CSC at any hour. */
export function takesHyperacuteStroke(h: Hospital, hhmm: string, thrombectomy = false): boolean {
  const s = h.stroke.value;
  if (!s) return false;
  if (s.role === "csc") return true;
  if (s.role !== "asc") return false;
  if (thrombectomy) return false;
  return hhmm >= "06:45" && hhmm < "22:45";
}

export function hasBurns(h: Hospital, ageYears?: number): boolean {
  const b = h.burns.value;
  if (!b) return false;
  if (ageYears !== undefined && ageYears < TRAUMA_ADULT_AGE_FLOOR) return b.paediatric !== "none";
  return b.adult === "burn_centre";
}

/** Can an air ambulance put down here. In patch that is MRI and Salford
 *  Royal only. Anything "no_evidence" or "unknown" is a no — including
 *  Wythenshawe, where the only landing footage traced is a different
 *  charity's aircraft. */
export function hasHelipad(h: Hospital, at: Date = new Date()): boolean {
  const p = h.helipad.value;
  if (!p || p.present !== "yes") return false;
  // A dated closure — Preston's ten weeks of refurbishment — is only a
  // closure while the sim's clock is inside it. "2025-07" reads as the
  // first of the month; the end of the window runs to the end of its.
  if (p.outOfService) {
    const from = new Date(p.outOfService.from + (p.outOfService.from.length === 7 ? "-01" : ""));
    const toRaw = new Date(p.outOfService.to + (p.outOfService.to.length === 7 ? "-01" : ""));
    const to = p.outOfService.to.length === 7 ? new Date(toRaw.getFullYear(), toRaw.getMonth() + 1, 0) : toRaw;
    if (at >= from && at <= to) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Destination resolution. The operator picks a TYPE; this turns it into an
// actual hospital, and says why. Replaces nearestHospital() at both
// conveyance call sites.
// ---------------------------------------------------------------------------

/** Injury patterns the GM supplementary Pathfinder splits on. Authored on
 *  the casualty; absent means blunt / unspecified. */
export type InjuryPattern =
  | "penetrating"
  | "thoraco_abdominal"
  | "hepatic_suspected"
  | "pregnant_over_20w";

export type DestinationCasualty = {
  ageYears?: number;
  redFlags: PatientRedFlag[];
  injuryPattern?: InjuryPattern[];
  /** Live GCS if known — drives the cranial Pathfinder limb. */
  gcs?: number;
  /** Thrombectomy-eligible stroke (large vessel occlusion suspected). */
  thrombectomyEligible?: boolean;
};

export type DestinationDecision = {
  hospital: Hospital;
  /** Human-readable, for the CAD log. */
  rule: string;
  /** The nearer 24h ED that was passed, if any. */
  bypassed: Hospital | null;
  /** Straight-line metres to the chosen site versus the nearest ED. The
   *  caller prices road time; this is what it prices. */
  bypassExtraMeters: number;
  /** Capability asked for was not available; routed elsewhere. */
  downgraded: boolean;
  /** RED STANDBY — major trauma pit stop to the nearest trauma-receiving
   *  site because the patient cannot be managed for the longer run. */
  pitStop: boolean;
  warnings: string[];
};

/** JUDGEMENT. No GM bypass distance was found in any published document;
 *  the only hard number in the evidence base is NICE NG39's 45-minute
 *  call-to-RSI target. No point in the patch is much more than half an
 *  hour's blue-light run from an MTC, so these caps almost never bind
 *  inside it — they exist to stop the router doing something absurd at
 *  the Wigan/Merseyside and Tameside/Derbyshire edges. Straight-line
 *  metres, since that is what this module can measure without a routing
 *  call; the caller can re-check in road minutes. */
export const BYPASS_MAX_EXTRA_METERS: Record<Exclude<HospitalDestinationType, "non_convey" | "nearest_a_e">, number> = {
  mtc: 25_000,
  pci: 25_000,
  hasu: 30_000,
  paed_ed: 30_000,
  burns: 35_000,
};

/** The flags that mean the patient cannot survive the longer run to the
 *  MTC and must be stabilised at the nearest trauma-receiving site first.
 *  NWAS: "unmanageable airway, unmanageable breathing, or unmanageable
 *  catastrophic haemorrhage" → RED STANDBY MAJOR TRAUMA PIT STOP CALL. An
 *  active (untreated) flag is read as unmanageable. */
export const PIT_STOP_FLAGS: PatientRedFlag[] = [
  "airway_compromise",
  "major_haemorrhage",
  "tension_pneumothorax",
];

const inPatch = (h: Hospital) => h.inPatch;

export function resolveDestination(
  type: HospitalDestinationType,
  scene: { lat: number; lng: number },
  casualty: DestinationCasualty,
  clock: { hhmm: string },
): DestinationDecision | null {
  if (type === "non_convey") return null;

  const age = casualty.ageYears;
  const child = age !== undefined && age < TRAUMA_ADULT_AGE_FLOOR;
  const warnings: string[] = [];

  // The baseline everything is measured against: the nearest 24h ED
  // that will take this patient's age.
  const eds = HOSPITALS.filter(inPatch).filter((h) => hasEd24(h, age));
  const nearestEd = nearestOf(eds, scene);
  if (!nearestEd) {
    // Nothing in patch takes them (an infant with every paediatric field
    // unknown, say). Fall out to the nearest ED of any kind and say so.
    const any = nearestOf(HOSPITALS.filter(inPatch).filter((h) => h.ed.value?.open24h), scene)!;
    return {
      hospital: any,
      rule: "No 24h ED with recorded provision for this patient — nearest ED, pre-alert on the way",
      bypassed: null,
      bypassExtraMeters: 0,
      downgraded: true,
      pitStop: false,
      warnings: ["No in-patch ED has confirmed provision for this patient's age"],
    };
  }
  const baseM = haversineMeters(scene, nearestEd.coords);

  const decide = (h: Hospital, rule: string, extra: Partial<DestinationDecision> = {}): DestinationDecision => {
    const extraM = Math.max(0, haversineMeters(scene, h.coords) - baseM);
    return {
      hospital: h,
      rule,
      bypassed: h.id === nearestEd.id ? null : nearestEd,
      bypassExtraMeters: h.id === nearestEd.id ? 0 : extraM,
      downgraded: false,
      pitStop: false,
      warnings,
      ...extra,
    };
  };

  const withinBudget = (h: Hospital, key: keyof typeof BYPASS_MAX_EXTRA_METERS) =>
    haversineMeters(scene, h.coords) - baseM <= BYPASS_MAX_EXTRA_METERS[key];

  // -- Pit stop: physiology beats geography, on every bypass rule -------
  const unmanageable = casualty.redFlags.some((f) => PIT_STOP_FLAGS.includes(f));
  if (type === "mtc" && unmanageable) {
    const tu = nearestOf(HOSPITALS.filter(inPatch).filter(isTraumaReceiving), scene);
    if (tu) {
      return decide(
        tu,
        "RED STANDBY — MAJOR TRAUMA PIT STOP CALL. Unmanageable airway, breathing or haemorrhage: nearest trauma-receiving site, stabilise for onward transfer",
        { pitStop: true },
      );
    }
  }

  switch (type) {
    case "nearest_a_e":
      return decide(nearestEd, "Nearest 24h emergency department");

    case "mtc": {
      // The GM supplementary Pathfinder, in the order GMMTN v4.0 lists it.
      // First match wins.
      const pat = casualty.injuryPattern ?? [];
      const mri = hospitalById("H-MRI");
      const srh = hospitalById("H-SRH");
      const rmch = hospitalById("H-RMCH");
      if (child && rmch) {
        return decide(rmch, "Pathfinder: all paediatric major trauma to Royal Manchester Children's");
      }
      if (mri && pat.includes("penetrating")) {
        return decide(mri, "Pathfinder: penetrating injury to MRI");
      }
      if (mri && pat.includes("thoraco_abdominal")) {
        return decide(mri, "Pathfinder: thoraco-abdominal / suspected vascular injury to MRI");
      }
      if (mri && pat.includes("pregnant_over_20w")) {
        return decide(mri, "Pathfinder: pregnant over 20 weeks with head injury to MRI");
      }
      if (mri && pat.includes("hepatic_suspected")) {
        return decide(mri, "Pathfinder: suspected isolated hepatic trauma to MRI");
      }
      if (srh && casualty.gcs !== undefined && casualty.gcs < 12 && casualty.redFlags.includes("head_injury_severe")) {
        return decide(srh, "Pathfinder: cranial trauma with GCS under 12 direct to Salford Royal");
      }
      // Anything else meeting major trauma criteria: Salford, unless the
      // run is absurd, in which case the nearest MTC site.
      const mtcs = HOSPITALS.filter(inPatch).filter((h) => isMtc(h, age));
      const preferred = srh && mtcs.includes(srh) ? srh : nearestOf(mtcs, scene);
      if (preferred && withinBudget(preferred, "mtc")) {
        return decide(preferred, "Major trauma to the Greater Manchester Major Trauma Hospital, Salford Royal");
      }
      const nearestMtc = nearestOf(mtcs, scene);
      if (nearestMtc && withinBudget(nearestMtc, "mtc")) {
        return decide(nearestMtc, "Major trauma to the nearest MTC site");
      }
      warnings.push("No MTC within the bypass budget — nearest trauma-receiving site instead");
      const tu = nearestOf(HOSPITALS.filter(inPatch).filter(isTraumaReceiving), scene) ?? nearestEd;
      return decide(tu, "Major trauma — MTC out of range, nearest Trauma Unit", { downgraded: true });
    }

    case "pci": {
      const sites = HOSPITALS.filter(inPatch).filter(hasPpci);
      const best = nearestOf(sites, scene);
      if (best && withinBudget(best, "pci")) {
        return decide(best, "STEMI direct to the primary PCI centre — bypass the local ED");
      }
      warnings.push("No PCI centre within the bypass budget");
      return decide(nearestEd, "STEMI — PCI centre out of range, nearest ED with a pre-alert", { downgraded: true });
    }

    case "hasu": {
      const sites = HOSPITALS.filter(inPatch).filter((h) =>
        takesHyperacuteStroke(h, clock.hhmm, casualty.thrombectomyEligible === true),
      );
      const best = nearestOf(sites, scene);
      if (best && withinBudget(best, "hasu")) {
        const role = best.stroke.value?.role;
        const rule =
          role === "csc"
            ? clock.hhmm < "06:45" || clock.hhmm >= "22:45"
              ? "Hyperacute stroke out of hours — every GM stroke goes to the Comprehensive Stroke Centre at Salford"
              : casualty.thrombectomyEligible
                ? "Thrombectomy-eligible stroke direct to the Comprehensive Stroke Centre at Salford"
                : "Hyperacute stroke to the Comprehensive Stroke Centre at Salford"
            : "Hyperacute stroke to the Acute Stroke Centre (06:45–22:45)";
        return decide(best, rule);
      }
      warnings.push("No hyperacute stroke centre within the bypass budget at this hour");
      return decide(nearestEd, "Stroke — no HASU in range, nearest ED", { downgraded: true });
    }

    case "paed_ed": {
      const rmch = hospitalById("H-RMCH");
      // Major trauma, neurosurgery or burns in a child resolve to RMCH.
      const surgical =
        casualty.redFlags.includes("head_injury_severe") ||
        casualty.redFlags.includes("major_haemorrhage") ||
        casualty.redFlags.includes("hypovolaemic_shock");
      if (rmch && surgical) {
        return decide(rmch, "Paediatric major trauma / neurosurgical to Royal Manchester Children's");
      }
      const sites = HOSPITALS.filter(inPatch).filter(hasPaedEd);
      const wyt = hospitalById("H-WYT");
      if (wyt && wyt.ed.value?.paediatric === "unknown") {
        warnings.push("Wythenshawe excluded: paediatric ED provision unconfirmed — the trust's own pages disagree");
      }
      const best = nearestOf(sites, scene);
      if (best && withinBudget(best, "paed_ed")) {
        return decide(best, "Nearest emergency department with recorded paediatric provision");
      }
      return decide(nearestEd, "Child — no paediatric ED in range, nearest ED", { downgraded: true });
    }

    case "burns": {
      const sites = HOSPITALS.filter((h) => hasBurns(h, age));
      // Whiston is out of patch but is the nearer burns centre for the
      // Wigan side. JUDGEMENT: prefer it when it is at least 8 km closer.
      const inP = nearestOf(sites.filter(inPatch), scene);
      const whi = sites.find((h) => h.id === "H-WHI");
      let best = inP;
      if (whi && inP && haversineMeters(scene, whi.coords) + 8_000 < haversineMeters(scene, inP.coords)) {
        best = whi;
        warnings.push("Mersey burns unit (Whiston) is materially nearer than Wythenshawe — out of patch");
      }
      if (best && withinBudget(best, "burns")) {
        return decide(
          best,
          child
            ? "Paediatric burns to Royal Manchester Children's"
            : best.id === "H-WHI"
              ? "Burns to the Mersey Regional Burns Unit, Whiston"
              : "Burns to the North West Burn Centre, Wythenshawe",
        );
      }
      return decide(nearestEd, "Burns — centre out of range, nearest ED", { downgraded: true });
    }
  }
}

/** The nearest 24-hour emergency department to a point. Kept for the
 *  callers that do not know anything about the patient — the automatic
 *  clear-down at the end of a job — and as the fallback for everything
 *  else. Never returns a site with no ED. */
export function nearestHospital(coords: { lat: number; lng: number }): Hospital {
  const eds = HOSPITALS.filter((h) => h.inPatch && h.ed.value?.open24h);
  return nearestOf(eds, coords) ?? HOSPITALS[0];
}

/**
 * Random offload duration in seconds (30 min to 3 hrs). Per the design doc,
 * real UK hospital offloads span this range depending on ED pressure. For MVP
 * we roll uniform across the range; a later pass can assign per-hospital
 * pressure indexes so busy EDs consistently hold longer.
 */
export function rollOffloadSeconds(rnd: () => number = Math.random): number {
  return Math.round(30 * 60 + rnd() * (180 - 30) * 60);
}
