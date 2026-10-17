// Honours: the ribbon rack on an operator's profile and service record.
//
// Each honour is a ribbon bar drawn from vertical stripes, worn in order
// of precedence from the top left, as a rack of medal ribbons is. Most
// are earned from the record and worked out here from the few figures a
// profile carries (HonourFacts, from operator_profile in migration 028);
// the rest are granted by hand from the admin console, with a citation.
// Tiers show as devices on the ribbon: a bar, two bars, a rosette.

export type AwardKey =
  | "commendation"
  | "founder"
  | "distinguished_command"
  | "lifesaver"
  | "rapid_mobilisation"
  | "standards"
  | "operational_service"
  | "breadth"
  | "continued_support"
  | "long_service"
  | "prealpha_service"
  | "advisor"
  | "fault_finder"
  | "community"
  | "contributor";

export type AwardGroup = "honour" | "operational" | "service" | "support";

/** One vertical band of the ribbon; widths add up to 100. */
export type Stripe = { colour: string; width: number };

export type Award = {
  key: AwardKey;
  name: string;
  group: AwardGroup;
  /** Lower is worn first. */
  precedence: number;
  stripes: Stripe[];
  /** What it recognises. */
  citation: string;
  /** How it is earned, for the legend. */
  criteria: string;
  /** Tier names, lowest first, where the honour has tiers. */
  tiers?: string[];
  /** Granted from the admin console rather than earned from the record. */
  grantable?: boolean;
};

const GROUP_LABEL: Record<AwardGroup, string> = {
  honour: "Honour",
  operational: "Operational record",
  service: "Service",
  support: "Programme",
};
export const groupLabel = (g: AwardGroup) => GROUP_LABEL[g];

