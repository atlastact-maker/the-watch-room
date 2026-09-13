// THE 999 CALL AS THE CALLER HAS IT.
//
// A scenario's `call` block is who is ringing, from where, how they are
// holding up, what they say when the line opens, and what they answer to
// each thing the operator asks. The question bank below is the operator's
// side: the questions each service actually works through, in the order
// its call handlers take them — NHS Pathways opens with "conscious and
// breathing", THRIVE opens with the threat, a fire call opens with what
// can be seen and who is inside. Scripts answer by question id; anything
// a script does not answer falls back to the scenario's own fields, so a
// job with no script still takes a call.

import type { Scenario } from "./incident_types";
import type { ServiceCode } from "./types";

export type CallerState = "calm" | "anxious" | "panicking" | "hostile" | "confused";
export type CallerLine = "landline" | "mobile";
export type CallTone = "urgent" | "critical";

/** What an answer or an interjection does to the call. */
export type CallEffect = {
  /** Moves the suggested grade, in the service's own words: "CAT 1",
   *  "GRADE 1", "EMERGENCY". */
  regrade?: string;
  /** Why — goes on the dialogue and the log. */
  basis?: string;
  /** Another service this brings in. */
  addService?: ServiceCode;
  /** Calms or rattles the caller. */
  state?: CallerState;
};

export type CallAnswer = {
  text: string;
  tone?: CallTone;
  effect?: CallEffect;
  /** Withheld while the caller is panicking or hostile: they deflect until
   *  the operator has reassured them. */
  needsCalm?: boolean;
  /** Questions this answer opens up. Ids must be unique within the
   *  script and must not reuse a bank id. */
  followUps?: CallFollowUp[];
};

export type CallFollowUp = { id: string; text: string; answer: CallAnswer };

/** Something the caller says unprompted, timed from the moment the call
 *  was answered. */
export type CallInterjection = {
  atSec: number;
  text: string;
  tone?: CallTone;
  effect?: CallEffect;
  /** Only once these have been asked. */
  requiresAsked?: string[];
  /** Only if these have not been asked by then. */
  unlessAsked?: string[];
  /** Only once the operator has sent (true) or while they have not (false). */
  requiresOpened?: boolean;
};

export type CallScript = {
  caller: {
    name: string;
    /** Calling-line number, in an Ofcom drama range. */
    phone: string;
    /** Who they are to the job: "neighbour at no. 287", "the patient's wife". */
    relation: string;
    /** Where they are ringing from. */
    where: string;
    line: CallerLine;
    state: CallerState;
  };
  /** Their first words once the operator has answered. */
  opening: string;
  /** What a panicking or hostile caller says instead of answering. */
  deflection?: string;
  /** What the operator says to bring them down, and their reply. */
  reassurance?: { text: string; reply: string };
  /** Answers by question id from the bank. */
  answers: Partial<Record<string, CallAnswer>>;
  interjections?: CallInterjection[];
  /** Question ids the debrief expects asked before the job is sent.
   *  Defaults to the bank's key questions for the service. */
  keyQuestions?: string[];
  /** The caller goes: the line drops, the phone dies, they run in. */
  drops?: { atSec: number; text: string };
  /** What they say when told help is on its way. */
  onDispatch?: string;
};

export type CallGroup = string;
export type CallQuestion = {
  id: string;
  group: CallGroup;
  text: string;
  /** Asked on every call of this kind before the job is sent. */
  key?: boolean;
  /** The answer when the scenario carries no script for it. */
  fallback: (s: Scenario) => string;
};

const notKnown = "I don't know. I can't tell from here.";
const addressOf = (s: Scenario) => `${s.location.address}. ${s.location.postcode}.`;

