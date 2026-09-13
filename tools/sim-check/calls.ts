// Every scenario's 999 call, checked as a caller would give it: a script
// on every job, answers to every question the service asks, key questions
// answered, follow-up ids that do not collide, interjections in order,
// a number in the Ofcom drama range.

import { SCENARIOS } from "@/lib/sim/scenarios";
import { validateCallScript, CALL_QUESTIONS } from "@/lib/sim/call_script";
import type { Scenario } from "@/lib/sim/incident_types";
import type { ServiceCode } from "@/lib/sim/types";

function serviceOf(s: Scenario): ServiceCode {
  return s.pda[0]?.service ?? (s.type.startsWith("ambulance") ? "Ambulance" : s.type.startsWith("police") ? "Police" : "Fire");
}

let problems = 0;
let scripted = 0;
const missing: string[] = [];
for (const s of SCENARIOS) {
  const service = serviceOf(s);
  if (!s.call) {
    missing.push(`${s.id} ${s.title}`);
    continue;
  }
  scripted += 1;
  const lines = validateCallScript(s, service);
  if (lines.length) {
    problems += lines.length;
    console.log(`\n${s.id} ${s.title} (${service}, ${Object.keys(s.call.answers).length}/${CALL_QUESTIONS[service].length} answered)`);
    for (const l of lines) console.log(`    ${l}`);
  }
}
console.log(`\nChecked ${SCENARIOS.length} scenarios — ${scripted} scripted, ${missing.length} without a call script.`);
if (missing.length) {
  console.log("\nNO CALL SCRIPT");
  for (const m of missing) console.log(`    ${m}`);
}
const total = problems + missing.length;
console.log(`\n${total} problem(s).`);
process.exit(total ? 1 : 0);