export const AWARDS: Award[] = [
  {
    key: "commendation",
    name: "Commendation",
    group: "honour",
    precedence: 10,
    stripes: [{ colour: "#8b1e2d", width: 34 }, { colour: "#e6b65c", width: 32 }, { colour: "#8b1e2d", width: 34 }],
    citation: "Conduct on the desk or in the programme that deserved to be named.",
    criteria: "Granted by the programme, with a citation. A second commendation adds a bar.",
    tiers: ["Commendation", "Commendation and bar", "Commendation and two bars", "Commendation with rosette"],
    grantable: true,
  },
  {
    key: "founder",
    name: "Founding Tester",
    group: "honour",
    precedence: 20,
    stripes: [{ colour: "#ecece5", width: 10 }, { colour: "#1b1d17", width: 25 }, { colour: "#e6b65c", width: 30 }, { colour: "#1b1d17", width: 25 }, { colour: "#ecece5", width: 10 }],
    citation: "One of the first operators through the door of the closed Pre-Alpha.",
    criteria: "Granted by the programme to the opening cohort.",
    grantable: true,
  },
  {
    key: "distinguished_command",
    name: "Distinguished Command",
    group: "operational",
    precedence: 30,
    stripes: [{ colour: "#e6b65c", width: 12 }, { colour: "#1f6b3a", width: 76 }, { colour: "#e6b65c", width: 12 }],
    citation: "Incidents closed at Grade A, the attendance right and the standards met.",
    criteria: "10 incidents at Grade A; a bar at 30, two at 75, the rosette at 150.",
    tiers: ["10 at Grade A", "30 at Grade A", "75 at Grade A", "150 at Grade A"],
  },
  {
    key: "lifesaver",
    name: "Lifesaver",
    group: "operational",
    precedence: 40,
    stripes: [{ colour: "#15803d", width: 30 }, { colour: "#ffffff", width: 8 }, { colour: "#15803d", width: 24 }, { colour: "#ffffff", width: 8 }, { colour: "#15803d", width: 30 }],
    citation: "Casualties handed over alive at hospital.",
    criteria: "5 casualties conveyed; a bar at 25, two at 75, the rosette at 200.",
    tiers: ["5 conveyed", "25 conveyed", "75 conveyed", "200 conveyed"],
  },
  {
    key: "rapid_mobilisation",
    name: "Rapid Mobilisation",
    group: "operational",
    precedence: 50,
    stripes: [{ colour: "#b91c1c", width: 40 }, { colour: "#ffffff", width: 20 }, { colour: "#b91c1c", width: 40 }],
    citation: "The first resource away fast, call after call.",
    criteria: "Over at least 10 incidents, a mean call-to-first-mobilisation inside 75 seconds; a bar inside 60, two inside 45, the rosette inside 30.",
    tiers: ["Within 75 s", "Within 60 s", "Within 45 s", "Within 30 s"],
  },
  {
    key: "standards",
    name: "Standards of Service",
    group: "operational",
    precedence: 60,
    stripes: [{ colour: "#1d4ed8", width: 44 }, { colour: "#ffffff", width: 12 }, { colour: "#1d4ed8", width: 44 }],
    citation: "Performance standards met at the debrief, incident after incident.",
    criteria: "At least 20 standards assessed with 80% met; a bar at 90%, two at 95%, the rosette for every one of at least 50.",
    tiers: ["80% met", "90% met", "95% met", "All met"],
  },
  {
    key: "operational_service",
    name: "Operational Service",
    group: "operational",
    precedence: 70,
    stripes: [{ colour: "#7fb3f0", width: 12 }, { colour: "#1e3a8a", width: 76 }, { colour: "#7fb3f0", width: 12 }],
    citation: "Incidents taken from the first call to the stop message.",
    criteria: "The first incident resolved; a bar at 25, two at 100, the rosette at 250.",
    tiers: ["First incident", "25 incidents", "100 incidents", "250 incidents"],
  },
  {
    key: "breadth",
    name: "Breadth of Service",
    group: "operational",
    precedence: 80,
    stripes: [{ colour: "#f08a3e", width: 34 }, { colour: "#4fc16d", width: 32 }, { colour: "#4f9ff2", width: 34 }],
    citation: "Fire, ambulance and police work alike: incidents of many kinds handled.",
    criteria: "Incidents of 4 different kinds; a bar at 8, two at 12, the rosette at 16.",
    tiers: ["4 kinds", "8 kinds", "12 kinds", "16 kinds"],
  },
  {
    key: "continued_support",
    name: "Continued Support",
    group: "support",
    precedence: 90,
    stripes: [{ colour: "#ffffff", width: 10 }, { colour: "#7c3aed", width: 80 }, { colour: "#ffffff", width: 10 }],
    citation: "Still on shift months in, and still reporting back.",
    criteria: "Two months on the books with 15 incidents resolved; a bar at six months and 50, two at a year and 120. Also granted by the programme to those who keep it going in other ways.",
    tiers: ["Two months", "Six months", "One year", "Two years"],
    grantable: true,
  },
  {
    key: "long_service",
    name: "Long Service",
    group: "service",
    precedence: 100,
    stripes: [{ colour: "#0f2a5a", width: 22 }, { colour: "#ffffff", width: 6 }, { colour: "#0f2a5a", width: 44 }, { colour: "#ffffff", width: 6 }, { colour: "#0f2a5a", width: 22 }],
    citation: "Time on the books.",
    criteria: "An account 30 days old; a bar at 90 days, two at a year, the rosette at two years.",
    tiers: ["30 days", "90 days", "One year", "Two years"],
  },
  {
    key: "prealpha_service",
    name: "Pre-Alpha Service",
    group: "service",
    precedence: 110,
    stripes: [{ colour: "#e6b65c", width: 20 }, { colour: "#2a2d2e", width: 20 }, { colour: "#e6b65c", width: 20 }, { colour: "#2a2d2e", width: 20 }, { colour: "#e6b65c", width: 20 }],
    citation: "On the closed Pre-Alpha tester list.",
    criteria: "Accepted to the Pre-Alpha.",
  },
  {
    key: "advisor",
    name: "Programme Advisor",
    group: "support",
    precedence: 120,
    stripes: [{ colour: "#334155", width: 36 }, { colour: "#e6b65c", width: 28 }, { colour: "#334155", width: 36 }],
    citation: "Serving or retired emergency-services experience lent to the programme's authenticity review.",
    criteria: "Accepted to the advisor programme.",
  },
  {
    key: "fault_finder",
    name: "Fault Finder",
    group: "support",
    precedence: 130,
    stripes: [{ colour: "#facc15", width: 25 }, { colour: "#111111", width: 16 }, { colour: "#facc15", width: 18 }, { colour: "#111111", width: 16 }, { colour: "#facc15", width: 25 }],
    citation: "Problems reported from the desk so they could be fixed.",
    criteria: "The first report filed; a bar at 5, two at 15, the rosette at 40.",
    tiers: ["First report", "5 reports", "15 reports", "40 reports"],
  },
  {
    key: "community",
    name: "Community Service",
    group: "honour",
    precedence: 140,
    stripes: [{ colour: "#5865f2", width: 40 }, { colour: "#ffffff", width: 20 }, { colour: "#5865f2", width: 40 }],
    citation: "Looking after the other operators: answering, welcoming, explaining.",
    criteria: "Granted by the programme, with a citation.",
    grantable: true,
  },
  {
    key: "contributor",
    name: "Contributor",
    group: "honour",
    precedence: 150,
    stripes: [{ colour: "#0f766e", width: 42 }, { colour: "#ffffff", width: 16 }, { colour: "#0f766e", width: 42 }],
    citation: "A scenario, a record or a correction that made it into the game.",
    criteria: "Granted by the programme, with a citation.",
    grantable: true,
  },
];

