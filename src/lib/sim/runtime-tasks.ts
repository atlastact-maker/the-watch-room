import {
  BA_BAR_PER_MINUTE,
  ENTRY_TABLE,
  HOSE_FLOW_LPM,
  INTERIOR_BA_DEFAULT_FLOW_LPM,
  doorTypeForScenario,
  rootWaterSource,
  type Incident,
  type Task,
} from "./incident_types";
import { baDurationMultiplier } from "./weather";

type TaskRuntime = { tasks: Task[]; outcome: unknown; handover: unknown };

/** The county keeps working regardless of which incident is on screen.
 * Delegated jobs use their commander's model; closed jobs are frozen. */
export function liveTasks(runtimes: Record<string, TaskRuntime>): Task[] {
  return Object.values(runtimes)
    .filter((rt) => !rt.outcome && !rt.handover)
    .flatMap((rt) => rt.tasks);
}

export function mapLiveTasks<T extends TaskRuntime>(
  runtimes: Record<string, T>,
  map: (task: Task, incidentId: string, tasks: Task[]) => Task,
): Record<string, T> {
  let changed = false;
  const next = { ...runtimes };
  for (const [id, rt] of Object.entries(runtimes)) {
    if (rt.outcome || rt.handover) continue;
    const tasks = rt.tasks.map((t) => map(t, id, rt.tasks));
    if (tasks.some((t, i) => t !== rt.tasks[i])) {
      next[id] = { ...rt, tasks };
      changed = true;
    }
  }
  return changed ? next : runtimes;
}

function hashPct(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 100;
}

export function dueTasks(
  runtimes: Record<string, TaskRuntime>,
  incidents: Incident[],
  now: number,
) {
  return incidents.flatMap((incident) => {
    const rt = runtimes[incident.id];
    if (!rt || rt.outcome || rt.handover) return [];
    const doorType = doorTypeForScenario(incident.scenario);
    return rt.tasks
      .filter((t) => t.state === "active" && t.completesAt !== undefined && now >= t.completesAt)
      .map((task) => ({
        task,
        incidentId: incident.id,
        doorType,
        failed: task.kind === "gain_entry" && !!task.entryTool &&
          hashPct(task.id) >= ENTRY_TABLE[task.entryTool][doorType].pct,
      }));
  });
}

/** Account only for the portion of a tick during which this task ran. */
export function taskTickSeconds(task: Task, from: number, to: number): number {
  if (task.state !== "active") return 0;
  return Math.max(0, (Math.min(to, task.completesAt ?? to) - Math.max(from, task.startedAt)) / 1000);
}

export function baConsumption(task: Task, from: number, to: number, tempC: number) {
  const minutes = taskTickSeconds(task, from, to) / 60 / baDurationMultiplier(tempC);
  return { pct: 3 * minutes, bar: BA_BAR_PER_MINUTE * minutes };
}

export function waterUseByTank(
  runtimes: Record<string, TaskRuntime>,
  from: number,
  to: number,
): Map<string, number> {
  const litres = new Map<string, number>();
  for (const rt of Object.values(runtimes)) {
    if (rt.outcome || rt.handover) continue;
    for (const t of rt.tasks) {
      const flow = t.kind === "hose_attack" ? HOSE_FLOW_LPM[t.hoseType ?? "70mm"]
        : t.kind === "ba_sar" && t.baMode === "firefighting" ? INTERIOR_BA_DEFAULT_FLOW_LPM : 0;
      const seconds = taskTickSeconds(t, from, to);
      if (!flow || !seconds) continue;
      const root = rootWaterSource(t.applianceId, rt.tasks);
      if (root.type !== "tank") continue;
      litres.set(root.applianceId, (litres.get(root.applianceId) ?? 0) + flow * seconds / 60);
    }
  }
  return litres;
}
