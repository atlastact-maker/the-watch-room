// Every patient, and what a crew can actually do for them.
//
// The harness only checks that authored interventions map to something.
// This asks the harder question the choking child exposed: does the
// PRESENTATION have a treatment, whether or not anybody authored one?

import { SCENARIOS } from "@/lib/sim/scenarios";

const AIRWAY = ["position", "opa", "npa", "igel", "suction", "back_blows", "abdominal_thrusts", "magill_forceps", "rsi"];
const BREATHING = ["oxygen_15l", "bvm", "needle_decomp", "finger_thoracostomy"];
const CIRCULATION = ["iv_access", "io_access", "fluids_250", "fluids_500", "cpr", "defib"];
const PACKAGING = ["warming", "assisted_delivery", "spine_board", "scoop_stretcher", "ked", "pelvic_binder", "tourniquet", "traction_splint", "dressings"];
const DRUGS = [
  "paracetamol", "entonox", "morphine", "aspirin_300", "gtn_spray", "salbutamol_neb",
  "ipratropium_neb", "adrenaline_im_anaphylaxis", "adrenaline_cpr", "midazolam_im",
  "glucagon_im", "dextrose_iv", "naloxone", "ondansetron", "tXA_iv",
  "ketamine_analgesia", "fentanyl", "amiodarone", "magnesium_sulfate", "hydrocortisone",
  "chlorphenamine", "calcium_chloride", "ketamine_rsi", "rocuronium", "propofol",
  "metaraminol", "noradrenaline",
];

/** Conditions a menu ought to have SOMETHING for, and what would count.
 *  Detected from the presumed condition rather than the red flags, so a
 *  presentation nobody flagged still gets asked about. */
const NEEDS_BY_PRESENTATION: { match: RegExp; label: string; satisfiedBy: string[] }[] = [
  { match: /hypothermi|prolonged lie|cold|immers|exposure on the ledge/i, label: "active warming", satisfiedBy: ["warming"] },
  { match: /labour|imminent delivery|second stage/i, label: "assisted delivery", satisfiedBy: ["assisted_delivery"] },
  { match: /pain|deformity|burn|fracture/i, label: "analgesia", satisfiedBy: ["morphine", "entonox", "paracetamol", "ketamine_analgesia", "fentanyl"] },
  { match: /burn/i, label: "burn cooling / dressings", satisfiedBy: ["dressings"] },
  { match: /vomit|nausea/i, label: "antiemetic", satisfiedBy: ["ondansetron"] },
  { match: /carbon monoxide/i, label: "high-flow oxygen", satisfiedBy: ["oxygen_15l"] },
  { match: /obstruction|choking|foreign body/i, label: "foreign body removal", satisfiedBy: ["back_blows", "abdominal_thrusts", "magill_forceps"] },
  { match: /seizure|convuls/i, label: "anticonvulsant", satisfiedBy: ["midazolam_im"] },
  { match: /chest infection|sepsis|infection/i, label: "oxygen and fluids", satisfiedBy: ["oxygen_15l", "fluids_250"] },
];

const PERFORMABLE = new Set([...AIRWAY, ...BREATHING, ...CIRCULATION, ...PACKAGING, ...DRUGS]);

const gaps: string[] = [];
const bare: string[] = [];
let n = 0;

console.log("id  casualty                                  sev       flags / interventions");
console.log("-".repeat(104));

for (const s of SCENARIOS) {
  for (const cas of s.scene?.casualties ?? []) {
    const cl = cas.clinical;
    if (!cl) continue;
    n++;
    const flags = cl.redFlags.length ? cl.redFlags.join(",") : "—";
    const ivs = cl.criticalInterventions.length ? cl.criticalInterventions.join(",") : "—";
    console.log(
      "  " + s.id.padStart(2) + "  " + (cas.label ?? cas.id).slice(0, 40).padEnd(42) +
      cas.severity.padEnd(10) + flags + "  |  " + ivs,
    );

    // A patient with no flags AND no interventions can be looked at and
    // not much else. Sometimes right; worth listing.
    if (cl.redFlags.length === 0 && cl.criticalInterventions.length === 0) {
      bare.push(s.id + " " + (cas.label ?? cas.id).slice(0, 44));
    }

    // Does the presentation need something the menu does not have?
    const text = cl.presumedCondition + " " + (cas.label ?? "");
    for (const need of NEEDS_BY_PRESENTATION) {
      if (!need.match.test(text)) continue;
      if (!need.satisfiedBy.some((x) => PERFORMABLE.has(x))) {
        gaps.push(s.id + " " + cas.id + ": " + cl.presumedCondition.slice(0, 46) + " — no " + need.label);
      }
    }
    // Cold patients specifically: the vitals say it even when the words do not.
    if (cl.vitals.temp < 35.5 && !PERFORMABLE.has("warming")) {
      gaps.push(s.id + " " + cas.id + ": " + cl.vitals.temp + "degC — no active warming on the menu");
    }
  }
}

console.log("\n" + n + " patients.\n");

if (gaps.length) {
  const uniq = [...new Set(gaps)];
  console.log("PRESENTATIONS WITH NO TREATMENT ON THE MENU (" + uniq.length + ")");
  for (const g of uniq) console.log("   " + g);
  console.log("");
}
if (bare.length) {
  console.log("PATIENTS WITH NO FLAGS AND NO INTERVENTIONS (" + bare.length + ")");
  for (const b of bare) console.log("   " + b);
  console.log("   — a crew can survey, package and convey them. Nothing else is offered.");
}
if (!gaps.length) console.log("Every presentation has something on the menu that treats it.");