export const AWARD_BY_KEY: Record<string, Award> = Object.fromEntries(AWARDS.map((a) => [a.key, a]));
export const GRANTABLE: Award[] = AWARDS.filter((a) => a.grantable);
export const isAwardKey = (k: string): k is AwardKey => k in AWARD_BY_KEY;

/** The figures an honour is read from: what operator_profile returns as
 *  `facts`, plus the account's standing. */
export type HonourFacts = {
  /** ISO; the account's creation. */
  joinedAt: string | null;
  tester: boolean;
  advisor: boolean;
  bugReports: number;
  incidentsResolved: number;
  casualtiesSaved: number;
  gradeA: number;
  graded: number;
  /** Seconds, or null with nothing to average. */
  meanFirstAllocSec: number | null;
  targetsMet: number;
  targetsTotal: number;
  distinctTypes: number;
};

export const EMPTY_FACTS: HonourFacts = {
  joinedAt: null, tester: false, advisor: false, bugReports: 0, incidentsResolved: 0, casualtiesSaved: 0,
  gradeA: 0, graded: 0, meanFirstAllocSec: null, targetsMet: 0, targetsTotal: 0, distinctTypes: 0,
};

/** An honour granted by hand (user_awards). */
export type GrantedAward = { id: string; key: string; citation: string; grantedAt: string };

export type EarnedHonour = {
  award: Award;
  /** 0 is the plain ribbon; 1 and 2 add bars; 3 the rosette. */
  tier: number;
  /** The figure that earned it, for the legend. */
  detail: string;
  /** The grants behind it, where it was granted. */
  grants: GrantedAward[];
};

/** Index of the highest threshold reached, or -1 below the first. */
function tierOf(value: number, thresholds: number[]): number {
  let t = -1;
  thresholds.forEach((th, i) => { if (value >= th) t = i; });
  return t;
}

/** The same for "smaller is better" thresholds. */
function tierUnder(value: number, thresholds: number[]): number {
  let t = -1;
  thresholds.forEach((th, i) => { if (value <= th) t = i; });
  return t;
}

const DAY = 86_400_000;

export function daysSince(iso: string | null, now: number): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? Math.floor((now - t) / DAY) : 0;
}

