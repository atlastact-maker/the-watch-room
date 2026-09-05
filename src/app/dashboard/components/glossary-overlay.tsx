"use client";

import { useEffect, useState } from "react";
import type { StationWithAppliances } from "../page";
import { ResourceDirectory } from "./resource-directory";

/**
 * Glossary / training-mode overlay.
 *
 * Opens on `?` keypress or via the help button in the header. Lists the
 * UK codes, acronyms, and procedural frameworks the sim expects operators
 * to know — Status codes, METHANE, JESIP, callsign conventions,
 * tactical modes. Closes on Esc or any click outside the panel.
 */

type Section = {
  title: string;
  entries: { term: string; def: string }[];
};

const GLOSSARY: Section[] = [
  {
    title: "Mobilising status codes",
    entries: [
      { term: "Status 1", def: "Mobile to incident — appliance is responding" },
      { term: "Status 2", def: "In attendance — arrived on scene" },
      { term: "Status 3", def: "Stop message — incident resolved, no further resources needed" },
      { term: "Status 4", def: "Returning to station (post-incident)" },
      { term: "Status 5", def: "At hospital (ambulance) — offloading patient" },
      { term: "Status 6", def: "Mobile and available — available for re-tasking" },
      { term: "Status 7", def: "Available at station — the default 'on the run' state" },
      { term: "Status 8", def: "Off the run — unavailable (maintenance, welfare, training)" },
    ],
  },
  {
    title: "METHANE (major incident SITREP)",
    entries: [
      { term: "M", def: "Major incident declared (or standby)" },
      { term: "E", def: "Exact location (what3words / grid / postcode)" },
      { term: "T", def: "Type of incident (RTC / fire / HAZMAT / MCI …)" },
      { term: "H", def: "Hazards — present and potential" },
      { term: "A", def: "Access — best approach, RVP, cordons" },
      { term: "N", def: "Number / type of casualties" },
      { term: "E", def: "Emergency services present / required" },
    ],
  },
  {
    title: "JESIP command levels",
    entries: [
      { term: "Bronze (operational)", def: "Front-line commanders on scene — Sector Commanders, IC" },
      { term: "Silver (tactical)", def: "Co-ordinates resources on-scene — the Forward Control Point" },
      { term: "Gold (strategic)", def: "Sets strategic direction — usually off-scene at a Gold Command Cell" },
    ],
  },
  {
    title: "Tactical mode (fire)",
    entries: [
      { term: "Offensive", def: "Crews committed to the risk area — interior attack allowed" },
      { term: "Defensive", def: "No crews in the risk area — exterior attack only, protect exposures" },
      { term: "Transitional", def: "Switching between offensive and defensive as conditions change" },
    ],
  },
  {
    title: "Callsigns (UK services)",
    entries: [
      { term: "G50-P1", def: "GMFRS — station G50, Pump 1 (first-out water ladder)" },
      { term: "G50-P2", def: "GMFRS — second pump at G50" },
      { term: "A3", def: "GMFRS — aerial ladder platform at the station (A-category)" },
      { term: "R2 / R4", def: "Technical Rescue Pump / Van" },
      { term: "A-547", def: "NWAS DCA (Double-Crewed Ambulance) service-wide unit number" },
      { term: "RX-XXX", def: "NWAS Rapid Response Vehicle" },
      { term: "QR-XXX", def: "NWAS Advanced Paramedic (Quick Response)" },
      { term: "Z301", def: "NWAS HART (Hazardous Area Response Team) vehicle" },
      { term: "HELIMED 72", def: "North West Air Ambulance (NWAA) HEMS airframe" },
      { term: "MP[area]-XX", def: "GMP division response vehicle (MP + division stub + unit)" },
      { term: "AR-XX", def: "GMP Armed Response Vehicle" },
      { term: "NPAS 21", def: "National Police Air Service — NW helicopter, out of Barton" },
    ],
  },
  {
    title: "Clinical scope (NWAS)",
    entries: [
      { term: "DCA", def: "Paramedic + EMT — baseline UK ambulance scope" },
      { term: "QR (AP)", def: "Advanced Paramedic — extended formulary (Ketamine, Fentanyl, Amiodarone)" },
      { term: "CCC", def: "Critical Care Car — doctor-paramedic team, blood products, finger thoracostomy, PHEA" },
      { term: "BASICS", def: "Volunteer immediate-care doctor from NWPCCC, the one BASICS-affiliated scheme whose area reaches GM. Warrington-based; alerted by text through the NWAS Complex Incident Hub, not dispatched. Response into Greater Manchester is not guaranteed and often unavailable" },
      { term: "HEMS", def: "Helicopter-borne doctor team — PHEA, surgical airway, direct to MTC" },
    ],
  },
  {
    title: "Procedural / tactical terms",
    entries: [
      { term: "PDA", def: "Pre-determined Attendance — the scenario's required resources" },
      { term: "IC", def: "Incident Commander — senior officer running the scene" },
      { term: "RVP", def: "Rendezvous Point — where arriving crews book in" },
      { term: "FCP", def: "Forward Control Point — Silver's on-scene control vehicle" },
      { term: "PRI", def: "Pre-Risk Information — building-specific hazard record" },
      { term: "BA", def: "Breathing Apparatus — open-circuit SCBA for firefighters" },
      { term: "TOW", def: "Time Of Whistle — when a BA wearer must be withdrawn" },
      { term: "MTC", def: "Major Trauma Centre — Salford Royal for the NW" },
      { term: "HASU", def: "Hyperacute Stroke Unit" },
      { term: "ATMIST", def: "Pre-alert handover format — Age Time Mechanism Injuries Signs Treatment" },
      { term: "POLSA", def: "Police Search Advisor — specialist search team" },
      { term: "SIO", def: "Senior Investigating Officer — DCI-level; takes scene preservation" },
      { term: "JESIP", def: "Joint Emergency Services Interoperability Principles" },
    ],
  },
];

