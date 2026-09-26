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

import type { IncidentTypeCode, Scenario } from "./incident_types";
import { BASE_VARIANT } from "./scene";
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
  /** What they say instead in a given run, by variant id. Everything
   *  else about the answer is shared. */
  byVariant?: Record<string, string>;
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
  /** Only in these runs (variant ids; "base" is the un-varied run). */
  requiresVariantIds?: string[];
  excludesVariantIds?: string[];
};

/** One line of pre-arrival advice — what the operator reads to the caller
 *  once the job is sent and the caller is still on. Ordered; read one at a
 *  time. */
export type PreArrivalStep = {
  /** Unique within the script. */
  id: string;
  /** What the operator says. */
  text: string;
  /** The debrief counts this one if it goes unread. */
  key?: boolean;
  /** What reading it does to the call — settles the caller, mostly. */
  effect?: CallEffect;
  /** What the caller says back. Defaults to a short acknowledgement in
   *  their current state. */
  reply?: string;
  /** Their reply in a given run, by variant id. */
  replyByVariant?: Record<string, string>;
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
  /** Their first words in a given run, by variant id. */
  openingByVariant?: Record<string, string>;
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
  /** Pre-arrival advice in this caller's situation. A script without its
   *  own gets the service's defaults for the scenario type — see
   *  `preArrivalFor`. */
  preArrival?: PreArrivalStep[];
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

// ---- Pre-arrival advice --------------------------------------------------
//
// What the handler reads once the job is sent: the things that keep the
// caller and the patient alive, or get the crew to the door, in the
// minutes before anyone arrives. A script authors its own in the caller's
// situation; anything else gets the service's defaults for the job type,
// or the service's general list when the type has nothing of its own.

const step = (id: string, text: string, key?: boolean): PreArrivalStep => (key ? { id, text, key: true } : { id, text });

const FIRE_GENERAL: PreArrivalStep[] = [
  step("out", "Get everyone out of the building and stay out. Do not go back in for anything — not for pets, not for belongings.", true),
  step("doors", "Shut the doors behind you as you go — it holds the fire and the smoke back."),
  step("count", "Count who is out with you and think about who is not. The crews will ask you first thing."),
  step("meet", "Get somewhere safe where you can see the road, and wave the crews in when they arrive. Tell them exactly what you told me."),
  step("road", "Keep the road and the front of the building clear — cars back, people back."),
];

const AMBULANCE_GENERAL: PreArrivalStep[] = [
  step("door", "Unlock the front door and put the lights on so the crew can find you.", true),
  step("dog", "If there is a dog in the house, shut it in another room."),
  step("meds", "Gather up any medication they take, and any letters from the hospital or the GP, ready for the crew."),
  step("position", "Let them get into whatever position is most comfortable. Do not give them anything to eat or drink."),
  step("watch", "Stay with them, keep watching their breathing, and if anything changes tell me straight away."),
];

const POLICE_GENERAL: PreArrivalStep[] = [
  step("safe", "Stay where you are safe and stay on the line with me.", true),
  step("distance", "Keep well away from anyone involved. Do not go near them and do not get involved."),
  step("describe", "Keep watching if you can do it safely, and tell me what they look like, what they are wearing, and which way they go."),
  step("meet", "When the officers arrive, tell them exactly what you told me."),
];

const FIRE_BY_TYPE: Partial<Record<IncidentTypeCode, PreArrivalStep[]>> = {
  dwelling_fire_persons_reported: [
    step("out", "Nobody goes back into that house. Not you, not anyone. The crews are trained and equipped for it and you are not.", true),
    step("windows", "If anyone comes to a window, shout up to them: shut the door of the room, stay by the window, and the fire brigade are on their way.", true),
    step("doors", "If anyone gets out, keep them with you and keep them out. Shut the front door behind them if it is safe to do so."),
    step("count", "Count who is out and who is not, and which rooms they would be in. The first crew will ask you before anything else."),
    step("meet", "Get where you can see the road and wave the crews in. Keep the road clear."),
  ],
  hmo_fire: [
    step("out", "Nobody goes back in. Not for anyone, not for anything.", true),
    step("count", "Count who is out with you, which rooms they are from, and who nobody has seen. Ask everyone — the crews will need it the second they arrive.", true),
    step("windows", "If anyone comes to a window, shout up: shut the door of the room, stay by the window, they are coming."),
    step("meet", "Stay where you can see the road and wave the crews in. Keep the pavement and the road clear."),
  ],
  high_rise_dwelling_fire: [
    step("out", "If the fire or smoke is in your own flat, get everyone out, shut the door behind you and go down by the stairs — never the lift.", true),
    step("stay", "If the fire is elsewhere and there is no smoke in your flat, stay put with the doors and windows shut and block the gaps. Only leave if smoke or heat gets in, or the crews tell you to."),
    step("lift", "Do not use the lift under any circumstances."),
    step("meet", "Someone on the ground: meet the crews at the entrance and tell them which floor and which flat."),
  ],
  education_premises_fire: [
    step("out", "Evacuate on the school's plan to the assembly point and take the registers with you.", true),
    step("count", "Roll call at the assembly point. The crews want to know who is unaccounted for before anything else.", true),
    step("meet", "Someone to meet the crews at the main gate with the plan and the keys."),
    step("road", "Keep the gates and the road clear — cars and parents back."),
  ],
  industrial_fire: [
    step("out", "Evacuate on the site plan and go to the assembly point. Nobody goes back in.", true),
    step("count", "Roll call. The crews want to know who is unaccounted for, and where they would be."),
    step("hazards", "Have someone who knows the site meet the crews at the gate with the plans and what is stored where — gas, chemicals, anything under pressure.", true),
    step("isolate", "If it can be done safely from outside, isolate the gas and the power."),
  ],
  healthcare_premises_fire_alarm: [
    step("plan", "Follow the fire plan — progressive horizontal evacuation, patients moved through the fire doors to the next compartment."),
    step("panel", "Someone to the fire panel to meet the crews and tell them which zone has activated."),
    step("doors", "Keep the fire doors shut and the corridors clear."),
  ],
  automatic_fire_alarm: [
    step("out", "Evacuate on the alarm. Do not go looking for the cause."),
    step("panel", "Meet the crews at the fire panel and tell them which zone has activated, and whether anyone has seen anything."),
    step("road", "Keep the entrance and the road clear for the appliances."),
  ],
  agricultural_fire: [
    step("out", "Everyone out of the building and well back. Do not go in for the animals unless you can open a door from outside and stand clear.", true),
    step("hazards", "Tell me now what is in there — diesel, gas, fertiliser, slurry, anything under pressure — and tell the crews the same."),
    step("access", "Open the gates and have someone at the road end to guide the appliances in. They need to know about the track and the ground."),
    step("water", "If you have a tank, a pond or a hydrant on the farm, tell the crews where it is."),
  ],
  chimney_fire: [
    step("out", "Get everyone out of the room and keep them out. Shut the door to it."),
    step("fire", "Do not put water on the fire. If you can do it safely, close the stove or the fireplace right down to starve it."),
    step("upstairs", "Check upstairs — feel the walls and look for smoke where the chimney runs. If there is smoke up there, everyone out."),
    step("meet", "Meet the crews at the door and show them where the chimney runs."),
  ],
  secondary_fire_refuse: [
    step("back", "Stay well back from it. Do not try to put it out."),
    step("spread", "Keep an eye on whether it is spreading to anything — a fence, a car, a building — and tell me if it does."),
    step("meet", "Wave the crew in when they arrive and tell them if anyone was seen setting it."),
  ],
  vehicle_fire: [
    step("out", "Everyone out of the vehicle and at least thirty metres back, well away from the road.", true),
    step("bonnet", "Do not open the bonnet and do not try to put it out."),
    step("others", "Keep other people back from it. Tyres and cylinders can go."),
    step("meet", "Stay where you can see the road and wave the crew in."),
  ],
  vehicle_fire_ev: [
    step("out", "Everyone out of the vehicle and well back — fifty metres — and stay upwind of the smoke. Do not breathe it.", true),
    step("touch", "Do not touch the car and do not try to put it out. Do not open the bonnet or the charging flap."),
    step("charger", "If it is on a charger and there is an emergency stop you can reach without going near it, hit it."),
    step("meet", "Keep others back and wave the crew in."),
  ],
  wildfire_moorland: [
    step("away", "Get off the moor and away from the fire — downhill and upwind, on a path if you can.", true),
    step("fight", "Do not try to beat it out. It moves faster than you can walk."),
    step("others", "Tell anyone you pass to get off the hill the same way."),
    step("meet", "Get to the road and stay there. Tell the crews which path you came down and where the fire is."),
  ],
  hazmat_chemical_leak: [
    step("away", "Move away from it, uphill and upwind if you can. Do not go near it, do not touch it, and do not go back.", true),
    step("shelter", "If you are indoors, stay in, shut the doors and windows and turn off any fans or air conditioning."),
    step("contam", "Anyone who has got it on them stays together, away from everyone else, and takes off any clothing that is wet with it."),
    step("meet", "Someone who knows what it is meets the crews well back from it, with any labels or paperwork."),
  ],
  rtc_entrapment: [
    step("barrier", "Stay off the carriageway. Get behind the barrier or well off the road, and keep everyone with you there.", true),
    step("move", "Do not try to move anyone who is trapped, and tell them to keep still.", true),
    step("engine", "If it can be reached safely, switch off the ignition. No smoking anywhere near it — there will be fuel."),
    step("lights", "Hazard lights on, and stay where the crews can see you."),
    step("watch", "Keep watching them. If anyone stops answering or the smoke changes, tell me straight away."),
  ],
  special_service_water_rescue: [
    step("water", "Do not go into the water, and do not let anyone else go in. It is colder and faster than it looks.", true),
    step("eyes", "Keep your eyes on him. Do not look away, and tell me if he goes under or moves.", true),
    step("throw", "If there is a lifebuoy, a rope, or anything that floats, throw it to him. Do not reach or wade."),
    step("shout", "Shout to him: float on your back, keep your head up, and hold on to anything that floats."),
    step("meet", "Stay where you are so the crews can find him. Send someone to the road to bring them in."),
  ],
  special_service_rope_rescue: [
    step("edge", "Stay well back from the edge. Do not try to climb down to him and do not let anyone else.", true),
    step("talk", "Keep talking to him and keep your eyes on him. Tell him to stay exactly where he is and not to move."),
    step("meet", "Send someone to the nearest road to bring the crews in — they will need to know the way to the top."),
  ],
  special_service_gas_leak: [
    step("switches", "Do not touch any light switches, plugs or anything electrical, and no naked flames — no cigarettes, no lighters.", true),
    step("out", "Get everyone out of the property, opening doors and windows on the way if it is safe to."),
    step("meter", "If you can safely turn the gas off at the meter, do that on the way out."),
    step("meet", "Wait well away from the building and wave the crew in."),
  ],
  special_service_co_exposure: [
    step("out", "Get everyone out into fresh air now, and leave the doors open behind you.", true),
    step("back", "Nobody goes back in for anything."),
    step("appliances", "If you can reach it from the door, turn off the boiler, the fire or the cooker. Do not go in to do it."),
    step("symptoms", "Anyone with a headache, feeling sick or dizzy, or confused, stays in the fresh air and sits down. Tell me if anyone collapses."),
  ],
  special_service_flooding: [
    step("water", "Do not walk, wade or drive through flood water. Six inches will take your feet.", true),
    step("power", "If it is safe, turn off the electricity at the fuse box before the water reaches the sockets."),
    step("up", "Move upstairs with a phone, a torch, warm clothes and any medication."),
    step("meet", "Stay where the crews can see you from the road and tell them how deep it is."),
  ],
  special_service_lift_release: [
    step("calm", "Tell them the crew is on the way, and to stay calm. There is plenty of air in there."),
    step("doors", "Nobody forces the doors and nobody tries to climb out. A lift between floors can move."),
    step("meet", "Someone to meet the crews at the entrance with the lift keys or the building's engineer's number."),
  ],
  special_service_effecting_entry: [
    step("force", "Do not force the door or go in through a window yourself. The crew will get in without anyone getting hurt."),
    step("knock", "Keep knocking, keep shouting through the letterbox, and tell me if you hear anything at all."),
    step("keys", "Ask the neighbours whether anyone has a key or knows a key safe code."),
    step("meet", "Stay at the door and tell the crews everything you know about who is in and how they usually are."),
  ],
};

const AMBULANCE_BY_TYPE: Partial<Record<IncidentTypeCode, PreArrivalStep[]>> = {
  ambulance_cardiac_arrest: [
    step("flat", "Get them flat on their back on the ground, and tilt their head back to open the airway."),
    step("cpr", "Start chest compressions now: heel of your hand in the centre of the chest, other hand on top, push hard and fast, twice a second, and do not stop.", true),
    step("aed", "Send someone to find a defibrillator — a shop, a station, a pavilion. Open it and do what it says; it will not shock anyone who does not need it.", true),
    step("swap", "Swap whoever is pushing every couple of minutes so it stays hard and fast. Do not stop for more than a moment."),
    step("meet", "Send someone to the road to flag the crew and bring them straight to you."),
  ],
  ambulance_choking: [
    step("cough", "If they can cough, tell them to keep coughing."),
    step("backblows", "If they cannot cough or breathe: lean them forward and give five hard blows between the shoulder blades with the heel of your hand.", true),
    step("thrusts", "If that has not shifted it: stand behind them, fist above the belly button, pull sharply in and up, five times. Then back to the back blows.", true),
    step("collapse", "If they go limp, get them flat on the floor and tell me straight away — we will start compressions."),
  ],
  ambulance_chest_pain: [
    step("rest", "Sit them down, still and comfortable — do not let them walk about.", true),
    step("aspirin", "If they are not allergic and there is aspirin in the house, one 300 mg tablet, chewed, not swallowed."),
    step("gtn", "If they have a GTN spray from the doctor, use it as they have been shown."),
    step("door", "Unlock the door, put the lights on, and get any medication ready for the crew."),
    step("watch", "Stay with them. If they stop answering you or their breathing changes, tell me straight away."),
  ],
  ambulance_stroke: [
    step("time", "Note the exact time they were last seen normal. The hospital will ask, and it decides what they can do.", true),
    step("position", "Sit or lie them comfortably with their head raised. Nothing to eat or drink — not even water."),
    step("door", "Unlock the door, lights on, and get their medication and any letters ready."),
    step("watch", "Stay with them and keep talking to them. Tell me if anything changes."),
  ],
  ambulance_breathing: [
    step("sit", "Sit them upright, leaning forward slightly — never flat.", true),
    step("inhaler", "If they have an inhaler, let them use it as they have been shown."),
    step("calm", "Loosen anything tight round the neck, open a window, and keep them as calm as you can."),
    step("door", "Unlock the door and put the lights on."),
    step("watch", "If they cannot speak, their lips go blue, or they stop answering, tell me straight away."),
  ],
  ambulance_overdose: [
    step("what", "Find out what they took, how much and when, and keep the packets, bottles or wrappers for the crew.", true),
    step("recovery", "If they are drowsy but breathing, roll them onto their side with their head tilted back so they cannot choke."),
    step("naloxone", "If there is naloxone in the house, use it now as you have been shown."),
    step("watch", "Stay with them and keep watching their breathing. If it slows or stops, tell me straight away."),
  ],
  ambulance_diabetic: [
    step("sugar", "If they are awake and can swallow safely, give them something sugary — a sugary drink, glucose tablets, jelly babies.", true),
    step("nothing", "If they are drowsy or not making sense, nothing by mouth. Roll them onto their side."),
    step("door", "Unlock the door, lights on, and have their insulin and meter ready for the crew."),
    step("watch", "Stay with them and tell me if they stop answering you."),
  ],
  ambulance_anaphylaxis: [
    step("pen", "If they have an adrenaline pen, use it now: outer thigh, through clothing, hold it in place. A second one after five minutes if they are no better.", true),
    step("position", "Sit them up if they are struggling to breathe; lie them flat with their legs raised if they are faint or pale. Do not let them stand up."),
    step("nothing", "Nothing to eat or drink."),
    step("watch", "If they stop responding or stop breathing, lie them flat and tell me straight away."),
  ],
  ambulance_maternity: [
    step("position", "Get her lying down somewhere clean and warm, with towels under her."),
    step("baby", "If the baby comes before the crew, let it — support the head, do not pull. Dry the baby, put it on her chest skin to skin and cover them both.", true),
    step("cord", "Do not cut or pull the cord."),
    step("door", "Unlock the door, lights on, and get her notes ready."),
  ],
  ambulance_fall_elderly: [
    step("still", "If they have pain in the hip or the back, do not try to get them up. Keep them where they are.", true),
    step("warm", "Put a blanket or a coat over them, and something under their head."),
    step("door", "Unlock the door, lights on, and get their medication and any care plan ready."),
    step("watch", "Stay with them. If they become confused or stop answering you, tell me straight away."),
  ],
  ambulance_major_trauma: [
    step("still", "Do not move them. Keep them as still as you can, and keep their head still — hands either side.", true),
    step("bleed", "If there is bleeding, press firmly on it with a clean cloth and keep pressing. Do not let go to look.", true),
    step("warm", "Cover them with coats or a blanket to keep them warm. Nothing to eat or drink."),
    step("meet", "Send someone to meet the crew and bring them straight in."),
  ],
  ambulance_assault: [
    step("safe", "Is the person who did this still there? If so, get yourselves somewhere safe first. Do not go after them.", true),
    step("bleed", "Press firmly on any bleeding with a clean cloth and keep pressing. Do not pull anything out of a wound.", true),
    step("still", "Keep them still and keep them warm. Nothing to eat or drink."),
    step("watch", "Stay with them and tell me if they become drowsy or stop answering you."),
  ],
  ambulance_mental_health: [
    step("stay", "Stay with them. Do not leave them on their own.", true),
    step("means", "If there is anything they could hurt themselves with within reach, move it away quietly, if you can do that safely."),
    step("talk", "Keep talking to them, calmly. Do not argue, and do not make promises about what will happen."),
    step("door", "Unlock the door so the crew can come straight in."),
  ],
  ambulance_transfer: [
    step("ready", "Have the patient ready to go — dressed, with their medication, their notes and the transfer letter."),
    step("access", "Someone at the entrance to bring the crew straight to them."),
    step("changes", "If the patient's condition changes before the crew arrive, ring back on 999."),
  ],
  ambulance_hcp_admission: [
    step("paperwork", "Have the referral, the medication list and any DNACPR or ReSPECT form ready for the crew."),
    step("access", "Someone at the door to bring the crew in, and a clear route to the patient."),
    step("changes", "If they deteriorate before the crew arrive, ring back on 999 straight away."),
  ],
};

const POLICE_BY_TYPE: Partial<Record<IncidentTypeCode, PreArrivalStep[]>> = {
  police_domestic_in_progress: [
    step("stay", "Stay in your own house with the door locked. Do not go round there and do not open the door to anyone but the police.", true),
    step("listen", "Keep listening. Tell me straight away if it goes quiet, if anyone leaves, or if you hear anything about a weapon.", true),
    step("leaves", "If he leaves, do not follow. Tell me which way he goes and what he is driving."),
    step("meet", "When the officers arrive, tell them everything you have heard tonight and before."),
  ],
  police_burglary_in_progress: [
    step("hide", "Stay where you are, keep quiet, and lock the door of the room you are in if you can.", true),
    step("confront", "Do not go downstairs and do not confront them. Property can be replaced."),
    step("describe", "Tell me what you can hear, how many there are, and if they leave, which way and what in."),
    step("touch", "When they have gone, do not touch anything — they may have left prints."),
  ],
  police_fight_night_time_economy: [
    step("away", "Stay well away from it and keep others back. Do not get involved.", true),
    step("describe", "Tell me who is involved — how many, what they are wearing, anyone with a weapon."),
    step("cctv", "Ask the door staff to keep hold of the CCTV and anyone who saw it start."),
    step("injured", "If anyone is hurt, keep them still and press on any bleeding. I will get an ambulance."),
  ],
  police_fail_to_stop_pursuit: [
    step("follow", "Do not follow it and do not try to stop it. Keep your distance.", true),
    step("describe", "Give me the registration, the colour and make, how many in it, and the direction it is going."),
    step("stop", "If it stops or crashes, stay back. Tell me exactly where."),
  ],
  police_missing_child: [
    step("search", "Search the house again now — every room, wardrobes, under beds, the garden, sheds, the car. Children hide.", true),
    step("describe", "Tell me exactly what they are wearing, their height, hair, and get a recent photo ready on your phone.", true),
    step("phone", "Ring their phone, their friends, and anywhere they might have gone. Keep one person at home in case they come back."),
    step("lastseen", "Tell me exactly where and when they were last seen, and by whom."),
  ],
  police_robbery_knife: [
    step("chase", "Do not go after them. Get yourself somewhere safe with people about.", true),
    step("describe", "Tell me what they looked like, what they were wearing, which way they went and how."),
    step("injured", "If anyone is hurt, press on any bleeding and keep them still. I will get an ambulance."),
    step("evidence", "Do not touch anything they dropped or left, and keep anyone who saw it there."),
  ],
  police_concern_for_welfare: [
    step("stay", "Stay on the line with me and stay where you can see them if it is safe.", true),
    step("approach", "Do not put yourself at risk. If they are hostile or on a ledge, do not go near them."),
    step("talk", "If they will talk to you, keep them talking. Do not argue and do not make promises."),
    step("describe", "Tell me what they are wearing and exactly where they are."),
  ],
  police_anpr_hit_stolen_vehicle: [
    step("follow", "Do not follow it or approach the occupants."),
    step("describe", "Tell me the direction, the speed, and how many are in it."),
  ],
  police_shoplifter_detained: [
    step("calm", "Keep them sat down and keep talking to them calmly. No hands on unless they try to leave or hurt someone.", true),
    step("search", "Do not search them or go through their pockets. That is for the officers."),
    step("cctv", "Keep the property and the CCTV as they are for the officers."),
    step("leaves", "If they get up and go, let them go. Do not chase — tell me which way and what they are wearing."),
  ],
  police_rtc_damage_only: [
    step("safe", "Get everyone off the carriageway and behind the barrier, hazard lights on.", true),
    step("details", "Exchange names, addresses, registrations and insurance with the other driver."),
    step("argue", "Do not argue at the roadside. If it turns nasty, get back in your car and lock it."),
  ],
  police_sudden_death_expected: [
    step("leave", "Do not move them, and leave everything in the room as it is.", true),
    step("paperwork", "Get their medication, the GP's details and any DNACPR or care plan paperwork together for the officers."),
    step("family", "If you are on your own, is there someone who can come and sit with you?"),
  ],
  police_drink_driver: [
    step("follow", "Do not follow them and do not try to stop them.", true),
    step("describe", "Tell me the registration, the make and colour, and which way they have gone."),
    step("stop", "If they stop, do not approach. Tell me where."),
  ],
  police_neighbour_dispute: [
    step("inside", "Stay inside and do not go out to them. Do not answer the door to them.", true),
    step("record", "Write down what happened and when, and keep any messages or recordings."),
    step("meet", "The officers will want to speak to you first when they arrive."),
  ],
  police_mental_health_rcrp: [
    step("stay", "Stay with them and keep them talking.", true),
    step("means", "If there is anything within reach they could hurt themselves with, move it away quietly, if you can do that safely."),
    step("nhs", "The right help is a mental health team. I will give you the number, and if anything changes ring 999 back."),
  ],
  police_abandoned_999: [
    step("line", "Stay on the line. You do not have to say anything — tap the phone if you can hear me."),
    step("safe", "If you can, get somewhere safe and lock the door."),
  ],
  police_asb_youths: [
    step("inside", "Stay inside. Do not go out to them and do not get into it with them.", true),
    step("describe", "Tell me how many, roughly what age, what they are wearing, and what they are doing."),
    step("damage", "If anything is damaged, leave it as it is for the officers."),
  ],
  police_vehicle_stop_no_insurance: [
    step("remain", "Stay in the vehicle with the engine off and your hands where the officer can see them."),
    step("documents", "Have your licence and any insurance documents ready."),
  ],
  police_firearms_incident: [
    step("cover", "Get inside, away from windows, and keep down. Lock the door.", true),
    step("quiet", "Keep quiet, keep the phone on silent, and keep everyone with you."),
    step("describe", "Tell me what you saw — how many, what they had, what they were wearing, which way they went."),
    step("officers", "When the officers arrive, do what they say immediately and keep your hands where they can see them."),
  ],
};

/** The service's pre-arrival advice for a job type, when the script has
 *  none of its own. */
export function defaultPreArrival(service: ServiceCode, type: IncidentTypeCode): PreArrivalStep[] {
  // The job type's own list first, whichever service wrote it — an assault
  // led by police is still a bleed to press on — then the service's general
  // list.
  const own = service === "Fire" ? FIRE_BY_TYPE : service === "Ambulance" ? AMBULANCE_BY_TYPE : POLICE_BY_TYPE;
  return own[type] ?? FIRE_BY_TYPE[type] ?? AMBULANCE_BY_TYPE[type] ?? POLICE_BY_TYPE[type] ?? (service === "Fire" ? FIRE_GENERAL : service === "Ambulance" ? AMBULANCE_GENERAL : POLICE_GENERAL);
}

/** The steps the handler reads on this call: the script's own, or the
 *  service's defaults for the job type. */
export function preArrivalFor(s: Scenario, service: ServiceCode): PreArrivalStep[] {
  return s.call?.preArrival ?? defaultPreArrival(service, s.type);
}

/** What a caller says back to a piece of advice, when the step gives no
 *  reply of its own. */
export function adviceAckFor(state: CallerState, step: PreArrivalStep, variantId?: string): string {
  const own = step.replyByVariant?.[variantId ?? BASE_VARIANT] ?? step.reply;
  if (own) return own;
  if (state === "panicking") return "Okay — okay. I'm doing it.";
  if (state === "hostile") return "Fine. Doing it.";
  if (state === "confused") return "Right. Yes. Okay.";
  return "Okay — doing that now.";
}

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
  // Pre-arrival advice: every step readable on its own, nothing read twice.
  const stepIds = new Set<string>();
  if (c.preArrival && c.preArrival.length === 0) out.push("preArrival is empty — leave it out to take the service's defaults");
  for (const [n, p] of (c.preArrival ?? []).entries()) {
    const where = `pre-arrival step ${p.id?.trim() ? `"${p.id}"` : `#${n + 1}`}`;
    if (!p.id?.trim()) out.push(`${where} has no id`);
    else if (stepIds.has(p.id)) out.push(`${where} id used twice`);
    stepIds.add(p.id);
    if (!p.text?.trim()) out.push(`${where} has no text`);
    if (p.reply !== undefined && !p.reply.trim()) out.push(`${where} has an empty reply`);
    if (p.effect?.regrade && !GRADE_LABELS[service].includes(p.effect.regrade)) out.push(`regrade "${p.effect.regrade}" at ${where} is not a ${service} grade`);
  }
  // Variant ids: a typo in a gate silently retires a beat (or an answer
  // override) on every run, so every id referenced anywhere in the
  // scenario must be declared under scene.variants (or be "base").
  const declared = new Set<string>([BASE_VARIANT, ...(s.scene?.variants ?? []).map((v) => v.id)]);
  const checkIds = (ids: string[] | undefined, where: string) => {
    for (const id of ids ?? []) if (!declared.has(id)) out.push(`${where} refers to undeclared variant "${id}"`);
  };
  const checkMap = (m: Record<string, string> | undefined, where: string) => {
    for (const [id, text] of Object.entries(m ?? {})) {
      if (!declared.has(id)) out.push(`${where} has text for undeclared variant "${id}"`);
      if (!text.trim()) out.push(`${where} has empty text for variant "${id}"`);
    }
  };
  checkMap(c.openingByVariant, "opening");
  const walkVariants = (a: CallAnswer, path: string) => {
    checkMap(a.byVariant, `answer ${path}`);
    for (const f of a.followUps ?? []) walkVariants(f.answer, `${path} > ${f.id}`);
  };
  for (const [id, a] of Object.entries(c.answers)) if (a) walkVariants(a, id);
  for (const i of c.interjections ?? []) {
    checkIds(i.requiresVariantIds, `interjection at ${i.atSec}s`);
    checkIds(i.excludesVariantIds, `interjection at ${i.atSec}s`);
  }
  for (const u of s.informantScript ?? []) {
    checkIds(u.requiresVariantIds, `informant beat "${u.id}"`);
    checkIds(u.excludesVariantIds, `informant beat "${u.id}"`);
  }
  const probSum = (s.scene?.variants ?? []).reduce((acc, v) => acc + v.probability, 0);
  if (probSum > 1) out.push(`variant probabilities sum to ${probSum.toFixed(2)} — nothing left for the base run`);
  const vseen = new Set<string>();
  for (const v of s.scene?.variants ?? []) {
    if (v.id === BASE_VARIANT) out.push(`variant id "${BASE_VARIANT}" is reserved for the authored run`);
    if (vseen.has(v.id)) out.push(`variant id "${v.id}" declared twice`);
    vseen.add(v.id);
  }
  return out;
}
