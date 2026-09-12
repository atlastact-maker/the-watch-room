import assert from "node:assert/strict";
import { menuPlayerState, parseWatchPreparation, preparedWatchUrl, WATCH_SERVICES } from "@/lib/sim/menu-state";
import { SAVE_MAX_AGE_MS, SHIFT_SAVE_VERSION } from "@/lib/sim/save";

const now = 1_000_000_000;
const saved = { version: SHIFT_SAVE_VERSION, savedAt: now - 60000, patch: "GreaterManchester", intensity: "normal", deployments: [], activeIncident: { scenario: { title: "Real saved incident" } } };
assert.deepEqual(menuPlayerState(null, null, now), { save: null, last: null }, "First visit must not invent a watch or debrief");
assert.equal(menuPlayerState(JSON.stringify(saved), null, now).save?.title, "Real saved incident");
assert.equal(menuPlayerState(JSON.stringify({ ...saved, savedAt: now - SAVE_MAX_AGE_MS - 1 }), null, now).save, null, "Expired saves must not advertise Resume");
assert.equal(menuPlayerState(JSON.stringify({ ...saved, version: SHIFT_SAVE_VERSION - 1 }), null, now).save, null);
assert.equal(menuPlayerState("broken JSON", "{}", now).save, null);
assert.equal(menuPlayerState(null, JSON.stringify({ grade: "A", resolvedAt: now }), now).last, null, "Incomplete results must not show fake numbers");
const last = { incidentTitle: "Completed incident", grade: "B", resolvedAt: now, resourcesUsed: 4, targetsMet: 3, targetsTotal: 4, casualtiesSaved: 2, casualtiesLost: 0 };
assert.equal(menuPlayerState(null, JSON.stringify(last), now).last?.resourcesUsed, 4);
for (let mask = 1; mask < 8; mask++) {
  const services = WATCH_SERVICES.filter((_, i) => mask & (1 << i));
  for (const intensity of ["quiet", "normal", "busy"] as const) {
    const url = new URL(preparedWatchUrl({ intensity, services }), "https://watch.example");
    assert.equal(url.pathname, "/dashboard");
    assert.equal(url.searchParams.get("new"), "1");
    assert.deepEqual(parseWatchPreparation(url.searchParams), { services, intensity });
  }
}
assert.throws(() => preparedWatchUrl({ intensity: "normal", services: [] }), /at least one/);
for (const query of ["prepared=1&intensity=normal&services=", "prepared=1&intensity=invalid&services=Fire", "prepared=1&intensity=normal&services=Fire,Unknown"]) assert.equal(parseWatchPreparation(new URLSearchParams(query)), null);
console.log("PASS: empty, valid, stale and malformed menu saves; completed results; all 21 service/intensity combinations; zero-service rejection.");
