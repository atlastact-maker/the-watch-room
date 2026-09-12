import assert from "node:assert/strict";
import { dueTasks, liveTasks, mapLiveTasks, waterUseByTank, baConsumption, taskTickSeconds } from "@/lib/sim/runtime-tasks";
import { simulateIncident } from "@/lib/sim/incident_sim";
import { scenario02 } from "@/lib/sim/scenarios/02_dwelling_fire_wythenshawe";
import type { Deployment, Incident, Task } from "@/lib/sim/incident_types";

const start = 1_000_000;
const minute = start + 60_000;
const incident = (id: string): Incident => ({ id, scenarioId: "02", scenario: scenario02, receivedAt: start });
const incidents = [incident("a"), incident("b")];
const task = (id: string, applianceId: string, kind: Task["kind"], extra: Partial<Task> = {}): Task => ({
  id, applianceId, kind, startedAt: start, state: "active", assignedCrewIds: [], ...extra,
});
const rt = (tasks: Task[], extra = {}) => ({ tasks, outcome: null as unknown, handover: null as unknown, ...extra });
let county: Record<string, ReturnType<typeof rt>> = {
  a: rt([
    task("survey-a", "pump-a", "survey", { completesAt: minute }),
    task("hose-a", "pump-a", "hose_attack", { hoseType: "45mm" }),
    task("ba-a", "pump-a", "ba_sar", { baCrewIds: ["crew-a"], baPressure: { "crew-a": 300 } }),
  ]),
  b: rt([
    task("entry-b", "pump-b", "gain_entry", { completesAt: minute, entryTool: "lock_snapper" }),
    task("hose-b", "pump-b", "hose_attack", { hoseType: "70mm" }),
    task("ba-b", "pump-b", "ba_sar", { baCrewIds: ["crew-b"], baPressure: { "crew-b": 300 } }),
  ]),
  closed: rt([task("closed", "pump-c", "hose_attack")], { outcome: {} }),
  delegated: rt([task("delegated", "pump-d", "hose_attack")], { handover: {} }),
};

// Two incidents progress together. There is intentionally no selected-incident input.
assert.equal(liveTasks(county).length, 6);
assert.equal(dueTasks(county, incidents, minute - 1).length, 0);
const completed = dueTasks(county, incidents, minute);
assert.deepEqual(completed.map((c) => c.incidentId), ["a", "b"]);
assert.equal(completed[1].doorType, "upvc");
assert.deepEqual(dueTasks(county, incidents, minute), completed, "entry results must survive replays");
const results = new Map(completed.map((c) => [c.task.id, c]));
const initial = county;
county = mapLiveTasks(county, (t) => {
  const result = results.get(t.id);
  return result ? { ...t, state: result.failed ? "aborted" : "completed" } : t;
});
assert.equal(dueTasks(county, incidents, minute).length, 0, "a completed order cannot fire twice");
assert.equal(initial.a.tasks[0].state, "active", "state updates must be immutable");
assert.equal(county.closed, initial.closed);
assert.equal(county.delegated, initial.delegated);
assert.equal(mapLiveTasks(county, (t) => t), county, "an idle tick should preserve state identity");

// Supply draws independently at both incidents, including when one uses a hydrant.
assert.deepEqual([...waterUseByTank(county, start, minute)], [["pump-a", 450], ["pump-b", 900]]);
const supplied = { ...county, a: rt([...county.a.tasks, task("hydrant-a", "pump-a", "connect_hydrant")]) };
assert.deepEqual([...waterUseByTank(supplied, start, minute)], [["pump-b", 900]]);
const relayed = { ...county, b: rt([...county.b.tasks, task("relay-b", "pump-b", "relay_hose", { sourceApplianceId: "tanker-b" })]) };
assert.equal(waterUseByTank(relayed, start, minute).get("tanker-b"), 900);

// Both crews lose air, and a crew committing halfway through a tick only uses half a tick.
const consume = (tasks: typeof county) => mapLiveTasks(tasks, (t) => {
  if (t.kind !== "ba_sar" || !t.baPressure) return t;
  const drop = baConsumption(t, start, minute, 15);
  return { ...t, baPressure: Object.fromEntries(Object.entries(t.baPressure).map(([id, bar]) => [id, Math.max(0, bar - drop.bar)])) };
});
const afterAir = consume(county);
assert.ok(afterAir.a.tasks[2].baPressure!["crew-a"] < 300);
assert.equal(afterAir.a.tasks[2].baPressure!["crew-a"], afterAir.b.tasks[2].baPressure!["crew-b"]);
const late = task("late", "pump-a", "ba_sar", { startedAt: start + 30_000 });
assert.equal(taskTickSeconds(late, start, minute), 30);
assert.equal(baConsumption(late, start, minute, 15).pct, 1.5);
assert.ok(baConsumption(late, start, minute, 0).bar > baConsumption(late, start, minute, 15).bar);
assert.equal(taskTickSeconds({ ...late, state: "aborted" }, start, minute), 0);

// The county fleet must not reveal hazards or provide medical attendance at an unrelated job.
const deployment: Deployment = { applianceId: "pump-a", incidentId: "a", slotId: "pump", mobilisedAt: start,
  etaSeconds: 0, arrivesAt: start };
const noAttendance = simulateIncident(incidents[1], [], {}, [], start + 10 * 60_000);
const otherIncident = simulateIncident(incidents[1], [deployment], { "pump-a": 4 }, [], start + 10 * 60_000);
assert.deepEqual(otherIncident, noAttendance);
const ownAttendance = simulateIncident(incidents[0], [deployment], { "pump-a": 4 }, [], start + 10 * 60_000);
assert.ok(ownAttendance.firstArrivalElapsedSec > 0);
assert.equal(otherIncident.firstArrivalElapsedSec, 0);
assert.ok(ownAttendance.visibleHazards.length > otherIncident.visibleHazards.length);
console.log("PASS: concurrent tasks, replay safety, water supply, BA air, closed/delegated isolation and incident attendance.");