export function GlossaryOverlay({
  open,
  onClose,
  stations,
}: {
  open: boolean;
  onClose: () => void;
  /** Fleet for the Resources tab — omit to hide the tab. */
  stations?: StationWithAppliances[];
}) {
  // The panel mounts fresh each time the overlay opens, so filter and
  // tab state reset naturally — no reset-in-effect needed.
  if (!open) return null;
  return <GlossaryPanel onClose={onClose} stations={stations} />;
}

function GlossaryPanel({
  onClose,
  stations,
}: {
  onClose: () => void;
  stations?: StationWithAppliances[];
}) {
  const [filter, setFilter] = useState("");
  const [view, setView] = useState<"glossary" | "resources">("glossary");

  // Esc to close — only mounted while the overlay is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const lowered = filter.trim().toLowerCase();
  const sections = lowered
    ? GLOSSARY.map((s) => ({
        ...s,
        entries: s.entries.filter(
          (e) =>
            e.term.toLowerCase().includes(lowered) ||
            e.def.toLowerCase().includes(lowered),
        ),
      })).filter((s) => s.entries.length > 0)
    : GLOSSARY;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Glossary and quick reference"
      className="fixed inset-0 z-[3000] flex items-start justify-center overflow-y-auto bg-(--color-bg)/95 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={"my-8 w-full px-6 py-6 " + (view === "resources" ? "max-w-5xl" : "max-w-3xl")}>
        <header className="rounded-sm border border-(--color-amber)/60 bg-(--color-surface) p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
                Quick reference
              </div>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-(--color-text)">
                Glossary &amp; training mode
              </h1>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-(--color-text-muted)">
                UK codes, acronyms, and procedural frameworks used throughout
                the sim. Press{" "}
                <kbd className="rounded border border-(--color-border) bg-(--color-bg) px-1 text-[10px]">?</kbd>
                {" "}to toggle this at any time, or{" "}
                <kbd className="rounded border border-(--color-border) bg-(--color-bg) px-1 text-[10px]">Esc</kbd>
                {" "}to close.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-(--color-border) px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim) hover:border-(--color-critical) hover:text-(--color-critical)"
              aria-label="Close glossary"
            >
              ✕
            </button>
          </div>
          <label className="mt-3 flex items-center gap-2 rounded-sm border border-(--color-border) bg-(--color-bg) px-2 py-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
              Filter
            </span>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="e.g. STEMI, RVP, Status 4, HEMS"
              className="w-full bg-transparent font-mono text-[12px] text-(--color-text) outline-none placeholder:text-(--color-text-dim)"
              autoFocus
            />
          </label>
          {stations && stations.length > 0 && (
            <div className="mt-3 flex gap-2">
              {(
                [
                  { key: "glossary", label: "Glossary" },
                  { key: "resources", label: "Resource directory" },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setView(t.key)}
                  className={
                    "rounded-sm border px-3 py-1 font-mono text-[11px] uppercase tracking-widest transition-colors " +
                    (view === t.key
                      ? "border-(--color-amber) bg-(--color-amber)/10 text-(--color-amber)"
                      : "border-(--color-border) text-(--color-text-dim) hover:border-(--color-amber-dim) hover:text-(--color-text)")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </header>

        {view === "resources" && stations && (
          <ResourceDirectory stations={stations} filter={filter} />
        )}
        {view === "glossary" && (
        <>

        {sections.length === 0 ? (
          <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
            No matches for &quot;{filter}&quot;
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {sections.map((s) => (
              <section
                key={s.title}
                className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface) p-3"
              >
                <h2 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
                  {s.title}
                </h2>
                <dl className="space-y-1.5">
                  {s.entries.map((e, i) => (
                    <div
                      key={`${e.term}-${i}`}
                      className="grid grid-cols-[6.5rem_1fr] items-baseline gap-2 border-b border-(--color-border-subtle)/50 pb-1 last:border-b-0"
                    >
                      <dt className="font-mono text-[11px] text-(--color-text)">
                        {e.term}
                      </dt>
                      <dd className="text-[12px] leading-snug text-(--color-text-muted)">
                        {e.def}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
