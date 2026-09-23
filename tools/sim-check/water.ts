// The water rescue, played through: from a Water Incident Unit parked on
// the access road at Salford Quays, does the plan reach the casualty
// before the weir, and do the moments come in a sensible order?

import { SCENARIOS } from "@/lib/sim/scenarios";
import { planWaterRescue, driftPosition, boatPosition, casualtyWaterPosition, weirReachedAt } from "@/lib/sim/water_rescue";

let problems = 0;
const fail = (m: string) => { problems += 1; console.log("  FAIL " + m); };

for (const s of SCENARIOS) {
  const scene = s.scene;
  const cas = scene?.casualties?.find((c) => c.inWater);
  if (!scene || !cas) continue;
  if (!scene.water) { fail(`${s.id}: casualty in water but no scene.water`); continue; }
  if (!scene.roads.some((r) => r.kind === "water")) { fail(`${s.id}: no water on the scene`); continue; }
  const receivedAt = 0;
  const lostAt = weirReachedAt(scene.water, receivedAt);
  console.log(`${s.id} ${s.title}`);
  console.log(`  drift ${scene.water.driftMps} m/s bearing ${scene.water.driftBearingDeg}°${lostAt !== null ? ` · weir in ${(lostAt / 60000).toFixed(1)} min` : ""}`);
  for (const arriveMin of [5, 8, 10]) {
    const startedAt = arriveMin * 60_000;
    const crewStart = { x: -40, y: 30 }; // the access road, IWM side
    const tl = planWaterRescue(scene, cas, receivedAt, startedAt, crewStart);
    if (!tl) { fail(`${s.id}: no plan at ${arriveMin} min`); continue; }
    const casAtStart = driftPosition(cas, scene.water, receivedAt, startedAt);
    const line = [
      `  start +${arriveMin} min · casualty at (${casAtStart.x.toFixed(0)}, ${casAtStart.y.toFixed(0)}) · ${tl.mode}`,
      `edge +${((tl.atEdgeAt - startedAt) / 1000).toFixed(0)} s`,
      `launch +${((tl.launchAt - startedAt) / 1000).toFixed(0)} s`,
      tl.interceptAt !== undefined ? `reach +${((tl.interceptAt - startedAt) / 1000).toFixed(0)} s at (${tl.interceptPos!.x.toFixed(0)}, ${tl.interceptPos!.y.toFixed(0)})` : "never reached",
      tl.landAt !== undefined ? `land +${((tl.landAt - startedAt) / 1000).toFixed(0)} s at (${tl.landPos!.x.toFixed(0)}, ${tl.landPos!.y.toFixed(0)})` : "",
      tl.lost ? `LOST at ${((tl.lostAt ?? 0) / 60000).toFixed(1)} min` : "",
    ].filter(Boolean).join(" · ");
    console.log(line);
    if (tl.atEdgeAt < startedAt || tl.launchAt < tl.atEdgeAt) fail(`${s.id}: moments out of order`);
    if (tl.interceptAt !== undefined && tl.landAt !== undefined && tl.landAt <= tl.interceptAt) fail(`${s.id}: landed before reached`);
    if (!tl.lost && tl.interceptAt !== undefined && lostAt !== null && tl.interceptAt >= lostAt) fail(`${s.id}: reached after the weir but not marked lost`);
    if (tl.interceptAt !== undefined) {
      const mid = (tl.interceptAt + (tl.landAt ?? tl.interceptAt)) / 2;
      const c = casualtyWaterPosition(cas, scene.water, receivedAt, tl, mid);
      const b = tl.mode === "boat" ? boatPosition(tl, mid) : null;
      if (b && Math.hypot(b.x - c.x, b.y - c.y) > 0.5) fail(`${s.id}: casualty not in the boat on the way back`);
    }
    if (arriveMin === 5 && tl.lost) fail(`${s.id}: a five-minute start should reach them before the weir`);
    if (arriveMin === 10 && !tl.lost && lostAt !== null && tl.interceptAt !== undefined && tl.interceptAt < lostAt) console.log("  (a ten-minute start still makes it — tight)");
  }
}
console.log(`\n${problems} problem(s).`);
process.exit(problems ? 1 : 0);
