// The console's health on one line, the way a CAD's status bar states it.

import { LATEST } from "@/lib/changelog";
import type { SystemsStatus } from "./menu-types";
import styles from "./watch-menu.module.css";

type Tone = "ok" | "amber" | "stop" | "dim";

export function SystemsStrip({ systems }: { systems: SystemsStatus }) {
  const items: { label: string; value: string; tone: Tone; title?: string }[] = [
    { label: "Build", value: LATEST.version, tone: "ok" },
    systems.routing === "own"
      ? { label: "Routing", value: "Own router online", tone: "ok", title: systems.routingHost }
      : systems.routing === "degraded"
        ? { label: "Routing", value: "Own router not answering · public fallback", tone: "amber", title: systems.routingHost }
        : { label: "Routing", value: "Public services", tone: "dim" },
    systems.mapData === "loaded"
      ? { label: "Map data", value: `Loaded · ${systems.mapKinds.join(", ") || "roads"}`, tone: "ok" }
      : systems.mapData === "empty"
        ? { label: "Map data", value: "Tables empty · public mirrors", tone: "amber" }
        : { label: "Map data", value: "Public mirrors", tone: "dim" },
    systems.account ? { label: "Account service", value: "Connected", tone: "ok" } : { label: "Account service", value: "Not configured", tone: "amber" },
    systems.doorsOpen === null
      ? { label: "Programme", value: systems.released === null ? "Status unavailable" : `${systems.released} scenarios released`, tone: "dim" }
      : { label: "Programme", value: `Doors ${systems.doorsOpen ? "open" : "closed"}${systems.released !== null ? ` · ${systems.released} scenarios released` : ""}`, tone: systems.doorsOpen ? "ok" : "amber" },
  ];
  const toneClass: Record<Tone, string> = { ok: styles.ok, amber: styles.amber, stop: styles.stop, dim: "" };
  return (
    <ul className={styles.systems} aria-label="Systems status">
      {items.map((it) => (
        <li key={it.label} className={toneClass[it.tone]} title={it.title}>
          <i aria-hidden="true" />
          <b>{it.label}</b>
          <span>{it.value}</span>
        </li>
      ))}
    </ul>
  );
}
