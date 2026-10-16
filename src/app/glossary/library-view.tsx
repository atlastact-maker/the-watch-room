"use client";

// The reference library: the glossary the desk's ? key opens, and the
// resource directory built from the same station data the sim runs on,
// as a page of the console rather than an overlay.

import { useMemo, useState } from "react";
import { GLOSSARY } from "@/app/dashboard/components/glossary-overlay";
import type { StationWithAppliances } from "@/app/dashboard/page";
import styles from "@/app/menu/watch-menu.module.css";
import { FleetDirectory } from "./fleet-directory";

type Tab = "glossary" | "resources";

export function LibraryView({ stations }: { stations: StationWithAppliances[] }) {
  const [tab, setTab] = useState<Tab>("glossary");
  const [filter, setFilter] = useState("");
  const q = filter.trim().toLowerCase();
  const sections = useMemo(
    () => (q ? GLOSSARY.map((s) => ({ ...s, entries: s.entries.filter((e) => e.term.toLowerCase().includes(q) || e.def.toLowerCase().includes(q)) })).filter((s) => s.entries.length > 0) : GLOSSARY),
    [q],
  );
  const terms = GLOSSARY.reduce((n, s) => n + s.entries.length, 0);
  const realStations = stations.filter((s) => !s.virtual).length;

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Reference library · Greater Manchester</p>
          <h1 className={styles.pageTitle}>Reference library</h1>
          <p className={styles.lede}>Status codes, opening codes, command structure, callsign conventions and clinical scope as used on the desk, and the resource directory: every appliance type in the modelled fleet with its callsigns, crewing and inventory.</p>
        </div>
        <div className={styles.headMeta}>
          <span className={styles.chip}>{terms} terms</span>
          <span className={styles.chip}>{realStations} stations</span>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="Reference library sections">
          <button type="button" role="tab" aria-selected={tab === "glossary"} onClick={() => setTab("glossary")}>Glossary</button>
          <button type="button" role="tab" aria-selected={tab === "resources"} onClick={() => setTab("resources")}>Resource directory</button>
        </div>
        <label className={styles.search}>
          <span>Filter</span>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={tab === "glossary" ? "Term or definition, e.g. Status 4, RVP, HEMS" : "Type, callsign or equipment, e.g. pump, DCA, cutters"} aria-label="Filter the reference library" />
        </label>
      </div>

      {tab === "resources" ? (
        <FleetDirectory stations={stations} filter={q} />
      ) : sections.length === 0 ? (
        <section className={`${styles.panel} ${styles.empty}`}>
          <p className={styles.eyebrow}>No matches</p>
          <strong>No terms match &ldquo;{filter.trim()}&rdquo;.</strong>
          <p>Try a code, an acronym or a word from the definition.</p>
        </section>
      ) : (
        <div className={styles.refGrid}>
          {sections.map((s) => (
            <section key={s.title} className={styles.panel}>
              <p className={styles.eyebrow}>{s.title}</p>
              <dl className={styles.refList}>
                {s.entries.map((e, i) => <div key={`${e.term}-${i}`}><dt>{e.term}</dt><dd>{e.def}</dd></div>)}
              </dl>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
