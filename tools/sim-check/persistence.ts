import assert from "node:assert/strict";
import { applyResumeOffset, type ShiftSave } from "@/lib/sim/save";
import { proposeFill } from "@/app/dashboard/vector/desk-model";

const task = { id: "ba", applianceId: "p1", kind: "ba_sar", assignedCrewIds: ["crew"], state: "active", startedAt: 1000, completesAt: 11000, baEntryAt: { crew: 1000 }, baWhistleAt: { crew: 9000 }, baPressure: { crew: 270 } };
const runtime = { tasks: [task], structuralDamage: 42, handover: { atMs: 1000, effectiveAtMs: 2000, clearAtMs: 20000, requests: [{ atMs: 2000, dueAtMs: 4000 }] } };
const save = { version: 3, savedAt: 5000, shiftStartedAt: 500, activeIncident: { id: "a", receivedAt: 1000 }, incidents: [{ id: "a", receivedAt: 1000 }, { id: "b", receivedAt: 2000 }], runtimes: { a: runtime, b: runtime }, deployments: [], tasks: [task], treatmentByCasualtyId: {}, log: [], informantLog: [], lastAirTickAt: 5000, lastFatigueTickAt: 5000 } as unknown as ShiftSave;
const restored = applyResumeOffset(save, 65000);
const a = restored.runtimes!.a as typeof runtime;
assert.equal(restored.incidents![1].receivedAt, 62000);
assert.equal(a.tasks[0].completesAt, 71000);
assert.equal(a.tasks[0].baWhistleAt.crew, 69000);
assert.equal(restored.tasks[0].baWhistleAt!.crew, 69000);
assert.equal(a.tasks[0].baPressure.crew, 270);
assert.equal(a.structuralDamage, 42);
assert.equal(a.handover.clearAtMs, 80000);
assert.equal(a.handover.requests[0].dueAtMs, 64000);
assert.equal(65000 - restored.shiftStartedAt!, 5000 - save.shiftStartedAt!);
assert.equal(runtime.tasks[0].completesAt, 11000, "Resume must not mutate the saved snapshot");

const model = {
  pda: ["pump1", "pump2", "pump3"].map((slotId) => ({ slotId, slot: slotId, callsign: null })),
  cards: ["p1", "p2", "p3"].map((applianceId) => ({ applianceId, stationId: "s", blocked: "", fit: "Fills pump1", compatibleSlotIds: ["pump1", "pump2", "pump3"] })),
} as unknown as Parameters<typeof proposeFill>[0];
assert.deepEqual(proposeFill(model, undefined).map((p) => [p.applianceId, p.slotId]), [["p1", "pump1"], ["p2", "pump2"], ["p3", "pump3"]]);
model.cards[1].blocked = "Committed elsewhere";
assert.equal(proposeFill(model, undefined).length, 2);
console.log("PASS: county resume timers, BA pressure preservation, shift clock, repeated attendance slots and blocked units.");