export const CALL_QUESTIONS: Record<ServiceCode, CallQuestion[]> = {
  Fire: [
    { id: "f_seen", group: "WHAT IS HAPPENING", text: "What exactly can you see?", key: true, fallback: (s) => s.trigger },
    { id: "f_where", group: "WHAT IS HAPPENING", text: "Which part of the building is it in?", fallback: (s) => s.methane.T || notKnown },
    { id: "f_spread", group: "WHAT IS HAPPENING", text: "Is it getting bigger, or spreading to anything next to it?", fallback: (s) => s.methane.E || notKnown },
    { id: "f_started", group: "WHAT IS HAPPENING", text: "How long has it been going?", fallback: () => "Only a few minutes. I've only just seen it." },
    { id: "f_building", group: "WHAT IS HAPPENING", text: "What kind of building is it — a house, flats, a shop, a factory?", fallback: (s) => `${s.property.class}${s.property.size ? `, ${s.property.size}` : ""}.` },
    { id: "f_inside", group: "PERSONS", text: "Is anyone still inside?", key: true, fallback: (s) => s.methane.N || s.property.occupants || notKnown },
    { id: "f_hurt", group: "PERSONS", text: "Is anyone hurt?", fallback: (s) => s.methane.N || "Not that I can see." },
    { id: "f_vulnerable", group: "PERSONS", text: "Anyone who could not get themselves out — children, anyone elderly or disabled?", fallback: (s) => s.property.vulnerabilities.length ? s.property.vulnerabilities.join(" ") : "Not that I know of." },
    { id: "f_hazards", group: "HAZARDS", text: "Is there anything in there that could go up — gas cylinders, chemicals, fuel?", key: true, fallback: (s) => s.property.knownHazards.length ? s.property.knownHazards.join(". ") : s.methane.H || "Nothing I know of." },
    { id: "f_danger", group: "HAZARDS", text: "Anything that would put the crews in danger — power lines, traffic, anyone aggressive?", fallback: (s) => s.methane.H || "No, nothing like that." },
    { id: "f_access", group: "ACCESS", text: "How will the crews get in — gates, locks, a key safe, anything parked in the way?", key: true, fallback: (s) => s.property.access },
    { id: "f_safe", group: "CALLER", text: "Are you in a safe place yourself?", fallback: () => "Yes. I'm outside, well back from it." },
    { id: "f_stay", group: "CALLER", text: "Can you stay on the line for me?", fallback: () => "Yes, I'll stay on." },
    { id: "f_details", group: "CALLER", text: "What is your name, and the number you are calling from?", fallback: () => "I'd rather not give my name. This is my own phone." },
  ],
  Ambulance: [
    { id: "a_conscious", group: "PATIENT", text: "Is the patient conscious?", key: true, fallback: (s) => s.methane.T || s.trigger },
    { id: "a_breathing", group: "PATIENT", text: "Is the patient breathing normally?", key: true, fallback: (s) => s.methane.T || notKnown },
    { id: "a_happened", group: "WHAT HAPPENED", text: "Tell me exactly what has happened.", fallback: (s) => s.trigger },
    { id: "a_when", group: "WHAT HAPPENED", text: "When did this start?", fallback: () => "Ten minutes ago, maybe less." },
    { id: "a_now", group: "WHAT HAPPENED", text: "How are they right now — their colour, are they sweating, can they talk to you?", fallback: (s) => s.methane.T || notKnown },
    { id: "a_bleeding", group: "RISK", text: "Is there any serious bleeding?", fallback: (s) => s.methane.H || "No, no bleeding." },
    { id: "a_age", group: "PATIENT", text: "How old are they?", key: true, fallback: (s) => s.property.occupants || notKnown },
    { id: "a_history", group: "PATIENT", text: "Any medical history I should know about — heart, diabetes, allergies? Do they take anything?", fallback: () => "Nothing I know of." },
    { id: "a_count", group: "RISK", text: "Is it just the one patient?", fallback: (s) => s.methane.N || "Just the one." },
    { id: "a_danger", group: "RISK", text: "Is it safe where they are?", fallback: (s) => s.methane.H || "Yes, it's fine here." },
    { id: "a_access", group: "ACCESS", text: "How will the crew get in — door number, flat, entry code, someone to let them in?", key: true, fallback: (s) => s.property.access },
    { id: "a_with", group: "CALLER", text: "Are you with them now?", fallback: () => "Yes, I'm right next to them." },
    { id: "a_instructions", group: "CALLER", text: "I am going to give you some instructions to help until the crew arrive — can you do that?", fallback: () => "Yes. Tell me what to do." },
    { id: "a_details", group: "CALLER", text: "What is your name, and the number you are calling from?", fallback: () => "I'd rather not give my name. This is my own phone." },
  ],
  Police: [
    { id: "p_happening", group: "THREAT", text: "What is happening right now?", key: true, fallback: (s) => s.trigger },
    { id: "p_ongoing", group: "THREAT", text: "Is it still going on?", key: true, fallback: (s) => s.methane.E || notKnown },
    { id: "p_weapons", group: "THREAT", text: "Are there any weapons — have you seen anything in their hands?", key: true, fallback: (s) => s.methane.H || "No, I haven't seen anything." },
    { id: "p_injured", group: "HARM", text: "Has anyone been hurt or threatened?", fallback: (s) => s.methane.N || "Nobody's hurt that I can see." },
    { id: "p_who", group: "WHO", text: "Who is involved, and how many of them?", fallback: (s) => s.methane.N || notKnown },
    { id: "p_description", group: "WHO", text: "Describe them for me — what are they wearing?", fallback: (s) => s.property.occupants || notKnown },
    { id: "p_direction", group: "WHO", text: "Which way did they go, and how — on foot, in a car?", fallback: (s) => s.methane.A || notKnown },
    { id: "p_drink", group: "WHO", text: "Are drink or drugs involved?", fallback: () => "I couldn't say." },
    { id: "p_known", group: "WHO", text: "Do you know the people involved?", fallback: () => "No. Never seen them before." },
    { id: "p_vulnerable", group: "VULNERABILITY", text: "Is anyone vulnerable — a child, someone elderly, anyone at risk?", key: true, fallback: (s) => s.property.vulnerabilities.length ? s.property.vulnerabilities.join(" ") : "Not that I know of." },
    { id: "p_where", group: "VULNERABILITY", text: "Where exactly — a house number, a junction, a landmark?", fallback: addressOf },
    { id: "p_safe", group: "CALLER", text: "Are you safe where you are?", fallback: () => "Yes, I'm well away from it." },
    { id: "p_seen", group: "CALLER", text: "Did you see this yourself, or has someone told you?", fallback: () => "I saw it myself." },
    { id: "p_details", group: "CALLER", text: "What is your name, and the number you are calling from?", fallback: () => "I'd rather not give my name. This is my own phone." },
  ],
};

