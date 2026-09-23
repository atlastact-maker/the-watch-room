// The rope rescue, played through: from a line rescue van parked in the
// Broadley car park, the moments come in order and the times are what
// the brief says — a long walk in, then the rigging, the lower, the
// packaging and the haul.

import { SCENARIOS } from "@/lib/sim/scenarios";
import { planRopeRescue, casualtyRopePosition, rescuerPosition } from "@/lib/sim/rope_rescue";

let problems = 0;
const fail = (m: string) => { problems += 1; console.log("  FAIL " + m); };

for (const s of SCENARIOS) {
  const scene = s.scene;
  const cas = scene?.casualties?.find((c) => c.atHeight);
  if (!scene || !cas) continue;
  if (!scene.rope) { fail(`${s.id}: casualty at height but no scene.rope`); continue; }
  console.log(`${s.id} ${s.title}`);
  const startedAt = 0;
  const crewStart = { x: -44, y: 37 }; // parked in the car park
  const tl = planRopeRescue(scene, cas, startedAt, crewStart);
  if (!tl) { fail(`${s.id}: no plan`); continue; }
  const m = (t: number) => `${(t / 60000).toFixed(1)} min`;
  console.log(`  walk in ${m(tl.approachMs)} · top ${m(tl.atTopAt)} · rigged ${m(tl.riggedAt)} · rescuer with casualty ${m(tl.atCasualtyAt)} · packaged ${m(tl.packagedAt)} · ${tl.recovery === "raise" ? "at the top" : "on the floor"} ${m(tl.recoveredAt)}`);
  if (!(tl.atTopAt < tl.riggedAt && tl.riggedAt < tl.atCasualtyAt && tl.atCasualtyAt < tl.packagedAt && tl.packagedAt < tl.recoveredAt)) fail(`${s.id}: moments out of order`);
  if (tl.approach.length < 2) fail(`${s.id}: no approach path`);
  const mid = (tl.packagedAt + tl.recoveredAt) / 2;
  const c = casualtyRopePosition(cas, tl, mid);
  const r = rescuerPosition(tl, mid);
  if (!r || Math.hypot(r.x - c.x, r.y - c.y) > 0.5) fail(`${s.id}: rescuer not with the casualty on the haul`);
  const end = casualtyRopePosition(cas, tl, tl.recoveredAt + 1);
  if (Math.hypot(end.x - tl.recoveryPos.x, end.y - tl.recoveryPos.y) > 0.01) fail(`${s.id}: casualty not at the recovery point after the haul`);
  if (rescuerPosition(tl, tl.riggedAt - 1) !== null) fail(`${s.id}: rescuer over the edge before the lines are rigged`);
  if (tl.recoveredAt - startedAt > 45 * 60_000) fail(`${s.id}: the whole job takes over 45 minutes from the task start`);
}
console.log(`\n${problems} problem(s).`);
process.exit(problems ? 1 : 0);
