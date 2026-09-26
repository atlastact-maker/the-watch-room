// The generated scenario index against the modules it was cut from: the
// desk lists jobs from src/lib/sim/scenarios/meta.ts and fetches a body
// with loadScenario(id), so a scenario edited without `npm run
// scenarios:meta` would show the old title, attendance or address on the
// board while the call itself ran the new one. Fails while meta.ts is
// stale, while a scenario has no loader, and while a loader hands back
// a different scenario than the registry holds under that id.
import fs from "node:fs";
import path from "node:path";
import { SCENARIOS } from "@/lib/sim/scenarios";
import { SCENARIO_META } from "@/lib/sim/scenarios/meta";
import { SCENARIO_LOADERS, loadScenario, scenarioMeta } from "@/lib/sim/scenarios/load";
import { META_PATH, renderScenarioMeta } from "../gen-scenario-meta.cjs";

const problems: string[] = [];

// 1. The file on disk is what the modules would generate now.
const onDisk = fs.readFileSync(META_PATH, "utf8");
const fresh = renderScenarioMeta();
if (onDisk !== fresh) {
  const a = onDisk.split("\n");
  const b = fresh.split("\n");
  const at = a.findIndex((line, i) => line !== b[i]);
  problems.push(
    `${path.relative(process.cwd(), META_PATH)} is stale — first difference at line ${at + 1}:\n` +
      `      on disk:   ${JSON.stringify(a[at] ?? "<end of file>")}\n` +
      `      generated: ${JSON.stringify(b[at] ?? "<end of file>")}\n` +
      `    run \`npm run scenarios:meta\``,
  );
}

// 2. The meta lists the registry's scenarios, in the registry's order,
//    and each row agrees with its body on the fields the desk reads.
const registryIds = SCENARIOS.map((s) => s.id);
const metaIds = SCENARIO_META.map((s) => s.id);
if (registryIds.join(",") !== metaIds.join(",")) {
  problems.push(`meta ids [${metaIds.join(", ")}] do not match the registry [${registryIds.join(", ")}]`);
}
for (const sc of SCENARIOS) {
  const m = scenarioMeta(sc.id);
  if (!m) continue;
  const fields: [string, unknown, unknown][] = [
    ["title", m.title, sc.title],
    ["type", m.type, sc.type],
    ["patch", m.patch, sc.patch],
    ["severity", m.severity, sc.severity],
    ["location", m.location, sc.location],
    ["pda", m.pda, sc.pda],
  ];
  for (const [name, got, want] of fields) {
    if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${sc.id} ${sc.title}: meta.${name} differs from the module`);
  }
}

// 3. Every scenario has a loader, no loader points at a stranger, and
//    each resolves to the same scenario the registry holds.
const loaderIds = Object.keys(SCENARIO_LOADERS);
for (const id of registryIds) if (!SCENARIO_LOADERS[id]) problems.push(`scenario ${id} has no loader in scenarios/load.ts`);
for (const id of loaderIds) if (!registryIds.includes(id)) problems.push(`loader "${id}" has no scenario in scenarios/index.ts`);

(async () => {
  for (const sc of SCENARIOS) {
    if (!SCENARIO_LOADERS[sc.id]) continue;
    try {
      const loaded = await loadScenario(sc.id);
      if (loaded !== sc) problems.push(`loader "${sc.id}" resolved to ${loaded?.id ?? "nothing"} (${loaded?.title ?? "-"}), not ${sc.title}`);
    } catch (err) {
      problems.push(`loader "${sc.id}" failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  try {
    await loadScenario("not-a-scenario");
    problems.push('loadScenario("not-a-scenario") resolved; it must reject');
  } catch {
    // expected
  }

  const metaBytes = Buffer.byteLength(onDisk);
  console.log(`Checked ${SCENARIOS.length} scenarios against meta.ts (${(metaBytes / 1024).toFixed(0)} KB) and ${loaderIds.length} loaders.`);
  for (const p of problems) console.log(`    ${p}`);
  console.log(`\n${problems.length} problem(s).`);
  process.exit(problems.length ? 1 : 0);
})();