/** Every honour this record wears, in rack order (precedence first). */
export function evaluateHonours(facts: HonourFacts, granted: GrantedAward[] = [], now: number = Date.now()): EarnedHonour[] {
  const out: EarnedHonour[] = [];
  const add = (key: AwardKey, tier: number, detail: string, grants: GrantedAward[] = []) => {
    if (tier < 0) return;
    out.push({ award: AWARD_BY_KEY[key], tier: Math.min(3, tier), detail, grants });
  };

  // Granted honours: each grant is one award; a repeat adds a device.
  const byKey = new Map<string, GrantedAward[]>();
  for (const g of granted) {
    if (!isAwardKey(g.key) || !AWARD_BY_KEY[g.key].grantable) continue;
    byKey.set(g.key, [...(byKey.get(g.key) ?? []), g]);
  }
  for (const [key, grants] of byKey) {
    if (key === "continued_support") continue; // merged with the earned tier below
    add(key as AwardKey, grants.length - 1, grants.length === 1 ? "Granted" : `Granted ${grants.length} times`, grants);
  }

  const days = daysSince(facts.joinedAt, now);

  add("distinguished_command", tierOf(facts.gradeA, [10, 30, 75, 150]), `${facts.gradeA} incidents at Grade A`);
  add("lifesaver", tierOf(facts.casualtiesSaved, [5, 25, 75, 200]), `${facts.casualtiesSaved} casualties conveyed`);
  if (facts.incidentsResolved >= 10 && facts.meanFirstAllocSec !== null) {
    add("rapid_mobilisation", tierUnder(facts.meanFirstAllocSec, [75, 60, 45, 30]), `Mean ${Math.round(facts.meanFirstAllocSec)} s to the first mobilisation`);
  }
  if (facts.targetsTotal >= 20) {
    const pct = (facts.targetsMet / facts.targetsTotal) * 100;
    const all = facts.targetsTotal >= 50 && facts.targetsMet === facts.targetsTotal;
    add("standards", all ? 3 : Math.min(2, tierOf(pct, [80, 90, 95])), `${facts.targetsMet} of ${facts.targetsTotal} standards met`);
  }
  add("operational_service", tierOf(facts.incidentsResolved, [1, 25, 100, 250]), `${facts.incidentsResolved} incidents resolved`);
  add("breadth", tierOf(facts.distinctTypes, [4, 8, 12, 16]), `${facts.distinctTypes} kinds of incident`);

  // Continued support: earned by tenure with activity, or granted.
  const supportEarned = Math.min(
    tierOf(days, [60, 180, 365, 730]),
    tierOf(facts.incidentsResolved, [15, 50, 120, 250]),
  );
  const supportGrants = byKey.get("continued_support") ?? [];
  if (supportEarned >= 0 || supportGrants.length) {
    const tier = Math.max(supportEarned, supportGrants.length ? supportGrants.length - 1 : -1);
    add("continued_support", tier, supportEarned >= 0 ? `${days} days on the books, ${facts.incidentsResolved} incidents resolved` : "Granted", supportGrants);
  }

  add("long_service", tierOf(days, [30, 90, 365, 730]), `${days} days on the books`);
  if (facts.tester) add("prealpha_service", 0, "Pre-Alpha tester");
  if (facts.advisor) add("advisor", 0, "Programme advisor");
  add("fault_finder", tierOf(facts.bugReports, [1, 5, 15, 40]), `${facts.bugReports} ${facts.bugReports === 1 ? "report" : "reports"} filed`);

  return out.sort((a, b) => a.award.precedence - b.award.precedence);
}

/** The tier's name for the legend: "Lifesaver · 25 conveyed". */
export function tierLabel(h: EarnedHonour): string {
  const tiers = h.award.tiers;
  if (!tiers) return h.award.name;
  const t = tiers[Math.min(h.tier, tiers.length - 1)];
  // "Commendation and bar" already carries the name.
  return t.startsWith(h.award.name) ? t : `${h.award.name} · ${t}`;
}

/** Rack rows, top row shortest and the highest precedence on it, the
 *  way ribbons are mounted: the remainder goes on top, then full rows. */
export function rackRows<T>(items: T[], columns = 4): T[][] {
  if (items.length === 0) return [];
  const first = items.length % columns || columns;
  const rows: T[][] = [items.slice(0, first)];
  for (let i = first; i < items.length; i += columns) rows.push(items.slice(i, i + columns));
  return rows;
}
