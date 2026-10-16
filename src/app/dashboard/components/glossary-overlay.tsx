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

export type GlossarySection = {
  title: string;
  entries: { term: string; def: string }[];
};

export const GLOSSARY: GlossarySection[] = [
  {
    title: "Keyboard and screen reader",
    entries: [
      { term: "F2 · F3 · F4 · F5 · F6", def: "Dispatch, Calls, Mobilising, Ground, Resources" },
      { term: "F9", def: "Open the MDT on the incident ground; show or hide it once open" },
      { term: "?", def: "This reference. Esc closes it" },
      { term: "Enter or A · Esc or D", def: "Incoming call: answer, or decline" },
      { term: "Tab · Shift+Tab", def: "Move between controls. Every control is reachable and the focused one is outlined; hold on a control for its explanation" },
      { term: "Esc", def: "Close the open menu or dialog" },
      { term: "Alerts", def: "Events (a new call, a unit on scene, a patient change) are shown as cards, read to a screen reader and sounded. Each channel is switched in Help → Alerts and in Settings" },
    ],
  },
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
    title: "Opening codes",
    entries: [
      { term: "Opening code", def: "What the call handler keys the job as when it is created. Every downstream system files the job under it, so the debrief flags one that does not fit the nature given" },
      { term: "NICL", def: "National Incident Category List — the police opening categories from the National Standard for Incident Recording (NSIR). Five headings: Crime, Anti-social behaviour, Public safety and welfare, Transport, Administration. The desk's codes (C01, P05, T02…) sit under those headings" },
      { term: "NSIR", def: "National Standard for Incident Recording — the Home Office standard every police incident is opened and closed against; NICL is its category list" },
      { term: "IRS", def: "Incident Recording System — the fire service's national incident headings: primary fire, secondary fire, chimney fire, false alarm (AFA, good intent, malicious) and special service (RTC, effecting entry, lift release, flooding, water rescue, hazmat…)" },
      { term: "AMPDS", def: "Advanced Medical Priority Dispatch System — the ambulance triage protocol; a call opens on a chief-complaint card (9 cardiac arrest, 10 chest pain, 17 falls, 29 traffic incident…) and the card drives the ARP category" },
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
      { term: "CHB", def: "Complete (third-degree) heart block — atria and ventricles beating independently; a slow escape rhythm, high risk of asystole; pace" },
      { term: "Mobitz II", def: "Second-degree heart block with a fixed PR and dropped beats — can become complete block without warning; pads on, pace" },
      { term: "SVT", def: "Supraventricular tachycardia — regular, narrow, fast, no P waves. Vagal manoeuvres, then adenosine; a synchronised shock if there are adverse features" },
      { term: "VT with a pulse", def: "Broad regular tachycardia with output. Amiodarone if stable, synchronised cardioversion if not; pads on, because it can go to VF" },
      { term: "Cardioversion", def: "A synchronised shock timed to the R wave, for a tachycardia with adverse features. Sedate first" },
      { term: "TCP", def: "Transcutaneous pacing — pads on the chest, 70/min, current up until every spike captures. Painful; sedate" },
      { term: "No-flow time", def: "Time in an arrest with nobody on the chest — no compressions, so the ALS clock stops and the brain gets nothing. Every second of it costs the patient" },
      { term: "LUCAS", def: "Mechanical chest compression device — holds depth and rate indefinitely, frees a rescuer and keeps CPR going on the move. Carried by advanced paramedic, critical care and HART vehicles, not a standard DCA" },
      { term: "ROLE", def: "Recognition of life extinct — resuscitation ended after the criteria: 20 min of ALS, asystole, no shock, causes considered, end-tidal flat" },
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
      className="vec-scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="glossary-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`vec-dialog${view === "resources" ? " wide" : ""}`}>
        <div className="vec-dialog-bar">
          <span id="glossary-title">Reference · Glossary and training mode</span>
          <span className="spacer" />
          <span className="meta">? toggles · Esc closes</span>
          <button type="button" className="vec-dialog-x" onClick={onClose} aria-label="Close glossary">✕</button>
        </div>
        <div className="vec-dialog-body">
          <div className="vec-gl-filter">
            <label className="lbl" htmlFor="glossary-filter">Filter</label>
            <input
              id="glossary-filter"
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="e.g. STEMI, RVP, Status 4, HEMS"
              autoFocus
            />
            {stations && stations.length > 0 && (
              <div className="tabs">
                {(
                  [
                    { key: "glossary", label: "Glossary" },
                    { key: "resources", label: "Resource directory" },
                  ] as const
                ).map((t) => (
                  <button key={t.key} type="button" className="vec-btn mini" aria-pressed={view === t.key} onClick={() => setView(t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="lead">UK codes, acronyms and procedural frameworks used throughout the desk. Hold on any control for its explanation; the keyboard section lists every shortcut.</p>

          {view === "resources" && stations && <ResourceDirectory stations={stations} filter={filter} />}
          {view === "glossary" &&
            (sections.length === 0 ? (
              <p className="vec-tile-empty">No matches for &quot;{filter}&quot;</p>
            ) : (
              <div className="vec-gl-grid">
                {sections.map((s) => (
                  <section key={s.title} className="vec-gl-sect" aria-label={s.title}>
                    <h2>{s.title}</h2>
                    <dl>
                      {s.entries.map((e, i) => (
                        <div key={`${e.term}-${i}`}>
                          <dt>{e.term}</dt>
                          <dd>{e.def}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