/** The bank's key questions for a service. */
export function keyQuestionsFor(service: ServiceCode): string[] {
  return CALL_QUESTIONS[service].filter((q) => q.key).map((q) => q.id);
}

/** The grade labels the desk lets a call be moved to, per service. */
export const GRADE_LABELS: Record<ServiceCode, string[]> = {
  Ambulance: ["CAT 1", "CAT 2", "CAT 3", "CAT 4"],
  Police: ["GRADE 1", "GRADE 2", "GRADE C", "GRADE L"],
  Fire: ["EMERGENCY", "URGENT", "ROUTINE"],
};

/** What a caller says instead of answering while they are in no state to. */
export function deflectionFor(state: CallerState, script?: CallScript): string {
  if (script?.deflection) return script.deflection;
  if (state === "hostile") return "I've told you what's happening. Are you sending someone or not?";
  if (state === "confused") return "I… sorry, what? I don't — sorry.";
  return "I don't know, I don't know — please just get someone here!";
}

/** The operator's line to bring a caller down, and what they say back. */
export function reassuranceFor(state: CallerState, name: string | null, script?: CallScript): { text: string; reply: string } {
  if (script?.reassurance) return script.reassurance;
  const who = name ? name.split(" ")[0] : "Okay";
  if (state === "hostile") return { text: `${who}, help is coming, but I need you to work with me so I can tell them what they are walking into.`, reply: "…Fine. Go on then." };
  if (state === "confused") return { text: `${who}, you're doing fine. Take your time. Just tell me what you can see.`, reply: "Right. Yes. Sorry. Okay." };
  return { text: `${who}, listen to me. Help is on its way. Take a breath, and tell me what you can see.`, reply: "Okay. Okay. I'm here." };
}

/** Ofcom's reserved drama ranges: the only numbers a caller gives. */
export const DRAMA_PHONE = /^(07700\s?900\d{3}|0161\s?496\s?0\d{3}|020\s?7946\s?0\d{3}|0113\s?496\s?0\d{3}|0114\s?496\s?0\d{3}|0115\s?496\s?0\d{3}|0117\s?496\s?0\d{3}|0118\s?496\s?0\d{3}|0121\s?496\s?0\d{3}|0131\s?496\s?0\d{3}|0141\s?496\s?0\d{3}|0151\s?496\s?0\d{3}|0191\s?496\s?0\d{3}|028\s?9018\s?0\d{3}|029\s?2018\s?0\d{3}|01632\s?960\d{3}|03069\s?990\d{3}|0808\s?157\s?0\d{3}|0909\s?879\s?0\d{3}|08081\s?570\d{3})$/;

/** Everything a script can get wrong, as plain lines. */
export function validateCallScript(s: Scenario, service: ServiceCode): string[] {
  const c = s.call;
  const out: string[] = [];
  if (!c) return ["no call script"];
  const bank = CALL_QUESTIONS[service];
  const bankIds = new Set(bank.map((q) => q.id));
  if (!c.opening.trim()) out.push("empty opening");
  if (!c.caller.name.trim()) out.push("no caller name");
  if (!DRAMA_PHONE.test(c.caller.phone.trim())) out.push(`caller phone "${c.caller.phone}" is not in an Ofcom drama range`);
  const answered = Object.keys(c.answers);
  for (const id of answered) if (!bankIds.has(id)) out.push(`answer for unknown question "${id}" (${service} bank)`);
  if (answered.length < 10) out.push(`only ${answered.length} of ${bank.length} questions answered`);
  const keys = c.keyQuestions ?? keyQuestionsFor(service);
  for (const k of keys) {
    if (!bankIds.has(k)) out.push(`key question "${k}" is not in the ${service} bank`);
    else if (!c.answers[k]) out.push(`key question "${k}" has no answer`);
  }
  const seen = new Set<string>();
  const walk = (a: CallAnswer, path: string) => {
    if (!a.text.trim()) out.push(`empty answer at ${path}`);
    if (a.effect?.regrade && !GRADE_LABELS[service].includes(a.effect.regrade)) out.push(`regrade "${a.effect.regrade}" at ${path} is not a ${service} grade`);
    for (const f of a.followUps ?? []) {
      if (bankIds.has(f.id)) out.push(`follow-up "${f.id}" reuses a bank id`);
      if (seen.has(f.id)) out.push(`follow-up id "${f.id}" used twice`);
      seen.add(f.id);
      if (!f.text.trim()) out.push(`follow-up "${f.id}" has no question text`);
      walk(f.answer, `${path} > ${f.id}`);
    }
  };
  for (const [id, a] of Object.entries(c.answers)) if (a) walk(a, id);
  let last = 0;
  for (const i of c.interjections ?? []) {
    if (i.atSec < 5) out.push(`interjection at ${i.atSec}s is too early`);
    if (i.atSec < last) out.push(`interjections out of order at ${i.atSec}s`);
    last = i.atSec;
    if (!i.text.trim()) out.push(`empty interjection at ${i.atSec}s`);
    if (i.effect?.regrade && !GRADE_LABELS[service].includes(i.effect.regrade)) out.push(`regrade "${i.effect.regrade}" at ${i.atSec}s is not a ${service} grade`);
    for (const q of [...(i.requiresAsked ?? []), ...(i.unlessAsked ?? [])]) if (!bankIds.has(q) && !seen.has(q)) out.push(`interjection at ${i.atSec}s refers to unknown question "${q}"`);
  }
  if (c.drops && c.drops.atSec < 30) out.push(`caller drops at ${c.drops.atSec}s — too soon to take a call`);
  return out;
}
